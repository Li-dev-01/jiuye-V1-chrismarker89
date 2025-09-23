/**
 * 全局ID映射注册表
 * 解决多套ID体系并存的问题，实现统一的ID映射管理
 */

// ===== 1. 全局ID映射接口定义 =====

export interface GlobalIdMapping {
  // 系统标识
  system: 'questionnaire' | 'story' | 'uuid' | 'content' | 'analytics';
  // 域标识
  domain: string;
  // ID映射关系
  mappings: IdMappingEntry[];
}

export interface IdMappingEntry {
  // 数据库字段名 (英文，下划线命名)
  databaseField: string;
  // API字段名 (英文，驼峰命名)
  apiField: string;
  // 前端标识 (英文，短横线命名)
  frontendId: string;
  // 显示键名 (用于国际化)
  displayKey: string;
  // 枚举类型 (可选)
  enumType?: string;
  // 旧版ID (用于兼容性)
  legacyIds?: string[];
}

// ===== 2. 问卷系统ID映射 =====

export const QUESTIONNAIRE_ID_MAPPINGS: GlobalIdMapping = {
  system: 'questionnaire',
  domain: 'employment-survey',
  mappings: [
    // 维度级别映射
    {
      databaseField: 'employment_overview',
      apiField: 'employmentStatus',
      frontendId: 'employment-overview',
      displayKey: 'dimension.employment.overview',
      legacyIds: ['employment-overview'] // 保持一致
    },
    {
      databaseField: 'demographics',
      apiField: 'genderDistribution,ageDistribution',
      frontendId: 'demographic-analysis',
      displayKey: 'dimension.demographic.analysis',
      legacyIds: ['demographics'] // 旧版ID
    },
    {
      databaseField: 'employment_market',
      apiField: 'employmentStatus',
      frontendId: 'employment-market-analysis',
      displayKey: 'dimension.employment.market',
      legacyIds: ['employment-market'] // 旧版ID
    },
    {
      databaseField: 'student_preparation',
      apiField: 'educationLevel',
      frontendId: 'student-employment-preparation',
      displayKey: 'dimension.student.preparation',
      legacyIds: ['student-preparation'] // 旧版ID
    },
    {
      databaseField: 'living_costs',
      apiField: 'livingCostPressure',
      frontendId: 'living-costs',
      displayKey: 'dimension.living.costs',
      legacyIds: ['living-costs']
    },
    {
      databaseField: 'policy_insights',
      apiField: 'policySuggestions',
      frontendId: 'policy-insights',
      displayKey: 'dimension.policy.insights',
      legacyIds: ['policy-insights']
    },
    
    // 问题级别映射
    {
      databaseField: 'current_status',
      apiField: 'employmentStatus',
      frontendId: 'current-status',
      displayKey: 'question.employment.status',
      enumType: 'EmploymentStatus'
    },
    {
      databaseField: 'gender',
      apiField: 'genderDistribution',
      frontendId: 'gender-distribution',
      displayKey: 'question.gender.distribution',
      enumType: 'Gender',
      legacyIds: ['gender']
    },
    {
      databaseField: 'age_range',
      apiField: 'ageDistribution',
      frontendId: 'age-distribution',
      displayKey: 'question.age.distribution',
      enumType: 'AgeRange',
      legacyIds: ['age-range']
    },
    {
      databaseField: 'education_level',
      apiField: 'educationLevel',
      frontendId: 'education-level',
      displayKey: 'question.education.level',
      enumType: 'EducationLevel',
      legacyIds: ['education-level']
    }
  ]
};

// ===== 3. 故事墙系统ID映射 =====

export const STORY_ID_MAPPINGS: GlobalIdMapping = {
  system: 'story',
  domain: 'user-content',
  mappings: [
    {
      databaseField: 'category',
      apiField: 'category',
      frontendId: 'story-category',
      displayKey: 'story.category',
      enumType: 'StoryCategory'
    },
    {
      databaseField: 'moderation_status',
      apiField: 'moderationStatus',
      frontendId: 'content-status',
      displayKey: 'content.moderation.status',
      enumType: 'ModerationStatus'
    },
    {
      databaseField: 'status',
      apiField: 'status',
      frontendId: 'publication-status',
      displayKey: 'content.publication.status',
      enumType: 'PublicationStatus'
    }
  ]
};

// ===== 4. UUID系统ID映射 =====

export const UUID_ID_MAPPINGS: GlobalIdMapping = {
  system: 'uuid',
  domain: 'user-management',
  mappings: [
    {
      databaseField: 'content_type',
      apiField: 'contentType',
      frontendId: 'content-type',
      displayKey: 'content.type',
      enumType: 'ContentType'
    },
    {
      databaseField: 'user_type',
      apiField: 'userType',
      frontendId: 'user-type',
      displayKey: 'user.type',
      enumType: 'UserType'
    },
    {
      databaseField: 'status',
      apiField: 'status',
      frontendId: 'content-status',
      displayKey: 'content.status',
      enumType: 'ContentStatus'
    }
  ]
};

// ===== 5. 全局映射注册表 =====

export const GLOBAL_ID_REGISTRY: GlobalIdMapping[] = [
  QUESTIONNAIRE_ID_MAPPINGS,
  STORY_ID_MAPPINGS,
  UUID_ID_MAPPINGS
];

// ===== 6. ID映射服务类 =====

