# 用户画像系统实施方案 V2

## 📋 需求澄清

### 1. **问卷-标签关联（非用户绑定）** ✅
- ❌ 不绑定到具体用户（匿名提交）
- ✅ 统计问卷答案 → 生成标签分布
- ✅ 构建群体画像数据库
- ✅ 用于数据分析和可视化

### 2. **自动化标签生成流程** ✅
- ✅ 问卷提交后自动分析答案
- ✅ 生成对应标签
- ✅ 存储到标签统计表
- ✅ 累积形成用户群体画像

### 3. **情绪鼓励机制** ✅
- ✅ 问卷完成后弹出情绪鼓励窗口
- ✅ 基于答案识别情绪状态
- ✅ 展示励志名言
- ✅ 用户确认后跳转故事墙

### 4. **故事圈子功能** 📝 下一迭代
- 📝 记录为下一版本功能
- 📝 创建产品文档
- 📝 作为后续开发参考

---

## 🎯 本次实施范围

### 阶段1：数据库设计（30分钟）
创建以下表结构：

#### 1.1 问卷标签统计表
```sql
CREATE TABLE IF NOT EXISTS questionnaire_tag_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionnaire_id TEXT NOT NULL,           -- 问卷ID（如：questionnaire-v2-2024）
  tag_key TEXT NOT NULL,                    -- 标签键（如：young-graduate）
  tag_name TEXT NOT NULL,                   -- 标签名（如：应届毕业生）
  tag_category TEXT,                        -- 标签分类（如：年龄段、就业状态）
  count INTEGER DEFAULT 0,                  -- 该标签出现次数
  percentage REAL DEFAULT 0,                -- 占比
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(questionnaire_id, tag_key)
);
```

#### 1.2 问卷情绪统计表
```sql
CREATE TABLE IF NOT EXISTS questionnaire_emotion_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionnaire_id TEXT NOT NULL,
  emotion_type TEXT NOT NULL,               -- positive/neutral/negative
  count INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(questionnaire_id, emotion_type)
);
```

#### 1.3 励志名言库表
```sql
CREATE TABLE IF NOT EXISTS motivational_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_text TEXT NOT NULL,                 -- 名言内容
  author TEXT,                              -- 作者
  category TEXT NOT NULL,                   -- 分类（学习成长、求职励志等）
  emotion_target TEXT,                      -- 目标情绪（negative/neutral）
  tag_keys TEXT,                            -- 关联标签（JSON数组）
  usage_count INTEGER DEFAULT 0,           -- 使用次数
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 阶段2：标签生成规则引擎（2-3小时）

#### 2.1 标签规则定义
```typescript
// backend/src/services/questionnaireTagGenerator.ts

interface TagRule {
  tagKey: string;
  tagName: string;
  category: string;
  condition: (answers: Record<string, any>) => boolean;
  weight: number;  // 权重（用于多标签排序）
}

