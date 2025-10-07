# 📝 问卷API端点文档

> **模块**: 问卷系统API  
> **最后更新**: 2025年10月7日

## 📋 端点列表

### V1传统问卷API

#### 1. 获取问卷定义
```http
GET /api/questionnaire-v1/definition/:questionnaireId
```

**参数**:
- `questionnaireId` (path): 问卷ID，如 `questionnaire-v1-2024`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "questionnaire-v1-2024",
    "title": "2025年大学生就业调查（第一版）",
    "sections": [...]
  },
  "systemInfo": {
    "systemVersion": "v1",
    "systemName": "传统问卷系统"
  }
}
```

#### 2. 提交问卷
```http
POST /api/questionnaire-v1/submit
```

**请求体**:
```json
{
  "questionnaireId": "questionnaire-v1-2024",
  "personalInfo": {
    "age": 22,
    "gender": "male"
  },
  "educationInfo": {...},
  "employmentInfo": {...}
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "pending"
  }
}
```

#### 3. 获取问卷列表
```http
GET /api/questionnaire-v1/responses
```

**查询参数**:
- `page` (query): 页码，默认1
- `pageSize` (query): 每页数量，默认20

**响应**:
```json
{
  "success": true,
  "data": {
    "responses": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20
    }
  }
}
```

---

### V2智能问卷API

#### 4. 获取问卷定义
```http
GET /api/questionnaire-v2/definition/:questionnaireId
```

**参数**:
- `questionnaireId` (path): 问卷ID，如 `questionnaire-v2-2024`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "questionnaire-v2-2024",
    "title": "2025年大学生就业调查（智能版）",
    "sections": [
      {
        "id": "economic-pressure",
        "title": "经济压力分析",
        "questions": [...]
      }
    ]
  }
}
```

#### 5. 提交问卷
```http
POST /api/questionnaire-v2/submit
```

**请求体**:
```json
{
  "questionnaireId": "questionnaire-v2-2024",
  "sectionResponses": [
    {
      "sectionId": "economic-pressure",
      "responses": [
        {
          "questionId": "monthly-income",
          "answer": "5000-8000"
        }
      ]
    }
  ],
  "metadata": {
    "completionTime": 180,
    "deviceType": "mobile"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "tags": ["经济压力大", "就业信心中等"]
  }
}
```

#### 6. 获取可视化数据
```http
GET /api/questionnaire-v2/analytics/:questionnaireId
```

**查询参数**:
- `include_test_data` (query): 是否包含测试数据，默认false

**响应**:
```json
{
  "success": true,
  "data": {
    "totalResponses": 500,
    "charts": {
      "economicPressure": {
        "distribution": [...]
      },
      "employmentConfidence": {
        "distribution": [...]
      }
    }
  }
}
```

---

### 统一问卷API

#### 7. 获取问卷定义
```http
GET /api/universal-questionnaire/questionnaires/:questionnaireId
```

**公开端点**，无需认证。

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "employment-survey-2024",
    "title": "大学生就业调查",
    "sections": [...]
  }
}
```

#### 8. 提交问卷
```http
POST /api/universal-questionnaire/submit
```

**请求体**:
```json
{
  "questionnaireId": "employment-survey-2024",
  "responses": {...},
  "userId": "uuid-xxx"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "responseId": "uuid-yyy",
    "completionStatus": "completed"
  }
}
```

#### 9. 获取统计数据
```http
GET /api/universal-questionnaire/statistics/:questionnaireId
```

**需要认证**。

**响应**:
```json
{
  "success": true,
  "data": {
    "totalResponses": 1000,
    "responses": [...]
  }
}
```

#### 10. 获取问卷列表
```http
GET /api/universal-questionnaire/list
```

**需要管理员权限**。

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "questionnaire_id": "employment-survey-2024",
      "total_responses": 1000,
      "completed_responses": 950
    }
  ]
}
```

---

## 🔒 认证要求

| 端点 | 认证 | 权限 |
|------|------|------|
| GET /questionnaire-v1/definition/:id | ❌ 否 | 公开 |
| POST /questionnaire-v1/submit | ✅ 是 | 用户 |
| GET /questionnaire-v1/responses | ✅ 是 | 用户 |
| GET /questionnaire-v2/definition/:id | ❌ 否 | 公开 |
| POST /questionnaire-v2/submit | ✅ 是 | 用户 |
| GET /questionnaire-v2/analytics/:id | ❌ 否 | 公开 |
| GET /universal-questionnaire/questionnaires/:id | ❌ 否 | 公开 |
| POST /universal-questionnaire/submit | ✅ 是 | 用户 |
| GET /universal-questionnaire/statistics/:id | ✅ 是 | 管理员 |
| GET /universal-questionnaire/list | ✅ 是 | 管理员 |

---

## 📊 数据模型

参考 [问卷数据模型](../schemas/questionnaire.md)

---

## 🔗 相关文档

- [问卷系统功能文档](../../features/questionnaire/README.md)
- [API总索引](../API_INDEX.md)
- [数据库设计](../../database/DATABASE_SCHEMA.md)

