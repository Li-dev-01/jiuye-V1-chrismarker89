/**
 * 数据结构版本管理器
 * 处理不同版本数据结构的兼容性和迁移
 */

export interface DataSchema {
  version: string;
  description: string;
  fields: SchemaField[];
  createdAt: string;
  deprecated?: boolean;
  migrationPath?: string[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

export interface MigrationRule {
  fromVersion: string;
  toVersion: string;
  transformations: FieldTransformation[];
  description: string;
}

export interface FieldTransformation {
  type: 'rename' | 'split' | 'merge' | 'transform' | 'add' | 'remove';
  sourceFields: string[];
  targetField: string;
  transformer?: (value: any) => any;
  description: string;
}

export class DataVersionManager {
  private schemas: Map<string, DataSchema> = new Map();
  private migrations: Map<string, MigrationRule[]> = new Map();
  private currentVersion: string = 'v2.0';

  constructor() {
    this.initializeSchemas();
    this.initializeMigrations();
  }

  /**
   * 初始化数据结构版本
   */
  private initializeSchemas() {
    // v1.0 - 旧版简单结构
    const v1Schema: DataSchema = {
      version: 'v1.0',
      description: '旧版简单键值对结构',
      createdAt: '2024-01-01T00:00:00Z',
      deprecated: true,
      migrationPath: ['v2.0'],
      fields: [
        { name: 'education', type: 'string', required: true, description: '学历' },
        { name: 'major', type: 'string', required: true, description: '专业' },
        { name: 'employment_status', type: 'string', required: true, description: '就业状态' },
        { name: 'salary_expectation', type: 'string', required: false, description: '期望薪资' },
        { name: 'job_location', type: 'string', required: false, description: '工作地点' }
      ]
    };

    // v2.0 - 新版结构化数据
    const v2Schema: DataSchema = {
      version: 'v2.0',
      description: '新版结构化问卷数据',
      createdAt: '2024-12-01T00:00:00Z',
      fields: [
        { name: 'sectionResponses', type: 'array', required: true, description: '分节响应数据' },
        { name: 'submittedAt', type: 'string', required: true, description: '提交时间' },
        { name: 'isCompleted', type: 'boolean', required: true, description: '是否完成' },
        { name: 'timeSpent', type: 'number', required: false, description: '用时（秒）' }
      ]
    };

    this.schemas.set('v1.0', v1Schema);
    this.schemas.set('v2.0', v2Schema);
  }

  /**
   * 初始化迁移规则
   */
  private initializeMigrations() {
    const v1ToV2Migration: MigrationRule = {
      fromVersion: 'v1.0',
      toVersion: 'v2.0',
      description: '从简单结构迁移到结构化数据',
      transformations: [
        {
          type: 'transform',
          sourceFields: ['education', 'major', 'employment_status', 'salary_expectation', 'job_location'],
          targetField: 'sectionResponses',
          description: '将简单字段转换为结构化响应',
          transformer: (data: Record<string, any>) => {
            const personalInfoResponses = [];
            const employmentResponses = [];

            // 个人信息部分
            if (data.education) {
              personalInfoResponses.push({
                questionId: 'education-level',
                value: data.education
              });
            }
            if (data.major) {
              personalInfoResponses.push({
                questionId: 'major-field',
                value: data.major
              });
            }

            // 就业状态部分
            if (data.employment_status) {
              employmentResponses.push({
                questionId: 'current-status',
                value: data.employment_status
              });
            }
            if (data.salary_expectation) {
              employmentResponses.push({
                questionId: 'salary-expectation',
                value: data.salary_expectation
              });
            }
            if (data.job_location) {
              employmentResponses.push({
                questionId: 'work-location-preference',
                value: data.job_location
              });
            }

            return [
              {
                sectionId: 'personal-info',
                questionResponses: personalInfoResponses
              },
              {
                sectionId: 'employment-status',
                questionResponses: employmentResponses
              }
            ];
          }
        },
        {
          type: 'add',
          sourceFields: [],
          targetField: 'submittedAt',
          description: '添加提交时间',
          transformer: () => new Date().toISOString()
        },
        {
          type: 'add',
          sourceFields: [],
          targetField: 'isCompleted',
          description: '添加完成状态',
          transformer: () => true
        },
        {
          type: 'add',
          sourceFields: [],
          targetField: 'timeSpent',
          description: '添加用时',
          transformer: () => Math.floor(Math.random() * 600) + 180 // 3-13分钟
        }
      ]
    };

    this.migrations.set('v1.0->v2.0', [v1ToV2Migration]);
  }

  /**
   * 检测数据版本
   */
  detectDataVersion(data: any): string {
    // 检查是否有新版本的结构
    if (data.sectionResponses && Array.isArray(data.sectionResponses)) {
      return 'v2.0';
    }

    // 检查是否有旧版本的字段
    if (data.education || data.major || data.employment_status) {
      return 'v1.0';
    }

    // 默认返回当前版本
    return this.currentVersion;
  }

  /**
   * 迁移数据到目标版本
   */
  migrateData(data: any, targetVersion?: string): { 
    success: boolean; 
    data?: any; 
    error?: string; 
    fromVersion?: string;
    toVersion?: string;
  } {
    const fromVersion = this.detectDataVersion(data);
    const toVersion = targetVersion || this.currentVersion;

    if (fromVersion === toVersion) {
      return {
        success: true,
        data,
        fromVersion,
        toVersion
      };
    }

    try {
      const migrationKey = `${fromVersion}->${toVersion}`;
      const migrations = this.migrations.get(migrationKey);

      if (!migrations || migrations.length === 0) {
        return {
          success: false,
          error: `No migration path found from ${fromVersion} to ${toVersion}`,
          fromVersion,
          toVersion
        };
      }

      let migratedData = { ...data };

      for (const migration of migrations) {
        migratedData = this.applyMigration(migratedData, migration);
      }

      return {
        success: true,
        data: migratedData,
        fromVersion,
        toVersion
      };
    } catch (error) {
      return {
        success: false,
        error: `Migration failed: ${error}`,
        fromVersion,
        toVersion
      };
    }
  }

  /**
   * 应用单个迁移规则
   */
  private applyMigration(data: any, migration: MigrationRule): any {
    let result = { ...data };

    for (const transformation of migration.transformations) {
      result = this.applyTransformation(result, transformation);
    }

    return result;
  }

  /**
   * 应用字段转换
   */
  private applyTransformation(data: any, transformation: FieldTransformation): any {
    const result = { ...data };

    switch (transformation.type) {
      case 'rename':
        if (transformation.sourceFields.length === 1) {
          const sourceField = transformation.sourceFields[0];
          if (result[sourceField] !== undefined) {
            result[transformation.targetField] = result[sourceField];
            delete result[sourceField];
          }
        }
        break;

      case 'transform':
        if (transformation.transformer) {
          result[transformation.targetField] = transformation.transformer(data);
        }
        break;

      case 'add':
        if (transformation.transformer) {
          result[transformation.targetField] = transformation.transformer(data);
        }
        break;

      case 'remove':
        for (const field of transformation.sourceFields) {
          delete result[field];
        }
        break;

      case 'merge':
        const values = transformation.sourceFields.map(field => data[field]).filter(v => v !== undefined);
        if (values.length > 0) {
          result[transformation.targetField] = values;
        }
        break;

      case 'split':
        // 实现字段拆分逻辑
        break;
    }

    return result;
  }

  /**
   * 批量迁移数据
   */
  migrateDataBatch(dataArray: any[], targetVersion?: string): {
    success: boolean;
    results: any[];
    errors: string[];
    stats: {
      total: number;
      migrated: number;
      failed: number;
      byVersion: Record<string, number>;
    };
  } {
    const results = [];
    const errors = [];
    const stats = {
      total: dataArray.length,
      migrated: 0,
      failed: 0,
      byVersion: {} as Record<string, number>
    };

    for (const data of dataArray) {
      const fromVersion = this.detectDataVersion(data);
      stats.byVersion[fromVersion] = (stats.byVersion[fromVersion] || 0) + 1;

      const migrationResult = this.migrateData(data, targetVersion);
      
      if (migrationResult.success) {
        results.push(migrationResult.data);
        stats.migrated++;
      } else {
        results.push(data); // 保留原数据
        errors.push(migrationResult.error || 'Unknown error');
        stats.failed++;
      }
    }

    return {
      success: stats.failed === 0,
      results,
      errors,
      stats
    };
  }

  /**
   * 获取版本信息
   */
  getVersionInfo(): {
    currentVersion: string;
    availableVersions: string[];
    schemas: Record<string, DataSchema>;
    migrationPaths: string[];
  } {
    return {
      currentVersion: this.currentVersion,
      availableVersions: Array.from(this.schemas.keys()),
      schemas: Object.fromEntries(this.schemas),
      migrationPaths: Array.from(this.migrations.keys())
    };
  }

  /**
   * 验证数据结构
   */
  validateData(data: any, version?: string): {
    isValid: boolean;
    errors: string[];
    version: string;
  } {
    const dataVersion = version || this.detectDataVersion(data);
    const schema = this.schemas.get(dataVersion);
    const errors: string[] = [];

    if (!schema) {
      return {
        isValid: false,
        errors: [`Unknown schema version: ${dataVersion}`],
        version: dataVersion
      };
    }

    // 简单的字段验证
    for (const field of schema.fields) {
      if (field.required && (data[field.name] === undefined || data[field.name] === null)) {
        errors.push(`Required field '${field.name}' is missing`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      version: dataVersion
    };
  }
}

// 全局实例
export const dataVersionManager = new DataVersionManager();
