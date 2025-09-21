# API接口规范 V1

## 🎯 设计原则

- **RESTful**: 遵循REST架构风格
- **一致性**: 统一的请求/响应格式
- **版本控制**: 支持API版本管理
- **错误处理**: 标准化错误响应
- **文档化**: 完整的OpenAPI规范
- **安全性**: 认证和授权机制

## 📋 通用规范

### 基础URL
```
开发环境: http://localhost:8787/api/v1
生产环境: https://api.employment-survey.com/v1
```

### 请求格式
```typescript
// 请求头
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>",
  "X-Request-ID": "<uuid>"
}

// 分页参数
{
  "page": 1,
  "pageSize": 20,
  "sortBy": "created_at",
  "sortOrder": "desc"
}
```

### 响应格式
```typescript
// 成功响应
{
  "success": true,
  "data": any,
  "message": string,
  "timestamp": string,
  "requestId": string
}

// 错误响应
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details": any
  },
  "timestamp": string,
  "requestId": string
}

// 分页响应
{
  "success": true,
  "data": {
    "items": any[],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  }
}
```

## 🔐 认证接口

### POST /auth/login
用户登录
```typescript
// 请求
{
  "email": string,
  "password": string
}

// 响应
{
  "success": true,
  "data": {
    "token": string,
    "refreshToken": string,
    "user": {
      "id": string,
      "email": string,
      "username": string,
      "role": string
    },
    "expiresIn": number
  }
}
```

### POST /auth/refresh
刷新令牌
```typescript
// 请求
{
  "refreshToken": string
}

// 响应
{
  "success": true,
  "data": {
    "token": string,
    "expiresIn": number
  }
}
```

### POST /auth/logout
用户登出
```typescript
// 请求
{} // 空请求体，通过Authorization头传递token

// 响应
{
  "success": true,
  "message": "登出成功"
}
```

## 📝 问卷接口

### POST /questionnaires
提交问卷
```typescript
// 请求
{
  "educationLevel": string,
  "major": string,
  "graduationYear": number,
  "region": string,
  "employmentStatus": string,
  "jobSearchDuration": string,
  "jobSatisfaction": number,
  "salaryRange": string,
  "adviceForStudents": string,
  "observationOnEmployment": string,
  "isAnonymous": boolean
}

// 响应
{
  "success": true,
  "data": {
    "id": string,
    "status": "pending",
    "submittedAt": string
  }
}
```

### GET /questionnaires
获取问卷列表 (管理员)
```typescript
// 查询参数
{
  "page": number,
  "pageSize": number,
  "status": "pending" | "approved" | "rejected",
  "educationLevel": string,
  "region": string,
  "startDate": string,
  "endDate": string
}

// 响应
{
  "success": true,
  "data": {
    "items": QuestionnaireResponse[],
    "pagination": PaginationInfo
  }
}
```

### GET /questionnaires/stats
获取问卷统计
```typescript
// 查询参数
{
  "timeRange": "7d" | "30d" | "90d" | "1y",
  "groupBy": "education" | "region" | "employment"
}

// 响应
{
  "success": true,
  "data": {
    "total": number,
    "byEducation": Record<string, number>,
    "byRegion": Record<string, number>,
    "byEmployment": Record<string, number>,
    "trends": {
      "dates": string[],
      "counts": number[]
    }
  }
}
```

## 💬 问卷心声接口

### GET /voices
获取已发布心声
```typescript
// 查询参数
{
  "page": number,
  "pageSize": number,
  "type": "advice" | "observation",
  "featured": boolean
}

// 响应
{
  "success": true,
  "data": {
    "items": Voice[],
    "pagination": PaginationInfo
  }
}
```

### POST /voices
提交心声 (从问卷中提取)
```typescript
// 请求
{
  "questionnaireId": string,
  "title": string,
  "content": string,
  "type": "advice" | "observation"
}

// 响应
{
  "success": true,
  "data": {
    "id": string,
    "status": "pending"
  }
}
```

