# 前端页面规划 V1

## 🎯 设计原则

- **用户体验优先**: 简洁直观的界面设计
- **响应式设计**: 支持桌面端和移动端
- **组件化开发**: 可复用的UI组件
- **性能优化**: 懒加载和代码分割
- **无障碍访问**: 符合WCAG 2.1标准
- **SEO友好**: 合理的页面结构和元数据

## 📱 页面架构

### 路由结构
```
/                           # 首页
├── /questionnaire          # 问卷填写
├── /success               # 提交成功
├── /visualization         # 数据可视化
├── /voices               # 问卷心声
├── /stories              # 就业故事
├── /about                # 关于我们
├── /privacy              # 隐私政策
├── /terms                # 使用条款
└── /admin                # 管理后台
    ├── /dashboard        # 仪表盘
    ├── /questionnaires   # 问卷管理
    ├── /voices           # 心声管理
    ├── /stories          # 故事管理
    ├── /users            # 用户管理
    ├── /reviews          # 审核管理
    ├── /analytics        # 数据分析
    └── /settings         # 系统设置
```

## 🏠 公共页面

### 1. 首页 (HomePage)
**路径**: `/`
**功能**: 平台介绍和导航入口

**组件结构**:
```tsx
HomePage
├── HeroSection          # 主横幅
├── FeatureSection       # 功能介绍
├── StatsSection         # 数据统计
├── TestimonialSection   # 用户反馈
└── CTASection          # 行动号召
```

**关键功能**:
- 平台介绍和价值主张
- 实时统计数据展示
- 快速导航到核心功能
- 响应式设计适配

### 2. 问卷填写页 (QuestionnairePage)
**路径**: `/questionnaire`
**功能**: 用户填写就业问卷

**组件结构**:
```tsx
QuestionnairePage
├── ProgressIndicator    # 进度指示器
├── QuestionnaireForm    # 问卷表单
│   ├── BasicInfoStep    # 基本信息
│   ├── EducationStep    # 教育背景
│   ├── EmploymentStep   # 就业状况
│   └── AdviceStep       # 建议和观察
├── FormValidation       # 表单验证
└── SubmitButton        # 提交按钮
```

**关键功能**:
- 分步骤表单填写
- 实时表单验证
- 本地数据暂存
- 匿名提交支持
- 进度保存和恢复

### 3. 提交成功页 (SuccessPage)
**路径**: `/success`
**功能**: 确认提交成功

**组件结构**:
```tsx
SuccessPage
├── SuccessMessage       # 成功消息
├── NextStepsGuide      # 后续指引
├── ShareButtons        # 分享按钮
└── RelatedLinks        # 相关链接
```

### 4. 数据可视化页 (VisualizationPage)
**路径**: `/visualization`
**功能**: 展示就业数据分析

**组件结构**:
```tsx
VisualizationPage
├── FilterPanel         # 筛选面板
├── ChartContainer      # 图表容器
│   ├── EducationChart  # 教育水平分布
│   ├── RegionChart     # 地区分布
│   ├── EmploymentChart # 就业状况
│   └── TrendChart      # 趋势分析
├── InsightPanel        # 洞察面板
└── ExportButton        # 导出功能
```

**关键功能**:
- 多维度数据筛选
- 交互式图表展示
- 数据洞察生成
- 图表导出功能

### 5. 问卷心声页 (VoicesPage)
**路径**: `/voices`
**功能**: 展示用户分享的心声

**组件结构**:
```tsx
VoicesPage
├── FilterTabs          # 分类筛选
├── VoiceCard           # 心声卡片
│   ├── VoiceContent    # 心声内容
│   ├── VoiceMetadata   # 元数据
│   └── InteractionBar  # 互动按钮
├── PaginationBar       # 分页组件
└── SubmitVoiceButton   # 提交心声
```

**关键功能**:
- 心声内容展示
- 分类和筛选
- 点赞和分享
- 分页加载

## 🔐 管理后台

### 1. 管理员仪表盘 (AdminDashboard)
**路径**: `/admin/dashboard`
**功能**: 系统概览和快速操作

**组件结构**:
```tsx
AdminDashboard
├── StatsGrid           # 统计卡片网格
│   ├── QuestionnaireStats
│   ├── VoiceStats
│   ├── UserStats
│   └── ReviewStats
├── RecentActivity      # 最近活动
├── QuickActions        # 快速操作
└── SystemHealth        # 系统健康状态
```

