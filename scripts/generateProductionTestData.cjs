#!/usr/bin/env node

/**
 * 生产环境测试数据生成器
 * 根据线上数据库实际表结构生成测试数据
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

// 根据分布随机选择
function weightedRandom(distribution) {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [key, weight] of Object.entries(distribution)) {
    cumulative += weight;
    if (rand <= cumulative) {
      return key;
    }
  }
  
  return Object.keys(distribution)[0];
}

// 生成用户数据（匹配线上users表结构）
function generateUser(index) {
  const userId = `test_user_${String(index).padStart(6, '0')}`;
  const username = `testuser${index}`;
  const email = `test${index}@example.com`;
  
  return {
    id: userId,
    username: username,
    email: email,
    password_hash: 'test_hash_' + crypto.randomBytes(8).toString('hex'),
    role: 'user',
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };
}

// 生成问卷数据
function generateQuestionnaireResponse(user, index) {
  const ageRange = weightedRandom(DATA_DISTRIBUTIONS.age_range);
  const educationLevel = weightedRandom(DATA_DISTRIBUTIONS.education_level);
  const employmentStatus = weightedRandom(DATA_DISTRIBUTIONS.employment_status);
  const gender = weightedRandom(DATA_DISTRIBUTIONS.gender);
  const workLocation = weightedRandom(DATA_DISTRIBUTIONS.work_location);
  
  const responseData = {
    personal_info: {
      age_range: ageRange,
      gender: gender,
      education_level: educationLevel,
      major: '计算机科学',
      graduation_year: '2024'
    },
    employment_status: {
      current_status: employmentStatus,
      work_location: workLocation,
      industry: 'technology',
      company_size: 'medium'
    },
    test_user_identifier: user.id
  };
  
  return {
    questionnaire_id: 'employment-survey-2024',
    user_id: null, // 设为NULL避免外键约束
    response_data: JSON.stringify(responseData),
    submitted_at: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
    ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
    user_agent: 'Test Browser',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// 生成分析数据
function generateAnalyticsResponse(user, questionnaireResponse) {
  const responseData = JSON.parse(questionnaireResponse.response_data);
  
  return {
    id: `analytics_${user.id}`,
    user_id: user.id,
    submitted_at: questionnaireResponse.submitted_at,
    age_range: responseData.personal_info.age_range,
    education_level: responseData.personal_info.education_level,
    employment_status: responseData.employment_status.current_status,
    salary_range: '8000-12000',
    work_location: responseData.employment_status.work_location,
    industry: responseData.employment_status.industry,
    gender: responseData.personal_info.gender,
    job_search_channels: 'online',
    difficulties: 'competition',
    skills: 'programming',
    policy_suggestions: 'more_opportunities',
    salary_expectation: 10000,
    work_experience_months: Math.floor(Math.random() * 24),
    job_search_duration_months: Math.floor(Math.random() * 12),
    data_quality_score: 1.0,
    is_complete: 1,
    processing_version: 'v1.0',
    is_test_data: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// 生成SQL插入语句
function generateUserSQL(user) {
  return `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES (
    '${user.id}',
    '${user.username}',
    '${user.email}',
    '${user.password_hash}',
    '${user.role}',
    '${user.created_at}',
    '${user.updated_at}'
  );`;
}

function generateQuestionnaireSQL(response) {
  const escapedData = response.response_data.replace(/'/g, "''");
  return `INSERT INTO universal_questionnaire_responses (questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent, created_at, updated_at) VALUES (
    '${response.questionnaire_id}',
    ${response.user_id},
    '${escapedData}',
    '${response.submitted_at}',
    '${response.ip_address}',
    '${response.user_agent}',
    '${response.created_at}',
    '${response.updated_at}'
  );`;
}

function generateAnalyticsSQL(analytics) {
  return `INSERT INTO analytics_responses (id, user_id, submitted_at, age_range, education_level, employment_status, salary_range, work_location, industry, gender, job_search_channels, difficulties, skills, policy_suggestions, salary_expectation, work_experience_months, job_search_duration_months, data_quality_score, is_complete, processing_version, is_test_data, created_at, updated_at) VALUES (
    '${analytics.id}',
    '${analytics.user_id}',
    '${analytics.submitted_at}',
    '${analytics.age_range}',
    '${analytics.education_level}',
    '${analytics.employment_status}',
    '${analytics.salary_range}',
    '${analytics.work_location}',
    '${analytics.industry}',
    '${analytics.gender}',
    '${analytics.job_search_channels}',
    '${analytics.difficulties}',
    '${analytics.skills}',
    '${analytics.policy_suggestions}',
    ${analytics.salary_expectation},
    ${analytics.work_experience_months},
    ${analytics.job_search_duration_months},
    ${analytics.data_quality_score},
    ${analytics.is_complete},
    '${analytics.processing_version}',
    ${analytics.is_test_data},
    '${analytics.created_at}',
    '${analytics.updated_at}'
  );`;
}

// 主函数
async function generateProductionTestData(options = {}) {
  const { userCount = 100 } = options;
  
  console.log(`🚀 开始生成生产环境测试数据...`);
  console.log(`   - 用户数量: ${userCount}`);
  
  const outputDir = path.join(__dirname, '..', 'production-test-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const users = [];
  const questionnaires = [];
  const analytics = [];
  
  // 生成数据
  for (let i = 1; i <= userCount; i++) {
    const user = generateUser(i);
    const questionnaire = generateQuestionnaireResponse(user, i);
    const analyticsData = generateAnalyticsResponse(user, questionnaire);
    
    users.push(user);
    questionnaires.push(questionnaire);
    analytics.push(analyticsData);
  }
  
  // 生成SQL文件
  const userSQL = users.map(generateUserSQL).join('\n\n');
  const questionnaireSQL = questionnaires.map(generateQuestionnaireSQL).join('\n\n');
  const analyticsSQL = analytics.map(generateAnalyticsSQL).join('\n\n');
  
  fs.writeFileSync(path.join(outputDir, '01-users.sql'), userSQL);
  fs.writeFileSync(path.join(outputDir, '02-questionnaires.sql'), questionnaireSQL);
  fs.writeFileSync(path.join(outputDir, '03-analytics.sql'), analyticsSQL);
  
  // 生成导入脚本
  const importScript = `#!/bin/bash
echo "🚀 开始导入生产环境测试数据..."

echo "1. 导入用户数据..."
wrangler d1 execute college-employment-survey --remote --file="01-users.sql" --yes

echo "2. 导入问卷数据..."
wrangler d1 execute college-employment-survey --remote --file="02-questionnaires.sql" --yes

echo "3. 导入分析数据..."
wrangler d1 execute college-employment-survey --remote --file="03-analytics.sql" --yes

echo "✅ 导入完成！"
`;
  
  fs.writeFileSync(path.join(outputDir, 'import.sh'), importScript);
  fs.chmodSync(path.join(outputDir, 'import.sh'), '755');
  
  console.log(`✅ 生成完成！`);
  console.log(`   - 用户数据: ${users.length}`);
  console.log(`   - 问卷数据: ${questionnaires.length}`);
  console.log(`   - 分析数据: ${analytics.length}`);
  console.log(`   - 输出目录: ${outputDir}`);
  
  return {
    users,
    questionnaires,
    analytics,
    outputDir
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  generateProductionTestData({ userCount: 100 });
}

module.exports = { generateProductionTestData };
