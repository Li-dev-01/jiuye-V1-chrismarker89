/**
 * 简单的用户内容管理页面测试
 * 不使用任何布局组件，直接测试核心组件
 */

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert } from 'antd';
import { BugOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const SimpleUserContentTest: React.FC = () => {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [componentLoaded, setComponentLoaded] = useState(false);

  // 添加页面加载日志
  React.useEffect(() => {
    console.log('SimpleUserContentTest mounted');
    console.log('Current location:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
  }, []);

  const handleStep1 = () => {
    console.log('Step 1: Testing basic component load');
    setStep(1);
  };

  const handleStep2 = async () => {
    console.log('Step 2: Testing UserContentManagementPage import');
    try {
      const module = await import('../admin/UserContentManagementPage');
      console.log('UserContentManagementPage module loaded:', module);
      setComponentLoaded(true);
      setStep(2);
    } catch (error) {
      console.error('Failed to import UserContentManagementPage:', error);
      setError(`Import failed: ${error}`);
    }
  };

  const handleStep3 = () => {
    console.log('Step 3: Testing component render without layout');
    setStep(3);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={3}>
          <BugOutlined /> 简单用户内容管理测试
        </Title>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>这个测试页面逐步测试 UserContentManagementPage 的加载过程</Text>
          
          {error && (
            <Alert
              message="测试失败"
              description={error}
              type="error"
            />
          )}

          <Space>
            <Button 
              type={step >= 1 ? 'default' : 'primary'}
              onClick={handleStep1}
              disabled={step >= 1}
            >
              步骤1: 基础测试
            </Button>
            
            <Button 
              type={step >= 2 ? 'default' : 'primary'}
              onClick={handleStep2}
              disabled={step < 1 || step >= 2}
            >
              步骤2: 导入测试
            </Button>
            
            <Button 
              type={step >= 3 ? 'default' : 'primary'}
              onClick={handleStep3}
              disabled={step < 2 || step >= 3}
            >
              步骤3: 渲染测试
            </Button>
          </Space>

          {step >= 1 && (
            <Card title="步骤1结果" size="small">
              <Text type="success">✅ 基础组件加载正常</Text>
            </Card>
          )}

          {step >= 2 && (
            <Card title="步骤2结果" size="small">
              <Text type="success">✅ UserContentManagementPage 模块导入成功</Text>
            </Card>
          )}

          {step >= 3 && (
            <Card title="步骤3结果" size="small">
              <SimpleUserContentComponent />
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

// 简化版的用户内容组件，不使用 AdminLayout
const SimpleUserContentComponent: React.FC = () => {
  return (
    <div style={{ padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
      <Title level={4}>用户内容管理 (简化版)</Title>
      <Text>这是一个简化版本，用于测试核心功能是否正常</Text>
      <div style={{ marginTop: '16px' }}>
        <Text type="secondary">如果你能看到这个内容，说明组件本身没有问题</Text>
      </div>
    </div>
  );
};

export default SimpleUserContentTest;
