/**
 * Cloudflare Turnstile 验证服务
 * 提供服务端token验证和威胁检测功能
 */

interface TurnstileVerificationResult {
  success: boolean;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
  action?: string;
  cdata?: string;
  metadata?: {
    interactive: boolean;
  };
}

interface TurnstileVerificationOptions {
  remoteIP?: string;
  idempotencyKey?: string;
}

export class TurnstileService {
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  private readonly cache = new Map<string, { result: TurnstileVerificationResult; timestamp: number }>();
  private readonly cacheTimeout = 300000; // 5分钟缓存

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * 验证Turnstile token
   */
  async verifyToken(
    token: string, 
    options: TurnstileVerificationOptions = {}
  ): Promise<TurnstileVerificationResult> {
    if (!token) {
      return {
        success: false,
        errorCodes: ['missing-input-response']
      };
    }

    // 检查缓存
    const cacheKey = `${token}:${options.remoteIP || 'unknown'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('使用缓存的Turnstile验证结果');
      return cached.result;
    }

    try {
      const formData = new FormData();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      
      if (options.remoteIP) {
        formData.append('remoteip', options.remoteIP);
      }

      if (options.idempotencyKey) {
        formData.append('idempotency_key', options.idempotencyKey);
      }

      console.log('发送Turnstile验证请求:', {
        token: token.substring(0, 20) + '...',
        remoteIP: options.remoteIP,
        idempotencyKey: options.idempotencyKey
      });

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'Cloudflare-Turnstile-Verifier/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: TurnstileVerificationResult = await response.json();

      console.log('Turnstile验证结果:', {
        success: result.success,
        errorCodes: result.errorCodes,
        action: result.action,
        hostname: result.hostname,
        interactive: result.metadata?.interactive
      });

      // 缓存结果
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      // 清理过期缓存
      this.cleanExpiredCache();

      return result;
    } catch (error) {
      console.error('Turnstile验证请求失败:', error);
      return {
        success: false,
        errorCodes: ['network-error']
      };
    }
  }

  /**
   * 验证特定action的token
   */
  async verifyActionToken(
    token: string,
    expectedAction: string,
    options: TurnstileVerificationOptions = {}
  ): Promise<{ success: boolean; reason?: string; details?: any }> {
    const result = await this.verifyToken(token, options);

    if (!result.success) {
      return {
        success: false,
        reason: this.getErrorMessage(result.errorCodes),
        details: result
      };
    }

    // 检查action匹配
    if (result.action && result.action !== expectedAction) {
      return {
        success: false,
        reason: `Action不匹配: 期望 ${expectedAction}, 实际 ${result.action}`,
        details: result
      };
    }

    return {
      success: true,
      details: result
    };
  }

  /**
   * 批量验证tokens
   */
  async verifyTokens(
    tokens: Array<{ token: string; action?: string; options?: TurnstileVerificationOptions }>
  ): Promise<Array<{ success: boolean; reason?: string; details?: any }>> {
    const promises = tokens.map(({ token, action, options = {} }) => {
      if (action) {
        return this.verifyActionToken(token, action, options);
      } else {
        return this.verifyToken(token, options).then(result => ({
          success: result.success,
          reason: result.success ? undefined : this.getErrorMessage(result.errorCodes),
          details: result
        }));
      }
    });

    return Promise.all(promises);
  }

  /**
   * 获取验证统计信息
   */
  getVerificationStats(): {
    totalCached: number;
    cacheHitRate: number;
    recentVerifications: number;
  } {
    const now = Date.now();
    const recentThreshold = now - 3600000; // 1小时内
    
    let recentCount = 0;
    for (const [, cached] of this.cache) {
      if (cached.timestamp > recentThreshold) {
        recentCount++;
      }
    }

    return {
      totalCached: this.cache.size,
      cacheHitRate: 0, // 需要额外统计来计算
      recentVerifications: recentCount
    };
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.cache) {
      if (now - cached.timestamp > this.cacheTimeout) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`清理了 ${expiredKeys.length} 个过期的Turnstile缓存`);
    }
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(errorCodes?: string[]): string {
    if (!errorCodes || errorCodes.length === 0) {
      return '未知错误';
    }

    const errorMessages: Record<string, string> = {
      'missing-input-secret': '缺少密钥',
      'invalid-input-secret': '无效密钥',
      'missing-input-response': '缺少响应token',
      'invalid-input-response': '无效响应token',
      'bad-request': '请求格式错误',
      'timeout-or-duplicate': 'token超时或重复使用',
      'internal-error': '内部服务器错误',
      'network-error': '网络连接错误'
    };

    return errorCodes
      .map(code => errorMessages[code] || `未知错误代码: ${code}`)
      .join(', ');
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Turnstile验证缓存已清空');
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Turnstile验证结果分析器
 */
export class TurnstileAnalyzer {
  /**
   * 分析验证结果的安全级别
   */
  static analyzeSecurityLevel(result: TurnstileVerificationResult): {
    level: 'high' | 'medium' | 'low';
    score: number;
    factors: string[];
  } {
    const factors: string[] = [];
    let score = 0;

    if (!result.success) {
      return {
        level: 'low',
        score: 0,
        factors: ['验证失败']
      };
    }

    // 交互性检查
    if (result.metadata?.interactive === false) {
      score += 30;
      factors.push('无感验证通过');
    } else {
      score += 20;
      factors.push('交互验证通过');
    }

    // 时间戳检查
    if (result.challengeTs) {
      const challengeTime = new Date(result.challengeTs).getTime();
      const now = Date.now();
      const timeDiff = now - challengeTime;
      
      if (timeDiff < 60000) { // 1分钟内
        score += 25;
        factors.push('验证时间新鲜');
      } else if (timeDiff < 300000) { // 5分钟内
        score += 15;
        factors.push('验证时间较新');
      } else {
        score += 5;
        factors.push('验证时间较旧');
      }
    }

    // Action检查
    if (result.action) {
      score += 20;
      factors.push('包含action验证');
    }

    // 主机名检查
    if (result.hostname) {
      score += 15;
      factors.push('主机名验证');
    }

    // 自定义数据检查
    if (result.cdata) {
      score += 10;
      factors.push('包含自定义数据');
    }

    // 确定安全级别
    let level: 'high' | 'medium' | 'low';
    if (score >= 80) {
      level = 'high';
    } else if (score >= 50) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { level, score, factors };
  }

  /**
   * 检查是否为可疑验证
   */
  static isSuspiciousVerification(result: TurnstileVerificationResult): {
    suspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (!result.success) {
      return { suspicious: true, reasons: ['验证失败'] };
    }

    // 检查时间戳异常
    if (result.challengeTs) {
      const challengeTime = new Date(result.challengeTs).getTime();
      const now = Date.now();
      const timeDiff = now - challengeTime;
      
      if (timeDiff > 600000) { // 10分钟前
        reasons.push('验证时间过旧');
      }
      
      if (timeDiff < 0) { // 未来时间
        reasons.push('验证时间异常');
      }
    }

    // 检查主机名异常
    if (result.hostname && !this.isValidHostname(result.hostname)) {
      reasons.push('主机名异常');
    }

    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }

  private static isValidHostname(hostname: string): boolean {
    // 简单的主机名验证逻辑
    const validPatterns = [
      /^localhost$/,
      /^[\w-]+\.[\w-]+\.[\w-]+$/,
      /^[\w-]+\.pages\.dev$/,
      /^[\w-]+\.workers\.dev$/
    ];

    return validPatterns.some(pattern => pattern.test(hostname));
  }
}

export default TurnstileService;
