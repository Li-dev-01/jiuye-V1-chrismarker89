/**
 * 模拟数据服务
 * 
 * 提供登录功能所需的模拟数据和API响应
 */

class MockDataService {
    constructor() {
        this.users = this.initializeUsers();
        this.sessions = new Map(); // 存储活跃会话
        this.loginAttempts = new Map(); // 存储登录尝试记录
    }

    /**
     * 初始化用户数据
     */
    initializeUsers() {
        return [
            {
                id: 'admin-001',
                username: 'admin1',
                password: 'admin123', // 在实际项目中应该是加密的
                name: '管理员',
                email: 'admin@example.com',
                role: 'admin',
                permissions: [
                    'content_review',
                    'user_management',
                    'data_analysis'
                ],
                avatar: null,
                status: 'active',
                createdAt: '2024-01-01T00:00:00Z',
                lastLoginAt: null,
                loginCount: 0
            },
            {
                id: 'superadmin-001',
                username: 'superadmin',
                password: 'admin123',
                name: '超级管理员',
                email: 'superadmin@example.com',
                role: 'superadmin',
                permissions: [
                    'content_review',
                    'user_management',
                    'data_analysis',
                    'system_config',
                    'security_management'
                ],
                avatar: null,
                status: 'active',
                createdAt: '2024-01-01T00:00:00Z',
                lastLoginAt: null,
                loginCount: 0
            },
            {
                id: 'reviewer-001',
                username: 'reviewer1',
                password: 'admin123',
                name: '审核员',
                email: 'reviewer1@example.com',
                role: 'reviewer',
                permissions: ['content_review'],
                avatar: null,
                status: 'active',
                createdAt: '2024-01-01T00:00:00Z',
                lastLoginAt: null,
                loginCount: 0
            },
            {
                id: 'reviewer-A',
                username: 'reviewerA',
                password: 'admin123',
                name: '审核员A',
                email: 'reviewerA@example.com',
                role: 'reviewer',
                permissions: ['content_review'],
                specialties: ['content', 'voice', 'all'],
                avatar: null,
                status: 'active',
                createdAt: '2024-01-01T00:00:00Z',
                lastLoginAt: null,
                loginCount: 0
            },
            {
                id: 'reviewer-B',
                username: 'reviewerB',
                password: 'admin123',
                name: '审核员B',
                email: 'reviewerB@example.com',
                role: 'reviewer',
                permissions: ['content_review'],
                specialties: ['voice', 'all'],
                avatar: null,
                status: 'active',
                createdAt: '2024-01-01T00:00:00Z',
                lastLoginAt: null,
                loginCount: 0
            },
            {
                id: 'reviewer-C',
                username: 'reviewerC',
                password: 'admin123',
                name: '审核员C',
                email: 'reviewerC@example.com',
                role: 'reviewer',
                permissions: ['content_review'],
                specialties: ['all'],
                avatar: null,
                status: 'active',
                createdAt: '2024-01-01T00:00:00Z',
                lastLoginAt: null,
                loginCount: 0
            }
        ];
    }

    /**
     * 模拟用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object>} 登录结果
     */
    async login(username, password) {
        // 模拟网络延迟
        await this.delay(300 + Math.random() * 700);

        // 检查登录尝试次数
        const attemptKey = `${username}_${this.getClientIP()}`;
        const attempts = this.loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
        
        // 如果尝试次数过多，返回锁定错误
        if (attempts.count >= 5 && Date.now() - attempts.lastAttempt < 15 * 60 * 1000) {
            return {
                success: false,
                error: '登录尝试次数过多，请15分钟后再试',
                code: 'TOO_MANY_ATTEMPTS'
            };
        }

        // 查找用户
        const user = this.users.find(u => u.username === username);
        
        if (!user) {
            this.recordLoginAttempt(attemptKey, false);
            return {
                success: false,
                error: '用户名不存在',
                code: 'USER_NOT_FOUND'
            };
        }

        // 检查用户状态
        if (user.status !== 'active') {
            return {
                success: false,
                error: '账号已被禁用，请联系管理员',
                code: 'ACCOUNT_DISABLED'
            };
        }

        // 验证密码
        if (user.password !== password) {
            this.recordLoginAttempt(attemptKey, false);
            return {
                success: false,
                error: '密码错误',
                code: 'INVALID_PASSWORD'
            };
        }

        // 登录成功
        this.recordLoginAttempt(attemptKey, true);
        
        // 更新用户登录信息
        user.lastLoginAt = new Date().toISOString();
        user.loginCount += 1;

        // 生成会话token
        const token = this.generateToken(user);
        const sessionId = this.generateSessionId();
        
        // 存储会话信息
        this.sessions.set(sessionId, {
            userId: user.id,
            token,
            createdAt: Date.now(),
            lastAccessAt: Date.now(),
            userAgent: this.getUserAgent(),
            ip: this.getClientIP()
        });

        // 返回登录结果（不包含敏感信息）
        const userInfo = {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            specialties: user.specialties || [],
            avatar: user.avatar,
            lastLoginAt: user.lastLoginAt,
            loginCount: user.loginCount
        };

        return {
            success: true,
            data: {
                token,
                sessionId,
                user: userInfo,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24小时后过期
            }
        };
    }

