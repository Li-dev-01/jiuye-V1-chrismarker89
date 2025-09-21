#!/usr/bin/env node

/**
 * 测试数据生成器 (CommonJS版本)
 * 生成符合真实分布的问卷测试数据
 */

const crypto = require('crypto');
const fs = require('fs');

// 数据分布权重配置
const REALISTIC_WEIGHTS = {
  'age-range': {
    '18-22': 0.35,
    '23-25': 0.40,
    '26-30': 0.20,
    '31-35': 0.04,
    'over-35': 0.01
  },
  'gender': {
    'male': 0.52,
    'female': 0.46,
    'prefer-not-say': 0.02
  },
  'education-level': {
    'high-school': 0.05,
    'junior-college': 0.15,
    'bachelor': 0.65,
    'master': 0.13,
    'phd': 0.02
  },
  'current-status': {
    'employed': 0.45,
    'unemployed': 0.25,
    'student': 0.25,
    'preparing': 0.04,
    'other': 0.01
  },
  'major-field': {
    'engineering': 0.25,
    'management': 0.18,
    'economics': 0.15,
    'science': 0.12,
    'literature': 0.10,
    'medicine': 0.08,
    'law': 0.05,
    'education': 0.04,
    'art': 0.02,
    'other': 0.01
  }
};

// 逻辑一致性规则
const CONSISTENCY_RULES = {
  ageEducationConsistency: {
    '18-22': ['high-school', 'junior-college', 'bachelor'],
    '23-25': ['bachelor', 'master'],
    '26-30': ['bachelor', 'master', 'phd'],
    '31-35': ['bachelor', 'master', 'phd'],
    'over-35': ['bachelor', 'master', 'phd']
  },
  educationSalaryCorrelation: {
    'phd': ['8k-12k', '12k-20k', 'above-20k'],
    'master': ['5k-8k', '8k-12k', '12k-20k', 'above-20k'],
    'bachelor': ['3k-5k', '5k-8k', '8k-12k', '12k-20k'],
    'junior-college': ['below-3k', '3k-5k', '5k-8k'],
    'high-school': ['below-3k', '3k-5k']
  }
};

// 工具函数
function weightedRandom(weights) {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (random <= cumulative) {
      return key;
    }
  }
  
  return Object.keys(weights)[0];
}

