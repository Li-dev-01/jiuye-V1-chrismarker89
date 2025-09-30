import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { performanceMonitor } from './utils/performanceMonitor';
import { cacheManager } from './utils/cacheManager';

import { AccessibilityProvider, AccessibilityShortcuts, SkipToContent } from './components/accessibility/AccessibilityProvider';
import {
  PublicRouteGuard,
  UserRouteGuard
} from './components/auth/RouteGuard';
import { GlobalSemiAnonymousLogin } from './components/auth/GlobalSemiAnonymousLogin';
import { QuestionnaireLayout } from './components/layout/QuestionnaireLayout';

import DevAccessPanel from './components/dev/DevAccessPanel';
import './styles/global.css';

// 懒加载组件
const HomePage = React.lazy(() => import('./pages/HomePage'));
const QuestionnairePage = React.lazy(() => import('./pages/IntelligentQuestionnairePage'));
const StoriesPage = React.lazy(() => import('./pages/Stories'));
const StoriesSimple = React.lazy(() => import('./pages/StoriesSimple'));
const StoriesTest1 = React.lazy(() => import('./pages/test/StoriesTest1'));
const StoriesTest2 = React.lazy(() => import('./pages/test/StoriesTest2'));
const StoriesTest3 = React.lazy(() => import('./pages/test/StoriesTest3'));
const StoriesTest4 = React.lazy(() => import('./pages/test/StoriesTest4'));
const FavoritesPage = React.lazy(() => import('./pages/FavoritesPage'));
// 问卷完成页面
const QuestionnaireCompletion = React.lazy(() => import('./pages/QuestionnaireCompletion'));
const StorySubmitPage = React.lazy(() => import('./pages/StorySubmitPage'));

// 测试页面
const TurnstileTestPage = React.lazy(() => import('./pages/TurnstileTestPage'));

// 用户内容管理页面
const MyContentPage = React.lazy(() => import('./pages/user/MyContent'));


const UserLoginPage = React.lazy(() => import('./pages/auth/UserLoginPage').then(module => ({ default: module.UserLoginPage })));



const LoginHistoryPage = React.lazy(() => import('./pages/user/LoginHistoryPage').then(module => ({ default: module.LoginHistoryPage })));
const TwoFactorAuthPage = React.lazy(() => import('./pages/user/TwoFactorAuthPage').then(module => ({ default: module.TwoFactorAuthPage })));
const UserProfile = React.lazy(() => import('./pages/user/UserProfile').then(module => ({ default: module.default })));



// 测试页面已移动到归档目录
// const StateTest = React.lazy(() => import('./pages/test/StateTest').then(module => ({ default: module.StateTest })));

// 演示页面已移动到归档目录
// const AIDemoPage = React.lazy(() => import('./pages/demo/AIDemoPage').then(module => ({ default: module.AIDemoPage })));




// 测试页面已移动到归档目录
// const TestPermissionPage = React.lazy(() => import('./pages/test/PermissionTestPage').then(module => ({ default: module.PermissionTestPage })));
// const LoginSeparationTest = React.lazy(() => import('./pages/test/LoginSeparationTest').then(module => ({ default: module.LoginSeparationTest })));
// const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));

// const PolicyMakerDashboard = React.lazy(() => import('./pages/analytics/PolicyMakerDashboard').then(module => ({ default: module.PolicyMakerDashboard })));
// const EducationDashboard = React.lazy(() => import('./pages/analytics/EducationDashboard').then(module => ({ default: module.EducationDashboard })));
// const PublicDashboard = React.lazy(() => import('./pages/analytics/PublicDashboard').then(module => ({ default: module.PublicDashboard })));
// const StudentParentDashboard = React.lazy(() => import('./pages/analytics/StudentParentDashboard').then(module => ({ default: module.StudentParentDashboard })));
// const RealisticDashboard = React.lazy(() => import('./pages/analytics/RealisticDashboard').then(module => ({ default: module.RealisticDashboard })));
// const UnifiedAnalyticsPage = React.lazy(() => import('./pages/analytics/UnifiedAnalyticsPage').then(module => ({ default: module.UnifiedAnalyticsPage })));
const NewQuestionnaireVisualizationPage = React.lazy(() => import('./pages/analytics/NewQuestionnaireVisualizationPage').then(module => ({ default: module.NewQuestionnaireVisualizationPage })));


const AnalyticsNavigationPage = React.lazy(() => import('./pages/analytics/AnalyticsNavigationPage').then(module => ({ default: module.AnalyticsNavigationPage })));

