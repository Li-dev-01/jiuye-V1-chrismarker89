/**
 * 问卷API测试脚本
 * 基于正确的UniversalQuestionnaireResponse数据结构测试API提交功能
 * 绕过防刷验证，直接测试API接口
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 生成符合UniversalQuestionnaireResponse接口的测试数据
function generateTestQuestionnaireData() {
  const now = Date.now();
  
  return {
    questionnaireId: 'employment-survey-2024',
    sectionResponses: [
      // 第1部分：基础信息
      {
        sectionId: 'basic-demographics',
        questionResponses: [
          {
            questionId: 'age-range',
            value: '22-25',
            timestamp: now
          },
          {
            questionId: 'gender',
            value: 'male',
            timestamp: now + 1000
          },
          {
            questionId: 'location',
            value: '北京',
            timestamp: now + 2000
          }
        ],
        startTime: now,
        endTime: now + 30000
      },
      // 第2部分：身份识别
      {
        sectionId: 'identity-classification',
        questionResponses: [
          {
            questionId: 'identity',
            value: 'student',
            timestamp: now + 35000
          }
        ],
        startTime: now + 30000,
        endTime: now + 45000
      },
      // 第3部分：学生专属问题
      {
        sectionId: 'student-specific',
        questionResponses: [
          {
            questionId: 'university-type',
            value: '985/211高校',
            timestamp: now + 50000
          },
          {
            questionId: 'major-category',
            value: '计算机科学与技术',
            timestamp: now + 55000
          },
          {
            questionId: 'academic-year',
            value: '大四',
            timestamp: now + 60000
          },
          {
            questionId: 'gpa-range',
            value: '3.5-4.0',
            timestamp: now + 65000
          }
        ],
        startTime: now + 45000,
        endTime: now + 80000
      },
      // 第4部分：求职状态
      {
        sectionId: 'job-seeking-status',
        questionResponses: [
          {
            questionId: 'job-seeking-status',
            value: 'actively-seeking',
            timestamp: now + 85000
          },
          {
            questionId: 'job-seeking-duration',
            value: '3-6个月',
            timestamp: now + 90000
          }
        ],
        startTime: now + 80000,
        endTime: now + 100000
      },
      // 第5部分：求职详情
      {
        sectionId: 'job-seeking-details',
        questionResponses: [
          {
            questionId: 'target-industries',
            value: ['互联网/科技', '金融'],
            timestamp: now + 105000
          },
          {
            questionId: 'target-positions',
            value: ['软件工程师', '产品经理'],
            timestamp: now + 110000
          },
          {
            questionId: 'salary-expectations',
            value: '15-20万',
            timestamp: now + 115000
          }
        ],
        startTime: now + 100000,
        endTime: now + 130000
      },
      // 第6部分：地区特殊问题
      {
        sectionId: 'location-specific',
        questionResponses: [
          {
            questionId: 'beijing-housing-concern',
            value: '非常担心',
            timestamp: now + 135000
          },
          {
            questionId: 'beijing-living-cost-impact',
            value: '影响很大',
            timestamp: now + 140000
          }
        ],
        startTime: now + 130000,
        endTime: now + 150000
      },
      // 第7部分：就业难度评价
      {
        sectionId: 'employment-difficulty',
        questionResponses: [
          {
            questionId: 'employment-difficulty-rating',
            value: 4,
            timestamp: now + 155000
          },
          {
            questionId: 'main-employment-challenges',
            value: ['竞争激烈', '经验不足', '薪资期望与现实差距'],
            timestamp: now + 160000
          }
        ],
        startTime: now + 150000,
        endTime: now + 170000
      },
      // 第8部分：综合评价
      {
        sectionId: 'comprehensive-evaluation',
        questionResponses: [
          {
            questionId: 'career-confidence',
            value: 3,
            timestamp: now + 175000
          },
          {
            questionId: 'additional-comments',
            value: '希望能有更多实习机会，提升实际工作经验。',
            timestamp: now + 180000
          }
        ],
        startTime: now + 170000,
        endTime: now + 190000
      }
    ],
    metadata: {
      submittedAt: now + 190000,
      completionTime: 190000, // 总耗时约3分钟
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      version: '2.0.0',
      submissionType: 'test',
      submissionSource: 'api-test',
      sessionId: `test-session-${now}`,
      ipAddress: '127.0.0.1'
    }
  };
}

// 测试API提交功能
async function testQuestionnaireSubmission() {
  console.log('🧪 开始测试问卷API提交功能...');
  
  try {
    // 生成测试数据
    const testData = generateTestQuestionnaireData();
    console.log('📝 生成测试数据:', JSON.stringify(testData, null, 2));
    
    // 调用API
    console.log('🚀 调用API提交问卷...');
    const response = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📡 API响应状态:', response.status);
    console.log('📡 API响应头:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📡 API响应数据:', result);
    
    if (response.ok && result.success) {
      console.log('✅ 问卷提交成功!');
      console.log('📊 提交ID:', result.data?.submissionId);
      console.log('📊 问卷ID:', result.data?.questionnaireId);
      console.log('📊 提交时间:', result.data?.submittedAt);
      return result;
    } else {
      console.log('❌ 问卷提交失败');
      console.log('❌ 错误信息:', result.error || result.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ API调用异常:', error);
    return null;
  }
}

// 测试API健康状态
async function testApiHealth() {
  console.log('🏥 检查API健康状态...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    
    console.log('🏥 API健康状态:', result);
    return result;
  } catch (error) {
    console.error('❌ API健康检查失败:', error);
    return null;
  }
}

// 生成多个测试用例
function generateMultipleTestCases() {
  const testCases = [];
  
  // 测试用例1：完整的学生问卷
  testCases.push({
    name: '完整学生问卷',
    data: generateTestQuestionnaireData()
  });
  
  // 测试用例2：在职人员问卷
  const employedData = generateTestQuestionnaireData();
  employedData.sectionResponses[1].questionResponses[0].value = 'employed';
  employedData.sectionResponses = employedData.sectionResponses.filter(section => 
    !['student-specific', 'job-seeking-status', 'job-seeking-details'].includes(section.sectionId)
  );
  testCases.push({
    name: '在职人员问卷',
    data: employedData
  });
  
  // 测试用例3：失业人员问卷
  const unemployedData = generateTestQuestionnaireData();
  unemployedData.sectionResponses[1].questionResponses[0].value = 'unemployed';
  unemployedData.sectionResponses = unemployedData.sectionResponses.filter(section => 
    !['student-specific'].includes(section.sectionId)
  );
  testCases.push({
    name: '失业人员问卷',
    data: unemployedData
  });
  
  return testCases;
}

// 批量测试
async function runBatchTests() {
  console.log('🔄 开始批量测试...');
  
  const testCases = generateMultipleTestCases();
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n📋 测试用例: ${testCase.name}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });
      
      const result = await response.json();
      
      results.push({
        testCase: testCase.name,
        success: response.ok && result.success,
        response: result,
        status: response.status
      });
      
      console.log(`${response.ok && result.success ? '✅' : '❌'} ${testCase.name}: ${result.success ? '成功' : '失败'}`);
      
    } catch (error) {
      console.error(`❌ ${testCase.name} 测试异常:`, error);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message,
        status: 'error'
      });
    }
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 批量测试结果汇总:');
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.testCase}: ${result.success ? '成功' : '失败'}`);
  });
  
  return results;
}

// 主函数
async function main() {
  console.log('🚀 问卷API测试开始');
  console.log('=' * 50);
  
  // 1. 检查API健康状态
  await testApiHealth();
  
  console.log('\n' + '=' * 50);
  
  // 2. 单个测试
  await testQuestionnaireSubmission();
  
  console.log('\n' + '=' * 50);
  
  // 3. 批量测试
  await runBatchTests();
  
  console.log('\n🏁 测试完成');
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
  main().catch(console.error);
}

// 导出函数供其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testQuestionnaireSubmission,
    testApiHealth,
    generateTestQuestionnaireData,
    runBatchTests
  };
}
