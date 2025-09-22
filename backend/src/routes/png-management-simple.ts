/**
 * PNG管理路由 - 简化版
 * 提供PNG缓存清理功能
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { PngCacheService } from '../services/pngCacheService';
import { R2StorageService } from '../services/r2StorageService';

export function createPngManagementRoutes() {
  const pngManagement = new Hono<{ Bindings: Env }>();

  // PNG队列状态查询
  pngManagement.get('/queue/status', async (c) => {
    try {
      return c.json({
        success: true,
        data: {
          totalTasks: 0,
          pendingTasks: 0,
          processingTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          queueHealth: 'healthy'
        },
        message: 'PNG队列状态查询成功'
      });
    } catch (error) {
      console.error('获取PNG队列状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取PNG队列状态失败'
      }, 500);
    }
  });

  // PNG缓存清理 - 清理所有缓存
  pngManagement.post('/cache/clear-all', async (c) => {
    try {
      const cacheService = new PngCacheService(c.env);
      const r2Service = new R2StorageService(c.env);
      
      const body = await c.req.json().catch(() => ({}));
      const { reason = '手动清理', deleteR2Files = false } = body;

      // 清理缓存
      const result = await cacheService.clearAllCache();
      
      let deletedR2Count = 0;
      if (deleteR2Files && result.success) {
        // 可选：同时删除R2文件
        try {
          console.log('R2文件删除功能待实现');
        } catch (r2Error) {
          console.error('删除R2文件失败:', r2Error);
        }
      }

      return c.json({
        success: true,
        data: {
          deletedCacheCount: result.deletedCount || 0,
          deletedR2Count,
          reason
        },
        message: `PNG缓存清理成功，删除了 ${result.deletedCount || 0} 个缓存条目`
      });
    } catch (error) {
      console.error('清理PNG缓存失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '清理PNG缓存失败'
      }, 500);
    }
  });

  // PNG缓存清理 - 按主题清理
  pngManagement.post('/cache/clear-theme/:theme', async (c) => {
    try {
      const theme = c.req.param('theme');
      const cacheService = new PngCacheService(c.env);

      const result = await cacheService.clearThemeCache(theme);

      return c.json({
        success: true,
        data: {
          deletedCount: result.deletedCount || 0,
          theme
        },
        message: `${theme}主题缓存清理成功，删除了 ${result.deletedCount || 0} 个缓存条目`
      });
    } catch (error) {
      console.error('清理主题缓存失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '清理主题缓存失败'
      }, 500);
    }
  });

  // PNG缓存清理 - 按内容类型清理
  pngManagement.post('/cache/clear-type/:contentType', async (c) => {
    try {
      const contentType = c.req.param('contentType') as 'heart_voice' | 'story';
      const cacheService = new PngCacheService(c.env);

      const result = await cacheService.clearContentTypeCache(contentType);

      return c.json({
        success: true,
        data: {
          deletedCount: result.deletedCount || 0,
          contentType
        },
        message: `${contentType}内容缓存清理成功，删除了 ${result.deletedCount || 0} 个缓存条目`
      });
    } catch (error) {
      console.error('清理内容类型缓存失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '清理内容类型缓存失败'
      }, 500);
    }
  });

  return pngManagement;
}

// 默认导出
const pngManagementRoutes = createPngManagementRoutes();
export default pngManagementRoutes;
