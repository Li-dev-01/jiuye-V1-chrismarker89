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
const SecondQuestionnaireHomePage = React.lazy(() => import('./pages/SecondQuestionnaireHomePage'));
const SecondQuestionnairePage = React.lazy(() => import('./pages/SecondQuestionnairePage'));
const SecondQuestionnaireCompletePage = React.lazy(() => import('./pages/SecondQuestionnaireCompletePage'));
const SecondQuestionnaireAnalyticsPage = React.lazy(() => import('./pages/SecondQuestionnaireAnalyticsPage'));
const Questionnaire2SevenDimensionPage = React.lazy(() => import('./pages/Questionnaire2SevenDimensionPage'));
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
const DataSourceTestPage = React.lazy(() => import('./pages/DataSourceTestPage'));
const SimpleAnalyticsTestPage = React.lazy(() => import('./pages/SimpleAnalyticsTestPage'));

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
const QuestionnaireComboPage = React.lazy(() => import('./pages/QuestionnaireComboPage'));
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

    // 预加载核心页面组件，减少首次访问时的懒加载延迟
    // 这些是用户最常访问的页面，预加载可以显著提升用户体验
    import('./pages/SecondQuestionnairePage');
    import('./pages/Stories');
    import('./pages/SecondQuestionnaireAnalyticsPage');

    // 在开发环境中显示性能信息（减少频率）
    if (import.meta.env.DEV && Math.random() < 0.2) {
      console.log('Performance Monitor initialized');
      console.log('Cache Manager initialized');
      console.log('Core components preloading started');
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
                    {/* 首页重定向到问卷页 */}
                    <Route path="/" element={<Navigate to="/questionnaire/survey" replace />} />


                    {/* ========================================= */}
                    {/* 数据可视化路由 - 正式项目                  */}
                    {/* ========================================= */}

                    {/* 数据可视化V1（问卷1的6维度分析） */}
                    <Route path="/analytics/v1" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <NewQuestionnaireVisualizationPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 数据可视化V2（问卷2的混合分析） */}
                    <Route path="/analytics/v2" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <SecondQuestionnaireAnalyticsPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 数据可视化V3（问卷2的7维度分析） */}
                    <Route path="/analytics/v3" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <Questionnaire2SevenDimensionPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* 默认可视化页面 - 重定向到V2 */}
                    <Route path="/analytics" element={<Navigate to="/analytics/v2" replace />} />

                    {/* 兼容性重定向 - 旧路由 */}
                    <Route path="/analytics/visualization" element={<Navigate to="/analytics/v1" replace />} />
                    <Route path="/analytics/nav" element={<Navigate to="/analytics/v2" replace />} />


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
                    <Route path="/test/datasource" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <DataSourceTestPage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />
                    <Route path="/test/analytics" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <SimpleAnalyticsTestPage />
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

                    {/* ========================================= */}
                    {/* 问卷系统路由 - 正式项目                    */}
                    {/* ========================================= */}

                    {/* 问卷V2（主要问卷系统） */}
                    <Route path="/questionnaire" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <SecondQuestionnaireHomePage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    <Route path="/questionnaire/survey" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <SecondQuestionnairePage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    <Route path="/questionnaire/complete" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <SecondQuestionnaireCompletePage />
                        </QuestionnaireLayout>
                      </PublicRouteGuard>
                    } />

                    {/* ========================================= */}
                    {/* 兼容性重定向 - 旧的测试路由                */}
                    {/* ========================================= */}
                    <Route path="/questionnaire-v2" element={<Navigate to="/questionnaire" replace />} />
                    <Route path="/questionnaire-v2/survey" element={<Navigate to="/questionnaire/survey" replace />} />
                    <Route path="/questionnaire-v2/complete" element={<Navigate to="/questionnaire/complete" replace />} />
                    <Route path="/questionnaire-v2/analytics" element={<Navigate to="/analytics/v2" replace />} />
                    <Route path="/questionnaire-v1" element={<Navigate to="/questionnaire/survey" replace />} />

                    {/* 问卷组合生成器 */}
                    <Route path="/questionnaire/combo-generator" element={
                      <PublicRouteGuard>
                        <QuestionnaireLayout>
                          <QuestionnaireComboPage />
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
