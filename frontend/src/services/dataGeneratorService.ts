/**
 * 数据生成器服务
 * 支持问卷、故事、心声数据的批量生成
 */

import { apiClient } from './api';
import type { ApiResponse } from '../types/uuid-system';

// 数据生成配置
export interface GenerationConfig {
  type: 'questionnaire' | 'story' | 'voice' | 'user';
  count: number;
  quality: 'basic' | 'standard' | 'premium';
  batchSize?: number;
  template?: string;
  options?: {
    includeVoices?: boolean;
    includeImages?: boolean;
    diversity?: number;
    realism?: number;
    creativity?: number;
    // 新增：分类和标签配置
    categoryDistribution?: CategoryDistribution;
    tagStrategy?: 'smart' | 'random' | 'balanced';
    likeDistribution?: LikeDistribution;
    clearExistingData?: boolean;
  };
}

// 分类分布配置
export interface CategoryDistribution {
  [category: string]: number; // 分类名称 -> 百分比
}

// 点赞分布配置
export interface LikeDistribution {
  hotContent: number;    // 热门内容比例 (50-200 likes)
  mediumContent: number; // 中等热度比例 (10-50 likes)
  normalContent: number; // 一般内容比例 (1-10 likes)
  newContent: number;    // 新发布比例 (0-5 likes)
}

// 智能数据生成配置
export interface SmartGenerationConfig extends GenerationConfig {
  // 心声特定配置
  voiceConfig?: {
    categories: {
      gratitude: number;    // 感谢类比例
      suggestion: number;   // 建议类比例
      reflection: number;   // 感悟类比例
      experience: number;   // 经验类比例
      other: number;        // 其他类比例
    };
    emotionScoreRange: [number, number]; // 情感评分范围
  };

  // 故事特定配置
  storyConfig?: {
    categories: {
      job_search: number;     // 求职经历
      interview: number;      // 面试经验
      career_change: number;  // 转行故事
      internship: number;     // 实习感悟
      workplace: number;      // 职场生活
      growth: number;         // 成长感悟
      advice: number;         // 经验分享
    };
    lengthRange: [number, number]; // 内容长度范围
  };
}

// 生成结果
export interface GenerationResult {
  success: boolean;
  data?: {
    generationId: string;
    totalCount: number;
    batchSize: number;
    estimatedTime: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
  };
  message: string;
  error?: string;
}

// 生成进度
export interface GenerationProgress {
  generationId: string;
  completed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  status: string;
  errors: string[];
  estimatedTimeRemaining: number;
}

// 生成统计
export interface GenerationStats {
  todayGenerated: number;
  totalGenerated: number;
  pendingReview: number;
  approvedCount: number;
  rejectedCount: number;
  passRate: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
}

class DataGeneratorService {
  private baseUrl = '/api';
  private activeGenerations = new Map<string, GenerationProgress>();

