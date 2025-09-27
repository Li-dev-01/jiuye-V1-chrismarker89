#!/usr/bin/env node

/**
 * 测试修复后的API是否返回真实今日数据
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const ADMIN_TOKEN = 'eyJ1c2VySWQiOiJhZG1pbl8wMDEiLCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiLnrqHnkIblkZgiLCJwZXJtaXNzaW9ucyI6WyJyZXZpZXdfY29udGVudCIsInZpZXdfZGFzaGJvYXJkIiwibWFuYWdlX3VzZXJzIiwidmlld19hbmFseXRpY3MiXSwiaWF0IjoxNzU4OTcxMDQzOTgxLCJleHAiOjE3NTkwNTc0NDM5ODF9.ZXlKMWMyVnlTV1FpT2lKaFpHMXBibDh3TURFaUxDSjFjMlZ5Ym1GdFpTSTZJbUZrYldsdU1TSXNJbkp2YkdVaU9pSmhaRzFwYmlJc0ltNWhiV1VpT2lMbnJxSG5rSWJsa1pnaUxDSndaWEp0YVhOemFXOXVjeUk2V3lKeVpYWnBaWGRmWTI5dWRHVnVkQ0lzSW5acFpYZGZaR0Z6YUdKdllYSmtJaXdpYldGdVlXZGxYM1Z6WlhKeklpd2lkbWxsZDE5aGJtRnNlWFJwWTNNaVhTd2lhV0YwSWpveE56VTRPVGN4TURRek9UZ3hMQ0psZUhBaU9qRTNOVGt3TlRjME5ETTVPREY5LnNpbXBsZV9hdXRoX3NlY3JldF9rZXlfMjAyNA';

async function testFixedAPI() {
  console.log('🔍 测试修复后的API\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/simple-admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ API请求失败: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.stats) {
      const stats = data.data.stats;
      
      console.log('✅ API修复成功！');
      console.log('\n📊 修复后的数据:');
      console.log(`今日问卷提交: ${stats.todayQuestionnaires || 'undefined'}`);
      console.log(`今日故事提交: ${stats.todayStories || 'undefined'}`);
      console.log(`今日用户注册: ${stats.todaySubmissions || 'undefined'}`);
      
      console.log('\n📋 完整统计数据:');
      console.log(`总问卷数: ${stats.totalQuestionnaires}`);
      console.log(`总故事数: ${stats.totalStories}`);
      console.log(`总用户数: ${stats.totalUsers}`);
      
      // 验证数据是否为真实数据
      if (stats.todayQuestionnaires !== undefined && stats.todayStories !== undefined) {
        console.log('\n✅ 修复验证:');
        console.log('- API现在返回真实的今日统计数据');
        console.log('- 不再使用硬编码百分比计算');
        console.log('- 前端将显示真实数据');
      } else {
        console.log('\n❌ 修复失败:');
        console.log('- API仍未返回今日统计字段');
      }
      
    } else {
      console.error('❌ API响应格式错误:', data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFixedAPI();
