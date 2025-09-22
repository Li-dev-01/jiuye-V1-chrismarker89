/**
 * 测试2: 分类和标签数据测试
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Button, Space, Tag, Divider } from 'antd';
import { storyService } from '../../services/storyService';

const { Title, Text } = Typography;

const StoriesTest2: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 硬编码的分类配置（来自Stories.tsx）
  const frontendCategories = [
    'interview-experience',
    'internship-experience', 
    'career-planning',
    'workplace-adaptation',
    'campus-life',
    'employment-feedback'
  ];

  // 硬编码的标签配置（来自Stories.tsx）
  const frontendTags = [
    { id: 8, tag_key: 'employed', tag_name: '已就业', color: '#52c41a' },
    { id: 9, tag_key: 'job_seeking', tag_name: '求职中', color: '#1890ff' },
    { id: 10, tag_key: 'internship', tag_name: '实习中', color: '#fa8c16' },
    { id: 11, tag_key: 'graduate_school', tag_name: '考研', color: '#722ed1' },
    { id: 12, tag_key: 'entrepreneurship', tag_name: '创业', color: '#eb2f96' },
    { id: 13, tag_key: 'civil_service', tag_name: '考公', color: '#13c2c2' },
    { id: 14, tag_key: 'further_study', tag_name: '深造', color: '#52c41a' },
    { id: 15, tag_key: 'gap_year', tag_name: '间隔年', color: '#faad14' }
  ];

  const testCategoriesAndTags = async () => {
    console.log('=== 测试2: 分类和标签数据 ===');
    setLoading(true);
    setError(null);
    
    try {
      // 获取故事数据并分析分类
      const result = await storyService.getStories({
        page: 1,
        pageSize: 50,
        published: true
      });
      
      if (result.success && result.data) {
        const stories = result.data.stories;
        
        // 提取所有分类
        const actualCategories = [...new Set(stories.map(story => story.category))];
        setCategories(actualCategories);
        
        console.log('✅ 实际分类:', actualCategories);
        console.log('✅ 前端配置分类:', frontendCategories);
        
        // 检查分类匹配情况
        const missingCategories = actualCategories.filter(cat => !frontendCategories.includes(cat));
        const extraCategories = frontendCategories.filter(cat => !actualCategories.includes(cat));
        
        console.log('❌ 前端缺失的分类:', missingCategories);
        console.log('❌ 前端多余的分类:', extraCategories);
        
        // 提取所有标签
        const allTags = new Set();
        stories.forEach(story => {
          if (story.tags) {
            if (Array.isArray(story.tags)) {
              story.tags.forEach(tag => {
                if (typeof tag === 'string') {
                  allTags.add(tag);
                } else if (tag && tag.name) {
                  allTags.add(tag.name);
                }
              });
            }
          }
        });
        
        const actualTags = Array.from(allTags);
        console.log('✅ 实际标签:', actualTags);
        console.log('✅ 前端配置标签:', frontendTags.map(t => t.tag_name));
        
        setTags(actualTags);
        
      } else {
        console.log('❌ 获取数据失败:', result.error);
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('❌ 测试异常:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testCategoriesAndTags();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>测试2: 分类和标签数据</Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button onClick={testCategoriesAndTags} loading={loading}>
          重新测试分类和标签
        </Button>
        
        {loading && <Spin />}
        
        {error && (
          <Card title="❌ 错误信息" style={{ borderColor: '#ff4d4f' }}>
            <Text type="danger">{error}</Text>
          </Card>
        )}
        
        <Card title="📊 分类对比">
          <Title level={4}>实际分类 ({categories.length}个)</Title>
          <Space wrap>
            {categories.map(cat => (
              <Tag key={cat} color="blue">{cat}</Tag>
            ))}
          </Space>
          
          <Divider />
          
          <Title level={4}>前端配置分类 ({frontendCategories.length}个)</Title>
          <Space wrap>
            {frontendCategories.map(cat => (
              <Tag key={cat} color={categories.includes(cat) ? 'green' : 'red'}>
                {cat}
              </Tag>
            ))}
          </Space>
        </Card>
        
        <Card title="🏷️ 标签对比">
          <Title level={4}>实际标签 ({tags.length}个)</Title>
          <Space wrap>
            {tags.map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </Space>
          
          <Divider />
          
          <Title level={4}>前端配置标签 ({frontendTags.length}个)</Title>
          <Space wrap>
            {frontendTags.map(tag => (
              <Tag key={tag.id} color={tag.color}>
                {tag.tag_name}
              </Tag>
            ))}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default StoriesTest2;
