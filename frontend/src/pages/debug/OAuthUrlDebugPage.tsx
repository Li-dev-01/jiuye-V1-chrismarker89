/**
 * OAuth URL调试页面
 * 用于检查和测试Google OAuth配置
 */

import React, { useState } from 'react';
import { Card, Typography, Space, Button, Alert, Divider } from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { googleOAuthService } from '../../services/googleOAuthService';

const { Title, Text, Paragraph } = Typography;

export const OAuthUrlDebugPage: React.FC = () => {
  const [urls, setUrls] = useState<{
    questionnaire: string;
    management: string;
    current: string;
  } | null>(null);

  const generateUrls = () => {
    const state = 'debug-' + Math.random().toString(36).substring(2);
    
    // 获取当前环境信息
    const currentOrigin = window.location.origin;
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const envRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    
    // 生成不同类型的OAuth URL
    const questionnaireUrl = googleOAuthService.generateAuthUrl(state, `${currentOrigin}/auth/google/callback/questionnaire`);
    const managementUrl = googleOAuthService.generateAuthUrl(state, `${currentOrigin}/auth/google/callback/management`);
    const currentUrl = googleOAuthService.generateAuthUrl(state);
    
    setUrls({
      questionnaire: questionnaireUrl,
      management: managementUrl,
      current: currentUrl
    });

    console.log('环境变量:', {
      VITE_GOOGLE_CLIENT_ID: envClientId,
      VITE_GOOGLE_REDIRECT_URI: envRedirectUri,
      currentOrigin,
      questionnaireCallback: `${currentOrigin}/auth/google/callback/questionnaire`,
      managementCallback: `${currentOrigin}/auth/google/callback/management`
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const extractRedirectUri = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('redirect_uri') || '未找到';
    } catch {
      return '无效URL';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <LinkOutlined /> OAuth URL 调试工具
      </Title>
      
      <Alert
        message="调试信息"
        description={
          <div>
            <p><strong>当前域名:</strong> {window.location.origin}</p>
            <p><strong>Client ID:</strong> {import.meta.env.VITE_GOOGLE_CLIENT_ID || '未配置'}</p>
            <p><strong>环境变量回调:</strong> {import.meta.env.VITE_GOOGLE_REDIRECT_URI || '未配置'}</p>
          </div>
        }
        type="info"
        style={{ marginBottom: '24px' }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button type="primary" onClick={generateUrls} size="large">
          生成OAuth调试URL
        </Button>

        {urls && (
          <>
            <Divider />
            
            <Card title="问卷用户OAuth URL" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>回调地址: </Text>
                <Text code>{extractRedirectUri(urls.questionnaire)}</Text>
                <Paragraph>
                  <Text>完整URL: </Text>
                  <Text code style={{ wordBreak: 'break-all' }}>{urls.questionnaire}</Text>
                  <Button 
                    icon={<CopyOutlined />} 
                    size="small" 
                    onClick={() => copyToClipboard(urls.questionnaire)}
                    style={{ marginLeft: '8px' }}
                  >
                    复制
                  </Button>
                </Paragraph>
                <Button 
                  type="link" 
                  href={urls.questionnaire}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  测试问卷用户登录
                </Button>
              </Space>
            </Card>

            <Card title="管理员OAuth URL" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>回调地址: </Text>
                <Text code>{extractRedirectUri(urls.management)}</Text>
                <Paragraph>
                  <Text>完整URL: </Text>
                  <Text code style={{ wordBreak: 'break-all' }}>{urls.management}</Text>
                  <Button 
                    icon={<CopyOutlined />} 
                    size="small" 
                    onClick={() => copyToClipboard(urls.management)}
                    style={{ marginLeft: '8px' }}
                  >
                    复制
                  </Button>
                </Paragraph>
                <Button 
                  type="link" 
                  href={urls.management}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  测试管理员登录
                </Button>
              </Space>
            </Card>

            <Card title="当前配置OAuth URL" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>回调地址: </Text>
                <Text code>{extractRedirectUri(urls.current)}</Text>
                <Paragraph>
                  <Text>完整URL: </Text>
                  <Text code style={{ wordBreak: 'break-all' }}>{urls.current}</Text>
                  <Button 
                    icon={<CopyOutlined />} 
                    size="small" 
                    onClick={() => copyToClipboard(urls.current)}
                    style={{ marginLeft: '8px' }}
                  >
                    复制
                  </Button>
                </Paragraph>
                <Button 
                  type="link" 
                  href={urls.current}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  测试当前配置登录
                </Button>
              </Space>
            </Card>

            <Alert
              message="Google Console配置检查"
              description={
                <div>
                  <p>请确保在Google Console中配置了以下回调URL:</p>
                  <ul>
                    <li><code>{extractRedirectUri(urls.questionnaire)}</code></li>
                    <li><code>{extractRedirectUri(urls.management)}</code></li>
                    <li><code>{extractRedirectUri(urls.current)}</code></li>
                  </ul>
                </div>
              }
              type="warning"
            />
          </>
        )}
      </Space>
    </div>
  );
};

export default OAuthUrlDebugPage;
