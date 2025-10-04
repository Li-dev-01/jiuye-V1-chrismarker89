/**
 * 问卷2测试数据生成器
 * 专门为问卷2的3个维度生成真实的测试数据
 * 维度: 经济压力、就业信心、现代负债
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 配置参数
const CONFIG = {
  userCount: 800,        // 用户数量 (比问卷1少一些，体现问卷2的专业性)
  responseCount: 1200,   // 问卷回答数量
  onlyCompleted: true,   // 只生成完整问卷
  outputDir: path.join(__dirname, '../data'),
  sqlDir: path.join(__dirname, '../sql-v2')
};

// 问卷2特有的权重分布 (基于现代大学生特点)
const Q2_WEIGHTS = {
  // 年龄分布 (更集中在年轻群体)
  'age-range-v2': {
    'under-20': 0.05,
    '20-22': 0.45,      // 在校大学生主体
    '23-25': 0.35,      // 应届毕业生主体
    '26-28': 0.12,      // 职场新人
    '29-35': 0.03,      // 少量职场中坚
    'over-35': 0.00     // 基本不涉及
  },
  
  // 学历分布 (更高学历比例)
  'education-level-v2': {
    'high-school': 0.02,
    'junior-college': 0.15,
    'bachelor': 0.65,    // 本科主体
    'master': 0.16,      // 研究生比例较高
    'phd': 0.02
  },
  
  // 经济压力等级
  'economic-pressure-level': {
    'very-low': 0.08,
    'low': 0.22,
    'medium': 0.35,
    'high': 0.25,
    'very-high': 0.10
  },
  
  // 就业信心等级
  'employment-confidence-level': {
    'very-confident': 0.12,
    'confident': 0.28,
    'neutral': 0.35,
    'worried': 0.20,
    'very-worried': 0.05
  },
  
  // 现代负债情况
  'modern-debt-status': {
    'no-debt': 0.25,
    'student-loan': 0.35,
    'credit-card': 0.20,
    'online-loan': 0.15,
    'multiple-debt': 0.05
  }
};

// 问卷2的问题定义
const Q2_QUESTIONS = {
  // 基础信息
  basic: [
    'age-range-v2',
    'education-level-v2',
    'current-location-v2',
    'family-economic-status'
  ],
  
  // 经济压力维度
  economic_pressure: [
    'monthly-living-cost',
    'family-financial-support',
    'part-time-income',
    'financial-stress-level',
    'cost-concern-areas',
    'financial-planning-ability'
  ],
  
  // 就业信心维度
  employment_confidence: [
    'job-market-outlook',
    'personal-competitiveness',
    'skill-preparation-level',
    'career-goal-clarity',
    'job-search-confidence',
    'industry-preference-confidence'
  ],
  
  // 现代负债维度
  modern_debt: [
    'debt-types',
    'debt-amount-range',
    'repayment-pressure',
    'debt-impact-on-career',
    'financial-literacy-level',
    'debt-management-strategy'
  ]
};

// 生成随机ID
function generateId(prefix = 'q2') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// 根据权重随机选择
function weightedRandom(weights) {
  const random = Math.random();
  let sum = 0;
  
  for (const [value, weight] of Object.entries(weights)) {
    sum += weight;
    if (random <= sum) {
      return value;
    }
  }
  
  return Object.keys(weights)[0];
}

// 生成用户数据
function generateUsers(count) {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const userId = generateId('q2_user');
    const ageRange = weightedRandom(Q2_WEIGHTS['age-range-v2']);
    const educationLevel = weightedRandom(Q2_WEIGHTS['education-level-v2']);
    
    users.push({
      id: userId,
      email: `q2_test_${i.toString().padStart(4, '0')}@test.example.com`,
      phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      isTestData: true,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        ageRange,
        educationLevel,
        source: 'questionnaire-v2-test-data'
      }
    });
  }
  
  return users;
}

// 生成问卷回答数据
function generateResponses(users, count) {
  const responses = [];
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const responseId = generateId('q2_response');
    
    // 基础信息
    const basicInfo = {
      ageRange: user.metadata.ageRange,
      educationLevel: user.metadata.educationLevel,
      currentLocation: weightedRandom({
        'tier1': 0.35, 'tier2': 0.40, 'tier3': 0.20, 'rural': 0.05
      }),
      familyEconomicStatus: weightedRandom({
        'wealthy': 0.08, 'well-off': 0.25, 'middle': 0.45, 'struggling': 0.20, 'poor': 0.02
      })
    };
    
    // 经济压力数据
    const economicPressureData = {
      monthlyCost: Math.floor(Math.random() * 3000) + 1000, // 1000-4000元
      familySupport: Math.floor(Math.random() * 2000) + 500, // 500-2500元
      partTimeIncome: Math.floor(Math.random() * 1500), // 0-1500元
      stressLevel: weightedRandom(Q2_WEIGHTS['economic-pressure-level']),
      concernAreas: ['housing', 'food', 'transportation', 'education'].filter(() => Math.random() > 0.5),
      planningAbility: weightedRandom({
        'excellent': 0.15, 'good': 0.35, 'average': 0.35, 'poor': 0.15
      })
    };
    
    // 就业信心数据
    const employmentConfidenceData = {
      marketOutlook: weightedRandom({
        'very-optimistic': 0.10, 'optimistic': 0.30, 'neutral': 0.35, 'pessimistic': 0.20, 'very-pessimistic': 0.05
      }),
      competitiveness: weightedRandom({
        'very-strong': 0.12, 'strong': 0.28, 'average': 0.40, 'weak': 0.18, 'very-weak': 0.02
      }),
      skillPreparation: Math.floor(Math.random() * 41) + 60, // 60-100分
      careerClarity: Math.floor(Math.random() * 51) + 50, // 50-100分
      jobSearchConfidence: weightedRandom(Q2_WEIGHTS['employment-confidence-level']),
      industryConfidence: Math.floor(Math.random() * 31) + 70 // 70-100分
    };
    
    // 现代负债数据
    const modernDebtData = {
      debtTypes: ['student-loan', 'credit-card', 'online-loan', 'family-loan'].filter(() => Math.random() > 0.6),
      debtAmount: Math.floor(Math.random() * 50000), // 0-50000元
      repaymentPressure: weightedRandom({
        'none': 0.25, 'low': 0.30, 'medium': 0.25, 'high': 0.15, 'very-high': 0.05
      }),
      careerImpact: weightedRandom({
        'no-impact': 0.30, 'slight': 0.35, 'moderate': 0.25, 'significant': 0.10
      }),
      financialLiteracy: Math.floor(Math.random() * 41) + 40, // 40-80分
      managementStrategy: weightedRandom({
        'proactive': 0.25, 'planned': 0.35, 'reactive': 0.30, 'struggling': 0.10
      })
    };
    
    const response = {
      id: responseId,
      userId: user.id,
      questionnaireId: 'questionnaire-v2-2024',
      isTestData: true,
      status: 'completed',
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      completionTime: Math.floor(Math.random() * 600) + 300, // 5-15分钟
      
      // 问卷2特有数据结构
      basicInfo,
      economicPressureData,
      employmentConfidenceData,
      modernDebtData,
      
      // 计算综合评分
      scores: {
        economicPressure: calculateEconomicPressureScore(economicPressureData),
        employmentConfidence: calculateEmploymentConfidenceScore(employmentConfidenceData),
        debtRisk: calculateDebtRiskScore(modernDebtData)
      }
    };
    
    responses.push(response);
  }
  
  return responses;
}

// 计算经济压力评分
function calculateEconomicPressureScore(data) {
  let score = 50; // 基础分
  
  // 根据月支出和收入比例调整
  const totalIncome = data.familySupport + data.partTimeIncome;
  const ratio = data.monthlyCost / Math.max(totalIncome, 1);
  
  if (ratio > 1.5) score += 30;
  else if (ratio > 1.2) score += 20;
  else if (ratio > 1.0) score += 10;
  else if (ratio < 0.7) score -= 20;
  
  // 根据压力等级调整
  const stressAdjustment = {
    'very-low': -20, 'low': -10, 'medium': 0, 'high': 15, 'very-high': 25
  };
  score += stressAdjustment[data.stressLevel] || 0;
  
  return Math.max(0, Math.min(100, score));
}

// 计算就业信心评分
function calculateEmploymentConfidenceScore(data) {
  let score = 0;
  
  score += data.skillPreparation * 0.3;
  score += data.careerClarity * 0.3;
  score += data.industryConfidence * 0.4;
  
  return Math.round(score);
}

// 计算负债风险评分
function calculateDebtRiskScore(data) {
  let score = 0;
  
  // 负债类型风险
  score += data.debtTypes.length * 15;
  
  // 负债金额风险
  if (data.debtAmount > 30000) score += 30;
  else if (data.debtAmount > 15000) score += 20;
  else if (data.debtAmount > 5000) score += 10;
  
  // 还款压力
  const pressureScore = {
    'none': 0, 'low': 10, 'medium': 20, 'high': 30, 'very-high': 40
  };
  score += pressureScore[data.repaymentPressure] || 0;
  
  // 金融素养调整 (素养越高，风险越低)
  score -= (data.financialLiteracy - 50) * 0.3;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

// 主函数
async function generateQ2TestData() {
  console.log('🚀 开始生成问卷2测试数据...\n');
  
  try {
    // 创建输出目录
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    await fs.mkdir(CONFIG.sqlDir, { recursive: true });
    
    // 生成数据
    console.log('📊 生成用户数据...');
    const users = generateUsers(CONFIG.userCount);
    
    console.log('📋 生成问卷回答数据...');
    const responses = generateResponses(users, CONFIG.responseCount);
    
    // 保存JSON数据
    console.log('💾 保存数据文件...');
    await fs.writeFile(
      path.join(CONFIG.outputDir, 'questionnaire2-test-users.json'),
      JSON.stringify(users, null, 2)
    );
    
    await fs.writeFile(
      path.join(CONFIG.outputDir, 'questionnaire2-test-responses.json'),
      JSON.stringify(responses, null, 2)
    );
    
    // 生成统计报告
    const stats = generateStatistics(users, responses);
    await fs.writeFile(
      path.join(CONFIG.outputDir, 'questionnaire2-data-analysis.json'),
      JSON.stringify(stats, null, 2)
    );
    
    console.log('\n✅ 问卷2测试数据生成完成！');
    console.log(`📊 用户数量: ${users.length}`);
    console.log(`📋 问卷数量: ${responses.length}`);
    console.log(`📁 输出目录: ${CONFIG.outputDir}`);
    
    return { users, responses, stats };
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
    throw error;
  }
}

// 生成统计信息
function generateStatistics(users, responses) {
  return {
    summary: {
      userCount: users.length,
      responseCount: responses.length,
      completionRate: '100%',
      generatedAt: new Date().toISOString()
    },
    demographics: {
      ageDistribution: calculateDistribution(responses, r => r.basicInfo.ageRange),
      educationDistribution: calculateDistribution(responses, r => r.basicInfo.educationLevel),
      locationDistribution: calculateDistribution(responses, r => r.basicInfo.currentLocation)
    },
    scores: {
      economicPressure: calculateScoreStats(responses, r => r.scores.economicPressure),
      employmentConfidence: calculateScoreStats(responses, r => r.scores.employmentConfidence),
      debtRisk: calculateScoreStats(responses, r => r.scores.debtRisk)
    }
  };
}

function calculateDistribution(data, accessor) {
  const counts = {};
  data.forEach(item => {
    const value = accessor(item);
    counts[value] = (counts[value] || 0) + 1;
  });
  
  const total = data.length;
  const result = {};
  Object.entries(counts).forEach(([key, count]) => {
    result[key] = {
      count,
      percentage: ((count / total) * 100).toFixed(1) + '%'
    };
  });
  
  return result;
}

function calculateScoreStats(data, accessor) {
  const scores = data.map(accessor);
  return {
    min: Math.min(...scores),
    max: Math.max(...scores),
    average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    median: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  generateQ2TestData().catch(console.error);
}

module.exports = { generateQ2TestData, CONFIG, Q2_WEIGHTS, Q2_QUESTIONS };
