/**
 * 问卷标签生成器
 * 根据问卷答案自动生成用户画像标签
 */

import { QUESTIONNAIRE_V2_FIELD_IDS as FIELDS } from '../config/questionnaireFieldMappings';

export interface TagRule {
  tagKey: string;
  tagName: string;
  category: string;
  condition: (answers: Record<string, any>) => boolean;
  weight: number;  // 权重（用于多标签排序）
}

export interface GeneratedTag {
  tagKey: string;
  tagName: string;
  category: string;
  weight: number;
}

/**
 * 问卷V2标签规则定义
 * 使用 FIELDS 常量确保字段ID一致性
 */
export const QUESTIONNAIRE_V2_TAG_RULES: TagRule[] = [
  // ==================== 年龄段标签 ====================
  {
    tagKey: 'age-under-20',
    tagName: '20岁以下',
    category: '年龄段',
    condition: (a) => a[FIELDS.ageRange] === 'under-20',
    weight: 1.0
  },
  {
    tagKey: 'age-18-22',
    tagName: '18-22岁',
    category: '年龄段',
    condition: (a) => a[FIELDS.ageRange] === '18-22',
    weight: 1.0
  },
  {
    tagKey: 'age-23-25',
    tagName: '23-25岁',
    category: '年龄段',
    condition: (a) => a[FIELDS.ageRange] === '23-25',
    weight: 1.0
  },
  {
    tagKey: 'age-26-30',
    tagName: '26-30岁',
    category: '年龄段',
    condition: (a) => a[FIELDS.ageRange] === '26-30',
    weight: 1.0
  },
  {
    tagKey: 'age-30-plus',
    tagName: '30岁以上',
    category: '年龄段',
    condition: (a) => a[FIELDS.ageRange] === '30+',
    weight: 1.0
  },

  // ==================== 性别标签 ====================
  {
    tagKey: 'gender-male',
    tagName: '男性',
    category: '性别',
    condition: (a) => a[FIELDS.gender] === 'male',
    weight: 0.8
  },
  {
    tagKey: 'gender-female',
    tagName: '女性',
    category: '性别',
    condition: (a) => a[FIELDS.gender] === 'female',
    weight: 0.8
  },

  // ==================== 学历标签 ====================
  {
    tagKey: 'education-high-school',
    tagName: '高中学历',
    category: '学历',
    condition: (a) => a[FIELDS.educationLevel] === 'high-school',
    weight: 1.0
  },
  {
    tagKey: 'education-college',
    tagName: '专科学历',
    category: '学历',
    condition: (a) => a[FIELDS.educationLevel] === 'college',
    weight: 1.0
  },
  {
    tagKey: 'education-bachelor',
    tagName: '本科学历',
    category: '学历',
    condition: (a) => a[FIELDS.educationLevel] === 'bachelor',
    weight: 1.0
  },
  {
    tagKey: 'education-master',
    tagName: '硕士学历',
    category: '学历',
    condition: (a) => a[FIELDS.educationLevel] === 'master',
    weight: 1.0
  },
  {
    tagKey: 'education-phd',
    tagName: '博士学历',
    category: '学历',
    condition: (a) => a[FIELDS.educationLevel] === 'phd',
    weight: 1.0
  },

  // ==================== 就业状态标签 ====================
  {
    tagKey: 'employed',
    tagName: '已就业',
    category: '就业状态',
    condition: (a) => a[FIELDS.currentStatus] === 'employed',
    weight: 1.0
  },
  {
    tagKey: 'job-seeking',
    tagName: '求职中',
    category: '就业状态',
    condition: (a) => a[FIELDS.currentStatus] === 'unemployed',
    weight: 1.0
  },
  {
    tagKey: 'student',
    tagName: '在校学生',
    category: '就业状态',
    condition: (a) => a[FIELDS.currentStatus] === 'student',
    weight: 1.0
  },

  // ==================== 城市层级标签 ====================
  {
    tagKey: 'tier1-city',
    tagName: '一线城市',
    category: '城市层级',
    condition: (a) => a[FIELDS.currentCityTier] === 'tier1',
    weight: 0.9
  },
  {
    tagKey: 'tier2-city',
    tagName: '二线城市',
    category: '城市层级',
    condition: (a) => a[FIELDS.currentCityTier] === 'tier2',
    weight: 0.9
  },
  {
    tagKey: 'tier3-city',
    tagName: '三线及以下',
    category: '城市层级',
    condition: (a) => a[FIELDS.currentCityTier] === 'tier3' || a[FIELDS.currentCityTier] === 'tier4' || a[FIELDS.currentCityTier] === 'rural',
    weight: 0.9
  },

  // ==================== 经济压力标签 ====================
  {
    tagKey: 'high-economic-pressure',
    tagName: '高经济压力',
    category: '经济状况',
    condition: (a) => {
      const pressure = a[FIELDS.economicPressureLevel];
      return pressure === 'high-pressure' || pressure === 'severe-pressure';
    },
    weight: 1.1
  },
  {
    tagKey: 'low-economic-pressure',
    tagName: '低经济压力',
    category: '经济状况',
    condition: (a) => {
      const pressure = a[FIELDS.economicPressureLevel];
      return pressure === 'low-pressure' || pressure === 'no-pressure';
    },
    weight: 0.9
  },
  {
    tagKey: 'has-debt',
    tagName: '有负债',
    category: '经济状况',
    condition: (a) => Array.isArray(a[FIELDS.debtSituation]) && a[FIELDS.debtSituation].length > 0 && !a[FIELDS.debtSituation].includes('no-debt'),
    weight: 1.0
  },

  // ==================== 月薪水平标签 ====================
  {
    tagKey: 'salary-low',
    tagName: '月薪3000以下',
    category: '收入水平',
    condition: (a) => a[FIELDS.currentSalary] === 'below-3000',
    weight: 0.8
  },
  {
    tagKey: 'salary-medium',
    tagName: '月薪5000-8000',
    category: '收入水平',
    condition: (a) => a[FIELDS.currentSalary] === '5000-8000',
    weight: 0.8
  },
  {
    tagKey: 'salary-high',
    tagName: '月薪12000以上',
    category: '收入水平',
    condition: (a) => {
      const salary = a[FIELDS.currentSalary];
      return salary === '12000-20000' || salary === 'above-20000';
    },
    weight: 0.8
  },

  // ==================== 就业信心标签 ====================
  {
    tagKey: 'confident',
    tagName: '就业信心强',
    category: '心态',
    condition: (a) => {
      const confidence = a[FIELDS.employmentConfidence6Months];
      return confidence === 'very-confident' || confidence === 'confident';
    },
    weight: 0.9
  },
  {
    tagKey: 'anxious',
    tagName: '就业焦虑',
    category: '心态',
    condition: (a) => {
      const confidence = a[FIELDS.employmentConfidence6Months];
      return confidence === 'worried' || confidence === 'not-confident' || confidence === 'very-anxious';
    },
    weight: 1.1
  },

  // ==================== 生育意愿标签 ====================
  {
    tagKey: 'willing-to-have-children',
    tagName: '有生育意愿',
    category: '生育态度',
    condition: (a) => a[FIELDS.fertilityIntent] === 'yes',
    weight: 0.7
  },
  {
    tagKey: 'no-children-plan',
    tagName: '不打算生育',
    category: '生育态度',
    condition: (a) => a[FIELDS.fertilityIntent] === 'no',
    weight: 0.7
  },

  // ==================== 婚姻状态标签 ====================
  {
    tagKey: 'married',
    tagName: '已婚',
    category: '婚姻状态',
    condition: (a) => a[FIELDS.maritalStatus] === 'married',
    weight: 0.7
  },
  {
    tagKey: 'single',
    tagName: '单身',
    category: '婚姻状态',
    condition: (a) => a[FIELDS.maritalStatus] === 'single',
    weight: 0.7
  },

  // ==================== 组合标签（高级画像）====================
  {
    tagKey: 'young-graduate-job-seeker',
    tagName: '应届求职者',
    category: '组合画像',
    condition: (a) => {
      return (a[FIELDS.ageRange] === '18-22' || a[FIELDS.ageRange] === '23-25' || a[FIELDS.ageRange] === 'under-20') &&
             a[FIELDS.currentStatus] === 'unemployed' &&
             (a[FIELDS.educationLevel] === 'bachelor' || a[FIELDS.educationLevel] === 'master' || a[FIELDS.educationLevel] === 'high-school');
    },
    weight: 1.2
  },
  {
    tagKey: 'stressed-young-professional',
    tagName: '压力青年',
    category: '组合画像',
    condition: (a) => {
      const age = a[FIELDS.ageRange];
      const pressure = a[FIELDS.economicPressureLevel];
      return (age === '23-25' || age === '26-30' || age === 'under-20') &&
             (pressure === 'high-pressure' || pressure === 'severe-pressure');
    },
    weight: 1.1
  },
  {
    tagKey: 'debt-youth',
    tagName: '负债青年',
    category: '组合画像',
    condition: (a) => {
      const age = a[FIELDS.ageRange];
      const hasDebt = Array.isArray(a[FIELDS.debtSituation]) && a[FIELDS.debtSituation].length > 0 && !a[FIELDS.debtSituation].includes('no-debt');
      return (age === '18-22' || age === '23-25' || age === '26-30' || age === 'under-20') && hasDebt;
    },
    weight: 1.1
  },
  {
    tagKey: 'high-achiever',
    tagName: '高学历精英',
    category: '组合画像',
    condition: (a) => {
      return (a[FIELDS.educationLevel] === 'master' || a[FIELDS.educationLevel] === 'phd') &&
             (a[FIELDS.employmentConfidence6Months] === 'very-confident' || a[FIELDS.employmentConfidence6Months] === 'confident');
    },
    weight: 1.2
  },
  {
    tagKey: 'confused-graduate',
    tagName: '迷茫毕业生',
    category: '组合画像',
    condition: (a) => {
      return a[FIELDS.currentStatus] === 'unemployed' &&
             (a[FIELDS.employmentConfidence6Months] === 'worried' || a[FIELDS.employmentConfidence6Months] === 'not-confident' || a[FIELDS.employmentConfidence6Months] === 'very-anxious');
    },
    weight: 1.1
  }
];

