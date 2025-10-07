/**
 * 就业故事展示页面
 * 展示所有用户发布的就业故事
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MobileStoryCard } from '../components/mobile/MobileStoryCard';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Space, Tag, Button,
  Select, Input, Pagination, Empty, Spin, Modal, Avatar, Tabs, message
} from 'antd';
import {
  BookOutlined, SearchOutlined, EyeOutlined, HeartOutlined,
  UserOutlined, PlusOutlined, StarOutlined, FrownOutlined, HeartFilled,
  BarChartOutlined, FolderOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import { UserType } from '../types/uuid-system';
import { storyService } from '../services/storyService';
import type { Story } from '../services/storyService';

import { UnifiedCard } from '../components/common/UnifiedCard';
import type { UnifiedCardData } from '../components/common/UnifiedCard';
import { enhancedFavoriteService } from '../services/enhancedFavoriteService';
import StoryStatsPanel from '../components/stories/StoryStatsPanel';
import AdvancedFilter, { type FilterOptions } from '../components/stories/AdvancedFilter';
import EnhancedSearch, { type SearchOptions } from '../components/stories/EnhancedSearch';
import { getAllCategories, getCategoryInfo } from '../config/storyCategories';
import SwipeViewer from '../components/common/SwipeViewer';
import MobileSwipeViewer from '../components/mobile/MobileSwipeViewer';
import { useMobileDetection } from '../hooks/useMobileDetection';
import { StoriesDebugPanel } from '../components/debug/StoriesDebugPanel';
import '../styles/UnifiedPages.css';
import '../styles/StoriesPage.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// 内容清理函数 - 移除分类标识符
const cleanContent = (content: string): string => {
  if (!content) return '';

  // 移除开头的分类标识符，如 [growth]、[interview]、[career_change] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
};

const Stories: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { isMobile } = useMobileDetection();
  const [stories, setStories] = useState<Story[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]); // 存储所有故事，用于客户端筛选
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

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('latest');

  // Tab相关的数据状态
  const [tabStories, setTabStories] = useState<{[key: string]: Story[]}>({});
  const [tabLoading, setTabLoading] = useState<{[key: string]: boolean}>({});
  const [tabTotal, setTabTotal] = useState<{[key: string]: number}>({});

  // 收藏相关状态
  const [favoriteStories, setFavoriteStories] = useState<Set<string>>(new Set());

  // 筛选相关状态
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  // 搜索相关状态
  const [currentSearch, setCurrentSearch] = useState<SearchOptions>({});

  // 滑动浏览器状态
  const [swipeViewerVisible, setSwipeViewerVisible] = useState<boolean>(false);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState<number>(0);
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set());
  const [userDislikes, setUserDislikes] = useState<Set<number>>(new Set());

  // 检查用户是否可以发布
  const canPublish = isAuthenticated && currentUser?.userType === UserType.SEMI_ANONYMOUS;

  // 故事Tab配置 - 基于主要分类和排序
  const storyTabs = [
    {
      key: 'latest',
      label: '最新故事',
      icon: '🕒',
      description: '最新发布的故事',
      sortBy: 'published_at',
      category: '',
      color: '#1890ff'
    },
    {
      key: 'hot',
      label: '热门故事',
      icon: '🔥',
      description: '最受欢迎的故事',
      sortBy: 'like_count',
      category: '',
      color: '#ff4d4f'
    },
    {
      key: 'interview-experience',
      label: '面试经历',
      icon: '🔍',
      description: '面试过程中的经历和感悟',
      sortBy: 'published_at',
      category: 'interview-experience',
      color: '#52c41a'
    },
    {
      key: 'internship-experience',
      label: '实习体验',
      icon: '📚',
      description: '实习过程中的经历和体验',
      sortBy: 'published_at',
      category: 'internship-experience',
      color: '#fa8c16'
    },
    {
      key: 'career-planning',
      label: '职业规划',
      icon: '🎯',
      description: '职业规划和发展的思考',
      sortBy: 'published_at',
      category: 'career-planning',
      color: '#722ed1'
    },
    {
      key: 'workplace-adaptation',
      label: '职场适应',
      icon: '🏢',
      description: '职场适应和工作生活的分享',
      sortBy: 'published_at',
      category: 'workplace-adaptation',
      color: '#13c2c2'
    },
    {
      key: 'campus-life',
      label: '校园生活',
      icon: '🎓',
      description: '校园生活和学习经历',
      sortBy: 'published_at',
      category: 'campus-life',
      color: '#eb2f96'
    },
    {
      key: 'employment-feedback',
      label: '就业反馈',
      icon: '💼',
      description: '就业情况和工作反馈',
      sortBy: 'published_at',
      category: 'employment-feedback',
      color: '#52c41a'
    },
    {
      key: 'featured',
      label: '精选故事',
      icon: '⭐',
      description: '编辑精选的优质故事',
      sortBy: 'published_at',
      category: '',
      featured: true,
      color: '#faad14'
    }
  ];

  // 分类选项 - 与后端API保持一致
  const categories = [
    { value: '', label: '全部分类' },
    { value: 'interview-experience', label: '面试经历', icon: '🔍' },
    { value: 'internship-experience', label: '实习体验', icon: '📚' },
    { value: 'career-planning', label: '职业规划', icon: '🎯' },
    { value: 'workplace-adaptation', label: '职场适应', icon: '🏢' },
    { value: 'campus-life', label: '校园生活', icon: '🎓' },
    { value: 'employment-feedback', label: '就业反馈', icon: '💼' },
    { value: 'growth', label: '成长历程', icon: '🌱' }
  ];

  useEffect(() => {
    console.log('Stories component initializing...');
    try {
      console.log('Loading available tags...');
      loadAvailableTags();
      console.log('Loading favorite stories...');
      loadFavoriteStories();
      console.log('Initialization completed');
    } catch (error) {
      console.error('初始化错误:', error);
    }
  }, []);

  useEffect(() => {
    // 加载当前Tab的数据
    try {
      loadTabStories(activeTab);
    } catch (error) {
      console.error('加载Tab数据错误:', error);
    }
  }, [activeTab, currentPage, pageSize]);

  // 监听筛选条件变化
  useEffect(() => {
    if (allStories.length > 0) {
      // 如果已有数据，直接应用筛选
      applyFilters();
    }
  }, [selectedCategory, selectedTags, sortBy]);

  // 监听分页变化
  useEffect(() => {
    if (allStories.length > 0) {
      applyFilters();
    }
  }, [currentPage, pageSize]);

  // 加载收藏状态
  const loadFavoriteStories = () => {
    console.log('loadFavoriteStories called');
    try {
      const favorites = favoriteService.getFavorites();
      console.log('Favorites loaded:', favorites);
      const favoriteIds = new Set(favorites.map(fav => fav.id));
      setFavoriteStories(favoriteIds);
      console.log('Favorite IDs set:', favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // 处理筛选变化
  const handleFilterChange = (filters: FilterOptions) => {
    setCurrentFilters(filters);
    // 这里可以根据筛选条件重新加载数据
    console.log('筛选条件变化:', filters);
    // 实际应用中应该调用API重新获取筛选后的数据
  };

  // 处理搜索变化
  const handleSearchChange = (searchOptions: SearchOptions) => {
    setCurrentSearch(searchOptions);
    console.log('搜索条件变化:', searchOptions);

    // 这里应该根据搜索条件重新加载数据
    // 实际应用中会调用API进行搜索
    if (searchOptions.keyword || searchOptions.tags?.length || searchOptions.quickFilter) {
      // 执行搜索逻辑
      message.info(`搜索: ${JSON.stringify(searchOptions)}`);
    }
  };

  // 加载指定Tab的故事数据
  const loadTabStories = async (tabKey: string) => {
    console.log('loadTabStories called with tabKey:', tabKey);

    const tabConfig = storyTabs.find(tab => tab.key === tabKey);
    if (!tabConfig) {
      console.warn('Tab config not found for key:', tabKey);
      return;
    }

    console.log('Loading tab:', tabConfig.label, 'category:', tabConfig.category);
    setTabLoading(prev => ({ ...prev, [tabKey]: true }));

    try {
      let result;

      if (tabConfig.featured) {
        // 精选故事
        result = await storyService.getFeaturedStories({
          pageSize: pageSize
        });
      } else {
        // 普通故事
        result = await storyService.getStories({
          page: currentPage,
          pageSize: pageSize,
          category: tabConfig.category || undefined,
          sortBy: tabConfig.sortBy as any,
          sortOrder: 'desc',
          published: true
        });
      }

      if (result.success && result.data) {
        setTabStories(prev => ({
          ...prev,
          [tabKey]: result.data.stories
        }));
        setTabTotal(prev => ({
          ...prev,
          [tabKey]: result.data.total || result.data.stories.length
        }));
        console.log(`${tabConfig.label} loaded:`, result.data.stories.length, 'stories');
      } else {
        console.error(`Failed to load ${tabConfig.label}:`, result.error);
        setTabStories(prev => ({ ...prev, [tabKey]: [] }));
        setTabTotal(prev => ({ ...prev, [tabKey]: 0 }));
      }
    } catch (error) {
      console.error(`Load ${tabConfig.label} error:`, error);
      setTabStories(prev => ({ ...prev, [tabKey]: [] }));
      setTabTotal(prev => ({ ...prev, [tabKey]: 0 }));
    } finally {
      setTabLoading(prev => ({ ...prev, [tabKey]: false }));
    }
  };

  // 加载所有故事（用于客户端筛选）
  const loadAllStories = async () => {
    setLoading(true);
    try {
      // 加载大量故事用于客户端筛选
      const result = await storyService.getStories({
        page: 1,
        pageSize: 200, // 加载更多故事
        sortBy: sortBy as any,
        sortOrder: 'desc',
        published: true
      });

      if (result.success && result.data) {
        setAllStories(result.data.stories);
        setTotal(result.data.total);
        console.log('All stories loaded successfully:', result.data.stories.length, 'stories');

        // 应用当前筛选条件
        applyFilters(result.data.stories);
      } else {
        console.error('Failed to load stories:', result.error);
        setAllStories([]);
        setStories([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Load stories error:', error);
      setAllStories([]);
      setStories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 应用筛选条件（客户端筛选）
  const applyFilters = (storiesToFilter: Story[] = allStories) => {
    console.log('applyFilters called with:', {
      storiesToFilterLength: storiesToFilter?.length || 0,
      allStoriesLength: allStories?.length || 0,
      selectedCategory,
      selectedTagsLength: selectedTags?.length || 0
    });

    // 安全检查
    if (!storiesToFilter || !Array.isArray(storiesToFilter)) {
      console.warn('storiesToFilter is not a valid array:', storiesToFilter);
      setStories([]);
      setTotal(0);
      return;
    }

    try {
      let filtered = [...storiesToFilter];

      // 分类筛选
      if (selectedCategory) {
        console.log('Applying category filter:', selectedCategory);
        filtered = filtered.filter(story => {
          const match = story?.category === selectedCategory;
          if (!match) {
            console.log(`Story category "${story?.category}" does not match "${selectedCategory}"`);
          }
          return match;
        });
        console.log('After category filter:', filtered.length);
      }

      // 标签筛选
      if (selectedTags && selectedTags.length > 0 && availableTags && availableTags.length > 0) {
        console.log('Applying tag filter:', selectedTags);
        const selectedTagNames = availableTags
          .filter(tag => tag && selectedTags.includes(tag.id.toString()))
          .map(tag => tag.tag_name);

        console.log('Selected tag names:', selectedTagNames);

        filtered = filtered.filter(story => {
          const storyTags = story.tags || [];
          // 检查故事的标签是否包含任何选中的标签
          return selectedTagNames.some(tagName =>
            storyTags.some((tag: any) =>
              typeof tag === 'string' ? tag === tagName : tag?.name === tagName
            )
          );
        });
        console.log('After tag filter:', filtered.length);
      }

      // 分页处理
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedStories = filtered.slice(startIndex, endIndex);

      setStories(paginatedStories);
      setTotal(filtered.length);

      console.log('Filters applied successfully:', {
        category: selectedCategory,
        tags: selectedTags,
        total: filtered.length,
        displayed: paginatedStories.length
      });
    } catch (error) {
      console.error('Error in applyFilters:', error);
      setStories([]);
      setTotal(0);
    }
  };

  // 加载故事列表（保持向后兼容）
  const loadStories = () => {
    if (allStories.length === 0) {
      loadAllStories();
    } else {
      applyFilters();
    }
  };

  // 加载可用标签 - 使用硬编码标签列表（临时解决方案）
  const loadAvailableTags = async () => {
    console.log('loadAvailableTags called');
    try {
      // 基于数据库中实际存在的标签创建硬编码列表
      const hardcodedTags = [
        // 就业状态标签
        { id: 8, tag_key: 'employed', tag_name: '已就业', color: '#52c41a', usage_count: 0 },
        { id: 9, tag_key: 'job_seeking', tag_name: '求职中', color: '#1890ff', usage_count: 24 },
        { id: 10, tag_key: 'further_study', tag_name: '继续深造', color: '#722ed1', usage_count: 26 },
        { id: 11, tag_key: 'startup', tag_name: '创业中', color: '#fa8c16', usage_count: 30 },
        { id: 12, tag_key: 'undecided', tag_name: '待定中', color: '#faad14', usage_count: 0 },

        // 专业领域标签
        { id: 13, tag_key: 'computer_science', tag_name: '计算机类', color: '#13c2c2', usage_count: 23 },
        { id: 14, tag_key: 'economics_management', tag_name: '经济管理', color: '#eb2f96', usage_count: 0 },
        { id: 15, tag_key: 'engineering', tag_name: '工程技术', color: '#f5222d', usage_count: 24 },
        { id: 16, tag_key: 'liberal_arts', tag_name: '文科类', color: '#a0d911', usage_count: 0 },
        { id: 17, tag_key: 'science', tag_name: '理科类', color: '#2f54eb', usage_count: 0 },

        // 地区标签
        { id: 20, tag_key: 'tier1_city', tag_name: '一线城市', color: '#ff4d4f', usage_count: 25 },
        { id: 21, tag_key: 'tier2_city', tag_name: '二线城市', color: '#1890ff', usage_count: 27 },
        { id: 22, tag_key: 'tier3_city', tag_name: '三四线城市', color: '#52c41a', usage_count: 0 },
        { id: 23, tag_key: 'hometown', tag_name: '回乡就业', color: '#faad14', usage_count: 22 },
        { id: 24, tag_key: 'overseas', tag_name: '海外发展', color: '#722ed1', usage_count: 0 },

        // 故事类型标签
        { id: 25, tag_key: 'interview_exp', tag_name: '面试经历', color: '#fa541c', usage_count: 22 },
        { id: 26, tag_key: 'internship_exp', tag_name: '实习体验', color: '#13c2c2', usage_count: 22 },
        { id: 27, tag_key: 'career_planning', tag_name: '职业规划', color: '#722ed1', usage_count: 0 },
        { id: 28, tag_key: 'workplace_adapt', tag_name: '职场适应', color: '#52c41a', usage_count: 0 },
        { id: 29, tag_key: 'skill_improve', tag_name: '技能提升', color: '#1890ff', usage_count: 0 },
        { id: 30, tag_key: 'campus_life', tag_name: '校园生活', color: '#faad14', usage_count: 0 }
      ];

      setAvailableTags(hardcodedTags);
      console.log('Loaded hardcoded tags:', hardcodedTags.length);
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
        console.log('Featured stories loaded:', result.data.stories.length, 'featured stories');
      } else {
        console.error('Failed to load featured stories:', result.error);
        setFeaturedStories([]);
      }
    } catch (error) {
      console.error('Load featured stories error:', error);
      setFeaturedStories([]);
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

      // 获取当前Tab的故事列表
      const currentTabStories = tabStories[activeTab] || [];

      // 找到故事在当前Tab列表中的索引
      const index = currentTabStories.findIndex(s => s.id === story.id);
      if (index !== -1) {
        setCurrentSwipeIndex(index);
        setSwipeViewerVisible(true);

        // 初始化滑动浏览器的数据
        setSwipeStories([...currentTabStories]);
        setSwipeCurrentPage(currentPage);

        // 更新本地浏览量
        setTabStories(prev => ({
          ...prev,
          [activeTab]: prev[activeTab]?.map(s =>
            s.id === story.id
              ? { ...s, viewCount: s.viewCount + 1 }
              : s
          ) || []
        }));
      }
    } catch (error) {
      console.error('View story error:', error);
    }
  };

  // 在滑动浏览器中加载更多故事
  const handleLoadMoreInSwipe = async () => {
    const currentTotal = tabTotal[activeTab] || 0;

    console.log('📊 加载更多故事:', {
      swipeLoading,
      currentLength: swipeStories.length,
      total: currentTotal,
      hasMore: swipeStories.length < currentTotal
    });

    if (swipeLoading || swipeStories.length >= currentTotal) {
      console.log('⏸️ 跳过加载：', swipeLoading ? '正在加载中' : '已加载全部');
      return;
    }

    setSwipeLoading(true);
    try {
      const nextPage = swipeCurrentPage + 1;
      // 将标签ID数组转换为逗号分隔的字符串
      const tagsParam = selectedTags.length > 0 ? selectedTags.join(',') : undefined;

      console.log('🔄 请求第', nextPage, '页数据...');

      const result = await storyService.getStories({
        page: nextPage,
        pageSize: pageSize,
        category: selectedCategory || undefined,
        tags: tagsParam,
        sortBy: sortBy as any,
        sortOrder: 'desc',
        published: true
      });

      if (result.success && result.data) {
        console.log('✅ 加载成功:', result.data.stories.length, '条新故事');
        setSwipeStories(prev => [...prev, ...result.data.stories]);
        setSwipeCurrentPage(nextPage);
      } else {
        console.error('❌ 加载失败:', result.error);
      }
    } catch (error) {
      console.error('❌ Load more stories in swipe error:', error);
    } finally {
      setSwipeLoading(false);
    }
  };

  // Tab切换处理
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setCurrentPage(1); // 重置页码
  };

  // 点击卡片处理函数 - 适配UnifiedCard
  const handleCardClick = (cardData: UnifiedCardData) => {
    const currentTabStories = tabStories[activeTab] || [];
    const story = currentTabStories.find(s => s.id === cardData.id);
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

  // 下载故事PNG - 临时解决方案
  const handleDownload = async (story: Story) => {
    if (!isAuthenticated) {
      Modal.info({
        title: '需要登录',
        content: '请登录后再进行下载操作',
        onOk: () => {
          // 触发全局事件打开半匿名登录
          window.dispatchEvent(new Event('openSemiAnonymousLogin'));
        }
      });
      return;
    }

    try {
      message.loading('正在生成故事卡片...', 0);

      // 临时方案：使用Canvas生成简单的故事卡片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        message.destroy();
        message.error('浏览器不支持Canvas，无法生成图片');
        return;
      }

      // 定义多种纸张样式主题
      const paperThemes = {
        'interview-experience': {
          name: '面试经历',
          bgColor: '#e8f0ff',
          borderColor: '#b3d1ff',
          accentColor: '#4a90e2',
          textColor: '#2c3e50',
          decorationType: 'spiral', // 螺旋装订
          decorationColor: '#7fb3d3'
        },
        'internship-experience': {
          name: '实习体验',
          bgColor: '#fff0f5',
          borderColor: '#ffb3d1',
          accentColor: '#e74c3c',
          textColor: '#2c3e50',
          decorationType: 'cloud', // 云朵装饰
          decorationColor: '#f8b3c4'
        },
        'career-planning': {
          name: '职业规划',
          bgColor: '#f0f8ff',
          borderColor: '#b3e0ff',
          accentColor: '#8e44ad',
          textColor: '#2c3e50',
          decorationType: 'rounded', // 圆角卡片
          decorationColor: '#c8a2c8'
        },
        'workplace-adaptation': {
          name: '职场适应',
          bgColor: '#f0fff0',
          borderColor: '#b3ffb3',
          accentColor: '#27ae60',
          textColor: '#2c3e50',
          decorationType: 'wave', // 波浪边
          decorationColor: '#90ee90'
        },
        'skill-development': {
          name: '技能发展',
          bgColor: '#f8f8ff',
          borderColor: '#d1d1ff',
          accentColor: '#3498db',
          textColor: '#2c3e50',
          decorationType: 'perforated', // 打孔装订
          decorationColor: '#a8a8ff'
        },
        'industry-insights': {
          name: '行业洞察',
          bgColor: '#fffaf0',
          borderColor: '#ffe4b3',
          accentColor: '#f39c12',
          textColor: '#2c3e50',
          decorationType: 'clips', // 回形针
          decorationColor: '#deb887'
        }
      };

      // 获取当前故事的主题
      const theme = paperThemes[story.category] || paperThemes['interview-experience'];

      // 先计算内容高度以确定画布大小
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        message.destroy();
        message.error('浏览器不支持Canvas，无法生成图片');
        return;
      }

      // 设置临时画布用于测量文字
      tempCtx.font = '22px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';

      const content = story.content || story.title;
      const maxWidth = 620; // 750 - 130 (更大边距用于装饰)
      const lineHeight = 34;

      // 计算文字行数
      const paragraphs = content.split('\n');
      let totalLines = 0;

      for (const paragraph of paragraphs) {
        const words = paragraph.split('');
        let line = '';
        let lineCount = 0;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i];
          const metrics = tempCtx.measureText(testLine);

          if (metrics.width > maxWidth && line !== '') {
            lineCount++;
            line = words[i];
          } else {
            line = testLine;
          }
        }

        if (line) {
          lineCount++;
        }

        totalLines += Math.max(lineCount, 1);
      }

      // 动态计算画布高度 - 书信体布局
      const headerHeight = 120; // 标题区域
      const contentHeight = Math.max(totalLines * lineHeight + 100, 250); // 内容区域
      const footerHeight = 120; // 底部信息区域
      const dynamicHeight = headerHeight + contentHeight + footerHeight;

      // 设置画布尺寸
      canvas.width = 750;
      canvas.height = dynamicHeight;

      // 绘制主题背景
      ctx.fillStyle = theme.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制主题边框
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

      // 绘制装饰元素
      const drawDecorations = (decorationType: string) => {
        ctx.fillStyle = theme.decorationColor;
        ctx.strokeStyle = theme.decorationColor;

        switch (decorationType) {
          case 'spiral': // 螺旋装订
            for (let i = 0; i < 8; i++) {
              const y = 60 + i * 40;
              ctx.beginPath();
              ctx.arc(35, y, 8, 0, Math.PI * 2);
              ctx.fill();
              // 螺旋线
              ctx.beginPath();
              ctx.arc(35, y, 12, 0, Math.PI * 1.5);
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            break;

          case 'cloud': // 云朵装饰
            ctx.fillStyle = theme.decorationColor;
            // 顶部云朵
            ctx.beginPath();
            ctx.arc(canvas.width / 2 - 30, 35, 15, 0, Math.PI * 2);
            ctx.arc(canvas.width / 2, 30, 20, 0, Math.PI * 2);
            ctx.arc(canvas.width / 2 + 30, 35, 15, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'rounded': // 圆角卡片
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const radius = 20;
            const x = 40, y = 40, w = canvas.width - 80, h = canvas.height - 80;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.fill();
            break;

          case 'wave': // 波浪边
            ctx.strokeStyle = theme.decorationColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x += 20) {
              const y = canvas.height - 25 + Math.sin(x / 20) * 8;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            break;

          case 'perforated': // 打孔装订
            for (let i = 0; i < 12; i++) {
              const y = 50 + i * (canvas.height - 100) / 11;
              ctx.beginPath();
              ctx.arc(25, y, 6, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.strokeStyle = theme.decorationColor;
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            break;

          case 'clips': // 回形针
            // 右上角回形针
            ctx.strokeStyle = theme.decorationColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(canvas.width - 60, 20);
            ctx.lineTo(canvas.width - 30, 20);
            ctx.lineTo(canvas.width - 30, 60);
            ctx.lineTo(canvas.width - 45, 60);
            ctx.stroke();
            break;
        }
      };

      drawDecorations(theme.decorationType);

      // 书信体布局 - 顶部标题
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';

      // 绘制主标题 - 居中
      ctx.fillText('就业调研故事分享', canvas.width / 2, 70);

      // 绘制分类标签 - 作为副标题
      ctx.font = '20px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(`【${theme.name}】`, canvas.width / 2, 100);

      // 书信体内容区域
      const contentAreaX = 65;
      const contentAreaY = headerHeight;
      const contentAreaWidth = canvas.width - 130;

      // 内容区域背景 - 根据主题调整
      if (theme.decorationType === 'rounded') {
        // 圆角卡片已在装饰中绘制
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(contentAreaX, contentAreaY, contentAreaWidth, contentHeight);

        // 内容区域边框
        ctx.strokeStyle = theme.borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(contentAreaX, contentAreaY, contentAreaWidth, contentHeight);
      }

      // 书信体内容文字 - 直接开始内容，无需开头语
      ctx.font = '22px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'left';

      let y = contentAreaY + 40; // 直接从内容开始

      // 绘制内容文字
      for (const paragraph of paragraphs) {
        const words = paragraph.split('');
        let line = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i];
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, contentAreaX + 20, y);
            line = words[i];
            y += lineHeight;
          } else {
            line = testLine;
          }
        }

        if (line) {
          ctx.fillText(line, contentAreaX + 20, y);
          y += lineHeight * 1.2; // 段落间距
        }
      }

      // 书信体底部信息区域 - 右对齐
      const bottomY = headerHeight + contentHeight + 30;
      const rightMargin = 80;

      // 绘制作者信息 - 右对齐
      ctx.textAlign = 'right';
      ctx.font = '20px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
      ctx.fillStyle = theme.textColor;
      ctx.fillText(`${story.authorName || '匿名用户'}`, canvas.width - rightMargin, bottomY + 20);

      // 绘制完整的发布日期+时间 - 右对齐
      const publishDate = story.publishedAt || story.createdAt;
      let dateTimeStr = '';
      if (publishDate) {
        const date = new Date(publishDate);
        const dateStr = date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const timeStr = date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        dateTimeStr = `${dateStr} ${timeStr}`;
      }

      ctx.font = '18px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(dateTimeStr, canvas.width - rightMargin, bottomY + 50);

      // 标签信息 - 右对齐
      if (story.tags && story.tags.length > 0) {
        let tagTexts = [];
        for (let i = 0; i < Math.min(story.tags.length, 2); i++) {
          const tag = story.tags[i];
          const tagText = typeof tag === 'string' ? tag : (tag.name || tag.tag_name || '');
          if (tagText) {
            tagTexts.push(tagText);
          }
        }

        if (tagTexts.length > 0) {
          ctx.font = '16px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
          ctx.fillStyle = theme.accentColor;
          const tagsStr = `#${tagTexts.join(' #')}`;
          ctx.fillText(tagsStr, canvas.width - rightMargin, bottomY + 80);
        }
      }

      // 转换为Blob并下载 - 进一步优化文件大小
      canvas.toBlob((blob) => {
        message.destroy();

        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `story_${story.id}_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          message.success('下载成功！');
        } else {
          message.error('生成图片失败');
        }
      }, 'image/png', 0.4); // 进一步降低质量到0.4，纸质背景+黑字对压缩更友好

    } catch (error) {
      message.destroy();
      console.error('Download story error:', error);
      message.error('下载失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理收藏
  const handleFavorite = async (story: Story) => {
    const isCurrentlyFavorited = favoriteStories.has(story.id);

    if (isCurrentlyFavorited) {
      // 取消收藏
      const success = await enhancedFavoriteService.removeFromFavorites(story.id);
      if (success) {
        setFavoriteStories(prev => {
          const newSet = new Set(prev);
          newSet.delete(story.id);
          return newSet;
        });
        message.success('已取消收藏');
      } else {
        message.error('取消收藏失败');
      }
    } else {
      // 添加收藏
      const favoriteData = {
        id: story.id,
        title: story.title,
        summary: story.summary || story.content.substring(0, 100) + '...',
        category: story.category,
        authorName: story.authorName || '匿名用户',
        publishedAt: story.publishedAt || story.createdAt
      };

      const success = await enhancedFavoriteService.addToFavorites(favoriteData);
      if (success) {
        setFavoriteStories(prev => new Set([...prev, story.id]));
        message.success(isAuthenticated ? '已添加到收藏并同步到云端' : '已添加到本地收藏');
      } else {
        message.error('收藏失败');
      }
    }
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

  // 渲染故事卡片 - 统一使用网格布局
  const renderStoryCard = (story: Story, featured = false) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={story.id}>
      <UnifiedCard
        data={convertStoryToCardData(story)}
        featured={featured}
        onClick={handleCardClick}
        onLike={handleLike}
        onDislike={handleDislike}
        onFavorite={handleFavorite}
        isFavorited={favoriteStories.has(story.id)}
        categories={categories}
      />
    </Col>
  );

  // 调试信息
  console.log('Stories render state:', {
    activeTab,
    tabStories: Object.keys(tabStories).map(key => ({
      tab: key,
      count: tabStories[key]?.length || 0,
      total: tabTotal[key] || 0,
      loading: tabLoading[key] || false
    })),
    currentPage,
    pageSize
  });

  return (
    <div className="unified-page">
      {/* 调试面板 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <StoriesDebugPanel
          stories={tabStories[activeTab] || []}
          featuredStories={tabStories['featured'] || []}
          loading={tabLoading[activeTab] || false}
          featuredLoading={tabLoading['featured'] || false}
          total={tabTotal[activeTab] || 0}
          currentPage={currentPage}
          pageSize={pageSize}
          selectedCategory={activeTab}
          selectedTags={[]}
          sortBy={storyTabs.find(tab => tab.key === activeTab)?.sortBy || 'published_at'}
          onReload={() => {
            loadTabStories(activeTab);
          }}
        />
      )}

      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <Title level={2}>
            <BookOutlined style={{ color: '#1890ff' }} />
            故事墙
          </Title>
          <Paragraph type="secondary">
            分享你的校园、就业、生活经历，启发他人的人生道路
          </Paragraph>
        </div>

        <Space>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setShowStatsPanel(!showStatsPanel)}
            type={showStatsPanel ? "primary" : "default"}
          >
            {showStatsPanel ? '隐藏统计' : '显示统计'}
          </Button>
          <Button
            icon={<FolderOutlined />}
            onClick={() => window.location.href = '/favorites'}
          >
            我的收藏 ({favoriteStories.size})
          </Button>
          {canPublish && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/story-submit')}
            >
              发布故事
            </Button>
          )}
        </Space>
      </div>

      {/* 统计面板 */}
      {showStatsPanel && (
        <StoryStatsPanel
          showDetailed={true}
          className="story-stats-section"
        />
      )}

      {/* 增强搜索 */}
      <EnhancedSearch
        onSearch={handleSearchChange}
        placeholder="搜索故事标题、内容、作者..."
        showQuickFilters={true}
        showTagSuggestions={true}
      />

      {/* 高级筛选 */}
      <AdvancedFilter
        onFilterChange={handleFilterChange}
        initialFilters={currentFilters}
        compact={true}
      />

      {/* 故事内容区域 - 基于分类的Tab */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
          type="card"
          className="stories-tabs"
        >
          {storyTabs.map(tab => (
            <TabPane
              tab={
                <div className="tab-label">
                  <div className="tab-name">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                  <div className="tab-count">
                    {tabTotal[tab.key] || 0}
                  </div>
                </div>
              }
              key={tab.key}
            >
              {/* Tab描述和统计信息 */}
              <div className="tab-description">
                <Space direction="vertical" size={4}>
                  <Text strong className="tab-title">
                    {tab.icon} {tab.label}
                  </Text>
                  <Text type="secondary" className="tab-subtitle">
                    {tab.description}
                  </Text>
                  <Space>
                    <Tag color={tab.color}>
                      共 {tabTotal[tab.key] || 0} 个故事
                    </Tag>
                    {tab.sortBy === 'like_count' && <Tag color="red">按点赞排序</Tag>}
                    {tab.sortBy === 'view_count' && <Tag color="orange">按浏览排序</Tag>}
                    {tab.sortBy === 'published_at' && <Tag color="blue">按时间排序</Tag>}
                  </Space>
                </Space>
              </div>
          
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
              {/* 故事列表 */}
              <div className="content-area">
                <Spin spinning={tabLoading[tab.key] || false}>
                  {(tabStories[tab.key] || []).length > 0 ? (
                    <>
                      <Row gutter={[16, 16]}>
                        {(tabStories[tab.key] || []).map(story => renderStoryCard(story, false))}
                      </Row>

                      {/* 分页器 - 仅对非精选Tab显示 */}
                      {!tab.featured && (tabTotal[tab.key] || 0) > pageSize && (
                        <div className="pagination-wrapper">
                          <Pagination
                            current={currentPage}
                            total={tabTotal[tab.key] || 0}
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
                      )}
                    </>
                  ) : (
                    <Empty
                      description={`暂无${tab.label}`}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      {canPublish && tab.key === 'latest' && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => navigate('/story-submit')}
                        >
                          发布第一个故事
                        </Button>
                      )}
                    </Empty>
                  )}
                </Spin>
              </div>
            </TabPane>
          ))}
        </Tabs>
      </Card>



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
                  {selectedStory.tags.map((tag, index) => {
                    const tagText = typeof tag === 'string' ? tag : (tag?.name || tag?.tag_name || 'Unknown');
                    const tagKey = typeof tag === 'string' ? tag : (tag?.id || tag?.key || index);
                    return (
                      <Tag key={tagKey}>{tagText}</Tag>
                    );
                  })}
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

      {/* 滑动浏览器 - 根据设备类型选择组件 */}
      {isMobile ? (
        <MobileSwipeViewer
          visible={swipeViewerVisible}
          onClose={() => setSwipeViewerVisible(false)}
          items={swipeStories}
          currentIndex={currentSwipeIndex}
          onIndexChange={setCurrentSwipeIndex}
          onLike={handleLike}
          onDislike={handleDislike}
          onFavorite={handleFavorite}
          onDownload={handleDownload}
          hasMore={swipeStories.length < (tabTotal[activeTab] || 0)}
          onLoadMore={handleLoadMoreInSwipe}
          userLikes={userLikes}
          userDislikes={userDislikes}
          userFavorites={favoriteStories}
        />
      ) : (
        <SwipeViewer
          visible={swipeViewerVisible}
          onClose={() => setSwipeViewerVisible(false)}
          items={swipeStories}
          currentIndex={currentSwipeIndex}
          onIndexChange={setCurrentSwipeIndex}
          onLike={handleLike}
          onDislike={handleDislike}
          onDownload={handleDownload}
          onFavorite={handleFavorite}
          onReport={(story) => {
            // 举报功能 - 可以在这里添加举报逻辑
            console.log('Report story:', story);
            message.info('举报功能开发中...');
          }}
          contentType="story"
          userLikes={userLikes}
          userDislikes={userDislikes}
          userFavorites={favoriteStories}
          hasMore={swipeStories.length < (tabTotal[activeTab] || 0)}
          onLoadMore={handleLoadMoreInSwipe}
        />
      )}
    </div>
  );
};

export default Stories;
