# 数据生成器功能克隆文档

## 📋 概述

数据生成器是一个强大的测试数据生成系统，支持AI驱动和本地脚本两种生成方式。可以生成问卷数据、故事内容、用户信息等多种类型的测试数据，并提供完整的质量控制、进度监控和批量处理功能。

## 🎯 功能特性

### ✅ 核心功能
- **多类型数据生成** - 问卷、故事、用户、语音数据
- **AI驱动生成** - 支持OpenAI GPT-4、Grok等AI提供商
- **本地脚本生成** - 快速生成测试数据，无需API调用
- **质量控制** - 基础、标准、高级三种质量等级
- **批量处理** - 支持大批量数据生成和分片处理
- **进度监控** - 实时显示生成进度和状态

### 🔧 高级特性
- **模板系统** - 可配置的数据生成模板
- **性能优化** - 分片处理、并发控制、内存优化
- **错误恢复** - 自动重试、错误处理、状态恢复
- **数据验证** - 格式验证、完整性检查、重复检测
- **导出功能** - 支持多种格式导出生成的数据

## 📁 文件结构

```
data-generator/
├── README.md                          # 本文档
├── components/                        # 组件文件
│   ├── DataGeneratorPanel.html       # 数据生成器面板
│   ├── DataGeneratorPanel.css        # 样式文件
│   ├── DataGeneratorPanel.js         # 交互逻辑
│   ├── GenerationMonitor.html        # 生成监控组件
│   └── ProgressTracker.js            # 进度跟踪器
├── services/                          # 服务文件
│   ├── dataGenerationService.js      # 数据生成服务
│   ├── aiProviderService.js          # AI提供商服务
│   ├── localGeneratorService.js      # 本地生成服务
│   └── templateService.js            # 模板服务
├── templates/                         # 数据模板
│   ├── questionnaire-templates.json  # 问卷模板
│   ├── story-templates.json          # 故事模板
│   ├── user-templates.json           # 用户模板
│   └── voice-templates.json          # 语音模板
├── config/                           # 配置文件
│   ├── generation-config.json        # 生成配置
│   ├── ai-providers.json             # AI提供商配置
│   └── quality-control.json          # 质量控制配置
├── utils/                            # 工具文件
│   ├── dataValidator.js              # 数据验证器
│   ├── chunkProcessor.js             # 分片处理器
│   └── performanceMonitor.js         # 性能监控器
├── examples/                         # 使用示例
│   ├── basic-generation.html         # 基础生成示例
│   ├── batch-processing.html         # 批量处理示例
│   └── ai-integration.html           # AI集成示例
└── test.html                         # 功能测试页面
```

## 🤖 AI提供商配置

### 支持的AI提供商
```json
{
  "providers": {
    "openai": {
      "name": "OpenAI GPT-4",
      "endpoint": "https://api.openai.com/v1/chat/completions",
      "model": "gpt-4",
      "maxTokens": 2048,
      "temperature": 0.7,
      "status": "active",
      "costPerRequest": 0.03
    },
    "grok": {
      "name": "Grok AI",
      "endpoint": "https://api.x.ai/v1/chat/completions",
      "model": "grok-beta",
      "maxTokens": 2048,
      "temperature": 0.8,
      "status": "disabled",
      "costPerRequest": 0.02
    },
    "claude": {
      "name": "Anthropic Claude",
      "endpoint": "https://api.anthropic.com/v1/messages",
      "model": "claude-3-sonnet",
      "maxTokens": 2048,
      "temperature": 0.6,
      "status": "inactive",
      "costPerRequest": 0.025
    }
  },
  "defaultProvider": "openai",
  "fallbackProvider": null,
  "loadBalancing": {
    "enabled": false,
    "weights": {
      "openai": 1.0,
      "grok": 0.0,
      "claude": 0.0
    }
  }
}
```

## 📊 数据生成配置

### 生成量配置（已调整到1/5）
```json
{
  "generation": {
    "questionnaire": {
      "defaultCount": 15,
      "maxCount": 40,
      "defaultInterval": 60,
      "maxInterval": 120,
      "defaultBatchSize": 3,
      "maxBatchSize": 8
    },
    "story": {
      "defaultCount": 8,
      "maxCount": 20,
      "defaultInterval": 90,
      "maxInterval": 180,
      "defaultBatchSize": 2,
      "maxBatchSize": 5
    },
    "user": {
      "defaultCount": 14,
      "maxCount": 30,
      "defaultInterval": 120,
      "maxInterval": 240,
      "defaultBatchSize": 2,
      "maxBatchSize": 6
    }
  }
}
```