/**
 * 问卷标签生成器类
 */
export class QuestionnaireTagGenerator {
  
  /**
   * 根据问卷答案生成标签
   */
  static generateTags(
    questionnaireId: string,
    answers: Record<string, any>
  ): GeneratedTag[] {
    const tags: GeneratedTag[] = [];
    
    // 根据问卷ID选择对应的规则集
    let rules: TagRule[] = [];
    if (questionnaireId.includes('v2') || questionnaireId.includes('questionnaire-v2')) {
      rules = QUESTIONNAIRE_V2_TAG_RULES;
    } else {
      // 默认使用V2规则
      rules = QUESTIONNAIRE_V2_TAG_RULES;
    }
    
    // 应用所有规则
    for (const rule of rules) {
      try {
        if (rule.condition(answers)) {
          tags.push({
            tagKey: rule.tagKey,
            tagName: rule.tagName,
            category: rule.category,
            weight: rule.weight
          });
        }
      } catch (error) {
        console.error(`标签规则执行失败: ${rule.tagKey}`, error);
      }
    }
    
    // 按权重排序（权重高的在前）
    return tags.sort((a, b) => b.weight - a.weight);
  }
  
  /**
   * 更新标签统计
   */
  static async updateTagStatistics(
    db: D1Database,
    questionnaireId: string,
    tags: GeneratedTag[]
  ): Promise<void> {
    for (const tag of tags) {
      try {
        // 增加标签计数（使用 UPSERT 语法）
        await db.prepare(`
          INSERT INTO questionnaire_tag_statistics 
          (questionnaire_id, tag_key, tag_name, tag_category, count, last_updated)
          VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(questionnaire_id, tag_key) 
          DO UPDATE SET 
            count = count + 1,
            last_updated = CURRENT_TIMESTAMP
        `).bind(
          questionnaireId,
          tag.tagKey,
          tag.tagName,
          tag.category
        ).run();
      } catch (error) {
        console.error(`更新标签统计失败: ${tag.tagKey}`, error);
      }
    }
    
    // 重新计算百分比
    await this.recalculatePercentages(db, questionnaireId);
  }
  
