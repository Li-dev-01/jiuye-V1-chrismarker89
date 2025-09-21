/**
 * 页面参与统计API路由
 * 提供统计数据的查询、同步和管理接口
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { ParticipationStatsService } from '../services/participationStatsService';

export function createParticipationStatsRoutes() {
  const stats = new Hono<{ Bindings: Env }>();

  /**
   * 获取页面参与统计数据
   * GET /api/participation/stats
   */
  stats.get('/', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      const statsService = new ParticipationStatsService(db);
      
      // 直接实时计算统计数据
      console.log('开始实时计算统计数据');
      const statsData = await statsService.calculateCurrentStats();
      console.log('统计数据计算完成:', statsData);

      return c.json({
        success: true,
        data: {
          questionnaire: {
            participantCount: statsData.questionnaire.participants,
            totalResponses: statsData.questionnaire.responses,
            completedResponses: statsData.questionnaire.completed
          },
          stories: {
            publishedCount: statsData.stories.published,
            authorCount: statsData.stories.authors,
            approvedCount: statsData.stories.approved,
            totalViews: statsData.stories.totalViews,
            totalLikes: statsData.stories.totalLikes
          },
          voices: {
            publishedCount: statsData.voices.published,
            authorCount: statsData.voices.authors,
            approvedCount: statsData.voices.approved,
            totalViews: statsData.voices.totalViews,
            totalLikes: statsData.voices.totalLikes
          },
          users: {
            totalCount: statsData.users.total,
            activeCount: statsData.users.active,
            newTodayCount: statsData.users.newToday
          },
          lastUpdated: statsData.lastUpdated
        },
        message: '获取参与统计成功'
      });

    } catch (error) {
      console.error('获取参与统计失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: `获取参与统计失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, 500);
    }
  });

  /**
   * 手动刷新统计数据
   * POST /api/participation/stats/refresh
   */
  stats.post('/refresh', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      const statsService = new ParticipationStatsService(db);
      
      // 强制重新计算并同步统计数据
      await statsService.syncStats('manual_refresh');
      
      // 获取最新数据
      const statsData = await statsService.getCachedStats();

      return c.json({
        success: true,
        data: statsData,
        message: '统计数据刷新成功'
      });

    } catch (error) {
      console.error('刷新统计数据失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '刷新统计数据失败'
      }, 500);
    }
  });

  /**
   * 获取统计配置
   * GET /api/participation/stats/config
   */
  stats.get('/config', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      const statsService = new ParticipationStatsService(db);
      
      const config = await statsService.getConfig();

      return c.json({
        success: true,
        data: config,
        message: '获取统计配置成功'
      });

    } catch (error) {
      console.error('获取统计配置失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取统计配置失败'
      }, 500);
    }
  });

  /**
   * 获取统计历史
   * GET /api/participation/stats/history
   */
  stats.get('/history', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      const limit = parseInt(c.req.query('limit') || '10');
      const days = parseInt(c.req.query('days') || '7');
      
      // 获取历史统计数据
      const historyData = await db.query(`
        SELECT 
          stat_date,
          questionnaire_participants,
          questionnaire_responses,
          stories_published,
          stories_authors,
          voices_published,
          voices_authors,
          total_users,
          active_users,
          updated_at
        FROM participation_stats 
        WHERE stat_type = 'overall' 
          AND stat_date >= date('now', '-${days} days')
        ORDER BY stat_date DESC
        LIMIT ?
      `, [limit]);

      // 获取变更历史
      const changeHistory = await db.query(`
        SELECT 
          h.change_type,
          h.change_summary,
          h.created_at,
          s.stat_date
        FROM participation_stats_history h
        JOIN participation_stats s ON h.stats_id = s.id
        WHERE s.stat_type = 'overall'
          AND h.created_at >= datetime('now', '-${days} days')
        ORDER BY h.created_at DESC
        LIMIT ?
      `, [limit]);

      return c.json({
        success: true,
        data: {
          dailyStats: historyData,
          changeHistory: changeHistory,
          period: `${days}天`,
          totalRecords: historyData.length
        },
        message: '获取统计历史成功'
      });

    } catch (error) {
      console.error('获取统计历史失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取统计历史失败'
      }, 500);
    }
  });

  /**
   * 获取简化的统计数据（用于页面显示）
   * GET /api/participation/stats/simple
   */
  stats.get('/simple', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 直接查询数据库获取简单统计
      const [questionnaireCount, storyCount, voiceCount] = await Promise.all([
        db.queryFirst(`
          SELECT
            COUNT(DISTINCT COALESCE(user_uuid, session_id, id)) as participants,
            COUNT(*) as responses
          FROM universal_questionnaire_responses
        `),
        db.queryFirst(`SELECT COUNT(*) as published FROM valid_stories`),
        db.queryFirst(`SELECT COUNT(*) as published FROM valid_heart_voices`)
      ]);

      return c.json({
        success: true,
        data: {
          questionnaire: {
            participantCount: questionnaireCount?.participants || 0,
            totalResponses: questionnaireCount?.responses || 0
          },
          stories: {
            publishedCount: storyCount?.published || 0,
            authorCount: 0
          },
          voices: {
            publishedCount: voiceCount?.published || 0,
            authorCount: 0
          },
          lastUpdated: new Date().toISOString()
        },
        message: '获取统计数据成功'
      });

    } catch (error) {
      console.error('获取简化统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取简化统计失败'
      }, 500);
    }
  });

  /**
   * 清理历史记录
   * POST /api/participation/stats/cleanup
   */
  stats.post('/cleanup', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      const statsService = new ParticipationStatsService(db);
      
      await statsService.cleanupHistory();

      return c.json({
        success: true,
        message: '历史记录清理完成'
      });

    } catch (error) {
      console.error('清理历史记录失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '清理历史记录失败'
      }, 500);
    }
  });

  /**
   * 健康检查和数据库测试
   * GET /api/participation/stats/health
   */
  stats.get('/health', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 基础连接测试
      const connectionTest = await db.queryFirst(`SELECT 1 as test`);

      // 检查统计表是否存在
      const tableCheck = await db.queryFirst(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='participation_stats'
      `);

      // 检查数据表
      const dataCheck = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM universal_questionnaire_responses) as questionnaire_count,
          (SELECT COUNT(*) FROM valid_heart_voices) as voices_count,
          (SELECT COUNT(*) FROM valid_stories) as stories_count
      `);

      // 测试统计查询
      const testStats = await db.queryFirst(`
        SELECT
          COUNT(DISTINCT COALESCE(user_uuid, session_id, id)) as participants,
          COUNT(*) as responses,
          COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed
        FROM universal_questionnaire_responses
      `);

      return c.json({
        success: true,
        data: {
          status: 'healthy',
          connectionTest: connectionTest,
          tableExists: !!tableCheck,
          dataCounts: dataCheck[0] || {},
          testStats: testStats,
          timestamp: new Date().toISOString()
        },
        message: '统计服务运行正常'
      });

    } catch (error) {
      console.error('统计服务健康检查失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '统计服务健康检查失败'
      }, 500);
    }
  });

  return stats;
}
