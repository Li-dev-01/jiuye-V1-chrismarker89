# 📝 问卷系统功能文档

> **模块**: 问卷调研与数据收集  
> **完成度**: 100%  
> **最后更新**: 2025年10月7日

## 📋 模块概述

### 基本信息
- **模块名称**: 双问卷系统（V1 + V2）
- **负责范围**: 问卷填写、数据收集、进度保存、数据可视化
- **技术栈**: React + TypeScript + D1 + ECharts
- **依赖模块**: 认证系统、数据分析系统

### 系统架构
问卷系统采用**双系统并行架构**：

```
问卷系统
├── V1传统问卷系统
│   ├── 基础就业信息收集
│   ├── 传统嵌套数据格式
│   └── questionnaire_responses表
│
└── V2智能问卷系统
    ├── 经济压力分析
    ├── 就业信心指数
    ├── 智能分支逻辑
    ├── 实时统计
    └── universal_questionnaire_responses表
```

---

## 🎯 功能清单

### 1. 问卷填写（V1传统问卷）

#### 功能ID: QUEST-V1-001
- **角色**: 所有用户
- **用途**: 填写传统就业调查问卷
- **API端点**: 
  - `GET /api/questionnaire-v1/definition/:id` - 获取问卷定义
  - `POST /api/questionnaire-v1/submit` - 提交问卷
  - `GET /api/questionnaire-v1/responses` - 获取问卷列表
  - `GET /api/questionnaire-v1/responses/:id` - 获取问卷详情
- **数据库表**: 
  - `questionnaire_responses` - V1问卷响应表
- **前端页面**: 
  - `/questionnaire` - 问卷填写页
  - `/my-content` - 我的问卷
- **测试覆盖**: ✅ 完整测试

#### V1问卷结构

**数据格式**:
```json
{
  "personalInfo": {
    "age": 22,
    "gender": "male",
    "education": "bachelor"
  },
  "educationInfo": {
    "school": "北京大学",
    "major": "计算机科学",
    "graduationYear": 2024
  },
  "employmentInfo": {
    "status": "employed",
    "jobTitle": "软件工程师",
    "salary": "15000"
  },
  "jobSearchInfo": {
    "duration": "3个月",
    "channels": ["校招", "内推"]
  }
}
```

**特点**:
- ✅ 传统嵌套JSON格式
- ✅ 固定问题顺序
- ✅ 简单验证规则
- ✅ 适合基础信息收集

---

### 2. 智能问卷填写（V2智能问卷）

#### 功能ID: QUEST-V2-001
- **角色**: 所有用户
- **用途**: 填写智能问卷，支持分支逻辑
- **API端点**: 
  - `GET /api/questionnaire-v2/definition/:id` - 获取问卷定义
  - `POST /api/questionnaire-v2/submit` - 提交问卷
  - `GET /api/questionnaire-v2/responses` - 获取问卷列表
  - `GET /api/questionnaire-v2/responses/:id` - 获取问卷详情
  - `GET /api/questionnaire-v2/analytics/:id` - 获取可视化数据
- **数据库表**: 
  - `universal_questionnaire_responses` - V2问卷响应表
  - `questionnaire_v2_statistics` - V2统计表
- **前端页面**: 
  - `/questionnaire-v2` - V2问卷填写页
  - `/visualization` - 数据可视化页
- **测试覆盖**: ✅ 完整测试

#### V2问卷特性

**智能分支逻辑**:
```typescript
// 根据前面的回答动态显示后续问题
if (economicPressure > 3) {
  showQuestion('debt-details');
  showQuestion('financial-support');
}

if (employmentStatus === 'unemployed') {
  showQuestion('job-search-duration');
  showQuestion('job-search-challenges');
}
```

**数据格式**:
```json
{
  "sectionResponses": [
    {
      "sectionId": "economic-pressure",
      "responses": [
        {
          "questionId": "monthly-income",
          "answer": "5000-8000"
        },
        {
          "questionId": "debt-burden",
          "answer": "moderate"
        }
      ]
    },
    {
      "sectionId": "employment-confidence",
      "responses": [
        {
          "questionId": "short-term-confidence",
          "answer": 4
        }
      ]
    }
  ],
  "metadata": {
    "completionTime": 180,
    "deviceType": "mobile",
    "tags": ["经济压力大", "就业信心中等"]
  }
}
```

**核心维度**:
1. **经济压力分析** - 收入、支出、负债情况
2. **就业信心指数** - 短期/长期就业信心
3. **现代负债形式** - 学生贷款、信用卡、网贷等
4. **生活态度** - 消费观念、职业规划

---

### 3. 问卷进度保存

#### 功能ID: QUEST-003
- **角色**: 已登录用户
- **用途**: 保存未完成的问卷进度
- **API端点**: 
  - `POST /api/questionnaire/save-progress` - 保存进度
  - `GET /api/questionnaire/progress/:id` - 获取进度
  - `DELETE /api/questionnaire/progress/:id` - 删除进度
