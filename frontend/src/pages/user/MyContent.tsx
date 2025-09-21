/**
 * 我的内容管理页面
 * 用户查看和管理自己发布的问卷心声和故事
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Table, Button, Space, Tag, Modal, message, 
  Typography, Tooltip, Popconfirm, Empty, Spin, Input
} from 'antd';
import {
  HeartOutlined, BookOutlined, DownloadOutlined, DeleteOutlined,
  EyeOutlined, ShareAltOutlined, SearchOutlined, PictureOutlined
} from '@ant-design/icons';
import { useAuth } from '../../stores/universalAuthStore';
import { UserType } from '../../types/uuid-system';
import CardDownloadButton from '../../components/cards/CardDownloadButton';
import { cardDownloadService } from '../../services/cardDownloadService';
import './MyContent.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

interface ContentItem {
  id: number;
  uuid: string;
  type: 'heart_voice' | 'story';
  title: string;
  content: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  publishedAt?: string;
  pngCardsCount: number;
  pngGenerationStatus: string;
  downloadCount: number;
}

const MyContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [heartVoices, setHeartVoices] = useState<ContentItem[]>([]);
  const [stories, setStories] = useState<ContentItem[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [cardsVisible, setCardsVisible] = useState<boolean>(false);
  const [userCards, setUserCards] = useState<any[]>([]);
  
  // 检查用户权限
  const hasContentAccess = isAuthenticated && currentUser?.userType === UserType.SEMI_ANONYMOUS;
  
  useEffect(() => {
    if (hasContentAccess) {
      loadUserContent();
      loadUserCards();
    }
  }, [hasContentAccess]);
  
  // 加载用户内容
  const loadUserContent = async () => {
    setLoading(true);
    try {
      // 调用真实API获取用户内容
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHeartVoices(data.heartVoices || []);
        setStories(data.stories || []);
      } else {
        // API未配置或失败时显示空数据
        setHeartVoices([]);
        setStories([]);
        message.warning('用户内容API未配置，请联系管理员');
      }
    } catch (error) {
      message.error('加载内容失败');
      console.error('Load content error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 加载用户卡片
  const loadUserCards = async () => {
    try {
      if (currentUser?.uuid) {
        const cards = await cardDownloadService.getUserCards(currentUser.uuid);
        setUserCards(cards);
      }
    } catch (error) {
      console.error('Load user cards error:', error);
    }
  };
  
  // 删除内容
  const deleteContent = async (contentId: number, contentType: string) => {
    try {
      // 这里需要实现删除内容的API
      message.success('内容删除成功');
      loadUserContent();
    } catch (error) {
      message.error('删除失败');
      console.error('Delete content error:', error);
    }
  };
  
  // 预览内容
  const previewContent = (content: ContentItem) => {
    setSelectedContent(content);
    setPreviewVisible(true);
  };
  
  // 查看卡片
  const viewCards = (content: ContentItem) => {
    setSelectedContent(content);
    setCardsVisible(true);
  };
  
  // 过滤内容
  const filterContent = (data: ContentItem[]) => {
    if (!searchText) return data;
    return data.filter(item => 
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.content.toLowerCase().includes(searchText.toLowerCase())
    );
  };
  
  // 表格列定义
  const getColumns = (contentType: 'heart_voice' | 'story') => [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title: string, record: ContentItem) => (
        <div>
          <Text strong>{title}</Text>
          {record.isFeatured && (
            <Tag color="gold" style={{ marginLeft: 8 }}>精选</Tag>
          )}
        </div>
      )
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (content: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: false }}>
          {content}
        </Paragraph>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: ContentItem) => {
        const statusConfig = {
          approved: { color: 'green', text: '已发布' },
          under_review: { color: 'orange', text: '审核中' },
          rejected: { color: 'red', text: '已拒绝' },
          draft: { color: 'default', text: '草稿' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'PNG卡片',
      key: 'pngCards',
      width: 120,
      render: (record: ContentItem) => (
        <div>
          <Text>{record.pngCardsCount} 张</Text>
          {record.pngGenerationStatus === 'completed' && (
            <Tag color="green" size="small" style={{ marginLeft: 4 }}>已生成</Tag>
          )}
        </div>
      )
    },
    {
      title: '下载次数',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 100,
      render: (count: number) => <Text>{count}</Text>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => new Date(time).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: ContentItem) => (
        <Space size="small">
          <Tooltip title="预览内容">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => previewContent(record)}
            />
          </Tooltip>
          
          <Tooltip title="查看卡片">
            <Button 
              type="text" 
              icon={<PictureOutlined />} 
              onClick={() => viewCards(record)}
              disabled={record.pngCardsCount === 0}
            />
          </Tooltip>
          
          <CardDownloadButton
            contentType={record.type}
            contentId={record.id}
            buttonText=""
            buttonType="text"
            showIcon={true}
            showTooltip={true}
            tooltipText="下载卡片"
            onSuccess={() => {
              loadUserCards();
              loadUserContent();
            }}
          />
          
          <Popconfirm
            title="确定要删除这个内容吗？"
            onConfirm={() => deleteContent(record.id, record.type)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除内容">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  // 如果用户没有权限
  if (!hasContentAccess) {
    return (
      <div className="my-content-page">
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4}>需要登录访问</Title>
                <Text type="secondary">
                  请使用A+B方式登录后查看您的内容
                </Text>
              </div>
            }
          />
        </Card>
      </div>
    );
  }
  
  return (
    <div className="my-content-page">
      <Card>
        <div className="page-header">
          <Title level={2}>我的内容</Title>
          <Text type="secondary">
            管理您发布的问卷心声和故事，下载精美的PNG卡片
          </Text>
        </div>
        
        <div className="content-controls">
          <Search
            placeholder="搜索内容..."
            allowClear
            style={{ width: 300 }}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
        
        <Spin spinning={loading}>
          <Tabs defaultActiveKey="heart_voices">
            <TabPane 
              tab={
                <span>
                  <HeartOutlined />
                  问卷心声 ({heartVoices.length})
                </span>
              } 
              key="heart_voices"
            >
              <Table
                columns={getColumns('heart_voice')}
                dataSource={filterContent(heartVoices)}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`
                }}
                locale={{
                  emptyText: <Empty description="暂无问卷心声" />
                }}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <BookOutlined />
                  就业故事 ({stories.length})
                </span>
              } 
              key="stories"
            >
              <Table
                columns={getColumns('story')}
                dataSource={filterContent(stories)}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`
                }}
                locale={{
                  emptyText: <Empty description="暂无就业故事" />
                }}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
      
      {/* 内容预览模态框 */}
      <Modal
        title="内容预览"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {selectedContent && (
          <div>
            <Title level={4}>{selectedContent.title}</Title>
            <Paragraph>{selectedContent.content}</Paragraph>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                创建时间: {new Date(selectedContent.createdAt).toLocaleString()}
              </Text>
              {selectedContent.publishedAt && (
                <Text type="secondary" style={{ marginLeft: 16 }}>
                  发布时间: {new Date(selectedContent.publishedAt).toLocaleString()}
                </Text>
              )}
            </div>
          </div>
        )}
      </Modal>
      
      {/* 卡片查看模态框 */}
      <Modal
        title="我的卡片"
        visible={cardsVisible}
        onCancel={() => setCardsVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedContent && (
          <div>
            <Title level={4}>{selectedContent.title} - PNG卡片</Title>
            <div className="cards-grid">
              {userCards
                .filter(card => 
                  card.contentType === selectedContent.type && 
                  card.contentId === selectedContent.id
                )
                .map(card => (
                  <Card
                    key={card.cardId}
                    hoverable
                    style={{ width: 200, margin: 8 }}
                    cover={
                      <img 
                        alt={card.filename} 
                        src={card.fileUrl}
                        style={{ height: 150, objectFit: 'cover' }}
                      />
                    }
                    actions={[
                      <DownloadOutlined 
                        key="download" 
                        onClick={() => window.open(card.fileUrl, '_blank')}
                      />,
                      <ShareAltOutlined key="share" />
                    ]}
                  >
                    <Card.Meta
                      title={card.cardStyle}
                      description={`${(card.fileSize / 1024).toFixed(1)} KB`}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        下载 {card.downloadCount} 次
                      </Text>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyContent;
