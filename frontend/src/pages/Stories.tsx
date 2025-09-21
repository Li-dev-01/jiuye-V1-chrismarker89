/**
 * 就业故事展示页面
 * 展示所有用户发布的就业故事
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Tag, Button,
  Select, Input, Pagination, Empty, Spin, Modal, Avatar
} from 'antd';
import {
  BookOutlined, SearchOutlined, EyeOutlined, HeartOutlined,
  UserOutlined, PlusOutlined, StarOutlined, FrownOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import { UserType } from '../types/uuid-system';
import { storyService } from '../services/storyService';
import type { Story } from '../services/storyService';
import { ManagementAdminService } from '../services/ManagementAdminService';
import { UnifiedCard } from '../components/common/UnifiedCard';
import type { UnifiedCardData } from '../components/common/UnifiedCard';
import StoryForm from '../components/forms/StoryForm';
import SwipeViewer from '../components/common/SwipeViewer';
import '../styles/UnifiedPages.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// 内容清理函数 - 移除分类标识符
const cleanContent = (content: string): string => {
  if (!content) return '';

  // 移除开头的分类标识符，如 [growth]、[interview]、[career_change] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
};

const Stories: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [featuredLoading, setFeaturedLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [swipeCurrentPage, setSwipeCurrentPage] = useState<number>(1);
  const [swipeStories, setSwipeStories] = useState<Story[]>([]);
  const [swipeLoading, setSwipeLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('published_at');
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);

  // 滑动浏览器状态
  const [swipeViewerVisible, setSwipeViewerVisible] = useState<boolean>(false);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState<number>(0);
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());
  const [userDislikes, setUserDislikes] = useState<Set<number>>(new Set());

  // 检查用户是否可以发布
  const canPublish = isAuthenticated && currentUser?.userType === UserType.SEMI_ANONYMOUS;

  // 故事分类选项
  const categories = [
    { value: '', label: '全部分类' },
    { value: 'job-hunting', label: '求职经历', icon: '🔍' },
    { value: 'career-change', label: '职业转换', icon: '🔄' },
    { value: 'entrepreneurship', label: '创业经历', icon: '🚀' },
    { value: 'internship', label: '实习体验', icon: '📚' },
    { value: 'workplace', label: '职场故事', icon: '🏢' },
    { value: 'growth', label: '成长历程', icon: '🌱' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'published_at', label: '最新发布' },
    { value: 'view_count', label: '最多浏览' },
    { value: 'like_count', label: '最多点赞' }
  ];

  useEffect(() => {
    loadAvailableTags();
  }, []);

  useEffect(() => {
    loadStories();
    loadFeaturedStories();
  }, [currentPage, pageSize, selectedCategory, selectedTags, sortBy]);

  // 加载故事列表
  const loadStories = async () => {
    setLoading(true);
    try {
      const result = await storyService.getStories({
        page: currentPage,
        pageSize: pageSize,
        category: selectedCategory || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy: sortBy as any,
        sortOrder: 'desc',
        published: true
      });

      if (result.success && result.data) {
        setStories(result.data.stories);
        setTotal(result.data.total);
      } else {
        console.error('Failed to load stories:', result.error);
      }
    } catch (error) {
      console.error('Load stories error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载可用标签
  const loadAvailableTags = async () => {
    try {
      const tags = await ManagementAdminService.getContentTags();
      // 筛选故事相关的标签
      const storyTags = tags.filter((tag: any) =>
        tag.content_type === 'story' || tag.content_type === 'all'
      );
      setAvailableTags(storyTags);
    } catch (error) {
      console.error('Load tags error:', error);
    }
  };

  // 加载精选故事
  const loadFeaturedStories = async () => {
    setFeaturedLoading(true);
    try {
      const result = await storyService.getFeaturedStories({
        pageSize: 6
      });

      if (result.success && result.data) {
        setFeaturedStories(result.data.stories);
      }
    } catch (error) {
      console.error('Load featured stories error:', error);
    } finally {
      setFeaturedLoading(false);
    }
  };

  // 搜索故事
  const handleSearch = async (value: string) => {
    setSearchText(value);
    if (value.trim()) {
      setLoading(true);
      try {
        const result = await storyService.searchStories(value, {
          page: 1,
          pageSize: pageSize,
          category: selectedCategory || undefined,
          sortBy: sortBy as any,
          sortOrder: 'desc'
        });

        if (result.success && result.data) {
          setStories(result.data.stories);
          setTotal(result.data.total);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error('Search stories error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      loadStories();
    }
  };

  // 查看故事详情 - 使用滑动浏览器
  const handleViewStory = async (story: Story) => {
    try {
      // 增加浏览量
      await storyService.incrementViewCount(story.id);

      // 找到故事在列表中的索引
      const index = stories.findIndex(s => s.id === story.id);
      if (index !== -1) {
        setCurrentSwipeIndex(index);
        setSwipeViewerVisible(true);

        // 初始化滑动浏览器的数据
        setSwipeStories([...stories]);
        setSwipeCurrentPage(currentPage);

        // 更新本地浏览量
        setStories(prev => prev.map(s =>
          s.id === story.id
            ? { ...s, viewCount: s.viewCount + 1 }
            : s
        ));
      }
    } catch (error) {
      console.error('View story error:', error);
    }
  };

  // 在滑动浏览器中加载更多故事
  const handleLoadMoreInSwipe = async () => {
    if (swipeLoading || swipeStories.length >= total) return;

    setSwipeLoading(true);
    try {
      const nextPage = swipeCurrentPage + 1;
      const result = await storyService.getStories({
        page: nextPage,
        pageSize: pageSize,
        category: selectedCategory || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy: sortBy as any,
        sortOrder: 'desc',
        published: true
      });

      if (result.success && result.data) {
        setSwipeStories(prev => [...prev, ...result.data.stories]);
        setSwipeCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Load more stories in swipe error:', error);
    } finally {
      setSwipeLoading(false);
    }
  };

  // 点击卡片处理函数 - 适配UnifiedCard
  const handleCardClick = (cardData: UnifiedCardData) => {
    const story = stories.find(s => s.id === cardData.id);
    if (story) {
      handleViewStory(story);
    }
  };

  // 点赞故事
  const handleLike = async (storyOrId: Story | number) => {
    if (!isAuthenticated) {
      Modal.info({
        title: '需要登录',
        content: '请登录后再进行点赞操作',
        onOk: () => {
          // 触发全局事件打开半匿名登录
          window.dispatchEvent(new Event('openSemiAnonymousLogin'));
        }
      });
      return;
    }

    const storyId = typeof storyOrId === 'number' ? storyOrId : storyOrId.id;

    try {
      const result = await storyService.likeStory(storyId);
      if (result.success) {
        // 更新本地状态
        setStories(prev => prev.map(story =>
          story.id === storyId
            ? { ...story, likeCount: story.likeCount + 1 }
            : story
        ));

        // 更新用户点赞状态
        setUserLikes(prev => new Set([...prev, storyId]));
      }
    } catch (error) {
      console.error('Like story error:', error);
    }
  };

  // 踩故事
  const handleDislike = async (storyOrId: Story | number) => {
    if (!isAuthenticated) {
      Modal.info({
        title: '需要登录',
        content: '请登录后再进行操作',
        onOk: () => {
          // 触发全局事件打开半匿名登录
          window.dispatchEvent(new Event('openSemiAnonymousLogin'));
        }
      });
      return;
    }

    const storyId = typeof storyOrId === 'number' ? storyOrId : storyOrId.id;

    try {
      const result = await storyService.dislikeStory(storyId);
      if (result.success) {
        // 更新本地状态
        setStories(prev => prev.map(story =>
          story.id === storyId
            ? { ...story, dislikeCount: (story.dislikeCount || 0) + 1 }
            : story
        ));

        // 更新用户踩状态
        setUserDislikes(prev => new Set([...prev, storyId]));
      }
    } catch (error) {
      console.error('Dislike story error:', error);
    }
  };

  // 下载故事
  const handleDownload = (story: Story) => {
    // 这里可以调用现有的下载功能
    console.log('Download story:', story.id);
  };

  // 获取分类标签颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'job-hunting': 'blue',
      'career-change': 'green',
      'entrepreneurship': 'orange',
      'internship': 'purple',
      'workplace': 'cyan',
      'growth': 'pink'
    };
    return colors[category] || 'default';
  };

  // 转换故事数据为统一卡片数据格式
  const convertStoryToCardData = (story: Story): UnifiedCardData => ({
    id: story.id,
    type: 'story',
    title: cleanContent(story.title || ''),
    summary: cleanContent(story.summary || ''),
    category: story.category,
    tags: story.tags,
    likeCount: story.likeCount,
    dislikeCount: story.dislikeCount,
    createdAt: story.createdAt,
    publishedAt: story.publishedAt,
    authorName: story.authorName,
    isAnonymous: story.isAnonymous,
    isFeatured: story.isFeatured,
    readingTime: story.readingTime
  });

  // 渲染故事卡片
  const renderStoryCard = (story: Story, featured = false) => (
    <Col xs={24} sm={12} lg={8} xl={featured ? 12 : 6} key={story.id}>
      <UnifiedCard
        data={convertStoryToCardData(story)}
        featured={featured}
        onClick={handleCardClick}
        onLike={handleLike}
        onDislike={handleDislike}
        categories={categories}
      />
    </Col>
  );

  return (
    <div className="unified-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <Title level={2}>
            <BookOutlined style={{ color: '#1890ff' }} />
            就业故事
          </Title>
          <Paragraph type="secondary">
            分享你的就业经历，启发他人的职业道路
          </Paragraph>
        </div>
        
        {canPublish && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateModalVisible(true)}
          >
            发布故事
          </Button>
        )}
      </div>

      {/* 精选故事 */}
      {featuredStories.length > 0 && (
        <Card className="featured-section" title="✨ 精选故事">
          <Spin spinning={featuredLoading}>
            <Row gutter={[16, 16]}>
              {featuredStories.map(story => renderStoryCard(story, true))}
            </Row>
          </Spin>
        </Card>
      )}

      {/* 筛选和搜索 */}
      <Card className="filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索故事标题或内容..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="选择分类"
              style={{ width: '100%' }}
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  <Space>
                    {cat.icon && <span>{cat.icon}</span>}
                    <span>{cat.label}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Select
              mode="multiple"
              placeholder="选择标签筛选"
              style={{ width: '100%' }}
              value={selectedTags}
              onChange={setSelectedTags}
              allowClear
              maxTagCount="responsive"
              showSearch
              filterOption={(input, option) => {
                const tag = availableTags.find(t => t.id === option?.value);
                return tag?.tag_name.toLowerCase().includes(input.toLowerCase()) ||
                       tag?.tag_name_en?.toLowerCase().includes(input.toLowerCase()) ||
                       tag?.tag_key.toLowerCase().includes(input.toLowerCase());
              }}
              notFoundContent={availableTags.length === 0 ? "加载中..." : "无匹配标签"}
            >
              {/* 热门标签分组 */}
              {availableTags
                .filter(tag => tag.usage_count > 10)
                .sort((a, b) => b.usage_count - a.usage_count)
                .slice(0, 5)
                .map(tag => (
                  <Option key={`hot-${tag.id}`} value={tag.id}>
                    <Tag color={tag.color} style={{ margin: 0 }}>
                      🔥 {tag.tag_name} ({tag.usage_count})
                    </Tag>
                  </Option>
                ))}

              {/* 分隔线 */}
              {availableTags.some(tag => tag.usage_count > 10) && (
                <Option disabled key="divider" value="divider">
                  <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }}></div>
                </Option>
              )}

              {/* 所有标签 */}
              {availableTags
                .sort((a, b) => a.tag_name.localeCompare(b.tag_name))
                .map(tag => (
                  <Option key={tag.id} value={tag.id}>
                    <Tag color={tag.color} style={{ margin: 0 }}>
                      {tag.tag_name}
                      {tag.usage_count > 0 && (
                        <span style={{ marginLeft: 4, opacity: 0.7 }}>
                          ({tag.usage_count})
                        </span>
                      )}
                    </Tag>
                  </Option>
                ))}
            </Select>
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              value={sortBy}
              onChange={setSortBy}
            >
              {sortOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} md={8}>
            <div className="stats-info">
              <Text type="secondary">
                共 {total} 个故事
                {searchText && ` • 搜索"${searchText}"`}
                {selectedCategory && ` • ${categories.find(c => c.value === selectedCategory)?.label}`}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 故事列表 */}
      <div className="content-area">
        <Spin spinning={loading}>
          {stories.length > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                {stories.map(story => renderStoryCard(story))}
              </Row>
              
              <div className="pagination-wrapper">
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={pageSize}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => 
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    if (size !== pageSize) {
                      setPageSize(size);
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <Empty
              description={
                searchText || selectedCategory 
                  ? "没有找到匹配的故事" 
                  : "暂无故事分享"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {canPublish && !searchText && !selectedCategory && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  发布第一个故事
                </Button>
              )}
            </Empty>
          )}
        </Spin>
      </div>

      {/* 发布故事模态框 */}
      <StoryForm
        mode="modal"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadStories(); // 重新加载列表
        }}
      />

      {/* 故事详情模态框 */}
      <Modal
        title={selectedStory?.title}
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedStory && (
          <div className="story-detail">
            <div className="story-detail-meta">
              <Space>
                <Tag color={getCategoryColor(selectedStory.category)}>
                  {categories.find(c => c.value === selectedStory.category)?.label}
                </Tag>
                {selectedStory.isFeatured && (
                  <Tag color="gold">精选</Tag>
                )}
              </Space>
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text>{selectedStory.authorName}</Text>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">
                    {new Date(selectedStory.publishedAt || selectedStory.createdAt).toLocaleString()}
                  </Text>
                </Space>
              </div>
            </div>
            
            <div className="story-detail-content">
              <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8' }}>
                {cleanContent(selectedStory.content)}
              </Paragraph>
            </div>
            
            {selectedStory.tags && selectedStory.tags.length > 0 && (
              <div className="story-detail-tags">
                <Text strong>标签：</Text>
                <Space wrap style={{ marginTop: 8 }}>
                  {selectedStory.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
            
            <div className="story-detail-stats">
              <Space>
                <Text type="secondary">
                  <EyeOutlined /> {selectedStory.viewCount} 次浏览
                </Text>
                <Text type="secondary">
                  <HeartOutlined /> {selectedStory.likeCount} 次点赞
                </Text>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* 滑动浏览器 */}
      <SwipeViewer
        visible={swipeViewerVisible}
        onClose={() => setSwipeViewerVisible(false)}
        items={swipeStories}
        currentIndex={currentSwipeIndex}
        onIndexChange={setCurrentSwipeIndex}
        onLike={handleLike}
        onDislike={handleDislike}
        onDownload={canPublish ? handleDownload : undefined}
        contentType="story"
        userLikes={userLikes}
        userDislikes={userDislikes}
        hasMore={swipeStories.length < total}
        onLoadMore={handleLoadMoreInSwipe}
      />
    </div>
  );
};

export default Stories;
