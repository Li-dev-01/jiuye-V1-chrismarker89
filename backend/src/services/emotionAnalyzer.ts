/**
 * 情绪分析器
 * 根据问卷答案分析用户情绪倾向
 */

import { QUESTIONNAIRE_V2_FIELD_IDS as FIELDS } from '../config/questionnaireFieldMappings';

export interface EmotionAnalysisResult {
  emotionType: 'positive' | 'neutral' | 'negative';
  confidence: number;
  needsEncouragement: boolean;
  reasons: string[];
  scores: {
    positive: number;
    negative: number;
  };
}

/**
 * 情绪分析器类
 */
export class EmotionAnalyzer {

  /**
   * 分析问卷答案的情绪倾向
   */
  static analyzeEmotion(answers: Record<string, any>): EmotionAnalysisResult {
    let positiveScore = 0;
    let negativeScore = 0;
    const reasons: string[] = [];

    // ==================== 1. 就业信心分析 ====================
    const employmentConfidence = answers[FIELDS.employmentConfidence6Months];
    if (employmentConfidence === 'very-confident') {
      positiveScore += 3;
    } else if (employmentConfidence === 'confident') {
      positiveScore += 2;
    } else if (employmentConfidence === 'neutral') {
      // 中性，不加分
    } else if (employmentConfidence === 'worried') {
      negativeScore += 2;
      reasons.push('就业信心不足');
    } else if (employmentConfidence === 'not-confident') {
      negativeScore += 2;
      reasons.push('就业信心不足');
    } else if (employmentConfidence === 'very-anxious') {
      negativeScore += 3;
      reasons.push('就业焦虑较严重');
    }

    // ==================== 2. 经济压力分析 ====================
    const pressure = answers[FIELDS.economicPressureLevel];
    if (pressure === 'severe-pressure') {
      negativeScore += 3;
      reasons.push('经济压力非常大');
    } else if (pressure === 'high-pressure') {
      negativeScore += 2;
      reasons.push('经济压力较大');
    } else if (pressure === 'moderate-pressure') {
      // 中性
    } else if (pressure === 'low-pressure') {
      positiveScore += 1;
    } else if (pressure === 'no-pressure') {
      positiveScore += 2;
    }

    // ==================== 3. 就业状态分析 ====================
    const employmentStatus = answers[FIELDS.currentStatus];
    if (employmentStatus === 'employed') {
      positiveScore += 2;
    } else if (employmentStatus === 'unemployed') {
      negativeScore += 1;
      reasons.push('正在求职中');
    } else if (employmentStatus === 'student') {
      // 学生状态，中性
    }

    // ==================== 4. 负债情况分析 ====================
    const debtSituation = answers[FIELDS.debtSituation];
    const hasDebt = Array.isArray(debtSituation) && debtSituation.length > 0 && !debtSituation.includes('no-debt');
    if (hasDebt) {
      negativeScore += 1;
      reasons.push('有经济负债');
    }

    // ==================== 5. 月薪水平分析 ====================
    const salary = answers[FIELDS.currentSalary];
    if (salary === 'below-3000') {
      negativeScore += 1;
      reasons.push('收入水平较低');
    } else if (salary === 'above-20000') {
      positiveScore += 2;
    } else if (salary === '12000-20000') {
      positiveScore += 1;
    }

    // ==================== 6. 收支平衡分析 ====================
    const incomeExpenseBalance = answers[FIELDS.incomeExpenseBalance];
    if (incomeExpenseBalance === 'deficit-high') {
      negativeScore += 2;
      reasons.push('收支严重失衡');
    } else if (incomeExpenseBalance === 'deficit-low') {
      negativeScore += 1;
      reasons.push('收支略有赤字');
    } else if (incomeExpenseBalance === 'no-income') {
      negativeScore += 1;
      reasons.push('暂无收入');
    }

    // ==================== 7. 求职歧视经历分析 ====================
    const discriminationTypes = answers[FIELDS.experiencedDiscriminationTypes];
    if (Array.isArray(discriminationTypes) && discriminationTypes.length > 0) {
      negativeScore += 2;
      reasons.push('遭遇过求职歧视');
    }

    // ==================== 8. 歧视严重程度分析 ====================
    const discriminationSeverity = answers[FIELDS.discriminationSeverity];
    if (discriminationSeverity === 'very-severe') {
      negativeScore += 2;
      reasons.push('歧视经历严重');
    } else if (discriminationSeverity === 'severe') {
      negativeScore += 1;
    }
    
    // ==================== 计算情绪类型 ====================
    let emotionType: 'positive' | 'neutral' | 'negative';
    
    if (negativeScore > positiveScore + 2) {
      emotionType = 'negative';
    } else if (positiveScore > negativeScore + 2) {
      emotionType = 'positive';
    } else {
      emotionType = 'neutral';
    }
    
    // ==================== 计算置信度 ====================
    const totalScore = positiveScore + negativeScore;
    const confidence = totalScore > 0 
      ? Math.abs(positiveScore - negativeScore) / totalScore 
      : 0.5;
    
    // ==================== 判断是否需要鼓励 ====================
    // 条件：负面情绪 且 负面分数 >= 4
    const needsEncouragement = emotionType === 'negative' && negativeScore >= 4;
    
    return {
      emotionType,
      confidence: Math.min(confidence, 1.0), // 确保不超过1.0
      needsEncouragement,
      reasons,
      scores: {
        positive: positiveScore,
        negative: negativeScore
      }
    };
  }
  
