/**
 * 真实数据服务
 * 替换所有模拟数据，使用真实的API数据
 */

export interface RealAnalyticsData {
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  lastUpdated: string;
  educationDistribution: Array<{ name: string; value: number }>;
  employmentStatus: Array<{ name: string; value: number }>;
  salaryExpectation: Array<{ name: string; value: number }>;
  regionDistribution: Array<{ name: string; value: number }>;
  ageDistribution: Array<{ name: string; value: number }>;
  monthlyTrend: {
    months: string[];
    responses: number[];
    completions: number[];
  };
}

export interface RealQuestionStats {
  questionId: string;
  totalResponses: number;
  options: Array<{
    value: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  lastUpdated: string;
}

export class RealDataService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev'; // Analytics API

  /**
   * 获取真实的问卷统计数据
   */
  async getQuestionStatistics(questionId: string): Promise<RealQuestionStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/questionnaire/statistics/${questionId}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('获取问题统计失败:', error);
      return null;
    }
  }

  /**
   * 获取真实的分析数据
   */
  async getAnalyticsData(): Promise<RealAnalyticsData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/dashboard`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('获取分析数据失败:', error);
      return null;
    }
  }

  /**
   * 获取真实的心声数据
   */
  async getHeartVoicesData(): Promise<any[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/heart-voices`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('获取心声数据失败:', error);
      return null;
    }
  }

  /**
   * 获取真实的故事数据
   */
  async getStoriesData(): Promise<any[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stories`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('获取故事数据失败:', error);
      return null;
    }
  }

  /**
   * 获取真实的用户数据统计
   */
  async getUserStatistics(): Promise<{
    totalUsers: number;
    anonymousUsers: number;
    semiAnonymousUsers: number;
    activeUsers: number;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/statistics`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return null;
    }
  }

  /**
   * 检查数据是否可用
   */
  async checkDataAvailability(): Promise<{
    questionnaires: boolean;
    heartVoices: boolean;
    stories: boolean;
    analytics: boolean;
  }> {
    const results = await Promise.allSettled([
      this.getAnalyticsData(),
      this.getHeartVoicesData(),
      this.getStoriesData(),
      this.getUserStatistics()
    ]);

    return {
      analytics: results[0].status === 'fulfilled' && results[0].value !== null,
      heartVoices: results[1].status === 'fulfilled' && results[1].value !== null,
      stories: results[2].status === 'fulfilled' && results[2].value !== null,
      questionnaires: results[3].status === 'fulfilled' && results[3].value !== null
    };
  }
}

// 创建单例实例
export const realDataService = new RealDataService();

// 空数据状态组件数据
export const EMPTY_STATE_MESSAGES = {
  noQuestionnaires: {
    title: '暂无问卷数据',
    description: '还没有用户提交问卷，请等待用户参与或查看测试数据生成工具',
    action: '生成测试数据'
  },
  noHeartVoices: {
    title: '暂无心声数据',
    description: '还没有用户发布心声，鼓励用户分享他们的就业感受',
    action: '查看如何发布心声'
  },
  noStories: {
    title: '暂无故事数据',
    description: '还没有用户分享就业故事，邀请用户分享他们的经历',
    action: '查看如何发布故事'
  },
  noAnalytics: {
    title: '暂无分析数据',
    description: '需要有足够的问卷数据才能生成分析报告',
    action: '查看数据收集进度'
  },
  serviceUnavailable: {
    title: '服务暂时不可用',
    description: '数据服务连接失败，请检查后端服务状态',
    action: '重试连接'
  }
};

/**
 * 数据验证工具
 */
export class DataValidator {
  /**
   * 验证分析数据的完整性
   */
  static validateAnalyticsData(data: any): data is RealAnalyticsData {
    return data && 
           typeof data.totalResponses === 'number' &&
           typeof data.completionRate === 'number' &&
           Array.isArray(data.educationDistribution) &&
           Array.isArray(data.employmentStatus);
  }

  /**
   * 验证问题统计数据的完整性
   */
  static validateQuestionStats(data: any): data is RealQuestionStats {
    return data &&
           typeof data.questionId === 'string' &&
           typeof data.totalResponses === 'number' &&
           Array.isArray(data.options);
  }

  /**
   * 检查数据是否为空
   */
  static isEmpty(data: any): boolean {
    if (!data) return true;
    if (Array.isArray(data)) return data.length === 0;
    if (typeof data === 'object') return Object.keys(data).length === 0;
    return false;
  }
}

/**
 * 数据缓存管理
 */
export class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5分钟

  /**
   * 设置缓存
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清除过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 创建全局缓存实例
export const dataCache = new DataCache();

// 定期清理过期缓存
setInterval(() => {
  dataCache.cleanup();
}, 60000); // 每分钟清理一次
