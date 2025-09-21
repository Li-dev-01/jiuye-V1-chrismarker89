/**
 * 用户内容管理页面测试
 * 用于测试 UserContentManagementPage 组件的加载问题
 */

import React, { useState, Suspense } from 'react';
import { Card, Button, Typography, Space, Alert, Spin } from 'antd';
import { BugOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 直接导入 UserContentManagementPage 组件
const UserContentManagementPage = React.lazy(() => 
  import('../admin/UserContentManagementPage').then(module => {
    console.log('UserContentManagementPage module:', module);
    return { default: module.default };
  }).catch(error => {
    console.error('Failed to load UserContentManagementPage:', error);
    throw error;
  })
);

export const UserContentTestPage: React.FC = () => {
  const [showComponent, setShowComponent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestLoad = () => {
    setError(null);
    setShowComponent(true);
  };

  const handleReset = () => {
    setShowComponent(false);
    setError(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={3}>
          <ExperimentOutlined /> 用户内容管理页面测试
        </Title>
        
        <Space style={{ marginBottom: 16 }}>
          <Button 
            type="primary"
            icon={<BugOutlined />}
            onClick={handleTestLoad}
            disabled={showComponent}
          >
            测试加载组件
          </Button>
          <Button 
            onClick={handleReset}
            disabled={!showComponent}
          >
            重置测试
          </Button>
        </Space>

        {error && (
          <Alert
            message="组件加载失败"
            description={error}
            type="error"
            style={{ marginBottom: 16 }}
          />
        )}

        {showComponent && (
          <Card title="UserContentManagementPage 组件测试" style={{ marginTop: 16 }}>
            <Suspense 
              fallback={
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Text>正在加载 UserContentManagementPage 组件...</Text>
                  </div>
                </div>
              }
            >
              <ErrorBoundary onError={setError}>
                <UserContentManagementPage />
              </ErrorBoundary>
            </Suspense>
          </Card>
        )}

        <Card title="测试说明" style={{ marginTop: 16 }}>
          <Text>
            这个测试页面用于验证 UserContentManagementPage 组件是否能正常加载和渲染。
            如果组件加载失败，会显示具体的错误信息。
          </Text>
        </Card>
      </Card>
    </div>
  );
};

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: string) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UserContentManagementPage Error:', error, errorInfo);
    this.props.onError(`${error.name}: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="组件渲染错误"
          description="UserContentManagementPage 组件在渲染过程中发生错误，请查看控制台获取详细信息。"
          type="error"
        />
      );
    }

    return this.props.children;
  }
}

export default UserContentTestPage;
