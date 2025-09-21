# 项目页面结构设计

## 概述

本文档详细描述了大学生就业问卷调查平台的完整页面结构，包括路由设计、权限要求、功能定位和角色隔离策略。

## 页面结构树

```
大学生就业问卷调查平台
├── 公开页面 (无需登录)
│   ├── / - 首页
│   ├── /analytics - 数据可视化 (只读)
│   ├── /stories - 故事墙 (浏览模式)
│   └── /voices - 问卷心声 (浏览模式)
│
├── 认证页面
│   ├── /login - 普通用户登录
│   ├── /register - 用户注册
│   ├── /reviewer/login - 审核员登录
│   └── /admin/login - 管理员登录
│
├── 用户页面 (需要登录)
│   ├── /questionnaire - 问卷填写
│   ├── /profile - 个人中心
│   ├── /my-submissions - 我的提交记录
│   ├── /stories/create - 发布故事
│   └── /voices/create - 发表心声
│
├── 审核员页面 (reviewer权限)
│   ├── /reviewer - 审核工作台
│   ├── /reviewer/dashboard - 审核仪表板
│   ├── /reviewer/questionnaires - 问卷审核
│   ├── /reviewer/stories - 故事审核
│   ├── /reviewer/voices - 心声审核
│   └── /reviewer/history - 审核历史
│
└── 管理员页面 (admin权限)
    ├── /admin - 管理控制台
    ├── /admin/users - 用户管理
    ├── /admin/reviewers - 审核员管理
    ├── /admin/content - 内容管理
    ├── /admin/system - 系统设置
    ├── /admin/api-data - API与数据管理
    └── /admin/logs - 系统日志
```

---

## 详细页面规格

### 1. 公开页面 (Public Pages)

#### 1.1 首页 `/`
- **权限要求**: 无
- **功能**: 平台介绍、快捷注册、功能导航
- **组件**: `HomePage`
- **布局**: `PublicLayout`
- **特色**: 
  - 未登录用户显示"快速参与"按钮
  - 已登录用户显示"开始问卷调查"按钮

#### 1.2 数据可视化 `/analytics`
- **权限要求**: `view_analytics`
- **功能**: 就业数据统计图表展示
- **组件**: `AnalyticsPage`
- **布局**: `PublicLayout`
- **限制**: 
  - 普通浏览用户：只读模式
  - 注册用户：可下载报告

#### 1.3 故事墙 `/stories`
- **权限要求**: `view_stories`
- **功能**: 浏览已发布的就业故事
- **组件**: `StoriesPage`
- **布局**: `PublicLayout`
- **限制**: 只显示已审核通过的故事

#### 1.4 问卷心声 `/voices`
- **权限要求**: `view_voices`
- **功能**: 浏览已发布的问卷心声
- **组件**: `VoicesPage`
- **布局**: `PublicLayout`
- **限制**: 只显示已审核通过的心声

---

### 2. 认证页面 (Auth Pages)

#### 2.1 普通用户登录 `/login`
- **权限要求**: 无
- **功能**: 用户登录、快捷注册入口
- **组件**: `LoginPage`
- **布局**: `PublicLayout`
- **特色**: 集成快捷注册功能

#### 2.2 用户注册 `/register`
- **权限要求**: 无
- **功能**: 用户注册
- **组件**: `RegisterPage`
- **布局**: `PublicLayout`

#### 2.3 审核员登录 `/reviewer/login`
- **权限要求**: 无
- **功能**: 审核员专用登录
- **组件**: `ReviewerLoginPage`
- **布局**: `RoleBasedLayout(reviewer)`
- **安全**: 独立登录入口，严格身份验证

#### 2.4 管理员登录 `/admin/login`
- **权限要求**: 无
- **功能**: 管理员专用登录
- **组件**: `AdminLoginPage`
- **布局**: `RoleBasedLayout(admin)`
- **安全**: 最高安全级别，多重验证

---

### 3. 用户页面 (User Pages)

#### 3.1 问卷填写 `/questionnaire`
- **权限要求**: `create_questionnaire`
- **功能**: 填写就业问卷调查
- **组件**: `QuestionnairePage`
- **布局**: `UserLayout`
- **支持**: 匿名用户和注册用户

#### 3.2 个人中心 `/profile`
- **权限要求**: `view_own_submissions`
- **功能**: 个人信息管理、数据统计
- **组件**: `ProfilePage` (待创建)
- **布局**: `UserLayout`
- **限制**: 仅注册用户

#### 3.3 我的提交记录 `/my-submissions`
- **权限要求**: `view_own_submissions`
- **功能**: 查看个人提交的问卷、故事、心声
- **组件**: `MySubmissionsPage` (待创建)
- **布局**: `UserLayout`

#### 3.4 发布故事 `/stories/create`
- **权限要求**: `create_story`
- **功能**: 发布就业故事
- **组件**: `CreateStoryPage` (待创建)
- **布局**: `UserLayout`

#### 3.5 发表心声 `/voices/create`
- **权限要求**: `create_voice`
- **功能**: 发表问卷心声
- **组件**: `CreateVoicePage` (待创建)
- **布局**: `UserLayout`

---

### 4. 审核员页面 (Reviewer Pages)

