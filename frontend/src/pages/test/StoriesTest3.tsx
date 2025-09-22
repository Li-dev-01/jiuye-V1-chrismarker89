/**
 * 测试3: 组件渲染测试
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Button, Space, Alert } from 'antd';
import { storyService } from '../../services/storyService';
import type { Story } from '../../services/storyService';

const { Title, Text } = Typography;

const StoriesTest3: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const testComponentRendering = async () => {
    console.log('=== 测试3: 组件渲染测试 ===');
    setLoading(true);
    setError(null);
    setRenderError(null);
    
    try {
      const result = await storyService.getStories({
        page: 1,
        pageSize: 10,
        published: true
      });
      
      if (result.success && result.data) {
        console.log('✅ 数据获取成功');
        setStories(result.data.stories);
        
        // 测试每个故事的数据完整性
        result.data.stories.forEach((story, index) => {
          console.log(`故事 ${index + 1}:`, {
            id: story.id,
            title: story.title,
            category: story.category,
            tags: story.tags,
            authorName: story.authorName,
            hasContent: !!story.content
          });
          
          // 检查必要字段
          if (!story.id) console.warn(`故事 ${index + 1} 缺少 id`);
          if (!story.title) console.warn(`故事 ${index + 1} 缺少 title`);
          if (!story.category) console.warn(`故事 ${index + 1} 缺少 category`);
          if (!story.authorName) console.warn(`故事 ${index + 1} 缺少 authorName`);
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

  // 安全的故事卡片渲染函数
  const renderStoryCard = (story: Story, index: number) => {
    try {
      return (
        <Card 
          key={story.id || index}
          title={story.title || '无标题'}
          size="small"
          style={{ marginBottom: '8px' }}
        >
          <Space direction="vertical" size="small">
            <Text><strong>ID:</strong> {story.id || 'N/A'}</Text>
            <Text><strong>分类:</strong> {story.category || 'N/A'}</Text>
            <Text><strong>作者:</strong> {story.authorName || 'N/A'}</Text>
            <Text><strong>标签:</strong> {
              story.tags ? 
                (Array.isArray(story.tags) ? 
                  story.tags.map(tag => 
                    typeof tag === 'string' ? tag : (tag?.name || 'Unknown')
                  ).join(', ') : 
                  String(story.tags)
                ) : 
                'N/A'
            }</Text>
            <Text><strong>内容长度:</strong> {story.content?.length || 0}</Text>
          </Space>
        </Card>
      );
    } catch (err) {
      console.error(`渲染故事 ${index + 1} 时出错:`, err);
      setRenderError(`渲染故事 ${index + 1} 时出错: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return (
        <Alert
          key={index}
          message={`故事 ${index + 1} 渲染失败`}
          description={err instanceof Error ? err.message : 'Unknown error'}
          type="error"
          style={{ marginBottom: '8px' }}
        />
      );
    }
  };

  useEffect(() => {
    testComponentRendering();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>测试3: 组件渲染测试</Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button onClick={testComponentRendering} loading={loading}>
          重新测试组件渲染
        </Button>
        
        {loading && <Spin />}
        
        {error && (
          <Alert
            message="❌ 数据获取错误"
            description={error}
            type="error"
          />
        )}
        
        {renderError && (
          <Alert
            message="❌ 渲染错误"
            description={renderError}
            type="error"
          />
        )}
        
        <Card title={`📊 故事列表 (${stories.length}个)`}>
          {stories.length > 0 ? (
            stories.map((story, index) => renderStoryCard(story, index))
          ) : (
            <Text>暂无故事数据</Text>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default StoriesTest3;