export class GlobalIdMappingService {
  private static instance: GlobalIdMappingService;
  private mappingCache: Map<string, IdMappingEntry> = new Map();

  private constructor() {
    this.buildMappingCache();
  }

  public static getInstance(): GlobalIdMappingService {
    if (!GlobalIdMappingService.instance) {
      GlobalIdMappingService.instance = new GlobalIdMappingService();
    }
    return GlobalIdMappingService.instance;
  }

  /**
   * 构建映射缓存
   */
  private buildMappingCache(): void {
    for (const systemMapping of GLOBAL_ID_REGISTRY) {
      for (const mapping of systemMapping.mappings) {
        // 主键：system:domain:frontendId
        const primaryKey = `${systemMapping.system}:${systemMapping.domain}:${mapping.frontendId}`;
        this.mappingCache.set(primaryKey, mapping);

        // 别名键：支持旧版ID查找
        if (mapping.legacyIds) {
          for (const legacyId of mapping.legacyIds) {
            const legacyKey = `${systemMapping.system}:${systemMapping.domain}:${legacyId}`;
            this.mappingCache.set(legacyKey, mapping);
          }
        }

        // API字段键
        const apiKey = `${systemMapping.system}:api:${mapping.apiField}`;
        this.mappingCache.set(apiKey, mapping);
      }
    }
  }

  /**
   * 根据前端ID获取映射信息
   */
  public getMappingByFrontendId(
    system: string,
    domain: string,
    frontendId: string
  ): IdMappingEntry | null {
    const key = `${system}:${domain}:${frontendId}`;
    return this.mappingCache.get(key) || null;
  }

  /**
   * 根据API字段获取映射信息
   */
  public getMappingByApiField(
    system: string,
    apiField: string
  ): IdMappingEntry | null {
    const key = `${system}:api:${apiField}`;
    return this.mappingCache.get(key) || null;
  }

  /**
   * 前端ID → API字段
   */
  public frontendIdToApiField(
    system: string,
    domain: string,
    frontendId: string
  ): string | null {
    const mapping = this.getMappingByFrontendId(system, domain, frontendId);
    return mapping?.apiField || null;
  }

  /**
   * API字段 → 前端ID
   */
  public apiFieldToFrontendId(
    system: string,
    apiField: string
  ): string | null {
    const mapping = this.getMappingByApiField(system, apiField);
    return mapping?.frontendId || null;
  }

  /**
   * 旧版ID → 新版ID (兼容性转换)
   */
  public legacyIdToNewId(
    system: string,
    domain: string,
    legacyId: string
  ): string | null {
    const mapping = this.getMappingByFrontendId(system, domain, legacyId);
    return mapping?.frontendId || null;
  }

  /**
   * 获取系统的所有维度映射
   */
  public getSystemDimensionMappings(
    system: string,
    domain: string
  ): IdMappingEntry[] {
    const systemMapping = GLOBAL_ID_REGISTRY.find(
      m => m.system === system && m.domain === domain
    );
    return systemMapping?.mappings || [];
  }

  /**
   * 验证ID映射的一致性
   */
  public validateMappingConsistency(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查重复的前端ID
    const frontendIds = new Set<string>();
    for (const systemMapping of GLOBAL_ID_REGISTRY) {
      for (const mapping of systemMapping.mappings) {
        const fullId = `${systemMapping.system}:${mapping.frontendId}`;
        if (frontendIds.has(fullId)) {
          errors.push(`重复的前端ID: ${fullId}`);
        }
        frontendIds.add(fullId);
      }
    }

    // 检查API字段的一致性
    const apiFields = new Map<string, string[]>();
    for (const systemMapping of GLOBAL_ID_REGISTRY) {
      for (const mapping of systemMapping.mappings) {
        if (!apiFields.has(mapping.apiField)) {
          apiFields.set(mapping.apiField, []);
        }
        apiFields.get(mapping.apiField)!.push(`${systemMapping.system}:${mapping.frontendId}`);
      }
    }

    // 检查一个API字段被多个前端ID使用的情况
    for (const [apiField, usages] of apiFields.entries()) {
      if (usages.length > 1) {
        warnings.push(`API字段 ${apiField} 被多个前端ID使用: ${usages.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ===== 7. 导出单例实例 =====

export const globalIdMappingService = GlobalIdMappingService.getInstance();

// ===== 8. 便捷函数 =====

/**
 * 快速获取问卷系统的维度映射
 */
export function getQuestionnaireDimensionMapping(frontendId: string): IdMappingEntry | null {
  return globalIdMappingService.getMappingByFrontendId('questionnaire', 'employment-survey', frontendId);
}

/**
 * 快速转换旧版维度ID到新版ID
 */
export function convertLegacyDimensionId(legacyId: string): string {
  const mapping = globalIdMappingService.getMappingByFrontendId('questionnaire', 'employment-survey', legacyId);
  return mapping?.frontendId || legacyId;
}

/**
 * 获取所有支持的维度ID (包括新旧版本)
 */
export function getAllSupportedDimensionIds(): string[] {
  const mappings = globalIdMappingService.getSystemDimensionMappings('questionnaire', 'employment-survey');
  const ids: string[] = [];
  
  for (const mapping of mappings) {
    ids.push(mapping.frontendId);
    if (mapping.legacyIds) {
      ids.push(...mapping.legacyIds);
    }
  }
  
  return [...new Set(ids)]; // 去重
}

export default globalIdMappingService;
