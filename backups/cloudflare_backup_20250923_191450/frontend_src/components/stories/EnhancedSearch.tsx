/**
 * 增强搜索组件 - 轻量级搜索功能
 * 支持关键词搜索、标签搜索、快速筛选
 */

import React, { useState, useEffect, useRef } from 'react';
import { Input, Select, Tag, Space, Button, Dropdown, Menu, AutoComplete, Typography } from 'antd';
import { SearchOutlined, TagOutlined, ClearOutlined, HistoryOutlined, FireOutlined } from '@ant-design/icons';
import './EnhancedSearch.css';

const { Option } = Select;
const { Text } = Typography;

// 就业相关关键词预设
const jobRelatedKeywords = [
  '实习经验', '面试技巧', '简历制作', '职业规划',
  '第一份工作', '转行经历', '求职心得', '职场适应',
  '专业对口', '薪资待遇', '工作环境', '发展前景',
  '校园招聘', '社会招聘', '内推机会', '网申技巧',
  '群面经验', '技术面试', 'HR面试', '终面经验',
  'offer选择', '入职准备', '试用期', '转正经验',
  '跳槽经历', '升职加薪', '职场关系', '工作压力'
];

// 热门搜索词
const hotSearchKeywords = [
  '求职心得', '面试经验', '实习感悟', '职业规划',
  '校园生活', '技能提升', '创业故事', '转行经历'
];

// 快速筛选选项
const quickFilters = [
  { label: '最新发布', value: 'latest', icon: '🆕' },
  { label: '发布时间', value: 'by_time', icon: '📅' },
  { label: '点赞数量', value: 'by_likes', icon: '👍' },
  { label: '精选故事', value: 'featured', icon: '⭐' }
];

export interface SearchOptions {
  keyword?: string;
  tags?: string[];
  quickFilter?: string;
}

interface EnhancedSearchProps {
  onSearch: (options: SearchOptions) => void;
  placeholder?: string;
  className?: string;
  showQuickFilters?: boolean;
  showTagSuggestions?: boolean;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  onSearch,
  placeholder = "搜索故事标题、内容...",
  className = '',
  showQuickFilters = true,
  showTagSuggestions = true
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<Array<{value: string, label: React.ReactNode}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<any>(null);

  useEffect(() => {
    // 加载搜索历史
    const history = localStorage.getItem('story_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    // 更新自动完成选项
    if (searchKeyword.trim()) {
      const suggestions = [];
      
      // 添加匹配的关键词
      const matchingKeywords = jobRelatedKeywords.filter(keyword =>
        keyword.toLowerCase().includes(searchKeyword.toLowerCase())
      ).slice(0, 5);
      
      matchingKeywords.forEach(keyword => {
        suggestions.push({
          value: keyword,
          label: (
            <div className="suggestion-item">
              <TagOutlined />
              <span>{keyword}</span>
            </div>
          )
        });
      });
      
      // 添加搜索历史
      const matchingHistory = searchHistory.filter(item =>
        item.toLowerCase().includes(searchKeyword.toLowerCase())
      ).slice(0, 3);
      
      matchingHistory.forEach(item => {
        suggestions.push({
          value: item,
          label: (
            <div className="suggestion-item history">
              <HistoryOutlined />
              <span>{item}</span>
            </div>
          )
        });
      });
      
      setAutoCompleteOptions(suggestions);
    } else {
      // 显示热门搜索
      const hotSuggestions = hotSearchKeywords.map(keyword => ({
        value: keyword,
        label: (
          <div className="suggestion-item hot">
            <FireOutlined />
            <span>{keyword}</span>
          </div>
        )
      }));
      setAutoCompleteOptions(hotSuggestions);
    }
  }, [searchKeyword, searchHistory]);

  const handleSearch = () => {
    const options: SearchOptions = {
      keyword: searchKeyword.trim(),
      tags: selectedTags,
      quickFilter: quickFilter || undefined
    };
    
    // 保存搜索历史
    if (searchKeyword.trim()) {
      const newHistory = [searchKeyword.trim(), ...searchHistory.filter(item => item !== searchKeyword.trim())].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('story_search_history', JSON.stringify(newHistory));
    }
    
    onSearch(options);
  };

  const handleKeywordChange = (value: string) => {
    setSearchKeyword(value);
  };

  const handleTagAdd = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      handleSearchOptionsChange({ tags: newTags });
    }
  };

  const handleTagRemove = (tag: string) => {
    const newTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(newTags);
    handleSearchOptionsChange({ tags: newTags });
  };

  const handleQuickFilterChange = (filter: string) => {
    const newFilter = quickFilter === filter ? '' : filter;
    setQuickFilter(newFilter);
    handleSearchOptionsChange({ quickFilter: newFilter || undefined });
  };

  const handleSearchOptionsChange = (partialOptions: Partial<SearchOptions>) => {
    const options: SearchOptions = {
      keyword: searchKeyword.trim(),
      tags: selectedTags,
      quickFilter: quickFilter || undefined,
      ...partialOptions
    };
    onSearch(options);
  };

  const handleClear = () => {
    setSearchKeyword('');
    setSelectedTags([]);
    setQuickFilter('');
    onSearch({});
  };

  const tagSuggestionsMenu = (
    <Menu>
      {jobRelatedKeywords.slice(0, 12).map(keyword => (
        <Menu.Item key={keyword} onClick={() => handleTagAdd(keyword)}>
          <Space>
            <TagOutlined />
            {keyword}
          </Space>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className={`enhanced-search ${className}`}>
      {/* 主搜索区域 */}
      <div className="search-main">
        <AutoComplete
          ref={searchInputRef}
          value={searchKeyword}
          options={autoCompleteOptions}
          onSelect={handleKeywordChange}
          onChange={handleKeywordChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          style={{ flex: 1 }}
          dropdownClassName="search-suggestions"
        >
          <Input
            size="large"
            placeholder={placeholder}
            prefix={<SearchOutlined />}
            onPressEnter={handleSearch}
            suffix={
              <Space>
                {showTagSuggestions && (
                  <Dropdown overlay={tagSuggestionsMenu} trigger={['click']}>
                    <Button type="text" icon={<TagOutlined />} size="small">
                      标签
                    </Button>
                  </Dropdown>
                )}
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
              </Space>
            }
          />
        </AutoComplete>
      </div>

      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          <Text type="secondary">已选标签：</Text>
          <Space wrap>
            {selectedTags.map(tag => (
              <Tag
                key={tag}
                closable
                onClose={() => handleTagRemove(tag)}
                color="blue"
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* 快速筛选 */}
      {showQuickFilters && (
        <div className="quick-filters">
          <Text type="secondary">快速筛选：</Text>
          <Space wrap>
            {quickFilters.map(filter => (
              <Tag
                key={filter.value}
                className={`quick-filter-tag ${quickFilter === filter.value ? 'active' : ''}`}
                onClick={() => handleQuickFilterChange(filter.value)}
              >
                <span className="filter-icon">{filter.icon}</span>
                {filter.label}
              </Tag>
            ))}
            {(searchKeyword || selectedTags.length > 0 || quickFilter) && (
              <Button
                type="text"
                size="small"
                icon={<ClearOutlined />}
                onClick={handleClear}
              >
                清空
              </Button>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;
