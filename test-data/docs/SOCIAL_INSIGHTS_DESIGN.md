# 社会洞察功能设计方案

**日期**: 2025-09-21  
**功能**: 可视化页面中的"社会洞察"自动更新系统  
**目标**: 实现基于AI的专业数据分析和社会统计学洞察生成  

## 🎯 功能概述

### 当前状态
"社会洞察"功能目前使用静态的模拟数据，每个图表都有预设的洞察文本：

```typescript
// 当前的静态洞察示例
socialInsight: '全职就业率达到45.2%，继续深造比例为28.1%，整体就业形势稳定'
socialInsight: '67.8%的受访者认为就业有一定难度，反映当前就业市场竞争激烈'
socialInsight: '互联网科技和金融行业吸纳就业最多，新兴产业成为就业增长点'
```

### 目标状态
实现智能化的洞察生成系统，能够：
- 🤖 **自动分析数据变化**：实时监测数据趋势
- 📊 **生成专业洞察**：基于社会统计学方法
- 🔄 **定期更新内容**：每日/每周自动更新
- 📈 **趋势对比分析**：历史数据对比和预测

## 🏗️ 技术架构设计

### 1. 数据分析引擎
```
数据源 → 预处理 → 统计分析 → AI洞察生成 → 内容审核 → 发布更新
```

#### 核心组件：
- **数据预处理器**: 清洗和标准化问卷数据
- **统计分析器**: 计算关键指标和趋势
- **AI洞察生成器**: 使用LLM生成专业分析
- **内容审核器**: 确保洞察的准确性和专业性
- **更新调度器**: 管理定期更新任务

### 2. AI洞察生成流程

#### 阶段1: 数据统计分析
```typescript
interface DataAnalysisResult {
  currentPeriod: {
    totalResponses: number;
    keyMetrics: Record<string, number>;
    distributions: Record<string, Array<{label: string, value: number, percentage: number}>>;
  };
  previousPeriod: {
    // 同样结构，用于对比
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    significance: number;
  };
  anomalies: Array<{
    metric: string;
    deviation: number;
    possibleCauses: string[];
  }>;
}
```

#### 阶段2: AI提示词构建
```typescript
const buildInsightPrompt = (analysisResult: DataAnalysisResult, questionContext: QuestionContext) => {
  return `
作为就业市场分析专家，请基于以下数据生成专业的社会统计学洞察：

【数据背景】
- 问题：${questionContext.title}
- 样本量：${analysisResult.currentPeriod.totalResponses}
- 时间范围：${questionContext.timeRange}

【关键发现】
${formatKeyFindings(analysisResult)}

【趋势分析】
${formatTrendAnalysis(analysisResult.trends)}

【要求】
1. 提供1-2句简洁的核心洞察
2. 基于社会统计学角度分析
3. 避免过度解读，保持客观
4. 如有显著变化，说明可能原因
5. 字数控制在50-80字

请生成洞察：
`;
};
```

#### 阶段3: 洞察质量评估
```typescript
interface InsightQuality {
  accuracy: number;        // 准确性评分 (0-1)
  relevance: number;       // 相关性评分 (0-1)
  clarity: number;         // 清晰度评分 (0-1)
  professionalism: number; // 专业性评分 (0-1)
  confidence: number;      // 置信度评分 (0-1)
}
```

## 🔄 更新策略设计

### 1. 更新频率策略
```typescript
interface UpdateStrategy {
  // 数据量驱动的更新
  dataThreshold: {
    minNewResponses: 50;     // 最少新增50个回答才更新
    significantChange: 0.05; // 关键指标变化超过5%才更新
  };
  
  // 时间驱动的更新
  timeSchedule: {
    daily: {
      enabled: true;
      time: '06:00';         // 每日6点检查更新
      conditions: ['dataThreshold'];
    };
    weekly: {
      enabled: true;
      day: 'monday';
      time: '08:00';         // 每周一8点强制更新
      conditions: ['force'];
    };
  };
  
  // 事件驱动的更新
  eventTriggers: {
    dataAnomaly: true;       // 数据异常时触发
    manualRequest: true;     // 手动请求更新
    policyChange: true;      // 政策变化时触发
  };
}
```

