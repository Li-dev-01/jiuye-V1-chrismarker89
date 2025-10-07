# 管理员认证系统部署指南

## 📋 系统概述

本次更新实现了完整的管理员认证和账户管理系统，包括：

### ✨ 核心功能

1. **统一登录页面**
   - 三个Tab页面：审核员、管理员、超级管理员
   - 支持账号密码登录
   - 支持Google OAuth登录
   - 角色自动识别和路由

2. **Gmail白名单系统**
   - 严格的邮箱白名单验证
   - 防止暴力破解攻击
   - 支持角色权限分配

3. **超级管理员账户管理**
   - 创建和管理审核员、管理员账户
   - Gmail白名单管理
   - 权限配置（细粒度权限控制）
   - 账号密码登录开关
   - 2FA双因素认证设置

4. **安全特性**
   - 2FA双因素认证（TOTP）
   - 登录尝试记录
   - 会话管理
   - 审计日志

---

## 🗄️ 数据库Schema

### 核心表

1. **admin_whitelist** - 管理员白名单
   - 存储Gmail邮箱、角色、权限
   - 账号密码（可选）
   - 2FA设置
   - 状态管理

2. **admin_sessions** - 登录会话
   - 会话ID、用户信息
   - 登录方式（password/google_oauth/2fa）
   - IP地址、设备信息
   - 过期时间

3. **admin_login_attempts** - 登录尝试记录
   - 防暴力破解
   - 记录成功/失败的登录尝试
   - IP地址追踪

4. **two_factor_verifications** - 2FA验证记录
   - TOTP验证历史
   - 备用恢复码使用记录

5. **admin_audit_logs** - 审计日志
   - 管理员操作记录
   - 权限变更历史
   - 安全事件追踪

---

## 🚀 部署步骤

### 步骤1: 初始化数据库

```bash
cd backend

# 执行数据库初始化脚本
chmod +x scripts/init-admin-whitelist.sh
./scripts/init-admin-whitelist.sh
```

这将创建所有必要的表，并插入初始超级管理员白名单：
- chrismarker89@gmail.com
- aibook2099@gmail.com
- justpm2099@gmail.com

### 步骤2: 安装依赖

后端需要新的依赖包：

```bash
cd backend
npm install bcryptjs speakeasy qrcode
npm install --save-dev @types/bcryptjs @types/speakeasy @types/qrcode
```

### 步骤3: 部署后端

```bash
cd backend
npm run deploy
```

### 步骤4: 部署前端

```bash
cd reviewer-admin-dashboard
npm run build
npx wrangler pages deploy build --project-name=reviewer-admin-dashboard
```

---

## 🔑 API端点

### 白名单管理

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/admin/whitelist` | GET | 获取白名单用户列表 | 超级管理员 |
| `/api/admin/whitelist` | POST | 添加白名单用户 | 超级管理员 |
| `/api/admin/whitelist/:id` | PUT | 更新白名单用户 | 超级管理员 |
| `/api/admin/whitelist/:id` | DELETE | 删除白名单用户 | 超级管理员 |
| `/api/admin/whitelist/:id/enable-2fa` | POST | 启用2FA | 超级管理员 |
| `/api/admin/whitelist/:id/disable-2fa` | POST | 禁用2FA | 超级管理员 |
| `/api/admin/whitelist/verify-2fa` | POST | 验证2FA代码 | 所有用户 |

### Google OAuth

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/google/callback` | POST | 处理Google OAuth回调 |

---

## 🎯 使用指南

### 超级管理员首次登录

1. 访问统一登录页面：`https://your-domain.pages.dev/login-unified`
2. 切换到"超级管理员"Tab
3. 点击"使用 Google 账号登录"
4. 使用白名单中的Gmail账号登录
5. 登录成功后跳转到超级管理员仪表板

### 创建新的管理员/审核员账户

1. 登录超级管理员账号
2. 访问"账户管理"页面：`/admin/account-management`
3. 点击"添加用户"按钮
4. 填写信息：
   - Gmail邮箱（必填）
   - 角色（reviewer/admin/super_admin）
   - 权限（多选）
   - 是否允许密码登录
   - 用户名和密码（如果允许密码登录）
5. 保存

### 启用2FA

1. 在账户管理页面找到目标用户
2. 点击"启用"按钮（2FA列）
3. 扫描二维码或手动输入密钥
4. 使用Google Authenticator等TOTP应用
5. 保存备用恢复码

### 普通用户登录流程

#### Google OAuth登录
1. 访问 `/login-unified`
2. 选择对应角色Tab
3. 点击"使用 Google 账号登录"
4. 授权后自动跳转到仪表板

