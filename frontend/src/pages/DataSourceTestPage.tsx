/**
 * 数据源测试页面
 * 用于调试数据源配置和模拟数据
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Alert, Spin } from 'antd';
import { useMockData, getDataSourceStatus } from '../config/dataSourceConfig';
import { questionnaire2VisualizationService } from '../services/questionnaire2VisualizationService';
import { hybridVisualizationService } from '../services/hybridVisualizationService';

const { Title, Text, Paragraph } = Typography;

export const DataSourceTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [q2Data, setQ2Data] = useState<any>(null);
  const [hybridData, setHybridData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const dataSourceStatus = getDataSourceStatus();
  const isMockData = useMockData();

  const testQ2Service = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🧪 测试问卷2可视化服务...');
      const data = await questionnaire2VisualizationService.getVisualizationSummary();
      console.log('✅ 问卷2数据获取成功:', data);
      setQ2Data(data);
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
    try {
      console.log('🧪 测试混合可视化服务...');
      const response = await hybridVisualizationService.getHybridVisualizationData();
      console.log('✅ 混合数据获取成功:', response);
      setHybridData(response);
    } catch (err) {
      console.error('❌ 混合数据获取失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('📊 数据源状态:', dataSourceStatus);
    console.log('🔧 使用模拟数据:', isMockData);
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>数据源测试页面</Title>
      
      <Card title="数据源配置" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>当前数据源: </Text>
            <Text style={{ color: dataSourceStatus.color }}>
              {dataSourceStatus.displayName}
            </Text>
          </div>
          <div>
            <Text strong>使用模拟数据: </Text>
            <Text>{isMockData ? '是' : '否'}</Text>
          </div>
          <div>
            <Text strong>生产环境: </Text>
            <Text>{dataSourceStatus.isProduction ? '是' : '否'}</Text>
          </div>
          <Paragraph>{dataSourceStatus.description}</Paragraph>
        </Space>
      </Card>

      <Card title="服务测试" style={{ marginBottom: '24px' }}>
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
            测试混合可视化服务
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
          <Spin size="large" />
          <Text style={{ marginLeft: '16px' }}>正在测试数据服务...</Text>
        </Card>
      )}

      {q2Data && (
        <Card title="问卷2数据" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div><Text strong>问卷ID:</Text> {q2Data.questionnaireId}</div>
            <div><Text strong>标题:</Text> {q2Data.title}</div>
            <div><Text strong>总响应数:</Text> {q2Data.totalResponses}</div>
            <div><Text strong>完成率:</Text> {q2Data.completionRate}%</div>
            <div><Text strong>维度数量:</Text> {q2Data.dimensions?.length || 0}</div>
            <div><Text strong>最后更新:</Text> {q2Data.lastUpdated}</div>
          </Space>
        </Card>
      )}

      {hybridData && (
        <Card title="混合可视化数据">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div><Text strong>成功:</Text> {hybridData.success ? '是' : '否'}</div>
            {hybridData.data && (
              <>
                <div><Text strong>问卷ID:</Text> {hybridData.data.questionnaireId}</div>
                <div><Text strong>标题:</Text> {hybridData.data.title}</div>
                <div><Text strong>总响应数:</Text> {hybridData.data.totalResponses}</div>
                <div><Text strong>Tab数量:</Text> {hybridData.data.tabs?.length || 0}</div>
              </>
            )}
            {hybridData.error && (
              <div><Text strong>错误:</Text> {hybridData.error.message}</div>
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default DataSourceTestPage;
