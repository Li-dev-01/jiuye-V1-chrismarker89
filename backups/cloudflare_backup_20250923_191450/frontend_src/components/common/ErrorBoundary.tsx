/**
 * 增强的错误边界组件
 * 提供更好的用户体验和错误报告功能
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Card, Space, Alert } from 'antd';
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { errorMonitor } from '../../utils/errorMonitor';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 报告错误到监控服务
    this.reportError(error, errorInfo);
  }

  /**
   * 报告错误
   */
  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // 使用现有的错误监控服务
      errorMonitor.captureError({
        message: error.message,
        stack: error.stack,
        level: 'error',
        category: 'react',
        extra: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });

      console.error('错误已报告:', {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack
      });
    } catch (reportError) {
      console.error('错误报告发送失败:', reportError);
    }
  };

  /**
   * 重置错误状态
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  /**
   * 刷新页面
   */
  private handleReload = () => {
    window.location.reload();
  };

  /**
   * 返回首页
   */
  private handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * 复制错误信息
   */
  private handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorText = `
错误ID: ${errorId}
时间: ${new Date().toISOString()}
错误信息: ${error?.message}
错误堆栈: ${error?.stack}
组件堆栈: ${errorInfo?.componentStack}
页面URL: ${window.location.href}
用户代理: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      console.log('错误信息已复制到剪贴板');
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div style={{ padding: '50px 20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Card style={{ maxWidth: 800, margin: '0 auto' }}>
            <Result
              status="error"
              icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
              title="页面出现了错误"
              subTitle="抱歉，页面遇到了意外错误。我们已经记录了这个问题，请稍后重试。"
              extra={
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Space wrap>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleReload}>
                      刷新页面
                    </Button>
                    <Button icon={<HomeOutlined />} onClick={this.handleGoHome}>
                      返回首页
                    </Button>
                    <Button onClick={this.handleReset}>
                      重试
                    </Button>
                  </Space>

                  {isDevelopment && (
                    <Alert
                      message="开发模式错误信息"
                      description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text code>错误ID: {errorId}</Text>
                          <Text code>错误信息: {error?.message}</Text>
                          <Button size="small" onClick={this.handleCopyError}>
                            复制详细错误信息
                          </Button>
                        </Space>
                      }
                      type="warning"
                      showIcon
                    />
                  )}

                  <Alert
                    message="如果问题持续存在"
                    description={
                      <Paragraph>
                        请联系技术支持，并提供错误ID: <Text code>{errorId}</Text>
                        <br />
                        邮箱: support@employment-survey.com
                      </Paragraph>
                    }
                    type="info"
                    showIcon
                  />
                </Space>
              }
            />
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook：在函数组件中使用错误处理
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    // 创建一个错误事件，让最近的错误边界捕获
    const errorEvent = new CustomEvent('react-error', {
      detail: { error, errorInfo }
    });
    window.dispatchEvent(errorEvent);
  };
}
