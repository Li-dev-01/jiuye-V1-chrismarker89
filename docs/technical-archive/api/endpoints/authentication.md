# 🔐 认证系统端点文档

## 📋 端点列表

1. [用户注册](#1-用户注册)
2. [用户登录](#2-用户登录)
3. [用户登出](#3-用户登出)
4. [刷新令牌](#4-刷新令牌)
5. [获取用户信息](#5-获取用户信息)

---

## 1. 用户注册

### 基本信息
- **端点**: `POST /api/auth/register`
- **认证**: 不需要
- **描述**: 创建新用户账户

### 请求参数

```json
{
  "username": "string (必填, 3-20字符)",
  "email": "string (必填, 有效邮箱)",
  "password": "string (必填, 最少8字符)",
  "confirmPassword": "string (必填, 需与password一致)"
}
```

### 响应示例

**成功 (201 Created)**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "user_123",
      "username": "testuser",
      "email": "test@example.com",
      "createdAt": "2025-01-15T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**失败 (400 Bad Request)**
```json
{
  "success": false,
  "error": "用户名已存在"
}
```

### 错误代码
- `400` - 参数验证失败
- `409` - 用户名或邮箱已存在
- `500` - 服务器错误

---

## 2. 用户登录

### 基本信息
- **端点**: `POST /api/auth/login`
- **认证**: 不需要
- **描述**: 用户登录获取访问令牌

### 请求参数

```json
{
  "email": "string (必填)",
  "password": "string (必填)"
}
```

### 响应示例

**成功 (200 OK)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "testuser",
      "email": "test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**失败 (401 Unauthorized)**
```json
{
  "success": false,
  "error": "邮箱或密码错误"
}
```

---

## 3. 用户登出

### 基本信息
- **端点**: `POST /api/auth/logout`
- **认证**: 需要Bearer Token
- **描述**: 用户登出并使令牌失效

### 请求头
```
Authorization: Bearer <token>
```

### 响应示例

**成功 (200 OK)**
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 4. 刷新令牌

### 基本信息
- **端点**: `POST /api/auth/refresh`
- **认证**: 需要Refresh Token
- **描述**: 使用刷新令牌获取新的访问令牌

### 请求参数

```json
{
  "refreshToken": "string (必填)"
}
```

### 响应示例

**成功 (200 OK)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 5. 获取用户信息

### 基本信息
- **端点**: `GET /api/auth/profile`
- **认证**: 需要Bearer Token
- **描述**: 获取当前登录用户的详细信息

### 请求头
```
Authorization: Bearer <token>
```

### 响应示例

**成功 (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "tags": ["tag1", "tag2"],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## 🔒 认证机制

### JWT令牌
- **访问令牌**: 有效期15分钟
- **刷新令牌**: 有效期7天
- **算法**: HS256

### 令牌使用
```javascript
// 在请求头中添加
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

---

## 📝 相关文档

- [用户数据模型](../schemas/user.md)
- [数据库用户表](../../database/schemas/users.md)
- [认证功能文档](../../features/authentication/README.md)

