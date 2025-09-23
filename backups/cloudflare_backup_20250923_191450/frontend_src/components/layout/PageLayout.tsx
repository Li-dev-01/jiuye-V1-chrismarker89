import React from 'react';
import { Layout, Button, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';
import { GlobalHeader } from './GlobalHeader';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import styles from './PageLayout.module.css';

const { Content, Footer } = Layout;

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
  showAdminLinks?: boolean; // 是否显示管理员链接
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = '',
  showFooter = true,
  showAdminLinks = true // 默认显示管理员链接
}) => {
  const { isAuthenticated, currentUser } = useUniversalAuthStore();

  return (
    <Layout className={`${styles.layout} ${className}`}>
      <GlobalHeader />
      <Content className={styles.content}>
        {children}
      </Content>
      {showFooter && (
        <Footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerMain}>
              <div className={styles.footerText}>
                <p>© 2025 大学生就业问卷调查平台. All rights reserved.</p>
                <p>致力于为大学生就业提供数据支持和交流平台</p>
              </div>

              {/* 管理后台登录链接 - 始终显示，除非是管理员用户 */}
              {showAdminLinks && (!isAuthenticated || (currentUser && !['admin', 'super_admin', 'reviewer'].includes(currentUser.userType))) && (
                <div className={styles.footerActions}>
                  <Link to="/admin/login">
                    <Button
                      type="link"
                      icon={<SettingOutlined />}
                      className={styles.footerAdminButton}
                    >
                      管理后台登录
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Footer>
      )}
    </Layout>
  );
};
