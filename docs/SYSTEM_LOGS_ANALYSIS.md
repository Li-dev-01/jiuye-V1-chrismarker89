# 系统日志功能分析报告

## 📋 执行摘要

系统日志页面 (`/admin/system-logs`) 之前显示的是**模拟数据**，因为后端API查询的是不存在的数据库表。现已修复为查询**真实的日志表**。

---

## 🔍 问题发现

### 原始问题
后端API (`/api/super-admin/system/logs`) 查询的是不存在的表：
- ❌ `admin_operation_logs` - **不存在**
- ❌ `security_events` - **不存在**

### 数据库中实际存在的日志表

| 表名 | 记录数 | 用途 | 状态 |
|------|--------|------|------|
| **admin_audit_logs** | 0 | 管理员审计日志 | ✅ 已启用 |
| **system_logs** | 2 | 系统操作日志 | ✅ 已启用 |
| **auth_logs** | 64 | 认证日志 | ✅ 已启用 |
| **account_audit_logs** | ? | 账户审计日志 | ✅ 已启用 |

---

## 📊 数据库表结构

### 1. `admin_audit_logs` - 管理员审计日志

**字段**：
```sql
CREATE TABLE admin_audit_logs (
  id INTEGER PRIMARY KEY,
  operator_email TEXT NOT NULL,      -- 操作者邮箱
  operator_role TEXT NOT NULL,       -- 操作者角色
  action TEXT NOT NULL,              -- 操作类型
  target_email TEXT,                 -- 目标邮箱
  details TEXT,                      -- 详细信息
  success BOOLEAN NOT NULL,          -- 是否成功
  error_message TEXT,                -- 错误信息
  ip_address TEXT,                   -- IP地址
  user_agent TEXT,                   -- 用户代理
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**当前数据**：0条记录

**用途**：记录管理员对用户账号的操作（创建、删除、修改等）

---

### 2. `system_logs` - 系统操作日志

**字段**：
```sql
CREATE TABLE system_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,                      -- 用户ID
  action TEXT,                       -- 操作类型
  resource_type TEXT,                -- 资源类型
  resource_id TEXT,                  -- 资源ID
  details TEXT,                      -- 详细信息（JSON）
  ip_address TEXT,                   -- IP地址
  user_agent TEXT,                   -- 用户代理
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**当前数据**：2条记录

| ID | 用户 | 操作 | 资源类型 | 时间 |
|----|------|------|----------|------|
| log-001 | normal-user-id-001 | CREATE | questionnaire | 2025-09-20 14:56:24 |
| log-002 | reviewer-user-id-001 | UPDATE | questionnaire | 2025-09-20 14:56:24 |

**用途**：记录系统级别的操作（问卷提交、审核等）

---

### 3. `auth_logs` - 认证日志

**字段**：
```sql
CREATE TABLE auth_logs (
  id INTEGER PRIMARY KEY,
  user_uuid TEXT,                    -- 用户UUID
  user_type TEXT,                    -- 用户类型
  action TEXT,                       -- 操作类型（login/logout）
  ip_address TEXT,                   -- IP地址
  user_agent TEXT,                   -- 用户代理
  device_fingerprint TEXT,           -- 设备指纹
  success BOOLEAN,                   -- 是否成功
  error_message TEXT,                -- 错误信息
  metadata TEXT,                     -- 元数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**当前数据**：64条记录

**最近5条登录记录**：

| ID | 用户类型 | 操作 | IP地址 | 时间 | 状态 |
|----|----------|------|--------|------|------|
| 64 | semi_anonymous | login | 2001:f90:6031:f42e:... | 2025-10-05 14:29:35 | ✅ 成功 |
| 63 | semi_anonymous | login | 140.245.91.100 | 2025-09-30 06:06:36 | ✅ 成功 |
| 62 | semi_anonymous | login | 2405:8100:8000:5ca1:... | 2025-09-28 09:44:34 | ✅ 成功 |
| 61 | semi_anonymous | login | 140.245.91.100 | 2025-09-27 16:33:33 | ✅ 成功 |
| 60 | semi_anonymous | login | 140.245.91.100 | 2025-09-27 15:59:02 | ✅ 成功 |

**用途**：记录所有用户的登录/登出操作

---

## 🔧 修复方案

### 修改内容

**文件**：`backend/src/routes/super-admin.ts`

**修改前**：
```typescript
// 查询不存在的表
const operationLogs = await db.query(`
  SELECT * FROM admin_operation_logs  -- ❌ 不存在
  ...
`);
```

**修改后**：
```typescript
// 查询真实存在的3个日志表
// 1. 管理员审计日志
const adminAuditLogs = await db.query(`
  SELECT * FROM admin_audit_logs
  ...
`);

// 2. 系统操作日志
const systemLogs = await db.query(`
  SELECT * FROM system_logs
  ...
`);

