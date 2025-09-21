# 🎯 问卷设计模板库 - 基于大学生就业调查分析

## 📋 模板概述

本文档提取了大学生就业调查问卷中的优秀设计模式，整理成可复用的问卷设计模板，供其他问卷项目参考使用。

**数据来源**: http://localhost:5173/questionnaire  
**模板数量**: 15个核心设计模板  
**适用场景**: 教育调研、就业调查、用户研究、市场调研等  

---

## 🏗️ 基础信息收集模板

### 📊 模板1: 学历层次调查

```typescript
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
}
```

**适用场景**: 教育背景调查、人才分析、学历分布统计  
**设计要点**: 按学历层次递进排序，覆盖完整，便于统计分析

### 📊 模板2: 专业领域分类

```typescript
{
  id: 'major-field',
  type: 'select',
  title: '您的专业领域是？',
  required: true,
  placeholder: '请选择专业领域',
  options: [
    { value: 'engineering', label: '工学' },
    { value: 'science', label: '理学' },
    { value: 'medicine', label: '医学' },
    { value: 'economics', label: '经济学' },
    { value: 'management', label: '管理学' },
    { value: 'law', label: '法学' },
    { value: 'education', label: '教育学' },
    { value: 'literature', label: '文学' },
    { value: 'art', label: '艺术学' },
    { value: 'other', label: '其他' }
  ]
}
```

**适用场景**: 专业背景调查、跨专业分析、教育统计  
**设计要点**: 采用教育部标准分类，下拉选择节省空间

### 📊 模板3: 时间段选择

```typescript
{
  id: 'graduation-year',
  type: 'select',
  title: '您的毕业时间是？',
  required: true,
  options: [
    { value: '2024', label: '2024年（应届）' },
    { value: '2023', label: '2023年' },
    { value: '2022', label: '2022年' },
    { value: '2021', label: '2021年' },
    { value: '2020', label: '2020年' },
    { value: 'before-2020', label: '2020年之前' }
  ]
}
```

**适用场景**: 时间分布调查、趋势分析、队列研究  
**设计要点**: 重点关注近期，远期合并，特殊标注应届

---

## 💰 薪资期望调查模板

### 📊 模板4: 薪资范围调查

```typescript
{
  id: 'salary-expectation',
  type: 'radio',
  title: '您期望的月薪范围是？（税前）',
  required: true,
  options: [
    { value: 'below-3k', label: '3000元以下' },
    { value: '3k-5k', label: '3000-5000元' },
    { value: '5k-8k', label: '5000-8000元' },
    { value: '8k-12k', label: '8000-12000元' },
    { value: '12k-20k', label: '12000-20000元' },
    { value: '20k-30k', label: '20000-30000元' },
    { value: 'above-30k', label: '30000元以上' }
  ]
}
```

**适用场景**: 薪资调研、市场定价、人才成本分析  
**设计要点**: 心理价位区间，低薪密集高薪稀疏，税前标注明确

### 📊 模板5: 工作时长偏好

```typescript
{
  id: 'work-hours-preference',
  type: 'radio',
  title: '您期望的工作时长是？',
  required: true,
  options: [
    { value: 'standard', label: '标准工作制（每周40小时）' },
    { value: 'flexible', label: '弹性工作制' },
    { value: 'intensive', label: '高强度工作制（996）' },
    { value: 'part-time', label: '兼职工作' },
    { value: 'remote', label: '远程工作' }
  ]
}
```

**适用场景**: 工作偏好调查、企业文化研究、工作制度设计  
**设计要点**: 涵盖主流工作制度，包含新兴工作模式

---

## 🌍 地区偏好调查模板

### 📊 模板6: 工作地区选择

```typescript
{
  id: 'preferred-regions',
  type: 'checkbox',
  title: '您期望在哪些地区工作？（可多选，最多3个）',
  required: true,
  maxSelections: 3,
  options: [
    { value: 'tier1', label: '一线城市（北上广深）' },
    { value: 'new-tier1', label: '新一线城市（杭州、成都、武汉等）' },
    { value: 'tier2', label: '二线城市' },
    { value: 'tier3-4', label: '三四线城市' },
    { value: 'hometown', label: '家乡所在地' },
    { value: 'overseas', label: '海外' },
    { value: 'flexible', label: '地区不限' }
  ]
}
```