// 调试页面已移动到归档目录
// const AuthDebugPage = React.lazy(() => import('./pages/debug/AuthDebugPage').then(module => ({ default: module.AuthDebugPage })));
// const PermissionTestPage = React.lazy(() => import('./pages/debug/PermissionTestPage').then(module => ({ default: module.PermissionTestPage })));
// const AuthSystemTestPage = React.lazy(() => import('./pages/debug/AuthSystemTestPage').then(module => ({ default: module.AuthSystemTestPage })));
const GoogleCallbackPage = React.lazy(() => import('./pages/auth/GoogleCallbackPage').then(module => ({ default: module.GoogleCallbackPage })));
const GoogleQuestionnaireCallbackPage = React.lazy(() => import('./pages/auth/GoogleQuestionnaireCallbackPage').then(module => ({ default: module.default })));
const OAuthUrlDebugPage = React.lazy(() => import('./pages/debug/OAuthUrlDebugPage').then(module => ({ default: module.default })));
// 调试页面已移动到归档目录
// const SimpleAdminTestPage = React.lazy(() => import('./pages/debug/SimpleAdminTestPage').then(module => ({ default: module.SimpleAdminTestPage })));
// const AdminDataTestPage = React.lazy(() => import('./pages/debug/AdminDataTestPage').then(module => ({ default: module.AdminDataTestPage })));

// 测试和调试页面已移动到归档目录
// const ViolationContentTest = React.lazy(() => import('./pages/test/ViolationContentTest'));
const TestPage = React.lazy(() => import('./pages/TestPage').then(module => ({ default: module.TestPage })));
const IntelligentQuestionnairePage = React.lazy(() => import('./pages/IntelligentQuestionnairePage'));
const GoogleOAuthTestPage = React.lazy(() => import('./pages/test/GoogleOAuthTestPage').then(module => ({ default: module.default })));
const GoogleOAuthDebugPage = React.lazy(() => import('./pages/debug/GoogleOAuthDebugPage').then(module => ({ default: module.default })));
const AuthTestPage = React.lazy(() => import('./pages/test/AuthTestPage').then(module => ({ default: module.AuthTestPage })));
// const FloatingComponentTestPage = React.lazy(() => import('./pages/test/FloatingComponentTestPage').then(module => ({ default: module.FloatingComponentTestPage })));
// const AdminRoutesTestPage = React.lazy(() => import('./pages/dev/AdminRoutesTestPage').then(module => ({ default: module.default })));
// const ManagementAuthDebugPage = React.lazy(() => import('./pages/debug/ManagementAuthDebugPage').then(module => ({ default: module.default })));
// const UserContentTestPage = React.lazy(() => import('./pages/debug/UserContentTestPage').then(module => ({ default: module.default })));
// const SimpleUserContentTest = React.lazy(() => import('./pages/debug/SimpleUserContentTest').then(module => ({ default: module.default })));

// 加载中组件
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <Spin size="large" />
  </div>
);

