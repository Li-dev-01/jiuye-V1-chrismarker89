#!/usr/bin/env node

/**
 * 问卷数据生成脚本
 * 向通用问卷API提交100条测试数据
 */

// Node.js 18+ 内置支持fetch

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 生成随机数据的工具函数
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// 数据选项配置（与前端enhancedIntelligentQuestionnaire保持一致）
const dataOptions = {
  ageRanges: ['under-20', '20-22', '23-25', '26-28', '29-35', 'over-35'],
  educationLevels: ['high-school', 'junior-college', 'bachelor', 'master', 'phd'],
  majors: ['engineering', 'management', 'science', 'literature', 'medicine', 'education', 'law', 'art', 'economics', 'philosophy'],
  graduationYears: ['2022-06', '2023-06', '2024-06', '2025-06'],
  employmentStatuses: ['employed', 'seeking', 'continuing-education', 'entrepreneurship'],
  genders: ['male', 'female', 'prefer-not-say'],
  workLocationPreferences: ['tier1', 'new-tier1', 'tier2', 'tier3', 'hometown', 'flexible'],
  locations: ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou', 'nanjing', 'wuhan', 'chengdu'],
  industries: ['technology', 'finance', 'education', 'healthcare', 'manufacturing', 'retail', 'consulting'],
  companySizes: ['startup', 'small', 'medium', 'large', 'enterprise'],
  salaryRanges: [5, 8, 12, 15, 20, 25, 30, 40, 50],
  jobSearchChannels: ['online-platforms', 'campus-recruitment', 'referrals', 'direct-application', 'headhunters'],
  skills: ['programming', 'data-analysis', 'project-management', 'communication', 'leadership', 'design'],
  challenges: ['lack-of-experience', 'skill-mismatch', 'market-competition', 'location-constraints', 'salary-expectations']
};

