# ✅ 审核API端点文档

> **模块**: 审核系统API  
> **最后更新**: 2025年10月7日

## 📋 端点列表

### 1. 获取待审核列表
```http
GET /api/reviewer/pending-reviews
```

**需要审核员权限**。

**查询参数**:
- `page` (query): 页码，默认1
- `pageSize` (query): 每页数量，默认20
- `content_type` (query): 内容类型筛选，如`story`、`heart_voice`

**响应**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "content_type": "story",
        "content_id": 123,
        "title": "我的求职故事",
        "content": "...",
        "submitted_at": "2025-10-07T10:00:00Z",
        "audit_status": "pending"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pageSize": 20,
      "totalPages": 3
    }
  }
}
```

---

### 2. 提交审核结果
```http
POST /api/reviewer/submit-review
```

**需要审核员权限**。

**请求体**:
```json
{
  "auditId": 1,
  "action": "approve",
  "reviewerId": "uuid-xxx",
  "reason": "内容符合规范"
}
```

**参数说明**:
- `action`: `approve` 或 `reject`
- `reason`: 审核理由（拒绝时必填）

**响应**:
```json
{
  "success": true,
  "data": {
    "auditId": 1,
    "action": "approve",
    "status": "approved"
  },
  "message": "审核成功"
}
```

---

### 3. 获取审核统计
```http
GET /api/reviewer/stats
```

**需要审核员权限**。

**响应**:
```json
{
  "success": true,
  "data": {
    "totalPending": 50,
    "totalApproved": 200,
    "totalRejected": 30,
    "todayReviewed": 15,
    "averageReviewTime": 120
  }
}
```

---

### 4. 获取审核级别
```http
GET /api/tiered-audit/level
```

**需要管理员权限**。

**响应**:
```json
{
  "success": true,
  "data": {
    "currentLevel": "level2",
    "config": {
      "auto_approve_threshold": 0.8,
      "manual_review_threshold": 0.5
    }
  }
}
```

---

### 5. 切换审核级别
```http
POST /api/tiered-audit/level
```

**需要管理员权限**。

**请求体**:
```json
{
  "level": "level3",
  "admin_id": "uuid-xxx"
}
```

**参数说明**:
- `level`: `level1`（宽松）、`level2`（标准）、`level3`（严格）

**响应**:
```json
{
  "success": true,
  "data": {
    "old_level": "level2",
    "new_level": "level3",
    "config": {...}
  },
  "message": "审核级别已切换到level3"
}
```

---

### 6. 测试内容审核
```http
POST /api/tiered-audit/test
```

**需要管理员权限**。

**请求体**:
```json
{
  "content": "这是测试内容",
  "content_type": "story"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "passed": true,
    "action": "auto_approve",
    "audit_level": "level2",
    "risk_score": 0.2,
    "confidence": 0.9,
    "reason": "内容安全",
    "violations": []
  }
}
```

---

### 7. 获取违规内容列表
```http
GET /api/violations/list
```

**需要管理员权限**。

**查询参数**:
- `page` (query): 页码
- `pageSize` (query): 每页数量
- `contentType` (query): 内容类型
- `severity` (query): 严重程度，如`low`、`medium`、`high`
- `violationType` (query): 违规类型

**响应**:
```json
{
  "success": true,
  "data": {
    "violations": [
      {
        "id": 1,
        "content_id": 123,
        "content_type": "story",
        "violation_type": "不当言论",
        "severity": "high",
        "detected_at": "2025-10-07T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### 8. 处理违规内容
```http
POST /api/violations/:id/handle
```

**需要管理员权限**。

**参数**:
- `id` (path): 违规记录ID

**请求体**:
```json
{
  "action": "remove",
  "admin_id": "uuid-xxx",
  "notes": "违反社区规范"
}
```

**参数说明**:
- `action`: `remove`（删除）、`warn`（警告）、`ignore`（忽略）

**响应**:
```json
{
  "success": true,
  "message": "违规内容已处理"
}
```

---

## 🔒 认证要求

| 端点 | 认证 | 权限 |
|------|------|------|
| GET /reviewer/pending-reviews | ✅ 是 | 审核员 |
| POST /reviewer/submit-review | ✅ 是 | 审核员 |
| GET /reviewer/stats | ✅ 是 | 审核员 |
| GET /tiered-audit/level | ✅ 是 | 管理员 |
| POST /tiered-audit/level | ✅ 是 | 管理员 |
| POST /tiered-audit/test | ✅ 是 | 管理员 |
| GET /violations/list | ✅ 是 | 管理员 |
| POST /violations/:id/handle | ✅ 是 | 管理员 |

---

## 📊 数据模型

参考 [审核数据模型](../schemas/review.md)

---

## 🔗 相关文档

- [审核系统功能文档](../../features/review/README.md)
- [分级审核设计](../../../../TIERED_AUDIT_SYSTEM_DESIGN.md)
- [API总索引](../API_INDEX.md)