**适用场景**: 地区偏好调查、人才流动分析、城市吸引力研究  
**设计要点**: 按城市层级分类，包含情感因素，限制选择数量

---

## 🎯 满意度评价模板

### 📊 模板7: 李克特5点量表

```typescript
{
  id: 'job-satisfaction',
  type: 'radio',
  title: '您对目前工作的整体满意度是？',
  required: true,
  condition: { dependsOn: 'employment-status', values: ['employed'] },
  options: [
    { value: '5', label: '非常满意' },
    { value: '4', label: '比较满意' },
    { value: '3', label: '一般' },
    { value: '2', label: '不太满意' },
    { value: '1', label: '非常不满意' }
  ]
}
```

**适用场景**: 满意度调查、服务评价、产品反馈  
**设计要点**: 标准5点量表，对称设计，包含中性选项

### 📊 模板8: 难度感知评价

```typescript
{
  id: 'difficulty-perception',
  type: 'radio',
  title: '您认为在当前环境下找到理想工作的难度是？',
  required: true,
  options: [
    { value: '1', label: '非常容易' },
    { value: '2', label: '比较容易' },
    { value: '3', label: '一般' },
    { value: '4', label: '比较困难' },
    { value: '5', label: '非常困难' }
  ]
}
```

**适用场景**: 难度评估、挑战分析、主观感知调查  
**设计要点**: 强调主观感知，使用"理想"而非"任何"

---

## 🔍 多维度选择模板

### 📊 模板9: 优先级多选

```typescript
{
  id: 'work-priorities',
  type: 'checkbox',
  title: '您最看重工作的哪些方面？（可多选，最多3项）',
  required: true,
  maxSelections: 3,
  options: [
    { value: 'salary', label: '薪资待遇' },
    { value: 'environment', label: '工作环境' },
    { value: 'development', label: '发展空间' },
    { value: 'stability', label: '工作稳定性' },
    { value: 'work-life-balance', label: '工作与生活平衡' },
    { value: 'culture', label: '企业文化' },
    { value: 'learning', label: '学习机会' },
    { value: 'team', label: '团队氛围' }
  ]
}
```

**适用场景**: 价值观调查、优先级排序、决策因素分析  
**设计要点**: 涵盖马斯洛需求层次，限制选择突出重点

### 📊 模板10: 困难原因分析

```typescript
{
  id: 'job-hunting-difficulties',
  type: 'checkbox',
  title: '您在求职过程中遇到的主要困难是？（可多选）',
  required: true,
  options: [
    { value: 'market-competition', label: '市场竞争激烈，岗位供不应求' },
    { value: 'skill-mismatch', label: '专业与岗位需求不匹配' },
    { value: 'lack-experience', label: '缺乏相关工作经验' },
    { value: 'insufficient-skills', label: '专业技能不够扎实' },
    { value: 'resume-issues', label: '简历制作和投递效果不佳' },
    { value: 'interview-problems', label: '面试表现不理想' },
    { value: 'information-gap', label: '获取招聘信息渠道有限' },
    { value: 'location-limits', label: '地域选择限制了就业机会' },
    { value: 'salary-mismatch', label: '薪资期望与市场不符' },
    { value: 'psychological-pressure', label: '求职焦虑和心理压力大' }
  ]
}
```

**适用场景**: 问题诊断、原因分析、困难识别  
**设计要点**: 按维度分类（市场、个人、技巧、心理），描述具体

---

## 💭 开放式反馈模板

### 📊 模板11: 建议收集

```typescript
{
  id: 'advice-for-students',
  type: 'textarea',
  title: '给在校学生的建议',
  description: '基于您的经历，您会给在校学生什么建议？（将在"用户心声"中匿名展示）',
  required: true,
  validation: {
    minLength: 10,
    maxLength: 500
  },
  placeholder: '请分享您的真实想法和建议...'
}
```

