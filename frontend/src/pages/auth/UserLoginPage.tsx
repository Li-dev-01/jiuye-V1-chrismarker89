/**
 * 用户登录页面 - A+B半匿名登录
 * 支持11+4/6数字组合，登录即注册机制
 */

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import styles from './UserLoginPage.module.css';

const { Title, Text, Paragraph } = Typography;

interface LoginFormData {
  identityA: string;
  identityB: string;
}

export const UserLoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>();
  const [isLoading, setIsLoading] = useState(false);
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
            <Title level={2}>用户登录</Title>
            <Paragraph type="secondary">
              使用您的A+B数字组合登录系统
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

          {/* Google 一键登录分隔线 */}
          <Divider style={{ margin: '24px 0' }}>
            <span style={{ color: '#999', fontSize: '14px' }}>或</span>
          </Divider>

          {/* Google 一键登录 */}
          <div className={styles.googleLogin}>
            <GoogleLoginButton
              userType="questionnaire"
              type="default"
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
                borderColor: '#4285f4',
                color: '#4285f4',
                height: '48px',
                fontSize: '16px'
              }}
            />
            <div style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '12px',
              color: '#666'
            }}>
              使用Google账号自动创建匿名身份
            </div>
          </div>

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
    </div>
  );
};

export default UserLoginPage;
