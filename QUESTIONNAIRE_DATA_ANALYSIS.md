# 问卷数据分析与测试数据生成方案

**目标**: 为可视化系统生成足够的测试数据，替代模拟数据  
**数据量**: 1500-3000条问卷回答，1000-2000个半匿名用户  

## 📊 问卷结构深度分析

### 🎯 核心字段统计

#### **第1页：基本信息 (role-demographics)**
```typescript
const PAGE1_FIELDS = {
  'age-range': ['18-22', '23-25', '26-30', '31-35', 'over-35'],           // 5个选项
  'gender': ['male', 'female', 'prefer-not-say'],                        // 3个选项
  'work-location-preference': ['tier1', 'new-tier1', 'tier2', 'tier3', 'hometown', 'flexible'], // 6个选项
  'education-level': ['high-school', 'junior-college', 'bachelor', 'master', 'phd'], // 5个选项
  'major-field': ['engineering', 'science', 'medicine', 'management', 'economics', 'law', 'education', 'literature', 'art', 'other'] // 10个选项
};
```

#### **第2页：状态识别 (status-identification)**
```typescript
const PAGE2_FIELDS = {
  'current-status': ['employed', 'unemployed', 'student', 'preparing', 'other'] // 5个选项
};
```

#### **第3页：差异化问卷 (条件分支)**
```typescript
// 已就业分支 (employed-details)
const EMPLOYED_FIELDS = {
  'employment-type': ['fulltime', 'parttime', 'internship', 'freelance'],  // 4个选项
  'current-salary': ['below-3k', '3k-5k', '5k-8k', '8k-12k', '12k-20k', 'above-20k'], // 6个选项
  'work-industry': ['internet-tech', 'finance', 'education', 'healthcare', 'manufacturing', 'government', 'other'], // 7个选项
  'job-satisfaction': ['very-satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very-dissatisfied'] // 5个选项
};

// 失业/求职分支 (unemployed-details)
const UNEMPLOYED_FIELDS = {
  'unemployment-duration': ['less-1month', '1-3months', '3-6months', '6-12months', 'over-1year', 'fresh-graduate'], // 6个选项
  'last-job-salary': ['below-3k', '3k-5k', '5k-8k', '8k-12k', '12k-20k', 'above-20k', 'never-worked'], // 7个选项
  'job-search-channels': ['online-platforms', 'social-media', 'campus-recruitment', 'referrals', 'headhunters', 'company-websites'], // 6个选项 (多选)
  'job-search-difficulties': ['lack-experience', 'skill-mismatch', 'high-competition', 'low-salary', 'location-mismatch', 'few-opportunities'] // 6个选项 (多选)
};

// 学生分支 (student-details)
const STUDENT_FIELDS = {
  'study-year': ['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'phd'], // 6个选项
  'career-planning': ['direct-employment', 'continue-study', 'study-abroad', 'entrepreneurship', 'civil-service', 'undecided'], // 6个选项
  'internship-experience': ['none', 'one', 'two-three', 'multiple'] // 4个选项
};
```

#### **第4页：通用问卷 (career-skills-universal)**
```typescript
const UNIVERSAL_FIELDS = {
  'career-goal': ['technical-expert', 'management', 'entrepreneurship', 'stable-job', 'work-life-balance', 'high-income', 'social-impact', 'undecided'], // 8个选项
  'skill-confidence': ['very-confident', 'confident', 'neutral', 'lacking', 'very-lacking'], // 5个选项
  'preferred-work-location': ['tier1', 'new-tier1', 'tier2', 'hometown', 'flexible'], // 5个选项
  'employment-difficulty': ['very-easy', 'easy', 'moderate', 'difficult', 'very-difficult'] // 5个选项
};
```

#### **第5页：建议反馈 (feedback-universal)**
```typescript
const FEEDBACK_FIELDS = {
  'policy-suggestions': ['more-internships', 'skill-training', 'career-guidance', 'reduce-discrimination', 'startup-support', 'salary-standards', 'job-matching', 'education-reform'] // 8个选项 (多选)
};
```

## 🎲 数据生成策略

