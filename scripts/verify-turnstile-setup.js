#!/usr/bin/env node

/**
 * Turnstile配置验证脚本
 * 验证前端和后端的Turnstile配置是否正确
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证Turnstile配置...\n');

// 验证前端配置
function verifyFrontendConfig() {
  console.log('📱 检查前端配置:');
  
  const envPath = path.join(__dirname, '../frontend/.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ 前端 .env.local 文件不存在');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const siteKeyMatch = envContent.match(/VITE_TURNSTILE_SITE_KEY=(.+)/);
  const enabledMatch = envContent.match(/VITE_TURNSTILE_ENABLED=(.+)/);
  
  if (!siteKeyMatch) {
    console.log('❌ VITE_TURNSTILE_SITE_KEY 未配置');
    return false;
  }
  
  const siteKey = siteKeyMatch[1].trim();
  const enabled = enabledMatch ? enabledMatch[1].trim() : 'true';
  
  console.log(`✅ Site Key: ${siteKey}`);
  console.log(`✅ 启用状态: ${enabled}`);
  
  // 验证Site Key格式
  if (!siteKey.startsWith('0x4AAAAAAA')) {
    console.log('⚠️  Site Key格式可能不正确');
  }
  
  return true;
}

// 验证后端配置
async function verifyBackendConfig() {
  console.log('\n🔧 检查后端配置:');
  
  try {
    // 检查后端API是否可访问
    const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/test/turnstile/status');
    
    if (!response.ok) {
      console.log(`❌ 后端API不可访问: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ 后端API可访问`);
      console.log(`✅ Secret Key配置: ${result.data.configured ? '已配置' : '未配置'}`);
      console.log(`✅ 环境: ${result.data.environment}`);
      
      if (result.data.configured) {
        console.log(`✅ Secret Key长度: ${result.data.secretKeyLength} 字符`);
      }
      
      return result.data.configured;
    } else {
      console.log('❌ 后端配置检查失败');
      return false;
    }
  } catch (error) {
    console.log(`❌ 后端连接失败: ${error.message}`);
    return false;
  }
}

// 测试Cloudflare连接
async function testCloudflareConnectivity() {
  console.log('\n🌐 测试Cloudflare连接:');
  
  try {
    const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/test/turnstile/connectivity');
    
    if (!response.ok) {
      console.log(`❌ 连接测试失败: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ 可以连接到Cloudflare Turnstile API`);
      console.log(`✅ 响应状态: ${result.data.responseStatus}`);
      return result.data.canConnect;
    } else {
      console.log('❌ Cloudflare连接测试失败');
      return false;
    }
  } catch (error) {
    console.log(`❌ 连接测试异常: ${error.message}`);
    return false;
  }
}

// 验证组件文件
function verifyComponentFiles() {
  console.log('\n📦 检查组件文件:');
  
  const files = [
    '../frontend/src/components/common/TurnstileVerification.tsx',
    '../frontend/src/pages/TurnstileTestPage.tsx',
    '../backend/src/services/turnstileService.ts',
    '../backend/src/routes/test/turnstile.ts'
  ];
  
  let allExist = true;
  
  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} 不存在`);
      allExist = false;
    }
  });
  
  return allExist;
}

// 生成测试报告
function generateTestReport(results) {
  console.log('\n📊 配置验证报告:');
  console.log('='.repeat(50));
  
  const { frontend, backend, connectivity, components } = results;
  
  console.log(`前端配置: ${frontend ? '✅ 正常' : '❌ 异常'}`);
  console.log(`后端配置: ${backend ? '✅ 正常' : '❌ 异常'}`);
  console.log(`网络连接: ${connectivity ? '✅ 正常' : '❌ 异常'}`);
  console.log(`组件文件: ${components ? '✅ 完整' : '❌ 缺失'}`);
  
  const allGood = frontend && backend && connectivity && components;
  
  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('🎉 所有配置验证通过！Turnstile已准备就绪。');
    console.log('\n📝 下一步操作:');
    console.log('1. 访问 http://localhost:5174/test/turnstile 测试前端');
    console.log('2. 在测试页面完成Turnstile验证');
    console.log('3. 点击"测试后端验证"按钮');
    console.log('4. 确认所有测试通过');
  } else {
    console.log('⚠️  配置验证未完全通过，请检查上述问题。');
    console.log('\n🔧 可能的解决方案:');
    
    if (!frontend) {
      console.log('- 检查 frontend/.env.local 中的 VITE_TURNSTILE_SITE_KEY');
    }
    
    if (!backend) {
      console.log('- 运行: cd backend && npx wrangler secret put TURNSTILE_SECRET_KEY');
    }
    
    if (!connectivity) {
      console.log('- 检查网络连接和Cloudflare Workers部署状态');
    }
    
    if (!components) {
      console.log('- 确保所有必需的组件文件都已创建');
    }
  }
  
  return allGood;
}

// 主函数
async function main() {
  try {
    const results = {
      frontend: verifyFrontendConfig(),
      backend: await verifyBackendConfig(),
      connectivity: await testCloudflareConnectivity(),
      components: verifyComponentFiles()
    };
    
    const success = generateTestReport(results);
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行验证
main();
