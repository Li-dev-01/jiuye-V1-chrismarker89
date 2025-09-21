# UUID用户管理系统实现文档

## 🎯 系统概述

UUID用户管理系统是一个统一的用户身份管理解决方案，支持5种用户类型的认证、权限管理和内容关联。系统采用前后端分离架构，提供完整的API接口和前端组件。

## 📋 用户类型

### 1. 全匿名用户 (Anonymous)
- **UUID格式**: `anon-YYYYMMDD-uuid`
- **权限**: 浏览内容、提交问卷
- **会话时长**: 24小时
- **特点**: 基于设备指纹识别，无需注册

### 2. 半匿名用户 (Semi-Anonymous)
- **UUID格式**: `semi-YYYYMMDD-uuid`
- **权限**: 浏览内容、提交问卷、管理自己的内容、下载权限
- **会话时长**: 24小时
- **特点**: A+B组合认证，可管理关联内容

### 3. 审核员 (Reviewer)
- **UUID格式**: `rev-uuid`
- **权限**: 内容审核、查看审核统计
- **会话时长**: 1小时
- **特点**: 由管理员创建，负责内容审核

### 4. 管理员 (Admin)
- **UUID格式**: `admin-uuid`
- **权限**: 项目管理、用户管理、系统设置
- **会话时长**: 1小时
- **特点**: 完整的项目管理权限

### 5. 超级管理员 (Super Admin)
- **UUID格式**: `super-uuid`
- **权限**: 所有权限、项目开关控制
- **会话时长**: 1小时
- **特点**: 最高权限，可控制项目状态

## 🏗️ 系统架构

### 前端架构
```
src/
├── types/
│   └── uuid-system.ts          # 类型定义
├── services/
│   ├── uuidUserService.ts      # 用户管理服务
│   ├── uuidApi.ts              # API服务
│   └── uuidQuestionnaireService.ts # 问卷适配器
├── stores/
│   └── universalAuthStore.ts   # 状态管理
├── components/
│   ├── auth/
│   │   ├── SemiAnonymousLogin.tsx
│   │   └── IdentityConflictDialog.tsx
│   └── common/
│       └── UserStatusIndicator.tsx
└── utils/
    └── crypto.ts               # 加密工具
```

### 后端架构
```
backend/
├── src/
│   ├── routes/
│   │   └── uuid.ts             # UUID路由
│   └── utils/
│       └── uuid.ts             # UUID工具
└── database/
    └── migrations/
        └── 010_create_uuid_system_tables.sql
```

## 🔧 核心功能

### 1. 用户认证
- **半匿名认证**: A+B组合验证
- **全匿名认证**: 设备指纹识别
- **管理员认证**: 用户名密码验证
- **会话管理**: 自动过期和刷新

### 2. 权限控制
- **基于角色的权限**: 每种用户类型有固定权限
- **细粒度控制**: 支持功能级权限检查
- **动态权限**: 运行时权限验证

### 3. 身份切换
- **冲突检测**: 自动检测身份冲突
- **确认机制**: 用户确认后切换身份
- **状态清理**: 切换时清理旧状态

### 4. 内容关联
- **用户内容映射**: 内容与用户UUID关联
- **状态管理**: 内容审核状态跟踪
- **权限控制**: 基于用户类型的内容访问

## 📊 数据库设计

### 核心表结构

#### universal_users - 统一用户表
```sql
CREATE TABLE universal_users (
    uuid VARCHAR(64) PRIMARY KEY,
    user_type ENUM('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin'),
    identity_hash VARCHAR(128) UNIQUE,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    permissions JSON,
    profile JSON,
    metadata JSON,
    status ENUM('active', 'inactive', 'suspended'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_active_at TIMESTAMP
);
```

#### user_sessions - 用户会话表
```sql
CREATE TABLE user_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_uuid VARCHAR(64),
    session_token VARCHAR(128) UNIQUE,
    device_fingerprint VARCHAR(128),
    expires_at TIMESTAMP,
    is_active BOOLEAN,
    created_at TIMESTAMP
);
```

#### user_content_mappings - 用户内容关联表
```sql
CREATE TABLE user_content_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_uuid VARCHAR(64),
    content_type ENUM('questionnaire', 'story', 'voice', 'comment'),
    content_id VARCHAR(64),
    status ENUM('draft', 'pending', 'approved', 'rejected'),
    created_at TIMESTAMP
);
```

## 🔐 安全特性

### 1. 数据加密
- **身份哈希**: SHA-256 + 盐值加密
- **密码存储**: bcrypt哈希
- **会话令牌**: 安全随机生成

### 2. 防护机制
- **防暴力破解**: 失败次数限制
- **会话管理**: 自动过期和清理
- **设备绑定**: 设备指纹验证

