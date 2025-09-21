# 🚀 快速开始指南

> **5分钟启动项目，快速上手开发**

## 📋 前置要求

### 🛠️ 开发环境
- **Node.js**: >= 18.0.0 (推荐 20.x LTS)
- **pnpm**: >= 8.0.0 (包管理器)
- **Git**: >= 2.30.0
- **VSCode**: 推荐IDE (可选)

### 📦 系统要求
- **操作系统**: macOS / Linux / Windows
- **内存**: >= 8GB RAM
- **存储**: >= 2GB 可用空间
- **网络**: 稳定的互联网连接

## ⚡ 快速启动

### 1️⃣ 克隆项目
```bash
# 克隆仓库 (如果从GitHub)
git clone https://github.com/your-org/employment-survey-v1.git
cd employment-survey-v1

# 或者直接使用本地项目
cd /Users/z/Desktop/github/V1
```

### 2️⃣ 安装依赖
```bash
# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../backend
pnpm install
```

### 3️⃣ 环境配置
```bash
# 前端环境变量
cd frontend
cp .env.example .env
# 编辑 .env 文件，确保 VITE_API_BASE_URL=http://localhost:8005/api

# 后端环境变量
cd ../backend
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

### 4️⃣ 启动服务
```bash
# 启动后端服务 (终端1)
cd backend
pnpm run dev:local
# 服务启动在 http://localhost:8005

# 启动前端服务 (终端2)
cd frontend
pnpm run dev
# 服务启动在 http://localhost:5173
```

### 5️⃣ 验证安装
访问以下地址验证服务正常：
- **前端首页**: http://localhost:5173/
- **问卷页面**: http://localhost:5173/questionnaire
- **管理后台**: http://localhost:5173/admin
- **API健康检查**: http://localhost:8005/api/health

## 🎯 核心功能体验

### 📝 问卷系统
1. 访问 http://localhost:5173/questionnaire
2. 填写6页问卷表单
3. 查看实时统计数据
4. 测试页面导航功能

### 🔐 用户认证
1. 访问 http://localhost:5173/login
2. 使用测试账号登录
3. 体验管理后台功能

### 📊 数据分析
1. 访问管理后台
2. 查看数据统计图表
3. 测试数据导出功能

## 🔧 开发工具配置

### VSCode 推荐插件
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Git 配置
```bash
# 配置用户信息
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 配置分支策略
git config pull.rebase false
git config init.defaultBranch main
```

### 代码格式化
```bash
# 安装全局工具
pnpm add -g prettier eslint typescript

# 运行代码检查
cd frontend && pnpm run lint
cd backend && pnpm run lint

# 自动修复格式问题
cd frontend && pnpm run lint:fix
cd backend && pnpm run lint:fix
```

## 📚 项目结构概览

```
V1/
├── 📁 frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/         # 可复用组件
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API服务
│   │   ├── stores/            # 状态管理
│   │   ├── types/             # TypeScript类型
│   │   └── utils/             # 工具函数
│   ├── public/                # 静态资源
│   └── package.json
├── 📁 backend/                  # Hono.js后端应用
│   ├── src/
│   │   ├── routes/            # API路由
│   │   ├── middleware/        # 中间件
│   │   ├── db/               # 数据库服务
│   │   ├── types/            # TypeScript类型
│   │   └── utils/            # 工具函数
│   └── package.json
├── 📁 docs/                    # 项目文档
│   ├── project-overview/      # 项目概况
│   ├── features/             # 功能文档
│   ├── technical/            # 技术文档
│   └── management/           # 管理文档
├── 📁 dev-daily-V1/           # 开发日志
└── 📁 readme first/           # 需求文档
```

## 🧪 测试指南

### 运行测试
```bash
# 前端测试
cd frontend
pnpm test                    # 运行所有测试
pnpm test:watch             # 监听模式
pnpm test:coverage          # 覆盖率报告

# 后端测试
cd backend
pnpm test                   # 运行所有测试
pnpm test:integration       # 集成测试
```

### 手动测试清单
- [ ] 问卷填写完整流程
- [ ] 用户登录注册功能
- [ ] 管理后台各项功能
- [ ] API接口响应正常
- [ ] 数据统计显示正确

## 🚀 部署指南

### 开发环境部署
```bash
# 构建项目
cd frontend && pnpm build
cd backend && pnpm build

# 本地预览
cd frontend && pnpm preview
```

### 生产环境部署
```bash
# 使用GitHub Actions自动部署
git push origin main

# 手动部署到Cloudflare
cd backend
pnpm run deploy:production
```

## 🔍 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
lsof -i :5173
lsof -i :8005

# 杀死占用进程
kill -9 <PID>
```

#### 2. 依赖安装失败
```bash
# 清理缓存
pnpm store prune
rm -rf node_modules
pnpm install
```

#### 3. 环境变量问题
```bash
# 检查环境变量
echo $VITE_API_BASE_URL
cat frontend/.env
```

#### 4. API连接失败
- 确认后端服务正在运行
- 检查防火墙设置
- 验证API地址配置

### 获取帮助
- 📖 查看 [技术文档](../technical/README.md)
- 🐛 提交 [GitHub Issues](https://github.com/your-org/employment-survey-v1/issues)
- 💬 联系开发团队

## 📈 下一步

### 新开发者建议
1. **熟悉代码结构** - 阅读 [系统架构文档](../technical/architecture.md)
2. **了解业务逻辑** - 查看 [功能模块文档](../features/README.md)
3. **参与开发** - 阅读 [开发规范](../technical/development-guide.md)
4. **提交代码** - 遵循 [Git工作流](../management/git-workflow.md)

### 项目贡献
1. Fork项目仓库
2. 创建功能分支
3. 提交代码变更
4. 创建Pull Request
5. 代码审查和合并

---

**🎉 恭喜！** 您已经成功启动了项目。现在可以开始探索和开发了！

**📞 需要帮助？** 查看 [项目概况](./README.md) 或联系开发团队。

---

**📅 最后更新**: 2025年7月31日  
**🔄 维护人员**: 开发团队  
**📊 适用版本**: v1.0.0-dev
