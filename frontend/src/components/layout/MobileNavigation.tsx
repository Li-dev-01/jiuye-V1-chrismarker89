/**
 * 移动端导航组件
 * 提供底部导航栏和侧边抽屉菜单
 */

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Drawer, 
  Menu, 
  Button, 
  Space, 
  Typography,
  Divider,
  Badge
} from 'antd';
import {
  MenuOutlined,
  HomeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BookOutlined,
  MessageOutlined,
  UserOutlined,
  CloseOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { getUserDisplayName } from '../../utils/userDisplayUtils';

import styles from './MobileNavigation.module.css';

const { Text } = Typography;

interface MobileNavigationProps {
  role?: 'admin' | 'reviewer' | 'user';
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ role }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const location = useLocation();
  const { isAuthenticated, currentUser } = useUniversalAuthStore();

  // 底部导航项
  const bottomNavItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      path: '/'
    },
    {
      key: 'questionnaire',
      icon: <FileTextOutlined />,
      label: '问卷',
      path: '/questionnaire',
      requireAuth: true
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据',
      path: '/analytics'
    },
    {
      key: 'stories',
      icon: <BookOutlined />,
      label: '故事',
      path: '/stories'
    },
    {
      key: 'menu',
      icon: <MenuOutlined />,
      label: '菜单',
      action: () => setDrawerVisible(true)
    }
  ];

  // 侧边菜单项
  const getDrawerMenuItems = () => {
    const baseItems = [
      {
        key: 'questionnaire-v2',
        icon: <ExperimentOutlined />,
        label: '问卷2',
        path: '/questionnaire-v2'
      },
      {
        key: 'results',
        icon: <BarChartOutlined />,
        label: '调研结果',
        path: '/results'
      }
    ];

    // 管理功能已迁移到专门的reviewer-admin-dashboard项目
    // 这里只保留基础用户功能

    return baseItems;
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleMenuClick = (item: any) => {
    if (item.action) {
      item.action();
    }
  };

  const renderBottomNavItem = (item: any) => {
    const isActive = item.path ? isCurrentPath(item.path) : false;
    const isDisabled = item.requireAuth && !currentUser;

    if (item.action) {
      return (
        <button
          type="button"
          key={item.key}
          className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={item.action}
          disabled={isDisabled}
        >
          <div className={styles.navIcon}>{item.icon}</div>
          <Text className={styles.navLabel}>{item.label}</Text>
        </button>
      );
    }

    return (
      <Link
        key={item.key}
        to={item.path}
        className={`${styles.navItem} ${isActive ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
        onClick={isDisabled ? (e) => e.preventDefault() : undefined}
      >
        <div className={styles.navIcon}>
          {item.requireAuth && !currentUser ? (
            <Badge dot color="orange">{item.icon}</Badge>
          ) : (
            item.icon
          )}
        </div>
        <Text className={styles.navLabel}>{item.label}</Text>
      </Link>
    );
  };

  return (
    <>
      {/* 底部导航栏 */}
      <div className={styles.bottomNav}>
        <div className={styles.navContainer}>
          {bottomNavItems.map(renderBottomNavItem)}
        </div>
      </div>

      {/* 侧边抽屉菜单 */}
      <Drawer
        title={
          <Space>
            <Text strong>菜单</Text>
            {currentUser && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {getUserDisplayName(currentUser)}
              </Text>
            )}
          </Space>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className={styles.drawer}
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setDrawerVisible(false)}
          />
        }
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          className={styles.drawerMenu}
          items={getDrawerMenuItems().map(item => {
            if (item.type === 'divider') {
              return { type: 'divider' };
            }
            return {
              key: item.path || item.key,
              icon: item.icon,
              label: item.path ? (
                <Link to={item.path} onClick={() => setDrawerVisible(false)}>
                  {item.label}
                </Link>
              ) : (
                item.label
              )
            };
          })}
        />

        <Divider />

        {/* 用户操作区域 */}
        <div className={styles.userSection}>
          {!currentUser ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                type="primary"
                onClick={() => {
                  setDrawerVisible(false);
                  // 触发全局事件打开半匿名登录
                  window.dispatchEvent(new Event('openSemiAnonymousLogin'));
                }}
              >
                匿名注册/登录
              </Button>
              <Link to="/admin/login" onClick={() => setDrawerVisible(false)}>
                <Button block type="default" size="small">管理后台登录</Button>
              </Link>
            </Space>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{getUserDisplayName(currentUser)}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {currentUser.userType === 'admin' ? '管理员' :
                 currentUser.userType === 'reviewer' ? '审核员' :
                 currentUser.userType === 'semi_anonymous' ? '半匿名用户' : '匿名用户'}
              </Text>
              <Button 
                block 
                type="primary" 
                danger
                onClick={() => {
                  // 登出逻辑
                  setDrawerVisible(false);
                }}
              >
                退出登录
              </Button>
            </Space>
          )}
        </div>
      </Drawer>
    </>
  );
};
