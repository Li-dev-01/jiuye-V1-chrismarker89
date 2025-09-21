# 🚀 通用问卷系统 - 功能克隆指南

## 📋 项目概述

**通用问卷系统**是一个高度可配置、功能完整的问卷调查平台，支持多种问题类型、实时统计、进度跟踪和数据验证。本系统从大学就业调查项目中提取核心功能，重构为通用的、可复用的问卷解决方案。

### 🎯 核心特性

- **🔥 多种问题类型**: 单选、多选、文本、数字、日期、评分等
- **📊 实时统计**: 动态显示其他用户的选择分布
- **⚡ 智能验证**: 灵活的验证规则和实时错误提示
- **📈 进度跟踪**: 可视化的进度条和步骤导航
- **💾 数据持久化**: 自动保存和恢复用户输入
- **🎨 主题定制**: 完全可定制的UI主题系统
- **🔌 API集成**: 统一的API客户端和数据管理
- **⚡ 性能优化**: 懒加载、缓存、防抖等优化策略

### 🏗️ 系统架构

```
通用问卷系统
├── 问卷引擎模块
│   ├── 问卷状态管理
│   ├── 节导航控制
│   ├── 数据验证处理
│   └── 进度跟踪系统
├── 问题渲染模块
│   ├── 动态问题组件
│   ├── 输入验证器
│   ├── 统计数据展示
│   └── 主题样式系统
├── 数据服务模块
│   ├── API客户端
│   ├── 本地存储管理
│   ├── 统计数据服务
│   └── 缓存策略系统
└── 配置管理模块
    ├── 问题类型配置
    ├── 验证规则配置
    ├── 主题配置系统
    └── API端点配置
```

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **表单管理**: React Hook Form + Zod
- **UI组件库**: Tailwind CSS + Radix UI
- **状态管理**: React Context + Custom Hooks
- **数据可视化**: Recharts + 自定义图表
- **构建工具**: Vite
- **类型检查**: TypeScript 5.0+

## 📁 项目结构

```
questionnaire-system/
├── README.md                          # 项目文档
├── components/                        # 核心组件
│   ├── QuestionnaireEngine.tsx        # 主问卷引擎
│   ├── QuestionRenderer.tsx           # 问题渲染器
│   ├── ProgressTracker.tsx            # 进度跟踪器
│   ├── StatisticsPanel.tsx            # 统计面板
│   ├── SubmissionHandler.tsx          # 提交处理器
│   ├── ValidationDisplay.tsx          # 验证显示器
│   └── ThemeProvider.tsx              # 主题提供者
├── types/                             # 类型定义
│   ├── questionnaire.types.ts         # 问卷相关类型
│   ├── question.types.ts              # 问题相关类型
│   ├── statistics.types.ts            # 统计相关类型
│   ├── validation.types.ts            # 验证相关类型
│   └── api.types.ts                   # API相关类型
├── hooks/                             # 自定义Hooks
│   ├── useQuestionnaire.ts            # 问卷管理Hook
│   ├── useQuestionValidation.ts       # 问题验证Hook
│   ├── useStatistics.ts               # 统计数据Hook
│   ├── useProgress.ts                 # 进度管理Hook
│   └── useLocalStorage.ts             # 本地存储Hook
├── services/                          # 服务层
│   ├── questionnaireService.ts        # 问卷服务
│   ├── statisticsService.ts           # 统计服务
│   ├── validationService.ts           # 验证服务
│   ├── apiClient.ts                   # API客户端
│   └── cacheService.ts                # 缓存服务
├── utils/                             # 工具函数
│   ├── questionUtils.ts               # 问题工具
│   ├── validationUtils.ts             # 验证工具
│   ├── statisticsUtils.ts             # 统计工具
│   └── formatUtils.ts                 # 格式化工具
├── config/                            # 配置文件
│   ├── question-types.json            # 问题类型配置
│   ├── validation-rules.json          # 验证规则配置
│   ├── theme-config.json              # 主题配置
│   ├── api-endpoints.json             # API端点配置
│   └── default-settings.json          # 默认设置
├── styles/                            # 样式文件
│   ├── questionnaire.css              # 问卷样式
│   ├── themes/                        # 主题样式
│   │   ├── default.css                # 默认主题
│   │   ├── dark.css                   # 暗色主题
│   │   └── minimal.css                # 简约主题
│   └── components/                    # 组件样式
│       ├── question-renderer.css      # 问题渲染器样式
│       ├── statistics-panel.css       # 统计面板样式
│       └── progress-tracker.css       # 进度跟踪器样式
├── examples/                          # 示例文件
│   ├── basic-questionnaire.html       # 基础问卷示例
│   ├── advanced-features.html         # 高级功能示例
│   ├── custom-themes.html             # 自定义主题示例
│   ├── api-integration.html           # API集成示例
│   └── employment-survey.html         # 就业调查示例
└── test/                              # 测试文件
    ├── questionnaire-engine.test.html # 引擎测试
    ├── question-types.test.html       # 问题类型测试
    ├── validation.test.html           # 验证测试
    └── statistics.test.html           # 统计测试
```

