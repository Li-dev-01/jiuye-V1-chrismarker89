/**
 * 就业平台专用内容安全检测器
 * 针对就业调查平台的特殊需求，检测不当内容
 */

export interface ContentSafetyResult {
  isSafe: boolean;
  riskScore: number; // 0-1，越高越危险
  violations: string[];
  categories: {
    profanity: number;      // 粗口/脏话
    political: number;      // 政治敏感
    adult: number;          // 成人内容
    harassment: number;     // 骚扰/辱骂
    spam: number;           // 垃圾信息
    offtopic: number;       // 偏离就业主题
  };
  recommendation: 'approve' | 'review' | 'reject';
  confidence: number;
}

export interface EmploymentContentSafetyChecker {
  checkContent(content: string, contentType: string): Promise<ContentSafetyResult>;
  checkBatch(contents: Array<{content: string, type: string}>): Promise<ContentSafetyResult[]>;
}

export class CloudflareEmploymentSafetyChecker implements EmploymentContentSafetyChecker {
  private ai: any;
  private models: Record<string, string>;

  constructor(ai: any, models: Record<string, string>) {
    this.ai = ai;
    this.models = models;
  }

  async checkContent(content: string, contentType: string): Promise<ContentSafetyResult> {
    console.log(`[SAFETY_CHECKER] Analyzing content: ${content.substring(0, 50)}...`);

    try {
      // 多层安全检测
      const [
        primarySafetyResult,
        secondarySafetyResult,
        employmentRelevanceResult,
        sentimentResult
      ] = await Promise.allSettled([
        this.runPrimarySafetyCheck(content),
        this.runSecondarySafetyCheck(content, contentType),
        this.checkEmploymentRelevance(content, contentType),
        this.analyzeSentiment(content)
      ]);

      // 合并结果
      const result = this.combineResults(
        content,
        contentType,
        primarySafetyResult,
        secondarySafetyResult,
        employmentRelevanceResult,
        sentimentResult
      );

      console.log(`[SAFETY_CHECKER] Analysis complete. Risk score: ${result.riskScore}, Recommendation: ${result.recommendation}`);
      return result;

    } catch (error) {
      console.error('[SAFETY_CHECKER] Error during content analysis:', error);
      
      // 错误时采用保守策略
      return {
        isSafe: false,
        riskScore: 0.8,
        violations: ['analysis_error'],
        categories: {
          profanity: 0.5,
          political: 0.5,
          adult: 0.5,
          harassment: 0.5,
          spam: 0.5,
          offtopic: 0.5
        },
        recommendation: 'review',
        confidence: 0.3
      };
    }
  }

  private async runPrimarySafetyCheck(content: string): Promise<any> {
    if (!this.models.primarySafety) return null;

    try {
      const result = await this.ai.run(this.models.primarySafety, {
        messages: [
          {
            role: 'system',
            content: `你是一个专业的内容安全检测器。请分析以下内容是否包含：
1. 粗口、脏话、辱骂性语言
2. 政治敏感内容
3. 成人/色情内容
4. 骚扰或威胁性语言
5. 垃圾信息或广告

请回答 "safe" 或 "unsafe"，并简要说明原因。`
          },
          {
            role: 'user',
            content: content
          }
        ]
      });

      return result;
    } catch (error) {
      console.error('[SAFETY_CHECKER] Primary safety check failed:', error);
      return null;
    }
  }

  private async runSecondarySafetyCheck(content: string, contentType: string): Promise<any> {
    if (!this.models.secondarySafety) return null;

    try {
      const result = await this.ai.run(this.models.secondarySafety, {
        messages: [
          {
            role: 'system',
            content: `作为就业调查平台的内容审核员，请评估以下${contentType}内容的安全性。
            
重点关注：
- 是否包含不当语言（粗口、辱骂）
- 是否涉及政治敏感话题
- 是否包含成人内容
- 是否与就业、职业发展相关
- 语言是否专业、适合公开分享

请给出风险评分（0-10，10最危险）和具体原因。`
          },
          {
            role: 'user',
            content: content
          }
        ]
      });

      return result;
    } catch (error) {
      console.error('[SAFETY_CHECKER] Secondary safety check failed:', error);
      return null;
    }
  }

  private async checkEmploymentRelevance(content: string, contentType: string): Promise<any> {
    if (!this.models.employmentContentAnalysis) return null;

    try {
      const result = await this.ai.run(this.models.employmentContentAnalysis, {
        messages: [
          {
            role: 'system',
            content: `请评估以下内容与就业、职业发展的相关性。
            
就业相关主题包括：
- 求职经验和技巧
- 职业发展和规划
- 工作技能和培训
- 职场经验分享
- 行业趋势和分析
- 教育和就业的关系

请评分（0-10，10最相关）并说明理由。`
          },
          {
            role: 'user',
            content: `内容类型：${contentType}\n内容：${content}`
          }
        ]
      });

      return result;
    } catch (error) {
      console.error('[SAFETY_CHECKER] Employment relevance check failed:', error);
      return null;
    }
  }

