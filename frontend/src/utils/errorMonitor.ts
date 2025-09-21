// 错误监控工具

interface ErrorInfo {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  level: 'error' | 'warning' | 'info';
  category: 'javascript' | 'network' | 'resource' | 'unhandledRejection' | 'react';
  extra?: Record<string, any>;
}

interface NetworkError {
  url: string;
  status: number;
  statusText: string;
  method: string;
  timestamp: number;
}

class ErrorMonitor {
  private errors: ErrorInfo[] = [];
  private networkErrors: NetworkError[] = [];
  private maxErrors = 100;
  private reportUrl = '/api/errors';

  constructor() {
    this.initializeErrorHandlers();
  }

  private initializeErrorHandlers(): void {
    // 全局 JavaScript 错误处理
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: 'error',
        category: 'javascript'
      });
    });

    // 未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: 'error',
        category: 'unhandledRejection',
        extra: { reason: event.reason }
      });
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.captureError({
          message: `Resource failed to load: ${target.tagName}`,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          level: 'error',
          category: 'resource',
          extra: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href
          }
        });
      }
    }, true);

    // 监控网络请求错误
    this.interceptFetch();
    this.interceptXHR();
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        
        // 记录失败的请求
        if (!response.ok) {
          this.captureNetworkError({
            url: args[0] as string,
            status: response.status,
            statusText: response.statusText,
            method: (args[1]?.method || 'GET').toUpperCase(),
            timestamp: Date.now()
          });
        }
        
        return response;
      } catch (error) {
        // 记录网络错误
        this.captureNetworkError({
          url: args[0] as string,
          status: 0,
          statusText: 'Network Error',
          method: (args[1]?.method || 'GET').toUpperCase(),
          timestamp: Date.now()
        });
        
        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      (this as any)._method = method;
      (this as any)._url = url;
      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      
      xhr.addEventListener('error', () => {
        errorMonitor.captureNetworkError({
          url: (xhr as any)._url,
          status: xhr.status,
          statusText: xhr.statusText,
          method: (xhr as any)._method,
          timestamp: Date.now()
        });
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 400) {
          errorMonitor.captureNetworkError({
            url: (xhr as any)._url,
            status: xhr.status,
            statusText: xhr.statusText,
            method: (xhr as any)._method,
            timestamp: Date.now()
          });
        }
      });

      return originalSend.call(this, ...args);
    };
  }

  public captureError(errorInfo: Partial<ErrorInfo>): void {
    const fullErrorInfo: ErrorInfo = {
      message: errorInfo.message || 'Unknown error',
      stack: errorInfo.stack,
      filename: errorInfo.filename,
      lineno: errorInfo.lineno,
      colno: errorInfo.colno,
      timestamp: errorInfo.timestamp || Date.now(),
      userAgent: errorInfo.userAgent || navigator.userAgent,
      url: errorInfo.url || window.location.href,
      level: errorInfo.level || 'error',
      category: errorInfo.category || 'javascript',
      userId: errorInfo.userId || this.currentUserId,
      extra: errorInfo.extra
    };

    this.errors.push(fullErrorInfo);

    // 限制错误数量
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // 立即报告严重错误
    // 暂时禁用服务器上报，避免405错误
    // if (fullErrorInfo.level === 'error') {
    //   this.reportError(fullErrorInfo);
    // }

    console.error('Error captured:', fullErrorInfo);
  }

  public captureNetworkError(networkError: NetworkError): void {
    this.networkErrors.push(networkError);

    // 限制网络错误数量
    if (this.networkErrors.length > this.maxErrors) {
      this.networkErrors.shift();
    }

    console.warn('Network error captured:', networkError);
  }

  public captureException(error: Error, extra?: Record<string, any>): void {
    this.captureError({
      message: error.message,
      stack: error.stack,
      level: 'error',
      category: 'javascript',
      extra
    });
  }

  public captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', extra?: Record<string, any>): void {
    this.captureError({
      message,
      level,
      category: 'javascript',
      extra
    });
  }

  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    try {
      await fetch(this.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo)
      });
    } catch (error) {
      console.warn('Failed to report error:', error);
    }
  }

  public getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  public getNetworkErrors(): NetworkError[] {
    return [...this.networkErrors];
  }

  public clearErrors(): void {
    this.errors = [];
    this.networkErrors = [];
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsByLevel: Record<string, number>;
    recentErrors: ErrorInfo[];
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsByLevel: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1;
    });

    const recentErrors = this.errors
      .filter(error => Date.now() - error.timestamp < 24 * 60 * 60 * 1000) // 最近24小时
      .slice(-10); // 最近10个

    return {
      totalErrors: this.errors.length,
      errorsByCategory,
      errorsByLevel,
      recentErrors
    };
  }

  private currentUserId?: string;

  public setUserId(userId: string): void {
    this.currentUserId = userId;
  }
}

// 创建全局错误监控实例
export const errorMonitor = new ErrorMonitor();



export default errorMonitor;
