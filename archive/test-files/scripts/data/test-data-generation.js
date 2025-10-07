/**
 * 数据流转测试脚本
 * 测试问卷和心声数据的生成与存储
 */

const API_BASE = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 生成测试问卷数据
async function generateTestQuestionnaire() {
  const testData = {
    sessionId: `test-session-${Date.now()}`,
    questionnaireId: 'employment-survey-2024',
    answers: {
      personalInfo: {
        age: '23',
        gender: 'male',
        education: 'bachelor'
      },
      employmentStatus: {
        isEmployed: true,
        jobType: 'full-time',
        industry: 'technology'
      },
      jobSatisfaction: {
        rating: 4,
        comments: '工作环境不错，同事很友好'
      }
    },
    isCompleted: true,
    completionPercentage: 100,
    qualityScore: 0.9
  };

  try {
    const response = await fetch(`${API_BASE}/api/questionnaire/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('问卷提交结果:', result);
    return result;
  } catch (error) {
    console.error('问卷提交失败:', error);
    return null;
  }
}

// 生成测试心声数据
async function generateTestHeartVoice() {
  const testVoices = [
    {
      content: '感谢这个平台让我能够分享自己的就业经历，希望能帮助到其他同学。',
      category: 'employment-feedback',
      emotionScore: 0.8,
      emotionCategory: 'positive',
      authorName: '匿名用户',
      isAnonymous: true
    },
    {
      content: '求职过程确实不容易，但坚持下来就会有收获。建议大家多准备，多投简历。',
      category: 'employment-feedback', 
      emotionScore: 0.6,
      emotionCategory: 'neutral',
      authorName: '小明',
      isAnonymous: false
    },
    {
      content: '希望学校能提供更多的就业指导和实习机会，这对我们找工作很有帮助。',
      category: 'employment-feedback',
      emotionScore: 0.7,
      emotionCategory: 'positive',
      authorName: '匿名用户',
      isAnonymous: true
    }
  ];

  const results = [];
  
  for (const voice of testVoices) {
    try {
      const response = await fetch(`${API_BASE}/api/heart-voices/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(voice)
      });

      const result = await response.json();
      console.log('心声提交结果:', result);
      results.push(result);
    } catch (error) {
      console.error('心声提交失败:', error);
    }
  }

  return results;
}

// 检查统计数据
async function checkStats() {
  try {
    const response = await fetch(`${API_BASE}/api/analytics/stats`);
    const result = await response.json();
    console.log('统计数据:', result);
    return result;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return null;
  }
}

// 主测试函数
async function runDataFlowTest() {
  console.log('🧪 开始数据流转测试...\n');

  // 1. 检查初始状态
  console.log('1. 检查初始统计数据:');
  const initialStats = await checkStats();
  console.log('\n');

  // 2. 生成测试问卷数据
  console.log('2. 生成测试问卷数据:');
  const questionnaireResults = [];
  for (let i = 0; i < 3; i++) {
    const result = await generateTestQuestionnaire();
    if (result) questionnaireResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
  }
  console.log('\n');

  // 3. 生成测试心声数据
  console.log('3. 生成测试心声数据:');
  const heartVoiceResults = await generateTestHeartVoice();
  console.log('\n');

  // 4. 检查最终状态
  console.log('4. 检查最终统计数据:');
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒让数据处理完成
  const finalStats = await checkStats();
  console.log('\n');

  // 5. 对比结果
  console.log('5. 测试结果对比:');
  if (initialStats && finalStats) {
    console.log(`问卷数量: ${initialStats.data.totalSubmissions} → ${finalStats.data.totalSubmissions}`);
    console.log(`心声数量: ${initialStats.data.heartVoices} → ${finalStats.data.heartVoices}`);
    console.log(`用户数量: ${initialStats.data.users} → ${finalStats.data.users}`);
    
    const questionnaireIncrease = finalStats.data.totalSubmissions - initialStats.data.totalSubmissions;
    const heartVoiceIncrease = finalStats.data.heartVoices - initialStats.data.heartVoices;
    
    console.log('\n✅ 测试结果:');
    console.log(`- 问卷数据增加: ${questionnaireIncrease} 条`);
    console.log(`- 心声数据增加: ${heartVoiceIncrease} 条`);
    console.log(`- 数据流转: ${questionnaireIncrease > 0 && heartVoiceIncrease > 0 ? '成功' : '部分成功'}`);
  }

  console.log('\n🎉 数据流转测试完成！');
}

// 如果在 Node.js 环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDataFlowTest, generateTestQuestionnaire, generateTestHeartVoice, checkStats };
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  window.dataFlowTest = { runDataFlowTest, generateTestQuestionnaire, generateTestHeartVoice, checkStats };
  console.log('数据流转测试脚本已加载，使用 dataFlowTest.runDataFlowTest() 开始测试');
}
