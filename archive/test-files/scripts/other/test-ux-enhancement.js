/**
 * 用户体验完善测试 - 验证UX改进效果
 * 测试响应式设计、动画效果、错误处理、加载状态等
 */

import { promises as fs } from 'fs';
import path from 'path';

// 用户体验测试函数
async function testUXEnhancement() {
  console.log('🎨 开始用户体验完善测试...\n');
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: [],
    uxMetrics: {},
    improvements: []
  };

  // 测试1: 验证响应式设计
  console.log('📋 测试1: 验证响应式设计...');
  results.totalTests++;
  
  try {
    const cssContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.module.css'),
      'utf8'
    );
    
    const pageContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx'),
      'utf8'
    );
    
    // 检查响应式设计特性
    const responsiveFeatures = [
      '@media (max-width: 768px)',
      '@media (max-width: 576px)',
      'xs={24}',
      'sm={24}',
      'md={12}',
      'lg={8}',
      'xl={8}',
      'xxl={6}'
    ];
    
    let foundResponsiveFeatures = 0;
    responsiveFeatures.forEach(feature => {
      const cssMatches = cssContent.includes(feature) ? 1 : 0;
      const pageMatches = pageContent.includes(feature) ? 1 : 0;
      const totalMatches = cssMatches + pageMatches;
      
      if (totalMatches > 0) {
        foundResponsiveFeatures++;
        console.log(`   ✅ ${feature} - 响应式特性存在`);
        results.improvements.push(`响应式设计: ${feature}`);
      } else {
        console.log(`   ❌ ${feature} - 响应式特性缺失`);
      }
    });
    
    if (foundResponsiveFeatures >= 6) {
      results.passedTests++;
      console.log(`   ✅ 响应式设计完善 (${foundResponsiveFeatures}/${responsiveFeatures.length})`);
    } else {
      results.failedTests.push(`响应式设计不足 (${foundResponsiveFeatures}/${responsiveFeatures.length})`);
    }
    
    results.uxMetrics.responsiveDesign = (foundResponsiveFeatures / responsiveFeatures.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`响应式设计测试失败: ${error.message}`);
  }

  // 测试2: 验证动画效果
  console.log('\n📋 测试2: 验证动画效果...');
  results.totalTests++;
  
  try {
    const pageContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx'),
      'utf8'
    );
    
    const cssContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.module.css'),
      'utf8'
    );
    
    // 检查动画特性
    const animationFeatures = [
      'framer-motion',
      'AnimatePresence',
      'motion.div',
      'whileHover',
      'whileTap',
      'initial',
      'animate',
      'transition',
      '@keyframes',
      'animation:'
    ];
    
    let foundAnimationFeatures = 0;
    animationFeatures.forEach(feature => {
      const pageMatches = pageContent.includes(feature) ? 1 : 0;
      const cssMatches = cssContent.includes(feature) ? 1 : 0;
      const totalMatches = pageMatches + cssMatches;
      
      if (totalMatches > 0) {
        foundAnimationFeatures++;
        console.log(`   ✅ ${feature} - 动画特性存在`);
        results.improvements.push(`动画效果: ${feature}`);
      } else {
        console.log(`   ❌ ${feature} - 动画特性缺失`);
      }
    });
    
    if (foundAnimationFeatures >= 7) {
      results.passedTests++;
      console.log(`   ✅ 动画效果完善 (${foundAnimationFeatures}/${animationFeatures.length})`);
    } else {
      results.failedTests.push(`动画效果不足 (${foundAnimationFeatures}/${animationFeatures.length})`);
    }
    
    results.uxMetrics.animations = (foundAnimationFeatures / animationFeatures.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`动画效果测试失败: ${error.message}`);
  }

  // 测试3: 验证错误处理改进
  console.log('\n📋 测试3: 验证错误处理改进...');
  results.totalTests++;
  
  try {
    const pageContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx'),
      'utf8'
    );
    
    // 检查错误处理特性
    const errorHandlingFeatures = [
      'renderError',
      'ClearOutlined',
      'SyncOutlined',
      'ReloadOutlined',
      'Alert',
      'Button',
      'loading={state.loading}',
      'state.error',
      'try {',
      'catch'
    ];
    
    let foundErrorFeatures = 0;
    errorHandlingFeatures.forEach(feature => {
      if (pageContent.includes(feature)) {
        foundErrorFeatures++;
        console.log(`   ✅ ${feature} - 错误处理特性存在`);
        results.improvements.push(`错误处理: ${feature}`);
      } else {
        console.log(`   ❌ ${feature} - 错误处理特性缺失`);
      }
    });
    
    if (foundErrorFeatures >= 8) {
      results.passedTests++;
      console.log(`   ✅ 错误处理完善 (${foundErrorFeatures}/${errorHandlingFeatures.length})`);
    } else {
      results.failedTests.push(`错误处理不足 (${foundErrorFeatures}/${errorHandlingFeatures.length})`);
    }
    
    results.uxMetrics.errorHandling = (foundErrorFeatures / errorHandlingFeatures.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`错误处理测试失败: ${error.message}`);
  }

  // 测试4: 验证加载状态优化
  console.log('\n📋 测试4: 验证加载状态优化...');
  results.totalTests++;
  
  try {
    const pageContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx'),
      'utf8'
    );
    
    const cssContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.module.css'),
      'utf8'
    );
    
    // 检查加载状态特性
    const loadingFeatures = [
      'renderLoading',
      'Spin',
      'loading',
      'tabSwitching',
      'state.loading',
      'loadingContainer',
      'loadingText',
      'requestAnimationFrame'
    ];
    
    let foundLoadingFeatures = 0;
    loadingFeatures.forEach(feature => {
      const pageMatches = pageContent.includes(feature) ? 1 : 0;
      const cssMatches = cssContent.includes(feature) ? 1 : 0;
      const totalMatches = pageMatches + cssMatches;
      
      if (totalMatches > 0) {
        foundLoadingFeatures++;
        console.log(`   ✅ ${feature} - 加载状态特性存在`);
        results.improvements.push(`加载状态: ${feature}`);
      } else {
        console.log(`   ❌ ${feature} - 加载状态特性缺失`);
      }
    });
    
    if (foundLoadingFeatures >= 6) {
      results.passedTests++;
      console.log(`   ✅ 加载状态优化完善 (${foundLoadingFeatures}/${loadingFeatures.length})`);
    } else {
      results.failedTests.push(`加载状态优化不足 (${foundLoadingFeatures}/${loadingFeatures.length})`);
    }
    
    results.uxMetrics.loadingStates = (foundLoadingFeatures / loadingFeatures.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`加载状态测试失败: ${error.message}`);
  }

  // 测试5: 验证可访问性改进
  console.log('\n📋 测试5: 验证可访问性改进...');
  results.totalTests++;
  
  try {
    const cssContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.module.css'),
      'utf8'
    );
    
    const pageContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/pages/SecondQuestionnaireAnalyticsPage.tsx'),
      'utf8'
    );
    
    // 检查可访问性特性
    const accessibilityFeatures = [
      '@media (prefers-contrast: high)',
      '@media (prefers-reduced-motion: reduce)',
      '@media (prefers-color-scheme: dark)',
      'Tooltip',
      'aria-',
      'role=',
      'alt=',
      'title='
    ];
    
    let foundAccessibilityFeatures = 0;
    accessibilityFeatures.forEach(feature => {
      const cssMatches = cssContent.includes(feature) ? 1 : 0;
      const pageMatches = pageContent.includes(feature) ? 1 : 0;
      const totalMatches = cssMatches + pageMatches;
      
      if (totalMatches > 0) {
        foundAccessibilityFeatures++;
        console.log(`   ✅ ${feature} - 可访问性特性存在`);
        results.improvements.push(`可访问性: ${feature}`);
      } else {
        console.log(`   ❌ ${feature} - 可访问性特性缺失`);
      }
    });
    
    if (foundAccessibilityFeatures >= 4) {
      results.passedTests++;
      console.log(`   ✅ 可访问性改进完善 (${foundAccessibilityFeatures}/${accessibilityFeatures.length})`);
    } else {
      results.failedTests.push(`可访问性改进不足 (${foundAccessibilityFeatures}/${accessibilityFeatures.length})`);
    }
    
    results.uxMetrics.accessibility = (foundAccessibilityFeatures / accessibilityFeatures.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`可访问性测试失败: ${error.message}`);
  }

  // 计算总体评分
  const scores = Object.values(results.uxMetrics);
  const totalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  results.uxMetrics.overall = totalScore;

  // 输出测试结果
  console.log('\n' + '='.repeat(70));
  console.log('🎨 用户体验完善测试结果');
  console.log('='.repeat(70));
  
  console.log(`\n🎯 测试概览:`);
  console.log(`   总测试数: ${results.totalTests}`);
  console.log(`   通过测试: ${results.passedTests}`);
  console.log(`   失败测试: ${results.failedTests.length}`);
  console.log(`   成功率: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n📈 用户体验指标:`);
  Object.entries(results.uxMetrics).forEach(([key, value]) => {
    const label = {
      responsiveDesign: '响应式设计',
      animations: '动画效果',
      errorHandling: '错误处理',
      loadingStates: '加载状态',
      accessibility: '可访问性',
      overall: '总体评分'
    }[key] || key;
    
    const emoji = value >= 80 ? '🟢' : value >= 60 ? '🟡' : '🔴';
    console.log(`   ${emoji} ${label}: ${value.toFixed(1)}%`);
  });
  
  console.log(`\n✅ 已实现改进:`);
  const improvementsByCategory = {};
  results.improvements.forEach(improvement => {
    const [category, feature] = improvement.split(': ');
    if (!improvementsByCategory[category]) {
      improvementsByCategory[category] = [];
    }
    improvementsByCategory[category].push(feature);
  });
  
  Object.entries(improvementsByCategory).forEach(([category, features]) => {
    console.log(`   📱 ${category}: ${features.length} 项改进`);
  });
  
  if (results.failedTests.length > 0) {
    console.log(`\n❌ 需要改进:`);
    results.failedTests.forEach(failure => {
      console.log(`   • ${failure}`);
    });
  }
  
  const grade = totalScore >= 80 ? '优秀' : totalScore >= 60 ? '良好' : '需要改进';
  console.log(`\n🚀 用户体验水平: ${grade} (${totalScore.toFixed(1)}%)`);
  
  return results;
}

// 运行测试
testUXEnhancement().catch(console.error);
