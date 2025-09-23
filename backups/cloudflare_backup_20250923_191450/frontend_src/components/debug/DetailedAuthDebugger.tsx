/**
 * 详细的认证调试组件
 * 用于深入分析管理员登录闪退问题
 */

import React, { useEffect, useState } from 'react';
import { Card, Typography, Space, Tag, Button, Alert, Divider } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { managementAuthService } from '../../services/managementAuthService';

const { Text, Title } = Typography;

export const DetailedAuthDebugger: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [localStorageData, setLocalStorageData] = useState<any>({});
  
  const managementAuth = useManagementAuthStore();

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
  };

  // 检查本地存储
  const checkLocalStorage = () => {
    const data = {
      'management-auth-storage': localStorage.getItem('management-auth-storage'),
      'management_current_user': localStorage.getItem('management_current_user'),
      'management_current_session': localStorage.getItem('management_current_session'),
      'management_auth_token': localStorage.getItem('management_auth_token'),
    };
    setLocalStorageData(data);
    return data;
  };

  // 监听状态变化
  useEffect(() => {
    addLog(`页面加载: ${location.pathname}`);
    checkLocalStorage();
  }, [location.pathname]);

  useEffect(() => {
    addLog(`认证状态变化: isAuthenticated=${managementAuth.isAuthenticated}, hasUser=${!!managementAuth.currentUser}`);
    if (managementAuth.currentUser) {
      addLog(`用户信息: ${managementAuth.currentUser.userType} - ${managementAuth.currentUser.username}`);
    }
  }, [managementAuth.isAuthenticated, managementAuth.currentUser]);

  // 手动检查服务层状态
  const checkServiceState = () => {
    const serviceUser = managementAuthService.getCurrentUser();
    const serviceSession = managementAuthService.getCurrentSession();
    const serviceToken = managementAuthService.getAuthToken();
    const isValid = managementAuthService.isSessionValid();

    addLog(`服务层状态: user=${!!serviceUser}, session=${!!serviceSession}, token=${!!serviceToken}, valid=${isValid}`);
    
    if (serviceUser) {
      addLog(`服务层用户: ${serviceUser.userType} - ${serviceUser.username}`);
    }

    return { serviceUser, serviceSession, serviceToken, isValid };
  };

  // 强制同步状态
  const forceSyncState = () => {
    addLog('强制同步状态...');
    managementAuth.refreshSession();
    setTimeout(() => {
      checkLocalStorage();
      checkServiceState();
    }, 100);
  };

  // 模拟管理员登录
  const simulateAdminLogin = async () => {
    addLog('开始模拟管理员登录...');
    
    try {
      const success = await managementAuth.login({
        username: 'admin1',
        password: 'admin123',
        userType: 'ADMIN'
      });
      
      addLog(`登录结果: ${success}`);
      
      setTimeout(() => {
        checkLocalStorage();
        checkServiceState();
        addLog(`登录后状态: isAuthenticated=${managementAuth.isAuthenticated}, hasUser=${!!managementAuth.currentUser}`);
      }, 100);
      
    } catch (error) {
      addLog(`登录错误: ${error}`);
    }
  };

  // 检查路由守卫逻辑
  const checkRouteGuardLogic = () => {
    const { currentUser, isAuthenticated, isAdmin } = managementAuth;
    
    addLog('=== 路由守卫检查 ===');
    addLog(`isAuthenticated: ${isAuthenticated}`);
    addLog(`currentUser: ${currentUser ? 'exists' : 'null'}`);
    addLog(`isAdmin(): ${isAdmin()}`);
    
    if (!isAuthenticated) {
      addLog('❌ 未认证 -> 应该重定向到登录页');
    } else if (!currentUser) {
      addLog('❌ 无用户信息 -> 应该重定向到登录页');
    } else if (!isAdmin()) {
      addLog(`❌ 非管理员 (${currentUser.userType}) -> 应该重定向到登录页`);
    } else {
      addLog('✅ 权限检查通过 -> 应该显示管理页面');
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      width: 400, 
      maxHeight: '90vh',
      overflow: 'auto',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      <Card title="详细认证调试器" size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* 当前状态 */}
          <div>
            <Text strong>当前路径: </Text>
            <Text code style={{ fontSize: '11px' }}>{location.pathname}</Text>
          </div>
          
          <div>
            <Text strong>Store状态: </Text>
            <Tag color={managementAuth.isAuthenticated ? 'green' : 'red'} size="small">
              {managementAuth.isAuthenticated ? '已认证' : '未认证'}
            </Tag>
            <Tag color={managementAuth.currentUser ? 'green' : 'red'} size="small">
              {managementAuth.currentUser ? '有用户' : '无用户'}
            </Tag>
            <Tag color={managementAuth.isAdmin() ? 'green' : 'red'} size="small">
              {managementAuth.isAdmin() ? '是管理员' : '非管理员'}
            </Tag>
          </div>

          {managementAuth.currentUser && (
            <div>
              <Text strong>用户信息: </Text>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {managementAuth.currentUser.userType} - {managementAuth.currentUser.username}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <Space wrap size="small">
            <Button size="small" onClick={checkServiceState}>
              检查服务层
            </Button>
            <Button size="small" onClick={forceSyncState}>
              同步状态
            </Button>
            <Button size="small" onClick={simulateAdminLogin}>
              模拟登录
            </Button>
            <Button size="small" onClick={checkRouteGuardLogic}>
              检查路由守卫
            </Button>
            <Button size="small" onClick={() => setLogs([])}>
              清除日志
            </Button>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          {/* 本地存储状态 */}
          <div>
            <Text strong>本地存储:</Text>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {Object.entries(localStorageData).map(([key, value]) => (
                <div key={key}>
                  <Text code>{key}</Text>: {value ? '✓' : '✗'}
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* 日志 */}
          <div>
            <Text strong>实时日志:</Text>
            <div style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              backgroundColor: '#f5f5f5', 
              padding: '4px', 
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>

          {/* 快速导航 */}
          <Space wrap size="small">
            <Button size="small" onClick={() => navigate('/admin/login')}>
              登录页
            </Button>
            <Button size="small" onClick={() => navigate('/admin')}>
              管理页
            </Button>
            <Button size="small" onClick={() => navigate('/debug/auth-systems')}>
              系统测试
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};
