/**
 * 系统管理页面
 * 系统配置、日志管理、操作记录
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Space,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Form,
  Input,
  Switch,
  InputNumber,
  Divider
} from 'antd';
import {
  ReloadOutlined,
  SettingOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  MonitorOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 数据接口定义
interface SystemConfig {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  contactEmail: string;
  contactPhone: string;
  copyright: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  pageSize: number;
  enableRegistration: boolean;
  requireEmailVerification: boolean;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export const SystemManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // 系统配置相关状态
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
    maxLoginAttempts: 5,
    lockoutDuration: 15
  });
  const [configForm] = Form.useForm();

  // 初始化数据
  useEffect(() => {
    // 初始化配置表单
    configForm.setFieldsValue(systemConfig);
  }, [configForm, systemConfig]);

  // 配置保存
  const handleConfigSave = async (values: SystemConfig) => {
    setLoading(true);
    try {
      // TODO: 调用API保存配置
      console.log('保存系统配置:', values);
      setSystemConfig(values);
      message.success('系统配置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#fff7e6', minHeight: 'calc(100vh - 64px)' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            <SettingOutlined style={{ marginRight: '8px' }} />
            系统管理
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {}}
              loading={loading}
              style={{ marginLeft: '16px' }}
            >
              刷新
            </Button>
          </Title>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            系统配置、日志管理、操作记录
          </div>
        </div>

        {/* 系统状态概览 */}
        <Card title="系统状态" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="系统运行时间"
                value="7天12小时"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="数据库状态"
                value="正常"
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="API服务状态"
                value="正常"
                prefix={<MonitorOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="安全状态"
                value="安全"
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 系统配置 */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>
              <SettingOutlined style={{ marginRight: 8 }} />
              系统配置管理
            </Title>
            <Text type="secondary">
              配置系统基本参数和安全设置。如需查看系统日志，请访问
              <a href="/admin/logs" style={{ marginLeft: 4 }}>系统日志页面</a>
            </Text>
          </div>
                  <Form
                    form={configForm}
                    layout="vertical"
                    onFinish={handleConfigSave}
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
                          <Input placeholder="请输入联系邮箱" />
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
                      <Col span={12}>
                        <Form.Item
                          name="siteKeywords"
                          label="网站关键词"
                        >
                          <Input placeholder="请输入关键词，用逗号分隔" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="contactPhone"
                          label="联系电话"
                        >
                          <Input placeholder="请输入联系电话" />
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
                    </Row>

                    <Row gutter={24}>
                      <Col span={24}>
                        <Divider orientation="left">系统参数</Divider>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="maxFileSize"
                          label="最大文件大小(MB)"
                        >
                          <InputNumber min={1} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="sessionTimeout"
                          label="会话超时(分钟)"
                        >
                          <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="pageSize"
                          label="分页大小"
                        >
                          <InputNumber min={10} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col span={24}>
                        <Divider orientation="left">安全设置</Divider>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="enableRegistration"
                          label="允许用户注册"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="requireEmailVerification"
                          label="需要邮箱验证"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="passwordRequireSpecialChar"
                          label="密码需要特殊字符"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="passwordMinLength"
                          label="密码最小长度"
                        >
                          <InputNumber min={6} max={20} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="maxLoginAttempts"
                          label="最大登录尝试次数"
                        >
                          <InputNumber min={3} max={10} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="lockoutDuration"
                          label="锁定时长(分钟)"
                        >
                          <InputNumber min={5} max={60} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row>
                      <Col span={24}>
                        <Form.Item>
                          <Space>
                            <Button
                              type="primary"
                              htmlType="submit"
                              icon={<SaveOutlined />}
                              loading={loading}
                            >
                              保存配置
                            </Button>
                            <Button
                              onClick={() => configForm.resetFields()}
                            >
                              重置
                            </Button>
                          </Space>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SystemManagementPage;