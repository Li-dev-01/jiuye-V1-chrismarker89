# 📋 Cloudflare 开发规范指南 - 核心要点总结

**基于**: jiuye-V1 项目开发经验  
**目标**: 为 Cloudflare 平台项目提供标准化开发指导  
**版本**: v1.0

---

## 🎯 核心原则

### 1. 技术栈标准化
- **前端**: React 18 + TypeScript + Vite + Ant Design
- **后端**: Cloudflare Workers + Hono.js + TypeScript
- **数据库**: Cloudflare D1 (SQLite) - 多层架构设计
- **AI服务**: Cloudflare Workers AI + AI Gateway
- **缓存**: Cloudflare KV + Analytics Engine
- **部署**: Cloudflare Pages + Workers
- **包管理**: pnpm (强制)
- **开发工具**: VSCode + Augment AI Assistant

### 2. 命名规范统一
- **数据库层**: `snake_case` (user_id, created_at)
- **API层**: `snake_case` (保持与数据库一致)
- **前端层**: `camelCase` (userId, createdAt)
- **转换责任**: 前端 API 封装层负责字段转换

### 3. 多层数据库架构
- **主数据表**: 写入优化，原始数据存储
- **业务专用表**: 功能分离，按场景优化
- **静态统计表**: 查询优化，预计算缓存
- **字段映射**: 全局映射策略，中英双语支持
- **Schema管理**: 动态Schema，版本控制

### 4. AI 智能集成
- **内容审核**: 混合审核系统 (规则 + AI)
- **模型配置**: 多模型并行，智能降级
- **缓存优化**: 内容哈希缓存，成本控制
- **性能监控**: 实时监控，告警机制

### 5. AI 辅助开发
- **开发流程**: RIPER-5-AI 模式 (RESEARCH/INNOVATE/PLAN/EXECUTE/FIX_VERIFY)
- **代码审查**: 自动化审查，多维度检查
- **智能补全**: 上下文感知，代码生成
- **文档生成**: 自动文档，示例代码

### 6. 安全优先
- **双前端架构**: 用户端 + 管理端分离
- **权限隔离**: 基于角色的访问控制 (RBAC)
- **认证方式**: JWT + Google OAuth + 2FA
- **数据保护**: 敏感数据加密 + HTTPS 传输

---

## 🏗️ 项目架构模板

```
project-root/
├── frontend/                 # Cloudflare Pages
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务 (含字段转换)
│   │   ├── stores/          # 状态管理 (Zustand)
│   │   └── types/           # TypeScript类型
│   └── wrangler.toml        # Pages配置
├── backend/                 # Cloudflare Workers
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── middleware/      # 中间件
│   │   ├── services/        # 业务逻辑
│   │   │   ├── aiModerationService.ts    # AI内容审核
│   │   │   └── fieldMappingService.ts    # 字段映射
│   │   ├── config/          # 配置文件
│   │   │   ├── aiConfig.ts  # AI模型配置
│   │   │   └── dbConfig.ts  # 数据库配置
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript类型
│   └── wrangler.toml        # Workers配置 (含AI绑定)
├── database/                # D1数据库 (多层架构)
│   ├── schemas/             # 数据库架构
│   │   ├── main-tables/     # 主数据表 (写优化)
│   │   ├── business-tables/ # 业务专用表 (功能分离)
│   │   └── cache-tables/    # 静态统计表 (查询优化)
│   ├── migrations/          # 迁移脚本
│   ├── mappings/            # 字段映射配置
│   └── test-data/           # 测试数据
├── scripts/                 # 工具脚本
│   ├── cloudflare-project-generator.js  # 项目生成器
│   ├── test-ai-models.js    # AI模型测试
│   └── setup-ai-gateway.js  # AI Gateway配置
├── .vscode/                 # VSCode配置
│   ├── settings.json        # Augment AI配置
│   └── extensions.json      # 推荐插件
└── docs/                    # 项目文档
    ├── DEVELOPMENT_STANDARDS.md     # 完整开发规范
    ├── AI_INTEGRATION_GUIDE.md      # AI集成指南
    └── DATABASE_DESIGN.md           # 数据库设计文档
```

---

## 🗄️ 多层数据库架构

### 第1层：主数据表 (写优化)
```sql
-- 原始数据存储，审核流程
questionnaire_submissions_temp  -- 临时存储，待审核
questionnaire_submissions       -- 有效数据，已审核
users                          -- 用户主表
```

### 第2层：业务专用表 (功能分离)
```sql
-- 按业务场景优化
analytics_responses            -- 可视化专用
admin_responses               -- 管理员专用
export_responses              -- 导出专用
social_insights_data          -- AI分析专用
```

### 第3层：静态统计表 (查询优化)
```sql
-- 预计算缓存
realtime_stats               -- 实时统计
daily_aggregates            -- 日统计
weekly_aggregates           -- 周统计
monthly_aggregates          -- 月统计
```

---

## 🤖 AI 集成架构

### AI 模型配置
```typescript
export const AI_MODEL_CONFIG = {
  contentSafety: '@cf/meta/llama-guard-3-8b',      // 内容安全
  textClassification: '@cf/huggingface/distilbert-sst-2-int8', // 文本分类
  sentimentAnalysis: '@cf/meta/llama-3-8b-instruct',  // 情感分析
  semanticAnalysis: '@cf/baai/bge-base-en-v1.5'       // 语义分析
};
```

### 混合审核系统
```typescript
// 并行执行规则审核和AI审核
const [ruleResult, aiResult] = await Promise.allSettled([
  ruleBasedModeration(content),
  aiBasedModeration(content, env.AI)
]);

// 智能决策融合
return fuseModerationResults(ruleResult, aiResult);
```

