# 📘 Cloudflare 平台开发规范指南

**版本**: v1.0  
**适用范围**: 基于 Cloudflare 平台的项目开发  
**制定依据**: jiuye-V1 项目开发经验总结  
**更新日期**: 2025-10-06

---

## 🎯 规范目标

本规范旨在为基于 Cloudflare 平台的项目开发提供标准化指导，确保项目的可维护性、安全性、高效性和团队协作的一致性。

---

## 📋 目录

1. [项目架构与技术栈](#1-项目架构与技术栈)
2. [命名规范](#2-命名规范)
3. [安全性与权限管理](#3-安全性与权限管理)
4. [API设计与文档](#4-api设计与文档)
5. [代码质量与规范](#5-代码质量与规范)
6. [数据库设计与管理](#6-数据库设计与管理)
7. [开发与部署流程](#7-开发与部署流程)
8. [文档与知识管理](#8-文档与知识管理)
9. [错误处理与监控](#9-错误处理与监控)
10. [性能优化](#10-性能优化)

---

## 1. 项目架构与技术栈

### 1.1 强制技术栈

#### 前端技术栈
- **语言**: TypeScript (强制)
- **框架**: React 18+ 
- **构建工具**: Vite 5+
- **UI库**: Ant Design 5+ (推荐) 或 Tailwind CSS
- **状态管理**: Zustand (轻量) 或 Redux Toolkit (复杂)
- **路由**: React Router v6+
- **部署**: Cloudflare Pages

#### 后端技术栈
- **运行时**: Cloudflare Workers
- **框架**: Hono.js (推荐) 或 Itty Router
- **语言**: TypeScript (强制)
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2
- **AI服务**: Cloudflare Workers AI
- **认证**: JWT + 权限系统

### 1.2 依赖管理规范

```json
// package.json 示例
{
  "packageManager": "pnpm@10.8.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**规则**:
- 使用 `pnpm` 作为包管理器
- 锁定 Node.js 版本 >= 18.0.0
- 使用 `pnpm-lock.yaml` 锁定依赖版本
- 禁止直接编辑 `package.json` 添加依赖，必须使用 `pnpm add`

### 1.3 项目结构规范

```
project-root/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── stores/          # 状态管理
│   │   ├── types/           # TypeScript类型
│   │   └── utils/           # 工具函数
│   ├── public/              # 静态资源
│   └── wrangler.toml        # Cloudflare Pages配置
├── backend/                 # 后端应用
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── middleware/      # 中间件
│   │   ├── services/        # 业务逻辑
│   │   ├── types/           # TypeScript类型
│   │   └── utils/           # 工具函数
│   └── wrangler.toml        # Cloudflare Workers配置
├── database/                # 数据库相关
│   ├── schemas/             # 数据库架构
│   ├── migrations/          # 迁移脚本
│   └── test-data/           # 测试数据
├── docs/                    # 项目文档
└── package.json             # 根项目配置
```

---

## 2. 命名规范

### 2.1 分层命名规则

#### 数据库层 (snake_case)
```sql
-- 表名
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);
```

#### API层 (snake_case)
```json
{
  "user_id": "123",
  "user_type": "admin", 
  "created_at": "2025-10-06T12:00:00Z",
  "is_active": true
}
```

#### 前端层 (camelCase)
```typescript
interface User {
  userId: string;
  userType: string;
  createdAt: string;
  isActive: boolean;
}
```

### 2.2 字段转换规范

**前端API封装层负责转换**:
```typescript
import humps from "humps";

// 请求时: camelCase → snake_case
const requestData = humps.decamelizeKeys(data);

// 响应时: snake_case → camelCase  
const responseData = humps.camelizeKeys(apiResponse);
```

### 2.3 文件命名规范

```
// 组件文件 - PascalCase
UserProfileManagement.tsx
AdminDashboard.tsx

// 工具文件 - camelCase
apiClient.ts
dataTransform.ts

// 常量文件 - UPPER_CASE
API_ENDPOINTS.ts
CONFIG_CONSTANTS.ts

// 路由文件 - kebab-case
user-profile.ts
admin-management.ts
```

---

## 3. 安全性与权限管理

### 3.1 认证架构

#### 双前端架构
- **用户端**: 半匿名认证 + Google OAuth
- **管理端**: 严格的邮箱白名单 + 2FA + JWT

#### 权限隔离
```typescript
// 权限级别定义
enum UserRole {
  USER = 'user',
  REVIEWER = 'reviewer', 
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// 权限检查中间件
const requireRole = (role: UserRole) => {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole');
    if (!hasPermission(userRole, role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    await next();
  };
};
```

### 3.2 Google OAuth 集成指南

#### 前端 OAuth 服务
基于项目实践的完整 Google OAuth 配置：

```typescript
// frontend/src/services/googleOAuthService.ts
export class GoogleOAuthService {
  private config = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    scope: 'openid email profile'
  };

  async signIn(userType: 'questionnaire' | 'management'): Promise<void> {
    const state = Math.random().toString(36).substring(2);
    const redirectUri = this.getRedirectUri(userType);

    // 保存状态用于验证
    sessionStorage.setItem('google_oauth_state', state);
    sessionStorage.setItem('google_oauth_user_type', userType);

    // 构建授权URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.config.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(this.config.scope)}&` +
      `state=${state}`;

    window.location.href = authUrl;
  }

  private getRedirectUri(userType: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/google/callback/${userType}`;
  }
}
```

#### 后端 OAuth 处理
```typescript
// backend/src/routes/google-auth.ts
export const googleAuth = new Hono<{ Bindings: Env }>();

googleAuth.post('/callback', async (c) => {
  const { code, redirectUri, userType } = await c.req.json();

  try {
    // 交换授权码获取访问令牌
    const tokenData = await exchangeCodeForToken(code, redirectUri, c.env.GOOGLE_CLIENT_SECRET);

    // 获取用户信息
    const googleUser = await verifyGoogleToken(tokenData.access_token);

    // 根据用户类型处理登录逻辑
    if (userType === 'management') {
      return await handleManagementUserCallback(c, googleUser);
    } else {
      return await handleQuestionnaireUserCallback(c, googleUser);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: 'OAuth Error',
      message: error.message || 'OAuth回调处理失败'
    }, 500);
  }
});

// 管理员白名单验证
async function handleManagementUserCallback(c: Context, googleUser: any) {
  const whitelist = await c.env.DB.prepare(
    'SELECT * FROM google_oauth_whitelist WHERE email = ? AND is_active = 1'
  ).bind(googleUser.email).first();

  if (!whitelist) {
    return c.json({
      success: false,
      error: 'Access Denied',
      message: '您的邮箱不在管理员白名单中'
    }, 403);
  }

  // 创建JWT令牌
  const token = await sign({
    userId: whitelist.id,
    email: googleUser.email,
    role: whitelist.role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时
  }, c.env.JWT_SECRET);

  return c.json({
    success: true,
    data: {
      user: {
        id: whitelist.id,
        email: googleUser.email,
        role: whitelist.role,
        displayName: whitelist.display_name || googleUser.name
      },
      token
    },
    message: 'Google登录成功'
  });
}
```

#### 环境变量配置
```toml
# wrangler.toml
[vars]
GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com"

# 使用 wrangler secret 设置敏感信息
# wrangler secret put GOOGLE_CLIENT_SECRET
```

```env
# frontend/.env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

### 3.3 CORS 跨域配置

#### 通用 CORS 中间件
基于项目实践的完整 CORS 解决方案：

```typescript
// backend/src/middleware/cors.ts
import type { Context, Next } from 'hono';

// 检查origin是否匹配通配符模式
function matchesWildcardPattern(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return origin === pattern;
  }

  // 将通配符模式转换为正则表达式
  const regexPattern = pattern
    .replace(/\./g, '\\.')  // 转义点号
    .replace(/\*/g, '.*');  // 将*替换为.*

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(origin);
}

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin');

  // 从环境变量获取允许的源
  const corsOrigin = c.env?.CORS_ORIGIN ||
    'http://localhost:5173,http://localhost:5174,https://*.pages.dev';
  const allowedOrigins = corsOrigin.split(',').map(o => o.trim());

  // 检查是否允许该源
  let isAllowed = false;
  if (origin) {
    // 精确匹配
    if (allowedOrigins.includes(origin)) {
      isAllowed = true;
    }
    // 通配符匹配
    else {
      for (const pattern of allowedOrigins) {
        if (matchesWildcardPattern(origin, pattern)) {
          isAllowed = true;
          break;
        }
      }
    }
    // 开发环境允许所有本地端口
    if (!isAllowed && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      isAllowed = true;
    }
  }

  // 设置CORS头
  if (allowedOrigins.includes('*')) {
    c.header('Access-Control-Allow-Origin', '*');
  } else if (isAllowed && origin) {
    c.header('Access-Control-Allow-Origin', origin);
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Request-Time, X-Requested-With, ' +
    'X-API-Version, X-User-ID, X-Human-Token, X-Session-ID'
  );
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  // 处理预检请求
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  return next();
}
```

#### CORS 配置最佳实践
```toml
# wrangler.toml - 环境特定配置
[env.development]
vars = { CORS_ORIGIN = "http://localhost:5173,http://localhost:5174" }

[env.staging]
vars = { CORS_ORIGIN = "https://*.staging.pages.dev" }

[env.production]
vars = { CORS_ORIGIN = "https://yourdomain.com,https://*.pages.dev" }
```

#### CORS 问题排查
```typescript
// CORS 调试工具
export function debugCORS(c: Context) {
  const origin = c.req.header('Origin');
  const method = c.req.method;
  const headers = c.req.header('Access-Control-Request-Headers');

  console.log('CORS Debug:', {
    origin,
    method,
    requestHeaders: headers,
    allowedOrigins: c.env.CORS_ORIGIN,
    userAgent: c.req.header('User-Agent')
  });
}
```

### 3.4 安全配置

#### Cloudflare Workers 安全头
```typescript
// 安全头配置
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
};
```

#### 环境变量管理
```bash
# 使用 Wrangler Secrets 管理敏感信息
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put DATABASE_ENCRYPTION_KEY
```

### 3.3 数据加密

```typescript
// 敏感数据加密存储
const encryptSensitiveData = (data: string): string => {
  // 使用 Web Crypto API
  return encrypt(data, process.env.ENCRYPTION_KEY);
};

// 传输加密
const apiRequest = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    // 强制 HTTPS
  }
};
```

---

## 4. API设计与文档

### 4.1 RESTful API规范

#### 路由设计
```typescript
// 资源路由规范
GET    /api/users              // 获取用户列表
GET    /api/users/:id          // 获取特定用户
POST   /api/users              // 创建用户
PUT    /api/users/:id          // 更新用户
DELETE /api/users/:id          // 删除用户

// 嵌套资源
GET    /api/users/:id/profiles // 获取用户画像
POST   /api/users/:id/profiles // 创建用户画像
```

#### 统一响应格式
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  error?: {
    code: string;
    details?: any;
  };
}

// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2025-10-06T12:00:00Z"
}

// 错误响应
{
  "success": false,
  "message": "请求参数错误",
  "timestamp": "2025-10-06T12:00:00Z",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": { ... }
  }
}
```

### 4.2 API文档规范

#### OpenAPI/Swagger 标准
```typescript
// 使用装饰器或注释生成文档
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     parameters:
 *       - name: page
 *         in: query
 *         type: integer
 *         description: 页码
 *     responses:
 *       200:
 *         description: 成功返回用户列表
 */
```

#### 状态码规范
- **200**: 成功
- **201**: 创建成功  
- **400**: 请求参数错误
- **401**: 未授权
- **403**: 禁止访问
- **404**: 资源不存在
- **429**: 请求过于频繁
- **500**: 服务器内部错误

---

## 5. 代码质量与规范

### 5.1 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 5.2 代码检查工具

#### ESLint 配置
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

#### Prettier 配置
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 5.3 测试规范

```typescript
// 单元测试示例
describe('UserService', () => {
  test('should create user successfully', async () => {
    const userData = { email: 'test@example.com' };
    const result = await userService.createUser(userData);
    
    expect(result.success).toBe(true);
    expect(result.data.email).toBe(userData.email);
  });
});

// 集成测试示例
describe('API Integration', () => {
  test('POST /api/users should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com' })
      .expect(201);
      
    expect(response.body.success).toBe(true);
  });
});
```

---

## 6. 数据库设计与管理

### 6.1 多层数据库架构设计

#### 核心设计原则
基于 jiuye-V1 项目经验，采用**主表-副表-静态表**三层架构：

1. **主数据表** (写优化) - 用户提交的原始数据
2. **业务专用表** (功能分离) - 按业务场景优化的数据表
3. **静态统计表** (查询优化) - 预计算的可视化数据

```sql
-- 第1层：主数据表 (写入优化)
questionnaire_submissions_temp  -- 临时存储，待审核
questionnaire_submissions       -- 有效数据，已审核
users                          -- 用户主表

-- 第2层：业务专用表 (功能分离)
analytics_responses            -- 可视化专用
admin_responses               -- 管理员专用
export_responses              -- 导出专用
social_insights_data          -- AI分析专用

-- 第3层：静态统计表 (查询优化)
realtime_stats               -- 实时统计缓存
daily_aggregates            -- 日统计
weekly_aggregates           -- 周统计
monthly_aggregates          -- 月统计
```

#### 表设计规范

**主表结构标准**:
```sql
-- 标准主表结构
CREATE TABLE questionnaire_submissions_temp (
  id TEXT PRIMARY KEY,                    -- UUID主键
  user_id TEXT,                          -- 外键，允许NULL(匿名)
  questionnaire_id TEXT NOT NULL,        -- 问卷标识

  -- 业务数据 (JSON格式)
  response_data TEXT NOT NULL,           -- 问卷回答数据

  -- 审核状态
  audit_status TEXT DEFAULT 'pending' CHECK (
    audit_status IN ('pending', 'approved', 'rejected', 'reviewing')
  ),
  audit_notes TEXT,                      -- 审核备注
  auditor_id TEXT,                       -- 审核员ID

  -- 质量控制
  completion_quality_score REAL DEFAULT 1.0,
  logical_consistency_score REAL DEFAULT 1.0,
  response_time_seconds INTEGER,

  -- 元数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,        -- 测试数据标记

  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (auditor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 必要索引
CREATE INDEX idx_submissions_temp_status ON questionnaire_submissions_temp(audit_status);
CREATE INDEX idx_submissions_temp_questionnaire ON questionnaire_submissions_temp(questionnaire_id);
CREATE INDEX idx_submissions_temp_created ON questionnaire_submissions_temp(created_at);
CREATE INDEX idx_submissions_temp_user ON questionnaire_submissions_temp(user_id);
```

**副表结构标准**:
```sql
-- 可视化专用表 (查询优化)
CREATE TABLE analytics_responses (
  id TEXT PRIMARY KEY,
  source_submission_id TEXT NOT NULL,    -- 关联主表
  questionnaire_id TEXT NOT NULL,

  -- 预处理的分析字段
  age_group TEXT,                        -- 年龄段
  education_level TEXT,                  -- 教育水平
  employment_status TEXT,                -- 就业状态
  location_tier TEXT,                    -- 城市等级

  -- 统计权重
  statistical_weight REAL DEFAULT 1.0,

  -- 时间分区
  year_month TEXT,                       -- YYYY-MM格式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (source_submission_id) REFERENCES questionnaire_submissions(id) ON DELETE CASCADE
);

-- 分区索引
CREATE INDEX idx_analytics_year_month ON analytics_responses(year_month);
CREATE INDEX idx_analytics_questionnaire ON analytics_responses(questionnaire_id);
CREATE INDEX idx_analytics_demographics ON analytics_responses(age_group, education_level, employment_status);
```

### 6.2 字段映射与中英双语优化

#### 全局字段映射策略
基于项目经验，实现**数据库英文-API英文-前端中文**的三层映射：

```typescript
// 全局字段映射配置
export interface GlobalFieldMapping {
  system: 'questionnaire' | 'story' | 'user' | 'analytics';
  domain: string;
  mappings: {
    databaseField: string;    // 数据库字段 (英文snake_case)
    apiField: string;         // API字段 (英文snake_case)
    frontendId: string;       // 前端标识 (英文camelCase)
    displayKey: string;       // 显示键名 (i18n多语言)
    enumType?: string;        // 枚举类型
    validation?: {            // 验证规则
      type: string;
      required: boolean;
      options?: string[];
    };
  }[];
}

// 示例：就业状态字段映射
const EMPLOYMENT_STATUS_MAPPING: GlobalFieldMapping = {
  system: 'questionnaire',
  domain: 'employment',
  mappings: [{
    databaseField: 'employment_status',
    apiField: 'employment_status',
    frontendId: 'employmentStatus',
    displayKey: 'employment.status',
    enumType: 'EmploymentStatusEnum',
    validation: {
      type: 'enum',
      required: true,
      options: ['employed', 'unemployed', 'student', 'freelance']
    }
  }]
};
```

#### 中英双语显示优化
```typescript
// 多语言配置
export const I18N_MAPPINGS = {
  'zh-CN': {
    'employment.status.employed': '已就业',
    'employment.status.unemployed': '未就业',
    'employment.status.student': '在校学生',
    'employment.status.freelance': '自由职业',
    'education.level.bachelor': '本科',
    'education.level.master': '硕士',
    'education.level.phd': '博士'
  },
  'en-US': {
    'employment.status.employed': 'Employed',
    'employment.status.unemployed': 'Unemployed',
    'employment.status.student': 'Student',
    'employment.status.freelance': 'Freelance',
    'education.level.bachelor': 'Bachelor',
    'education.level.master': 'Master',
    'education.level.phd': 'PhD'
  }
};

// 字段转换服务
export class FieldMappingService {
  /**
   * 数据库值 → 前端显示
   */
  translateToDisplay(
    system: string,
    domain: string,
    field: string,
    value: string,
    locale: string = 'zh-CN'
  ): string {
    const mapping = this.getMapping(system, domain, field);
    const key = `${mapping.displayKey}.${value}`;
    return I18N_MAPPINGS[locale]?.[key] || value;
  }

  /**
   * 前端值 → 数据库值
   */
  translateToDatabase(
    displayText: string,
    mapping: GlobalFieldMapping,
    locale: string = 'zh-CN'
  ): string {
    // 反向查找映射
    for (const [key, value] of Object.entries(I18N_MAPPINGS[locale] || {})) {
      if (value === displayText) {
        return key.split('.').pop() || displayText;
      }
    }
    return displayText;
  }
}
```

### 6.3 Schema 设计优化

#### 动态 Schema 管理
```typescript
// Schema 版本管理
export interface SchemaVersion {
  version: string;
  questionnaire_id: string;
  schema: {
    fields: SchemaField[];
    validation: ValidationRule[];
    mappings: FieldMapping[];
  };
  created_at: string;
  is_active: boolean;
}

export interface SchemaField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  display: {
    label: Record<string, string>;  // 多语言标签
    placeholder?: Record<string, string>;
    helpText?: Record<string, string>;
  };
}

// Schema 验证服务
export class SchemaValidationService {
  async validateResponse(
    questionnaireId: string,
    responseData: any
  ): Promise<ValidationResult> {
    const schema = await this.getActiveSchema(questionnaireId);
    const errors: ValidationError[] = [];

    for (const field of schema.fields) {
      const value = responseData[field.name];

      // 必填验证
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          code: 'REQUIRED',
          message: `${field.display.label['zh-CN']} 为必填项`
        });
      }

      // 类型验证
      if (value !== undefined && !this.validateFieldType(field, value)) {
        errors.push({
          field: field.name,
          code: 'TYPE_MISMATCH',
          message: `${field.display.label['zh-CN']} 类型不正确`
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### 6.4 数据同步与性能优化

#### 多级同步策略
```typescript
// 定时任务同步数据
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const syncTasks = [
      // 高频同步 (每5分钟)
      this.syncRealtimeStats(env.DB),

      // 中频同步 (每30分钟)
      this.syncAnalyticsData(env.DB),

      // 低频同步 (每小时)
      this.syncAggregatedData(env.DB),

      // 清理任务 (每天)
      this.cleanupExpiredData(env.DB)
    ];

    await Promise.allSettled(syncTasks);
  },

  async syncRealtimeStats(db: D1Database) {
    // 同步实时统计数据到缓存表
    await db.prepare(`
      INSERT OR REPLACE INTO realtime_stats (
        metric_name, metric_value, updated_at
      )
      SELECT
        'total_submissions' as metric_name,
        COUNT(*) as metric_value,
        datetime('now') as updated_at
      FROM questionnaire_submissions
      WHERE created_at >= datetime('now', '-1 hour')
    `).run();
  }
};
```

---

## 7. 开发与部署流程

### 7.1 CI/CD 流程

#### GitHub Actions 配置
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test
        
      - name: Build
        run: pnpm build
        
      - name: Deploy Backend
        run: pnpm deploy:backend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          
      - name: Deploy Frontend  
        run: pnpm deploy:frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 7.2 环境管理

#### 多环境配置
```toml
# wrangler.toml
[env.development]
name = "app-dev"
vars = { ENVIRONMENT = "development" }

[env.staging] 
name = "app-staging"
vars = { ENVIRONMENT = "staging" }

[env.production]
name = "app-prod"
vars = { ENVIRONMENT = "production" }
```

#### 部署脚本
```bash
#!/bin/bash
# deploy.sh

echo "🚀 开始部署..."

# 1. 代码检查
pnpm lint
pnpm type-check
pnpm test

# 2. 构建
pnpm build

# 3. 部署后端
cd backend && wrangler deploy --env production

# 4. 部署前端
cd ../frontend && wrangler pages deploy dist

echo "✅ 部署完成！"
```

---

## 8. 文档与知识管理

### 8.1 项目文档管理规范

#### 文档分类体系
基于项目实践的完整文档管理框架：

```
docs/
├── 📚 核心文档
│   ├── README.md                    # 项目总览和快速导航
│   ├── PROJECT_SUMMARY.md           # 项目完整总结
│   ├── TECHNICAL_DOCUMENTATION_INDEX.md  # 技术文档索引
│   └── QUICK_START_GUIDE.md         # 快速开始指南
├── 🏗️ 架构设计
│   ├── ARCHITECTURE_OVERVIEW.md     # 架构总览
│   ├── DATABASE_DESIGN.md           # 数据库设计
│   ├── API_DESIGN.md               # API设计规范
│   └── SECURITY_ARCHITECTURE.md    # 安全架构
├── 🚀 部署运维
│   ├── DEPLOYMENT_GUIDE.md          # 部署指南
│   ├── DEPLOYMENT_CHECKLIST.md      # 部署检查清单
│   ├── ENVIRONMENT_SETUP.md         # 环境配置
│   └── MONITORING_GUIDE.md          # 监控指南
├── 🛠️ 开发规范
│   ├── DEVELOPMENT_STANDARDS.md     # 开发规范
│   ├── CODE_REVIEW_CHECKLIST.md     # 代码审查清单
│   ├── TESTING_STANDARDS.md         # 测试规范
│   └── GIT_WORKFLOW.md             # Git工作流
├── 🔧 故障排除
│   ├── TROUBLESHOOTING_GUIDE.md     # 故障排除指南
│   ├── COMMON_ISSUES.md            # 常见问题
│   ├── PERFORMANCE_OPTIMIZATION.md  # 性能优化
│   └── ERROR_CODES.md              # 错误代码说明
├── 📋 项目管理
│   ├── PROJECT_PLANNING.md          # 项目规划
│   ├── MILESTONE_TRACKING.md        # 里程碑跟踪
│   ├── RISK_MANAGEMENT.md          # 风险管理
│   └── TEAM_COLLABORATION.md       # 团队协作
└── 📝 开发记录
    ├── dev-daily-V1/               # 日常开发记录
    ├── CHANGELOG.md                # 变更日志
    ├── DECISION_LOG.md             # 技术决策记录
    └── LESSONS_LEARNED.md          # 经验教训
```

#### 文档维护标准
```markdown
# 文档标准模板

# 文档标题

[![状态徽章](https://img.shields.io/badge/状态-active-green)](文档链接)
[![版本](https://img.shields.io/badge/版本-v1.0.0-blue)](文档链接)

## 📋 概述
[文档概述内容，说明文档目的和适用范围]

## 🎯 目标
[文档目标说明]

## 📖 详细内容
[具体内容章节]

### 子章节
[子章节内容]

## 🔗 相关文档
- [相关文档1](链接1)
- [相关文档2](链接2)

## 📝 维护信息
- **创建时间**: YYYY-MM-DD
- **最后更新**: YYYY-MM-DD
- **维护者**: [维护者姓名]
- **版本**: vX.X.X
- **审核者**: [审核者姓名]

## 📞 联系方式
- **技术支持**: [联系方式]
- **文档反馈**: [反馈渠道]
```

### 8.2 跨周期项目开发过程记录

#### 开发周期管理框架
基于项目实践的完整开发过程记录体系：

```
archive/dev-docs/dev-daily-V1/
├── 📋 项目管理
│   ├── project-overview.md          # 项目总览
│   ├── development-guidelines.md    # 开发指南
│   ├── milestone-planning.md        # 里程碑规划
│   └── resource-allocation.md       # 资源分配
├── 📅 日常记录
│   ├── YYYY-MM-DD-progress-update.md      # 日常进度更新
│   ├── YYYY-MM-DD-feature-development.md  # 功能开发记录
│   ├── YYYY-MM-DD-issue-fix.md           # 问题修复记录
│   └── YYYY-MM-DD-deployment-record.md   # 部署记录
├── 🔄 周期总结
│   ├── YYYY-MM-DD-weekly-summary.md       # 周度总结
│   ├── YYYY-MM-DD-monthly-review.md       # 月度回顾
│   ├── YYYY-MM-DD-phase-completion.md     # 阶段完成报告
│   └── YYYY-MM-DD-milestone-review.md     # 里程碑回顾
├── 📊 分析报告
│   ├── performance-analysis.md            # 性能分析
│   ├── quality-metrics.md                # 质量指标
│   ├── risk-assessment.md                # 风险评估
│   └── lessons-learned.md                # 经验教训
└── 🛠️ 工具脚本
    ├── create-record.sh                   # 记录创建脚本
    ├── generate-summary.sh                # 总结生成脚本
    └── templates/                         # 文档模板
        ├── daily-update-template.md
        ├── issue-report-template.md
        └── deployment-record-template.md
```

### 8.3 问题分析与处理记录文档

#### 问题跟踪体系
```markdown
# 问题修复报告 - YYYY-MM-DD

## 📋 问题概述
**问题标题**: [简洁描述问题]
**发现时间**: [YYYY-MM-DD HH:MM]
**报告人**: [发现问题的人员]
**影响等级**: [🔴高/🟡中/🟢低]
**问题状态**: [🔍调查中/🔧修复中/✅已解决/❌无法解决]

## 🎯 问题描述
### 问题现象
**用户反馈**: [用户描述的问题现象]
**系统表现**: [系统实际表现]
**错误信息**: [具体的错误提示或日志]

### 复现步骤
1. [步骤1]
2. [步骤2]
3. [观察到的问题现象]

### 影响范围
- **用户影响**: [影响的用户数量和类型]
- **功能影响**: [影响的功能模块]
- **数据影响**: [是否涉及数据丢失或错误]
- **业务影响**: [对业务流程的影响]

## 🔍 问题分析
### 根因分析
**技术层面**:
- [技术原因分析]
- [代码问题定位]
- [系统配置问题]

**业务层面**:
- [业务逻辑问题]
- [数据流程问题]
- [用户操作问题]

### 问题定位
**问题位置**: [具体的文件、函数、数据库表等]
**问题代码**:
```typescript
// 问题代码示例
[粘贴有问题的代码片段]
```

## 🔧 解决方案
### 代码修改
**修改文件**: [需要修改的文件列表]
**修改内容**:
```typescript
// 修改前
[原始代码]

// 修改后
[修复后的代码]
```

### 验证结果
- [ ] **功能验证**: [功能是否正常工作]
- [ ] **性能验证**: [性能是否符合预期]
- [ ] **安全验证**: [是否存在安全风险]
- [ ] **兼容性验证**: [是否影响其他功能]

## 📈 预防措施
### 代码层面
- [代码质量改进措施]
- [测试覆盖率提升]
- [代码审查强化]

### 流程层面
- [开发流程优化]
- [测试流程完善]
- [部署流程改进]

## 📚 经验总结
### 技术收获
- [技术方面的收获和学习]
- [工具使用经验]
- [最佳实践总结]

### 流程改进
- [流程方面的改进建议]
- [团队协作优化]
- [质量保证提升]
```

### 8.4 代码注释规范

```typescript
/**
 * 用户画像管理服务
 * 
 * @description 提供用户画像的CRUD操作和统计分析
 * @author 开发团队
 * @since 1.0.0
 */
export class UserProfileService {
  /**
   * 获取用户画像统计
   * 
   * @param questionnaireId 问卷ID
   * @param filters 过滤条件
   * @returns 统计结果
   * @throws {ValidationError} 参数验证失败
   * @throws {DatabaseError} 数据库操作失败
   */
  async getProfileStats(
    questionnaireId: string,
    filters?: ProfileFilters
  ): Promise<ProfileStats> {
    // 实现逻辑...
  }
}
```

---

## 9. 错误处理与监控

### 9.1 错误处理规范

```typescript
// 自定义错误类
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 全局错误处理中间件
const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({
        success: false,
        message: error.message,
        error: { code: 'VALIDATION_ERROR', field: error.field }
      }, 400);
    }
    
    // 记录错误日志
    console.error('Unhandled error:', error);
    
    return c.json({
      success: false,
      message: '服务器内部错误'
    }, 500);
  }
};
```

### 9.2 监控配置

```typescript
// Cloudflare Analytics Engine
const logEvent = async (env: Env, event: AnalyticsEvent) => {
  await env.ANALYTICS.writeDataPoint({
    blobs: [event.type, event.userId],
    doubles: [event.timestamp, event.duration],
    indexes: [event.endpoint]
  });
};

// 性能监控
const performanceMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  
  // 记录性能指标
  await logEvent(c.env, {
    type: 'api_performance',
    endpoint: c.req.path,
    duration,
    timestamp: start
  });
};
```

---

## 10. 性能优化

### 10.1 缓存策略

```typescript
// KV 缓存
const getCachedData = async (env: Env, key: string) => {
  const cached = await env.CACHE.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
};

const setCachedData = async (env: Env, key: string, data: any, ttl = 3600) => {
  await env.CACHE.put(key, JSON.stringify(data), { expirationTtl: ttl });
};

// 缓存装饰器
const cached = (ttl: number = 3600) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`;
      
      let result = await getCachedData(this.env, cacheKey);
      if (!result) {
        result = await originalMethod.apply(this, args);
        await setCachedData(this.env, cacheKey, result, ttl);
      }
      
      return result;
    };
  };
};
```

### 10.2 数据库优化

```sql
-- 查询优化
-- 使用索引
CREATE INDEX idx_questionnaire_responses_user_created 
ON questionnaire_responses(user_id, created_at);

-- 分页查询
SELECT * FROM users 
WHERE created_at > ? 
ORDER BY created_at 
LIMIT 20;

-- 避免 SELECT *
SELECT id, email, created_at FROM users WHERE is_active = 1;
```

---

## 11. AI 开发集成规范

### 11.1 Cloudflare AI Gateway 配置

#### AI 绑定配置
基于 jiuye-V1 项目实践，标准的 AI 配置：

```toml
# wrangler.toml - AI 配置
[ai]
binding = "AI"
gateway_id = "your-ai-gateway-id"  # 可选，用于监控和缓存

[vars]
AI_GATEWAY_ENABLED = "true"
AI_CACHE_TTL = "3600"
AI_RATE_LIMIT_PER_MINUTE = "100"
AI_COST_BUDGET_DAILY = "1.0"
```

#### AI 模型选择策略
基于项目的模型测试结果，推荐配置：

```typescript
// AI 模型配置
export const AI_MODEL_CONFIG = {
  // 内容安全检测 (主要)
  contentSafety: {
    primary: '@cf/meta/llama-guard-3-8b',
    fallback: '@cf/meta/llama-3.1-8b-instruct',
    timeout: 5000,
    confidenceThreshold: 0.7
  },

  // 文本分类 (快速)
  textClassification: {
    primary: '@cf/huggingface/distilbert-sst-2-int8',
    timeout: 2000,
    confidenceThreshold: 0.8
  },

  // 情感分析 (深度)
  sentimentAnalysis: {
    primary: '@cf/meta/llama-3-8b-instruct',
    timeout: 3000,
    confidenceThreshold: 0.6
  },

  // 语义分析 (嵌入)
  semanticAnalysis: {
    primary: '@cf/baai/bge-base-en-v1.5',
    timeout: 2000,
    confidenceThreshold: 0.7
  }
};

// 智能模型检测
export async function detectAvailableModels(ai: Ai): Promise<ModelStatus[]> {
  const models = Object.values(AI_MODEL_CONFIG);
  const results = await Promise.allSettled(
    models.map(async (config) => {
      const start = Date.now();
      try {
        await ai.run(config.primary, { text: "test" });
        return {
          model: config.primary,
          available: true,
          responseTime: Date.now() - start,
          error: null
        };
      } catch (error) {
        return {
          model: config.primary,
          available: false,
          responseTime: Date.now() - start,
          error: error.message
        };
      }
    })
  );

  return results.map(result =>
    result.status === 'fulfilled' ? result.value : result.reason
  );
}
```

### 11.2 AI 内容审核架构

#### 混合审核系统
基于项目经验的三层审核架构：

```typescript
// 混合审核服务
export class HybridModerationService {
  async moderateContent(
    content: string,
    contentType: 'story' | 'questionnaire' | 'comment',
    env: Env
  ): Promise<ModerationResult> {
    // 并行执行规则审核和AI审核
    const [ruleResult, aiResult] = await Promise.allSettled([
      this.ruleBasedModeration(content, contentType),
      this.aiBasedModeration(content, env.AI)
    ]);

    // 智能决策融合
    return this.fuseModerationResults(ruleResult, aiResult);
  }

  private async aiBasedModeration(content: string, ai: Ai): Promise<AIResult> {
    // 多模型并行分析
    const [safety, sentiment, classification] = await Promise.all([
      // 内容安全检测
      ai.run(AI_MODEL_CONFIG.contentSafety.primary, {
        messages: [{ role: "user", content }]
      }),

      // 情感分析
      ai.run(AI_MODEL_CONFIG.sentimentAnalysis.primary, {
        messages: [
          {
            role: "system",
            content: "分析就业相关内容的情感倾向和风险等级，返回JSON格式"
          },
          { role: "user", content }
        ]
      }),

      // 文本分类
      ai.run(AI_MODEL_CONFIG.textClassification.primary, {
        text: content
      })
    ]);

    // 综合风险评分
    const riskScore = this.calculateRiskScore(safety, sentiment, classification);

    return {
      riskScore,
      recommendation: this.getRecommendation(riskScore),
      details: { safety, sentiment, classification },
      confidence: this.calculateConfidence(safety, sentiment, classification)
    };
  }

  private fuseModerationResults(
    ruleResult: PromiseSettledResult<RuleResult>,
    aiResult: PromiseSettledResult<AIResult>
  ): ModerationResult {
    // 规则审核优先级更高
    if (ruleResult.status === 'fulfilled' && ruleResult.value.action === 'reject') {
      return {
        action: 'reject',
        reason: 'rule_violation',
        confidence: 1.0,
        details: ruleResult.value
      };
    }

    // AI审核作为补充
    if (aiResult.status === 'fulfilled') {
      const ai = aiResult.value;
      if (ai.riskScore > 0.8) {
        return {
          action: 'reject',
          reason: 'ai_high_risk',
          confidence: ai.confidence,
          details: ai
        };
      } else if (ai.riskScore > 0.5) {
        return {
          action: 'review',
          reason: 'ai_medium_risk',
          confidence: ai.confidence,
          details: ai
        };
      }
    }

    // 默认通过
    return {
      action: 'approve',
      reason: 'low_risk',
      confidence: 0.8,
      details: { rule: ruleResult, ai: aiResult }
    };
  }
}
```

### 11.3 AI Gateway 优化配置

#### 缓存和限流策略
```typescript
// AI Gateway 配置接口
export interface AIGatewayConfig {
  cache: {
    enabled: boolean;
    ttl: number;                    // 缓存时间 (秒)
    maxSize: number;                // 最大缓存条目
    strategy: 'lru' | 'fifo';       // 缓存策略
    confidenceThreshold: number;    // 置信度阈值
    excludePatterns: string[];      // 排除模式
  };

  rateLimit: {
    enabled: boolean;
    perMinute: number;              // 每分钟请求限制
    perHour: number;                // 每小时请求限制
    perDay: number;                 // 每日请求限制
    burstSize: number;              // 突发请求大小
    costBudget: number;             // 成本预算 (USD/天)
    alertThreshold: number;         // 告警阈值 (%)
  };

  monitoring: {
    enabled: boolean;
    metrics: {
      requestCount: boolean;
      responseTime: boolean;
      errorRate: boolean;
      cacheHitRate: boolean;
      costTracking: boolean;
      modelPerformance: boolean;
    };
    sampling: {
      enabled: boolean;
      rate: number;                 // 采样率 (0-1)
    };
  };
}

// 默认配置
export const DEFAULT_AI_CONFIG: AIGatewayConfig = {
  cache: {
    enabled: true,
    ttl: 3600,                     // 1小时
    maxSize: 10000,
    strategy: 'lru',
    confidenceThreshold: 0.7,
    excludePatterns: ['test', 'debug', 'sample']
  },

  rateLimit: {
    enabled: true,
    perMinute: 100,
    perHour: 1000,
    perDay: 10000,
    burstSize: 20,
    costBudget: 1.0,               // $1/天
    alertThreshold: 80             // 80%时告警
  },

  monitoring: {
    enabled: true,
    metrics: {
      requestCount: true,
      responseTime: true,
      errorRate: true,
      cacheHitRate: true,
      costTracking: true,
      modelPerformance: true
    },
    sampling: {
      enabled: true,
      rate: 0.1                    // 10%采样
    }
  }
};
```

---

## 12. AI 辅助开发规范 (VSCode + Augment)

### 12.1 开发环境配置

#### VSCode 配置
基于项目开发经验的 AI 辅助开发最佳实践：

```json
// .vscode/settings.json - AI 开发配置
{
  "augment.enabled": true,
  "augment.codeCompletion": {
    "enabled": true,
    "triggerCharacters": [".", "(", "[", "{"],
    "maxSuggestions": 5,
    "contextLines": 50
  },
  "augment.codeReview": {
    "enabled": true,
    "autoReview": false,
    "reviewOnSave": true,
    "focusAreas": [
      "security",
      "performance",
      "naming_conventions",
      "error_handling"
    ]
  },
  "augment.documentation": {
    "autoGenerate": true,
    "includeExamples": true,
    "language": "zh-CN"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.toml": "toml"
  }
}
```

#### 推荐插件
```json
// .vscode/extensions.json
{
  "recommendations": [
    "augmentcode.augment",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "cloudflare.vscode-cloudflare-workers",
    "rangav.vscode-thunder-client"
  ]
}
```

### 12.2 RIPER-5-AI 开发流程

#### 开发模式规范
基于项目制定的 AI 辅助开发规范：

```typescript
/**
 * RIPER-5-AI 开发模式
 *
 * RESEARCH: 需求调研与信息澄清
 * - AI不得提前假设用户需求
 * - 必须反向确认所有关键点
 * - 引用的库、架构必须注明来源
 *
 * INNOVATE: 技术方案对比与创意生成
 * - 至少生成两种不同技术路线
 * - 提供明确对比(功能、复杂度、依赖)
 * - 不得输出推诿性结语
 *
 * PLAN: 模块规划与任务拆解
 * - 输出必须包括文件路径、关键类/方法
 * - 结构图必须与描述对应
 * - 不得遗漏API设计、接口依赖
 *
 * EXECUTE: 开发执行与版本管理
 * - 不得跳过设计前提
 * - 每段代码需说明目的、输入输出、依赖
 * - 禁止生成假代码(TODO)
 *
 * FIX_VERIFY: 问题修复与验证
 * - 必须重现问题
 * - 提供完整修复方案
 * - 包含验证步骤和测试用例
 */

// AI 开发助手使用示例
interface AIAssistantPrompt {
  mode: 'RESEARCH' | 'INNOVATE' | 'PLAN' | 'EXECUTE' | 'FIX_VERIFY';
  context: {
    project: 'cloudflare-platform';
    technology: 'workers' | 'pages' | 'd1' | 'ai';
    component: string;
  };
  requirements: string[];
  constraints: string[];
}

// 示例：AI 辅助 API 设计
const apiDesignPrompt: AIAssistantPrompt = {
  mode: 'PLAN',
  context: {
    project: 'cloudflare-platform',
    technology: 'workers',
    component: 'user-authentication'
  },
  requirements: [
    '支持JWT + Google OAuth + 2FA',
    '兼容匿名用户和实名用户',
    '符合RBAC权限模型'
  ],
  constraints: [
    '必须使用Hono.js框架',
    '遵循项目命名规范',
    '包含完整错误处理'
  ]
};
```

### 12.3 AI 代码审查规范

#### 自动化审查配置
```typescript
// AI 代码审查配置
export const AI_CODE_REVIEW_CONFIG = {
  // 审查重点
  focusAreas: [
    'security',           // 安全性检查
    'performance',        // 性能优化
    'naming_conventions', // 命名规范
    'error_handling',     // 错误处理
    'type_safety',        // 类型安全
    'code_structure'      // 代码结构
  ],

  // 审查规则
  rules: {
    security: {
      checkSQLInjection: true,
      checkXSS: true,
      checkAuthValidation: true,
      checkDataSanitization: true
    },
    performance: {
      checkDatabaseQueries: true,
      checkCacheUsage: true,
      checkAsyncPatterns: true,
      checkMemoryLeaks: true
    },
    naming: {
      enforceSnakeCase: 'database',
      enforceCamelCase: 'frontend',
      checkConsistency: true
    }
  },

  // 输出格式
  output: {
    format: 'markdown',
    includeExamples: true,
    includeFixes: true,
    language: 'zh-CN'
  }
};
```

#### 审查检查清单
```markdown
## AI 代码审查检查清单

### 🔒 安全性
- [ ] SQL注入防护
- [ ] XSS攻击防护
- [ ] 身份验证检查
- [ ] 数据验证和清理
- [ ] 敏感信息泄露检查

### ⚡ 性能
- [ ] 数据库查询优化
- [ ] 缓存策略使用
- [ ] 异步操作模式
- [ ] 内存泄露检查
- [ ] 资源释放检查

### 📝 代码质量
- [ ] 命名规范一致性
- [ ] 类型安全检查
- [ ] 错误处理完整性
- [ ] 代码结构合理性
- [ ] 注释和文档完整性

### 🧪 测试覆盖
- [ ] 单元测试覆盖
- [ ] 集成测试覆盖
- [ ] 边界条件测试
- [ ] 错误场景测试
```

---

## 📋 检查清单

### 开发阶段
- [ ] 使用 TypeScript 强类型
- [ ] 遵循命名规范 (数据库 snake_case, 前端 camelCase)
- [ ] 实现统一的 API 响应格式
- [ ] 添加适当的错误处理
- [ ] 编写单元测试
- [ ] 添加代码注释和文档

### 部署阶段  
- [ ] 配置环境变量和密钥
- [ ] 设置 CI/CD 流程
- [ ] 配置监控和日志
- [ ] 执行性能测试
- [ ] 验证安全配置
- [ ] 更新部署文档

### 维护阶段
- [ ] 定期更新依赖
- [ ] 监控性能指标
- [ ] 审查安全日志
- [ ] 备份重要数据
- [ ] 更新文档
- [ ] 进行代码审查

---

## 📚 参考资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [React 官方文档](https://react.dev/)
- [Hono.js 文档](https://hono.dev/)

---

**版权声明**: 本规范基于 jiuye-V1 项目开发经验制定，遵循 MIT 开源协议。

**维护团队**: Cloudflare 开发规范委员会
**最后更新**: 2025-10-06

---

## 附录 A: 常见问题解决方案

### A.1 部署问题

#### 问题: Wrangler 部署失败
```bash
# 解决方案
wrangler auth login
wrangler whoami
wrangler deploy --compatibility-date=2024-09-23
```

#### 问题: D1 数据库连接失败
```bash
# 检查数据库配置
wrangler d1 list
wrangler d1 info <database-name>

# 重新绑定数据库
wrangler d1 execute <database-name> --command="SELECT 1"
```

#### 问题: 环境变量未生效
```bash
# 检查环境变量
wrangler secret list

# 重新设置环境变量
wrangler secret put VARIABLE_NAME
```

### A.2 开发问题

#### 问题: TypeScript 编译错误
```typescript
// 常见解决方案
// 1. 检查 tsconfig.json 配置
// 2. 更新类型定义
npm install @types/node @types/react --save-dev

// 3. 修复类型错误
interface User {
  id: string;
  email: string;
  createdAt: string; // 使用 string 而不是 Date
}
```

#### 问题: API 跨域错误
```typescript
// CORS 配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理 OPTIONS 请求
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### A.3 性能问题

#### 问题: API 响应慢
```typescript
// 解决方案
// 1. 添加数据库索引
CREATE INDEX idx_users_email ON users(email);

// 2. 实现缓存
const cachedResult = await env.CACHE.get(cacheKey);
if (cachedResult) return JSON.parse(cachedResult);

// 3. 优化查询
SELECT id, email FROM users WHERE is_active = 1 LIMIT 20;
```

#### 问题: 前端加载慢
```typescript
// 解决方案
// 1. 代码分割
const LazyComponent = React.lazy(() => import('./Component'));

// 2. 图片优化
<img src="/image.webp" loading="lazy" />

// 3. 缓存策略
const cache = new Map();
```

---

## 附录 B: 最佳实践案例

### B.1 用户认证实现

```typescript
// JWT 认证中间件
export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Missing token' }, 401);
  }

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// 权限检查
export const requireRole = (role: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (user.role !== role) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    await next();
  };
};
```

### B.2 数据验证实现

```typescript
// 输入验证
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin'])
});

export const validateUser = async (c: Context, next: Next) => {
  try {
    const body = await c.req.json();
    const validatedData = userSchema.parse(body);
    c.set('validatedData', validatedData);
    await next();
  } catch (error) {
    return c.json({
      error: 'Validation failed',
      details: error.errors
    }, 400);
  }
};
```

### B.3 错误处理实现

```typescript
// 全局错误处理
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);

    if (error instanceof AppError) {
      return c.json({
        success: false,
        message: error.message,
        error: { code: error.code }
      }, error.statusCode);
    }

    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
};
```

### B.4 数据库操作实现

```typescript
// 数据库服务基类
export abstract class BaseService {
  constructor(protected db: D1Database) {}

