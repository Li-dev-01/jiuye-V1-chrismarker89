/**
 * 页面参与统计服务
 * 负责统计数据的计算、同步和管理
 */

import type { DatabaseService } from '../db';

export interface ParticipationStatsData {
  questionnaire: {
    participants: number;
    responses: number;
    completed: number;
  };
  stories: {
    published: number;
    authors: number;
    approved: number;
    totalViews: number;
    totalLikes: number;
  };
  voices: {
    published: number;
    authors: number;
    approved: number;
    totalViews: number;
    totalLikes: number;
  };
  users: {
    total: number;
    active: number;
    newToday: number;
  };
  lastUpdated: string;
}

export interface StatsConfig {
  syncIntervalMinutes: number;
  enableHourlySync: boolean;
  enableDailySummary: boolean;
  cacheDurationMinutes: number;
  enableHistoryTracking: boolean;
  maxHistoryDays: number;
}

export class ParticipationStatsService {
  constructor(private db: DatabaseService) {}

  /**
   * 获取统计配置
   */
  async getConfig(): Promise<StatsConfig> {
    try {
      const configs = await this.db.query(`
        SELECT config_key, config_value, config_type 
        FROM participation_stats_config 
        WHERE is_enabled = 1
      `);

      const defaultConfig: StatsConfig = {
        syncIntervalMinutes: 10,
        enableHourlySync: true,
        enableDailySummary: true,
        cacheDurationMinutes: 5,
        enableHistoryTracking: true,
        maxHistoryDays: 90
      };

      for (const config of configs) {
        const key = this.toCamelCase(config.config_key);
        const value = config.config_value;
        
        switch (config.config_type) {
          case 'number':
            (defaultConfig as any)[key] = parseInt(value);
            break;
          case 'boolean':
            (defaultConfig as any)[key] = value === 'true';
            break;
          default:
            (defaultConfig as any)[key] = value;
        }
      }

      return defaultConfig;
    } catch (error) {
      console.error('获取统计配置失败:', error);
      // 返回默认配置
      return {
        syncIntervalMinutes: 10,
        enableHourlySync: true,
        enableDailySummary: true,
        cacheDurationMinutes: 5,
        enableHistoryTracking: true,
        maxHistoryDays: 90
      };
    }
  }

