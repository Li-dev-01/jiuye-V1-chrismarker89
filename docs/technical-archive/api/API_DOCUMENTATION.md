# 📡 API完整文档

> **最后更新**: 2025年10月7日  
> **API版本**: v1.0.0  
> **基础URL**: `https://employment-survey-api-prod.chrismarker89.workers.dev`

---

## 📋 目录

- [认证API](#认证api)
- [问卷API](#问卷api)
- [故事API](#故事api)
- [审核API](#审核api)
- [管理员API](#管理员api)
- [超级管理员API](#超级管理员api)
- [数据分析API](#数据分析api)

---

## 🔐 认证API

### Google OAuth认证

#### 1. 发起OAuth登录
```http
GET /api/google-auth/login
```

**查询参数**:
- `redirect_uri` (可选): 登录成功后的重定向URL

**响应**:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

---

#### 2. OAuth回调处理
```http
GET /api/google-auth/callback
```

**查询参数**:
- `code`: Google返回的授权码
- `state`: 状态参数

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    }
  }
}
```

---

### 简化认证

#### 3. 管理员登录
```http
POST /api/simple-auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "password123",
  "role": "admin"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "session_123456_abc...",
    "user": {
      "username": "admin",
      "role": "admin",
      "permissions": ["user.view", "content.manage"]
    }
  }
}
```

---

#### 4. Token验证
```http
GET /api/simple-auth/verify
```

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

## 📝 问卷API

### 问卷V1

#### 5. 提交问卷V1
```http
POST /api/questionnaire-v1/submit
```

**请求体**:
```json
{
  "user_id": "user_uuid",
  "questionnaire_id": "employment-survey-2024",
  "responses": {
    "basic_info": {
      "age": "22",
      "gender": "male",
      "education": "bachelor"
    },
    "employment": {
      "status": "employed",
      "salary": "5000-8000"
    }
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "response_id": "resp_123",
    "submitted_at": "2025-10-07T10:00:00Z"
  }
}
```

---

### 问卷V2

#### 6. 提交问卷V2
```http
POST /api/questionnaire-v2/submit
```

**请求体**:
```json
{
  "user_id": "user_uuid",
  "questionnaire_id": "questionnaire-v2-2024",
  "answers": [
    {
      "question_id": "q1",
      "answer": "已就业",
      "metadata": {
        "response_time": 3.5
      }
    }
  ],
  "session_data": {
    "total_duration": 180,
    "interaction_count": 15
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "response_id": "v2_resp_456",
    "analysis": {
      "economic_pressure": "medium",
      "employment_confidence": "high"
    }
  }
}
```

---

#### 7. 获取问卷统计
```http
GET /api/universal-questionnaire/statistics/:questionnaireId
```

**路径参数**:
- `questionnaireId`: 问卷ID

**响应**:
```json
{
  "success": true,
  "data": {
    "total_responses": 1250,
    "dimensions": {
      "employment_status": {
        "employed": 450,
        "unemployed": 280,
        "studying": 120
      },
      "salary_range": {
        "below_5k": 200,
        "5k_8k": 350,
        "8k_12k": 280
      }
    }
  }
}
```

---

## 📖 故事API

#### 8. 获取故事列表
```http
GET /api/stories
```

**查询参数**:
- `page` (默认: 1): 页码
- `pageSize` (默认: 20): 每页数量
- `category` (可选): 分类筛选
- `tags` (可选): 标签筛选
- `sortBy` (默认: approved_at): 排序字段
- `sortOrder` (默认: desc): 排序方向

**响应**:
```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "id": 1,
        "title": "我的求职经历",
        "content": "...",
        "category": "job_search",
        "tags": ["互联网", "应届生"],
        "like_count": 45,
        "view_count": 230,
        "created_at": "2025-10-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150
    }
  }
}
```

---

#### 9. 获取故事详情
```http
GET /api/stories/:id
```

**路径参数**:
- `id`: 故事ID

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "我的求职经历",
    "content": "详细内容...",
    "author_name": "匿名用户",
    "category": "job_search",
    "tags": ["互联网", "应届生"],
    "like_count": 45,
    "view_count": 231,
    "created_at": "2025-10-01T10:00:00Z"
  }
}
```

---

#### 10. 发布故事
```http
POST /api/stories
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "user_id": "user_uuid",
  "title": "我的求职经历",
  "content": "详细内容...",
  "category": "job_search",
  "tags": ["互联网", "应届生"],
  "author_name": "张三",
  "is_anonymous": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "story_id": 123,
    "status": "pending",
    "message": "故事已提交，正在审核中"
  }
}
```

---

#### 11. 点赞故事
```http
POST /api/stories/:id/like
```

**路径参数**:
- `id`: 故事ID

**响应**:
```json
{
  "success": true,
  "message": "点赞成功"
}
```

---

#### 12. 生成PNG卡片
```http
POST /api/png-management/generate
```

**请求体**:
```json
{
  "content_type": "story",
  "content_id": "123",
  "theme": "gradient",
  "quality": 0.9
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cardId": "story-123-gradient-1696723200000",
    "downloadUrl": "https://r2.domain.com/png-cards/...",
    "r2Key": "png-cards/story-123-gradient.png"
  }
}
```

---

## 🛡️ 审核API

#### 13. 内容审核检查
```http
POST /api/audit/check
```

**请求体**:
```json
{
  "content": "待审核的内容...",
  "content_type": "story",
  "user_id": "user_uuid"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "action": "approve",
    "audit_level": "rule_based",
    "risk_score": 15,
    "confidence": 0.95,
    "violations": []
  }
}
```

---

#### 14. 获取待审核列表
```http
GET /api/simple-reviewer/pending-reviews
```

