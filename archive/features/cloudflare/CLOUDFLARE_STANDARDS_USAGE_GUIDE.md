# 📖 Cloudflare 开发规范使用指南

**目标**: 帮助团队快速上手并正确使用 Cloudflare 开发规范  
**适用对象**: 开发团队、项目经理、技术负责人

---

## 🎯 规范文档概览

### 核心文档
1. **[CLOUDFLARE_DEVELOPMENT_STANDARDS.md](./CLOUDFLARE_DEVELOPMENT_STANDARDS.md)** - 完整开发规范 (主文档)
2. **[CLOUDFLARE_DEVELOPMENT_STANDARDS_SUMMARY.md](./CLOUDFLARE_DEVELOPMENT_STANDARDS_SUMMARY.md)** - 核心要点总结
3. **[CLOUDFLARE_QUICK_REFERENCE.md](./CLOUDFLARE_QUICK_REFERENCE.md)** - 快速参考卡片
4. **[CLOUDFLARE_STANDARDS_USAGE_GUIDE.md](./CLOUDFLARE_STANDARDS_USAGE_GUIDE.md)** - 本使用指南

### 工具脚本
- **[scripts/cloudflare-project-generator.js](./scripts/cloudflare-project-generator.js)** - 项目模板生成器

---

## 🚀 快速开始

### 1. 新项目创建

#### 使用项目生成器 (推荐)
```bash
# 生成新项目
node scripts/cloudflare-project-generator.js my-new-project

# 进入项目目录
cd my-new-project

# 安装依赖
pnpm install

# 启动开发环境
pnpm dev
```

#### 手动创建项目
1. 参考 [项目架构模板](#项目架构模板)
2. 复制配置文件模板
3. 按照规范设置目录结构
4. 配置开发环境

### 2. 现有项目迁移

#### 评估现状
- [ ] 检查技术栈兼容性
- [ ] 评估代码结构
- [ ] 分析迁移工作量
- [ ] 制定迁移计划

#### 逐步迁移
1. **配置层面**: 更新 `package.json`, `tsconfig.json`, `wrangler.toml`
2. **代码规范**: 统一命名规范，添加类型定义
3. **架构调整**: 重构目录结构，分离关注点
4. **测试验证**: 确保功能正常，性能无回退

---

## 📋 团队使用流程

### 新成员入职

#### 第一天
1. **阅读规范文档**
   - 通读 [核心要点总结](./CLOUDFLARE_DEVELOPMENT_STANDARDS_SUMMARY.md)
   - 收藏 [快速参考卡片](./CLOUDFLARE_QUICK_REFERENCE.md)

2. **环境搭建**
   - 安装 Node.js 18+, pnpm 8+
   - 配置 Cloudflare 账号
   - 克隆项目并运行

3. **实践练习**
   - 使用项目生成器创建测试项目
   - 完成简单的 CRUD 功能
   - 提交第一个 PR

#### 第一周
1. **深入学习**
   - 详读 [完整开发规范](./CLOUDFLARE_DEVELOPMENT_STANDARDS.md)
   - 学习项目特定的业务逻辑
   - 参与代码审查

2. **实际开发**
   - 承担小功能开发
   - 遵循规范进行编码
   - 接受导师指导

### 日常开发流程

#### 开发前
```bash
# 1. 检查环境
node --version  # >= 18.0.0
pnpm --version  # >= 8.0.0

# 2. 更新代码
git pull origin main

# 3. 安装依赖
pnpm install

# 4. 启动开发环境
pnpm dev
```

#### 开发中
1. **遵循命名规范**
   - 数据库: `snake_case`
   - API: `snake_case`
   - 前端: `camelCase`

2. **使用快速参考**
   - 查阅 [快速参考卡片](./CLOUDFLARE_QUICK_REFERENCE.md)
   - 复制代码模板
   - 遵循最佳实践

3. **代码质量检查**
   ```bash
   pnpm lint        # 代码风格检查
   pnpm type-check  # 类型检查
   pnpm test        # 运行测试
   ```

#### 开发后
1. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加用户管理功能
   
   - 实现用户CRUD API
   - 添加前端管理界面
   - 完善权限控制
   
   Closes #123"
   ```

2. **创建 PR**
   - 填写 PR 模板
   - 请求代码审查
   - 响应审查意见

### 代码审查流程

#### 审查者检查清单
参考 [代码审查清单](./CLOUDFLARE_DEVELOPMENT_STANDARDS.md#d2-代码审查清单)

#### 常见问题
1. **命名不规范**
   ```typescript
   // ❌ 错误
   const user_id = data.userId;
   
   // ✅ 正确 (前端)
   const userId = data.userId;
   ```

2. **缺少错误处理**
   ```typescript
   // ❌ 错误
   const user = await getUserById(id);
   
   // ✅ 正确
   try {
     const user = await getUserById(id);
     if (!user) {
       throw new AppError('User not found', 404, 'USER_NOT_FOUND');
     }
   } catch (error) {
     // 处理错误
   }
   ```

3. **API 响应格式不统一**
   ```typescript
   // ❌ 错误
   return { user: userData };
   
   // ✅ 正确
   return {
     success: true,
     data: userData,
     message: '获取用户成功',
     timestamp: new Date().toISOString()
   };
   ```

---

## 🔧 工具使用指南

### 项目生成器

#### 基本使用
```bash
# 生成标准项目
node scripts/cloudflare-project-generator.js my-project

# 生成的项目包含:
# - 完整的目录结构
# - 配置文件模板
# - 基础代码框架
# - 文档模板
```

#### 自定义配置
生成项目后，根据具体需求调整：

1. **修改项目信息**
   ```json
   // package.json
   {
     "name": "your-actual-project-name",
     "description": "your-project-description",
     "author": "your-team-name"
   }
   ```

2. **配置 Cloudflare 资源**
   ```toml
   # backend/wrangler.toml
   [[d1_databases]]
   binding = "DB"
   database_name = "your-database-name"
   database_id = "your-actual-database-id"
   ```

3. **设置环境变量**
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```

### 开发工具配置

#### VS Code 推荐配置
```json
// .vscode/settings.json
{
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

#### VS Code 推荐插件
- TypeScript Importer
- ESLint
- Prettier
- Cloudflare Workers
- Thunder Client (API 测试)

---

## 📊 质量保证

### 代码质量指标

#### 必须达标
- [ ] TypeScript 严格模式无错误
- [ ] ESLint 检查通过
- [ ] 单元测试覆盖率 > 80%
- [ ] API 响应时间 < 500ms
- [ ] 前端首屏加载 < 3s

#### 推荐目标
- [ ] 代码复杂度 < 10
- [ ] 函数长度 < 50 行
- [ ] 文件长度 < 300 行
- [ ] 依赖更新及时

### 性能监控

#### 关键指标
```typescript
// 监控 API 性能
const performanceMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  
  // 记录到 Analytics Engine
  await c.env.ANALYTICS.writeDataPoint({
    blobs: ['api_performance', c.req.path],
    doubles: [duration, start],
    indexes: [c.res.status.toString()]
  });
};
```

#### 性能优化检查
- [ ] 数据库查询优化
- [ ] 缓存策略实施
- [ ] 静态资源压缩
- [ ] CDN 配置正确

---

## 🚨 常见问题解决

### 开发环境问题

#### Node.js 版本不兼容
```bash
# 使用 nvm 管理 Node.js 版本
nvm install 18
nvm use 18
```

#### pnpm 安装失败
```bash
# 清理缓存重新安装
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript 编译错误
```bash
# 检查配置文件
cat tsconfig.json

# 重新生成类型定义
pnpm type-check
```

