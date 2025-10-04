/**
 * 问卷系统独立性验证脚本
 * 验证问卷1和问卷2是否完全独立
 */

console.log('🔍 开始验证问卷系统独立性...');

// 测试配置
const testConfig = {
  baseUrl: 'http://localhost:53389',
  questionnaire1Id: 'questionnaire-v1-2024',
  questionnaire2Id: 'questionnaire-v2-2024',
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
 * 测试问卷1系统独立性
 */
async function testQuestionnaireV1Independence() {
  console.log('\n📋 测试问卷1系统独立性...');
  
  try {
    // 测试问卷1定义获取
    const definitionUrl = `${testConfig.baseUrl}/api/questionnaire-v1/definition/${testConfig.questionnaire1Id}`;
    console.log(`🔗 请求问卷1定义: ${definitionUrl}`);
    
    const definitionResponse = await fetchWithTimeout(definitionUrl);
    const definitionData = await definitionResponse.json();
    
    if (definitionData.success) {
      console.log('✅ 问卷1定义获取成功');
      console.log(`📊 问卷1标题: ${definitionData.data.title}`);
      console.log(`📊 问卷1章节数: ${definitionData.data.sections.length}`);
      console.log(`📊 系统版本: ${definitionData.systemInfo?.systemVersion || 'N/A'}`);
      
      // 验证问卷1特有特征
      const hasTraditionalFeatures = definitionData.systemInfo?.supportedFeatures?.includes('traditional-validation');
      console.log(`📊 包含传统问卷特征: ${hasTraditionalFeatures ? '✅' : '❌'}`);
      
      return {
        success: true,
        data: definitionData.data,
        systemInfo: definitionData.systemInfo
      };
    } else {
      console.log('❌ 问卷1定义获取失败:', definitionData.message);
      return { success: false, error: definitionData.message };
    }
  } catch (error) {
    console.log('❌ 问卷1系统测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试问卷2系统独立性
 */
async function testQuestionnaireV2Independence() {
  console.log('\n📋 测试问卷2系统独立性...');
  
  try {
    // 测试问卷2定义获取
    const definitionUrl = `${testConfig.baseUrl}/api/questionnaire-v2/questionnaires/${testConfig.questionnaire2Id}`;
    console.log(`🔗 请求问卷2定义: ${definitionUrl}`);
    
    const definitionResponse = await fetchWithTimeout(definitionUrl);
    const definitionData = await definitionResponse.json();
    
    if (definitionData.success) {
      console.log('✅ 问卷2定义获取成功');
      console.log(`📊 问卷2标题: ${definitionData.data.title}`);
      console.log(`📊 问卷2章节数: ${definitionData.data.sections.length}`);
      console.log(`📊 系统版本: ${definitionData.systemInfo?.systemVersion || 'N/A'}`);
      
      // 验证问卷2特有特征
      const hasEconomicFeatures = definitionData.systemInfo?.supportedFeatures?.includes('economic-pressure-analysis');
      console.log(`📊 包含经济压力分析特征: ${hasEconomicFeatures ? '✅' : '❌'}`);
      
      return {
        success: true,
        data: definitionData.data,
        systemInfo: definitionData.systemInfo
      };
    } else {
      console.log('❌ 问卷2定义获取失败:', definitionData.message);
      return { success: false, error: definitionData.message };
    }
  } catch (error) {
    console.log('❌ 问卷2系统测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试系统信息独立性
 */
async function testSystemInfoIndependence() {
  console.log('\n🔧 测试系统信息独立性...');
  
  try {
    // 获取问卷1系统信息
    const v1InfoResponse = await fetchWithTimeout(`${testConfig.baseUrl}/api/questionnaire-v1/system-info`);
    const v1InfoData = await v1InfoResponse.json();
    
    // 获取问卷2系统信息
    const v2InfoResponse = await fetchWithTimeout(`${testConfig.baseUrl}/api/questionnaire-v2/system-info`);
    const v2InfoData = await v2InfoResponse.json();
    
    if (v1InfoData.success && v2InfoData.success) {
      console.log('✅ 两个系统信息都获取成功');
      
      const v1System = v1InfoData.data.systemInfo;
      const v2System = v2InfoData.data.systemInfo;
      
      console.log(`📊 问卷1系统: ${v1System.systemName} (${v1System.systemVersion})`);
      console.log(`📊 问卷2系统: ${v2System.systemName} (${v2System.systemVersion})`);
      
      // 验证系统独立性
      const systemsAreDifferent = v1System.systemVersion !== v2System.systemVersion;
      const apiPrefixesDifferent = v1System.apiPrefix !== v2System.apiPrefix;
      const databaseTablesDifferent = v1System.databaseTable !== v2System.databaseTable;
      
      console.log(`📊 系统版本不同: ${systemsAreDifferent ? '✅' : '❌'}`);
      console.log(`📊 API前缀不同: ${apiPrefixesDifferent ? '✅' : '❌'}`);
      console.log(`📊 数据库表不同: ${databaseTablesDifferent ? '✅' : '❌'}`);
      
      return {
        success: true,
        independence: systemsAreDifferent && apiPrefixesDifferent && databaseTablesDifferent,
        v1System,
        v2System
      };
    } else {
      console.log('❌ 系统信息获取失败');
      return { success: false };
    }
  } catch (error) {
    console.log('❌ 系统信息测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试数据格式独立性
 */
async function testDataFormatIndependence(v1Data, v2Data) {
  console.log('\n📊 测试数据格式独立性...');
  
  try {
    // 比较问卷结构
    const v1HasSections = Array.isArray(v1Data.sections);
    const v2HasSections = Array.isArray(v2Data.sections);
    
    console.log(`📊 问卷1有章节结构: ${v1HasSections ? '✅' : '❌'}`);
    console.log(`📊 问卷2有章节结构: ${v2HasSections ? '✅' : '❌'}`);
    
    if (v1HasSections && v2HasSections) {
      // 比较问题类型
      const v1Questions = v1Data.sections.flatMap(s => s.questions || []);
      const v2Questions = v2Data.sections.flatMap(s => s.questions || []);
      
      console.log(`📊 问卷1问题数量: ${v1Questions.length}`);
      console.log(`📊 问卷2问题数量: ${v2Questions.length}`);
      
      // 检查问题ID重叠
      const v1QuestionIds = new Set(v1Questions.map(q => q.id));
      const v2QuestionIds = new Set(v2Questions.map(q => q.id));
      
      const overlappingIds = [...v1QuestionIds].filter(id => v2QuestionIds.has(id));
      console.log(`📊 重叠问题ID数量: ${overlappingIds.length}`);
      
      if (overlappingIds.length > 0) {
        console.log(`⚠️ 发现重叠问题ID: ${overlappingIds.join(', ')}`);
      }
      
      // 检查经济类问题
      const v1EconomicQuestions = v1Questions.filter(q => 
        q.id.includes('salary') || q.id.includes('economic') || q.title.includes('经济')
      );
      const v2EconomicQuestions = v2Questions.filter(q => 
        q.id.includes('debt') || q.id.includes('economic') || q.id.includes('pressure') || 
        q.title.includes('经济') || q.title.includes('负债') || q.title.includes('压力')
      );
      
      console.log(`📊 问卷1经济类问题: ${v1EconomicQuestions.length}个`);
      console.log(`📊 问卷2经济类问题: ${v2EconomicQuestions.length}个`);
      
      return {
        success: true,
        v1QuestionCount: v1Questions.length,
        v2QuestionCount: v2Questions.length,
        overlappingIds: overlappingIds.length,
        v1EconomicQuestions: v1EconomicQuestions.length,
        v2EconomicQuestions: v2EconomicQuestions.length
      };
    }
    
    return { success: false, error: '问卷结构不完整' };
  } catch (error) {
    console.log('❌ 数据格式测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 主测试函数
 */
async function runIndependenceTest() {
  console.log('🚀 开始问卷系统独立性验证');
  console.log(`🔗 测试服务器: ${testConfig.baseUrl}`);
  
  const results = {
    v1Test: null,
    v2Test: null,
    systemTest: null,
    dataTest: null,
    overall: false
  };
  
  // 测试问卷1
  results.v1Test = await testQuestionnaireV1Independence();
  
  // 测试问卷2
  results.v2Test = await testQuestionnaireV2Independence();
  
  // 测试系统信息
  results.systemTest = await testSystemInfoIndependence();
  
  // 测试数据格式（如果前面的测试都成功）
  if (results.v1Test.success && results.v2Test.success) {
    results.dataTest = await testDataFormatIndependence(
      results.v1Test.data,
      results.v2Test.data
    );
  }
  
  // 计算总体独立性评分
  const scores = {
    v1Available: results.v1Test.success ? 1 : 0,
    v2Available: results.v2Test.success ? 1 : 0,
    systemIndependent: results.systemTest?.independence ? 1 : 0,
    dataIndependent: results.dataTest?.overlappingIds === 0 ? 1 : 0
  };
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = Object.keys(scores).length;
  const independencePercentage = Math.round((totalScore / maxScore) * 100);
  
  // 输出最终结果
  console.log('\n🎯 独立性验证结果汇总');
  console.log('='.repeat(50));
  console.log(`📊 问卷1系统可用性: ${scores.v1Available ? '✅' : '❌'}`);
  console.log(`📊 问卷2系统可用性: ${scores.v2Available ? '✅' : '❌'}`);
  console.log(`📊 系统配置独立性: ${scores.systemIndependent ? '✅' : '❌'}`);
  console.log(`📊 数据格式独立性: ${scores.dataIndependent ? '✅' : '❌'}`);
  console.log('='.repeat(50));
  console.log(`🎯 总体独立性评分: ${independencePercentage}% (${totalScore}/${maxScore})`);
  
  if (independencePercentage >= 90) {
    console.log('🎉 恭喜！问卷系统已实现高度独立性');
  } else if (independencePercentage >= 70) {
    console.log('⚠️ 问卷系统基本独立，但仍有改进空间');
  } else {
    console.log('❌ 问卷系统独立性不足，需要进一步优化');
  }
  
  return results;
}

// 运行测试
runIndependenceTest().catch(error => {
  console.error('💥 测试执行失败:', error);
});
