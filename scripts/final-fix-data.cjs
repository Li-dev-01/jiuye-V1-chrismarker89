#!/usr/bin/env node

/**
 * 最终修复数据脚本
 * 提交包含年龄段和工作地点偏好的问卷数据
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 数据选项配置（与前端完全一致）
const dataOptions = {
  ageRanges: ['under-20', '20-22', '23-25', '26-28', '29-35', 'over-35'],
  genders: ['male', 'female', 'prefer-not-say'],
  workLocationPreferences: ['tier1', 'new-tier1', 'tier2', 'tier3', 'hometown', 'flexible'],
  educationLevels: ['high-school', 'junior-college', 'bachelor', 'master', 'phd'],
  majors: ['engineering', 'management', 'science', 'literature', 'medicine', 'education', 'law', 'art', 'economics', 'philosophy'],
  graduationYears: ['2022-06', '2023-06', '2024-06', '2025-06'],
  employmentStatuses: ['employed', 'seeking', 'continuing-education', 'entrepreneurship'],
  locations: ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou', 'nanjing', 'wuhan', 'chengdu']
};

// 随机选择函数
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 生成问卷数据
function generateQuestionnaireData() {
  const ageRange = randomChoice(dataOptions.ageRanges);
  const gender = randomChoice(dataOptions.genders);
  const workLocationPreference = randomChoice(dataOptions.workLocationPreferences);
  const educationLevel = randomChoice(dataOptions.educationLevels);
  const major = randomChoice(dataOptions.majors);
  const graduationYear = randomChoice(dataOptions.graduationYears);
  const currentStatus = randomChoice(dataOptions.employmentStatuses);
  const location = randomChoice(dataOptions.locations);

  return {
    questionnaireId: 'employment-survey-2024',
    sectionResponses: [
      {
        sectionId: 'basic-demographics',
        questionResponses: [
          {
            questionId: 'age-range',
            value: ageRange,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          },
          {
            questionId: 'gender',
            value: gender,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          },
          {
            questionId: 'work-location-preference',
            value: workLocationPreference,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          },
          {
            questionId: 'education-level',
            value: educationLevel,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          },
          {
            questionId: 'major-field',
            value: major,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          },
          {
            questionId: 'graduation-year',
            value: graduationYear,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          },
          {
            questionId: 'location',
            value: location,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          }
        ]
      },
      {
        sectionId: 'employment-status',
        questionResponses: [
          {
            questionId: 'current-status',
            value: currentStatus,
            timestamp: Date.now() - Math.floor(Math.random() * 5000)
          }
        ]
      }
    ],
    metadata: {
      userAgent: 'final-fix-script',
      timestamp: Date.now(),
      source: 'final-data-fix'
    }
  };
}

// 提交单条数据
async function submitData(data, index) {
  try {
    const response = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ 数据 ${index + 1} 提交成功: submissionId ${result.data.submissionId}`);
      return { success: true, data: result.data };
    } else {
      const errorText = await response.text();
      console.log(`❌ 数据 ${index + 1} 提交失败: ${response.status} ${response.statusText}`);
      console.log('错误详情:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`❌ 数据 ${index + 1} 网络错误:`, error.message);
    return { success: false, error: error.message };
  }
}

// 检查统计数据
async function checkStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const data = await response.json();
    
    if (data.success) {
      const ageStats = data.data.statistics['age-range'];
      const workLocationStats = data.data.statistics['work-location-preference'];
      const genderStats = data.data.statistics['gender'];
      
      console.log('\n📊 当前统计状态:');
      console.log(`  年龄段: ${ageStats ? ageStats.totalResponses + '人' : '无数据'}`);
      console.log(`  工作地点偏好: ${workLocationStats ? workLocationStats.totalResponses + '人' : '无数据'}`);
      console.log(`  性别: ${genderStats ? genderStats.totalResponses + '人' : '无数据'}`);
      
      if (ageStats) {
        console.log('  年龄段分布:');
        ageStats.options.slice(0, 3).forEach(option => {
          console.log(`    ${option.value}: ${option.count}人 (${option.percentage}%)`);
        });
      }
      
      if (workLocationStats) {
        console.log('  工作地点偏好分布:');
        workLocationStats.options.slice(0, 3).forEach(option => {
          console.log(`    ${option.value}: ${option.count}人 (${option.percentage}%)`);
        });
      }
    }
  } catch (error) {
    console.error('❌ 检查统计时出现错误:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 最终修复数据工具启动\n');
  console.log('=' * 50);
  
  // 检查当前统计状态
  console.log('📊 检查当前统计状态...');
  await checkStats();
  
  // 提交50条包含年龄段和工作地点偏好的数据
  console.log('\n📝 开始提交50条修复数据...');
  
  const results = {
    total: 50,
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < 50; i++) {
    console.log(`\n📝 正在提交第 ${i + 1} 条数据...`);
    
    const questionnaireData = generateQuestionnaireData();
    const result = await submitData(questionnaireData, i);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(result.error);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 每10条数据显示一次进度
    if ((i + 1) % 10 === 0) {
      console.log(`\n📈 进度: ${i + 1}/${results.total} (成功: ${results.success}, 失败: ${results.failed})`);
    }
  }

  // 显示最终结果
  console.log('\n📊 提交结果统计:');
  console.log(`  总数: ${results.total}`);
  console.log(`  成功: ${results.success}`);
  console.log(`  失败: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    results.errors.slice(0, 3).forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    if (results.errors.length > 3) {
      console.log(`  ... 还有 ${results.errors.length - 3} 个错误`);
    }
  }

  // 等待2分钟让数据生效
  console.log('\n⏳ 等待2分钟让数据生效...');
  for (let i = 120; i > 0; i--) {
    process.stdout.write(`\r⏳ 剩余时间: ${i} 秒`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n');

  // 再次检查统计状态
  console.log('📊 检查更新后的统计状态...');
  await checkStats();
  
  console.log('\n' + '=' * 50);
  console.log('✨ 修复完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateQuestionnaireData,
  submitData,
  checkStats
};
