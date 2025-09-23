/**
 * API版本管理中间件
 * 提供API版本控制和向后兼容性支持
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';

// 支持的API版本
export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

// 默认版本
export const DEFAULT_VERSION: ApiVersion = 'v1';

// 版本兼容性映射
export const VERSION_COMPATIBILITY: Record<ApiVersion, ApiVersion[]> = {
  v1: ['v1'],
  v2: ['v1', 'v2']
};

// 版本信息接口
export interface VersionInfo {
  version: ApiVersion;
  isSupported: boolean;
  isDeprecated: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  compatibleVersions: ApiVersion[];
}

// 版本配置
export const VERSION_CONFIG: Record<ApiVersion, VersionInfo> = {
  v1: {
    version: 'v1',
    isSupported: true,
    isDeprecated: false,
    compatibleVersions: ['v1']
  },
  v2: {
    version: 'v2',
    isSupported: true,
    isDeprecated: false,
    compatibleVersions: ['v1', 'v2']
  }
};

/**
 * 版本管理中间件
 */
export function versionMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const path = c.req.path;
    
    // 提取版本信息
    const versionMatch = path.match(/^\/api\/(v\d+)\//);
    const requestedVersion = versionMatch ? versionMatch[1] as ApiVersion : DEFAULT_VERSION;
    
    // 验证版本
    if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
      return c.json({
        success: false,
        error: {
          code: 'UNSUPPORTED_VERSION',
          message: `API版本 ${requestedVersion} 不受支持`,
          supportedVersions: SUPPORTED_VERSIONS,
          currentVersion: DEFAULT_VERSION
        },
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    // 检查版本是否已弃用
    const versionInfo = VERSION_CONFIG[requestedVersion];
    if (versionInfo.isDeprecated) {
      // 添加弃用警告头
      c.header('X-API-Deprecated', 'true');
      c.header('X-API-Deprecation-Date', versionInfo.deprecationDate || '');
      c.header('X-API-Sunset-Date', versionInfo.sunsetDate || '');
      c.header('X-API-Recommended-Version', DEFAULT_VERSION);
    }
    
    // 设置版本信息到上下文
    c.set('apiVersion', requestedVersion);
    c.set('versionInfo', versionInfo);
    
    // 添加版本相关的响应头
    c.header('X-API-Version', requestedVersion);
    c.header('X-API-Supported-Versions', SUPPORTED_VERSIONS.join(', '));
    
    await next();
  };
}

/**
 * 版本兼容性检查中间件
 */
export function versionCompatibilityMiddleware(requiredVersion: ApiVersion) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const currentVersion = c.get('apiVersion') as ApiVersion || DEFAULT_VERSION;
    const versionInfo = VERSION_CONFIG[currentVersion];
    
    if (!versionInfo.compatibleVersions.includes(requiredVersion)) {
      return c.json({
        success: false,
        error: {
          code: 'VERSION_INCOMPATIBLE',
          message: `当前版本 ${currentVersion} 与所需版本 ${requiredVersion} 不兼容`,
          currentVersion,
          requiredVersion,
          compatibleVersions: versionInfo.compatibleVersions
        },
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    await next();
  };
}

/**
 * 获取版本信息的工具函数
 */
export function getVersionFromContext(c: Context): ApiVersion {
  return c.get('apiVersion') as ApiVersion || DEFAULT_VERSION;
}

/**
 * 获取版本信息
 */
export function getVersionInfo(version: ApiVersion): VersionInfo | null {
  return VERSION_CONFIG[version] || null;
}

/**
 * 检查版本兼容性
 */
export function isVersionCompatible(currentVersion: ApiVersion, requiredVersion: ApiVersion): boolean {
  const versionInfo = VERSION_CONFIG[currentVersion];
  return versionInfo ? versionInfo.compatibleVersions.includes(requiredVersion) : false;
}

/**
 * 版本迁移助手
 */
export class VersionMigrationHelper {
  /**
   * 迁移请求数据格式
   */
  static migrateRequestData(data: any, fromVersion: ApiVersion, toVersion: ApiVersion): any {
    if (fromVersion === toVersion) {
      return data;
    }
    
    // v1 -> v2 迁移规则
    if (fromVersion === 'v1' && toVersion === 'v2') {
      return this.migrateV1ToV2Request(data);
    }
    
    return data;
  }
  
  /**
   * 迁移响应数据格式
   */
  static migrateResponseData(data: any, fromVersion: ApiVersion, toVersion: ApiVersion): any {
    if (fromVersion === toVersion) {
      return data;
    }
    
    // v2 -> v1 迁移规则（向后兼容）
    if (fromVersion === 'v2' && toVersion === 'v1') {
      return this.migrateV2ToV1Response(data);
    }
    
    return data;
  }
  
  /**
   * V1 到 V2 请求数据迁移
   */
  private static migrateV1ToV2Request(data: any): any {
    // 示例迁移规则
    if (data.questionnaire_id) {
      data.questionnaireId = data.questionnaire_id;
      delete data.questionnaire_id;
    }
    
    return data;
  }
  
  /**
   * V2 到 V1 响应数据迁移
   */
  private static migrateV2ToV1Response(data: any): any {
    // 示例迁移规则
    if (data.questionnaireId) {
      data.questionnaire_id = data.questionnaireId;
      delete data.questionnaireId;
    }
    
    return data;
  }
}

/**
 * 版本感知的响应包装器
 */
export function versionAwareResponse(c: Context, data: any, message?: string, statusCode: number = 200) {
  const version = getVersionFromContext(c);
  const versionInfo = getVersionInfo(version);
  
  // 根据版本调整响应格式
  const response = {
    success: true,
    data: VersionMigrationHelper.migrateResponseData(data, 'v2', version),
    message: message || 'Success',
    timestamp: new Date().toISOString(),
    version: version,
    ...(versionInfo?.isDeprecated && {
      deprecation: {
        deprecated: true,
        deprecationDate: versionInfo.deprecationDate,
        sunsetDate: versionInfo.sunsetDate,
        recommendedVersion: DEFAULT_VERSION
      }
    })
  };
  
  return c.json(response, statusCode);
}

/**
 * 版本感知的错误响应包装器
 */
export function versionAwareErrorResponse(
  c: Context, 
  error: string, 
  message: string, 
  statusCode: number = 500,
  details?: any
) {
  const version = getVersionFromContext(c);
  
  const response = {
    success: false,
    error: {
      code: error,
      message,
      details
    },
    timestamp: new Date().toISOString(),
    version: version
  };
  
  return c.json(response, statusCode);
}
