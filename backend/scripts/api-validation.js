#!/usr/bin/env node

/**
 * API验证脚本
 * 用于测试问卷认证API的有效性和可用性
 */

import https from 'https';
import http from 'http';

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求工具函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Validation-Script/1.0',
        ...options.headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 测试用例
const testCases = [
  {
    name: '健康检查',
    url: `${API_BASE_URL}/health`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: '问卷认证路由测试',
    url: `${API_BASE_URL}/api/questionnaire-auth/test`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: '半匿名认证 - 有效数据',
    url: `${API_BASE_URL}/api/questionnaire-auth/semi-anonymous`,
    method: 'POST',
    body: {
      identityA: '12345678901',
      identityB: '1234',
      deviceInfo: {
        userAgent: 'API-Validation-Script/1.0',
        platform: 'Node.js',
        language: 'en-US',
        timezone: 'UTC',
        screen: {
          width: 1920,
          height: 1080,
          colorDepth: 24
        }
      }
    },
    expectedStatus: [200, 201]
  },
  {
    name: '半匿名认证 - 无效A值',
    url: `${API_BASE_URL}/api/questionnaire-auth/semi-anonymous`,
    method: 'POST',
    body: {
      identityA: '123',
      identityB: '1234',
      deviceInfo: { userAgent: 'test' }
    },
    expectedStatus: 400
  },
  {
    name: '半匿名认证 - 无效B值',
    url: `${API_BASE_URL}/api/questionnaire-auth/semi-anonymous`,
    method: 'POST',
    body: {
      identityA: '12345678901',
      identityB: '12',
      deviceInfo: { userAgent: 'test' }
    },
    expectedStatus: 400
  },
  {
    name: '匿名认证',
    url: `${API_BASE_URL}/api/questionnaire-auth/anonymous`,
    method: 'POST',
    body: {
      deviceInfo: {
        userAgent: 'API-Validation-Script/1.0',
        platform: 'Node.js',
        language: 'en-US',
        timezone: 'UTC'
      }
    },
    expectedStatus: [200, 201]
  }
];

// 执行单个测试
async function runTest(testCase) {
  log(`\n🧪 测试: ${testCase.name}`, 'cyan');
  log(`📍 URL: ${testCase.url}`, 'blue');
  log(`🔧 方法: ${testCase.method}`, 'blue');
  
  if (testCase.body) {
    log(`📦 请求体: ${JSON.stringify(testCase.body, null, 2)}`, 'blue');
  }

  try {
    const startTime = Date.now();
    const response = await makeRequest(testCase.url, {
      method: testCase.method,
      body: testCase.body
    });
    const duration = Date.now() - startTime;

    log(`⏱️  响应时间: ${duration}ms`, 'yellow');
    log(`📊 状态码: ${response.status}`, response.status < 400 ? 'green' : 'red');
    
    // 检查期望状态码
    const expectedStatuses = Array.isArray(testCase.expectedStatus) 
      ? testCase.expectedStatus 
      : [testCase.expectedStatus];
    
    const statusMatch = expectedStatuses.includes(response.status);
    
    if (statusMatch) {
      log(`✅ 状态码匹配期望值`, 'green');
    } else {
      log(`❌ 状态码不匹配，期望: ${expectedStatuses.join(' 或 ')}, 实际: ${response.status}`, 'red');
    }

    // 显示响应数据
    if (response.parseError) {
      log(`⚠️  JSON解析错误: ${response.parseError}`, 'yellow');
      log(`📄 原始响应: ${response.data}`, 'yellow');
    } else {
      log(`📋 响应数据:`, 'green');
      console.log(JSON.stringify(response.data, null, 2));
    }

    // 显示重要的响应头
    const importantHeaders = ['content-type', 'x-request-id', 'x-api-version'];
    const headers = {};
    importantHeaders.forEach(header => {
      if (response.headers[header]) {
        headers[header] = response.headers[header];
      }
    });
    
    if (Object.keys(headers).length > 0) {
      log(`📋 重要响应头:`, 'green');
      console.log(JSON.stringify(headers, null, 2));
    }

    return {
      name: testCase.name,
      success: statusMatch,
      status: response.status,
      duration,
      data: response.data,
      error: response.parseError
    };

  } catch (error) {
    log(`❌ 请求失败: ${error.message}`, 'red');
    return {
      name: testCase.name,
      success: false,
      error: error.message
    };
  }
}

// 主函数
async function main() {
  log('🚀 开始API验证测试', 'magenta');
  log(`🌐 目标API: ${API_BASE_URL}`, 'blue');
  log(`📅 测试时间: ${new Date().toISOString()}`, 'blue');
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    // 在测试之间添加延迟，避免过于频繁的请求
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 生成测试报告
  log('\n📊 测试报告', 'magenta');
  log('=' * 50, 'blue');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  log(`✅ 成功: ${successful}/${total}`, successful === total ? 'green' : 'yellow');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
    
    if (!result.success && result.error) {
      log(`   错误: ${result.error}`, 'red');
    }
    
    if (result.status) {
      log(`   状态码: ${result.status}`, 'blue');
    }
    
    if (result.duration) {
      log(`   响应时间: ${result.duration}ms`, 'blue');
    }
  });
  
  // 如果有失败的测试，提供诊断建议
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    log('\n🔍 诊断建议:', 'yellow');
    
    failed.forEach(result => {
      log(`\n❌ ${result.name}:`, 'red');
      
      if (result.status === 500) {
        log('   - 服务器内部错误，可能是数据库连接或业务逻辑问题', 'yellow');
        log('   - 检查Cloudflare Workers日志', 'yellow');
        log('   - 验证数据库连接和表结构', 'yellow');
      } else if (result.status === 404) {
        log('   - 路由未找到，检查路由注册', 'yellow');
      } else if (result.status === 400) {
        log('   - 请求参数错误，检查请求格式', 'yellow');
      } else if (result.error) {
        log(`   - 网络错误: ${result.error}`, 'yellow');
      }
    });
  }
  
  log('\n🏁 测试完成', 'magenta');
  process.exit(failed.length > 0 ? 1 : 0);
}

// 运行测试
main().catch(error => {
  log(`💥 测试脚本执行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