  private async analyzeSentiment(content: string): Promise<any> {
    if (!this.models.sentimentAnalysis) return null;

    try {
      const result = await this.ai.run(this.models.sentimentAnalysis, {
        text: content
      });

      return result;
    } catch (error) {
      console.error('[SAFETY_CHECKER] Sentiment analysis failed:', error);
      return null;
    }
  }

  private combineResults(
    content: string,
    contentType: string,
    primarySafety: PromiseSettledResult<any>,
    secondarySafety: PromiseSettledResult<any>,
    employmentRelevance: PromiseSettledResult<any>,
    sentiment: PromiseSettledResult<any>
  ): ContentSafetyResult {
    
    const violations: string[] = [];
    const categories = {
      profanity: 0,
      political: 0,
      adult: 0,
      harassment: 0,
      spam: 0,
      offtopic: 0
    };

    let riskScore = 0;
    let confidence = 0.5;

    // 分析主要安全检测结果
    if (primarySafety.status === 'fulfilled' && primarySafety.value) {
      const response = primarySafety.value.response || '';
      if (response.toLowerCase().includes('unsafe')) {
        riskScore += 0.4;
        violations.push('primary_safety_violation');
        
        // 检测具体违规类型
        if (response.includes('粗口') || response.includes('脏话') || response.includes('辱骂')) {
          categories.profanity = 0.8;
        }
        if (response.includes('政治')) {
          categories.political = 0.8;
        }
        if (response.includes('成人') || response.includes('色情')) {
          categories.adult = 0.8;
        }
        if (response.includes('骚扰') || response.includes('威胁')) {
          categories.harassment = 0.8;
        }
      }
      confidence += 0.2;
    }

    // 分析次要安全检测结果
    if (secondarySafety.status === 'fulfilled' && secondarySafety.value) {
      const response = secondarySafety.value.response || '';
      
      // 提取风险评分
      const riskMatch = response.match(/(\d+)/);
      if (riskMatch) {
        const risk = parseInt(riskMatch[1]) / 10;
        riskScore += risk * 0.3;
      }
      confidence += 0.2;
    }

    // 分析就业相关性
    if (employmentRelevance.status === 'fulfilled' && employmentRelevance.value) {
      const response = employmentRelevance.value.response || '';
      const relevanceMatch = response.match(/(\d+)/);
      if (relevanceMatch) {
        const relevance = parseInt(relevanceMatch[1]) / 10;
        if (relevance < 0.3) {
          categories.offtopic = 0.7;
          riskScore += 0.2;
          violations.push('off_topic');
        }
      }
      confidence += 0.2;
    }

    // 分析情感倾向
    if (sentiment.status === 'fulfilled' && sentiment.value) {
      const sentimentData = Array.isArray(sentiment.value) ? sentiment.value[0] : sentiment.value;
      if (sentimentData && sentimentData.label === 'NEGATIVE' && sentimentData.score > 0.8) {
        riskScore += 0.1;
        categories.harassment += 0.3;
      }
      confidence += 0.1;
    }

    // 基于内容长度和类型的额外检查
    if (content.length < 10) {
      categories.spam = 0.5;
      riskScore += 0.1;
    }

    // 简单的关键词检测作为后备
    const profanityKeywords = ['操', '草', '妈的', '傻逼', '白痴', '蠢货'];
    const politicalKeywords = ['政府', '党', '领导人', '政治', '选举'];
    
    profanityKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        categories.profanity = Math.max(categories.profanity, 0.9);
        riskScore += 0.3;
        violations.push('profanity_detected');
      }
    });

    politicalKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        categories.political = Math.max(categories.political, 0.6);
        riskScore += 0.2;
        violations.push('political_content');
      }
    });

    // 确保风险评分在合理范围内
    riskScore = Math.min(riskScore, 1.0);

    // 决定推荐动作
    let recommendation: 'approve' | 'review' | 'reject';
    if (riskScore < 0.2) {
      recommendation = 'approve';
    } else if (riskScore < 0.6) {
      recommendation = 'review';
    } else {
      recommendation = 'reject';
    }

    return {
      isSafe: riskScore < 0.5,
      riskScore,
      violations,
      categories,
      recommendation,
      confidence: Math.min(confidence, 1.0)
    };
  }

  async checkBatch(contents: Array<{content: string, type: string}>): Promise<ContentSafetyResult[]> {
    const results = await Promise.allSettled(
      contents.map(item => this.checkContent(item.content, item.type))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[SAFETY_CHECKER] Batch check failed for item ${index}:`, result.reason);
        return {
          isSafe: false,
          riskScore: 0.8,
          violations: ['batch_analysis_error'],
          categories: {
            profanity: 0.5,
            political: 0.5,
            adult: 0.5,
            harassment: 0.5,
            spam: 0.5,
            offtopic: 0.5
          },
          recommendation: 'review' as const,
          confidence: 0.3
        };
      }
    });
  }
}
