/**
 * 高级筛选组件 - 基于问卷数据的多维度筛选
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Space, Tag, Collapse, Typography } from 'antd';
import { FilterOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { 
  employmentStatusCategories, 
  majorFieldCategories, 
  regionCategories,
  employmentDestinationCategories,
  storyTypeCategories 
} from '../../config/storyCategories';
import './AdvancedFilter.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Text } = Typography;

export interface FilterOptions {
  employmentStatus?: string[];
  majorField?: string[];
  region?: string[];
  employmentDestination?: string[];
  storyType?: string[];
  dateRange?: [string, string] | null;
  sortBy?: string;
  keywords?: string;
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  className?: string;
  compact?: boolean;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  onFilterChange,
  initialFilters = {},
  className = '',
  compact = false
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // 计算活跃筛选器数量
    const count = Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined || value === '') return false;
      return true;
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {};
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const renderCategorySelect = (
    key: keyof FilterOptions,
    categories: any[],
    placeholder: string,
    maxTagCount = 2
  ) => (
    <Select
      mode="multiple"
      placeholder={placeholder}
      value={filters[key] as string[]}
      onChange={(value) => handleFilterChange(key, value)}
      style={{ width: '100%' }}
      maxTagCount={maxTagCount}
      allowClear
    >
      {categories.map(category => (
        <Option key={category.value} value={category.value}>
          <Space>
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </Space>
        </Option>
      ))}
    </Select>
  );

  const sortOptions = [
    { value: 'published_at', label: '发布时间' },
    { value: 'like_count', label: '点赞数量' },
    { value: 'view_count', label: '浏览量' },
    { value: 'comment_count', label: '评论数' }
  ];

  if (compact) {
    return (
      <Card className={`advanced-filter compact ${className}`}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            {renderCategorySelect('employmentStatus', employmentStatusCategories, '就业状态', 1)}
          </Col>
          <Col xs={24} sm={8} md={6}>
            {renderCategorySelect('storyType', storyTypeCategories, '故事类型', 1)}
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="排序方式"
              value={filters.sortBy}
              onChange={(value) => handleFilterChange('sortBy', value)}
              style={{ width: '100%' }}
              allowClear
            >
              {sortOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Button 
                icon={<ClearOutlined />} 
                onClick={handleClearFilters}
                disabled={activeFiltersCount === 0}
              >
                清空 {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  }

  return (
    <Card className={`advanced-filter ${className}`}>
      <div className="filter-header">
        <Space>
          <FilterOutlined />
          <Text strong>高级筛选</Text>
          {activeFiltersCount > 0 && (
            <Tag color="blue">{activeFiltersCount} 个筛选条件</Tag>
          )}
        </Space>
        <Button 
          icon={<ClearOutlined />} 
          onClick={handleClearFilters}
          disabled={activeFiltersCount === 0}
          size="small"
        >
          清空筛选
        </Button>
      </div>

      <Collapse ghost>
        <Panel header="基础筛选" key="basic">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div className="filter-item">
                <Text type="secondary">就业状态</Text>
                {renderCategorySelect('employmentStatus', employmentStatusCategories, '选择就业状态')}
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="filter-item">
                <Text type="secondary">故事类型</Text>
                {renderCategorySelect('storyType', storyTypeCategories, '选择故事类型')}
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="filter-item">
                <Text type="secondary">排序方式</Text>
                <Select
                  placeholder="选择排序方式"
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {sortOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>
        </Panel>

        <Panel header="详细筛选" key="detailed">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div className="filter-item">
                <Text type="secondary">专业领域</Text>
                {renderCategorySelect('majorField', majorFieldCategories, '选择专业领域')}
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="filter-item">
                <Text type="secondary">地域分布</Text>
                {renderCategorySelect('region', regionCategories, '选择地域')}
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="filter-item">
                <Text type="secondary">就业去向</Text>
                {renderCategorySelect('employmentDestination', employmentDestinationCategories, '选择就业去向')}
              </div>
            </Col>
          </Row>
        </Panel>

        <Panel header="时间筛选" key="time">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="filter-item">
                <Text type="secondary">发布时间范围</Text>
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                  onChange={(dates, dateStrings) => {
                    handleFilterChange('dateRange', dates ? [dateStrings[0], dateStrings[1]] : null);
                  }}
                />
              </div>
            </Col>
          </Row>
        </Panel>
      </Collapse>

      {/* 活跃筛选器显示 */}
      {activeFiltersCount > 0 && (
        <div className="active-filters">
          <Text type="secondary">当前筛选条件：</Text>
          <Space wrap style={{ marginTop: 8 }}>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              
              if (Array.isArray(value)) {
                return value.map(item => {
                  const categories = {
                    employmentStatus: employmentStatusCategories,
                    majorField: majorFieldCategories,
                    region: regionCategories,
                    employmentDestination: employmentDestinationCategories,
                    storyType: storyTypeCategories
                  }[key as keyof typeof filters];
                  
                  const category = categories?.find(cat => cat.value === item);
                  return (
                    <Tag 
                      key={`${key}-${item}`} 
                      closable 
                      onClose={() => {
                        const newValue = (filters[key as keyof FilterOptions] as string[]).filter(v => v !== item);
                        handleFilterChange(key as keyof FilterOptions, newValue);
                      }}
                    >
                      {category?.icon} {category?.label || item}
                    </Tag>
                  );
                });
              }
              
              if (key === 'sortBy') {
                const sortOption = sortOptions.find(opt => opt.value === value);
                return (
                  <Tag 
                    key={key}
                    closable 
                    onClose={() => handleFilterChange('sortBy', undefined)}
                  >
                    排序: {sortOption?.label}
                  </Tag>
                );
              }
              
              return null;
            })}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default AdvancedFilter;
