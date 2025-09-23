/**
 * 智能分类选择器组件
 * 提供直观的分类选择界面，包含描述和图标
 */

import React from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag
} from 'antd';
import {
  HeartOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ShareAltOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  UserOutlined,
  TrophyOutlined,
  TeamOutlined,
  RocketOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface CategoryOption {
  value: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
  examples?: string[];
}

interface SmartCategorySelectorProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  title?: string;
  showExamples?: boolean;
}

// 预定义图标映射
const ICON_MAP: { [key: string]: React.ReactNode } = {
  'gratitude': <HeartOutlined />,
  'suggestion': <BulbOutlined />,
  'reflection': <ThunderboltOutlined />,
  'experience': <ShareAltOutlined />,
  'other': <QuestionCircleOutlined />,
  'job_search': <BookOutlined />,
  'interview': <UserOutlined />,
  'career_change': <RocketOutlined />,
  'internship': <TeamOutlined />,
  'workplace': <TrophyOutlined />,
  'growth': <ThunderboltOutlined />,
  'advice': <ShareAltOutlined />
};

// 预定义颜色映射
const COLOR_MAP: { [key: string]: string } = {
  'gratitude': '#52c41a',
  'suggestion': '#1890ff',
  'reflection': '#722ed1',
  'experience': '#fa8c16',
  'other': '#8c8c8c',
  'job_search': '#13c2c2',
  'interview': '#eb2f96',
  'career_change': '#f5222d',
  'internship': '#faad14',
  'workplace': '#52c41a',
  'growth': '#722ed1',
  'advice': '#fa8c16'
};

export const SmartCategorySelector: React.FC<SmartCategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  title = '选择分类',
  showExamples = true
}) => {
  return (
    <Card title={title} size="small">
      <Row gutter={[12, 12]}>
        {categories.map(category => {
          const isSelected = selectedCategory === category.value;
          const icon = category.icon || ICON_MAP[category.value];
          const color = category.color || COLOR_MAP[category.value] || '#1890ff';
          
          return (
            <Col xs={24} sm={12} md={8} key={category.value}>
              <Card
                size="small"
                hoverable
                onClick={() => onCategoryChange(category.value)}
                style={{
                  border: isSelected ? `2px solid ${color}` : '1px solid #d9d9d9',
                  backgroundColor: isSelected ? `${color}10` : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {/* 分类标题和图标 */}
                  <Space>
                    <span style={{ color: color, fontSize: '16px' }}>
                      {icon}
                    </span>
                    <Text strong style={{ color: isSelected ? color : '#000' }}>
                      {category.label}
                    </Text>
                    {isSelected && (
                      <Tag color={color} size="small">已选择</Tag>
                    )}
                  </Space>
                  
                  {/* 分类描述 */}
                  <Paragraph 
                    style={{ 
                      margin: 0, 
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}
                  >
                    {category.description}
                  </Paragraph>
                  
                  {/* 示例标签 */}
                  {showExamples && category.examples && category.examples.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        示例：
                      </Text>
                      <div style={{ marginTop: '4px' }}>
                        <Space wrap size={[4, 4]}>
                          {category.examples.slice(0, 3).map(example => (
                            <Tag 
                              key={example} 
                              size="small" 
                              style={{ 
                                fontSize: '10px',
                                padding: '0 4px',
                                lineHeight: '16px',
                                border: `1px solid ${color}30`,
                                color: color,
                                backgroundColor: `${color}10`
                              }}
                            >
                              {example}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
      
      {selectedCategory && (
        <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 已选择分类，系统将为您推荐相关标签
          </Text>
        </div>
      )}
    </Card>
  );
};

export default SmartCategorySelector;
