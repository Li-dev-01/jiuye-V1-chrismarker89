#!/usr/bin/env node

/**
 * 测试问卷提交流程脚本
 * 模拟完整的问卷提交过程，检查每个步骤
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 模拟问卷数据
const mockQuestionnaireData = {
  questionnaireId: 'employment-survey-2024',
  sectionResponses: [
    {
      sectionId: 'personal-info',
      questionResponses: [
        { questionId: 'age-range', value: '26-30', timestamp: Date.now() },
        { questionId: 'gender', value: 'male', timestamp: Date.now() },
        { questionId: 'education-level', value: 'bachelor', timestamp: Date.now() }
      ]
    },
    {
      sectionId: 'employment-info',
      questionResponses: [
        { questionId: 'employment-status', value: 'employed', timestamp: Date.now() },
        { questionId: 'work-location-preference', value: 'beijing', timestamp: Date.now() },
        { questionId: 'salary-expectation', value: '15000-20000', timestamp: Date.now() }
      ]
    }
  ],
  metadata: {
    submittedAt: Date.now(),
    completionTime: 300,
    userAgent: 'Test Browser/1.0',
    version: '1.0.0',
    submissionType: 'anonymous',
    submissionSource: 'web'
  }
};

async function testQuestionnaireSubmission() {
  console.log('🧪 开始测试问卷提交流程...\n');
  
  try {
    // 1. 测试API连通性
    console.log('📡 1. 测试API连通性');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ API状态: ${healthData.data?.status || 'unknown'}`);
    
    // 2. 测试提交端点可访问性
    console.log('\n🔌 2. 测试提交端点可访问性');
    const optionsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
      method: 'OPTIONS'
    });
    console.log(`✅ OPTIONS请求状态码: ${optionsResponse.status}`);
    
    // 3. 验证问卷数据格式
    console.log('\n📋 3. 验证问卷数据格式');
    console.log('问卷数据结构:');
    console.log(`  - questionnaireId: ${mockQuestionnaireData.questionnaireId}`);
    console.log(`  - sectionResponses: ${mockQuestionnaireData.sectionResponses.length} 个部分`);
    console.log(`  - metadata: ${Object.keys(mockQuestionnaireData.metadata).length} 个字段`);
    
    // 4. 实际提交测试
    console.log('\n🚀 4. 执行实际提交测试');
    console.log('发送POST请求到:', `${API_BASE_URL}/universal-questionnaire/submit`);
    
    const submitResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockQuestionnaireData),
    });
    
    console.log(`📡 响应状态码: ${submitResponse.status}`);
    console.log(`📡 响应状态: ${submitResponse.statusText}`);
    
    // 5. 解析响应数据
    console.log('\n📊 5. 解析响应数据');
    let responseData;
    try {
      responseData = await submitResponse.json();
      console.log('响应数据:', JSON.stringify(responseData, null, 2));
    } catch (error) {
      console.error('❌ 响应数据解析失败:', error.message);
      const responseText = await submitResponse.text();
      console.log('原始响应文本:', responseText);
      return;
    }
    
    // 6. 分析提交结果
    console.log('\n🔍 6. 分析提交结果');
    if (submitResponse.ok && responseData.success) {
      console.log('✅ 提交成功！');
      console.log(`📝 提交ID: ${responseData.data?.submissionId}`);
      console.log(`📅 提交时间: ${responseData.data?.submittedAt}`);
      
      // 验证数据是否真的保存到数据库
      console.log('\n🔍 7. 验证数据库保存');
      if (responseData.data?.submissionId) {
        // 等待一下让数据库写入完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查统计数据是否更新
        const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          console.log('✅ 统计数据可访问');
          // 计算总响应数
          let totalResponses = 0;
          if (statsData.data.ageDistribution && statsData.data.ageDistribution.length > 0) {
            totalResponses = statsData.data.ageDistribution.reduce((sum, item) => sum + (item.value || 0), 0);
          }
          console.log(`📊 当前总响应数: ${totalResponses}`);
        } else {
          console.log('⚠️ 统计数据获取失败');
        }
      }
      
    } else {
      console.log('❌ 提交失败！');
      console.log(`错误信息: ${responseData.message || responseData.error || '未知错误'}`);
      
      // 详细错误分析
      if (submitResponse.status === 400) {
        console.log('🔍 400错误 - 可能的原因:');
        console.log('  - 数据格式不正确');
        console.log('  - 必填字段缺失');
        console.log('  - 数据验证失败');
      } else if (submitResponse.status === 500) {
        console.log('🔍 500错误 - 可能的原因:');
        console.log('  - 数据库连接问题');
        console.log('  - 服务器内部错误');
        console.log('  - API代码异常');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.message);
    
    // 网络错误分析
    if (error.message.includes('fetch')) {
      console.log('🔍 网络错误 - 可能的原因:');
      console.log('  - API服务不可用');
      console.log('  - 网络连接问题');
      console.log('  - CORS配置问题');
    }
  }
}

// 测试数据验证函数
function validateQuestionnaireData(data) {
  console.log('\n🔍 数据验证检查:');
  
  const errors = [];
  
  if (!data.questionnaireId) {
    errors.push('questionnaireId 缺失');
  }
  
  if (!data.sectionResponses || !Array.isArray(data.sectionResponses)) {
    errors.push('sectionResponses 格式错误');
  } else if (data.sectionResponses.length === 0) {
    errors.push('sectionResponses 为空');
  }
  
  if (!data.metadata) {
    errors.push('metadata 缺失');
  }
  
  if (errors.length > 0) {
    console.log('❌ 数据验证失败:');
    errors.forEach(error => console.log(`  - ${error}`));
    return false;
  } else {
    console.log('✅ 数据验证通过');
    return true;
  }
}

// 主函数
async function main() {
  console.log('🚀 问卷提交流程测试工具\n');
  console.log(`API地址: ${API_BASE_URL}\n`);
  
  // 验证测试数据
  if (!validateQuestionnaireData(mockQuestionnaireData)) {
    console.log('❌ 测试数据验证失败，终止测试');
    return;
  }
  
  await testQuestionnaireSubmission();
  
  console.log('\n✅ 测试完成！');
}

// 运行测试
main().catch(console.error);
