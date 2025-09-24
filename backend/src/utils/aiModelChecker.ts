/**
 * AI模型可用性检测工具
 * 用于验证Cloudflare Workers AI模型是否可用
 */

export interface ModelCheckResult {
  modelId: string;
  available: boolean;
  error?: string;
  responseTime?: number;
  testResult?: any;
}

export interface AIModelChecker {
  checkModel(modelId: string, testInput: any): Promise<ModelCheckResult>;
  checkAllModels(): Promise<ModelCheckResult[]>;
  getAvailableModels(): Promise<string[]>;
}

export class CloudflareAIModelChecker implements AIModelChecker {
  private ai: any;
  
  constructor(ai: any) {
    this.ai = ai;
  }

  async checkModel(modelId: string, testInput: any): Promise<ModelCheckResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[AI_CHECKER] Testing model: ${modelId}`);
      
      const result = await this.ai.run(modelId, testInput);
      const responseTime = Date.now() - startTime;
      
      console.log(`[AI_CHECKER] Model ${modelId} available, response time: ${responseTime}ms`);
      
      return {
        modelId,
        available: true,
        responseTime,
        testResult: result
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      console.error(`[AI_CHECKER] Model ${modelId} failed:`, error);
      
      return {
        modelId,
        available: false,
        error: error.message || 'Unknown error',
        responseTime
      };
    }
  }

  async checkAllModels(): Promise<ModelCheckResult[]> {
    const modelsToCheck = [
      // 内容安全模型 - 优先级最高
      {
        id: '@cf/meta/llama-guard-3-8b',
        category: 'safety',
        testInput: {
          messages: [
            { role: 'user', content: '测试不当内容检测：这是一个包含粗口的测试内容，用于验证安全检测。' }
          ]
        }
      },
      {
        id: '@cf/meta/llama-3.1-8b-instruct',
        category: 'safety',
        testInput: {
          messages: [
            { role: 'system', content: 'You are a content safety moderator. Analyze if the following content is appropriate for a professional employment survey platform.' },
            { role: 'user', content: '测试内容安全检测功能' }
          ]
        }
      },
      {
        id: '@cf/meta/llama-3-8b-instruct',
        category: 'safety',
        testInput: {
          messages: [
            { role: 'system', content: 'Detect inappropriate content including profanity, politics, adult content.' },
            { role: 'user', content: '检测不当内容：政治敏感话题测试' }
          ]
        }
      },

      // 文本分类模型 - 针对就业相关内容
      {
        id: '@cf/huggingface/distilbert-sst-2-int8',
        category: 'classification',
        testInput: { text: '我在找工作时遇到了很多困难，希望能分享一些求职经验。' }
      },
      {
        id: '@cf/microsoft/resnet-50',
        category: 'classification',
        testInput: { text: '就业市场竞争激烈，需要提升个人技能。' }
      },
      {
        id: '@cf/huggingface/CodeBERTa-small-v1',
        category: 'classification',
        testInput: { text: '技术岗位求职经验分享' }
      },

      // 情感分析模型
      {
        id: '@cf/huggingface/distilbert-sst-2-int8',
        category: 'sentiment',
        testInput: { text: '求职过程中的挫折和成长经历分享。' }
      },

      // 语义分析和嵌入模型
      {
        id: '@cf/baai/bge-base-en-v1.5',
        category: 'semantic',
        testInput: { text: '就业相关内容的语义分析测试' }
      },
      {
        id: '@cf/baai/bge-small-en-v1.5',
        category: 'semantic',
        testInput: { text: '职业发展和就业指导内容' }
      },
      {
        id: '@cf/baai/bge-large-en-v1.5',
        category: 'semantic',
        testInput: { text: 'Employment and career development content analysis' }
      },

      // 专门的内容审核模型
      {
        id: '@cf/openai/moderation',
        category: 'moderation',
        testInput: { input: '测试内容审核：包含不当言论的文本检测' }
      },

      // 多语言支持模型
      {
        id: '@cf/meta/m2m100-1.2b',
        category: 'multilingual',
        testInput: {
          text: '就业相关内容',
          source_lang: 'zh',
          target_lang: 'en'
        }
      }
    ];

    console.log(`[AI_CHECKER] Checking ${modelsToCheck.length} models...`);
    
    const results = await Promise.allSettled(
      modelsToCheck.map(model => this.checkModel(model.id, model.testInput))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          modelId: modelsToCheck[index].id,
          available: false,
          error: result.reason?.message || 'Promise rejected'
        };
      }
    });
  }

  async getAvailableModels(): Promise<string[]> {
    const results = await this.checkAllModels();
    return results
      .filter(result => result.available)
      .map(result => result.modelId);
  }
}

/**
 * 获取推荐的AI模型配置
 * 基于可用性检测结果返回最佳模型组合，针对就业调查平台优化
 */
export async function getRecommendedModelConfig(ai: any): Promise<{
  models: Record<string, string>;
  availabilityReport: ModelCheckResult[];
  modelCategories: Record<string, string[]>;
}> {
  const checker = new CloudflareAIModelChecker(ai);
  const availabilityReport = await checker.checkAllModels();

  // 按功能分类可用模型
  const availableModels = availabilityReport.filter(r => r.available);

  // 按类别分组可用模型
  const modelsByCategory: Record<string, ModelCheckResult[]> = {};
  availableModels.forEach(model => {
    const category = (model as any).category || 'general';
    if (!modelsByCategory[category]) {
      modelsByCategory[category] = [];
    }
    modelsByCategory[category].push(model);
  });

  // 智能模型选择策略
  const models: Record<string, string> = {};
  const modelCategories: Record<string, string[]> = {};

  // 1. 内容安全模型 - 多层防护
  const safetyModels = modelsByCategory.safety || [];
  models.primarySafety = safetyModels.find(m => m.modelId.includes('llama-guard'))?.modelId || '@cf/meta/llama-guard-3-8b';
  models.secondarySafety = safetyModels.find(m => m.modelId.includes('llama-3.1'))?.modelId || '@cf/meta/llama-3.1-8b-instruct';
  models.moderationSafety = safetyModels.find(m => m.modelId.includes('moderation'))?.modelId || '@cf/openai/moderation';

  modelCategories.safety = [models.primarySafety, models.secondarySafety, models.moderationSafety].filter(Boolean);

  // 2. 文本分类模型 - 就业相关内容识别
  const classificationModels = modelsByCategory.classification || [];
  models.textClassification = classificationModels.find(m => m.modelId.includes('distilbert'))?.modelId || '@cf/huggingface/distilbert-sst-2-int8';
  models.employmentClassification = classificationModels.find(m => m.modelId.includes('CodeBERTa'))?.modelId || '@cf/huggingface/CodeBERTa-small-v1';

  modelCategories.classification = [models.textClassification, models.employmentClassification].filter(Boolean);

  // 3. 情感分析模型
  const sentimentModels = modelsByCategory.sentiment || modelsByCategory.classification || [];
  models.sentimentAnalysis = sentimentModels.find(m => m.modelId.includes('distilbert'))?.modelId || '@cf/huggingface/distilbert-sst-2-int8';

  modelCategories.sentiment = [models.sentimentAnalysis].filter(Boolean);

  // 4. 语义分析模型 - 多尺寸支持
  const semanticModels = modelsByCategory.semantic || [];
  models.semanticLarge = semanticModels.find(m => m.modelId.includes('bge-large'))?.modelId || '@cf/baai/bge-large-en-v1.5';
  models.semanticBase = semanticModels.find(m => m.modelId.includes('bge-base'))?.modelId || '@cf/baai/bge-base-en-v1.5';
  models.semanticSmall = semanticModels.find(m => m.modelId.includes('bge-small'))?.modelId || '@cf/baai/bge-small-en-v1.5';

  modelCategories.semantic = [models.semanticLarge, models.semanticBase, models.semanticSmall].filter(Boolean);

  // 5. 多语言支持
  const multilingualModels = modelsByCategory.multilingual || [];
  models.translation = multilingualModels.find(m => m.modelId.includes('m2m100'))?.modelId || '@cf/meta/m2m100-1.2b';

  modelCategories.multilingual = [models.translation].filter(Boolean);

  // 6. 就业内容专用配置
  models.employmentContentAnalysis = models.secondarySafety; // 使用高级Llama模型进行就业内容分析
  models.professionalLanguageDetection = models.textClassification; // 专业语言检测

  // 性能优化：根据响应时间排序
  const sortedByPerformance = availableModels.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0));
  models.fastestModel = sortedByPerformance[0]?.modelId || models.semanticSmall;

  console.log('[AI_CHECKER] Enhanced model configuration for employment platform:', models);
  console.log('[AI_CHECKER] Model categories:', modelCategories);
  console.log('[AI_CHECKER] Available models by category:', modelsByCategory);

  return {
    models,
    availabilityReport,
    modelCategories
  };
}

/**
 * 简化的模型检测函数
 * 用于快速检测AI服务是否可用
 */
export async function quickAICheck(ai: any): Promise<{
  available: boolean;
  workingModels: number;
  totalModels: number;
  error?: string;
}> {
  try {
    const checker = new CloudflareAIModelChecker(ai);
    const results = await checker.checkAllModels();
    
    const workingModels = results.filter(r => r.available).length;
    const totalModels = results.length;
    
    return {
      available: workingModels > 0,
      workingModels,
      totalModels
    };
  } catch (error: any) {
    return {
      available: false,
      workingModels: 0,
      totalModels: 0,
      error: error.message
    };
  }
}
