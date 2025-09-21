import React from 'react';
import { Card, Typography, Space, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
// import { useUniversalAuthStore } from '../../stores/universalAuthStore'; // 已删除，使用universalAuthStore

const { Text, Title } = Typography;

export const AuthDebugPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser: universalUser, 
    currentSession: universalSession,
    isAuthenticated: universalIsAuthenticated, 
    isLoading: universalLoading, 
    error: universalError 
  } = useUniversalAuthStore();
  
  const {
    user: authUser,
    isAuthenticated: authIsAuthenticated,
    loading: authLoading,
    error: authError
  } = useUniversalAuthStore();

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>认证状态调试页面</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Universal Auth Store 状态 */}
        <Card title="Universal Auth Store 状态" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong>认证状态: </Text>
              <Tag color={universalIsAuthenticated ? 'green' : 'red'}>
                {universalIsAuthenticated ? '已认证' : '未认证'}
              </Tag>
            </div>
            
            <div>
              <Text strong>加载状态: </Text>
              <Tag color={universalLoading ? 'blue' : 'default'}>
                {universalLoading ? '加载中' : '空闲'}
              </Tag>
            </div>

            {universalError && (
              <div>
                <Text strong>错误: </Text>
                <Text type="danger" style={{ fontSize: '12px' }}>
                  {universalError}
                </Text>
              </div>
            )}

            {universalUser && (
              <div>
                <Text strong>用户信息: </Text>
                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {JSON.stringify(universalUser, null, 2)}
                </pre>
              </div>
            )}

            {universalSession && (
              <div>
                <Text strong>会话信息: </Text>
                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {JSON.stringify(universalSession, null, 2)}
                </pre>
              </div>
            )}
          </Space>
        </Card>

        {/* Auth Store 状态 */}
        <Card title="Auth Store 状态" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong>认证状态: </Text>
              <Tag color={authIsAuthenticated ? 'green' : 'red'}>
                {authIsAuthenticated ? '已认证' : '未认证'}
              </Tag>
            </div>
            
            <div>
              <Text strong>加载状态: </Text>
              <Tag color={authLoading ? 'blue' : 'default'}>
                {authLoading ? '加载中' : '空闲'}
              </Tag>
            </div>

            {authError && (
              <div>
                <Text strong>错误: </Text>
                <Text type="danger" style={{ fontSize: '12px' }}>
                  {authError}
                </Text>
              </div>
            )}

            {authUser && (
              <div>
                <Text strong>用户信息: </Text>
                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {JSON.stringify(authUser, null, 2)}
                </pre>
              </div>
            )}
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Card title="测试操作" size="small">
          <Space wrap>
            <Button onClick={() => navigate('/admin/login')}>
              前往登录页面
            </Button>
            <Button onClick={() => navigate('/admin')}>
              前往管理页面
            </Button>
            <Button onClick={() => navigate('/reviewer/dashboard')}>
              前往审核员页面
            </Button>
            <Button onClick={() => navigate('/')}>
              返回首页
            </Button>
            <Button
              danger
              onClick={() => {
                const { forceLogout } = useUniversalAuthStore.getState();
                forceLogout();
                window.location.reload();
              }}
            >
              强制清除认证状态
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};