export const QUESTIONNAIRE_V2_TAG_RULES: TagRule[] = [
  // 年龄段标签
  {
    tagKey: 'age-18-22',
    tagName: '18-22岁',
    category: '年龄段',
    condition: (a) => a['age-range-v2'] === '18-22',
    weight: 1.0
  },
  {
    tagKey: 'age-23-25',
    tagName: '23-25岁',
    category: '年龄段',
    condition: (a) => a['age-range-v2'] === '23-25',
    weight: 1.0
  },
  
  // 学历标签
  {
    tagKey: 'education-bachelor',
    tagName: '本科学历',
    category: '学历',
    condition: (a) => a['education-level-v2'] === 'bachelor',
    weight: 1.0
  },
  {
    tagKey: 'education-master',
    tagName: '硕士学历',
    category: '学历',
    condition: (a) => a['education-level-v2'] === 'master',
    weight: 1.0
  },
  
  // 就业状态标签
  {
    tagKey: 'employed',
    tagName: '已就业',
    category: '就业状态',
    condition: (a) => a['employment-status-v2'] === 'employed',
    weight: 1.0
  },
  {
    tagKey: 'job-seeking',
    tagName: '求职中',
    category: '就业状态',
    condition: (a) => a['employment-status-v2'] === 'unemployed',
    weight: 1.0
  },
  
  // 经济压力标签
  {
    tagKey: 'high-economic-pressure',
    tagName: '高经济压力',
    category: '经济状况',
    condition: (a) => {
      const pressure = a['economic-pressure-v2'];
      return pressure === 'very-high' || pressure === 'high';
    },
    weight: 0.9
  },
  {
    tagKey: 'has-debt',
    tagName: '有负债',
    category: '经济状况',
    condition: (a) => a['has-debt-v2'] === 'yes',
    weight: 0.8
  },
  
  // 就业信心标签
  {
    tagKey: 'confident',
    tagName: '就业信心强',
    category: '心态',
    condition: (a) => {
      const confidence = a['employment-confidence-v2'];
      return confidence === 'very-confident' || confidence === 'confident';
    },
    weight: 0.9
  },
  {
    tagKey: 'anxious',
    tagName: '就业焦虑',
    category: '心态',
    condition: (a) => {
      const confidence = a['employment-confidence-v2'];
      return confidence === 'not-confident' || confidence === 'very-anxious';
    },
    weight: 0.9
  },
  
  // 生育意愿标签
  {
    tagKey: 'willing-to-have-children',
    tagName: '有生育意愿',
    category: '生育态度',
    condition: (a) => a['fertility-intention-v2'] === 'yes',
    weight: 0.7
  },
  {
    tagKey: 'no-children-plan',
    tagName: '不打算生育',
    category: '生育态度',
    condition: (a) => a['fertility-intention-v2'] === 'no',
    weight: 0.7
  },
  
  // 组合标签（高级）
  {
    tagKey: 'young-graduate-job-seeker',
    tagName: '应届求职者',
    category: '组合画像',
    condition: (a) => {
      return a['age-range-v2'] === '18-22' && 
             a['employment-status-v2'] === 'unemployed' &&
             a['education-level-v2'] === 'bachelor';
    },
    weight: 1.2
  },
  {
    tagKey: 'stressed-young-professional',
    tagName: '压力青年',
    category: '组合画像',
    condition: (a) => {
      const age = a['age-range-v2'];
      const pressure = a['economic-pressure-v2'];
      return (age === '23-25' || age === '26-30') && 
             (pressure === 'high' || pressure === 'very-high');
    },
    weight: 1.1
  }
];
```

#### 2.2 标签生成服务
```typescript
export class QuestionnaireTagGenerator {
  
  /**
   * 根据问卷答案生成标签
   */
  static generateTags(
    questionnaireId: string,
    answers: Record<string, any>
  ): GeneratedTag[] {
    const tags: GeneratedTag[] = [];
    
    for (const rule of QUESTIONNAIRE_V2_TAG_RULES) {
      try {
        if (rule.condition(answers)) {
          tags.push({
            tagKey: rule.tagKey,
            tagName: rule.tagName,
            category: rule.category,
            weight: rule.weight
          });
        }
      } catch (error) {
        console.error(`标签规则执行失败: ${rule.tagKey}`, error);
      }
    }
    
    // 按权重排序
    return tags.sort((a, b) => b.weight - a.weight);
  }
  
  /**
   * 更新标签统计
   */
  static async updateTagStatistics(
    db: D1Database,
    questionnaireId: string,
    tags: GeneratedTag[]
  ): Promise<void> {
    for (const tag of tags) {
      // 增加标签计数
      await db.prepare(`
        INSERT INTO questionnaire_tag_statistics 
        (questionnaire_id, tag_key, tag_name, tag_category, count, last_updated)
        VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(questionnaire_id, tag_key) 
        DO UPDATE SET 
          count = count + 1,
          last_updated = CURRENT_TIMESTAMP
      `).bind(
        questionnaireId,
        tag.tagKey,
        tag.tagName,
        tag.category
      ).run();
    }
    
    // 重新计算百分比
    await this.recalculatePercentages(db, questionnaireId);
  }
  
