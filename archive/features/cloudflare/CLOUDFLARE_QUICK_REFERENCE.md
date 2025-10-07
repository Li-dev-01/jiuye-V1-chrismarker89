# 🚀 Cloudflare 开发快速参考卡

**适用于**: 日常开发中的快速查询  
**基于**: jiuye-V1 项目经验

---

## 📋 命名规范速查

| 层级 | 规范 | 示例 |
|------|------|------|
| 数据库 | `snake_case` | `user_id`, `created_at`, `is_active` |
| API | `snake_case` | `{"user_id": "123", "created_at": "2025-10-06"}` |
| 前端 | `camelCase` | `userId`, `createdAt`, `isActive` |
| 文件名 | 组件:`PascalCase`<br>工具:`camelCase` | `UserProfile.tsx`<br>`apiClient.ts` |

---

## 🏗️ 项目结构模板

```
project/
├── frontend/           # Cloudflare Pages
│   ├── src/components/ # 组件 (PascalCase)
│   ├── src/services/   # API服务 + 字段转换
│   └── wrangler.toml   # Pages配置
├── backend/            # Cloudflare Workers  
│   ├── src/routes/     # 路由 (kebab-case)
│   ├── src/middleware/ # 中间件
│   └── wrangler.toml   # Workers配置
└── database/           # D1数据库
    ├── schemas/        # 架构定义
    └── migrations/     # 迁移脚本
```

---

## 🔧 常用配置

### package.json 必需配置
```json
{
  "packageManager": "pnpm@10.8.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### TypeScript 严格配置
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true
  }
}
```

### Wrangler 环境配置
```toml
[env.development]
name = "app-dev"
vars = { ENVIRONMENT = "development" }

[env.production]  
name = "app-prod"
vars = { ENVIRONMENT = "production" }
```

---

## 🛡️ 安全模板

### JWT 认证中间件
```typescript
const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Missing token' }, 401);
  
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  c.set('user', payload);
  await next();
};
```

### 权限检查
```typescript
const requireRole = (role: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (user.role !== role) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    await next();
  };
};
```

### 安全头
```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000'
};
```

---

## 📡 API 规范

### 统一响应格式
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  error?: { code: string; details?: any };
}
```

### RESTful 路由
```typescript
GET    /api/users              // 列表
GET    /api/users/:id          // 详情
POST   /api/users              // 创建
PUT    /api/users/:id          // 更新
DELETE /api/users/:id          // 删除
```

### 状态码
| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 🗄️ 数据库模板

### 标准表结构
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID
  email TEXT UNIQUE NOT NULL,             -- 业务主键
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,           -- 布尔值用INTEGER
  is_test_data INTEGER DEFAULT 0         -- 测试标记
);

-- 必要索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

### 迁移脚本模板
```sql
-- migrations/001_create_users.sql
-- Migration: Create users table
-- Created: 2025-10-06

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rollback: DROP TABLE IF EXISTS users;
```

---

## ⚡ 性能优化

### KV 缓存
```typescript
const getCached = async (env: Env, key: string) => {
  const cached = await env.CACHE.get(key);
  return cached ? JSON.parse(cached) : null;
};

const setCache = async (env: Env, key: string, data: any, ttl = 3600) => {
  await env.CACHE.put(key, JSON.stringify(data), { expirationTtl: ttl });
};
```

### 数据库优化
```sql
-- 使用索引
CREATE INDEX idx_table_field ON table(field);

-- 避免 SELECT *
SELECT id, name FROM users WHERE active = 1;

-- 分页查询
SELECT * FROM users WHERE id > ? ORDER BY id LIMIT 20;
```

---

## 🔍 错误处理

### 自定义错误
```typescript
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
```

### 全局错误处理
```typescript
const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
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

---

## 🚀 部署命令

### 开发环境
```bash
# 启动开发服务器
pnpm dev

# 前端开发
pnpm dev:frontend

# 后端开发  
pnpm dev:backend
```

### 构建部署
```bash
# 完整构建
pnpm build

# 部署到生产环境
pnpm deploy

# 单独部署
pnpm deploy:frontend
pnpm deploy:backend
```

### Wrangler 命令
```bash
# 登录
wrangler auth login

# 部署 Worker
wrangler deploy

# 部署 Pages
wrangler pages deploy dist

# 查看日志
wrangler tail

# 管理密钥
wrangler secret put SECRET_NAME
wrangler secret list

# 数据库操作
wrangler d1 list
wrangler d1 execute DB_NAME --command="SELECT 1"
```

---

## 🧪 测试命令

```bash
# 运行所有测试
pnpm test

# 代码检查
pnpm lint
pnpm type-check

# 修复代码格式
pnpm lint:fix

# 数据库操作
pnpm db:migrate
pnpm db:seed
```

---

## 📊 监控与日志

### 结构化日志
```typescript
console.log(JSON.stringify({
  level: 'info',
  message: 'User created',
  userId: user.id,
  timestamp: new Date().toISOString(),
  requestId: c.get('requestId')
}));
```

### Analytics Engine
```typescript
await env.ANALYTICS.writeDataPoint({
  blobs: [event.type, event.userId],
  doubles: [event.timestamp, event.duration],
  indexes: [event.endpoint]
});
```

---

## 🔧 故障排除

### 常见问题
| 问题 | 解决方案 |
|------|----------|
| Wrangler 部署失败 | `wrangler auth login` |
| D1 连接失败 | 检查 `wrangler.toml` 配置 |
| 环境变量未生效 | `wrangler secret list` |
| TypeScript 错误 | 检查 `tsconfig.json` |
| CORS 错误 | 添加 CORS 头 |

### 调试命令
```bash
# 查看 Worker 日志
wrangler tail

# 检查部署状态
wrangler deployments list

# 测试 API
curl -H "Authorization: Bearer TOKEN" https://api.workers.dev/health
```

---

## 📚 Git 工作流

### 分支命名
```bash
feature/user-profile-management
bugfix/api-response-format
hotfix/security-vulnerability
```

### 提交规范
```bash
git commit -m "feat: 添加用户画像管理功能

- 实现统计API
- 添加前端界面
- 完善权限控制

Closes #123"
```

### 提交类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

---

## ✅ 检查清单

### 开发前
- [ ] 环境配置正确
- [ ] 依赖安装完成
- [ ] 数据库连接正常
- [ ] 认证配置完成

### 开发中
- [ ] 遵循命名规范
- [ ] 添加类型定义
- [ ] 实现错误处理
- [ ] 编写单元测试

### 部署前
- [ ] 代码检查通过
- [ ] 测试全部通过
- [ ] 环境变量配置
- [ ] 文档更新完成

---

**💡 提示**: 将此文档加入书签，开发时随时查阅！
