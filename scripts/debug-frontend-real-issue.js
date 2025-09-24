// 在浏览器控制台中运行此脚本来调试真实问题
console.log('🔍 开始调试前端认证问题...');

// 1. 检查当前localStorage状态
console.log('📋 当前localStorage状态:');
const managementKeys = Object.keys(localStorage).filter(k => k.includes('management'));
managementKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value);
});

// 2. 检查managementAuthService是否可用
if (typeof managementAuthService !== 'undefined') {
    console.log('✅ managementAuthService 可用');
    
    const token = managementAuthService.getAuthToken();
    const user = managementAuthService.getCurrentUser();
    const session = managementAuthService.getCurrentSession();
    
    console.log('🔑 认证状态检查:');
    console.log('  Token:', token ? token.substring(0, 30) + '...' : 'null');
    console.log('  User:', user);
    console.log('  Session:', session);
    console.log('  Is Valid:', managementAuthService.isSessionValid());
} else {
    console.log('❌ managementAuthService 不可用');
}

// 3. 设置正确的认证状态
console.log('🔧 设置正确的认证状态...');
const TOKEN = 'mgmt_token_SUPER_ADMIN_1758634751974';

const currentUser = {
    id: 'admin',
    username: 'admin',
    email: 'admin@system.local',
    userType: 'SUPER_ADMIN',
    permissions: ['ALL', 'USER_MANAGEMENT', 'CONTENT_MANAGEMENT', 'SYSTEM_MANAGEMENT'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

const currentSession = {
    sessionId: 'session_' + Date.now(),
    userId: 'admin',
    userType: 'SUPER_ADMIN',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
};

// 设置localStorage
localStorage.setItem('management_auth_token', TOKEN);
localStorage.setItem('management_current_user', JSON.stringify(currentUser));
localStorage.setItem('management_current_session', JSON.stringify(currentSession));

console.log('✅ 认证状态已设置');

// 4. 验证设置后的状态
if (typeof managementAuthService !== 'undefined') {
    console.log('🔍 验证设置后的状态:');
    const newToken = managementAuthService.getAuthToken();
    const newUser = managementAuthService.getCurrentUser();
    const newSession = managementAuthService.getCurrentSession();
    
    console.log('  New Token:', newToken ? newToken.substring(0, 30) + '...' : 'null');
    console.log('  New User:', newUser);
    console.log('  New Session:', newSession);
    console.log('  Is Valid:', managementAuthService.isSessionValid());
}

// 5. 测试API调用
console.log('🧪 测试API调用...');
fetch('/api/admin/dashboard/stats', {
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('📊 API响应状态:', response.status);
    return response.json();
})
.then(data => {
    console.log('📊 API响应数据:', data);
})
.catch(error => {
    console.error('❌ API调用失败:', error);
});

// 6. 检查axios拦截器
if (typeof axios !== 'undefined') {
    console.log('🔧 检查axios拦截器...');
    
    // 创建测试请求
    axios.get('/api/admin/dashboard/stats')
    .then(response => {
        console.log('✅ Axios请求成功:', response.data);
    })
    .catch(error => {
        console.error('❌ Axios请求失败:', error.response?.status, error.response?.data);
        console.log('请求配置:', error.config);
    });
}

console.log('🔄 调试完成，请刷新页面测试...');
