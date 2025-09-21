# 🏗️ 系统架构设计

## 📋 架构概述

大学生就业问卷调查平台采用现代化的前后端分离架构，基于云原生技术栈构建，确保高性能、高可用性和良好的用户体验。

## 🎯 设计原则

### 核心原则
- **模块化设计**: 功能模块独立，便于维护和扩展
- **类型安全**: 全栈TypeScript，减少运行时错误
- **性能优先**: 优化加载速度和响应时间
- **用户体验**: 直观的界面和流畅的交互
- **安全可靠**: 多层安全防护和数据保护

### 技术选型原则
- **成熟稳定**: 选择经过验证的技术栈
- **开发效率**: 提高开发和维护效率
- **部署简单**: 支持自动化部署和运维
- **成本控制**: 合理的技术成本

## 🏗️ 整体架构

### 系统架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户界面层     │    │    业务逻辑层    │    │    数据存储层    │
│  (Frontend)     │    │   (Backend)     │    │   (Database)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ React 18.3.1    │    │ Hono.js 4.5.8   │    │ Cloudflare D1   │
│ TypeScript 5.5  │    │ TypeScript 5.5  │    │ SQLite          │
│ Vite 5.4.3      │    │ Node.js 18+     │    │ MockDatabase    │
│ Ant Design 5.21 │    │ JWT Auth        │    │ (Development)   │
│ Tailwind CSS    │    │ RESTful API     │    │                 │
│ Zustand         │    │ Middleware      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    部署平台     │
                    │  (Cloudflare)   │
                    ├─────────────────┤
                    │ Pages (前端)    │
                    │ Workers (后端)  │
                    │ D1 (数据库)     │
                    │ R2 (存储)       │
                    └─────────────────┘
```

## 🎨 前端架构

### 技术栈
- **框架**: React 18.3.1 + TypeScript 5.5.4
- **构建工具**: Vite 5.4.3
- **UI库**: Ant Design 5.21.4
- **样式**: Tailwind CSS + CSS Modules
- **状态管理**: Zustand
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **图表库**: ECharts

### 目录结构
```
frontend/src/
├── 📁 components/          # 可复用组件
│   ├── common/            # 通用组件
│   ├── forms/             # 表单组件
│   ├── charts/            # 图表组件
│   └── layout/            # 布局组件
├── 📁 pages/              # 页面组件
│   ├── questionnaire/     # 问卷页面
│   ├── admin/             # 管理页面
│   ├── auth/              # 认证页面
│   └── analytics/         # 分析页面
├── 📁 services/           # API服务
│   ├── api.ts             # API客户端
│   ├── auth.ts            # 认证服务
│   └── questionnaire.ts   # 问卷服务
├── 📁 stores/             # 状态管理
│   ├── authStore.ts       # 认证状态
│   ├── questionnaireStore.ts # 问卷状态
│   └── uiStore.ts         # UI状态
├── 📁 types/              # TypeScript类型
│   ├── api.ts             # API类型
│   ├── questionnaire.ts   # 问卷类型
│   └── user.ts            # 用户类型
├── 📁 utils/              # 工具函数
│   ├── validation.ts      # 验证工具
│   ├── format.ts          # 格式化工具
│   └── constants.ts       # 常量定义
└── 📁 assets/             # 静态资源
    ├── images/            # 图片资源
    ├── icons/             # 图标资源
    └── styles/            # 样式文件
```

### 组件架构
```
App
├── Router
│   ├── PublicRoutes
│   │   ├── HomePage
│   │   ├── QuestionnairePage
│   │   ├── StoriesPage
│   │   └── VoicesPage
│   ├── AuthRoutes
│   │   ├── LoginPage
│   │   └── RegisterPage
│   └── ProtectedRoutes
│       ├── AdminDashboard
│       ├── DataAnalytics
│       └── UserManagement
├── Layout
│   ├── Header
│   ├── Navigation
│   ├── Sidebar
│   └── Footer
└── Providers
    ├── AuthProvider
    ├── ThemeProvider
    └── ErrorBoundary