function generateRandomDate(daysAgo = 60) {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function generateMultipleChoice(options, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 测试用户生成器
class TestUserGenerator {
  constructor() {
    this.usedEmails = new Set();
    this.usedPhones = new Set();
  }

  generateUser(index) {
    const email = this.generateUniqueEmail(index);
    const phone = this.generateUniquePhone();
    
    return {
      id: `test_user_${index.toString().padStart(6, '0')}`,
      email,
      phone,
      nickname: `测试用户${index}`,
      password: 'test123456',
      isTestData: true,
      createdAt: generateRandomDate(),
      profile: {
        avatar: null,
        bio: null,
        location: null
      }
    };
  }

  generateUniqueEmail(index) {
    const domains = ['test.com', 'example.org', 'demo.net'];
    const domain = domains[index % domains.length];
    const email = `testuser${index}@${domain}`;
    
    if (this.usedEmails.has(email)) {
      return `testuser${index}_${crypto.randomBytes(4).toString('hex')}@${domain}`;
    }
    
    this.usedEmails.add(email);
    return email;
  }

  generateUniquePhone() {
    let phone;
    do {
      phone = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
    } while (this.usedPhones.has(phone));
    
    this.usedPhones.add(phone);
    return phone;
  }
}

// 问卷数据生成器
class QuestionnaireDataGenerator {
  ensureConsistency(data) {
    // 确保年龄与学历的一致性
    if (data.age && data.educationLevel) {
      const validEducations = CONSISTENCY_RULES.ageEducationConsistency[data.age];
      if (validEducations && !validEducations.includes(data.educationLevel)) {
        data.educationLevel = validEducations[Math.floor(Math.random() * validEducations.length)];
      }
    }

    // 确保学历与薪资的相关性
    if (data.educationLevel && data.currentSalary) {
      const validSalaries = CONSISTENCY_RULES.educationSalaryCorrelation[data.educationLevel];
      if (validSalaries && !validSalaries.includes(data.currentSalary)) {
        data.currentSalary = validSalaries[Math.floor(Math.random() * validSalaries.length)];
      }
    }

    // 确保就业状态与相关字段的一致性
    if (data.currentStatus) {
      switch (data.currentStatus) {
        case 'employed':
          // 已就业必须有就业类型、薪资、行业、满意度
          if (!data.employmentType) {
            data.employmentType = weightedRandom({
              'fulltime': 0.70, 'parttime': 0.15, 'internship': 0.10, 'freelance': 0.05
            });
          }
          if (!data.currentSalary) {
            data.currentSalary = weightedRandom({
              '5k-8k': 0.25, '8k-12k': 0.20, '3k-5k': 0.20, '12k-20k': 0.15, 'below-3k': 0.10, 'above-20k': 0.10
            });
          }
          if (!data.workIndustry) {
            data.workIndustry = weightedRandom({
              'internet-tech': 0.25, 'finance': 0.15, 'manufacturing': 0.12, 'education': 0.10,
              'healthcare': 0.08, 'government': 0.15, 'other': 0.15
            });
          }
          if (!data.jobSatisfaction) {
            data.jobSatisfaction = weightedRandom({
              'satisfied': 0.35, 'neutral': 0.30, 'very-satisfied': 0.15, 'dissatisfied': 0.15, 'very-dissatisfied': 0.05
            });
          }
          break;

        case 'unemployed':
          // 失业必须有失业时长、上一份工作薪资、求职渠道、求职困难
          if (!data.unemploymentDuration) {
            data.unemploymentDuration = weightedRandom({
              '1-3months': 0.30, '3-6months': 0.25, 'less-1month': 0.20, '6-12months': 0.15, 'fresh-graduate': 0.07, 'over-1year': 0.03
            });
          }
          if (!data.lastJobSalary) {
            data.lastJobSalary = weightedRandom({
              '3k-5k': 0.25, '5k-8k': 0.20, 'never-worked': 0.15, 'below-3k': 0.15, '8k-12k': 0.15, '12k-20k': 0.07, 'above-20k': 0.03
            });
          }
          if (!data.jobSearchChannels) {
            data.jobSearchChannels = generateMultipleChoice([
              'online-platforms', 'social-media', 'campus-recruitment', 'referrals', 'headhunters', 'company-websites'
            ], 2, 4);
          }
          if (!data.jobSearchDifficulties) {
            data.jobSearchDifficulties = generateMultipleChoice([
              'lack-experience', 'skill-mismatch', 'high-competition', 'low-salary', 'location-mismatch', 'few-opportunities'
            ], 1, 3);
          }
          break;

        case 'student':
          // 学生必须有年级、职业规划、实习经验
          if (!data.studyYear) {
            data.studyYear = weightedRandom({
              'junior': 0.25, 'senior': 0.25, 'sophomore': 0.20, 'graduate': 0.15, 'freshman': 0.10, 'phd': 0.05
            });
          }
          if (!data.careerPlanning) {
            data.careerPlanning = weightedRandom({
              'direct-employment': 0.35, 'continue-study': 0.25, 'civil-service': 0.15, 'undecided': 0.10,
              'study-abroad': 0.08, 'entrepreneurship': 0.07
            });
          }
          if (!data.internshipExperience) {
            data.internshipExperience = weightedRandom({
              'one': 0.30, 'two-three': 0.25, 'none': 0.25, 'multiple': 0.20
            });
          }
          break;
      }
    }
  }

  generateCompleteResponse(userId) {
    const baseData = {
      id: `response_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      questionnaireId: 'restructured-employment-survey-2024',
      isTestData: true,
      createdAt: generateRandomDate(),
      updatedAt: new Date().toISOString(),
      status: 'completed',  // 只生成完整问卷
      submittedAt: generateRandomDate()  // 添加提交时间
    };

    // 第1页：基本信息 (必填)
    baseData.age = weightedRandom(REALISTIC_WEIGHTS['age-range']);
    baseData.gender = weightedRandom(REALISTIC_WEIGHTS['gender']);
    baseData.educationLevel = weightedRandom(REALISTIC_WEIGHTS['education-level']);
    baseData.majorField = weightedRandom(REALISTIC_WEIGHTS['major-field']);
    baseData.workLocationPreference = weightedRandom({
      'tier1': 0.35, 'new-tier1': 0.25, 'tier2': 0.20, 'tier3': 0.05, 'hometown': 0.10, 'flexible': 0.05
    });

    // 第2页：状态识别 (必填)
    baseData.currentStatus = weightedRandom(REALISTIC_WEIGHTS['current-status']);

    // 第3页：差异化问卷 (根据状态必填对应字段)
    this.generateStatusSpecificData(baseData);

    // 第4页：通用问卷 (必填)
    baseData.careerGoal = weightedRandom({
      'technical-expert': 0.20, 'management': 0.18, 'stable-job': 0.15, 'work-life-balance': 0.12,
      'high-income': 0.10, 'entrepreneurship': 0.08, 'social-impact': 0.07, 'undecided': 0.10
    });

    baseData.skillConfidence = weightedRandom({
      'confident': 0.35, 'neutral': 0.30, 'very-confident': 0.15, 'lacking': 0.15, 'very-lacking': 0.05
    });

    baseData.preferredWorkLocation = weightedRandom({
      'tier1': 0.30, 'new-tier1': 0.25, 'tier2': 0.20, 'hometown': 0.15, 'flexible': 0.10
    });

    baseData.employmentDifficulty = weightedRandom({
      'difficult': 0.40, 'moderate': 0.25, 'very-difficult': 0.20, 'easy': 0.10, 'very-easy': 0.05
    });

    // 第5页：建议反馈 (80%的人会填写)
    if (Math.random() < 0.8) {
      baseData.policySuggestions = generateMultipleChoice([
        'more-internships', 'skill-training', 'career-guidance', 'reduce-discrimination',
        'startup-support', 'salary-standards', 'job-matching', 'education-reform'
      ], 2, 4);
    }

    // 确保数据一致性
    this.ensureConsistency(baseData);

    return baseData;
  }

  generateStatusSpecificData(data) {
    switch (data.currentStatus) {
      case 'employed':
        data.employmentType = weightedRandom({
          'fulltime': 0.70, 'parttime': 0.15, 'internship': 0.10, 'freelance': 0.05
        });
        data.currentSalary = weightedRandom({
          '5k-8k': 0.25, '8k-12k': 0.20, '3k-5k': 0.20, '12k-20k': 0.15, 'below-3k': 0.10, 'above-20k': 0.10
        });
        data.workIndustry = weightedRandom({
          'internet-tech': 0.25, 'finance': 0.15, 'manufacturing': 0.12, 'education': 0.10,
          'healthcare': 0.08, 'government': 0.15, 'other': 0.15
        });
        data.jobSatisfaction = weightedRandom({
          'satisfied': 0.35, 'neutral': 0.30, 'very-satisfied': 0.15, 'dissatisfied': 0.15, 'very-dissatisfied': 0.05
        });
        break;

      case 'unemployed':
        data.unemploymentDuration = weightedRandom({
          '1-3months': 0.30, '3-6months': 0.25, 'less-1month': 0.20, '6-12months': 0.15, 'fresh-graduate': 0.07, 'over-1year': 0.03
        });
        data.lastJobSalary = weightedRandom({
          '3k-5k': 0.25, '5k-8k': 0.20, 'never-worked': 0.15, 'below-3k': 0.15, '8k-12k': 0.15, '12k-20k': 0.07, 'above-20k': 0.03
        });
        data.jobSearchChannels = generateMultipleChoice([
          'online-platforms', 'social-media', 'campus-recruitment', 'referrals', 'headhunters', 'company-websites'
        ], 2, 4);
        data.jobSearchDifficulties = generateMultipleChoice([
          'lack-experience', 'skill-mismatch', 'high-competition', 'low-salary', 'location-mismatch', 'few-opportunities'
        ], 1, 3);
        break;

      case 'student':
        data.studyYear = weightedRandom({
          'junior': 0.25, 'senior': 0.25, 'sophomore': 0.20, 'graduate': 0.15, 'freshman': 0.10, 'phd': 0.05
        });
        data.careerPlanning = weightedRandom({
          'direct-employment': 0.35, 'continue-study': 0.25, 'civil-service': 0.15, 'undecided': 0.10,
          'study-abroad': 0.08, 'entrepreneurship': 0.07
        });
        data.internshipExperience = weightedRandom({
          'one': 0.30, 'two-three': 0.25, 'none': 0.25, 'multiple': 0.20
        });
        break;

      case 'preparing':
        // 备考人群的特定字段
        data.preparationType = weightedRandom({
          'graduate-exam': 0.40, 'civil-service': 0.30, 'professional-cert': 0.20, 'language-test': 0.10
        });
        break;

      case 'other':
        // 其他状态的人群
        data.otherStatusDescription = '其他状态';
        break;
    }
  }
}

// 数据分析函数
function analyzeGeneratedData(responses) {
  const analysis = {
    total: responses.length,
    byStatus: {},
    byAge: {},
    byEducation: {},
    byGender: {},
    completionRate: 0,
    fieldCoverage: {}
  };

  responses.forEach(response => {
    if (response.currentStatus) {
      analysis.byStatus[response.currentStatus] = (analysis.byStatus[response.currentStatus] || 0) + 1;
    }
    if (response.age) {
      analysis.byAge[response.age] = (analysis.byAge[response.age] || 0) + 1;
    }
    if (response.educationLevel) {
      analysis.byEducation[response.educationLevel] = (analysis.byEducation[response.educationLevel] || 0) + 1;
    }
    if (response.gender) {
      analysis.byGender[response.gender] = (analysis.byGender[response.gender] || 0) + 1;
    }
  });

  const completedCount = responses.filter(r => r.status === 'completed').length;
  analysis.completionRate = (completedCount / responses.length) * 100;

  return analysis;
}

// 主生成函数 - 只生成完整问卷
function generateTestData(config) {
  const userGenerator = new TestUserGenerator();
  const responseGenerator = new QuestionnaireDataGenerator();

  // 生成用户
  const users = [];
  for (let i = 1; i <= config.userCount; i++) {
    users.push(userGenerator.generateUser(i));
  }

  // 生成完整问卷回答
  const responses = [];
  for (let i = 0; i < config.responseCount; i++) {
    const userId = users[Math.floor(Math.random() * users.length)].id;

    // 只生成完整的问卷回答
    responses.push(responseGenerator.generateCompleteResponse(userId));
  }

  return { users, responses };
}

// 默认配置 - 只生成完整问卷
const DEFAULT_CONFIG = {
  userCount: 1200,        // 减少用户数，因为每个用户都会有完整问卷
  responseCount: 1800,    // 只生成完整问卷，提高数据密度
  onlyCompleted: true     // 只生成完成的问卷
};

// 主执行函数
function main() {
  console.log('🎲 开始生成测试数据 (只生成完整问卷)...');

  const { users, responses } = generateTestData(DEFAULT_CONFIG);

  console.log(`✅ 生成完成:`);
  console.log(`   - 用户数量: ${users.length}`);
  console.log(`   - 完整问卷: ${responses.length} (100%)`);
  console.log(`   - 数据质量: 所有问卷都是完整提交`);

  // 数据分析
  const analysis = analyzeGeneratedData(responses);
  console.log(`   - 完成率: 100% (只保存完整问卷)`);

  // 输出到文件
  fs.writeFileSync('./test-users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('./test-responses.json', JSON.stringify(responses, null, 2));
  fs.writeFileSync('./data-analysis.json', JSON.stringify(analysis, null, 2));

  console.log('📁 数据已保存到 test-users.json、test-responses.json 和 data-analysis.json');
  console.log('💡 注意: 所有数据都是完整提交的有效问卷，可直接用于数据分析');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateTestData,
  analyzeGeneratedData
};
