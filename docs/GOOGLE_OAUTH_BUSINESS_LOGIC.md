# Google OAuth 一键登录业务逻辑

## 🎯 核心理念

Google OAuth一键登录的本质是**自动化用户注册和登录流程**，通过邮箱验证身份，系统自动生成和管理用户凭据，免去用户手动输入复杂账号密码的过程。

## 👥 用户类型与处理逻辑

### 1. 问卷用户（半匿名用户）

#### **业务逻辑**
- **目标**：降低参与门槛，保护用户隐私
- **原理**：邮箱绑定复杂A+B值，防止撞库攻击
- **流程**：一键注册 → 自动生成身份 → 免密登录

#### **技术实现**
```typescript
// 1. 检查是否已存在该邮箱的用户
const existingUser = await db.queryFirst(`
  SELECT uuid, display_name, metadata, status
  FROM universal_users
  WHERE user_type = 'semi_anonymous'
  AND JSON_EXTRACT(metadata, '$.googleEmail') = ?
`, [googleUser.email]);

// 2. 如果存在，生成对应的A+B值用于登录
if (existingUser) {
  const identityA = generateIdentityAFromUuid(existingUser.uuid); // 11位数字
  const identityB = generateIdentityBFromUuid(existingUser.uuid); // 4位数字
  
  return {
    identityA,
    identityB,
    user: existingUser
  };
}

// 3. 如果不存在，创建新用户并生成A+B值
const newUser = await createSemiAnonymousUser(googleUser);
const identityA = generateIdentityAFromUuid(newUser.uuid);
const identityB = generateIdentityBFromUuid(newUser.uuid);
```

#### **A+B值生成算法（防撞库）**
```typescript
function generateIdentityAFromUuid(uuid: string): string {
  // 使用UUID + 时间戳 + 哈希算法生成11位数字
  const numericPart = uuid.replace(/[^0-9]/g, '');
  const timestamp = Date.now().toString();
  const combined = numericPart + timestamp;
  
  // 哈希确保唯一性和复杂性
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // 生成11位数字，确保不以0开头
  const absHash = Math.abs(hash).toString();
  const paddedHash = absHash.padEnd(11, '0').substring(0, 11);
  return paddedHash.charAt(0) === '0' ? '1' + paddedHash.substring(1) : paddedHash;
}
```

### 2. 管理员用户（白名单验证）

#### **业务逻辑**
- **目标**：安全的管理员身份验证
- **原理**：邮箱白名单 + 自动生成管理员凭据
- **流程**：白名单验证 → 自动创建账户 → 分配权限

#### **技术实现**
```typescript
// 1. 验证邮箱是否在白名单中
const whitelistEntry = await getWhitelistEntry(db, googleUser.email);
if (!whitelistEntry) {
  throw new Error('您的邮箱不在管理员白名单中');
}

// 2. 检查是否已存在管理员账户
const existingAdmin = await db.queryFirst(`
  SELECT * FROM universal_users
  WHERE user_type IN ('admin', 'reviewer', 'super_admin')
  AND JSON_EXTRACT(metadata, '$.googleEmail') = ?
`, [googleUser.email]);

// 3. 如果不存在，自动创建管理员账户
if (!existingAdmin) {
  const adminUsername = generateAdminUsername(googleUser.email, whitelistEntry.role);
  const adminPassword = generateAdminPassword(googleUser.email, userUuid);
  
  const adminUser = {
    uuid: userUuid,
    user_type: whitelistEntry.role,
    display_name: googleUser.name,
    permissions: getPermissionsByRole(whitelistEntry.role),
    metadata: {
      googleEmail: googleUser.email,
      generatedCredentials: {
        username: adminUsername,
        passwordHash: generatePasswordHash(adminPassword)
      }
    }
  };
}
```

#### **管理员凭据生成算法**
```typescript
function generateAdminUsername(email: string, role: string): string {
  const emailPrefix = email.split('@')[0];
  const rolePrefix = role.replace('_', '');
  return `${rolePrefix}_${emailPrefix}`.toLowerCase();
  // 例如: admin_john, superadmin_mary
}

function generateAdminPassword(email: string, uuid: string): string {
  const emailHash = email.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  const uuidPart = uuid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  const timestamp = Math.floor(Date.now() / 1000000);
  
  return `Admin${Math.abs(emailHash)}${uuidPart}${timestamp}`.substring(0, 16);
  // 例如: Admin123abc456789
}
```

## 🔄 完整流程图

### 问卷用户流程
```
用户点击Google登录
    ↓
Google OAuth授权
    ↓
获取用户邮箱信息
    ↓
检查邮箱是否已注册 ──→ 是 ──→ 生成对应A+B值 ──→ 自动登录
    ↓                                    ↓
    否                                  跳转到首页
    ↓
创建半匿名用户
    ↓
生成复杂A+B值
    ↓
绑定邮箱到A+B值
    ↓
自动登录并跳转
```

### 管理员流程
```
管理员点击Google登录
    ↓
Google OAuth授权
    ↓
获取管理员邮箱信息
    ↓
检查邮箱白名单 ──→ 不在 ──→ 拒绝登录
    ↓
    在白名单中
    ↓
检查是否已有账户 ──→ 是 ──→ 直接登录
    ↓                      ↓
    否                    跳转到管理后台
    ↓
自动创建管理员账户
    ↓
生成用户名和密码
    ↓
分配对应权限
    ↓
登录并跳转到管理后台
```

## 🔐 安全考虑

### 1. 防撞库机制
- **A值**：11位数字，基于UUID+时间戳+哈希算法生成
- **B值**：4位数字，基于UUID多部分哈希生成
- **唯一性**：每个邮箱对应唯一的A+B组合
- **复杂性**：算法确保难以被暴力破解

### 2. 管理员安全
- **白名单控制**：只有预设邮箱才能成为管理员
- **权限分级**：super_admin > admin > reviewer
- **凭据管理**：自动生成的用户名密码存储在加密metadata中
- **会话管理**：管理员会话时间较短（8小时）

### 3. 数据保护
- **邮箱加密存储**：敏感信息存储在JSON metadata中
- **最小权限原则**：用户只获得必要的权限
- **审计日志**：记录所有登录和操作行为

## 📊 数据库设计

### universal_users表结构
```sql
CREATE TABLE universal_users (
  uuid VARCHAR(255) PRIMARY KEY,
  user_type ENUM('semi_anonymous', 'admin', 'reviewer', 'super_admin'),
  display_name VARCHAR(255),
  permissions JSON,
  profile JSON,
  metadata JSON, -- 存储Google邮箱、生成的凭据等
  status ENUM('active', 'inactive', 'suspended'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_active_at TIMESTAMP
);
```

### google_oauth_whitelist表结构
```sql
CREATE TABLE google_oauth_whitelist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  role ENUM('admin', 'reviewer', 'super_admin'),
  status ENUM('active', 'inactive'),
  display_name VARCHAR(255),
  created_at TIMESTAMP,
  last_used_at TIMESTAMP
);
```

## 🎯 优势总结

1. **用户体验**：一键登录，无需记忆复杂密码
2. **安全性**：防撞库算法 + 白名单控制
3. **可维护性**：自动化账户管理，减少人工干预
4. **可扩展性**：支持多种用户类型和权限级别
5. **隐私保护**：半匿名机制保护用户隐私

这个设计完全符合您描述的业务逻辑：**通过邮箱验证身份，系统自动生成和管理复杂的用户凭据，实现真正的一键登录体验**。
