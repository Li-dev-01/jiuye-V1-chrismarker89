# 🚀 邮箱与角色账号系统 - 快速访问

## 📋 核心概念

**一个邮箱 = 多个角色账号**

```
chrismarker89@gmail.com
  ├─ 超级管理员账号 ✅
  ├─ 管理员账号 ✅
  └─ 审核员账号 ✅
```

用户登录时：
1. 选择角色（审核员/管理员/超级管理员）
2. 使用Gmail一键登录
3. 系统验证该邮箱是否有对应角色的账号
4. 有 → 登录成功 | 无 → 提示无权限

---

## 🌐 快速访问链接

### 登录页面

| 角色 | URL |
|------|-----|
| 审核员登录 | https://7a19116a.reviewer-admin-dashboard.pages.dev/login |
| 管理员登录 | https://7a19116a.reviewer-admin-dashboard.pages.dev/admin/login |
| 超级管理员登录 | https://7a19116a.reviewer-admin-dashboard.pages.dev/admin/super-login |

### 管理页面

| 功能 | URL |
|------|-----|
| 邮箱与角色账号管理 | https://7a19116a.reviewer-admin-dashboard.pages.dev/admin/email-role-accounts |
| 超级管理员控制台 | https://7a19116a.reviewer-admin-dashboard.pages.dev/admin/super |

---

## 👥 当前账号

### 超级管理员邮箱

| 邮箱 | 角色账号 | 状态 |
|------|---------|------|
| chrismarker89@gmail.com | super_admin | ✅ |
| aibook2099@gmail.com | super_admin | ✅ |
| justpm2099@gmail.com | super_admin | ✅ |

### 测试账号

| 邮箱 | 角色账号 | 说明 |
|------|---------|------|
| test@gmail.com | super_admin, admin, reviewer | 演示一个邮箱多个角色 |
| admin@test.com | admin | 管理员测试账号 |
| reviewer@test.com | reviewer | 审核员测试账号 |

---

## 📝 创建角色账号

### 步骤

1. 访问: https://7a19116a.reviewer-admin-dashboard.pages.dev/admin/email-role-accounts

2. 点击"创建角色账号"

3. 填写表单:
   ```
   Gmail邮箱: user@gmail.com
   角色: 管理员
   显示名称: 张三 (管理员)
   权限: [勾选需要的权限]
   允许账号密码登录: [可选]
   ```

4. 点击"确定"

### 示例：为一个邮箱创建多个角色

**场景**: chrismarker89@gmail.com 需要3个角色

```
第1次创建:
  邮箱: chrismarker89@gmail.com
  角色: super_admin
  显示名称: Chris (Super Admin)

第2次创建:
  邮箱: chrismarker89@gmail.com
  角色: admin
  显示名称: Chris (Admin)

第3次创建:
  邮箱: chrismarker89@gmail.com
  角色: reviewer
  显示名称: Chris (Reviewer)
```

结果：chrismarker89@gmail.com 现在有3个角色账号

---

## 🔐 登录流程

### 用户登录

1. 访问登录页面（根据需要的角色选择）

2. **选择角色Tab**
   - 审核员
   - 管理员
   - 超级管理员

3. 点击"使用 Google 账号登录"

4. Google OAuth验证

5. 系统验证:
   - ✅ 邮箱在白名单中？
   - ✅ 该邮箱有对应角色的账号？

6. 登录成功 → 跳转到对应仪表板

### 示例

**用户**: chrismarker89@gmail.com  
**拥有角色**: super_admin, admin, reviewer

**场景1**: 登录为超级管理员
```
1. 访问: /admin/super-login
2. 选择Tab: 超级管理员
3. Google登录
4. ✅ 验证通过（有super_admin账号）
5. 跳转到: /admin/super
```

**场景2**: 登录为管理员
```
1. 访问: /admin/login
2. 选择Tab: 管理员
3. Google登录
4. ✅ 验证通过（有admin账号）
5. 跳转到: /admin/dashboard
```

**场景3**: 登录为审核员
```
1. 访问: /login
2. 选择Tab: 审核员
3. Google登录
4. ✅ 验证通过（有reviewer账号）
5. 跳转到: /dashboard
```

---

## 🔍 查看账号

### 在管理页面查看

访问: https://7a19116a.reviewer-admin-dashboard.pages.dev/admin/email-role-accounts

可以看到:
- 所有邮箱列表
- 每个邮箱的角色账号
- 点击展开查看详细信息

### 使用数据库查询

```sql
-- 查看所有邮箱
SELECT id, email, is_active FROM email_whitelist;

-- 查看所有角色账号
SELECT id, email, role, username, display_name 
FROM role_accounts 
ORDER BY email, role;

-- 查看一个邮箱的所有角色
SELECT email, COUNT(*) as role_count, GROUP_CONCAT(role, ', ') as roles 
FROM role_accounts 
GROUP BY email 
ORDER BY role_count DESC;
```

---

## ⚠️ 常见问题

### Q1: 登录时提示"您没有该角色权限"

**原因**: 您的邮箱没有对应角色的账号

**解决方案**:
1. 联系超级管理员
2. 请求为您的邮箱创建对应角色的账号
3. 等待创建完成后重新登录

### Q2: 如何为一个邮箱添加多个角色？

**答案**: 多次创建角色账号，每次选择不同的角色

```
第1次: 邮箱 + 审核员角色
第2次: 同一邮箱 + 管理员角色
第3次: 同一邮箱 + 超级管理员角色
```

### Q3: 一个邮箱可以同时登录多个角色吗？

**答案**: 可以，但需要在不同的浏览器或隐私窗口中登录

### Q4: 如何删除角色账号？

**答案**: 
1. 访问邮箱与角色账号管理页面
2. 展开对应邮箱的角色账号列表
3. 点击"删除"按钮
4. 确认删除

---

## 📊 数据库结构

### 核心表

```
email_whitelist (邮箱白名单)
  ├─ id
  ├─ email (唯一)
  ├─ is_active
  └─ two_factor_enabled

role_accounts (角色账号)
  ├─ id
  ├─ email (关联email_whitelist)
  ├─ role (reviewer/admin/super_admin)
  ├─ username (唯一)
  ├─ display_name
  ├─ permissions
  └─ UNIQUE(email, role) ← 一个邮箱+角色组合唯一

login_sessions (登录会话)
  ├─ session_id
  ├─ email
  ├─ role
  └─ account_id (关联role_accounts)
```

---

## 🎯 最佳实践

### 1. 为超级管理员创建多个角色

建议为超级管理员邮箱创建所有3个角色：

```
chrismarker89@gmail.com
  ├─ super_admin (日常管理)
  ├─ admin (测试管理员功能)
  └─ reviewer (测试审核员功能)
```

### 2. 使用有意义的显示名称

```
✅ 好的显示名称:
  - "张三 (超级管理员)"
  - "李四 (内容管理员)"
  - "王五 (审核员 - 技术组)"

❌ 不好的显示名称:
  - "user1"
  - "admin"
  - "test"
```

### 3. 合理分配权限

```
审核员: review_content, view_dashboard
管理员: manage_content, view_analytics, manage_api
超级管理员: all
```

---

## 🔗 相关文档

- **完整报告**: EMAIL-ROLE-ACCOUNT-SYSTEM-COMPLETE.md
- **数据库Schema**: backend/database/email-role-account-schema.sql
- **API文档**: backend/src/routes/email-role-auth.ts

---

**快速访问指南完成！** ✅

现在您可以轻松管理邮箱和角色账号了！

