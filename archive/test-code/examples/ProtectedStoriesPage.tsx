/**
 * 集成防爬虫机制的故事墙页面示例
 * 展示如何在现有页面中集成简化的防爬虫功能
 */

import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Tag, Button, Space, Pagination, Avatar, Spin, Empty, message, Alert } from 'antd';
import {
  HeartOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ShieldCheckOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useStoryProtection } from '../hooks/useAntiBot';
import { SwipeViewer } from '../components/common/SwipeViewer';

const { Title, Paragraph } = Typography;

interface Story {
  id: number;
  title: string;
  content: string;
  summary: string;
  authorName: string;
  category: string;
  likeCount: number;
  createdAt: string;
  tags: string[];
  isFeatured: boolean;
}

export const ProtectedStoriesPage: React.FC = () => {
  // 防爬虫保护
  const {
    isVerified,
    isBot,
    humanScore,
    checkAccess,
    getVerificationToken,
    forceRecheck,
    getBehaviorStats
  } = useStoryProtection();

  // 页面状态
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // SwipeViewer 状态
  const [swipeViewerVisible, setSwipeViewerVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());

  const categories = ['全部', '求职经验', '转行经历', '就业感悟', '职场生活'];

  // 受保护的数据加载函数
  const loadStories = async () => {
    // 检查访问权限
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用，实际应该调用真实API
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockStories: Story[] = [
        {
          id: 1,
          title: '从迷茫到清晰：我的求职之路',
          content: '刚毕业时对未来充满不确定，通过不断尝试和学习，最终找到了适合自己的职业方向...',
          summary: '刚毕业时对未来充满不确定，通过不断尝试和学习，最终找到了适合自己的职业方向。',
          authorName: '小李',
          category: '求职经验',
          likeCount: 45,
          createdAt: '2024-07-15',
          tags: ['求职', '成长', '经验分享'],
          isFeatured: true
        },
        {
          id: 2,
          title: '转行程序员的心路历程',
          content: '从传统行业转入IT行业，虽然过程艰辛，但收获满满...',
          summary: '从传统行业转入IT行业，虽然过程艰辛，但收获满满。',
          authorName: '张同学',
          category: '转行经历',
          likeCount: 38,
          createdAt: '2024-07-10',
          tags: ['转行', '程序员', '学习'],
          isFeatured: false
        }
      ];

      // 根据分类过滤
      const filteredStories = selectedCategory === '全部' 
        ? mockStories 
        : mockStories.filter(story => story.category === selectedCategory);

      setStories(filteredStories);
      setTotal(filteredStories.length);

      // 在请求头中包含人机验证令牌
      const token = getVerificationToken();
      console.log('Request with human verification token:', token);

    } catch (error) {
      console.error('加载故事失败:', error);
      message.error('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理分类切换
  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    await loadStories();
  };

  // 打开故事浏览器
  const handleOpenStoryViewer = async (index: number) => {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return;
    }
    
    setCurrentStoryIndex(index);
    setSwipeViewerVisible(true);
  };

  // 处理故事点赞
  const handleStoryLike = async (story: any) => {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return;
    }

    setUserLikes(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(story.id)) {
        newLikes.delete(story.id);
      } else {
        newLikes.add(story.id);
      }
      return newLikes;
    });
    message.success('点赞成功！');
  };

  // 初始化加载
  useEffect(() => {
    loadStories();
  }, [currentPage, selectedCategory]);

  // 渲染安全状态指示器
  const renderSecurityStatus = () => {
    if (isBot) {
      return (
        <Alert
          message="访问受限"
          description="检测到异常访问行为，请确保您是正常用户访问"
          type="error"
          icon={<RobotOutlined />}
          action={
            <Button size="small" onClick={forceRecheck}>
              重新验证
            </Button>
          }
          style={{ marginBottom: '16px' }}
        />
      );
    }

    if (!isVerified) {
      return (
        <Alert
          message="正在验证"
          description={`人机验证中... 当前得分: ${(humanScore * 100).toFixed(0)}%`}
          type="warning"
          icon={<ShieldCheckOutlined />}
          style={{ marginBottom: '16px' }}
        />
      );
    }

    return (
      <Alert
        message="访问已验证"
        description={`人机验证通过 (得分: ${(humanScore * 100).toFixed(0)}%)`}
        type="success"
        icon={<ShieldCheckOutlined />}
        style={{ marginBottom: '16px' }}
        closable
      />
    );
  };

  // 如果是机器人，显示受限页面
  if (isBot) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <RobotOutlined style={{ fontSize: '64px', color: '#ff4d4f', marginBottom: '24px' }} />
        <Title level={2}>访问受限</Title>
        <Paragraph>
          检测到异常访问行为，请确保您是正常用户访问。
          <br />
          如果您是正常用户，请刷新页面或稍后再试。
        </Paragraph>
        <Space>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
          <Button type="primary" onClick={forceRecheck}>
            重新验证
          </Button>
        </Space>
        
        {/* 调试信息（生产环境应移除） */}
        <div style={{ marginTop: '24px', textAlign: 'left', maxWidth: '600px', margin: '24px auto' }}>
          <Card title="调试信息" size="small">
            <pre>{JSON.stringify(getBehaviorStats(), null, 2)}</pre>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 安全状态指示器 */}
      {renderSecurityStatus()}

      {/* 页面标题 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1}>就业故事墙</Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          分享你的求职经历，倾听他人的就业故事，在这里找到共鸣与力量
        </Paragraph>
      </div>

      {/* 分类筛选 */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Space wrap>
          {categories.map(category => (
            <Button
              key={category}
              type={selectedCategory === category ? 'primary' : 'default'}
              onClick={() => handleCategoryChange(category)}
              disabled={loading}
            >
              {category}
            </Button>
          ))}
        </Space>
      </div>

      {/* 故事列表 */}
      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : stories.length === 0 ? (
          <Empty description="暂无故事" />
        ) : (
          <Row gutter={[24, 24]}>
            {stories.map((story, index) => (
              <Col xs={24} md={12} lg={8} key={story.id}>
                <Card 
                  hoverable
                  onClick={() => handleOpenStoryViewer(index)}
                  style={{ cursor: 'pointer', height: '100%' }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <Space>
                      <Avatar icon={<UserOutlined />} size="small" />
                      <span>{story.authorName}</span>
                      <span style={{ color: '#999' }}>
                        <ClockCircleOutlined /> {story.createdAt}
                      </span>
                    </Space>
                  </div>

                  <Title level={4} style={{ marginBottom: '12px' }}>
                    {story.title}
                  </Title>

                  <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: '12px' }}>
                    {story.summary}
                  </Paragraph>

                  {/* 标签 */}
                  <div style={{ marginBottom: '12px' }}>
                    {story.tags.map((tag, tagIndex) => (
                      <Tag key={tagIndex} color="blue" style={{ marginBottom: '4px' }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>

                  {/* 分类和精选标签 */}
                  <div style={{ marginBottom: '12px' }}>
                    <Tag color="green">{story.category}</Tag>
                    {story.isFeatured && <Tag color="gold">精选</Tag>}
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      type="text"
                      icon={<HeartOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoryLike(story);
                      }}
                    >
                      {story.likeCount}
                    </Button>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStoryViewer(index);
                      }}
                    >
                      查看详情
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* 分页器 */}
        {total > pageSize && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            />
          </div>
        )}
      </div>

      {/* 故事浏览器 */}
      <SwipeViewer
        visible={swipeViewerVisible}
        onClose={() => setSwipeViewerVisible(false)}
        items={stories}
        currentIndex={currentStoryIndex}
        onIndexChange={setCurrentStoryIndex}
        onLike={handleStoryLike}
        onDownload={(story) => message.info('下载功能开发中...')}
        contentType="story"
        userLikes={userLikes}
      />
    </div>
  );
};