**请求头**:
```
Authorization: Bearer {reviewer_token}
```

**查询参数**:
- `page` (默认: 1): 页码
- `pageSize` (默认: 20): 每页数量
- `content_type` (可选): 内容类型

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "content_type": "story",
        "title": "标题",
        "content": "内容...",
        "submitted_at": "2025-10-07T10:00:00Z",
        "ai_score": 55,
        "priority": "medium"
      }
    ],
    "total": 45
  }
}
```

---

#### 15. 提交审核结果
```http
POST /api/simple-reviewer/submit-review
```

**请求头**:
```
Authorization: Bearer {reviewer_token}
```

**请求体**:
```json
{
  "review_id": 1,
  "decision": "approve",
  "reviewer_id": "reviewer_uuid",
  "notes": "内容质量良好",
  "grant_immunity": false
}
```

**响应**:
```json
{
  "success": true,
  "message": "审核提交成功"
}
```

---

## 👨‍💼 管理员API

#### 16. 获取管理员仪表板
```http
GET /api/simple-admin/dashboard
```

**请求头**:
```
Authorization: Bearer {admin_token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_users": 1250,
      "total_questionnaires": 980,
      "total_stories": 450,
      "pending_reviews": 23
    },
    "recent_activity": [...]
  }
}
```

---

#### 17. 获取用户列表
```http
GET /api/simple-admin/users
```

**请求头**:
```
Authorization: Bearer {admin_token}
```

**查询参数**:
- `page` (默认: 1): 页码
- `pageSize` (默认: 20): 每页数量
- `role` (可选): 角色筛选
- `status` (可选): 状态筛选

**响应**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_uuid",
        "email": "user@example.com",
        "role": "user",
        "status": "active",
        "created_at": "2025-09-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1250
    }
  }
}
```

---

#### 18. AI审核配置
```http
GET /api/simple-admin/ai-moderation/config
POST /api/simple-admin/ai-moderation/config
```

**GET响应**:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "workers-ai",
    "auto_approve_threshold": 60,
    "auto_reject_threshold": 30
  }
}
```

**POST请求体**:
```json
{
  "enabled": true,
  "provider": "claude",
  "auto_approve_threshold": 65,
  "auto_reject_threshold": 25
}
```

---

## 👑 超级管理员API

#### 19. 获取项目状态
```http
GET /api/super-admin/project/status
```

**请求头**:
```
Authorization: Bearer {super_admin_token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "project_enabled": true,
    "maintenance_mode": false,
    "emergency_shutdown": false,
    "last_updated": "2025-10-07T10:00:00Z"
  }
}
```

---

#### 20. 紧急关闭项目
```http
POST /api/super-admin/emergency/shutdown
```

**请求头**:
```
Authorization: Bearer {super_admin_token}
```

**请求体**:
```json
{
  "reason": "安全问题",
  "admin_id": "super_admin_uuid"
}
```

**响应**:
```json
{
  "success": true,
  "message": "项目已紧急关闭"
}
```

---

#### 21. 获取安全指标
```http
GET /api/super-admin/security/metrics
```

**请求头**:
```
Authorization: Bearer {super_admin_token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "threat_level": "low",
    "active_threats": 0,
    "blocked_ips": 5,
    "failed_logins": 12,
    "system_health": 98
  }
}
```

---

#### 22. 账号管理
```http
GET /api/admin/account-management/accounts
POST /api/admin/account-management/accounts
PUT /api/admin/account-management/accounts/:id
DELETE /api/admin/account-management/accounts/:id
```

**POST请求体**:
```json
{
  "email": "newadmin@example.com",
  "username": "newadmin",
  "password": "SecurePass123!",
  "role": "admin"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "account_id": 123,
    "email": "newadmin@example.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

## 📊 数据分析API

#### 23. 获取实时统计
```http
GET /api/analytics/real-time-stats
```

**响应**:
```json
{
  "success": true,
  "data": {
    "active_users": 45,
    "today_responses": 123,
    "weekly_growth": 15.5
  }
}
```

---

#### 24. 交叉分析
```http
POST /api/analytics/cross-analysis
```

**请求体**:
```json
{
  "primary": "education_level",
  "secondary": "employment_status"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "bachelor": {
      "employed": 350,
      "unemployed": 120
    },
    "master": {
      "employed": 180,
      "unemployed": 45
    }
  }
}
```

---

## 🔧 通用规范

### 认证方式

**JWT Token**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Session Token**:
```
Authorization: Bearer session_123456_abc...
```

---

### 错误响应格式

```json
{
  "success": false,
  "error": "Error Type",
  "message": "详细错误信息",
  "code": "ERROR_CODE"
}
```

**常见错误码**:
- `400` - Bad Request (请求参数错误)
- `401` - Unauthorized (未认证)
- `403` - Forbidden (权限不足)
- `404` - Not Found (资源不存在)
- `500` - Internal Server Error (服务器错误)

---

### 分页规范

**请求参数**:
- `page`: 页码（从1开始）
- `pageSize`: 每页数量（默认20，最大100）

**响应格式**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 速率限制

- **普通用户**: 100 请求/分钟
- **认证用户**: 300 请求/分钟
- **管理员**: 1000 请求/分钟

**超限响应**:
```json
{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "请求过于频繁，请稍后再试",
  "retry_after": 60
}
```

---

## 📚 相关文档

- [功能索引](../features/FEATURE_INDEX.md)
- [认证系统](../features/authentication/README.md)
- [问卷系统](../features/questionnaire/README.md)
- [故事系统](../features/stories/README.md)
- [审核系统](../features/review/README.md)
- [数据分析](../features/analytics/README.md)
- [系统管理](../features/management/README.md)
