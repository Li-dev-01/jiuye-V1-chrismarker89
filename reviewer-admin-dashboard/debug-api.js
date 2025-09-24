// API调试脚本 - 在浏览器控制台中运行

async function testReviewerLogin() {
    console.log('🔍 开始测试审核员登录API...');
    
    const apiUrl = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api/uuid/auth/admin';
    const credentials = {
        username: 'reviewerA',
        password: 'admin123',
        userType: 'reviewer',
        deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        }
    };
    
    console.log('📤 发送请求:', {
        url: apiUrl,
        method: 'POST',
        body: credentials
    });
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        console.log('📥 响应状态:', response.status, response.statusText);
        console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('📥 响应数据:', data);
        
        if (response.ok && data.success) {
            console.log('✅ 登录成功!');
            console.log('👤 用户信息:', data.data.user);
            console.log('🔑 会话信息:', data.data.session);
            
            // 测试后续API调用
            await testDashboardAPI(data.data.session.sessionId);
        } else {
            console.error('❌ 登录失败:', data.message || '未知错误');
        }
        
    } catch (error) {
        console.error('💥 请求异常:', error);
        console.error('可能的原因:');
        console.error('- CORS配置问题');
        console.error('- 网络连接问题');
        console.error('- API服务不可用');
    }
}

async function testDashboardAPI(sessionId) {
    console.log('🔍 测试仪表板API...');
    
    const dashboardUrl = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api/reviewer/dashboard';
    
    try {
        const response = await fetch(dashboardUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionId}`,
                'X-Session-ID': sessionId,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 仪表板响应状态:', response.status);
        const data = await response.json();
        console.log('📥 仪表板数据:', data);
        
    } catch (error) {
        console.error('💥 仪表板API异常:', error);
    }
}

async function testPendingReviewsAPI(sessionId) {
    console.log('🔍 测试待审核列表API...');
    
    const pendingUrl = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api/reviewer/pending-reviews';
    
    try {
        const response = await fetch(pendingUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionId}`,
                'X-Session-ID': sessionId,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 待审核响应状态:', response.status);
        const data = await response.json();
        console.log('📥 待审核数据:', data);
        
    } catch (error) {
        console.error('💥 待审核API异常:', error);
    }
}

// 运行测试
console.log('🚀 开始API调试测试...');
testReviewerLogin();

// 导出函数供手动调用
window.testReviewerLogin = testReviewerLogin;
window.testDashboardAPI = testDashboardAPI;
window.testPendingReviewsAPI = testPendingReviewsAPI;
