import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Switch, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Row,
  Col,
  Select,
  InputNumber,
  message,
  Tabs,
  Upload,
  Alert
} from 'antd';
import { 
  SettingOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  UploadOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  MailOutlined,
  BellOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableTwoFactor: boolean;
    ipWhitelist: string[];
  };
  notification: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    notificationEmail: string;
    emailTemplate: string;
  };
  review: {
    autoAssignReviews: boolean;
    maxReviewsPerReviewer: number;
    reviewTimeLimit: number;
    requireDoubleReview: boolean;
    escalationThreshold: number;
  };
  database: {
    backupEnabled: boolean;
    backupFrequency: string;
    retentionDays: number;
    compressionEnabled: boolean;
  };
}

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_SETTINGS || '/api/simple-admin/settings'}`);
      
      if (response.data.success) {
        const settingsData = response.data.data;
        setSettings(settingsData);
        form.setFieldsValue(settingsData);
      } else {
        // 使用默认设置
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
        form.setFieldsValue(defaultSettings);
      }
    } catch (error) {
      console.error('获取系统设置失败:', error);
      // 使用默认设置作为后备
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
      form.setFieldsValue(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): SystemSettings => {
    return {
      general: {
        siteName: '就业调查系统',
        siteDescription: '大学生就业情况调查与分析平台',
        contactEmail: 'admin@example.com',
        maintenanceMode: false,
        registrationEnabled: true,
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
      },
      security: {
        passwordMinLength: 8,
        passwordRequireSpecialChar: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        enableTwoFactor: false,
        ipWhitelist: []
      },
      notification: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        notificationEmail: 'notifications@example.com',
        emailTemplate: '默认邮件模板'
      },
      review: {
        autoAssignReviews: true,
        maxReviewsPerReviewer: 50,
        reviewTimeLimit: 24,
        requireDoubleReview: false,
        escalationThreshold: 72
      },
      database: {
        backupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        compressionEnabled: true
      }
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      
      const response = await apiClient.put(
        `${API_CONFIG.ENDPOINTS.ADMIN_SETTINGS || '/api/simple-admin/settings'}`,
        values
      );
      
      if (response.data.success) {
        message.success('设置保存成功');
        setSettings(values);
      } else {
        message.error('设置保存失败');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      form.setFieldsValue(settings);
      message.info('已重置为上次保存的设置');
    }
  };

  const handleTestEmail = async () => {
    try {
      await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_SETTINGS || '/api/simple-admin/settings'}/test-email`);
      message.success('测试邮件发送成功');
    } catch (error) {
      console.error('测试邮件发送失败:', error);
      message.error('测试邮件发送失败');
    }
  };

  const handleBackupNow = async () => {
    try {
      await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_SETTINGS || '/api/simple-admin/settings'}/backup`);
      message.success('备份任务已启动');
    } catch (error) {
      console.error('启动备份失败:', error);
      message.error('启动备份失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>系统设置</Title>
        <Text type="secondary">配置系统参数和功能选项</Text>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 基本设置 */}
            <TabPane tab={<span><SettingOutlined />基本设置</span>} key="general">
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['general', 'siteName']}
                    label="网站名称"
                    rules={[{ required: true, message: '请输入网站名称' }]}
                  >
                    <Input placeholder="请输入网站名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['general', 'contactEmail']}
                    label="联系邮箱"
                    rules={[
                      { required: true, message: '请输入联系邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input placeholder="请输入联系邮箱" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['general', 'siteDescription']}
                label="网站描述"
              >
                <TextArea rows={3} placeholder="请输入网站描述" />
              </Form.Item>

              <Row gutter={[24, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['general', 'maintenanceMode']}
                    label="维护模式"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['general', 'registrationEnabled']}
                    label="允许注册"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['general', 'maxFileSize']}
                    label="最大文件大小(MB)"
                  >
                    <InputNumber min={1} max={100} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['general', 'allowedFileTypes']}
                label="允许的文件类型"
              >
                <Select
                  mode="tags"
                  placeholder="请选择或输入文件类型"
                  options={[
                    { value: 'pdf', label: 'PDF' },
                    { value: 'doc', label: 'DOC' },
                    { value: 'docx', label: 'DOCX' },
                    { value: 'jpg', label: 'JPG' },
                    { value: 'png', label: 'PNG' },
                    { value: 'gif', label: 'GIF' }
                  ]}
                />
              </Form.Item>
            </TabPane>

            {/* 安全设置 */}
            <TabPane tab={<span><SecurityScanOutlined />安全设置</span>} key="security">
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['security', 'passwordMinLength']}
                    label="密码最小长度"
                    rules={[{ required: true, message: '请输入密码最小长度' }]}
                  >
                    <InputNumber min={6} max={20} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['security', 'sessionTimeout']}
                    label="会话超时时间(分钟)"
                    rules={[{ required: true, message: '请输入会话超时时间' }]}
                  >
                    <InputNumber min={5} max={480} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['security', 'maxLoginAttempts']}
                    label="最大登录尝试次数"
                  >
                    <InputNumber min={3} max={10} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['security', 'passwordRequireSpecialChar']}
                    label="密码需要特殊字符"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['security', 'enableTwoFactor']}
                label="启用双因素认证"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name={['security', 'ipWhitelist']}
                label="IP白名单"
              >
                <Select
                  mode="tags"
                  placeholder="请输入IP地址，支持CIDR格式"
                />
              </Form.Item>
            </TabPane>

            {/* 通知设置 */}
            <TabPane tab={<span><BellOutlined />通知设置</span>} key="notification">
              <Row gutter={[24, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['notification', 'emailNotifications']}
                    label="邮件通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['notification', 'smsNotifications']}
                    label="短信通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['notification', 'pushNotifications']}
                    label="推送通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['notification', 'notificationEmail']}
                label="通知邮箱"
                rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input placeholder="请输入通知邮箱" />
              </Form.Item>

              <Form.Item
                name={['notification', 'emailTemplate']}
                label="邮件模板"
              >
                <TextArea rows={6} placeholder="请输入邮件模板内容" />
              </Form.Item>

              <Space>
                <Button icon={<MailOutlined />} onClick={handleTestEmail}>
                  发送测试邮件
                </Button>
              </Space>
            </TabPane>

            {/* 审核设置 */}
            <TabPane tab={<span><SettingOutlined />审核设置</span>} key="review">
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['review', 'autoAssignReviews']}
                    label="自动分配审核"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['review', 'requireDoubleReview']}
                    label="需要双重审核"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['review', 'maxReviewsPerReviewer']}
                    label="每个审核员最大审核数"
                  >
                    <InputNumber min={10} max={200} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['review', 'reviewTimeLimit']}
                    label="审核时限(小时)"
                  >
                    <InputNumber min={1} max={168} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['review', 'escalationThreshold']}
                    label="升级阈值(小时)"
                  >
                    <InputNumber min={24} max={720} />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            {/* 数据库设置 */}
            <TabPane tab={<span><DatabaseOutlined />数据库设置</span>} key="database">
              <Alert
                message="数据库备份设置"
                description="配置自动备份策略，确保数据安全"
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
              />

              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['database', 'backupEnabled']}
                    label="启用自动备份"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['database', 'compressionEnabled']}
                    label="启用压缩"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['database', 'backupFrequency']}
                    label="备份频率"
                  >
                    <Select>
                      <Option value="hourly">每小时</Option>
                      <Option value="daily">每天</Option>
                      <Option value="weekly">每周</Option>
                      <Option value="monthly">每月</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['database', 'retentionDays']}
                    label="保留天数"
                  >
                    <InputNumber min={7} max={365} />
                  </Form.Item>
                </Col>
              </Row>

              <Space>
                <Button type="primary" onClick={handleBackupNow}>
                  立即备份
                </Button>
                <Button>
                  查看备份历史
                </Button>
              </Space>
            </TabPane>
          </Tabs>

          <Divider />

          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存设置
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default AdminSettings;