function App() {
  useEffect(() => {
    // 初始化性能监控
    performanceMonitor.reportMetrics();

    // 清理过期缓存
    cacheManager.cleanup();

    // 在开发环境中显示性能信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Monitor initialized');
      console.log('Cache Manager initialized');
    }
  }, []);

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <ConfigProvider locale={zhCN}>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <SkipToContent />
            <AccessibilityShortcuts />
            <div className="App">
              <Suspense fallback={<LoadingSpinner />}>
                <main id="main-content">
                  <Routes>
                    {/* 公开路由 - 无需权限，使用问卷布局 */}
                    <Route path="/" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <HomePage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />


                    {/* 可视化导航页面 */}
                    <Route path="/analytics/nav" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <AnalyticsNavigationPage />

                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 主要可视化页面 - 使用优化的新版本 */}
                    <Route path="/analytics" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <NewQuestionnaireVisualizationPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 新的问卷可视化页面 - 主要入口 */}
                    <Route path="/analytics/visualization" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <NewQuestionnaireVisualizationPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />





                    {/* 原有的可视化页面 - 保留作为备份 */}
                    {/* <Route path="/analytics/original" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <AnalyticsPage />

                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } /> */}


                    <Route path="/stories" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <StoriesPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    <Route path="/stories-simple" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <StoriesSimple />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    <Route path="/test/stories-1" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <StoriesTest1 />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    <Route path="/test/stories-2" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <StoriesTest2 />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    <Route path="/test/stories-3" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <StoriesTest3 />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    <Route path="/test/stories-4" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <StoriesTest4 />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 收藏页面 */}
                    <Route path="/favorites" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <FavoritesPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* Results页面暂时注释 - 组件不存在 */}
                    {/* <Route path="/results" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <ResultsPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } /> */}

                    {/* 问卷完成页面 */}
                    <Route path="/questionnaire-completion" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <QuestionnaireCompletion />

                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />
                    <Route path="/story-submit" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <StorySubmitPage />

                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 用户内容管理页面 */}
                    <Route path="/my/content" element={<PublicRouteGuard><MyContentPage /></PublicRouteGuard>} />
                    <Route path="/my-content" element={<PublicRouteGuard><MyContentPage /></PublicRouteGuard>} />
                    <Route path="/my/questionnaires" element={<PublicRouteGuard><MyContentPage /></PublicRouteGuard>} />

                    <Route path="/my/content/edit" element={<PublicRouteGuard><MyContentPage /></PublicRouteGuard>} />



                    {/* 测试路由 */}
                    <Route path="/test/turnstile" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <TurnstileTestPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 其他测试路由已移动到归档目录 */}
                    {/* <Route path="/test/state" element={<PublicRouteGuard><StateTest /></PublicRouteGuard>} /> */}

                    {/* 用户认证路由 - A+B半匿名登录 */}
                    <Route path="/auth/login" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <UserLoginPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />



                    {/* Google OAuth回调页面 */}
                    <Route path="/auth/google/callback" element={<PublicRouteGuard><GoogleCallbackPage /></PublicRouteGuard>} />
                    <Route path="/auth/google/callback/questionnaire" element={<PublicRouteGuard><GoogleQuestionnaireCallbackPage /></PublicRouteGuard>} />


                    {/* 登录方式选择引导 - 已移除，管理功能已迁移 */}

                    {/* 用户个人页面 */}
                    <Route path="/user/profile" element={<UserRouteGuard><UserProfile /></UserRouteGuard>} />
                    <Route path="/user/settings" element={<PublicRouteGuard><div style={{padding: '24px'}}><h2>设置</h2><p>设置页面开发中...</p></div></PublicRouteGuard>} />
                    <Route path="/user/login-history" element={<UserRouteGuard><LoginHistoryPage /></UserRouteGuard>} />
                    <Route path="/user/two-factor" element={<UserRouteGuard><TwoFactorAuthPage /></UserRouteGuard>} />

                    {/* 主要问卷路由 - 使用升级版智能问卷 */}
                    <Route path="/questionnaire" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <QuestionnairePage />

                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 测试路由 - 保留用于A/B测试和功能对比 */}
                    <Route path="/intelligent-questionnaire" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <IntelligentQuestionnairePage />

                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />
                    {/* 冗余路由已移除 - questionnaire2 重定向到主路由 */}
                    <Route path="/questionnaire2" element={<Navigate to="/questionnaire" replace />} />







                    {/* 测试路由 - 开发用 */}
                    <Route path="/test" element={<PublicRouteGuard><TestPage /></PublicRouteGuard>} />

                    {/* Google OAuth测试页面 */}
                    <Route path="/test/google-oauth" element={<PublicRouteGuard><GoogleOAuthTestPage /></PublicRouteGuard>} />

                    {/* 认证功能测试页面 */}
                    <Route path="/test/auth" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <AuthTestPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* Google OAuth调试页面 */}
                    <Route path="/debug/google-oauth" element={<PublicRouteGuard><GoogleOAuthDebugPage /></PublicRouteGuard>} />

                    {/* OAuth URL调试页面 */}
                    <Route path="/debug/oauth-url" element={<PublicRouteGuard><OAuthUrlDebugPage /></PublicRouteGuard>} />


                    {/* 测试、演示和调试路由已移动到归档目录 */}
                    {/* <Route path="/demo/ai" element={<AIDemoPage />} /> */}
                    {/* <Route path="/test/permissions" element={<PublicRouteGuard><TestPermissionPage /></PublicRouteGuard>} /> */}
                    {/* <Route path="/debug/auth" element={<PublicRouteGuard><AuthDebugPage /></PublicRouteGuard>} /> */}
                    {/* <Route path="/debug/permissions" element={<PublicRouteGuard><PermissionTestPage /></PublicRouteGuard>} /> */}
                    {/* <Route path="/debug/auth-systems" element={<PublicRouteGuard><AuthSystemTestPage /></PublicRouteGuard>} /> */}
                    {/* <Route path="/debug/simple-admin" element={<NewAdminRouteGuard><SimpleAdminTestPage /></NewAdminRouteGuard>} /> */}
                    {/* <Route path="/debug/admin-data" element={<PublicRouteGuard><AdminDataTestPage /></PublicRouteGuard>} /> */}
                    {/* <Route path="/debug/management-auth" element={<ManagementAuthDebugPage />} /> */}
                    {/* <Route path="/debug/user-content-test" element={<UserContentTestPage />} /> */}
                    {/* <Route path="/debug/user-content-simple" element={<SimpleUserContentTest />} /> */}
                    {/* <Route path="/debug/user-content-direct" element={<UserContentManagementPage />} /> */}
                    {/* <Route path="/test/floating-components" element={<PublicRouteGuard><FloatingComponentTestPage /></PublicRouteGuard>} /> */}
                    {/* <Route path="/test/violation-content" element={<PublicRouteGuard><ViolationContentTest /></PublicRouteGuard>} /> */}
                    {/* <Route path="/test/login-separation" element={<PublicRouteGuard><LoginSeparationTest /></PublicRouteGuard>} /> */}
                    {/* <Route path="/dev/admin-routes-test" element={<PublicRouteGuard><AdminRoutesTestPage /></PublicRouteGuard>} /> */}

                  </Routes>
                </main>
              </Suspense>

              {/* 全局半匿名登录组件 */}
              <GlobalSemiAnonymousLogin />



              {/* 开发者快捷访问面板 - 仅开发环境 */}
              <DevAccessPanel />
            </div>
          </Router>
        </ConfigProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
