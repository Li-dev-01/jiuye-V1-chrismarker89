# 📊 数据分析API端点文档

> **模块**: 数据分析系统API  
> **最后更新**: 2025年10月7日

## 📋 端点列表

### 1. 获取仪表板数据
```http
GET /api/analytics/dashboard
```

**需要管理员权限**。

**响应**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalQuestionnaires": 500,
    "totalStories": 200,
    "activeUsers": 150,
    "completionRate": 0.85
  }
}
```

---

### 2. 获取真实问卷数据
```http
GET /api/analytics/real-data
```

**需要管理员权限**。

**响应**:
```json
{
  "success": true,
  "data": {
    "totalResponses": 500,
    "hasData": true,
    "educationDistribution": [
      {"level": "本科", "count": 300},
      {"level": "硕士", "count": 150}
    ],
    "majorDistribution": [...],
    "employmentStatusDistribution": [...],
    "lastUpdated": "2025-10-07T10:00:00Z"
  }
}
```

---

### 3. 获取问卷覆盖率分析
```http
GET /api/analytics/questionnaire-coverage-analysis/:questionnaireId
```

**需要管理员权限**。

**参数**:
- `questionnaireId` (path): 问卷ID

**响应**:
```json
{
  "success": true,
  "data": {
    "questionnaireId": "employment-survey-2024",
    "summary": {
      "totalQuestions": 50,
      "statsConfiguredRate": 0.9,
      "dataAvailableRate": 0.85,
      "readinessRate": 0.8,
      "readyQuestions": 40
    },
    "analysis": {...},
    "performanceAssessment": {...}
  }
}
```

---

### 4. 获取性能架构评估
```http
GET /api/analytics/performance-architecture-assessment/:questionnaireId
```

**需要管理员权限**。

**参数**:
- `questionnaireId` (path): 问卷ID

**响应**:
```json
{
  "success": true,
  "data": {
    "performanceMetrics": {
      "queryTime": 120,
      "cacheHitRate": 0.85
    },
    "architectureAssessment": {
      "scalability": "good",
      "reliability": "excellent"
    }
  }
}
```

---

### 5. 获取Cloudflare Analytics指标
```http
GET /api/analytics/cloudflare/metrics
```

**需要管理员权限**。

**查询参数**:
- `timeRange` (query): 时间范围，如`24h`、`7d`、`30d`

**响应**:
```json
{
  "success": true,
  "data": {
    "requestStats": {
      "total_requests": 10000,
      "avg_response_time": 150,
      "p95_response_time": 300
    },
    "geographyStats": [...],
    "databaseStats": [...],
    "errorStats": [...]
  }
}
```

---

### 6. 获取请求统计
```http
GET /api/analytics/cloudflare/requests
```

**需要管理员权限**。

**查询参数**:
- `timeRange` (query): 时间范围

**响应**:
```json
{
  "success": true,
  "data": {
    "total_requests": 10000,
    "success_rate": 0.98,
    "avg_response_time": 150
  }
}
```

---

### 7. 获取标签统计
```http
GET /api/analytics/tags
```

**需要管理员权限**。

**响应**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "tag_name": "经济压力大",
        "count": 200,
        "percentage": 0.4
      },
      {
        "tag_name": "就业信心中等",
        "count": 150,
        "percentage": 0.3
      }
    ],
    "totalTags": 10,
    "totalUsers": 500
  }
}
```

---

### 8. 获取故事统计
```http
GET /api/analytics/stories
```

**需要管理员权限**。

**响应**:
```json
{
  "success": true,
  "data": {
    "totalStories": 200,
    "publishedStories": 180,
    "pendingStories": 15,
    "rejectedStories": 5,
    "categoryDistribution": [
      {"category": "求职经历", "count": 80},
      {"category": "职场感悟", "count": 60}
    ],
    "popularStories": [...]
  }
}
```

---

### 9. 获取用户统计
```http
GET /api/analytics/users
```

**需要管理员权限**。

**响应**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "activeUsers": 150,
    "newUsersToday": 10,
    "userTypeDistribution": [
      {"type": "semi_anonymous", "count": 800},
      {"type": "google_oauth", "count": 200}
    ],
    "activityTrend": [...]
  }
}
```

---

### 10. 获取交叉分析数据
```http
GET /api/analytics/cross-analysis
```

**需要管理员权限**。

**查询参数**:
- `dimension1` (query): 第一维度，如`education`
- `dimension2` (query): 第二维度，如`employment_status`

**响应**:
```json
{
  "success": true,
  "data": {
    "crossAnalysis": [
      {
        "dimension1_value": "本科",
        "dimension2_value": "已就业",
        "count": 200
      }
    ]
  }
}
```

---

## 🔒 认证要求

| 端点 | 认证 | 权限 |
|------|------|------|
| GET /analytics/dashboard | ✅ 是 | 管理员 |
| GET /analytics/real-data | ✅ 是 | 管理员 |
| GET /analytics/questionnaire-coverage-analysis/:id | ✅ 是 | 管理员 |
| GET /analytics/performance-architecture-assessment/:id | ✅ 是 | 管理员 |
| GET /analytics/cloudflare/metrics | ✅ 是 | 管理员 |
| GET /analytics/cloudflare/requests | ✅ 是 | 管理员 |
| GET /analytics/tags | ✅ 是 | 管理员 |
| GET /analytics/stories | ✅ 是 | 管理员 |
| GET /analytics/users | ✅ 是 | 管理员 |
| GET /analytics/cross-analysis | ✅ 是 | 管理员 |

---

## 📊 数据模型

参考 [数据分析模型](../schemas/analytics.md)

---

## 🔗 相关文档

- [数据分析功能文档](../../features/analytics/README.md)
- [性能监控文档](../../../../docs/database/DATABASE_TECHNICAL_DOCUMENTATION.md)
- [API总索引](../API_INDEX.md)

