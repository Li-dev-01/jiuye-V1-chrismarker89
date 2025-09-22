# 社会洞察功能快速启动方案

**目标**: 在1-2周内实现基础的AI驱动社会洞察更新功能  
**策略**: 基于现有AI服务，快速集成最小可行产品  

## 🚀 快速实施步骤

### 第1步：创建洞察生成服务 (2天)

#### 1.1 创建基础服务文件
```bash
# 创建新的服务文件
touch frontend/src/services/socialInsightGenerator.ts
touch backend/src/services/insightAnalyzer.ts
```

#### 1.2 实现简化的洞察生成器
```typescript
// frontend/src/services/socialInsightGenerator.ts
import { aiReviewService } from './aiReviewService';

export class SocialInsightGenerator {
  async generateInsight(questionId: string, data: any[]): Promise<string> {
    // 1. 简单数据分析
    const analysis = this.analyzeBasicStats(data);
    
    // 2. 构建提示词
    const prompt = this.buildPrompt(questionId, analysis);
    
    // 3. 调用AI生成
    const result = await aiReviewService.generateText(prompt);
    
    return result.text;
  }
  
  private analyzeBasicStats(data: any[]) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const sorted = data.sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const topPercentage = ((top.value / total) * 100).toFixed(1);
    
    return {
      total,
      topCategory: top.name,
      topPercentage,
      diversity: data.length,
      hasSignificantLeader: parseFloat(topPercentage) > 40
    };
  }
  
  private buildPrompt(questionId: string, stats: any): string {
    return `
作为就业数据分析师，请为以下数据生成一句专业洞察：

数据：${stats.topCategory}占${stats.topPercentage}%，样本量${stats.total}
要求：40-60字，客观专业，体现社会意义

洞察：`;
  }
}
```

### 第2步：集成到可视化页面 (1天)

#### 2.1 修改可视化页面
```typescript
// 在 NewQuestionnaireVisualizationPage.tsx 中添加
import { SocialInsightGenerator } from '../../services/socialInsightGenerator';

const insightGenerator = new SocialInsightGenerator();

// 修改 generateMockData 函数
const generateMockDataWithInsight = async (question: any) => {
  const mockData = generateMockData(question);
  
  // 生成AI洞察（仅在生产环境或手动触发时）
  if (process.env.NODE_ENV === 'production' || shouldGenerateInsight) {
    try {
      const insight = await insightGenerator.generateInsight(
        question.questionId, 
        mockData
      );
      
      // 更新洞察到缓存或状态
      updateInsightCache(question.questionId, insight);
    } catch (error) {
      console.warn('洞察生成失败，使用默认洞察:', error);
    }
  }
  
  return mockData;
};
```

### 第3步：添加手动更新功能 (1天)

#### 3.1 添加更新按钮
```typescript
// 在可视化页面添加管理员控制
const [isUpdatingInsights, setIsUpdatingInsights] = useState(false);

const handleUpdateInsights = async () => {
  setIsUpdatingInsights(true);
  try {
    // 更新所有维度的洞察
    for (const dimension of VISUALIZATION_DIMENSIONS) {
      for (const question of dimension.questions) {
        const data = generateMockData(question);
        const insight = await insightGenerator.generateInsight(
          question.questionId, 
          data
        );
        updateInsightCache(question.questionId, insight);
      }
    }
    message.success('洞察更新完成！');
  } catch (error) {
    message.error('洞察更新失败');
  } finally {
    setIsUpdatingInsights(false);
  }
};

// 在页面头部添加按钮（仅开发环境显示）
{process.env.NODE_ENV === 'development' && (
  <Button 
    type="primary" 
    icon={<BulbOutlined />}
    loading={isUpdatingInsights}
    onClick={handleUpdateInsights}
  >
    更新洞察
  </Button>
)}
```

### 第4步：实现洞察缓存 (1天)

