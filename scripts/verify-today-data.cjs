#!/usr/bin/env node

/**
 * 直接查询数据库验证今日数据的真实性
 * 检查是否真的有55条问卷和5条故事
 */

async function verifyTodayData() {
  console.log('🔍 直接查询数据库验证今日数据\n');
  
  try {
    // 1. 查询今日问卷提交数据
    console.log('📊 1. 查询今日问卷提交数据');
    console.log('执行SQL: SELECT COUNT(*) FROM universal_questionnaire_responses WHERE DATE(submitted_at) = DATE(\'now\')');
    
    // 2. 查询今日问卷ID列表
    console.log('\n📋 2. 查询今日问卷ID列表');
    console.log('执行SQL: SELECT id, submitted_at FROM universal_questionnaire_responses WHERE DATE(submitted_at) = DATE(\'now\') ORDER BY submitted_at DESC');
    
    // 3. 查询今日故事提交数据
    console.log('\n📚 3. 查询今日故事提交数据');
    console.log('执行SQL: SELECT COUNT(*) FROM stories WHERE DATE(created_at) = DATE(\'now\')');
    
    // 4. 查询今日故事ID列表
    console.log('\n📋 4. 查询今日故事ID列表');
    console.log('执行SQL: SELECT id, created_at FROM stories WHERE DATE(created_at) = DATE(\'now\') ORDER BY created_at DESC');
    
    console.log('\n⚠️  需要使用 wrangler d1 命令直接查询数据库');
    console.log('请运行以下命令来验证数据:');
    console.log('');
    console.log('# 查询今日问卷总数');
    console.log('npx wrangler d1 execute college-employment-survey --remote --command "SELECT COUNT(*) as today_questionnaires FROM universal_questionnaire_responses WHERE DATE(submitted_at) = DATE(\'now\')"');
    console.log('');
    console.log('# 查询今日问卷ID列表');
    console.log('npx wrangler d1 execute college-employment-survey --remote --command "SELECT id, submitted_at FROM universal_questionnaire_responses WHERE DATE(submitted_at) = DATE(\'now\') ORDER BY submitted_at DESC LIMIT 10"');
    console.log('');
    console.log('# 查询今日故事总数');
    console.log('npx wrangler d1 execute college-employment-survey --remote --command "SELECT COUNT(*) as today_stories FROM stories WHERE DATE(created_at) = DATE(\'now\')"');
    console.log('');
    console.log('# 查询今日故事ID列表');
    console.log('npx wrangler d1 execute college-employment-survey --remote --command "SELECT id, created_at FROM stories WHERE DATE(created_at) = DATE(\'now\') ORDER BY created_at DESC LIMIT 10"');
    console.log('');
    console.log('# 查询今日用户注册数');
    console.log('npx wrangler d1 execute college-employment-survey --remote --command "SELECT COUNT(*) as today_users FROM universal_users WHERE DATE(created_at) = DATE(\'now\')"');
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 今日数据真实性验证工具\n');
  console.log('目标: 验证管理员仪表板显示的今日新增数据是否真实\n');
  console.log('仪表板显示:');
  console.log('- 问卷今日新增: 55条');
  console.log('- 故事今日新增: 5条\n');
  
  await verifyTodayData();
  
  console.log('\n✅ 验证命令已生成，请执行上述命令来查看真实数据！');
}

// 运行验证
main().catch(console.error);
