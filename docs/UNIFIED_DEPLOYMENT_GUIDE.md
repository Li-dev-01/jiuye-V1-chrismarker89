# 🚀 统一部署指南

[![部署状态](https://img.shields.io/badge/部署状态-Ready-green)](UNIFIED_DEPLOYMENT_GUIDE.md)
[![环境支持](https://img.shields.io/badge/环境支持-Cloudflare-blue)](UNIFIED_DEPLOYMENT_GUIDE.md)
[![自动化程度](https://img.shields.io/badge/自动化程度-90%+-orange)](UNIFIED_DEPLOYMENT_GUIDE.md)

## 📋 概述

本指南整合了项目的完整部署流程，包括环境准备、数据库迁移、前后端部署、配置管理等所有步骤，确保部署过程的标准化和可重复性。

## 🎯 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare 生态系统                        │
├─────────────────────────────────────────────────────────────┤
│  前端 (Cloudflare Pages)                                    │
│  ├── React 18 + TypeScript                                 │
│  ├── Ant Design UI                                         │
│  └── 响应式设计                                             │
├─────────────────────────────────────────────────────────────┤
│  后端 (Cloudflare Workers)                                  │
│  ├── Hono.js 框架                                          │
│  ├── JWT 认证                                              │
│  └── RESTful API                                           │
├─────────────────────────────────────────────────────────────┤
│  数据库 (Cloudflare D1)                                     │
│  ├── SQLite 兼容                                           │
│  ├── 多级表架构                                             │
│  └── 自动备份                                               │
├─────────────────────────────────────────────────────────────┤
│  第三方服务                                                  │
│  ├── Google OAuth 2.0                                      │
│  ├── AI 服务集成                                            │
│  └── 监控告警                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📋 部署前检查清单

### ✅ 环境准备
- [ ] Node.js 18+ 已安装
- [ ] npm/yarn 包管理器已配置
- [ ] Git 版本控制已设置
- [ ] Cloudflare 账户已创建
- [ ] Wrangler CLI 已安装并登录

### ✅ 项目准备
- [ ] 代码仓库已克隆
- [ ] 依赖包已安装
- [ ] 环境变量已配置
- [ ] 构建测试已通过
- [ ] 数据库脚本已准备

### ✅ 配置文件检查
- [ ] `wrangler.toml` 配置正确
- [ ] 环境变量文件完整
- [ ] API 密钥已设置
- [ ] 域名配置已准备

## 🔧 详细部署步骤

### 第一步：环境配置

#### 1.1 安装 Wrangler CLI
```bash
# 全局安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare 账户
wrangler auth login

# 验证登录状态
wrangler whoami
```

#### 1.2 克隆项目
```bash
# 克隆项目仓库
git clone <repository-url>
cd jiuye-V1

# 安装根目录依赖
npm install
```

### 第二步：数据库部署

#### 2.1 创建 D1 数据库
```bash
# 创建生产数据库
wrangler d1 create jiuye-production

# 创建测试数据库
wrangler d1 create jiuye-staging

# 更新 wrangler.toml 中的数据库 ID
```

#### 2.2 执行数据库迁移
```bash
# 进入后端目录
cd backend

# 执行迁移脚本
wrangler d1 execute jiuye-production --file=./migrations/001_initial_schema.sql
wrangler d1 execute jiuye-production --file=./migrations/002_user_system.sql
wrangler d1 execute jiuye-production --file=./migrations/003_questionnaire_system.sql
# ... 执行所有迁移文件

# 验证数据库结构
wrangler d1 execute jiuye-production --command="SELECT name FROM sqlite_master WHERE type='table';"
```

#### 2.3 导入初始数据
```bash
# 导入基础配置数据
wrangler d1 execute jiuye-production --file=./scripts/seed_data.sql

# 导入测试数据 (可选)
wrangler d1 execute jiuye-production --file=./test-data/production-test-data.sql
```

### 第三步：后端部署

#### 3.1 配置环境变量
```bash
# 设置生产环境变量
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put AI_API_KEY
wrangler secret put ADMIN_EMAIL

# 验证环境变量
wrangler secret list
```

#### 3.2 构建和部署
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 部署到 Cloudflare Workers
wrangler deploy

# 验证部署
curl https://your-worker.your-subdomain.workers.dev/api/health
```

### 第四步：前端部署

#### 4.1 配置前端环境
```bash
# 进入前端目录
cd ../frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件，设置 API 端点
```

#### 4.2 构建和部署
```bash
# 构建生产版本
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name jiuye-frontend

# 或使用 Git 集成自动部署
git push origin main
```

### 第五步：域名和SSL配置

#### 5.1 配置自定义域名
```bash
# 添加自定义域名到 Pages
wrangler pages domain add jiuye-frontend your-domain.com

# 配置 DNS 记录
# CNAME: your-domain.com -> jiuye-frontend.pages.dev
```

#### 5.2 SSL证书配置
- Cloudflare 自动提供 SSL 证书
- 确保 SSL/TLS 模式设置为 "Full (strict)"
- 验证 HTTPS 访问正常

### 第六步：监控和告警配置

#### 6.1 配置 Cloudflare Analytics
```bash
# 启用 Web Analytics
# 在 Cloudflare Dashboard 中配置

# 配置 Workers Analytics
# 自动启用，无需额外配置
```

#### 6.2 设置告警规则
```javascript
// 在 wrangler.toml 中配置告警
[env.production]
compatibility_date = "2024-01-01"

# 配置错误率告警
# 配置响应时间告警
# 配置可用性监控
```

## 🔍 部署验证

### 功能验证清单
- [ ] 前端页面正常加载
- [ ] 用户注册登录功能正常
- [ ] 问卷提交功能正常
- [ ] 管理员后台访问正常
- [ ] 数据统计显示正常
- [ ] API 接口响应正常
- [ ] 文件上传下载正常
- [ ] 邮件通知功能正常

### 性能验证
```bash
# 使用 Lighthouse 测试性能
npx lighthouse https://your-domain.com --output=html

# 使用 curl 测试 API 响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://your-api.com/health

# 使用 ab 进行压力测试
ab -n 1000 -c 10 https://your-domain.com/
```

### 安全验证
- [ ] HTTPS 强制重定向
- [ ] 安全头配置正确
- [ ] CORS 策略配置正确
- [ ] 认证授权功能正常
- [ ] 输入验证和过滤正常

## 🚨 故障排查

### 常见部署问题

#### 数据库连接问题
```bash
# 检查数据库配置
wrangler d1 info jiuye-production

# 测试数据库连接
wrangler d1 execute jiuye-production --command="SELECT 1;"
```

#### Workers 部署失败
```bash
# 检查 wrangler.toml 配置
wrangler validate

# 查看部署日志
wrangler tail

# 检查环境变量
wrangler secret list
```

#### Pages 构建失败
```bash
# 本地构建测试
npm run build

# 检查构建日志
# 在 Cloudflare Dashboard 中查看

# 检查环境变量配置
# 在 Pages 设置中验证
```

### 性能问题排查
- 检查 Cloudflare Analytics 数据
- 使用 Chrome DevTools 分析
- 查看 Workers 执行时间
- 检查数据库查询性能

## 📊 部署后监控

### 关键指标监控
| 指标 | 目标值 | 监控方式 |
|------|-------|---------|
| 可用性 | 99.9% | Cloudflare Analytics |
| 响应时间 | < 500ms | Workers Analytics |
| 错误率 | < 1% | 错误日志监控 |
| 并发用户 | 1000+ | 实时监控 |

### 告警配置
```javascript
// 配置告警规则
const alertRules = {
  errorRate: {
    threshold: 0.05,    // 5%
    duration: '5m',
    action: 'email'
  },
  responseTime: {
    threshold: 1000,    // 1秒
    duration: '10m',
    action: 'slack'
  },
  availability: {
    threshold: 0.99,    // 99%
    duration: '15m',
    action: 'sms'
  }
};
```

## 🔄 持续部署

### CI/CD 配置
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
      
      # 部署后端
      - name: Deploy Workers
        run: |
          cd backend
          npm install
          npm run build
          npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      # 部署前端
      - name: Deploy Pages
        run: |
          cd frontend
          npm install
          npm run build
          npx wrangler pages deploy dist
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 🔗 相关文档

- [Cloudflare 部署指南](deployment/CLOUDFLARE_DEPLOYMENT_GUIDE.md)
- [部署检查清单](DEPLOYMENT_CHECKLIST.md)
- [在线部署指南](online-deployment-guide.md)
- [性能优化指南](COMPREHENSIVE_PERFORMANCE_GUIDE.md)
- [故障排查指南](TROUBLESHOOTING_QUICK_INDEX.md)

---

**📝 维护信息**:
- 创建时间: 2025-09-22
- 最后更新: 2025-09-22
- 维护者: 技术团队
- 版本: v1.0.0