### 质量控制等级
```json
{
  "qualityLevels": {
    "basic": {
      "name": "基础质量",
      "description": "快速生成，基本格式验证",
      "validationLevel": "format",
      "aiCreativity": 0.5,
      "contentLength": "short",
      "reviewRequired": false
    },
    "standard": {
      "name": "标准质量",
      "description": "平衡质量和速度",
      "validationLevel": "content",
      "aiCreativity": 0.7,
      "contentLength": "medium",
      "reviewRequired": true
    },
    "premium": {
      "name": "高级质量",
      "description": "最高质量，详细验证",
      "validationLevel": "comprehensive",
      "aiCreativity": 0.9,
      "contentLength": "long",
      "reviewRequired": true
    }
  }
}
```

## 🎨 数据模板系统

### 问卷数据模板
```json
{
  "questionnaireTemplates": {
    "basic": {
      "name": "基础问卷模板",
      "fields": {
        "educationLevel": ["本科", "硕士", "博士", "专科"],
        "major": ["计算机科学", "软件工程", "电子信息", "机械工程"],
        "graduationYear": [2020, 2021, 2022, 2023, 2024],
        "region": ["北京", "上海", "广州", "深圳", "杭州"],
        "employmentStatus": ["已就业", "待就业", "继续深造", "创业"],
        "industry": ["互联网", "金融", "制造业", "教育", "医疗"],
        "salaryRange": ["3-5K", "5-8K", "8-12K", "12-20K", "20K+"]
      },
      "contentTemplates": {
        "advice": [
          "建议学弟学妹们要注重实践能力的培养...",
          "在校期间要多参加实习和项目经验...",
          "保持学习的热情，技术更新很快..."
        ],
        "observation": [
          "当前就业市场竞争激烈，需要不断提升自己...",
          "企业更看重实际能力和项目经验...",
          "新兴技术领域有更多机会..."
        ]
      }
    }
  }
}
```

### 故事内容模板
```json
{
  "storyTemplates": {
    "jobHunting": {
      "name": "求职经历模板",
      "titles": [
        "我的求职之路：从迷茫到收获心仪offer",
        "转行程序员的心路历程",
        "应届生求职经验分享"
      ],
      "contentStructure": {
        "opening": [
          "回想起自己的求职经历，真是五味杂陈...",
          "作为一名应届毕业生，求职路上充满了挑战...",
          "从决定转行到成功入职，这段经历让我成长了很多..."
        ],
        "challenges": [
          "面试过程中遇到了很多技术难题...",
          "简历投出去经常石沉大海...",
          "对自己的能力产生了怀疑..."
        ],
        "solutions": [
          "通过不断学习和练习，逐渐提升了技术水平...",
          "调整了求职策略，更有针对性地投递简历...",
          "参加了一些技术分享会，扩展了人脉..."
        ],
        "conclusion": [
          "最终收到了心仪公司的offer，感谢这段经历...",
          "希望我的经验能帮助到正在求职的同学们...",
          "求职路虽然艰辛，但坚持下去一定会有收获..."
        ]
      }
    }
  }
}
```

## 🔧 本地数据生成

### 本地生成器配置
```javascript
// 本地生成器配置
const localGenerationConfig = {
  scriptPath: './scripts/simple-test-generator.js',
  databasePath: './data/survey.db',
  schemaPath: './schema.sql',
  outputFormat: 'json',
  batchSize: 100,
  maxConcurrency: 4,
  features: {
    includeVoices: true,
    includeImages: false,
    includeMetadata: true,
    deidentification: true
  }
};

// 生成统计
const generationStats = {
  questionnaires: {
    total: 500,
    pending: 150,
    approved: 350
  },
  stories: {
    total: 200,
    pending: 60,
    approved: 140
  },
  voices: {
    total: 450,
    autoGenerated: 400
  },
  users: {
    total: 100,
    anonymous: 70,
    verified: 30
  }
};
```

## 🚀 快速使用

### 1. 基础集成
```html
<!DOCTYPE html>
<html>
<head>
    <title>数据生成器</title>
    <link rel="stylesheet" href="components/DataGeneratorPanel.css">
</head>
<body>
    <div id="data-generator-container"></div>
    
    <script src="services/dataGenerationService.js"></script>
    <script src="components/DataGeneratorPanel.js"></script>
</body>
</html>
```

