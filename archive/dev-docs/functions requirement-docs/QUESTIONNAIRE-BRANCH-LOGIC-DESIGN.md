# 问卷分支逻辑设计文档

## 📋 文档概述

**文档版本**: v1.0  
**创建日期**: 2025-01-25  
**适用项目**: 大学生就业调研平台  
**技术栈**: React 18 + TypeScript + Zod + React Hook Form  

## 🎯 分支功能价值与目标

### 核心价值
- **个性化体验**: 根据用户状态动态调整问题，避免无关问题干扰
- **数据质量提升**: 只收集与用户相关的有效数据，提高数据准确性
- **用户体验优化**: 减少问卷长度，提高完成率和用户满意度
- **智能数据分析**: 支持更精准的群体分析和趋势预测

### 设计目标
1. **逻辑清晰**: 分支条件明确，易于理解和维护
2. **性能优化**: 分支判断高效，不影响用户体验
3. **扩展性强**: 支持新增分支逻辑，适应业务发展
4. **数据完整**: 确保分支不影响数据分析的完整性

## 🌳 分支类型分析

### 1. 就业状态分支 (Employment Status Branch)

**触发条件**: 用户选择就业状态  
**分支路径**:
- `已就业` → 显示工作详情问题 (行业、职位、薪资、满意度)
- `待业中` → 跳过工作详情，进入失业状况模块
- `自由职业` → 显示部分工作问题 (行业、收入)
- `创业` → 显示创业相关问题

**技术实现**:
```typescript
const [isEmployed, setIsEmployed] = useState(data.employmentStatus === '已就业');

useEffect(() => {
  const subscription = form.watch((value) => {
    const employed = value.employmentStatus === '已就业';
    setIsEmployed(employed);
    
    // 动态更新表单验证规则
    if (employed) {
      form.setValue('currentIndustry', '');
      form.setValue('currentPosition', '');
    }
  });
}, [form]);
```

**设计考虑**:
- **数据一致性**: 确保分支切换时清理无关数据
- **验证规则**: 动态调整必填字段验证
- **统计显示**: 只向相关用户显示对应统计数据

### 2. 专业满意度分支 (Major Satisfaction Branch)

**触发条件**: 用户选择是否后悔所学专业  
**分支路径**:
- `后悔专业` → 显示"更愿意学什么专业"选择
- `不后悔` → 隐藏专业重选问题

**技术实现**:
```typescript
const regrets = value.regretMajor === 'true';
setRegretsMajor(regrets);

// 条件字段更新
if (regrets && value.preferredMajor) {
  updateData.preferredMajor = value.preferredMajor;
} else {
  // 清理无关数据
  delete updateData.preferredMajor;
}
```

### 3. 转行意向分支 (Career Change Branch)

**触发条件**: 用户选择是否有转行意向  
**分支路径**:
- `有转行意向` → 显示目标行业/职位选择
- `无转行意向` → 隐藏转行相关问题

### 4. 提交方式分支 (Submission Type Branch)

**触发条件**: 用户选择提交方式  
**分支路径**:
- `匿名提交` → A+B身份验证流程
- `实名提交` → 邮箱验证流程

## 🏗️ 分支设计原则

### 1. 最小干扰原则
- **渐进显示**: 分支问题逐步显示，不一次性展示所有可能问题
- **平滑过渡**: 分支切换时提供视觉反馈，避免突兀变化
- **状态保持**: 用户已填写的数据在分支切换时保持不变

### 2. 数据完整性原则
- **清理策略**: 分支切换时自动清理无关数据
- **验证一致**: 分支条件与数据验证规则保持同步
- **追踪记录**: 记录用户的分支路径，便于数据分析

### 3. 性能优化原则
- **懒加载**: 分支组件按需加载，减少初始包大小
- **缓存策略**: 分支状态缓存，避免重复计算
- **批量更新**: 分支变化时批量更新相关状态

## ⚙️ 技术实现架构

### 1. 状态管理架构

```typescript
// 分支状态管理
interface BranchState {
  employmentBranch: 'employed' | 'unemployed' | 'freelance' | 'entrepreneur';
  majorSatisfactionBranch: 'satisfied' | 'regret';
  careerChangeBranch: 'yes' | 'no';
  submissionBranch: 'anonymous' | 'verified';
}

// 分支条件计算
const calculateBranches = (formData: QuestionnaireData): BranchState => {
  return {
    employmentBranch: determineEmploymentBranch(formData.employmentStatus),
    majorSatisfactionBranch: formData.regretMajor ? 'regret' : 'satisfied',
    careerChangeBranch: formData.careerChangeIntention ? 'yes' : 'no',
    submissionBranch: formData.isAnonymous ? 'anonymous' : 'verified'
  };
};
```

