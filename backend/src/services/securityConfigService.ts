/**
 * 安全配置管理服务
 * 提供动态安全开关控制和配置管理
 */

interface SecuritySwitchConfig {
  turnstile: {
    enabled: boolean;
    questionnaire: boolean;
    story: boolean;
    registration: boolean;
    login: boolean;
    bypassInDev: boolean;
  };
  rateLimit: {
    enabled: boolean;
    shortTerm: boolean;
    mediumTerm: boolean;
    longTerm: boolean;
    ipReputation: boolean;
    suspiciousDetection: boolean;
  };
  contentQuality: {
    enabled: boolean;
    duplicateCheck: boolean;
    spamDetection: boolean;
    qualityScore: boolean;
  };
  behaviorAnalysis: {
    enabled: boolean;
    mouseTracking: boolean;
    scrollTracking: boolean;
    timingAnalysis: boolean;
  };
  emergency: {
    enabled: boolean;
    blockAllSubmissions: boolean;
    strictMode: boolean;
    maintenanceMode: boolean;
  };
  debug: {
    enabled: boolean;
    logAllRequests: boolean;
    bypassAllChecks: boolean;
    verboseLogging: boolean;
  };
}

export class SecurityConfigService {
  private static instance: SecurityConfigService;
  private config: SecuritySwitchConfig;
  private environment: 'development' | 'staging' | 'production';
  private configHistory: Array<{ timestamp: number; config: SecuritySwitchConfig; operator: string }> = [];

  private constructor(env: string) {
    this.environment = this.detectEnvironment(env);
    this.config = this.getDefaultConfig();
    console.log(`🔧 安全配置服务初始化完成, 环境: ${this.environment}`);
  }

  public static getInstance(env?: string): SecurityConfigService {
    if (!SecurityConfigService.instance) {
      SecurityConfigService.instance = new SecurityConfigService(env || 'production');
    }
    return SecurityConfigService.instance;
  }

  /**
   * 检测运行环境
   */
  private detectEnvironment(env: string): 'development' | 'staging' | 'production' {
    if (env.includes('dev') || env.includes('local')) {
      return 'development';
    } else if (env.includes('staging') || env.includes('test')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): SecuritySwitchConfig {
    const isDev = this.environment === 'development';
    const isProd = this.environment === 'production';

    return {
      turnstile: {
        enabled: true,
        questionnaire: true,
        story: true,
        registration: true,
        login: isProd, // 生产环境启用登录验证
        bypassInDev: isDev
      },
      rateLimit: {
        enabled: true,
        shortTerm: true,
        mediumTerm: true,
        longTerm: true,
        ipReputation: isProd,
        suspiciousDetection: !isDev
      },
      contentQuality: {
        enabled: !isDev,
        duplicateCheck: true,
        spamDetection: isProd,
        qualityScore: isProd
      },
      behaviorAnalysis: {
        enabled: !isDev,
        mouseTracking: isProd,
        scrollTracking: isProd,
        timingAnalysis: isProd
      },
      emergency: {
        enabled: false,
        blockAllSubmissions: false,
        strictMode: false,
        maintenanceMode: false
      },
      debug: {
        enabled: isDev,
        logAllRequests: isDev,
        bypassAllChecks: false,
        verboseLogging: isDev
      }
    };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): SecuritySwitchConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: SecuritySwitchConfig, operator: string = 'system'): void {
    // 记录配置历史
    this.configHistory.push({
      timestamp: Date.now(),
      config: { ...this.config },
      operator
    });

    // 保留最近50条历史记录
    if (this.configHistory.length > 50) {
      this.configHistory = this.configHistory.slice(-50);
    }

    this.config = { ...newConfig };
    
    console.log(`🔧 安全配置已更新 by ${operator}:`, {
      turnstileEnabled: this.config.turnstile.enabled,
      rateLimitEnabled: this.config.rateLimit.enabled,
      emergencyMode: this.config.emergency.enabled,
      debugMode: this.config.debug.enabled
    });
  }

  /**
   * 重置为默认配置
   */
  public resetToDefault(operator: string = 'system'): void {
    const defaultConfig = this.getDefaultConfig();
    this.updateConfig(defaultConfig, operator);
    console.log(`🔄 安全配置已重置为默认值 by ${operator}`);
  }