  /**
   * 重新计算标签百分比
   */
  static async recalculatePercentages(
    db: D1Database,
    questionnaireId: string
  ): Promise<void> {
    // 获取总提交数
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total 
      FROM universal_questionnaire_responses 
      WHERE questionnaire_id = ?
    `).bind(questionnaireId).first();
    
    const total = totalResult?.total || 0;
    
    if (total > 0) {
      // 更新所有标签的百分比
      await db.prepare(`
        UPDATE questionnaire_tag_statistics
        SET percentage = (count * 100.0 / ?)
        WHERE questionnaire_id = ?
      `).bind(total, questionnaireId).run();
    }
  }
}
```

---

### 阶段3：情绪识别服务（1小时）

```typescript
// backend/src/services/emotionAnalyzer.ts

export interface EmotionAnalysisResult {
  emotionType: 'positive' | 'neutral' | 'negative';
  confidence: number;
  needsEncouragement: boolean;
  reasons: string[];
}

export class EmotionAnalyzer {
  
  /**
   * 分析问卷答案的情绪倾向
   */
  static analyzeEmotion(answers: Record<string, any>): EmotionAnalysisResult {
    let positiveScore = 0;
    let negativeScore = 0;
    const reasons: string[] = [];
    
    // 1. 就业信心
    const confidence = answers['employment-confidence-v2'];
    if (confidence === 'very-confident' || confidence === 'confident') {
      positiveScore += 2;
    } else if (confidence === 'not-confident' || confidence === 'very-anxious') {
      negativeScore += 2;
      reasons.push('就业信心不足');
    }
    
    // 2. 经济压力
    const pressure = answers['economic-pressure-v2'];
    if (pressure === 'very-high' || pressure === 'high') {
      negativeScore += 2;
      reasons.push('经济压力较大');
    } else if (pressure === 'low' || pressure === 'very-low') {
      positiveScore += 1;
    }
    
    // 3. 就业状态
    const employmentStatus = answers['employment-status-v2'];
    if (employmentStatus === 'employed') {
      positiveScore += 1;
    } else if (employmentStatus === 'unemployed') {
      negativeScore += 1;
      reasons.push('正在求职中');
    }
    
    // 4. 负债情况
    if (answers['has-debt-v2'] === 'yes') {
      negativeScore += 1;
      reasons.push('有经济负债');
    }
    
    // 5. 生活满意度（如果有这个字段）
    const satisfaction = answers['life-satisfaction-v2'];
    if (satisfaction === 'very-satisfied' || satisfaction === 'satisfied') {
      positiveScore += 2;
    } else if (satisfaction === 'dissatisfied' || satisfaction === 'very-dissatisfied') {
      negativeScore += 2;
      reasons.push('生活满意度较低');
    }
    
    // 计算情绪类型
    let emotionType: 'positive' | 'neutral' | 'negative';
    if (negativeScore > positiveScore + 1) {
      emotionType = 'negative';
    } else if (positiveScore > negativeScore + 1) {
      emotionType = 'positive';
    } else {
      emotionType = 'neutral';
    }
    
    // 计算置信度
    const totalScore = positiveScore + negativeScore;
    const confidence = totalScore > 0 
      ? Math.abs(positiveScore - negativeScore) / totalScore 
      : 0.5;
    
    // 判断是否需要鼓励
    const needsEncouragement = emotionType === 'negative' && negativeScore >= 3;
    
    return {
      emotionType,
      confidence,
      needsEncouragement,
      reasons
    };
  }
  
  /**
   * 更新情绪统计
   */
  static async updateEmotionStatistics(
    db: D1Database,
    questionnaireId: string,
    emotionType: string
  ): Promise<void> {
    await db.prepare(`
      INSERT INTO questionnaire_emotion_statistics 
      (questionnaire_id, emotion_type, count, last_updated)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(questionnaire_id, emotion_type) 
      DO UPDATE SET 
        count = count + 1,
        last_updated = CURRENT_TIMESTAMP
    `).bind(questionnaireId, emotionType).run();
    
    // 重新计算百分比
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total 
      FROM universal_questionnaire_responses 
      WHERE questionnaire_id = ?
    `).bind(questionnaireId).first();
    
    const total = totalResult?.total || 0;
    
