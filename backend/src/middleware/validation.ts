/**
 * 参数验证中间件
 * 防止SQL注入、XSS攻击和其他安全威胁
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';

// 危险字符和模式检测
const DANGEROUS_PATTERNS = [
  // SQL注入模式
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /(--|\/\*|\*\/|;)/,
  /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/i,

  // XSS模式
  /<script[^>]*>.*?<\/script>/i,
  /<iframe[^>]*>.*?<\/iframe>/i,
  /javascript:/i,
  /on\w+\s*=/i,

  // 路径遍历
  /\.\.\//,
  /\.\.\\/,

  // 命令注入 (修改：更精确的模式，避免误判User-Agent)
  /(\$\(|\`|;[\s]*rm|;[\s]*del)/,
  /(^|\s)(rm|del|format|shutdown|reboot)[\s]/i,
];

// User-Agent专用的危险模式检测（更宽松）
const USER_AGENT_DANGEROUS_PATTERNS = [
  // 只检测明显的恶意模式
  /<script[^>]*>.*?<\/script>/i,
  /<iframe[^>]*>.*?<\/iframe>/i,
  /javascript:/i,
  /\$\(.*\)/,
  /`.*`/,
  /(^|\s)(rm|del|format|shutdown|reboot)[\s]/i,
];

// UUID格式验证
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 数字ID格式验证
const NUMERIC_ID_PATTERN = /^\d+$/;

// 安全的字符串格式验证
const SAFE_STRING_PATTERN = /^[a-zA-Z0-9_-]+$/;

// 邮箱格式验证
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ValidationRule {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'uuid' | 'safe-string';
  custom?: (value: any) => boolean;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * 检测危险模式
 */
