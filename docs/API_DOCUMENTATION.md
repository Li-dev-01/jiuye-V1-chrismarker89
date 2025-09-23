# 就业调查系统 API 文档

## 概览

本文档描述了大学生就业调查问卷系统的所有API端点。

### 基础信息

- **基础URL**: `https://employment-survey-api-prod.chrismarker89.workers.dev`
- **API版本**: v1.0.0
- **认证方式**: Bearer Token

### 响应格式

所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "请求参数错误",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## API端点


### Admin

#### GET /api/admin/users/download/${Date.now()}.${format}

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/users

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/google-whitelist

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ip-access-control

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/intelligent-security

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/database-test

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/google-whitelist

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ip-access-control

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/intelligent-security

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/login-monitor

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/database

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/dashboard/stats

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/questionnaires

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/questionnaires/<int:questionnaire_id>

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/audit-records

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/audit-config

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/audit-config

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ai-providers

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ai-sources

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ai-sources

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/local-rules

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/users

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/users/stats

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/users/<user_id>/status

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/reviewers/<reviewer_id>/activity

获取指定admin的详细信息

**参数:**

- `reviewer_id` (path): reviewer_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/reviewers

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/categories

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/tags

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/categories

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/tags

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/database/status

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/api/stats

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/project/status

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/project/control

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/user-behavior/analysis

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/user-behavior/cleanup

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/dashboard/stats

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/questionnaires

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/questionnaires/<int:questionnaire_id>

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/audit-records

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/audit-config

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/audit-config

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ai-providers

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ai-sources

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/ai-sources

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/local-rules

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/users

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/users/stats

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/users/<user_id>/status

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/reviewers/<reviewer_id>/activity

获取指定admin的详细信息

**参数:**

- `reviewer_id` (path): reviewer_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/reviewers

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/categories

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/tags

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/categories

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/content/tags

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/database/status

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/api/stats

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/project/status

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/project/control

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/user-behavior/analysis

获取admin的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/user-behavior/cleanup

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator/clear

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator/smart-voice

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator/smart-story

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator/clear

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator/smart-voice

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin/data-generator/smart-story

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```


### System

#### GET /api/endpoints

获取endpoints的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/summary

获取summary信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/dimension/:dimensionId

获取指定dimension的详细信息

**参数:**

- `dimensionId` (path): dimensionId标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/question/:questionId

获取指定question的详细信息

**参数:**

- `questionId` (path): questionId标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cross-analysis

获取cross-analysis的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/employment-report

获取employment-report信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/real-time-stats

获取real-time-stats的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/data-quality

获取data-quality信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/social-insights

获取social-insights的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/api-docs/swagger.json

获取api-docs信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/api-docs

获取api-docs的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/version

获取version信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/v1

获取v1信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/v2

获取v2信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/api

获取资源信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/auth

获取auth信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid

获取uuid信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/questionnaire

获取questionnaire信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/universal-questionnaire

获取universal-questionnaire信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/reviewer

获取reviewer信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/violations

获取violations的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/tiered-audit

获取tiered-audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/ai-sources

获取ai-sources的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/super-admin

获取super-admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/participation-stats

获取participation-stats的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/questionnaire-auth

获取questionnaire-auth信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/user-content-management

获取user-content-management信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/file-management

获取file-management信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/auto-png

获取auto-png信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/png-test

获取png-test信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/review

获取review信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/database-monitor

获取database-monitor信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/security

获取security信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/*

获取*信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/v1

获取v1信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/v2

获取v2信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/version

获取version信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/v1/

获取v1信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/v2/

获取v2信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/health-test

获取health-test信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/api-docs/swagger.json

获取api-docs信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/api-docs

获取api-docs的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/images/auto-generate/stats

获取images的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/images/auto-generate/batch-generate

获取images信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/errors/report

获取errors信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stats/simple

获取stats信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/images/auto-generate/stats

获取images的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/images/auto-generate/batch-generate

获取images信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/track

获取track信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/api

获取资源信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/auth

获取auth信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/user-content-management

获取user-content-management信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid

获取uuid信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/questionnaire

获取questionnaire信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/universal-questionnaire

获取universal-questionnaire信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/review

获取review信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/reviewer

获取reviewer信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/admin

获取admin信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/participation-stats

获取participation-stats的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/violations

获取violations的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/database-fix

获取database-fix信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/png-management

获取png-management信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/security

获取security信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/

获取资源信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/process

获取audit的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/pending

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/manual-review

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/config

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/level

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/stats

获取audit的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/history

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/test

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/process

获取audit的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/pending

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/manual-review

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/config

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/level

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/stats

获取audit的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/history

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/audit/test

获取audit信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices

获取heart-voices的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices

获取heart-voices的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices/<int:voice_id>

获取指定heart-voices的详细信息

**参数:**

- `int` (path): int标识符
- `voice_id` (path): voice_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices/<int:voice_id>/like

获取指定heart-voices的详细信息

**参数:**

- `int` (path): int标识符
- `voice_id` (path): voice_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices

获取heart-voices的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices

获取heart-voices的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices/<int:voice_id>

获取指定heart-voices的详细信息

**参数:**

- `int` (path): int标识符
- `voice_id` (path): voice_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices/<int:voice_id>/like

获取指定heart-voices的详细信息

**参数:**

- `int` (path): int标识符
- `voice_id` (path): voice_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/generate

获取cards信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/download/<int:card_id>

获取指定cards的详细信息

**参数:**

- `int` (path): int标识符
- `card_id` (path): card_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/styles

获取cards的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/generate

获取cards信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/download/<int:card_id>

获取指定cards的详细信息

**参数:**

- `int` (path): int标识符
- `card_id` (path): card_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/styles

获取cards的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/stats

获取test-data的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/generate

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/clear

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/preview

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/validate

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/templates

获取test-data的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/health

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/stats

获取test-data的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/generate

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/clear

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/preview

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/validate

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/templates

获取test-data的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/test-data/health

获取test-data信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/test-combinations

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/session/<session_id>

获取指定uuid的详细信息

**参数:**

- `session_id` (path): session_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/users/statistics

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/test-combinations

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/session/<session_id>

获取指定uuid的详细信息

**参数:**

- `session_id` (path): session_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/users/statistics

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /health

获取health信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```


