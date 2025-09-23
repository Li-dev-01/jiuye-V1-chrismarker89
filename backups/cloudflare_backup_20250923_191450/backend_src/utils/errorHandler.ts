/**
 * 错误处理工具
 * 提供统一的错误处理和日志记录功能
 */

export interface ErrorDetails {
  code?: string;
  message: string;
  stack?: string;
  context?: any;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * 处理并记录错误
   */
  handleError(error: any, context?: any): ErrorDetails {
    const errorDetails: ErrorDetails = {
      message: this.extractErrorMessage(error),
      timestamp: new Date().toISOString(),
      severity: this.determineSeverity(error),
      context
    };
    
    if (error instanceof Error) {
      errorDetails.code = error.name;
      errorDetails.stack = error.stack;
    }
    
    // 记录错误日志
    this.logError(errorDetails);
    
    return errorDetails;
  }
  
  /**
   * 创建API错误响应
   */
  createApiError(error: any, message: string, context?: any): ApiError {
    const errorDetails = this.handleError(error, context);
    
    return {
      success: false,
      error: 'Internal Server Error',
      message,
      details: errorDetails.message,
      timestamp: errorDetails.timestamp,
      requestId: this.generateRequestId()
    };
  }
  
  /**
   * 数据库错误处理
   */
  handleDatabaseError(error: any, operation: string, query?: string): ErrorDetails {
    const context = {
      operation,
      query: query ? this.sanitizeQuery(query) : undefined,
      type: 'database_error'
    };
    
    const errorDetails = this.handleError(error, context);
    
    // 数据库错误通常是高严重性
    errorDetails.severity = 'high';
    
    return errorDetails;
  }
  
  /**
   * 服务初始化错误处理
   */
  handleServiceError(error: any, serviceName: string): ErrorDetails {
    const context = {
      serviceName,
      type: 'service_error'
    };
    
    const errorDetails = this.handleError(error, context);
    errorDetails.severity = 'critical';
    
    return errorDetails;
  }
  
  /**
   * 提取错误消息
   */
  private extractErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      return error.message || error.error || JSON.stringify(error);
    }
    
    return 'Unknown error occurred';
  }
  
  /**
   * 确定错误严重性
   */
  private determineSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const message = this.extractErrorMessage(error).toLowerCase();
    
    if (message.includes('database') || message.includes('connection')) {
      return 'critical';
    }
    
    if (message.includes('timeout') || message.includes('network')) {
      return 'high';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * 记录错误日志
   */
  private logError(errorDetails: ErrorDetails): void {
    const logLevel = this.getLogLevel(errorDetails.severity);
    const logMessage = `[${errorDetails.severity.toUpperCase()}] ${errorDetails.message}`;
    
    console[logLevel]('❌ 错误详情:', {
      message: errorDetails.message,
      code: errorDetails.code,
      severity: errorDetails.severity,
      timestamp: errorDetails.timestamp,
      context: errorDetails.context,
      stack: errorDetails.stack
    });
  }
  
  /**
   * 获取日志级别
   */
  private getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'log';
    }
  }
  
  /**
   * 清理查询语句（移除敏感信息）
   */
  private sanitizeQuery(query: string): string {
    // 移除可能的敏感信息
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .substring(0, 500); // 限制长度
  }
  
  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 便捷的错误处理函数
 */
export const handleError = (error: any, context?: any) => {
  return ErrorHandler.getInstance().handleError(error, context);
};

export const createApiError = (error: any, message: string, context?: any) => {
  return ErrorHandler.getInstance().createApiError(error, message, context);
};

export const handleDatabaseError = (error: any, operation: string, query?: string) => {
  return ErrorHandler.getInstance().handleDatabaseError(error, operation, query);
};

export const handleServiceError = (error: any, serviceName: string) => {
  return ErrorHandler.getInstance().handleServiceError(error, serviceName);
};

/**
 * 异步错误包装器
 */
export const withErrorHandling = <T>(
  operation: () => Promise<T>,
  context?: any
): Promise<T> => {
  return operation().catch((error) => {
    handleError(error, context);
    throw error;
  });
};
