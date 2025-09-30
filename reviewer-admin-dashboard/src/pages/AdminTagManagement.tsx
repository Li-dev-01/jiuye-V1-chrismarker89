import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Tabs,
  Typography,
  Badge,
  Tooltip,
  Progress,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  BarChartOutlined,
  FireOutlined,
  ReloadOutlined,
  MergeOutlined,
  ClearOutlined,
  BulbOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { API_CONFIG, STORAGE_KEYS } from '../config/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface TagData {
  id: number;
  tag_key: string;
  tag_name: string;
  tag_name_en?: string;
  description?: string;
  tag_type: 'system' | 'user' | 'auto';
  color: string;
  usage_count: number;
  is_active: boolean;
  content_type: 'story' | 'heart_voice' | 'questionnaire' | 'all';
  created_at: string;
  updated_at: string;
}

interface TagStats {
  total_tags: number;
  active_tags: number;
  total_usage: number;
  most_used_tag: {
    tag_name: string;
    usage_count: number;
  };
  tag_type_distribution: Array<{
    tag_type: string;
    count: number;
  }>;
  content_type_distribution: Array<{
    content_type: string;
    count: number;
  }>;
  recent_tags: TagData[];
}

const AdminTagManagement: React.FC = () => {
  const [tags, setTags] = useState<TagData[]>([]);
  const [tagStats, setTagStats] = useState<TagStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [form] = Form.useForm();

  // 获取标签列表
  const fetchTags = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTENT_TAGS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setTags(data.data || []);
      } else {
        message.error('获取标签列表失败');
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
      message.error('获取标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取标签统计
  const fetchTagStats = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTENT_TAGS_STATS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setTagStats(data.data);
      }
    } catch (error) {
      console.error('获取标签统计失败:', error);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchTagStats();
  }, []);

  // 创建或更新标签
  const handleSaveTag = async (values: any) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const payload = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff'
      };

      let response;
      if (editingTag) {
        response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTENT_TAGS}/${editingTag.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTENT_TAGS}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (data.success) {
        message.success(editingTag ? '标签更新成功' : '标签创建成功');
        setModalVisible(false);
        setEditingTag(null);
        form.resetFields();
        fetchTags();
        fetchTagStats();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (error) {
      console.error('保存标签失败:', error);
      message.error('保存标签失败');
    }
  };

  // 删除标签
  const handleDeleteTag = async (tagId: number) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTENT_TAGS}/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        message.success('标签删除成功');
        fetchTags();
        fetchTagStats();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除标签失败:', error);
      message.error('删除标签失败');
    }
  };

  // 清理未使用的标签
  const handleCleanupTags = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTENT_TAGS_CLEANUP}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        message.success(`已清理 ${data.data.deleted_count} 个未使用的标签`);
        fetchTags();
        fetchTagStats();
      } else {
        message.error(data.message || '清理失败');
      }
    } catch (error) {
      console.error('清理标签失败:', error);
      message.error('清理标签失败');
    }
  };

  // 打开编辑模态框
  const handleEditTag = (tag: TagData) => {
    setEditingTag(tag);
    form.setFieldsValue({
      ...tag,
      color: tag.color
    });
    setModalVisible(true);
  };

  // 打开新建模态框
  const handleCreateTag = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<TagData> = [
    {
      title: '标签',
      dataIndex: 'tag_name',
      key: 'tag_name',
      render: (text: string, record: TagData) => (
        <Space>
          <Tag color={record.color} style={{ margin: 0 }}>
            {text}
          </Tag>
          {record.tag_name_en && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.tag_name_en}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '标签键',
      dataIndex: 'tag_key',
      key: 'tag_key',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'tag_type',
      key: 'tag_type',
      render: (type: string) => {
        const typeMap = {
          system: { color: 'blue', text: '系统' },
          user: { color: 'green', text: '用户' },
          auto: { color: 'orange', text: '自动' }
        };
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '适用内容',
      dataIndex: 'content_type',
      key: 'content_type',
      render: (type: string) => {
        const typeMap = {
          story: '故事',
          heart_voice: '心声',
          questionnaire: '问卷',
          all: '全部'
        };
        return typeMap[type as keyof typeof typeMap] || type;
      },
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      sorter: (a, b) => a.usage_count - b.usage_count,
      render: (count: number) => (
        <Badge 
          count={count} 
          style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }}
          showZero
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: TagData) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditTag(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个标签吗？"
            description="删除后将无法恢复，且会影响相关内容的标签关联。"
            onConfirm={() => handleDeleteTag(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TagsOutlined /> 标签管理
        </Title>
        <Text type="secondary">
          管理系统中的所有内容标签，包括创建、编辑、删除和统计分析
        </Text>
      </div>

      <Tabs defaultActiveKey="list">
        <TabPane tab={<span><TagsOutlined />标签列表</span>} key="list">
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateTag}
                >
                  新建标签
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    fetchTags();
                    fetchTagStats();
                  }}
                >
                  刷新
                </Button>
              </Space>
              <Space>
                <Popconfirm
                  title="清理未使用的标签"
                  description="这将删除所有使用次数为0的标签，确定继续吗？"
                  onConfirm={handleCleanupTags}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    icon={<ClearOutlined />}
                    danger
                  >
                    清理未使用标签
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={tags}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个标签`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><BarChartOutlined />使用统计</span>} key="stats">
          {tagStats && (
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总标签数"
                    value={tagStats.total_tags}
                    prefix={<TagsOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="启用标签"
                    value={tagStats.active_tags}
                    prefix={<TagsOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总使用次数"
                    value={tagStats.total_usage}
                    prefix={<FireOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最热门标签"
                    value={tagStats.most_used_tag?.usage_count || 0}
                    prefix={<FireOutlined />}
                    suffix={
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {tagStats.most_used_tag?.tag_name || '无'}
                      </Text>
                    }
                  />
                </Card>
              </Col>
            </Row>
          )}
        </TabPane>
      </Tabs>

      {/* 新建/编辑标签模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTag(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTag}
          initialValues={{
            tag_type: 'system',
            content_type: 'story',
            color: '#1890ff',
            is_active: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tag_key"
                label="标签键"
                rules={[
                  { required: true, message: '请输入标签键' },
                  { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' }
                ]}
              >
                <Input placeholder="例如: job_search" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tag_name"
                label="标签名称"
                rules={[{ required: true, message: '请输入标签名称' }]}
              >
                <Input placeholder="例如: 求职经历" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tag_name_en"
                label="英文名称"
              >
                <Input placeholder="例如: Job Search" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="color"
                label="标签颜色"
              >
                <ColorPicker showText />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="标签的详细描述..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="tag_type"
                label="标签类型"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="system">系统标签</Select.Option>
                  <Select.Option value="user">用户标签</Select.Option>
                  <Select.Option value="auto">自动标签</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="content_type"
                label="适用内容"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="story">故事</Select.Option>
                  <Select.Option value="heart_voice">心声</Select.Option>
                  <Select.Option value="questionnaire">问卷</Select.Option>
                  <Select.Option value="all">全部</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="is_active"
                label="状态"
                valuePropName="checked"
              >
                <Select>
                  <Select.Option value={true}>启用</Select.Option>
                  <Select.Option value={false}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTag ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTagManagement;
