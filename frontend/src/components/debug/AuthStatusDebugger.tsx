/**
 * 认证状态调试组件
 * 显示当前页面的认证状态信息
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Space, Button, Alert, Descriptions, Divider } from 'antd';
import { useLocation } from 'react-router-dom';
import { ReloadOutlined, BugOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { managementAuthService } from '../../services/managementAuthService';

const { Text, Title } = Typography;

export const AuthStatusDebugger: React.FC = () => {
  const location = useLocation();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // 旧系统状态
  const universalAuth = useUniversalAuthStore();

  // 新系统状态
  const managementAuth = useManagementAuthStore();

  return (
    <Card 
      title="认证状态调试器" 
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
          <Text strong>当前路径: </Text>
          <Text code style={{ fontSize: '11px' }}>{location.pathname}</Text>
        </div>
        
        <div>
          <Text strong>旧系统 (Universal): </Text>
          <Tag color={universalAuth.isAuthenticated ? 'green' : 'red'} size="small">
            {universalAuth.isAuthenticated ? '已认证' : '未认证'}
          </Tag>
          {universalAuth.currentUser && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {universalAuth.currentUser.display_name} ({universalAuth.currentUser.userType})
            </div>
          )}
        </div>
        
        <div>
          <Text strong>新系统 (Management): </Text>
          <Tag color={managementAuth.isAuthenticated ? 'green' : 'red'} size="small">
            {managementAuth.isAuthenticated ? '已认证' : '未认证'}
          </Tag>
          {managementAuth.currentUser && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {managementAuth.currentUser.display_name} ({managementAuth.currentUser.userType})
            </div>
          )}
        </div>
        
        <div>
          <Text strong>应该使用: </Text>
          <Tag color="blue" size="small">
            {location.pathname.startsWith('/admin') || location.pathname.startsWith('/reviewer') 
              ? '管理系统' 
              : '问卷系统'
            }
          </Tag>
        </div>
      </Space>
    </Card>
  );
};
