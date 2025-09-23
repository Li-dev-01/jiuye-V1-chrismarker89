/**
 * 用户访问控制和防爬虫机制
 * 支持全匿名用户、半匿名用户的分级访问控制
 */

export enum UserType {
  ANONYMOUS = 'anonymous',           // 全匿名用户
  SEMI_ANONYMOUS = 'semi_anonymous', // 半匿名用户（已注册）
  REGISTERED = 'registered'          // 完全注册用户
}

export interface UserLimits {
  maxContentView: number;      // 最大可浏览内容数量
  maxRequestsPerMinute: number; // 每分钟最大请求数
  maxRequestsPerHour: number;   // 每小时最大请求数
  maxRequestsPerDay: number;    // 每天最大请求数
  enableUserProfile: boolean;   // 是否启用用户画像
  enableContentRecommendation: boolean; // 是否启用内容推荐
}

export interface RequestRecord {
  timestamp: number;
  count: number;
  contentIds: number[];
}

export interface UserAccessStats {
  totalContentViewed: number;
  requestsInLastMinute: number;
  requestsInLastHour: number;
  requestsInLastDay: number;
  lastRequestTime: number;
  viewedContentIds: Set<number>;
  userProfile?: UserProfile;
}

export interface UserProfile {
  userId: string;
  preferences: {
    categories: string[];
    tags: string[];
    contentTypes: string[];
  };
  behavior: {
    averageReadTime: number;
    preferredTimeSlots: string[];
    deviceType: string;
    browsingPattern: 'sequential' | 'random' | 'category_focused';
  };
  engagement: {
    likeRate: number;
    shareRate: number;
    commentRate: number;
    returnVisitRate: number;
  };
}

class UserAccessController {
  private static instance: UserAccessController;
  private userStats = new Map<string, UserAccessStats>();
  private requestHistory = new Map<string, RequestRecord[]>();
  
  // 用户类型限制配置
  private readonly USER_LIMITS: Record<UserType, UserLimits> = {
    [UserType.ANONYMOUS]: {
      maxContentView: 50,
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100,
      maxRequestsPerDay: 500,
      enableUserProfile: false,
      enableContentRecommendation: false
    },
    [UserType.SEMI_ANONYMOUS]: {
      maxContentView: 1000,
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      maxRequestsPerDay: 5000,
      enableUserProfile: true,
      enableContentRecommendation: true
    },
    [UserType.REGISTERED]: {
      maxContentView: -1, // 无限制
      maxRequestsPerMinute: 120,
      maxRequestsPerHour: 2000,
      maxRequestsPerDay: 10000,
      enableUserProfile: true,
      enableContentRecommendation: true
    }
  };

  private constructor() {
    this.loadUserStats();
    this.startCleanupTimer();
  }

  public static getInstance(): UserAccessController {
    if (!UserAccessController.instance) {
      UserAccessController.instance = new UserAccessController();
    }
    return UserAccessController.instance;
  }

  /**
   * 获取用户标识符
   */
  private getUserId(userType: UserType, userId?: string): string {
    switch (userType) {
      case UserType.ANONYMOUS:
        // 使用设备指纹作为匿名用户标识
        return this.getDeviceFingerprint();
      case UserType.SEMI_ANONYMOUS:
      case UserType.REGISTERED:
        return userId || this.getDeviceFingerprint();
      default:
        return this.getDeviceFingerprint();
    }
  }

