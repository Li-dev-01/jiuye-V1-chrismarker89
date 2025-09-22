/**
 * Google OAuth测试页面
 * 用于调试和验证Google OAuth集成
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, Tag, message } from 'antd';
import { GoogleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { googleOAuthService } from '../../services/googleOAuthService';

const { Title, Text, Paragraph } = Typography;

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export const GoogleOAuthTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [configInfo, setConfigInfo] = useState<any>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    const config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      isAvailable: googleOAuthService.isAvailable()
    };
    
    setConfigInfo(config);
    
    const results: TestResult[] = [
      {
        test: 'Google Client ID配置',
        status: config.clientId && config.clientId !== 'your-google-client-id.apps.googleusercontent.com' ? 'success' : 'error',
        message: config.clientId ? `已配置: ${config.clientId}` : '未配置或使用默认值'
      },
      {
        test: '重定向URI配置',
        status: config.redirectUri ? 'success' : 'error',
        message: config.redirectUri || '未配置'
      },
      {
        test: 'API基础URL配置',
        status: config.apiBaseUrl ? 'success' : 'error',
        message: config.apiBaseUrl || '未配置'
      },
      {
        test: 'Google OAuth服务可用性',
        status: config.isAvailable ? 'success' : 'error',
        message: config.isAvailable ? '服务可用' : '服务不可用'
      }
    ];
    
    setTestResults(results);
  };

  const testGoogleScriptLoading = async () => {
    setIsLoading(true);
    try {
      await googleOAuthService.initialize();
      addTestResult('Google脚本加载', 'success', 'Google API脚本加载成功');
    } catch (error) {
      addTestResult('Google脚本加载', 'error', `加载失败: ${error}`);
    }
    setIsLoading(false);
  };

  const testBackendConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/health`);
      if (response.ok) {
        addTestResult('后端连接', 'success', '后端服务连接正常');
      } else {
        addTestResult('后端连接', 'error', `后端响应错误: ${response.status}`);
      }
    } catch (error) {
      addTestResult('后端连接', 'error', `连接失败: ${error}`);
    }
    setIsLoading(false);
  };

  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string, data?: any) => {
    setTestResults(prev => [
      ...prev.filter(r => r.test !== test),
      { test, status, message, data }
    ]);
  };

  const handleQuestionnaireLogin = (userData: any) => {
    addTestResult('问卷用户登录', 'success', '问卷用户登录成功', userData);
    message.success('问卷用户登录测试成功！');
  };

  const handleManagementLogin = (userData: any) => {
    addTestResult('管理员登录', 'success', '管理员登录成功', userData);
    message.success('管理员登录测试成功！');
  };

  const handleLoginError = (error: string, type: string) => {
    addTestResult(`${type}登录`, 'error', error);
    message.error(`${type}登录测试失败: ${error}`);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <GoogleOutlined style={{ marginRight: '8px' }} />
        Google OAuth 集成测试
      </Title>
      
      <Alert
        message="测试说明"
        description="此页面用于测试和调试Google OAuth集成功能。请确保已正确配置Google OAuth客户端ID和重定向URI。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 配置信息 */}
      <Card title="配置信息" style={{ marginBottom: '24px' }}>
        {configInfo && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Google Client ID: </Text>
              <Text code>{configInfo.clientId}</Text>
            </div>
            <div>
              <Text strong>重定向URI: </Text>
              <Text code>{configInfo.redirectUri}</Text>
            </div>
            <div>
              <Text strong>API基础URL: </Text>
              <Text code>{configInfo.apiBaseUrl}</Text>
            </div>
            <div>
              <Text strong>服务状态: </Text>
              <Tag color={configInfo.isAvailable ? 'green' : 'red'}>
                {configInfo.isAvailable ? '可用' : '不可用'}
              </Tag>
            </div>
          </Space>
        )}
      </Card>

      {/* 测试结果 */}
      <Card title="测试结果" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {testResults.map((result, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {result.status === 'success' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              {result.status === 'error' && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              {result.status === 'pending' && <ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              <Text strong>{result.test}: </Text>
              <Text type={result.status === 'error' ? 'danger' : result.status === 'success' ? 'success' : 'warning'}>
                {result.message}
              </Text>
              {result.data && (
                <Text code style={{ fontSize: '12px' }}>
                  {JSON.stringify(result.data, null, 2)}
                </Text>
              )}
            </div>
          ))}
        </Space>
      </Card>

      {/* 手动测试 */}
      <Card title="手动测试" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={4}>基础功能测试</Title>
            <Space>
              <Button 
                onClick={testGoogleScriptLoading} 
                loading={isLoading}
                icon={<GoogleOutlined />}
              >
                测试Google脚本加载
              </Button>
              <Button 
                onClick={testBackendConnection} 
                loading={isLoading}
              >
                测试后端连接
              </Button>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={4}>Google OAuth登录测试</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Paragraph>
                  <Text strong>问卷用户登录测试：</Text>
                  <br />
                  测试普通用户通过Google OAuth登录并创建半匿名身份的功能。
                </Paragraph>
                <GoogleLoginButton
                  userType="questionnaire"
                  type="primary"
                  size="large"
                  onSuccess={handleQuestionnaireLogin}
                  onError={(error) => handleLoginError(error, '问卷用户')}
                  style={{ width: '200px' }}
                />
              </div>

              <div>
                <Paragraph>
                  <Text strong>管理员登录测试：</Text>
                  <br />
                  测试管理员通过Google OAuth登录并验证白名单的功能。
                </Paragraph>
                <GoogleLoginButton
                  userType="management"
                  type="default"
                  size="large"
                  onSuccess={handleManagementLogin}
                  onError={(error) => handleLoginError(error, '管理员')}
                  style={{ width: '200px' }}
                />
              </div>
            </Space>
          </div>
        </Space>
      </Card>

      {/* 调试信息 */}
      <Card title="调试信息">
        <Paragraph>
          <Text strong>当前URL: </Text>
          <Text code>{window.location.href}</Text>
        </Paragraph>
        <Paragraph>
          <Text strong>User Agent: </Text>
          <Text code style={{ fontSize: '12px' }}>{navigator.userAgent}</Text>
        </Paragraph>
      </Card>
    </div>
  );
};

export default GoogleOAuthTestPage;
