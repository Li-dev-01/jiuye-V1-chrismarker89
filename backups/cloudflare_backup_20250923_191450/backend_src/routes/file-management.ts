/**
 * 文件管理API路由
 * 处理R2存储的文件上传、下载、删除等操作
 */

import { Hono } from 'hono';
import type { Env, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware } from '../middleware/auth';
import { R2StorageService } from '../services/r2StorageService';
import { PNGCardService } from '../services/pngCardService';
import { BackupService } from '../services/backupService';
import { HeartVoiceService } from '../services/heartVoiceService';

const fileManagement = new Hono<{ Bindings: Env; Variables: AuthContext }>();

/**
 * @swagger
 * /api/files/png-card/generate:
 *   post:
 *     tags: [File Management]
 *     summary: 生成心声PNG卡片
 *     description: 为指定的心声生成PNG卡片并存储到R2
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               heartVoiceId:
 *                 type: number
 *                 description: 心声ID
 *               options:
 *                 type: object
 *                 description: 卡片生成选项
 *                 properties:
 *                   theme:
 *                     type: string
 *                     enum: [light, dark, gradient, minimal]
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *     responses:
 *       200:
 *         description: PNG卡片生成成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 心声不存在
 *       500:
 *         description: 服务器内部错误
 */
fileManagement.post('/png-card/generate', authMiddleware, async (c) => {
  try {
    const { heartVoiceId, options = {} } = await c.req.json();

    if (!heartVoiceId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '心声ID不能为空'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const heartVoiceService = new HeartVoiceService(db);
    const pngCardService = new PNGCardService(c.env);

    // 获取心声数据
    const heartVoicesResult = await heartVoiceService.getHeartVoices({
      page: 1,
      limit: 1
    });

    const heartVoice = heartVoicesResult.data.find(hv => hv.id === heartVoiceId);
    if (!heartVoice) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '心声不存在'
      }, 404);
    }

    // 生成PNG卡片
    const result = await pngCardService.generateHeartVoiceCard(heartVoice, options);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Generation Failed',
        message: result.error
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        cardId: result.cardId,
        downloadUrl: result.downloadUrl,
        heartVoiceId
      },
      message: 'PNG卡片生成成功'
    });

  } catch (error) {
    console.error('PNG卡片生成失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/files/png-card/{cardId}/download:
 *   get:
 *     tags: [File Management]
 *     summary: 下载PNG卡片
 *     description: 获取PNG卡片的下载链接
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         description: 卡片ID
 *     responses:
 *       200:
 *         description: 获取下载链接成功
 *       404:
 *         description: 卡片不存在
 *       500:
 *         description: 服务器内部错误
 */
fileManagement.get('/png-card/:cardId/download', async (c) => {
  try {
    const cardId = c.req.param('cardId');
    const pngCardService = new PNGCardService(c.env);

    const result = await pngCardService.getCardDownloadUrl(cardId);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: result.error
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        downloadUrl: result.url,
        cardId
      }
    });

  } catch (error) {
    console.error('获取下载链接失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/files/backup/create:
 *   post:
 *     tags: [File Management]
 *     summary: 创建数据备份
 *     description: 创建完整或增量数据备份到R2存储
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full, incremental]
 *                 description: 备份类型
 *               options:
 *                 type: object
 *                 description: 备份选项
 *     responses:
 *       200:
 *         description: 备份创建成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
fileManagement.post('/backup/create', authMiddleware, async (c) => {
  try {
    const { type = 'full', options = {} } = await c.req.json();
    const backupService = new BackupService(c.env);

    let result;
    if (type === 'incremental') {
      const lastBackupDate = options.lastBackupDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      result = await backupService.createIncrementalBackup(lastBackupDate);
    } else {
      result = await backupService.createFullBackup(options);
    }

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Backup Failed',
        message: result.error
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        backupId: result.backupId,
        downloadUrl: result.downloadUrl,
        size: result.size,
        recordCount: result.recordCount
      },
      message: '备份创建成功'
    });

  } catch (error) {
    console.error('创建备份失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/files/backup/list:
 *   get:
 *     tags: [File Management]
 *     summary: 获取备份列表
 *     description: 获取所有可用的数据备份列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取备份列表成功
 *       500:
 *         description: 服务器内部错误
 */
fileManagement.get('/backup/list', authMiddleware, async (c) => {
  try {
    const backupService = new BackupService(c.env);
    const result = await backupService.getBackupList();

    if (!result.success) {
      return c.json({
        success: false,
        error: 'List Failed',
        message: result.error
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        backups: result.backups
      }
    });

  } catch (error) {
    console.error('获取备份列表失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/files/backup/restore:
 *   post:
 *     tags: [File Management]
 *     summary: 恢复数据备份
 *     description: 从指定备份恢复数据
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backupKey:
 *                 type: string
 *                 description: 备份文件的R2键名
 *     responses:
 *       200:
 *         description: 数据恢复成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
fileManagement.post('/backup/restore', authMiddleware, async (c) => {
  try {
    const { backupKey } = await c.req.json();

    if (!backupKey) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '备份键名不能为空'
      }, 400);
    }

    const backupService = new BackupService(c.env);
    const result = await backupService.restoreFromBackup(backupKey);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Restore Failed',
        message: result.error
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        restoredRecords: result.restoredRecords
      },
      message: '数据恢复成功'
    });

  } catch (error) {
    console.error('数据恢复失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

export function createFileManagementRoutes() {
  return fileManagement;
}

export { fileManagement };
