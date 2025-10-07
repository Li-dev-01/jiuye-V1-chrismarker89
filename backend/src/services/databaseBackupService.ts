/**
 * 数据库备份服务
 * 负责D1数据库的完整备份和恢复
 */

import type { Env } from '../types/api';
import { R2StorageService } from './r2StorageService';
import { createDatabaseService } from '../db';

export interface BackupMetadata {
  backupId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD格式
  size: number;
  tableCount: number;
  recordCount: number;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  metadata: BackupMetadata;
  r2Key: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: number;
  restoredRecords: number;
  error?: string;
}

export class DatabaseBackupService {
  private env: Env;
  private r2Service: R2StorageService;
  private db: ReturnType<typeof createDatabaseService>;

  // 需要备份的表列表
  private readonly TABLES_TO_BACKUP = [
    'users',
    'login_sessions',
    'universal_questionnaire_responses',
    'questionnaire_responses',
    'pending_stories',
    'valid_stories',
    'raw_story_submissions',
    'story_likes',
    'png_cards',
    'audit_records',
    'violation_content',
    'content_reports',
    'user_reputation',
    'user_activity_logs',
    'system_config',
    'admin_operations',
    'questionnaire_v2_statistics',
    'tag_statistics',
    'questionnaire_progress'
  ];

  constructor(env: Env) {
    this.env = env;
    this.r2Service = new R2StorageService(env);
    this.db = createDatabaseService(env);
  }