// 3. 认证日志
const authLogs = await db.query(`
  SELECT * FROM auth_logs
  ...
`);

// 合并所有日志
allLogs = [...adminAuditLogs, ...systemLogs, ...authLogs];
```

---

## 📈 日志分类映射

### 前端显示的分类

| 前端分类 | 数据来源 | 日志级别 | 说明 |
|---------|---------|---------|------|
| **用户管理** | `admin_audit_logs` | success/error | 管理员操作用户账号 |
| **系统操作** | `system_logs` | info | 系统级别的操作 |
| **登录监控** | `auth_logs` | success/warn | 用户登录/登出 |
| **安全事件** | - | - | 暂无数据源 |
| **系统错误** | - | - | 暂无数据源 |

### 日志级别映射

| 级别 | 颜色 | 来源规则 |
|------|------|---------|
| **success** | 绿色 | `admin_audit_logs.success = true` 或 `auth_logs.success = true` |
| **error** | 红色 | `admin_audit_logs.success = false` |
| **warn** | 橙色 | `auth_logs.success = false` |
| **info** | 蓝色 | `system_logs` 所有记录 |

---

## 🎯 当前日志统计

### 总览

| 日志类型 | 记录数 | 最早记录 | 最新记录 |
|---------|--------|----------|----------|
| 管理员审计 | 0 | - | - |
| 系统操作 | 2 | 2025-09-20 | 2025-09-20 |
| 认证日志 | 64 | - | 2025-10-05 |
| **总计** | **66** | - | - |

### 按日志级别统计

| 级别 | 数量 | 占比 |
|------|------|------|
| success | 64 | 96.97% |
| info | 2 | 3.03% |
| warn | 0 | 0% |
| error | 0 | 0% |

### 按分类统计

| 分类 | 数量 | 占比 |
|------|------|------|
| 登录监控 | 64 | 96.97% |
| 系统操作 | 2 | 3.03% |
| 用户管理 | 0 | 0% |

---

## ⚠️ 日志记录缺失

### 当前未记录的操作

1. **管理员操作** - `admin_audit_logs` 表为空
   - 创建/删除用户账号
   - 修改用户权限
   - 修改系统设置

2. **安全事件** - 无对应表
   - IP封禁
   - DDoS攻击检测
   - 异常登录尝试

3. **系统错误** - 无对应表
   - API错误
   - 数据库错误
   - 服务异常

---

## 📝 建议

### 1. 启用管理员操作日志记录

在管理员操作的API中添加日志记录：

```typescript
// 示例：创建用户账号时记录日志
await db.execute(`
  INSERT INTO admin_audit_logs (
    operator_email, operator_role, action, target_email,
    details, success, ip_address, user_agent
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`, [
  operatorEmail, operatorRole, 'CREATE_USER', targetEmail,
  JSON.stringify(details), true, ipAddress, userAgent
]);
```

### 2. 创建安全事件表

```sql
CREATE TABLE security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,          -- 事件类型
  severity TEXT NOT NULL,            -- 严重程度（low/medium/high/critical）
  source_ip TEXT,                    -- 来源IP
  target_resource TEXT,              -- 目标资源
  description TEXT,                  -- 描述
  handled BOOLEAN DEFAULT 0,         -- 是否已处理
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 创建系统错误日志表

```sql
CREATE TABLE error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL,          -- 错误类型
  error_code TEXT,                   -- 错误代码
  error_message TEXT,                -- 错误信息
  stack_trace TEXT,                  -- 堆栈跟踪
  request_url TEXT,                  -- 请求URL
  request_method TEXT,               -- 请求方法
  user_id TEXT,                      -- 用户ID
  ip_address TEXT,                   -- IP地址
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ 验证清单

- [x] 修复后端API查询不存在的表
- [x] 修改为查询真实的日志表
- [x] 部署后端更新
- [ ] 测试系统日志页面显示真实数据
- [ ] 验证筛选功能正常工作
- [ ] 验证搜索功能正常工作
- [ ] 添加管理员操作日志记录
- [ ] 创建安全事件表
- [ ] 创建系统错误日志表

---

## 🚀 部署信息

**部署时间**: 2025-10-06  
**版本**: fc2dad9a-62fd-47d1-8745-e7d2b681799e  
**状态**: ✅ 已部署到生产环境

---

## 📖 使用说明

### 查看系统日志

1. 登录超级管理员账号
2. 访问 `/admin/system-logs` 页面
3. 使用筛选功能：
   - **日志级别**：success/error/warn/info
   - **分类**：用户管理/系统操作/登录监控
   - **搜索**：支持搜索用户、IP、操作内容

### 当前可查看的日志

- ✅ **64条认证日志** - 用户登录记录
- ✅ **2条系统日志** - 问卷提交和审核记录
- ⚠️ **0条管理员日志** - 需要添加日志记录功能

---

**生成时间**: 2025-10-06  
**文档版本**: 1.0  
**状态**: 已修复，待测试验证