- **数据库表**: 
  - `questionnaire_progress` - 进度保存表
- **前端页面**: 
  - `/questionnaire` - 问卷填写页（自动保存）
- **测试覆盖**: ✅ 完整测试

#### 自动保存机制

**保存时机**:
- 每完成一个section自动保存
- 用户主动点击"保存草稿"
- 页面关闭前自动保存

**数据结构**:
```json
{
  "userId": "uuid_xxx",
  "questionnaireId": "questionnaire-v2-2024",
  "currentSection": 2,
  "currentResponses": {
    "section1": {...},
    "section2": {...}
  },
  "lastSavedAt": "2025-10-07T10:00:00Z"
}
```

---

### 4. 问卷数据查看

#### 功能ID: QUEST-004
- **角色**: 已登录用户
- **用途**: 查看自己提交的问卷
- **API端点**: 
  - `GET /api/questionnaire/my-submissions` - 我的问卷列表
  - `GET /api/questionnaire/submission/:id` - 问卷详情
- **数据库表**: 
  - `questionnaire_responses` (V1)
  - `universal_questionnaire_responses` (V2)
- **前端页面**: 
  - `/my-content` - 我的内容页
- **测试覆盖**: ✅ 完整测试

#### 数据展示

**列表视图**:
- 提交时间
- 问卷类型（V1/V2）
- 完成状态
- 生成的标签

**详情视图**:
- 所有问题和答案
- 提交时间
- 设备信息
- 生成的用户画像标签

---

### 5. 数据可视化

#### 功能ID: QUEST-005
- **角色**: 所有用户
- **用途**: 查看问卷统计数据可视化
- **API端点**: 
  - `GET /api/questionnaire-v2/analytics/:id` - 获取可视化数据
  - `GET /api/analytics/visualization` - 综合可视化
- **数据库表**: 
  - `questionnaire_v2_statistics` - 统计数据表
- **前端页面**: 
  - `/visualization` - 数据可视化页
- **测试覆盖**: ✅ 完整测试
- **相关文档**: [可视化修复报告](../../../../VISUALIZATION_FIX_REPORT.md)

#### 可视化图表

**经济压力分布**:
```typescript
{
  chartType: 'bar',
  data: {
    labels: ['无压力', '轻微', '中等', '较大', '极大'],
    values: [120, 350, 580, 420, 230]
  }
}
```

**就业信心指数**:
```typescript
{
  chartType: 'line',
  data: {
    shortTerm: [3.5, 3.8, 4.0, 4.2],
    longTerm: [3.0, 3.2, 3.4, 3.5]
  }
}
```

**现代负债形式**:
```typescript
{
  chartType: 'pie',
  data: {
    '学生贷款': 45%,
    '信用卡': 30%,
    '网贷': 15%,
    '其他': 10%
  }
}
```

---

## 🔗 共用组件

### 后端组件
- `QuestionnaireV1ConfigManager` - V1配置管理
- `QuestionnaireV2ConfigManager` - V2配置管理
- `QuestionnaireValidator` - 问卷验证器
- `StatisticsCalculator` - 统计计算器

### 前端组件
- `QuestionnaireForm` - 问卷表单组件
- `ProgressSaver` - 进度保存组件
- `VisualizationChart` - 可视化图表组件
- `QuestionRenderer` - 问题渲染器

---

## 📊 数据流

### 问卷提交流程
```
用户填写问卷
  ↓
前端验证
  ↓
自动保存进度
  ↓
用户提交
  ↓
后端验证
  ↓
生成用户标签
  ↓
存储到数据库
  ↓
更新统计数据
  ↓
返回成功
```

### 统计数据更新流程
```
新问卷提交
  ↓
提取关键维度数据
  ↓
更新统计表
  ↓
重新计算聚合数据
  ↓
缓存可视化数据
  ↓
前端实时刷新
```

---

## 📈 性能指标

- **问卷加载时间**: < 300ms
- **提交响应时间**: < 500ms
- **进度保存时间**: < 200ms
- **可视化加载时间**: < 800ms
- **并发提交支持**: 500+ req/s

---

## 🎯 最佳实践

### 1. 问卷设计
- 问题数量控制在20-30个
- 使用分支逻辑减少无关问题
- 提供进度指示器

### 2. 数据质量
- 前后端双重验证
- 必填项明确标注
- 提供示例答案

### 3. 用户体验
- 自动保存进度
- 支持返回修改
- 提交前预览

### 4. 性能优化
- 分页加载问题
- 统计数据缓存
- 图表懒加载

---

## 📚 相关文档

- [问卷增强报告](../../../../questionnaire-enhancement-report.md)
- [可视化修复报告](../../../../VISUALIZATION_FIX_REPORT.md)
- [V1/V2系统对比](../../../../QUESTIONNAIRE_V1_V2_COMPARISON.md)
- [API文档](../../api/endpoints/questionnaire.md)
- [数据模型](../../api/schemas/questionnaire.md)