### 2. 条件渲染组件

```typescript
// 条件渲染包装器
const ConditionalField: React.FC<{
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ condition, children, fallback = null }) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

// 使用示例
<ConditionalField condition={isEmployed}>
  <QuestionItem title="您的月薪范围是?" required>
    <SalaryRangeSelector />
  </QuestionItem>
</ConditionalField>
```

### 3. 动态验证规则

```typescript
// 动态验证模式
const createDynamicSchema = (branchState: BranchState) => {
  const baseSchema = z.object({
    employmentStatus: z.string().min(1),
  });

  // 根据分支状态添加验证规则
  if (branchState.employmentBranch === 'employed') {
    return baseSchema.extend({
      currentIndustry: z.string().min(1),
      currentPosition: z.string().min(1),
      monthlySalary: z.number().min(1),
    });
  }

  return baseSchema;
};
```

## 🎨 用户体验设计

### 1. 视觉反馈设计

**渐进显示动画**:
- 新问题淡入显示 (fade-in)
- 隐藏问题淡出消失 (fade-out)
- 过渡时间: 300ms

**状态指示器**:
- 分支路径面包屑导航
- 完成进度动态更新
- 相关性标识 (必填/选填)

### 2. 交互体验优化

**智能预填充**:
- 基于已选择选项预测可能选择
- 提供快速选择建议
- 历史选择模式学习

**错误处理**:
- 分支切换时的验证错误清理
- 友好的错误提示信息
- 自动聚焦到错误字段

### 3. 可访问性考虑

**屏幕阅读器支持**:
- 分支变化时的语音提示
- 条件字段的上下文说明
- 键盘导航优化

## 📊 数据处理策略

### 1. 数据收集策略

**分支数据标记**:
```typescript
interface QuestionnaireResponse {
  // 基础数据
  id: string;
  userId?: string;
  
  // 分支路径记录
  branchPath: {
    employment: 'employed' | 'unemployed';
    majorSatisfaction: 'satisfied' | 'regret';
    careerChange: 'yes' | 'no';
  };
  
  // 条件数据 (只在相关分支中存在)
  conditionalData: {
    employmentDetails?: EmploymentDetails;
    majorPreference?: string;
    careerChangeTarget?: string;
  };
}
```

### 2. 数据分析适配

**分组分析**:
- 按分支路径分组统计
- 交叉分析不同分支的关联性
- 分支完成率统计

**数据补全策略**:
- 缺失数据的合理推断
- 分支间数据的关联分析
- 统计权重调整

## 🚀 性能与扩展性

### 1. 性能优化策略

**组件懒加载**:
```typescript
// 分支组件按需加载
const EmploymentDetailsModule = lazy(() => 
  import('./modules/EmploymentDetailsModule')
);

const UnemploymentStatusModule = lazy(() => 
  import('./modules/UnemploymentStatusModule')
);
```

**状态计算优化**:
- 使用 useMemo 缓存分支计算结果
- 防抖处理频繁的分支切换
- 批量状态更新减少重渲染

### 2. 扩展性设计

**分支配置化**:
```typescript
// 分支规则配置
interface BranchRule {
  id: string;
  condition: (data: QuestionnaireData) => boolean;
  targetFields: string[];
  validationRules?: ZodSchema;
}

const branchRules: BranchRule[] = [
  {
    id: 'employment-details',
    condition: (data) => data.employmentStatus === '已就业',
    targetFields: ['currentIndustry', 'currentPosition', 'monthlySalary'],
    validationRules: employmentDetailsSchema
  }
];
```

**插件化架构**:
- 支持动态注册新的分支逻辑
- 分支规则热更新
- A/B测试不同分支策略

## 🛠️ 开发与维护最佳实践

### 1. 代码组织

**模块化设计**:
- 每个分支逻辑独立模块
- 共享的分支工具函数
- 统一的分支状态管理

**类型安全**:
- 严格的TypeScript类型定义
- 分支状态的类型保护
- 编译时分支逻辑验证

### 2. 测试策略

**分支逻辑测试**:
```typescript
describe('Employment Branch Logic', () => {
  it('should show employment details when employed', () => {
    const formData = { employmentStatus: '已就业' };
    const branches = calculateBranches(formData);
    expect(branches.employmentBranch).toBe('employed');
  });
  
  it('should hide employment details when unemployed', () => {
    const formData = { employmentStatus: '待业中' };
    const branches = calculateBranches(formData);
    expect(branches.employmentBranch).toBe('unemployed');
  });
});
```

**端到端测试**:
- 完整分支路径的用户流程测试
- 分支切换的数据一致性测试
- 不同分支组合的兼容性测试

