/**
 * API数据转换工具
 * 统一处理前端camelCase和后端snake_case之间的转换
 */

import humps from 'humps';

// 字段映射配置
export const FIELD_MAPPINGS = {
  // 数据库 -> 前端的字段映射
  database_to_frontend: {
    questionnaire_id: 'questionnaireId',
    user_id: 'userId',
    response_data: 'responseData',
    submitted_at: 'submittedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    ip_address: 'ipAddress',
    user_agent: 'userAgent',
    completion_percentage: 'completionPercentage',
    total_time_seconds: 'totalTimeSeconds',
    is_completed: 'isCompleted',
    is_valid: 'isValid',
    is_test_data: 'isTestData',
    data_quality_score: 'dataQualityScore',
    processing_version: 'processingVersion'
  },
  
  // 前端 -> 数据库的字段映射
  frontend_to_database: {
    questionnaireId: 'questionnaire_id',
    userId: 'user_id',
    responseData: 'response_data',
    submittedAt: 'submitted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    ipAddress: 'ip_address',
    userAgent: 'user_agent',
    completionPercentage: 'completion_percentage',
    totalTimeSeconds: 'total_time_seconds',
    isCompleted: 'is_completed',
    isValid: 'is_valid',
    isTestData: 'is_test_data',
    dataQualityScore: 'data_quality_score',
    processingVersion: 'processing_version'
  }
};

// 特殊字段处理规则
const SPECIAL_FIELD_RULES = {
  // 时间字段处理
  timeFields: ['createdAt', 'updatedAt', 'submittedAt', 'created_at', 'updated_at', 'submitted_at'],
  
  // 布尔字段处理
  booleanFields: ['isCompleted', 'isValid', 'isTestData', 'is_completed', 'is_valid', 'is_test_data'],
  
  // JSON字段处理
  jsonFields: ['responseData', 'response_data', 'metadata'],
  
  // 数值字段处理
  numberFields: ['completionPercentage', 'totalTimeSeconds', 'dataQualityScore', 
                'completion_percentage', 'total_time_seconds', 'data_quality_score']
};

/**
 * 转换API请求数据（前端 -> 后端）
 * 将camelCase转换为snake_case
 */
export function transformRequestData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // 使用humps进行基础转换
  let transformed = humps.decamelizeKeys(data);
  
  // 应用特殊字段映射
  transformed = applyFieldMapping(transformed, FIELD_MAPPINGS.frontend_to_database);
  
  // 处理特殊字段类型
  transformed = processSpecialFields(transformed, 'request');
  
  return transformed;
}

/**
 * 转换API响应数据（后端 -> 前端）
 * 将snake_case转换为camelCase
 */
export function transformResponseData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // 处理特殊字段类型
  let transformed = processSpecialFields(data, 'response');
  
  // 应用特殊字段映射
  transformed = applyFieldMapping(transformed, FIELD_MAPPINGS.database_to_frontend);
  
  // 使用humps进行基础转换
  transformed = humps.camelizeKeys(transformed);
  
  return transformed;
}

/**
 * 应用字段映射
 */
function applyFieldMapping(data: any, mapping: Record<string, string>): any {
  if (Array.isArray(data)) {
    return data.map(item => applyFieldMapping(item, mapping));
  }
  
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const result: any = {};
  
  Object.keys(data).forEach(key => {
    const mappedKey = mapping[key] || key;
    const value = data[key];
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[mappedKey] = applyFieldMapping(value, mapping);
    } else if (Array.isArray(value)) {
      result[mappedKey] = value.map(item => 
        typeof item === 'object' ? applyFieldMapping(item, mapping) : item
      );
    } else {
      result[mappedKey] = value;
    }
  });
  
  return result;
}

/**
 * 处理特殊字段类型
 */
