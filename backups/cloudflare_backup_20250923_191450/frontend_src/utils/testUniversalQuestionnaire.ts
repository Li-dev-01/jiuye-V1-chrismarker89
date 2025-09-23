/**
 * 通用问卷系统测试工具
 * 用于测试问卷提交和API功能
 */

import { universalQuestionnaireService } from '../services/universalQuestionnaireService';
import type { UniversalQuestionnaireResponse } from '../types/universal-questionnaire';

// 创建测试问卷响应数据
export function createTestQuestionnaireResponse(): UniversalQuestionnaireResponse {
  return {
    questionnaireId: 'universal-employment-survey-2024',
    sectionResponses: [
      {
        sectionId: 'personal-info',
        questionResponses: [
          {
            questionId: 'education-level',
            value: 'bachelor',
            timestamp: Date.now()
          },
          {
            questionId: 'major-field',
            value: 'engineering',
            timestamp: Date.now()
          },
          {
            questionId: 'graduation-year',
            value: '2024-06',
            timestamp: Date.now()
          },
          {
            questionId: 'contact-email',
            value: 'test@example.com',
            timestamp: Date.now()
          }
        ]
      },
      {
        sectionId: 'employment-status',
        questionResponses: [
          {
            questionId: 'current-status',
            value: 'seeking',
            timestamp: Date.now()
          },
          {
            questionId: 'salary-range',
            value: 12,
            timestamp: Date.now()
          }
        ]
      },
      {
        sectionId: 'job-expectations',
        questionResponses: [
          {
            questionId: 'preferred-industries',
            value: ['tech', 'finance'],
            timestamp: Date.now()
          },
          {
            questionId: 'work-location-preference',
            value: '北京',
            timestamp: Date.now()
          },
          {
            questionId: 'career-goals',
            value: '希望在技术领域发展，成为一名优秀的软件工程师，为社会创造价值。我计划在未来5年内掌握前沿技术，积累丰富的项目经验。',
            timestamp: Date.now()
          }
        ]
      },
      {
        sectionId: 'additional-info',
        questionResponses: [
          {
            questionId: 'skills-rating',
            value: 7,
            timestamp: Date.now()
          }
        ]
      }
    ],
    metadata: {
      submittedAt: Date.now(),
      completionTime: 300000, // 5分钟
      userAgent: navigator.userAgent,
      version: '2.0.0'
    }
  };
}

// 测试问卷提交功能
export async function testQuestionnaireSubmission(): Promise<boolean> {
  try {
    console.log('🧪 开始测试问卷提交功能...');
    
    const testResponse = createTestQuestionnaireResponse();
    
    // 验证数据
    const validation = universalQuestionnaireService.validateQuestionnaireResponse(testResponse);
    if (!validation.isValid) {
      console.error('❌ 数据验证失败:', validation.errors);
      return false;
    }
    console.log('✅ 数据验证通过');
    
    // 提交问卷
    const result = await universalQuestionnaireService.submitQuestionnaire(testResponse);
    console.log('✅ 问卷提交成功:', result);
    
    return true;
  } catch (error) {
    console.error('❌ 问卷提交测试失败:', error);
    return false;
  }
}

// 测试统计数据获取
export async function testStatisticsRetrieval(): Promise<boolean> {
  try {
    console.log('🧪 开始测试统计数据获取...');
    
    const stats = await universalQuestionnaireService.getQuestionnaireStatistics(
      'universal-employment-survey-2024'
    );
    console.log('✅ 统计数据获取成功:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ 统计数据获取测试失败:', error);
    return false;
  }
}

// 运行所有测试
export async function runAllTests(): Promise<void> {
  console.log('🚀 开始运行通用问卷系统测试...');
  
  const tests = [
    { name: '问卷提交', test: testQuestionnaireSubmission },
    { name: '统计数据获取', test: testStatisticsRetrieval }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`\n📋 测试: ${name}`);
    const success = await test();
    results.push({ name, success });
  }
  
  console.log('\n📊 测试结果汇总:');
  results.forEach(({ name, success }) => {
    console.log(`${success ? '✅' : '❌'} ${name}: ${success ? '通过' : '失败'}`);
  });
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n🎯 总体结果: ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试都通过了！通用问卷系统运行正常。');
  } else {
    console.log('⚠️ 部分测试失败，请检查系统配置。');
  }
}

// 在浏览器控制台中可以调用的测试函数
if (typeof window !== 'undefined') {
  (window as any).testUniversalQuestionnaire = {
    runAllTests,
    testSubmission: testQuestionnaireSubmission,
    testStatistics: testStatisticsRetrieval,
    createTestData: createTestQuestionnaireResponse
  };
  
  console.log('🔧 通用问卷测试工具已加载！');
  console.log('在控制台中运行以下命令进行测试:');
  console.log('- window.testUniversalQuestionnaire.runAllTests() // 运行所有测试');
  console.log('- window.testUniversalQuestionnaire.testSubmission() // 测试问卷提交');
  console.log('- window.testUniversalQuestionnaire.testStatistics() // 测试统计获取');
}
