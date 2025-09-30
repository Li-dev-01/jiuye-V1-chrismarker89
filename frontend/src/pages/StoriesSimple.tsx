/**
 * 简化版故事页面 - 用于调试
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, message } from 'antd';
import { storyService } from '../services/storyService';
import { getUserDisplayName } from '../utils/userDisplayUtils';
import type { Story } from '../services/storyService';

const { Title } = Typography;

const StoriesSimple: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('StoriesSimple component mounted');
    loadStories();
  }, []);

  const loadStories = async () => {
    console.log('Loading stories...');
    setLoading(true);
    try {
      const result = await storyService.getStories({
        page: 1,
        pageSize: 10,
        published: true
      });

      console.log('API result:', result);

      if (result.success && result.data) {
        setStories(result.data.stories);
        console.log('Stories loaded successfully:', result.data.stories.length);
      } else {
        console.error('Failed to load stories:', result.error);
        message.error('加载故事失败');
      }
    } catch (error) {
      console.error('Load stories error:', error);
      message.error('加载故事时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>故事墙 - 简化版</Title>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div>
          <p>共找到 {stories.length} 个故事</p>
          {stories.map((story) => (
            <Card key={story.id} style={{ marginBottom: '16px' }}>
              <Title level={4}>{story.title}</Title>
              <p>分类: {story.category}</p>
              <p>作者: {getUserDisplayName({ displayName: story.authorName })}</p>
              <p>内容: {story.content?.substring(0, 100)}...</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoriesSimple;