### 2. 初始化数据生成器
```javascript
// 创建数据生成器实例
const dataGenerator = new DataGeneratorPanel({
    container: '#data-generator-container',
    config: {
        defaultType: 'questionnaire',
        defaultCount: 15,
        defaultQuality: 'standard',
        enableAI: true,
        enableLocal: true
    },
    onGenerationStart: (config) => {
        console.log('开始生成数据:', config);
    },
    onGenerationProgress: (progress) => {
        console.log('生成进度:', progress);
    },
    onGenerationComplete: (result) => {
        console.log('生成完成:', result);
    },
    onError: (error) => {
        console.error('生成失败:', error);
    }
});
```

### 3. AI生成示例
```javascript
// AI驱动的问卷生成
async function generateQuestionnairesWithAI() {
    const config = {
        type: 'questionnaire',
        count: 15,
        quality: 'standard',
        aiProvider: 'openai',
        template: 'basic',
        options: {
            creativity: 0.7,
            diversity: 0.8,
            realism: 0.6
        }
    };
    
    try {
        const result = await DataGenerationService.startAIGeneration(config);
        console.log('AI生成任务已启动:', result.generationId);
        
        // 监控生成进度
        const monitor = new GenerationMonitor(result.generationId);
        monitor.onProgress = (progress) => {
            console.log(`进度: ${progress.completed}/${progress.total}`);
        };
        monitor.start();
        
    } catch (error) {
        console.error('AI生成失败:', error);
    }
}
```

### 4. 本地生成示例
```javascript
// 本地脚本生成
async function generateLocalTestData() {
    const config = {
        count: 100,
        type: 'questionnaire',
        features: {
            includeVoices: true,
            includeMetadata: true,
            deidentification: true
        },
        batchSize: 20,
        outputFormat: 'json'
    };
    
    try {
        const result = await LocalGeneratorService.generate(config);
        console.log('本地生成完成:', result);
        
        // 显示生成统计
        console.log(`生成了 ${result.questionnaires} 个问卷`);
        console.log(`生成了 ${result.voices} 个语音文件`);
        console.log(`审核通过率: ${result.reviewPassRate}%`);
        
    } catch (error) {
        console.error('本地生成失败:', error);
    }
}
```

## 📊 性能优化

