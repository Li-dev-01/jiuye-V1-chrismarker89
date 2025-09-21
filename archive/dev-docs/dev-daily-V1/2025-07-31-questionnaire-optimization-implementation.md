# 问卷系统优化实施方案 - 2025年7月31日

## 🎯 问卷优化目标

基于用户反馈和逻辑分析，对问卷系统进行全面优化，提升用户体验和数据质量。

## 📋 当前问卷结构分析

### 现有6页问卷结构
1. **第1页：个人基本信息** - 学历、专业、毕业时间、性别、年龄、院校类型
2. **第2页：就业现状与满意度** - 就业状态、工作满意度、薪资等
3. **第3页：求职经历与挑战** - 求职渠道、困难、面试经历
4. **第4页：职业发展与规划** - 职业规划、技能需求
5. **第5页：就业环境与政策** - 政策评价、改进建议
6. **第6页：补充信息** - 联系方式、其他意见（需要精简）

## 🔧 核心优化问题

### 问题1：学历与院校类型逻辑冲突

#### 当前问题
```typescript
// 存在的无效组合
学历: "大专" + 院校类型: "985高校" ❌
学历: "高中及以下" + 院校类型: "211高校" ❌
```

#### 解决方案：条件逻辑映射
```typescript
// 学历-院校类型映射规则
const educationSchoolMapping = {
  'high-school': [
    'vocational',      // 职业学校
    'other'           // 其他
  ],
  'junior-college': [
    'vocational',      // 专科院校
    'other'           // 其他
  ],
  'bachelor': [
    '985',            // 985高校
    '211',            // 211高校（非985）
    'double-first-class', // 双一流高校
    'regular-public', // 普通公办本科
    'private',        // 民办本科
    'overseas'        // 海外院校
  ],
  'master': [
    '985',            // 985高校
    '211',            // 211高校（非985）
    'double-first-class', // 双一流高校
    'regular-public', // 普通公办本科
    'research-institute', // 科研院所
    'overseas'        // 海外院校
  ],
  'phd': [
    '985',            // 985高校
    '211',            // 211高校（非985）
    'double-first-class', // 双一流高校
    'research-institute', // 科研院所
    'overseas'        // 海外院校
  ]
};
```

#### 实现方案
```typescript
// 动态选项过滤组件
const ConditionalSchoolTypeSelect = ({ educationLevel, value, onChange }) => {
  const availableOptions = useMemo(() => {
    const mapping = educationSchoolMapping[educationLevel];
    return schoolTypeOptions.filter(option => 
      mapping?.includes(option.value)
    );
  }, [educationLevel]);

  // 当学历变更时，清空不匹配的院校类型
  useEffect(() => {
    if (value && !availableOptions.find(opt => opt.value === value)) {
      onChange(null);
    }
  }, [educationLevel, value, availableOptions, onChange]);

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="请先选择学历"
      disabled={!educationLevel}
    >
      {availableOptions.map(option => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );
};
```

### 问题2：第6页内容精简

#### 需要移除的内容
```typescript
// 移除字段列表
const fieldsToRemove = [
  'email',              // 邮箱地址
  'phone',              // 联系电话
  'wechat',             // 微信号
  'qq',                 // QQ号
  'agreeToContact',     // 是否同意联系
  'agreeToOtherUse',    // 是否同意其他用途
  'personalIdentifier', // 个人标识符
  'followUpConsent'     // 后续调研同意
];
```

#### 保留的内容
```typescript
// 保留字段
const fieldsToKeep = [
  'additionalComments', // 其他意见和建议
  'surveyExperience',   // 问卷体验反馈
  'improvementSuggestions' // 改进建议
];
```

## 🔄 问卷页面重新分组优化

### 优化后的页面结构

#### 第1页：个人基本信息（优化分组）
```typescript
const page1Questions = [
  'education-level',     // 学历层次 ⭐ 必填
  'major-category',      // 专业大类 ⭐ 必填
  'graduation-year',     // 毕业年份 ⭐ 必填
  'gender',             // 性别 ⭐ 必填
  'age-range',          // 年龄段 ⭐ 必填
  'university-tier'     // 院校类型 ⭐ 必填（条件逻辑）
];
```

#### 第2页：就业现状与满意度（保持不变）
```typescript
const page2Questions = [
  'current-status',      // 就业状态 ⭐ 必填
  'job-satisfaction',    // 工作满意度（条件显示）
  'current-salary',      // 当前薪资（条件显示）
  'work-location',       // 工作地点（条件显示）
  'company-size',        // 公司规模（条件显示）
  'industry'            // 所在行业（条件显示）
];
```

#### 第3页：求职经历与挑战（整合优化）
```typescript
const page3Questions = [
  'job-search-channels', // 求职渠道 ⭐ 必填
  'job-search-duration', // 求职时长（条件显示）
  'interview-count',     // 面试次数（条件显示）
  'job-search-difficulties', // 求职困难
  'rejection-reasons'    // 被拒原因分析
];
```

#### 第4页：职业发展与技能（新增技能评估）
```typescript
const page4Questions = [
  'career-planning',     // 职业规划
  'skill-assessment',    // 技能自评
  'training-needs',      // 培训需求
  'career-change-intention', // 转行意向
  'professional-development' // 职业发展期望
];
```

#### 第5页：就业环境与政策（政策评价）
```typescript
const page5Questions = [
  'employment-policy-awareness', // 政策了解度
  'policy-effectiveness',        // 政策有效性评价
  'employment-service-usage',    // 就业服务使用
  'improvement-suggestions',     // 改进建议
  'support-needs'               // 支持需求
];
```

#### 第6页：补充信息（大幅精简）
```typescript
const page6Questions = [
  'additional-comments',    // 其他意见和建议
  'survey-experience'      // 问卷体验反馈
];
```