### 3. 监控与分析

**分支使用统计**:
- 各分支路径的使用频率
- 分支切换的用户行为分析
- 分支完成率和放弃率

**性能监控**:
- 分支计算的执行时间
- 组件加载性能
- 内存使用情况

## 📈 未来发展方向

### 1. 智能化分支

**AI驱动的分支预测**:
- 基于用户行为预测最可能的分支路径
- 智能问题排序优化
- 个性化问题推荐

### 2. 动态分支配置

**可视化分支编辑器**:
- 拖拽式分支逻辑设计
- 实时预览分支效果
- 版本控制和回滚

### 3. 多维度分支

**复合条件分支**:
- 支持多个条件的组合判断
- 嵌套分支逻辑
- 权重化分支决策

## 💡 实际代码示例

### 1. 完整的分支组件实现

```typescript
// WorkExperienceModule.tsx - 就业状态分支的完整实现
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 动态验证模式
const createWorkExperienceSchema = (isEmployed: boolean) => {
  const baseSchema = z.object({
    employmentStatus: z.string().min(1, '请选择就业状态'),
  });

  if (isEmployed) {
    return baseSchema.extend({
      currentIndustry: z.string().min(1, '请选择所在行业'),
      currentPosition: z.string().min(1, '请填写职位'),
      monthlySalary: z.string().min(1, '请选择薪资范围'),
      jobSatisfaction: z.string().min(1, '请选择满意度'),
    });
  }

  return baseSchema;
};

export const WorkExperienceModule: React.FC<ModuleProps> = ({
  data,
  onUpdate,
  onNext
}) => {
  const [isEmployed, setIsEmployed] = useState(data.employmentStatus === '已就业');
  const [showTransition, setShowTransition] = useState(false);

  const form = useForm({
    resolver: zodResolver(createWorkExperienceSchema(isEmployed)),
    defaultValues: data,
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      const employed = value.employmentStatus === '已就业';

      // 分支切换时的平滑过渡
      if (employed !== isEmployed) {
        setShowTransition(true);
        setTimeout(() => {
          setIsEmployed(employed);
          setShowTransition(false);

          // 清理无关数据
          if (!employed) {
            form.setValue('currentIndustry', '');
            form.setValue('currentPosition', '');
            form.setValue('monthlySalary', '');
            form.setValue('jobSatisfaction', '');
          }
        }, 150);
      }

      // 实时更新数据
      onUpdate(value);
    });

    return () => subscription.unsubscribe();
  }, [form, isEmployed, onUpdate]);

  return (
    <div className="space-y-6">
      {/* 基础就业状态问题 */}
      <QuestionItem title="您目前的就业状态是？" required>
        <RadioGroup
          options={employmentStatusOptions}
          {...form.register('employmentStatus')}
        />
      </QuestionItem>

      {/* 条件显示的就业详情 */}
      <AnimatedSection show={isEmployed && !showTransition}>
        <QuestionItem title="您所在的行业是？" required>
          <Select
            options={industryOptions}
            {...form.register('currentIndustry')}
          />
        </QuestionItem>

        <QuestionItem title="您的职位是？" required>
          <Input
            placeholder="请输入您的职位"
            {...form.register('currentPosition')}
          />
        </QuestionItem>

        <QuestionItem title="您的月薪范围是？" required>
          <RadioGroup
            options={salaryRangeOptions}
            {...form.register('monthlySalary')}
          />
        </QuestionItem>

        <QuestionItem title="您对当前工作的满意度？" required>
          <RatingScale
            min={1}
            max={5}
            labels={['很不满意', '不满意', '一般', '满意', '很满意']}
            {...form.register('jobSatisfaction')}
          />
        </QuestionItem>
      </AnimatedSection>

      {/* 条件统计显示 */}
      {isEmployed && (
        <div className="mt-8 space-y-4">
          <AnswerStats title="行业分布" options={industryStats} />
          <AnswerStats title="薪资分布" options={salaryStats} />
          <AnswerStats title="满意度分布" options={satisfactionStats} />
        </div>
      )}
    </div>
  );
};
```

### 2. 分支状态管理 Hook

