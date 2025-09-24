import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
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
import ReviewHistory from './pages/ReviewHistory';
import EnhancedReviewerDashboard from './pages/EnhancedReviewerDashboard';
import EnhancedPendingReviews from './pages/EnhancedPendingReviews';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ReviewerOnlyGuard, AdminOnlyGuard, SuperAdminOnlyGuard } from './components/auth/RoleGuard';
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
            </Route>

            {/* 管理员路由 - 严格限制只有管理员和超级管理员可以访问 */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminOnlyGuard>
                  <DashboardLayout />
                </AdminOnlyGuard>
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersReal />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ai-moderation" element={<AdminAIModeration />} />
              <Route path="tag-management" element={<AdminTagManagement />} />
              <Route path="api-management" element={<AdminAPIManagement />} />
              <Route path="api-documentation" element={<AdminAPIDocumentation />} />
              <Route path="database-schema" element={<AdminDatabaseSchema />} />
              <Route path="system-monitoring" element={<AdminSystemMonitoring />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="super" element={
                <SuperAdminOnlyGuard>
                  <SuperAdminPanel />
                </SuperAdminOnlyGuard>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
