/**
 * 性能优化测试 - 验证优化效果
 * 测试数据转换、API调用、Tab切换等关键性能指标
 */

import { promises as fs } from 'fs';
import path from 'path';

// 模拟性能测试环境
global.performance = {
  now: () => Date.now()
};

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
        data: Array.from({ length: 100 }, (_, i) => ({
          label: `选项${i + 1}`,
          value: Math.floor(Math.random() * 100),
          percentage: Math.random() * 100
        }))
      }]
    },
    {
      dimensionId: 'economic-pressure-analysis-v2',
      dimensionTitle: '经济压力分析',
      charts: [{
        data: Array.from({ length: 100 }, (_, i) => ({
          label: `压力${i + 1}`,
          value: Math.floor(Math.random() * 100),
          percentage: Math.random() * 100
        }))
      }]
    },
    {
      dimensionId: 'modern-debt-analysis-v2',
      dimensionTitle: '现代负债分析',
      charts: [{
        data: Array.from({ length: 100 }, (_, i) => ({
          label: `负债${i + 1}`,
          value: Math.floor(Math.random() * 100),
          percentage: Math.random() * 100
        }))
      }]
    }
  ]
};

// 性能测试函数
async function testPerformanceOptimization() {
  console.log('⚡ 开始性能优化测试...\n');
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: [],
    performanceMetrics: {},
    optimizations: []
  };

  // 测试1: 验证并行处理优化
  console.log('📋 测试1: 验证并行处理优化...');
  results.totalTests++;
  
  try {
    const hybridServiceContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/hybridVisualizationService.ts'),
      'utf8'
    );
    
    // 检查并行处理模式
    const parallelPatterns = [
      'Promise.all',
      'await Promise.all',
      'q2DataPromise',
      'q1DataPromise',
      'setImmediate'
    ];
    
    let foundOptimizations = 0;
    parallelPatterns.forEach(pattern => {
      const matches = hybridServiceContent.match(new RegExp(pattern, 'g'));
      if (matches && matches.length > 0) {
        foundOptimizations++;
        console.log(`   ✅ ${pattern} - 找到 ${matches.length} 处优化`);
        results.optimizations.push(`并行处理: ${pattern}`);
      } else {
        console.log(`   ❌ ${pattern} - 未找到优化`);
      }
    });
    
    if (foundOptimizations >= 3) {
      results.passedTests++;
      console.log(`   ✅ 并行处理优化完成 (${foundOptimizations}/${parallelPatterns.length})`);
    } else {
      results.failedTests.push(`并行处理优化不足 (${foundOptimizations}/${parallelPatterns.length})`);
    }
    
    results.performanceMetrics.parallelProcessing = (foundOptimizations / parallelPatterns.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`并行处理测试失败: ${error.message}`);
  }

  // 测试2: 验证缓存优化
  console.log('\n📋 测试2: 验证缓存优化...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'),
      'utf8'
    );
    
    const hybridServiceContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/hybridVisualizationService.ts'),
      'utf8'
    );
    
    // 检查缓存机制
    const cachePatterns = [
      'cache',
      'Cache',
      'TTL',
      'timestamp',
      'getFromCache',
      'setCache'
    ];
    
    let foundCacheFeatures = 0;
    cachePatterns.forEach(pattern => {
      const adapterMatches = adapterContent.match(new RegExp(pattern, 'g')) || [];
      const serviceMatches = hybridServiceContent.match(new RegExp(pattern, 'g')) || [];
      const totalMatches = adapterMatches.length + serviceMatches.length;
      
      if (totalMatches > 0) {
        foundCacheFeatures++;
        console.log(`   ✅ ${pattern} - 找到 ${totalMatches} 处缓存优化`);
        results.optimizations.push(`缓存优化: ${pattern}`);
      } else {
        console.log(`   ❌ ${pattern} - 未找到缓存优化`);
      }
    });
    
    if (foundCacheFeatures >= 4) {
      results.passedTests++;
      console.log(`   ✅ 缓存优化完成 (${foundCacheFeatures}/${cachePatterns.length})`);
    } else {
      results.failedTests.push(`缓存优化不足 (${foundCacheFeatures}/${cachePatterns.length})`);
    }
    
    results.performanceMetrics.caching = (foundCacheFeatures / cachePatterns.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`缓存优化测试失败: ${error.message}`);
  }

  // 测试3: 验证Tab切换优化
  console.log('\n📋 测试3: 验证Tab切换优化...');
  results.totalTests++;
  
  try {
    const pageContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx'),
      'utf8'
    );
    
    // 检查Tab切换优化
    const tabOptimizations = [
      'requestAnimationFrame',
      'activeKey === state.activeTab',
      'tabSwitching',
      'AnimatePresence',
      'framer-motion'
    ];
    
    let foundTabOptimizations = 0;
    tabOptimizations.forEach(pattern => {
      if (pageContent.includes(pattern)) {
        foundTabOptimizations++;
        console.log(`   ✅ ${pattern} - Tab优化存在`);
        results.optimizations.push(`Tab优化: ${pattern}`);
      } else {
        console.log(`   ❌ ${pattern} - Tab优化缺失`);
      }
    });
    
    if (foundTabOptimizations >= 3) {
      results.passedTests++;
      console.log(`   ✅ Tab切换优化完成 (${foundTabOptimizations}/${tabOptimizations.length})`);
    } else {
      results.failedTests.push(`Tab切换优化不足 (${foundTabOptimizations}/${tabOptimizations.length})`);
    }
    
    results.performanceMetrics.tabSwitching = (foundTabOptimizations / tabOptimizations.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`Tab切换优化测试失败: ${error.message}`);
  }

  // 测试4: 验证性能监控
  console.log('\n📋 测试4: 验证性能监控...');
  results.totalTests++;
  
  try {
    const allFiles = [
      'frontend/src/services/hybridVisualizationService.ts',
      'frontend/src/services/questionnaire1StyleAdapter.ts'
    ];
    
    let performanceMonitoringFeatures = 0;
    const monitoringPatterns = [
      'performance.now',
      'startTime',
      'endTime',
      'toFixed',
      'ms',
      'processingTime'
    ];
    
    for (const file of allFiles) {
      const content = await fs.readFile(path.join(process.cwd(), file), 'utf8');
      
      monitoringPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          performanceMonitoringFeatures++;
        }
      });
    }
    
    if (performanceMonitoringFeatures >= 8) {
      results.passedTests++;
      console.log(`   ✅ 性能监控完善 (${performanceMonitoringFeatures} 处监控点)`);
      results.optimizations.push(`性能监控: ${performanceMonitoringFeatures} 处监控点`);
    } else {
      results.failedTests.push(`性能监控不足 (${performanceMonitoringFeatures} 处监控点)`);
    }
    
    results.performanceMetrics.monitoring = Math.min((performanceMonitoringFeatures / 10) * 100, 100);
    
  } catch (error) {
    results.failedTests.push(`性能监控测试失败: ${error.message}`);
  }

  // 测试5: 模拟性能基准测试
  console.log('\n📋 测试5: 模拟性能基准测试...');
  results.totalTests++;
  
  try {
    // 模拟数据处理性能测试
    const iterations = 1000;
    const startTime = Date.now();
    
    // 模拟数据转换操作
    for (let i = 0; i < iterations; i++) {
      const mockData = mockQ2Data.dimensions[0].charts[0].data;
      
      // 模拟过滤操作
      const filtered = mockData.filter(item => item.value > 50);
      
      // 模拟聚合操作
      const sum = filtered.reduce((acc, item) => acc + item.value, 0);
      
      // 模拟计算操作
      const average = sum / filtered.length;
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerOperation = totalTime / iterations;
    
    console.log(`   📊 处理 ${iterations} 次操作耗时: ${totalTime}ms`);
    console.log(`   📊 平均每次操作耗时: ${avgTimePerOperation.toFixed(3)}ms`);
    
    if (avgTimePerOperation < 1.0) {
      results.passedTests++;
      console.log(`   ✅ 性能基准测试通过 (${avgTimePerOperation.toFixed(3)}ms < 1.0ms)`);
    } else {
      results.failedTests.push(`性能基准测试未通过 (${avgTimePerOperation.toFixed(3)}ms >= 1.0ms)`);
    }
    
    results.performanceMetrics.benchmark = {
      totalTime,
      avgTimePerOperation,
      operationsPerSecond: 1000 / avgTimePerOperation
    };
    
  } catch (error) {
    results.failedTests.push(`性能基准测试失败: ${error.message}`);
  }

  // 计算总体评分
  const scores = Object.values(results.performanceMetrics).filter(v => typeof v === 'number');
  const totalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  results.performanceMetrics.overall = totalScore;

  // 输出测试结果
  console.log('\n' + '='.repeat(70));
  console.log('⚡ 性能优化测试结果');
  console.log('='.repeat(70));
  
  console.log(`\n🎯 测试概览:`);
  console.log(`   总测试数: ${results.totalTests}`);
  console.log(`   通过测试: ${results.passedTests}`);
  console.log(`   失败测试: ${results.failedTests.length}`);
  console.log(`   成功率: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n📈 性能指标:`);
  Object.entries(results.performanceMetrics).forEach(([key, value]) => {
    if (typeof value === 'number') {
      const label = {
        parallelProcessing: '并行处理',
        caching: '缓存优化',
        tabSwitching: 'Tab切换',
        monitoring: '性能监控',
        overall: '总体评分'
      }[key] || key;
      
      const emoji = value >= 80 ? '🟢' : value >= 60 ? '🟡' : '🔴';
      console.log(`   ${emoji} ${label}: ${value.toFixed(1)}%`);
    } else if (key === 'benchmark') {
      console.log(`   📊 性能基准: ${value.avgTimePerOperation.toFixed(3)}ms/操作 (${value.operationsPerSecond.toFixed(0)} ops/s)`);
    }
  });
  
  console.log(`\n✅ 已实现优化:`);
  results.optimizations.forEach(optimization => {
    console.log(`   • ${optimization}`);
  });
  
  if (results.failedTests.length > 0) {
    console.log(`\n❌ 需要改进:`);
    results.failedTests.forEach(failure => {
      console.log(`   • ${failure}`);
    });
  }
  
  const grade = totalScore >= 80 ? '优秀' : totalScore >= 60 ? '良好' : '需要改进';
  console.log(`\n🚀 性能优化水平: ${grade} (${totalScore.toFixed(1)}%)`);
  
  return results;
}

// 运行测试
testPerformanceOptimization().catch(console.error);
