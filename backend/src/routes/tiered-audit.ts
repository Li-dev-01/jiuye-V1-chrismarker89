/**
 * 分级审核路由
 * 集成到现有后端系统
 */

import { Hono } from 'hono';
import { tieredAuditManager } from '../services/tieredAuditService';

export function createTieredAuditRoutes() {
  const audit = new Hono();

  /**
   * GET /api/audit/level - 获取当前审核级别
   */
  audit.get('/level', async (c) => {
    try {
      const levelInfo = tieredAuditManager.getCurrentLevel();
      
      return c.json({
        success: true,
        data: levelInfo,
        message: '获取审核级别成功'
      });
    } catch (error) {
      console.error('获取审核级别失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取审核级别失败'
      }, 500);
    }
  });

  /**
   * POST /api/audit/level - 切换审核级别
   */
  audit.post('/level', async (c) => {
    try {
      const body = await c.req.json();
      const { level, admin_id } = body;

      if (!level || !['level1', 'level2', 'level3'].includes(level)) {
        return c.json({
          success: false,
          error: 'Invalid level',
          message: '无效的审核级别'
        }, 400);
      }

      const success = tieredAuditManager.switchLevel(level);
      
      if (success) {
        const newLevelInfo = tieredAuditManager.getCurrentLevel();
        
        return c.json({
          success: true,
          data: {
            old_level: 'previous', // 简化实现
            new_level: level,
            config: newLevelInfo.config
          },
          message: `审核级别已切换到${level}`
        });
      } else {
        return c.json({
          success: false,
          error: 'Switch failed',
          message: '级别切换失败'
        }, 400);
      }
    } catch (error) {
      console.error('切换审核级别失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '切换审核级别失败'
      }, 500);
    }
  });

  /**
   * POST /api/audit/test - 测试内容审核
   */
  audit.post('/test', async (c) => {
    try {
      const body = await c.req.json();
      const { content, content_type } = body;

      if (!content) {
        return c.json({
          success: false,
          error: 'Content required',
          message: '内容不能为空'
        }, 400);
      }

      // 获取用户IP
      const userIP = c.req.header('CF-Connecting-IP') || 
                    c.req.header('X-Forwarded-For') || 
                    '127.0.0.1';

      const result = tieredAuditManager.checkContent(
        content, 
        content_type || 'story', 
        userIP
      );

      return c.json({
        success: true,
        data: result,
        message: '审核测试完成'
      });
    } catch (error) {
      console.error('内容审核测试失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '审核测试失败'
      }, 500);
    }
  });

  /**
   * GET /api/audit/stats - 获取审核统计
   */
  audit.get('/stats', async (c) => {
    try {
      const stats = tieredAuditManager.getStats();
      
      return c.json({
        success: true,
        data: stats,
        message: '获取审核统计成功'
      });
    } catch (error) {
      console.error('获取审核统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取审核统计失败'
      }, 500);
    }
  });

  /**
   * GET /api/audit/history - 获取审核历史（简化实现）
   */
  audit.get('/history', async (c) => {
    try {
      // 简化实现，返回模拟数据
      const history = [
        {
          from_level: 'level1',
          to_level: 'level2',
          trigger_reason: '违规率上升',
          switched_by: 'auto',
          admin_id: 'system',
          switched_at: new Date().toISOString()
        }
      ];
      
      return c.json({
        success: true,
        data: history,
        message: '获取审核历史成功'
      });
    } catch (error) {
      console.error('获取审核历史失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取审核历史失败'
      }, 500);
    }
  });

  /**
   * POST /api/audit/check - 实际审核接口（供其他模块调用）
   */
  audit.post('/check', async (c) => {
    try {
      const body = await c.req.json();
      const { content, content_type, user_id } = body;

      if (!content) {
        return c.json({
          success: false,
          error: 'Content required',
          message: '内容不能为空'
        }, 400);
      }

      // 获取用户IP
      const userIP = c.req.header('CF-Connecting-IP') || 
                    c.req.header('X-Forwarded-For') || 
                    '127.0.0.1';

      const result = tieredAuditManager.checkContent(
        content, 
        content_type || 'story', 
        userIP
      );

      // 根据审核结果决定响应
      if (result.passed) {
        return c.json({
          success: true,
          data: {
            action: 'approve',
            audit_level: result.audit_level,
            risk_score: result.risk_score
          },
          message: '内容审核通过'
        });
      } else {
        return c.json({
          success: false,
          data: {
            action: result.action,
            reason: result.reason,
            violations: result.violations,
            audit_level: result.audit_level,
            risk_score: result.risk_score,
            requires_manual: result.requires_manual
          },
          message: '内容审核未通过'
        }, 422); // 422 Unprocessable Entity
      }
    } catch (error) {
      console.error('内容审核失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '内容审核失败'
      }, 500);
    }
  });

  return audit;
}
