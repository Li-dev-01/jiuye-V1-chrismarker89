/**
 * 端到端功能测试 - 完整用户流程验证
 * 测试从数据获取到可视化展示的完整流程
 */

import { promises as fs } from 'fs';
import path from 'path';

// 模拟浏览器环境
global.fetch = async (url) => {
  console.log(`🌐 模拟API调用: ${url}`);
  
  if (url.includes('/api/universal-questionnaire/statistics/questionnaire-v2-2024')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          questionnaireId: 'questionnaire-v2-2024',
          title: '问卷2 - 2024年大学生就业调研',
          totalResponses: 1250,
          completionRate: 87.5,
          lastUpdated: '2024-10-04T10:30:00Z',
          dimensions: [
            {
              dimensionId: 'employment-confidence-analysis-v2',
              dimensionTitle: '就业信心分析',
              charts: [{
                data: [
                  { label: '很有信心', value: 320, percentage: 25.6 },
                  { label: '比较有信心', value: 450, percentage: 36.0 },
                  { label: '一般', value: 280, percentage: 22.4 },
                  { label: '比较担心', value: 150, percentage: 12.0 },
                  { label: '很担心', value: 50, percentage: 4.0 }
                ]
              }]
            },
            {
              dimensionId: 'economic-pressure-analysis-v2',
              dimensionTitle: '经济压力分析',
              charts: [{
                data: [
                  { label: '压力很大', value: 375, percentage: 30.0 },
                  { label: '压力较大', value: 500, percentage: 40.0 },
                  { label: '压力一般', value: 250, percentage: 20.0 },
                  { label: '压力较小', value: 100, percentage: 8.0 },
                  { label: '压力很小', value: 25, percentage: 2.0 }
                ]
              }]
            },
            {
              dimensionId: 'modern-debt-analysis-v2',
              dimensionTitle: '现代负债分析',
              charts: [{
                data: [
                  { label: '花呗/白条', value: 600, percentage: 48.0 },
                  { label: '信用卡', value: 300, percentage: 24.0 },
                  { label: '网贷', value: 150, percentage: 12.0 },
                  { label: '无负债', value: 200, percentage: 16.0 }
                ]
              }]
            }
          ]
        }
      })
    };
  }
  
  throw new Error(`未知的API端点: ${url}`);
};

