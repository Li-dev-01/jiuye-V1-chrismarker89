# 🚀 部署指南

## 📋 本次更新内容

### 后端更新
1. ✅ 添加用户画像管理API (`backend/src/routes/user-profile-management.ts`)
2. ✅ 修复AI审核路由注册问题 (`backend/src/index.ts`)

### 前端更新
1. ✅ 添加用户画像管理页面 (`reviewer-admin-dashboard/src/pages/AdminUserProfileManagement.tsx`)
2. ✅ 更新管理员菜单 (`reviewer-admin-dashboard/src/components/layout/DashboardLayout.tsx`)
3. ✅ 更新路由配置 (`reviewer-admin-dashboard/src/App.tsx`)

---

## 🔄 部署步骤

### 步骤1: 提交代码到Git

```bash
# 在项目根目录执行
cd /Users/z/Desktop/chrismarker89/jiuye-V1

# 查看修改的文件
git status

# 添加所有修改的文件
git add backend/src/index.ts
git add backend/src/routes/user-profile-management.ts
git add reviewer-admin-dashboard/src/App.tsx
git add reviewer-admin-dashboard/src/components/layout/DashboardLayout.tsx
git add reviewer-admin-dashboard/src/pages/AdminUserProfileManagement.tsx
git add docs/*.md

# 提交更改
git commit -m "feat: 添加用户画像管理功能并修复AI审核路由

- 添加用户画像管理API端点
- 添加用户画像管理前端页面
- 修复AI审核功能404错误
- 更新管理员菜单和路由配置
- 添加相关文档"

# 推送到远程仓库
git push origin main
```

---

### 步骤2: 部署后端到Cloudflare Workers

#### 方法1: 使用Wrangler CLI（推荐）

```bash
# 进入后端目录
cd backend

# 部署到生产环境
wrangler deploy

# 或者部署到特定环境
wrangler deploy --env production
```

#### 方法2: 使用Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 找到您的后端Worker
4. 点击 "Settings" → "Deployments"
5. 点击 "Create deployment"
6. 选择最新的Git提交
7. 点击 "Deploy"

**预期结果**:
- ✅ 部署成功
- ✅ 新的API端点可用
- ✅ AI审核路由修复生效

---

### 步骤3: 部署前端到Cloudflare Pages

#### 方法1: 自动部署（推荐）

如果您已经配置了Git集成，Cloudflare Pages会自动检测到新的提交并触发部署。

1. 推送代码到Git仓库
2. 等待Cloudflare Pages自动构建
3. 查看部署状态

#### 方法2: 手动触发部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages
3. 找到 `reviewer-admin-dashboard` 项目
4. 点击 "Create deployment"
5. 选择 `main` 分支
6. 点击 "Deploy"

#### 方法3: 使用Wrangler CLI

```bash
# 进入前端目录
cd reviewer-admin-dashboard

# 构建项目
npm run build

# 部署到Cloudflare Pages
wrangler pages deploy build --project-name=reviewer-admin-dashboard
```

**预期结果**:
- ✅ 部署成功
- ✅ 新页面可访问
- ✅ 菜单显示"用户画像管理"

---

## ✅ 部署验证

### 1. 验证后端部署

#### 检查API端点

```bash
# 替换为您的实际域名
BACKEND_URL="https://your-backend.workers.dev"

# 测试用户画像API（需要管理员token）
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "$BACKEND_URL/api/admin/user-profile/tag-statistics?questionnaire_id=questionnaire-v2-2024"

# 测试AI审核API
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "$BACKEND_URL/api/simple-admin/ai-moderation/config"
```

**预期响应**:
```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

### 2. 验证前端部署

#### 访问管理员后台

1. 打开浏览器
2. 访问: `https://reviewer-admin-dashboard.pages.dev`
3. 登录管理员账号
4. 检查左侧菜单

**预期结果**:
- ✅ 菜单中显示"用户画像管理"（在"标签管理"和"信誉管理"之间）
- ✅ 点击后进入用户画像统计页面
- ✅ AI审核页面无404错误

### 3. 功能测试

#### 测试用户画像管理

