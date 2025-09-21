/**
 * 问卷心声展示页面
 * 展示所有用户发布的问卷心声
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Tag, Button,
  Select, Input, Pagination, Empty, Spin, Rate, Modal
} from 'antd';
import {
  HeartOutlined, SearchOutlined, FilterOutlined,
  SmileOutlined, MehOutlined, FrownOutlined, PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import { UserType } from '../types/uuid-system';
import { heartVoiceService } from '../services/heartVoiceService';
import type { HeartVoice } from '../services/heartVoiceService';
import { ManagementAdminService } from '../services/ManagementAdminService';
import { UnifiedCard } from '../components/common/UnifiedCard';
import type { UnifiedCardData } from '../components/common/UnifiedCard';
import HeartVoiceForm from '../components/forms/HeartVoiceForm';
import SwipeViewer from '../components/common/SwipeViewer';
import '../styles/UnifiedPages.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// 内容清理函数 - 移除分类标识符
const cleanContent = (content: string): string => {
  if (!content) return '';

  // 移除开头的分类标识符，如 [reflection]、[gratitude]、[suggestion] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
};

const Voices: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [voices, setVoices] = useState<HeartVoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [swipeCurrentPage, setSwipeCurrentPage] = useState<number>(1);
  const [swipeVoices, setSwipeVoices] = useState<HeartVoice[]>([]);
  const [swipeLoading, setSwipeLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);

  // 滑动浏览器状态
  const [swipeViewerVisible, setSwipeViewerVisible] = useState<boolean>(false);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState<number>(0);
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());
  const [userDislikes, setUserDislikes] = useState<Set<number>>(new Set());

  // 检查用户是否可以发布
  const canPublish = isAuthenticated && currentUser?.userType === UserType.SEMI_ANONYMOUS;

  // 心声分类选项
  const categories = [
    { value: '', label: '全部分类' },
    { value: 'experience', label: '求职经验' },
    { value: 'advice', label: '建议分享' },
    { value: 'encouragement', label: '鼓励话语' },
    { value: 'reflection', label: '个人感悟' },
    { value: 'gratitude', label: '感谢表达' },
    { value: 'challenge', label: '困难分享' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'created_at', label: '最新发布' },
    { value: 'like_count', label: '最多点赞' },
    { value: 'emotion_score', label: '情感评分' }
  ];

  // 加载可用标签
  const loadAvailableTags = async () => {
    try {
      const tags = await ManagementAdminService.getContentTags();
      // 筛选心声相关的标签
      const voiceTags = tags.filter((tag: any) =>
        tag.content_type === 'heart_voice' || tag.content_type === 'all'
      );
      setAvailableTags(voiceTags);
    } catch (error) {
      console.error('Load tags error:', error);
    }
  };

  useEffect(() => {
    loadAvailableTags();
  }, []);

  useEffect(() => {
    loadVoices();
  }, [currentPage, pageSize, selectedCategory, selectedTags, sortBy]);

  // 模拟数据已清理 - 现在使用真实API数据

  // 加载心声列表
  const loadVoices = async () => {
    setLoading(true);
    try {
      const result = await heartVoiceService.getHeartVoices({
        page: currentPage,
        pageSize: pageSize,
        category: selectedCategory || undefined,
        sortBy: sortBy as any,
        sortOrder: 'desc'
      });

      if (result.success && result.data) {
        setVoices(result.data.voices);
        setTotal(result.data.total);
      } else {
        console.error('Failed to load voices:', result.error);
        // 显示空状态
        setVoices([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Load voices error:', error);
      // 显示空状态
      setVoices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 搜索心声
  const handleSearch = async (value: string) => {
    setSearchText(value);
    if (value.trim()) {
      setLoading(true);
      try {
        const result = await heartVoiceService.searchHeartVoices(value, {
          page: 1,
          pageSize: pageSize,
          category: selectedCategory || undefined,
          sortBy: sortBy as any,
          sortOrder: 'desc'
        });

        if (result.success && result.data) {
          setVoices(result.data.voices);
          setTotal(result.data.total);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error('Search voices error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      loadVoices();
    }
  };

  // 点击卡片打开滑动浏览器
  const handleCardClick = (cardData: UnifiedCardData) => {
    const index = voices.findIndex(v => v.id === cardData.id);
    if (index !== -1) {
      setCurrentSwipeIndex(index);
      setSwipeViewerVisible(true);

      // 初始化滑动浏览器的数据
      setSwipeVoices([...voices]);
      setSwipeCurrentPage(currentPage);
    }
  };

  // 在滑动浏览器中加载更多心声
  const handleLoadMoreInSwipe = async () => {
    if (swipeLoading || swipeVoices.length >= total) return;

    setSwipeLoading(true);
    try {
      const nextPage = swipeCurrentPage + 1;
      const result = await heartVoiceService.getHeartVoices({
        page: nextPage,
        pageSize: pageSize,
        category: selectedCategory || undefined,
        sortBy: sortBy as any,
        sortOrder: 'desc'
      });

      if (result.success && result.data) {
        setSwipeVoices(prev => [...prev, ...result.data.voices]);
        setSwipeCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Load more voices in swipe error:', error);
    } finally {
      setSwipeLoading(false);
    }
  };

  // 点赞心声
  const handleLike = async (voiceOrId: HeartVoice | number) => {
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

    const voiceId = typeof voiceOrId === 'number' ? voiceOrId : voiceOrId.id;

    try {
      const result = await heartVoiceService.likeHeartVoice(voiceId);
      if (result.success) {
        // 更新本地状态
        setVoices(prev => prev.map(voice =>
          voice.id === voiceId
            ? { ...voice, likeCount: voice.likeCount + 1 }
            : voice
        ));

        // 更新用户点赞状态
        setUserLikes(prev => new Set([...prev, voiceId]));
      }
    } catch (error) {
      console.error('Like voice error:', error);
    }
  };

  // 踩心声
  const handleDislike = async (voiceOrId: HeartVoice | number) => {
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

    const voiceId = typeof voiceOrId === 'number' ? voiceOrId : voiceOrId.id;

    try {
      const result = await heartVoiceService.dislikeHeartVoice(voiceId);
      if (result.success) {
        // 更新本地状态
        setVoices(prev => prev.map(voice =>
          voice.id === voiceId
            ? { ...voice, dislikeCount: (voice.dislikeCount || 0) + 1 }
            : voice
        ));

        // 更新用户踩状态
        setUserDislikes(prev => new Set([...prev, voiceId]));
      }
    } catch (error) {
      console.error('Dislike voice error:', error);
    }
  };

  // 下载心声
  const handleDownload = (voice: HeartVoice) => {
    // 这里可以调用现有的下载功能
    console.log('Download voice:', voice.id);
  };

  // 获取情感图标
  const getEmotionIcon = (score: number) => {
    if (score >= 4) return <SmileOutlined style={{ color: '#52c41a' }} />;
    if (score >= 3) return <MehOutlined style={{ color: '#faad14' }} />;
    return <FrownOutlined style={{ color: '#ff4d4f' }} />;
  };

  // 获取分类标签颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      experience: 'blue',
      advice: 'green',
      encouragement: 'orange',
      reflection: 'purple',
      gratitude: 'pink',
      challenge: 'red'
    };
    return colors[category] || 'default';
  };

  // 转换心声数据为统一卡片数据格式
  const convertVoiceToCardData = (voice: HeartVoice): UnifiedCardData => ({
    id: voice.id,
    type: 'heart_voice',
    content: cleanContent(voice.content || ''),
    category: voice.category,
    tags: voice.tags,
    likeCount: voice.likeCount,
    dislikeCount: voice.dislikeCount,
    createdAt: voice.createdAt,
    authorName: voice.authorName,
    isAnonymous: voice.isAnonymous,
    isFeatured: voice.isFeatured,
    emotionScore: voice.emotionScore,
    emotionCategory: voice.emotionCategory
  });

  // 渲染心声卡片
  const renderVoiceCard = (voice: HeartVoice) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={voice.id}>
      <UnifiedCard
        data={convertVoiceToCardData(voice)}
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
            <HeartOutlined style={{ color: '#ff4d4f' }} />
            问卷心声
          </Title>
          <Paragraph type="secondary">
            分享你的求职心得，倾听他人的经验故事
          </Paragraph>
        </div>
        
        {canPublish && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateModalVisible(true)}
          >
            发布心声
          </Button>
        )}
      </div>

      {/* 筛选和搜索 */}
      <Card className="filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索心声内容..."
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
                  {cat.label}
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
                       tag?.tag_name_en?.toLowerCase().includes(input.toLowerCase());
              }}
              notFoundContent={availableTags.length === 0 ? "加载中..." : "无匹配标签"}
            >
              {/* 热门标签 */}
              {availableTags
                .filter(tag => tag.usage_count > 5)
                .sort((a, b) => b.usage_count - a.usage_count)
                .slice(0, 3)
                .map(tag => (
                  <Option key={`hot-${tag.id}`} value={tag.id}>
                    <Tag color={tag.color} style={{ margin: 0 }}>
                      💝 {tag.tag_name} ({tag.usage_count})
                    </Tag>
                  </Option>
                ))}

              {/* 所有标签 */}
              {availableTags
                .sort((a, b) => a.tag_name.localeCompare(b.tag_name))
                .map(tag => (
                  <Option key={tag.id} value={tag.id}>
                    <Tag color={tag.color} style={{ margin: 0 }}>
                      {tag.tag_name}
                      {tag.usage_count > 0 && ` (${tag.usage_count})`}
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
                共 {total} 条心声
                {searchText && ` • 搜索"${searchText}"`}
                {selectedCategory && ` • ${categories.find(c => c.value === selectedCategory)?.label}`}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 心声列表 */}
      <div className="content-area">
        <Spin spinning={loading}>
          {voices.length > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                {voices.map(renderVoiceCard)}
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
                  ? "没有找到匹配的心声" 
                  : "暂无心声分享"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {canPublish && !searchText && !selectedCategory && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  发布第一条心声
                </Button>
              )}
            </Empty>
          )}
        </Spin>
      </div>

      {/* 发布心声模态框 */}
      <HeartVoiceForm
        mode="modal"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadVoices(); // 重新加载列表
        }}
      />

      {/* 滑动浏览器 */}
      <SwipeViewer
        visible={swipeViewerVisible}
        onClose={() => setSwipeViewerVisible(false)}
        items={swipeVoices}
        currentIndex={currentSwipeIndex}
        onIndexChange={setCurrentSwipeIndex}
        onLike={handleLike}
        onDislike={handleDislike}
        onDownload={canPublish ? handleDownload : undefined}
        contentType="voice"
        userLikes={userLikes}
        userDislikes={userDislikes}
        hasMore={swipeVoices.length < total}
        onLoadMore={handleLoadMoreInSwipe}
      />
    </div>
  );
};

export default Voices;
