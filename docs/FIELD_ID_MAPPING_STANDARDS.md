# 问卷字段ID映射规范

> **版本**: v1.0  
> **创建日期**: 2025-10-05  
> **状态**: ✅ 已实施

---

## 📋 规范目的

统一管理问卷字段ID，避免硬编码导致的字段不一致问题，确保：
1. 前端问卷定义、后端API、数据分析服务使用相同的字段ID
2. 字段ID变更时只需修改一处配置文件
3. 代码可读性和可维护性提升

---

## 🎯 命名规范

### 1. 字段ID命名规则

| 类型 | 格式 | 示例 | 说明 |
|------|------|------|------|
| 问卷字段ID | `kebab-case-v2` | `age-range-v2` | 小写字母，单词用连字符分隔，版本号后缀 |
| 数据库字段 | `snake_case` | `age_range` | 小写字母，单词用下划线分隔 |
| TypeScript常量 | `camelCase` | `ageRange` | 驼峰命名 |
| 中文标签 | 中文 | `年龄段` | 用于UI显示 |

### 2. 版本号规则

- **v2**: 第二版问卷（当前版本）
- **v1**: 第一版问卷（已废弃）
- 未来版本：v3, v4...

---

## 📁 配置文件位置

### 后端配置
```
backend/src/config/questionnaireFieldMappings.ts
```

### 前端配置（如需要）
```
frontend/src/config/questionnaireFieldMappings.ts
```

---

## 🔧 使用方法

### 1. 导入配置

```typescript
import { QUESTIONNAIRE_V2_FIELD_IDS as FIELDS } from '../config/questionnaireFieldMappings';
```

### 2. 使用字段ID

**❌ 错误方式（硬编码）**：
```typescript
const age = answers['age-range-v2'];
const status = answers['employment-status-v2'];  // 错误！实际字段是 current-status-question-v2
```

**✅ 正确方式（使用配置）**：
```typescript
const age = answers[FIELDS.ageRange];
const status = answers[FIELDS.currentStatus];
```

### 3. 获取中文标签

```typescript
import { getFieldLabel, getFieldValueLabel } from '../config/questionnaireFieldMappings';

const label = getFieldLabel('ageRange');  // "年龄段"
const valueLabel = getFieldValueLabel('ageRange', '23-25');  // "23-25岁"
```

---

## 📊 完整字段ID映射表

### 基本信息

| TypeScript常量 | 字段ID | 中文标签 | 值示例 |
|---------------|--------|---------|--------|
| `gender` | `gender-v2` | 性别 | male, female |
| `ageRange` | `age-range-v2` | 年龄段 | under-20, 18-22, 23-25, 26-30, 30+ |
| `educationLevel` | `education-level-v2` | 学历 | high-school, college, bachelor, master, phd |
| `maritalStatus` | `marital-status-v2` | 婚姻状态 | single, married, divorced |
| `hasChildren` | `has-children-v2` | 是否有孩子 | yes, no |
| `fertilityIntent` | `fertility-intent-v2` | 生育意愿 | yes, no, uncertain |

### 地理信息

| TypeScript常量 | 字段ID | 中文标签 | 值示例 |
|---------------|--------|---------|--------|
| `currentCityTier` | `current-city-tier-v2` | 城市层级 | tier1, tier2, tier3, tier4, rural |
| `hukouType` | `hukou-type-v2` | 户口类型 | urban, rural |

### 就业信息

| TypeScript常量 | 字段ID | 中文标签 | 值示例 |
|---------------|--------|---------|--------|
| `yearsExperience` | `years-experience-v2` | 工作年限 | none, 1-3, 3-5, 5+ |
| `currentStatus` | `current-status-question-v2` | 就业状态 | employed, unemployed, student, freelance |

⚠️ **注意**：不是 `employment-status-v2`！

### 经济信息

