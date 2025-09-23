/**
 * 用户状态指示器
 * 显示当前登录用户的类型和状态
 */

import React from 'react';
import { Button, Dropdown, Space, Typography, Badge, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CrownOutlined,
  EyeOutlined,
  TeamOutlined,
  SafetyOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { UserType } from '../../types/uuid-system';
import styles from './UserStatusIndicator.module.css';

const { Text } = Typography;

// 用户类型配置
const USER_TYPE_CONFIG = {
  [UserType.ANONYMOUS]: {
    name: '全匿名用户',
    color: '#52c41a',
    icon: <EyeOutlined />,
    description: '可浏览内容和提交问卷'
  },
  [UserType.SEMI_ANONYMOUS]: {
    name: '半匿名用户',
    color: '#1890ff',
    icon: <UserOutlined />,
    description: '可管理内容和下载'
  },
  [UserType.REVIEWER]: {
    name: '审核员',
    color: '#fa8c16',
    icon: <TeamOutlined />,
    description: '负责内容审核'
  },
  [UserType.ADMIN]: {
    name: '管理员',
    color: '#722ed1',
    icon: <SettingOutlined />,
    description: '项目管理权限'
  },
  [UserType.SUPER_ADMIN]: {
    name: '超级管理员',
    color: '#f5222d',
    icon: <CrownOutlined />,
    description: '最高权限'
  }
};

interface UserStatusIndicatorProps {
  showDropdown?: boolean;
  size?: 'small' | 'default' | 'large';
}

export const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  showDropdown = true,
  size = 'default'
}) => {
  const { currentUser, logout, isLoading } = useUniversalAuthStore();

  if (!currentUser) {
    return null;
  }

  const userConfig = USER_TYPE_CONFIG[currentUser.userType];
  const displayName = currentUser.profile.displayName || userConfig.name;

  // 下拉菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div className={styles.menuItem}>
          <div className={styles.menuItemTitle}>用户信息</div>
          <div className={styles.menuItemDesc}>
            {userConfig.description}
          </div>
        </div>
      ),
      disabled: true
    },
    {
      type: 'divider'
    },
    {
      key: 'uuid',
      icon: <SafetyOutlined />,
      label: (
        <div className={styles.menuItem}>
          <div className={styles.menuItemTitle}>用户ID</div>
          <div className={styles.menuItemDesc}>
            {currentUser.uuid.slice(-12)}
          </div>
        </div>
      ),
      disabled: true
    },
    {
      key: 'stats',
      icon: <TeamOutlined />,
      label: (
        <div className={styles.menuItem}>
          <div className={styles.menuItemTitle}>统计信息</div>
          <div className={styles.menuItemDesc}>
            登录次数: {currentUser.metadata.loginCount}
          </div>
        </div>
      ),
      disabled: true
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => logout()
    }
  ];

  // 用户状态徽章
  const statusBadge = (
    <Badge
      color={userConfig.color}
      text={
        <Text className={styles.statusText}>
          {userConfig.name}
        </Text>
      }
    />
  );

  // 用户头像
  const userAvatar = (
    <Avatar
      size={size === 'small' ? 24 : size === 'large' ? 40 : 32}
      style={{
        backgroundColor: userConfig.color,
        color: '#fff'
      }}
      icon={userConfig.icon}
    />
  );

  if (!showDropdown) {
    return (
      <Space className={styles.container}>
        {userAvatar}
        <div className={styles.userInfo}>
          <div className={styles.userName}>{displayName}</div>
          {statusBadge}
        </div>
      </Space>
    );
  }

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomRight"
      disabled={isLoading}
    >
      <Button
        type="text"
        className={styles.dropdownButton}
        loading={isLoading}
      >
        <Space>
          {userAvatar}
          <div className={styles.userInfo}>
            <div className={styles.userName}>{displayName}</div>
            {statusBadge}
          </div>
          <DownOutlined className={styles.dropdownIcon} />
        </Space>
      </Button>
    </Dropdown>
  );
};

// 简化版本，只显示用户类型
export const SimpleUserStatus: React.FC = () => {
  const { currentUser } = useUniversalAuthStore();

  if (!currentUser) {
    return null;
  }

  const userConfig = USER_TYPE_CONFIG[currentUser.userType];

  return (
    <Space size="small" className={styles.simpleStatus}>
      <Avatar
        size={20}
        style={{
          backgroundColor: userConfig.color,
          color: '#fff'
        }}
        icon={userConfig.icon}
      />
      <Text className={styles.simpleStatusText}>
        {userConfig.name}
      </Text>
    </Space>
  );
};

// Hook：获取用户状态信息
export const useUserStatus = () => {
  const { currentUser } = useUniversalAuthStore();

  if (!currentUser) {
    return null;
  }

  const userConfig = USER_TYPE_CONFIG[currentUser.userType];

  return {
    user: currentUser,
    config: userConfig,
    displayName: currentUser.profile.displayName || userConfig.name,
    isAnonymous: currentUser.userType === UserType.ANONYMOUS,
    isSemiAnonymous: currentUser.userType === UserType.SEMI_ANONYMOUS,
    isReviewer: currentUser.userType === UserType.REVIEWER,
    isAdmin: currentUser.userType === UserType.ADMIN,
    isSuperAdmin: currentUser.userType === UserType.SUPER_ADMIN,
    hasManagementAccess: [UserType.ADMIN, UserType.SUPER_ADMIN].includes(currentUser.userType),
    hasReviewAccess: [UserType.REVIEWER, UserType.ADMIN, UserType.SUPER_ADMIN].includes(currentUser.userType)
  };
};

export default UserStatusIndicator;