### PUT /voices/:id/review
审核心声 (审核员)
```typescript
// 请求
{
  "action": "approve" | "reject",
  "notes": string,
  "qualityScore": number
}

// 响应
{
  "success": true,
  "data": {
    "id": string,
    "status": string,
    "reviewedAt": string
  }
}
```

## 📊 数据可视化接口

### GET /analytics/overview
获取概览数据
```typescript
// 响应
{
  "success": true,
  "data": {
    "totalResponses": number,
    "totalVoices": number,
    "totalStories": number,
    "activeUsers": number,
    "trends": {
      "responses": TrendData,
      "voices": TrendData,
      "stories": TrendData
    }
  }
}
```

### GET /analytics/education
教育水平分析
```typescript
// 查询参数
{
  "timeRange": string,
  "region": string
}

// 响应
{
  "success": true,
  "data": {
    "distribution": Record<string, number>,
    "trends": TrendData,
    "insights": string[]
  }
}
```

### GET /analytics/employment
就业状况分析
```typescript
// 查询参数
{
  "timeRange": string,
  "educationLevel": string
}

// 响应
{
  "success": true,
  "data": {
    "statusDistribution": Record<string, number>,
    "satisfactionAverage": number,
    "salaryDistribution": Record<string, number>,
    "trends": TrendData
  }
}
```

## 👥 用户管理接口

### GET /users
获取用户列表 (管理员)
```typescript
// 查询参数
{
  "page": number,
  "pageSize": number,
  "role": string,
  "status": string,
  "search": string
}

// 响应
{
  "success": true,
  "data": {
    "items": User[],
    "pagination": PaginationInfo
  }
}
```

### PUT /users/:id
更新用户信息 (管理员)
```typescript
// 请求
{
  "username": string,
  "email": string,
  "role": string,
  "status": string
}

// 响应
{
  "success": true,
  "data": User
}
```

## 🔍 审核管理接口

### GET /reviews/queue
获取审核队列 (审核员)
```typescript
// 查询参数
{
  "contentType": "questionnaire" | "voice" | "story",
  "priority": "high" | "normal" | "low",
  "assignedTo": string
}

// 响应
{
  "success": true,
  "data": {
    "items": ReviewItem[],
    "stats": {
      "pending": number,
      "inProgress": number,
      "completed": number
    }
  }
}
```

### POST /reviews/batch
批量审核 (审核员)
```typescript
// 请求
{
  "items": [
    {
      "id": string,
      "action": "approve" | "reject",
      "notes": string
    }
  ]
}

// 响应
{
  "success": true,
  "data": {
    "processed": number,
    "failed": number,
    "results": ReviewResult[]
  }
}
```

## 📈 系统监控接口

### GET /system/health
系统健康检查
```typescript
// 响应
{
  "success": true,
  "data": {
    "status": "healthy" | "degraded" | "unhealthy",
    "services": {
      "database": ServiceStatus,
      "storage": ServiceStatus,
      "cache": ServiceStatus
    },
    "metrics": {
      "uptime": number,
      "responseTime": number,
      "errorRate": number
    }
  }
}
```

### GET /system/metrics
系统指标
```typescript
// 查询参数
{
  "timeRange": string,
  "metrics": string[]
}

// 响应
{
  "success": true,
  "data": {
    "metrics": Record<string, MetricData>,
    "timestamp": string
  }
}
```

## 🛡️ 错误代码

| 代码 | 描述 | HTTP状态码 |
|------|------|------------|
| AUTH_001 | 未授权访问 | 401 |
| AUTH_002 | 令牌已过期 | 401 |
| AUTH_003 | 权限不足 | 403 |
| VALID_001 | 请求参数无效 | 400 |
| VALID_002 | 必填字段缺失 | 400 |
| RESOURCE_001 | 资源不存在 | 404 |
| RESOURCE_002 | 资源已存在 | 409 |
| SYSTEM_001 | 内部服务器错误 | 500 |
| SYSTEM_002 | 服务不可用 | 503 |

## 📚 类型定义

详见 `shared/types/api.ts` 文件中的完整类型定义。

---

*此规范确保API的一致性、可维护性和扩展性，为前后端开发提供明确的接口契约。*
