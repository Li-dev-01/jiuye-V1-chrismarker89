/**
 * AI审核服务
 * 
 * 提供AI辅助审核功能，包括内容分析、质量评估、情感分析等
 */

import { apiClient } from './api';
import { aiWaterManagementService } from './aiWaterManagementService';
import type {
  AIReviewAnalysis,
  ReviewContentType,
  AIRequest,
  AIResponse
} from '../types/ai-water-management';

export interface ReviewContent {
  id: string;
  type: ReviewContentType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface AIReviewConfig {
  enableQualityAnalysis: boolean;
  enableSentimentAnalysis: boolean;
  enableToxicityDetection: boolean;
  enableRelevanceCheck: boolean;
  enableReadabilityCheck: boolean;
  confidenceThreshold: number;
  qualityThreshold: number;
  toxicityThreshold: number;
}

class AIReviewService {
  private baseUrl = '/api/ai-review';
  private defaultConfig: AIReviewConfig = {
    enableQualityAnalysis: true,
    enableSentimentAnalysis: true,
    enableToxicityDetection: true,
    enableRelevanceCheck: true,
    enableReadabilityCheck: false,
    confidenceThreshold: 0.8,
    qualityThreshold: 0.7,
    toxicityThreshold: 0.3
  };

  /**
   * 分析单个内容
   */
  async analyzeContent(content: ReviewContent, config?: Partial<AIReviewConfig>): Promise<AIReviewAnalysis> {
    try {
      const analysisConfig = { ...this.defaultConfig, ...config };
      
      // 构建AI请求
      const aiRequest: AIRequest = {
        prompt: this.buildAnalysisPrompt(content, analysisConfig),
        contentType: content.type,
        contentId: content.id,
        options: {
          maxTokens: 1000,
          temperature: 0.1,
          topP: 0.9
        },
        metadata: {
          analysisType: 'content_review',
          config: analysisConfig
        }
      };

      // 发送AI请求
      const aiResponse = await aiWaterManagementService.sendAIRequest(aiRequest);
      
      if (!aiResponse.success) {
        throw new Error(aiResponse.error?.message || 'AI分析失败');
      }

      // 解析AI响应
      const analysis = this.parseAIResponse(aiResponse, content);
      
      // 保存分析结果
      await this.saveAnalysisResult(analysis);
      
      return analysis;
    } catch (error) {
      console.error('AI内容分析失败:', error);
      throw error;
    }
  }

