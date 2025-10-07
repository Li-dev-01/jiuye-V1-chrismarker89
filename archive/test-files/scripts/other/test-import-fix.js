/**
 * 测试导入修复是否有效
 */

import { promises as fs } from 'fs';
import path from 'path';

async function testImportFix() {
  console.log('🔧 测试导入修复...\n');
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    issues: []
  };

  // 测试1: 检查 hybridVisualizationService.ts 的导入
  console.log('📋 测试1: 检查 hybridVisualizationService.ts 的导入...');
  results.totalTests++;
  
  try {
    const serviceContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/hybridVisualizationService.ts'),
      'utf8'
    );
    
    // 检查正确的导入语句
    const hasCorrectImport = serviceContent.includes('import {\n  Q2_DIMENSION_IDS,\n  Q1_DIMENSION_IDS\n} from');
    const hasUsage = serviceContent.includes('Q2_DIMENSION_IDS.ECONOMIC_PRESSURE');
    
    if (hasCorrectImport && hasUsage) {
      results.passedTests++;
      console.log('   ✅ hybridVisualizationService.ts 导入修复成功');
    } else {
      results.issues.push('hybridVisualizationService.ts 导入仍有问题');
      console.log('   ❌ hybridVisualizationService.ts 导入仍有问题');
    }
    
  } catch (error) {
    results.issues.push(`hybridVisualizationService.ts 检查失败: ${error.message}`);
  }

  // 测试2: 检查 questionnaire1StyleAdapter.ts 的导入
  console.log('\n📋 测试2: 检查 questionnaire1StyleAdapter.ts 的导入...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'),
      'utf8'
    );
    
    // 检查正确的导入语句
    const hasCorrectImport = adapterContent.includes('import {\n  Q1_DIMENSION_IDS\n} from');
    const hasUsage = adapterContent.includes('Q1_DIMENSION_IDS.EMPLOYMENT_OVERVIEW');
    
    if (hasCorrectImport && hasUsage) {
      results.passedTests++;
      console.log('   ✅ questionnaire1StyleAdapter.ts 导入修复成功');
    } else {
      results.issues.push('questionnaire1StyleAdapter.ts 导入仍有问题');
      console.log('   ❌ questionnaire1StyleAdapter.ts 导入仍有问题');
    }
    
  } catch (error) {
    results.issues.push(`questionnaire1StyleAdapter.ts 检查失败: ${error.message}`);
  }

  // 测试3: 检查重复方法是否已删除
  console.log('\n📋 测试3: 检查重复方法是否已删除...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'),
      'utf8'
    );
    
    // 计算 findDimension 方法的出现次数
    const findDimensionMatches = adapterContent.match(/private findDimension\(/g);
    const count = findDimensionMatches ? findDimensionMatches.length : 0;
    
    if (count === 1) {
      results.passedTests++;
      console.log('   ✅ 重复的 findDimension 方法已删除');
    } else {
      results.issues.push(`仍有 ${count} 个 findDimension 方法`);
      console.log(`   ❌ 仍有 ${count} 个 findDimension 方法`);
    }
    
  } catch (error) {
    results.issues.push(`重复方法检查失败: ${error.message}`);
  }

  // 测试4: 检查常量定义是否正确
  console.log('\n📋 测试4: 检查常量定义是否正确...');
  results.totalTests++;
  
  try {
    const typesContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/types/hybridVisualization.ts'),
      'utf8'
    );
    
    // 检查常量定义
    const hasQ1Constants = typesContent.includes('export const Q1_DIMENSION_IDS = {');
    const hasQ2Constants = typesContent.includes('export const Q2_DIMENSION_IDS = {');
    
    if (hasQ1Constants && hasQ2Constants) {
      results.passedTests++;
      console.log('   ✅ 常量定义正确');
    } else {
      results.issues.push('常量定义缺失或错误');
      console.log('   ❌ 常量定义缺失或错误');
    }
    
  } catch (error) {
    results.issues.push(`常量定义检查失败: ${error.message}`);
  }

  // 输出结果
  console.log('\n' + '='.repeat(50));
  console.log('🔧 导入修复测试结果');
  console.log('='.repeat(50));
  
  console.log(`\n📊 测试概览:`);
  console.log(`   总测试数: ${results.totalTests}`);
  console.log(`   通过测试: ${results.passedTests}`);
  console.log(`   失败测试: ${results.issues.length}`);
  console.log(`   成功率: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  
  if (results.issues.length > 0) {
    console.log(`\n❌ 仍需修复的问题:`);
    results.issues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  } else {
    console.log(`\n✅ 所有导入问题已修复！`);
  }
  
  const status = results.passedTests === results.totalTests ? '成功' : '部分成功';
  console.log(`\n🚀 修复状态: ${status}`);
  
  return results;
}

// 运行测试
testImportFix().catch(console.error);