1. 点击"用户画像管理"菜单
2. 检查页面是否正常加载
3. 检查标签统计表格是否显示
4. 检查情绪分析卡片是否显示
5. 测试筛选功能
6. 测试刷新功能

#### 测试AI审核功能

1. 点击"AI审核"菜单
2. 打开浏览器控制台（F12）
3. 检查是否还有404错误
4. 检查AI配置是否正常加载
5. 检查AI统计是否正常显示
6. 测试AI审核功能

---

## 🐛 故障排除

### 问题1: 后端部署失败

**可能原因**:
- Wrangler配置错误
- 环境变量缺失
- 依赖包问题

**解决方案**:
```bash
# 检查wrangler配置
cat backend/wrangler.toml

# 检查环境变量
wrangler secret list

# 重新安装依赖
cd backend
npm install
wrangler deploy
```

### 问题2: 前端部署失败

**可能原因**:
- 构建错误
- 依赖包问题
- 配置文件错误

**解决方案**:
```bash
# 检查构建日志
cd reviewer-admin-dashboard
npm run build

# 如果有错误，修复后重新构建
npm install
npm run build

# 重新部署
wrangler pages deploy build --project-name=reviewer-admin-dashboard
```

### 问题3: 部署成功但功能不可用

**可能原因**:
- 浏览器缓存
- CDN缓存
- 环境变量未更新

**解决方案**:
```bash
# 1. 清除浏览器缓存
# Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)

# 2. 清除Cloudflare缓存
# Dashboard → Caching → Purge Everything

# 3. 检查环境变量
# Dashboard → Workers → Settings → Variables
```

---

## 📊 部署检查清单

### 后端部署
- [ ] 代码已提交到Git
- [ ] 后端已部署到Cloudflare Workers
- [ ] API端点测试通过
- [ ] AI审核路由可访问
- [ ] 用户画像API可访问

### 前端部署
- [ ] 代码已提交到Git
- [ ] 前端已部署到Cloudflare Pages
- [ ] 页面可正常访问
- [ ] 菜单显示"用户画像管理"
- [ ] 新页面可正常加载

### 功能验证
- [ ] AI审核页面无404错误
- [ ] AI配置正常加载
- [ ] AI统计正常显示
- [ ] 用户画像页面正常加载
- [ ] 标签统计正常显示
- [ ] 情绪分析正常显示

---

## 🎯 快速部署命令

### 一键部署脚本

```bash
#!/bin/bash

echo "🚀 开始部署..."

# 1. 提交代码
echo "📝 提交代码到Git..."
git add .
git commit -m "feat: 添加用户画像管理功能并修复AI审核路由"
git push origin main

# 2. 部署后端
echo "🔧 部署后端..."
cd backend
wrangler deploy
cd ..

# 3. 部署前端
echo "🎨 部署前端..."
cd reviewer-admin-dashboard
npm run build
wrangler pages deploy build --project-name=reviewer-admin-dashboard
cd ..

echo "✅ 部署完成！"
echo ""
echo "请访问以下地址验证："
echo "- 后端: https://your-backend.workers.dev"
echo "- 前端: https://reviewer-admin-dashboard.pages.dev"
```

保存为 `deploy.sh`，然后执行：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📝 部署记录

### 本次部署信息

**日期**: 2025-10-05

**后端更新**:
- 添加 `/api/admin/user-profile/*` 路由
- 修复 `/api/simple-admin/*` 路由注册

**前端更新**:
- 添加用户画像管理页面
- 更新管理员菜单
- 更新路由配置

**影响范围**:
- 管理员后台
- AI审核功能
- 用户画像管理功能

**回滚方案**:
```bash
# 如果需要回滚
git revert HEAD
git push origin main

# 重新部署旧版本
cd backend && wrangler deploy
cd ../reviewer-admin-dashboard && wrangler pages deploy build
```

---

## 🔗 相关资源

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)
- [项目更新总结](./ADMIN_FRONTEND_UPDATE_SUMMARY.md)
- [快速修复指南](./QUICK_FIX_GUIDE.md)

---

**准备好部署了吗？按照上述步骤执行即可！** 🚀

