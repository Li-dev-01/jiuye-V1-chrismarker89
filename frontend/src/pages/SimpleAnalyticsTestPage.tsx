/**
 * 简化的数据分析测试页面
 * 用于调试数据源问题
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Alert, Spin } from 'antd';
import { useMockData, getCurrentDataSource } from '../config/dataSourceConfig';
import { hybridVisualizationService } from '../services/hybridVisualizationService';
import { questionnaire2VisualizationService } from '../services/questionnaire2VisualizationService';

const { Title, Text, Paragraph } = Typography;

export const SimpleAnalyticsTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isMockData = useMockData();
  const currentDataSource = getCurrentDataSource();

  const testQ2Service = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      console.log('🧪 测试问卷2可视化服务...');
      console.log('📊 数据源配置:', { isMockData, currentDataSource });
      
      const result = await questionnaire2VisualizationService.getVisualizationSummary();
      console.log('✅ 问卷2数据获取成功:', result);
      
      setData({
        type: 'questionnaire2',
        result
      });
    } catch (err) {
      console.error('❌ 问卷2数据获取失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const testHybridService = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      console.log('🧪 测试混合可视化服务...');
      console.log('📊 数据源配置:', { isMockData, currentDataSource });
      
      const result = await hybridVisualizationService.getHybridVisualizationData();
      console.log('✅ 混合数据获取成功:', result);
      
      setData({
        type: 'hybrid',
        result
      });
    } catch (err) {
      console.error('❌ 混合数据获取失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('📊 页面初始化 - 数据源状态:', {
      isMockData,
      currentDataSource,
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE
    });
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>简化数据分析测试</Title>
      
      <Card title="数据源状态" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div><Text strong>使用模拟数据:</Text> <Text>{isMockData ? '是' : '否'}</Text></div>
          <div><Text strong>当前数据源:</Text> <Text>{currentDataSource}</Text></div>
          <div><Text strong>开发模式:</Text> <Text>{import.meta.env.DEV ? '是' : '否'}</Text></div>
          <div><Text strong>构建模式:</Text> <Text>{import.meta.env.MODE}</Text></div>
        </Space>
      </Card>

      <Card title="测试操作" style={{ marginBottom: '24px' }}>
        <Space size="middle">
          <Button 
            type="primary" 
            onClick={testQ2Service}
            loading={loading}
          >
            测试问卷2服务
          </Button>
          <Button 
            onClick={testHybridService}
            loading={loading}
          >
            测试混合服务
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert
          message="测试失败"
          description={error}
          type="error"
          style={{ marginBottom: '24px' }}
        />
      )}

      {loading && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <Text style={{ marginLeft: '16px' }}>正在测试数据服务...</Text>
          </div>
        </Card>
      )}

      {data && (
        <Card title={`${data.type === 'questionnaire2' ? '问卷2' : '混合'}数据结果`}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {data.type === 'questionnaire2' && (
              <>
                <div><Text strong>问卷ID:</Text> {data.result.questionnaireId}</div>
                <div><Text strong>标题:</Text> {data.result.title}</div>
                <div><Text strong>总响应数:</Text> {data.result.totalResponses}</div>
                <div><Text strong>完成率:</Text> {data.result.completionRate}%</div>
                <div><Text strong>维度数量:</Text> {data.result.dimensions?.length || 0}</div>
              </>
            )}
            
            {data.type === 'hybrid' && (
              <>
                <div><Text strong>成功:</Text> {data.result.success ? '是' : '否'}</div>
                {data.result.data && (
                  <>
                    <div><Text strong>问卷ID:</Text> {data.result.data.questionnaireId}</div>
                    <div><Text strong>标题:</Text> {data.result.data.title}</div>
                    <div><Text strong>总响应数:</Text> {data.result.data.totalResponses}</div>
                    <div><Text strong>Tab数量:</Text> {data.result.data.tabs?.length || 0}</div>
                  </>
                )}
                {data.result.error && (
                  <div><Text strong>错误:</Text> {data.result.error.message}</div>
                )}
              </>
            )}
            
            <div style={{ marginTop: '16px' }}>
              <Text strong>原始数据:</Text>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {JSON.stringify(data.result, null, 2)}
              </pre>
            </div>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default SimpleAnalyticsTestPage;