  /**
   * 生成设备指纹
   */
  private getDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  }

  /**
   * 检查用户是否可以访问内容
   */
  public async checkAccess(
    userType: UserType,
    userId?: string,
    requestedContentCount: number = 1
  ): Promise<{
    allowed: boolean;
    reason?: string;
    remainingQuota?: number;
    upgradeRequired?: boolean;
    retryAfter?: number; // 秒
  }> {
    const userKey = this.getUserId(userType, userId);
    const limits = this.USER_LIMITS[userType];
    const stats = this.getUserStats(userKey);

    // 检查内容浏览数量限制
    if (limits.maxContentView > 0) {
      const totalAfterRequest = stats.totalContentViewed + requestedContentCount;
      if (totalAfterRequest > limits.maxContentView) {
        return {
          allowed: false,
          reason: `已达到${userType === UserType.ANONYMOUS ? '匿名' : '半匿名'}用户浏览限制（${limits.maxContentView}条）`,
          remainingQuota: Math.max(0, limits.maxContentView - stats.totalContentViewed),
          upgradeRequired: userType === UserType.ANONYMOUS
        };
      }
    }

    // 检查请求频率限制
    const now = Date.now();
    const rateCheckResult = this.checkRateLimit(userKey, limits, now);
    if (!rateCheckResult.allowed) {
      return rateCheckResult;
    }

    return {
      allowed: true,
      remainingQuota: limits.maxContentView > 0 
        ? limits.maxContentView - stats.totalContentViewed 
        : -1
    };
  }

  /**
   * 检查请求频率限制
   */
  private checkRateLimit(
    userKey: string,
    limits: UserLimits,
    now: number
  ): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  } {
    const history = this.requestHistory.get(userKey) || [];
    
    // 清理过期记录
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const recentRequests = history.filter(record => record.timestamp > oneMinuteAgo);
    const hourlyRequests = history.filter(record => record.timestamp > oneHourAgo);
    const dailyRequests = history.filter(record => record.timestamp > oneDayAgo);

    // 检查每分钟限制
    const requestsInLastMinute = recentRequests.reduce((sum, record) => sum + record.count, 0);
    if (requestsInLastMinute >= limits.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `请求过于频繁，每分钟最多${limits.maxRequestsPerMinute}次请求`,
        retryAfter: 60
      };
    }

    // 检查每小时限制
    const requestsInLastHour = hourlyRequests.reduce((sum, record) => sum + record.count, 0);
    if (requestsInLastHour >= limits.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: `每小时请求次数已达上限（${limits.maxRequestsPerHour}次）`,
        retryAfter: 3600
      };
    }

    // 检查每天限制
    const requestsInLastDay = dailyRequests.reduce((sum, record) => sum + record.count, 0);
    if (requestsInLastDay >= limits.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: `每日请求次数已达上限（${limits.maxRequestsPerDay}次）`,
        retryAfter: 86400
      };
    }

    return { allowed: true };
  }

  /**
   * 记录用户访问
   */
  public recordAccess(
    userType: UserType,
    userId?: string,
    contentIds: number[] = [],
    metadata?: {
      category?: string;
      readTime?: number;
      action?: 'view' | 'like' | 'share' | 'download';
    }
  ): void {
    const userKey = this.getUserId(userType, userId);
    const now = Date.now();
    
    // 更新用户统计
    const stats = this.getUserStats(userKey);
    stats.totalContentViewed += contentIds.length;
    stats.lastRequestTime = now;
    
    // 记录浏览的内容ID
    contentIds.forEach(id => stats.viewedContentIds.add(id));
    
    // 更新请求历史
    const history = this.requestHistory.get(userKey) || [];
    history.push({
      timestamp: now,
      count: 1,
      contentIds: [...contentIds]
    });
    
    // 只保留最近24小时的记录
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const filteredHistory = history.filter(record => record.timestamp > oneDayAgo);
    this.requestHistory.set(userKey, filteredHistory);
    
    // 更新用户画像（仅限半匿名和注册用户）
    if (userType !== UserType.ANONYMOUS && metadata) {
      this.updateUserProfile(userKey, metadata, contentIds);
    }
    
    // 保存到本地存储
    this.saveUserStats();
  }

  /**
   * 更新用户画像
   */
  private updateUserProfile(
    userKey: string,
    metadata: {
      category?: string;
      readTime?: number;
      action?: 'view' | 'like' | 'share' | 'download';
    },
    contentIds: number[]
  ): void {
    const stats = this.getUserStats(userKey);
    
    if (!stats.userProfile) {
      stats.userProfile = {
        userId: userKey,
        preferences: {
          categories: [],
          tags: [],
          contentTypes: []
        },
        behavior: {
          averageReadTime: 0,
          preferredTimeSlots: [],
          deviceType: this.getDeviceType(),
          browsingPattern: 'sequential'
        },
        engagement: {
          likeRate: 0,
          shareRate: 0,
          commentRate: 0,
          returnVisitRate: 0
        }
      };
    }

    const profile = stats.userProfile;
    
    // 更新分类偏好
    if (metadata.category && !profile.preferences.categories.includes(metadata.category)) {
      profile.preferences.categories.push(metadata.category);
      // 只保留最近的10个分类
      if (profile.preferences.categories.length > 10) {
        profile.preferences.categories = profile.preferences.categories.slice(-10);
      }
    }
    
    // 更新阅读时间
    if (metadata.readTime) {
      const currentAvg = profile.behavior.averageReadTime;
      profile.behavior.averageReadTime = (currentAvg + metadata.readTime) / 2;
    }
    
    // 更新时间偏好
    const currentHour = new Date().getHours();
    const timeSlot = this.getTimeSlot(currentHour);
    if (!profile.behavior.preferredTimeSlots.includes(timeSlot)) {
      profile.behavior.preferredTimeSlots.push(timeSlot);
    }
    
    // 更新互动率
    if (metadata.action) {
      switch (metadata.action) {
        case 'like':
          profile.engagement.likeRate = Math.min(1, profile.engagement.likeRate + 0.1);
          break;
        case 'share':
          profile.engagement.shareRate = Math.min(1, profile.engagement.shareRate + 0.1);
          break;
      }
    }
  }

  /**
   * 获取时间段
   */
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * 获取设备类型
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * 获取用户统计信息
   */
  private getUserStats(userKey: string): UserAccessStats {
    if (!this.userStats.has(userKey)) {
      this.userStats.set(userKey, {
        totalContentViewed: 0,
        requestsInLastMinute: 0,
        requestsInLastHour: 0,
        requestsInLastDay: 0,
        lastRequestTime: 0,
        viewedContentIds: new Set()
      });
    }
    return this.userStats.get(userKey)!;
  }

  /**
   * 获取用户访问统计
   */
  public getUserAccessStats(userType: UserType, userId?: string): UserAccessStats {
    const userKey = this.getUserId(userType, userId);
    return this.getUserStats(userKey);
  }

  /**
   * 获取用户限制信息
   */
  public getUserLimits(userType: UserType): UserLimits {
    return { ...this.USER_LIMITS[userType] };
  }

  /**
   * 检查是否需要升级用户类型
   */
  public shouldUpgradeUser(userType: UserType, userId?: string): {
    shouldUpgrade: boolean;
    reason?: string;
    benefits?: string[];
  } {
    if (userType !== UserType.ANONYMOUS) {
      return { shouldUpgrade: false };
    }

    const userKey = this.getUserId(userType, userId);
    const stats = this.getUserStats(userKey);
    const limits = this.USER_LIMITS[userType];

    if (stats.totalContentViewed >= limits.maxContentView * 0.8) {
      return {
        shouldUpgrade: true,
        reason: `即将达到匿名用户浏览限制（${stats.totalContentViewed}/${limits.maxContentView}）`,
        benefits: [
          '浏览更多内容（1000条）',
          '个性化内容推荐',
          '浏览历史记录',
          '更高的请求频率限制',
          '用户偏好设置'
        ]
      };
    }

    return { shouldUpgrade: false };
  }

  /**
   * 保存用户统计到本地存储
   */
  private saveUserStats(): void {
    try {
      const statsData = Array.from(this.userStats.entries()).map(([key, stats]) => [
        key,
        {
          ...stats,
          viewedContentIds: Array.from(stats.viewedContentIds)
        }
      ]);
      localStorage.setItem('user_access_stats', JSON.stringify(statsData));
    } catch (error) {
      console.warn('Failed to save user stats:', error);
    }
  }

  /**
   * 从本地存储加载用户统计
   */
  private loadUserStats(): void {
    try {
      const saved = localStorage.getItem('user_access_stats');
      if (saved) {
        const statsData = JSON.parse(saved);
        this.userStats = new Map(
          statsData.map(([key, stats]: [string, any]) => [
            key,
            {
              ...stats,
              viewedContentIds: new Set(stats.viewedContentIds)
            }
          ])
        );
      }
    } catch (error) {
      console.warn('Failed to load user stats:', error);
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    // 每小时清理一次过期数据
    setInterval(() => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      // 清理过期的请求历史
      for (const [userKey, history] of this.requestHistory.entries()) {
        const filteredHistory = history.filter(record => record.timestamp > oneDayAgo);
        if (filteredHistory.length === 0) {
          this.requestHistory.delete(userKey);
        } else {
          this.requestHistory.set(userKey, filteredHistory);
        }
      }
      
      this.saveUserStats();
    }, 60 * 60 * 1000); // 每小时执行一次
  }

  /**
   * 清除用户数据
   */
  public clearUserData(userType: UserType, userId?: string): void {
    const userKey = this.getUserId(userType, userId);
    this.userStats.delete(userKey);
    this.requestHistory.delete(userKey);
    this.saveUserStats();
  }

  /**
   * 获取系统统计信息
   */
  public getSystemStats(): {
    totalUsers: number;
    anonymousUsers: number;
    semiAnonymousUsers: number;
    totalRequests: number;
    averageRequestsPerUser: number;
  } {
    const totalUsers = this.userStats.size;
    let totalRequests = 0;
    
    for (const history of this.requestHistory.values()) {
      totalRequests += history.reduce((sum, record) => sum + record.count, 0);
    }
    
    return {
      totalUsers,
      anonymousUsers: 0, // 需要根据实际用户类型统计
      semiAnonymousUsers: 0,
      totalRequests,
      averageRequestsPerUser: totalUsers > 0 ? totalRequests / totalUsers : 0
    };
  }
}

export const userAccessController = UserAccessController.getInstance();
