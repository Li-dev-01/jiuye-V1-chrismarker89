# 大学生就业问卷调查平台 V2

基于现有项目重构的新一代大学生就业问卷调查平台，采用现代化技术栈和最佳实践。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Git

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd college-employment-survey-v2

# 安装依赖
pnpm install
```

### 开发环境启动

```bash
# 启动开发服务器 (前端 + 后端)
pnpm dev

# 或者分别启动
pnpm dev:frontend  # 前端开发服务器
pnpm dev:backend   # 后端开发服务器
```

### 构建和部署

```bash
# 构建所有项目
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 部署到生产环境
pnpm deploy
```

## 📁 项目结构

```
college-employment-survey-v2/
├── frontend/                 # 前端应用 (React + Vite)
├── backend/                  # 后端API (Cloudflare Workers + Hono)
├── shared/                   # 共享代码和类型
├── docs/                     # 项目文档
├── scripts/                  # 构建和部署脚本
└── package.json             # 根项目配置
```

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design 5.x
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **图表**: ECharts

### 后端
- **运行时**: Cloudflare Workers
- **框架**: Hono.js
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2
- **认证**: JWT

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript
- **测试**: Vitest + Testing Library
- **CI/CD**: GitHub Actions

## 📚 文档

- [数据库设计](./docs/database-design.md)
- [API接口规范](./docs/api-specification.md)
- [前端开发指南](./docs/frontend-guide.md)
- [后端开发指南](./docs/backend-guide.md)
- [部署指南](./docs/deployment.md)

## 🔧 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查：

```bash
# 检查代码规范
pnpm lint

# 自动修复代码格式
pnpm lint --fix
```

### 提交规范

使用 Conventional Commits 规范：

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或辅助工具的变动
```

### Git Hooks

项目配置了 Git hooks 进行代码质量检查：

- **pre-commit**: 运行 lint-staged 检查代码格式
- **commit-msg**: 检查提交信息格式
- **pre-push**: 运行测试确保代码质量

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行特定测试
pnpm test frontend
pnpm test backend
```

## 🚀 部署

### 开发环境

```bash
# 启动开发服务器
pnpm dev
```

### 生产环境

```bash
# 构建项目
pnpm build

# 部署到 Cloudflare
pnpm deploy
```

## 📊 监控和日志

- **应用监控**: Cloudflare Analytics
- **错误追踪**: Sentry (可选)
- **性能监控**: Web Vitals
- **日志聚合**: Cloudflare Logs

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目维护者: [Your Name](mailto:your.email@example.com)
- 项目地址: [GitHub Repository](https://github.com/your-username/college-employment-survey-v2)
- 问题反馈: [GitHub Issues](https://github.com/your-username/college-employment-survey-v2/issues)

---

*基于现有项目的深度分析和重构，致力于提供更好的用户体验和开发体验。*