```

## ⚙️ 后端架构

### 技术栈
- **框架**: Hono.js 4.5.8
- **运行时**: Node.js 18+ (开发) / Cloudflare Workers (生产)
- **语言**: TypeScript 5.5.4
- **数据库**: MockDatabase (开发) / Cloudflare D1 (生产)
- **认证**: JWT Token
- **API规范**: RESTful

### 目录结构
```
backend/src/
├── 📁 routes/             # API路由
│   ├── auth.ts            # 认证路由
│   ├── questionnaire.ts   # 问卷路由
│   ├── universal-questionnaire.ts # 通用问卷路由
│   ├── admin.ts           # 管理路由
│   └── analytics.ts       # 分析路由
├── 📁 middleware/         # 中间件
│   ├── auth.ts            # 认证中间件
│   ├── cors.ts            # CORS中间件
│   ├── validation.ts      # 验证中间件
│   └── error.ts           # 错误处理中间件
├── 📁 db/                 # 数据库服务
│   ├── index.ts           # 数据库服务
│   ├── schema.ts          # 数据库模式
│   └── migrations/        # 数据库迁移
├── 📁 services/           # 业务服务
│   ├── authService.ts     # 认证服务
│   ├── questionnaireService.ts # 问卷服务
│   └── analyticsService.ts # 分析服务
├── 📁 types/              # TypeScript类型
│   ├── api.ts             # API类型
│   ├── database.ts        # 数据库类型
│   └── auth.ts            # 认证类型
├── 📁 utils/              # 工具函数
│   ├── jwt.ts             # JWT工具
│   ├── validation.ts      # 验证工具
│   └── crypto.ts          # 加密工具
└── index.ts               # 应用入口
```

### API架构
```
Hono App
├── Global Middleware
│   ├── CORS
│   ├── Logger
│   ├── Error Handler
│   └── Rate Limiter
├── Public Routes
│   ├── /api/health
│   ├── /api/auth/login
│   ├── /api/auth/register
│   └── /api/universal-questionnaire/*
├── Protected Routes
│   ├── /api/auth/profile
│   ├── /api/questionnaire/*
│   ├── /api/admin/*
│   └── /api/analytics/*
└── Route Handlers
    ├── Request Validation
    ├── Business Logic
    ├── Database Operations
    └── Response Formatting
```

## 💾 数据架构

### 数据库设计
```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通用问卷响应表
CREATE TABLE universal_questionnaire_responses (
  id INTEGER PRIMARY KEY,
  questionnaire_id TEXT NOT NULL,
  user_id INTEGER,
  response_data TEXT NOT NULL, -- JSON格式
  submitted_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 审核记录表
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  comments TEXT,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 数据流架构
```
用户输入 → 前端验证 → API请求 → 后端验证 → 数据库存储
    ↓           ↓          ↓          ↓          ↓
  表单组件   Joi/Zod   中间件验证  业务逻辑   SQL操作
    ↓           ↓          ↓          ↓          ↓
  实时反馈   错误提示   HTTP状态码  数据转换   事务处理
```

## 🔐 安全架构

### 认证授权
```
用户请求 → JWT验证 → 权限检查 → 资源访问
    ↓         ↓         ↓         ↓
  Token    解析验证   角色匹配   API响应
    ↓         ↓         ↓         ↓
  刷新机制  过期处理   权限拒绝   安全日志
```

### 安全措施
- **JWT Token**: 无状态认证
- **HTTPS**: 传输加密
- **CORS**: 跨域保护
- **Rate Limiting**: 防止滥用
- **Input Validation**: 输入验证
- **SQL Injection**: 参数化查询
- **XSS Protection**: 内容转义

## 🚀 部署架构

### Cloudflare平台
```
用户请求 → Cloudflare CDN → Pages/Workers → D1数据库
    ↓           ↓              ↓           ↓
  全球加速   边缘缓存      无服务器计算   分布式数据库
    ↓           ↓              ↓           ↓
  DDoS防护   静态资源优化   自动扩缩容   数据同步
```

### 环境配置
- **开发环境**: 本地Node.js + MockDatabase
- **测试环境**: Cloudflare Workers + D1 Staging
- **生产环境**: Cloudflare Workers + D1 Production

## 📊 性能架构

### 前端性能优化
- **代码分割**: 按路由和组件分割
- **懒加载**: 图片和组件懒加载
- **缓存策略**: 浏览器缓存和CDN缓存
- **压缩优化**: Gzip/Brotli压缩
- **Tree Shaking**: 移除未使用代码

### 后端性能优化
- **数据库索引**: 关键字段索引
- **查询优化**: SQL查询优化
- **缓存机制**: Redis缓存
- **连接池**: 数据库连接池
- **异步处理**: 非阻塞I/O

## 🔍 监控架构

### 监控指标
- **性能指标**: 响应时间、吞吐量、错误率
- **业务指标**: 用户活跃度、问卷完成率
- **系统指标**: CPU、内存、网络使用率
- **安全指标**: 异常访问、攻击尝试

### 监控工具
- **Cloudflare Analytics**: 流量和性能监控
- **Sentry**: 错误追踪和性能监控
- **Google Analytics**: 用户行为分析
- **Custom Metrics**: 自定义业务指标

## 🔄 扩展架构

### 水平扩展
- **微服务化**: 按业务域拆分服务
- **负载均衡**: 多实例负载分发
- **数据分片**: 数据库水平分片
- **缓存集群**: 分布式缓存

### 垂直扩展
- **性能优化**: 算法和数据结构优化
- **资源升级**: 增加计算和存储资源
- **架构优化**: 减少网络调用和数据传输

---

**📅 最后更新**: 2025年7月31日  
**🔄 维护人员**: 架构团队  
**📊 版本**: v1.0.0  
**📚 相关文档**: [部署指南](../deployment/README.md) | [API文档](./api-specification.md)