## 🎯 支持的问题类型

### 📝 基础问题类型

| 类型 | 描述 | 用途 | 验证支持 |
|------|------|------|----------|
| `radio` | 单选题 | 单项选择 | 必填、选项验证 |
| `checkbox` | 多选题 | 多项选择 | 必填、数量限制 |
| `select` | 下拉选择 | 选项较多的单选 | 必填、选项验证 |
| `text` | 文本输入 | 短文本输入 | 必填、长度、格式 |
| `textarea` | 长文本 | 多行文本输入 | 必填、长度、格式 |
| `number` | 数字输入 | 数值输入 | 必填、范围、精度 |
| `date` | 日期选择 | 日期输入 | 必填、范围验证 |
| `email` | 邮箱输入 | 邮箱地址 | 必填、格式验证 |

### 🎨 高级问题类型

| 类型 | 描述 | 用途 | 特殊功能 |
|------|------|------|----------|
| `rating` | 评分 | 满意度评价 | 星级、数字评分 |
| `slider` | 滑块 | 范围选择 | 实时数值显示 |
| `file` | 文件上传 | 文件提交 | 类型限制、大小限制 |
| `matrix` | 矩阵题 | 批量评价 | 行列配置 |
| `ranking` | 排序题 | 优先级排序 | 拖拽排序 |
| `likert` | 李克特量表 | 态度测量 | 标准化量表 |

## 📊 统计功能

### 🔥 实时统计

- **选项分布**: 显示每个选项的选择比例
- **趋势分析**: 时间维度的数据变化
- **对比分析**: 不同群体的选择差异
- **热力图**: 可视化选择热度

### 📈 统计图表

```typescript
interface StatisticsConfig {
  // 图表类型
  chartType: 'bar' | 'pie' | 'line' | 'area' | 'heatmap';
  
  // 显示选项
  showPercentage: boolean;
  showCount: boolean;
  showTrend: boolean;
  
  // 交互功能
  highlightSelected: boolean;
  enableAnimation: boolean;
  allowExport: boolean;
  
  // 更新频率
  updateInterval: number; // 毫秒
  cacheTimeout: number;   // 缓存超时
}
```

## 🔧 配置系统

### ⚙️ 问卷配置

```typescript
interface QuestionnaireConfig {
  // 基础设置
  title: string;
  description: string;
  allowAnonymous: boolean;
  requireEmail: boolean;
  
  // 导航设置
  allowBackward: boolean;
  showProgress: boolean;
  autoSave: boolean;
  
  // 验证设置
  validateOnChange: boolean;
  validateOnBlur: boolean;
  showValidationSummary: boolean;
  
  // 统计设置
  showStatistics: boolean;
  statisticsPosition: 'right' | 'bottom' | 'popup';
  updateStatisticsRealtime: boolean;
  
  // 主题设置
  theme: string;
  customCSS?: string;
  
  // API设置
  apiEndpoint: string;
  submitEndpoint: string;
  statisticsEndpoint: string;
}
```

### 🎨 主题配置

```typescript
interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };
  
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}
```

## 🚀 快速开始

### 📋 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- 现代浏览器支持 (Chrome 90+, Firefox 88+, Safari 14+)

### 🛠️ 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd questionnaire-system
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **配置环境**
```bash
cp config/default-settings.json config/settings.json
# 编辑 config/settings.json 配置API端点和其他设置
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

5. **访问应用**
```
http://localhost:3000/questionnaire-system
```

### 🔧 基础使用

```typescript
// 在你的应用中使用问卷系统
import { QuestionnaireEngine } from './questionnaire-system';