```typescript
// useBranchLogic.ts - 分支逻辑管理 Hook
import { useMemo, useCallback } from 'react';

interface BranchConfig {
  employment: {
    condition: (data: QuestionnaireData) => boolean;
    fields: string[];
  };
  majorSatisfaction: {
    condition: (data: QuestionnaireData) => boolean;
    fields: string[];
  };
  careerChange: {
    condition: (data: QuestionnaireData) => boolean;
    fields: string[];
  };
}

const branchConfig: BranchConfig = {
  employment: {
    condition: (data) => data.employmentStatus === '已就业',
    fields: ['currentIndustry', 'currentPosition', 'monthlySalary', 'jobSatisfaction']
  },
  majorSatisfaction: {
    condition: (data) => data.regretMajor === 'true',
    fields: ['preferredMajor']
  },
  careerChange: {
    condition: (data) => data.careerChangeIntention === 'true',
    fields: ['targetIndustry', 'targetPosition']
  }
};

export const useBranchLogic = (formData: QuestionnaireData) => {
  // 计算当前分支状态
  const branchState = useMemo(() => {
    return Object.entries(branchConfig).reduce((state, [key, config]) => {
      state[key] = config.condition(formData);
      return state;
    }, {} as Record<string, boolean>);
  }, [formData]);

  // 获取当前应该显示的字段
  const activeFields = useMemo(() => {
    return Object.entries(branchConfig).reduce((fields, [key, config]) => {
      if (branchState[key]) {
        fields.push(...config.fields);
      }
      return fields;
    }, [] as string[]);
  }, [branchState]);

  // 清理无关数据
  const cleanupData = useCallback((data: QuestionnaireData) => {
    const cleanedData = { ...data };

    Object.entries(branchConfig).forEach(([key, config]) => {
      if (!branchState[key]) {
        config.fields.forEach(field => {
          delete cleanedData[field as keyof QuestionnaireData];
        });
      }
    });

    return cleanedData;
  }, [branchState]);

  return {
    branchState,
    activeFields,
    cleanupData,
    isFieldActive: (fieldName: string) => activeFields.includes(fieldName)
  };
};
```

### 3. 动画过渡组件

```typescript
// AnimatedSection.tsx - 分支切换动画组件
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedSectionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  show,
  children,
  duration = 0.3
}) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{
            opacity: 1,
            height: 'auto',
            marginTop: '1.5rem',
            transition: { duration, ease: 'easeInOut' }
          }}
          exit={{
            opacity: 0,
            height: 0,
            marginTop: 0,
            transition: { duration: duration * 0.7, ease: 'easeInOut' }
          }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

## 🔍 分支逻辑测试用例

### 1. 单元测试示例

```typescript
// branchLogic.test.ts
import { describe, it, expect } from 'vitest';
import { useBranchLogic } from './useBranchLogic';
import { renderHook } from '@testing-library/react';

describe('Branch Logic Tests', () => {
  describe('Employment Branch', () => {
    it('should activate employment fields when employed', () => {
      const formData = { employmentStatus: '已就业' };
      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.employment).toBe(true);
      expect(result.current.isFieldActive('currentIndustry')).toBe(true);
      expect(result.current.isFieldActive('monthlySalary')).toBe(true);
    });

    it('should deactivate employment fields when unemployed', () => {
      const formData = { employmentStatus: '待业中' };
      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.employment).toBe(false);
      expect(result.current.isFieldActive('currentIndustry')).toBe(false);
    });

    it('should cleanup employment data when switching to unemployed', () => {
      const formData = {
        employmentStatus: '待业中',
        currentIndustry: '互联网',
        monthlySalary: '8000-12000'
      };

      const { result } = renderHook(() => useBranchLogic(formData));
      const cleanedData = result.current.cleanupData(formData);

      expect(cleanedData.currentIndustry).toBeUndefined();
      expect(cleanedData.monthlySalary).toBeUndefined();
      expect(cleanedData.employmentStatus).toBe('待业中');
    });
  });

  describe('Major Satisfaction Branch', () => {
    it('should show preferred major when regretting current major', () => {
      const formData = { regretMajor: 'true' };
      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.majorSatisfaction).toBe(true);
      expect(result.current.isFieldActive('preferredMajor')).toBe(true);
    });
  });

  describe('Complex Branch Combinations', () => {
    it('should handle multiple active branches correctly', () => {
      const formData = {
        employmentStatus: '已就业',
        regretMajor: 'true',
        careerChangeIntention: 'true'
      };

      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.employment).toBe(true);
      expect(result.current.branchState.majorSatisfaction).toBe(true);
      expect(result.current.branchState.careerChange).toBe(true);

      const activeFields = result.current.activeFields;
      expect(activeFields).toContain('currentIndustry');
      expect(activeFields).toContain('preferredMajor');
      expect(activeFields).toContain('targetIndustry');
    });
  });
});
```

### 2. 集成测试示例

```typescript
// questionnaire.integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionnairePage } from '../pages/QuestionnairePage';

