/**
 * 问卷2派生表生成服务
 * 从宽表中按维度聚合生成派生分析表
 * 支持单维度统计与交叉切片分析
 */

import { WideTableRow } from './questionnaire2WideTableService';

/**
 * 维度统计结果
 */
export interface DimensionStats {
  dimension: string;
  total_count: number;
  distribution: Array<{
    value: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * 交叉切片统计结果
 */
export interface CrossSliceStats {
  dimensions: string[];
  total_count: number;
  slices: Array<{
    dimension_values: Record<string, string>;
    count: number;
    percentage: number;
    metrics?: Record<string, any>; // 附加指标
  }>;
}

/**
 * 问卷2派生表生成服务类
 */
export class Questionnaire2DerivedTableService {
  /**
   * 按单维度统计分布
   */
  calculateDimensionStats(
    rows: WideTableRow[],
    dimensionField: keyof WideTableRow
  ): DimensionStats {
    const total = rows.length;
    const countMap = new Map<string, number>();

    for (const row of rows) {
      const value = row[dimensionField];
      if (value === undefined || value === null) continue;

      // 处理JSON数组（复选题）
      if (this.isJsonArray(value)) {
        const values = JSON.parse(value as string);
        for (const v of values) {
          countMap.set(v, (countMap.get(v) || 0) + 1);
        }
      } else {
        const strValue = String(value);
        countMap.set(strValue, (countMap.get(strValue) || 0) + 1);
      }
    }

    const distribution = Array.from(countMap.entries())
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      dimension: String(dimensionField),
      total_count: total,
      distribution,
    };
  }

  /**
   * 按性别统计失业率
   */
  calculateUnemploymentByGender(rows: WideTableRow[]): CrossSliceStats {
    const genderGroups = this.groupBy(rows, 'gender_v2');
    const slices: CrossSliceStats['slices'] = [];

    for (const [gender, genderRows] of genderGroups.entries()) {
      const unemployedCount = genderRows.filter(
        row => row.current_status_question_v2 === 'unemployed-seeking'
      ).length;
      const total = genderRows.length;

      slices.push({
        dimension_values: { gender: gender },
        count: total,
        percentage: (total / rows.length) * 100,
        metrics: {
          unemployed_count: unemployedCount,
          unemployment_rate: total > 0 ? (unemployedCount / total) * 100 : 0,
        },
      });
    }

    return {
      dimensions: ['gender'],
      total_count: rows.length,
      slices,
    };
  }

  /**
   * 按性别统计歧视类型分布
   */
  calculateDiscriminationByGender(rows: WideTableRow[]): CrossSliceStats {
    const genderGroups = this.groupBy(rows, 'gender_v2');
    const slices: CrossSliceStats['slices'] = [];

    for (const [gender, genderRows] of genderGroups.entries()) {
      const discriminationStats = this.calculateDimensionStats(
        genderRows,
        'experienced_discrimination_types_v2'
      );

      slices.push({
        dimension_values: { gender: gender },
        count: genderRows.length,
        percentage: (genderRows.length / rows.length) * 100,
        metrics: {
          discrimination_distribution: discriminationStats.distribution,
        },
      });
    }

    return {
      dimensions: ['gender', 'discrimination_types'],
      total_count: rows.length,
      slices,
    };
  }

  /**
   * 按年龄段统计歧视频率
   */
  calculateDiscriminationFrequencyByAge(rows: WideTableRow[]): CrossSliceStats {
    const ageGroups = this.groupBy(rows, 'age_range_v2');
    const slices: CrossSliceStats['slices'] = [];

    for (const [age, ageRows] of ageGroups.entries()) {
      // 仅统计35+年龄段的歧视频率（因为有专门的问题）
      const frequencyStats = this.calculateDimensionStats(
        ageRows,
        'age_discrimination_frequency_v2'
      );

      slices.push({
        dimension_values: { age_range: age },
        count: ageRows.length,
        percentage: (ageRows.length / rows.length) * 100,
        metrics: {
          frequency_distribution: frequencyStats.distribution,
        },
      });
    }

    return {
      dimensions: ['age_range', 'discrimination_frequency'],
      total_count: rows.length,
      slices,
    };
  }

  /**
   * 按地域统计薪资分布
   */
  calculateSalaryByCityTier(rows: WideTableRow[]): CrossSliceStats {
    const cityGroups = this.groupBy(rows, 'current_city_tier_v2');
    const slices: CrossSliceStats['slices'] = [];

    for (const [city, cityRows] of cityGroups.entries()) {
      const salaryStats = this.calculateDimensionStats(cityRows, 'current_salary_v2');

      slices.push({
        dimension_values: { city_tier: city },
        count: cityRows.length,
        percentage: (cityRows.length / rows.length) * 100,
        metrics: {
          salary_distribution: salaryStats.distribution,
        },
      });
    }

    return {
      dimensions: ['city_tier', 'salary'],
      total_count: rows.length,
      slices,
    };
  }

  /**
   * 按婚育状况统计求职周期
   */
  calculateJobSeekingDurationByMaritalStatus(rows: WideTableRow[]): CrossSliceStats {
    const maritalGroups = this.groupBy(rows, 'marital_status_v2');
    const slices: CrossSliceStats['slices'] = [];

    for (const [marital, maritalRows] of maritalGroups.entries()) {
      const durationStats = this.calculateDimensionStats(
        maritalRows,
        'job_seeking_duration_v2'
      );

      slices.push({
        dimension_values: { marital_status: marital },
        count: maritalRows.length,
        percentage: (maritalRows.length / rows.length) * 100,
        metrics: {
          duration_distribution: durationStats.distribution,
        },
      });
    }

    return {
      dimensions: ['marital_status', 'job_seeking_duration'],
      total_count: rows.length,
      slices,
    };
  }

  /**
   * 按渠道统计有效性（Offer数量）
   */
  calculateChannelEffectiveness(rows: WideTableRow[]): DimensionStats {
    // 展开所有使用的渠道
    const channelOfferMap = new Map<string, { total: number; offers: number[] }>();

    for (const row of rows) {
      const channelsValue = row.channels_used_v2;
      const offerValue = row.offer_received_v2;

      if (!channelsValue || !offerValue) continue;

      const channels = this.isJsonArray(channelsValue)
        ? JSON.parse(channelsValue as string)
        : [channelsValue];
      const offerCount = this.parseOfferCount(offerValue as string);

      for (const channel of channels) {
        if (!channelOfferMap.has(channel)) {
          channelOfferMap.set(channel, { total: 0, offers: [] });
        }
        const stats = channelOfferMap.get(channel)!;
        stats.total += 1;
        stats.offers.push(offerCount);
      }
    }

    const distribution = Array.from(channelOfferMap.entries())
      .map(([channel, stats]) => {
        const avgOffers = stats.offers.reduce((a, b) => a + b, 0) / stats.total;
        return {
          value: channel,
          count: stats.total,
          percentage: (stats.total / rows.length) * 100,
          avg_offers: avgOffers,
        };
      })
      .sort((a, b) => b.avg_offers - a.avg_offers);

    return {
      dimension: 'channel_effectiveness',
      total_count: rows.length,
      distribution: distribution as any,
    };
  }

  /**
   * 多维度切片（通用方法）
   */
  calculateMultiDimensionSlice(
    rows: WideTableRow[],
    dimensions: Array<keyof WideTableRow>,
    metricField?: keyof WideTableRow
  ): CrossSliceStats {
    const sliceMap = new Map<string, { rows: WideTableRow[]; key: Record<string, string> }>();

    for (const row of rows) {
      const key: Record<string, string> = {};
      let keyStr = '';

      for (const dim of dimensions) {
        const value = row[dim];
        if (value === undefined || value === null) continue;
        key[String(dim)] = String(value);
        keyStr += `${dim}:${value}|`;
      }

      if (!sliceMap.has(keyStr)) {
        sliceMap.set(keyStr, { rows: [], key });
      }
      sliceMap.get(keyStr)!.rows.push(row);
    }

    const slices = Array.from(sliceMap.values()).map(({ rows: sliceRows, key }) => {
      const metrics: Record<string, any> = {};

      if (metricField) {
        const metricStats = this.calculateDimensionStats(sliceRows, metricField);
        metrics.metric_distribution = metricStats.distribution;
      }

      return {
        dimension_values: key,
        count: sliceRows.length,
        percentage: (sliceRows.length / rows.length) * 100,
        metrics,
      };
    });

    return {
      dimensions: dimensions.map(String),
      total_count: rows.length,
      slices,
    };
  }

  // ========== 辅助方法 ==========

  private groupBy(rows: WideTableRow[], field: keyof WideTableRow): Map<string, WideTableRow[]> {
    const groups = new Map<string, WideTableRow[]>();

    for (const row of rows) {
      const value = row[field];
      if (value === undefined || value === null) continue;

      const key = String(value);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    return groups;
  }

  private isJsonArray(value: any): boolean {
    if (typeof value !== 'string') return false;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  private parseOfferCount(value: string): number {
    // 解析 Offer 数量（如 "0个" → 0, "5个以上" → 5）
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

// 导出单例
export const questionnaire2DerivedTableService = new Questionnaire2DerivedTableService();

