# ✅ 审核数据模型

> **模块**: 审核系统数据模型  
> **最后更新**: 2025年10月7日

## 📋 数据模型定义

### 1. 审核记录模型

**表名**: `audit_records`

**TypeScript接口**:
```typescript
interface AuditRecord {
  id: number;
  content_id: number;
  content_type: 'story' | 'heart_voice' | 'questionnaire';
  reviewer_id: string | null;
  action: 'approve' | 'reject' | 'pending';
  reason: string | null;
  audit_level: 'level1' | 'level2' | 'level3';
  risk_score: number;
  confidence: number;
  created_at: string;
  updated_at: string;
}
```

**示例数据**:
```json
{
  "id": 1,
  "content_id": 123,
  "content_type": "story",
  "reviewer_id": "uuid-xxx",
  "action": "approve",
  "reason": "内容符合规范",
  "audit_level": "level2",
  "risk_score": 0.2,
  "confidence": 0.9,
  "created_at": "2025-10-07T10:00:00Z",
  "updated_at": "2025-10-07T11:00:00Z"
}
```

---

### 2. 违规内容模型

**表名**: `violation_content`

**TypeScript接口**:
```typescript
interface ViolationContent {
  id: number;
  content_id: number;
  content_type: 'story' | 'heart_voice';
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matched_text: string | null;
  rule_id: string | null;
  detected_at: string;
  handled: 0 | 1;
  handled_by: string | null;
  handled_at: string | null;
  notes: string | null;
}
```

**示例数据**:
```json
{
  "id": 1,
  "content_id": 123,
  "content_type": "story",
  "violation_type": "不当言论",
  "severity": "high",
  "matched_text": "敏感词汇",
  "rule_id": "rule_001",
  "detected_at": "2025-10-07T10:00:00Z",
  "handled": 1,
  "handled_by": "uuid-xxx",
  "handled_at": "2025-10-07T11:00:00Z",
  "notes": "已删除违规内容"
}
```

---

### 3. 内容举报模型

**表名**: `content_reports`

**TypeScript接口**:
```typescript
interface ContentReport {
  id: number;
  reporter_id: string;
  content_id: number;
  content_type: 'story' | 'heart_voice';
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
}
```

**示例数据**:
```json
{
  "id": 1,
  "reporter_id": "uuid-yyy",
  "content_id": 123,
  "content_type": "story",
  "reason": "不当言论",
  "description": "包含敏感内容",
  "status": "resolved",
  "created_at": "2025-10-07T10:00:00Z",
  "updated_at": "2025-10-07T11:00:00Z",
  "resolved_by": "uuid-xxx",
  "resolved_at": "2025-10-07T11:00:00Z"
}
```

---

### 4. 用户信誉模型

**表名**: `user_reputation`

**TypeScript接口**:
```typescript
interface UserReputation {
  id: number;
  user_id: string;
  reputation_score: number;
  violation_count: number;
  warning_count: number;
  ban_count: number;
  last_violation_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**示例数据**:
```json
{
  "id": 1,
  "user_id": "uuid-yyy",
  "reputation_score": 85,
  "violation_count": 2,
  "warning_count": 1,
  "ban_count": 0,
  "last_violation_at": "2025-10-01T00:00:00Z",
  "created_at": "2025-09-01T00:00:00Z",
  "updated_at": "2025-10-07T10:00:00Z"
}
```

---

### 5. 审核决策模型

**TypeScript接口**:
```typescript
interface AuditDecision {
  passed: boolean;
  action: 'auto_approve' | 'manual_review' | 'auto_reject';
  audit_level: 'level1' | 'level2' | 'level3';
  risk_score: number;
  confidence: number;
  reason: string;
  violations: Violation[];
}

interface Violation {
  rule_id: string;
  category: string;
  matched_text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}
```

**示例数据**:
```json
{
  "passed": false,
  "action": "manual_review",
  "audit_level": "level2",
  "risk_score": 0.6,
  "confidence": 0.85,
  "reason": "检测到潜在敏感内容",
  "violations": [
    {
      "rule_id": "rule_001",
      "category": "sensitive_content",
      "matched_text": "敏感词汇",
      "severity": "medium",
      "confidence": 0.85
    }
  ]
}
```

---

### 6. 审核统计响应模型

**API响应**:
```typescript
interface ReviewStatsResponse {
  success: boolean;
  data: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    todayReviewed: number;
    averageReviewTime: number; // 秒
    approvalRate: number; // 0-1
    rejectionRate: number; // 0-1
  };
  message?: string;
}
```

---

### 7. 待审核列表响应模型

**API响应**:
```typescript
interface PendingReviewsResponse {
  success: boolean;
  data: {
    reviews: Array<{
      id: number;
      content_type: string;
      content_id: number;
      title: string;
      content: string;
      submitted_at: string;
      audit_status: string;
      risk_score: number;
    }>;
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

## 🔗 相关文档

- [审核API端点](../endpoints/review.md)
- [审核系统功能文档](../../features/review/README.md)
- [分级审核设计](../../../../TIERED_AUDIT_SYSTEM_DESIGN.md)
- [数据库设计](../../database/DATABASE_SCHEMA.md)

