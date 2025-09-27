/**
 * 用户登录页面 - A+B半匿名登录
 * 支持11+4/6数字组合，登录即注册机制
 */

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert, message, Divider, Tabs } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { AutoRegister } from '../../components/auth/AutoRegister';
import styles from './UserLoginPage.module.css';

const { Title, Text, Paragraph } = Typography;

interface LoginFormData {
  identityA: string;
  identityB: string;
}

export const UserLoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [showAutoRegister, setShowAutoRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const navigate = useNavigate();

  const { loginSemiAnonymous, error, clearError } = useUniversalAuthStore();

  const handleSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    clearError();

    try {
      const success = await loginSemiAnonymous(values.identityA, values.identityB);

      if (success) {
        message.success('登录成功！');
        // 跳转到首页或用户指定页面
        navigate('/', { replace: true });
      } else {
        message.error('登录失败，请检查输入的A+B组合');
      }
    } catch (error) {
      console.error('Login failed:', error);
      message.error('登录过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 实时格式化A值（11位数字）
  const handleAValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    form.setFieldValue('identityA', value);
  };

  // 实时格式化B值（4-6位数字）
  const handleBValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    form.setFieldValue('identityB', value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <Card>
          <div className={styles.header}>
            <LoginOutlined className={styles.icon} />
            <Title level={2}>注册/登录</Title>
            <Paragraph type="secondary">
              选择您喜欢的方式注册或登录系统
            </Paragraph>
          </div>

          {error && (
            <Alert
              message="登录失败"
              description={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              style={{ marginBottom: 24 }}
            />
          )}

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              {
                key: 'manual',
                label: (
                  <Space>
                    <UserOutlined />
                    手动注册
                  </Space>
                ),
                children: (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                  >
                    <Form.Item
                      name="identityA"
                      label="身份标识A"
                      rules={[
                        { required: true, message: '请输入身份标识A' },
                        { len: 11, message: '身份标识A必须是11位数字' },
                        { pattern: /^\d{11}$/, message: '身份标识A只能包含数字' }
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="请输入11位数字"
                        onChange={handleAValueChange}
                        maxLength={11}
                      />
                    </Form.Item>

                    <Form.Item
                      name="identityB"
                      label="身份标识B"
                      rules={[
                        { required: true, message: '请输入身份标识B' },
                        { min: 4, message: '身份标识B至少4位数字' },
                        { max: 6, message: '身份标识B最多6位数字' },
                        { pattern: /^\d{4,6}$/, message: '身份标识B只能包含4-6位数字' }
                      ]}
                    >
                      <Input
                        prefix={<LockOutlined />}
                        placeholder="请输入4-6位数字"
                        onChange={handleBValueChange}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        size="large"
                      >
                        A+B 登录
                      </Button>
                    </Form.Item>
                  </Form>
                )
              },
              {
                key: 'auto',
                label: (
                  <Space>
                    <SafetyOutlined />
                    自动注册
                  </Space>
                ),
                children: (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div>
                        <SafetyOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                        <Title level={4}>自动注册</Title>
                        <Paragraph type="secondary">
                          系统自动创建匿名账户，通过简单验证后即可登录。
                        </Paragraph>
                      </div>

                      <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
                        <li>✓ 自动创建账户</li>
                        <li>✓ 完全匿名</li>
                        <li>✓ 防脚本验证</li>
                        <li>✓ 凭证下载</li>
                      </ul>

                      <Button
                        type="primary"
                        size="large"
                        icon={<UserAddOutlined />}
                        onClick={() => setShowAutoRegister(true)}
                        block
                        style={{
                          background: '#52c41a',
                          borderColor: '#52c41a',
                          height: '48px',
                          fontSize: '16px'
                        }}
                      >
                        开始自动注册
                      </Button>
                    </Space>
                  </div>
                )
              },
              {
                key: 'google',
                label: (
                  <Space>
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE3LjY0IDkuMjA0NTVDMTcuNjQgOC41NjY4MiAxNy41ODI3IDcuOTUyMjcgMTcuNDc2NCA3LjM2MzY0SDE5VjEwLjg0MDlIMTUuNjkwOUMxNS4zMDQ1IDEyLjI5NTUgMTQuNDIyNyAxMy41MjI3IDEzLjE1OTEgMTQuMzI5NUwxNS43MTU5IDE2LjMzODZDMTYuOTM2NCAxNS4yNTQ1IDE3LjY0IDEyLjk0NTUgMTcuNjQgOS4yMDQ1NVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTkgMThDMTEuNDMgMTggMTMuNDY3MyAxNy4xOTQxIDE1LjcxNTkgMTUuMzM4NkwxMy4xNTkxIDEzLjMyOTVDMTIuNDQzMiAxMy44MTk1IDExLjQ5MDkgMTQuMTM2NCAxMCAxNC4xMzY0QzcuNjU5MDkgMTQuMTM2NCA1LjY3MjczIDEyLjk5NTUgNC45NjM2NCAxMS4yOTU1TDIuMjY4MTggMTMuMzY4MkM0LjUwNDU1IDE3LjgwNDUgNi42MjI3MyAxOCA5IDE4WiIgZmlsbD0iIzM0QTg1MyIvPgo8cGF0aCBkPSJNNC45NjM2NCAxMS4yOTU1QzQuNjgxODIgMTAuODA0NSA0LjUyMjczIDEwLjI1IDQuNTIyNzMgOS42ODE4MkM0LjUyMjczIDkuMTEzNjQgNC42ODE4MiA4LjU1OTA5IDQuOTYzNjQgOC4wNjgxOEw0Ljk2MzY0IDUuOTMxODJMMi4yNjgxOCAzLjg1OTA5QzEuNjQwOTEgNS4xMTM2NCAxLjI3MjczIDYuNTQ1NDUgMS4yNzI3MyA4LjA2ODE4QzEuMjcyNzMgOS41OTA5MSAxLjY0MDkxIDExLjAyMjcgMi4yNjgxOCAxMi4yNzI3TDQuOTYzNjQgMTEuMjk1NVoiIGZpbGw9IiNGQkJDMDQiLz4KPHBhdGggZD0iTTkgMy44NjM2NEMxMC42NTQ1IDMuODYzNjQgMTIuMDg2NCA0LjQ1NDU1IDEzLjE4MTggNS40OTU0NUwxNS40MDkxIDMuMjY4MThDMTMuNDY3MyAxLjQ5MDkxIDExLjQzIDAgOSAwQzYuNjIyNzMgMCA0LjUwNDU1IDIuMTk1NDUgMi4yNjgxOCA2LjYzMTgyTDQuOTYzNjQgOC42NTkwOUM1LjY3MjczIDYuOTU5MDkgNy42NTkwOSAzLjg2MzY0IDkgMy44NjM2NFoiIGZpbGw9IiNFQTQzMzUiLz4KPC9zdmc+"
                      alt="Google"
                      style={{ width: 16, height: 16 }}
                    />
                    Google登录
                  </Space>
                ),
                children: (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div>
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE3LjY0IDkuMjA0NTVDMTcuNjQgOC41NjY4MiAxNy41ODI3IDcuOTUyMjcgMTcuNDc2NCA3LjM2MzY0SDE5VjEwLjg0MDlIMTUuNjkwOUMxNS4zMDQ1IDEyLjI5NTUgMTQuNDIyNyAxMy41MjI3IDEzLjE1OTEgMTQuMzI5NUwxNS43MTU5IDE2LjMzODZDMTYuOTM2NCAxNS4yNTQ1IDE3LjY0IDEyLjk0NTUgMTcuNjQgOS4yMDQ1NVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTkgMThDMTEuNDMgMTggMTMuNDY3MyAxNy4xOTQxIDE1LjcxNTkgMTUuMzM4NkwxMy4xNTkxIDEzLjMyOTVDMTIuNDQzMiAxMy44MTk1IDExLjQ5MDkgMTQuMTM2NCAxMCAxNC4xMzY0QzcuNjU5MDkgMTQuMTM2NCA1LjY3MjczIDEyLjk5NTUgNC45NjM2NCAxMS4yOTU1TDIuMjY4MTggMTMuMzY4MkM0LjUwNDU1IDE3LjgwNDUgNi42MjI3MyAxOCA5IDE4WiIgZmlsbD0iIzM0QTg1MyIvPgo8cGF0aCBkPSJNNC45NjM2NCAxMS4yOTU1QzQuNjgxODIgMTAuODA0NSA0LjUyMjczIDEwLjI1IDQuNTIyNzMgOS42ODE4MkM0LjUyMjczIDkuMTEzNjQgNC42ODE4MiA4LjU1OTA5IDQuOTYzNjQgOC4wNjgxOEw0Ljk2MzY0IDUuOTMxODJMMi4yNjgxOCAzLjg1OTA5QzEuNjQwOTEgNS4xMTM2NCAxLjI3MjczIDYuNTQ1NDUgMS4yNzI3MyA4LjA2ODE4QzEuMjcyNzMgOS41OTA5MSAxLjY0MDkxIDExLjAyMjcgMi4yNjgxOCAxMi4yNzI3TDQuOTYzNjQgMTEuMjk1NVoiIGZpbGw9IiNGQkJDMDQiLz4KPHBhdGggZD0iTTkgMy44NjM2NEMxMC42NTQ1IDMuODYzNjQgMTIuMDg2NCA0LjQ1NDU1IDEzLjE4MTggNS40OTU0NUwxNS40MDkxIDMuMjY4MThDMTMuNDY3MyAxLjQ5MDkxIDExLjQzIDAgOSAwQzYuNjIyNzMgMCA0LjUwNDU1IDIuMTk1NDUgMi4yNjgxOCA2LjYzMTgyTDQuOTYzNjQgOC42NTkwOUM1LjY3MjczIDYuOTU5MDkgNy42NTkwOSAzLjg2MzY0IDkgMy44NjM2NFoiIGZpbGw9IiNFQTQzMzUiLz4KPC9zdmc+"
                          alt="Google"
                          style={{ width: 48, height: 48, marginBottom: 16 }}
                        />
                        <Title level={4}>Google 一键登录</Title>
                        <Paragraph type="secondary">
                          使用Google账号快速登录，自动创建匿名身份。
                        </Paragraph>
                      </div>

                      <GoogleLoginButton
                        userType="questionnaire"
                        type="primary"
                        size="large"
                        block
                        onSuccess={(userData) => {
                          message.success('Google登录成功！');
                          navigate('/', { replace: true });
                        }}
                        onError={(error) => {
                          message.error(`Google登录失败: ${error}`);
                        }}
                        style={{
                          height: '48px',
                          fontSize: '16px'
                        }}
                      />

                      <Paragraph type="secondary" style={{ fontSize: 12 }}>
                        使用Google账号自动创建匿名身份
                      </Paragraph>
                    </Space>
                  </div>
                )
              }
            ]}
          />

          <div className={styles.info}>
            <Alert
              message="关于A+B登录机制"
              description={
                <Space direction="vertical" size="small">
                  <Text>• A+B组合用于生成您的唯一身份标识</Text>
                  <Text>• 首次使用会自动创建新账户</Text>
                  <Text>• 再次使用相同组合即可登录</Text>
                  <Text>• 无需额外注册步骤</Text>
                </Space>
              }
              type="info"
              showIcon
            />
          </div>

          <div className={styles.actions}>
            <Button type="link" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </Card>
      </div>

      {/* 自动注册弹窗 */}
      <AutoRegister
        visible={showAutoRegister}
        onCancel={() => setShowAutoRegister(false)}
        onSuccess={() => {
          message.success('自动注册成功！');
        }}
        redirectTo="/"
      />
    </div>
  );
};

export default UserLoginPage;