function containsDangerousPattern(value: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * 检测User-Agent中的危险模式（更宽松）
 */
function containsDangerousUserAgentPattern(userAgent: string): boolean {
  return USER_AGENT_DANGEROUS_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * 清理和转义字符串
 */
function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // 移除尖括号
    .replace(/['"]/g, '') // 移除引号
    .replace(/[\\]/g, '') // 移除反斜杠
    .trim();
}

/**
 * 验证单个值
 */
function validateValue(value: any, rule: ValidationRule, fieldName: string): { valid: boolean; error?: string; sanitized?: any } {
  // 检查必填字段
  if (rule.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${fieldName} 是必填字段` };
  }

  // 如果值为空且不是必填，则跳过验证
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { valid: true, sanitized: value };
  }

  // 转换为字符串进行验证
  const stringValue = String(value);

  // 检查危险模式
  if (containsDangerousPattern(stringValue)) {
    return { valid: false, error: `${fieldName} 包含不安全的字符或模式` };
  }

  // 长度验证
  if (rule.minLength && stringValue.length < rule.minLength) {
    return { valid: false, error: `${fieldName} 长度不能少于 ${rule.minLength} 个字符` };
  }

  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return { valid: false, error: `${fieldName} 长度不能超过 ${rule.maxLength} 个字符` };
  }

  // 类型验证
  if (rule.type) {
    switch (rule.type) {
      case 'uuid':
        if (!UUID_PATTERN.test(stringValue)) {
          return { valid: false, error: `${fieldName} 必须是有效的UUID格式` };
        }
        break;
      case 'number':
        if (!NUMERIC_ID_PATTERN.test(stringValue)) {
          return { valid: false, error: `${fieldName} 必须是有效的数字` };
        }
        break;
      case 'email':
        if (!EMAIL_PATTERN.test(stringValue)) {
          return { valid: false, error: `${fieldName} 必须是有效的邮箱格式` };
        }
        break;
      case 'safe-string':
        if (!SAFE_STRING_PATTERN.test(stringValue)) {
          return { valid: false, error: `${fieldName} 只能包含字母、数字、下划线和连字符` };
        }
        break;
    }
  }

  // 正则表达式验证
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return { valid: false, error: `${fieldName} 格式不正确` };
  }

  // 自定义验证
  if (rule.custom && !rule.custom(value)) {
    return { valid: false, error: `${fieldName} 验证失败` };
  }

  // 清理字符串
  const sanitized = rule.type === 'string' ? sanitizeString(stringValue) : value;

  return { valid: true, sanitized };
}

/**
 * 验证对象
 */
function validateObject(data: any, schema: ValidationSchema): { valid: boolean; errors: string[]; sanitized: any } {
  const errors: string[] = [];
  const sanitized: any = {};

  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data[fieldName];
    const result = validateValue(value, rule, fieldName);

    if (!result.valid) {
      errors.push(result.error!);
    } else {
      sanitized[fieldName] = result.sanitized;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * 路径参数验证中间件
 */
export function validatePathParams(schema: ValidationSchema) {
  return async (c: Context, next: Next) => {
    const params: any = {};
    
    // 获取所有路径参数
    for (const [key, value] of Object.entries(c.req.param())) {
      params[key] = value;
    }

    const result = validateObject(params, schema);

    if (!result.valid) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '参数验证失败',
        details: result.errors
      }, 400);
    }

    // 将清理后的参数重新设置到上下文
    for (const [key, value] of Object.entries(result.sanitized)) {
      c.req.param()[key] = value;
    }

    await next();
  };
}

/**
 * 请求体验证中间件
 */
export function validateRequestBody(schema: ValidationSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = validateObject(body, schema);

      if (!result.valid) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '请求体验证失败',
          details: result.errors
        }, 400);
      }

      // 将清理后的数据设置到上下文
      c.set('validatedBody', result.sanitized);

      await next();
    } catch (error) {
      return c.json({
        success: false,
        error: 'Invalid JSON',
        message: '请求体必须是有效的JSON格式'
      }, 400);
    }
  };
}

/**
 * 查询参数验证中间件
 */
export function validateQueryParams(schema: ValidationSchema) {
  return async (c: Context, next: Next) => {
    const query: any = {};
    
    // 获取所有查询参数
    for (const [key, value] of Object.entries(c.req.query())) {
      query[key] = value;
    }

    const result = validateObject(query, schema);

    if (!result.valid) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '查询参数验证失败',
        details: result.errors
      }, 400);
    }

    // 将清理后的参数设置到上下文
    c.set('validatedQuery', result.sanitized);

    await next();
  };
}

/**
 * 通用安全验证中间件
 */
export const securityValidation = async (c: Context, next: Next) => {
  try {
    // 检查User-Agent（使用更宽松的检测）
    const userAgent = c.req.header('User-Agent') || '';
    if (containsDangerousUserAgentPattern(userAgent)) {
      console.log('检测到可疑的User-Agent:', userAgent);
      return c.json({
        success: false,
        error: 'Security Error',
        message: '检测到可疑的请求头'
      }, 400);
    }

    // 检查Referer
    const referer = c.req.header('Referer') || '';
    if (referer && containsDangerousPattern(referer)) {
      return c.json({
        success: false,
        error: 'Security Error',
        message: '检测到可疑的来源地址'
      }, 400);
    }

    // 检查请求路径
    const path = c.req.path;
    if (containsDangerousPattern(path)) {
      return c.json({
        success: false,
        error: 'Security Error',
        message: '检测到可疑的请求路径'
      }, 400);
    }

    await next();
  } catch (error) {
    console.error('安全验证失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '安全验证过程中发生错误'
    }, 500);
  }
};

/**
 * 常用验证规则
 */
export const commonValidationRules = {
  id: { type: 'uuid' as const, required: true },
  numericId: { type: 'number' as const, required: true },
  email: { type: 'email' as const, required: true },
  optionalEmail: { type: 'email' as const, required: false },
  name: { type: 'string' as const, minLength: 1, maxLength: 100, required: true },
  optionalName: { type: 'string' as const, minLength: 1, maxLength: 100, required: false },
  description: { type: 'string' as const, maxLength: 1000, required: false },
  status: { 
    type: 'safe-string' as const, 
    pattern: /^(active|inactive|pending|blocked)$/, 
    required: true 
  },
  page: { type: 'number' as const, required: false },
  pageSize: { type: 'number' as const, required: false },
  search: { type: 'string' as const, maxLength: 100, required: false }
};

export { ValidationRule, ValidationSchema };