  /**
   * 创建完整数据库备份
   */
  async createFullBackup(): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0]; // YYYY-MM-DD

    console.log(`📦 开始创建数据库备份: ${backupId}`);

    try {
      const backupData: any = {
        metadata: {
          backupId,
          timestamp,
          date,
          version: '1.0',
          databaseName: 'college-employment-survey'
        },
        tables: {}
      };

      let totalRecords = 0;

      // 备份每个表
      for (const tableName of this.TABLES_TO_BACKUP) {
        try {
          console.log(`  📊 备份表: ${tableName}`);
          
          const records = await this.db.query(`SELECT * FROM ${tableName}`);
          backupData.tables[tableName] = records;
          totalRecords += records.length;

          console.log(`  ✅ ${tableName}: ${records.length} 条记录`);
        } catch (error) {
          console.warn(`  ⚠️ 跳过表 ${tableName}:`, error);
          backupData.tables[tableName] = [];
        }
      }

      // 转换为JSON字符串
      const backupJson = JSON.stringify(backupData, null, 2);
      const backupSize = new TextEncoder().encode(backupJson).length;

      console.log(`📦 备份数据大小: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);

      // 上传到R2
      const r2Key = `backups/database/${date}/${backupId}.json`;
      const uploadResult = await this.r2Service.uploadFile(
        r2Key,
        backupJson,
        {
          filename: `${backupId}.json`,
          contentType: 'application/json',
          category: 'backup',
          relatedId: backupId
        }
      );

      if (!uploadResult.success) {
        throw new Error(`R2上传失败: ${uploadResult.error}`);
      }

      const metadata: BackupMetadata = {
        backupId,
        timestamp,
        date,
        size: backupSize,
        tableCount: this.TABLES_TO_BACKUP.length,
        recordCount: totalRecords,
        status: 'completed'
      };

      // 保存备份元数据到数据库
      await this.saveBackupMetadata(metadata, r2Key);

      console.log(`✅ 备份创建成功: ${backupId}`);

      return {
        success: true,
        backupId,
        metadata,
        r2Key
      };

    } catch (error) {
      console.error(`❌ 备份创建失败:`, error);
      
      return {
        success: false,
        backupId,
        metadata: {
          backupId,
          timestamp,
          date,
          size: 0,
          tableCount: 0,
          recordCount: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误'
        },
        r2Key: '',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 从备份恢复数据库
   */
  async restoreFromBackup(backupId: string): Promise<RestoreResult> {
    console.log(`🔄 开始恢复数据库: ${backupId}`);

    try {
      // 获取备份元数据
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error('备份不存在');
      }

      // 从R2下载备份文件
      const downloadResult = await this.r2Service.downloadFile(metadata.r2Key);
      if (!downloadResult.success || !downloadResult.content) {
        throw new Error('下载备份文件失败');
      }

      // 解析备份数据
      const backupJson = new TextDecoder().decode(downloadResult.content);
      const backupData = JSON.parse(backupJson);

      let restoredTables = 0;
      let restoredRecords = 0;

      // 恢复每个表
      for (const [tableName, records] of Object.entries(backupData.tables)) {
        if (!Array.isArray(records) || records.length === 0) {
          console.log(`  ⏭️  跳过空表: ${tableName}`);
          continue;
        }

        try {
          console.log(`  📥 恢复表: ${tableName} (${records.length} 条记录)`);

          // 清空现有数据
          await this.db.execute(`DELETE FROM ${tableName}`);

          // 批量插入数据
          for (const record of records as any[]) {
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = columns.map(() => '?').join(', ');

            await this.db.execute(
              `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
              values
            );
          }

          restoredTables++;
          restoredRecords += (records as any[]).length;
          console.log(`  ✅ ${tableName}: ${(records as any[]).length} 条记录已恢复`);

        } catch (error) {
          console.error(`  ❌ 恢复表 ${tableName} 失败:`, error);
        }
      }

      console.log(`✅ 数据库恢复完成: ${restoredTables} 个表, ${restoredRecords} 条记录`);

      return {
        success: true,
        restoredTables,
        restoredRecords
      };

    } catch (error) {
      console.error(`❌ 数据库恢复失败:`, error);
      return {
        success: false,
        restoredTables: 0,
        restoredRecords: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取所有备份列表
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backups = await this.db.query<any>(`
        SELECT * FROM database_backups
        ORDER BY timestamp DESC
        LIMIT 30
      `);

      return backups.map(b => ({
        backupId: b.backup_id,
        timestamp: b.timestamp,
        date: b.date,
        size: b.size,
        tableCount: b.table_count,
        recordCount: b.record_count,
        status: b.status,
        error: b.error
      }));
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 删除旧备份（保留最近7天）
   */
  async cleanupOldBackups(): Promise<number> {
    console.log('🧹 清理旧备份...');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

      // 获取要删除的备份
      const oldBackups = await this.db.query<any>(`
        SELECT backup_id, r2_key FROM database_backups
        WHERE date < ?
      `, [cutoffDate]);

      let deletedCount = 0;

      for (const backup of oldBackups) {
        try {
          // 从R2删除
          await this.r2Service.deleteFile(backup.r2_key);
          
          // 从数据库删除记录
          await this.db.execute(`
            DELETE FROM database_backups WHERE backup_id = ?
          `, [backup.backup_id]);

          deletedCount++;
          console.log(`  🗑️  已删除备份: ${backup.backup_id}`);
        } catch (error) {
          console.error(`  ❌ 删除备份失败 ${backup.backup_id}:`, error);
        }
      }

      console.log(`✅ 清理完成: 删除 ${deletedCount} 个旧备份`);
      return deletedCount;

    } catch (error) {
      console.error('清理旧备份失败:', error);
      return 0;
    }
  }

  /**
   * 保存备份元数据
   */
  private async saveBackupMetadata(metadata: BackupMetadata, r2Key: string): Promise<void> {
    await this.db.execute(`
      INSERT INTO database_backups (
        backup_id, timestamp, date, size, table_count, record_count, status, error, r2_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      metadata.backupId,
      metadata.timestamp,
      metadata.date,
      metadata.size,
      metadata.tableCount,
      metadata.recordCount,
      metadata.status,
      metadata.error || null,
      r2Key
    ]);
  }

  /**
   * 获取备份元数据
   */
  private async getBackupMetadata(backupId: string): Promise<any> {
    return await this.db.queryFirst(`
      SELECT * FROM database_backups WHERE backup_id = ?
    `, [backupId]);
  }
}

