/**
 * 统一用户ID生成服务
 * 支持3种用户创建模式的ID生成和管理
 */

import type { D1Database } from '@cloudflare/workers-types';
import { generateUUID } from '../utils/uuid';

// 用户创建模式
export type UserCreationMode = 'manual' | 'google_oauth' | 'auto_register';

// 用户ID生成参数
export interface UserIdGenerationParams {
  creationMode: UserCreationMode;
  userInput?: string; // 手动创建时的用户输入
  googleId?: string; // Google OAuth的用户ID
  email?: string; // 邮箱地址
  preferredPrefix?: string; // 首选前缀（1-9）
  metadata?: Record<string, any>; // 额外元数据
}

// 用户ID生成结果
export interface UserIdGenerationResult {
  success: boolean;
  userId: string;
  uuid: string;
  prefix?: string;
  creationMode: UserCreationMode;
  generationMethod: string;
  collisionCount: number;
  error?: string;
  metadata?: Record<string, any>;
}

// 前缀使用情况
export interface PrefixUsageInfo {
  prefix: string;
  usageCount: number;
  isAvailable: boolean;
  lastUsedAt?: string;
}

export class UnifiedUserIdService {
  constructor(private db: D1Database) {}

  /**
   * 生成用户ID
   */
  async generateUserId(params: UserIdGenerationParams): Promise<UserIdGenerationResult> {
    const { creationMode } = params;

    try {
      switch (creationMode) {
        case 'manual':
          return await this.generateManualUserId(params);
        case 'google_oauth':
          return await this.generateGoogleOAuthUserId(params);
        case 'auto_register':
          return await this.generateAutoRegisterUserId(params);
        default:
          throw new Error(`不支持的创建模式: ${creationMode}`);
      }
    } catch (error) {
      console.error('用户ID生成失败:', error);
      return {
        success: false,
        userId: '',
        uuid: '',
        creationMode,
        generationMethod: 'error',
        collisionCount: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 手动创建用户ID
   */
  private async generateManualUserId(params: UserIdGenerationParams): Promise<UserIdGenerationResult> {
    const { userInput, email } = params;
    
    if (!userInput && !email) {
      throw new Error('手动创建模式需要提供用户名或邮箱');
    }

    const userId = userInput || email!;
    const uuid = generateUUID('manual');

    // 检查用户名是否已存在
    const existingUser = await this.db.prepare(`
      SELECT uuid FROM universal_users 
      WHERE username = ? OR email = ?
    `).bind(userId, email).first();

    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    // 记录生成历史
    await this.recordGenerationHistory({
      userUuid: uuid,
      creationMode: 'manual',
      generatedId: userId,
      generationMethod: 'user_input',
      success: true
    });

    return {
      success: true,
      userId,
      uuid,
      creationMode: 'manual',
      generationMethod: 'user_input',
      collisionCount: 0,
      metadata: { email }
    };
  }

  /**
   * Google OAuth用户ID生成
   */
  private async generateGoogleOAuthUserId(params: UserIdGenerationParams): Promise<UserIdGenerationResult> {
    const { googleId, email } = params;
    
    if (!googleId) {
      throw new Error('Google OAuth模式需要提供Google ID');
    }

    const userId = `google_${googleId}`;
    const uuid = generateUUID('google');

    // 检查Google ID是否已存在
    const existingUser = await this.db.prepare(`
      SELECT uuid FROM universal_users WHERE google_id = ?
    `).bind(googleId).first();

    if (existingUser) {
      throw new Error('Google账号已关联其他用户');
    }

    // 记录生成历史
    await this.recordGenerationHistory({
      userUuid: uuid,
      creationMode: 'google_oauth',
      generatedId: userId,
      generationMethod: 'google_oauth',
      success: true
    });

    return {
      success: true,
      userId,
      uuid,
      creationMode: 'google_oauth',
      generationMethod: 'google_oauth',
      collisionCount: 0,
      metadata: { googleId, email }
    };
  }

  /**
   * 自动注册用户ID生成（1-9前缀）
   */
  private async generateAutoRegisterUserId(params: UserIdGenerationParams): Promise<UserIdGenerationResult> {
    const { preferredPrefix } = params;
    
    // 获取可用前缀
    const availablePrefix = await this.getAvailablePrefix(preferredPrefix);
    if (!availablePrefix) {
      throw new Error('没有可用的前缀');
    }

    const uuid = generateUUID('auto_register');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const userId = `${availablePrefix}_${timestamp}_${randomSuffix}`;

    let collisionCount = 0;
    let finalUserId = userId;

    // 检查ID冲突并重试
    while (await this.checkUserIdExists(finalUserId)) {
      collisionCount++;
      if (collisionCount > 5) {
        throw new Error('生成用户ID失败，冲突次数过多');
      }
      const newRandomSuffix = Math.random().toString(36).substring(2, 8);
      finalUserId = `${availablePrefix}_${timestamp}_${newRandomSuffix}`;
    }

    // 记录生成历史
    await this.recordGenerationHistory({
      userUuid: uuid,
      creationMode: 'auto_register',
      generatedId: finalUserId,
      prefixUsed: availablePrefix,
      generationMethod: 'prefix_timestamp_random',
      collisionCount,
      success: true
    });

    return {
      success: true,
      userId: finalUserId,
      uuid,
      prefix: availablePrefix,
      creationMode: 'auto_register',
      generationMethod: 'prefix_timestamp_random',
      collisionCount
    };
  }

  /**
   * 获取可用前缀
   */
  private async getAvailablePrefix(preferredPrefix?: string): Promise<string | null> {
    // 如果指定了首选前缀，先检查是否可用
    if (preferredPrefix) {
      const prefixInfo = await this.db.prepare(`
        SELECT is_available FROM prefix_usage_stats 
        WHERE prefix = ? AND creation_mode = 'auto_register'
      `).bind(preferredPrefix).first();

      if (prefixInfo?.is_available) {
        return preferredPrefix;
      }
    }

    // 获取使用次数最少的可用前缀
    const availablePrefix = await this.db.prepare(`
      SELECT prefix FROM prefix_usage_stats 
      WHERE creation_mode = 'auto_register' AND is_available = 1
      ORDER BY usage_count ASC, RANDOM()
      LIMIT 1
    `).first();

    return availablePrefix?.prefix || null;
  }

  /**
   * 检查用户ID是否已存在
   */
  private async checkUserIdExists(userId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT 1 FROM universal_users WHERE username = ?
    `).bind(userId).first();

    return !!result;
  }

  /**
   * 记录生成历史
   */
  private async recordGenerationHistory(params: {
    userUuid: string;
    creationMode: UserCreationMode;
    generatedId: string;
    prefixUsed?: string;
    generationMethod: string;
    collisionCount?: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const {
      userUuid,
      creationMode,
      generatedId,
      prefixUsed,
      generationMethod,
      collisionCount = 0,
      success,
      errorMessage
    } = params;

    await this.db.prepare(`
      INSERT INTO user_id_generation_history (
        user_uuid, creation_mode, generated_id, prefix_used,
        generation_method, collision_count, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userUuid,
      creationMode,
      generatedId,
      prefixUsed || null,
      generationMethod,
      collisionCount,
      success ? 1 : 0,
      errorMessage || null
    ).run();
  }

  /**
   * 获取前缀使用统计
   */
  async getPrefixUsageStats(): Promise<PrefixUsageInfo[]> {
    const results = await this.db.prepare(`
      SELECT prefix, usage_count, is_available, last_used_at
      FROM prefix_usage_stats
      WHERE creation_mode = 'auto_register'
      ORDER BY prefix
    `).all();

    return results.results.map(row => ({
      prefix: row.prefix as string,
      usageCount: row.usage_count as number,
      isAvailable: !!row.is_available,
      lastUsedAt: row.last_used_at as string | undefined
    }));
  }

  /**
   * 重置前缀可用性
   */
  async resetPrefixAvailability(prefix: string): Promise<void> {
    await this.db.prepare(`
      UPDATE prefix_usage_stats 
      SET is_available = 1, updated_at = CURRENT_TIMESTAMP
      WHERE prefix = ? AND creation_mode = 'auto_register'
    `).bind(prefix).run();
  }

  /**
   * 获取用户创建统计
   */
  async getUserCreationStats(): Promise<Record<UserCreationMode, number>> {
    const results = await this.db.prepare(`
      SELECT creation_mode, COUNT(*) as count
      FROM universal_users
      GROUP BY creation_mode
    `).all();

    const stats: Record<UserCreationMode, number> = {
      manual: 0,
      google_oauth: 0,
      auto_register: 0
    };

    results.results.forEach(row => {
      const mode = row.creation_mode as UserCreationMode;
      stats[mode] = row.count as number;
    });

    return stats;
  }
}
