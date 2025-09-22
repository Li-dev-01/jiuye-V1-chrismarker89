/**
 * 收藏页面 - 轻量级实现
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Tag, Button, Input, Select, Empty,
  message, Popconfirm, Divider
} from 'antd';
import {
  HeartFilled, SearchOutlined, DeleteOutlined, ExportOutlined,
  BookOutlined, CalendarOutlined, UserOutlined, EyeOutlined
} from '@ant-design/icons';
import { favoriteService, type FavoriteStory } from '../services/favoriteService';
import { SwipeViewer } from '../components/common/SwipeViewer';
import './FavoritesPage.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteStory[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteStory[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 快速浏览模式状态
  const [swipeViewerVisible, setSwipeViewerVisible] = useState(false);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);
  const [swipeStories, setSwipeStories] = useState<any[]>([]);

  // 分类选项
  const categories = [
    { value: '', label: '全部分类' },
    { value: 'job-hunting', label: '求职经历' },
    { value: 'career-change', label: '转行故事' },
    { value: 'entrepreneurship', label: '创业故事' },
    { value: 'internship', label: '实习体验' },
    { value: 'workplace', label: '职场故事' },
    { value: 'growth', label: '成长历程' }
  ];

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    filterFavorites();
  }, [favorites, searchKeyword, selectedCategory]);

  const loadFavorites = () => {
    setLoading(true);
    try {
      const favoriteList = favoriteService.getFavorites();
      setFavorites(favoriteList);
    } catch (error) {
      message.error('加载收藏列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filterFavorites = () => {
    let filtered = favorites;

    // 按分类筛选
    if (selectedCategory) {
      filtered = filtered.filter(fav => fav.category === selectedCategory);
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.title.toLowerCase().includes(keyword) ||
        fav.summary.toLowerCase().includes(keyword) ||
        fav.authorName.toLowerCase().includes(keyword)
      );
    }

    setFilteredFavorites(filtered);
  };

  const handleRemoveFavorite = (storyId: string) => {
    const success = favoriteService.removeFromFavorites(storyId);
    if (success) {
      message.success('已取消收藏');
      loadFavorites();
    } else {
      message.error('取消收藏失败');
    }
  };

  const handleClearAll = () => {
    const success = favoriteService.clearAllFavorites();
    if (success) {
      message.success('已清空所有收藏');
      loadFavorites();
    } else {
      message.error('清空收藏失败');
    }
  };

  // 转换收藏故事为SwipeViewer格式
  const convertFavoriteToSwipeFormat = (favorite: FavoriteStory) => ({
    id: parseInt(favorite.id),
    title: favorite.title,
    content: favorite.summary,
    category: favorite.category,
    authorName: favorite.authorName,
    publishedAt: favorite.publishedAt,
    likeCount: 0, // 收藏页面不显示点赞数
    viewCount: 0,
    favoriteCount: 0
  });

  // 查看收藏详情 - 快速浏览模式
  const handleViewFavorite = (favorite: FavoriteStory) => {
    const index = filteredFavorites.findIndex(f => f.id === favorite.id);
    if (index !== -1) {
      setCurrentSwipeIndex(index);
      setSwipeViewerVisible(true);

      // 转换收藏数据为SwipeViewer格式
      const swipeData = filteredFavorites.map(convertFavoriteToSwipeFormat);
      setSwipeStories(swipeData);
    }
  };

  const handleExport = () => {
    try {
      const data = favoriteService.exportFavorites();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `故事收藏_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('收藏数据已导出');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = categories.find(cat => cat.value === category);
    return found ? found.label : category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="favorites-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <Title level={2}>
            <HeartFilled style={{ color: '#ff4d4f' }} />
            我的收藏
          </Title>
          <Paragraph type="secondary">
            收藏的精彩故事，随时回顾和分享
          </Paragraph>
        </div>
        
        <div className="header-stats">
          <Space size="large">
            <div className="stat-item">
              <Text strong>{favorites.length}</Text>
              <Text type="secondary">个收藏</Text>
            </div>
            <div className="stat-item">
              <Text strong>{new Set(favorites.map(f => f.category)).size}</Text>
              <Text type="secondary">个分类</Text>
            </div>
          </Space>
        </div>
      </div>

      {/* 筛选和操作区域 */}
      <Card className="filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索收藏的故事..."
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择分类"
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={10}>
            <Space>
              <Button 
                icon={<ExportOutlined />} 
                onClick={handleExport}
                disabled={favorites.length === 0}
              >
                导出收藏
              </Button>
              <Popconfirm
                title="确定要清空所有收藏吗？"
                description="此操作不可恢复"
                onConfirm={handleClearAll}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  disabled={favorites.length === 0}
                >
                  清空收藏
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 收藏列表 */}
      <Card>
        {filteredFavorites.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredFavorites.map(favorite => (
              <Col xs={24} sm={12} lg={8} xl={6} key={favorite.id}>
                <Card
                  className="favorite-card"
                  hoverable
                  onClick={() => handleViewFavorite(favorite)}
                  actions={[
                    <Button
                      key="view"
                      type="text"
                      icon={<EyeOutlined />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFavorite(favorite);
                      }}
                    >
                      查看详情
                    </Button>,
                    <Popconfirm
                      key="remove"
                      title="确定取消收藏吗？"
                      onConfirm={() => handleRemoveFavorite(favorite.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<HeartFilled />}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        取消收藏
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <div className="favorite-content">
                    <div className="favorite-header">
                      <Tag color="blue" size="small">
                        {getCategoryLabel(favorite.category)}
                      </Tag>
                    </div>
                    
                    <Title level={5} className="favorite-title">
                      {favorite.title}
                    </Title>
                    
                    <Paragraph 
                      className="favorite-summary"
                      ellipsis={{ rows: 3 }}
                    >
                      {favorite.summary}
                    </Paragraph>
                    
                    <Divider style={{ margin: '12px 0' }} />
                    
                    <div className="favorite-meta">
                      <Space direction="vertical" size={4}>
                        <Text type="secondary" className="meta-item">
                          <UserOutlined /> {favorite.authorName}
                        </Text>
                        <Text type="secondary" className="meta-item">
                          <BookOutlined /> {formatDate(favorite.publishedAt)}
                        </Text>
                        <Text type="secondary" className="meta-item">
                          <CalendarOutlined /> 收藏于 {formatDate(favorite.favoriteAt)}
                        </Text>
                      </Space>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description={
              searchKeyword || selectedCategory 
                ? "没有找到匹配的收藏" 
                : "还没有收藏任何故事"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchKeyword && !selectedCategory && (
              <Button type="primary" href="/stories">
                去故事墙看看
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* 快速浏览模式 */}
      <SwipeViewer
        visible={swipeViewerVisible}
        onClose={() => setSwipeViewerVisible(false)}
        items={swipeStories}
        currentIndex={currentSwipeIndex}
        onIndexChange={setCurrentSwipeIndex}
        onLike={() => {}} // 收藏页面不支持点赞
        onDislike={() => {}} // 收藏页面不支持踩
        onDownload={() => {}} // 收藏页面不支持下载
        onFavorite={() => {}} // 收藏页面不支持再次收藏
        onReport={() => {}} // 收藏页面不支持举报
        contentType="story"
        userLikes={new Set()}
        userDislikes={new Set()}
        userFavorites={new Set()}
      />
    </div>
  );
};

export default FavoritesPage;
