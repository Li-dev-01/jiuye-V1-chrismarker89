/**
 * 内容管理页面 - 增强版
 * 管理内容分类、标签和展示规则
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
  Spin,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  Switch,
  Tabs,
  Descriptions,
  Tooltip,
  Badge
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  FolderOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { ManagementAdminService } from '../../services/ManagementAdminService';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface ContentCategory {
  id: number;
  category_key: string;
  category_name: string;
  category_name_en: string;
  description: string;
  parent_id?: number;
  sort_order: number;
  icon: string;
  color: string;
  is_active: boolean;
  content_type: string;
  display_rules?: any;
  created_at: string;
  updated_at: string;
}

interface ContentTag {
  id: number;
  tag_key: string;
  tag_name: string;
  tag_name_en: string;
  description: string;
  tag_type: string;
  color: string;
  usage_count: number;
  is_active: boolean;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export const ContentManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [activeTab, setActiveTab] = useState('categories');
  
  // 模态框状态
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ContentCategory | null>(null);
  const [editingTag, setEditingTag] = useState<ContentTag | null>(null);
  
  const [categoryForm] = Form.useForm();
  const [tagForm] = Form.useForm();

  // 加载内容分类
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await ManagementAdminService.getContentCategories();
      setCategories(data);
    } catch (error) {
      console.error('加载内容分类失败:', error);
      message.error('加载内容分类失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载内容标签
  const loadTags = async () => {
    setLoading(true);
    try {
      const data = await ManagementAdminService.getContentTags();
      setTags(data);
    } catch (error) {
      console.error('加载内容标签失败:', error);
      message.error('加载内容标签失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  // 创建/编辑分类
  const handleCategorySubmit = async (values: any) => {
    try {
      if (editingCategory) {
        // 编辑逻辑（需要后端支持）
        message.info('编辑功能待实现');
      } else {
        await ManagementAdminService.createContentCategory({
          ...values,
          admin_id: 'admin' // 临时使用
        });
        message.success('分类创建成功');
        loadCategories();
      }
      setCategoryModalVisible(false);
      categoryForm.resetFields();
      setEditingCategory(null);
    } catch (error) {
      console.error('保存分类失败:', error);
      message.error('保存分类失败');
    }
  };

  // 创建/编辑标签
  const handleTagSubmit = async (values: any) => {
    try {
      if (editingTag) {
        await ManagementAdminService.updateContentTag(editingTag.id, values);
        message.success('标签更新成功');
      } else {
        await ManagementAdminService.createContentTag({
          ...values,
          admin_id: 'admin' // 临时使用
        });
        message.success('标签创建成功');
      }
      loadTags();
      setTagModalVisible(false);
      tagForm.resetFields();
      setEditingTag(null);
    } catch (error) {
      console.error('保存标签失败:', error);
      message.error('保存标签失败');
    }
  };

  // 删除标签
  const handleDeleteTag = async (tag: ContentTag) => {
    try {
      await ManagementAdminService.deleteContentTag(tag.id.toString());
      message.success('标签删除成功');
      loadTags();
    } catch (error) {
      console.error('删除标签失败:', error);
      message.error('删除标签失败');
    }
  };

  // 清理未使用的标签
  const handleCleanupTags = async () => {
    try {
      const result = await ManagementAdminService.cleanupUnusedTags();
      message.success(`成功清理 ${result.data.deleted_count} 个未使用的标签`);
      loadTags();
    } catch (error) {
      console.error('清理标签失败:', error);
      message.error('清理标签失败');
    }
  };

  // 分类表格列
  const categoryColumns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      render: (icon: string) => <span style={{ fontSize: '20px' }}>{icon}</span>
    },
    {
      title: '分类信息',
      key: 'categoryInfo',
      render: (record: ContentCategory) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.category_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.category_name_en} ({record.category_key})
          </div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: color, 
              borderRadius: '4px',
              marginRight: '8px'
            }} 
          />
          <span style={{ fontSize: '12px' }}>{color}</span>
        </div>
      )
    },
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          all: { color: 'blue', text: '全部' },
          heart_voice: { color: 'green', text: '心声' },
          story: { color: 'orange', text: '故事' },
          questionnaire: { color: 'purple', text: '问卷' }
        };
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (record: ContentCategory) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCategory(record);
              categoryForm.setFieldsValue(record);
              setCategoryModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => {
              Modal.info({
                title: '分类详情',
                width: 600,
                content: (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="分类键">{record.category_key}</Descriptions.Item>
                    <Descriptions.Item label="中文名称">{record.category_name}</Descriptions.Item>
                    <Descriptions.Item label="英文名称">{record.category_name_en}</Descriptions.Item>
                    <Descriptions.Item label="描述">{record.description}</Descriptions.Item>
                    <Descriptions.Item label="图标">{record.icon}</Descriptions.Item>
                    <Descriptions.Item label="颜色">{record.color}</Descriptions.Item>
                    <Descriptions.Item label="内容类型">{record.content_type}</Descriptions.Item>
                    <Descriptions.Item label="排序">{record.sort_order}</Descriptions.Item>
                    <Descriptions.Item label="状态">{record.is_active ? '启用' : '禁用'}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{new Date(record.created_at).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="更新时间">{new Date(record.updated_at).toLocaleString()}</Descriptions.Item>
                  </Descriptions>
                )
              });
            }}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  // 标签表格列
  const tagColumns = [
    {
      title: '标签信息',
      key: 'tagInfo',
      render: (record: ContentTag) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.tag_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.tag_name_en} ({record.tag_key})
          </div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color: string, record: ContentTag) => (
        <Tag color={color}>{record.tag_name}</Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'tag_type',
      key: 'tag_type',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          system: { color: 'blue', text: '系统' },
          user: { color: 'green', text: '用户' },
          auto: { color: 'orange', text: '自动' }
        };
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          all: { color: 'blue', text: '全部' },
          heart_voice: { color: 'green', text: '心声' },
          story: { color: 'orange', text: '故事' },
          questionnaire: { color: 'purple', text: '问卷' }
        };
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (record: ContentTag) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTag(record);
              tagForm.setFieldsValue(record);
              setTagModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => {
              Modal.info({
                title: '标签详情',
                width: 600,
                content: (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="标签键">{record.tag_key}</Descriptions.Item>
                    <Descriptions.Item label="中文名称">{record.tag_name}</Descriptions.Item>
                    <Descriptions.Item label="英文名称">{record.tag_name_en}</Descriptions.Item>
                    <Descriptions.Item label="描述">{record.description}</Descriptions.Item>
                    <Descriptions.Item label="类型">{record.tag_type}</Descriptions.Item>
                    <Descriptions.Item label="颜色">{record.color}</Descriptions.Item>
                    <Descriptions.Item label="使用次数">{record.usage_count}</Descriptions.Item>
                    <Descriptions.Item label="内容类型">{record.content_type}</Descriptions.Item>
                    <Descriptions.Item label="状态">{record.is_active ? '启用' : '禁用'}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{new Date(record.created_at).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="更新时间">{new Date(record.updated_at).toLocaleString()}</Descriptions.Item>
                  </Descriptions>
                )
              });
            }}
          >
            详情
          </Button>
          {record.usage_count === 0 && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除标签"${record.tag_name}"吗？`,
                  onOk: () => handleDeleteTag(record)
                });
              }}
            >
              删除
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#fff7e6', minHeight: 'calc(100vh - 64px)' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            <FolderOutlined style={{ marginRight: '8px' }} />
            内容管理
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={() => {
                loadCategories();
                loadTags();
              }}
              loading={loading}
              style={{ marginLeft: '16px' }}
            >
              刷新
            </Button>
          </Title>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            管理内容分类、标签和展示规则
          </div>
        </div>

        {/* 内容管理标签页 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><FolderOutlined />内容分类</span>} key="categories">
            <Card
              title="内容分类管理"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingCategory(null);
                    categoryForm.resetFields();
                    setCategoryModalVisible(true);
                  }}
                >
                  新建分类
                </Button>
              }
            >
              <Table
                columns={categoryColumns}
                dataSource={categories}
                rowKey="id"
                loading={loading}
                pagination={false}
              />
            </Card>
          </TabPane>

          <TabPane tab={<span><TagOutlined />内容标签</span>} key="tags">
            <Card
              title="内容标签管理"
              extra={
                <Space>
                  <Button
                    type="default"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: '确认清理',
                        content: '确定要清理所有未使用的标签吗？此操作不可撤销。',
                        onOk: handleCleanupTags
                      });
                    }}
                  >
                    清理未使用
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingTag(null);
                      tagForm.resetFields();
                      setTagModalVisible(true);
                    }}
                  >
                    新建标签
                  </Button>
                </Space>
              }
            >
              <Table
                columns={tagColumns}
                dataSource={tags}
                rowKey="id"
                loading={loading}
                pagination={false}
              />
            </Card>
          </TabPane>
        </Tabs>

        {/* 分类创建/编辑模态框 */}
        <Modal
          title={editingCategory ? '编辑分类' : '新建分类'}
          open={categoryModalVisible}
          onCancel={() => {
            setCategoryModalVisible(false);
            categoryForm.resetFields();
            setEditingCategory(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={categoryForm}
            layout="vertical"
            onFinish={handleCategorySubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category_key"
                  label="分类键"
                  rules={[{ required: true, message: '请输入分类键' }]}
                >
                  <Input placeholder="如: job_search" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category_name"
                  label="中文名称"
                  rules={[{ required: true, message: '请输入中文名称' }]}
                >
                  <Input placeholder="如: 求职找工作" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category_name_en"
                  label="英文名称"
                >
                  <Input placeholder="如: Job Search" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="content_type"
                  label="内容类型"
                  rules={[{ required: true, message: '请选择内容类型' }]}
                >
                  <Select>
                    <Option value="all">全部</Option>
                    <Option value="heart_voice">心声</Option>
                    <Option value="story">故事</Option>
                    <Option value="questionnaire">问卷</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={3} placeholder="分类描述" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="icon"
                  label="图标"
                >
                  <Input placeholder="如: 💼" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="color"
                  label="颜色"
                  initialValue="#1890ff"
                >
                  <Input placeholder="#1890ff" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="sort_order"
                  label="排序"
                  initialValue={0}
                >
                  <Input type="number" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingCategory ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setCategoryModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 标签创建/编辑模态框 */}
        <Modal
          title={editingTag ? '编辑标签' : '新建标签'}
          open={tagModalVisible}
          onCancel={() => {
            setTagModalVisible(false);
            tagForm.resetFields();
            setEditingTag(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={tagForm}
            layout="vertical"
            onFinish={handleTagSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="tag_key"
                  label="标签键"
                  rules={[{ required: true, message: '请输入标签键' }]}
                >
                  <Input placeholder="如: urgent" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="tag_name"
                  label="中文名称"
                  rules={[{ required: true, message: '请输入中文名称' }]}
                >
                  <Input placeholder="如: 紧急" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="tag_name_en"
                  label="英文名称"
                >
                  <Input placeholder="如: Urgent" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="tag_type"
                  label="标签类型"
                  initialValue="system"
                >
                  <Select>
                    <Option value="system">系统</Option>
                    <Option value="user">用户</Option>
                    <Option value="auto">自动</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={3} placeholder="标签描述" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="color"
                  label="颜色"
                  initialValue="#1890ff"
                >
                  <Input placeholder="#1890ff" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="content_type"
                  label="内容类型"
                  initialValue="all"
                >
                  <Select>
                    <Option value="all">全部</Option>
                    <Option value="heart_voice">心声</Option>
                    <Option value="story">故事</Option>
                    <Option value="questionnaire">问卷</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingTag ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setTagModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ContentManagementPage;
