/**
 * 测试1: 基础API调用测试
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Button, Space } from 'antd';
import { storyService } from '../../services/storyService';

const { Title, Text } = Typography;

const StoriesTest1: React.FC = () => {
  const [apiResult, setApiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testBasicAPI = async () => {
    console.log('=== 测试1: 基础API调用 ===');
    setLoading(true);
    setError(null);
    
    try {
      const result = await storyService.getStories({
        page: 1,
        pageSize: 5,
        published: true
      });
      
      console.log('API调用结果:', result);
      setApiResult(result);
      
      if (result.success && result.data) {
        console.log('✅ API调用成功');
        console.log('故事数量:', result.data.stories.length);
        console.log('总数:', result.data.total);
        
        // 检查第一个故事的数据结构
        if (result.data.stories.length > 0) {
          const firstStory = result.data.stories[0];
          console.log('第一个故事数据:', firstStory);
          console.log('分类:', firstStory.category);
          console.log('标签:', firstStory.tags);
        }
      } else {
        console.log('❌ API调用失败:', result.error);
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('❌ API调用异常:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBasicAPI();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>测试1: 基础API调用</Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button onClick={testBasicAPI} loading={loading}>
          重新测试API调用
        </Button>
        
        {loading && <Spin />}
        
        {error && (
          <Card title="❌ 错误信息" style={{ borderColor: '#ff4d4f' }}>
            <Text type="danger">{error}</Text>
          </Card>
        )}
        
        {apiResult && (
          <Card title="📊 API调用结果">
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default StoriesTest1;
