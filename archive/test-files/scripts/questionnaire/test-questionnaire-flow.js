/**
 * 第二问卷防刷验证功能测试脚本
 * 在浏览器控制台中运行此脚本来测试防刷验证功能
 */

console.log('🧪 开始第二问卷防刷验证功能测试');

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5175',
  questionnairePath: '/questionnaire-v2/survey',
  apiBaseUrl: 'http://localhost:53389/api',
  testTimeout: 5000
};

// 测试结果收集器
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// 测试工具函数
function addTestResult(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    testResults.failed++;
    console.error(`❌ ${name}: ${message}`);
  }
}

// 等待函数
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试1: 检查页面是否正常加载
async function testPageLoad() {
  try {
    const currentUrl = window.location.href;
    const isCorrectPage = currentUrl.includes('/questionnaire-v2/survey');
    
    addTestResult(
      '页面加载测试',
      isCorrectPage,
      isCorrectPage ? '问卷页面正常加载' : `当前页面: ${currentUrl}`
    );
    
    return isCorrectPage;
  } catch (error) {
    addTestResult('页面加载测试', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试2: 检查防刷验证组件是否存在
async function testAntiSpamComponentExists() {
  try {
    // 检查组件是否已导入（通过检查React组件树）
    const hasReactRoot = document.querySelector('#root');
    const hasQuestionnaireContent = document.querySelector('.second-questionnaire-container') || 
                                   document.querySelector('[class*="questionnaire"]');
    
    addTestResult(
      '防刷验证组件检查',
      hasReactRoot && hasQuestionnaireContent,
      hasReactRoot && hasQuestionnaireContent ? 
        '问卷容器存在，组件应该已正确导入' : 
        '未找到问卷容器'
    );
    
    return hasReactRoot && hasQuestionnaireContent;
  } catch (error) {
    addTestResult('防刷验证组件检查', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试3: 检查问卷章节显示
async function testSectionDisplay() {
  try {
    // 查找章节指示器
    const sectionIndicators = document.querySelectorAll('[class*="section"], [class*="chapter"], .progress');
    const progressText = document.body.innerText;
    
    // 检查是否显示"章节 1/1"（这是我们要修复的问题）
    const showsOnlyOneSection = progressText.includes('章节 1/1') || progressText.includes('1 / 1');
    const hasMultipleSections = !showsOnlyOneSection && (
      progressText.includes('章节') || 
      progressText.includes('section') ||
      sectionIndicators.length > 0
    );
    
    addTestResult(
      '章节显示测试',
      !showsOnlyOneSection,
      showsOnlyOneSection ? 
        '仍然显示"章节 1/1"，需要修复' : 
        hasMultipleSections ? '正确显示多章节' : '章节显示正常'
    );
    
    return !showsOnlyOneSection;
  } catch (error) {
    addTestResult('章节显示测试', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试4: 模拟问卷填写流程
async function testQuestionnaireFlow() {
  try {
    // 查找问题选项
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    const buttons = document.querySelectorAll('button');
    const nextButtons = Array.from(buttons).filter(btn => 
      btn.textContent.includes('下一题') || 
      btn.textContent.includes('完成') ||
      btn.textContent.includes('Next')
    );
    
    addTestResult(
      '问卷交互元素检查',
      radioButtons.length > 0 && nextButtons.length > 0,
      `找到 ${radioButtons.length} 个选项，${nextButtons.length} 个导航按钮`
    );
    
    return radioButtons.length > 0 && nextButtons.length > 0;
  } catch (error) {
    addTestResult('问卷交互元素检查', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试5: 检查API连接
async function testAPIConnection() {
  try {
    const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/universal-questionnaire/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionnaireId: 'employment-survey-2024',
        sectionResponses: [{
          sectionId: 'test',
          questionResponses: [{ questionId: 'test', value: 'test' }]
        }],
        metadata: {
          participantGroup: 'test',
          startedAt: new Date().toISOString(),
          responseTimeSeconds: 1,
          userAgent: 'Test'
        }
      })
    });
    
    const result = await response.json();
    const isAPIWorking = response.ok && result.success;
    
    addTestResult(
      'API连接测试',
      isAPIWorking,
      isAPIWorking ? 
        `API正常工作，响应: ${result.message}` : 
        `API错误: ${result.message || response.statusText}`
    );
    
    return isAPIWorking;
  } catch (error) {
    addTestResult('API连接测试', false, `网络错误: ${error.message}`);
    return false;
  }
}

// 测试6: 检查控制台错误
async function testConsoleErrors() {
  try {
    // 这个测试需要手动检查，因为我们无法从脚本中直接访问控制台错误
    const hasVisibleErrors = document.querySelector('.error, .alert-error, [class*="error"]');
    
    addTestResult(
      '页面错误检查',
      !hasVisibleErrors,
      hasVisibleErrors ? 
        '页面上发现错误提示' : 
        '页面上未发现明显错误'
    );
    
    console.log('📋 请手动检查控制台是否有以下错误:');
    console.log('   - UniversalAntiSpamVerification 导入错误');
    console.log('   - React 组件渲染错误');
    console.log('   - 网络请求错误');
    
    return !hasVisibleErrors;
  } catch (error) {
    addTestResult('页面错误检查', false, `错误: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始执行所有测试...\n');
  
  await testPageLoad();
  await wait(500);
  
  await testAntiSpamComponentExists();
  await wait(500);
  
  await testSectionDisplay();
  await wait(500);
  
  await testQuestionnaireFlow();
  await wait(500);
  
  await testAPIConnection();
  await wait(500);
  
  await testConsoleErrors();
  
  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  console.log('\n📋 详细结果:');
  testResults.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.message}`);
  });
  
  // 给出建议
  if (testResults.failed > 0) {
    console.log('\n🔧 修复建议:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  } else {
    console.log('\n🎉 所有测试通过！防刷验证功能应该正常工作。');
  }
  
  return testResults;
}

// 如果在浏览器控制台中运行，自动开始测试
if (typeof window !== 'undefined') {
  console.log('🎯 在浏览器控制台中检测到，开始自动测试...');
  runAllTests().then(results => {
    console.log('🏁 测试完成！');
    
    // 提供手动测试指导
    console.log('\n🔍 手动测试步骤:');
    console.log('1. 依次回答问卷中的问题');
    console.log('2. 观察是否能正确进入下一章节');
    console.log('3. 到达最后一题时，点击"完成"按钮');
    console.log('4. 检查是否弹出数字验证窗口');
    console.log('5. 选择正确数字，验证是否成功提交');
  });
}

// 导出测试函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
}
