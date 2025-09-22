#!/usr/bin/env node

/**
 * 前端功能集成验证脚本
 * 验证新部署的前端是否包含我们创建的功能
 */

const FRONTEND_URL = 'https://b1346dca.college-employment-survey-frontend.pages.dev';

/**
 * 检查前端页面是否包含特定功能
 */
async function checkFrontendFeatures() {
  console.log('🔍 验证前端功能集成...\n');
  console.log(`🌐 前端URL: ${FRONTEND_URL}\n`);

  const features = [
    {
      name: '用户内容管理页面',
      path: '/admin/user-content',
      expectedElements: [
        'UserContentManagementPage',
        'user-content-management',
        '内容管理',
        '批量删除',
        'IP地址'
      ]
    },
    {
      name: 'API版本管理',
      path: '/admin',
      expectedElements: [
        'ApiVersionManager',
        'version',
        'v1',
        'v2'
      ]
    },
    {
      name: '管理员页面',
      path: '/admin',
      expectedElements: [
        'admin',
        '管理员',
        '仪表板'
      ]
    }
  ];

  const results = [];

  for (const feature of features) {
    try {
      console.log(`🔍 检查: ${feature.name}`);
      console.log(`   路径: ${feature.path}`);

      const url = `${FRONTEND_URL}${feature.path}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`   ❌ 页面无法访问: ${response.status} ${response.statusText}`);
        results.push({
          name: feature.name,
          success: false,
          error: `HTTP ${response.status}`,
          url: url
        });
        continue;
      }

      const html = await response.text();
      
      // 检查是否包含预期的元素
      const foundElements = feature.expectedElements.filter(element => 
        html.includes(element)
      );

      const success = foundElements.length > 0;
      
      if (success) {
        console.log(`   ✅ 功能已集成`);
        console.log(`   📋 找到元素: ${foundElements.join(', ')}`);
      } else {
        console.log(`   ⚠️ 功能可能未完全集成`);
        console.log(`   📋 未找到预期元素: ${feature.expectedElements.join(', ')}`);
      }

      results.push({
        name: feature.name,
        success: success,
        foundElements: foundElements,
        expectedElements: feature.expectedElements,
        url: url
      });

    } catch (error) {
      console.log(`   ❌ 检查失败: ${error.message}`);
      results.push({
        name: feature.name,
        success: false,
        error: error.message,
        url: `${FRONTEND_URL}${feature.path}`
      });
    }

    console.log('');
  }

  return results;
}

/**
 * 检查前端构建文件
 */
async function checkBuildFiles() {
  console.log('📦 检查前端构建文件...\n');

  const buildFiles = [
    {
      name: '用户内容管理页面JS',
      path: '/assets/js/UserContentManagementPage-JnsKqACe.js',
      description: '用户内容管理页面的JavaScript文件'
    },
    {
      name: '用户内容管理页面CSS',
      path: '/assets/css/UserContentManagementPage-BN9PSsmT.css',
      description: '用户内容管理页面的样式文件'
    },
    {
      name: '主应用JS',
      path: '/assets/js/index-CkU_ymXm.js',
      description: '主应用JavaScript文件'
    },
    {
      name: '管理员仪表板JS',
      path: '/assets/js/DashboardPage-C2CGw0yL.js',
      description: '管理员仪表板JavaScript文件'
    }
  ];

  const results = [];

  for (const file of buildFiles) {
    try {
      console.log(`🔍 检查: ${file.name}`);
      console.log(`   路径: ${file.path}`);

      const url = `${FRONTEND_URL}${file.path}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const size = response.headers.get('content-length');
        console.log(`   ✅ 文件存在 (${size ? `${Math.round(size/1024)}KB` : '大小未知'})`);
        
        results.push({
          name: file.name,
          success: true,
          size: size,
          url: url
        });
      } else {
        console.log(`   ❌ 文件不存在: ${response.status}`);
        results.push({
          name: file.name,
          success: false,
          error: `HTTP ${response.status}`,
          url: url
        });
      }

    } catch (error) {
      console.log(`   ❌ 检查失败: ${error.message}`);
      results.push({
        name: file.name,
        success: false,
        error: error.message,
        url: `${FRONTEND_URL}${file.path}`
      });
    }

    console.log('');
  }

  return results;
}

/**
 * 检查API连接
 */
