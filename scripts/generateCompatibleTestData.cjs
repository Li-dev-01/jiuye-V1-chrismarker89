#!/usr/bin/env node

/**
 * 兼容线上数据库结构的测试数据生成器
 * 严格按照线上数据库表结构和约束生成测试数据
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 数据分布配置
const DATA_DISTRIBUTIONS = {
  age_range: {
    '18-22': 0.25,
    '23-25': 0.45,
    '26-30': 0.25,
    '31-35': 0.04,
    'over-35': 0.01
  },
  education_level: {
    'high-school': 0.05,
    'junior-college': 0.15,
    'bachelor': 0.65,
    'master': 0.13,
    'phd': 0.02
  },
  employment_status: {
    'employed': 0.50,
    'unemployed': 0.25,
    'student': 0.20,
    'preparing': 0.04,
    'other': 0.01
  },
  gender: {
    'male': 0.52,
    'female': 0.46,
    'prefer-not-say': 0.02
  },
  work_location: {
    'beijing': 0.20,
    'shanghai': 0.18,
    'guangzhou': 0.12,
    'shenzhen': 0.12,
    'hangzhou': 0.08,
    'chengdu': 0.06,
    'wuhan': 0.04,
    'nanjing': 0.04,
    'tianjin': 0.03,
    'other': 0.13
  }
};

// 工具函数
function weightedRandom(weights) {
  const random = Math.random();
  let sum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    sum += weight;
    if (random <= sum) return key;
  }
  return Object.keys(weights)[0];
}

function generateRandomDate(startDate = '2024-01-01', endDate = '2024-09-20') {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().slice(0, 19).replace('T', ' ');
}

// 用户数据生成器
class UserGenerator {
  generateUser(index) {
    const username = `testuser${index.toString().padStart(3, '0')}`;
    const email = `test${index.toString().padStart(3, '0')}@example.com`;
    
    return {
      id: `test-user-${index.toString().padStart(3, '0')}`,
      username,
      email,
      password_hash: 'test_hash_' + crypto.randomBytes(16).toString('hex'),
      role: 'user',
      created_at: generateRandomDate(),
      updated_at: generateRandomDate()
    };
  }
}

// 问卷数据生成器
class QuestionnaireGenerator {
  generateUniversalResponse(userId, index) {
    const ageRange = weightedRandom(DATA_DISTRIBUTIONS.age_range);
    const educationLevel = weightedRandom(DATA_DISTRIBUTIONS.education_level);
    const employmentStatus = weightedRandom(DATA_DISTRIBUTIONS.employment_status);
    const gender = weightedRandom(DATA_DISTRIBUTIONS.gender);
    const workLocation = weightedRandom(DATA_DISTRIBUTIONS.work_location);
    
    // 生成符合问卷结构的JSON数据
    const responseData = {
      age_range: ageRange,
      gender: gender,
      education_level: educationLevel,
      employment_status: employmentStatus,
      work_location: workLocation,
      salary_range: employmentStatus === 'employed' ? this.generateSalaryRange(educationLevel) : '',
      industry: employmentStatus === 'employed' ? this.generateIndustry() : '',
      job_satisfaction: employmentStatus === 'employed' ? Math.floor(Math.random() * 5) + 1 : null,
      submission_source: 'test_data',
      completion_time_minutes: Math.floor(Math.random() * 20) + 5
    };

    return {
      questionnaire_id: 'employment-survey-2024',
      user_id: userId,
      response_data: JSON.stringify(responseData),
      submitted_at: generateRandomDate(),
      ip_address: this.generateRandomIP(),
      user_agent: 'Mozilla/5.0 (Test Data Generator)',
      created_at: generateRandomDate(),
      updated_at: generateRandomDate()
    };
  }

  generateAnalyticsResponse(userId, universalResponse, index) {
    const responseData = JSON.parse(universalResponse.response_data);
    
    return {
      id: `test-analytics-${index.toString().padStart(3, '0')}`,
      user_id: userId,
      submitted_at: universalResponse.submitted_at,
      age_range: responseData.age_range,
      education_level: responseData.education_level,
      employment_status: responseData.employment_status,
      salary_range: responseData.salary_range,
      work_location: responseData.work_location,
      industry: responseData.industry,
      gender: responseData.gender,
      job_search_channels: this.generateJobSearchChannels(),
      difficulties: this.generateDifficulties(),
      skills: this.generateSkills(),
      policy_suggestions: this.generatePolicySuggestions(),
      salary_expectation: this.generateSalaryExpectation(responseData.education_level),
      work_experience_months: this.generateWorkExperience(),
      job_search_duration_months: this.generateJobSearchDuration(),
      data_quality_score: 1.0,
      is_complete: 1,
      processing_version: 'v1.0',
      is_test_data: 1,
      created_at: generateRandomDate(),
      updated_at: generateRandomDate()
    };
  }

  generateSalaryRange(educationLevel) {
    const ranges = {
      'high-school': ['3000-5000', '5000-8000'],
      'junior-college': ['5000-8000', '8000-12000'],
      'bachelor': ['8000-12000', '12000-18000', '18000-25000'],
      'master': ['12000-18000', '18000-25000', '25000-35000'],
      'phd': ['20000-30000', '30000-50000', '50000+']
    };
    const options = ranges[educationLevel] || ranges['bachelor'];
    return options[Math.floor(Math.random() * options.length)];
  }

  generateIndustry() {
    const industries = ['technology', 'finance', 'education', 'healthcare', 'manufacturing', 'retail', 'consulting'];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  generateRandomIP() {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  generateJobSearchChannels() {
    const channels = ['online_platforms', 'campus_recruitment', 'referrals', 'direct_application'];
    return channels.slice(0, Math.floor(Math.random() * 3) + 1).join(',');
  }

  generateDifficulties() {
    const difficulties = ['lack_experience', 'high_competition', 'skill_mismatch', 'location_constraints'];
    return difficulties.slice(0, Math.floor(Math.random() * 2) + 1).join(',');
  }

  generateSkills() {
    const skills = ['programming', 'communication', 'project_management', 'data_analysis'];
    return skills.slice(0, Math.floor(Math.random() * 3) + 1).join(',');
  }

  generatePolicySuggestions() {
    const suggestions = ['more_internships', 'skill_training', 'career_guidance', 'job_matching'];
    return suggestions.slice(0, Math.floor(Math.random() * 2) + 1).join(',');
  }

  generateSalaryExpectation(educationLevel) {
    const expectations = {
      'high-school': [4000, 6000, 8000],
      'junior-college': [6000, 8000, 10000],
      'bachelor': [8000, 12000, 15000],
      'master': [12000, 18000, 25000],
      'phd': [20000, 30000, 40000]
    };
    const options = expectations[educationLevel] || expectations['bachelor'];
    return options[Math.floor(Math.random() * options.length)];
  }

  generateWorkExperience() {
    return Math.floor(Math.random() * 60); // 0-60个月
  }

  generateJobSearchDuration() {
    return Math.floor(Math.random() * 12) + 1; // 1-12个月
  }
}

// SQL生成器
class SQLGenerator {
  generateUserInserts(users) {
    const chunks = [];
    for (let i = 0; i < users.length; i += 20) {
      const chunk = users.slice(i, i + 20);
      const values = chunk.map(user => 
        `('${user.id}', '${user.username}', '${user.email}', '${user.password_hash}', '${user.role}', '${user.created_at}', '${user.updated_at}')`
      ).join(',\n  ');
      
      chunks.push(`INSERT OR IGNORE INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES\n  ${values};`);
    }
    return chunks;
  }

  generateUniversalQuestionnaireInserts(responses) {
    const chunks = [];
    for (let i = 0; i < responses.length; i += 20) {
      const chunk = responses.slice(i, i + 20);
      const values = chunk.map(resp => 
        `('${resp.questionnaire_id}', '${resp.user_id}', '${resp.response_data.replace(/'/g, "''")}', '${resp.submitted_at}', '${resp.ip_address}', '${resp.user_agent}', '${resp.created_at}', '${resp.updated_at}')`
      ).join(',\n  ');
      
      chunks.push(`INSERT OR IGNORE INTO universal_questionnaire_responses (questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent, created_at, updated_at) VALUES\n  ${values};`);
    }
    return chunks;
  }

  generateAnalyticsInserts(responses) {
    const chunks = [];
    for (let i = 0; i < responses.length; i += 20) {
      const chunk = responses.slice(i, i + 20);
      const values = chunk.map(resp => {
        const fields = [
          `'${resp.id}'`, `'${resp.user_id}'`, `'${resp.submitted_at}'`,
          resp.age_range ? `'${resp.age_range}'` : 'NULL',
          resp.education_level ? `'${resp.education_level}'` : 'NULL',
          resp.employment_status ? `'${resp.employment_status}'` : 'NULL',
          resp.salary_range ? `'${resp.salary_range}'` : 'NULL',
          resp.work_location ? `'${resp.work_location}'` : 'NULL',
          resp.industry ? `'${resp.industry}'` : 'NULL',
          resp.gender ? `'${resp.gender}'` : 'NULL',
          resp.job_search_channels ? `'${resp.job_search_channels}'` : 'NULL',
          resp.difficulties ? `'${resp.difficulties}'` : 'NULL',
          resp.skills ? `'${resp.skills}'` : 'NULL',
          resp.policy_suggestions ? `'${resp.policy_suggestions}'` : 'NULL',
          resp.salary_expectation || 'NULL',
          resp.work_experience_months || 'NULL',
          resp.job_search_duration_months || 'NULL',
          resp.data_quality_score,
          resp.is_complete,
          `'${resp.processing_version}'`,
          resp.is_test_data,
          `'${resp.created_at}'`,
          `'${resp.updated_at}'`
        ];
        return `(${fields.join(', ')})`;
      }).join(',\n  ');
      
      chunks.push(`INSERT OR IGNORE INTO analytics_responses (id, user_id, submitted_at, age_range, education_level, employment_status, salary_range, work_location, industry, gender, job_search_channels, difficulties, skills, policy_suggestions, salary_expectation, work_experience_months, job_search_duration_months, data_quality_score, is_complete, processing_version, is_test_data, created_at, updated_at) VALUES\n  ${values};`);
    }
    return chunks;
  }
}

// 主生成函数
function generateCompatibleTestData(config = { userCount: 100, responseCount: 200 }) {
  console.log('🎲 生成兼容线上数据库的测试数据...');
  
  const userGen = new UserGenerator();
  const questionnaireGen = new QuestionnaireGenerator();
  const sqlGen = new SQLGenerator();
  
  // 1. 生成用户数据
  console.log(`👥 生成 ${config.userCount} 个用户...`);
  const users = [];
  for (let i = 1; i <= config.userCount; i++) {
    users.push(userGen.generateUser(i));
  }
  
  // 2. 生成问卷数据
  console.log(`📝 生成 ${config.responseCount} 份问卷...`);
  const universalResponses = [];
  const analyticsResponses = [];
  
  for (let i = 1; i <= config.responseCount; i++) {
    const userId = users[Math.floor(Math.random() * users.length)].id;
    
    // 生成universal_questionnaire_responses数据
    const universalResp = questionnaireGen.generateUniversalResponse(userId, i);
    universalResponses.push(universalResp);
    
    // 生成对应的analytics_responses数据
    const analyticsResp = questionnaireGen.generateAnalyticsResponse(userId, universalResp, i);
    analyticsResponses.push(analyticsResp);
  }
  
  // 3. 生成SQL文件
  console.log('📁 生成SQL文件...');
  const outputDir = path.join(__dirname, '../test-data/compatible-sql');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 清理脚本
  const cleanupSQL = `-- 清理现有测试数据
DELETE FROM analytics_responses WHERE is_test_data = 1;
DELETE FROM universal_questionnaire_responses WHERE questionnaire_id = 'employment-survey-2024' AND user_id LIKE 'test-%';
DELETE FROM users WHERE id LIKE 'test-%';
`;
  fs.writeFileSync(path.join(outputDir, '01-cleanup.sql'), cleanupSQL);
  
  // 用户数据
  const userSQLs = sqlGen.generateUserInserts(users);
  userSQLs.forEach((sql, index) => {
    fs.writeFileSync(path.join(outputDir, `02-users-batch-${(index + 1).toString().padStart(2, '0')}.sql`), sql);
  });
  
  // 问卷数据
  const universalSQLs = sqlGen.generateUniversalQuestionnaireInserts(universalResponses);
  universalSQLs.forEach((sql, index) => {
    fs.writeFileSync(path.join(outputDir, `03-questionnaire-batch-${(index + 1).toString().padStart(2, '0')}.sql`), sql);
  });
  
  // 分析数据
  const analyticsSQLs = sqlGen.generateAnalyticsInserts(analyticsResponses);
  analyticsSQLs.forEach((sql, index) => {
    fs.writeFileSync(path.join(outputDir, `04-analytics-batch-${(index + 1).toString().padStart(2, '0')}.sql`), sql);
  });
  
  console.log(`✅ 生成完成！`);
  console.log(`   - 用户数量: ${users.length}`);
  console.log(`   - 问卷数量: ${universalResponses.length}`);
  console.log(`   - 分析数据: ${analyticsResponses.length}`);
  console.log(`   - SQL文件: ${outputDir}`);
  
  return {
    users,
    universalResponses,
    analyticsResponses,
    outputDir
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  generateCompatibleTestData({ userCount: 50, responseCount: 100 });
}

module.exports = { generateCompatibleTestData };