| TypeScript常量 | 字段ID | 中文标签 | 值类型 | 值示例 |
|---------------|--------|---------|--------|--------|
| `debtSituation` | `debt-situation-v2` | 负债情况 | 数组 | ["alipay-huabei", "credit-card"] |
| `monthlyDebtBurden` | `monthly-debt-burden-v2` | 月度债务 | 字符串 | 500-1000, 1000-2000 |
| `economicPressureLevel` | `economic-pressure-level-v2` | 经济压力 | 字符串 | no-pressure, low-pressure, moderate-pressure, high-pressure, severe-pressure |
| `monthlyLivingCost` | `monthly-living-cost-v2` | 生活成本 | 字符串 | below-1000, 1000-2000 |
| `incomeSources` | `income-sources-v2` | 收入来源 | 数组 | ["salary", "parents-support"] |
| `parentalSupportAmount` | `parental-support-amount-v2` | 父母支持 | 字符串 | below-500, 500-1000 |
| `incomeExpenseBalance` | `income-expense-balance-v2` | 收支平衡 | 字符串 | balanced, deficit-low, deficit-high, no-income |
| `currentSalary` | `current-salary-v2` | 当前月薪 | 字符串 | below-3000, 3000-5000, 5000-8000 |

⚠️ **注意**：
- 经济压力字段是 `economic-pressure-level-v2`，不是 `economic-pressure-v2`
- 月薪字段是 `current-salary-v2`，不是 `monthly-salary-v2`
- 负债情况是数组类型，不是单值

### 歧视与公平

| TypeScript常量 | 字段ID | 中文标签 | 值类型 |
|---------------|--------|---------|--------|
| `experiencedDiscriminationTypes` | `experienced-discrimination-types-v2` | 歧视类型 | 数组 |
| `discriminationSeverity` | `discrimination-severity-v2` | 歧视程度 | 字符串 |
| `discriminationChannels` | `discrimination-channels-v2` | 歧视渠道 | 数组 |
| `supportNeededTypes` | `support-needed-types-v2` | 需要支持 | 数组 |

### 就业信心

| TypeScript常量 | 字段ID | 中文标签 | 值示例 |
|---------------|--------|---------|--------|
| `employmentConfidence6Months` | `employment-confidence-6months-v2` | 6个月就业信心 | very-confident, confident, neutral, worried, not-confident, very-anxious |
| `employmentConfidence1Year` | `employment-confidence-1year-v2` | 1年就业信心 | 同上 |

⚠️ **注意**：不是 `employment-confidence-v2`！

### 求职信息

| TypeScript常量 | 字段ID | 中文标签 | 值类型 |
|---------------|--------|---------|--------|
| `jobSeekingDuration` | `job-seeking-duration-v2` | 求职时长 | 字符串 |
| `applicationsPerWeek` | `applications-per-week-v2` | 每周投递 | 字符串 |
| `interviewConversion` | `interview-conversion-v2` | 面试转化 | 字符串 |
| `channelsUsed` | `channels-used-v2` | 求职渠道 | 数组 |
| `offerReceived` | `offer-received-v2` | Offer数量 | 字符串 |

---

## 🔍 数组类型字段

以下字段的值是**数组类型**，需要特殊处理：

```typescript
const arrayFields = [
  'debtSituation',              // 负债情况
  'incomeSources',              // 收入来源
  'experiencedDiscriminationTypes',  // 歧视类型
  'discriminationChannels',     // 歧视渠道
  'supportNeededTypes',         // 需要支持
  'channelsUsed'                // 求职渠道
];
```

**判断方法**：
```typescript
import { isArrayField } from '../config/questionnaireFieldMappings';

if (isArrayField('debtSituation')) {
  // 处理数组
  const hasDebt = Array.isArray(answers[FIELDS.debtSituation]) && 
                  answers[FIELDS.debtSituation].length > 0 &&
                  !answers[FIELDS.debtSituation].includes('no-debt');
}
```

---

## ⚠️ 常见错误与修复

### 错误1：字段ID拼写错误

**问题**：
```typescript
const status = answers['employment-status-v2'];  // ❌ 错误
```

