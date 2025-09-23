import React from 'react';
import { Layout, Alert, Button, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';
import { RoleBasedHeader } from './RoleBasedHeader';
import { MobileNavigation } from './MobileNavigation';
import type { UserRole } from '../../types/auth';
// import { useUniversalAuthStore } from '../../stores/universalAuthStore'; // 已删除，使用universalAuthStore
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { isUserActive } from '../../utils/permissions';
import styles from './RoleBasedLayout.module.css';

const { Content, Footer } = Layout;

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
  className?: string;
  showFooter?: boolean;
  hideNavigation?: boolean;
  showUserStatus?: boolean;
  showAdminLinks?: boolean; // 是否在底部显示管理员链接
}

export const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({
  children,
  role,
  className = '',
  showFooter = true,
  hideNavigation = false,
  showUserStatus = true,
  showAdminLinks = true // 默认显示管理员链接
}) => {
  const { user } = useUniversalAuthStore();
  const { isAuthenticated: universalIsAuthenticated, currentUser: universalUser } = useUniversalAuthStore();
  const { isAuthenticated: managementIsAuthenticated, currentUser: managementUser } = useManagementAuthStore();

  // 根据角色选择合适的认证系统
  const isAuthenticated = role === 'admin' || role === 'reviewer'
    ? managementIsAuthenticated
    : universalIsAuthenticated;

  const currentUser = role === 'admin' || role === 'reviewer'
    ? managementUser
    : universalUser;

  // 获取布局样式类名
  const getLayoutClassName = () => {
    const classes = [styles.layout];
    if (role) classes.push(styles[role]);
    if (className) classes.push(className);
    return classes.join(' ');
  };

  // 获取页脚内容
  const getFooterContent = () => {
    if (role === 'reviewer') {
      return (
        <div className={styles.footerContent}>
          <p>© 2025 大学生就业问卷调查平台 - 审核员工作台</p>
          <p>请认真审核每一份提交的内容，确保数据质量</p>
        </div>
      );
    }
    
    if (role === 'admin') {
      return (
        <div className={styles.footerContent}>
          <p>© 2025 大学生就业问卷调查平台 - 管理员控制台</p>
          <p>系统管理 | 数据安全 | 用户服务</p>
        </div>
      );
    }
    
    return (
      <div className={styles.footerContent}>
        <div className={styles.footerMain}>
          <div className={styles.footerText}>
            <p>© 2025 大学生就业问卷调查平台. All rights reserved.</p>
            <p>致力于为大学生就业提供数据支持和交流平台</p>
          </div>

          {/* 管理后台登录链接 - 始终显示，除非是管理员用户 */}
          {showAdminLinks && (!managementIsAuthenticated || (managementUser && !['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(managementUser.userType))) && (
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
    );
  };

  return (
    <Layout className={getLayoutClassName()}>
      <RoleBasedHeader role={role} hideNavigation={hideNavigation} />
      
      {/* 用户状态提示 */}
      {showUserStatus && user && !isUserActive(user) && (
        <Alert
          message="账号状态异常"
          description="您的账号状态异常，部分功能可能受限。请联系管理员。"
          type="warning"
          showIcon
          closable
          style={{ margin: '16px 24px 0' }}
        />
      )}
      
      {/* 匿名用户提示 */}
      {showUserStatus && user?.isAnonymous && role !== 'reviewer' && role !== 'admin' && (
        <Alert
          message="匿名用户模式"
          description="您当前使用匿名模式，数据将在30天后自动清理。建议注册正式账号以保存您的数据。"
          type="info"
          showIcon
          closable
          style={{ margin: '16px 24px 0' }}
        />
      )}
      
      <Content className={styles.content}>
        {children}
      </Content>
      
      {showFooter && (
        <Footer className={styles.footer}>
          {getFooterContent()}
        </Footer>
      )}

      {/* 移动端导航 */}
      <MobileNavigation role={role} />
    </Layout>
  );
};

// 审核员专用布局
export const ReviewerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleBasedLayout role="reviewer" showUserStatus={false}>
      {children}
    </RoleBasedLayout>
  );
};

// 管理员专用布局
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleBasedLayout role="admin" showUserStatus={false}>
      {children}
    </RoleBasedLayout>
  );
};

// 用户专用布局
export const UserLayout: React.FC<{ children: React.ReactNode; showUserStatus?: boolean }> = ({ 
  children, 
  showUserStatus = true 
}) => {
  return (
    <RoleBasedLayout showUserStatus={showUserStatus}>
      {children}
    </RoleBasedLayout>
  );
};

// 公开布局（无需登录）
export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleBasedLayout showUserStatus={false} showAdminLinks={true}>
      {children}
    </RoleBasedLayout>
  );
};