### 3. 审计日志
- **认证日志**: 记录所有认证尝试
- **操作日志**: 记录用户操作
- **安全事件**: 记录异常行为

## 🚀 API接口

### 认证接口
```typescript
// 半匿名认证
POST /api/uuid/auth/semi-anonymous
{
  "identityA": "13812345678",
  "identityB": "1234",
  "deviceInfo": {...}
}

// 全匿名认证
POST /api/uuid/auth/anonymous
{
  "deviceInfo": {...}
}

// 管理员认证
POST /api/uuid/auth/admin
{
  "username": "admin",
  "password": "password",
  "userType": "admin"
}

// 会话验证
POST /api/uuid/auth/validate
{
  "sessionToken": "token"
}

// 用户登出
POST /api/uuid/auth/logout
{
  "sessionToken": "token"
}
```

### 用户管理接口
```typescript
// 获取用户信息
GET /api/uuid/users/{uuid}

// 更新用户信息
PATCH /api/uuid/users/{uuid}

// 关联用户内容
POST /api/uuid/content/link

// 获取用户内容
GET /api/uuid/users/{uuid}/content

// 用户统计
GET /api/uuid/statistics
```

## 🧪 测试

### 单元测试
- **UUID生成和解析**: 测试UUID格式和解析逻辑
- **A+B验证**: 测试输入格式验证
- **权限系统**: 测试权限检查逻辑
- **加密功能**: 测试哈希和加密函数

### 集成测试
- **认证流程**: 测试完整的登录流程
- **身份切换**: 测试身份冲突处理
- **权限控制**: 测试权限检查集成
- **组件交互**: 测试UI组件集成

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行特定测试
npm run test uuid-system

# 生成覆盖率报告
npm run test:coverage
```

## 📈 统计功能

### 1. 用户统计
- **每日新增用户**: 按用户类型统计
- **活跃用户**: 按时间段统计
- **用户分布**: 按类型和地区统计

### 2. 内容统计
- **提交统计**: 按内容类型统计
- **审核统计**: 审核通过率和效率
- **下载统计**: 热门内容排行

### 3. 性能监控
- **API响应时间**: 接口性能监控
- **数据库性能**: 查询效率监控
- **用户行为**: 操作路径分析

## 🔧 部署配置

### 环境变量
```bash
# 数据库配置
DATABASE_URL=mysql://user:pass@host:port/db

# JWT密钥
JWT_SECRET=your-secret-key

# 会话配置
SESSION_TIMEOUT_ANONYMOUS=86400
SESSION_TIMEOUT_SEMI_ANONYMOUS=86400
SESSION_TIMEOUT_REVIEWER=3600
SESSION_TIMEOUT_ADMIN=3600

# 安全配置
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION=900
```

### 数据库迁移
```bash
# 运行迁移
npm run migrate

# 回滚迁移
npm run migrate:rollback

# 重置数据库
npm run migrate:reset
```

## 🚀 使用示例

### 前端使用
```typescript
import { useUniversalAuthStore } from '@/stores/universalAuthStore';

// 组件中使用
const { 
  currentUser, 
  loginSemiAnonymous, 
  loginAnonymous, 
  hasPermission 
} = useUniversalAuthStore();

// 半匿名登录
await loginSemiAnonymous('13812345678', '1234');

// 权限检查
if (hasPermission(Permission.DOWNLOAD_CONTENT)) {
  // 显示下载按钮
}
```

### 后端使用
```typescript
import { createUUIDRoutes } from './routes/uuid';

// 添加到应用
app.route('/api/uuid', createUUIDRoutes());
```

## 🔄 维护和监控

### 1. 定期任务
- **会话清理**: 每小时清理过期会话
- **日志清理**: 每天清理旧日志
- **统计更新**: 每天更新统计缓存

### 2. 监控指标
- **认证成功率**: 监控认证失败率
- **会话活跃度**: 监控用户活跃情况
- **系统性能**: 监控API响应时间

### 3. 故障处理
- **数据备份**: 定期备份用户数据
- **故障恢复**: 快速恢复机制
- **安全响应**: 安全事件处理流程

## 📝 更新日志

### v1.0.0 (2025-01-27)
- ✅ 完成UUID用户管理系统基础架构
- ✅ 实现5种用户类型认证
- ✅ 完成前后端API集成
- ✅ 添加完整的测试覆盖
- ✅ 实现身份冲突处理机制
- ✅ 完成数据库设计和迁移
- ✅ 添加安全特性和审计日志

## 🤝 贡献指南

1. **代码规范**: 遵循项目代码规范
2. **测试要求**: 新功能必须包含测试
3. **文档更新**: 更新相关文档
4. **安全审查**: 安全相关代码需要审查

## 📞 支持

如有问题或建议，请联系开发团队或提交Issue。
