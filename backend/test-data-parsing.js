// 测试数据解析脚本
const sampleData = {
  "sectionResponses": [{
    "sectionId": "second-questionnaire-responses",
    "questionResponses": [
      { "questionId": "age-range-v2", "value": "23-25" },
      { "questionId": "education-level-v2", "value": "bachelor" },
      { "questionId": "current-status-question-v2", "value": "unemployed" },
      { "questionId": "debt-situation-v2", "value": ["jd-baitiao", "credit-card", "business-loan"] },
      { "questionId": "monthly-debt-burden-v2", "value": "3000-5000" },
      { "questionId": "economic-pressure-level-v2", "value": "moderate-pressure" },
      { "questionId": "employment-confidence-6months-v2", "value": "neutral" },
      { "questionId": "employment-confidence-1year-v2", "value": "neutral" }
    ]
  }],
  "metadata": {
    "participantGroup": "freshGraduate",
    "startedAt": "2025-10-04T09:31:15.898Z",
    "responseTimeSeconds": 48,
    "submittedAt": "2025-10-04T09:32:04.245Z"
  }
};

console.log('测试数据解析...\n');

// 提取所有问题响应
const answers = {};
for (const section of sampleData.sectionResponses) {
  if (!section.questionResponses) continue;
  for (const qr of section.questionResponses) {
    answers[qr.questionId] = qr.value;
  }
}

console.log('提取的答案:');
console.log(JSON.stringify(answers, null, 2));

console.log('\n检查字段:');
console.log('gender-v2:', answers['gender-v2']);
console.log('age-range-v2:', answers['age-range-v2']);
console.log('education-level-v2:', answers['education-level-v2']);
console.log('current-status-question-v2:', answers['current-status-question-v2']);

console.log('\n结论: 数据中缺少 gender-v2 字段！');
console.log('这说明1000条测试数据可能不完整，只包含部分问题的答案。');

