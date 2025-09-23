#!/usr/bin/env node

/**
 * API测试用例生成工具
 * 根据API定义生成测试脚本，覆盖成功、失败、异常输入等场景
 */

const fs = require('fs');
const path = require('path');

class APITestGenerator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.reportPath = path.join(this.projectRoot, 'docs/API_ANALYSIS_REPORT.json');
    this.testsDir = path.join(this.projectRoot, 'tests/api');
    
    // 确保测试目录存在
    if (!fs.existsSync(this.testsDir)) {
      fs.mkdirSync(this.testsDir, { recursive: true });
    }
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
   * 生成Jest测试套件
   */
  generateJestTests(apiInventory) {
    console.log('🧪 生成Jest测试套件...');
    
    // 按标签分组API
    const apiGroups = this.groupApisByTag(apiInventory);
    
    Object.entries(apiGroups).forEach(([tag, apis]) => {
      this.generateTestFileForTag(tag, apis);
    });
    
    // 生成测试配置文件
    this.generateJestConfig();
    this.generateTestSetup();
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
   * 为标签生成测试文件
   */
  generateTestFileForTag(tag, apis) {
    const fileName = `${tag.toLowerCase()}.test.js`;
    const filePath = path.join(this.testsDir, fileName);
    
    let testContent = `/**
 * ${tag} API 测试套件
 * 自动生成的API测试用例
 */

const request = require('supertest');
const { setupTestApp, teardownTestApp, getAuthToken } = require('./setup');

describe('${tag} API Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

`;

    apis.forEach(api => {
      testContent += this.generateTestCasesForApi(api);
    });

    testContent += '});';

    fs.writeFileSync(filePath, testContent);
    console.log(`  ✅ 生成测试文件: ${fileName}`);
  }

  /**
   * 为API生成测试用例
   */
  generateTestCasesForApi(api) {
    const operations = this.inferOperations(api.path);
    let testCases = '';

    operations.forEach(operation => {
      testCases += `
  describe('${operation.method.toUpperCase()} ${api.path}', () => {
    ${this.generateSuccessTest(api, operation)}
    ${this.generateErrorTests(api, operation)}
    ${this.generateEdgeCaseTests(api, operation)}
  });
`;
    });

    return testCases;
  }

  /**
   * 生成成功测试用例
   */
  generateSuccessTest(api, operation) {
    const needsAuth = this.needsAuthentication(api.path);
    const hasPathParams = this.hasPathParameter(api.path);
    const hasRequestBody = operation.method === 'post' || operation.method === 'put';

    let testCode = `
    it('should ${operation.summary || 'work successfully'}', async () => {
      const response = await request(app)
        .${operation.method}('${this.getTestPath(api.path)}')`;

    if (needsAuth) {
      testCode += `
        .set('Authorization', \`Bearer \${authToken}\`)`;
    }

    if (hasRequestBody) {
      testCode += `
        .send(${this.generateValidRequestBody(api.path)})`;
    }

    testCode += `
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      ${this.generateResponseValidation(api.path, operation)}
    });`;

    return testCode;
  }

  /**
   * 生成错误测试用例
   */
  generateErrorTests(api, operation) {
    let errorTests = '';

    // 401 未授权测试
    if (this.needsAuthentication(api.path)) {
      errorTests += `
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .${operation.method}('${this.getTestPath(api.path)}')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });`;
    }

    // 400 参数错误测试
    if (operation.method === 'post' || operation.method === 'put') {
      errorTests += `
    it('should return 400 with invalid request body', async () => {
      const response = await request(app)
        .${operation.method}('${this.getTestPath(api.path)}')${this.needsAuthentication(api.path) ? `
        .set('Authorization', \`Bearer \${authToken}\`)` : ''}
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });`;
    }

    // 404 资源不存在测试
    if (this.hasPathParameter(api.path)) {
      errorTests += `
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .${operation.method}('${this.getTestPath(api.path, 'nonexistent')}')${this.needsAuthentication(api.path) ? `
        .set('Authorization', \`Bearer \${authToken}\`)` : ''}
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });`;
    }

    return errorTests;
  }

  /**
   * 生成边界情况测试
   */
  generateEdgeCaseTests(api, operation) {
    let edgeTests = '';

    // 分页测试
    if (this.isListEndpoint(api.path)) {
      edgeTests += `
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('${this.getTestPath(api.path)}?page=1&pageSize=5')${this.needsAuthentication(api.path) ? `
        .set('Authorization', \`Bearer \${authToken}\`)` : ''}
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('${this.getTestPath(api.path)}?page=-1&pageSize=0')${this.needsAuthentication(api.path) ? `
        .set('Authorization', \`Bearer \${authToken}\`)` : ''}
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });`;
    }

    // 大数据量测试
    if (operation.method === 'post') {
      edgeTests += `
    it('should handle large request payload', async () => {
      const largeData = ${this.generateLargeRequestBody(api.path)};
      
      const response = await request(app)
        .post('${this.getTestPath(api.path)}')${this.needsAuthentication(api.path) ? `
        .set('Authorization', \`Bearer \${authToken}\`)` : ''}
        .send(largeData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });`;
    }

    return edgeTests;
  }

  /**
   * 推断API操作
   */
  inferOperations(path) {
    const operations = [];
    
    if (path.includes('/submit') || path.includes('/create')) {
      operations.push({ method: 'post', summary: `创建${this.getResourceName(path)}` });
    } else if (path.includes('/update') || path.includes('/edit')) {
      operations.push({ method: 'put', summary: `更新${this.getResourceName(path)}` });
    } else if (path.includes('/delete') || path.includes('/remove')) {
      operations.push({ method: 'delete', summary: `删除${this.getResourceName(path)}` });
    } else {
      operations.push({ method: 'get', summary: `获取${this.getResourceName(path)}` });
    }
    
    return operations;
  }

  /**
   * 获取资源名称
   */
  getResourceName(path) {
    const segments = path.split('/').filter(s => s && s !== 'api');
    return segments[segments.length - 1] || '资源';
  }

  /**
   * 判断是否需要认证
   */
  needsAuthentication(path) {
    return path.includes('/admin/') || 
           path.includes('/reviewer/') || 
           (path.includes('/user/') && !path.includes('/login'));
  }

  /**
   * 判断是否有路径参数
   */
  hasPathParameter(path) {
    return path.includes(':') || path.includes('<') || path.includes('{');
  }

  /**
   * 判断是否为列表端点
   */
  isListEndpoint(path) {
    return path.includes('/list') || 
           path.endsWith('s') || 
           path.includes('/stories') || 
           path.includes('/users') ||
           path.includes('/questionnaires');
  }

  /**
   * 获取测试路径
   */
  getTestPath(path, paramValue = '1') {
    return path
      .replace(/:([^/]+)/g, paramValue)
      .replace(/<[^>]+>/g, paramValue)
      .replace(/{[^}]+}/g, paramValue);
  }

  /**
   * 生成有效的请求体
   */
  generateValidRequestBody(path) {
    if (path.includes('/stories')) {
      return JSON.stringify({
        title: '测试故事',
        content: '这是一个测试故事的内容',
        category: 'success',
        tags: ['测试', '就业']
      }, null, 6);
    } else if (path.includes('/questionnaire')) {
      return JSON.stringify({
        answers: {
          q1: 'option1',
          q2: 'option2'
        }
      }, null, 6);
    } else if (path.includes('/user')) {
      return JSON.stringify({
        name: '测试用户',
        email: 'test@example.com'
      }, null, 6);
    }
    
    return JSON.stringify({ data: 'test' }, null, 6);
  }

  /**
   * 生成大数据量请求体
   */
  generateLargeRequestBody(path) {
    if (path.includes('/stories')) {
      return JSON.stringify({
        title: '大数据测试故事',
        content: 'x'.repeat(10000),
        category: 'success',
        tags: Array(100).fill('tag')
      }, null, 6);
    }
    
    return JSON.stringify({
      data: 'x'.repeat(10000)
    }, null, 6);
  }

  /**
   * 生成响应验证
   */
  generateResponseValidation(path, operation) {
    if (path.includes('/stories') && operation.method === 'get') {
      return `expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);`;
    } else if (path.includes('/analytics')) {
      return `expect(response.body.data).toHaveProperty('stats');`;
    }
    
    return `// 添加特定的响应验证`;
  }

  /**
   * 生成Jest配置文件
   */
  generateJestConfig() {
    const config = {
      testEnvironment: 'node',
      testMatch: ['**/tests/api/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/api/setup.js'],
      collectCoverageFrom: [
        'backend/src/**/*.{js,ts}',
        '!backend/src/**/*.d.ts',
        '!backend/src/**/*.test.{js,ts}'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html'],
      testTimeout: 30000
    };

    const configPath = path.join(this.projectRoot, 'jest.config.js');
    const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
    
    fs.writeFileSync(configPath, configContent);
    console.log('  ✅ 生成Jest配置文件');
  }

  /**
   * 生成测试设置文件
   */
  generateTestSetup() {
    const setupContent = `/**
 * API测试设置文件
 * 提供测试环境的初始化和清理功能
 */

const { spawn } = require('child_process');
const axios = require('axios');

let testServer;
const TEST_PORT = 3001;
const BASE_URL = \`http://localhost:\${TEST_PORT}\`;

/**
 * 设置测试应用
 */
async function setupTestApp() {
  // 启动测试服务器
  testServer = spawn('npm', ['run', 'dev'], {
    env: { ...process.env, PORT: TEST_PORT, NODE_ENV: 'test' },
    stdio: 'pipe'
  });

  // 等待服务器启动
  await waitForServer();
  
  return BASE_URL;
}

/**
 * 清理测试环境
 */
async function teardownTestApp() {
  if (testServer) {
    testServer.kill();
  }
}

/**
 * 获取认证令牌
 */
async function getAuthToken() {
  try {
    const response = await axios.post(\`\${BASE_URL}/api/auth/login\`, {
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    return response.data.data.token;
  } catch (error) {
    console.warn('无法获取认证令牌，使用模拟令牌');
    return 'mock-auth-token';
  }
}

/**
 * 等待服务器启动
 */
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(\`\${BASE_URL}/api/health\`);
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('测试服务器启动超时');
}

/**
 * 创建测试数据
 */
async function createTestData() {
  // 创建测试用户
  const testUser = await axios.post(\`\${BASE_URL}/api/users\`, {
    name: '测试用户',
    email: 'test@example.com',
    password: 'testpassword'
  });

  // 创建测试故事
  const testStory = await axios.post(\`\${BASE_URL}/api/stories\`, {
    title: '测试故事',
    content: '这是一个测试故事',
    category: 'success'
  });

  return { testUser, testStory };
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  try {
    // 清理测试数据的逻辑
    await axios.delete(\`\${BASE_URL}/api/test-data/clear\`);
  } catch (error) {
    console.warn('清理测试数据失败:', error.message);
  }
}

module.exports = {
  setupTestApp,
  teardownTestApp,
  getAuthToken,
  createTestData,
  cleanupTestData,
  BASE_URL
};`;

    const setupPath = path.join(this.testsDir, 'setup.js');
    fs.writeFileSync(setupPath, setupContent);
    console.log('  ✅ 生成测试设置文件');
  }

  /**
   * 生成Newman测试脚本
   */
  generateNewmanTests() {
    console.log('📮 生成Newman测试脚本...');
    
    const newmanScript = `#!/bin/bash

# Newman API测试脚本
# 使用Postman集合进行API测试

set -e

echo "🚀 开始Newman API测试..."

# 检查Newman是否安装
if ! command -v newman &> /dev/null; then
    echo "❌ Newman未安装，正在安装..."
    npm install -g newman
fi

# 设置环境变量
export BASE_URL="https://employment-survey-api-prod.chrismarker89.workers.dev"
export AUTH_TOKEN=""

# 运行测试
echo "📮 运行Postman集合测试..."
newman run docs/postman-collection.json \\
    --environment docs/test-environment.json \\
    --reporters cli,html \\
    --reporter-html-export reports/newman-report.html \\
    --timeout-request 30000 \\
    --delay-request 100

echo "✅ Newman测试完成！"
echo "📄 测试报告已保存到: reports/newman-report.html"`;

    const scriptPath = path.join(this.projectRoot, 'scripts/run-newman-tests.sh');
    fs.writeFileSync(scriptPath, newmanScript);
    fs.chmodSync(scriptPath, '755');
    
    // 生成测试环境配置
    this.generateTestEnvironment();
    
    console.log('  ✅ 生成Newman测试脚本');
  }

  /**
   * 生成测试环境配置
   */
  generateTestEnvironment() {
    const environment = {
      id: 'test-environment',
      name: 'Test Environment',
      values: [
        {
          key: 'baseUrl',
          value: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
          enabled: true
        },
        {
          key: 'authToken',
          value: '',
          enabled: true
        },
        {
          key: 'testUserId',
          value: '1',
          enabled: true
        },
        {
          key: 'testStoryId',
          value: '1',
          enabled: true
        }
      ]
    };

    const envPath = path.join(this.projectRoot, 'docs/test-environment.json');
    fs.writeFileSync(envPath, JSON.stringify(environment, null, 2));
    console.log('  ✅ 生成测试环境配置');
  }

  /**
   * 生成测试报告模板
   */
  generateTestReportTemplate() {
    const reportTemplate = `# API测试报告

## 测试概览

- **测试时间**: {{timestamp}}
- **测试环境**: {{environment}}
- **总测试数**: {{totalTests}}
- **通过数**: {{passedTests}}
- **失败数**: {{failedTests}}
- **成功率**: {{successRate}}%

## 测试结果

### 成功的测试

{{#each passedTests}}
- ✅ {{this.name}} - {{this.response.responseTime}}ms
{{/each}}

### 失败的测试

{{#each failedTests}}
- ❌ {{this.name}}
  - **错误**: {{this.error}}
  - **响应时间**: {{this.response.responseTime}}ms
  - **状态码**: {{this.response.code}}
{{/each}}

## 性能统计

- **平均响应时间**: {{averageResponseTime}}ms
- **最快响应**: {{minResponseTime}}ms
- **最慢响应**: {{maxResponseTime}}ms

## 建议

{{#if failedTests}}
### 需要修复的问题

{{#each failedTests}}
1. **{{this.name}}**: {{this.suggestion}}
{{/each}}
{{/if}}

### 性能优化建议

{{#if slowTests}}
{{#each slowTests}}
- **{{this.name}}**: 响应时间{{this.responseTime}}ms，建议优化
{{/each}}
{{/if}}
`;

    const templatePath = path.join(this.projectRoot, 'docs/test-report-template.md');
    fs.writeFileSync(templatePath, reportTemplate);
    console.log('  ✅ 生成测试报告模板');
  }

  /**
   * 运行测试生成
   */
  async run() {
    console.log('🚀 开始生成API测试用例...\n');
    
    try {
      const apiReport = this.loadApiReport();
      const apiInventory = apiReport.inventory;
      
      this.generateJestTests(apiInventory);
      this.generateNewmanTests();
      this.generateTestReportTemplate();
      
      console.log('\n✅ API测试用例生成完成!');
      console.log(`📁 测试文件保存在: ${this.testsDir}`);
      console.log(`🧪 生成了 ${Object.keys(this.groupApisByTag(apiInventory)).length} 个测试套件`);
      console.log(`📮 生成了Newman测试脚本`);
      
      console.log('\n📋 下一步操作:');
      console.log('1. 安装测试依赖: npm install --save-dev jest supertest');
      console.log('2. 运行Jest测试: npm test');
      console.log('3. 运行Newman测试: ./scripts/run-newman-tests.sh');
      
      return true;
    } catch (error) {
      console.error('❌ 测试生成失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new APITestGenerator();
  generator.run().catch(console.error);
}

module.exports = APITestGenerator;