### 2. 问卷管理页 (QuestionnaireManagement)
**路径**: `/admin/questionnaires`
**功能**: 管理问卷响应

**组件结构**:
```tsx
QuestionnaireManagement
├── FilterBar           # 筛选栏
├── QuestionnaireTable  # 问卷表格
│   ├── TableHeader     # 表头
│   ├── TableRow        # 表格行
│   └── ActionButtons   # 操作按钮
├── BulkActions         # 批量操作
├── ExportButton        # 导出功能
└── PaginationBar       # 分页
```

### 3. 审核管理页 (ReviewManagement)
**路径**: `/admin/reviews`
**功能**: 内容审核工作台

**组件结构**:
```tsx
ReviewManagement
├── ReviewQueue         # 审核队列
├── ReviewPanel         # 审核面板
│   ├── ContentPreview  # 内容预览
│   ├── ReviewForm      # 审核表单
│   └── ActionButtons   # 审核操作
├── ReviewHistory       # 审核历史
└── ReviewerStats       # 审核员统计
```

### 4. 用户管理页 (UserManagement)
**路径**: `/admin/users`
**功能**: 用户账户管理

**组件结构**:
```tsx
UserManagement
├── UserTable           # 用户表格
├── UserDetail          # 用户详情
├── RoleManagement      # 角色管理
├── PermissionMatrix    # 权限矩阵
└── UserActions         # 用户操作
```

## 🧩 通用组件

### 布局组件
```tsx
// 主布局
Layout
├── Header              # 页头
│   ├── Logo            # 标志
│   ├── Navigation      # 导航菜单
│   └── UserMenu        # 用户菜单
├── Sidebar             # 侧边栏 (管理后台)
├── Main                # 主内容区
└── Footer              # 页脚

// 页面容器
PageContainer
├── Breadcrumb          # 面包屑导航
├── PageHeader          # 页面标题
├── PageContent         # 页面内容
└── PageActions         # 页面操作
```

### 表单组件
```tsx
// 表单组件
FormComponents
├── FormField           # 表单字段
├── FormValidation      # 表单验证
├── FormWizard          # 分步表单
├── FormAutoSave        # 自动保存
└── FormSubmit          # 表单提交
```

### 数据展示组件
```tsx
// 数据组件
DataComponents
├── DataTable           # 数据表格
├── DataChart           # 数据图表
├── DataCard            # 数据卡片
├── DataFilter          # 数据筛选
└── DataExport          # 数据导出
```

### 交互组件
```tsx
// 交互组件
InteractionComponents
├── Modal               # 模态框
├── Drawer              # 抽屉
├── Tooltip             # 提示框
├── Notification        # 通知
└── Loading             # 加载状态
```

## 📱 响应式设计

### 断点设置
```css
/* 移动端 */
@media (max-width: 768px) { }

/* 平板端 */
@media (min-width: 769px) and (max-width: 1024px) { }

/* 桌面端 */
@media (min-width: 1025px) { }
```

### 适配策略
- **移动优先**: 从移动端开始设计
- **渐进增强**: 逐步增加桌面端功能
- **触摸友好**: 适合触摸操作的界面
- **性能优化**: 移动端性能优化

## 🎨 设计系统

### 色彩方案
```css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #f5222d;
  --text-primary: #262626;
  --text-secondary: #8c8c8c;
  --background-color: #f5f5f5;
  --border-color: #d9d9d9;
}
```

### 字体系统
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-xxl: 24px;
}
```

### 间距系统
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
}
```

## 🚀 性能优化

### 代码分割
- 路由级别的懒加载
- 组件级别的动态导入
- 第三方库的按需加载

### 资源优化
- 图片懒加载和压缩
- CSS和JS文件压缩
- 字体文件优化
- CDN资源加速

### 缓存策略
- 浏览器缓存配置
- Service Worker缓存
- API响应缓存
- 静态资源缓存

## 🔍 SEO优化

### 页面元数据
```tsx
// 页面SEO配置
interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonical: string;
}
```

### 结构化数据
- JSON-LD格式的结构化数据
- 面包屑导航标记
- 文章内容标记
- 组织信息标记

---

*此规划确保前端应用的用户体验、性能和可维护性，为开发团队提供清晰的实现指导。*
