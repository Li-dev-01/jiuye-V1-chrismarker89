# 📖 故事数据模型

> **模块**: 故事系统数据模型  
> **最后更新**: 2025年10月7日

## 📋 数据模型定义

### 1. 原始故事提交模型

**表名**: `raw_story_submissions`

**TypeScript接口**:
```typescript
interface RawStorySubmission {
  id: number;
  data_uuid: string; // UUID
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string; // JSON array
  author_name: string;
  is_anonymous: 0 | 1;
  submission_type: 'manual' | 'auto';
  submitted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}
```

**示例数据**:
```json
{
  "id": 1,
  "data_uuid": "uuid-xxx",
  "user_id": "uuid-yyy",
  "title": "我的求职故事",
  "content": "这是我的求职经历...",
  "category": "求职经历",
  "tags": "[\"互联网\", \"校招\"]",
  "author_name": "张三",
  "is_anonymous": 0,
  "submission_type": "manual",
  "submitted_at": "2025-10-07T10:00:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

---

### 2. 待审核故事模型

**表名**: `pending_stories`

**TypeScript接口**:
```typescript
interface PendingStory {
  id: number;
  data_uuid: string; // UUID
  user_id: string;
  raw_id: number; // 关联raw_story_submissions.id
  title: string;
  content: string;
  category: string;
  tags: string; // JSON array
  author_name: string;
  is_anonymous: 0 | 1;
  audit_status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  audit_level: 'level1' | 'level2' | 'level3';
  risk_score: number;
  created_at: string;
  updated_at: string;
}
```

**示例数据**:
```json
{
  "id": 1,
  "data_uuid": "uuid-xxx",
  "user_id": "uuid-yyy",
  "raw_id": 1,
  "title": "我的求职故事",
  "content": "这是我的求职经历...",
  "category": "求职经历",
  "tags": "[\"互联网\", \"校招\"]",
  "author_name": "张三",
  "is_anonymous": 0,
  "audit_status": "pending",
  "audit_level": "level2",
  "risk_score": 0.2,
  "created_at": "2025-10-07T10:00:00Z",
  "updated_at": "2025-10-07T10:00:00Z"
}
```

---

### 3. 已发布故事模型

**表名**: `valid_stories`

**TypeScript接口**:
```typescript
interface ValidStory {
  id: number;
  data_uuid: string; // UUID
  user_id: string;
  raw_id: number; // 关联pending_stories.id
  title: string;
  content: string;
  category: string;
  tags: string; // JSON array
  author_name: string;
  is_anonymous: 0 | 1;
  audit_status: 'approved';
  like_count: number;
  dislike_count: number;
  view_count: number;
  approved_at: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}
```

**示例数据**:
```json
{
  "id": 1,
  "data_uuid": "uuid-xxx",
  "user_id": "uuid-yyy",
  "raw_id": 1,
  "title": "我的求职故事",
  "content": "这是我的求职经历...",
  "category": "求职经历",
  "tags": "[\"互联网\", \"校招\"]",
  "author_name": "张三",
  "is_anonymous": 0,
  "audit_status": "approved",
  "like_count": 10,
  "dislike_count": 1,
  "view_count": 100,
  "approved_at": "2025-10-07T11:00:00Z",
  "approved_by": "uuid-zzz",
  "created_at": "2025-10-07T10:00:00Z",
  "updated_at": "2025-10-07T12:00:00Z"
}
```

---

### 4. 故事点赞模型

**表名**: `story_likes`

**TypeScript接口**:
```typescript
interface StoryLike {
  id: number;
  user_id: string;
  story_id: string; // valid_stories.data_uuid
  like_type: 'like' | 'dislike';
  created_at: string;
}
```

**示例数据**:
```json
{
  "id": 1,
  "user_id": "uuid-yyy",
  "story_id": "uuid-xxx",
  "like_type": "like",
  "created_at": "2025-10-07T12:00:00Z"
}
```

---

### 5. PNG卡片模型

**表名**: `png_cards`

**TypeScript接口**:
```typescript
interface PngCard {
  id: number;
  story_id: string; // valid_stories.data_uuid
  r2_key: string; // R2存储路径
  theme: 'light' | 'dark' | 'gradient';
  generated_at: string;
  file_size: number; // 字节
  width: number;
  height: number;
}
```

**示例数据**:
```json
{
  "id": 1,
  "story_id": "uuid-xxx",
  "r2_key": "story-cards/uuid-xxx-light.png",
  "theme": "light",
  "generated_at": "2025-10-07T12:00:00Z",
  "file_size": 102400,
  "width": 1200,
  "height": 630
}
```

---

### 6. 故事列表响应模型

**API响应**:
```typescript
interface StoryListResponse {
  success: boolean;
  data: {
    stories: ValidStory[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  message?: string;
}
```

---

### 7. 故事详情响应模型

**API响应**:
```typescript
interface StoryDetailResponse {
  success: boolean;
  data: ValidStory & {
    userLiked?: boolean; // 当前用户是否点赞
    userDisliked?: boolean; // 当前用户是否点踩
  };
  message?: string;
}
```

---

## 🔗 相关文档

- [故事API端点](../endpoints/stories.md)
- [故事系统功能文档](../../features/stories/README.md)
- [审核系统文档](../../features/review/README.md)
- [数据库设计](../../database/DATABASE_SCHEMA.md)