#### 4.1 审核工作台 `/reviewer` & `/reviewer/dashboard`
- **权限要求**: `review_questionnaires`
- **功能**: 审核工作概览、待审核统计
- **组件**: `ReviewerDashboard` ✅
- **布局**: `ReviewerLayout`
- **特色**: 工作进度跟踪、快捷操作

#### 4.2 问卷审核 `/reviewer/questionnaires`
- **权限要求**: `review_questionnaires`
- **功能**: 审核用户提交的问卷
- **组件**: `QuestionnaireReviewPage` (待创建)
- **布局**: `ReviewerLayout`

#### 4.3 故事审核 `/reviewer/stories`
- **权限要求**: `review_stories`
- **功能**: 审核用户发布的故事
- **组件**: `StoryReviewPage` (待创建)
- **布局**: `ReviewerLayout`

#### 4.4 心声审核 `/reviewer/voices`
- **权限要求**: `review_voices`
- **功能**: 审核用户发表的心声
- **组件**: `VoiceReviewPage` (待创建)
- **布局**: `ReviewerLayout`

#### 4.5 审核历史 `/reviewer/history`
- **权限要求**: `view_review_history`
- **功能**: 查看审核历史记录
- **组件**: `ReviewHistoryPage` (待创建)
- **布局**: `ReviewerLayout`

---

### 5. 管理员页面 (Admin Pages)

#### 5.1 管理控制台 `/admin`
- **权限要求**: `manage_users`
- **功能**: 管理员仪表板、系统概览
- **组件**: `DashboardPage` ✅
- **布局**: `AdminLayout`

#### 5.2 用户管理 `/admin/users`
- **权限要求**: `manage_users`
- **功能**: 用户账号管理、权限分配
- **组件**: `UserManagementPage` ✅
- **布局**: `AdminLayout`

#### 5.3 审核员管理 `/admin/reviewers`
- **权限要求**: `manage_reviewers`
- **功能**: 审核员账号管理、工作分配
- **组件**: `ReviewerManagementPage` (待创建)
- **布局**: `AdminLayout`

#### 5.4 内容管理 `/admin/content`
- **权限要求**: `manage_system`
- **功能**: 内容审核、批量操作
- **组件**: `ContentManagementPage` ✅
- **布局**: `AdminLayout`

#### 5.5 系统设置 `/admin/system`
- **权限要求**: `manage_system`
- **功能**: 系统配置、参数设置
- **组件**: `SystemManagementPage` ✅
- **布局**: `AdminLayout`

#### 5.6 API与数据管理 `/admin/api-data`
- **权限要求**: `manage_api`
- **功能**: API接口管理、数据库监控
- **组件**: `ApiDataPage` ✅
- **布局**: `AdminLayout`

#### 5.7 系统日志 `/admin/logs`
- **权限要求**: `view_logs`
- **功能**: 系统日志查看、审计追踪
- **组件**: `SystemLogsPage` (待创建)
- **布局**: `AdminLayout`

---

## 权限隔离策略

### 路由级隔离
```typescript
// 公开路由 - 无需权限
PublicRouteGuard: [/, /analytics, /stories, /voices, /login, /register]

// 用户路由 - 需要登录
UserRouteGuard: [/questionnaire, /profile, /my-submissions, /stories/create, /voices/create]

// 审核员路由 - 需要reviewer权限
ReviewerRouteGuard: [/reviewer/*, /reviewer/login]

// 管理员路由 - 需要admin权限
AdminRouteGuard: [/admin/*, /admin/login]
```

### 组件级隔离
```typescript
// 权限检查组件
<PermissionGuard permission="review_questionnaires">
  <QuestionnaireReviewComponent />
</PermissionGuard>

// 角色检查组件
<PermissionGuard role="admin">
  <AdminOnlyComponent />
</PermissionGuard>
```

### 数据级隔离
- **审核员**: 只能访问待审核的内容
- **管理员**: 可以访问所有数据
- **用户**: 只能访问自己的数据
- **访客**: 只能访问公开数据

---

## 导航结构

### 普通用户导航
```
首页 | 问卷调查 | 数据可视化 | 故事墙 | 问卷心声 | 个人中心
```

### 审核员导航
```
审核工作台 | 问卷审核 | 故事审核 | 心声审核 | 审核历史
```

### 管理员导航
```
管理控制台 | 用户管理 | 审核员管理 | 内容管理 | 系统设置 | API管理
```

---

## 待创建页面清单

### 用户页面
- [ ] `ProfilePage` - 个人中心
- [ ] `MySubmissionsPage` - 我的提交记录
- [ ] `CreateStoryPage` - 发布故事
- [ ] `CreateVoicePage` - 发表心声

### 审核员页面
- [ ] `QuestionnaireReviewPage` - 问卷审核
- [ ] `StoryReviewPage` - 故事审核
- [ ] `VoiceReviewPage` - 心声审核
- [ ] `ReviewHistoryPage` - 审核历史

### 管理员页面
- [ ] `ReviewerManagementPage` - 审核员管理
- [ ] `SystemLogsPage` - 系统日志

---

## 安全考虑

### 前端安全
- 路由守卫防止未授权访问
- 组件级权限检查
- 敏感信息隐藏

### 后端安全
- JWT令牌验证
- 角色权限中间件
- API接口权限检查

### 数据安全
- 用户数据隔离
- 审核流程控制
- 操作日志记录
