#!/usr/bin/env node

/**
 * 测试管理员仪表板API的真实性
 * 检查 https://reviewer-admin-dashboard.pages.dev/admin/dashboard 页面使用的API
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const ADMIN_DASHBOARD_ENDPOINT = '/api/simple-admin/dashboard';

// 管理员token（使用正确的简化认证token）
const ADMIN_TOKEN = 'eyJ1c2VySWQiOiJhZG1pbl8wMDEiLCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiLnrqHnkIblkZgiLCJwZXJtaXNzaW9ucyI6WyJyZXZpZXdfY29udGVudCIsInZpZXdfZGFzaGJvYXJkIiwibWFuYWdlX3VzZXJzIiwidmlld19hbmFseXRpY3MiXSwiaWF0IjoxNzU4OTcxMDQzOTgxLCJleHAiOjE3NTkwNTc0NDM5ODF9.ZXlKMWMyVnlTV1FpT2lKaFpHMXBibDh3TURFaUxDSjFjMlZ5Ym1GdFpTSTZJbUZrYldsdU1TSXNJbkp2YkdVaU9pSmhaRzFwYmlJc0ltNWhiV1VpT2lMbnJxSG5rSWJsa1pnaUxDSndaWEp0YVhOemFXOXVjeUk2V3lKeVpYWnBaWGRmWTI5dWRHVnVkQ0lzSW5acFpYZGZaR0Z6YUdKdllYSmtJaXdpYldGdVlXZGxYM1Z6WlhKeklpd2lkbWxsZDE5aGJtRnNlWFJwWTNNaVhTd2lhV0YwSWpveE56VTRPVGN4TURRek9UZ3hMQ0psZUhBaU9qRTNOVGt3TlRjME5ETTVPREY5LnNpbXBsZV9hdXRoX3NlY3JldF9rZXlfMjAyNA';

async function testAdminDashboardAPI() {
  console.log('🔍 测试管理员仪表板API的真实性...\n');
  
  try {
    // 1. 测试API连通性
    console.log('📡 1. 测试API基础连通性');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ API状态: ${healthData.data?.status || 'unknown'}`);
    
    // 2. 测试管理员仪表板端点
    console.log('\n📊 2. 测试管理员仪表板端点');
    console.log(`请求URL: ${API_BASE_URL}${ADMIN_DASHBOARD_ENDPOINT}`);
    
    const dashboardResponse = await fetch(`${API_BASE_URL}${ADMIN_DASHBOARD_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    console.log(`📡 响应状态码: ${dashboardResponse.status}`);
    console.log(`📡 响应状态: ${dashboardResponse.statusText}`);
    
    // 3. 解析响应数据
    console.log('\n📊 3. 解析响应数据');
    let dashboardData;
    try {
      dashboardData = await dashboardResponse.json();
      console.log('响应数据结构:', JSON.stringify(dashboardData, null, 2));
    } catch (error) {
      console.error('❌ 响应数据解析失败:', error.message);
      const responseText = await dashboardResponse.text();
      console.log('原始响应文本:', responseText);
      return;
    }
    
    // 4. 分析数据真实性
    console.log('\n🔍 4. 分析数据真实性');
    
    if (dashboardResponse.ok && dashboardData.success) {
      console.log('✅ API调用成功！');
      
      const data = dashboardData.data;
      console.log('\n📊 仪表板数据分析:');
      
      // 检查核心统计数据
      if (data.stats) {
        const stats = data.stats;
        console.log(`📈 总用户数: ${stats.totalUsers || 'N/A'}`);
        console.log(`📈 总问卷数: ${stats.totalQuestionnaires || 'N/A'}`);
        console.log(`📈 总故事数: ${stats.totalStories || 'N/A'}`);
        console.log(`📈 今日提交: ${stats.todaySubmissions || 'N/A'}`);
        console.log(`📈 活跃用户: ${stats.activeUsers || 'N/A'}`);
        console.log(`📈 系统健康: ${stats.systemHealth || 'N/A'}`);
        
        // 检查"今日新增"数据的合理性
        console.log('\n🚨 "今日新增"数据检查:');
        const todaySubmissions = stats.todaySubmissions || 0;
        const totalQuestionnaires = stats.totalQuestionnaires || 0;
        
        if (todaySubmissions > 0) {
          const todayPercentage = (todaySubmissions / totalQuestionnaires * 100).toFixed(2);
          console.log(`📊 今日提交占总数比例: ${todayPercentage}%`);
          
          if (todayPercentage > 10) {
            console.log('⚠️  警告: 今日提交比例过高，可能是假数据');
          } else if (todayPercentage > 5) {
            console.log('⚠️  注意: 今日提交比例较高，需要验证');
          } else {
            console.log('✅ 今日提交比例正常');
          }
        } else {
          console.log('📊 今日提交数为0，可能是真实数据或API问题');
        }
      }
      
      // 检查用户数据
      if (data.recentUsers) {
        console.log(`\n👥 最近用户数据: ${data.recentUsers.length} 条记录`);
        if (data.recentUsers.length > 0) {
          console.log('最近用户示例:');
          data.recentUsers.slice(0, 3).forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.username || user.id} - ${user.status || 'unknown'}`);
          });
        }
      }
      
    } else {
      console.log('❌ API调用失败！');
      console.log(`错误信息: ${dashboardData.message || dashboardData.error || '未知错误'}`);
      
      if (dashboardResponse.status === 401) {
        console.log('🔍 401错误 - 可能的原因:');
        console.log('  - 管理员token无效或过期');
        console.log('  - 认证中间件配置问题');
        console.log('  - API端点需要不同的认证方式');
      } else if (dashboardResponse.status === 404) {
        console.log('🔍 404错误 - 可能的原因:');
        console.log('  - API端点不存在');
        console.log('  - 路由配置错误');
        console.log('  - 后端服务未正确部署');
      } else if (dashboardResponse.status === 500) {
        console.log('🔍 500错误 - 可能的原因:');
        console.log('  - 数据库连接问题');
        console.log('  - 服务器内部错误');
        console.log('  - API代码异常');
      }
    }
    
    // 5. 检查数据库连接
    console.log('\n🗄️  5. 检查相关数据库表');
    
    // 尝试获取问卷统计数据来验证
    const questionnaireStatsResponse = await fetch(`${API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024`);
    if (questionnaireStatsResponse.ok) {
      const questionnaireStats = await questionnaireStatsResponse.json();
      if (questionnaireStats.success && questionnaireStats.data) {
        console.log('✅ 问卷统计API正常');

        // 计算真实的总响应数
        let realTotalResponses = 0;
        if (questionnaireStats.data.ageDistribution) {
          realTotalResponses = questionnaireStats.data.ageDistribution.reduce((sum, item) => sum + (item.value || 0), 0);
        }

        console.log(`📊 真实问卷总数: ${realTotalResponses}`);

        // 对比管理员仪表板显示的数据
        if (dashboardData && dashboardData.data && dashboardData.data.stats && dashboardData.data.stats.totalQuestionnaires) {
          const dashboardTotal = dashboardData.data.stats.totalQuestionnaires;
          console.log(`📊 仪表板显示总数: ${dashboardTotal}`);

          if (Math.abs(dashboardTotal - realTotalResponses) > 100) {
            console.log('🚨 警告: 仪表板数据与真实数据差异较大，可能使用了假数据');
          } else {
            console.log('✅ 仪表板数据与真实数据基本一致');
          }
        }
      }
    } else {
      console.log('⚠️  问卷统计API无法访问');
      console.log(`响应状态: ${questionnaireStatsResponse.status} ${questionnaireStatsResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('🔍 网络错误 - 可能的原因:');
      console.log('  - API服务不可用');
      console.log('  - 网络连接问题');
      console.log('  - CORS配置问题');
    }
  }
}

// 检查后备数据
function checkFallbackData() {
  console.log('\n🎭 6. 检查前端后备数据');
  console.log('根据代码分析，当API失败时，前端会使用以下模拟数据:');
  console.log('  - 总用户数: 1247');
  console.log('  - 总问卷数: 3456');
  console.log('  - 总故事数: 892');
  console.log('  - 今日提交: 45');
  console.log('  - 活跃用户: 156');
  console.log('');
  console.log('🚨 如果页面显示的是这些数字，说明API调用失败，使用了假数据！');
}

// 主函数
async function main() {
  console.log('🚀 管理员仪表板API真实性测试工具\n');
  console.log(`API地址: ${API_BASE_URL}`);
  console.log(`测试端点: ${ADMIN_DASHBOARD_ENDPOINT}\n`);
  
  await testAdminDashboardAPI();
  checkFallbackData();
  
  console.log('\n✅ 测试完成！');
  console.log('\n📋 总结建议:');
  console.log('1. 如果API返回401错误，检查管理员认证系统');
  console.log('2. 如果API返回404错误，检查后端路由配置');
  console.log('3. 如果显示模拟数据，说明API调用失败');
  console.log('4. 对比真实问卷数据来验证"今日新增"的准确性');
}

// 运行测试
main().catch(console.error);
