# 🚀 GitHub Actions 自动化部署指南

## 📋 概述

本项目使用GitHub Actions实现完整的CI/CD流水线，支持自动化测试、构建和部署到Cloudflare平台。

## 🏗️ 工作流架构

### 🔄 CI/CD流程图
```
代码推送 → 质量检查 → 测试 → 构建 → 部署 → 验证
    ↓         ↓        ↓      ↓      ↓      ↓
  GitHub   ESLint   Jest   Build   CF    E2E
  Actions   检查     测试    打包   部署   测试
```

### 📊 分支策略
- **main**: 生产环境自动部署
- **develop**: 测试环境自动部署  
- **feature/***: 仅运行测试，不部署
- **hotfix/***: 紧急修复，直接部署到生产

## 🔧 工作流配置

### 📁 文件结构
```
.github/
└── workflows/
    ├── deploy.yml          # 主部署流水线
    ├── test.yml           # 测试流水线
    ├── security.yml       # 安全扫描
    └── docs.yml           # 文档更新
```

### 🎯 主要任务

#### 1. 质量检查 (Quality Check)
```yaml
quality-check:
  name: 🔍 Quality Check
  runs-on: ubuntu-latest
  steps:
    - 📥 代码检出
    - 📦 设置pnpm环境
    - 🟢 设置Node.js环境
    - 📥 安装依赖
    - 🔍 ESLint检查
    - 🧪 TypeScript类型检查
```

#### 2. 测试阶段 (Test)
```yaml
test:
  name: 🧪 Test
  needs: quality-check
  steps:
    - 🧪 前端单元测试
    - 🧪 后端单元测试
    - 📊 测试覆盖率报告
    - 📦 上传测试结果
```

#### 3. 前端部署 (Deploy Frontend)
```yaml
deploy-frontend:
  name: 🚀 Deploy Frontend
  needs: test
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
  steps:
    - 🏗️ 构建React应用
    - 🚀 部署到Cloudflare Pages
    - 📊 部署状态报告
```

#### 4. 后端部署 (Deploy Backend)
```yaml
deploy-backend:
  name: 🚀 Deploy Backend
  needs: test
  steps:
    - 🏗️ 构建Hono.js应用
    - 🚀 部署到Cloudflare Workers
    - 📊 部署状态报告
```

#### 5. 端到端测试 (E2E Tests)
```yaml
e2e-tests:
  name: 🧪 E2E Tests
  needs: [deploy-frontend, deploy-backend]
  steps:
    - 🧪 Playwright测试
    - 📊 测试报告上传
    - 📢 结果通知
```

## 🔐 环境变量配置

### GitHub Secrets设置

#### 必需的Secrets
```bash
# Cloudflare配置
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# 应用配置
VITE_API_BASE_URL=https://api.your-domain.com/api
PRODUCTION_URL=https://your-domain.com

# 可选配置
CODECOV_TOKEN=your_codecov_token
SLACK_WEBHOOK_URL=your_slack_webhook
```

#### 设置步骤
1. 进入GitHub仓库设置
2. 选择 "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 添加上述所有必需的secrets

### 环境变量说明

#### CLOUDFLARE_API_TOKEN
```bash
# 获取方式：
1. 登录Cloudflare Dashboard
2. 进入 "My Profile" → "API Tokens"
3. 创建自定义token，权限包括：
   - Zone:Zone:Read
   - Zone:DNS:Edit
   - Account:Cloudflare Pages:Edit
   - Account:Cloudflare Workers:Edit
```

#### CLOUDFLARE_ACCOUNT_ID
```bash
# 获取方式：
1. 登录Cloudflare Dashboard
2. 右侧边栏查看Account ID
3. 复制ID值
```

## 🌍 部署环境

### 🧪 测试环境 (Staging)
- **分支**: develop
- **前端URL**: https://employment-survey-staging.pages.dev
- **后端URL**: https://employment-survey-staging.workers.dev
- **数据库**: D1 Staging Database

### 🚀 生产环境 (Production)
- **分支**: main
- **前端URL**: https://employment-survey.pages.dev
- **后端URL**: https://employment-survey.workers.dev
- **数据库**: D1 Production Database

## 📊 监控和通知

### 🔍 部署状态监控
```yaml
# 健康检查
health-check:
  steps:
    - name: 🏥 Health Check
      run: |
        curl -f ${{ env.API_URL }}/api/health
        curl -f ${{ env.FRONTEND_URL }}
```

### 📢 通知配置
```yaml
# Slack通知
- name: 📢 Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🚨 故障排除

### 常见问题

#### 1. 部署失败
```bash
# 检查步骤：
1. 验证Secrets配置是否正确
2. 检查Cloudflare API Token权限
3. 确认wrangler.toml配置
4. 查看GitHub Actions日志
```

#### 2. 测试失败
```bash
# 解决方案：
1. 本地运行测试确认问题
2. 检查测试环境配置
3. 更新测试用例
4. 修复代码问题
```

#### 3. 环境变量问题
```bash
# 调试方法：
1. 检查Secrets是否正确设置
2. 验证环境变量名称拼写
3. 确认变量作用域
4. 查看构建日志
```

### 🔧 调试技巧

#### 启用调试模式
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

#### 查看详细日志
```yaml
- name: 🔍 Debug Info
  run: |
    echo "Current branch: ${{ github.ref }}"
    echo "Event name: ${{ github.event_name }}"
    echo "Actor: ${{ github.actor }}"
    env | grep -E '^(GITHUB_|CLOUDFLARE_)' | sort
```

## 📈 性能优化

### 🚀 构建优化
```yaml
# 缓存策略
- name: 📦 Cache dependencies
  uses: actions/cache@v3
  with:
    path: |
      ~/.pnpm-store
      node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### ⚡ 并行执行
```yaml
# 并行部署
strategy:
  matrix:
    environment: [staging, production]
  max-parallel: 2
```

## 🔒 安全最佳实践

### 🛡️ Secrets管理
- 使用最小权限原则
- 定期轮换API Token
- 避免在日志中暴露敏感信息
- 使用环境特定的Secrets

### 🔐 代码安全
```yaml
# 安全扫描
security-scan:
  steps:
    - name: 🔍 Security Audit
      run: pnpm audit
    
    - name: 🛡️ CodeQL Analysis
      uses: github/codeql-action/analyze@v2
```

## 📚 相关文档

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages文档](https://developers.cloudflare.com/pages/)
- [GitHub Actions文档](https://docs.github.com/en/actions)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)

---

**📅 最后更新**: 2025年7月31日  
**🔄 维护人员**: DevOps团队  
**📊 版本**: v1.0.0
