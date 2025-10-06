/**
 * 用户画像管理页面
 * 展示问卷生成的用户标签统计和分析
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Space, Select, Spin, Empty,
  Typography, Tooltip, Progress, Alert, Tabs, Button, DatePicker, message
} from 'antd';
import {
  UserOutlined, TagOutlined, HeartOutlined, TrophyOutlined,
  BarChartOutlined, PieChartOutlined, FireOutlined, RiseOutlined,
  ReloadOutlined, DownloadOutlined
} from '@ant-design/icons';
import { API_CONFIG, STORAGE_KEYS } from '../config/api';
import { apiClient } from '../services/apiClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface TagStatistic {
  id: number;
  questionnaire_id: string;
  tag_key: string;
  tag_name: string;
  tag_category: string;
  count: number;
  percentage: number;
  last_updated: string;
}

interface EmotionStatistic {
  id: number;
  questionnaire_id: string;
  emotion_type: string;
  count: number;
  percentage: number;
  last_updated: string;
}

const AdminUserProfileManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tagStats, setTagStats] = useState<TagStatistic[]>([]);
  const [emotionStats, setEmotionStats] = useState<EmotionStatistic[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('questionnaire-v2-2024');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  // 获取标签统计数据
  const fetchTagStatistics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        questionnaire_id: selectedQuestionnaire
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await apiClient.get(`/api/simple-admin/user-profile/tag-statistics?${params.toString()}`);

      if (response.data.success) {
        setTagStats(response.data.data || []);
      } else {
        message.error('获取标签统计失败: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('获取标签统计失败:', error);
      if (error.response?.status === 401) {
        message.error('认证失败，请重新登录');
      } else {
        message.error('获取标签统计失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取情绪统计数据
  const fetchEmotionStatistics = async () => {
    try {
      const params = new URLSearchParams({
        questionnaire_id: selectedQuestionnaire
      });

      const response = await apiClient.get(`/api/simple-admin/user-profile/emotion-statistics?${params.toString()}`);

      if (response.data.success) {
        setEmotionStats(response.data.data || []);
      } else {
        message.error('获取情绪统计失败: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('获取情绪统计失败:', error);
      if (error.response?.status === 401) {
        message.error('认证失败，请重新登录');
      } else {
        message.error('获取情绪统计失败');
      }
    }
  };

  useEffect(() => {
    fetchTagStatistics();
    fetchEmotionStatistics();
  }, [selectedQuestionnaire, selectedCategory]);

  // 标签分类列表
  const categories = Array.from(new Set(tagStats.map(t => t.tag_category))).filter(Boolean);

  // 计算总体统计
  const totalResponses = tagStats.length > 0 ? Math.max(...tagStats.map(t => t.count)) : 0;
  const totalTags = tagStats.length;
  const totalCategories = categories.length;

  // 情绪类型映射
  const emotionTypeMap: Record<string, { label: string; color: string; icon: any }> = {
    'positive': { label: '积极乐观', color: 'green', icon: <HeartOutlined /> },
    'neutral': { label: '平和中性', color: 'blue', icon: <UserOutlined /> },
    'negative': { label: '焦虑压力', color: 'orange', icon: <FireOutlined /> },
    'very-negative': { label: '严重焦虑', color: 'red', icon: <FireOutlined /> }
  };

  // 标签表格列定义
  const tagColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Space>
          {index < 3 && <TrophyOutlined style={{ color: ['#FFD700', '#C0C0C0', '#CD7F32'][index] }} />}
          <Text strong>{index + 1}</Text>
        </Space>
      )
    },
    {
      title: '标签',
      dataIndex: 'tag_name',
      key: 'tag_name',
      render: (text: string, record: TagStatistic) => (
        <Space>
          <Tag color="blue">{text}</Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.tag_key}</Text>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'tag_category',
      key: 'tag_category',
      render: (category: string) => <Tag color="purple">{category}</Tag>
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: TagStatistic, b: TagStatistic) => a.count - b.count,
      render: (count: number) => <Text strong>{count.toLocaleString()}</Text>
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      sorter: (a: TagStatistic, b: TagStatistic) => a.percentage - b.percentage,
      render: (percentage: number) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Text>{percentage.toFixed(2)}%</Text>
          <Progress percent={percentage} size="small" showInfo={false} />
        </Space>
      )
    },
    {
      title: '最后更新',
      dataIndex: 'last_updated',
      key: 'last_updated',
      render: (date: string) => (
        <Text type="secondary">{new Date(date).toLocaleString('zh-CN')}</Text>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <UserOutlined /> 用户画像管理
        </Title>
        <Text type="secondary">
          基于问卷数据自动生成的用户标签和情绪分析统计
        </Text>
      </div>

      {/* 筛选器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="large">
          <Space>
            <Text>问卷：</Text>
            <Select
              value={selectedQuestionnaire}
              onChange={setSelectedQuestionnaire}
              style={{ width: 200 }}
              disabled
            >
              <Option value="questionnaire-v2-2024">就业调研问卷 V2</Option>
            </Select>
          </Space>
          <Space>
            <Text>标签分类：</Text>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 150 }}
              allowClear
              placeholder="全部分类"
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTagStatistics}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} type="primary">
            导出数据
          </Button>
        </Space>
      </Card>

      {/* 总体统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="问卷响应总数"
              value={totalResponses}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="标签总数"
              value={totalTags}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="标签分类数"
              value={totalCategories}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="情绪类型数"
              value={emotionStats.length}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容标签页 */}
      <Tabs defaultActiveKey="tags">
        <TabPane
          tab={
            <span>
              <TagOutlined />
              用户标签统计
            </span>
          }
          key="tags"
        >
          <Card>
            <Table
              columns={tagColumns}
              dataSource={tagStats}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个标签`
              }}
              locale={{
                emptyText: <Empty description="暂无标签数据" />
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <HeartOutlined />
              情绪分析统计
            </span>
          }
          key="emotions"
        >
          <Row gutter={[16, 16]}>
            {emotionStats.map(emotion => {
              const config = emotionTypeMap[emotion.emotion_type] || {
                label: emotion.emotion_type,
                color: 'default',
                icon: <UserOutlined />
              };
              return (
                <Col xs={24} sm={12} md={6} key={emotion.id}>
                  <Card>
                    <Statistic
                      title={config.label}
                      value={emotion.count}
                      suffix={`/ ${emotion.percentage.toFixed(1)}%`}
                      prefix={config.icon}
                      valueStyle={{ color: config.color }}
                    />
                    <Progress
                      percent={emotion.percentage}
                      strokeColor={config.color}
                      style={{ marginTop: '12px' }}
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminUserProfileManagement;