### 分片处理
```javascript
// 大批量数据分片处理
class ChunkProcessor {
    constructor(chunkSize = 100, delay = 0) {
        this.chunkSize = chunkSize;
        this.delay = delay;
    }
    
    async process(data, processor, options = {}) {
        const {
            chunkSize = this.chunkSize,
            delay = this.delay,
            onProgress,
            onChunkComplete,
            signal
        } = options;
        
        const results = [];
        const totalChunks = Math.ceil(data.length / chunkSize);
        let processedChunks = 0;
        
        for (let i = 0; i < data.length; i += chunkSize) {
            if (signal?.aborted) {
                throw new Error('处理被取消');
            }
            
            const chunk = data.slice(i, i + chunkSize);
            const chunkResults = await processor(chunk);
            
            results.push(...chunkResults);
            processedChunks++;
            
            onProgress?.(processedChunks, totalChunks);
            onChunkComplete?.(chunk, chunkResults);
            
            if (delay > 0 && i + chunkSize < data.length) {
                await this.sleep(delay);
            }
        }
        
        return results;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### 并发控制
```javascript
// 并发控制信号量
class Semaphore {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.currentConcurrency = 0;
        this.queue = [];
    }
    
    async acquire() {
        return new Promise((resolve) => {
            if (this.currentConcurrency < this.maxConcurrency) {
                this.currentConcurrency++;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }
    
    release() {
        this.currentConcurrency--;
        if (this.queue.length > 0) {
            const resolve = this.queue.shift();
            this.currentConcurrency++;
            resolve();
        }
    }
}
```

## 🔍 数据验证

### 验证规则
```javascript
// 数据验证器
class DataValidator {
    static validateQuestionnaire(data) {
        const errors = [];
        
        // 必填字段验证
        const requiredFields = ['educationLevel', 'major', 'graduationYear', 'region'];
        requiredFields.forEach(field => {
            if (!data[field]) {
                errors.push(`缺少必填字段: ${field}`);
            }
        });
        
        // 格式验证
        if (data.graduationYear && (data.graduationYear < 2020 || data.graduationYear > 2024)) {
            errors.push('毕业年份超出有效范围');
        }
        
        // 内容长度验证
        if (data.adviceForStudents && data.adviceForStudents.length < 10) {
            errors.push('建议内容过短');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    static validateStory(data) {
        const errors = [];
        
        if (!data.title || data.title.length < 5) {
            errors.push('标题过短');
        }
        
        if (!data.content || data.content.length < 50) {
            errors.push('内容过短');
        }
        
        if (!data.category) {
            errors.push('缺少分类');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
```

## 📈 监控和统计

### 实时监控
```javascript
// 性能监控器
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            apiResponseTime: 0,
            successRate: 0,
            errorRate: 0,
            generationEfficiency: 0,
            totalOperations: 0
        };
        this.events = [];
    }
    
    recordEvent(type, data) {
        const event = {
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toISOString(),
            duration: data.duration || 0
        };
        
        this.events.unshift(event);
        this.events = this.events.slice(0, 100); // 保留最近100个事件
        
        this.updateMetrics();
    }
    
    updateMetrics() {
        const recentEvents = this.events.slice(0, 50);
        const successEvents = recentEvents.filter(e => e.type === 'success');
        const errorEvents = recentEvents.filter(e => e.type === 'error');
        
        this.metrics.successRate = (successEvents.length / recentEvents.length) * 100;
        this.metrics.errorRate = (errorEvents.length / recentEvents.length) * 100;
        this.metrics.totalOperations = this.events.length;
        
        if (successEvents.length > 0) {
            this.metrics.apiResponseTime = successEvents.reduce((sum, e) => sum + e.duration, 0) / successEvents.length;
        }
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
    
    getRecentEvents(limit = 20) {
        return this.events.slice(0, limit);
    }
}
```

## 🎛️ 配置管理

### 动态配置
```javascript
// 配置管理器
class ConfigManager {
    constructor() {
        this.config = this.loadDefaultConfig();
    }
    
    loadDefaultConfig() {
        return {
            generation: {
                questionnaire: {
                    defaultCount: 15,
                    maxCount: 40,
                    defaultInterval: 60,
                    defaultBatchSize: 3
                },
                story: {
                    defaultCount: 8,
                    maxCount: 20,
                    defaultInterval: 90,
                    defaultBatchSize: 2
                }
            },
            aiProviders: {
                enabled: ['openai'],
                primary: 'openai',
                fallback: null
            },
            qualityControl: {
                defaultQuality: 'standard',
                enableValidation: true,
                enableReview: true
            }
        };
    }
    
    updateConfig(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        this.saveConfig();
    }
    
    getConfig(path) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current[key] === undefined) {
                return null;
            }
            current = current[key];
        }
        
        return current;
    }
    
    saveConfig() {
        localStorage.setItem('dataGeneratorConfig', JSON.stringify(this.config));
    }
    
    loadConfig() {
        const saved = localStorage.getItem('dataGeneratorConfig');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }
}
```

## 🧪 测试和调试

### 测试用例
```javascript
// 数据生成器测试套件
class DataGeneratorTests {
    static async runAllTests() {
        console.log('🧪 开始运行数据生成器测试...');
        
        const tests = [
            this.testBasicGeneration,
            this.testBatchProcessing,
            this.testValidation,
            this.testErrorHandling,
            this.testPerformance
        ];
        
        const results = [];
        for (const test of tests) {
            try {
                const result = await test();
                results.push({ name: test.name, success: true, result });
                console.log(`✅ ${test.name}: 通过`);
            } catch (error) {
                results.push({ name: test.name, success: false, error: error.message });
                console.log(`❌ ${test.name}: 失败 - ${error.message}`);
            }
        }
        
        return results;
    }
    
    static async testBasicGeneration() {
        const config = {
            type: 'questionnaire',
            count: 5,
            quality: 'basic'
        };
        
        const result = await LocalGeneratorService.generate(config);
        
        if (result.questionnaires !== 5) {
            throw new Error(`期望生成5个问卷，实际生成${result.questionnaires}个`);
        }
        
        return result;
    }
    
    static async testBatchProcessing() {
        const processor = new ChunkProcessor(10, 100);
        const data = Array.from({ length: 50 }, (_, i) => i);
        
        const results = await processor.process(data, async (chunk) => {
            return chunk.map(x => x * 2);
        });
        
        if (results.length !== 50) {
            throw new Error(`期望处理50个项目，实际处理${results.length}个`);
        }
        
        return results;
    }
    
    static async testValidation() {
        const validData = {
            educationLevel: '本科',
            major: '计算机科学',
            graduationYear: 2023,
            region: '北京',
            adviceForStudents: '这是一个有效的建议内容'
        };
        
        const result = DataValidator.validateQuestionnaire(validData);
        
        if (!result.isValid) {
            throw new Error(`有效数据验证失败: ${result.errors.join(', ')}`);
        }
        
        return result;
    }
}
```

## 📄 许可证

本项目遵循 MIT 许可证。
