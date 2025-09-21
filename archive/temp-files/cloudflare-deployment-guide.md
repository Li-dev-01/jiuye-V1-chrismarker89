# 🚀 Cloudflare Wrangler 部署指南

## 📋 **部署前准备检查**

### ✅ **已完成项目**
- ✅ 模拟数据清理完成
- ✅ 核心API已迁移为TypeScript
- ✅ Cloudflare兼容性达到85%
- ✅ GitHub代码备份完成
- ✅ wrangler.toml配置文件就绪

## 🛠️ **部署步骤**

### **步骤1：安装和配置Wrangler**

```bash
# 1. 安装Wrangler CLI (如果还没有)
npm install -g wrangler

# 2. 登录Cloudflare账户
wrangler login

# 3. 验证登录状态
wrangler whoami
```

### **步骤2：配置D1数据库**

```bash
# 1. 创建D1数据库 (如果还没有)
wrangler d1 create employment-survey-db

# 2. 更新wrangler.toml中的database_id
# 将返回的database_id复制到backend/wrangler.toml

# 3. 运行数据库迁移 (如果有迁移文件)
wrangler d1 migrations apply employment-survey-db --local
wrangler d1 migrations apply employment-survey-db --remote
```

### **步骤3：部署后端API**

```bash
# 进入后端目录
cd backend

# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 部署到开发环境
wrangler deploy --env development

# 4. 验证部署
curl https://employment-survey-api-dev.your-subdomain.workers.dev/health

# 5. 部署到生产环境
wrangler deploy --env production
```

### **步骤4：部署前端应用**

```bash
# 进入前端目录
cd frontend

# 1. 安装依赖
npm install

# 2. 构建生产版本
npm run build

# 3. 部署到Cloudflare Pages
wrangler pages deploy dist --project-name college-employment-survey-frontend

# 或者使用Pages的Git集成自动部署
```

## ⚙️ **配置文件详解**

### **后端配置 (backend/wrangler.toml)**

```toml
name = "employment-survey-api"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[env.development]
name = "employment-survey-api-dev"

[env.production]
name = "employment-survey-api-prod"

# D1 数据库配置
[[d1_databases]]
binding = "DB"
database_name = "employment-survey-db"
database_id = "你的数据库ID"

# 环境变量
[vars]
ENVIRONMENT = "development"
JWT_SECRET = "your-jwt-secret-key"
CORS_ORIGIN = "http://localhost:5173"

[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://your-domain.pages.dev"
```

### **前端配置 (frontend/wrangler.toml)**

```toml
name = "college-employment-survey-frontend"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
cwd = "."
watch_dir = "src"

[build.upload]
format = "modules"
dir = "dist"
main = "./dist/index.html"

[vars]
VITE_APP_ENV = "production"
VITE_API_BASE_URL = "https://employment-survey-api-prod.your-subdomain.workers.dev"
```

## 🔧 **部署脚本**

创建便捷的部署脚本：

### **deploy-backend.sh**
```bash
#!/bin/bash
echo "🚀 部署后端API到Cloudflare Workers..."

cd backend

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到开发环境
echo "🚀 部署到开发环境..."
wrangler deploy --env development

# 测试健康检查
echo "🔍 测试API健康状态..."
sleep 5
curl -f https://employment-survey-api-dev.your-subdomain.workers.dev/health

if [ $? -eq 0 ]; then
    echo "✅ 开发环境部署成功！"
    
    # 询问是否部署到生产环境
    read -p "是否部署到生产环境? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 部署到生产环境..."
        wrangler deploy --env production
        echo "✅ 生产环境部署完成！"
    fi
else
    echo "❌ 开发环境部署失败！"
    exit 1
fi
```

### **deploy-frontend.sh**
```bash
#!/bin/bash
echo "🚀 部署前端到Cloudflare Pages..."

cd frontend

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到Pages
echo "🚀 部署到Cloudflare Pages..."
wrangler pages deploy dist --project-name college-employment-survey-frontend

echo "✅ 前端部署完成！"
```

## 🔍 **部署后验证**

### **API验证**
```bash
# 1. 健康检查
curl https://employment-survey-api-prod.your-subdomain.workers.dev/health

# 2. 测试分析API
curl https://employment-survey-api-prod.your-subdomain.workers.dev/api/analytics/dashboard

# 3. 测试审核员API
curl https://employment-survey-api-prod.your-subdomain.workers.dev/api/reviewer/stats
```

### **前端验证**
- 访问 https://college-employment-survey-frontend.pages.dev
- 检查所有页面是否正常加载
- 验证API连接是否正常
- 测试核心功能

## 📊 **监控和日志**

### **实时日志监控**
```bash
# 监控后端API日志
wrangler tail employment-survey-api-prod

# 监控特定环境
wrangler tail employment-survey-api-dev --env development
```

### **性能监控**
- 在Cloudflare Dashboard中查看Analytics
- 监控请求量、错误率、响应时间
- 设置告警规则

## 🚨 **故障排查**

### **常见问题**

1. **数据库连接失败**
   ```bash
   # 检查D1数据库状态
   wrangler d1 info employment-survey-db
   
   # 重新应用迁移
   wrangler d1 migrations apply employment-survey-db --remote
   ```

2. **CORS错误**
   - 检查wrangler.toml中的CORS_ORIGIN配置
   - 确保前端域名已添加到CORS白名单

3. **API 500错误**
   ```bash
   # 查看详细错误日志
   wrangler tail employment-survey-api-prod --format pretty
   ```

### **快速回滚**
```bash
# 回滚到上一个版本
wrangler rollback employment-survey-api-prod

# 查看部署历史
wrangler deployments list employment-survey-api-prod
```

## 🎯 **下一步优化**

1. **设置自定义域名**
2. **配置CDN缓存策略**
3. **设置监控告警**
4. **优化性能指标**
5. **配置GitHub Actions自动部署**

## 📝 **部署检查清单**

- [ ] Wrangler CLI已安装并登录
- [ ] D1数据库已创建并配置
- [ ] 后端API部署成功
- [ ] 前端应用部署成功
- [ ] API健康检查通过
- [ ] 前端页面正常访问
- [ ] 核心功能测试通过
- [ ] 监控和日志配置完成

**准备就绪，可以开始部署！** 🚀