### Authentication

#### GET /api/auth/login

获取auth信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/auth/google

获取auth信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/auth/google

获取auth信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/auth/semi-anonymous

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/auth/anonymous

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/auth/semi-anonymous

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/uuid/auth/anonymous

获取uuid的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```


### Questionnaire

#### POST /api/questionnaire/submit

创建新的questionnaire记录

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/questionnaire/statistics/<question_id>

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/questionnaire/statistics/<question_id>

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```


### Reviewer

#### GET /api/reviewer/pending-reviews

获取reviewer的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/reviewer/pending-reviews

获取reviewer的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### POST /api/reviewer/submit-review

创建新的reviewer记录

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/reviewer/stats

获取reviewer的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/reviewer/pending-reviews

获取reviewer的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### POST /api/reviewer/submit-review

创建新的reviewer记录

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/reviewer/stats

获取reviewer的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```


### Analytics

#### GET /api/analytics/basic-stats

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/visualization

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/basic-stats

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/distribution

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/cross-analysis

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/sync

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/sync/status

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/performance

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/cache/invalidate

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/health

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/employment

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/basic-stats

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/distribution

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/cross-analysis

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/sync

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/sync/status

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/performance

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/cache/invalidate

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/health

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/employment

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/dashboard

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/real-data

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/dashboard

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/analytics/real-data

获取analytics的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```


### User

#### GET /api/user/login-history

获取user信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/user/two-factor

获取user信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/user/login-history

获取user信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/user/two-factor

获取user信息

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices/user/<int:user_id>

获取指定heart-voices的详细信息

**参数:**

- `int` (path): int标识符
- `user_id` (path): user_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/heart-voices/user/<int:user_id>

获取指定heart-voices的详细信息

**参数:**

- `int` (path): int标识符
- `user_id` (path): user_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/user/<int:user_id>

获取指定cards的详细信息

**参数:**

- `int` (path): int标识符
- `user_id` (path): user_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/cards/user/<int:user_id>

获取指定cards的详细信息

**参数:**

- `int` (path): int标识符
- `user_id` (path): user_id标识符

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories/user/<int:user_id>

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories/user/<int:user_id>

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```


### Stories

#### GET /api/stories/<int:story_id>

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories/featured

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories/<int:story_id>

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### GET /api/stories/featured

获取stories的分页列表

**参数:**

- `page` (query): 页码
- `pageSize` (query): 每页数量

**响应示例:**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```



## 认证

### Bearer Token

大部分API需要在请求头中包含认证令牌：

```
Authorization: Bearer <your-token>
```

### API Key

某些公开API支持API Key认证：

```
X-API-Key: <your-api-key>
```

## 状态码

- **200**: 成功
- **201**: 创建成功
- **400**: 请求参数错误
- **401**: 未授权
- **403**: 禁止访问
- **404**: 资源不存在
- **500**: 服务器内部错误

## 限流

API请求受到限流保护：

- **匿名用户**: 100 请求/小时
- **认证用户**: 1000 请求/小时
- **管理员**: 10000 请求/小时

## 示例

### 获取故事列表

```bash
curl -X GET "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories?page=1&pageSize=20" \
  -H "Authorization: Bearer <your-token>"
```

### 创建故事

```bash
curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的就业故事",
    "content": "这是我的就业经历...",
    "category": "success",
    "tags": ["就业", "成功"]
  }'
```
