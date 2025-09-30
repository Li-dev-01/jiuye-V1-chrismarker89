/**
 * 顶部用户信息组件
 * 显示用户登录ID和退出选项
 */

import React from 'react';
import { Space, Dropdown, Avatar, Typography, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { useQuestionnaireAuthStore } from '../../stores/questionnaireAuthStore';
import { getUserDisplayName } from '../../utils/userDisplayUtils';
import styles from './TopUserInfo.module.css';

const { Text } = Typography;

export const TopUserInfo: React.FC = () => {
  const navigate = useNavigate();
  
  // 检查多种登录状态
  const { currentUser: universalUser, isAuthenticated: universalAuth, logout: universalLogout } = useUniversalAuthStore();
  const { currentUser: questionnaireUser, isAuthenticated: questionnaireAuth, logout: questionnaireLogout } = useQuestionnaireAuthStore();
  
  // 确定当前用户状态
  const isLoggedIn = universalAuth || questionnaireAuth;
  const currentUser = universalUser || questionnaireUser;
  
  // 如果未登录，不显示组件
  if (!isLoggedIn || !currentUser) {
    return null;
  }
  
  // 处理登出
  const handleLogout = () => {
    if (universalAuth) {
      universalLogout();
    }
    if (questionnaireAuth) {
      questionnaireLogout();
    }
    navigate('/');
  };

  // 获取用户显示信息
  const getUserDisplayInfo = () => {
    const identifier = getUserDisplayName(currentUser);

    if (currentUser.userType === 'semi-anonymous') {
      return {
        id: identifier,
        name: identifier,
        type: '半匿名用户',
        avatar: null
      };
    }

    if (currentUser.userType === 'admin') {
      return {
        id: identifier,
        name: currentUser.username || identifier,
        type: '管理员',
        avatar: null
      };
    }

    return {
      id: identifier,
      name: currentUser.username || identifier,
      type: '注册用户',
      avatar: null
    };
  };

  const userInfo = getUserDisplayInfo();

  // 用户菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true
    }
  ];

  return (
    <div className={styles.container}>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <div className={styles.userCard}>
          <Space>
            <Avatar 
              size="small" 
              icon={<UserOutlined />}
              className={styles.avatar}
            />
            <div className={styles.userDetails}>
              <Text strong className={styles.userName}>
                {userInfo.name}
              </Text>
              <Text type="secondary" className={styles.userId}>
                ID: {userInfo.id}
              </Text>
            </div>
          </Space>
        </div>
      </Dropdown>
      
      {/* 快捷退出按钮 */}
      <Button
        type="text"
        size="small"
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        className={styles.logoutButton}
        title="退出登录"
      />
    </div>
  );
};

export default TopUserInfo;