const questionnaire = {
  id: 'employment-survey',
  title: '大学生就业调查',
  description: '了解大学生就业现状和期望',
  sections: [
    {
      id: 'personal-info',
      title: '个人信息',
      questions: [
        {
          id: 'education',
          type: 'radio',
          title: '您的最高学历是？',
          required: true,
          options: [
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士' },
            { value: 'phd', label: '博士' }
          ]
        }
      ]
    }
  ]
};

const config = {
  showStatistics: true,
  allowAnonymous: true,
  theme: 'default'
};

// 渲染问卷
<QuestionnaireEngine 
  questionnaire={questionnaire}
  config={config}
  onSubmit={(data) => console.log('提交数据:', data)}
  onProgress={(progress) => console.log('进度:', progress)}
/>
```

## 🎨 高级功能

### 🔄 条件逻辑

支持基于用户回答的动态问题显示：

```typescript
const conditionalQuestion = {
  id: 'employment-details',
  type: 'text',
  title: '请描述您的工作内容',
  condition: {
    dependsOn: 'current-status',
    operator: 'equals',
    value: 'employed'
  }
};
```

### 📊 实时统计

每个问题都可以显示实时的统计数据：

```typescript
const questionWithStats = {
  id: 'education',
  type: 'radio',
  title: '您的最高学历是？',
  options: [...],
  statistics: {
    enabled: true,
    chartType: 'bar',
    showPercentage: true,
    position: 'right'
  }
};
```

### 🎯 数据验证

支持多种验证规则：

```typescript
const validatedQuestion = {
  id: 'email',
  type: 'email',
  title: '请输入您的邮箱',
  validation: [
    {
      type: 'required',
      message: '邮箱为必填项'
    },
    {
      type: 'email',
      message: '请输入有效的邮箱地址'
    },
    {
      type: 'custom',
      validator: (value) => value.endsWith('.edu'),
      message: '请使用教育邮箱'
    }
  ]
};
```

### 💾 数据持久化

自动保存用户进度，支持断点续答：

```typescript
const config = {
  autoSave: true,
  autoSaveInterval: 30000, // 30秒自动保存
  enableLocalStorage: true,
  storageKey: 'my-questionnaire'
};
```

## 🔧 API集成

### 📡 后端接口

系统需要以下API端点：

```typescript
// 获取问卷配置
GET /api/questionnaire/{id}

// 提交问卷响应
POST /api/questionnaire/{id}/submit
{
  "questionnaireId": "string",
  "sectionResponses": [...],
  "metadata": {...}
}

// 获取统计数据
GET /api/questionnaire/{id}/statistics?questionId={questionId}

// 保存进度
POST /api/questionnaire/{id}/progress
{
  "responses": {...},
  "currentSection": 0
}
```

### 🔌 自定义API客户端

```typescript
import { QuestionnaireEngine } from './questionnaire-system';

const customApiClient = {
  async submitQuestionnaire(data) {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async getStatistics(questionId) {
    const response = await fetch(`/api/stats/${questionId}`);
    return response.json();
  }
};

<QuestionnaireEngine
  questionnaire={questionnaire}
  apiClient={customApiClient}
  onSubmit={customApiClient.submitQuestionnaire}
/>
```

## 🎨 主题定制

### 🌈 预设主题

```typescript
// 使用预设主题
const config = {
  theme: 'default', // 'default' | 'dark' | 'minimal' | 'colorful'
};

// 自定义主题
const customTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    border: '#e2e8f0'
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      xlarge: '1.25rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};
```

### 🎭 CSS自定义

```css
/* 自定义问卷样式 */
.questionnaire-engine {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --border-radius: 8px;
  --spacing-unit: 1rem;
}

.question-card {
  border-radius: var(--border-radius);
  padding: calc(var(--spacing-unit) * 1.5);
  margin-bottom: var(--spacing-unit);
}

.question-title {
  color: var(--primary-color);
  font-weight: 600;
}
```

## 📱 响应式设计

系统完全支持响应式设计，在各种设备上都有良好的体验：

### 📱 移动端优化

- 触摸友好的交互设计
- 优化的输入组件
- 自适应的统计图表
- 简化的导航界面

### 💻 桌面端功能

- 键盘快捷键支持
- 多列布局
- 详细的统计面板
- 高级的验证提示

### 📊 平板端适配

- 中等尺寸的组件
- 侧边栏统计面板
- 手势导航支持
- 横竖屏自适应
```
