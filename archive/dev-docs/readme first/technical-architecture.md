# 技术架构详解 V1

## 🎯 架构设计原则

- **微服务架构**: 模块化、可扩展的服务设计
- **云原生**: 充分利用云平台能力
- **性能优先**: 高性能、低延迟的用户体验
- **安全第一**: 多层次的安全防护
- **可维护性**: 清晰的代码结构和文档
- **可观测性**: 完善的监控和日志系统

## 🏗️ 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
├─────────────────────────────────────────────────────────────┤
│  Web浏览器  │  移动端  │  API客户端  │  管理后台  │  监控面板  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CDN + 负载均衡                          │
│                   (Cloudflare)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      前端应用层                              │
│                   (React + Vite)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API网关层                               │
│                 (Cloudflare Workers)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      业务服务层                              │
│  认证服务  │  问卷服务  │  审核服务  │  分析服务  │  通知服务  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                              │
│    D1数据库    │    R2存储    │    KV缓存    │    队列      │
└─────────────────────────────────────────────────────────────┘
```

## 🖥️ 前端架构

### 技术栈选择
```typescript
// 核心框架
{
  "react": "^18.2.0",           // UI框架
  "typescript": "^5.0.0",       // 类型系统
  "vite": "^4.4.0",            // 构建工具
  "react-router-dom": "^6.8.0", // 路由管理
}

// 状态管理
{
  "zustand": "^4.4.0",         // 轻量级状态管理
  "@tanstack/react-query": "^4.29.0", // 服务端状态管理
}

// UI组件库
{
  "antd": "^5.8.0",            // 企业级UI组件
  "tailwindcss": "^3.3.0",    // 原子化CSS
  "@ant-design/icons": "^5.2.0", // 图标库
}

// 图表和可视化
{
  "echarts": "^5.4.0",         // 图表库
  "echarts-for-react": "^3.0.0", // React封装
}

// 工具库
{
  "axios": "^1.4.0",           // HTTP客户端
  "dayjs": "^1.11.0",          // 日期处理
  "lodash-es": "^4.17.0",      // 工具函数
}
```

### 项目结构
```
frontend/
├── src/
│   ├── components/           # 通用组件
│   │   ├── ui/              # 基础UI组件
│   │   ├── forms/           # 表单组件
│   │   ├── charts/          # 图表组件
│   │   └── layout/          # 布局组件
│   ├── pages/               # 页面组件
│   │   ├── public/          # 公开页面
│   │   ├── admin/           # 管理页面
│   │   └── auth/            # 认证页面
│   ├── hooks/               # 自定义Hooks
│   │   ├── useAuth.ts       # 认证Hook
│   │   ├── usePermission.ts # 权限Hook
│   │   └── useApi.ts        # API Hook
│   ├── stores/              # 状态管理
│   │   ├── authStore.ts     # 认证状态
│   │   ├── uiStore.ts       # UI状态
│   │   └── dataStore.ts     # 数据状态
│   ├── services/            # API服务
│   │   ├── api.ts           # API客户端
│   │   ├── auth.ts          # 认证服务
│   │   └── questionnaire.ts # 问卷服务
│   ├── utils/               # 工具函数
│   │   ├── request.ts       # 请求封装
│   │   ├── validation.ts    # 表单验证
│   │   └── format.ts        # 数据格式化
│   ├── types/               # 类型定义
│   │   ├── api.ts           # API类型
│   │   ├── user.ts          # 用户类型
│   │   └── questionnaire.ts # 问卷类型
│   └── assets/              # 静态资源
├── public/                  # 公共资源
└── package.json
```

### 状态管理架构
```typescript
// 认证状态管理
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// UI状态管理
interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  loading: boolean;
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  showNotification: (notification: Notification) => void;
}
```

## ⚙️ 后端架构

### 技术栈选择
```typescript
// 运行时环境
{
  "@cloudflare/workers-types": "^4.20230518.0", // Workers类型
  "hono": "^3.4.0",                             // Web框架
}

// 数据库和存储
{
  "@cloudflare/d1": "^1.0.0",    // D1数据库
  "@cloudflare/r2": "^1.0.0",    // R2对象存储
  "@cloudflare/kv": "^1.0.0",    // KV键值存储
}

// 认证和安全
{
  "jsonwebtoken": "^9.0.0",      // JWT令牌
  "bcryptjs": "^2.4.0",          // 密码哈希
  "zod": "^3.21.0",              // 数据验证
}