function processSpecialFields(data: any, direction: 'request' | 'response'): any {
  if (Array.isArray(data)) {
    return data.map(item => processSpecialFields(item, direction));
  }
  
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const result: any = {};
  
  Object.keys(data).forEach(key => {
    let value = data[key];
    
    // 处理时间字段
    if (SPECIAL_FIELD_RULES.timeFields.includes(key)) {
      if (direction === 'request' && value instanceof Date) {
        value = value.toISOString();
      } else if (direction === 'response' && typeof value === 'string') {
        // 保持字符串格式，前端可以根据需要转换为Date
        value = value;
      }
    }
    
    // 处理布尔字段
    else if (SPECIAL_FIELD_RULES.booleanFields.includes(key)) {
      if (direction === 'request') {
        value = value ? 1 : 0; // 转换为数值
      } else if (direction === 'response') {
        value = Boolean(value); // 转换为布尔值
      }
    }
    
    // 处理JSON字段
    else if (SPECIAL_FIELD_RULES.jsonFields.includes(key)) {
      if (direction === 'request' && typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (direction === 'response' && typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // 如果解析失败，保持原值
          console.warn(`Failed to parse JSON field ${key}:`, e);
        }
      }
    }
    
    // 处理数值字段
    else if (SPECIAL_FIELD_RULES.numberFields.includes(key)) {
      if (direction === 'request' && typeof value === 'string') {
        const num = parseFloat(value);
        value = isNaN(num) ? value : num;
      } else if (direction === 'response' && typeof value === 'number') {
        value = value;
      }
    }
    
    // 递归处理嵌套对象
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      value = processSpecialFields(value, direction);
    } else if (Array.isArray(value)) {
      value = value.map(item => 
        typeof item === 'object' ? processSpecialFields(item, direction) : item
      );
    }
    
    result[key] = value;
  });
  
  return result;
}

/**
 * 验证字段命名规范
 */
export function validateNamingConvention(data: any, expectedConvention: 'camelCase' | 'snake_case'): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  function checkObject(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (expectedConvention === 'camelCase') {
        // 检查是否符合camelCase规范
        if (key.includes('_')) {
          violations.push(`${fullPath}: 应使用camelCase，发现snake_case`);
        }
      } else if (expectedConvention === 'snake_case') {
        // 检查是否符合snake_case规范
        if (/[A-Z]/.test(key)) {
          violations.push(`${fullPath}: 应使用snake_case，发现camelCase`);
        }
      }
      
      // 递归检查嵌套对象
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        checkObject(obj[key], fullPath);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any, index: number) => {
          if (item && typeof item === 'object') {
            checkObject(item, `${fullPath}[${index}]`);
          }
        });
      }
    });
  }
  
  checkObject(data);
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * 创建API转换中间件
 */
export function createApiTransformMiddleware() {
  return {
    request: (config: any) => {
      // 转换请求数据
      if (config.data) {
        config.data = transformRequestData(config.data);
      }
      
      // 转换查询参数
      if (config.params) {
        config.params = transformRequestData(config.params);
      }
      
      return config;
    },
    
    response: (response: any) => {
      // 转换响应数据
      if (response.data) {
        response.data = transformResponseData(response.data);
      }
      
      return response;
    },
    
    error: (error: any) => {
      // 转换错误响应数据
      if (error.response && error.response.data) {
        error.response.data = transformResponseData(error.response.data);
      }
      
      return Promise.reject(error);
    }
  };
}

/**
 * 生成字段映射报告
 */
export function generateFieldMappingReport(): {
  totalMappings: number;
  databaseToFrontend: Record<string, string>;
  frontendToDatabase: Record<string, string>;
  specialFields: typeof SPECIAL_FIELD_RULES;
} {
  return {
    totalMappings: Object.keys(FIELD_MAPPINGS.database_to_frontend).length,
    databaseToFrontend: FIELD_MAPPINGS.database_to_frontend,
    frontendToDatabase: FIELD_MAPPINGS.frontend_to_database,
    specialFields: SPECIAL_FIELD_RULES
  };
}
