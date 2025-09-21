/**
 * 悬浮组件测试页面
 * 用于测试新的安全悬浮组件架构
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Switch, 
  Alert, 
  Typography, 
  Divider, 
  Row, 
  Col,
  Statistic,
  Tag,
  List,
  Modal,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { floatingComponentManager } from '../../services/floatingComponentManager';
import { SafeFloatingUserPanel } from '../../components/common/SafeFloatingUserPanel';
import { useSafeAuth } from '../../hooks/useSafeAuth';

const { Title, Text, Paragraph } = Typography;

export const FloatingComponentTestPage: React.FC = () => {
  const [healthReport, setHealthReport] = useState(floatingComponentManager.getHealthReport());
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    timestamp: Date;
  }>>([]);

  // 使用安全认证钩子进行测试
  const authState = useSafeAuth();

  /**
   * 更新健康报告
   */
  const updateHealthReport = () => {
    setHealthReport(floatingComponentManager.getHealthReport());
  };

  /**
   * 添加测试结果
   */
  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string) => {
    setTestResults(prev => [{
      test,
      status,
      message,
      timestamp: new Date()
    }, ...prev.slice(0, 9)]); // 保留最近10条记录
  };

  /**
   * 测试组件启用/禁用
   */
  const testComponentToggle = (componentId: string) => {
    const isEnabled = floatingComponentManager.isComponentEnabled(componentId);
    
    if (isEnabled) {
      const success = floatingComponentManager.disableComponent(componentId);
      addTestResult(
        `禁用组件 ${componentId}`,
        success ? 'success' : 'error',
        success ? '组件已成功禁用' : '禁用组件失败'
      );
    } else {
      const success = floatingComponentManager.enableComponent(componentId);
      addTestResult(
        `启用组件 ${componentId}`,
        success ? 'success' : 'error',
        success ? '组件已成功启用' : '启用组件失败'
      );
    }
    
    updateHealthReport();
  };

  /**
   * 测试错误处理
   */
  const testErrorHandling = (componentId: string) => {
    const testError = new Error(`测试错误 - ${new Date().toLocaleTimeString()}`);
    floatingComponentManager.reportError(componentId, testError);
    
    addTestResult(
      `错误处理测试 ${componentId}`,
      'warning',
      '已触发测试错误，检查组件错误处理机制'
    );
    
    updateHealthReport();
  };

  /**
   * 重置组件状态
   */
  const resetComponent = (componentId: string) => {
    const success = floatingComponentManager.resetComponent(componentId);
    addTestResult(
      `重置组件 ${componentId}`,
      success ? 'success' : 'error',
      success ? '组件状态已重置' : '重置组件失败'
    );
    
    updateHealthReport();
  };

  /**
   * 测试认证状态
   */
  const testAuthState = () => {
    const { isAuthenticated, isStoreAvailable, error, currentUser } = authState;
    
    addTestResult(
      '认证状态测试',
      isStoreAvailable ? 'success' : 'error',
      `认证状态: ${isAuthenticated ? '已登录' : '未登录'}, Store可用: ${isStoreAvailable}, 错误: ${error || '无'}`
    );
  };

  /**
   * 模拟登录测试
   */
  const testLogin = async () => {
    try {
      const success = await authState.login({
        type: 'semi-anonymous',
        displayName: `测试用户_${Date.now()}`
      });
      
      addTestResult(
        '登录测试',
        success ? 'success' : 'error',
        success ? '登录测试成功' : '登录测试失败'
      );
    } catch (error) {
      addTestResult(
        '登录测试',
        'error',
        `登录测试异常: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  /**
   * 模拟登出测试
   */
  const testLogout = async () => {
    try {
      const success = await authState.logout();
      addTestResult(
        '登出测试',
        success ? 'success' : 'warning',
        success ? '登出测试成功' : '登出测试完成（可能有警告）'
      );
    } catch (error) {
      addTestResult(
        '登出测试',
        'error',
        `登出测试异常: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  // 监听组件状态变化
  useEffect(() => {
    const listener = {
      onStateChange: (componentId: string, enabled: boolean) => {
        addTestResult(
          '组件状态变化',
          'success',
          `组件 ${componentId} ${enabled ? '已启用' : '已禁用'}`
        );
      },
      onError: (componentId: string, error: Error) => {
        addTestResult(
          '组件错误',
          'error',
          `组件 ${componentId} 发生错误: ${error.message}`
        );
      },
      onRetry: (componentId: string, retryCount: number) => {
        addTestResult(
          '组件重试',
          'warning',
          `组件 ${componentId} 正在重试 (第${retryCount}次)`
        );
      }
    };

    floatingComponentManager.addListener(listener);

    return () => {
      floatingComponentManager.removeListener(listener);
    };
  }, []);

  // 定期更新健康报告
  useEffect(() => {
    const interval = setInterval(updateHealthReport, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <BugOutlined /> 悬浮组件测试中心
      </Title>
      
      <Paragraph>
        这个页面用于测试新的安全悬浮组件架构，包括错误处理、状态管理和组件隔离机制。
      </Paragraph>

      {/* 全局控制 */}
      <Card title="全局控制" style={{ marginBottom: '16px' }}>
        <Space>
          <Switch
            checked={healthReport.globalEnabled}
            onChange={(checked) => {
              floatingComponentManager.setGlobalEnabled(checked);
              updateHealthReport();
              addTestResult(
                '全局控制',
                'success',
                `悬浮组件已${checked ? '启用' : '禁用'}`
              );
            }}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              floatingComponentManager.resetAllComponents();
              updateHealthReport();
              addTestResult('全局重置', 'success', '所有组件状态已重置');
            }}
          >
            重置所有组件
          </Button>
        </Space>
      </Card>

      {/* 健康状态概览 */}
      <Card title="系统健康状态" style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总组件数"
              value={healthReport.totalComponents}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="启用组件"
              value={healthReport.enabledComponents}
              valueStyle={{ color: '#3f8600' }}
              prefix={<PlayCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="错误组件"
              value={healthReport.errorComponents}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="全局状态"
              value={healthReport.globalEnabled ? '启用' : '禁用'}
              valueStyle={{ color: healthReport.globalEnabled ? '#3f8600' : '#cf1322' }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* 组件控制面板 */}
        <Col span={12}>
          <Card title="组件控制面板">
            <List
              dataSource={healthReport.components}
              renderItem={(component) => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      type={component.enabled ? 'default' : 'primary'}
                      onClick={() => testComponentToggle(component.id)}
                    >
                      {component.enabled ? '禁用' : '启用'}
                    </Button>,
                    <Button
                      size="small"
                      danger
                      onClick={() => testErrorHandling(component.id)}
                    >
                      测试错误
                    </Button>,
                    <Button
                      size="small"
                      onClick={() => resetComponent(component.id)}
                    >
                      重置
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {component.name}
                        <Tag color={component.enabled ? 'green' : 'red'}>
                          {component.enabled ? '启用' : '禁用'}
                        </Tag>
                        {component.hasError && (
                          <Tag color="orange">错误</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        重试次数: {component.retryCount}/{component.maxRetries}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 测试结果 */}
        <Col span={12}>
          <Card 
            title="测试结果" 
            extra={
              <Button 
                size="small" 
                onClick={() => setTestResults([])}
              >
                清空
              </Button>
            }
          >
            <List
              size="small"
              dataSource={testResults}
              renderItem={(result) => (
                <List.Item>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space>
                      <Tag color={
                        result.status === 'success' ? 'green' : 
                        result.status === 'error' ? 'red' : 'orange'
                      }>
                        {result.test}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {result.timestamp.toLocaleTimeString()}
                      </Text>
                    </Space>
                    <Text style={{ fontSize: '12px' }}>
                      {result.message}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 认证测试 */}
      <Card title="认证系统测试" style={{ marginTop: '16px' }}>
        <Space wrap>
          <Button onClick={testAuthState}>
            检查认证状态
          </Button>
          <Button onClick={testLogin} type="primary">
            测试登录
          </Button>
          <Button onClick={testLogout}>
            测试登出
          </Button>
          <Button 
            onClick={() => setShowUserPanel(!showUserPanel)}
            type={showUserPanel ? 'default' : 'primary'}
          >
            {showUserPanel ? '隐藏' : '显示'}用户面板
          </Button>
        </Space>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>当前认证状态:</Text>
          <Text>已登录: {authState.isAuthenticated ? '是' : '否'}</Text>
          <Text>Store可用: {authState.isStoreAvailable ? '是' : '否'}</Text>
          <Text>加载中: {authState.isLoading ? '是' : '否'}</Text>
          <Text>用户: {authState.currentUser?.displayName || '无'}</Text>
          {authState.error && (
            <Alert
              message="认证错误"
              description={authState.error}
              type="error"
              showIcon
              style={{ marginTop: '8px' }}
            />
          )}
        </Space>
      </Card>

      {/* 悬浮用户面板测试 */}
      {showUserPanel && (
        <SafeFloatingUserPanel
          initialPosition="top-left"
          onClose={() => setShowUserPanel(false)}
        />
      )}
    </div>
  );
};

export default FloatingComponentTestPage;
