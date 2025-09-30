/**
 * 开发者快捷访问面板
 * 仅在开发环境显示，提供快速角色切换功能
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, Switch, message } from 'antd';
import { 
  UserOutlined, 
  CrownOutlined, 
  SafetyCertificateOutlined,
  CodeOutlined,
  EyeInvisibleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import styles from './DevAccessPanel.module.css';

const { Title, Text } = Typography;

export const DevAccessPanel: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);


  // 仅在开发环境显示
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const devRoles = [
    {
      key: 'super_admin',
      name: '超级管理员',
      email: 'dev-superadmin@localhost',
      icon: <CrownOutlined />,
      color: '#ff4d4f',
      path: '/admin/dashboard'
    },
    {
      key: 'admin',
      name: '管理员',
      email: 'dev-admin@localhost',
      icon: <SafetyCertificateOutlined />,
      color: '#1890ff',
      path: '/admin/dashboard'
    },
    {
      key: 'reviewer',
      name: '审核员',
      email: 'dev-reviewer@localhost',
      icon: <UserOutlined />,
      color: '#52c41a',
      path: '/reviewer/dashboard'
    }
  ];

  const handleQuickLogin = async (role: any) => {
    // 管理功能已迁移到reviewer-admin-dashboard项目
    message.info(`管理功能已迁移，请访问专门的管理面板`);
    // 可以导航到主页或其他公开页面
    navigate('/', { replace: true });
  };

  if (!isVisible) {
    return (
      <div className={styles.toggleButton}>
        <Button
          type="primary"
          icon={<CodeOutlined />}
          onClick={() => setIsVisible(true)}
          size="small"
        >
          开发面板
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.devPanel}>
      <Card 
        title={
          <div className={styles.header}>
            <CodeOutlined style={{ marginRight: 8 }} />
            <span>开发者快捷访问</span>
            <Button
              type="text"
              icon={<EyeInvisibleOutlined />}
              onClick={() => setIsVisible(false)}
              size="small"
            />
          </div>
        }
        size="small"
        className={styles.card}
      >
        <div className={styles.content}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            开发环境专用 - 快速切换管理员角色
          </Text>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {devRoles.map(role => (
              <Button
                key={role.key}
                icon={role.icon}
                onClick={() => handleQuickLogin(role)}
                block
                size="small"
                style={{ 
                  color: role.color,
                  borderColor: role.color,
                  textAlign: 'left'
                }}
              >
                {role.name}
              </Button>
            ))}
          </Space>

          <Divider style={{ margin: '12px 0' }} />
          
          <div className={styles.actions}>
            <Button
              type="link"
              size="small"
              onClick={() => window.open('https://92d7bc6e.reviewer-admin-dashboard.pages.dev', '_blank')}
            >
              管理面板
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DevAccessPanel;