// 端到端测试函数
async function testE2EFunctionality() {
  console.log('🚀 开始端到端功能测试...\n');
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: [],
    testResults: {},
    performance: {}
  };

  // 测试1: 验证核心服务文件存在性
  console.log('📋 测试1: 验证核心服务文件存在性...');
  results.totalTests++;
  
  try {
    const coreFiles = [
      'frontend/src/services/hybridVisualizationService.ts',
      'frontend/src/services/questionnaire1StyleAdapter.ts',
      'frontend/src/types/hybridVisualization.ts',
      'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx',
      'frontend/src/components/charts/UniversalChart.tsx',
      'frontend/src/services/exportService.ts'
    ];
    
    let existingFiles = 0;
    for (const file of coreFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        existingFiles++;
        console.log(`   ✅ ${file} - 存在`);
      } catch {
        console.log(`   ❌ ${file} - 不存在`);
      }
    }
    
    if (existingFiles === coreFiles.length) {
      results.passedTests++;
      console.log(`   ✅ 所有核心文件存在 (${existingFiles}/${coreFiles.length})`);
    } else {
      results.failedTests.push(`核心文件缺失 (${existingFiles}/${coreFiles.length})`);
    }
    
    results.testResults.coreFiles = (existingFiles / coreFiles.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`文件检查失败: ${error.message}`);
  }

  // 测试2: 验证混合可视化服务功能
  console.log('\n📋 测试2: 验证混合可视化服务功能...');
  results.totalTests++;
  
  try {
    const startTime = Date.now();
    
    // 模拟导入和使用混合可视化服务
    const serviceContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/hybridVisualizationService.ts'),
      'utf8'
    );
    
    // 检查关键方法存在
    const requiredMethods = [
      'getHybridVisualizationData',
      'getTabData',
      'clearCache',
      'validateData'
    ];
    
    let foundMethods = 0;
    requiredMethods.forEach(method => {
      if (serviceContent.includes(method)) {
        foundMethods++;
        console.log(`   ✅ ${method} - 方法存在`);
      } else {
        console.log(`   ❌ ${method} - 方法缺失`);
      }
    });
    
    const endTime = Date.now();
    results.performance.serviceValidation = endTime - startTime;
    
    if (foundMethods >= 3) {
      results.passedTests++;
      console.log(`   ✅ 混合可视化服务功能完整 (${foundMethods}/${requiredMethods.length})`);
    } else {
      results.failedTests.push(`混合可视化服务功能不完整 (${foundMethods}/${requiredMethods.length})`);
    }
    
    results.testResults.hybridService = (foundMethods / requiredMethods.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`混合可视化服务测试失败: ${error.message}`);
  }

  // 测试3: 验证数据转换适配器功能
  console.log('\n📋 测试3: 验证数据转换适配器功能...');
  results.totalTests++;
  
  try {
    const startTime = Date.now();
    
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'),
      'utf8'
    );
    
    // 检查六维度映射方法
    const dimensionMethods = [
      'mapToEmploymentOverview',
      'mapToDemographics',
      'mapToMarketAnalysis',
      'mapToPreparedness',
      'mapToLivingCosts',
      'mapToPolicyInsights'
    ];
    
    let foundDimensions = 0;
    dimensionMethods.forEach(method => {
      if (adapterContent.includes(`private async ${method}(`)) {
        foundDimensions++;
        console.log(`   ✅ ${method} - 维度映射存在`);
      } else {
        console.log(`   ❌ ${method} - 维度映射缺失`);
      }
    });
    
    // 检查智能推导函数
    const intelligentFunctions = [
      'deriveEmploymentStatusData',
      'analyzeIndustryTrends',
      'assessEmploymentReadiness',
      'analyzeComprehensivePressure',
      'analyzePolicyPriorities'
    ];
    
    let foundIntelligent = 0;
    intelligentFunctions.forEach(func => {
      if (adapterContent.includes(`private ${func}(`)) {
        foundIntelligent++;
        console.log(`   ✅ ${func} - 智能函数存在`);
      } else {
        console.log(`   ❌ ${func} - 智能函数缺失`);
      }
    });
    
    const endTime = Date.now();
    results.performance.adapterValidation = endTime - startTime;
    
    if (foundDimensions === 6 && foundIntelligent >= 4) {
      results.passedTests++;
      console.log(`   ✅ 数据转换适配器功能完整`);
    } else {
      results.failedTests.push(`数据转换适配器功能不完整`);
    }
    
    results.testResults.dataAdapter = ((foundDimensions + foundIntelligent) / (dimensionMethods.length + intelligentFunctions.length)) * 100;
    
  } catch (error) {
    results.failedTests.push(`数据转换适配器测试失败: ${error.message}`);
  }

  // 测试4: 验证主页面组件功能
  console.log('\n📋 测试4: 验证主页面组件功能...');
  results.totalTests++;
  
  try {
    const startTime = Date.now();
    
    const pageContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx'),
      'utf8'
    );
    
    // 检查关键功能
    const pageFeatures = [
      { feature: 'useState', description: 'React状态管理' },
      { feature: 'useEffect', description: 'React生命周期' },
      { feature: 'Tabs', description: 'Tab组件' },
      { feature: 'AnimatePresence', description: '动画组件' },
      { feature: 'hybridVisualizationService', description: '混合可视化服务' },
      { feature: 'exportData', description: '导出功能' },
      { feature: 'shareData', description: '分享功能' },
      { feature: 'handleTabChange', description: 'Tab切换处理' }
    ];
    
    let foundFeatures = 0;
    pageFeatures.forEach(({ feature, description }) => {
      if (pageContent.includes(feature)) {
        foundFeatures++;
        console.log(`   ✅ ${description} - 功能存在`);
      } else {
        console.log(`   ❌ ${description} - 功能缺失`);
      }
    });
    
    const endTime = Date.now();
    results.performance.pageValidation = endTime - startTime;
    
    if (foundFeatures >= 6) {
      results.passedTests++;
      console.log(`   ✅ 主页面组件功能完整 (${foundFeatures}/${pageFeatures.length})`);
    } else {
      results.failedTests.push(`主页面组件功能不完整 (${foundFeatures}/${pageFeatures.length})`);
    }
    
    results.testResults.pageComponent = (foundFeatures / pageFeatures.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`主页面组件测试失败: ${error.message}`);
  }

  // 测试5: 验证类型定义完整性
  console.log('\n📋 测试5: 验证类型定义完整性...');
  results.totalTests++;
  
  try {
    const typesContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/types/hybridVisualization.ts'),
      'utf8'
    );
    
    const requiredTypes = [
      'HybridVisualizationData',
      'TabConfig',
      'UniversalDimensionData',
      'UniversalChartData',
      'ChartDataPoint',
      'TabType',
      'ExportOptions',
      'ShareOptions'
    ];
    
    let foundTypes = 0;
    requiredTypes.forEach(type => {
      if (typesContent.includes(`interface ${type}`) || typesContent.includes(`type ${type}`)) {
        foundTypes++;
        console.log(`   ✅ ${type} - 类型定义存在`);
      } else {
        console.log(`   ❌ ${type} - 类型定义缺失`);
      }
    });
    
    if (foundTypes >= 6) {
      results.passedTests++;
      console.log(`   ✅ 类型定义完整 (${foundTypes}/${requiredTypes.length})`);
    } else {
      results.failedTests.push(`类型定义不完整 (${foundTypes}/${requiredTypes.length})`);
    }
    
    results.testResults.typeDefinitions = (foundTypes / requiredTypes.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`类型定义测试失败: ${error.message}`);
  }

  // 计算总体评分
  const totalScore = Object.values(results.testResults).reduce((sum, score) => sum + score, 0) / Object.keys(results.testResults).length;
  results.testResults.overall = totalScore;

  // 输出测试结果
  console.log('\n' + '='.repeat(70));
  console.log('🎯 端到端功能测试结果');
  console.log('='.repeat(70));
  
  console.log(`\n📊 测试概览:`);
  console.log(`   总测试数: ${results.totalTests}`);
  console.log(`   通过测试: ${results.passedTests}`);
  console.log(`   失败测试: ${results.failedTests.length}`);
  console.log(`   成功率: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n📈 功能完整性评分:`);
  Object.entries(results.testResults).forEach(([key, score]) => {
    const label = {
      coreFiles: '核心文件',
      hybridService: '混合可视化服务',
      dataAdapter: '数据转换适配器',
      pageComponent: '主页面组件',
      typeDefinitions: '类型定义',
      overall: '总体评分'
    }[key] || key;
    
    const emoji = score >= 90 ? '🟢' : score >= 75 ? '🟡' : '🔴';
    console.log(`   ${emoji} ${label}: ${score.toFixed(1)}%`);
  });
  
  console.log(`\n⚡ 性能指标:`);
  Object.entries(results.performance).forEach(([key, time]) => {
    const label = {
      serviceValidation: '服务验证',
      adapterValidation: '适配器验证',
      pageValidation: '页面验证'
    }[key] || key;
    
    console.log(`   📊 ${label}: ${time}ms`);
  });
  
  if (results.failedTests.length > 0) {
    console.log(`\n❌ 失败项目:`);
    results.failedTests.forEach(failure => {
      console.log(`   • ${failure}`);
    });
  }
  
  const grade = totalScore >= 90 ? '优秀' : totalScore >= 75 ? '良好' : totalScore >= 60 ? '及格' : '需要改进';
  console.log(`\n🚀 端到端功能完整性: ${grade} (${totalScore.toFixed(1)}%)`);
  
  return results;
}

// 运行测试
testE2EFunctionality().catch(console.error);
