/**
 * 数据备份服务
 * 管理问卷和心声数据的备份与恢复
 */

import { DatabaseService } from '../db';
import { R2StorageService } from './r2StorageService';
import { HeartVoiceService } from './heartVoiceService';
import type { Env } from '../types/api';

export interface BackupOptions {
  includeQuestionnaires?: boolean;
  includeHeartVoices?: boolean;
  includeUsers?: boolean;
  includeAnalytics?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  format?: 'json' | 'csv' | 'excel';
  compression?: boolean;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  downloadUrl?: string;
  size?: number;
  recordCount?: number;
  error?: string | undefined;
}

export interface BackupInfo {
  id: string;
  type: string;
  createdAt: string;
  size: number;
  recordCount: number;
  downloadUrl: string;
  description: string;
}

export class BackupService {
  private db: DatabaseService;
  private r2Service: R2StorageService;
  private heartVoiceService: HeartVoiceService;

  constructor(env: Env) {
    this.db = new DatabaseService(env.DB!);
    this.r2Service = new R2StorageService(env);
    this.heartVoiceService = new HeartVoiceService(this.db);
  }

  /**
   * 创建完整数据备份
   */
  async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const backupId = `full-backup-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      console.log('开始创建完整数据备份...');

      // 收集所有数据
      const backupData: any = {
        metadata: {
          backupId,
          createdAt: timestamp,
          version: '1.0',
          options
        },
        data: {}
      };

      let totalRecords = 0;

      // 备份问卷数据
      if (options.includeQuestionnaires !== false) {
        console.log('备份问卷数据...');
        const questionnaires = await this.exportQuestionnaireData(options.dateRange);
        backupData.data.questionnaires = questionnaires;
        totalRecords += questionnaires.length;
      }

      // 备份心声数据
      if (options.includeHeartVoices !== false) {
        console.log('备份心声数据...');
        const heartVoices = await this.exportHeartVoiceData(options.dateRange);
        backupData.data.heartVoices = heartVoices;
        totalRecords += heartVoices.length;
      }

      // 备份用户数据（如果需要）
      if (options.includeUsers) {
        console.log('备份用户数据...');
        const users = await this.exportUserData();
        backupData.data.users = users;
        totalRecords += users.length;
      }

      // 备份分析数据（如果需要）
      if (options.includeAnalytics) {
        console.log('备份分析数据...');
        const analytics = await this.exportAnalyticsData();
        backupData.data.analytics = analytics;
      }

      // 转换为指定格式
      const backupContent = await this.formatBackupData(backupData, options.format || 'json');
      
      // 上传到R2
      const uploadResult = await this.r2Service.backupData(
        backupData,
        'full',
        timestamp.replace(/[:.]/g, '-')
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      console.log(`备份完成: ${totalRecords} 条记录`);

      return {
        success: true,
        backupId,
        downloadUrl: uploadResult.url,
        size: uploadResult.metadata.size,
        recordCount: totalRecords
      };
    } catch (error) {
      console.error('创建备份失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '备份失败'
      };
    }
  }

  /**
   * 创建增量备份
   */
  async createIncrementalBackup(lastBackupDate: string): Promise<BackupResult> {
    const options: BackupOptions = {
      dateRange: {
        start: lastBackupDate,
        end: new Date().toISOString()
      }
    };

    return this.createFullBackup(options);
  }

  /**
   * 恢复数据
   */
  async restoreFromBackup(backupKey: string): Promise<{
    success: boolean;
    restoredRecords?: number;
    error?: string;
  }> {
    try {
      console.log('开始从备份恢复数据...');

      // 从R2下载备份文件
      const restoreResult = await this.r2Service.restoreData(backupKey);
      
      if (!restoreResult.success || !restoreResult.data) {
        return {
          success: false,
          error: restoreResult.error || '备份文件不存在'
        };
      }

      const backupData = restoreResult.data;
      let restoredRecords = 0;

      // 恢复问卷数据
      if (backupData.data.questionnaires) {
        console.log('恢复问卷数据...');
        const count = await this.restoreQuestionnaireData(backupData.data.questionnaires);
        restoredRecords += count;
      }

      // 恢复心声数据
      if (backupData.data.heartVoices) {
        console.log('恢复心声数据...');
        const count = await this.restoreHeartVoiceData(backupData.data.heartVoices);
        restoredRecords += count;
      }

      // 恢复用户数据
      if (backupData.data.users) {
        console.log('恢复用户数据...');
        const count = await this.restoreUserData(backupData.data.users);
        restoredRecords += count;
      }

      console.log(`恢复完成: ${restoredRecords} 条记录`);

      return {
        success: true,
        restoredRecords
      };
    } catch (error) {
      console.error('数据恢复失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '恢复失败'
      };
    }
  }

  /**
   * 获取备份列表
   */
  async getBackupList(): Promise<{
    success: boolean;
    backups?: BackupInfo[];
    error?: string | undefined;
  }> {
    try {
      const result = await this.r2Service.listFiles('backups/', 50);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      const backups: BackupInfo[] = result.files.map(file => ({
        id: file.key.split('/').pop()?.replace('.json', '') || '',
        type: file.key.includes('full') ? '完整备份' : '增量备份',
        createdAt: file.lastModified.toISOString(),
        size: file.size,
        recordCount: 0, // 需要从文件内容中获取
        downloadUrl: this.r2Service.generateDownloadUrl(file.key),
        description: `${file.metadata?.category || '数据'}备份`
      }));

      return {
        success: true,
        backups
      };
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取列表失败'
      };
    }
  }

  /**
   * 导出问卷数据
   */
  private async exportQuestionnaireData(dateRange?: { start: string; end: string }) {
    let query = 'SELECT * FROM universal_questionnaire_responses';
    const params: any[] = [];

    if (dateRange) {
      query += ' WHERE submitted_at BETWEEN ? AND ?';
      params.push(dateRange.start, dateRange.end);
    }

    query += ' ORDER BY submitted_at DESC';

    return this.db.query(query, params);
  }

  /**
   * 导出心声数据
   */
  private async exportHeartVoiceData(dateRange?: { start: string; end: string }) {
    const queryParams: any = {
      status: 'active'
    };

    if (dateRange) {
      // 这里需要根据HeartVoiceService的实现来调整
    }

    const result = await this.heartVoiceService.getHeartVoices(queryParams);
    return result.data;
  }

  /**
   * 导出用户数据
   */
  private async exportUserData() {
    return this.db.query('SELECT * FROM users ORDER BY created_at DESC');
  }

  /**
   * 导出分析数据
   */
  private async exportAnalyticsData() {
    // 导出统计和分析相关的数据
    return {
      questionnaireStats: await this.db.query('SELECT * FROM questionnaire_statistics'),
      heartVoiceStats: await this.db.query('SELECT * FROM heart_voice_statistics')
    };
  }

  /**
   * 格式化备份数据
   */
  private async formatBackupData(data: any, format: string): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        // 实现CSV格式转换
        return this.convertToCSV(data);
      case 'excel':
        // 实现Excel格式转换
        return this.convertToExcel(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(data: any): string {
    // 简化的CSV转换实现
    return JSON.stringify(data);
  }

  /**
   * 转换为Excel格式
   */
  private convertToExcel(data: any): string {
    // 简化的Excel转换实现
    return JSON.stringify(data);
  }

  /**
   * 恢复问卷数据
   */
  private async restoreQuestionnaireData(questionnaires: any[]): Promise<number> {
    let count = 0;
    for (const questionnaire of questionnaires) {
      try {
        await this.db.execute(`
          INSERT OR REPLACE INTO universal_questionnaire_responses 
          (questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          questionnaire.questionnaire_id,
          questionnaire.user_id,
          questionnaire.response_data,
          questionnaire.submitted_at,
          questionnaire.ip_address,
          questionnaire.user_agent
        ]);
        count++;
      } catch (error) {
        console.error('恢复问卷数据失败:', error);
      }
    }
    return count;
  }

  /**
   * 恢复心声数据
   */
  private async restoreHeartVoiceData(heartVoices: any[]): Promise<number> {
    let count = 0;
    for (const heartVoice of heartVoices) {
      try {
        await this.heartVoiceService.createHeartVoice(heartVoice);
        count++;
      } catch (error) {
        console.error('恢复心声数据失败:', error);
      }
    }
    return count;
  }

  /**
   * 恢复用户数据
   */
  private async restoreUserData(users: any[]): Promise<number> {
    let count = 0;
    for (const user of users) {
      try {
        await this.db.execute(`
          INSERT OR REPLACE INTO users 
          (uuid, username, email, password_hash, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          user.uuid,
          user.username,
          user.email,
          user.password_hash,
          user.role,
          user.created_at,
          user.updated_at
        ]);
        count++;
      } catch (error) {
        console.error('恢复用户数据失败:', error);
      }
    }
    return count;
  }
}