    /**
     * 验证token
     * @param {string} token - 认证token
     * @returns {Promise<Object>} 验证结果
     */
    async validateToken(token) {
        await this.delay(100 + Math.random() * 200);

        // 查找对应的会话
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.token === token) {
                // 检查会话是否过期
                if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
                    this.sessions.delete(sessionId);
                    return {
                        valid: false,
                        error: 'Token已过期',
                        code: 'TOKEN_EXPIRED'
                    };
                }

                // 更新最后访问时间
                session.lastAccessAt = Date.now();

                // 查找用户信息
                const user = this.users.find(u => u.id === session.userId);
                if (!user) {
                    this.sessions.delete(sessionId);
                    return {
                        valid: false,
                        error: '用户不存在',
                        code: 'USER_NOT_FOUND'
                    };
                }

                return {
                    valid: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions,
                        specialties: user.specialties || [],
                        avatar: user.avatar
                    },
                    session: {
                        id: sessionId,
                        createdAt: session.createdAt,
                        lastAccessAt: session.lastAccessAt
                    }
                };
            }
        }

        return {
            valid: false,
            error: 'Token无效',
            code: 'INVALID_TOKEN'
        };
    }

    /**
     * 登出
     * @param {string} token - 认证token
     * @returns {Promise<Object>} 登出结果
     */
    async logout(token) {
        await this.delay(100);

        // 查找并删除对应的会话
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.token === token) {
                this.sessions.delete(sessionId);
                return {
                    success: true,
                    message: '登出成功'
                };
            }
        }

        return {
            success: false,
            error: 'Token无效',
            code: 'INVALID_TOKEN'
        };
    }

    /**
     * 获取用户信息
     * @param {string} userId - 用户ID
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(userId) {
        await this.delay(100);

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return {
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            };
        }

        return {
            success: true,
            data: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                specialties: user.specialties || [],
                avatar: user.avatar,
                status: user.status,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
                loginCount: user.loginCount
            }
        };
    }

    /**
     * 记录登录尝试
     * @param {string} key - 尝试标识
     * @param {boolean} success - 是否成功
     */
    recordLoginAttempt(key, success) {
        const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
        
        if (success) {
            // 登录成功，清除尝试记录
            this.loginAttempts.delete(key);
        } else {
            // 登录失败，增加尝试次数
            attempts.count += 1;
            attempts.lastAttempt = Date.now();
            this.loginAttempts.set(key, attempts);
        }
    }

    /**
     * 生成token
     * @param {Object} user - 用户信息
     * @returns {string} token
     */
    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            timestamp: Date.now()
        };
        
        // 简单的token生成（实际项目中应该使用JWT）
        const tokenData = btoa(JSON.stringify(payload));
        return `token_${user.role}_${tokenData}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成会话ID
     * @returns {string} 会话ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取客户端IP（模拟）
     * @returns {string} IP地址
     */
    getClientIP() {
        return '127.0.0.1'; // 在实际项目中应该获取真实IP
    }

    /**
     * 获取用户代理（模拟）
     * @returns {string} User Agent
     */
    getUserAgent() {
        return navigator.userAgent || 'Unknown';
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取所有用户列表（调试用）
     * @returns {Array} 用户列表
     */
    getAllUsers() {
        return this.users.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            status: user.status
        }));
    }

    /**
     * 获取活跃会话列表（调试用）
     * @returns {Array} 会话列表
     */
    getActiveSessions() {
        return Array.from(this.sessions.entries()).map(([sessionId, session]) => ({
            sessionId,
            userId: session.userId,
            createdAt: new Date(session.createdAt).toISOString(),
            lastAccessAt: new Date(session.lastAccessAt).toISOString(),
            ip: session.ip
        }));
    }

    /**
     * 清理过期会话
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        const expiredSessions = [];
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.createdAt > 24 * 60 * 60 * 1000) {
                expiredSessions.push(sessionId);
            }
        }
        
        expiredSessions.forEach(sessionId => {
            this.sessions.delete(sessionId);
        });
        
        console.log(`清理了 ${expiredSessions.length} 个过期会话`);
    }
}

// 创建全局实例
const mockDataService = new MockDataService();

// 定期清理过期会话
setInterval(() => {
    mockDataService.cleanupExpiredSessions();
}, 60 * 60 * 1000); // 每小时清理一次

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mockDataService;
} else {
    window.MockDataService = mockDataService;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugMockData = {
        getAllUsers: () => mockDataService.getAllUsers(),
        getActiveSessions: () => mockDataService.getActiveSessions(),
        cleanupSessions: () => mockDataService.cleanupExpiredSessions(),
        testLogin: async (username, password) => {
            return await mockDataService.login(username, password);
        }
    };
}
