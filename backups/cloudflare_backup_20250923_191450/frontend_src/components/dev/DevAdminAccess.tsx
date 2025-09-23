/**
 * 开发环境专用管理员快速访问组件
 * 仅在开发环境显示，生产环境自动隐藏
 */

import React, { useState } from 'react';
import { Button, Dropdown, Space, Badge } from 'antd';
import { Link } from 'react-router-dom';
import {
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MessageOutlined,
  BookOutlined,
  CrownOutlined,
  EyeOutlined,
  BugOutlined
} from '@ant-design/icons';

interface DevAdminAccessProps {
  className?: string;
}

export const DevAdminAccess: React.FC<DevAdminAccessProps> = ({ className }) => {
  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const adminMenuItems = [
    {
      key: 'login',
      label: <Link to="/admin/login">管理员登录</Link>,
      icon: <UserOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'dashboard',
      label: <Link to="/admin">管理仪表板</Link>,
      icon: <DashboardOutlined />
    },
    {
      key: 'content',
      label: <Link to="/admin/content">内容管理</Link>,
      icon: <FileTextOutlined />
    },
    {
      key: 'users',
      label: <Link to="/admin/users">用户管理</Link>,
      icon: <UserOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'reviewer',
      label: <Link to="/reviewer">审核员入口</Link>,
      icon: <EyeOutlined />
    },
    {
      key: 'super-admin',
      label: <Link to="/admin/super-admin">超级管理员</Link>,
      icon: <CrownOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'route-test',
      label: <Link to="/dev/admin-routes-test">路由测试工具</Link>,
      icon: <BugOutlined />
    }
  ];

  return (
    <div className={className} style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 1000,
      opacity: 0.8
    }}>
      <Badge dot color="orange">
        <Dropdown
          menu={{ items: adminMenuItems }}
          placement="topRight"
          trigger={['click']}
        >
          <Button
            type="dashed"
            icon={<SettingOutlined />}
            size="small"
            style={{
              backgroundColor: '#fff2e8',
              borderColor: '#ffbb96',
              color: '#d46b08'
            }}
          >
            [DEV] 管理员
          </Button>
        </Dropdown>
      </Badge>
    </div>
  );
};

export default DevAdminAccess;
