// 自动设置认证状态并测试管理员页面
(function() {
    console.log('🔧 开始自动设置管理员认证状态...');
    
    // 设置最新的token
    const TOKEN = 'mgmt_token_SUPER_ADMIN_1758634751974';
    
    // 设置完整的认证信息
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

    console.log('✅ 认证状态设置完成:', {
        token: TOKEN.substring(0, 30) + '...',
        userType: currentUser.userType,
        permissions: currentUser.permissions,
        sessionExpiry: currentSession.expiresAt
    });

    // 验证认证状态
    const authToken = localStorage.getItem('management_auth_token');
    const storedUser = localStorage.getItem('management_current_user');
    const storedSession = localStorage.getItem('management_current_session');

    let parsedUser = null;
    let parsedSession = null;

    try {
        parsedUser = storedUser ? JSON.parse(storedUser) : null;
        parsedSession = storedSession ? JSON.parse(storedSession) : null;
    } catch (e) {
        console.error('❌ 认证数据解析失败:', e);
        return;
    }

    const isSessionValid = parsedSession && new Date(parsedSession.expiresAt) > new Date();
    const isAuthenticated = !!(authToken && parsedUser && parsedSession && isSessionValid);

    console.log('🔍 认证状态验证:', {
        hasToken: !!authToken,
        hasUser: !!parsedUser,
        hasSession: !!parsedSession,
        isSessionValid: isSessionValid,
        isAuthenticated: isAuthenticated
    });

    if (isAuthenticated) {
        console.log('🎉 认证状态完全正常！');
        
        // 如果在管理员页面，尝试刷新页面
        if (window.location.pathname.includes('/admin')) {
            console.log('🔄 检测到管理员页面，准备刷新...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            console.log('🌐 准备跳转到管理员页面...');
            setTimeout(() => {
                window.location.href = '/admin';
            }, 1000);
        }
    } else {
        console.error('❌ 认证状态设置失败');
    }
})();