### 部署问题

#### Wrangler 认证失败
```bash
wrangler auth login
wrangler whoami
```

#### D1 数据库连接失败
```bash
# 检查数据库配置
wrangler d1 list
wrangler d1 info your-database-name

# 测试连接
wrangler d1 execute your-database-name --command="SELECT 1"
```

#### 环境变量未生效
```bash
# 检查密钥配置
wrangler secret list

# 重新设置
wrangler secret put VARIABLE_NAME
```

---

## 📈 持续改进

### 规范更新流程

#### 提出改进建议
1. 在项目中发现问题或改进点
2. 创建 Issue 描述问题和建议
3. 讨论可行性和影响范围
4. 形成改进方案

#### 规范修订
1. 更新相关文档
2. 通知团队成员
3. 提供迁移指导
4. 收集反馈意见

#### 版本管理
- 主版本: 重大架构变更
- 次版本: 新增规范内容
- 修订版本: 错误修正和澄清

### 团队培训

#### 定期培训
- 月度规范回顾会议
- 新规范介绍和讨论
- 最佳实践分享
- 问题解决经验交流

#### 知识库维护
- 更新文档和示例
- 收集常见问题 FAQ
- 维护工具和脚本
- 分享学习资源

---

## 🎯 成功指标

### 团队效率
- [ ] 新项目启动时间 < 1 天
- [ ] 代码审查通过率 > 90%
- [ ] 部署成功率 > 95%
- [ ] 故障恢复时间 < 30 分钟

### 代码质量
- [ ] Bug 率 < 1%
- [ ] 技术债务可控
- [ ] 性能指标达标
- [ ] 安全漏洞为零

### 团队协作
- [ ] 规范遵循度 > 95%
- [ ] 文档完整性 > 90%
- [ ] 知识共享活跃
- [ ] 团队满意度高

---

## 📞 支持与反馈

### 获取帮助
- 查阅 [完整规范文档](./CLOUDFLARE_DEVELOPMENT_STANDARDS.md)
- 使用 [快速参考卡片](./CLOUDFLARE_QUICK_REFERENCE.md)
- 在团队群组提问
- 联系技术负责人

### 提供反馈
- 创建 GitHub Issue
- 参与团队讨论
- 提交改进建议
- 分享使用经验

---

**记住**: 规范是为了提高效率和质量，而不是束缚创新。在遵循规范的同时，保持灵活性和创造力！ 🚀
