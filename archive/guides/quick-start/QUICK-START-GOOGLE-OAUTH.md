# 🚀 Google OAuth快速开始指南

## 📋 前提条件

### ⚠️ 必须完成：在Google Cloud Console添加回调URL

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择项目
3. 导航到 "API和服务" > "凭据"
4. 找到 OAuth 2.0 客户端ID: `23546164414-3t3g8n9hvnv4ekjok90co2sm3sfb6mt8.apps.googleusercontent.com`
5. 点击编辑
6. 在"已获授权的重定向 URI"中添加：

```
https://6d83bdfb.reviewer-admin-dashboard.pages.dev/auth/google/callback
```

7. 保存

---

## 🎯 快速测试流程

### 步骤1: 访问管理员登录页面

**URL**: https://6d83bdfb.reviewer-admin-dashboard.pages.dev/admin/login

### 步骤2: 点击"使用 Google 账号登录"按钮

### 步骤3: 选择Gmail账号并授权

### 步骤4: 验证结果

#### ✅ 如果您的Gmail在白名单中

- 登录成功
- 自动跳转到管理员仪表板
- 显示欢迎信息

#### ❌ 如果您的Gmail不在白名单中

- 登录失败
- 显示错误信息："您的邮箱不在白名单中"
- 需要联系超级管理员添加到白名单

---

## 🔐 超级管理员白名单

当前白名单中的超级管理员Gmail：

1. chrismarker89@gmail.com
2. aibook2099@gmail.com
3. justpm2099@gmail.com

---

## 📝 添加新用户到白名单

### 方法1: 通过超级管理员账户管理页面

1. 使用超级管理员Gmail登录
2. 访问: https://6d83bdfb.reviewer-admin-dashboard.pages.dev/admin/account-management
3. 点击"添加用户"
4. 填写信息：
   - Gmail邮箱: example@gmail.com
   - 角色: 选择（审核员/管理员/超级管理员）
   - 权限: 勾选需要的权限
   - 允许账号密码登录: 可选
   - 用户名和密码: 如果允许密码登录，需要填写
5. 保存

### 方法2: 通过数据库直接添加

```sql
INSERT INTO admin_whitelist (
  email, 
  role, 
  permissions, 
  is_active, 
  allow_google_login,
  created_at,
  updated_at
) VALUES (
  'newuser@gmail.com',
  'admin',
  '["review_content", "view_dashboard", "manage_content"]',
  1,
  1,
  datetime('now'),
  datetime('now')
);
```

---

## 🌐 所有登录页面

### 审核员登录

- **URL**: https://6d83bdfb.reviewer-admin-dashboard.pages.dev/login
- **支持**: Google OAuth + 账号密码
- **跳转**: /dashboard

### 管理员登录

- **URL**: https://6d83bdfb.reviewer-admin-dashboard.pages.dev/admin/login
- **支持**: Google OAuth + 账号密码
- **跳转**: /admin/dashboard

### 超级管理员登录

- **URL**: https://6d83bdfb.reviewer-admin-dashboard.pages.dev/admin/super-login
- **支持**: Google OAuth + 账号密码
- **跳转**: /admin/super

### 统一登录页面

- **URL**: https://6d83bdfb.reviewer-admin-dashboard.pages.dev/login-unified
- **支持**: 三个Tab页面（审核员/管理员/超级管理员）
- **功能**: Google OAuth + 账号密码 + 2FA

---

## 🧪 测试账号

### 账号密码登录（用于测试）

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 审核员 | reviewerA | admin123 | 测试审核员账号 |
| 管理员 | admin | admin123 | 测试管理员账号 |
| 超级管理员 | superadmin | admin123 | 测试超级管理员账号 |

---

## 🔍 故障排查

### 问题1: 点击Google登录按钮没有反应

**原因**: 可能是浏览器阻止了弹出窗口

**解决方案**:
1. 检查浏览器控制台是否有错误
2. 允许浏览器弹出窗口
3. 刷新页面重试

### 问题2: Google OAuth返回错误 "redirect_uri_mismatch"

**原因**: 回调URL未在Google Cloud Console中配置

**解决方案**:
1. 访问Google Cloud Console
2. 添加回调URL: `https://6d83bdfb.reviewer-admin-dashboard.pages.dev/auth/google/callback`
3. 保存并等待几分钟生效

### 问题3: 登录后显示"您的邮箱不在白名单中"

**原因**: 您的Gmail未添加到白名单

**解决方案**:
1. 联系超级管理员
2. 请求将您的Gmail添加到白名单
3. 等待添加完成后重新登录

### 问题4: 登录成功但没有跳转

**原因**: 可能是localStorage权限问题

**解决方案**:
1. 检查浏览器控制台是否有错误
2. 清除浏览器缓存和localStorage
3. 刷新页面重新登录

---

## 📊 登录流程图

```
用户点击"使用 Google 账号登录"
    ↓
生成state参数并保存到sessionStorage
    ↓
重定向到Google OAuth授权页面
    ↓
用户选择Gmail账号并授权
    ↓
Google重定向回 /auth/google/callback?code=xxx&state=xxx
    ↓
前端验证state参数
    ↓
调用后端API: POST /api/auth/google/callback
    ↓
后端交换code获取access_token
    ↓
后端获取Google用户信息
    ↓
后端验证Gmail是否在白名单中
    ↓
✅ 在白名单中                    ❌ 不在白名单中
    ↓                                ↓
创建/更新用户数据              返回403错误
    ↓                                ↓
生成会话数据                    前端显示错误信息
    ↓
返回用户数据和会话信息
    ↓
前端保存到localStorage
    ↓
跳转到对应仪表板
```

---

## 🎯 下一步

### 立即执行

1. ✅ 在Google Cloud Console添加回调URL
2. ✅ 使用超级管理员Gmail测试登录
3. ✅ 创建测试账户
4. ✅ 测试不同角色的登录流程

### 推荐配置

1. 为超级管理员启用2FA
2. 添加更多审核员和管理员到白名单
3. 配置权限策略
4. 定期审查审计日志

---

## 📞 支持

如有问题，请联系超级管理员：

- chrismarker89@gmail.com
- aibook2099@gmail.com
- justpm2099@gmail.com

---

**快速开始指南完成！** ✅

现在您可以使用Gmail账号一键登录管理后台了！

