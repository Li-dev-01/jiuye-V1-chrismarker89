/**
 * 测试4: 筛选逻辑测试
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Button, Space, Select, Alert, Tag } from 'antd';
import { storyService } from '../../services/storyService';
import type { Story } from '../../services/storyService';

const { Title, Text } = Typography;
const { Option } = Select;

const StoriesTest4: React.FC = () => {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 前端配置的分类
  const storyTabs = [
    { key: 'interview-experience', label: '面试经历', category: 'interview-experience' },
    { key: 'internship-experience', label: '实习体验', category: 'internship-experience' },
    { key: 'career-planning', label: '职业规划', category: 'career-planning' },
    { key: 'workplace-adaptation', label: '职场适应', category: 'workplace-adaptation' },
    { key: 'campus-life', label: '校园生活', category: 'campus-life' },
    { key: 'employment-feedback', label: '就业反馈', category: 'employment-feedback' }
  ];

  const testFilterLogic = async () => {
    console.log('=== 测试4: 筛选逻辑测试 ===');
    setLoading(true);
    setError(null);
    
    try {
      const result = await storyService.getStories({
        page: 1,
        pageSize: 100,
        published: true
      });
      
      if (result.success && result.data) {
        console.log('✅ 数据获取成功');
        setAllStories(result.data.stories);
        setFilteredStories(result.data.stories);
        
        // 分析分类分布
        const categoryCount: Record<string, number> = {};
        result.data.stories.forEach(story => {
          const category = story.category || 'unknown';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        console.log('✅ 分类分布:', categoryCount);
        
        // 测试每个配置的分类是否有数据
        storyTabs.forEach(tab => {
          const count = categoryCount[tab.category] || 0;
          console.log(`${tab.label} (${tab.category}): ${count} 个故事`);
        });
        
      } else {
        console.log('❌ 数据获取失败:', result.error);
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('❌ 测试异常:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // 应用筛选
  const applyFilter = (category: string) => {
    console.log('应用筛选:', category);
    setSelectedCategory(category);
    
    if (!category) {
      setFilteredStories(allStories);
      return;
    }
    
    try {
      const filtered = allStories.filter(story => {
        const storyCategory = story.category;
        console.log(`故事分类: "${storyCategory}", 筛选分类: "${category}", 匹配: ${storyCategory === category}`);
        return storyCategory === category;
      });
      
      console.log(`筛选结果: ${filtered.length} 个故事`);
      setFilteredStories(filtered);
    } catch (err) {
      console.error('筛选时出错:', err);
      setError(`筛选时出错: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    testFilterLogic();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>测试4: 筛选逻辑测试</Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button onClick={testFilterLogic} loading={loading}>
          重新测试筛选逻辑
        </Button>
        
        {loading && <Spin />}
        
        {error && (
          <Alert
            message="❌ 错误信息"
            description={error}
            type="error"
          />
        )}
        
        <Card title="🔍 分类筛选测试">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>选择分类: </Text>
              <Select
                style={{ width: 200 }}
                placeholder="选择分类"
                value={selectedCategory}
                onChange={applyFilter}
                allowClear
              >
                {storyTabs.map(tab => (
                  <Option key={tab.key} value={tab.category}>
                    {tab.label}
                  </Option>
                ))}
              </Select>
            </div>
            
            <div>
              <Text strong>筛选结果: </Text>
              <Tag color="blue">{filteredStories.length} 个故事</Tag>
              {selectedCategory && (
                <Tag color="green">分类: {selectedCategory}</Tag>
              )}
            </div>
          </Space>
        </Card>
        
        <Card title={`📊 故事列表 (${filteredStories.length}/${allStories.length})`}>
          {filteredStories.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {filteredStories.slice(0, 10).map((story, index) => (
                <Card key={story.id} size="small" style={{ background: '#f9f9f9' }}>
                  <Space>
                    <Text strong>{story.title}</Text>
                    <Tag color="blue">{story.category}</Tag>
                    <Text type="secondary">by {story.authorName}</Text>
                  </Space>
                </Card>
              ))}
              {filteredStories.length > 10 && (
                <Text type="secondary">... 还有 {filteredStories.length - 10} 个故事</Text>
              )}
            </Space>
          ) : (
            <Text>暂无符合条件的故事</Text>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default StoriesTest4;