### 2. 洞察缓存策略
```typescript
interface InsightCache {
  current: {
    insights: Record<string, string>;
    generatedAt: string;
    validUntil: string;
    confidence: number;
  };
  history: Array<{
    insights: Record<string, string>;
    period: string;
    metrics: Record<string, number>;
  }>;
  metadata: {
    totalGenerations: number;
    averageQuality: number;
    lastUpdateTrigger: string;
  };
}
```

## 🤖 AI服务集成

### 1. AI洞察生成服务
```typescript
class SocialInsightAIService {
  async generateInsights(
    questionId: string, 
    analysisData: DataAnalysisResult,
    context: QuestionContext
  ): Promise<{
    insight: string;
    confidence: number;
    reasoning: string;
    alternatives: string[];
  }> {
    // 1. 构建专业提示词
    const prompt = this.buildInsightPrompt(analysisData, context);
    
    // 2. 调用AI服务
    const aiResponse = await this.aiService.generateText({
      prompt,
      maxTokens: 200,
      temperature: 0.3,  // 较低温度确保一致性
      topP: 0.9
    });
    
    // 3. 质量评估
    const quality = await this.evaluateInsightQuality(aiResponse.text, analysisData);
    
    // 4. 如果质量不达标，重新生成
    if (quality.overall < 0.7) {
      return this.generateInsights(questionId, analysisData, context);
    }
    
    return {
      insight: aiResponse.text,
      confidence: quality.overall,
      reasoning: quality.reasoning,
      alternatives: await this.generateAlternatives(prompt)
    };
  }
}
```

### 2. 专业术语和表达库
```typescript
const PROFESSIONAL_EXPRESSIONS = {
  trends: {
    increasing: ['呈上升趋势', '显著增长', '持续攀升'],
    decreasing: ['呈下降趋势', '有所回落', '逐步减少'],
    stable: ['保持稳定', '基本持平', '变化不大']
  },
  significance: {
    high: ['显著', '明显', '突出'],
    medium: ['一定程度上', '有所', '略有'],
    low: ['轻微', '小幅', '微弱']
  },
  causality: {
    likely: ['可能反映', '或表明', '提示'],
    uncertain: ['可能与...有关', '或受...影响'],
    correlation: ['与...呈正相关', '与...关联度较高']
  }
};
```

## 📊 实施方案

### 阶段1: 基础设施搭建 (1-2周)
1. **数据分析引擎**
   - 创建 `SocialInsightAnalyzer` 服务
   - 实现基础统计分析功能
   - 建立数据质量检查机制

2. **AI服务集成**
   - 集成现有的 `aiReviewService`
   - 创建专门的洞察生成提示词模板
   - 建立洞察质量评估机制

### 阶段2: 核心功能开发 (2-3周)
1. **洞察生成器**
   ```typescript
   // 新建文件: frontend/src/services/socialInsightService.ts
   export class SocialInsightService {
     async generateInsightForQuestion(questionId: string): Promise<string>;
     async updateAllInsights(): Promise<void>;
     async getInsightHistory(questionId: string): Promise<InsightHistory[]>;
   }
   ```

2. **更新调度器**
   ```typescript
   // 新建文件: backend/src/services/insightUpdateScheduler.ts
   export class InsightUpdateScheduler {
     scheduleDaily(): void;
     scheduleWeekly(): void;
     checkUpdateConditions(): Promise<boolean>;
   }
   ```

### 阶段3: 用户界面优化 (1周)
1. **洞察展示增强**
   - 添加洞察生成时间显示
   - 显示置信度指标
   - 提供历史洞察对比

2. **管理界面**
   - 洞察质量监控面板
   - 手动触发更新功能
   - 洞察审核和编辑功能

## 🔧 技术实现细节