#### 账号密码登录
1. 访问 `/login-unified`
2. 选择对应角色Tab
3. 输入用户名和密码
4. 如果启用了2FA，输入6位验证码
5. 登录成功

---

## 🔐 安全特性

### Gmail白名单

- **严格验证**：只有白名单中的Gmail邮箱可以登录
- **角色绑定**：每个邮箱绑定特定角色
- **防暴力破解**：记录所有登录尝试，可设置IP封禁

### 2FA双因素认证

- **TOTP标准**：使用Time-based One-Time Password
- **备用恢复码**：10个一次性恢复码
- **强制启用**：可为超级管理员强制启用2FA

### 审计日志

- **完整记录**：所有管理员操作都被记录
- **不可篡改**：只能追加，不能修改或删除
- **详细信息**：包含操作者、目标、时间、IP等

---

## 📊 数据库查询示例

### 查看所有白名单用户

```sql
SELECT email, role, is_active, two_factor_enabled 
FROM admin_whitelist 
ORDER BY created_at DESC;
```

### 查看最近的登录尝试

```sql
SELECT email, ip_address, success, attempted_at 
FROM admin_login_attempts 
ORDER BY attempted_at DESC 
LIMIT 20;
```

### 查看审计日志

```sql
SELECT operator_email, action, target_email, created_at 
FROM admin_audit_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

---

## 🧪 测试

### 测试账号（开发环境）

数据库初始化时会创建测试账号：

| 邮箱 | 角色 | 用户名 | 密码 | 允许密码登录 |
|------|------|--------|------|-------------|
| admin@test.com | admin | admin1 | (需设置) | 是 |
| reviewer@test.com | reviewer | reviewerA | (需设置) | 是 |

### 测试流程

1. **测试Google OAuth登录**
   - 使用白名单Gmail账号
   - 验证角色识别
   - 验证跳转路由

2. **测试账号密码登录**
   - 使用测试账号
   - 验证密码验证
   - 验证2FA流程（如果启用）

3. **测试账户管理**
   - 创建新用户
   - 修改权限
   - 启用/禁用2FA
   - 删除用户

4. **测试安全特性**
   - 尝试非白名单邮箱登录（应失败）
   - 尝试错误密码（应记录）
   - 验证2FA代码（正确/错误）

---

## 🐛 故障排查

### 问题1: Google OAuth登录失败

**可能原因**：
- Google OAuth Client ID配置错误
- 回调URL不匹配
- 邮箱不在白名单中

**解决方案**：
1. 检查Google Cloud Console中的OAuth配置
2. 确认回调URL：`https://your-domain.pages.dev/auth/google/callback`
3. 检查数据库中的白名单记录

### 问题2: 2FA验证失败

**可能原因**：
- 时间不同步
- 密钥输入错误
- 验证码过期

**解决方案**：
1. 确保服务器和客户端时间同步
2. 重新扫描二维码
3. 使用备用恢复码

### 问题3: 数据库表不存在

**可能原因**：
- 初始化脚本未执行
- SQL语法错误

**解决方案**：
```bash
# 重新执行初始化脚本
cd backend
./scripts/init-admin-whitelist.sh

# 手动检查表
npx wrangler d1 execute college-employment-survey --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 📝 后续改进建议

### 短期（1-2周）

1. **邮件通知**
   - 新账户创建通知
   - 2FA启用通知
   - 异常登录警告

2. **IP白名单**
   - 限制特定IP范围
   - 地理位置限制

3. **会话管理**
   - 强制登出
   - 多设备管理
   - 会话超时配置

### 中期（1-2个月）

1. **高级审计**
   - 可视化审计日志
   - 异常行为检测
   - 自动告警

2. **权限细化**
   - 更细粒度的权限控制
   - 临时权限授予
   - 权限审批流程

3. **备份恢复**
   - 账户数据备份
   - 灾难恢复方案

### 长期（3-6个月）

1. **SSO集成**
   - 支持更多OAuth提供商
   - SAML支持
   - 企业级身份管理

2. **合规性**
   - GDPR合规
   - 数据保留策略
   - 隐私保护增强

---

## 🎉 总结

本次更新实现了完整的管理员认证和账户管理系统，主要特点：

✅ **统一登录体验** - 三种角色一个页面  
✅ **Gmail白名单** - 严格的访问控制  
✅ **2FA安全** - 双因素认证保护  
✅ **完整审计** - 所有操作可追溯  
✅ **灵活权限** - 细粒度权限管理  

系统已准备好部署到生产环境！

---

**部署日期**: 2025-09-30  
**版本**: 1.0.0  
**维护者**: 超级管理员团队