// 生成单条问卷响应数据
function generateQuestionnaireResponse() {
  const ageRange = randomChoice(dataOptions.ageRanges);
  const educationLevel = randomChoice(dataOptions.educationLevels);
  const major = randomChoice(dataOptions.majors);
  const graduationYear = randomChoice(dataOptions.graduationYears);
  const currentStatus = randomChoice(dataOptions.employmentStatuses);
  const gender = randomChoice(dataOptions.genders);
  const workLocationPreference = randomChoice(dataOptions.workLocationPreferences);
  const location = randomChoice(dataOptions.locations);

  const sectionResponses = [
    // 基本信息部分（与前端enhancedIntelligentQuestionnaire保持一致）
    {
      sectionId: 'basic-demographics',
      questionResponses: [
        {
          questionId: 'age-range',
          value: ageRange,
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'gender',
          value: gender,
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'work-location-preference',
          value: workLocationPreference,
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'education-level',
          value: educationLevel,
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'major-field',
          value: major,
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'graduation-year',
          value: graduationYear,
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'location',
          value: location,
          timestamp: Date.now() - randomInt(1000, 5000)
        }
      ]
    },
    // 就业状态部分
    {
      sectionId: 'employment-status',
      questionResponses: [
        {
          questionId: 'current-status',
          value: currentStatus,
          timestamp: Date.now() - randomInt(1000, 5000)
        }
      ]
    }
  ];

  // 根据就业状态添加不同的问题
  if (currentStatus === 'employed') {
    sectionResponses.push({
      sectionId: 'employment-details',
      questionResponses: [
        {
          questionId: 'industry',
          value: randomChoice(dataOptions.industries),
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'company-size',
          value: randomChoice(dataOptions.companySizes),
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'salary-range',
          value: randomChoice(dataOptions.salaryRanges),
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'job-satisfaction',
          value: randomInt(1, 10),
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'work-life-balance',
          value: randomInt(1, 10),
          timestamp: Date.now() - randomInt(1000, 5000)
        }
      ]
    });
  } else if (currentStatus === 'seeking') {
    sectionResponses.push({
      sectionId: 'job-search',
      questionResponses: [
        {
          questionId: 'search-duration',
          value: randomInt(1, 12),
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'target-industry',
          value: randomChoice(dataOptions.industries),
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'expected-salary',
          value: randomChoice(dataOptions.salaryRanges),
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'search-channels',
          value: [randomChoice(dataOptions.jobSearchChannels), randomChoice(dataOptions.jobSearchChannels)],
          timestamp: Date.now() - randomInt(1000, 5000)
        },
        {
          questionId: 'main-challenges',
          value: [randomChoice(dataOptions.challenges), randomChoice(dataOptions.challenges)],
          timestamp: Date.now() - randomInt(1000, 5000)
        }
      ]
    });
  }

  // 技能评估部分
  sectionResponses.push({
    sectionId: 'skills-assessment',
    questionResponses: [
      {
        questionId: 'technical-skills',
        value: [randomChoice(dataOptions.skills), randomChoice(dataOptions.skills)],
        timestamp: Date.now() - randomInt(1000, 5000)
      },
      {
        questionId: 'skill-confidence',
        value: randomInt(1, 10),
        timestamp: Date.now() - randomInt(1000, 5000)
      },
      {
        questionId: 'learning-willingness',
        value: randomInt(1, 10),
        timestamp: Date.now() - randomInt(1000, 5000)
      }
    ]
  });

  // 意见反馈部分
  const feedbackTexts = [
    '希望能有更多实习机会',
    '学校课程与实际工作需求有差距',
    '就业指导服务需要改进',
    '企业招聘要求过高',
    '薪资水平有待提高',
    '工作环境和文化很重要',
    '职业发展前景是关键因素',
    '希望有更好的工作生活平衡'
  ];

  sectionResponses.push({
    sectionId: 'feedback',
    questionResponses: [
      {
        questionId: 'suggestions',
        value: randomChoice(feedbackTexts),
        timestamp: Date.now() - randomInt(1000, 5000)
      },
      {
        questionId: 'overall-satisfaction',
        value: randomInt(1, 10),
        timestamp: Date.now() - randomInt(1000, 5000)
      }
    ]
  });

  return {
    questionnaireId: 'employment-survey-2024',
    sectionResponses,
    metadata: {
      submittedAt: Date.now(),
      completionTime: randomInt(300000, 1800000), // 5-30分钟
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      version: '2.0',
      submissionType: 'anonymous',
      sessionId: `session_${Date.now()}_${randomInt(1000, 9999)}`
    }
  };
}

// 提交单条问卷数据
async function submitQuestionnaire(data, index) {
  try {
    const response = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ 问卷 ${index + 1} 提交成功: ${result.data?.submissionId || 'N/A'}`);
      return { success: true, data: result.data };
    } else {
      console.error(`❌ 问卷 ${index + 1} 提交失败:`, result.message || result.error);
      return { success: false, error: result.message || result.error };
    }
  } catch (error) {
    console.error(`❌ 问卷 ${index + 1} 网络错误:`, error.message);
    return { success: false, error: error.message };
  }
}

// 主函数：生成并提交100条问卷数据
async function generateAndSubmitQuestionnaires() {
  console.log('🚀 开始生成并提交100条问卷数据...\n');
  
  const results = {
    total: 100,
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < 100; i++) {
    console.log(`📝 正在生成第 ${i + 1} 条问卷数据...`);
    
    const questionnaireData = generateQuestionnaireResponse();
    const result = await submitQuestionnaire(questionnaireData, i);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        index: i + 1,
        error: result.error
      });
    }

    // 添加延迟避免请求过于频繁
    if (i < 99) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms延迟
    }
  }

  console.log('\n📊 提交结果统计:');
  console.log(`总计: ${results.total} 条`);
  console.log(`成功: ${results.success} 条`);
  console.log(`失败: ${results.failed} 条`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 失败详情:');
    results.errors.forEach(error => {
      console.log(`  问卷 ${error.index}: ${error.error}`);
    });
  }

  console.log('\n✨ 数据生成完成！');
}

// 运行脚本
if (require.main === module) {
  generateAndSubmitQuestionnaires().catch(console.error);
}

module.exports = {
  generateQuestionnaireResponse,
  submitQuestionnaire,
  generateAndSubmitQuestionnaires
};
