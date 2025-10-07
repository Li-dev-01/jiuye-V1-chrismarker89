# 🚀 快速访问链接

## 🌐 前端页面

### 统一登录页面（推荐）
**URL**: https://8b7c3c10.reviewer-admin-dashboard.pages.dev/login-unified

**功能**:
- 三个Tab页面（审核员、管理员、超级管理员）
- Google OAuth登录
- 账号密码登录
- 2FA双因素认证

---

### 超级管理员账户管理
**URL**: https://8b7c3c10.reviewer-admin-dashboard.pages.dev/admin/account-management

**功能**:
- 创建审核员、管理员账户
- Gmail白名单管理
- 权限配置
- 2FA启用/禁用

---

### 旧版登录页面（兼容性）

- **审核员登录**: https://8b7c3c10.reviewer-admin-dashboard.pages.dev/login
- **管理员登录**: https://8b7c3c10.reviewer-admin-dashboard.pages.dev/admin/login
- **超级管理员登录**: https://8b7c3c10.reviewer-admin-dashboard.pages.dev/admin/super-login

---

## 🔌 后端API

### 基础URL
**URL**: https://employment-survey-api-prod.chrismarker89.workers.dev

### 健康检查
**URL**: https://employment-survey-api-prod.chrismarker89.workers.dev/health

### 白名单管理API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/admin/whitelist` | GET | 获取白名单用户列表 |
| `/api/admin/whitelist` | POST | 添加白名单用户 |
| `/api/admin/whitelist/:id` | PUT | 更新白名单用户 |
| `/api/admin/whitelist/:id` | DELETE | 删除白名单用户 |
| `/api/admin/whitelist/:id/enable-2fa` | POST | 启用2FA |
| `/api/admin/whitelist/:id/disable-2fa` | POST | 禁用2FA |
| `/api/admin/whitelist/verify-2fa` | POST | 验证2FA代码 |

---

## 🔐 超级管理员白名单

| 邮箱 | 角色 | 状态 |
|------|------|------|
| chrismarker89@gmail.com | super_admin | ✅ 激活 |
| aibook2099@gmail.com | super_admin | ✅ 激活 |
| justpm2099@gmail.com | super_admin | ✅ 激活 |

---

## 📚 文档

- **部署指南**: [ADMIN-AUTH-SYSTEM-DEPLOYMENT.md](./ADMIN-AUTH-SYSTEM-DEPLOYMENT.md)
- **部署成功报告**: [DEPLOYMENT-SUCCESS-REPORT.md](./DEPLOYMENT-SUCCESS-REPORT.md)
- **最终总结**: [FINAL-SUMMARY.md](./FINAL-SUMMARY.md)

---

## 🧪 测试脚本

```bash
# 运行测试脚本
./test-admin-auth-system.sh
```

---

## 🎯 快速开始

### 1. 超级管理员登录

```
1. 访问: https://8b7c3c10.reviewer-admin-dashboard.pages.dev/login-unified
2. 切换到"超级管理员"Tab
3. 点击"使用 Google 账号登录"
4. 使用白名单Gmail账号登录
```

### 2. 创建新账户

```
1. 访问: https://8b7c3c10.reviewer-admin-dashboard.pages.dev/admin/account-management
2. 点击"添加用户"
3. 填写信息并保存
```

### 3. 启用2FA

```
1. 在账户管理页面找到用户
2. 点击"启用"按钮（2FA列）
3. 扫描二维码
4. 保存备用恢复码
```

---

**快速访问链接已准备就绪！** ✅

