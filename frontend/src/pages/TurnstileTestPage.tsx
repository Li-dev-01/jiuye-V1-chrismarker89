/**
 * Turnstile测试页面
 * 用于验证Turnstile配置是否正确
 */

import React, { useState } from 'react';
import { Card, Button, message, Alert, Descriptions, Tag, Space } from 'antd';
import { SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import TurnstileVerification from '../components/common/TurnstileVerification';

const TurnstileTestPage: React.FC = () => {
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isTestingBackend, setIsTestingBackend] = useState(false);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // 测试后端验证
  const testBackendVerification = async () => {
    if (!turnstileToken) {
      message.error('请先完成Turnstile验证');
      return;
    }

    setIsTestingBackend(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/test/turnstile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          turnstileToken,
          testData: {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            page: 'turnstile-test'
          }
        })
      });

      const result = await response.json();
      setVerificationResult(result);

      if (result.success) {
        message.success('后端验证成功！');
      } else {
        message.error(`后端验证失败: ${result.message}`);
      }
    } catch (error) {
      message.error('后端验证请求失败');
      setVerificationResult({
        success: false,
        error: 'Network Error',
        message: '网络请求失败'
      });
    } finally {
      setIsTestingBackend(false);
    }
  };

  // 重置测试
  const resetTest = () => {
    setTurnstileToken('');
    setVerificationResult(null);
    window.location.reload(); // 重新加载页面以重置Turnstile
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card 
        title={
          <Space>
            <SafetyOutlined />
            Cloudflare Turnstile 测试页面
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Alert
          message="测试说明"
          description="此页面用于测试Cloudflare Turnstile的前端集成和后端验证是否正常工作"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 配置信息 */}
        <Card title="配置信息" size="small" style={{ marginBottom: 24 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Site Key">
              <code>{siteKey || '未配置'}</code>
              {siteKey ? (
                <Tag color="green" style={{ marginLeft: 8 }}>已配置</Tag>
              ) : (
                <Tag color="red" style={{ marginLeft: 8 }}>未配置</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="API Base URL">
              <code>{apiBaseUrl}</code>
            </Descriptions.Item>
            <Descriptions.Item label="环境">
              <Tag color="blue">{import.meta.env.MODE}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Turnstile验证区域 */}
        <Card title="第一步: 前端Turnstile验证" size="small" style={{ marginBottom: 24 }}>
          {siteKey ? (
            <div>
              <TurnstileVerification
                siteKey={siteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  message.success('Turnstile验证成功！');
                  console.log('Turnstile Token:', token);
                }}
                onError={(error) => {
                  message.error(`Turnstile验证失败: ${error}`);
                  console.error('Turnstile Error:', error);
                }}
                onExpired={() => {
                  setTurnstileToken('');
                  message.warning('Turnstile验证已过期，请重新验证');
                }}
                action="test-verification"
                theme="light"
              />
              
              {turnstileToken && (
                <Alert
                  message="前端验证成功"
                  description={
                    <div>
                      <p>获得Token: <code>{turnstileToken.substring(0, 20)}...</code></p>
                      <p>现在可以测试后端验证</p>
                    </div>
                  }
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          ) : (
            <Alert
              message="配置错误"
              description="Turnstile Site Key未配置，请检查环境变量 VITE_TURNSTILE_SITE_KEY"
              type="error"
              showIcon
            />
          )}
        </Card>

        {/* 后端验证区域 */}
        <Card title="第二步: 后端Token验证" size="small" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              onClick={testBackendVerification}
              loading={isTestingBackend}
              disabled={!turnstileToken}
              icon={<SafetyOutlined />}
            >
              测试后端验证
            </Button>

            {verificationResult && (
              <Alert
                message={verificationResult.success ? "后端验证成功" : "后端验证失败"}
                description={
                  <div>
                    <p><strong>状态:</strong> {verificationResult.success ? '成功' : '失败'}</p>
                    <p><strong>消息:</strong> {verificationResult.message}</p>
                    {verificationResult.details && (
                      <div>
                        <p><strong>详细信息:</strong></p>
                        <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                          {JSON.stringify(verificationResult.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                }
                type={verificationResult.success ? "success" : "error"}
                showIcon
                icon={verificationResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              />
            )}
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Card title="测试操作" size="small">
          <Space>
            <Button onClick={resetTest}>
              重置测试
            </Button>
            <Button 
              type="link" 
              onClick={() => window.open('https://dash.cloudflare.com/turnstile', '_blank')}
            >
              打开Cloudflare Turnstile控制台
            </Button>
          </Space>
        </Card>
      </Card>

      {/* 调试信息 */}
      {import.meta.env.MODE === 'development' && (
        <Card title="调试信息" size="small">
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
            {JSON.stringify({
              siteKey,
              apiBaseUrl,
              environment: import.meta.env.MODE,
              turnstileEnabled: import.meta.env.VITE_TURNSTILE_ENABLED,
              hasToken: !!turnstileToken,
              tokenLength: turnstileToken?.length || 0
            }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default TurnstileTestPage;
