/**
 * 双因素认证服务
 * 处理TOTP、SMS、邮箱验证等2FA功能
 */

import { generateUUID } from '../utils/uuid';

export interface TwoFactorSetup {
  userUuid: string;
  method: 'totp' | 'sms' | 'email' | 'backup_codes';
  secretKey?: string;
  phoneNumber?: string;
  emailAddress?: string;
  backupCodes?: string[];
}

export interface TwoFactorVerification {
  userUuid: string;
  code: string;
  method: string;
  verificationType: 'login' | 'admin_action' | 'settings_change';
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  isVerified: boolean;
  method: string;
  setupCompleted: boolean;
  lastUsed?: string;
  backupCodesRemaining: number;
  trustedDevices: string[];
}

export class TwoFactorAuthService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 生成TOTP密钥
   */
  generateTOTPSecret(): string {
    // 生成32字符的Base32密钥
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * 生成备用代码
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 生成8位数字代码
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  }

  /**
   * 设置双因素认证
   */
  async setupTwoFactor(setup: TwoFactorSetup): Promise<{
    success: boolean;
    secretKey?: string;
    backupCodes?: string[];
    qrCodeUrl?: string;
  }> {
    try {
      const existingSetup = await this.db.queryFirst(
        'SELECT id FROM two_factor_auth WHERE user_uuid = ?',
        [setup.userUuid]
      );

      let secretKey = setup.secretKey;
      let backupCodes = setup.backupCodes;

      // 为TOTP生成密钥
      if (setup.method === 'totp' && !secretKey) {
        secretKey = this.generateTOTPSecret();
      }

      // 生成备用代码
      if (!backupCodes) {
        backupCodes = this.generateBackupCodes();
      }

      const setupData = {
        id: generateUUID('2fa'),
        userUuid: setup.userUuid,
        method: setup.method,
        secretKey: secretKey || null,
        phoneNumber: setup.phoneNumber || null,
        emailAddress: setup.emailAddress || null,
        backupCodes: JSON.stringify(backupCodes),
        backupCodesUsed: JSON.stringify([]),
        isEnabled: false, // 需要验证后才启用
        isVerified: false
      };

      if (existingSetup) {
        // 更新现有设置
        await this.db.execute(`
          UPDATE two_factor_auth 
          SET method = ?, secret_key = ?, phone_number = ?, email_address = ?,
              backup_codes = ?, backup_codes_used = ?, is_enabled = ?, is_verified = ?
          WHERE user_uuid = ?
        `, [
          setupData.method, setupData.secretKey, setupData.phoneNumber,
          setupData.emailAddress, setupData.backupCodes, setupData.backupCodesUsed,
          setupData.isEnabled, setupData.isVerified, setupData.userUuid
        ]);
      } else {
        // 创建新设置
        await this.db.execute(`
          INSERT INTO two_factor_auth (
            id, user_uuid, method, secret_key, phone_number, email_address,
            backup_codes, backup_codes_used, is_enabled, is_verified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          setupData.id, setupData.userUuid, setupData.method, setupData.secretKey,
          setupData.phoneNumber, setupData.emailAddress, setupData.backupCodes,
          setupData.backupCodesUsed, setupData.isEnabled, setupData.isVerified
        ]);
      }

      // 生成QR码URL（用于TOTP）
      let qrCodeUrl;
      if (setup.method === 'totp' && secretKey) {
        const appName = '大学生就业问卷调查平台';
        const userLabel = `${appName}:${setup.userUuid}`;
        qrCodeUrl = `otpauth://totp/${encodeURIComponent(userLabel)}?secret=${secretKey}&issuer=${encodeURIComponent(appName)}`;
      }

      return {
        success: true,
        secretKey,
        backupCodes,
        qrCodeUrl
      };

    } catch (error) {
      console.error('Setup 2FA error:', error);
      return { success: false };
    }
  }

  /**
   * 验证双因素认证代码
   */
  async verifyTwoFactor(verification: TwoFactorVerification): Promise<{
    success: boolean;
    message: string;
    isSetupComplete?: boolean;
  }> {
    try {
      const setup = await this.db.queryFirst(`
        SELECT 
          id, method, secret_key as secretKey, phone_number as phoneNumber,
          email_address as emailAddress, backup_codes as backupCodes,
          backup_codes_used as backupCodesUsed, is_enabled as isEnabled,
          is_verified as isVerified
        FROM two_factor_auth 
        WHERE user_uuid = ?
      `, [verification.userUuid]);

      if (!setup) {
        return { success: false, message: '未设置双因素认证' };
      }

      let isValid = false;
      let usedBackupCode = false;

      // 验证TOTP代码
      if (setup.method === 'totp' && setup.secretKey) {
        isValid = this.verifyTOTPCode(verification.code, setup.secretKey);
      }

      // 验证备用代码
      if (!isValid && setup.backupCodes) {
        const backupCodes = JSON.parse(setup.backupCodes);
        const usedCodes = JSON.parse(setup.backupCodesUsed || '[]');
        
        if (backupCodes.includes(verification.code) && !usedCodes.includes(verification.code)) {
          isValid = true;
          usedBackupCode = true;
          
          // 标记备用代码为已使用
          usedCodes.push(verification.code);
          await this.db.execute(`
            UPDATE two_factor_auth 
            SET backup_codes_used = ? 
            WHERE user_uuid = ?
          `, [JSON.stringify(usedCodes), verification.userUuid]);
        }
      }

      // 记录验证尝试
      await this.recordVerificationAttempt(verification, isValid);

      if (isValid) {
        // 如果是首次验证，启用2FA
        if (!setup.isVerified) {
          await this.db.execute(`
            UPDATE two_factor_auth 
            SET is_enabled = 1, is_verified = 1, setup_completed_at = CURRENT_TIMESTAMP,
                last_used_at = CURRENT_TIMESTAMP
            WHERE user_uuid = ?
          `, [verification.userUuid]);
          
          return { 
            success: true, 
            message: '双因素认证设置完成', 
            isSetupComplete: true 
          };
        } else {
          // 更新最后使用时间
          await this.db.execute(`
            UPDATE two_factor_auth 
            SET last_used_at = CURRENT_TIMESTAMP 
            WHERE user_uuid = ?
          `, [verification.userUuid]);
          
          const message = usedBackupCode ? 
            '备用代码验证成功（请注意备用代码只能使用一次）' : 
            '双因素认证验证成功';
          
          return { success: true, message };
        }
      } else {
        return { success: false, message: '验证码错误' };
      }

    } catch (error) {
      console.error('Verify 2FA error:', error);
      return { success: false, message: '验证失败，请稍后重试' };
    }
  }

  /**
   * 验证TOTP代码
   */
  private verifyTOTPCode(code: string, secret: string): boolean {
    // 简化的TOTP验证实现
    // 实际项目中应该使用专业的TOTP库，如 speakeasy
    try {
      const timeStep = 30; // 30秒时间窗口
      const currentTime = Math.floor(Date.now() / 1000);
      const timeWindow = Math.floor(currentTime / timeStep);
      
      // 检查当前时间窗口和前后各一个窗口（允许时间偏差）
      for (let i = -1; i <= 1; i++) {
        const testWindow = timeWindow + i;
        const expectedCode = this.generateTOTPCode(secret, testWindow);
        if (code === expectedCode) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * 生成TOTP代码（简化实现）
   */
  private generateTOTPCode(secret: string, timeWindow: number): string {
    // 这是一个简化的实现，实际项目中应该使用标准的TOTP算法
    // 这里只是为了演示，返回一个基于时间窗口的6位数字
    const hash = this.simpleHash(secret + timeWindow.toString());
    const code = (hash % 1000000).toString().padStart(6, '0');
    return code;
  }

  /**
   * 简单哈希函数（仅用于演示）
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 记录验证尝试
   */
  private async recordVerificationAttempt(
    verification: TwoFactorVerification, 
    isSuccessful: boolean
  ): Promise<void> {
    const recordId = generateUUID('2fa_verify');
    
    await this.db.execute(`
      INSERT INTO two_factor_verifications (
        id, user_uuid, verification_type, method_used, code_entered,
        is_successful, failure_reason, ip_address, user_agent, session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recordId, verification.userUuid, verification.verificationType,
      verification.method, verification.code, isSuccessful,
      isSuccessful ? null : 'Invalid code', verification.ipAddress,
      verification.userAgent, verification.sessionId
    ]);
  }

  /**
   * 获取用户2FA状态
   */
  async getTwoFactorStatus(userUuid: string): Promise<TwoFactorStatus | null> {
    try {
      const setup = await this.db.queryFirst(`
        SELECT 
          is_enabled as isEnabled, is_verified as isVerified, method,
          setup_completed_at as setupCompleted, last_used_at as lastUsed,
          backup_codes as backupCodes, backup_codes_used as backupCodesUsed,
          trusted_devices as trustedDevices
        FROM two_factor_auth 
        WHERE user_uuid = ?
      `, [userUuid]);

      if (!setup) {
        return null;
      }

      const backupCodes = JSON.parse(setup.backupCodes || '[]');
      const usedCodes = JSON.parse(setup.backupCodesUsed || '[]');
      const trustedDevices = JSON.parse(setup.trustedDevices || '[]');

      return {
        isEnabled: setup.isEnabled,
        isVerified: setup.isVerified,
        method: setup.method,
        setupCompleted: !!setup.setupCompleted,
        lastUsed: setup.lastUsed,
        backupCodesRemaining: backupCodes.length - usedCodes.length,
        trustedDevices
      };

    } catch (error) {
      console.error('Get 2FA status error:', error);
      return null;
    }
  }

  /**
   * 禁用双因素认证
   */
  async disableTwoFactor(userUuid: string): Promise<boolean> {
    try {
      await this.db.execute(`
        UPDATE two_factor_auth 
        SET is_enabled = 0, is_verified = 0 
        WHERE user_uuid = ?
      `, [userUuid]);
      
      return true;
    } catch (error) {
      console.error('Disable 2FA error:', error);
      return false;
    }
  }

  /**
   * 重新生成备用代码
   */
  async regenerateBackupCodes(userUuid: string): Promise<string[] | null> {
    try {
      const newCodes = this.generateBackupCodes();
      
      await this.db.execute(`
        UPDATE two_factor_auth 
        SET backup_codes = ?, backup_codes_used = '[]' 
        WHERE user_uuid = ?
      `, [JSON.stringify(newCodes), userUuid]);
      
      return newCodes;
    } catch (error) {
      console.error('Regenerate backup codes error:', error);
      return null;
    }
  }

  /**
   * 检查是否需要2FA验证
   */
  async requiresTwoFactor(userUuid: string, actionType: string): Promise<boolean> {
    try {
      const setup = await this.db.queryFirst(`
        SELECT 
          is_enabled as isEnabled, require_for_login as requireForLogin,
          require_for_admin_actions as requireForAdminActions
        FROM two_factor_auth 
        WHERE user_uuid = ?
      `, [userUuid]);

      if (!setup || !setup.isEnabled) {
        return false;
      }

      switch (actionType) {
        case 'login':
          return setup.requireForLogin;
        case 'admin_action':
          return setup.requireForAdminActions;
        default:
          return false;
      }
    } catch (error) {
      console.error('Check 2FA requirement error:', error);
      return false;
    }
  }
}


