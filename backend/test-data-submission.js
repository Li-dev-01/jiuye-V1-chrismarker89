/**
 * 测试数据提交功能
 * 验证从测试数据库到主数据库的数据流转
 */

const API_BASE = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

async function testDataSubmission() {
  console.log('🧪 开始测试数据提交功能...');
  
  try {
    // 1. 检查测试数据库中的数据
    console.log('\n📊 检查测试数据库状态...');
    const statsResponse = await fetch(`${API_BASE}/api/admin/data-generator/test-database/stats`);
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ 测试数据库统计:', stats);
    } else {
      console.log('⚠️ 无法获取测试数据库统计');
    }
    
    // 2. 检查主数据库中的故事数量（提交前）
    console.log('\n📈 检查主数据库故事数量（提交前）...');
    const beforeResponse = await fetch(`${API_BASE}/api/stories?limit=1`);
    const beforeData = await beforeResponse.json();
    const beforeCount = beforeData.data?.total || 0;
    console.log(`主数据库当前故事数量: ${beforeCount}`);
    
    // 3. 执行数据提交
    console.log('\n🚀 执行数据提交...');
    const submitResponse = await fetch(`${API_BASE}/api/admin/data-generator/submit-random-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'manual-test',
        testMode: true
      })
    });
    
    if (submitResponse.ok) {
      const submitResult = await submitResponse.json();
      console.log('✅ 数据提交成功:', submitResult);
    } else {
      const error = await submitResponse.text();
      console.log('❌ 数据提交失败:', error);
    }
    
    // 4. 检查主数据库中的故事数量（提交后）
    console.log('\n📈 检查主数据库故事数量（提交后）...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    
    const afterResponse = await fetch(`${API_BASE}/api/stories?limit=1`);
    const afterData = await afterResponse.json();
    const afterCount = afterData.data?.total || 0;
    console.log(`主数据库提交后故事数量: ${afterCount}`);
    
    // 5. 验证数据增长
    const increment = afterCount - beforeCount;
    console.log(`\n📊 数据增长验证: ${increment > 0 ? '✅' : '❌'} 增加了 ${increment} 个故事`);
    
    // 6. 检查最新的故事内容
    console.log('\n📝 检查最新故事内容...');
    const latestResponse = await fetch(`${API_BASE}/api/stories?limit=5&sort=created_at&order=desc`);
    if (latestResponse.ok) {
      const latestData = await latestResponse.json();
      const stories = latestData.data?.stories || [];
      
      console.log('最新的5个故事:');
      stories.forEach((story, index) => {
        console.log(`${index + 1}. ${story.title} (ID: ${story.id}, 创建时间: ${story.created_at})`);
      });
    }
    
    // 7. 检查提交历史
    console.log('\n📋 检查提交历史...');
    const historyResponse = await fetch(`${API_BASE}/api/admin/data-generator/submission-history?limit=3`);
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ 提交历史:', historyData);
    } else {
      console.log('⚠️ 无法获取提交历史');
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 执行测试
testDataSubmission();