  /**
   * 从原始数据表计算最新统计
   */
  async calculateCurrentStats(): Promise<ParticipationStatsData> {
    try {
      console.log('开始计算问卷统计...');
      const questionnaireStats = await this.calculateQuestionnaireStats();
      console.log('问卷统计完成:', questionnaireStats);

      console.log('开始计算故事统计...');
      const storyStats = await this.calculateStoryStats();
      console.log('故事统计完成:', storyStats);

      console.log('开始计算心声统计...');
      const voiceStats = await this.calculateVoiceStats();
      console.log('心声统计完成:', voiceStats);

      console.log('开始计算用户统计...');
      const userStats = await this.calculateUserStats();
      console.log('用户统计完成:', userStats);

      const result = {
        questionnaire: questionnaireStats,
        stories: storyStats,
        voices: voiceStats,
        users: userStats,
        lastUpdated: new Date().toISOString()
      };

      console.log('所有统计计算完成:', result);
      return result;
    } catch (error) {
      console.error('计算统计数据失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  /**
   * 计算问卷统计
   */
  private async calculateQuestionnaireStats() {
    const result = await this.db.queryFirst(`
      SELECT
        COUNT(DISTINCT COALESCE(user_uuid, session_id, id)) as participants,
        COUNT(*) as responses,
        COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed
      FROM universal_questionnaire_responses
    `);

    return {
      participants: result?.participants || 0,
      responses: result?.responses || 0,
      completed: result?.completed || 0
    };
  }

  /**
   * 计算故事统计
   */
  private async calculateStoryStats() {
    const result = await this.db.queryFirst(`
      SELECT 
        COUNT(*) as published,
        COUNT(DISTINCT user_id) as authors,
        COUNT(CASE WHEN audit_status = 'approved' THEN 1 END) as approved,
        COALESCE(SUM(view_count), 0) as totalViews,
        COALESCE(SUM(like_count), 0) as totalLikes
      FROM valid_stories
    `);

    return {
      published: result?.published || 0,
      authors: result?.authors || 0,
      approved: result?.approved || 0,
      totalViews: result?.totalViews || 0,
      totalLikes: result?.totalLikes || 0
    };
  }

  /**
   * 计算心声统计
   */
  private async calculateVoiceStats() {
    const result = await this.db.queryFirst(`
      SELECT 
        COUNT(*) as published,
        COUNT(DISTINCT user_id) as authors,
        COUNT(CASE WHEN audit_status = 'approved' THEN 1 END) as approved,
        COALESCE(SUM(view_count), 0) as totalViews,
        COALESCE(SUM(like_count), 0) as totalLikes
      FROM valid_heart_voices
    `);

    return {
      published: result?.published || 0,
      authors: result?.authors || 0,
      approved: result?.approved || 0,
      totalViews: result?.totalViews || 0,
      totalLikes: result?.totalLikes || 0
    };
  }

  /**
   * 计算用户统计
   */
  private async calculateUserStats() {
    try {
      // 检查用户表是否存在
      const tableExists = await this.db.queryFirst(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='users'
      `);

      if (!tableExists) {
        console.log('用户表不存在，返回默认值');
        return {
          total: 0,
          active: 0,
          newToday: 0
        };
      }

      const [totalResult, activeResult, newTodayResult] = await Promise.all([
        this.db.queryFirst(`SELECT COUNT(*) as total FROM users`),
        this.db.queryFirst(`
          SELECT COUNT(*) as active
          FROM users
          WHERE last_login_at >= datetime('now', '-30 days')
        `),
        this.db.queryFirst(`
          SELECT COUNT(*) as newToday
          FROM users
          WHERE date(created_at) = date('now')
        `)
      ]);

      return {
        total: totalResult?.total || 0,
        active: activeResult?.active || 0,
        newToday: newTodayResult?.newToday || 0
      };
    } catch (error) {
      console.error('计算用户统计失败:', error);
      return {
        total: 0,
        active: 0,
        newToday: 0
      };
    }
  }

  /**
   * 同步统计数据到统计表
   */
  async syncStats(changeType: 'hourly_sync' | 'daily_update' | 'manual_refresh' = 'manual_refresh'): Promise<void> {
    try {
      const currentStats = await this.calculateCurrentStats();
      const config = await this.getConfig();
      
      // 获取当前统计记录
      const existingStats = await this.db.queryFirst(`
        SELECT * FROM participation_stats 
        WHERE stat_type = 'overall' AND stat_date = date('now')
      `);

      if (existingStats) {
        // 更新现有记录
        await this.updateExistingStats(existingStats, currentStats, changeType, config);
      } else {
        // 创建新记录
        await this.createNewStats(currentStats);
      }

      console.log(`统计数据同步完成 (${changeType}):`, {
        questionnaire: currentStats.questionnaire.participants,
        stories: currentStats.stories.published,
        voices: currentStats.voices.published
      });

    } catch (error) {
      console.error('同步统计数据失败:', error);
      throw error;
    }
  }

  /**
   * 更新现有统计记录
   */
  private async updateExistingStats(
    existingStats: any, 
    currentStats: ParticipationStatsData, 
    changeType: string,
    config: StatsConfig
  ) {
    // 记录历史变更（如果启用）
    if (config.enableHistoryTracking) {
      await this.recordStatsHistory(existingStats, currentStats, changeType);
    }

    // 更新统计记录
    await this.db.execute(`
      UPDATE participation_stats SET
        questionnaire_participants = ?,
        questionnaire_responses = ?,
        questionnaire_completed = ?,
        stories_published = ?,
        stories_authors = ?,
        stories_approved = ?,
        stories_total_views = ?,
        stories_total_likes = ?,
        voices_published = ?,
        voices_authors = ?,
        voices_approved = ?,
        voices_total_views = ?,
        voices_total_likes = ?,
        total_users = ?,
        active_users = ?,
        new_users_today = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE stat_type = 'overall' AND stat_date = date('now')
    `, [
      currentStats.questionnaire.participants,
      currentStats.questionnaire.responses,
      currentStats.questionnaire.completed,
      currentStats.stories.published,
      currentStats.stories.authors,
      currentStats.stories.approved,
      currentStats.stories.totalViews,
      currentStats.stories.totalLikes,
      currentStats.voices.published,
      currentStats.voices.authors,
      currentStats.voices.approved,
      currentStats.voices.totalViews,
      currentStats.voices.totalLikes,
      currentStats.users.total,
      currentStats.users.active,
      currentStats.users.newToday
    ]);
  }

  /**
   * 创建新的统计记录
   */
  private async createNewStats(currentStats: ParticipationStatsData) {
    await this.db.execute(`
      INSERT INTO participation_stats (
        stat_type, stat_date,
        questionnaire_participants, questionnaire_responses, questionnaire_completed,
        stories_published, stories_authors, stories_approved, stories_total_views, stories_total_likes,
        voices_published, voices_authors, voices_approved, voices_total_views, voices_total_likes,
        total_users, active_users, new_users_today
      ) VALUES (?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'overall',
      currentStats.questionnaire.participants,
      currentStats.questionnaire.responses,
      currentStats.questionnaire.completed,
      currentStats.stories.published,
      currentStats.stories.authors,
      currentStats.stories.approved,
      currentStats.stories.totalViews,
      currentStats.stories.totalLikes,
      currentStats.voices.published,
      currentStats.voices.authors,
      currentStats.voices.approved,
      currentStats.voices.totalViews,
      currentStats.voices.totalLikes,
      currentStats.users.total,
      currentStats.users.active,
      currentStats.users.newToday
    ]);
  }

  /**
   * 记录统计历史
   */
  private async recordStatsHistory(existingStats: any, currentStats: ParticipationStatsData, changeType: string) {
    const previousValues = {
      questionnaire_participants: existingStats.questionnaire_participants,
      stories_published: existingStats.stories_published,
      voices_published: existingStats.voices_published
    };

    const newValues = {
      questionnaire_participants: currentStats.questionnaire.participants,
      stories_published: currentStats.stories.published,
      voices_published: currentStats.voices.published
    };

    const changeSummary = this.generateChangeSummary(previousValues, newValues);

    await this.db.execute(`
      INSERT INTO participation_stats_history (
        stats_id, change_type, previous_values, new_values, change_summary
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      existingStats.id,
      changeType,
      JSON.stringify(previousValues),
      JSON.stringify(newValues),
      changeSummary
    ]);
  }

  /**
   * 生成变更摘要
   */
  private generateChangeSummary(previous: any, current: any): string {
    const changes = [];
    
    if (previous.questionnaire_participants !== current.questionnaire_participants) {
      const diff = current.questionnaire_participants - previous.questionnaire_participants;
      changes.push(`问卷参与${diff > 0 ? '+' : ''}${diff}`);
    }
    
    if (previous.stories_published !== current.stories_published) {
      const diff = current.stories_published - previous.stories_published;
      changes.push(`故事${diff > 0 ? '+' : ''}${diff}`);
    }
    
    if (previous.voices_published !== current.voices_published) {
      const diff = current.voices_published - previous.voices_published;
      changes.push(`心声${diff > 0 ? '+' : ''}${diff}`);
    }

    return changes.length > 0 ? changes.join(', ') : '无变化';
  }

  /**
   * 获取缓存的统计数据
   */
  async getCachedStats(): Promise<ParticipationStatsData | null> {
    try {
      const result = await this.db.queryFirst(`
        SELECT * FROM v_latest_participation_stats 
        WHERE stat_type = 'overall'
      `);

      if (!result) return null;

      return {
        questionnaire: {
          participants: result.questionnaire_participants || 0,
          responses: result.questionnaire_responses || 0,
          completed: result.questionnaire_completed || 0
        },
        stories: {
          published: result.stories_published || 0,
          authors: result.stories_authors || 0,
          approved: result.stories_approved || 0,
          totalViews: result.stories_total_views || 0,
          totalLikes: result.stories_total_likes || 0
        },
        voices: {
          published: result.voices_published || 0,
          authors: result.voices_authors || 0,
          approved: result.voices_approved || 0,
          totalViews: result.voices_total_views || 0,
          totalLikes: result.voices_total_likes || 0
        },
        users: {
          total: result.total_users || 0,
          active: result.active_users || 0,
          newToday: result.new_users_today || 0
        },
        lastUpdated: result.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('获取缓存统计数据失败:', error);
      return null;
    }
  }

  /**
   * 清理过期历史记录
   */
  async cleanupHistory(): Promise<void> {
    try {
      const config = await this.getConfig();
      
      await this.db.execute(`
        DELETE FROM participation_stats_history 
        WHERE created_at < datetime('now', '-${config.maxHistoryDays} days')
      `);

      console.log(`清理了${config.maxHistoryDays}天前的历史记录`);
    } catch (error) {
      console.error('清理历史记录失败:', error);
    }
  }

  /**
   * 工具方法：转换为驼峰命名
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}
