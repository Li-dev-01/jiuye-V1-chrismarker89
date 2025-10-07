# 📖 故事API端点文档

> **模块**: 故事系统API  
> **最后更新**: 2025年10月7日

## 📋 端点列表

### 1. 获取故事列表
```http
GET /api/stories
```

**查询参数**:
- `page` (query): 页码，默认1
- `pageSize` (query): 每页数量，默认20
- `category` (query): 分类筛选
- `tags` (query): 标签筛选
- `sortBy` (query): 排序字段，默认`approved_at`
- `sortOrder` (query): 排序方向，默认`desc`
- `published` (query): 是否只显示已发布，默认`true`

**响应**:
```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "id": 1,
        "data_uuid": "uuid-xxx",
        "title": "我的求职故事",
        "content": "...",
        "category": "求职经历",
        "tags": ["互联网", "校招"],
        "like_count": 10,
        "view_count": 100,
        "created_at": "2025-10-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    }
  }
}
```

---

### 2. 获取精选故事
```http
GET /api/stories/featured
```

**查询参数**:
- `pageSize` (query): 数量，默认6

**响应**:
```json
{
  "success": true,
  "data": {
    "stories": [...]
  }
}
```

---

### 3. 获取故事详情
```http
GET /api/stories/:id
```

**参数**:
- `id` (path): 故事ID

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "我的求职故事",
    "content": "...",
    "category": "求职经历",
    "tags": ["互联网", "校招"],
    "like_count": 10,
    "dislike_count": 1,
    "view_count": 101,
    "created_at": "2025-10-01T00:00:00Z"
  }
}
```

**副作用**: 浏览量+1

---

### 4. 创建故事
```http
POST /api/stories
```

**需要认证**。

**请求体**:
```json
{
  "title": "我的求职故事",
  "content": "这是我的求职经历...",
  "category": "求职经历",
  "tags": ["互联网", "校招"],
  "user_id": "uuid-xxx",
  "author_name": "张三",
  "is_anonymous": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "story_id": "uuid-yyy",
    "status": "pending_review",
    "message": "故事已提交，等待审核"
  }
}
```

---

### 5. 点赞故事
```http
POST /api/stories/:id/like
```

**需要认证**。

**参数**:
- `id` (path): 故事ID

**请求体**:
```json
{
  "user_id": "uuid-xxx"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "like_count": 11
  }
}
```

---

### 6. 踩故事
```http
POST /api/stories/:id/dislike
```

**需要认证**。

**参数**:
- `id` (path): 故事ID

**请求体**:
```json
{
  "user_id": "uuid-xxx"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "dislike_count": 2
  }
}
```

---

### 7. 获取PNG卡片
```http
GET /api/stories/:id/png/:theme?
```

**参数**:
- `id` (path): 故事ID
- `theme` (path, 可选): 主题，如`light`、`dark`

**响应**:
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://r2.cloudflare.com/...",
    "expiresAt": "2025-10-08T00:00:00Z"
  }
}
```

---

### 8. 获取用户故事列表
```http
GET /api/stories/user/:userId
```

**参数**:
- `userId` (path): 用户ID

**查询参数**:
- `page` (query): 页码，默认1
- `pageSize` (query): 每页数量，默认20
- `sortBy` (query): 排序字段
- `sortOrder` (query): 排序方向

**响应**:
```json
{
  "success": true,
  "data": {
    "stories": [...],
    "pagination": {...}
  }
}
```

---

### 9. 删除故事
```http
DELETE /api/stories/:id
```

**需要管理员权限**。

**参数**:
- `id` (path): 故事ID

**响应**:
```json
{
  "success": true,
  "message": "故事已删除"
}
```

---

## 🔒 认证要求

| 端点 | 认证 | 权限 |
|------|------|------|
| GET /stories | ❌ 否 | 公开 |
| GET /stories/featured | ❌ 否 | 公开 |
| GET /stories/:id | ❌ 否 | 公开 |
| POST /stories | ✅ 是 | 用户 |
| POST /stories/:id/like | ✅ 是 | 用户 |
| POST /stories/:id/dislike | ✅ 是 | 用户 |
| GET /stories/:id/png/:theme? | ❌ 否 | 公开 |
| GET /stories/user/:userId | ❌ 否 | 公开 |
| DELETE /stories/:id | ✅ 是 | 管理员 |

---

## 📊 数据模型

参考 [故事数据模型](../schemas/story.md)

---

## 🔗 相关文档

- [故事系统功能文档](../../features/stories/README.md)
- [审核系统文档](../../features/review/README.md)
- [API总索引](../API_INDEX.md)

