#!/usr/bin/env node

/**
 * API文档生成工具
 * 自动生成或更新API文档，包括Swagger/OpenAPI规范
 */

const fs = require('fs');
const path = require('path');

class APIDocGenerator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.reportPath = path.join(this.projectRoot, 'docs/API_ANALYSIS_REPORT.json');
    
    // OpenAPI规范模板
    this.openApiSpec = {
      openapi: '3.0.3',
      info: {
        title: '就业调查系统 API',
        description: '大学生就业调查问卷系统的API文档',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
          description: '生产环境'
        },
        {
          url: 'http://localhost:8000',
          description: '开发环境'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        }
      },
      tags: []
    };
    
    // API分组标签
    this.apiTags = [
      { name: 'Authentication', description: '认证相关API' },
      { name: 'Questionnaire', description: '问卷相关API' },
      { name: 'Stories', description: '故事相关API' },
      { name: 'Analytics', description: '数据分析API' },
      { name: 'Admin', description: '管理员API' },
      { name: 'Reviewer', description: '审核员API' },
      { name: 'User', description: '用户API' },
      { name: 'System', description: '系统API' }
    ];
  }

  /**
   * 加载API分析报告
   */
  loadApiReport() {
    if (!fs.existsSync(this.reportPath)) {
      throw new Error('API分析报告不存在，请先运行 api-scanner.cjs');
    }
    
    const reportContent = fs.readFileSync(this.reportPath, 'utf8');
    return JSON.parse(reportContent);
  }

  /**
   * 生成OpenAPI规范
   */
  generateOpenApiSpec(apiInventory) {
    console.log('📝 生成OpenAPI规范...');
    
    // 添加标签
    this.openApiSpec.tags = this.apiTags;
    
    // 处理所有API端点
    const allApis = [
      ...apiInventory.backend.typescript,
      ...apiInventory.backend.python
    ];
    
    allApis.forEach(api => {
      this.addApiToSpec(api);
    });
    
    // 添加通用组件
    this.addCommonSchemas();
    
    return this.openApiSpec;
  }

  /**
   * 添加API到规范中
   */
  addApiToSpec(api) {
    const path = api.path;
    const cleanPath = this.convertToOpenApiPath(path);
    
    if (!this.openApiSpec.paths[cleanPath]) {
      this.openApiSpec.paths[cleanPath] = {};
    }
    
    // 根据路径推断HTTP方法和操作
    const operations = this.inferOperations(path);
    
    operations.forEach(operation => {
      this.openApiSpec.paths[cleanPath][operation.method] = {
        tags: [this.getApiTag(path)],
        summary: operation.summary,
        description: operation.description,
        parameters: operation.parameters || [],
        responses: this.getStandardResponses(),
        security: this.getSecurityRequirements(path)
      };
      
      if (operation.requestBody) {
        this.openApiSpec.paths[cleanPath][operation.method].requestBody = operation.requestBody;
      }
    });
  }

  /**
   * 转换路径为OpenAPI格式
   */
  convertToOpenApiPath(path) {
    // 转换Python风格的参数为OpenAPI风格
    return path
      .replace(/<int:([^>]+)>/g, '{$1}')
      .replace(/<([^>]+)>/g, '{$1}')
      .replace(/:([^/]+)/g, '{$1}');
  }

  /**
   * 推断API操作
   */
  inferOperations(path) {
    const operations = [];
    
    // 根据路径特征推断操作
    if (path.includes('/submit') || path.includes('/create')) {
      operations.push({
        method: 'post',
        summary: `创建${this.getResourceName(path)}`,
        description: `创建新的${this.getResourceName(path)}记录`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateRequest' }
            }
          }
        }
      });
    } else if (path.includes('/update') || path.includes('/edit')) {
      operations.push({
        method: 'put',
        summary: `更新${this.getResourceName(path)}`,
        description: `更新指定的${this.getResourceName(path)}记录`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateRequest' }
            }
          }
        }
      });
    } else if (path.includes('/delete') || path.includes('/remove')) {
      operations.push({
        method: 'delete',
        summary: `删除${this.getResourceName(path)}`,
        description: `删除指定的${this.getResourceName(path)}记录`
      });
    } else if (path.includes('/list') || path.endsWith('s') || this.isCollectionEndpoint(path)) {
      operations.push({
        method: 'get',
        summary: `获取${this.getResourceName(path)}列表`,
        description: `获取${this.getResourceName(path)}的分页列表`,
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: '页码',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'pageSize',
            in: 'query',
            description: '每页数量',
            schema: { type: 'integer', default: 20 }
          }
        ]
      });
    } else if (this.hasPathParameter(path)) {
      operations.push({
        method: 'get',
        summary: `获取${this.getResourceName(path)}详情`,
        description: `获取指定${this.getResourceName(path)}的详细信息`,
        parameters: this.extractPathParameters(path)
      });
    } else {
      // 默认GET操作
      operations.push({
        method: 'get',
        summary: `获取${this.getResourceName(path)}`,
        description: `获取${this.getResourceName(path)}信息`
      });
    }
    
    return operations;
  }

  /**
   * 获取资源名称
   */
  getResourceName(path) {
    const segments = path.split('/').filter(s => s && s !== 'api');
    const resourceSegment = segments.find(s => !s.includes(':') && !s.includes('<') && !s.includes('{'));
    return resourceSegment || '资源';
  }

  /**
   * 获取API标签
   */
  getApiTag(path) {
    if (path.includes('/auth/')) return 'Authentication';
    if (path.includes('/admin/')) return 'Admin';
    if (path.includes('/reviewer/')) return 'Reviewer';
    if (path.includes('/user/')) return 'User';
    if (path.includes('/questionnaire/')) return 'Questionnaire';
    if (path.includes('/stories/')) return 'Stories';
    if (path.includes('/analytics/')) return 'Analytics';
    if (path.includes('/health') || path.includes('/version')) return 'System';
    return 'System';
  }

  /**
   * 判断是否为集合端点
   */
  isCollectionEndpoint(path) {
    const collectionPatterns = [
      '/users', '/stories', '/questionnaires', '/reviews', '/analytics'
    ];
    return collectionPatterns.some(pattern => path.includes(pattern));
  }

  /**
   * 判断是否有路径参数
   */
  hasPathParameter(path) {
    return path.includes(':') || path.includes('<') || path.includes('{');
  }

  /**
   * 提取路径参数
   */
  extractPathParameters(path) {
    const parameters = [];
    const paramMatches = path.match(/[:{<]([^>}/:]+)[>}]?/g);
    
    if (paramMatches) {
      paramMatches.forEach(match => {
        const paramName = match.replace(/[:{<>}]/g, '');
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          description: `${paramName}标识符`,
          schema: { type: 'string' }
        });
      });
    }
    
    return parameters;
  }

  /**
   * 获取标准响应
   */
  getStandardResponses() {
    return {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SuccessResponse' }
          }
        }
      },
      '400': {
        description: '请求参数错误',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '401': {
        description: '未授权',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '403': {
        description: '禁止访问',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '404': {
        description: '资源不存在',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '500': {
        description: '服务器内部错误',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    };
  }

  /**
   * 获取安全要求
   */
  getSecurityRequirements(path) {
    if (path.includes('/admin/') || path.includes('/reviewer/')) {
      return [{ bearerAuth: [] }];
    }
    if (path.includes('/user/') && !path.includes('/login')) {
      return [{ bearerAuth: [] }];
    }
    return [];
  }

  /**
   * 添加通用数据模型
   */
  addCommonSchemas() {
    this.openApiSpec.components.schemas = {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: '操作成功' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Bad Request' },
          message: { type: 'string', example: '请求参数错误' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object' } },
              pagination: { $ref: '#/components/schemas/Pagination' }
            }
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 }
        }
      },
      CreateRequest: {
        type: 'object',
        properties: {
          data: { type: 'object', description: '创建数据' }
        }
      },
      UpdateRequest: {
        type: 'object',
        properties: {
          data: { type: 'object', description: '更新数据' }
        }
      },
      Story: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: '我的就业故事' },
          content: { type: 'string', example: '这是我的就业经历...' },
          category: { type: 'string', example: 'success' },
          tags: { type: 'array', items: { type: 'string' } },
          authorName: { type: 'string', example: '匿名用户' },
          isAnonymous: { type: 'boolean', example: true },
          likeCount: { type: 'integer', example: 10 },
          viewCount: { type: 'integer', example: 100 },
          createdAt: { type: 'string', format: 'date-time' },
          publishedAt: { type: 'string', format: 'date-time' }
        }
      },
      Questionnaire: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'employment-survey-2024' },
          title: { type: 'string', example: '2024年就业调查问卷' },
          description: { type: 'string', example: '了解大学生就业情况' },
          questions: { type: 'array', items: { $ref: '#/components/schemas/Question' } },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Question: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'q1' },
          type: { type: 'string', enum: ['radio', 'checkbox', 'text', 'number'] },
          title: { type: 'string', example: '您的就业状态是？' },
          options: { type: 'array', items: { type: 'string' } },
          required: { type: 'boolean', example: true }
        }
      }
    };
  }

  /**
   * 生成Postman集合
   */
  generatePostmanCollection(apiInventory) {
    console.log('📮 生成Postman集合...');
    
    const collection = {
      info: {
        name: '就业调查系统 API',
        description: '大学生就业调查问卷系统的API集合',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{authToken}}',
            type: 'string'
          }
        ]
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
          type: 'string'
        },
        {
          key: 'authToken',
          value: '',
          type: 'string'
        }
      ],
      item: []
    };
    
    // 按标签分组API
    const apiGroups = this.groupApisByTag(apiInventory);
    
    Object.entries(apiGroups).forEach(([tag, apis]) => {
      const folder = {
        name: tag,
        item: []
      };
      
      apis.forEach(api => {
        const request = this.createPostmanRequest(api);
        folder.item.push(request);
      });
      
      collection.item.push(folder);
    });
    
    return collection;
  }

  /**
   * 按标签分组API
   */
  groupApisByTag(apiInventory) {
    const groups = {};
    const allApis = [
      ...apiInventory.backend.typescript,
      ...apiInventory.backend.python
    ];
    
    allApis.forEach(api => {
      const tag = this.getApiTag(api.path);
      if (!groups[tag]) {
        groups[tag] = [];
      }
      groups[tag].push(api);
    });
    
    return groups;
  }

  /**
   * 创建Postman请求
   */
  createPostmanRequest(api) {
    const operations = this.inferOperations(api.path);
    const operation = operations[0]; // 使用第一个操作
    
    return {
      name: operation.summary || api.path,
      request: {
        method: operation.method.toUpperCase(),
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
            type: 'text'
          }
        ],
        url: {
          raw: '{{baseUrl}}' + api.path,
          host: ['{{baseUrl}}'],
          path: api.path.split('/').filter(s => s)
        },
        description: operation.description || `${operation.method.toUpperCase()} ${api.path}`
      },
      response: []
    };
  }

  /**
   * 生成API文档
   */
  generateApiDocumentation(apiInventory) {
    console.log('📚 生成API文档...');
    
    const markdown = `# 就业调查系统 API 文档

## 概览

本文档描述了大学生就业调查问卷系统的所有API端点。

### 基础信息

- **基础URL**: \`https://employment-survey-api-prod.chrismarker89.workers.dev\`
- **API版本**: v1.0.0
- **认证方式**: Bearer Token

### 响应格式

所有API响应都遵循统一的格式：

\`\`\`json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

### 错误响应

\`\`\`json
{
  "success": false,
  "error": "Bad Request",
  "message": "请求参数错误",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

## API端点

${this.generateApiEndpointsMarkdown(apiInventory)}

## 认证

### Bearer Token

大部分API需要在请求头中包含认证令牌：

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

### API Key

某些公开API支持API Key认证：

\`\`\`
X-API-Key: <your-api-key>
\`\`\`

## 状态码

- **200**: 成功
- **201**: 创建成功
- **400**: 请求参数错误
- **401**: 未授权
- **403**: 禁止访问
- **404**: 资源不存在
- **500**: 服务器内部错误

## 限流

API请求受到限流保护：

- **匿名用户**: 100 请求/小时
- **认证用户**: 1000 请求/小时
- **管理员**: 10000 请求/小时

## 示例

### 获取故事列表

\`\`\`bash
curl -X GET "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories?page=1&pageSize=20" \\
  -H "Authorization: Bearer <your-token>"
\`\`\`

### 创建故事

\`\`\`bash
curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories" \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "我的就业故事",
    "content": "这是我的就业经历...",
    "category": "success",
    "tags": ["就业", "成功"]
  }'
\`\`\`
`;

    return markdown;
  }

  /**
   * 生成API端点Markdown
   */
  generateApiEndpointsMarkdown(apiInventory) {
    const apiGroups = this.groupApisByTag(apiInventory);
    let markdown = '';
    
    Object.entries(apiGroups).forEach(([tag, apis]) => {
      markdown += `\n### ${tag}\n\n`;
      
      apis.forEach(api => {
        const operations = this.inferOperations(api.path);
        operations.forEach(operation => {
          markdown += `#### ${operation.method.toUpperCase()} ${api.path}\n\n`;
          markdown += `${operation.description}\n\n`;
          
          if (operation.parameters && operation.parameters.length > 0) {
            markdown += '**参数:**\n\n';
            operation.parameters.forEach(param => {
              markdown += `- \`${param.name}\` (${param.in}): ${param.description}\n`;
            });
            markdown += '\n';
          }
          
          markdown += '**响应示例:**\n\n';
          markdown += '```json\n';
          markdown += JSON.stringify({
            success: true,
            data: {},
            message: '操作成功'
          }, null, 2);
          markdown += '\n```\n\n';
        });
      });
    });
    
    return markdown;
  }

  /**
   * 保存所有文档
   */
  saveDocumentation(openApiSpec, postmanCollection, apiDocumentation) {
    console.log('💾 保存文档文件...');
    
    // 保存OpenAPI规范
    const openApiPath = path.join(this.projectRoot, 'docs/openapi.json');
    fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2));
    console.log(`📄 OpenAPI规范已保存到: ${openApiPath}`);
    
    // 保存Postman集合
    const postmanPath = path.join(this.projectRoot, 'docs/postman-collection.json');
    fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2));
    console.log(`📮 Postman集合已保存到: ${postmanPath}`);
    
    // 保存API文档
    const docPath = path.join(this.projectRoot, 'docs/API_DOCUMENTATION.md');
    fs.writeFileSync(docPath, apiDocumentation);
    console.log(`📚 API文档已保存到: ${docPath}`);
  }

  /**
   * 运行文档生成
   */
  async run() {
    console.log('🚀 开始生成API文档...\n');
    
    try {
      const apiReport = this.loadApiReport();
      const apiInventory = apiReport.inventory;
      
      const openApiSpec = this.generateOpenApiSpec(apiInventory);
      const postmanCollection = this.generatePostmanCollection(apiInventory);
      const apiDocumentation = this.generateApiDocumentation(apiInventory);
      
      this.saveDocumentation(openApiSpec, postmanCollection, apiDocumentation);
      
      console.log('\n✅ API文档生成完成!');
      console.log(`📊 生成了 ${Object.keys(openApiSpec.paths).length} 个API端点的文档`);
      console.log(`📮 创建了 ${postmanCollection.item.length} 个API分组的Postman集合`);
      
      return {
        openApiSpec,
        postmanCollection,
        apiDocumentation
      };
    } catch (error) {
      console.error('❌ 文档生成失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new APIDocGenerator();
  generator.run().catch(console.error);
}

module.exports = APIDocGenerator;
