/**
 * 双因素认证设置页面
 * 用户可以设置和管理2FA
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Steps,
  Form,
  Input,
  Select,
  Modal,
  QRCode,
  List,
  Tag,
  Switch,
  message,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  SafetyOutlined,
  MobileOutlined,
  MailOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CopyOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;

interface TwoFactorStatus {
  isEnabled: boolean;
  isVerified: boolean;
  method: string;
  setupCompleted: boolean;
  lastUsed?: string;
  backupCodesRemaining: number;
  trustedDevices: string[];
}

interface SetupData {
  secretKey?: string;
  backupCodes?: string[];
  qrCodeUrl?: string;
}

export const TwoFactorAuthPage: React.FC = () => {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({});
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [backupCodesModalVisible, setBackupCodesModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [verifyForm] = Form.useForm();

  // 加载2FA状态
  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/two-factor/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Load 2FA status error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // 开始设置2FA
  const handleStartSetup = async (values: any) => {
    try {
      const response = await fetch('/api/user/two-factor/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data.data);
        setSetupStep(1);
        message.success('2FA设置已初始化');
      } else {
        const error = await response.json();
        message.error(error.message || '设置失败');
      }
    } catch (error) {
      console.error('Setup 2FA error:', error);
      message.error('设置失败');
    }
  };

  // 验证2FA代码
  const handleVerifyCode = async (values: any) => {
    try {
      const response = await fetch('/api/user/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: values.code,
          verificationType: 'settings_change'
        })
      });

      if (response.ok) {
        const data = await response.json();
        message.success(data.message);
        
        if (data.data?.isSetupComplete) {
          setSetupModalVisible(false);
          setVerifyModalVisible(false);
          setSetupStep(0);
          loadStatus();
        }
      } else {
        const error = await response.json();
        message.error(error.message || '验证失败');
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      message.error('验证失败');
    }
  };

  // 禁用2FA
  const handleDisable2FA = async () => {
    try {
      const response = await fetch('/api/user/two-factor/disable', {
        method: 'POST'
      });

      if (response.ok) {
        message.success('双因素认证已禁用');
        loadStatus();
      } else {
        const error = await response.json();
        message.error(error.message || '禁用失败');
      }
    } catch (error) {
      console.error('Disable 2FA error:', error);
      message.error('禁用失败');
    }
  };

  // 重新生成备用代码
  const handleRegenerateBackupCodes = async () => {
    try {
      const response = await fetch('/api/user/two-factor/regenerate-backup-codes', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData({ ...setupData, backupCodes: data.data });
        setBackupCodesModalVisible(true);
        message.success('备用代码已重新生成');
      } else {
        const error = await response.json();
        message.error(error.message || '生成失败');
      }
    } catch (error) {
      console.error('Regenerate backup codes error:', error);
      message.error('生成失败');
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: '24px' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <SafetyOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            双因素认证设置
          </Title>
          <Text type="secondary">为您的账号添加额外的安全保护</Text>
        </div>
      </Card>

      {/* 2FA状态概览 */}
      {status && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="2FA状态"
                value={status.isEnabled ? '已启用' : '未启用'}
                prefix={status.isEnabled ? <CheckCircleOutlined /> : <WarningOutlined />}
                valueStyle={{ color: status.isEnabled ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="认证方式"
                value={status.method || '未设置'}
                prefix={<KeyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="备用代码"
                value={status.backupCodesRemaining}
                suffix="个"
                prefix={<SafetyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="最后使用"
                value={status.lastUsed ? new Date(status.lastUsed).toLocaleDateString() : '从未'}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 主要内容 */}
      <Card>
        {!status?.isEnabled ? (
          // 未启用2FA的界面
          <div>
            <Alert
              message="建议启用双因素认证"
              description="双因素认证为您的账号提供额外的安全保护，即使密码被泄露，攻击者也无法访问您的账号。"
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <div style={{ textAlign: 'center', padding: '40px' }}>
              <SafetyOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4}>保护您的账号安全</Title>
              <Paragraph>
                启用双因素认证后，登录时除了密码外，还需要提供手机或邮箱验证码。
              </Paragraph>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setSetupModalVisible(true)}
              >
                开始设置双因素认证
              </Button>
            </div>
          </div>
        ) : (
          // 已启用2FA的界面
          <div>
            <Alert
              message="双因素认证已启用"
              description={`您的账号已受到双因素认证保护，认证方式：${status.method}。`}
              type="success"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  title: '认证方式',
                  description: status.method === 'totp' ? 'TOTP应用程序' : status.method,
                  icon: <KeyOutlined />,
                  actions: [
                    <Button key="change" type="link">更改</Button>
                  ]
                },
                {
                  title: '备用代码',
                  description: `剩余 ${status.backupCodesRemaining} 个备用代码`,
                  icon: <SafetyOutlined />,
                  actions: [
                    <Button 
                      key="regenerate" 
                      type="link"
                      onClick={handleRegenerateBackupCodes}
                    >
                      重新生成
                    </Button>
                  ]
                },
                {
                  title: '信任设备',
                  description: `${status.trustedDevices.length} 个信任设备`,
                  icon: <MobileOutlined />,
                  actions: [
                    <Button key="manage" type="link">管理</Button>
                  ]
                }
              ]}
              renderItem={item => (
                <List.Item actions={item.actions}>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />

            <Divider />

            <div style={{ textAlign: 'center' }}>
              <Button 
                danger 
                onClick={handleDisable2FA}
              >
                禁用双因素认证
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 设置2FA模态框 */}
      <Modal
        title="设置双因素认证"
        open={setupModalVisible}
        onCancel={() => {
          setSetupModalVisible(false);
          setSetupStep(0);
        }}
        footer={null}
        width={600}
      >
        <Steps current={setupStep} style={{ marginBottom: '24px' }}>
          <Step title="选择方式" icon={<SafetyOutlined />} />
          <Step title="扫描二维码" icon={<MobileOutlined />} />
          <Step title="验证代码" icon={<CheckCircleOutlined />} />
        </Steps>

        {setupStep === 0 && (
          <Form form={form} onFinish={handleStartSetup} layout="vertical">
            <Form.Item
              name="method"
              label="选择认证方式"
              rules={[{ required: true, message: '请选择认证方式' }]}
            >
              <Select placeholder="选择认证方式">
                <Option value="totp">
                  <Space>
                    <MobileOutlined />
                    TOTP应用程序（推荐）
                  </Space>
                </Option>
                <Option value="sms">
                  <Space>
                    <MobileOutlined />
                    短信验证码
                  </Space>
                </Option>
                <Option value="email">
                  <Space>
                    <MailOutlined />
                    邮箱验证码
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="phoneNumber"
              label="手机号码"
              dependencies={['method']}
              rules={[
                ({ getFieldValue }) => ({
                  required: getFieldValue('method') === 'sms',
                  message: '请输入手机号码'
                })
              ]}
            >
              <Input placeholder="请输入手机号码" />
            </Form.Item>

            <Form.Item
              name="emailAddress"
              label="邮箱地址"
              dependencies={['method']}
              rules={[
                ({ getFieldValue }) => ({
                  required: getFieldValue('method') === 'email',
                  message: '请输入邮箱地址'
                })
              ]}
            >
              <Input placeholder="请输入邮箱地址" />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setSetupModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  下一步
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {setupStep === 1 && setupData.qrCodeUrl && (
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>扫描二维码</Title>
            <Paragraph>
              使用您的TOTP应用程序（如Google Authenticator、Authy等）扫描下方二维码：
            </Paragraph>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <QRCode value={setupData.qrCodeUrl} size={200} />
            </div>

            {setupData.secretKey && (
              <div style={{ marginBottom: '16px' }}>
                <Text>或手动输入密钥：</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  marginTop: '8px'
                }}>
                  {setupData.secretKey}
                  <Button 
                    type="link" 
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(setupData.secretKey!)}
                  >
                    复制
                  </Button>
                </div>
              </div>
            )}

            <Button 
              type="primary" 
              onClick={() => {
                setSetupStep(2);
                setVerifyModalVisible(true);
              }}
            >
              我已添加到应用程序
            </Button>
          </div>
        )}
      </Modal>

      {/* 验证代码模态框 */}
      <Modal
        title="验证双因素认证代码"
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={null}
      >
        <Form form={verifyForm} onFinish={handleVerifyCode} layout="vertical">
          <Form.Item
            name="code"
            label="验证码"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为6位数字' }
            ]}
          >
            <Input 
              placeholder="请输入6位验证码" 
              maxLength={6}
              style={{ fontSize: '18px', textAlign: 'center' }}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setVerifyModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                验证
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 备用代码模态框 */}
      <Modal
        title="备用代码"
        open={backupCodesModalVisible}
        onCancel={() => setBackupCodesModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBackupCodesModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Alert
          message="重要提醒"
          description="请将这些备用代码保存在安全的地方。每个代码只能使用一次，当您无法使用主要认证方式时可以使用。"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {setupData.backupCodes && (
          <div>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              marginBottom: '16px'
            }}>
              {setupData.backupCodes.map((code, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {code}
                </div>
              ))}
            </div>
            
            <Button 
              block
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(setupData.backupCodes!.join('\n'))}
            >
              复制所有代码
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TwoFactorAuthPage;
