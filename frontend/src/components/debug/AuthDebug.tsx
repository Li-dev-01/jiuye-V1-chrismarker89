import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';

const { Text, Title } = Typography;

export const AuthDebug: React.FC = () => {
  const { 
    currentUser, 
    currentSession, 
    isAuthenticated, 
    isLoading, 
    error 
  } = useUniversalAuthStore();

  return (
    <Card 
      title="🔍 认证状态调试" 
      size="small" 
      style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        width: 300, 
        zIndex: 9999,
        opacity: 0.9
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div>
          <Text strong>认证状态: </Text>
          <Tag color={isAuthenticated ? 'green' : 'red'}>
            {isAuthenticated ? '已认证' : '未认证'}
          </Tag>
        </div>
        
        <div>
          <Text strong>加载状态: </Text>
          <Tag color={isLoading ? 'blue' : 'default'}>
            {isLoading ? '加载中' : '空闲'}
          </Tag>
        </div>

        {error && (
          <div>
            <Text strong>错误: </Text>
            <Text type="danger" style={{ fontSize: '12px' }}>
              {error}
            </Text>
          </div>
        )}

        {currentUser && (
          <div>
            <Text strong>用户: </Text>
            <Text style={{ fontSize: '12px' }}>
              {currentUser.display_name} ({currentUser.userType})
            </Text>
          </div>
        )}

        {currentSession && (
          <div>
            <Text strong>会话: </Text>
            <Text style={{ fontSize: '12px' }}>
              {currentSession.sessionId.substring(0, 8)}...
            </Text>
          </div>
        )}

        <div>
          <Text strong>管理员入口显示: </Text>
          <Tag color={!isAuthenticated ? 'green' : 'red'}>
            {!isAuthenticated ? '应该显示' : '应该隐藏'}
          </Tag>
        </div>
      </Space>
    </Card>
  );
};
