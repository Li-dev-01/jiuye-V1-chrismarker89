/**
 * 错误处理工具类
 * 提供统一的错误处理、报告和用户提示功能
 */

import { message, notification } from 'antd';
import { AxiosError } from 'axios';

export interface ErrorReport {
  id: string;
  type: 'javascript' | 'network' | 'api' | 'validation' | 'permission';
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  context?: any;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  timestamp: number;
  details?: any;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isReporting = false;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers() {
    // 捕获未处理的JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason);
    });

    // 捕获React错误边界事件
    window.addEventListener('react-error', (event: any) => {
      this.handleReactError(event.detail.error, event.detail.errorInfo);
    });
  }

  /**
   * 处理JavaScript错误
   */
  private handleJavaScriptError(error: Error, context?: any) {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      context
    };

    this.reportError(errorReport);
    this.showUserFriendlyError('页面出现了错误', '请刷新页面重试，如果问题持续存在请联系技术支持。');
  }

  /**
   * 处理Promise拒绝
   */
  private handlePromiseRejection(reason: any) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      context: { type: 'unhandled_promise_rejection' }
    };

    this.reportError(errorReport);
  }

  /**
   * 处理React错误
   */
  private handleReactError(error: Error, errorInfo: any) {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      context: { componentStack: errorInfo?.componentStack }
    };

    this.reportError(errorReport);
  }

  /**
   * 处理API错误
   */
  handleApiError(error: AxiosError<ApiError>) {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: 'api',
      message: error.response?.data?.message || error.message,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      context: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data
      }
    };

    this.reportError(errorReport);

    // 根据错误类型显示不同的用户提示
    if (error.response?.status === 401) {
      this.showAuthError();
    } else if (error.response?.status === 403) {
      this.showPermissionError();
    } else if (error.response?.status === 404) {
      this.showNotFoundError();
    } else if (error.response?.status >= 500) {
      this.showServerError();
    } else {
      this.showGenericApiError(error.response?.data?.message);
    }
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error: Error) {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: 'network',
      message: error.message,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      context: { type: 'network_error' }
    };

    this.reportError(errorReport);
    this.showNetworkError();
  }

  /**
   * 处理验证错误
   */
  handleValidationError(errors: Record<string, string[]>) {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: 'validation',
      message: '表单验证失败',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      context: { validationErrors: errors }
    };

    this.reportError(errorReport);
    this.showValidationErrors(errors);
  }

  /**
   * 显示认证错误
   */
  private showAuthError() {
    notification.error({
      message: '认证失败',
      description: '您的登录状态已过期，请重新登录。',
      duration: 5,
      onClick: () => {
        ErrorHandler.redirectToLogin();
      }
    });
  }

  /**
   * 重定向到适当的登录页面
   */
  static redirectToLogin(): void {
    // 根据当前路径判断用户类型，跳转到对应的登录页面
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      window.location.href = '/admin/login';
    } else if (currentPath.startsWith('/reviewer')) {
      window.location.href = '/reviewer/login';
    } else {
      // 普通用户和访客使用半匿名登录
      window.location.href = '/auth/login';
    }
  }

  /**
   * 显示权限错误
   */
  private showPermissionError() {
    notification.error({
      message: '权限不足',
      description: '您没有权限执行此操作。',
      duration: 5
    });
  }

  /**
   * 显示404错误
   */
  private showNotFoundError() {
    message.error('请求的资源不存在');
  }

  /**
   * 显示服务器错误
   */
  private showServerError() {
    notification.error({
      message: '服务器错误',
      description: '服务器遇到了问题，请稍后重试。如果问题持续存在，请联系技术支持。',
      duration: 8
    });
  }

  /**
   * 显示通用API错误
   */
  private showGenericApiError(errorMessage?: string) {
    message.error(errorMessage || '操作失败，请重试');
  }

  /**
   * 显示网络错误
   */
  private showNetworkError() {
    notification.error({
      message: '网络连接错误',
      description: '请检查您的网络连接，然后重试。',
      duration: 8
    });
  }

  /**
   * 显示验证错误
   */
  private showValidationErrors(errors: Record<string, string[]>) {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');

    notification.error({
      message: '表单验证失败',
      description: errorMessages,
      duration: 8
    });
  }

  /**
   * 显示用户友好的错误信息
   */
  private showUserFriendlyError(title: string, description: string) {
    notification.error({
      message: title,
      description,
      duration: 8
    });
  }

  /**
   * 报告错误到服务器
   */
  private async reportError(errorReport: ErrorReport) {
    this.errorQueue.push(errorReport);
    
    if (!this.isReporting) {
      this.processErrorQueue();
    }
  }

  /**
   * 处理错误队列
   */
  private async processErrorQueue() {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      const errors = [...this.errorQueue];
      this.errorQueue = [];

      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors })
      });

      console.log(`已报告 ${errors.length} 个错误`);
    } catch (error) {
      console.error('错误报告发送失败:', error);
      // 如果发送失败，将错误重新加入队列
      this.errorQueue.unshift(...this.errorQueue);
    } finally {
      this.isReporting = false;
      
      // 如果队列中还有错误，继续处理
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processErrorQueue(), 5000);
      }
    }
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取用户ID
   */
  private getUserId(): string {
    return localStorage.getItem('userId') || 'anonymous';
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 导出便捷方法
export const handleApiError = (error: AxiosError<ApiError>) => errorHandler.handleApiError(error);
export const handleNetworkError = (error: Error) => errorHandler.handleNetworkError(error);
export const handleValidationError = (errors: Record<string, string[]>) => errorHandler.handleValidationError(errors);
