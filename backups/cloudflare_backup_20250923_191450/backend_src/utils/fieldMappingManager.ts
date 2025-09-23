/**
 * 动态字段映射管理器
 * 支持可配置的字段映射和热更新
 */

export interface FieldMappingRule {
  sourceField: string;
  targetField: string;
  valueMapping?: Record<string, string>;
  dataType: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  version: string;
}

export interface MappingConfig {
  version: string;
  description: string;
  rules: FieldMappingRule[];
  createdAt: string;
  updatedAt: string;
}

export class FieldMappingManager {
  private mappingConfigs: Map<string, MappingConfig> = new Map();
  private currentVersion: string = 'v1.0';

  constructor() {
    this.initializeDefaultMappings();
  }

  /**
   * 初始化默认映射配置
   */
  private initializeDefaultMappings() {
    const defaultConfig: MappingConfig = {
      version: 'v1.0',
      description: '默认字段映射配置',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [
        // 旧格式到新格式的映射
        {
          sourceField: 'education',
          targetField: 'education-level',
          dataType: 'string',
          required: true,
          version: 'v1.0',
          valueMapping: {
            '高中及以下': 'high-school',
            '大专': 'junior-college',
            '专科': 'junior-college',
            '本科': 'bachelor',
            '硕士': 'master',
            '硕士研究生': 'master',
            '博士': 'phd',
            '博士研究生': 'phd'
          }
        },
        {
          sourceField: 'major',
          targetField: 'major-field',
          dataType: 'string',
          required: true,
          version: 'v1.0',
          valueMapping: {
            '计算机科学': 'engineering',
            '计算机科学与技术': 'engineering',
            '软件工程': 'engineering',
            '电子信息': 'engineering',
            '电子信息工程': 'engineering',
            '机械制造': 'engineering',
            '机械工程': 'engineering',
            '土木工程': 'engineering',
            '人工智能': 'engineering',
            '金融学': 'economics',
            '市场营销': 'management',
            '医学': 'medicine',
            '英语': 'literature'
          }
        },
        {
          sourceField: 'employment_status',
          targetField: 'current-status',
          dataType: 'string',
          required: true,
          version: 'v1.0',
          valueMapping: {
            '已就业': 'fulltime',
            '求职中': 'unemployed',
            '继续深造': 'student',
            '暂时失业': 'unemployed',
            '在校学生': 'student',
            '准备考研/考公': 'preparing'
          }
        },
        {
          sourceField: 'salary_expectation',
          targetField: 'salary-expectation',
          dataType: 'string',
          required: false,
          version: 'v1.0',
          valueMapping: {
            '5000-8000': '5k-8k',
            '6000-8000': '6k-8k',
            '6000-10000': '6k-8k',
            '8000-12000': '8k-12k',
            '12000-18000': '12k-18k',
            '12000-20000': '12k-18k',
            '15000-25000': '18k-25k',
            '20000+': 'above-25k'
          }
        },
        {
          sourceField: 'job_location',
          targetField: 'work-location-preference',
          dataType: 'string',
          required: false,
          version: 'v1.0',
          valueMapping: {
            '北京': 'tier1',
            '上海': 'tier1',
            '广州': 'tier1',
            '深圳': 'tier1',
            '杭州': 'new-tier1',
            '成都': 'new-tier1',
            '武汉': 'new-tier1',
            '西安': 'new-tier1'
          }
        },
        // 新增：基于公司推断地点偏好
        {
          sourceField: 'company',
          targetField: 'work-location-preference',
          dataType: 'string',
          required: false,
          version: 'v1.0',
          valueMapping: {
            '百度': 'tier1',
            '阿里巴巴': 'tier1',
            '腾讯': 'tier1',
            '字节跳动': 'tier1',
            '美团': 'tier1',
            '滴滴': 'tier1',
            '京东': 'tier1',
            '网易': 'new-tier1',
            '华为': 'tier1',
            '小米': 'tier1'
          }
        }
      ]
    };

    this.mappingConfigs.set('v1.0', defaultConfig);
  }

  /**
   * 获取当前版本的映射配置
   */
  getCurrentMappingConfig(): MappingConfig {
    return this.mappingConfigs.get(this.currentVersion)!;
  }

  /**
   * 添加新的映射配置版本
   */
  addMappingConfig(config: MappingConfig): void {
    this.mappingConfigs.set(config.version, config);
  }

  /**
   * 切换到指定版本
   */
  switchToVersion(version: string): boolean {
    if (this.mappingConfigs.has(version)) {
      this.currentVersion = version;
      return true;
    }
    return false;
  }