// 工具库
{
  "date-fns": "^2.30.0",         // 日期处理
  "uuid": "^9.0.0",              // UUID生成
}
```

### 服务架构
```
backend/
├── src/
│   ├── routes/                 # 路由处理
│   │   ├── auth.ts            # 认证路由
│   │   ├── questionnaire.ts   # 问卷路由
│   │   ├── admin.ts           # 管理路由
│   │   └── analytics.ts       # 分析路由
│   ├── middleware/             # 中间件
│   │   ├── auth.ts            # 认证中间件
│   │   ├── cors.ts            # CORS中间件
│   │   ├── rateLimit.ts       # 限流中间件
│   │   └── validation.ts      # 验证中间件
│   ├── services/               # 业务服务
│   │   ├── AuthService.ts     # 认证服务
│   │   ├── QuestionnaireService.ts # 问卷服务
│   │   ├── ReviewService.ts   # 审核服务
│   │   └── AnalyticsService.ts # 分析服务
│   ├── models/                 # 数据模型
│   │   ├── User.ts            # 用户模型
│   │   ├── Questionnaire.ts   # 问卷模型
│   │   └── Review.ts          # 审核模型
│   ├── utils/                  # 工具函数
│   │   ├── database.ts        # 数据库工具
│   │   ├── validation.ts      # 验证工具
│   │   └── encryption.ts      # 加密工具
│   ├── types/                  # 类型定义
│   │   ├── api.ts             # API类型
│   │   ├── database.ts        # 数据库类型
│   │   └── environment.ts     # 环境类型
│   └── index.ts               # 入口文件
├── migrations/                 # 数据库迁移
├── wrangler.toml              # Cloudflare配置
└── package.json
```

### API设计模式
```typescript
// 控制器模式
class QuestionnaireController {
  constructor(
    private questionnaireService: QuestionnaireService,
    private authService: AuthService
  ) {}

  async create(c: Context) {
    const user = await this.authService.getCurrentUser(c);
    const data = await c.req.json();
    
    const questionnaire = await this.questionnaireService.create(data, user);
    
    return c.json({
      success: true,
      data: questionnaire
    });
  }
}

// 服务层模式
class QuestionnaireService {
  constructor(private db: D1Database) {}

  async create(data: CreateQuestionnaireRequest, user?: User) {
    const questionnaire = {
      id: generateUUID(),
      ...data,
      userId: user?.id,
      createdAt: new Date().toISOString()
    };

    await this.db.prepare(`
      INSERT INTO questionnaire_responses (...)
      VALUES (...)
    `).bind(...Object.values(questionnaire)).run();

    return questionnaire;
  }
}
```

## 🗄️ 数据架构

### 数据库设计
```sql
-- 主要表结构
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questionnaire_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  education_level TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_questionnaire_status ON questionnaire_responses(status);
CREATE INDEX idx_questionnaire_created ON questionnaire_responses(created_at);
```

### 缓存策略
```typescript
// 多层缓存架构
interface CacheStrategy {
  // L1: 内存缓存 (Workers内存)
  memory: Map<string, any>;
  
  // L2: KV缓存 (Cloudflare KV)
  kv: KVNamespace;
  
  // L3: 数据库缓存 (D1查询缓存)
  database: D1Database;
}

// 缓存使用示例
async function getCachedData(key: string): Promise<any> {
  // 1. 检查内存缓存
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  
  // 2. 检查KV缓存
  const kvData = await KV.get(key);
  if (kvData) {
    memoryCache.set(key, kvData);
    return kvData;
  }
  
  // 3. 查询数据库
  const dbData = await database.query(key);
  if (dbData) {
    await KV.put(key, dbData, { expirationTtl: 3600 });
    memoryCache.set(key, dbData);
    return dbData;
  }
  
  return null;
}
```

## 🔐 安全架构

### 认证和授权
```typescript
// JWT令牌结构
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

// 权限检查中间件
async function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const token = extractToken(c);
    const payload = verifyToken(token);
    
    if (!hasPermission(payload.permissions, permission)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    c.set('user', payload);
    await next();
  };
}
```

### 数据安全
```typescript
// 数据脱敏
function sanitizeUserData(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    // 移除敏感信息
    // email: user.email,
    // password: user.password
  };
}

// 输入验证
const questionnaireSchema = z.object({
  educationLevel: z.string().min(1).max(50),
  content: z.string().min(10).max(5000),
  isAnonymous: z.boolean()
});
```

## 📊 监控和日志

### 应用监控
```typescript
// 性能监控
interface PerformanceMetrics {
  requestDuration: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
}

// 业务监控
interface BusinessMetrics {
  questionnaireSubmissions: number;
  userRegistrations: number;
  reviewCompletions: number;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
}
```

### 日志系统
```typescript
// 结构化日志
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  userId?: string;
  requestId: string;
  metadata?: Record<string, any>;
}

// 日志记录器
class Logger {
  static info(message: string, metadata?: any) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      metadata
    }));
  }
}
```

## 🚀 部署架构

### 环境配置
```typescript
// 环境变量管理
interface Environment {
  NODE_ENV: 'development' | 'staging' | 'production';
  DATABASE_URL: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string[];
  RATE_LIMIT: number;
}

// 配置管理
const config = {
  development: {
    apiUrl: 'http://localhost:8787',
    logLevel: 'debug'
  },
  production: {
    apiUrl: 'https://api.employment-survey.com',
    logLevel: 'info'
  }
};
```

### CI/CD流程
```yaml
# GitHub Actions示例
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to Cloudflare
        run: npx wrangler publish
```

---

*此技术架构确保系统的高性能、高可用性和可扩展性，为项目的长期发展提供坚实的技术基础。*
