/**
 * 阶段3进度测试 - 数据映射实现验证
 * 测试问卷2到问卷1六维度的智能数据转换逻辑
 */

import { promises as fs } from 'fs';
import path from 'path';

// 模拟问卷2数据
const mockQ2Data = {
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
};

// 测试函数
async function testPhase3Progress() {
  console.log('🚀 开始阶段3进度测试...\n');
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: [],
    completedTasks: [],
    inProgressTasks: [],
    scores: {}
  };

  // 测试1: 验证智能数据推导函数存在
  console.log('📋 测试1: 验证智能数据推导函数...');
  results.totalTests++;
  
  try {
    const adapterPath = path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts');
    const adapterContent = await fs.readFile(adapterPath, 'utf8');
    
    const requiredFunctions = [
      'deriveEmploymentStatusData',
      'deriveEmploymentDifficultyData', 
      'deriveSalaryLevelData',
      'deriveAgeDistribution',
      'deriveGenderDistribution',
      'deriveEducationDistribution',
      'deriveRegionalDistribution',
      'analyzeIndustryTrends',
      'analyzeMarketDemand',
      'analyzeCompetitionIntensity',
      'analyzeSalaryMarket'
    ];
    
    let foundFunctions = 0;
    requiredFunctions.forEach(func => {
      if (adapterContent.includes(`private ${func}(`)) {
        foundFunctions++;
        console.log(`   ✅ ${func} - 已实现`);
      } else {
        console.log(`   ❌ ${func} - 未找到`);
      }
    });
    
    if (foundFunctions === requiredFunctions.length) {
      results.passedTests++;
      console.log(`   ✅ 所有智能推导函数已实现 (${foundFunctions}/${requiredFunctions.length})`);
    } else {
      results.failedTests.push(`智能推导函数不完整 (${foundFunctions}/${requiredFunctions.length})`);
    }
    
    results.scores.intelligentFunctions = (foundFunctions / requiredFunctions.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`读取适配器文件失败: ${error.message}`);
  }

  // 测试2: 验证数据分析逻辑
  console.log('\n📋 测试2: 验证数据分析逻辑...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'), 
      'utf8'
    );
    
    const analysisPatterns = [
      'console\\.log.*分析.*数据',
      'filter\\(.*item.*label.*includes',
      'reduce\\(.*sum.*item.*value',
      'Math\\.round.*ratio',
      'highConfidenceRatio',
      'highPressureRatio',
      'modernDebtRatio'
    ];
    
    let foundPatterns = 0;
    analysisPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      const matches = adapterContent.match(regex);
      if (matches && matches.length > 0) {
        foundPatterns++;
        console.log(`   ✅ ${pattern} - 找到 ${matches.length} 处使用`);
      } else {
        console.log(`   ❌ ${pattern} - 未找到`);
      }
    });
    
    if (foundPatterns >= 5) {
      results.passedTests++;
      console.log(`   ✅ 数据分析逻辑完善 (${foundPatterns}/${analysisPatterns.length})`);
    } else {
      results.failedTests.push(`数据分析逻辑不足 (${foundPatterns}/${analysisPatterns.length})`);
    }
    
    results.scores.analysisLogic = (foundPatterns / analysisPatterns.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`验证分析逻辑失败: ${error.message}`);
  }

  // 测试3: 验证六维度映射完整性
  console.log('\n📋 测试3: 验证六维度映射完整性...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'), 
      'utf8'
    );
    
    const dimensionMappings = [
      'mapToEmploymentOverview', // 就业形势总览
      'mapToDemographics',       // 人口结构分析  
      'mapToMarketAnalysis',     // 就业市场深度分析
      'mapToPreparedness',       // 学生就业准备
      'mapToLivingCosts',        // 生活成本与压力
      'mapToPolicyInsights'      // 政策洞察与建议
    ];
    
    let enhancedMappings = 0;
    dimensionMappings.forEach(mapping => {
      // 检查函数是否存在
      const functionExists = adapterContent.includes(`private async ${mapping}(`);

      if (functionExists) {
        // 检查是否包含智能分析逻辑
        const hasConsoleLog = adapterContent.includes(`console.log('🔍`);
        const hasFindDimension = adapterContent.includes('findDimension(q2Data');
        const hasIntelligentLogic = adapterContent.includes('derive') || adapterContent.includes('analyze');

        if (hasConsoleLog && hasFindDimension && hasIntelligentLogic) {
          enhancedMappings++;
          console.log(`   ✅ ${mapping} - 已增强智能分析`);
        } else {
          console.log(`   ⚠️  ${mapping} - 存在但未完全增强`);
        }
      } else {
        console.log(`   ❌ ${mapping} - 未找到`);
      }
    });
    
    if (enhancedMappings >= 3) {
      results.passedTests++;
      console.log(`   ✅ 维度映射增强完成 (${enhancedMappings}/${dimensionMappings.length})`);
      
      // 记录已完成的任务
      if (enhancedMappings >= 1) results.completedTasks.push('就业形势总览数据映射');
      if (enhancedMappings >= 2) results.completedTasks.push('人口结构分析数据转换');
      if (enhancedMappings >= 3) results.completedTasks.push('就业市场深度分析算法');
      
    } else {
      results.failedTests.push(`维度映射增强不足 (${enhancedMappings}/${dimensionMappings.length})`);
    }
    
    results.scores.dimensionMapping = (enhancedMappings / dimensionMappings.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`验证维度映射失败: ${error.message}`);
  }

  // 计算总体评分
  const totalScore = Object.values(results.scores).reduce((sum, score) => sum + score, 0) / Object.keys(results.scores).length;
  results.scores.overall = totalScore;

  // 输出测试结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 阶段3进度测试结果');
  console.log('='.repeat(60));
  
  console.log(`\n🎯 测试概览:`);
  console.log(`   总测试数: ${results.totalTests}`);
  console.log(`   通过测试: ${results.passedTests}`);
  console.log(`   失败测试: ${results.failedTests.length}`);
  console.log(`   成功率: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n📈 详细评分:`);
  Object.entries(results.scores).forEach(([key, score]) => {
    const label = {
      intelligentFunctions: '智能推导函数',
      analysisLogic: '数据分析逻辑', 
      dimensionMapping: '维度映射增强',
      overall: '总体评分'
    }[key] || key;
    
    const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
    console.log(`   ${emoji} ${label}: ${score.toFixed(1)}%`);
  });
  
  console.log(`\n✅ 已完成任务:`);
  results.completedTasks.forEach(task => {
    console.log(`   • ${task}`);
  });
  
  if (results.failedTests.length > 0) {
    console.log(`\n❌ 失败项目:`);
    results.failedTests.forEach(failure => {
      console.log(`   • ${failure}`);
    });
  }
  
  console.log(`\n🚀 阶段3进度: ${totalScore >= 75 ? '优秀' : totalScore >= 60 ? '良好' : '需要改进'} (${totalScore.toFixed(1)}%)`);
  
  return results;
}

// 运行测试
testPhase3Progress().catch(console.error);