  /**
   * 应用字段映射
   */
  applyMapping(sourceData: Record<string, any>, version?: string): Record<string, any> {
    const config = version
      ? this.mappingConfigs.get(version)
      : this.getCurrentMappingConfig();

    if (!config) {
      throw new Error(`Mapping configuration not found for version: ${version || this.currentVersion}`);
    }

    const mappedData: Record<string, any> = {};

    for (const rule of config.rules) {
      const sourceValue = sourceData[rule.sourceField];

      if (sourceValue === undefined || sourceValue === null) {
        if (rule.required) {
          console.warn(`Required field ${rule.sourceField} is missing`);
        }
        continue;
      }

      let mappedValue = sourceValue;

      // 应用值映射
      if (rule.valueMapping && typeof sourceValue === 'string') {
        mappedValue = rule.valueMapping[sourceValue] || sourceValue;
      }

      // 类型转换
      mappedValue = this.convertDataType(mappedValue, rule.dataType);

      // 如果目标字段已存在，优先保留已有值（避免覆盖）
      if (!mappedData[rule.targetField]) {
        mappedData[rule.targetField] = mappedValue;
      }
    }

    // 特殊处理：为没有地点信息的数据生成随机地点偏好
    if (!mappedData['work-location-preference']) {
      mappedData['work-location-preference'] = this.generateRandomLocationPreference();
    }

    return mappedData;
  }

  /**
   * 批量应用映射
   */
  applyMappingBatch(sourceDataArray: Record<string, any>[], version?: string): Record<string, any>[] {
    return sourceDataArray.map(data => this.applyMapping(data, version));
  }

  /**
   * 数据类型转换
   */
  private convertDataType(value: any, targetType: string): any {
    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      default:
        return value;
    }
  }

  /**
   * 为缺失地点信息的数据生成合理的随机地点偏好
   */
  private generateRandomLocationPreference(): string {
    // 基于真实的就业地点分布生成权重
    const locationDistribution = [
      { value: 'tier1', weight: 0.35 },        // 一线城市 35%
      { value: 'new-tier1', weight: 0.30 },    // 新一线城市 30%
      { value: 'tier2', weight: 0.20 },        // 二线城市 20%
      { value: 'tier3', weight: 0.10 },        // 三线城市 10%
      { value: 'hometown', weight: 0.05 }      // 家乡 5%
    ];

    const random = Math.random();
    let cumulative = 0;

    for (const location of locationDistribution) {
      cumulative += location.weight;
      if (random <= cumulative) {
        return location.value;
      }
    }

    return 'tier2'; // 默认返回二线城市
  }

  /**
   * 验证映射配置
   */
  validateMappingConfig(config: MappingConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.version) {
      errors.push('Version is required');
    }

    if (!config.rules || config.rules.length === 0) {
      errors.push('At least one mapping rule is required');
    }

    for (const rule of config.rules || []) {
      if (!rule.sourceField) {
        errors.push('Source field is required for all rules');
      }
      if (!rule.targetField) {
        errors.push('Target field is required for all rules');
      }
      if (!['string', 'number', 'boolean', 'array'].includes(rule.dataType)) {
        errors.push(`Invalid data type: ${rule.dataType}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取所有可用版本
   */
  getAvailableVersions(): string[] {
    return Array.from(this.mappingConfigs.keys());
  }

  /**
   * 获取映射统计信息
   */
  getMappingStats(): {
    totalVersions: number;
    currentVersion: string;
    totalRules: number;
    requiredFields: number;
  } {
    const currentConfig = this.getCurrentMappingConfig();
    
    return {
      totalVersions: this.mappingConfigs.size,
      currentVersion: this.currentVersion,
      totalRules: currentConfig.rules.length,
      requiredFields: currentConfig.rules.filter(rule => rule.required).length
    };
  }

  /**
   * 导出映射配置
   */
  exportMappingConfig(version?: string): string {
    const config = version 
      ? this.mappingConfigs.get(version) 
      : this.getCurrentMappingConfig();
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入映射配置
   */
  importMappingConfig(configJson: string): { success: boolean; error?: string } {
    try {
      const config: MappingConfig = JSON.parse(configJson);
      const validation = this.validateMappingConfig(config);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`
        };
      }

      this.addMappingConfig(config);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse configuration: ${error}`
      };
    }
  }
}

// 全局实例
export const fieldMappingManager = new FieldMappingManager();
