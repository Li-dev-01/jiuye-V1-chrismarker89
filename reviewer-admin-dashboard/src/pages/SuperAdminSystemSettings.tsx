/**
 * 超级管理员系统设置页面
 * 系统配置管理、参数设置、安全策略
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Space,
  Button,
  Card,
  Row,
  Col,
  message,
  Form,
  Input,
  Switch,
  InputNumber,
  Divider,
  Tabs,
  Select,
  Alert,
  Statistic,
  Tag
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  MonitorOutlined,
  GlobalOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

// 系统配置接口
interface SystemConfig {
  // 站点基本信息
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  contactEmail: string;
  contactPhone: string;
  copyright: string;
  
  // 文件上传设置
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // 会话设置
  sessionTimeout: number;
  pageSize: number;
  
  // 用户注册设置
  enableRegistration: boolean;
  requireEmailVerification: boolean;
  
  // 密码策略
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUppercase: boolean;
  
  // 安全设置
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableTwoFactor: boolean;
  
  // API设置
  apiRateLimit: number;
  apiTimeout: number;
  enableApiLogging: boolean;
}

// 安全策略配置
interface SecurityConfig {
  ddosProtection: boolean;
  bruteForceProtection: boolean;
  ipWhitelistEnabled: boolean;
  autoBlockEnabled: boolean;
  ddosThreshold: number;
  blockDuration: number;
  enableSecurityHeaders: boolean;
  enableCors: boolean;
  allowedOrigins: string[];
}

const SuperAdminSystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // 表单实例
  const [basicForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [apiForm] = Form.useForm();

  // 系统配置状态
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    siteName: '大学生就业问卷调查平台',
    siteDescription: '专业的大学生就业调查和数据分析平台',
    siteKeywords: '就业调查,问卷,数据分析,大学生',
    contactEmail: 'admin@example.com',
    contactPhone: '400-123-4567',
    copyright: '© 2025 大学生就业问卷调查平台',
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    sessionTimeout: 30,
    pageSize: 20,
    enableRegistration: true,
    requireEmailVerification: true,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    passwordRequireNumber: true,
    passwordRequireUppercase: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    enableTwoFactor: false,
    apiRateLimit: 100,
    apiTimeout: 30,
    enableApiLogging: true
  });

  // 安全配置状态
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    ddosProtection: true,
    bruteForceProtection: true,
    ipWhitelistEnabled: false,
    autoBlockEnabled: true,
    ddosThreshold: 100,
    blockDuration: 300,
    enableSecurityHeaders: true,
    enableCors: true,
    allowedOrigins: ['https://localhost:3000', 'https://example.com']
  });

  // 初始化表单数据
  useEffect(() => {
    basicForm.setFieldsValue(systemConfig);
    securityForm.setFieldsValue(securityConfig);
    apiForm.setFieldsValue(systemConfig);
  }, [basicForm, securityForm, apiForm, systemConfig, securityConfig]);

  // 保存基本配置
  const handleBasicConfigSave = async (values: Partial<SystemConfig>) => {
    setLoading(true);
    try {
      // TODO: 调用真实API
      console.log('保存基本配置:', values);
      setSystemConfig(prev => ({ ...prev, ...values }));
      message.success('基本配置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存安全配置
  const handleSecurityConfigSave = async (values: SecurityConfig) => {
    setLoading(true);
    try {
      // TODO: 调用真实API
      console.log('保存安全配置:', values);
      setSecurityConfig(values);
      message.success('安全配置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存API配置
  const handleApiConfigSave = async (values: Partial<SystemConfig>) => {
    setLoading(true);
    try {
      // TODO: 调用真实API
      console.log('保存API配置:', values);
      setSystemConfig(prev => ({ ...prev, ...values }));
      message.success('API配置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置配置
  const handleReset = () => {
    basicForm.resetFields();
    securityForm.resetFields();
    apiForm.resetFields();
    message.info('配置已重置');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <SettingOutlined /> 系统设置
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            重置配置
          </Button>
        </Space>
      </div>

      <Alert
        message="系统设置管理"
        description="配置系统基本参数、安全策略和API设置。修改配置后需要保存才能生效。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 配置概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="会话超时"
              value={systemConfig.sessionTimeout}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最大登录尝试"
              value={systemConfig.maxLoginAttempts}
              suffix="次"
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="API速率限制"
              value={systemConfig.apiRateLimit}
              suffix="/分钟"
              prefix={<MonitorOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="安全防护"
              value={securityConfig.ddosProtection ? '启用' : '禁用'}
              valueStyle={{ color: securityConfig.ddosProtection ? '#3f8600' : '#cf1322' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 配置标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 基本配置 */}
          <TabPane tab={<span><GlobalOutlined />基本配置</span>} key="basic">
            <Form
              form={basicForm}
              layout="vertical"
              onFinish={handleBasicConfigSave}
              initialValues={systemConfig}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Divider orientation="left">站点基本信息</Divider>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="siteName"
                    label="网站名称"
                    rules={[{ required: true, message: '请输入网站名称' }]}
                  >
                    <Input placeholder="请输入网站名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactEmail"
                    label="联系邮箱"
                    rules={[
                      { required: true, message: '请输入联系邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="请输入联系邮箱" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactPhone"
                    label="联系电话"
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="siteKeywords"
                    label="网站关键词"
                  >
                    <Input placeholder="请输入网站关键词，用逗号分隔" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="siteDescription"
                    label="网站描述"
                  >
                    <TextArea rows={3} placeholder="请输入网站描述" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="copyright"
                    label="版权信息"
                  >
                    <Input placeholder="请输入版权信息" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Divider orientation="left">文件上传设置</Divider>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="maxFileSize"
                    label="最大文件大小 (MB)"
                    rules={[{ required: true, message: '请输入最大文件大小' }]}
                  >
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="allowedFileTypes"
                    label="允许的文件类型"
                  >
                    <Select
                      mode="tags"
                      placeholder="请选择或输入文件类型"
                      style={{ width: '100%' }}
                    >
                      <Option value="jpg">JPG</Option>
                      <Option value="jpeg">JPEG</Option>
                      <Option value="png">PNG</Option>
                      <Option value="pdf">PDF</Option>
                      <Option value="doc">DOC</Option>
                      <Option value="docx">DOCX</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Divider orientation="left">系统参数</Divider>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sessionTimeout"
                    label="会话超时时间 (分钟)"
                    rules={[{ required: true, message: '请输入会话超时时间' }]}
                  >
                    <InputNumber min={5} max={120} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="pageSize"
                    label="默认分页大小"
                    rules={[{ required: true, message: '请输入分页大小' }]}
                  >
                    <InputNumber min={10} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enableRegistration"
                    label="启用用户注册"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="requireEmailVerification"
                    label="需要邮箱验证"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right', marginTop: '24px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                >
                  保存基本配置
                </Button>
              </div>
            </Form>
          </TabPane>

          {/* 安全配置 */}
          <TabPane tab={<span><SafetyOutlined />安全配置</span>} key="security">
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSecurityConfigSave}
              initialValues={securityConfig}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Divider orientation="left">密码策略</Divider>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="passwordMinLength"
                    label="密码最小长度"
                    rules={[{ required: true, message: '请输入密码最小长度' }]}
                  >
                    <InputNumber min={6} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="maxLoginAttempts"
                    label="最大登录尝试次数"
                    rules={[{ required: true, message: '请输入最大登录尝试次数' }]}
                  >
                    <InputNumber min={3} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lockoutDuration"
                    label="锁定时长 (分钟)"
                    rules={[{ required: true, message: '请输入锁定时长' }]}
                  >
                    <InputNumber min={5} max={60} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enableTwoFactor"
                    label="启用双因素认证"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="passwordRequireSpecialChar"
                    label="需要特殊字符"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="passwordRequireNumber"
                    label="需要数字"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="passwordRequireUppercase"
                    label="需要大写字母"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Divider orientation="left">安全防护</Divider>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="ddosProtection"
                    label="DDoS防护"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="bruteForceProtection"
                    label="暴力破解防护"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="ipWhitelistEnabled"
                    label="启用IP白名单"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="autoBlockEnabled"
                    label="自动封禁"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="ddosThreshold"
                    label="DDoS阈值 (请求/分钟)"
                    rules={[{ required: true, message: '请输入DDoS阈值' }]}
                  >
                    <InputNumber min={50} max={1000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="blockDuration"
                    label="封禁时长 (秒)"
                    rules={[{ required: true, message: '请输入封禁时长' }]}
                  >
                    <InputNumber min={60} max={3600} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enableSecurityHeaders"
                    label="启用安全头"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enableCors"
                    label="启用CORS"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="allowedOrigins"
                    label="允许的来源域名"
                  >
                    <Select
                      mode="tags"
                      placeholder="请输入允许的域名"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right', marginTop: '24px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                >
                  保存安全配置
                </Button>
              </div>
            </Form>
          </TabPane>

          {/* API配置 */}
          <TabPane tab={<span><MonitorOutlined />API配置</span>} key="api">
            <Form
              form={apiForm}
              layout="vertical"
              onFinish={handleApiConfigSave}
              initialValues={systemConfig}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Divider orientation="left">API限制设置</Divider>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="apiRateLimit"
                    label="API速率限制 (请求/分钟)"
                    rules={[{ required: true, message: '请输入API速率限制' }]}
                  >
                    <InputNumber min={10} max={1000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="apiTimeout"
                    label="API超时时间 (秒)"
                    rules={[{ required: true, message: '请输入API超时时间' }]}
                  >
                    <InputNumber min={5} max={120} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enableApiLogging"
                    label="启用API日志"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right', marginTop: '24px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                >
                  保存API配置
                </Button>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SuperAdminSystemSettings;