  /**
   * 批量分析内容
   */
  async batchAnalyzeContent(
    contents: ReviewContent[], 
    config?: Partial<AIReviewConfig>
  ): Promise<AIReviewAnalysis[]> {
    try {
      const results: AIReviewAnalysis[] = [];
      
      // 并发处理，但限制并发数量
      const batchSize = 5;
      for (let i = 0; i < contents.length; i += batchSize) {
        const batch = contents.slice(i, i + batchSize);
        const batchPromises = batch.map(content => 
          this.analyzeContent(content, config).catch(error => {
            console.error(`分析内容 ${content.id} 失败:`, error);
            return this.createErrorAnalysis(content, error);
          })
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      console.error('批量AI分析失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容的AI分析结果
   */
  async getAnalysisResult(contentId: string): Promise<AIReviewAnalysis | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data?: AIReviewAnalysis }>(
        `${this.baseUrl}/analysis/${contentId}`
      );
      
      return response.data.success ? response.data.data || null : null;
    } catch (error) {
      console.error('获取分析结果失败:', error);
      return null;
    }
  }

  /**
   * 获取审核建议
   */
  async getReviewSuggestion(
    content: ReviewContent, 
    config?: Partial<AIReviewConfig>
  ): Promise<{
    recommendation: 'approve' | 'reject' | 'review_required';
    confidence: number;
    reasons: string[];
    improvements?: string[];
  }> {
    try {
      const analysis = await this.analyzeContent(content, config);
      return analysis.suggestions;
    } catch (error) {
      console.error('获取审核建议失败:', error);
      return {
        recommendation: 'review_required',
        confidence: 0,
        reasons: ['AI分析失败，需要人工审核'],
        improvements: []
      };
    }
  }

  /**
   * 预筛选内容
   */
  async prescreenContent(
    contents: ReviewContent[],
    config?: Partial<AIReviewConfig>
  ): Promise<{
    autoApprove: ReviewContent[];
    autoReject: ReviewContent[];
    needReview: ReviewContent[];
    analyses: AIReviewAnalysis[];
  }> {
    try {
      const analyses = await this.batchAnalyzeContent(contents, config);
      const analysisConfig = { ...this.defaultConfig, ...config };
      
      const autoApprove: ReviewContent[] = [];
      const autoReject: ReviewContent[] = [];
      const needReview: ReviewContent[] = [];
      
      analyses.forEach((analysis, index) => {
        const content = contents[index];
        const { recommendation, confidence } = analysis.suggestions;
        
        if (confidence >= analysisConfig.confidenceThreshold) {
          if (recommendation === 'approve') {
            autoApprove.push(content);
          } else if (recommendation === 'reject') {
            autoReject.push(content);
          } else {
            needReview.push(content);
          }
        } else {
          needReview.push(content);
        }
      });
      
      return {
        autoApprove,
        autoReject,
        needReview,
        analyses
      };
    } catch (error) {
      console.error('内容预筛选失败:', error);
      throw error;
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(content: ReviewContent, config: AIReviewConfig): string {
    const analysisTypes = [];
    if (config.enableQualityAnalysis) analysisTypes.push('内容质量');
    if (config.enableSentimentAnalysis) analysisTypes.push('情感倾向');
    if (config.enableToxicityDetection) analysisTypes.push('有害内容');
    if (config.enableRelevanceCheck) analysisTypes.push('相关性');
    if (config.enableReadabilityCheck) analysisTypes.push('可读性');

    return `
请对以下${this.getContentTypeLabel(content.type)}内容进行${analysisTypes.join('、')}分析：

标题：${content.title}
内容：${content.content}

请按以下格式返回JSON分析结果：
{
  "qualityScore": 0-100的质量评分,
  "sentimentScore": -1到1的情感评分,
  "toxicityScore": 0-1的有害内容评分,
  "relevanceScore": 0-1的相关性评分,
  "readabilityScore": 0-100的可读性评分,
  "flags": {
    "hasSensitiveContent": 是否包含敏感内容,
    "hasPersonalInfo": 是否包含个人信息,
    "hasInappropriateLanguage": 是否包含不当语言,
    "hasSpam": 是否为垃圾内容,
    "hasOffTopic": 是否偏离主题
  },
  "recommendation": "approve/reject/review_required",
  "confidence": 0-1的置信度,
  "reasons": ["分析原因列表"],
  "improvements": ["改进建议列表"]
}

分析要求：
- 质量评分：考虑内容的完整性、逻辑性、表达清晰度
- 情感评分：正值表示积极，负值表示消极，0表示中性
- 有害内容：检测仇恨言论、暴力内容、歧视性语言等
- 相关性：内容是否与${this.getContentTypeLabel(content.type)}主题相关
- 可读性：语言表达的流畅度和易理解程度
`;
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(aiResponse: AIResponse, content: ReviewContent): AIReviewAnalysis {
    try {
      const responseText = aiResponse.data?.content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('AI响应格式错误');
      }
      
      const analysisData = JSON.parse(jsonMatch[0]);
      
      return {
        contentId: content.id,
        contentType: content.type,
        analysis: {
          qualityScore: analysisData.qualityScore || 0,
          sentimentScore: analysisData.sentimentScore || 0,
          toxicityScore: analysisData.toxicityScore || 0,
          relevanceScore: analysisData.relevanceScore || 0,
          readabilityScore: analysisData.readabilityScore || 0
        },
        flags: {
          hasSensitiveContent: analysisData.flags?.hasSensitiveContent || false,
          hasPersonalInfo: analysisData.flags?.hasPersonalInfo || false,
          hasInappropriateLanguage: analysisData.flags?.hasInappropriateLanguage || false,
          hasSpam: analysisData.flags?.hasSpam || false,
          hasOffTopic: analysisData.flags?.hasOffTopic || false
        },
        suggestions: {
          recommendation: analysisData.recommendation || 'review_required',
          confidence: analysisData.confidence || 0,
          reasons: analysisData.reasons || [],
          improvements: analysisData.improvements || []
        },
        metadata: {
          aiSource: aiResponse.data?.provider || 'unknown',
          model: aiResponse.data?.model || 'unknown',
          analysisTime: aiResponse.data?.responseTime || 0,
          cost: aiResponse.data?.cost || 0,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return this.createErrorAnalysis(content, error);
    }
  }

  /**
   * 创建错误分析结果
   */
  private createErrorAnalysis(content: ReviewContent, error: any): AIReviewAnalysis {
    return {
      contentId: content.id,
      contentType: content.type,
      analysis: {
        qualityScore: 0,
        sentimentScore: 0,
        toxicityScore: 0,
        relevanceScore: 0,
        readabilityScore: 0
      },
      flags: {
        hasSensitiveContent: false,
        hasPersonalInfo: false,
        hasInappropriateLanguage: false,
        hasSpam: false,
        hasOffTopic: false
      },
      suggestions: {
        recommendation: 'review_required',
        confidence: 0,
        reasons: [`AI分析失败: ${error.message || '未知错误'}`],
        improvements: []
      },
      metadata: {
        aiSource: 'error',
        model: 'error',
        analysisTime: 0,
        cost: 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 保存分析结果
   */
  private async saveAnalysisResult(analysis: AIReviewAnalysis): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/analysis`, analysis);
    } catch (error) {
      console.error('保存分析结果失败:', error);
      // 不抛出错误，因为这不应该影响主要功能
    }
  }

  /**
   * 获取内容类型标签
   */
  private getContentTypeLabel(type: ReviewContentType): string {
    const labels = {
      questionnaire: '问卷调查',
      story: '故事分享',
      voice: '心声留言'
    };
    return labels[type] || '内容';
  }

  /**
   * 获取分析统计
   */
  async getAnalysisStats(period: string = 'last_7_days'): Promise<{
    totalAnalyzed: number;
    autoApproved: number;
    autoRejected: number;
    needReview: number;
    averageQuality: number;
    averageConfidence: number;
    costSavings: number;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats?period=${period}`);
      return response.data.data || {
        totalAnalyzed: 0,
        autoApproved: 0,
        autoRejected: 0,
        needReview: 0,
        averageQuality: 0,
        averageConfidence: 0,
        costSavings: 0
      };
    } catch (error) {
      console.error('获取分析统计失败:', error);
      return {
        totalAnalyzed: 0,
        autoApproved: 0,
        autoRejected: 0,
        needReview: 0,
        averageQuality: 0,
        averageConfidence: 0,
        costSavings: 0
      };
    }
  }
}

// 导出单例实例
export const aiReviewService = new AIReviewService();
export default aiReviewService;
