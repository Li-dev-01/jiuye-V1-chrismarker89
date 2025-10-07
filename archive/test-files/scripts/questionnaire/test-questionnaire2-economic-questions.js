/**
 * 问卷2经济类问题验证脚本
 * 验证经济压力相关问题是否正确显示
 */

console.log('🔍 开始验证问卷2经济类问题...');

// 测试配置
const testConfig = {
  apiBaseUrl: 'http://localhost:8787',
  questionnaireId: 'questionnaire-v2-2024',
  frontendUrl: 'http://localhost:5173/questionnaire-v2/survey',
  timeout: 10000
};

/**
 * 发送HTTP请求的工具函数
 */
async function fetchWithTimeout(url, options = {}, timeout = testConfig.timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 验证API中的经济类问题
 */
async function validateEconomicQuestionsInAPI() {
  console.log('\n📊 验证API中的经济类问题...');
  
  try {
    const apiUrl = `${testConfig.apiBaseUrl}/api/universal-questionnaire/questionnaires/${testConfig.questionnaireId}`;
    console.log(`🔗 请求API: ${apiUrl}`);
    
    const response = await fetchWithTimeout(apiUrl);
    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ API请求失败:', data.message);
      return { success: false, error: data.message };
    }
    
    const questionnaire = data.data;
    console.log(`✅ 问卷获取成功: ${questionnaire.title}`);
    console.log(`📊 总章节数: ${questionnaire.sections.length}`);
    
    // 查找经济压力相关章节
    const economicSection = questionnaire.sections.find(section => 
      section.id === 'universal-economic-pressure-v2'
    );
    
    if (!economicSection) {
      console.log('❌ 未找到经济压力评估章节');
      return { success: false, error: '缺少经济压力章节' };
    }
    
    console.log(`✅ 找到经济压力章节: ${economicSection.title}`);
    console.log(`📊 经济压力章节问题数: ${economicSection.questions.length}`);
    
    // 验证关键经济问题
    const expectedQuestions = [
      'debt-situation-v2',
      'monthly-debt-burden-v2', 
      'economic-pressure-level-v2'
    ];
    
    const foundQuestions = [];
    const missingQuestions = [];
    
    for (const expectedId of expectedQuestions) {
      const question = economicSection.questions.find(q => q.id === expectedId);
      if (question) {
        foundQuestions.push({
          id: question.id,
          title: question.title,
          type: question.type,
          optionsCount: question.options?.length || 0
        });
        console.log(`✅ 找到问题: ${question.id} - ${question.title}`);
      } else {
        missingQuestions.push(expectedId);
        console.log(`❌ 缺少问题: ${expectedId}`);
      }
    }
    
    // 验证负债问题的选项
    const debtQuestion = economicSection.questions.find(q => q.id === 'debt-situation-v2');
    if (debtQuestion) {
      console.log('\n💰 验证负债问题选项:');
      const expectedDebtOptions = [
        'student-loan',
        'alipay-huabei', 
        'credit-card',
        'jd-baitiao',
        'wechat-pay-later',
        'consumer-loan'
      ];
      
      const foundDebtOptions = [];
      const missingDebtOptions = [];
      
      for (const expectedOption of expectedDebtOptions) {
        const option = debtQuestion.options.find(opt => opt.value === expectedOption);
        if (option) {
          foundDebtOptions.push(option);
          console.log(`✅ 找到负债选项: ${option.value} - ${option.label}`);
        } else {
          missingDebtOptions.push(expectedOption);
          console.log(`❌ 缺少负债选项: ${expectedOption}`);
        }
      }
      
      return {
        success: true,
        economicSection: {
          id: economicSection.id,
          title: economicSection.title,
          questionsCount: economicSection.questions.length
        },
        foundQuestions,
        missingQuestions,
        debtOptions: {
          found: foundDebtOptions,
          missing: missingDebtOptions
        }
      };
    }
    
    return {
      success: true,
      economicSection: {
        id: economicSection.id,
        title: economicSection.title,
        questionsCount: economicSection.questions.length
      },
      foundQuestions,
      missingQuestions
    };
    
  } catch (error) {
    console.log('❌ API验证失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 验证前端服务状态
 */
async function validateFrontendService() {
  console.log('\n🌐 验证前端服务状态...');
  
  try {
    const response = await fetchWithTimeout('http://localhost:5173/');
    if (response.ok) {
      console.log('✅ 前端服务运行正常');
      return { success: true };
    } else {
      console.log('❌ 前端服务响应异常:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('❌ 前端服务连接失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 检查前端问卷页面
 */
async function checkFrontendQuestionnairePage() {
  console.log('\n📱 检查前端问卷页面...');
  
  try {
    const response = await fetchWithTimeout(testConfig.frontendUrl);
    if (response.ok) {
      const html = await response.text();
      
      // 检查页面是否包含问卷相关内容
      const hasQuestionnaireContent = html.includes('问卷') || html.includes('questionnaire');
      const hasReactRoot = html.includes('root') || html.includes('app');
      
      console.log(`✅ 问卷页面可访问: ${testConfig.frontendUrl}`);
      console.log(`📊 包含问卷内容: ${hasQuestionnaireContent ? '是' : '否'}`);
      console.log(`📊 包含React根元素: ${hasReactRoot ? '是' : '否'}`);
      
      return {
        success: true,
        url: testConfig.frontendUrl,
        hasQuestionnaireContent,
        hasReactRoot
      };
    } else {
      console.log('❌ 问卷页面访问失败:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('❌ 问卷页面检查失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 主验证函数
 */
async function runEconomicQuestionsValidation() {
  console.log('🚀 开始问卷2经济类问题验证');
  console.log(`🔗 API服务器: ${testConfig.apiBaseUrl}`);
  console.log(`🌐 前端服务器: http://localhost:5173`);
  console.log(`📋 问卷ID: ${testConfig.questionnaireId}`);
  
  const results = {
    apiValidation: null,
    frontendService: null,
    frontendPage: null,
    overall: false
  };
  
  // 验证API中的经济问题
  results.apiValidation = await validateEconomicQuestionsInAPI();
  
  // 验证前端服务
  results.frontendService = await validateFrontendService();
  
  // 检查前端问卷页面
  results.frontendPage = await checkFrontendQuestionnairePage();
  
  // 计算总体状态
  const apiOk = results.apiValidation.success;
  const frontendOk = results.frontendService.success;
  const pageOk = results.frontendPage.success;
  
  results.overall = apiOk && frontendOk && pageOk;
  
  // 输出验证结果汇总
  console.log('\n🎯 验证结果汇总');
  console.log('='.repeat(50));
  console.log(`📊 API经济问题验证: ${apiOk ? '✅ 通过' : '❌ 失败'}`);
  console.log(`🌐 前端服务状态: ${frontendOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`📱 问卷页面访问: ${pageOk ? '✅ 可访问' : '❌ 无法访问'}`);
  console.log('='.repeat(50));
  
  if (results.overall) {
    console.log('🎉 问卷2经济类问题验证通过！');
    
    if (results.apiValidation.foundQuestions) {
      console.log('\n📋 发现的经济问题:');
      results.apiValidation.foundQuestions.forEach(q => {
        console.log(`  • ${q.id}: ${q.title} (${q.type}, ${q.optionsCount}个选项)`);
      });
    }
    
    if (results.apiValidation.debtOptions?.found) {
      console.log('\n💰 发现的负债选项:');
      results.apiValidation.debtOptions.found.forEach(opt => {
        console.log(`  • ${opt.value}: ${opt.label}`);
      });
    }
  } else {
    console.log('❌ 问卷2经济类问题验证失败');
    
    if (results.apiValidation.missingQuestions?.length > 0) {
      console.log('\n❌ 缺少的问题:');
      results.apiValidation.missingQuestions.forEach(id => {
        console.log(`  • ${id}`);
      });
    }
  }
  
  console.log('\n📝 建议操作:');
  if (!apiOk) {
    console.log('  1. 检查后端服务是否正常运行');
    console.log('  2. 验证问卷定义文件是否正确');
  }
  if (!frontendOk) {
    console.log('  3. 检查前端服务是否启动');
    console.log('  4. 验证前端配置是否正确');
  }
  if (!pageOk) {
    console.log('  5. 检查问卷页面路由是否正确');
    console.log('  6. 验证前端API调用配置');
  }
  
  return results;
}

// 运行验证
runEconomicQuestionsValidation().catch(error => {
  console.error('💥 验证执行失败:', error);
});