**修复**：
```typescript
const status = answers[FIELDS.currentStatus];  // ✅ 正确
// 实际字段ID是 'current-status-question-v2'
```

### 错误2：负债情况判断错误

**问题**：
```typescript
const hasDebt = answers['has-debt-v2'] === 'yes';  // ❌ 错误，字段不存在
```

**修复**：
```typescript
const debtSituation = answers[FIELDS.debtSituation];
const hasDebt = Array.isArray(debtSituation) && 
                debtSituation.length > 0 && 
                !debtSituation.includes('no-debt');  // ✅ 正确
```

### 错误3：经济压力值不匹配

**问题**：
```typescript
if (pressure === 'very-high') {  // ❌ 错误，实际值是 'severe-pressure'
  negativeScore += 3;
}
```

**修复**：
```typescript
const pressure = answers[FIELDS.economicPressureLevel];
if (pressure === 'severe-pressure') {  // ✅ 正确
  negativeScore += 3;
}
```

---

## 📝 开发流程

### 1. 添加新字段

**步骤**：
1. 在 `questionnaireFieldMappings.ts` 中添加字段ID
2. 在 `FIELD_VALUE_MAPPINGS` 中添加值映射（如需要）
3. 在 `getFieldLabel` 函数中添加中文标签
4. 更新此文档的映射表

**示例**：
```typescript
// 1. 添加字段ID
export const QUESTIONNAIRE_V2_FIELD_IDS = {
  // ... 现有字段
  newField: 'new-field-v2',  // 新字段
} as const;

// 2. 添加值映射
export const FIELD_VALUE_MAPPINGS = {
  // ... 现有映射
  newField: {
    'value1': '值1',
    'value2': '值2'
  }
} as const;

// 3. 添加中文标签
export function getFieldLabel(fieldKey: keyof typeof QUESTIONNAIRE_V2_FIELD_IDS): string {
  const labels: Record<string, string> = {
    // ... 现有标签
    newField: '新字段',
  };
  return labels[fieldKey] || fieldKey;
}
```

### 2. 修改现有字段

**步骤**：
1. 在 `questionnaireFieldMappings.ts` 中修改字段ID
2. 运行全局搜索，确保所有引用都已更新
3. 更新数据库迁移脚本（如需要）
4. 更新此文档

### 3. 代码审查检查清单

- [ ] 所有字段ID都使用 `FIELDS` 常量
- [ ] 没有硬编码的字段ID字符串
- [ ] 数组类型字段使用 `Array.isArray()` 判断
- [ ] 字段值匹配实际问卷定义
- [ ] 更新了相关文档

---

## 🧪 测试验证

### 单元测试示例

```typescript
import { QUESTIONNAIRE_V2_FIELD_IDS as FIELDS } from '../config/questionnaireFieldMappings';

describe('Field ID Mapping', () => {
  it('should use correct field ID for employment status', () => {
    const answers = {
      [FIELDS.currentStatus]: 'unemployed'
    };
    
    expect(answers[FIELDS.currentStatus]).toBe('unemployed');
    expect(FIELDS.currentStatus).toBe('current-status-question-v2');
  });
  
  it('should handle debt situation as array', () => {
    const answers = {
      [FIELDS.debtSituation]: ['alipay-huabei', 'credit-card']
    };
    
    const hasDebt = Array.isArray(answers[FIELDS.debtSituation]) && 
                    answers[FIELDS.debtSituation].length > 0;
    
    expect(hasDebt).toBe(true);
  });
});
```

---

## 📚 相关文档

- [用户画像实施总结](./USER_PROFILE_IMPLEMENTATION_SUMMARY.md)
- [用户画像测试指南](./USER_PROFILE_TESTING_GUIDE.md)
- [问卷定义](../backend/src/data/questionnaire2/definition.ts)

---

## 🔄 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2025-10-05 | 初始版本，统一字段ID映射规范 |

---

**文档维护者**: AI Assistant  
**最后更新**: 2025-10-05  
**状态**: ✅ 已实施并部署