  /**
   * 重新计算标签百分比
   */
  static async recalculatePercentages(
    db: D1Database,
    questionnaireId: string
  ): Promise<void> {
    try {
      // 获取总提交数
      const totalResult = await db.prepare(`
        SELECT COUNT(*) as total 
        FROM universal_questionnaire_responses 
        WHERE questionnaire_id = ?
      `).bind(questionnaireId).first();
      
      const total = (totalResult?.total as number) || 0;
      
      if (total > 0) {
        // 更新所有标签的百分比
        await db.prepare(`
          UPDATE questionnaire_tag_statistics
          SET percentage = (count * 100.0 / ?)
          WHERE questionnaire_id = ?
        `).bind(total, questionnaireId).run();
      }
    } catch (error) {
      console.error('重新计算百分比失败:', error);
    }
  }
  
  /**
   * 获取标签统计
   */
  static async getTagStatistics(
    db: D1Database,
    questionnaireId: string,
    options?: {
      category?: string;
      limit?: number;
      minCount?: number;
    }
  ): Promise<any[]> {
    try {
      let query = `
        SELECT * FROM questionnaire_tag_statistics
        WHERE questionnaire_id = ?
      `;
      const params: any[] = [questionnaireId];
      
      if (options?.category) {
        query += ` AND tag_category = ?`;
        params.push(options.category);
      }
      
      if (options?.minCount) {
        query += ` AND count >= ?`;
        params.push(options.minCount);
      }
      
      query += ` ORDER BY count DESC`;
      
      if (options?.limit) {
        query += ` LIMIT ?`;
        params.push(options.limit);
      }
      
      const result = await db.prepare(query).bind(...params).all();
      return result.results || [];
    } catch (error) {
      console.error('获取标签统计失败:', error);
      return [];
    }
  }
}

