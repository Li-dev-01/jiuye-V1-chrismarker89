#!/usr/bin/env node

// 问卷API测试脚本

const API_BASE = 'http://localhost:8787/api';

async function testQuestionnaire() {
  console.log('🧪 开始测试问卷API...\n');

  try {
    // 测试问卷提交
    console.log('1️⃣ 测试问卷提交...');
    const questionnaireData = {
      personalInfo: {
        name: "测试用户",
        gender: "male",
        age: 22,
        phone: "13800138000",
        email: "test@example.com"
      },
      educationInfo: {
        university: "测试大学",
        major: "计算机科学与技术",
        degree: "bachelor",
        graduationYear: 2024,
        gpa: 3.8
      },
      employmentInfo: {
        preferredIndustry: ["互联网/软件", "金融/银行"],
        preferredPosition: "软件工程师",
        expectedSalary: 12000,
        preferredLocation: ["北京", "上海"],
        workExperience: "有1年实习经验，参与过多个项目开发"
      },
      jobSearchInfo: {
        searchChannels: ["校园招聘", "网络招聘平台"],
        interviewCount: 5,
        offerCount: 2,
        searchDuration: 3
      },
      employmentStatus: {
        currentStatus: "employed",
        currentCompany: "某科技公司",
        currentPosition: "前端开发工程师",
        currentSalary: 11000,
        satisfactionLevel: 4
      }
    };

    const submitResponse = await fetch(`${API_BASE}/questionnaire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionnaireData)
    });

    const submitResult = await submitResponse.json();
    console.log('问卷提交结果:', submitResult.success ? '✅ 成功' : '❌ 失败');
    if (submitResult.success) {
      console.log('问卷ID:', submitResult.data.id);
      console.log('状态:', submitResult.data.status);
    } else {
      console.log('错误:', submitResult.message);
    }

    console.log('\n🎉 问卷API测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testQuestionnaire();
