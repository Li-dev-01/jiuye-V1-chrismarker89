/**
 * 问卷2修复验证脚本
 * 验证所有关键问题是否已正确修复
 */

console.log('🔍 开始验证问卷2修复效果...');

const testConfig = {
  apiBaseUrl: 'http://localhost:8787',
  questionnaireId: 'questionnaire-v2-2024',
  frontendUrl: 'http://localhost:5173',
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
 * 验证1：问卷2 API调用是否正确
 */
async function verifyQuestionnaire2API() {
  console.log('\n📊 验证问卷2 API调用...');
  
  try {
    const apiUrl = `${testConfig.apiBaseUrl}/api/universal-questionnaire/questionnaires/${testConfig.questionnaireId}`;
    const response = await fetchWithTimeout(apiUrl);
    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ API调用失败:', data.message);
      return { success: false, error: data.message };
    }
    
    const questionnaire = data.data;
    console.log(`✅ 问卷获取成功: ${questionnaire.title}`);
    console.log(`📊 问卷ID: ${questionnaire.id}`);
    console.log(`📊 章节数: ${questionnaire.sections.length}`);
    
    return {
      success: true,
      questionnaire,
      sections: questionnaire.sections.length
    };
    
  } catch (error) {
    console.log('❌ API验证失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 验证2：ID冲突是否已修复
 */
async function verifyIDConflictFix() {
  console.log('\n🔧 验证ID冲突修复...');
  
  try {
    const apiUrl = `${testConfig.apiBaseUrl}/api/universal-questionnaire/questionnaires/${testConfig.questionnaireId}`;
    const response = await fetchWithTimeout(apiUrl);
    const data = await response.json();
    
    const questionnaire = data.data;
    const currentStatusSection = questionnaire.sections.find(s => s.id === 'current-status-v2');
    
    if (!currentStatusSection) {
      console.log('❌ 未找到current-status-v2章节');
      return { success: false, error: '缺少current-status-v2章节' };
    }
    
    const currentStatusQuestion = currentStatusSection.questions.find(q => q.id === 'current-status-question-v2');
    
    if (!currentStatusQuestion) {
      console.log('❌ 问题ID仍然冲突或未找到current-status-question-v2');
      return { success: false, error: 'ID冲突未修复' };
    }
    
    console.log('✅ ID冲突已修复');
    console.log(`📊 章节ID: ${currentStatusSection.id}`);
    console.log(`📊 问题ID: ${currentStatusQuestion.id}`);
    
    return {
      success: true,
      sectionId: currentStatusSection.id,
      questionId: currentStatusQuestion.id
    };
    
  } catch (error) {
    console.log('❌ ID冲突验证失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 验证3：经济压力问题是否存在
 */
async function verifyEconomicPressureQuestions() {
  console.log('\n💰 验证经济压力问题...');
  
  try {
    const apiUrl = `${testConfig.apiBaseUrl}/api/universal-questionnaire/questionnaires/${testConfig.questionnaireId}`;
    const response = await fetchWithTimeout(apiUrl);
    const data = await response.json();
    
    const questionnaire = data.data;
    const economicSection = questionnaire.sections.find(s => s.id === 'universal-economic-pressure-v2');
    
    if (!economicSection) {
      console.log('❌ 未找到经济压力章节');
      return { success: false, error: '缺少经济压力章节' };
    }
    
    console.log(`✅ 找到经济压力章节: ${economicSection.title}`);
    
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
          type: question.type
        });
        console.log(`✅ 找到问题: ${question.id} - ${question.title}`);
      } else {
        missingQuestions.push(expectedId);
        console.log(`❌ 缺少问题: ${expectedId}`);
      }
    }
    
    // 验证现代负债选项
    const debtQuestion = economicSection.questions.find(q => q.id === 'debt-situation-v2');
    const modernDebtOptions = [];
    
    if (debtQuestion) {
      const modernOptions = ['alipay-huabei', 'jd-baitiao', 'wechat-pay-later'];
      for (const option of modernOptions) {
        const found = debtQuestion.options.find(opt => opt.value === option);
        if (found) {
          modernDebtOptions.push(found);
          console.log(`✅ 找到现代负债选项: ${found.label}`);
        }
      }
    }
    
    return {
      success: foundQuestions.length === expectedQuestions.length,
      foundQuestions,
      missingQuestions,
      modernDebtOptions,
      sectionTitle: economicSection.title
    };
    
  } catch (error) {
    console.log('❌ 经济压力问题验证失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 验证4：就业信心问题是否存在
 */
async function verifyEmploymentConfidenceQuestions() {
  console.log('\n📈 验证就业信心问题...');
  
  try {
    const apiUrl = `${testConfig.apiBaseUrl}/api/universal-questionnaire/questionnaires/${testConfig.questionnaireId}`;
    const response = await fetchWithTimeout(apiUrl);
    const data = await response.json();
    
    const questionnaire = data.data;
    const confidenceSection = questionnaire.sections.find(s => s.id === 'employment-confidence-v2');
    
    if (!confidenceSection) {
      console.log('❌ 未找到就业信心章节');
      return { success: false, error: '缺少就业信心章节' };
    }
    
    console.log(`✅ 找到就业信心章节: ${confidenceSection.title}`);
    
    const expectedQuestions = [
      'employment-confidence-6months-v2',
      'employment-confidence-1year-v2'
    ];
    
    const foundQuestions = [];
    
    for (const expectedId of expectedQuestions) {
      const question = confidenceSection.questions.find(q => q.id === expectedId);
      if (question) {
        foundQuestions.push({
          id: question.id,
          title: question.title
        });
        console.log(`✅ 找到问题: ${question.id} - ${question.title}`);
      }
    }
    
    return {
      success: foundQuestions.length === expectedQuestions.length,
      foundQuestions,
      sectionTitle: confidenceSection.title
    };
    
  } catch (error) {
    console.log('❌ 就业信心问题验证失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 主验证函数
 */
async function runVerification() {
  console.log('🚀 开始问卷2修复验证');
  console.log(`📡 API服务器: ${testConfig.apiBaseUrl}`);
  console.log(`📋 问卷ID: ${testConfig.questionnaireId}`);
  
  const results = {
    apiCall: null,
    idConflict: null,
    economicPressure: null,
    employmentConfidence: null,
    overallSuccess: false
  };
  
  // 执行各项验证
  results.apiCall = await verifyQuestionnaire2API();
  results.idConflict = await verifyIDConflictFix();
  results.economicPressure = await verifyEconomicPressureQuestions();
  results.employmentConfidence = await verifyEmploymentConfidenceQuestions();
  
  // 计算总体结果
  const allSuccess = results.apiCall.success && 
                    results.idConflict.success && 
                    results.economicPressure.success && 
                    results.employmentConfidence.success;
  
  results.overallSuccess = allSuccess;
  
  // 输出验证结果汇总
  console.log('\n🎯 验证结果汇总');
  console.log('='.repeat(50));
  console.log(`📊 API调用: ${results.apiCall.success ? '✅ 成功' : '❌ 失败'}`);
  console.log(`🔧 ID冲突修复: ${results.idConflict.success ? '✅ 成功' : '❌ 失败'}`);
  console.log(`💰 经济压力问题: ${results.economicPressure.success ? '✅ 完整' : '❌ 缺失'}`);
  console.log(`📈 就业信心问题: ${results.employmentConfidence.success ? '✅ 完整' : '❌ 缺失'}`);
  console.log('='.repeat(50));
  
  if (results.overallSuccess) {
    console.log('🎉 所有修复验证通过！问卷2现在应该能正常工作');
    
    console.log('\n📋 问卷2特色功能确认:');
    if (results.economicPressure.modernDebtOptions) {
      console.log('💳 现代负债类型:');
      results.economicPressure.modernDebtOptions.forEach(opt => {
        console.log(`  • ${opt.label}`);
      });
    }
    
    if (results.employmentConfidence.foundQuestions) {
      console.log('📈 就业信心评估:');
      results.employmentConfidence.foundQuestions.forEach(q => {
        console.log(`  • ${q.title}`);
      });
    }
    
    console.log('\n🎯 用户现在应该能够:');
    console.log('  1. 看到问卷2的经济压力相关问题');
    console.log('  2. 选择现代负债类型（花呗、白条等）');
    console.log('  3. 评估就业信心指数');
    console.log('  4. 完成后正常跳转到故事墙');
    
  } else {
    console.log('❌ 部分验证失败，需要进一步修复');
    
    if (!results.apiCall.success) {
      console.log('  • API调用问题需要解决');
    }
    if (!results.idConflict.success) {
      console.log('  • ID冲突仍需修复');
    }
    if (!results.economicPressure.success) {
      console.log('  • 经济压力问题配置不完整');
    }
    if (!results.employmentConfidence.success) {
      console.log('  • 就业信心问题配置不完整');
    }
  }
  
  return results;
}

// 运行验证
runVerification().catch(error => {
  console.error('💥 验证执行失败:', error);
});
