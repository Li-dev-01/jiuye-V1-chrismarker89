/**
 * 问卷提交测试工具
 * 绕过防刷验证，直接测试API提交功能
 */

import type { UniversalQuestionnaireResponse } from '../types/universal-questionnaire';
import { universalQuestionnaireService } from '../services/universalQuestionnaireService';

// 生成完整的测试问卷数据
export function generateCompleteTestData(): UniversalQuestionnaireResponse {
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
            value: '这是一个API测试提交，用于验证问卷提交功能是否正常工作。',
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
      userAgent: navigator.userAgent,
      version: '2.0.0',
      submissionType: 'test',
      submissionSource: 'frontend-test',
      sessionId: `test-session-${now}`,
      ipAddress: '127.0.0.1'
    }
  };
}

// 直接测试API提交（绕过防刷验证）
export async function testDirectSubmission(): Promise<boolean> {
  console.log('🧪 开始直接API测试...');
  
  try {
    const testData = generateCompleteTestData();
    console.log('📝 测试数据:', testData);
    
    const result = await universalQuestionnaireService.submitQuestionnaire(testData);
    console.log('📡 API响应:', result);
    
    if (result.success) {
      console.log('✅ 直接API测试成功!');
      console.log('📊 提交ID:', result.data?.submissionId);
      return true;
    } else {
      console.log('❌ 直接API测试失败:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 直接API测试异常:', error);
    return false;
  }
}

// 在浏览器控制台中可用的测试函数
export function runQuestionnaireTest() {
  console.log('🚀 启动问卷API测试...');
  
  // 将测试函数挂载到window对象，方便在控制台调用
  if (typeof window !== 'undefined') {
    (window as any).testQuestionnaireAPI = testDirectSubmission;
    (window as any).generateTestData = generateCompleteTestData;
    
    console.log('✅ 测试函数已挂载到window对象:');
    console.log('- window.testQuestionnaireAPI() - 直接测试API提交');
    console.log('- window.generateTestData() - 生成测试数据');
    console.log('');
    console.log('💡 使用方法:');
    console.log('1. 打开浏览器控制台');
    console.log('2. 运行: await window.testQuestionnaireAPI()');
    console.log('3. 查看测试结果');
  }
  
  return testDirectSubmission();
}

// 生成不同身份的测试数据
export function generateTestDataByIdentity(identity: 'student' | 'employed' | 'unemployed'): UniversalQuestionnaireResponse {
  const baseData = generateCompleteTestData();
  
  // 修改身份
  baseData.sectionResponses[1].questionResponses[0].value = identity;
  
  // 根据身份过滤相关部分
  switch (identity) {
    case 'employed':
      // 在职人员不需要学生专属和求职相关问题
      baseData.sectionResponses = baseData.sectionResponses.filter(section => 
        !['student-specific', 'job-seeking-status', 'job-seeking-details'].includes(section.sectionId)
      );
      break;
      
    case 'unemployed':
      // 失业人员不需要学生专属问题
      baseData.sectionResponses = baseData.sectionResponses.filter(section => 
        !['student-specific'].includes(section.sectionId)
      );
      break;
      
    case 'student':
    default:
      // 学生保持完整数据
      break;
  }
  
  // 更新元数据
  baseData.metadata.submissionType = `test-${identity}`;
  
  return baseData;
}

// 批量测试不同身份
export async function testMultipleIdentities(): Promise<void> {
  console.log('🔄 开始批量身份测试...');
  
  const identities: Array<'student' | 'employed' | 'unemployed'> = ['student', 'employed', 'unemployed'];
  
  for (const identity of identities) {
    console.log(`\n📋 测试身份: ${identity}`);
    
    try {
      const testData = generateTestDataByIdentity(identity);
      const result = await universalQuestionnaireService.submitQuestionnaire(testData);
      
      if (result.success) {
        console.log(`✅ ${identity} 测试成功 - ID: ${result.data?.submissionId}`);
      } else {
        console.log(`❌ ${identity} 测试失败:`, result.error);
      }
    } catch (error) {
      console.error(`❌ ${identity} 测试异常:`, error);
    }
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 批量测试完成');
}

// 导出所有测试函数
export const questionnaireTestUtils = {
  generateCompleteTestData,
  testDirectSubmission,
  runQuestionnaireTest,
  generateTestDataByIdentity,
  testMultipleIdentities
};
