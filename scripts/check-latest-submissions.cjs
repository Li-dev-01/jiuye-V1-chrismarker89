#!/usr/bin/env node

/**
 * 检查最新问卷提交数据脚本
 * 验证数据库中最近的问卷提交情况
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

async function checkLatestSubmissions() {
  console.log('🔍 检查最新问卷提交数据...\n');

  try {
    // 1. 检查问卷列表（需要认证，但我们先试试）
    console.log('📊 1. 尝试检查问卷列表');
    try {
      const listResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/list`);
      const listData = await listResponse.json();
      console.log('问卷列表响应:', listData);
    } catch (error) {
      console.log('⚠️ 无法获取问卷列表（可能需要认证）:', error.message);
    }

    // 2. 检查问卷统计数据（公开接口）
    console.log('\n📈 2. 检查问卷统计数据');
    const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const statsData = await statsResponse.json();

    if (statsData.success && statsData.data) {
      console.log('✅ 成功获取统计数据');

      // 分析统计数据中的总数
      const stats = statsData.data;
      let totalResponses = 0;

      // 从各个统计字段中提取总响应数
      if (stats.ageDistribution && stats.ageDistribution.length > 0) {
        totalResponses = stats.ageDistribution.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
      } else if (stats.genderDistribution && stats.genderDistribution.length > 0) {
        totalResponses = stats.genderDistribution.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
      } else if (stats.employmentStatus && stats.employmentStatus.length > 0) {
        totalResponses = stats.employmentStatus.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
      }

      console.log(`📊 总响应数: ${totalResponses}`);
      console.log(`📊 统计数据字段数: ${Object.keys(stats).length}`);

      // 显示一些关键统计
      if (stats.ageDistribution) {
        console.log(`📊 年龄分布数据: ${stats.ageDistribution.length} 个分组`);
        stats.ageDistribution.forEach(item => {
          console.log(`  ${item.name}: ${item.value || item.count}人 (${item.percentage}%)`);
        });
      }

      if (stats.lastUpdated) {
        const lastUpdated = new Date(stats.lastUpdated);
        const now = new Date();
        const timeDiff = now - lastUpdated;
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));
        const hoursAgo = Math.floor(minutesAgo / 60);

        console.log(`\n⏰ 统计数据最后更新时间分析:`);
        console.log(`  最后更新: ${stats.lastUpdated}`);
        console.log(`  当前时间: ${now.toISOString()}`);
        if (minutesAgo < 60) {
          console.log(`  距离现在: ${minutesAgo} 分钟前`);
        } else {
          console.log(`  距离现在: ${hoursAgo} 小时前`);
        }
      }

    } else {
      console.log('❌ 无法获取统计数据');
      console.log('响应数据:', JSON.stringify(statsData, null, 2));
    }

    // 3. 尝试检查问卷响应详情（需要认证）
    console.log('\n📝 3. 尝试检查问卷响应详情');
    try {
      const responsesResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/responses/employment-survey-2024?page=1&pageSize=5`);
      const responsesData = await responsesResponse.json();

      if (responsesData.success && responsesData.data && responsesData.data.length > 0) {
        console.log(`✅ 找到 ${responsesData.data.length} 条最近的响应:`);

        responsesData.data.forEach((response, index) => {
          console.log(`\n📋 响应 ${index + 1}:`);
          console.log(`  ID: ${response.id}`);
          console.log(`  问卷ID: ${response.questionnaire_id}`);
          console.log(`  提交时间: ${response.submitted_at}`);
          console.log(`  是否完成: ${response.is_completed ? '是' : '否'}`);
          console.log(`  是否有效: ${response.is_valid ? '是' : '否'}`);

          // 尝试解析响应数据
          if (response.responses) {
            try {
              const responses = JSON.parse(response.responses);
              console.log(`  响应数据字段数: ${Object.keys(responses).length}`);

              // 显示一些关键字段
              const keyFields = ['age-range', 'gender', 'education-level', 'employment-status'];
              keyFields.forEach(field => {
                if (responses[field]) {
                  console.log(`    ${field}: ${responses[field]}`);
                }
              });
            } catch (error) {
              console.log(`  响应数据解析失败: ${error.message}`);
            }
          }
        });
      } else {
        console.log('⚠️ 无法获取响应详情（可能需要认证）');
        console.log('响应状态:', responsesData);
      }
    } catch (error) {
      console.log('⚠️ 检查响应详情时出错:', error.message);
    }

    // 4. 检查API健康状态
    console.log('\n🏥 4. 检查API健康状态');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('API状态:', healthData);

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
    console.error('错误详情:', error.message);
  }
}

// 检查数据库连接状态
async function checkDatabaseConnection() {
  console.log('\n🔗 5. 检查数据库连接状态');
  
  try {
    const dbResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/database-status`);
    const dbData = await dbResponse.json();
    
    if (dbData.success) {
      console.log('✅ 数据库连接正常');
      console.log('数据库信息:', JSON.stringify(dbData.data, null, 2));
    } else {
      console.log('⚠️ 数据库连接异常:', dbData.message);
    }
  } catch (error) {
    console.log('⚠️ 无法检查数据库状态:', error.message);
  }
}

// 检查提交API端点
async function checkSubmissionEndpoint() {
  console.log('\n🔌 6. 检查提交API端点');
  
  try {
    // 发送一个测试请求到提交端点（不实际提交数据）
    const testResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
      method: 'OPTIONS'
    });
    
    console.log(`提交端点状态码: ${testResponse.status}`);
    console.log(`提交端点可访问: ${testResponse.status === 200 || testResponse.status === 204 ? '是' : '否'}`);
    
    // 检查CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': testResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': testResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': testResponse.headers.get('Access-Control-Allow-Headers')
    };
    console.log('CORS配置:', corsHeaders);
    
  } catch (error) {
    console.log('⚠️ 无法检查提交端点:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始检查最新问卷提交数据...\n');
  console.log(`API地址: ${API_BASE_URL}\n`);
  
  await checkLatestSubmissions();
  await checkDatabaseConnection();
  await checkSubmissionEndpoint();
  
  console.log('\n✅ 检查完成！');
}

// 运行脚本
main().catch(console.error);
