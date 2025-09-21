/**
 * 我的内容页面
 * 用户内容管理中心
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  message,
  Empty,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  FileTextOutlined,
  HeartOutlined,
  BookOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { useQuestionnaireAuthStore } from '../../stores/questionnaireAuthStore';
import { PageLayout } from '../../components/layout/PageLayout';
import { userContentService } from '../../services/userContentService';
import type { UserContentItem } from '../../services/userContentService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 使用统一的UserContentItem类型

export const MyContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('questionnaires');
  const [contentData, setContentData] = useState<UserContentItem[]>([]);
  
  // 检查登录状态
  const { currentUser: universalUser, isAuthenticated: universalAuth } = useUniversalAuthStore();
  const { currentUser: questionnaireUser, isAuthenticated: questionnaireAuth } = useQuestionnaireAuthStore();
  
  const isLoggedIn = universalAuth || questionnaireAuth;
  const currentUser = universalUser || questionnaireUser;

  // 如果未登录，重定向到首页
  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // 模拟数据加载
  // 删除内容
  const handleDeleteContent = async (item: UserContentItem) => {
    try {
      const response = await userContentService.deleteUserContent(item.id, item.type);
      if (response.success) {
        message.success('删除成功');
        loadUserContent(); // 重新加载数据
      } else {
        message.error(response.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete content error:', error);
      message.error('删除失败');
    }
  };

  // 查看内容详情
  const handleViewContent = async (item: UserContentItem) => {
    try {
      const response = await userContentService.getContentDetail(item.id, item.type);
      if (response.success && response.data) {
        Modal.info({
          title: item.title,
          content: (
            <div>
              <p><strong>类型:</strong> {item.type === 'questionnaire' ? '问卷' : item.type === 'voice' ? '心声' : '故事'}</p>
              <p><strong>状态:</strong> {getStatusText(item.status)}</p>
              <p><strong>创建时间:</strong> {new Date(item.createdAt).toLocaleString()}</p>
              {item.content && (
                <div>
                  <p><strong>内容:</strong></p>
                  <div style={{ maxHeight: '300px', overflow: 'auto', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                    {item.content}
                  </div>
                </div>
              )}
            </div>
          ),
          width: 600,
        });
      } else {
        message.error('获取详情失败');
      }
    } catch (error) {
      console.error('View content error:', error);
      message.error('获取详情失败');
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待审核',
      'submitted': '已提交',
      'approved': '已通过',
      'rejected': '已拒绝',
      'draft': '草稿'
    };
    return statusMap[status] || status;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'orange',
      'submitted': 'blue',
      'approved': 'green',
      'rejected': 'red',
      'draft': 'default'
    };
    return colorMap[status] || 'default';
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadUserContent();
    }
  }, [isLoggedIn, activeTab]);

  const loadUserContent = async () => {
    if (!currentUser?.uuid) {
      message.error('用户信息不完整');
      return;
    }

    setLoading(true);
    try {
      let response;

      switch (activeTab) {
        case 'questionnaires':
          response = await userContentService.getUserQuestionnaires(currentUser.uuid);
          break;
        case 'voices':
          response = await userContentService.getUserVoices(currentUser.uuid);
          break;
        case 'stories':
          response = await userContentService.getUserStories(currentUser.uuid);
          break;
        default:
          response = { success: false, error: 'Invalid tab' };
      }

      if (response.success && response.data) {
        setContentData(response.data.items);
      } else {
        message.error(response.error || '加载内容失败');
        setContentData([]);
      }
    } catch (error) {
      console.error('Load user content error:', error);
      message.error('加载内容失败');
      setContentData([]);
    } finally {
      setLoading(false);
    }
  };



  // 操作处理
  const handleView = (record: UserContentItem) => {
    handleViewContent(record);
  };

  const handleEdit = (record: UserContentItem) => {
    message.info('编辑功能开发中...');
  };

  const handleDelete = async (record: UserContentItem) => {
    await handleDeleteContent(record);
  };

  const handleDownload = (record: UserContentItem) => {
    message.info('下载功能开发中...');
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'serialNumber',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: UserContentItem) => (
        <Space>
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.status === 'approved'}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这项内容吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (!isLoggedIn) {
    return null;
  }

  return (
    <PageLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Card>
          <Title level={2}>我的内容</Title>
          <Text type="secondary">
            管理您提交的问卷、心声和其他内容
          </Text>
          
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginTop: '24px' }}
          >
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  我的问卷
                </span>
              }
              key="questionnaires"
            >
              <Table
                columns={columns}
                dataSource={contentData}
                loading={loading}
                rowKey="id"
                locale={{
                  emptyText: <Empty description="暂无问卷数据" />
                }}
              />
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <HeartOutlined />
                  我的心声
                </span>
              }
              key="voices"
            >
              <Table
                columns={columns}
                dataSource={contentData}
                loading={loading}
                rowKey="id"
                locale={{
                  emptyText: <Empty description="暂无心声数据" />
                }}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <BookOutlined />
                  我的故事
                </span>
              }
              key="stories"
            >
              <Table
                columns={columns}
                dataSource={contentData}
                loading={loading}
                rowKey="id"
                locale={{
                  emptyText: <Empty description="暂无故事数据" />
                }}
              />
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </PageLayout>
  );
};

export default MyContentPage;
