/**
 * 2FA 验证页面
 * 用于 Google OAuth 登录后的 2FA 验证
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Divider,
  message
} from 'antd';
import {
  SafetyOutlined,
  LockOutlined,
  KeyOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface LocationState {
  tempSessionId: string;
  email: string;
  role: string;
}

const TwoFactorVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // 检查是否有必要的状态
    if (!state || !state.tempSessionId) {
      message.error('会话信息丢失，请重新登录');
      navigate('/unified-login');
    }
  }, [state, navigate]);

  const handleVerify = async (values: { code: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/email-role-auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tempSessionId: state.tempSessionId,
          code: values.code,
          useBackupCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 保存 token
        const tokenKey = state.role === 'super_admin' 
          ? 'super_admin_token' 
          : state.role === 'admin' 
          ? 'admin_token' 
          : 'reviewer_token';
        
        localStorage.setItem(tokenKey, data.data.token);
        
        message.success('验证成功，正在跳转...');
        
        // 跳转到对应的仪表板
        setTimeout(() => {
          if (state.role === 'super_admin') {
            navigate('/admin/super-admin-panel');
          } else if (state.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        }, 1000);
      } else {
        message.error(data.message || '验证失败，请重试');
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      message.error('验证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!state || !state.tempSessionId) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{
          width: 450,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <Title level={2} style={{ marginTop: '16px' }}>
            双因素认证
          </Title>
          <Text type="secondary">
            为了保护您的账户安全，请输入验证码
          </Text>
        </div>

        <Alert
          message={`正在登录：${state.email}`}
          description={`角色：${state.role}`}
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          onFinish={handleVerify}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label={useBackupCode ? '备用代码' : '验证码'}
            rules={[
              { required: true, message: '请输入验证码' },
              {
                pattern: useBackupCode ? /^\d{8}$/ : /^\d{6}$/,
                message: useBackupCode ? '备用代码为8位数字' : '验证码为6位数字'
              }
            ]}
          >
            <Input
              prefix={useBackupCode ? <KeyOutlined /> : <LockOutlined />}
              placeholder={useBackupCode ? '请输入8位备用代码' : '请输入6位验证码'}
              size="large"
              maxLength={useBackupCode ? 8 : 6}
              autoFocus
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              验证并登录
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Button
            type="link"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              form.resetFields();
            }}
          >
            {useBackupCode ? '使用验证码' : '使用备用代码'}
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {useBackupCode 
                ? '备用代码是在启用2FA时生成的8位数字代码'
                : '请打开 Google Authenticator 或其他验证器应用获取验证码'
              }
            </Text>
            <Button
              type="link"
              size="small"
              onClick={() => navigate('/unified-login')}
            >
              返回登录
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default TwoFactorVerification;

