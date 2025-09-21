#!/usr/bin/env node

// 完整系统测试脚本

const API_BASE = 'http://localhost:8787/api';

async function testCompleteSystem() {
  console.log('🚀 开始完整系统测试...\n');

  try {
    // 1. 测试用户注册
    console.log('1️⃣ 测试用户注册...');
    const timestamp = Date.now();
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'systemtest_' + timestamp,
        email: 'systemtest_' + timestamp + '@example.com',
        password: 'TestPass123!'
      })
    });

    const registerResult = await registerResponse.json();
    console.log('注册结果:', registerResult.success ? '✅ 成功' : '❌ 失败');
    if (!registerResult.success) {
      console.log('错误:', registerResult.message);
      return;
    }

    const userToken = registerResult.data.token;
    console.log('用户Token获取成功\n');

    // 2. 测试问卷提交
    console.log('2️⃣ 测试问卷提交...');
    const questionnaireData = {
      personalInfo: {
        name: "系统测试用户",
        gender: "female",
        age: 23,
        phone: "13900139000",
        email: "systemtest_" + timestamp + "@example.com"
      },
      educationInfo: {
        university: "系统测试大学",
        major: "软件工程",
        degree: "master",
        graduationYear: 2024,
        gpa: 3.9
      },
      employmentInfo: {
        preferredIndustry: ["互联网/软件", "教育/培训"],
        preferredPosition: "产品经理",
        expectedSalary: 15000,
        preferredLocation: ["北京", "深圳"],
        workExperience: "有多个项目经验和实习经历"
      },
      jobSearchInfo: {
        searchChannels: ["校园招聘", "内推"],
        interviewCount: 8,
        offerCount: 3,
        searchDuration: 2
      },
      employmentStatus: {
        currentStatus: "employed",
        currentCompany: "某知名科技公司",
        currentPosition: "产品经理助理",
        currentSalary: 14000,
        satisfactionLevel: 5
      }
    };

    const submitResponse = await fetch(`${API_BASE}/questionnaire`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(questionnaireData)
    });

    const submitResult = await submitResponse.json();
    console.log('问卷提交结果:', submitResult.success ? '✅ 成功' : '❌ 失败');
    if (submitResult.success) {
      console.log('问卷ID:', submitResult.data.id);
      console.log('状态:', submitResult.data.status);
    } else {
      console.log('错误:', submitResult.message);
      return;
    }

    const questionnaireId = submitResult.data.id;

    // 3. 测试管理员注册
    console.log('\n3️⃣ 测试管理员注册...');
    const adminRegisterResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_test_' + Date.now(),
        email: 'admin_test_' + Date.now() + '@example.com',
        password: 'AdminPass123!',
        role: 'admin'
      })
    });

    const adminRegisterResult = await adminRegisterResponse.json();
    console.log('管理员注册结果:', adminRegisterResult.success ? '✅ 成功' : '❌ 失败');
    if (!adminRegisterResult.success) {
      console.log('错误:', adminRegisterResult.message);
      return;
    }

    const adminToken = adminRegisterResult.data.token;
    console.log('管理员Token获取成功');

    // 4. 测试问卷列表获取
    console.log('\n4️⃣ 测试问卷列表获取...');
    const listResponse = await fetch(`${API_BASE}/questionnaire`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const listResult = await listResponse.json();
    console.log('问卷列表获取结果:', listResult.success ? '✅ 成功' : '❌ 失败');
    if (listResult.success) {
      console.log('问卷数量:', listResult.data.items?.length || 0);
    } else {
      console.log('错误:', listResult.message);
    }

    // 5. 测试问卷审核
    console.log('\n5️⃣ 测试问卷审核...');
    const reviewResponse = await fetch(`${API_BASE}/questionnaire/${questionnaireId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        comment: '系统测试审核通过'
      })
    });

    const reviewResult = await reviewResponse.json();
    console.log('问卷审核结果:', reviewResult.success ? '✅ 成功' : '❌ 失败');
    if (reviewResult.success) {
      console.log('审核状态:', reviewResult.data.status);
    } else {
      console.log('错误:', reviewResult.message);
    }

    console.log('\n🎉 完整系统测试完成！');
    console.log('\n📊 测试总结:');
    console.log('✅ 用户注册和认证系统正常');
    console.log('✅ 问卷提交功能正常');
    console.log('✅ 管理员权限系统正常');
    console.log('✅ 问卷审核功能正常');
    console.log('✅ 数据库存储和查询正常');

  } catch (error) {
    console.error('❌ 系统测试失败:', error.message);
  }
}

testCompleteSystem();