**适用场景**: 经验分享、建议收集、用户心声  
**设计要点**: 明确用途，字数限制，鼓励真实表达

### 📊 模板12: 观察反馈

```typescript
{
  id: 'market-observation',
  type: 'textarea',
  title: '对当前市场环境的观察',
  description: '您认为当前市场存在哪些问题和挑战？有什么可能的解决方案？',
  required: true,
  validation: {
    minLength: 10,
    maxLength: 500
  },
  placeholder: '请分享您的观察和思考...'
}
```

**适用场景**: 市场分析、环境观察、解决方案收集  
**设计要点**: 既要问题也要方案，上升到宏观视角

---

## 🔄 条件逻辑模板

### 📊 模板13: 就业状态分支

```typescript
{
  id: 'employment-status',
  type: 'radio',
  title: '您目前的就业状态是？',
  required: true,
  options: [
    { value: 'employed', label: '已就业' },
    { value: 'unemployed', label: '待业中' },
    { value: 'student', label: '在校学生' },
    { value: 'freelance', label: '自由职业' },
    { value: 'preparing-exam', label: '准备考研/考公' }
  ]
}

// 条件显示的后续问题
{
  id: 'current-salary',
  type: 'radio',
  title: '您目前的月薪范围是？',
  required: true,
  condition: { dependsOn: 'employment-status', values: ['employed'] },
  options: [
    // 薪资选项...
  ]
}
```

**适用场景**: 分支调查、个性化问卷、精准调研  
**设计要点**: 清晰的状态分类，合理的条件逻辑

### 📊 模板14: 二元选择触发

```typescript
{
  id: 'regret-major',
  type: 'radio',
  title: '您是否后悔当初选择的专业？',
  required: true,
  options: [
    { value: 'yes', label: '是' },
    { value: 'no', label: '否' }
  ]
}

// 条件显示问题
{
  id: 'preferred-major',
  type: 'select',
  title: '如果重新选择，您最希望学习什么专业？',
  required: true,
  condition: { dependsOn: 'regret-major', value: 'yes' },
  options: [
    { value: 'computer-science', label: '计算机/IT' },
    { value: 'finance', label: '金融/经济' },
    { value: 'medicine', label: '医学' },
    // 更多选项...
  ]
}
```

**适用场景**: 反思调查、假设分析、深度挖掘  
**设计要点**: 简单触发条件，深入后续问题

---

## 📧 联系信息收集模板

### 📊 模板15: 可选联系方式

```typescript
{
  id: 'contact-email',
  type: 'email',
  title: '请留下您的邮箱地址（可选）',
  description: '我们会将调查结果发送给您，绝不用于其他用途。',
  required: false,
  validation: {
    email: true
  },
  placeholder: 'your.email@example.com'
}
```

**适用场景**: 联系信息收集、后续跟踪、结果反馈  
**设计要点**: 可选设计，明确用途，隐私承诺

---

## 🎯 模板使用指南

### ✅ 选择合适的模板

1. **基础信息**: 使用模板1-3收集人口统计学信息
2. **期望调查**: 使用模板4-6了解用户期望和偏好
3. **满意度评价**: 使用模板7-8进行主观评价
4. **多维分析**: 使用模板9-10进行复杂问题分析
5. **开放反馈**: 使用模板11-12收集定性信息
6. **条件逻辑**: 使用模板13-14实现个性化调查
7. **联系收集**: 使用模板15收集联系信息

### 🔧 模板定制建议

1. **选项调整**: 根据具体场景调整选项内容
2. **验证规则**: 根据数据质量要求设置验证
3. **条件逻辑**: 根据调查流程设计条件显示
4. **统计配置**: 根据分析需求配置统计展示

### 📊 质量保证

1. **预测试**: 小范围测试模板效果
2. **A/B测试**: 对比不同模板的效果
3. **数据验证**: 检查收集数据的质量
4. **用户反馈**: 收集填写体验反馈

---

**🎯 模板库价值**: 提供15个经过验证的问卷设计模板  
**📊 适用范围**: 教育、就业、市场、用户研究等多个领域  
**🚀 使用效果**: 提高问卷设计效率，保证数据质量，优化用户体验
