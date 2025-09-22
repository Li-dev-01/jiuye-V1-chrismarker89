/**
 * 认证服务
 * 
 * 提供管理员登录和权限验证功能
 */

class AuthService {
    constructor() {
        this.apiBaseUrl = this.getApiBaseUrl();
        this.testAccounts = this.getTestAccounts();
    }

    /**
     * 获取API基础URL
     */
    getApiBaseUrl() {
        // 可以从环境变量或配置中获取
        return window.API_BASE_URL || 'https://college-employment-survey-api-isolated.chrismarker89.workers.dev/api';
    }

    /**
     * 获取测试账号配置
     */
    getTestAccounts() {
        return [
            {
                username: 'admin1',
                password: 'admin123',
                role: 'admin',
                name: '管理员',
                id: 'admin-001',
                permissions: ['content_review', 'user_management', 'data_analysis']
            },
            {
                username: 'superadmin',
                password: 'admin123',
                role: 'superadmin',
                name: '超级管理员',
                id: 'superadmin-001',
                permissions: ['content_review', 'user_management', 'data_analysis', 'system_config', 'security_management']
            },
            {
                username: 'reviewer1',
                password: 'admin123',
                role: 'reviewer',
                name: '审核员',
                id: 'reviewer-001',
                permissions: ['content_review']
            },
            {
                username: 'reviewerA',
                password: 'admin123',
                role: 'reviewer',
                name: '审核员A',
                id: 'reviewer-A',
                specialties: ['content', 'voice', 'all'],
                permissions: ['content_review']
            },
            {
                username: 'reviewerB',
                password: 'admin123',
                role: 'reviewer',
                name: '审核员B',
                id: 'reviewer-B',
                specialties: ['voice', 'all'],
                permissions: ['content_review']
            },
            {
                username: 'reviewerC',
                password: 'admin123',
                role: 'reviewer',
                name: '审核员C',
                id: 'reviewer-C',
                specialties: ['all'],
                permissions: ['content_review']
            }
        ];
    }

    /**
     * 管理员登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object>} 登录结果
     */
    async adminLogin(username, password) {
        try {
            console.log('管理员登录请求:', { username });

            // 首先检查本地测试账户
            const testUser = this.testAccounts.find(account =>
                account.username === username && account.password === password
            );

            if (testUser) {
                console.log(`✅ 本地测试账户登录成功: ${testUser.name} (${testUser.role})`);

                // 生成简单的token
                const token = `token_${testUser.role}_${Date.now()}`;

                return {
                    success: true,
                    data: {
                        token,
                        user: {
                            id: testUser.id,
                            username: testUser.username,
                            name: testUser.name,
                            role: testUser.role,
                            permissions: testUser.permissions,
                            specialties: testUser.specialties || []
                        }
                    }
                };
            }

            // 如果不是测试账户，尝试调用远程API
            try {
                const response = await this.callRemoteAPI(username, password);
                return response;
            } catch (apiError) {
                console.warn('远程API调用失败，使用本地验证:', apiError.message);
                
                // API调用失败时的降级处理
                return {
                    success: false,
                    error: '用户名或密码错误'
                };
            }

        } catch (error) {
            console.error('管理员登录失败:', error);
            return {
                success: false,
                error: error.message || '登录失败，请稍后再试'
            };
        }
    }

    /**
     * 调用远程API进行登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object>} API响应
     */
    async callRemoteAPI(username, password) {
        const response = await fetch(`${this.apiBaseUrl}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('远程API登录结果:', data);

        return data;
    }

    /**
     * 验证token有效性
     * @param {string} token - 认证token
     * @returns {Promise<Object>} 验证结果
     */
    async validateToken(token) {
        try {
            // 简单的token格式验证
            if (!token || !token.startsWith('token_')) {
                return { valid: false, error: 'Invalid token format' };
            }

            // 从localStorage获取用户信息进行验证
            const userJson = localStorage.getItem('adminUser');
            if (!userJson) {
                return { valid: false, error: 'User not found' };
            }

            const user = JSON.parse(userJson);
            
            // 检查登录时间是否过期（24小时）
            const loginTime = user.loginTime ? new Date(user.loginTime).getTime() : 0;
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - loginTime;

            if (loginTime && timeDiff > 24 * 60 * 60 * 1000) {
                return { valid: false, error: 'Token expired' };
            }

            return { valid: true, user };

        } catch (error) {
            console.error('Token验证失败:', error);
            return { valid: false, error: error.message };
        }
    }

    /**
     * 检查用户权限
     * @param {string} permission - 权限名称
     * @returns {boolean} 是否有权限
     */
    hasPermission(permission) {
        try {
            const userJson = localStorage.getItem('adminUser');
            if (!userJson) return false;

            const user = JSON.parse(userJson);
            return user.permissions && user.permissions.includes(permission);
        } catch (error) {
            console.error('权限检查失败:', error);
            return false;
        }
    }

    /**
     * 检查用户角色
     * @param {string} role - 角色名称
     * @returns {boolean} 是否匹配角色
     */
    hasRole(role) {
        try {
            const userJson = localStorage.getItem('adminUser');
            if (!userJson) return false;

            const user = JSON.parse(userJson);
            return user.role === role;
        } catch (error) {
            console.error('角色检查失败:', error);
            return false;
        }
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户信息
     */
    getCurrentUser() {
        try {
            const userJson = localStorage.getItem('adminUser');
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }

    /**
     * 获取当前token
     * @returns {string|null} 认证token
     */
    getCurrentToken() {
        return localStorage.getItem('adminToken');
    }

    /**
     * 登出
     */
    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('redirectToRoleDashboard');
        console.log('用户已登出');
    }

    /**
     * 检查是否已登录
     * @returns {boolean} 是否已登录
     */
    isAuthenticated() {
        const token = this.getCurrentToken();
        const user = this.getCurrentUser();
        
        if (!token || !user) return false;
        
        // 检查登录是否过期
        const loginTime = user.loginTime ? new Date(user.loginTime).getTime() : 0;
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - loginTime;
        
        if (loginTime && timeDiff > 24 * 60 * 60 * 1000) {
            this.logout(); // 自动清除过期登录
            return false;
        }
        
        return true;
    }

    /**
     * 获取所有测试账号（用于调试）
     * @returns {Array} 测试账号列表
     */
    getTestAccountsList() {
        return this.testAccounts.map(account => ({
            username: account.username,
            role: account.role,
            name: account.name
        }));
    }
}

// 创建全局实例
const authService = new AuthService();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authService;
} else {
    window.AuthService = authService;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugAuth = {
        testAllAccounts: async function() {
            console.log('测试所有预置账号:');
            const accounts = authService.getTestAccountsList();
            
            for (const account of accounts) {
                const result = await authService.adminLogin(account.username, 'admin123');
                console.log(`${account.name} (${account.username}): ${result.success ? '✅' : '❌'}`);
            }
        },
        
        getCurrentState: function() {
            return {
                isAuthenticated: authService.isAuthenticated(),
                currentUser: authService.getCurrentUser(),
                currentToken: authService.getCurrentToken()
            };
        },
        
        clearAuth: function() {
            authService.logout();
            console.log('认证状态已清除');
        }
    };
}
