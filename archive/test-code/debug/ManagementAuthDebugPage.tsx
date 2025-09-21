/**
 * 管理员认证调试页面
 * 用于调试管理员认证问题
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Alert, Descriptions, Tag, Divider, message } from 'antd';
import { ReloadOutlined, BugOutlined, CheckCircleOutlined, CloseCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { managementAuthService } from '../../services/managementAuthService';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const ManagementAuthDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  
  // 从 Store 获取状态
  const {
    currentUser: storeUser,
    isAuthenticated: storeAuth,
    isLoading: storeLoading,
    error: storeError,
    login
  } = useManagementAuthStore();

  const refreshDebugInfo = () => {
    // 从服务层获取状态
    const serviceUser = managementAuthService.getCurrentUser();
    const serviceSession = managementAuthService.getCurrentSession();
    const serviceValid = managementAuthService.isSessionValid();
    const serviceIsAdmin = managementAuthService.isAdmin();
    
    // 从 localStorage 直接获取
    const rawUser = localStorage.getItem('management_current_user');
    const rawSession = localStorage.getItem('management_current_session');
    const rawToken = localStorage.getItem('management_auth_token');
    
    setDebugInfo({
      service: {
        user: serviceUser,
        session: serviceSession,
        isValid: serviceValid,
        isAdmin: serviceIsAdmin
      },
      store: {
        user: storeUser,
        isAuthenticated: storeAuth,
        isLoading: storeLoading,
        error: storeError
      },
      localStorage: {
        hasUser: !!rawUser,
        hasSession: !!rawSession,
        hasToken: !!rawToken,
        rawUser: rawUser ? JSON.parse(rawUser) : null,
        rawSession: rawSession ? JSON.parse(rawSession) : null,
        rawToken
      }
    });
    
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [storeUser, storeAuth, storeLoading, storeError]);

  const handleClearAuth = () => {
    localStorage.removeItem('management_current_user');
    localStorage.removeItem('management_current_session');
    localStorage.removeItem('management_auth_token');
    refreshDebugInfo();
    message.info('认证信息已清除');
  };

  const handleQuickLogin = async () => {
    try {
      const success = await login({
        username: 'admin1',
        password: 'admin123',
        userType: 'ADMIN'
      });
      
      if (success) {
        message.success('快速登录成功！');
        refreshDebugInfo();
      } else {
        message.error('快速登录失败');
      }
    } catch (error) {
      console.error('Quick login error:', error);
      message.error('快速登录过程中发生错误');
    }
  };

  const handleTestUserContent = () => {
    navigate('/admin/user-content');
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getStatusTag = (status: boolean, trueText: string, falseText: string) => {
    return (
      <Tag color={status ? 'green' : 'red'}>
        {getStatusIcon(status)} {status ? trueText : falseText}
      </Tag>
    );
  };

  if (!debugInfo) {
    return <div>加载调试信息...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={3}>
          <BugOutlined /> 管理员认证状态调试器
        </Title>
        
        <Space style={{ marginBottom: 16 }}>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refreshDebugInfo}
          >
            刷新状态
          </Button>
          <Button 
            icon={<LoginOutlined />}
            type="primary"
            onClick={handleQuickLogin}
          >
            快速登录管理员
          </Button>
          <Button 
            onClick={handleTestUserContent}
            disabled={!debugInfo.service.isValid || !debugInfo.service.isAdmin}
          >
            测试用户内容管理
          </Button>
          <Button 
            danger
            onClick={handleClearAuth}
          >
            清除认证信息
          </Button>
        </Space>

        {/* 总体状态 */}
        <Alert
          message="认证状态总览"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                {getStatusTag(debugInfo.service.isValid, '服务层会话有效', '服务层会话无效')}
                {getStatusTag(debugInfo.service.isAdmin, '管理员权限', '无管理员权限')}
                {getStatusTag(debugInfo.store.isAuthenticated, 'Store已认证', 'Store未认证')}
              </div>
              <Text type="secondary">
                刷新次数: {refreshKey}
              </Text>
            </Space>
          }
          type={debugInfo.service.isValid && debugInfo.service.isAdmin ? 'success' : 'error'}
          style={{ marginBottom: 24 }}
        />

        {/* 服务层状态 */}
        <Card title="服务层状态 (managementAuthService)" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="用户存在">
              {getStatusTag(!!debugInfo.service.user, '是', '否')}
            </Descriptions.Item>
            <Descriptions.Item label="会话有效">
              {getStatusTag(debugInfo.service.isValid, '是', '否')}
            </Descriptions.Item>
            <Descriptions.Item label="管理员权限">
              {getStatusTag(debugInfo.service.isAdmin, '是', '否')}
            </Descriptions.Item>
            <Descriptions.Item label="用户类型">
              <Tag color="blue">{debugInfo.service.user?.userType || '无'}</Tag>
            </Descriptions.Item>
          </Descriptions>
          
          {debugInfo.service.user && (
            <>
              <Divider />
              <Text strong>用户信息:</Text>
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', marginTop: '8px' }}>
                {JSON.stringify(debugInfo.service.user, null, 2)}
              </pre>
            </>
          )}
          
          {debugInfo.service.session && (
            <>
              <Divider />
              <Text strong>会话信息:</Text>
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', marginTop: '8px' }}>
                {JSON.stringify(debugInfo.service.session, null, 2)}
              </pre>
            </>
          )}
        </Card>

        {/* Store 状态 */}
        <Card title="Store 状态 (useManagementAuthStore)" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="已认证">
              {getStatusTag(debugInfo.store.isAuthenticated, '是', '否')}
            </Descriptions.Item>
            <Descriptions.Item label="加载中">
              {getStatusTag(debugInfo.store.isLoading, '是', '否')}
            </Descriptions.Item>
            <Descriptions.Item label="错误">
              <Tag color={debugInfo.store.error ? 'red' : 'green'}>
                {debugInfo.store.error || '无错误'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户类型">
              <Tag color="blue">{debugInfo.store.user?.userType || '无'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* localStorage 状态 */}
        <Card title="LocalStorage 状态" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="用户数据">
              {getStatusTag(debugInfo.localStorage.hasUser, '存在', '不存在')}
            </Descriptions.Item>
            <Descriptions.Item label="会话数据">
              {getStatusTag(debugInfo.localStorage.hasSession, '存在', '不存在')}
            </Descriptions.Item>
            <Descriptions.Item label="认证令牌">
              {getStatusTag(debugInfo.localStorage.hasToken, '存在', '不存在')}
            </Descriptions.Item>
          </Descriptions>
          
          {debugInfo.localStorage.rawUser && (
            <>
              <Divider />
              <Text strong>原始用户数据:</Text>
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', marginTop: '8px' }}>
                {JSON.stringify(debugInfo.localStorage.rawUser, null, 2)}
              </pre>
            </>
          )}
        </Card>
      </Card>
    </div>
  );
};

export default ManagementAuthDebugPage;
