/**
 * 前端API版本管理配置
 * 与后端版本管理系统保持同步
 */

// 支持的API版本
export const SUPPORTED_API_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = typeof SUPPORTED_API_VERSIONS[number];

// 默认API版本
export const DEFAULT_API_VERSION: ApiVersion = 'v1';

// 版本信息接口
export interface VersionInfo {
  version: ApiVersion;
  isSupported: boolean;
  isDeprecated: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  compatibleVersions: ApiVersion[];
  features: string[];
  description: string;
}

// 版本配置
export const VERSION_CONFIG: Record<ApiVersion, VersionInfo> = {
  v1: {
    version: 'v1',
    isSupported: true,
    isDeprecated: false,
    compatibleVersions: ['v1'],
    features: [
      '基础API功能',
      '用户认证',
      '问卷管理',
      '数据统计',
      '内容管理'
    ],
    description: '稳定版本，提供所有核心功能'
  },
  v2: {
    version: 'v2',
    isSupported: true,
    isDeprecated: false,
    compatibleVersions: ['v1', 'v2'],
    features: [
      '增强的API功能',
      '改进的错误处理',
      '更好的性能',
      '扩展的数据格式',
      '新的管理功能',
      '版本兼容性支持'
    ],
    description: '增强版本，向后兼容v1，提供更多功能和更好的性能'
  }
};

// 版本偏好设置
export interface VersionPreferences {
  preferredVersion: ApiVersion;
  autoUpgrade: boolean;
  fallbackToV1: boolean;
  showVersionWarnings: boolean;
}

// 默认版本偏好
export const DEFAULT_VERSION_PREFERENCES: VersionPreferences = {
  preferredVersion: DEFAULT_API_VERSION,
  autoUpgrade: false,
  fallbackToV1: true,
  showVersionWarnings: true
};

// 版本管理器类
export class ApiVersionManager {
  private currentVersion: ApiVersion;
  private preferences: VersionPreferences;
  private versionInfo: Record<ApiVersion, VersionInfo> | null = null;

  constructor(initialVersion: ApiVersion = DEFAULT_API_VERSION) {
    this.currentVersion = initialVersion;
    this.preferences = this.loadPreferences();
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): ApiVersion {
    return this.currentVersion;
  }

  /**
   * 设置当前版本
   */
  setCurrentVersion(version: ApiVersion): boolean {
    if (!SUPPORTED_API_VERSIONS.includes(version)) {
      console.warn(`不支持的API版本: ${version}`);
      return false;
    }

    this.currentVersion = version;
    this.savePreferences();
    return true;
  }

  /**
   * 获取版本信息
   */
  getVersionInfo(version?: ApiVersion): VersionInfo {
    const targetVersion = version || this.currentVersion;
    return VERSION_CONFIG[targetVersion];
  }

  /**
   * 获取所有支持的版本
   */
  getSupportedVersions(): ApiVersion[] {
    return [...SUPPORTED_API_VERSIONS];
  }

  /**
   * 检查版本兼容性
   */
  isVersionCompatible(requiredVersion: ApiVersion): boolean {
    const currentVersionInfo = this.getVersionInfo();
    return currentVersionInfo.compatibleVersions.includes(requiredVersion);
  }

  /**
   * 获取API端点URL
   */
  getApiEndpoint(path: string, version?: ApiVersion): string {
    const targetVersion = version || this.currentVersion;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';
    
    // 如果路径已经包含版本，直接返回
    if (path.startsWith('/api/v')) {
      return `${baseUrl}${path}`;
    }
    
    // 如果是v1版本，支持无版本前缀（向后兼容）
    if (targetVersion === 'v1') {
      return `${baseUrl}/api${path}`;
    }
    
    // 其他版本使用版本前缀
    return `${baseUrl}/api/${targetVersion}${path}`;
  }

  /**
   * 从服务器获取版本信息
   */
  async fetchVersionInfo(): Promise<Record<ApiVersion, VersionInfo> | null> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';
      const response = await fetch(`${baseUrl}/api/version`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data.versionInfo) {
        this.versionInfo = data.data.versionInfo;
        return this.versionInfo;
      } else {
        throw new Error('Invalid version info response');
      }
    } catch (error) {
      console.error('获取版本信息失败:', error);
      return null;
    }
  }

  /**
   * 检查版本是否已弃用
   */
  isVersionDeprecated(version?: ApiVersion): boolean {
    const targetVersion = version || this.currentVersion;
    const versionInfo = this.getVersionInfo(targetVersion);
    return versionInfo.isDeprecated;
  }

  /**
   * 获取推荐版本
   */
  getRecommendedVersion(): ApiVersion {
    // 返回最新的非弃用版本
    const supportedVersions = this.getSupportedVersions();
    for (let i = supportedVersions.length - 1; i >= 0; i--) {
      const version = supportedVersions[i];
      if (!this.isVersionDeprecated(version)) {
        return version;
      }
    }
    return DEFAULT_API_VERSION;
  }

  /**
   * 自动选择最佳版本
   */
  selectBestVersion(): ApiVersion {
    if (this.preferences.autoUpgrade) {
      return this.getRecommendedVersion();
    }
    return this.preferences.preferredVersion;
  }

  /**
   * 加载用户偏好
   */
  private loadPreferences(): VersionPreferences {
    try {
      const stored = localStorage.getItem('api_version_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_VERSION_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('加载版本偏好失败:', error);
    }
    return { ...DEFAULT_VERSION_PREFERENCES };
  }

  /**
   * 保存用户偏好
   */
  private savePreferences(): void {
    try {
      this.preferences.preferredVersion = this.currentVersion;
      localStorage.setItem('api_version_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('保存版本偏好失败:', error);
    }
  }

  /**
   * 更新偏好设置
   */
  updatePreferences(newPreferences: Partial<VersionPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  /**
   * 获取偏好设置
   */
  getPreferences(): VersionPreferences {
    return { ...this.preferences };
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults(): void {
    this.currentVersion = DEFAULT_API_VERSION;
    this.preferences = { ...DEFAULT_VERSION_PREFERENCES };
    this.savePreferences();
  }
}

// 创建全局版本管理器实例
export const apiVersionManager = new ApiVersionManager();

// 版本管理工具函数
export const versionUtils = {
  /**
   * 格式化版本显示
   */
  formatVersion(version: ApiVersion): string {
    const info = VERSION_CONFIG[version];
    return `${version.toUpperCase()}${info.isDeprecated ? ' (已弃用)' : ''}`;
  },

  /**
   * 获取版本颜色（用于UI显示）
   */
  getVersionColor(version: ApiVersion): string {
    const info = VERSION_CONFIG[version];
    if (info.isDeprecated) return '#ff4d4f'; // 红色
    if (version === 'v2') return '#52c41a'; // 绿色
    return '#1890ff'; // 蓝色
  },

  /**
   * 获取版本状态文本
   */
  getVersionStatus(version: ApiVersion): string {
    const info = VERSION_CONFIG[version];
    if (info.isDeprecated) return '已弃用';
    if (version === apiVersionManager.getRecommendedVersion()) return '推荐';
    return '稳定';
  },

  /**
   * 比较版本
   */
  compareVersions(v1: ApiVersion, v2: ApiVersion): number {
    const v1Index = SUPPORTED_API_VERSIONS.indexOf(v1);
    const v2Index = SUPPORTED_API_VERSIONS.indexOf(v2);
    return v1Index - v2Index;
  }
};

// 导出类型和常量
export type { VersionPreferences };
