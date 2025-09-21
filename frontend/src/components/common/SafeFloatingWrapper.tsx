/**
 * 安全悬浮组件包装器
 * 为悬浮组件提供错误边界、状态隔离和降级机制
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button, Alert, Space } from 'antd';
import { ReloadOutlined, CloseOutlined } from '@ant-design/icons';

interface SafeFloatingWrapperProps {
  children: ReactNode;
  componentName: string;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onClose?: () => void;
  showErrorDetails?: boolean;
  retryable?: boolean;
}

interface SafeFloatingWrapperState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * 安全悬浮组件包装器类
 * 提供错误边界、重试机制和降级策略
 */
export class SafeFloatingWrapper extends Component<
  SafeFloatingWrapperProps,
  SafeFloatingWrapperState
> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: SafeFloatingWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<SafeFloatingWrapperState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`SafeFloatingWrapper [${this.props.componentName}] caught error:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 调用外部错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 记录错误到监控系统
    this.logError(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * 记录错误到监控系统
   */
  private logError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // 发送错误到监控服务
      const errorData = {
        component: this.props.componentName,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // 这里可以集成实际的错误监控服务
      console.warn('FloatingComponent Error:', errorData);
      
      // 可以发送到后端或第三方监控服务
      // errorMonitoringService.reportError(errorData);
    } catch (loggingError) {
      console.error('Failed to log floating component error:', loggingError);
    }
  };

  /**
   * 重试组件渲染
   */
  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      console.warn(`SafeFloatingWrapper [${this.props.componentName}] exceeded max retries`);
      return;
    }

    console.log(`SafeFloatingWrapper [${this.props.componentName}] retrying... (${retryCount + 1}/${this.maxRetries})`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    });
  };

  /**
   * 关闭组件
   */
  private handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  /**
   * 渲染错误状态
   */
  private renderErrorState = () => {
    const { componentName, fallbackComponent, showErrorDetails = false, retryable = true } = this.props;
    const { error, retryCount } = this.state;

    // 如果提供了降级组件，优先使用
    if (fallbackComponent) {
      return fallbackComponent;
    }

    // 如果超过最大重试次数，显示最小化错误提示
    if (retryCount >= this.maxRetries) {
      return (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <Alert
            message={`${componentName} 暂时不可用`}
            type="warning"
            showIcon
            closable
            onClose={this.handleClose}
            style={{ fontSize: '12px' }}
          />
        </div>
      );
    }

    // 显示详细错误信息和重试选项
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        maxWidth: '350px'
      }}>
        <Alert
          message={`${componentName} 出现错误`}
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {showErrorDetails && error && (
                <div style={{ 
                  fontSize: '11px', 
                  color: '#666',
                  maxHeight: '60px',
                  overflow: 'auto',
                  backgroundColor: '#f5f5f5',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {error.message}
                </div>
              )}
              <Space>
                {retryable && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                  >
                    重试 ({retryCount}/{this.maxRetries})
                  </Button>
                )}
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={this.handleClose}
                >
                  关闭
                </Button>
              </Space>
            </Space>
          }
          type="error"
          showIcon
        />
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderErrorState();
    }

    return this.props.children;
  }
}

/**
 * 安全悬浮组件高阶组件
 */
export const withSafeFloating = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    componentName: string;
    fallbackComponent?: ReactNode;
    showErrorDetails?: boolean;
    retryable?: boolean;
  }
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <SafeFloatingWrapper
      componentName={options.componentName}
      fallbackComponent={options.fallbackComponent}
      showErrorDetails={options.showErrorDetails}
      retryable={options.retryable}
    >
      <WrappedComponent {...props} ref={ref} />
    </SafeFloatingWrapper>
  ));
};

export default SafeFloatingWrapper;
