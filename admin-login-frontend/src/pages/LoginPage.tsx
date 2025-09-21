import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Space
} from 'antd';
import {
  SecurityScanOutlined,
  ProjectOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import ProjectSelection from '../components/ProjectSelection';
import './LoginPage.css';

const { Title, Paragraph } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'projects'>('email');
  const [userInfo, setUserInfo] = useState<{ email: string; role: string } | null>(null);
  const { verifyEmail } = useAuthStore();

  // 第一步：邮箱验证
  const handleEmailVerify = async (values: { email: string }) => {
    setLoading(true);
    try {
      const result = await verifyEmail(values.email);
      if (result.success) {
        setUserInfo({ email: result.email, role: result.role });
        setStep('projects');
        message.success('邮箱验证成功！');
      }
    } catch (error) {
      message.error('邮箱验证失败，请检查您的邮箱是否在白名单中');
    } finally {
      setLoading(false);
    }
  };

  // 第二步：角色选择后的处理
  const handleRoleSelect = (role: string) => {
    message.success(`正在以${role}身份登录...`);
  };





  // 如果已经验证邮箱，显示项目选择页面
  if (step === 'projects' && userInfo) {
    return (
      <ProjectSelection
        userEmail={userInfo.email}
        userRole={userInfo.role}
        onRoleSelect={handleRoleSelect}
      />
    );
  }

  // 第一步：邮箱验证页面
  return (
    <div className="login-container">
      <div className="login-background">
        <div className="background-pattern"></div>
      </div>

      <Card className="login-card" bordered={false}>
            {/* 头部 */}
            <div className="login-header">
              <div className="icon-container">
                <SecurityScanOutlined className="main-icon" />
              </div>
              <Title level={2} className="title">
                多项目管理中心
              </Title>
              <Paragraph className="subtitle">
                请输入您的邮箱进行身份验证
              </Paragraph>
            </div>

            {/* 登录表单 */}
            <Form
              name="emailVerify"
              onFinish={handleEmailVerify}
              autoComplete="off"
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="email"
                label="管理员邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入您的管理员邮箱"
                  autoComplete="username"
                />
              </Form.Item>



              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="login-button"
                >
                  验证邮箱
                </Button>
              </Form.Item>
            </Form>



            {/* 底部信息 */}
            <div className="login-footer">
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>
                  <ProjectOutlined /> 支持多项目统一管理
                </Paragraph>
                <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>
                  仅限授权管理员访问
                </Paragraph>
              </Space>
            </div>
          </Card>
    </div>
  );
};
