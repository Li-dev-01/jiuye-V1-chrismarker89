/**
 * Google OAuth调试页面
 * 用于直接测试Google OAuth功能
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, message } from 'antd';
import { GoogleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export const GoogleOAuthDebugPage: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // 检查配置
    const configInfo = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      currentUrl: window.location.href
    };
    setConfig(configInfo);
    
    addTestResult(`配置检查完成: Client ID = ${configInfo.clientId}`);
    addTestResult(`重定向URI = ${configInfo.redirectUri}`);
    addTestResult(`API基础URL = ${configInfo.apiBaseUrl}`);
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testBackendHealth = async () => {
    try {
      addTestResult('开始测试后端健康检查...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/health`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        addTestResult(`✅ 后端健康检查成功: ${data.data.status}`);
        message.success('后端连接正常');
      } else {
        addTestResult(`❌ 后端健康检查失败: ${data.message}`);
        message.error('后端连接异常');
      }
    } catch (error) {
      addTestResult(`❌ 后端连接错误: ${error}`);
      message.error('后端连接失败');
    }
  };

  const testGoogleOAuthCallback = async () => {
    try {
      addTestResult('开始测试Google OAuth回调端点...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: 'test_code',
          redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI
        })
      });
      
      const data = await response.json();
      addTestResult(`OAuth回调测试响应: ${JSON.stringify(data, null, 2)}`);
      
      if (data.error === 'OAuth Error' && data.message.includes('Failed to exchange code for token')) {
        addTestResult('✅ OAuth回调端点正常工作（预期的测试代码错误）');
        message.success('OAuth回调端点配置正确');
      } else {
        addTestResult('❓ OAuth回调响应异常');
        message.warning('OAuth回调响应异常');
      }
    } catch (error) {
      addTestResult(`❌ OAuth回调测试错误: ${error}`);
      message.error('OAuth回调测试失败');
    }
  };

  const startGoogleOAuth = () => {
    if (!config?.clientId || config.clientId === 'your-google-client-id.apps.googleusercontent.com') {
      message.error('Google Client ID未正确配置');
      addTestResult('❌ Google Client ID未配置');
      return;
    }

    addTestResult('开始Google OAuth流程...');
    
    // 构建Google OAuth URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: 'debug_test'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    addTestResult(`Google OAuth URL: ${authUrl}`);
    
    // 跳转到Google OAuth
    window.location.href = authUrl;
  };

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve(window.gapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        addTestResult('✅ Google API脚本加载成功');
        resolve(window.gapi);
      };
      script.onerror = () => {
        addTestResult('❌ Google API脚本加载失败');
        reject(new Error('Failed to load Google API script'));
      };
      document.head.appendChild(script);
    });
  };

  const testGoogleScriptLoading = async () => {
    try {
      addTestResult('开始测试Google API脚本加载...');
      await loadGoogleScript();
      message.success('Google API脚本加载成功');
    } catch (error) {
      addTestResult(`❌ Google API脚本加载失败: ${error}`);
      message.error('Google API脚本加载失败');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2}>
        <GoogleOutlined style={{ marginRight: '8px' }} />
        Google OAuth 调试页面
      </Title>
      
      <Alert
        message="调试说明"
        description="此页面用于调试Google OAuth集成。请确保后端服务器正在运行，并且Google OAuth配置正确。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 配置信息 */}
      <Card title="配置信息" style={{ marginBottom: '24px' }}>
        {config && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Google Client ID: </Text>
              <Text code>{config.clientId}</Text>
            </div>
            <div>
              <Text strong>重定向URI: </Text>
              <Text code>{config.redirectUri}</Text>
            </div>
            <div>
              <Text strong>API基础URL: </Text>
              <Text code>{config.apiBaseUrl}</Text>
            </div>
            <div>
              <Text strong>当前页面URL: </Text>
              <Text code>{config.currentUrl}</Text>
            </div>
          </Space>
        )}
      </Card>

      {/* 测试按钮 */}
      <Card title="测试功能" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={testBackendHealth}
          >
            测试后端健康检查
          </Button>
          
          <Button 
            icon={<ExclamationCircleOutlined />}
            onClick={testGoogleOAuthCallback}
          >
            测试OAuth回调端点
          </Button>
          
          <Button 
            icon={<GoogleOutlined />}
            onClick={testGoogleScriptLoading}
          >
            测试Google脚本加载
          </Button>
          
          <Button 
            type="primary" 
            danger
            icon={<GoogleOutlined />}
            onClick={startGoogleOAuth}
          >
            启动Google OAuth流程
          </Button>
        </Space>
      </Card>

      {/* 测试结果 */}
      <Card title="测试日志">
        <div style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '4px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {testResults.map((result, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              {result}
            </div>
          ))}
          {testResults.length === 0 && (
            <Text type="secondary">暂无测试日志</Text>
          )}
        </div>
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明" style={{ marginTop: '24px' }}>
        <Paragraph>
          <Title level={4}>测试步骤：</Title>
          <ol>
            <li>首先点击"测试后端健康检查"确保后端服务正常</li>
            <li>点击"测试OAuth回调端点"验证OAuth端点配置</li>
            <li>点击"测试Google脚本加载"验证Google API可访问性</li>
            <li>最后点击"启动Google OAuth流程"进行完整的OAuth测试</li>
          </ol>
        </Paragraph>
        
        <Paragraph>
          <Title level={4}>注意事项：</Title>
          <ul>
            <li>确保Google Cloud Console中已正确配置重定向URI</li>
            <li>确保后端服务器运行在 localhost:8787</li>
            <li>确保前端服务器运行在 localhost:5174</li>
            <li>OAuth流程会跳转到Google登录页面，完成后会返回到回调页面</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  );
};

export default GoogleOAuthDebugPage;