async function checkApiConnection() {
  console.log('🔗 检查前端到后端API连接...\n');

  try {
    // 从前端页面获取API配置
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    // 查找API基础URL配置
    const apiUrlMatch = html.match(/VITE_API_BASE_URL['"]\s*:\s*['"]([^'"]+)['"]/);
    const apiUrl = apiUrlMatch ? apiUrlMatch[1] : 'https://employment-survey-api-prod.chrismarker89.workers.dev';
    
    console.log(`🌐 检测到API URL: ${apiUrl}`);
    
    // 测试API连接
    const apiResponse = await fetch(`${apiUrl}/health`);
    
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`✅ API连接正常`);
      console.log(`📊 API状态: ${data.success ? '成功' : '失败'}`);
      
      return {
        success: true,
        apiUrl: apiUrl,
        apiStatus: data
      };
    } else {
      console.log(`❌ API连接失败: ${apiResponse.status}`);
      return {
        success: false,
        apiUrl: apiUrl,
        error: `HTTP ${apiResponse.status}`
      };
    }

  } catch (error) {
    console.log(`❌ API连接检查失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 运行完整的前端验证
 */
async function runFullVerification() {
  console.log('🚀 前端功能集成完整验证\n');
  console.log('=' * 50);

  // 1. 检查功能集成
  const featureResults = await checkFrontendFeatures();
  
  // 2. 检查构建文件
  const buildResults = await checkBuildFiles();
  
  // 3. 检查API连接
  const apiResult = await checkApiConnection();

  // 生成验证报告
  console.log('\n📊 验证结果汇总:');
  console.log('=' * 50);

  const featureSuccessCount = featureResults.filter(r => r.success).length;
  const featureTotalCount = featureResults.length;
  const buildSuccessCount = buildResults.filter(r => r.success).length;
  const buildTotalCount = buildResults.length;

  console.log(`功能集成: ${featureSuccessCount}/${featureTotalCount} 成功`);
  console.log(`构建文件: ${buildSuccessCount}/${buildTotalCount} 存在`);
  console.log(`API连接: ${apiResult.success ? '✅ 正常' : '❌ 异常'}`);

  const overallSuccess = featureSuccessCount === featureTotalCount && 
                         buildSuccessCount === buildTotalCount && 
                         apiResult.success;

  console.log(`总体状态: ${overallSuccess ? '✅ 完全集成' : '⚠️ 部分集成'}`);

  console.log('\n📋 详细结果:');
  
  console.log('\n🔧 功能集成状态:');
  featureResults.forEach(result => {
    const statusEmoji = result.success ? '✅' : '❌';
    console.log(`${statusEmoji} ${result.name}`);
    if (result.foundElements && result.foundElements.length > 0) {
      console.log(`    找到: ${result.foundElements.join(', ')}`);
    }
    if (result.error) {
      console.log(`    错误: ${result.error}`);
    }
  });

  console.log('\n📦 构建文件状态:');
  buildResults.forEach(result => {
    const statusEmoji = result.success ? '✅' : '❌';
    const sizeInfo = result.size ? ` (${Math.round(result.size/1024)}KB)` : '';
    console.log(`${statusEmoji} ${result.name}${sizeInfo}`);
    if (result.error) {
      console.log(`    错误: ${result.error}`);
    }
  });

  console.log('\n🎯 验证总结:');
  if (overallSuccess) {
    console.log('🎉 前端功能完全集成成功！');
    console.log('✅ 所有新功能都已部署到前端');
    console.log('✅ 构建文件完整');
    console.log('✅ API连接正常');
    console.log('✅ 用户内容管理系统已可用');
    console.log('✅ API版本管理已集成');
  } else {
    console.log('⚠️ 前端功能部分集成');
    
    const failedFeatures = featureResults.filter(r => !r.success);
    const missingFiles = buildResults.filter(r => !r.success);
    
    if (failedFeatures.length > 0) {
      console.log('\n❌ 未完全集成的功能:');
      failedFeatures.forEach(result => {
        console.log(`  ${result.name}: ${result.error || '功能元素未找到'}`);
      });
    }
    
    if (missingFiles.length > 0) {
      console.log('\n❌ 缺失的构建文件:');
      missingFiles.forEach(result => {
        console.log(`  ${result.name}: ${result.error}`);
      });
    }
    
    if (!apiResult.success) {
      console.log(`\n❌ API连接问题: ${apiResult.error}`);
    }
  }

  console.log('\n📝 访问链接:');
  console.log(`🌐 前端主页: ${FRONTEND_URL}`);
  console.log(`🔧 管理员页面: ${FRONTEND_URL}/admin`);
  console.log(`👥 用户内容管理: ${FRONTEND_URL}/admin/user-content`);
  console.log(`🔗 API健康检查: ${apiResult.apiUrl || 'https://employment-survey-api-prod.chrismarker89.workers.dev'}/health`);

  return {
    features: featureResults,
    buildFiles: buildResults,
    apiConnection: apiResult,
    overall: overallSuccess
  };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  switch (command) {
    case 'all':
      const results = await runFullVerification();
      process.exit(results.overall ? 0 : 1);
      break;

    case 'features':
      const featureResults = await checkFrontendFeatures();
      const featureSuccess = featureResults.every(r => r.success);
      process.exit(featureSuccess ? 0 : 1);
      break;

    case 'build':
      const buildResults = await checkBuildFiles();
      const buildSuccess = buildResults.every(r => r.success);
      process.exit(buildSuccess ? 0 : 1);
      break;

    case 'api':
      const apiResult = await checkApiConnection();
      process.exit(apiResult.success ? 0 : 1);
      break;

    default:
      console.log('用法: node verify-frontend-integration.cjs [all|features|build|api]');
      console.log('  all      - 运行完整验证 (默认)');
      console.log('  features - 仅验证功能集成');
      console.log('  build    - 仅检查构建文件');
      console.log('  api      - 仅检查API连接');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('前端验证失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  checkFrontendFeatures,
  checkBuildFiles,
  checkApiConnection,
  runFullVerification
};
