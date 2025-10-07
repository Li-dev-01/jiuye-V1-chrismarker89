# 📝 问卷数据模型

> **模块**: 问卷系统数据模型  
> **最后更新**: 2025年10月7日

## 📋 数据模型定义

### 1. V1问卷响应模型

**表名**: `questionnaire_responses`

**TypeScript接口**:
```typescript
interface QuestionnaireV1Response {
  id: number;
  user_id: string | null;
  questionnaire_id: string;
  personal_info: string; // JSON
  education_info: string; // JSON
  employment_info: string; // JSON
  job_search_info: string; // JSON
  employment_status: string; // JSON
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

**JSON字段结构**:
```typescript
// personal_info
{
  age: number;
  gender: 'male' | 'female' | 'other';
  location: string;
}

// education_info
{
  school: string;
  major: string;
  education_level: 'bachelor' | 'master' | 'phd';
  graduation_year: number;
}

// employment_info
{
  status: 'employed' | 'unemployed' | 'student';
  job_title?: string;
  company?: string;
  salary?: string;
}
```

---

### 2. V2问卷响应模型

**表名**: `universal_questionnaire_responses`

**TypeScript接口**:
```typescript
interface QuestionnaireV2Response {
  id: string; // UUID
  questionnaire_id: string;
  user_uuid: string | null;
  section_responses: string; // JSON
  metadata: string; // JSON
  completion_status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}
```

**section_responses结构**:
```typescript
[
  {
    sectionId: 'economic-pressure';
    responses: [
      {
        questionId: 'monthly-income';
        answer: '5000-8000';
      },
      {
        questionId: 'debt-burden';
        answer: 'moderate';
      }
    ];
  },
  {
    sectionId: 'employment-confidence';
    responses: [
      {
        questionId: 'short-term-confidence';
        answer: 4;
      }
    ];
  }
]
```

**metadata结构**:
```typescript
{
  completionTime: number; // 秒
  deviceType: 'mobile' | 'desktop' | 'tablet';
  tags: string[]; // 自动生成的标签
  ipAddress?: string;
  userAgent?: string;
}
```

---

### 3. 问卷定义模型

**TypeScript接口**:
```typescript
interface QuestionnaireDefinition {
  id: string;
  title: string;
  description: string;
  version: string;
  sections: Section[];
  metadata: {
    estimatedTime: number; // 分钟
    totalQuestions: number;
    supportedLanguages: string[];
  };
}

interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  metadata: {
    estimatedTime: number;
    cognitiveLoad: 'low' | 'medium' | 'high';
    priority: 'high' | 'medium' | 'low';
  };
}

interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'number' | 'scale';
  question: string;
  options?: Option[];
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  branchLogic?: {
    condition: string;
    targetQuestionId: string;
  }[];
}

interface Option {
  id: string;
  label: string;
  value: string | number;
}
```

---

### 4. 问卷统计模型

**表名**: `questionnaire_v2_statistics`

**TypeScript接口**:
```typescript
interface QuestionnaireStatistics {
  id: number;
  questionnaire_id: string;
  dimension_type: string;
  metric_name: string;
  metric_value: number;
  group_by_field: string | null;
  group_by_value: string | null;
  date_range: string | null;
  calculated_at: string;
  sample_size: number;
  confidence_level: number;
  is_test_data: 0 | 1;
}
```

**示例数据**:
```json
{
  "id": 1,
  "questionnaire_id": "questionnaire-v2-2024",
  "dimension_type": "economic_pressure",
  "metric_name": "avg_monthly_income",
  "metric_value": 6500.5,
  "group_by_field": "education_level",
  "group_by_value": "bachelor",
  "date_range": "2025-10",
  "calculated_at": "2025-10-07T10:00:00Z",
  "sample_size": 500,
  "confidence_level": 0.95,
  "is_test_data": 0
}
```

---

### 5. 问卷进度模型

**表名**: `questionnaire_progress`

**TypeScript接口**:
```typescript
interface QuestionnaireProgress {
  id: number;
  user_id: string;
  questionnaire_id: string;
  current_section: number;
  current_responses: string; // JSON
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}
```

**current_responses结构**:
```typescript
{
  section1: {
    responses: [...]
  },
  section2: {
    responses: [...]
  }
}
```

---

### 6. 标签统计模型

**表名**: `tag_statistics`

**TypeScript接口**:
```typescript
interface TagStatistics {
  id: number;
  tag_name: string;
  count: number;
  category: string;
  created_at: string;
  updated_at: string;
}
```

**示例数据**:
```json
{
  "id": 1,
  "tag_name": "经济压力大",
  "count": 200,
  "category": "economic_pressure",
  "created_at": "2025-10-01T00:00:00Z",
  "updated_at": "2025-10-07T10:00:00Z"
}
```

---

## 🔗 相关文档

- [问卷API端点](../endpoints/questionnaire.md)
- [问卷系统功能文档](../../features/questionnaire/README.md)
- [数据库设计](../../database/DATABASE_SCHEMA.md)

