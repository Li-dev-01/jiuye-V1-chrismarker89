/**
 * 登录验证调试器
 * 专门用于验证管理员登录是否真正成功
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { useTestManagementAuthStore } from '../../stores/testManagementAuthStore';
import { managementAuthService } from '../../services/managementAuthService';

const { Text, Title } = Typography;

export const LoginValidationDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const managementAuth = useManagementAuthStore();
  const testAuth = useTestManagementAuthStore();

  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      test,
      result
    }]);
  };

  // 测试管理员登录
  const testAdminLogin = async () => {
    addResult('开始测试', '管理员登录');

    try {
      // 1. 清除当前状态
      managementAuth.logout();
      addResult('状态清除', '已清除所有认证状态');

      // 2. 直接调用服务层测试
      const serviceResult = await managementAuthService.login({
        username: 'admin1',
        password: 'admin123',
        userType: 'ADMIN'
      });

      addResult('服务层直接调用结果', {
        success: serviceResult.success,
        hasUser: !!serviceResult.user,
        hasSession: !!serviceResult.session,
        hasToken: !!serviceResult.token,
        userType: serviceResult.user?.userType,
        error: serviceResult.error
      });

      // 3. 尝试Store登录
      const success = await managementAuth.login({
        username: 'admin1',
        password: 'admin123',
        userType: 'ADMIN'
      });

      addResult('Store登录调用结果', success);

      // 2.5. 立即检查Store状态（登录后）
      const immediateStoreState = {
        isAuthenticated: managementAuth.isAuthenticated,
        hasUser: !!managementAuth.currentUser,
        userType: managementAuth.currentUser?.userType,
        username: managementAuth.currentUser?.username
      };
      addResult('登录后立即Store状态', immediateStoreState);

      // 3. 检查Store状态
      const storeState = {
        isAuthenticated: managementAuth.isAuthenticated,
        hasUser: !!managementAuth.currentUser,
        userType: managementAuth.currentUser?.userType,
        username: managementAuth.currentUser?.username
      };
      addResult('Store状态', storeState);
      
      // 4. 检查服务层状态
      const serviceState = {
        hasUser: !!managementAuthService.getCurrentUser(),
        hasSession: !!managementAuthService.getCurrentSession(),
        hasToken: !!managementAuthService.getAuthToken(),
        isValid: managementAuthService.isSessionValid()
      };
      addResult('服务层状态', serviceState);
      
      // 5. 检查本地存储
      const localStorage = {
        'management-auth-storage': !!window.localStorage.getItem('management-auth-storage'),
        'management_current_user': !!window.localStorage.getItem('management_current_user'),
        'management_current_session': !!window.localStorage.getItem('management_current_session'),
        'management_auth_token': !!window.localStorage.getItem('management_auth_token')
      };
      addResult('本地存储', localStorage);
      
      // 6. 权限检查
      const permissions = {
        isAdmin: managementAuth.isAdmin(),
        isReviewer: managementAuth.isReviewer(),
        canAccessAdmin: managementAuth.canAccessRoute('/admin').allowed
      };
      addResult('权限检查', permissions);
      
    } catch (error) {
      addResult('登录错误', error);
    }
  };

  // 测试审核员登录
  const testReviewerLogin = async () => {
    addResult('开始测试', '审核员登录');
    
    try {
      // 1. 清除当前状态
      managementAuth.logout();
      addResult('状态清除', '已清除所有认证状态');
      
      // 2. 尝试登录
      const success = await managementAuth.login({
        username: 'reviewerA',
        password: 'admin123',
        userType: 'REVIEWER'
      });
      
      addResult('登录调用结果', success);
      
      // 3. 检查Store状态
      const storeState = {
        isAuthenticated: managementAuth.isAuthenticated,
        hasUser: !!managementAuth.currentUser,
        userType: managementAuth.currentUser?.userType,
        username: managementAuth.currentUser?.username
      };
      addResult('Store状态', storeState);
      
      // 4. 权限检查
      const permissions = {
        isAdmin: managementAuth.isAdmin(),
        isReviewer: managementAuth.isReviewer(),
        canAccessReviewer: managementAuth.canAccessRoute('/reviewer/dashboard').allowed
      };
      addResult('权限检查', permissions);
      
    } catch (error) {
      addResult('登录错误', error);
    }
  };

  // 直接测试Store的set方法
  const testStoreSetMethod = () => {
    addResult('=== 测试Store的set方法 ===', '直接调用set方法');

    try {
      // 获取当前状态
      const beforeState = {
        isAuthenticated: managementAuth.isAuthenticated,
        hasUser: !!managementAuth.currentUser
      };
      addResult('设置前状态', beforeState);

      // 直接调用内部方法来测试set
      // 注意：这是一个hack，正常情况下不应该这样做
      const store = managementAuth as any;

      // 尝试直接设置一个简单的状态
      if (store.setState) {
        store.setState({
          isAuthenticated: true,
          currentUser: {
            id: 'test',
            username: 'test-user',
            userType: 'ADMIN'
          }
        });

        // 立即检查状态
        const afterState = {
          isAuthenticated: managementAuth.isAuthenticated,
          hasUser: !!managementAuth.currentUser,
          userType: managementAuth.currentUser?.userType
        };
        addResult('设置后状态', afterState);
      } else {
        addResult('错误', 'Store没有setState方法');
      }

    } catch (error) {
      addResult('测试Store错误', error);
    }
  };

  // 检查当前状态
  const checkCurrentState = () => {
    const currentState = {
      store: {
        isAuthenticated: managementAuth.isAuthenticated,
        userType: managementAuth.currentUser?.userType,
        username: managementAuth.currentUser?.username
      },
      service: {
        hasUser: !!managementAuthService.getCurrentUser(),
        userType: managementAuthService.getCurrentUser()?.userType,
        username: managementAuthService.getCurrentUser()?.username
      },
      localStorage: {
        hasAuthStorage: !!window.localStorage.getItem('management-auth-storage'),
        hasUser: !!window.localStorage.getItem('management_current_user'),
        hasSession: !!window.localStorage.getItem('management_current_session')
      }
    };
    
    addResult('当前状态检查', currentState);
  };

  // 复制测试结果
  const copyResults = async () => {
    try {
      const timestamp = new Date().toLocaleString();
      const currentState = {
        isAuthenticated: managementAuth.isAuthenticated,
        userType: managementAuth.currentUser?.userType,
        username: managementAuth.currentUser?.username
      };

      const reportText = `
=== 登录验证调试报告 ===
时间: ${timestamp}
当前状态: ${JSON.stringify(currentState, null, 2)}

=== 详细测试结果 ===
${testResults.map(result =>
  `[${result.timestamp}] ${result.test}:\n${
    typeof result.result === 'object'
      ? JSON.stringify(result.result, null, 2)
      : String(result.result)
  }`
).join('\n\n')}

=== 系统信息 ===
浏览器: ${navigator.userAgent}
URL: ${window.location.href}
本地存储键: ${Object.keys(localStorage).filter(key => key.includes('management')).join(', ')}
      `.trim();

      await navigator.clipboard.writeText(reportText);
      message.success('测试结果已复制到剪贴板！');
    } catch (error) {
      message.error('复制失败，请手动选择文本复制');
      console.error('复制错误:', error);
    }
  };

  // 测试新Store
  const testNewStore = async () => {
    addResult('=== 测试新Store ===', '使用简化版Store');

    try {
      // 清除状态
      testAuth.logout();
      addResult('新Store状态清除', '已清除');

      // 尝试登录
      const success = await testAuth.login({
        username: 'admin1',
        password: 'admin123',
        userType: 'ADMIN'
      });

      addResult('新Store登录结果', success);

      // 检查状态
      const state = {
        isAuthenticated: testAuth.isAuthenticated,
        hasUser: !!testAuth.currentUser,
        userType: testAuth.currentUser?.userType,
        username: testAuth.currentUser?.username
      };
      addResult('新Store状态', state);

    } catch (error) {
      addResult('新Store错误', error);
    }
  };

  // 一键完整测试
  const runCompleteTest = async () => {
    addResult('=== 开始完整测试 ===', '对比原Store和新Store');

    // 测试原Store
    await testAdminLogin();

    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试新Store
    await testNewStore();

    addResult('=== 完整测试结束 ===', '请查看上述结果对比');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      width: 500, 
      maxHeight: '60vh',
      overflow: 'auto',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      <Card title="登录验证调试器" size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* 当前状态显示 */}
          <div>
            <Text strong>当前状态: </Text>
            <Tag color={managementAuth.isAuthenticated ? 'green' : 'red'} size="small">
              {managementAuth.isAuthenticated ? '已认证' : '未认证'}
            </Tag>
            {managementAuth.currentUser && (
              <Tag color="blue" size="small">
                {managementAuth.currentUser.userType} - {managementAuth.currentUser.username}
              </Tag>
            )}
          </div>

          {/* 测试按钮 */}
          <Space wrap size="small">
            <Button size="small" onClick={runCompleteTest} type="primary">
              🚀 一键完整测试
            </Button>
            <Button size="small" onClick={testAdminLogin}>
              测试管理员
            </Button>
            <Button size="small" onClick={testReviewerLogin}>
              测试审核员
            </Button>
            <Button size="small" onClick={checkCurrentState}>
              检查状态
            </Button>
            <Button size="small" onClick={testStoreSetMethod} type="dashed">
              测试Store
            </Button>
            <Button size="small" onClick={() => setTestResults([])}>
              清除日志
            </Button>
            <Button
              size="small"
              onClick={copyResults}
              icon={<CopyOutlined />}
              type="primary"
              ghost
            >
              复制结果
            </Button>
            <Button size="small" onClick={managementAuth.logout} danger>
              退出登录
            </Button>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          {/* 测试结果 */}
          <div>
            <Text strong>测试结果:</Text>
            <div style={{ 
              maxHeight: '300px', 
              overflow: 'auto', 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace'
            }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  <Text strong style={{ color: '#1890ff' }}>
                    [{result.timestamp}] {result.test}:
                  </Text>
                  <div style={{ marginLeft: '8px', color: '#666' }}>
                    {typeof result.result === 'object' 
                      ? JSON.stringify(result.result, null, 2)
                      : String(result.result)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};
