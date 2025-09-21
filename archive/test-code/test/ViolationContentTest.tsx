/**
 * 违规内容功能测试页面
 * 用于测试违规内容管理功能
 */

import React, { useState } from 'react';
import { Card, Button, Space, message, Typography, Divider, Alert } from 'antd';
import { violationContentService } from '../../services/violationContentService';

const { Title, Text, Paragraph } = Typography;

export const ViolationContentTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // 测试获取违规内容列表
  const testGetViolationList = async () => {
    setLoading(true);
    try {
      const result = await violationContentService.getViolationContent({
        page: 1,
        pageSize: 10
      });
      
      if (result.success) {
        message.success('获取违规内容列表成功');
        setTestResults(prev => [...prev, {
          test: '获取违规内容列表',
          success: true,
          data: result.data
        }]);
      } else {
        message.error('获取违规内容列表失败: ' + result.error);
      }
    } catch (error) {
      message.error('测试失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取违规统计
  const testGetViolationStats = async () => {
    setLoading(true);
    try {
      const result = await violationContentService.getViolationStats();
      
      if (result.success) {
        message.success('获取违规统计成功');
        setTestResults(prev => [...prev, {
          test: '获取违规统计',
          success: true,
          data: result.data
        }]);
      } else {
        message.error('获取违规统计失败: ' + result.error);
      }
    } catch (error) {
      message.error('测试失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取违规类型
  const testGetViolationTypes = async () => {
    setLoading(true);
    try {
      const result = await violationContentService.getViolationTypes();
      
      if (result.success) {
        message.success('获取违规类型成功');
        setTestResults(prev => [...prev, {
          test: '获取违规类型',
          success: true,
          data: result.data
        }]);
      } else {
        message.error('获取违规类型失败: ' + result.error);
      }
    } catch (error) {
      message.error('测试失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 测试删除违规记录
  const testDeleteViolation = async () => {
    setLoading(true);
    try {
      const result = await violationContentService.deleteViolationRecord(1);
      
      if (result.success) {
        message.success('删除违规记录成功');
        setTestResults(prev => [...prev, {
          test: '删除违规记录',
          success: true,
          data: result
        }]);
      } else {
        message.error('删除违规记录失败: ' + result.error);
      }
    } catch (error) {
      message.error('测试失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 清空测试结果
  const clearResults = () => {
    setTestResults([]);
    message.info('测试结果已清空');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>违规内容功能测试</Title>
      
      <Alert
        message="测试说明"
        description="此页面用于测试违规内容管理功能的各个API接口，包括获取违规列表、统计数据、删除记录等功能。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="API测试" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            onClick={testGetViolationList}
            loading={loading}
          >
            测试获取违规列表
          </Button>
          
          <Button 
            onClick={testGetViolationStats}
            loading={loading}
          >
            测试获取违规统计
          </Button>
          
          <Button 
            onClick={testGetViolationTypes}
            loading={loading}
          >
            测试获取违规类型
          </Button>
          
          <Button 
            onClick={testDeleteViolation}
            loading={loading}
          >
            测试删除违规记录
          </Button>
          
          <Button 
            danger
            onClick={clearResults}
          >
            清空结果
          </Button>
        </Space>
      </Card>

      {testResults.length > 0 && (
        <Card title="测试结果">
          {testResults.map((result, index) => (
            <div key={index}>
              <Title level={4}>
                {result.test} - {result.success ? '✅ 成功' : '❌ 失败'}
              </Title>
              
              <Paragraph>
                <Text code>
                  {JSON.stringify(result.data, null, 2)}
                </Text>
              </Paragraph>
              
              {index < testResults.length - 1 && <Divider />}
            </div>
          ))}
        </Card>
      )}

      <Card title="功能说明" style={{ marginTop: '24px' }}>
        <Title level={4}>违规内容管理功能包括：</Title>
        <ul>
          <li><strong>违规内容列表</strong>：展示所有被审核拒绝的内容</li>
          <li><strong>违规统计</strong>：提供违规数量、类型分布等统计信息</li>
          <li><strong>内容详情</strong>：查看违规内容的完整信息和拒绝原因</li>
          <li><strong>记录管理</strong>：删除不需要的违规记录</li>
          <li><strong>筛选功能</strong>：按内容类型、严重程度等条件筛选</li>
          <li><strong>导出功能</strong>：导出违规内容报告（待实现）</li>
        </ul>

        <Title level={4}>违规类型包括：</Title>
        <ul>
          <li><strong>不当言论</strong>：包含攻击性、侮辱性语言</li>
          <li><strong>敏感内容</strong>：涉及政治、宗教等敏感话题</li>
          <li><strong>消极内容</strong>：过度消极、可能影响他人情绪</li>
          <li><strong>虚假信息</strong>：明显的虚假或误导性信息</li>
          <li><strong>垃圾信息</strong>：广告、营销等无关内容</li>
          <li><strong>其他</strong>：其他不符合平台规范的内容</li>
        </ul>

        <Title level={4}>严重程度分级：</Title>
        <ul>
          <li><strong>高</strong>：严重违规，可能涉及法律风险</li>
          <li><strong>中</strong>：明显违规，影响平台环境</li>
          <li><strong>低</strong>：轻微违规，需要提醒改进</li>
        </ul>
      </Card>
    </div>
  );
};

export default ViolationContentTest;
