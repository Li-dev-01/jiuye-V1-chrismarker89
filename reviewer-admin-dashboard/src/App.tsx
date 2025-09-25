import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminAPIManagement from './pages/AdminAPIManagement';
import AdminAPIDocumentation from './pages/AdminAPIDocumentation';
import AdminDatabaseSchema from './pages/AdminDatabaseSchema';
import AdminSystemMonitoring from './pages/AdminSystemMonitoring';
import AdminUsersReal from './pages/AdminUsersReal';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminAIModeration from './pages/AdminAIModeration';
import AdminSettings from './pages/AdminSettings';
import AdminTagManagement from './pages/AdminTagManagement';
import SuperAdminPanel from './pages/SuperAdminPanel';
import SuperAdminSecurityConsole from './pages/SuperAdminSecurityConsole';
import SuperAdminSystemLogs from './pages/SuperAdminSystemLogs';
import SuperAdminSystemSettings from './pages/SuperAdminSystemSettings';
import ReviewHistory from './pages/ReviewHistory';
import EnhancedReviewerDashboard from './pages/EnhancedReviewerDashboard';
import EnhancedPendingReviews from './pages/EnhancedPendingReviews';
import PermissionTestPage from './pages/PermissionTestPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ReviewerOnlyGuard, AdminOnlyGuard, SuperAdminOnlyGuard, RegularAdminOnlyGuard } from './components/auth/RoleGuard';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Router>
          <Routes>
            {/* 登录页面 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/super-login" element={<SuperAdminLoginPage />} />

            {/* 审核员路由 - 严格限制只有审核员可以访问 */}
            <Route path="/" element={
              <ProtectedRoute>
                <ReviewerOnlyGuard>
                  <DashboardLayout />
                </ReviewerOnlyGuard>
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<EnhancedReviewerDashboard />} />
              <Route path="pending" element={<EnhancedPendingReviews />} />
              <Route path="history" element={<ReviewHistory />} />

              {/* 🧪 权限测试页面 - 审核员也可访问 */}
              <Route path="permission-test" element={<PermissionTestPage />} />
            </Route>

            {/* 管理员路由 - 严格权限分级控制 */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminOnlyGuard>
                  <DashboardLayout />
                </AdminOnlyGuard>
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />

              {/* 🔄 共享管理功能 - 管理员和超级管理员都可访问 */}
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersReal />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ai-moderation" element={<AdminAIModeration />} />
              <Route path="tag-management" element={<AdminTagManagement />} />
              <Route path="settings" element={<AdminSettings />} />

              {/* 🔧 普通管理员专属功能 - 只有普通管理员可访问 */}
              <Route path="api-management" element={
                <RegularAdminOnlyGuard>
                  <AdminAPIManagement />
                </RegularAdminOnlyGuard>
              } />
              <Route path="api-documentation" element={
                <RegularAdminOnlyGuard>
                  <AdminAPIDocumentation />
                </RegularAdminOnlyGuard>
              } />
              <Route path="database-schema" element={
                <RegularAdminOnlyGuard>
                  <AdminDatabaseSchema />
                </RegularAdminOnlyGuard>
              } />
              <Route path="system-monitoring" element={
                <RegularAdminOnlyGuard>
                  <AdminSystemMonitoring />
                </RegularAdminOnlyGuard>
              } />

              {/* 👑 超级管理员专属功能 - 只有超级管理员可访问 */}
              <Route path="security-console" element={
                <SuperAdminOnlyGuard>
                  <SuperAdminSecurityConsole />
                </SuperAdminOnlyGuard>
              } />
              <Route path="system-logs" element={
                <SuperAdminOnlyGuard>
                  <SuperAdminSystemLogs />
                </SuperAdminOnlyGuard>
              } />
              <Route path="system-settings" element={
                <SuperAdminOnlyGuard>
                  <SuperAdminSystemSettings />
                </SuperAdminOnlyGuard>
              } />
              <Route path="super-admin-panel" element={
                <SuperAdminOnlyGuard>
                  <SuperAdminPanel />
                </SuperAdminOnlyGuard>
              } />

              {/* 🧪 权限测试页面 - 所有管理员都可访问 */}
              <Route path="permission-test" element={<PermissionTestPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