  protected async executeQuery<T>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    try {
      const result = await this.db.prepare(query).bind(...params).all();
      return result.results as T[];
    } catch (error) {
      throw new AppError(
        'Database query failed',
        500,
        'DATABASE_ERROR'
      );
    }
  }

  protected async executeUpdate(
    query: string,
    params: any[] = []
  ): Promise<number> {
    try {
      const result = await this.db.prepare(query).bind(...params).run();
      return result.changes || 0;
    } catch (error) {
      throw new AppError(
        'Database update failed',
        500,
        'DATABASE_ERROR'
      );
    }
  }
}

// 用户服务实现
export class UserService extends BaseService {
  async createUser(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(userData.password);
    const now = new Date().toISOString();

    await this.executeUpdate(query, [
      id,
      userData.email,
      passwordHash,
      userData.role,
      now
    ]);

    return this.getUserById(id);
  }

  async getUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const users = await this.executeQuery<User>(query, [id]);
    return users[0] || null;
  }
}
```

---

## 附录 C: 工具和脚本

### C.1 开发工具脚本

```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "🔧 设置开发环境..."

# 检查 Node.js 版本
node_version=$(node -v | cut -d'v' -f2)
required_version="18.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
  echo "❌ Node.js 版本过低，需要 >= $required_version"
  exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 设置环境变量