### 1. 数据库设计
```sql
-- 洞察缓存表
CREATE TABLE social_insights (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id VARCHAR(64) NOT NULL,
  insight_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_snapshot JSON,
  ai_reasoning TEXT,
  quality_metrics JSON,
  status ENUM('active', 'archived', 'rejected') DEFAULT 'active',
  INDEX idx_question_id (question_id),
  INDEX idx_generated_at (generated_at)
);

-- 洞察更新日志
CREATE TABLE insight_update_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trigger_type ENUM('scheduled', 'manual', 'data_threshold', 'anomaly'),
  questions_updated JSON,
  total_updated INT,
  execution_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. API端点设计
```typescript
// 获取最新洞察
GET /api/analytics/insights/:questionId
// 手动触发更新
POST /api/analytics/insights/update
// 获取洞察历史
GET /api/analytics/insights/:questionId/history
// 洞察质量反馈
POST /api/analytics/insights/:insightId/feedback
```

## 📈 质量保证机制

### 1. 多层验证
- **统计验证**: 确保洞察与数据一致
- **语言质量**: 检查语法和专业性
- **逻辑一致性**: 避免前后矛盾
- **时效性检查**: 确保洞察反映最新趋势

### 2. 人工审核流程
- **自动标记**: AI标记可能有问题的洞察
- **专家审核**: 定期人工审核洞察质量
- **用户反馈**: 收集用户对洞察准确性的反馈

## 🎯 预期效果

### 短期目标 (1个月)
- ✅ 实现基础的AI洞察生成
- ✅ 建立每日自动更新机制
- ✅ 洞察准确率达到80%以上

### 中期目标 (3个月)
- ✅ 洞察准确率提升到90%以上
- ✅ 支持趋势预测和异常检测
- ✅ 建立完整的质量监控体系

### 长期目标 (6个月)
- ✅ 实现多维度交叉分析洞察
- ✅ 支持政策影响评估
- ✅ 建立行业对比和基准分析

## 💡 实现示例代码

### 1. 社会洞察生成服务
```typescript
// frontend/src/services/socialInsightService.ts
export class SocialInsightService {
  private aiService = new AIReviewService();

  async generateInsightForQuestion(
    questionId: string,
    currentData: ChartData[],
    historicalData?: ChartData[]
  ): Promise<SocialInsight> {

    // 1. 数据分析
    const analysis = this.analyzeData(currentData, historicalData);

    // 2. 构建AI提示词
    const prompt = this.buildInsightPrompt(questionId, analysis);

    // 3. 生成洞察
    const aiResponse = await this.aiService.generateInsight(prompt);

    // 4. 质量验证
    const quality = this.validateInsight(aiResponse, analysis);

    return {
      text: aiResponse.insight,
      confidence: quality.score,
      generatedAt: new Date().toISOString(),
      dataSnapshot: analysis,
      reasoning: aiResponse.reasoning
    };
  }

  private analyzeData(current: ChartData[], historical?: ChartData[]) {
    const total = current.reduce((sum, item) => sum + item.value, 0);
    const distribution = current.map(item => ({
      ...item,
      percentage: (item.value / total) * 100
    }));

    // 计算趋势（如果有历史数据）
    const trends = historical ? this.calculateTrends(current, historical) : null;

    // 识别异常值
    const anomalies = this.detectAnomalies(distribution);

    return {
      total,
      distribution,
      trends,
      anomalies,
      dominantCategory: distribution.reduce((max, item) =>
        item.percentage > max.percentage ? item : max
      ),
      diversity: this.calculateDiversity(distribution)
    };
  }

  private buildInsightPrompt(questionId: string, analysis: any): string {
    const questionContext = this.getQuestionContext(questionId);

    return `
作为就业市场分析专家，基于以下数据生成专业洞察：

【问题】${questionContext.title}
【样本量】${analysis.total}
【主要发现】
- 最高比例：${analysis.dominantCategory.name} (${analysis.dominantCategory.percentage.toFixed(1)}%)
- 数据分布多样性：${analysis.diversity.toFixed(2)}
${analysis.trends ? `- 趋势变化：${this.formatTrends(analysis.trends)}` : ''}
${analysis.anomalies.length > 0 ? `- 异常发现：${analysis.anomalies.join(', ')}` : ''}

要求：
1. 50-80字的专业洞察
2. 基于社会统计学角度
3. 客观、准确、有价值
4. 避免过度解读

洞察：`;
  }
}
```

### 2. 定时更新调度器
```typescript
// backend/src/services/insightUpdateScheduler.ts
export class InsightUpdateScheduler {
  private cron = require('node-cron');
  private insightService = new SocialInsightService();

