# Cloudflare 部署指南

## 🚀 项目已准备就绪

经过全面清理，项目现已优化并准备好部署到 Cloudflare 环境。

## 📋 部署前检查清单

### ✅ 已完成的准备工作
- [x] 项目结构清理完成
- [x] 测试代码已归档
- [x] 开发文档已整理
- [x] 前端应用正常启动
- [x] 核心功能保持完整
- [x] 版权信息已更新为 2025

### 🔧 部署配置

#### 1. 前端部署 (Cloudflare Pages)
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 使用 wrangler 部署
npx wrangler pages deploy dist --project-name jiuye-frontend
```

#### 2. 后端部署 (Cloudflare Workers)
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 构建项目
npm run build

# 部署到 Cloudflare Workers
npx wrangler deploy
```

## 🗂️ 项目结构概览

```
jiuye-V1/
├── frontend/                 # 前端应用 (React + TypeScript)
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── stores/         # 状态管理
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── wrangler.toml       # Cloudflare Pages 配置
├── backend/                  # 后端 API (Cloudflare Workers)
│   ├── src/
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── wrangler.toml       # Cloudflare Workers 配置
├── database/                 # 数据库迁移文件
├── docs/                     # 核心文档
├── scripts/                  # 生产脚本
├── archive/                  # 归档文件 (可删除)
└── package.json             # 根项目配置
```

## 🔑 环境变量配置

### 前端环境变量 (.env.production)
```env
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
VITE_APP_TITLE=大学生就业问卷调查平台
VITE_APP_VERSION=1.0.0
```

### 后端环境变量 (wrangler.toml)
```toml
[env.production.vars]
DATABASE_URL = "your-d1-database-url"
JWT_SECRET = "your-jwt-secret"
CORS_ORIGIN = "https://your-pages.pages.dev"
```

## 📊 数据库配置

### Cloudflare D1 数据库
```bash
# 创建 D1 数据库
npx wrangler d1 create jiuye-database

# 运行迁移
npx wrangler d1 migrations apply jiuye-database --env production
```

## 🔧 部署步骤

### 第一步：准备 Cloudflare 账号
1. 注册 Cloudflare 账号
2. 安装 wrangler CLI: `npm install -g wrangler`
3. 登录: `npx wrangler auth login`

### 第二步：配置域名 (可选)
1. 在 Cloudflare 添加自定义域名
2. 配置 DNS 记录
3. 更新环境变量中的域名

### 第三步：部署后端
```bash
cd backend
npm install
npm run build
npx wrangler deploy --env production
```

### 第四步：部署前端
```bash
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name jiuye-frontend
```

### 第五步：配置数据库
```bash
# 创建数据库
npx wrangler d1 create jiuye-database

# 运行迁移
cd database
npx wrangler d1 migrations apply jiuye-database --env production
```

## 🧪 部署后测试

### 功能测试清单
- [ ] 首页正常加载
- [ ] 用户注册/登录
- [ ] 问卷填写功能
- [ ] 管理员登录
- [ ] 数据分析页面
- [ ] 审核员功能

### 性能测试
- [ ] 页面加载速度 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 移动端适配正常

## 🔍 监控和维护

### Cloudflare Analytics
- 启用 Web Analytics
- 监控 Core Web Vitals
- 设置错误告警

### 日志监控
```bash
# 查看 Worker 日志
npx wrangler tail your-worker-name

# 查看 Pages 部署日志
npx wrangler pages deployment list
```

## 🚨 故障排除

### 常见问题
1. **CORS 错误**: 检查后端 CORS 配置
2. **API 404**: 确认 Worker 路由配置
3. **数据库连接失败**: 检查 D1 绑定配置
4. **静态资源 404**: 检查 Pages 构建配置

### 调试命令
```bash
# 本地开发模式
npm run dev

# 检查构建
npm run build

# 预览生产版本
npm run preview
```

## 📞 支持联系

如果在部署过程中遇到问题，请：
1. 检查 Cloudflare 控制台的错误日志
2. 查看项目文档 (`docs/` 目录)
3. 参考归档文件中的历史记录

---

**🎉 恭喜！项目已准备好部署到 Cloudflare！**

现在可以开始执行部署步骤，将您的大学生就业问卷调查平台发布到生产环境。