echo "⚙️ 设置环境变量..."
cp .env.example .env.local

# 初始化数据库
echo "🗄️ 初始化数据库..."
pnpm db:create
pnpm db:migrate

echo "✅ 开发环境设置完成！"
echo "运行 'pnpm dev' 启动开发服务器"
```

### C.2 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 开始部署流程..."

# 环境检查
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ 缺少 CLOUDFLARE_API_TOKEN 环境变量"
  exit 1
fi

# 代码质量检查
echo "🔍 代码质量检查..."
pnpm lint
pnpm type-check
pnpm test

# 构建项目
echo "🔨 构建项目..."
pnpm build

# 部署后端
echo "🔧 部署后端..."
cd backend
wrangler deploy --env production
cd ..

# 部署前端
echo "🎨 部署前端..."
cd frontend
wrangler pages deploy dist --project-name=college-employment-survey-frontend
cd ..

# 验证部署
echo "✅ 验证部署..."
curl -f https://your-api.workers.dev/health || exit 1

echo "🎉 部署完成！"
```

### C.3 数据库管理脚本

```javascript
// scripts/db-manager.js
const { execSync } = require('child_process');

class DatabaseManager {
  constructor(databaseName) {
    this.databaseName = databaseName;
  }

  async createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${name}.sql`;
    const path = `database/migrations/${filename}`;

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
CREATE TABLE IF NOT EXISTS example (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rollback SQL (for reference)
-- DROP TABLE IF EXISTS example;
`;

    require('fs').writeFileSync(path, template);
    console.log(`✅ Created migration: ${path}`);
  }

  async runMigrations() {
    const fs = require('fs');
    const path = require('path');

    const migrationsDir = 'database/migrations';
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`🔄 Running migration: ${file}`);

      try {
        execSync(`wrangler d1 execute ${this.databaseName} --command="${sql}"`, {
          stdio: 'inherit'
        });
        console.log(`✅ Completed: ${file}`);
      } catch (error) {
        console.error(`❌ Failed: ${file}`);
        throw error;
      }
    }
  }

  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;

    console.log(`📦 Creating backup: ${filename}`);
    execSync(`wrangler d1 export ${this.databaseName} --output=${filename}`, {
      stdio: 'inherit'
    });
    console.log(`✅ Backup created: ${filename}`);
  }
}

// 使用示例
const dbManager = new DatabaseManager('college-employment-survey');

// 命令行接口
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'create-migration':
    dbManager.createMigration(arg);
    break;
  case 'migrate':
    dbManager.runMigrations();
    break;
  case 'backup':
    dbManager.backup();
    break;
  default:
    console.log('Usage: node db-manager.js <create-migration|migrate|backup> [name]');
}
```

---

## 附录 D: 团队协作规范

### D.1 Git 工作流

```bash
# 功能开发流程
git checkout main
git pull origin main
git checkout -b feature/user-profile-management

# 开发完成后
git add .
git commit -m "feat: 添加用户画像管理功能

- 实现用户画像统计API
- 添加前端管理界面
- 完善权限控制
- 添加单元测试

Closes #123"

git push origin feature/user-profile-management

# 创建 Pull Request
# 代码审查通过后合并到 main
```

### D.2 代码审查清单

```markdown
## 代码审查清单

### 功能性
- [ ] 功能是否按需求实现
- [ ] 边界条件是否处理
- [ ] 错误处理是否完善
- [ ] 测试覆盖是否充分

### 代码质量
- [ ] 代码是否遵循规范
- [ ] 命名是否清晰
- [ ] 注释是否充分
- [ ] 是否有重复代码

### 安全性
- [ ] 输入验证是否充分
- [ ] 权限检查是否正确
- [ ] 敏感信息是否保护
- [ ] SQL 注入防护

### 性能
- [ ] 数据库查询是否优化
- [ ] 是否有不必要的计算
- [ ] 缓存策略是否合理
- [ ] 内存使用是否合理

### 可维护性
- [ ] 代码结构是否清晰
- [ ] 依赖关系是否合理
- [ ] 配置是否外部化
- [ ] 日志是否充分
```

### D.3 发布流程

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Deploy to production
        run: |
          pnpm deploy:backend
          pnpm deploy:frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

---

**文档结束**

本规范文档基于 jiuye-V1 项目的实际开发经验制定，涵盖了 Cloudflare 平台开发的各个方面。建议团队定期回顾和更新此规范，以适应技术发展和项目需求的变化。
