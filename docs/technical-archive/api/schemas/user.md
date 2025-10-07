# 👤 用户数据模型

## 📊 模型定义

### User Schema

```typescript
interface User {
  // 基本信息
  id: string;                    // 用户唯一标识
  username: string;              // 用户名 (3-20字符)
  email: string;                 // 邮箱地址
  passwordHash: string;          // 密码哈希值 (不对外暴露)
  
  // 角色权限
  role: UserRole;                // 用户角色
  permissions: string[];         // 权限列表
  
  // 用户画像
  tags: string[];                // 用户标签
  tagSource: TagSource;          // 标签来源
  
  // 状态信息
  status: UserStatus;            // 账户状态
  isEmailVerified: boolean;      // 邮箱是否验证
  
  // 时间戳
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  lastLoginAt: Date | null;      // 最后登录时间
  
  // 关联数据
  profile?: UserProfile;         // 用户详细资料
  statistics?: UserStatistics;   // 用户统计数据
}
```

---

## 🎭 枚举类型

### UserRole
```typescript
enum UserRole {
  USER = 'user',           // 普通用户
  MODERATOR = 'moderator', // 审核员
  ADMIN = 'admin'          // 管理员
}
```

### UserStatus
```typescript
enum UserStatus {
  ACTIVE = 'active',       // 活跃
  INACTIVE = 'inactive',   // 未激活
  SUSPENDED = 'suspended', // 已暂停
  BANNED = 'banned'        // 已封禁
}
```

### TagSource
```typescript
enum TagSource {
  QUESTIONNAIRE = 'questionnaire',  // 问卷生成
  MANUAL = 'manual',                // 手动添加
  SYSTEM = 'system'                 // 系统推断
}
```

---

## 📋 扩展模型

### UserProfile
```typescript
interface UserProfile {
  userId: string;
  avatar?: string;              // 头像URL
  bio?: string;                 // 个人简介
  location?: string;            // 所在地
  website?: string;             // 个人网站
  socialLinks?: {
    wechat?: string;
    weibo?: string;
    github?: string;
  };
}
```

### UserStatistics
```typescript
interface UserStatistics {
  userId: string;
  storiesCount: number;         // 发布故事数
  likesReceived: number;        // 收到点赞数
  commentsReceived: number;     // 收到评论数
  questionnairesCompleted: number; // 完成问卷数
}
```

---

## 🔍 字段说明

### id
- **类型**: string
- **格式**: `user_` + UUID
- **示例**: `user_123e4567-e89b-12d3-a456-426614174000`
- **索引**: 主键

### username
- **类型**: string
- **长度**: 3-20字符
- **规则**: 字母、数字、下划线
- **唯一性**: 是
- **索引**: 唯一索引

### email
- **类型**: string
- **格式**: 有效邮箱地址
- **唯一性**: 是
- **索引**: 唯一索引

### passwordHash
- **类型**: string
- **算法**: bcrypt
- **轮数**: 10
- **注意**: 永不对外暴露

### tags
- **类型**: string[]
- **来源**: 问卷系统生成
- **用途**: 用户画像、内容推荐
- **示例**: `["职场新人", "技术爱好者", "创业者"]`

---

## 📤 API响应格式

### 公开用户信息
```json
{
  "id": "user_123",
  "username": "testuser",
  "email": "test@example.com",
  "role": "user",
  "tags": ["tag1", "tag2"],
  "status": "active",
  "isEmailVerified": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "lastLoginAt": "2025-01-15T12:00:00Z"
}
```

### 用户详细信息 (包含profile)
```json
{
  "id": "user_123",
  "username": "testuser",
  "email": "test@example.com",
  "role": "user",
  "tags": ["tag1", "tag2"],
  "profile": {
    "avatar": "https://example.com/avatar.jpg",
    "bio": "这是我的个人简介",
    "location": "北京"
  },
  "statistics": {
    "storiesCount": 5,
    "likesReceived": 20,
    "commentsReceived": 10
  }
}
```

---

## 🔒 安全规则

### 密码要求
- 最少8字符
- 必须包含字母和数字
- 建议包含特殊字符

### 敏感字段
以下字段永不对外暴露：
- `passwordHash`
- `permissions` (仅管理员可见)

### 权限控制
- 用户只能查看/修改自己的信息
- 管理员可以查看所有用户信息
- 审核员可以查看用户公开信息

---

## 🔗 关联关系

### 一对多关系
- User → Stories (一个用户可以发布多个故事)
- User → QuestionnaireResponses (一个用户可以完成多个问卷)
- User → Comments (一个用户可以发表多个评论)

### 多对多关系
- User ↔ Tags (用户可以有多个标签)
- User ↔ Stories (通过点赞关系)

---

## 📝 相关文档

- [认证端点](../endpoints/authentication.md)
- [数据库用户表](../../database/schemas/users.md)
- [认证功能文档](../../features/authentication/README.md)

---

**最后更新**: 2025-01-XX  
**维护者**: 技术团队

