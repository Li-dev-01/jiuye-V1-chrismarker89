/**
 * 测试用户画像功能
 * 直接调用API并查看返回结果
 */

const testData = {
  "questionnaireId": "questionnaire-v2-2024",
  "sectionResponses": [
    {
      "sectionId": "second-questionnaire-responses",
      "questionResponses": [
        {"questionId": "gender-v2", "value": "male"},
        {"questionId": "age-range-v2", "value": "under-20"},
        {"questionId": "education-level-v2", "value": "high-school"},
        {"questionId": "marital-status-v2", "value": "single"},
        {"questionId": "has-children-v2", "value": "no"},
        {"questionId": "fertility-intent-v2", "value": "prefer-not"},
        {"questionId": "current-city-tier-v2", "value": "rural"},
        {"questionId": "hukou-type-v2", "value": "rural"},
        {"questionId": "years-experience-v2", "value": "none"},
        {"questionId": "current-status-question-v2", "value": "unemployed"},
        {"questionId": "debt-situation-v2", "value": ["alipay-huabei", "jd-baitiao", "wechat-pay-later", "consumer-loan"]},
        {"questionId": "monthly-debt-burden-v2", "value": "1000-2000"},
        {"questionId": "economic-pressure-level-v2", "value": "severe-pressure"},
        {"questionId": "monthly-living-cost-v2", "value": "below-1000"},
        {"questionId": "income-sources-v2", "value": ["no-income"]},
        {"questionId": "parental-support-amount-v2", "value": "irregular"},
        {"questionId": "income-expense-balance-v2", "value": "no-income"},
        {"questionId": "experienced-discrimination-types-v2", "value": ["age", "region", "appearance"]},
        {"questionId": "discrimination-severity-v2", "value": "very-severe"},
        {"questionId": "discrimination-channels-v2", "value": ["resume-screening", "background-check"]},
        {"questionId": "support-needed-types-v2", "value": ["anti-discrimination", "networking"]},
        {"questionId": "employment-confidence-6months-v2", "value": "worried"},
        {"questionId": "employment-confidence-1year-v2", "value": "worried"},
        {"questionId": "job-seeking-duration-v2", "value": "1-3months"},
        {"questionId": "applications-per-week-v2", "value": "less-5"},
        {"questionId": "interview-conversion-v2", "value": "below-5"},
        {"questionId": "channels-used-v2", "value": ["lagou", "other"]},
        {"questionId": "offer-received-v2", "value": "none"}
      ]
    }
  ],
  "metadata": {
    "participantGroup": "freshGraduate",
    "startedAt": new Date().toISOString(),
    "responseTimeSeconds": 120,
    "submittedAt": new Date().toISOString(),
    "userAgent": "Test Script",
    "deviceInfo": {
      "platform": "Test",
      "language": "zh-CN"
    }
  }
};

async function testUserProfile() {
  console.log('🧪 开始测试用户画像功能...\n');
  
  try {
    const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/universal-questionnaire/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📊 API响应状态:', response.status);
    console.log('📊 API响应数据:\n', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.userProfile) {
      const profile = result.data.userProfile;
      
      console.log('\n✅ 用户画像数据:');
      console.log('  标签数量:', profile.tags?.length || 0);
      if (profile.tags && profile.tags.length > 0) {
        console.log('  标签列表:');
        profile.tags.forEach(tag => {
          console.log(`    - ${tag.tagName} (${tag.category})`);
        });
      }
      
      console.log('\n  情绪分析:');
      console.log('    类型:', profile.emotion?.type);
      console.log('    置信度:', profile.emotion?.confidence);
      console.log('    需要鼓励:', profile.emotion?.needsEncouragement);
      console.log('    正面分数:', profile.emotion?.scores?.positive);
      console.log('    负面分数:', profile.emotion?.scores?.negative);
      if (profile.emotion?.reasons) {
        console.log('    原因:', profile.emotion.reasons.join(', '));
      }
      
      if (profile.motivationalQuote) {
        console.log('\n  励志名言:');
        console.log('    内容:', profile.motivationalQuote.text);
        console.log('    作者:', profile.motivationalQuote.author || '佚名');
        console.log('    分类:', profile.motivationalQuote.category);
      } else {
        console.log('\n  ❌ 没有励志名言');
      }
    } else {
      console.log('\n❌ 没有用户画像数据！');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testUserProfile();