  /**
   * 检查特定功能是否启用
   */
  public isEnabled(feature: string, subFeature?: string): boolean {
    // 开发环境绕过检查
    if (this.environment === 'development' && this.config.debug.bypassAllChecks) {
      return false; // 绕过所有检查
    }

    // 紧急模式检查
    if (this.config.emergency.enabled) {
      if (this.config.emergency.blockAllSubmissions) {
        return false; // 阻止所有提交
      }
      if (this.config.emergency.strictMode) {
        return true; // 严格模式，强制启用所有检查
      }
    }

    // 维护模式
    if (this.config.emergency.maintenanceMode) {
      return false;
    }

    // 检查具体功能
    switch (feature) {
      case 'turnstile':
        if (!this.config.turnstile.enabled) return false;
        if (this.environment === 'development' && this.config.turnstile.bypassInDev) return false;
        if (subFeature) {
          return this.config.turnstile[subFeature as keyof typeof this.config.turnstile] as boolean;
        }
        return true;

      case 'rateLimit':
        if (!this.config.rateLimit.enabled) return false;
        if (subFeature) {
          return this.config.rateLimit[subFeature as keyof typeof this.config.rateLimit] as boolean;
        }
        return true;

      case 'contentQuality':
        if (!this.config.contentQuality.enabled) return false;
        if (subFeature) {
          return this.config.contentQuality[subFeature as keyof typeof this.config.contentQuality] as boolean;
        }
        return true;

      case 'behaviorAnalysis':
        if (!this.config.behaviorAnalysis.enabled) return false;
        if (subFeature) {
          return this.config.behaviorAnalysis[subFeature as keyof typeof this.config.behaviorAnalysis] as boolean;
        }
        return true;

      case 'debug':
        return this.config.debug[subFeature as keyof typeof this.config.debug] as boolean;

      default:
        return false;
    }
  }

  /**
   * 获取环境信息
   */
  public getEnvironment(): string {
    return this.environment;
  }

  /**
   * 获取配置历史
   */
  public getConfigHistory(): Array<{ timestamp: number; config: SecuritySwitchConfig; operator: string }> {
    return [...this.configHistory];
  }

  /**
   * 获取配置统计
   */
  public getConfigStats(): {
    environment: string;
    totalSwitches: number;
    enabledSwitches: number;
    emergencyMode: boolean;
    debugMode: boolean;
    lastUpdate: number | null;
  } {
    const flatConfig = this.flattenConfig(this.config);
    const enabledCount = Object.values(flatConfig).filter(Boolean).length;
    const lastUpdate = this.configHistory.length > 0 
      ? this.configHistory[this.configHistory.length - 1].timestamp 
      : null;

    return {
      environment: this.environment,
      totalSwitches: Object.keys(flatConfig).length,
      enabledSwitches: enabledCount,
      emergencyMode: this.config.emergency.enabled,
      debugMode: this.config.debug.enabled,
      lastUpdate
    };
  }

  /**
   * 扁平化配置对象
   */
  private flattenConfig(config: SecuritySwitchConfig): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    
    Object.entries(config).forEach(([category, settings]) => {
      Object.entries(settings).forEach(([key, value]) => {
        result[`${category}.${key}`] = value as boolean;
      });
    });
    
    return result;
  }

  /**
   * 验证配置有效性
   */
  public validateConfig(config: SecuritySwitchConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查必需的配置结构
    const requiredCategories = ['turnstile', 'rateLimit', 'contentQuality', 'behaviorAnalysis', 'emergency', 'debug'];
    for (const category of requiredCategories) {
      if (!config[category as keyof SecuritySwitchConfig]) {
        errors.push(`缺少配置类别: ${category}`);
      }
    }

    // 检查生产环境的安全要求
    if (this.environment === 'production') {
      if (!config.turnstile.enabled && !config.rateLimit.enabled) {
        errors.push('生产环境必须启用Turnstile或频率限制中的至少一项');
      }
      
      if (config.debug.bypassAllChecks) {
        errors.push('生产环境不允许绕过所有安全检查');
      }
    }

    // 检查紧急模式的一致性
    if (config.emergency.blockAllSubmissions && !config.emergency.enabled) {
      errors.push('启用阻止所有提交时必须同时启用紧急模式');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 紧急停止所有防护
   */
  public emergencyStop(operator: string): void {
    const emergencyConfig = { ...this.config };
    emergencyConfig.turnstile.enabled = false;
    emergencyConfig.rateLimit.enabled = false;
    emergencyConfig.contentQuality.enabled = false;
    emergencyConfig.behaviorAnalysis.enabled = false;
    emergencyConfig.emergency.enabled = true;
    emergencyConfig.debug.bypassAllChecks = true;

    this.updateConfig(emergencyConfig, operator);
    console.log(`🚨 紧急停止所有安全防护 by ${operator}`);
  }

  /**
   * 启用严格模式
   */
  public enableStrictMode(operator: string): void {
    const strictConfig = { ...this.config };
    strictConfig.turnstile.enabled = true;
    strictConfig.turnstile.questionnaire = true;
    strictConfig.turnstile.story = true;
    strictConfig.turnstile.registration = true;
    strictConfig.turnstile.login = true;
    strictConfig.rateLimit.enabled = true;
    strictConfig.rateLimit.shortTerm = true;
    strictConfig.rateLimit.mediumTerm = true;
    strictConfig.rateLimit.longTerm = true;
    strictConfig.contentQuality.enabled = true;
    strictConfig.emergency.enabled = true;
    strictConfig.emergency.strictMode = true;
    strictConfig.debug.bypassAllChecks = false;

    this.updateConfig(strictConfig, operator);
    console.log(`🔒 启用严格安全模式 by ${operator}`);
  }
}

// 导出单例实例
export const securityConfig = SecurityConfigService.getInstance(process.env.NODE_ENV);

// 便捷的检查函数
export const isSecurityEnabled = (feature: string, subFeature?: string): boolean => {
  return securityConfig.isEnabled(feature, subFeature);
};

export default SecurityConfigService;