    if (total > 0) {
      await db.prepare(`
        UPDATE questionnaire_emotion_statistics
        SET percentage = (count * 100.0 / ?)
        WHERE questionnaire_id = ?
      `).bind(total, questionnaireId).run();
    }
  }
}
```

---

### 阶段4：励志名言服务（1小时）

```typescript
// backend/src/services/motivationalQuoteService.ts

export class MotivationalQuoteService {
  
  /**
   * 根据标签和情绪选择励志名言
   */
  static async selectQuote(
    db: D1Database,
    tags: GeneratedTag[],
    emotionType: string
  ): Promise<MotivationalQuote | null> {
    // 优先匹配标签
    for (const tag of tags) {
      const quote = await db.prepare(`
        SELECT * FROM motivational_quotes
        WHERE is_active = 1
          AND (tag_keys LIKE ? OR tag_keys LIKE ?)
          AND (emotion_target = ? OR emotion_target IS NULL)
        ORDER BY RANDOM()
        LIMIT 1
      `).bind(
        `%"${tag.tagKey}"%`,
        `%${tag.tagKey}%`,
        emotionType
      ).first();
      
      if (quote) {
        // 更新使用次数
        await db.prepare(`
          UPDATE motivational_quotes 
          SET usage_count = usage_count + 1 
          WHERE id = ?
        `).bind(quote.id).run();
        
        return quote as MotivationalQuote;
      }
    }
    
    // 如果没有匹配标签，选择通用名言
    const defaultQuote = await db.prepare(`
      SELECT * FROM motivational_quotes
      WHERE is_active = 1
        AND tag_keys IS NULL
        AND (emotion_target = ? OR emotion_target IS NULL)
      ORDER BY RANDOM()
      LIMIT 1
    `).bind(emotionType).first();
    
    if (defaultQuote) {
      await db.prepare(`
        UPDATE motivational_quotes 
        SET usage_count = usage_count + 1 
        WHERE id = ?
      `).bind(defaultQuote.id).run();
    }
    
    return defaultQuote as MotivationalQuote | null;
  }
}
```

---

### 阶段5：集成到问卷提交流程（1小时）

修改 `backend/src/routes/universal-questionnaire.ts`：

```typescript
// 在问卷提交成功后添加
universalQuestionnaire.post('/submit', async (c) => {
  // ... 现有的提交逻辑 ...
  
  try {
    // 1. 生成标签
    const tags = QuestionnaireTagGenerator.generateTags(
      questionnaireId,
      responseData
    );
    
    // 2. 更新标签统计
    await QuestionnaireTagGenerator.updateTagStatistics(
      db.db,
      questionnaireId,
      tags
    );
    
    // 3. 分析情绪
    const emotionAnalysis = EmotionAnalyzer.analyzeEmotion(responseData);
    
    // 4. 更新情绪统计
    await EmotionAnalyzer.updateEmotionStatistics(
      db.db,
      questionnaireId,
      emotionAnalysis.emotionType
    );
    
    // 5. 如果需要鼓励，选择励志名言
    let motivationalQuote = null;
    if (emotionAnalysis.needsEncouragement) {
      motivationalQuote = await MotivationalQuoteService.selectQuote(
        db.db,
        tags,
        emotionAnalysis.emotionType
      );
    }
    
    // 6. 返回结果（包含标签和名言）
    return c.json({
      success: true,
      data: {
        submissionId: result.meta.last_row_id,
        tags: tags.slice(0, 5), // 返回前5个标签
        emotionAnalysis: {
          type: emotionAnalysis.emotionType,
          needsEncouragement: emotionAnalysis.needsEncouragement
        },
        motivationalQuote
      },
      message: '问卷提交成功'
    });
    
  } catch (error) {
    console.error('标签生成失败:', error);
    // 不影响问卷提交，继续返回成功
  }
});
```

---

## 📝 下一步：创建故事圈子产品文档

我将创建一个独立的产品文档，记录圈子功能的设计方案。

---

## ⏱️ 预计时间

- 数据库设计：30分钟
- 标签生成引擎：2-3小时
- 情绪识别服务：1小时
- 励志名言服务：1小时
- 集成到问卷流程：1小时
- 前端情绪鼓励弹窗：1-2小时

**总计：6-8小时（1个工作日）**

---

您希望我立即开始实施吗？我建议从数据库设计开始。