---

## 🔧 开发配置要求

### TypeScript 配置
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

### 代码质量工具
- **ESLint**: TypeScript + Prettier 规则
- **Prettier**: 统一代码格式
- **Husky**: Git hooks 自动检查
- **Jest**: 单元测试 + 集成测试

### 包管理规范
```json
{
  "packageManager": "pnpm@10.8.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

---

## 🛡️ 安全配置清单

### 认证与授权
```typescript
// JWT 认证中间件
const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Missing token' }, 401);
  
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  c.set('user', payload);
  await next();
};

// 权限检查
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

### 安全头配置
```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
```

---

## 📡 API 设计规范

### 统一响应格式
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
```

### RESTful 路由规范
```typescript
// 资源路由
GET    /api/users              // 获取列表
GET    /api/users/:id          // 获取详情
POST   /api/users              // 创建
PUT    /api/users/:id          // 更新
DELETE /api/users/:id          // 删除

// 嵌套资源
GET    /api/users/:id/profiles // 获取用户画像
```

### 状态码标准
- **200**: 成功
- **201**: 创建成功
- **400**: 请求参数错误
- **401**: 未授权
- **403**: 禁止访问
- **404**: 资源不存在
- **500**: 服务器内部错误

---

## 🗄️ 数据库设计规范

### 表结构标准
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID主键
  email TEXT UNIQUE NOT NULL,             -- 业务主键
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,           -- 布尔值用INTEGER
  is_test_data INTEGER DEFAULT 0         -- 测试数据标记
);

-- 必要索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

### 迁移管理
```sql
-- migrations/001_create_users.sql
-- 版本号 + 描述性名称
-- 支持回滚操作
CREATE TABLE IF NOT EXISTS users (...);
```

---

## 🚀 部署流程标准

### 环境配置
```toml
# wrangler.toml
[env.development]
name = "app-dev"
vars = { ENVIRONMENT = "development" }

[env.production]
name = "app-prod"
vars = { ENVIRONMENT = "production" }
```

### CI/CD 流程
```yaml
# GitHub Actions
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    steps:
      - name: Lint & Test
        run: pnpm lint && pnpm test
      - name: Build
        run: pnpm build
      - name: Deploy
        run: pnpm deploy
```

### 部署检查清单
- [ ] 代码质量检查通过
- [ ] 单元测试通过
- [ ] 环境变量配置正确
- [ ] 数据库迁移完成
- [ ] 安全配置验证
- [ ] 性能测试通过

---

## ⚡ 性能优化要点

### 缓存策略
```typescript
// KV 缓存
const getCachedData = async (env: Env, key: string) => {
  const cached = await env.CACHE.get(key);
  return cached ? JSON.parse(cached) : null;
};

// 缓存装饰器
const cached = (ttl: number = 3600) => {
  // 实现缓存逻辑
};
```

### 数据库优化
```sql
-- 使用索引
CREATE INDEX idx_responses_user_created 
ON responses(user_id, created_at);

-- 避免 SELECT *
SELECT id, email, created_at FROM users WHERE is_active = 1;

-- 分页查询
SELECT * FROM users WHERE created_at > ? ORDER BY created_at LIMIT 20;
```

---

## 🔍 错误处理规范

### 自定义错误类
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

## 📊 监控与日志

### 性能监控
```typescript
// Cloudflare Analytics Engine
const logEvent = async (env: Env, event: AnalyticsEvent) => {
  await env.ANALYTICS.writeDataPoint({
    blobs: [event.type, event.userId],
    doubles: [event.timestamp, event.duration],
    indexes: [event.endpoint]
  });
};
```

### 日志规范
```typescript
// 结构化日志
console.log(JSON.stringify({
  level: 'info',
  message: 'User created',
  userId: user.id,
  timestamp: new Date().toISOString(),
  requestId: c.get('requestId')
}));
```

---

## 📚 文档要求

### 必需文档
- `README.md` - 项目概述
- `API_DOCUMENTATION.md` - API文档
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `TROUBLESHOOTING.md` - 故障排除

### 代码注释
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
   * @returns 统计结果
   * @throws {ValidationError} 参数验证失败
   */
  async getProfileStats(questionnaireId: string): Promise<ProfileStats> {
    // 实现逻辑...
  }
}
```

---

## 🎯 团队协作规范

### Git 工作流
```bash
# 功能分支
git checkout -b feature/user-profile-management

# 提交规范
git commit -m "feat: 添加用户画像管理功能

- 实现用户画像统计API
- 添加前端管理界面
- 完善权限控制

Closes #123"
```

### 代码审查要点
- 功能实现是否正确
- 代码质量是否达标
- 安全性是否充分
- 性能是否优化
- 文档是否完善

---

## ✅ 快速检查清单

### 开发阶段
- [ ] 使用 TypeScript 强类型
- [ ] 遵循命名规范
- [ ] 实现统一 API 响应格式
- [ ] 添加错误处理
- [ ] 编写单元测试
- [ ] 添加代码注释

### 部署阶段
- [ ] 配置环境变量
- [ ] 设置 CI/CD
- [ ] 配置监控
- [ ] 执行性能测试
- [ ] 验证安全配置
- [ ] 更新文档

### 维护阶段
- [ ] 定期更新依赖
- [ ] 监控性能指标
- [ ] 审查安全日志
- [ ] 备份数据
- [ ] 代码审查

---

## 🔗 相关资源

- [完整规范文档](./CLOUDFLARE_DEVELOPMENT_STANDARDS.md)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

---

**这份总结涵盖了基于 Cloudflare 平台开发的核心要点，建议团队成员熟读并在项目中严格执行。**