  start() {
    // 每日6点检查更新
    this.cron.schedule('0 6 * * *', async () => {
      await this.checkAndUpdate('daily');
    });

    // 每周一8点强制更新
    this.cron.schedule('0 8 * * 1', async () => {
      await this.forceUpdate('weekly');
    });
  }

  private async checkAndUpdate(trigger: string) {
    const questions = await this.getQuestionsNeedingUpdate();

    for (const questionId of questions) {
      try {
        const shouldUpdate = await this.shouldUpdateInsight(questionId);
        if (shouldUpdate) {
          await this.updateInsight(questionId, trigger);
        }
      } catch (error) {
        console.error(`Failed to update insight for ${questionId}:`, error);
      }
    }
  }

  private async shouldUpdateInsight(questionId: string): Promise<boolean> {
    const lastUpdate = await this.getLastUpdateTime(questionId);
    const newDataCount = await this.getNewDataCount(questionId, lastUpdate);
    const significantChange = await this.hasSignificantChange(questionId, lastUpdate);

    return newDataCount >= 50 || significantChange;
  }
}
```

### 3. 洞察质量评估
```typescript
// 洞察质量评估器
class InsightQualityEvaluator {
  evaluateInsight(insight: string, dataAnalysis: any): QualityScore {
    const scores = {
      accuracy: this.checkAccuracy(insight, dataAnalysis),
      relevance: this.checkRelevance(insight, dataAnalysis),
      clarity: this.checkClarity(insight),
      professionalism: this.checkProfessionalism(insight),
      length: this.checkLength(insight)
    };

    const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    return {
      ...scores,
      overall,
      feedback: this.generateFeedback(scores)
    };
  }

  private checkAccuracy(insight: string, data: any): number {
    // 检查洞察中的数字是否与数据一致
    const numbers = insight.match(/\d+\.?\d*%?/g) || [];
    let accuracyScore = 1.0;

    for (const num of numbers) {
      const value = parseFloat(num.replace('%', ''));
      if (num.includes('%')) {
        // 验证百分比的准确性
        const isAccurate = this.verifyPercentage(value, data);
        if (!isAccurate) accuracyScore -= 0.2;
      }
    }

    return Math.max(0, accuracyScore);
  }

  private checkProfessionalism(insight: string): number {
    const professionalTerms = [
      '反映', '显示', '表明', '呈现', '趋势', '分布', '比例',
      '结构', '特征', '状况', '水平', '程度'
    ];

    const casualTerms = ['很多', '不少', '挺好', '还行', '一般般'];

    let score = 0.5;
    professionalTerms.forEach(term => {
      if (insight.includes(term)) score += 0.1;
    });

    casualTerms.forEach(term => {
      if (insight.includes(term)) score -= 0.2;
    });

    return Math.min(1, Math.max(0, score));
  }
}
```

## 🔄 渐进式实施策略

### 第一步：最小可行产品 (MVP)
1. **简单AI集成**：使用现有的AI服务生成基础洞察
2. **手动触发**：管理员可以手动更新洞察
3. **基础验证**：简单的长度和格式检查

### 第二步：自动化增强
1. **定时更新**：实现每日自动检查和更新
2. **数据驱动**：基于数据变化触发更新
3. **质量提升**：加入专业性和准确性检查

### 第三步：智能化升级
1. **趋势分析**：加入历史对比和趋势预测
2. **异常检测**：识别数据异常并生成特殊洞察
3. **多维分析**：支持交叉维度的深度分析

---

**这个设计方案将"社会洞察"从静态文本转变为动态、智能、专业的分析系统，真正发挥数据的社会价值！**

**关键优势**：
- 🤖 **AI驱动**：专业的自动化分析
- 📊 **数据驱动**：基于真实数据变化
- 🔄 **实时更新**：保持洞察的时效性
- 🎯 **专业表达**：社会统计学角度的专业分析
- 📈 **持续改进**：通过反馈不断优化质量
