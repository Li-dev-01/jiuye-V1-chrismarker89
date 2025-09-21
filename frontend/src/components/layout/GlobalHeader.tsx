import React from 'react';
import { Typography, Space, Layout, Menu, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import styles from './GlobalHeader.module.css';

const { Title } = Typography;
const { Header } = Layout;

export const GlobalHeader: React.FC = () => {
  const location = useLocation();

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/questionnaire')) return 'survey';
    if (path.startsWith('/analytics')) return 'analysis';
    if (path.startsWith('/results')) return 'results';
    if (path.startsWith('/stories')) return 'story';
    if (path.startsWith('/voices')) return 'about';
    if (path.startsWith('/admin-test')) return 'admin-test';
    if (path.startsWith('/reviewer-test')) return 'reviewer-test';
    if (path.startsWith('/admin')) return 'admin';
    return '';
  };

  const menuItems = [
    {
      key: 'home',
      label: <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>首页</Link>
    },
    {
      key: 'survey',
      label: <Link to="/questionnaire" style={{ color: 'inherit', textDecoration: 'none' }}>问卷调查</Link>
    },
    {
      key: 'analysis',
      label: <Link to="/analytics" style={{ color: 'inherit', textDecoration: 'none' }}>数据可视化</Link>
    },
    {
      key: 'results',
      label: <Link to="/results" style={{ color: 'inherit', textDecoration: 'none' }}>结果分析</Link>
    },
    {
      key: 'story',
      label: <Link to="/stories" style={{ color: 'inherit', textDecoration: 'none' }}>故事墙</Link>
    },

    {
      key: 'test-item',
      label: '测试菜单'
    },

  ];

  // 简化版本，暂时移除动态菜单

  return (
    <Header className={styles.header}>
      <div className={styles.headerContent}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Title level={3} className={styles.logo}>
            大学生就业问卷调查
          </Title>
        </Link>
        
        <Menu
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          className={styles.menu}
          items={menuItems}
        />
        
        <Space className={styles.userActions}>
          {/* 用户操作区域 - 管理入口已移至独立后台 */}
        </Space>
      </div>
    </Header>
  );
};