#### 4.1 创建洞察缓存服务
```typescript
// frontend/src/services/insightCache.ts
class InsightCacheService {
  private cache = new Map<string, {
    insight: string;
    generatedAt: string;
    confidence: number;
  }>();
  
  set(questionId: string, insight: string, confidence: number = 0.8) {
    this.cache.set(questionId, {
      insight,
      generatedAt: new Date().toISOString(),
      confidence
    });
    
    // 持久化到localStorage
    localStorage.setItem('insightCache', JSON.stringify(
      Array.from(this.cache.entries())
    ));
  }
  
  get(questionId: string): string | null {
    const cached = this.cache.get(questionId);
    if (!cached) return null;
    
    // 检查是否过期（24小时）
    const age = Date.now() - new Date(cached.generatedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      this.cache.delete(questionId);
      return null;
    }
    
    return cached.insight;
  }
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('insightCache');
      if (stored) {
        const entries = JSON.parse(stored);
        this.cache = new Map(entries);
      }
    } catch (error) {
      console.warn('加载洞察缓存失败:', error);
    }
  }
}

export const insightCache = new InsightCacheService();
```

### 第5步：优化显示效果 (1天)

#### 5.1 增强洞察显示
```typescript
// 在图表卡片中显示洞察
<Card>
  <UniversalChart {...chartProps} />
  <Divider />
  
  {/* 增强的洞察显示 */}
  <div style={{ background: '#f6f8fa', padding: '12px', borderRadius: '6px' }}>
    <Space>
      <BulbOutlined style={{ color: '#1890ff' }} />
      <Text strong style={{ color: '#1890ff' }}>社会洞察</Text>
      {insightCache.get(question.questionId) && (
        <Tag color="green" size="small">AI生成</Tag>
      )}
    </Space>
    <Paragraph 
      style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: '1.5' }}
      type="secondary"
    >
      {insightCache.get(question.questionId) || question.socialValue}
    </Paragraph>
  </div>
</Card>
```

## 🔧 配置和部署

### 环境变量配置
```bash
# .env.local
REACT_APP_ENABLE_AI_INSIGHTS=true
REACT_APP_AI_INSIGHT_ENDPOINT=https://your-ai-service.com/api
```

### AI服务配置
```typescript
// 确保AI服务已正确配置
const AI_CONFIG = {
  maxTokens: 150,
  temperature: 0.3,
  model: 'gpt-3.5-turbo',
  timeout: 10000
};
```

## 📊 测试和验证

### 测试步骤
1. **功能测试**
   ```bash
   # 测试洞察生成
   npm run test:insights
   
   # 测试缓存功能
   npm run test:cache
   ```

2. **质量验证**
   - 生成10个不同问题的洞察
   - 检查洞察的专业性和准确性
   - 验证缓存和更新机制

3. **性能测试**
   - 测试AI调用响应时间
   - 验证缓存命中率
   - 检查页面加载性能

## 🎯 预期效果

### 立即可见的改进
- ✅ **动态洞察**: 不再是静态文本
- ✅ **专业表达**: AI生成的专业分析
- ✅ **实时更新**: 支持手动触发更新

### 1周后的效果
- ✅ **智能缓存**: 避免重复生成
- ✅ **质量稳定**: 基础的质量控制
- ✅ **用户体验**: 更有价值的洞察内容

## 🔄 后续扩展计划

### 第2周：自动化增强
- 添加定时更新机制
- 实现数据变化检测
- 加入洞察质量评估

### 第3-4周：智能化升级
- 支持趋势分析
- 添加异常检测
- 实现多维度对比

---

**这个快速启动方案可以在1-2周内让"社会洞察"功能从静态变为动态，为后续的深度优化奠定基础！**

**关键优势**：
- 🚀 **快速上线**: 基于现有基础设施
- 💡 **即时价值**: 立即提升洞察质量
- 🔧 **易于扩展**: 为后续功能预留接口
- 📊 **渐进改进**: 可持续优化的架构
