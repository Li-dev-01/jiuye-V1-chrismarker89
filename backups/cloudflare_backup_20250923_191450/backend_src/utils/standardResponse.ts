/**
 * 标准化API响应工具
 * 提供统一的成功和错误响应格式
 */

import type { Context } from 'hono';
import { getVersionFromContext } from '../middleware/version';

// 标准错误码
export enum ErrorCodes {
  // 客户端错误 (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  
  // 服务器错误 (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 业务错误
  QUESTIONNAIRE_NOT_FOUND = 'QUESTIONNAIRE_NOT_FOUND',
  INVALID_QUESTIONNAIRE_DATA = 'INVALID_QUESTIONNAIRE_DATA',
  SUBMISSION_FAILED = 'SUBMISSION_FAILED',
  STATISTICS_UNAVAILABLE = 'STATISTICS_UNAVAILABLE'
}

// 错误码到HTTP状态码的映射
export const ERROR_STATUS_MAP: Record<ErrorCodes, number> = {
  // 4xx 客户端错误
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.AUTHENTICATION_ERROR]: 401,
  [ErrorCodes.AUTHORIZATION_ERROR]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.UNSUPPORTED_VERSION]: 400,
  
  // 5xx 服务器错误
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.TIMEOUT_ERROR]: 504,
  
  // 业务错误
  [ErrorCodes.QUESTIONNAIRE_NOT_FOUND]: 404,
  [ErrorCodes.INVALID_QUESTIONNAIRE_DATA]: 400,
  [ErrorCodes.SUBMISSION_FAILED]: 422,
  [ErrorCodes.STATISTICS_UNAVAILABLE]: 503
};

// 标准响应接口
export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    field?: string; // 用于字段验证错误
  };
  message?: string;
  timestamp: string;
  requestId?: string;
  version?: string;
}

// 分页响应接口
export interface PaginatedResponse<T = any> extends StandardResponse<T> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 标准成功响应
 */
export function successResponse<T>(
  c: Context,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response {
  const version = getVersionFromContext(c);
  const requestId = generateRequestId();
  
  const response: StandardResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
    version
  };
  
  // 添加请求ID到响应头
  c.header('X-Request-ID', requestId);
  
  return c.json(response, statusCode);
}

/**
 * 标准错误响应
 */
export function errorResponse(
  c: Context,
  errorCode: ErrorCodes,
  message: string,
  details?: any,
  field?: string
): Response {
  const version = getVersionFromContext(c);
  const requestId = generateRequestId();
  const statusCode = ERROR_STATUS_MAP[errorCode] || 500;
  
  const response: StandardResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      details,
      field
    },
    timestamp: new Date().toISOString(),
    requestId,
    version
  };
  
  // 添加请求ID到响应头
  c.header('X-Request-ID', requestId);
  
  // 记录错误日志
  console.error(`[${requestId}] ${errorCode}: ${message}`, details);
  
  return c.json(response, statusCode);
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  c: Context,
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  },
  message: string = 'Success'
): Response {
  const version = getVersionFromContext(c);
  const requestId = generateRequestId();
  
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  
  const response: PaginatedResponse<T[]> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
    version,
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1
    }
  };
  
  c.header('X-Request-ID', requestId);
  
  return c.json(response);
}

/**
 * 验证错误响应
 */
export function validationErrorResponse(
  c: Context,
  message: string,
  field?: string,
  details?: any
): Response {
  return errorResponse(c, ErrorCodes.VALIDATION_ERROR, message, details, field);
}

/**
 * 认证错误响应
 */
export function authenticationErrorResponse(
  c: Context,
  message: string = '认证失败，请重新登录'
): Response {
  return errorResponse(c, ErrorCodes.AUTHENTICATION_ERROR, message);
}

/**
 * 授权错误响应
 */
export function authorizationErrorResponse(
  c: Context,
  message: string = '权限不足，无法访问此资源'
): Response {
  return errorResponse(c, ErrorCodes.AUTHORIZATION_ERROR, message);
}

/**
 * 资源未找到响应
 */
export function notFoundResponse(
  c: Context,
  resource: string = '资源'
): Response {
  return errorResponse(c, ErrorCodes.NOT_FOUND, `${resource}未找到`);
}

/**
 * 内部服务器错误响应
 */
export function internalErrorResponse(
  c: Context,
  message: string = '服务器内部错误',
  details?: any
): Response {
  return errorResponse(c, ErrorCodes.INTERNAL_ERROR, message, details);
}

/**
 * 数据库错误响应
 */
export function databaseErrorResponse(
  c: Context,
  operation: string,
  details?: any
): Response {
  return errorResponse(
    c,
    ErrorCodes.DATABASE_ERROR,
    `数据库操作失败: ${operation}`,
    details
  );
}

/**
 * 业务逻辑错误响应
 */
export function businessErrorResponse(
  c: Context,
  errorCode: ErrorCodes,
  message: string,
  details?: any
): Response {
  return errorResponse(c, errorCode, message, details);
}

/**
 * 异步错误处理包装器
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T> {
  return handler().catch((error) => {
    console.error('Async operation failed:', error);
    throw error;
  });
}

/**
 * 路由错误处理中间件
 */
export function routeErrorHandler(
  handler: (c: Context) => Promise<Response>
) {
  return async (c: Context): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error: any) {
      console.error('Route handler error:', error);
      
      // 根据错误类型返回相应的错误响应
      if (error.name === 'ValidationError') {
        return validationErrorResponse(c, error.message);
      }
      
      if (error.name === 'AuthenticationError') {
        return authenticationErrorResponse(c, error.message);
      }
      
      if (error.name === 'AuthorizationError') {
        return authorizationErrorResponse(c, error.message);
      }
      
      if (error.name === 'NotFoundError') {
        return notFoundResponse(c, error.resource);
      }
      
      // 默认内部服务器错误
      return internalErrorResponse(c, '处理请求时发生错误', {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
}

/**
 * 自定义错误类
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCodes,
    message: string,
    public details?: any,
    public field?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, field?: string, details?: any) {
    super(ErrorCodes.VALIDATION_ERROR, message, details, field);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = '认证失败') {
    super(ErrorCodes.AUTHENTICATION_ERROR, message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = '权限不足') {
    super(ErrorCodes.AUTHORIZATION_ERROR, message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = '资源') {
    super(ErrorCodes.NOT_FOUND, `${resource}未找到`);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends ApiError {
  constructor(operation: string, details?: any) {
    super(ErrorCodes.DATABASE_ERROR, `数据库操作失败: ${operation}`, details);
    this.name = 'DatabaseError';
  }
}
