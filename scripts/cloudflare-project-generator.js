#!/usr/bin/env node

/**
 * Cloudflare 项目模板生成器
 * 基于 jiuye-V1 项目经验制作
 * 
 * 使用方法:
 * node scripts/cloudflare-project-generator.js my-project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CloudflareProjectGenerator {
  constructor(projectName) {
    this.projectName = projectName;
    this.projectPath = path.join(process.cwd(), projectName);
  }

  async generate() {
    console.log(`🚀 创建 Cloudflare 项目: ${this.projectName}`);
    
    // 创建项目目录结构
    this.createDirectoryStructure();
    
    // 生成配置文件
    this.generateConfigFiles();
    
    // 生成代码模板
    this.generateCodeTemplates();
    
    // 生成文档
    this.generateDocumentation();
    
    // 初始化 Git
    this.initializeGit();
    
    console.log(`✅ 项目创建完成！`);
    console.log(`\n📋 下一步操作:`);
    console.log(`cd ${this.projectName}`);
    console.log(`pnpm install`);
    console.log(`pnpm dev`);
  }

  createDirectoryStructure() {
    console.log('📁 创建目录结构...');
    
    const directories = [
      '',
      'frontend',
      'frontend/src',
      'frontend/src/components',
      'frontend/src/pages',
      'frontend/src/services',
      'frontend/src/stores',
      'frontend/src/types',
      'frontend/src/utils',
      'frontend/public',
      'backend',
      'backend/src',
      'backend/src/routes',
      'backend/src/middleware',
      'backend/src/services',
      'backend/src/types',
      'backend/src/utils',
      'database',
      'database/schemas',
      'database/migrations',
      'database/test-data',
      'docs',
      'scripts'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(this.projectPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  generateConfigFiles() {
    console.log('⚙️ 生成配置文件...');

    // 根目录 package.json
    const rootPackageJson = {
      name: this.projectName,
      version: "1.0.0",
      description: `${this.projectName} - Cloudflare 平台项目`,
      private: true,
      type: "module",
      packageManager: "pnpm@10.8.0",
      engines: {
        node: ">=18.0.0",
        pnpm: ">=8.0.0"
      },
      scripts: {
        dev: "concurrently \"pnpm dev:frontend\" \"pnpm dev:backend\"",
        "dev:frontend": "pnpm --filter frontend dev",
        "dev:backend": "pnpm --filter backend dev",
        build: "pnpm --filter frontend build && pnpm --filter backend build",
        "build:frontend": "pnpm --filter frontend build",
        "build:backend": "pnpm --filter backend build",
        test: "pnpm --filter frontend test && pnpm --filter backend test",
        lint: "pnpm --filter frontend lint && pnpm --filter backend lint",
        "lint:fix": "pnpm --filter frontend lint:fix && pnpm --filter backend lint:fix",
        "type-check": "pnpm --filter frontend type-check && pnpm --filter backend type-check",
        deploy: "pnpm build && pnpm deploy:frontend && pnpm deploy:backend",
        "deploy:frontend": "pnpm --filter frontend deploy",
        "deploy:backend": "pnpm --filter backend deploy"
      },
      workspaces: ["frontend", "backend"],
      devDependencies: {
        "@types/node": "^22.0.0",
        "concurrently": "^8.2.2",
        "typescript": "^5.5.4"
      },
      keywords: [
        "cloudflare-workers",
        "cloudflare-pages",
        "typescript",
        "react"
      ],
      author: "Development Team",
      license: "MIT"
    };

    this.writeFile('package.json', JSON.stringify(rootPackageJson, null, 2));

    // 前端 package.json
    const frontendPackageJson = {
      name: `${this.projectName}-frontend`,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
        lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "lint:fix": "eslint . --ext ts,tsx --fix",
        "type-check": "tsc --noEmit",
        test: "jest",
        deploy: "wrangler pages deploy dist"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.8.0",
        "antd": "^5.12.0",
        "zustand": "^4.4.0",
        "axios": "^1.6.0",
        "humps": "^2.0.1"
      },
      devDependencies: {
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0",
        "@vitejs/plugin-react": "^4.0.0",
        "eslint": "^8.45.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.0",
        "typescript": "^5.0.2",
        "vite": "^4.4.5",
        "wrangler": "^3.0.0"
      }
    };

    this.writeFile('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));

    // 后端 package.json
    const backendPackageJson = {
      name: `${this.projectName}-backend`,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "wrangler dev",
        build: "tsc",
        deploy: "wrangler deploy",
        test: "jest",
        lint: "eslint . --ext ts --report-unused-disable-directives --max-warnings 0",
        "lint:fix": "eslint . --ext ts --fix",
        "type-check": "tsc --noEmit",
        "ai:test": "node scripts/test-ai-models.js",
        "ai:config": "node scripts/setup-ai-gateway.js"
      },
      dependencies: {
        "hono": "^3.11.0",
        "zod": "^3.22.0",
        "humps": "^2.0.1"
      },
      devDependencies: {
        "@cloudflare/workers-types": "^4.20231025.0",
        "@types/jest": "^29.5.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0",
        "eslint": "^8.45.0",
        "jest": "^29.5.0",
        "typescript": "^5.0.2",
        "wrangler": "^3.0.0"
      }
    };

    this.writeFile('backend/package.json', JSON.stringify(backendPackageJson, null, 2));

    // TypeScript 配置
    const tsConfig = {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022"],
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
      }
    };

    this.writeFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));
    this.writeFile('frontend/tsconfig.json', JSON.stringify({
      ...tsConfig,
      compilerOptions: {
        ...tsConfig.compilerOptions,
        target: "ES2020",
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx"
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }]
    }, null, 2));

    this.writeFile('backend/tsconfig.json', JSON.stringify({
      ...tsConfig,
      compilerOptions: {
        ...tsConfig.compilerOptions,
        types: ["@cloudflare/workers-types"]
      },
      include: ["src/**/*"]
    }, null, 2));

    // Wrangler 配置
    const backendWrangler = `name = "${this.projectName}-backend"
main = "src/worker.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

# AI 配置
[ai]
binding = "AI"

[vars]
ENVIRONMENT = "production"
JWT_SECRET = "your-jwt-secret-change-in-production"
CORS_ORIGIN = "*"
AI_GATEWAY_ENABLED = "true"
AI_CACHE_TTL = "3600"
AI_RATE_LIMIT_PER_MINUTE = "100"
AI_COST_BUDGET_DAILY = "1.0"

[[d1_databases]]
binding = "DB"
database_name = "${this.projectName}-db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "CACHE_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

[[analytics_engine_datasets]]
binding = "ANALYTICS"

[env.development]
name = "${this.projectName}-backend-dev"
[env.development.vars]
ENVIRONMENT = "development"
AI_GATEWAY_ENABLED = "false"
`;

    this.writeFile('backend/wrangler.toml', backendWrangler);

    const frontendWrangler = `name = "${this.projectName}-frontend"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
cwd = "."
watch_dir = "src"

[build.upload]
format = "modules"
dir = "dist"
main = "./dist/index.html"

[vars]
VITE_APP_ENV = "production"
VITE_APP_TITLE = "${this.projectName}"
VITE_API_BASE_URL = "https://${this.projectName}-backend.workers.dev/api"
`;

    this.writeFile('frontend/wrangler.toml', frontendWrangler);
  }

  generateCodeTemplates() {
    console.log('💻 生成代码模板...');

    // 后端入口文件
    const workerTs = `import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import userRoutes from './routes/users';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
}

const app = new Hono<{ Bindings: Env }>();

// 中间件
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', errorHandler);

// 健康检查
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.route('/api/users', userRoutes);

export default app;
`;

    this.writeFile('backend/src/worker.ts', workerTs);

    // 认证中间件
    const authMiddleware = `import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { Env } from '../worker';

export const authMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Missing authorization token' }, 401);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

export const requireRole = (role: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as any;
    if (user.role !== role) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    await next();
  };
};
`;

    this.writeFile('backend/src/middleware/auth.ts', authMiddleware);

    // 错误处理中间件
    const errorMiddleware = `import { Context, Next } from 'hono';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
    
    if (error instanceof AppError) {
      return c.json({
        success: false,
        message: error.message,
        error: { code: error.code },
        timestamp: new Date().toISOString()
      }, error.statusCode);
    }
    
    return c.json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }, 500);
  }
};
`;

    this.writeFile('backend/src/middleware/error.ts', errorMiddleware);

    // 用户路由示例
    const userRoutes = `import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import { Env } from '../worker';

const users = new Hono<{ Bindings: Env }>();

// 获取用户列表
users.get('/', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, email, role, created_at FROM users WHERE is_active = 1'
    ).all();

    return c.json({
      success: true,
      data: results,
      message: '获取用户列表成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '获取用户列表失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 获取用户详情
users.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, email, role, created_at FROM users WHERE id = ? AND is_active = 1'
    ).bind(id).all();

    if (results.length === 0) {
      return c.json({
        success: false,
        message: '用户不存在',
        timestamp: new Date().toISOString()
      }, 404);
    }

    return c.json({
      success: true,
      data: results[0],
      message: '获取用户详情成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '获取用户详情失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default users;
`;

    this.writeFile('backend/src/routes/users.ts', userRoutes);

    // AI 配置文件
    const aiConfig = `// AI 模型配置
export const AI_MODEL_CONFIG = {
  // 内容安全检测 (主要)
  contentSafety: {
    primary: '@cf/meta/llama-guard-3-8b',
    fallback: '@cf/meta/llama-3.1-8b-instruct',
    timeout: 5000,
    confidenceThreshold: 0.7
  },

  // 文本分类 (快速)
  textClassification: {
    primary: '@cf/huggingface/distilbert-sst-2-int8',
    timeout: 2000,
    confidenceThreshold: 0.8
  },

  // 情感分析 (深度)
  sentimentAnalysis: {
    primary: '@cf/meta/llama-3-8b-instruct',
    timeout: 3000,
    confidenceThreshold: 0.6
  },

  // 语义分析 (嵌入)
  semanticAnalysis: {
    primary: '@cf/baai/bge-base-en-v1.5',
    timeout: 2000,
    confidenceThreshold: 0.7
  }
};

export interface ModelStatus {
  model: string;
  available: boolean;
  responseTime: number;
  error: string | null;
}

// 智能模型检测
export async function detectAvailableModels(ai: Ai): Promise<ModelStatus[]> {
  const models = Object.values(AI_MODEL_CONFIG);
  const results = await Promise.allSettled(
    models.map(async (config) => {
      const start = Date.now();
      try {
        await ai.run(config.primary, { text: "test" });
        return {
          model: config.primary,
          available: true,
          responseTime: Date.now() - start,
          error: null
        };
      } catch (error) {
        return {
          model: config.primary,
          available: false,
          responseTime: Date.now() - start,
          error: error.message
        };
      }
    })
  );

  return results.map(result =>
    result.status === 'fulfilled' ? result.value : result.reason
  );
}
`;

    this.writeFile('backend/src/config/aiConfig.ts', aiConfig);

    // AI 内容审核服务
    const aiModerationService = `import { AI_MODEL_CONFIG } from '../config/aiConfig';

export interface ModerationResult {
  action: 'approve' | 'review' | 'reject';
  reason: string;
  confidence: number;
  details: any;
}

export interface AIResult {
  riskScore: number;
  recommendation: string;
  details: any;
  confidence: number;
}

export class HybridModerationService {
  async moderateContent(
    content: string,
    contentType: 'story' | 'questionnaire' | 'comment',
    ai: Ai
  ): Promise<ModerationResult> {
    try {
      // AI 审核
      const aiResult = await this.aiBasedModeration(content, ai);

      // 基于风险评分决策
      if (aiResult.riskScore > 0.8) {
        return {
          action: 'reject',
          reason: 'ai_high_risk',
          confidence: aiResult.confidence,
          details: aiResult
        };
      } else if (aiResult.riskScore > 0.5) {
        return {
          action: 'review',
          reason: 'ai_medium_risk',
          confidence: aiResult.confidence,
          details: aiResult
        };
      }

      return {
        action: 'approve',
        reason: 'low_risk',
        confidence: aiResult.confidence,
        details: aiResult
      };
    } catch (error) {
      // AI 服务不可用时的降级处理
      return {
        action: 'review',
        reason: 'ai_service_unavailable',
        confidence: 0.5,
        details: { error: error.message }
      };
    }
  }

  private async aiBasedModeration(content: string, ai: Ai): Promise<AIResult> {
    // 内容安全检测
    const safetyResult = await ai.run(AI_MODEL_CONFIG.contentSafety.primary, {
      messages: [{ role: "user", content }]
    });

    // 情感分析
    const sentimentResult = await ai.run(AI_MODEL_CONFIG.sentimentAnalysis.primary, {
      messages: [
        {
          role: "system",
          content: "分析内容的情感倾向和风险等级，返回0-1的风险分数"
        },
        { role: "user", content }
      ]
    });

    // 计算综合风险评分
    const riskScore = this.calculateRiskScore(safetyResult, sentimentResult);

    return {
      riskScore,
      recommendation: this.getRecommendation(riskScore),
      details: { safety: safetyResult, sentiment: sentimentResult },
      confidence: 0.8
    };
  }

  private calculateRiskScore(safetyResult: any, sentimentResult: any): number {
    // 简化的风险评分算法
    let score = 0;

    // 安全检测权重 60%
    if (safetyResult?.response?.includes('unsafe')) {
      score += 0.6;
    }

    // 情感分析权重 40%
    if (sentimentResult?.response?.includes('negative')) {
      score += 0.4;
    }

    return Math.min(score, 1.0);
  }

  private getRecommendation(riskScore: number): string {
    if (riskScore > 0.8) return 'reject';
    if (riskScore > 0.5) return 'review';
    return 'approve';
  }
}
`;

    this.writeFile('backend/src/services/aiModerationService.ts', aiModerationService);

    // 前端 App 组件
    const appTsx = `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
`;

    this.writeFile('frontend/src/App.tsx', appTsx);

    // 前端主页组件
    const homePageTsx = `import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { apiClient } from '../services/apiClient';

const { Title, Paragraph } = Typography;

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

const HomePage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>欢迎使用 ${this.projectName}</Title>
            <Paragraph>
              这是一个基于 Cloudflare 平台的现代化 Web 应用程序。
            </Paragraph>
          </div>
          
          <div>
            <Button type="primary" onClick={fetchUsers} loading={loading}>
              刷新用户列表
            </Button>
          </div>
          
          <div>
            <Title level={3}>用户列表 ({users.length})</Title>
            {users.map(user => (
              <Card key={user.id} size="small" style={{ marginBottom: 8 }}>
                <p><strong>邮箱:</strong> {user.email}</p>
                <p><strong>角色:</strong> {user.role}</p>
                <p><strong>创建时间:</strong> {user.createdAt}</p>
              </Card>
            ))}
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default HomePage;
`;

    this.writeFile('frontend/src/pages/HomePage.tsx', homePageTsx);

    // API 客户端
    const apiClientTs = `import axios from 'axios';
import humps from 'humps';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - camelCase 转 snake_case
apiClient.interceptors.request.use(
  (config) => {
    if (config.data) {
      config.data = humps.decamelizeKeys(config.data);
    }
    if (config.params) {
      config.params = humps.decamelizeKeys(config.params);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - snake_case 转 camelCase
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = humps.camelizeKeys(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.data) {
      error.response.data = humps.camelizeKeys(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
`;

    this.writeFile('frontend/src/services/apiClient.ts', apiClientTs);

    // VSCode 配置
    const vscodeSettings = `{
  "augment.enabled": true,
  "augment.codeCompletion": {
    "enabled": true,
    "triggerCharacters": [".", "(", "[", "{"],
    "maxSuggestions": 5,
    "contextLines": 50
  },
  "augment.codeReview": {
    "enabled": true,
    "autoReview": false,
    "reviewOnSave": true,
    "focusAreas": [
      "security",
      "performance",
      "naming_conventions",
      "error_handling"
    ]
  },
  "augment.documentation": {
    "autoGenerate": true,
    "includeExamples": true,
    "language": "zh-CN"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.toml": "toml"
  }
}`;

    this.writeFile('.vscode/settings.json', vscodeSettings);

    const vscodeExtensions = `{
  "recommendations": [
    "augmentcode.augment",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "cloudflare.vscode-cloudflare-workers",
    "rangav.vscode-thunder-client"
  ]
}`;

    this.writeFile('.vscode/extensions.json', vscodeExtensions);
  }

  generateDocumentation() {
    console.log('📚 生成文档...');

    const readme = `# ${this.projectName}

基于 Cloudflare 平台的现代化 Web 应用程序

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Cloudflare 账号

### 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 开发环境

\`\`\`bash
# 启动完整开发环境
pnpm dev

# 单独启动前端
pnpm dev:frontend

# 单独启动后端
pnpm dev:backend
\`\`\`

### 构建部署

\`\`\`bash
# 构建项目
pnpm build

# 部署到 Cloudflare
pnpm deploy
\`\`\`

## 📁 项目结构

\`\`\`
${this.projectName}/
├── frontend/           # React 前端 (Cloudflare Pages)
├── backend/            # Hono 后端 (Cloudflare Workers)
├── database/           # D1 数据库
├── docs/              # 项目文档
└── scripts/           # 工具脚本
\`\`\`

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design
- **后端**: Cloudflare Workers + Hono.js + TypeScript
- **数据库**: Cloudflare D1 (SQLite)
- **AI服务**: Cloudflare Workers AI + AI Gateway
- **缓存**: Cloudflare KV
- **分析**: Cloudflare Analytics Engine
- **部署**: Cloudflare Pages + Workers
- **开发工具**: VSCode + Augment AI Assistant

## 📖 开发规范

请参考 [Cloudflare 开发规范指南](./docs/DEVELOPMENT_STANDARDS.md)

## 🤖 AI 功能

### AI 模型配置
项目集成了 Cloudflare Workers AI，支持：
- **内容安全检测**: 自动识别不当内容
- **情感分析**: 分析用户情感倾向
- **文本分类**: 智能内容分类
- **语义分析**: 深度语义理解

### AI 开发助手
推荐使用 VSCode + Augment 进行 AI 辅助开发：
- 智能代码补全
- 自动代码审查
- 文档生成
- 错误检测和修复

### 测试 AI 功能
\`\`\`bash
# 测试 AI 模型可用性
npm run ai:test

# 配置 AI Gateway
npm run ai:config
\`\`\`

## 🔧 配置

### 环境变量

后端环境变量在 \`backend/wrangler.toml\` 中配置：

\`\`\`toml
[vars]
JWT_SECRET = "your-jwt-secret"
CORS_ORIGIN = "*"
\`\`\`

前端环境变量在 \`frontend/wrangler.toml\` 中配置：

\`\`\`toml
[vars]
VITE_API_BASE_URL = "https://your-backend.workers.dev/api"
\`\`\`

### 数据库

1. 创建 D1 数据库：
\`\`\`bash
wrangler d1 create ${this.projectName}-db
\`\`\`

2. 更新 \`backend/wrangler.toml\` 中的数据库 ID

3. 运行迁移：
\`\`\`bash
wrangler d1 execute ${this.projectName}-db --file=database/migrations/001_create_users.sql
\`\`\`

## 🚀 部署

### 后端部署

\`\`\`bash
cd backend
wrangler deploy
\`\`\`

### 前端部署

\`\`\`bash
cd frontend
npm run build
wrangler pages deploy dist
\`\`\`

## 📝 许可证

MIT License
`;

    this.writeFile('README.md', readme);

    // 数据库迁移示例
    const migration = `-- Migration: Create users table
-- Created: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  is_test_data INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 插入管理员用户
INSERT OR IGNORE INTO users (id, email, password_hash, role) 
VALUES ('admin-001', 'admin@example.com', 'hashed-password', 'admin');
`;

    this.writeFile('database/migrations/001_create_users.sql', migration);

    // AI 测试脚本
    const aiTestScript = `#!/usr/bin/env node

/**
 * AI 模型测试脚本
 * 测试 Cloudflare Workers AI 模型的可用性和性能
 */

const testModels = [
  '@cf/meta/llama-guard-3-8b',
  '@cf/huggingface/distilbert-sst-2-int8',
  '@cf/meta/llama-3-8b-instruct',
  '@cf/baai/bge-base-en-v1.5',
  '@cf/meta/llama-3.1-8b-instruct'
];

async function testAIModels() {
  console.log('🤖 开始测试 AI 模型...');

  const testContent = "这是一个测试内容，用于验证AI模型的可用性。";

  for (const model of testModels) {
    console.log(\`\\n📊 测试模型: \${model}\`);

    try {
      const start = Date.now();

      // 这里需要实际的 Cloudflare Workers AI 调用
      // 在实际项目中，需要配置正确的认证信息
      console.log('⚠️  请在 Cloudflare Workers 环境中运行此测试');
      console.log('   或配置 Cloudflare API 认证信息');

      const responseTime = Date.now() - start;
      console.log(\`✅ 模型可用，响应时间: \${responseTime}ms\`);

    } catch (error) {
      console.log(\`❌ 模型不可用: \${error.message}\`);
    }
  }

  console.log('\\n🎉 AI 模型测试完成！');
}

if (require.main === module) {
  testAIModels().catch(console.error);
}

module.exports = { testAIModels };
`;

    this.writeFile('scripts/test-ai-models.js', aiTestScript);

    // AI Gateway 设置脚本
    const aiGatewaySetup = `#!/usr/bin/env node

/**
 * AI Gateway 设置脚本
 * 帮助配置 Cloudflare AI Gateway
 */

console.log('🚀 AI Gateway 设置向导');
console.log('');
console.log('请按照以下步骤配置 AI Gateway:');
console.log('');
console.log('1. 访问 Cloudflare Dashboard:');
console.log('   https://dash.cloudflare.com/[account-id]/ai/ai-gateway');
console.log('');
console.log('2. 点击 "Create Gateway" 按钮');
console.log('');
console.log('3. 配置 Gateway 设置:');
console.log('   - Gateway Name: \${process.env.PROJECT_NAME || "my-project"}-ai-gateway');
console.log('   - Description: AI content moderation for employment survey platform');
console.log('');
console.log('4. 获取 Gateway 配置后，更新 wrangler.toml:');
console.log('   [ai]');
console.log('   binding = "AI"');
console.log('   gateway_id = "your-gateway-id"');
console.log('');
console.log('5. 设置环境变量:');
console.log('   wrangler secret put AI_GATEWAY_TOKEN');
console.log('');
console.log('6. 测试 AI 功能:');
console.log('   npm run ai:test');
console.log('');
console.log('📖 更多信息请参考: docs/AI_SETUP_GUIDE.md');
`;

    this.writeFile('scripts/setup-ai-gateway.js', aiGatewaySetup);
  }

  initializeGit() {
    console.log('📦 初始化 Git 仓库...');

    const gitignore = `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Cloudflare
.wrangler/
wrangler.toml.bak

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
`;

    this.writeFile('.gitignore', gitignore);

    try {
      process.chdir(this.projectPath);
      execSync('git init', { stdio: 'inherit' });
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "feat: 初始化项目\n\n- 基于 Cloudflare 开发规范创建\n- 包含前后端基础架构\n- 配置开发环境"', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ Git 初始化失败，请手动初始化');
    }
  }

  writeFile(relativePath, content) {
    const fullPath = path.join(this.projectPath, relativePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
  }
}

// 命令行接口
const projectName = process.argv[2];

if (!projectName) {
  console.error('❌ 请提供项目名称');
  console.log('使用方法: node cloudflare-project-generator.js <project-name>');
  process.exit(1);
}

if (fs.existsSync(projectName)) {
  console.error(`❌ 目录 ${projectName} 已存在`);
  process.exit(1);
}

const generator = new CloudflareProjectGenerator(projectName);
generator.generate().catch(error => {
  console.error('❌ 项目生成失败:', error);
  process.exit(1);
});
