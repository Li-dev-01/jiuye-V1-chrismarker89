/**
 * 审核员设置页面
 * 个人信息、审核偏好、工作统计
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  message,
  Tabs,
  Statistic,
  Row,
  Col,
  Avatar,
  Space,
  Divider,
  Progress,
  Tag,
  Alert
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ReviewerProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  joinDate: string;
  lastLoginAt: string;
  status: 'active' | 'inactive';
}

interface ReviewerSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  defaultPageSize: number;
  showAIScore: boolean;
  priorityFilter: string;
  emailNotifications: boolean;
  soundNotifications: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}

interface ReviewerStats {
  totalReviewed: number;
  approvedCount: number;
  rejectedCount: number;
  averageTime: number;
  accuracy: number;
  efficiency: number;
  weeklyTarget: number;
  weeklyProgress: number;
}

export const ReviewerSettingsPage: React.FC = () => {
  const { currentUser } = useManagementAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  const [profile, setProfile] = useState<ReviewerProfile>({
    id: currentUser?.id || '',
    username: currentUser?.username || '',
    displayName: currentUser?.displayName || '',
    email: '',
    joinDate: '',
    lastLoginAt: '',
    status: 'active'
  });

  const [settings, setSettings] = useState<ReviewerSettings>({
    autoRefresh: true,
    refreshInterval: 30,
    defaultPageSize: 10,
    showAIScore: true,
    priorityFilter: 'all',
    emailNotifications: true,
    soundNotifications: false,
    workingHours: {
      start: '09:00',
      end: '18:00'
    }
  });

  const [stats, setStats] = useState<ReviewerStats>({
    totalReviewed: 0,
    approvedCount: 0,
    rejectedCount: 0,
    averageTime: 0,
    accuracy: 0,
    efficiency: 0,
    weeklyTarget: 0,
    weeklyProgress: 0
  });

  // 加载审核员数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';

        // 加载审核员统计数据
        const statsResponse = await fetch(`${apiBaseUrl}/api/reviewer/stats`);
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          if (statsResult.success) {
            setStats({
              totalReviewed: statsResult.data.totalReviewed || 0,
              approvedCount: 0, // API暂未提供
              rejectedCount: 0, // API暂未提供
              averageTime: statsResult.data.averageReviewTime || 0,
              accuracy: 0, // API暂未提供
              efficiency: 0, // API暂未提供
              weeklyTarget: 0, // API暂未提供
              weeklyProgress: 0 // API暂未提供
            });
          }
        }

        // 设置基本用户信息
        if (currentUser) {
          setProfile(prev => ({
            ...prev,
            id: currentUser.id || '',
            username: currentUser.username || '',
            displayName: currentUser.displayName || currentUser.username || '',
            email: '', // 需要从API获取
            joinDate: '', // 需要从API获取
            lastLoginAt: '' // 需要从API获取
          }));
        }
      } catch (error) {
        console.error('加载审核员数据失败:', error);
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  useEffect(() => {
    profileForm.setFieldsValue(profile);
    settingsForm.setFieldsValue(settings);
  }, [profile, settings, profileForm, settingsForm]);

  const handleProfileSave = async (values: any) => {
    setSaving(true);
    try {
      // TODO: 调用API保存个人信息
      setProfile({ ...profile, ...values });
      message.success('个人信息已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = async (values: any) => {
    setSaving(true);
    try {
      // TODO: 调用API保存设置
      setSettings({ ...settings, ...values });
      message.success('设置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return '#52c41a';
    if (accuracy >= 90) return '#faad14';
    return '#ff4d4f';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return '#52c41a';
    if (efficiency >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const tabItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
      children: (
        <Card>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar size={80} icon={<UserOutlined />} />
            <Title level={4} style={{ marginTop: 16 }}>
              {profile.displayName}
            </Title>
            <Text type="secondary">审核员 • {profile.username}</Text>
          </div>

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSave}
            initialValues={profile}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="displayName"
                  label="显示名称"
                  rules={[{ required: true, message: '请输入显示名称' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱地址"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Text strong>加入时间：</Text>
                <Text>{profile.joinDate}</Text>
              </Col>
              <Col span={12}>
                <Text strong>最后登录：</Text>
                <Text>{profile.lastLoginAt}</Text>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存个人信息
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'settings',
      label: '审核设置',
      icon: <SettingOutlined />,
      children: (
        <Card>
          <Form
            form={settingsForm}
            layout="vertical"
            onFinish={handleSettingsSave}
            initialValues={settings}
          >
            <Title level={5}>界面设置</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="autoRefresh" label="自动刷新" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="refreshInterval" label="刷新间隔(秒)">
                  <Select>
                    <Option value={15}>15秒</Option>
                    <Option value={30}>30秒</Option>
                    <Option value={60}>1分钟</Option>
                    <Option value={300}>5分钟</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="defaultPageSize" label="默认页面大小">
                  <Select>
                    <Option value={10}>10条/页</Option>
                    <Option value={20}>20条/页</Option>
                    <Option value={50}>50条/页</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="showAIScore" label="显示AI评分" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>审核偏好</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="priorityFilter" label="默认优先级筛选">
                  <Select>
                    <Option value="all">全部</Option>
                    <Option value="high">仅高优先级</Option>
                    <Option value="medium">中等优先级</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>通知设置</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="emailNotifications" label="邮件通知" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="soundNotifications" label="声音提醒" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>工作时间</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['workingHours', 'start']} label="开始时间">
                  <Input type="time" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['workingHours', 'end']} label="结束时间">
                  <Input type="time" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'stats',
      label: '工作统计',
      icon: <BarChartOutlined />,
      children: (
        <div>
          {/* 本周进度 */}
          <Card style={{ marginBottom: 16 }}>
            <Title level={5}>
              <TrophyOutlined style={{ marginRight: 8 }} />
              本周审核进度
            </Title>
            <Progress
              percent={(stats.weeklyProgress / stats.weeklyTarget) * 100}
              strokeColor="#52c41a"
              format={() => `${stats.weeklyProgress}/${stats.weeklyTarget}`}
            />
            <Text type="secondary">
              本周目标 {stats.weeklyTarget} 项，已完成 {stats.weeklyProgress} 项
            </Text>
          </Card>

          {/* 统计概览 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总审核数"
                  value={stats.totalReviewed}
                  prefix={<CheckOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="通过数"
                  value={stats.approvedCount}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="拒绝数"
                  value={stats.rejectedCount}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均用时"
                  value={stats.averageTime}
                  suffix="分钟"
                  precision={1}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 质量指标 */}
          <Card>
            <Title level={5}>质量指标</Title>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>审核准确率</Text>
                  <Progress
                    percent={stats.accuracy}
                    strokeColor={getAccuracyColor(stats.accuracy)}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>工作效率</Text>
                  <Progress
                    percent={stats.efficiency}
                    strokeColor={getEfficiencyColor(stats.efficiency)}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Col>
            </Row>

            <Alert
              message="表现优秀"
              description="您的审核准确率和工作效率都表现优秀，继续保持！"
              type="success"
              showIcon
            />
          </Card>
        </div>
      )
    }
  ];

  return (
    <ReviewerLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <UserOutlined style={{ marginRight: '8px' }} />
            个人设置
          </Title>
          <Text type="secondary">管理个人信息、审核偏好和查看工作统计</Text>
        </div>

        <Tabs items={tabItems} />
      </div>
    </ReviewerLayout>
  );
};