### **1. 真实性分布权重**
```typescript
const REALISTIC_WEIGHTS = {
  // 年龄分布 (符合大学生群体特征)
  'age-range': {
    '18-22': 0.35,    // 35% - 本科生主体
    '23-25': 0.40,    // 40% - 研究生和应届毕业生
    '26-30': 0.20,    // 20% - 工作几年的群体
    '31-35': 0.04,    // 4% - 较少
    'over-35': 0.01   // 1% - 极少
  },
  
  // 学历分布 (符合高等教育普及情况)
  'education-level': {
    'high-school': 0.05,      // 5%
    'junior-college': 0.15,   // 15%
    'bachelor': 0.65,         // 65% - 主体
    'master': 0.13,           // 13%
    'phd': 0.02              // 2%
  },
  
  // 当前状态分布
  'current-status': {
    'employed': 0.45,         // 45% - 已就业
    'unemployed': 0.25,       // 25% - 求职中
    'student': 0.25,          // 25% - 在校学生
    'preparing': 0.04,        // 4% - 备考
    'other': 0.01            // 1% - 其他
  },
  
  // 专业分布 (符合就业市场需求)
  'major-field': {
    'engineering': 0.25,      // 25% - 工科最多
    'management': 0.18,       // 18% - 管理类
    'economics': 0.15,        // 15% - 经济类
    'science': 0.12,          // 12% - 理科
    'literature': 0.10,       // 10% - 文科
    'medicine': 0.08,         // 8% - 医学
    'law': 0.05,             // 5% - 法学
    'education': 0.04,        // 4% - 教育学
    'art': 0.02,             // 2% - 艺术学
    'other': 0.01            // 1% - 其他
  }
};
```

### **2. 逻辑一致性规则**
```typescript
const CONSISTENCY_RULES = {
  // 学历与年龄的一致性
  ageEducationConsistency: {
    '18-22': ['high-school', 'junior-college', 'bachelor'],
    '23-25': ['bachelor', 'master'],
    '26-30': ['bachelor', 'master', 'phd'],
    '31-35': ['bachelor', 'master', 'phd'],
    'over-35': ['bachelor', 'master', 'phd']
  },
  
  // 就业状态与薪资的一致性
  employmentSalaryConsistency: {
    'employed': {
      'current-salary': ['below-3k', '3k-5k', '5k-8k', '8k-12k', '12k-20k', 'above-20k']
    },
    'unemployed': {
      'last-job-salary': ['below-3k', '3k-5k', '5k-8k', '8k-12k', '12k-20k', 'above-20k', 'never-worked']
    }
  },
  
  // 学历与薪资的相关性
  educationSalaryCorrelation: {
    'phd': ['8k-12k', '12k-20k', 'above-20k'],
    'master': ['5k-8k', '8k-12k', '12k-20k', 'above-20k'],
    'bachelor': ['3k-5k', '5k-8k', '8k-12k', '12k-20k'],
    'junior-college': ['below-3k', '3k-5k', '5k-8k'],
    'high-school': ['below-3k', '3k-5k']
  }
};
```

## 📈 数据量规划

### **目标数据量**
- **总用户数**: 1500人
- **总问卷数**: 2200份 (部分用户多次填写)
- **完成率分布**:
  - 完整完成: 70% (1540份)
  - 部分完成: 25% (550份)
  - 早期放弃: 5% (110份)

### **时间跨度分布**
- **数据时间范围**: 最近60天
- **每日提交量**: 30-50份 (模拟真实提交节奏)
- **周末效应**: 周末提交量减少30%
- **节假日效应**: 节假日提交量减少50%

### **维度覆盖要求**
每个选项至少要有以下样本量：
- **主要选项**: 50-200个样本
- **次要选项**: 20-80个样本  
- **稀少选项**: 5-30个样本

## 🔧 实施计划

### **第1步: 创建数据生成器** (1天)
- 实现智能权重分配
- 添加逻辑一致性检查
- 支持时间序列生成

### **第2步: 生成半匿名用户** (0.5天)
- 基于现有用户注册流程
- 生成测试用户标识
- 确保用户-问卷关联

### **第3步: 批量数据导入** (0.5天)
- 创建数据导入脚本
- 添加"测试数据"标识
- 验证数据完整性

### **第4步: 数据验证** (1天)
- 检查数据分布合理性
- 验证可视化效果
- 测试社会观察功能

---

**总计实施时间: 3天**  
**预期效果: 完全替代模拟数据，支持真实的数据流验证**
