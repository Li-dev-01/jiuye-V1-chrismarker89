/**
 * 登录记录服务
 * 处理用户登录记录、IP追踪、安全分析等功能
 */

import { generateUUID } from '../utils/uuid';

export interface LoginRecordData {
  userUuid: string;
  userType: string;
  loginMethod: string;
  loginStatus: 'success' | 'failed' | 'blocked';
  ipAddress: string;
  userAgent?: string;
  googleEmail?: string;
  failureReason?: string;
  metadata?: any;
}

export interface DeviceInfo {
  deviceType: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
}

export class LoginRecordService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 记录登录事件
   */
  async recordLogin(data: LoginRecordData): Promise<string> {
    const recordId = generateUUID('login_record');
    const now = new Date().toISOString();

    // 解析设备信息
    const deviceInfo = this.parseUserAgent(data.userAgent || '');
    
    // 获取IP地理位置信息（简化版本）
    const locationInfo = await this.getLocationInfo(data.ipAddress);
    
    // 计算风险评分
    const riskScore = await this.calculateRiskScore(data);
    
    // 生成设备指纹
    const deviceFingerprint = this.generateDeviceFingerprint(data.userAgent || '', data.ipAddress);

    // 插入登录记录
    await this.db.execute(`
      INSERT INTO login_records (
        id, user_uuid, user_type, login_method, login_status,
        ip_address, ip_country, ip_region, ip_city, ip_isp,
        user_agent, device_type, browser_name, browser_version, os_name, os_version,
        device_fingerprint, login_time, is_suspicious, risk_score,
        google_email, failure_reason, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recordId, data.userUuid, data.userType, data.loginMethod, data.loginStatus,
      data.ipAddress, locationInfo.country, locationInfo.region, locationInfo.city, locationInfo.isp,
      data.userAgent, deviceInfo.deviceType, deviceInfo.browserName, deviceInfo.browserVersion,
      deviceInfo.osName, deviceInfo.osVersion, deviceFingerprint, now,
      riskScore > 50, riskScore, data.googleEmail, data.failureReason,
      JSON.stringify(data.metadata || {})
    ]);

    // 更新用户最后登录信息
    if (data.loginStatus === 'success') {
      await this.updateUserLastLogin(data, deviceInfo, locationInfo);
    }

    // 更新IP统计
    await this.updateIpStatistics(data, locationInfo);

    return recordId;
  }

  /**
   * 更新用户最后登录信息
   */
  private async updateUserLastLogin(
    data: LoginRecordData, 
    deviceInfo: DeviceInfo, 
    locationInfo: LocationInfo
  ): Promise<void> {
    const location = [locationInfo.city, locationInfo.region, locationInfo.country]
      .filter(Boolean).join(', ') || '未知位置';
    
    const device = `${deviceInfo.osName} ${deviceInfo.browserName}`;

    await this.db.execute(`
      INSERT OR REPLACE INTO user_last_login (
        user_uuid, last_login_time, last_login_ip, last_login_location,
        last_login_device, last_login_method, login_count,
        last_suspicious_login, suspicious_login_count
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT login_count FROM user_last_login WHERE user_uuid = ?), 0) + 1,
        CASE WHEN ? > 50 THEN ? ELSE (SELECT last_suspicious_login FROM user_last_login WHERE user_uuid = ?) END,
        CASE WHEN ? > 50 THEN COALESCE((SELECT suspicious_login_count FROM user_last_login WHERE user_uuid = ?), 0) + 1 
             ELSE COALESCE((SELECT suspicious_login_count FROM user_last_login WHERE user_uuid = ?), 0) END
      )
    `, [
      data.userUuid, new Date().toISOString(), data.ipAddress, location,
      device, data.loginMethod, data.userUuid,
      await this.calculateRiskScore(data), new Date().toISOString(), data.userUuid,
      await this.calculateRiskScore(data), data.userUuid, data.userUuid
    ]);
  }

  /**
   * 更新IP统计信息
   */
  private async updateIpStatistics(data: LoginRecordData, locationInfo: LocationInfo): Promise<void> {
    const now = new Date().toISOString();

    await this.db.execute(`
      INSERT OR REPLACE INTO ip_statistics (
        ip_address, first_seen, last_seen, total_attempts,
        successful_logins, failed_attempts, country, region, city, isp
      ) VALUES (
        ?, 
        COALESCE((SELECT first_seen FROM ip_statistics WHERE ip_address = ?), ?),
        ?,
        COALESCE((SELECT total_attempts FROM ip_statistics WHERE ip_address = ?), 0) + 1,
        CASE WHEN ? = 'success' THEN COALESCE((SELECT successful_logins FROM ip_statistics WHERE ip_address = ?), 0) + 1
             ELSE COALESCE((SELECT successful_logins FROM ip_statistics WHERE ip_address = ?), 0) END,
        CASE WHEN ? != 'success' THEN COALESCE((SELECT failed_attempts FROM ip_statistics WHERE ip_address = ?), 0) + 1
             ELSE COALESCE((SELECT failed_attempts FROM ip_statistics WHERE ip_address = ?), 0) END,
        ?, ?, ?, ?
      )
    `, [
      data.ipAddress, data.ipAddress, now, now, data.ipAddress,
      data.loginStatus, data.ipAddress, data.ipAddress,
      data.loginStatus, data.ipAddress, data.ipAddress,
      locationInfo.country, locationInfo.region, locationInfo.city, locationInfo.isp
    ]);
  }

  /**
   * 获取用户登录历史
   */
  async getUserLoginHistory(userUuid: string, limit: number = 10): Promise<any[]> {
    return await this.db.queryAll(`
      SELECT 
        id, login_time, ip_address, ip_city, ip_region, ip_country,
        device_type, browser_name, os_name, login_method, login_status,
        is_suspicious, risk_score
      FROM login_records 
      WHERE user_uuid = ? 
      ORDER BY login_time DESC 
      LIMIT ?
    `, [userUuid, limit]);
  }

  /**
   * 获取用户最后登录信息
   */
  async getUserLastLogin(userUuid: string): Promise<any> {
    return await this.db.queryFirst(`
      SELECT * FROM user_last_login WHERE user_uuid = ?
    `, [userUuid]);
  }

  /**
   * 检测异常登录
   */
  async detectAnomalousLogin(userUuid: string, currentIp: string): Promise<{
    isAnomalous: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // 获取用户历史登录信息
    const lastLogin = await this.getUserLastLogin(userUuid);
    const recentLogins = await this.db.queryAll(`
      SELECT DISTINCT ip_address, ip_country 
      FROM login_records 
      WHERE user_uuid = ? AND login_status = 'success' AND login_time > datetime('now', '-30 days')
    `, [userUuid]);

    if (lastLogin) {
      // 检查IP地址变化
      if (lastLogin.last_login_ip !== currentIp) {
        const isKnownIp = recentLogins.some((login: any) => login.ip_address === currentIp);
        if (!isKnownIp) {
          reasons.push('新的IP地址');
          riskScore += 30;
        }
      }

      // 检查登录频率
      const timeSinceLastLogin = Date.now() - new Date(lastLogin.last_login_time).getTime();
      if (timeSinceLastLogin < 5 * 60 * 1000) { // 5分钟内
        reasons.push('登录频率异常');
        riskScore += 20;
      }
    }

    // 检查IP风险
    const ipStats = await this.db.queryFirst(`
      SELECT failed_attempts, total_attempts, risk_score 
      FROM ip_statistics 
      WHERE ip_address = ?
    `, [currentIp]);

    if (ipStats) {
      const failureRate = ipStats.failed_attempts / ipStats.total_attempts;
      if (failureRate > 0.3) {
        reasons.push('IP地址失败率较高');
        riskScore += 25;
      }
      riskScore += ipStats.risk_score * 0.3;
    }

    return {
      isAnomalous: riskScore > 50,
      reasons,
      riskScore: Math.min(riskScore, 100)
    };
  }

  /**
   * 解析User-Agent
   */
  private parseUserAgent(userAgent: string): DeviceInfo {
    // 简化的User-Agent解析
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    
    let deviceType = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    // 浏览器检测
    let browserName = 'Unknown';
    let browserVersion = '';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    }

    // 操作系统检测
    let osName = 'Unknown';
    let osVersion = '';
    
    if (userAgent.includes('Windows')) {
      osName = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      osName = 'macOS';
    } else if (userAgent.includes('Linux')) {
      osName = 'Linux';
    } else if (userAgent.includes('Android')) {
      osName = 'Android';
    } else if (userAgent.includes('iOS')) {
      osName = 'iOS';
    }

    return {
      deviceType,
      browserName,
      browserVersion,
      osName,
      osVersion
    };
  }

  /**
   * 获取IP地理位置信息
   */
  private async getLocationInfo(ipAddress: string): Promise<LocationInfo> {
    // 简化版本，实际项目中可以集成第三方IP地理位置服务
    // 如：ipapi.co, ipgeolocation.io, maxmind等
    
    if (ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return {
        country: '本地网络',
        region: '内网',
        city: '本地',
        isp: '本地网络'
      };
    }

    // 这里可以调用真实的IP地理位置API
    return {
      country: '未知',
      region: '未知',
      city: '未知',
      isp: '未知'
    };
  }

  /**
   * 计算风险评分
   */
  private async calculateRiskScore(data: LoginRecordData): Promise<number> {
    let score = 0;

    // 基于登录方法的基础分数
    switch (data.loginMethod) {
      case 'ab_combination':
        score += 10;
        break;
      case 'google_oauth':
        score += 5;
        break;
      case 'password':
        score += 15;
        break;
    }

    // 检查IP历史
    const ipStats = await this.db.queryFirst(`
      SELECT failed_attempts, total_attempts 
      FROM ip_statistics 
      WHERE ip_address = ?
    `, [data.ipAddress]);

    if (ipStats && ipStats.total_attempts > 0) {
      const failureRate = ipStats.failed_attempts / ipStats.total_attempts;
      score += failureRate * 40;
    }

    return Math.min(score, 100);
  }

  /**
   * 生成设备指纹
   */
  private generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    // 简化的设备指纹生成
    const data = userAgent + ipAddress;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }
}


