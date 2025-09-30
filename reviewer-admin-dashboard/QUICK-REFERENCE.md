# 🚀 统一登录快速参考

## 📍 登录入口

### 唯一登录地址
```
/unified-login
```

### 旧地址（自动重定向）
- `/login` → `/unified-login`
- `/admin/login` → `/unified-login`
- `/admin/super-login` → `/unified-login`

---

## 👥 测试账号

### 开发环境（可使用快捷登录）

| 角色 | 用户名 | 密码 | 登录后跳转 |
|------|--------|------|-----------|
| 审核员 | `reviewerA` | `admin123` | `/dashboard` |
| 管理员 | `admin` | `admin123` | `/admin/dashboard` |
| 超级管理员 | `superadmin` | `admin123` | `/admin/super` |

### 生产环境
- ⚠️ 调试按钮不显示
- ⚠️ 必须手动输入账号密码
- ⚠️ 或使用 Google OAuth 登录

---

## 🔧 开发命令

### 启动开发服务器
```bash
cd reviewer-admin-dashboard
npm start
```

访问: http://localhost:3000/unified-login

### 构建生产版本
```bash
npm run build
```

### 测试生产构建
```bash
npx serve -s build -p 5000
```

访问: http://localhost:5000/unified-login

---

## 🧪 快速测试

### 1. 测试路由重定向
```bash
# 在浏览器中依次访问：
http://localhost:3000/login
http://localhost:3000/admin/login
http://localhost:3000/admin/super-login

# 应该都重定向到：
http://localhost:3000/unified-login
```

### 2. 测试审核员登录
1. 访问 `/unified-login`
2. 选择"审核员"标签
3. 点击"自动登录（调试）"
4. 应跳转到 `/dashboard`

### 3. 测试管理员登录
1. 访问 `/unified-login`
2. 选择"管理员"标签
3. 点击"自动登录（调试）"
4. 应跳转到 `/admin/dashboard`

### 4. 测试超级管理员登录
1. 访问 `/unified-login`
2. 选择"超级管理员"标签
3. 点击"自动登录（调试）"
4. 应跳转到 `/admin/super`

---

## 🔒 安全检查

### 开发环境
- ✅ 调试按钮应该显示
- ✅ 可以使用快捷登录

### 生产环境
- ✅ 调试按钮应该隐藏
- ✅ 只能手动输入或 OAuth 登录

### 验证方法
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npx serve -s build -p 5000

# 访问登录页
# 确认调试按钮不显示
```

---

## 📁 修改的文件

### 核心文件
1. `src/App.tsx` - 路由配置
2. `src/components/auth/ProtectedRoute.tsx` - 权限守卫
3. `src/components/auth/RoleGuard.tsx` - 角色守卫
4. `src/pages/UnifiedLoginPage.tsx` - 统一登录页

### 删除的文件
1. ~~`src/pages/LoginPage.tsx`~~
2. ~~`src/pages/AdminLoginPage.tsx`~~
3. ~~`src/pages/SuperAdminLoginPage.tsx`~~

---

## 🐛 常见问题

### Q: 访问旧登录页面显示404？
A: 检查路由配置，确保重定向规则正确。

### Q: 调试按钮在生产环境显示？
A: 检查 `NODE_ENV` 环境变量是否设置为 `production`。

### Q: 登录后跳转错误？
A: 检查 `UnifiedLoginPage.tsx` 中的 `redirectToDashboard` 函数。

### Q: 权限控制不生效？
A: 检查 `RoleGuard.tsx` 中的 `allowedRoles` 配置。

---

## 📞 支持

### 文档
- [完整迁移报告](./UNIFIED-LOGIN-MIGRATION-REPORT.md)
- [迁移总结](./MIGRATION-SUMMARY.md)
- [验证清单](./verify-routes.md)

### 问题反馈
如有问题，请查看上述文档或联系开发团队。

---

**最后更新**: 2025年9月30日