  /**
   * 更新情绪统计
   */
  static async updateEmotionStatistics(
    db: D1Database,
    questionnaireId: string,
    emotionType: string
  ): Promise<void> {
    try {
      // 增加情绪计数（使用 UPSERT 语法）
      await db.prepare(`
        INSERT INTO questionnaire_emotion_statistics 
        (questionnaire_id, emotion_type, count, last_updated)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(questionnaire_id, emotion_type) 
        DO UPDATE SET 
          count = count + 1,
          last_updated = CURRENT_TIMESTAMP
      `).bind(questionnaireId, emotionType).run();
      
      // 重新计算百分比
      await this.recalculatePercentages(db, questionnaireId);
    } catch (error) {
      console.error('更新情绪统计失败:', error);
    }
  }
  
  /**
   * 重新计算情绪百分比
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
        // 更新所有情绪类型的百分比
        await db.prepare(`
          UPDATE questionnaire_emotion_statistics
          SET percentage = (count * 100.0 / ?)
          WHERE questionnaire_id = ?
        `).bind(total, questionnaireId).run();
      }
    } catch (error) {
      console.error('重新计算情绪百分比失败:', error);
    }
  }
  
  /**
   * 获取情绪统计
   */
  static async getEmotionStatistics(
    db: D1Database,
    questionnaireId: string
  ): Promise<any[]> {
    try {
      const result = await db.prepare(`
        SELECT * FROM questionnaire_emotion_statistics
        WHERE questionnaire_id = ?
        ORDER BY count DESC
      `).bind(questionnaireId).all();
      
      return result.results || [];
    } catch (error) {
      console.error('获取情绪统计失败:', error);
      return [];
    }
  }
  
  /**
   * 获取情绪分布摘要
   */
  static async getEmotionSummary(
    db: D1Database,
    questionnaireId: string
  ): Promise<{
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    positiveRate: number;
    negativeRate: number;
  }> {
    try {
      const stats = await this.getEmotionStatistics(db, questionnaireId);
      
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      
      for (const stat of stats) {
        if (stat.emotion_type === 'positive') {
          positive = stat.count;
        } else if (stat.emotion_type === 'neutral') {
          neutral = stat.count;
        } else if (stat.emotion_type === 'negative') {
          negative = stat.count;
        }
      }
      
      const total = positive + neutral + negative;
      
      return {
        total,
        positive,
        neutral,
        negative,
        positiveRate: total > 0 ? (positive / total) * 100 : 0,
        negativeRate: total > 0 ? (negative / total) * 100 : 0
      };
    } catch (error) {
      console.error('获取情绪摘要失败:', error);
      return {
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        positiveRate: 0,
        negativeRate: 0
      };
    }
  }
  
  /**
   * 获取需要鼓励的用户比例
   */
  static async getNeedsEncouragementRate(
    db: D1Database,
    questionnaireId: string
  ): Promise<number> {
    try {
      const summary = await this.getEmotionSummary(db, questionnaireId);
      
      // 假设负面情绪用户中约70%需要鼓励
      const needsEncouragement = summary.negative * 0.7;
      
      return summary.total > 0 
        ? (needsEncouragement / summary.total) * 100 
        : 0;
    } catch (error) {
      console.error('获取需要鼓励比例失败:', error);
      return 0;
    }
  }
}