## 💻 技术实现方案

### 1. 条件逻辑组件实现

```typescript
// hooks/useConditionalLogic.ts
export const useConditionalLogic = (dependencies: Record<string, any>) => {
  const getAvailableOptions = useCallback((questionId: string, currentValue: any) => {
    switch (questionId) {
      case 'university-tier':
        return getSchoolTypeOptions(dependencies.educationLevel);
      case 'job-satisfaction':
        return dependencies.currentStatus === 'employed' ? satisfactionOptions : [];
      case 'current-salary':
        return dependencies.currentStatus === 'employed' ? salaryOptions : [];
      default:
        return [];
    }
  }, [dependencies]);

  const shouldShowQuestion = useCallback((questionId: string) => {
    const rules = conditionalRules[questionId];
    if (!rules) return true;
    
    return rules.every(rule => {
      const dependentValue = dependencies[rule.dependsOn];
      return evaluateCondition(dependentValue, rule.operator, rule.value);
    });
  }, [dependencies]);

  return { getAvailableOptions, shouldShowQuestion };
};
```

### 2. 数据验证增强

```typescript
// validation/questionnaireValidation.ts
export const validateEducationSchoolCombination = (data: any) => {
  const { educationLevel, universityTier } = data;
  
  if (!educationLevel || !universityTier) return true;
  
  const validCombinations = educationSchoolMapping[educationLevel];
  if (!validCombinations?.includes(universityTier)) {
    return {
      valid: false,
      message: `${getEducationLabel(educationLevel)}与${getSchoolTypeLabel(universityTier)}不匹配`
    };
  }
  
  return { valid: true };
};
```

### 3. 问卷配置更新

```typescript
// data/optimizedUniversalQuestionnaire.ts
export const optimizedUniversalQuestionnaire: UniversalQuestionnaire = {
  id: 'universal-employment-survey-2024-v2',
  title: '2024年大学生就业现状调查（优化版）',
  description: '真实反映当前社会就业情况，匿名填写，逻辑优化，5分钟完成。',
  
  sections: [
    {
      id: 'personal-info',
      title: '第1页：个人基本信息',
      description: '请填写您的基本信息，所有信息将严格保密',
      questions: [
        // 学历问题（优先级最高，影响后续选项）
        {
          id: 'education-level',
          type: 'radio',
          title: '您的最高学历是？',
          required: true,
          options: [
            { value: 'high-school', label: '高中及以下' },
            { value: 'junior-college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士研究生' },
            { value: 'phd', label: '博士研究生' }
          ]
        },
        // 院校类型（条件逻辑）
        {
          id: 'university-tier',
          type: 'radio',
          title: '您毕业的学校类型是？',
          required: true,
          condition: {
            dependsOn: 'education-level',
            operator: 'not_equals',
            value: null
          },
          options: [], // 动态生成
          validation: [
            {
              type: 'custom',
              validator: 'validateEducationSchoolCombination',
              message: '学历与院校类型不匹配，请重新选择'
            }
          ]
        }
        // ... 其他问题
      ]
    }
    // ... 其他页面
  ],
  
  config: {
    // 移除邮箱相关配置
    requireEmail: false,
    allowAnonymous: true,
    // 增强验证
    validateOnChange: true,
    validateOnBlur: true,
    stopOnFirstError: true,
    showValidationSummary: true
  }
};
```

## 📅 实施时间表

### 第1周：核心逻辑实现
- **Day 1-2**: 条件逻辑组件开发
- **Day 3-4**: 数据验证规则实现
- **Day 5**: 问卷配置更新

### 第2周：页面优化
- **Day 1-2**: 第1页条件逻辑集成
- **Day 3**: 第6页内容精简
- **Day 4-5**: 其他页面微调优化

### 第3周：测试验证
- **Day 1-3**: 逻辑测试和边界情况验证
- **Day 4-5**: 用户体验测试
- **Day 6-7**: 性能优化和bug修复

## 🧪 测试用例

### 条件逻辑测试
```typescript
describe('教育背景条件逻辑', () => {
  test('大专学历只能选择专科院校', () => {
    const result = getAvailableSchoolTypes('junior-college');
    expect(result).toEqual(['vocational', 'other']);
  });

  test('本科学历可以选择所有本科院校类型', () => {
    const result = getAvailableSchoolTypes('bachelor');
    expect(result).toContain('985');
    expect(result).toContain('211');
    expect(result).toContain('regular-public');
  });

  test('学历变更时清空不匹配的院校选择', () => {
    const { rerender } = render(<ConditionalSchoolTypeSelect />);
    // 测试逻辑...
  });
});
```

### 数据验证测试
```typescript
describe('数据验证', () => {
  test('拒绝无效的学历-院校组合', () => {
    const invalidData = {
      educationLevel: 'junior-college',
      universityTier: '985'
    };
    const result = validateEducationSchoolCombination(invalidData);
    expect(result.valid).toBe(false);
  });
});
```

## 📊 优化效果预期

### 用户体验改善
- **逻辑错误减少**: 100% 消除无效数据组合
- **填写时间缩短**: 第6页精简后减少30秒
- **用户困惑降低**: 条件逻辑引导更清晰

### 数据质量提升
- **数据有效性**: 提升至99%+
- **完成率**: 预期提升5-10%
- **用户满意度**: 目标4.5/5分

### 技术指标
- **验证覆盖率**: 100%关键逻辑验证
- **响应时间**: 条件逻辑响应<100ms
- **错误率**: 逻辑错误率<0.01%

---

**制定时间**: 2025年7月31日  
**预计完成**: 2025年8月21日  
**负责人**: 前端开发团队  
**审查节点**: 每周五进度评估
