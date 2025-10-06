# 用户画像管理功能集成文档

## 📋 概述

本文档记录了用户画像管理功能在管理员后台的集成情况。

## ✅ 已完成的工作

### 1. 后端API端点 (`backend/src/routes/user-profile-management.ts`)

创建了以下管理员API端点：

#### 1.1 获取标签统计
```
GET /api/admin/user-profile/tag-statistics
```
**参数**:
- `questionnaire_id` (必需): 问卷ID
- `category` (可选): 标签分类
- `limit` (可选): 返回数量限制

**返回**: 标签统计数据列表

#### 1.2 获取情绪统计
```
GET /api/admin/user-profile/emotion-statistics
```
**参数**:
- `questionnaire_id` (必需): 问卷ID

**返回**: 情绪统计数据列表

#### 1.3 获取用户画像概览
```
GET /api/admin/user-profile/overview
```
**参数**:
- `questionnaire_id` (必需): 问卷ID

**返回**: 包含总响应数、标签统计、情绪统计、热门标签和情绪分布的综合数据

#### 1.4 获取标签分类
```
GET /api/admin/user-profile/categories
```
**参数**:
- `questionnaire_id` (必需): 问卷ID

**返回**: 标签分类列表及其统计信息

### 2. 前端管理页面 (`reviewer-admin-dashboard/src/pages/AdminUserProfileManagement.tsx`)

创建了完整的用户画像管理页面，包含：

#### 2.1 功能特性
- ✅ 标签统计表格（支持排序、分页）
- ✅ 情绪分析统计卡片
- ✅ 总体数据概览（响应数、标签数、分类数、情绪类型数）
- ✅ 筛选器（问卷选择、标签分类筛选）
- ✅ 数据刷新功能
- ✅ 导出数据按钮（待实现）

#### 2.2 UI组件
- 标签排名展示（前3名显示奖杯图标）
- 进度条显示标签占比
- 情绪类型卡片（带颜色区分）
- 响应式布局（支持移动端）

### 3. 路由集成

#### 3.1 后端路由 (`backend/src/index.ts`)
```typescript
import userProfileManagement from './routes/user-profile-management';
api.route('/admin/user-profile', userProfileManagement);
```

#### 3.2 前端路由 (`reviewer-admin-dashboard/src/App.tsx`)
```typescript
import AdminUserProfileManagement from './pages/AdminUserProfileManagement';
<Route path="user-profile-management" element={<AdminUserProfileManagement />} />
```

### 4. 菜单集成 (`reviewer-admin-dashboard/src/components/layout/DashboardLayout.tsx`)

在管理员菜单中添加了"用户画像管理"入口：

**超级管理员菜单**:
```typescript
{
  key: '/admin/user-profile-management',
  icon: <UserOutlined />,
  label: '用户画像管理',
}
```

**普通管理员菜单**:
```typescript
{
  key: '/admin/user-profile-management',
  icon: <UserOutlined />,
  label: '用户画像管理',
}
```

## 🔧 技术实现

### 数据库表

使用现有的数据库表：

1. **questionnaire_tag_statistics** - 标签统计表
   - `questionnaire_id`: 问卷ID
   - `tag_key`: 标签键
   - `tag_name`: 标签名
   - `tag_category`: 标签分类
   - `count`: 出现次数
   - `percentage`: 占比
   - `last_updated`: 最后更新时间

2. **questionnaire_emotion_statistics** - 情绪统计表
   - `questionnaire_id`: 问卷ID
   - `emotion_type`: 情绪类型
   - `count`: 出现次数
   - `percentage`: 占比
   - `last_updated`: 最后更新时间

### 权限控制

所有API端点都使用 `adminAuthMiddleware` 进行权限验证，确保只有管理员可以访问。

## 📊 数据流程

```
用户提交问卷
    ↓
生成用户标签（60+规则）
    ↓
更新 questionnaire_tag_statistics 表
    ↓
分析情绪倾向
    ↓
更新 questionnaire_emotion_statistics 表
    ↓
管理员通过后台查看统计数据
```

## 🎯 使用方法

### 访问路径

1. 登录管理员后台
2. 在左侧菜单中点击"用户画像管理"
3. 选择问卷ID（默认：questionnaire-v2-2024）
4. 可选：筛选标签分类
5. 查看标签统计和情绪分析数据

### 功能说明

#### 标签统计表
- 显示所有标签的排名、名称、分类、数量和占比
- 支持按数量或占比排序
- 前3名标签显示奖杯图标
- 每页显示20条，支持分页

#### 情绪分析
- 显示4种情绪类型的统计
  - 积极乐观（绿色）
  - 平和中性（蓝色）
  - 焦虑压力（橙色）
  - 严重焦虑（红色）
- 每种情绪显示数量、占比和进度条

## 🚀 后续优化建议

### 1. 数据导出功能
- [ ] 实现CSV导出
- [ ] 实现Excel导出
- [ ] 支持自定义导出字段

### 2. 数据可视化
- [ ] 添加标签云图
- [ ] 添加情绪分布饼图
- [ ] 添加趋势折线图（时间维度）

### 3. 高级筛选
- [ ] 日期范围筛选
- [ ] 多标签组合筛选
- [ ] 情绪类型筛选

### 4. 实时更新
- [ ] WebSocket实时推送新数据
- [ ] 自动刷新功能
- [ ] 数据变化提醒

### 5. 数据分析
- [ ] 标签关联分析
- [ ] 用户群体画像
- [ ] 情绪趋势预测

## 📝 测试清单

- [ ] 后端API端点测试
  - [ ] 标签统计API
  - [ ] 情绪统计API
  - [ ] 概览API
  - [ ] 分类API
- [ ] 前端页面测试
  - [ ] 页面加载
  - [ ] 数据展示
  - [ ] 筛选功能
  - [ ] 排序功能
  - [ ] 分页功能
- [ ] 权限测试
  - [ ] 管理员访问
  - [ ] 非管理员拒绝访问
- [ ] 响应式测试
  - [ ] 桌面端显示
  - [ ] 平板端显示
  - [ ] 移动端显示

## 🔗 相关文档

- [用户画像系统实现总结](./USER_PROFILE_IMPLEMENTATION_SUMMARY.md)
- [用户画像实现计划V2](./USER_PROFILE_IMPLEMENTATION_PLAN_V2.md)
- [问卷组合分析](../questionnaire-combinations-analysis.md)

## 📅 更新日志

### 2025-10-05
- ✅ 创建后端API端点
- ✅ 创建前端管理页面
- ✅ 集成到管理员菜单
- ✅ 添加路由配置
- ✅ 编写集成文档

