/**
 * 状态切换测试页面
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, message } from 'antd';
import { 
  globalStateManager, 
  GlobalUserState, 
  type StateDetectionResult 
} from '../../services/globalStateManager';
import { uuidApiService } from '../../services/uuidApi';

const { Title, Text, Paragraph } = Typography;

export const StateTest: React.FC = () => {
  const [currentState, setCurrentState] = useState<StateDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 初始化状态检测
    initializeState();

    // 添加状态监听器
    const handleStateChange = (result: StateDetectionResult) => {
      setCurrentState(result);
    };

    globalStateManager.addStateListener(handleStateChange);

    return () => {
      globalStateManager.removeStateListener(handleStateChange);
    };
  }, []);

  const initializeState = async () => {
    setLoading(true);
    try {
      const result = await globalStateManager.detectCurrentState();
      setCurrentState(result);
    } catch (error) {
      console.error('初始化状态失败:', error);
      message.error('状态检测失败');
    } finally {
      setLoading(false);
    }
  };

  const testAnonymousAuth = async () => {
    setLoading(true);
    try {
      const result = await uuidApiService.authenticateAnonymous();
      if (result.success) {
        message.success('匿名认证成功');
        await globalStateManager.detectCurrentState();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('匿名认证失败:', error);
      message.error('匿名认证失败');
    } finally {
      setLoading(false);
    }
  };

  const testAdminAuth = async () => {
    setLoading(true);
    try {
      const result = await uuidApiService.authenticateAdmin('admin1', 'admin123', 'admin');
      if (result.success) {
        message.success('管理员认证成功');
        await globalStateManager.detectCurrentState();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('管理员认证失败:', error);
      message.error('管理员认证失败');
    } finally {
      setLoading(false);
    }
  };

  const testQuestionnaireSubmit = async () => {
    setLoading(true);
    try {
      const result = await uuidApiService.submitQuestionnaire({
        personalInfo: { name: '测试用户', age: 25 },
        educationInfo: { university: '测试大学', major: '计算机科学' },
        employmentInfo: { currentStatus: 'employed', company: '测试公司' },
        jobSearchInfo: { preferredIndustry: 'IT', expectedSalary: '10000-15000' },
        employmentStatus: { isEmployed: true, employmentType: 'full-time' }
      });
      
      if (result.success) {
        message.success('问卷提交成功');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('问卷提交失败:', error);
      message.error('问卷提交失败');
    } finally {
      setLoading(false);
    }
  };

  const testStateSwitch = async (targetState: GlobalUserState) => {
    setLoading(true);
    try {
      let credentials = {};
      
      if (targetState === GlobalUserState.ADMIN) {
        credentials = { username: 'admin1', password: 'admin123' };
      }

      await globalStateManager.switchState({
        targetState,
        credentials,
        forceSwitch: true
      });
      
      message.success(`切换到${targetState}状态成功`);
    } catch (error) {
      console.error('状态切换失败:', error);
      message.error('状态切换失败');
    } finally {
      setLoading(false);
    }
  };

  const refreshState = async () => {
    setLoading(true);
    try {
      await globalStateManager.forceRefresh();
      message.success('状态刷新成功');
    } catch (error) {
      console.error('状态刷新失败:', error);
      message.error('状态刷新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>状态切换测试</Title>
      
      {/* 当前状态显示 */}
      <Card title="当前状态" style={{ marginBottom: '24px' }}>
        {currentState ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>状态: </Text>
              <Text code>{currentState.currentState}</Text>
              <Text type={currentState.isValid ? 'success' : 'danger'} style={{ marginLeft: 8 }}>
                {currentState.isValid ? '✓ 有效' : '✗ 无效'}
              </Text>
            </div>
            
            {currentState.user && (
              <div>
                <Text strong>用户: </Text>
                <Text>{currentState.user.displayName} ({currentState.user.userType})</Text>
              </div>
            )}
            
            {currentState.session && (
              <div>
                <Text strong>会话: </Text>
                <Text>过期时间 {new Date(currentState.session.expiresAt).toLocaleString()}</Text>
              </div>
            )}
            
            {currentState.conflicts.length > 0 && (
              <Alert
                type="warning"
                message={`检测到 ${currentState.conflicts.length} 个冲突`}
                description={currentState.conflicts.map(c => c.message).join(', ')}
              />
            )}
            
            {currentState.recommendations.length > 0 && (
              <div>
                <Text strong>建议:</Text>
                <ul>
                  {currentState.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </Space>
        ) : (
          <Text>状态检测中...</Text>
        )}
      </Card>

      {/* API测试 */}
      <Card title="API测试" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Button onClick={testAnonymousAuth} loading={loading}>
            测试匿名认证
          </Button>
          <Button onClick={testAdminAuth} loading={loading}>
            测试管理员认证
          </Button>
          <Button onClick={testQuestionnaireSubmit} loading={loading}>
            测试问卷提交
          </Button>
        </Space>
      </Card>

      {/* 状态切换测试 */}
      <Card title="状态切换测试" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Button 
            onClick={() => testStateSwitch(GlobalUserState.ANONYMOUS)} 
            loading={loading}
          >
            切换到匿名状态
          </Button>
          <Button 
            onClick={() => testStateSwitch(GlobalUserState.ADMIN)} 
            loading={loading}
          >
            切换到管理员状态
          </Button>
          <Button onClick={refreshState} loading={loading}>
            强制刷新状态
          </Button>
        </Space>
      </Card>

      {/* 调试信息 */}
      <Card title="调试信息">
        <Paragraph>
          <Text strong>当前时间:</Text> {new Date().toLocaleString()}
        </Paragraph>
        <Paragraph>
          <Text strong>本地存储:</Text>
          <pre style={{ background: '#f5f5f5', padding: '8px', fontSize: '12px' }}>
            {JSON.stringify({
              currentUser: localStorage.getItem('uuid_current_user'),
              currentSession: localStorage.getItem('uuid_current_session'),
              lastState: localStorage.getItem('uuid_last_state')
            }, null, 2)}
          </pre>
        </Paragraph>
      </Card>
    </div>
  );
};