describe('Questionnaire Branch Integration', () => {
  it('should show employment details when user selects employed', async () => {
    render(<QuestionnairePage />);

    // 选择已就业
    const employedOption = screen.getByLabelText('已就业');
    fireEvent.click(employedOption);

    // 等待分支字段显示
    await waitFor(() => {
      expect(screen.getByText('您所在的行业是？')).toBeInTheDocument();
      expect(screen.getByText('您的月薪范围是？')).toBeInTheDocument();
    });
  });

  it('should hide employment details when switching to unemployed', async () => {
    render(<QuestionnairePage />);

    // 先选择已就业
    fireEvent.click(screen.getByLabelText('已就业'));
    await waitFor(() => {
      expect(screen.getByText('您所在的行业是？')).toBeInTheDocument();
    });

    // 切换到待业
    fireEvent.click(screen.getByLabelText('待业中'));

    // 等待字段隐藏
    await waitFor(() => {
      expect(screen.queryByText('您所在的行业是？')).not.toBeInTheDocument();
    });
  });

  it('should preserve filled data when switching branches', async () => {
    render(<QuestionnairePage />);

    // 填写基础信息
    const nameInput = screen.getByLabelText('姓名');
    fireEvent.change(nameInput, { target: { value: '张三' } });

    // 选择已就业并填写详情
    fireEvent.click(screen.getByLabelText('已就业'));
    await waitFor(() => {
      const industrySelect = screen.getByLabelText('您所在的行业是？');
      fireEvent.change(industrySelect, { target: { value: '互联网' } });
    });

    // 切换到待业再切换回已就业
    fireEvent.click(screen.getByLabelText('待业中'));
    fireEvent.click(screen.getByLabelText('已就业'));

    // 验证基础信息保持，就业详情被清理
    expect(nameInput).toHaveValue('张三');
    await waitFor(() => {
      const industrySelect = screen.getByLabelText('您所在的行业是？');
      expect(industrySelect).toHaveValue('');
    });
  });
});
```

## 💡 实际代码示例

### 1. 完整的分支组件实现

```typescript
// WorkExperienceModule.tsx - 就业状态分支的完整实现
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 动态验证模式
const createWorkExperienceSchema = (isEmployed: boolean) => {
  const baseSchema = z.object({
    employmentStatus: z.string().min(1, '请选择就业状态'),
  });

  if (isEmployed) {
    return baseSchema.extend({
      currentIndustry: z.string().min(1, '请选择所在行业'),
      currentPosition: z.string().min(1, '请填写职位'),
      monthlySalary: z.string().min(1, '请选择薪资范围'),
      jobSatisfaction: z.string().min(1, '请选择满意度'),
    });
  }

  return baseSchema;
};

export const WorkExperienceModule: React.FC<ModuleProps> = ({
  data,
  onUpdate,
  onNext
}) => {
  const [isEmployed, setIsEmployed] = useState(data.employmentStatus === '已就业');
  const [showTransition, setShowTransition] = useState(false);

  const form = useForm({
    resolver: zodResolver(createWorkExperienceSchema(isEmployed)),
    defaultValues: data,
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      const employed = value.employmentStatus === '已就业';

      // 分支切换时的平滑过渡
      if (employed !== isEmployed) {
        setShowTransition(true);
        setTimeout(() => {
          setIsEmployed(employed);
          setShowTransition(false);

          // 清理无关数据
          if (!employed) {
            form.setValue('currentIndustry', '');
            form.setValue('currentPosition', '');
            form.setValue('monthlySalary', '');
            form.setValue('jobSatisfaction', '');
          }
        }, 150);
      }

      // 实时更新数据
      onUpdate(value);
    });

    return () => subscription.unsubscribe();
  }, [form, isEmployed, onUpdate]);

  return (
    <div className="space-y-6">
      {/* 基础就业状态问题 */}
      <QuestionItem title="您目前的就业状态是？" required>
        <RadioGroup
          options={employmentStatusOptions}
          {...form.register('employmentStatus')}
        />
      </QuestionItem>

      {/* 条件显示的就业详情 */}
      <AnimatedSection show={isEmployed && !showTransition}>
        <QuestionItem title="您所在的行业是？" required>
          <Select
            options={industryOptions}
            {...form.register('currentIndustry')}
          />
        </QuestionItem>

        <QuestionItem title="您的职位是？" required>
          <Input
            placeholder="请输入您的职位"
            {...form.register('currentPosition')}
          />
        </QuestionItem>

        <QuestionItem title="您的月薪范围是？" required>
          <RadioGroup
            options={salaryRangeOptions}
            {...form.register('monthlySalary')}
          />
        </QuestionItem>

        <QuestionItem title="您对当前工作的满意度？" required>
          <RatingScale
            min={1}
            max={5}
            labels={['很不满意', '不满意', '一般', '满意', '很满意']}
            {...form.register('jobSatisfaction')}
          />
        </QuestionItem>
      </AnimatedSection>

      {/* 条件统计显示 */}
      {isEmployed && (
        <div className="mt-8 space-y-4">
          <AnswerStats title="行业分布" options={industryStats} />
          <AnswerStats title="薪资分布" options={salaryStats} />
          <AnswerStats title="满意度分布" options={satisfactionStats} />
        </div>
      )}
    </div>
  );
};
```

### 2. 分支状态管理 Hook

```typescript
// useBranchLogic.ts - 分支逻辑管理 Hook
import { useMemo, useCallback } from 'react';