  /**
   * 开始数据生成
   */
  async startGeneration(config: GenerationConfig): Promise<GenerationResult> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/admin/data-generator/start',
        config
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: '数据生成任务已启动'
        };
      } else {
        return {
          success: false,
          message: response.data.message || '启动生成任务失败'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '网络错误',
        error: error.message
      };
    }
  }

  /**
   * 获取生成进度
   */
  async getGenerationProgress(generationId: string): Promise<GenerationProgress | null> {
    try {
      const response = await apiClient.get<ApiResponse<GenerationProgress>>(
        `/admin/data-generator/progress/${generationId}`
      );

      if (response.data.success) {
        const progress = response.data.data;
        this.activeGenerations.set(generationId, progress);
        return progress;
      }
      return null;
    } catch (error) {
      console.error('获取生成进度失败:', error);
      return null;
    }
  }

  /**
   * 取消生成任务
   */
  async cancelGeneration(generationId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/admin/data-generator/cancel/${generationId}`
      );

      if (response.data.success) {
        this.activeGenerations.delete(generationId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('取消生成任务失败:', error);
      return false;
    }
  }

  /**
   * 获取生成统计
   */
  async getGenerationStats(): Promise<GenerationStats | null> {
    try {
      const response = await apiClient.get<ApiResponse<GenerationStats>>(
        '/admin/data-generator/stats'
      );

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('获取生成统计失败:', error);
      return null;
    }
  }

  /**
   * 本地快速生成（用于测试）
   */
  async generateLocalTestData(config: GenerationConfig): Promise<GenerationResult> {
    try {
      // 模拟本地生成逻辑
      const generationId = `local-${Date.now()}`;
      const estimatedTime = config.count * 100; // 每个数据100ms

      // 创建模拟进度
      const progress: GenerationProgress = {
        generationId,
        completed: 0,
        total: config.count,
        currentBatch: 1,
        totalBatches: Math.ceil(config.count / (config.batchSize || 10)),
        status: 'running',
        errors: [],
        estimatedTimeRemaining: estimatedTime
      };

      this.activeGenerations.set(generationId, progress);

      // 模拟生成过程
      this.simulateLocalGeneration(generationId, config);

      return {
        success: true,
        data: {
          generationId,
          totalCount: config.count,
          batchSize: config.batchSize || 10,
          estimatedTime,
          status: 'running'
        },
        message: '本地生成任务已启动'
      };
    } catch (error: any) {
      return {
        success: false,
        message: '本地生成失败',
        error: error.message
      };
    }
  }

  /**
   * 模拟本地生成过程
   */
  private async simulateLocalGeneration(generationId: string, config: GenerationConfig) {
    const progress = this.activeGenerations.get(generationId);
    if (!progress) return;

    const batchSize = config.batchSize || 10;
    const totalBatches = Math.ceil(config.count / batchSize);

    for (let batch = 1; batch <= totalBatches; batch++) {
      const batchCount = Math.min(batchSize, config.count - (batch - 1) * batchSize);
      
      // 模拟批次处理时间
      await new Promise(resolve => setTimeout(resolve, 1000));

      progress.currentBatch = batch;
      progress.completed = Math.min((batch - 1) * batchSize + batchCount, config.count);
      progress.estimatedTimeRemaining = (totalBatches - batch) * 1000;

      if (progress.completed >= config.count) {
        progress.status = 'completed';
        progress.estimatedTimeRemaining = 0;
      }

      this.activeGenerations.set(generationId, { ...progress });
    }
  }

  /**
   * 获取所有活跃的生成任务
   */
  getActiveGenerations(): GenerationProgress[] {
    return Array.from(this.activeGenerations.values());
  }

  /**
   * 清理已完成的生成任务
   */
  cleanupCompletedGenerations() {
    for (const [id, progress] of this.activeGenerations.entries()) {
      if (progress.status === 'completed' || progress.status === 'failed') {
        this.activeGenerations.delete(id);
      }
    }
  }

  /**
   * 获取数据模板
   */
  getDataTemplates() {
    return {
      questionnaire: {
        basic: {
          name: '基础问卷模板',
          description: '包含基本的教育和就业信息',
          fields: ['personalInfo', 'educationInfo', 'employmentInfo', 'jobSearchInfo']
        },
        detailed: {
          name: '详细问卷模板',
          description: '包含完整的问卷信息和建议',
          fields: ['personalInfo', 'educationInfo', 'employmentInfo', 'jobSearchInfo', 'adviceForStudents', 'observationsOnEmployment']
        }
      },
      story: {
        jobHunting: {
          name: '求职经历模板',
          description: '求职过程中的经历和感悟',
          structure: ['背景介绍', '求职过程', '遇到的挑战', '解决方案', '最终结果', '经验总结']
        },
        careerChange: {
          name: '转行经历模板',
          description: '职业转换的心路历程',
          structure: ['转行原因', '准备过程', '学习经历', '求职挑战', '适应过程', '建议分享']
        }
      },
      voice: {
        encouragement: {
          name: '鼓励心声模板',
          description: '给学弟学妹的鼓励和建议',
          themes: ['坚持不懈', '技能提升', '心态调整', '机会把握']
        },
        experience: {
          name: '经验分享模板',
          description: '实用的经验和技巧分享',
          themes: ['面试技巧', '简历优化', '技能学习', '职场适应']
        }
      }
    };
  }

  /**
   * 触发定时生成任务
   */
  async triggerScheduledGeneration(): Promise<GenerationResult> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/admin/data-generator/scheduled-generation'
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || '触发定时任务失败'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '网络错误',
        error: error.message
      };
    }
  }

  /**
   * 获取调度器状态
   */
  async getSchedulerStatus(): Promise<{
    enabled: boolean;
    lastRun: string | null;
    nextRun: string | null;
    totalRuns: number;
    successRate: number;
  } | null> {
    try {
      // 暂时返回模拟数据，后续可以添加真实的API调用
      return {
        enabled: true,
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        nextRun: new Date(Date.now() + 3600000).toISOString(),
        totalRuns: 24,
        successRate: 95.8
      };
    } catch (error) {
      console.error('获取调度器状态失败:', error);
      return null;
    }
  }

  /**
   * 清除现有数据
   */
  async clearExistingData(dataType: 'all' | 'voice' | 'story' | 'questionnaire'): Promise<GenerationResult> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/admin/data-generator/clear',
        { dataType }
      );

      if (response.data.success) {
        return {
          success: true,
          message: `${dataType === 'all' ? '所有' : dataType}数据已清除`
        };
      } else {
        return {
          success: false,
          message: response.data.message || '清除数据失败'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '网络错误',
        error: error.message
      };
    }
  }

  /**
   * 智能生成心声数据
   */
  async generateSmartVoiceData(config: SmartGenerationConfig): Promise<GenerationResult> {
    try {
      // 如果需要清除现有数据
      if (config.options?.clearExistingData) {
        await this.clearExistingData('voice');
      }

      const enhancedConfig = {
        ...config,
        type: 'voice' as const,
        options: {
          ...config.options,
          // 智能标签策略
          tagStrategy: 'smart',
          // 分类分布
          categoryDistribution: config.voiceConfig?.categories || {
            gratitude: 20,    // 20% 感谢
            suggestion: 25,   // 25% 建议
            reflection: 30,   // 30% 感悟
            experience: 20,   // 20% 经验
            other: 5          // 5% 其他
          },
          // 点赞分布
          likeDistribution: {
            hotContent: 10,     // 10% 热门内容 (50-200 likes)
            mediumContent: 30,  // 30% 中等热度 (10-50 likes)
            normalContent: 50,  // 50% 一般内容 (1-10 likes)
            newContent: 10      // 10% 新发布 (0-5 likes)
          }
        }
      };

      return await this.startGeneration(enhancedConfig);
    } catch (error: any) {
      return {
        success: false,
        message: '智能生成心声数据失败',
        error: error.message
      };
    }
  }

  /**
   * 智能生成故事数据
   */
  async generateSmartStoryData(config: SmartGenerationConfig): Promise<GenerationResult> {
    try {
      // 如果需要清除现有数据
      if (config.options?.clearExistingData) {
        await this.clearExistingData('story');
      }

      const enhancedConfig = {
        ...config,
        type: 'story' as const,
        options: {
          ...config.options,
          // 智能标签策略
          tagStrategy: 'smart',
          // 分类分布
          categoryDistribution: config.storyConfig?.categories || {
            job_search: 25,     // 25% 求职经历
            interview: 20,      // 20% 面试经验
            career_change: 15,  // 15% 转行故事
            internship: 15,     // 15% 实习感悟
            workplace: 15,      // 15% 职场生活
            growth: 5,          // 5% 成长感悟
            advice: 5           // 5% 经验分享
          },
          // 点赞分布
          likeDistribution: {
            hotContent: 15,     // 15% 热门内容 (100-500 views, 20-100 likes)
            mediumContent: 35,  // 35% 中等热度 (50-100 views, 5-20 likes)
            normalContent: 40,  // 40% 一般内容 (10-50 views, 1-5 likes)
            newContent: 10      // 10% 新发布 (1-10 views, 0-2 likes)
          }
        }
      };

      return await this.startGeneration(enhancedConfig);
    } catch (error: any) {
      return {
        success: false,
        message: '智能生成故事数据失败',
        error: error.message
      };
    }
  }
}

export const dataGeneratorService = new DataGeneratorService();
export default dataGeneratorService;
