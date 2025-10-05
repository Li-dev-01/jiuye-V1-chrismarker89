/**
 * 问卷2数据服务
 * 从API读取1000条测试数据并生成统计
 */

import { API_CONFIG } from '../config/apiConfig';

// 数据统计接口
export interface DimensionStatistics {
  dimension: string;
  data: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

export interface Questionnaire2Statistics {
  totalResponses: number;
  lastUpdated: string;
  demographics: {
    gender: DimensionStatistics;
    ageRange: DimensionStatistics;
    educationLevel: DimensionStatistics;
    maritalStatus: DimensionStatistics;
    cityTier: DimensionStatistics;
    hukouType: DimensionStatistics;
    employmentStatus: DimensionStatistics;
  };
  economic: {
    debtSituation: DimensionStatistics;
    monthlyLivingCost: DimensionStatistics;
    incomeSources: DimensionStatistics;
    parentalSupport: DimensionStatistics;
    incomeExpenseBalance: DimensionStatistics;
    economicPressure: DimensionStatistics;
  };
  employment: {
    currentStatus: DimensionStatistics;
    salary: DimensionStatistics;
  };
  discrimination: {
    types: DimensionStatistics;
    severity: DimensionStatistics;
    channels: DimensionStatistics;
  };
  confidence: {
    level: DimensionStatistics;
    factors: DimensionStatistics;
  };
  fertility: {
    intent: DimensionStatistics;
  };
}

class Questionnaire2DataService {
  private baseUrl = API_CONFIG.BASE_URL;
  private cache: Questionnaire2Statistics | null = null;
  private cacheTime: number = 0;
  private cacheTTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取问卷2统计数据
   */
  async getStatistics(): Promise<Questionnaire2Statistics> {
    // 检查缓存
    if (this.cache && Date.now() - this.cacheTime < this.cacheTTL) {
      console.log('📦 使用缓存数据');
      return this.cache;
    }

    try {
      console.log('🔍 从API加载问卷2数据...');

      // 调用API获取原始数据
      const response = await fetch(
        `${this.baseUrl}/api/universal-questionnaire/questionnaires/questionnaire-v2-2024/statistics`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API数据加载成功:', data);

      // 处理数据并生成统计
      const statistics = this.processRawData(data);

      // 更新缓存
      this.cache = statistics;
      this.cacheTime = Date.now();

      return statistics;
    } catch (error: any) {
      console.error('❌ 数据加载失败:', error);

      // 如果有缓存，返回缓存
      if (this.cache) {
        console.log('⚠️ 使用过期缓存数据');
        return this.cache;
      }

      // 线上环境禁用模拟数据，直接抛出错误
      throw new Error('无法加载问卷2统计数据，请检查API连接');
    }
  }

  /**
   * 处理原始数据生成统计
   */
  private processRawData(apiData: any): Questionnaire2Statistics {
    const responses = apiData.responses || [];
    const totalResponses = responses.length;

    console.log(`📊 处理 ${totalResponses} 条响应数据...`);

    // 初始化统计对象
    const stats: Record<string, Record<string, number>> = {};

    // 遍历所有响应
    for (const response of responses) {
      try {
        const data = JSON.parse(response.response_data || '{}');
        const sectionResponses = data.sectionResponses || [];

        // 提取各个section的数据
        for (const section of sectionResponses) {
          for (const questionResponse of section.responses || []) {
            const questionId = questionResponse.questionId;
            const value = questionResponse.value;

            // 初始化统计
            if (!stats[questionId]) {
              stats[questionId] = {};
            }

            // 处理不同类型的值
            if (Array.isArray(value)) {
              // 多选题
              for (const item of value) {
                stats[questionId][item] = (stats[questionId][item] || 0) + 1;
              }
            } else if (value) {
              // 单选题或文本
              stats[questionId][value] = (stats[questionId][value] || 0) + 1;
            }
          }
        }
      } catch (error) {
        console.error('解析响应数据失败:', error);
      }
    }

    // 转换为统计格式
    const convertToStats = (questionId: string, dimension: string): DimensionStatistics => {
      const data = stats[questionId] || {};
      const total = Object.values(data).reduce((sum, count) => sum + count, 0) || 1;

      return {
        dimension,
        data: Object.entries(data).map(([name, value]) => ({
          name,
          value: value as number,
          percentage: parseFloat(((value as number / total) * 100).toFixed(2))
        })).sort((a, b) => b.value - a.value)
      };
    };

    return {
      totalResponses,
      lastUpdated: new Date().toISOString(),
      demographics: {
        gender: convertToStats('gender-v2', '性别'),
        ageRange: convertToStats('age-range-v2', '年龄'),
        educationLevel: convertToStats('education-level-v2', '学历'),
        maritalStatus: convertToStats('marital-status-v2', '婚姻状况'),
        cityTier: convertToStats('current-city-tier-v2', '城市层级'),
        hukouType: convertToStats('hukou-type-v2', '户籍类型'),
        employmentStatus: convertToStats('current-status-question-v2', '就业状态')
      },
      economic: {
        debtSituation: convertToStats('debt-situation-v2', '负债情况'),
        monthlyLivingCost: convertToStats('monthly-living-cost-v2', '每月生活开支'),
        incomeSources: convertToStats('income-sources-v2', '收入来源'),
        parentalSupport: convertToStats('parental-support-amount-v2', '父母支援金额'),
        incomeExpenseBalance: convertToStats('income-expense-balance-v2', '收支平衡'),
        economicPressure: convertToStats('economic-pressure-level-v2', '经济压力')
      },
      employment: {
        currentStatus: convertToStats('current-status-question-v2', '当前状态'),
        salary: convertToStats('current-salary-v2', '月薪')
      },
      discrimination: {
        types: convertToStats('experienced-discrimination-types-v2', '歧视类型'),
        severity: convertToStats('discrimination-severity-v2', '歧视严重程度'),
        channels: convertToStats('discrimination-channels-v2', '歧视渠道')
      },
      confidence: {
        level: convertToStats('employment-confidence-v2', '就业信心'),
        factors: convertToStats('confidence-factors-v2', '信心影响因素')
      },
      fertility: {
        intent: convertToStats('fertility-intent-v2', '生育意愿')
      }
    };
  }

  /**
   * 获取模拟统计数据（仅用于本地开发，线上环境已禁用）
   * @deprecated 线上环境禁用模拟数据
   */
  private getMockStatistics(): Questionnaire2Statistics {
    return {
      totalResponses: 1000,
      lastUpdated: new Date().toISOString(),
      demographics: {
        gender: {
          dimension: '性别',
          data: [
            { name: 'male', value: 520, percentage: 52 },
            { name: 'female', value: 450, percentage: 45 },
            { name: 'other', value: 30, percentage: 3 }
          ]
        },
        ageRange: {
          dimension: '年龄',
          data: [
            { name: '23-25', value: 300, percentage: 30 },
            { name: '26-28', value: 250, percentage: 25 },
            { name: '20-22', value: 200, percentage: 20 },
            { name: '29-35', value: 150, percentage: 15 },
            { name: 'over-35', value: 100, percentage: 10 }
          ]
        },
        educationLevel: {
          dimension: '学历',
          data: [
            { name: 'bachelor', value: 400, percentage: 40 },
            { name: 'master', value: 300, percentage: 30 },
            { name: 'college', value: 200, percentage: 20 },
            { name: 'high-school', value: 100, percentage: 10 }
          ]
        },
        maritalStatus: {
          dimension: '婚姻状况',
          data: [
            { name: 'single', value: 600, percentage: 60 },
            { name: 'married', value: 350, percentage: 35 },
            { name: 'divorced', value: 50, percentage: 5 }
          ]
        },
        cityTier: {
          dimension: '城市层级',
          data: [
            { name: 'tier-1', value: 400, percentage: 40 },
            { name: 'tier-2', value: 300, percentage: 30 },
            { name: 'tier-3', value: 200, percentage: 20 },
            { name: 'tier-4', value: 100, percentage: 10 }
          ]
        },
        hukouType: {
          dimension: '户籍类型',
          data: [
            { name: 'urban', value: 600, percentage: 60 },
            { name: 'rural', value: 400, percentage: 40 }
          ]
        },
        employmentStatus: {
          dimension: '就业状态',
          data: [
            { name: 'employed', value: 500, percentage: 50 },
            { name: 'unemployed', value: 300, percentage: 30 },
            { name: 'student', value: 200, percentage: 20 }
          ]
        }
      },
      economic: {
        debtSituation: {
          dimension: '负债情况',
          data: [
            { name: 'none', value: 400, percentage: 40 },
            { name: 'student-loan', value: 300, percentage: 30 },
            { name: 'mortgage', value: 200, percentage: 20 },
            { name: 'credit-card', value: 100, percentage: 10 }
          ]
        },
        monthlyLivingCost: {
          dimension: '每月生活开支',
          data: [
            { name: '2000-3000', value: 300, percentage: 30 },
            { name: '3000-5000', value: 350, percentage: 35 },
            { name: '1000-2000', value: 200, percentage: 20 },
            { name: '5000-8000', value: 150, percentage: 15 }
          ]
        },
        incomeSources: {
          dimension: '收入来源',
          data: [
            { name: 'salary', value: 500, percentage: 50 },
            { name: 'parents-support', value: 300, percentage: 30 },
            { name: 'freelance', value: 150, percentage: 15 },
            { name: 'savings', value: 50, percentage: 5 }
          ]
        },
        parentalSupport: {
          dimension: '父母支援金额',
          data: [
            { name: '1000-2000', value: 150, percentage: 50 },
            { name: '500-1000', value: 100, percentage: 33 },
            { name: 'below-500', value: 50, percentage: 17 }
          ]
        },
        incomeExpenseBalance: {
          dimension: '收支平衡',
          data: [
            { name: 'balanced', value: 400, percentage: 40 },
            { name: 'deficit-small', value: 300, percentage: 30 },
            { name: 'surplus-small', value: 200, percentage: 20 },
            { name: 'deficit-large', value: 100, percentage: 10 }
          ]
        },
        economicPressure: {
          dimension: '经济压力',
          data: [
            { name: 'moderate-pressure', value: 400, percentage: 40 },
            { name: 'high-pressure', value: 300, percentage: 30 },
            { name: 'low-pressure', value: 200, percentage: 20 },
            { name: 'no-pressure', value: 100, percentage: 10 }
          ]
        }
      },
      employment: {
        currentStatus: {
          dimension: '当前状态',
          data: [
            { name: 'employed', value: 500, percentage: 50 },
            { name: 'unemployed', value: 300, percentage: 30 },
            { name: 'student', value: 200, percentage: 20 }
          ]
        },
        salary: {
          dimension: '月薪',
          data: [
            { name: '5000-8000', value: 300, percentage: 30 },
            { name: '8000-12000', value: 250, percentage: 25 },
            { name: '3000-5000', value: 200, percentage: 20 },
            { name: '12000-20000', value: 150, percentage: 15 },
            { name: 'below-3000', value: 100, percentage: 10 }
          ]
        }
      },
      discrimination: {
        types: {
          dimension: '歧视类型',
          data: [
            { name: 'age', value: 300, percentage: 30 },
            { name: 'gender', value: 250, percentage: 25 },
            { name: 'education', value: 200, percentage: 20 },
            { name: 'none', value: 250, percentage: 25 }
          ]
        },
        severity: {
          dimension: '歧视严重程度',
          data: [
            { name: 'moderate', value: 400, percentage: 53 },
            { name: 'mild', value: 250, percentage: 33 },
            { name: 'severe', value: 100, percentage: 14 }
          ]
        },
        channels: {
          dimension: '歧视渠道',
          data: [
            { name: 'interview', value: 400, percentage: 40 },
            { name: 'job-posting', value: 300, percentage: 30 },
            { name: 'offer-stage', value: 200, percentage: 20 },
            { name: 'workplace', value: 100, percentage: 10 }
          ]
        }
      },
      confidence: {
        level: {
          dimension: '就业信心',
          data: [
            { name: '3', value: 400, percentage: 40 },
            { name: '4', value: 300, percentage: 30 },
            { name: '2', value: 200, percentage: 20 },
            { name: '5', value: 100, percentage: 10 }
          ]
        },
        factors: {
          dimension: '信心影响因素',
          data: [
            { name: 'personal-skills', value: 400, percentage: 40 },
            { name: 'market-outlook', value: 300, percentage: 30 },
            { name: 'education-background', value: 200, percentage: 20 },
            { name: 'work-experience', value: 100, percentage: 10 }
          ]
        }
      },
      fertility: {
        intent: {
          dimension: '生育意愿',
          data: [
            { name: 'no-plan', value: 500, percentage: 50 },
            { name: 'within-3-years', value: 300, percentage: 30 },
            { name: 'within-5-years', value: 200, percentage: 20 }
          ]
        }
      }
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = 0;
  }
}

export const questionnaire2DataService = new Questionnaire2DataService();
export default questionnaire2DataService;

