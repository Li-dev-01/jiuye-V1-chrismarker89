# 部署配置指南 V1

## 🎯 部署策略

- **多环境部署**: 开发、测试、生产环境分离
- **自动化部署**: CI/CD流水线自动部署
- **零停机部署**: 蓝绿部署策略
- **回滚机制**: 快速回滚到稳定版本
- **监控告警**: 实时监控和自动告警

## 🌍 环境配置

### 开发环境 (Development)
```yaml
# 环境变量
NODE_ENV: development
API_BASE_URL: http://localhost:8787
DATABASE_URL: local-d1-database
LOG_LEVEL: debug
CORS_ORIGINS: ["http://localhost:5173"]
RATE_LIMIT: 1000

# Cloudflare配置
wrangler.toml:
  name: "employment-survey-dev"
  compatibility_date: "2023-07-01"
  
  [env.development]
  vars:
    ENVIRONMENT: "development"
    
  [[env.development.d1_databases]]
  binding: "DB"
  database_name: "employment-survey-dev"
  database_id: "dev-database-id"
```

### 测试环境 (Staging)
```yaml
# 环境变量
NODE_ENV: staging
API_BASE_URL: https://api-staging.employment-survey.com
DATABASE_URL: staging-d1-database
LOG_LEVEL: info
CORS_ORIGINS: ["https://staging.employment-survey.com"]
RATE_LIMIT: 500

# Cloudflare配置
[env.staging]
vars:
  ENVIRONMENT: "staging"
  
[[env.staging.d1_databases]]
binding: "DB"
database_name: "employment-survey-staging"
database_id: "staging-database-id"

[[env.staging.r2_buckets]]
binding: "STORAGE"
bucket_name: "employment-survey-staging"
```

### 生产环境 (Production)
```yaml
# 环境变量
NODE_ENV: production
API_BASE_URL: https://api.employment-survey.com
DATABASE_URL: production-d1-database
LOG_LEVEL: warn
CORS_ORIGINS: ["https://employment-survey.com"]
RATE_LIMIT: 100

# Cloudflare配置
[env.production]
vars:
  ENVIRONMENT: "production"
  
[[env.production.d1_databases]]
binding: "DB"
database_name: "employment-survey-prod"
database_id: "prod-database-id"

[[env.production.r2_buckets]]
binding: "STORAGE"
bucket_name: "employment-survey-prod"

[[env.production.kv_namespaces]]
binding: "CACHE"
id: "prod-cache-namespace-id"
```

## 🔧 Cloudflare Workers 部署

### 项目配置
```toml
# wrangler.toml
name = "employment-survey-api"
main = "src/index.ts"
compatibility_date = "2023-07-01"
node_compat = true

[build]
command = "npm run build"

# 环境变量
[vars]
JWT_SECRET = "your-jwt-secret"
CORS_ORIGINS = "https://employment-survey.com"

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "employment-survey"
database_id = "your-database-id"

# R2 存储
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "employment-survey-files"

# KV 缓存
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# 自定义域名
[env.production]
routes = [
  { pattern = "api.employment-survey.com/*", zone_name = "employment-survey.com" }
]
```

### 部署脚本
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 开始部署到 Cloudflare Workers..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm ci

# 2. 运行测试
echo "🧪 运行测试..."
npm run test

# 3. 构建项目
echo "🔨 构建项目..."
npm run build

# 4. 数据库迁移
echo "🗄️ 执行数据库迁移..."
npx wrangler d1 migrations apply employment-survey --env production

# 5. 部署到 Workers
echo "☁️ 部署到 Cloudflare Workers..."
npx wrangler publish --env production

echo "✅ 部署完成！"
```

## 🌐 前端部署 (Vercel/Netlify)

### Vercel 配置
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://api.employment-survey.com",
    "VITE_APP_ENV": "production"
  }
}
```

### Netlify 配置
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_BASE_URL = "https://api.employment-survey.com"
  VITE_APP_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

## 🔄 CI/CD 流水线

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Build
        run: npm run build
        working-directory: ./backend
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: './backend'
          command: publish --env production

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

## 🗄️ 数据库部署

### D1 数据库迁移
```sql
-- migrations/0001_initial.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

```bash
# 迁移命令
npx wrangler d1 migrations create employment-survey "initial schema"
npx wrangler d1 migrations apply employment-survey --env production
```

### 数据备份策略
```bash
#!/bin/bash
# backup.sh

# 导出数据库
npx wrangler d1 export employment-survey --env production --output backup-$(date +%Y%m%d).sql

# 上传到 R2 存储
npx wrangler r2 object put employment-survey-backups/backup-$(date +%Y%m%d).sql --file backup-$(date +%Y%m%d).sql
```

## 📊 监控和日志

### 应用监控
```typescript
// 监控配置
const monitoring = {
  // Cloudflare Analytics
  analytics: {
    enabled: true,
    webVitals: true,
    customMetrics: [
      'questionnaire_submissions',
      'user_registrations',
      'api_response_time'
    ]
  },
  
  // 错误追踪
  errorTracking: {
    provider: 'Sentry',
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  },
  
  // 性能监控
  performance: {
    provider: 'Cloudflare Workers Analytics',
    metrics: ['cpu_time', 'memory_usage', 'request_duration']
  }
};
```

### 日志聚合
```typescript
// 日志配置
const logging = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  outputs: [
    {
      type: 'console',
      level: 'debug'
    },
    {
      type: 'cloudflare-logs',
      level: 'info'
    }
  ]
};
```

## 🔒 安全配置

### SSL/TLS 配置
```yaml
# Cloudflare SSL 设置
ssl:
  mode: "Full (strict)"
  min_tls_version: "1.2"
  ciphers: "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS"
  
# HSTS 配置
hsts:
  enabled: true
  max_age: 31536000
  include_subdomains: true
  preload: true
```

### 安全头配置
```typescript
// 安全中间件
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## 🚨 故障恢复

### 回滚策略
```bash
#!/bin/bash
# rollback.sh

echo "🔄 开始回滚..."

# 回滚到上一个版本
npx wrangler rollback --env production

# 回滚数据库迁移（如果需要）
npx wrangler d1 migrations apply employment-survey --env production --to-migration 0001

echo "✅ 回滚完成！"
```

### 灾难恢复
```bash
#!/bin/bash
# disaster-recovery.sh

echo "🆘 开始灾难恢复..."

# 1. 恢复数据库
npx wrangler d1 import employment-survey --env production --file latest-backup.sql

# 2. 重新部署应用
npm run deploy:production

# 3. 验证服务状态
curl -f https://api.employment-survey.com/health || exit 1

echo "✅ 灾难恢复完成！"
```

---

*此部署指南确保应用的稳定部署和运维，为生产环境提供可靠的部署流程和故障恢复机制。*