interface BranchConfig {
  employment: {
    condition: (data: QuestionnaireData) => boolean;
    fields: string[];
  };
  majorSatisfaction: {
    condition: (data: QuestionnaireData) => boolean;
    fields: string[];
  };
  careerChange: {
    condition: (data: QuestionnaireData) => boolean;
    fields: string[];
  };
}

const branchConfig: BranchConfig = {
  employment: {
    condition: (data) => data.employmentStatus === '已就业',
    fields: ['currentIndustry', 'currentPosition', 'monthlySalary', 'jobSatisfaction']
  },
  majorSatisfaction: {
    condition: (data) => data.regretMajor === 'true',
    fields: ['preferredMajor']
  },
  careerChange: {
    condition: (data) => data.careerChangeIntention === 'true',
    fields: ['targetIndustry', 'targetPosition']
  }
};

export const useBranchLogic = (formData: QuestionnaireData) => {
  // 计算当前分支状态
  const branchState = useMemo(() => {
    return Object.entries(branchConfig).reduce((state, [key, config]) => {
      state[key] = config.condition(formData);
      return state;
    }, {} as Record<string, boolean>);
  }, [formData]);

  // 获取当前应该显示的字段
  const activeFields = useMemo(() => {
    return Object.entries(branchConfig).reduce((fields, [key, config]) => {
      if (branchState[key]) {
        fields.push(...config.fields);
      }
      return fields;
    }, [] as string[]);
  }, [branchState]);

  // 清理无关数据
  const cleanupData = useCallback((data: QuestionnaireData) => {
    const cleanedData = { ...data };

    Object.entries(branchConfig).forEach(([key, config]) => {
      if (!branchState[key]) {
        config.fields.forEach(field => {
          delete cleanedData[field as keyof QuestionnaireData];
        });
      }
    });

    return cleanedData;
  }, [branchState]);

  return {
    branchState,
    activeFields,
    cleanupData,
    isFieldActive: (fieldName: string) => activeFields.includes(fieldName)
  };
};
```

### 3. 动画过渡组件

```typescript
// AnimatedSection.tsx - 分支切换动画组件
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedSectionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  show,
  children,
  duration = 0.3
}) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{
            opacity: 1,
            height: 'auto',
            marginTop: '1.5rem',
            transition: { duration, ease: 'easeInOut' }
          }}
          exit={{
            opacity: 0,
            height: 0,
            marginTop: 0,
            transition: { duration: duration * 0.7, ease: 'easeInOut' }
          }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

## 🔍 分支逻辑测试策略

### 1. 单元测试示例

```typescript
// branchLogic.test.ts
import { describe, it, expect } from 'vitest';
import { useBranchLogic } from './useBranchLogic';
import { renderHook } from '@testing-library/react';

describe('Branch Logic Tests', () => {
  describe('Employment Branch', () => {
    it('should activate employment fields when employed', () => {
      const formData = { employmentStatus: '已就业' };
      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.employment).toBe(true);
      expect(result.current.isFieldActive('currentIndustry')).toBe(true);
      expect(result.current.isFieldActive('monthlySalary')).toBe(true);
    });

    it('should deactivate employment fields when unemployed', () => {
      const formData = { employmentStatus: '待业中' };
      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.employment).toBe(false);
      expect(result.current.isFieldActive('currentIndustry')).toBe(false);
    });

    it('should cleanup employment data when switching to unemployed', () => {
      const formData = {
        employmentStatus: '待业中',
        currentIndustry: '互联网',
        monthlySalary: '8000-12000'
      };

      const { result } = renderHook(() => useBranchLogic(formData));
      const cleanedData = result.current.cleanupData(formData);

      expect(cleanedData.currentIndustry).toBeUndefined();
      expect(cleanedData.monthlySalary).toBeUndefined();
      expect(cleanedData.employmentStatus).toBe('待业中');
    });
  });

  describe('Major Satisfaction Branch', () => {
    it('should show preferred major when regretting current major', () => {
      const formData = { regretMajor: 'true' };
      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.majorSatisfaction).toBe(true);
      expect(result.current.isFieldActive('preferredMajor')).toBe(true);
    });
  });

  describe('Complex Branch Combinations', () => {
    it('should handle multiple active branches correctly', () => {
      const formData = {
        employmentStatus: '已就业',
        regretMajor: 'true',
        careerChangeIntention: 'true'
      };

      const { result } = renderHook(() => useBranchLogic(formData));

      expect(result.current.branchState.employment).toBe(true);
      expect(result.current.branchState.majorSatisfaction).toBe(true);
      expect(result.current.branchState.careerChange).toBe(true);

      const activeFields = result.current.activeFields;
      expect(activeFields).toContain('currentIndustry');
      expect(activeFields).toContain('preferredMajor');
      expect(activeFields).toContain('targetIndustry');
    });
  });
});
```

### 2. 集成测试示例

```typescript
// questionnaire.integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionnairePage } from '../pages/QuestionnairePage';

describe('Questionnaire Branch Integration', () => {
  it('should show employment details when user selects employed', async () => {
    render(<QuestionnairePage />);

    // 选择已就业
    const employedOption = screen.getByLabelText('已就业');
    fireEvent.click(employedOption);

    // 等待分支字段显示
    await waitFor(() => {
      expect(screen.getByText('您所在的行业是？')).toBeInTheDocument();
      expect(screen.getByText('您的月薪范围是？')).toBeInTheDocument();
    });
  });

  it('should hide employment details when switching to unemployed', async () => {
    render(<QuestionnairePage />);

    // 先选择已就业
    fireEvent.click(screen.getByLabelText('已就业'));
    await waitFor(() => {
      expect(screen.getByText('您所在的行业是？')).toBeInTheDocument();
    });

    // 切换到待业
    fireEvent.click(screen.getByLabelText('待业中'));

    // 等待字段隐藏
    await waitFor(() => {
      expect(screen.queryByText('您所在的行业是？')).not.toBeInTheDocument();
    });
  });

  it('should preserve filled data when switching branches', async () => {
    render(<QuestionnairePage />);

    // 填写基础信息
    const nameInput = screen.getByLabelText('姓名');
    fireEvent.change(nameInput, { target: { value: '张三' } });

    // 选择已就业并填写详情
    fireEvent.click(screen.getByLabelText('已就业'));
    await waitFor(() => {
      const industrySelect = screen.getByLabelText('您所在的行业是？');
      fireEvent.change(industrySelect, { target: { value: '互联网' } });
    });

    // 切换到待业再切换回已就业
    fireEvent.click(screen.getByLabelText('待业中'));
    fireEvent.click(screen.getByLabelText('已就业'));

    // 验证基础信息保持，就业详情被清理
    expect(nameInput).toHaveValue('张三');
    await waitFor(() => {
      const industrySelect = screen.getByLabelText('您所在的行业是？');
      expect(industrySelect).toHaveValue('');
    });
  });
});
```

## 📊 分支设计考虑因素深度分析

### 1. 用户心理学考虑

**认知负荷管理**:
- **渐进式信息披露**: 避免一次性展示所有问题，减少用户的认知压力
- **相关性感知**: 用户只看到与自己状态相关的问题，提高参与度
- **选择疲劳预防**: 通过分支减少不必要的选择，降低决策疲劳

**用户期望管理**:
- **透明的进度指示**: 分支变化时动态更新进度条
- **预期设定**: 在分支入口提示可能的问题数量变化
- **回退机制**: 允许用户修改关键分支选择

### 2. 数据科学考虑

**样本代表性**:
```typescript
// 分支样本统计
interface BranchSampleStats {
  totalResponses: number;
  branchDistribution: {
    employed: number;
    unemployed: number;
    freelance: number;
  };
  completionRates: {
    employed: number;
    unemployed: number;
  };
}

// 确保各分支样本量足够进行统计分析
const validateSampleSize = (stats: BranchSampleStats) => {
  const minSampleSize = 30; // 统计学最小样本量

  Object.entries(stats.branchDistribution).forEach(([branch, count]) => {
    if (count < minSampleSize) {
      console.warn(`分支 ${branch} 样本量不足: ${count} < ${minSampleSize}`);
    }
  });
};
```

**数据质量保证**:
- **一致性检查**: 分支间数据的逻辑一致性验证
- **完整性监控**: 各分支的数据完整度统计
- **偏差检测**: 识别可能的选择偏差和数据倾斜

### 3. 技术架构考虑

**状态管理复杂度**:
```typescript
// 分支状态的复杂度管理
interface BranchComplexity {
  maxDepth: number;        // 最大分支深度
  totalCombinations: number; // 总分支组合数
  activeFields: string[];   // 当前激活字段
}

// 复杂度评估
const assessComplexity = (branchConfig: BranchConfig): BranchComplexity => {
  const combinations = Object.keys(branchConfig).length ** 2;

  if (combinations > 16) {
    console.warn('分支组合过于复杂，考虑简化设计');
  }

  return {
    maxDepth: 3, // 当前最大3层分支
    totalCombinations: combinations,
    activeFields: calculateActiveFields(branchConfig)
  };
};
```

**性能影响评估**:
- **渲染性能**: 分支切换时的组件重渲染开销
- **内存使用**: 条件组件的内存占用
- **网络请求**: 分支相关的数据加载策略

### 4. 可维护性考虑

**分支规则的可读性**:
```typescript
// 声明式分支规则定义
const branchRules = {
  // 就业状态分支 - 清晰的业务逻辑
  employmentDetails: {
    name: '就业详情',
    condition: (data) => data.employmentStatus === '已就业',
    description: '已就业用户需要填写工作相关详细信息',
    fields: ['currentIndustry', 'currentPosition', 'monthlySalary'],
    validationLevel: 'strict'
  },

  // 专业后悔分支 - 情感相关逻辑
  majorRegret: {
    name: '专业重选',
    condition: (data) => data.regretMajor === 'true',
    description: '后悔当前专业的用户可以选择理想专业',
    fields: ['preferredMajor'],
    validationLevel: 'optional'
  }
};
```

**版本兼容性**:
- **向后兼容**: 新增分支不影响现有数据结构
- **迁移策略**: 分支逻辑变更时的数据迁移方案
- **A/B测试支持**: 支持不同分支逻辑的并行测试

### 5. 业务逻辑考虑

**分支决策的业务合理性**:
```typescript
// 业务规则验证
const validateBusinessLogic = (formData: QuestionnaireData) => {
  const issues: string[] = [];

  // 逻辑一致性检查
  if (formData.employmentStatus === '已就业' && !formData.currentIndustry) {
    issues.push('已就业用户必须选择行业');
  }

  if (formData.regretMajor === 'false' && formData.preferredMajor) {
    issues.push('不后悔专业的用户不应该有理想专业选择');
  }

  // 数据合理性检查
  if (formData.monthlySalary && formData.employmentStatus !== '已就业') {
    issues.push('非就业用户不应该有薪资信息');
  }

  return issues;
};
```

**领域专家输入**:
- **教育专家**: 问卷设计的教育学合理性
- **HR专家**: 就业相关问题的实用性
- **心理学专家**: 问题设计的心理学依据

### 6. 隐私和伦理考虑

**敏感信息分支处理**:
```typescript
// 敏感信息的分支处理
const sensitiveDataBranches = {
  personalFinance: {
    condition: (data) => data.shareFinancialInfo === 'true',
    sensitivityLevel: 'high',
    anonymizationRequired: true
  },

  mentalHealth: {
    condition: (data) => data.shareWellbeingInfo === 'true',
    sensitivityLevel: 'critical',
    professionalGuidanceRequired: true
  }
};
```

**数据最小化原则**:
- **按需收集**: 只在相关分支中收集必要数据
- **目的限制**: 明确每个分支数据的使用目的
- **保留期限**: 不同分支数据的差异化保留策略

### 7. 国际化和本地化考虑

**文化适应性**:
- **就业观念差异**: 不同文化背景下的就业状态理解
- **教育体系差异**: 专业分类的地区差异
- **语言表达**: 分支问题的本地化表达

**法规遵循**:
- **数据保护法规**: GDPR、CCPA等对分支数据的要求
- **就业法规**: 不同地区就业相关问题的合规性
- **教育法规**: 教育信息收集的法律限制

## 🎯 分支设计最佳实践总结

### 核心原则
1. **用户中心**: 以用户体验为核心设计分支逻辑
2. **数据驱动**: 基于数据分析优化分支设计
3. **技术可行**: 确保分支实现的技术可行性
4. **业务合理**: 分支逻辑符合业务需求和专业标准

### 设计检查清单
- [ ] 分支条件清晰明确，无歧义
- [ ] 分支切换提供适当的用户反馈
- [ ] 数据清理机制完善，避免数据污染
- [ ] 性能影响可控，用户体验流畅
- [ ] 测试覆盖完整，包括边界情况
- [ ] 文档完善，便于维护和扩展

### 持续优化策略
- **用户反馈收集**: 定期收集用户对分支体验的反馈
- **数据分析驱动**: 基于用户行为数据优化分支设计
- **A/B测试验证**: 通过实验验证分支设计的有效性
- **技术债务管理**: 定期重构分支代码，保持代码质量

---

**文档维护**: 本文档应随着分支逻辑的演进持续更新
**反馈渠道**: 技术团队内部评审和用户体验反馈
**版本控制**: 与代码版本同步，确保文档的时效性
