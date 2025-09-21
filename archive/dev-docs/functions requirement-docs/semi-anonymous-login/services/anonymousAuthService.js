/**
 * 半匿名认证服务
 * 
 * 提供A+B组合的身份验证和管理功能
 */

class AnonymousAuthService {
    constructor() {
        this.apiBaseUrl = this.getApiBaseUrl();
        this.validCombinations = this.getValidCombinations();
    }

    /**
     * 获取API基础URL
     */
    getApiBaseUrl() {
        return window.API_BASE_URL || 'https://college-employment-survey-api-isolated.justpm2099.workers.dev/api';
    }

    /**
     * 获取有效的A+B组合（用于开发测试）
     */
    getValidCombinations() {
        return [
            { a: '13812345678', b: '1234', name: '测试用户1' },
            { a: '13987654321', b: '123456', name: '测试用户2' },
            { a: '15612345678', b: '0000', name: '测试用户3' },
            { a: '18812345678', b: '888888', name: '测试用户4' },
            { a: '13611111111', b: '1111', name: '测试用户5' },
            { a: '13722222222', b: '222222', name: '测试用户6' }
        ];
    }

    /**
     * A+B身份验证登录
     * @param {string} identityA - A值（11位数字）
     * @param {string} identityB - B值（4或6位数字）
     * @returns {Promise<Object>} 登录结果
     */
    async login(identityA, identityB) {
        try {
            console.log('A+B身份验证请求:', { identityA: identityA.substring(0, 3) + '****' + identityA.substring(7), identityB: '*'.repeat(identityB.length) });

            // 格式验证
            if (!this.validateABFormat(identityA, identityB)) {
                return {
                    success: false,
                    error: 'A+B组合格式错误'
                };
            }

            // 首先检查本地测试组合
            const testUser = this.validCombinations.find(combo =>
                combo.a === identityA && combo.b === identityB
            );

            if (testUser) {
                console.log(`✅ 本地测试组合验证成功: ${testUser.name}`);

                // 生成UUID
                const uuid = await this.generateUUID(identityA, identityB);
                
                // 生成token
                const token = this.generateToken(identityA, identityB, uuid);

                // 创建用户信息
                const user = {
                    id: uuid,
                    uuid: uuid,
                    username: `anonymous_${identityA.substring(7)}`,
                    displayName: testUser.name,
                    type: 'anonymous',
                    identityHash: this.generateIdentityHash(identityA, identityB),
                    loginTime: new Date().toISOString()
                };

                return {
                    success: true,
                    data: {
                        token,
                        user,
                        uuid,
                        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24小时后过期
                    }
                };
            }

            // 如果不是测试组合，尝试调用远程API
            try {
                const response = await this.callRemoteAPI(identityA, identityB);
                return response;
            } catch (apiError) {
                console.warn('远程API调用失败，使用本地验证:', apiError.message);
                
                // API调用失败时的降级处理
                return {
                    success: false,
                    error: 'A+B组合验证失败，请检查输入是否正确'
                };
            }

        } catch (error) {
            console.error('A+B身份验证失败:', error);
            return {
                success: false,
                error: error.message || '身份验证失败，请稍后再试'
            };
        }
    }

    /**
     * 调用远程API进行验证
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {Promise<Object>} API响应
     */
    async callRemoteAPI(identityA, identityB) {
        const response = await fetch(`${this.apiBaseUrl}/anonymous-auth/login/${identityA}/${identityB}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('远程API验证结果:', data);

        return data;
    }

    /**
     * 验证A+B格式
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {boolean} 是否有效
     */
    validateABFormat(identityA, identityB) {
        const isValidA = /^\d{11}$/.test(identityA);
        const isValidB = /^\d{4}$|^\d{6}$/.test(identityB);
        return isValidA && isValidB;
    }

    /**
     * 生成UUID
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {Promise<string>} UUID
     */
    async generateUUID(identityA, identityB) {
        try {
            // 尝试调用UUID服务
            if (window.UUIDService) {
                const result = await window.UUIDService.generateUUID(identityA, identityB);
                if (result.success) {
                    return result.uuid;
                }
            }
        } catch (error) {
            console.warn('UUID服务调用失败，使用本地生成:', error);
        }

        // 本地UUID生成（基于A+B组合的哈希）
        return this.generateLocalUUID(identityA, identityB);
    }

    /**
     * 本地UUID生成
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {string} UUID
     */
    generateLocalUUID(identityA, identityB) {
        const salt = 'college_employment_survey_2024';
        const combined = `${identityA}:${identityB}:${salt}`;
        
        // 简单哈希算法
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 转换为16进制并格式化为UUID格式
        const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
        const timestamp = Date.now().toString(16).padStart(8, '0');
        const random = Math.random().toString(16).substring(2, 10);
        
        return `${hashStr.substring(0, 8)}-${timestamp.substring(0, 4)}-${timestamp.substring(4, 8)}-${random.substring(0, 4)}-${random.substring(4, 8)}${hashStr.substring(8)}`;
    }

    /**
     * 生成身份哈希
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {string} 身份哈希
     */
    generateIdentityHash(identityA, identityB) {
        if (window.CryptoUtils) {
            return window.CryptoUtils.generateHash(`${identityA}:${identityB}`);
        }
        
        // 简单哈希作为后备
        const combined = `${identityA}:${identityB}`;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * 生成认证token
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @param {string} uuid - UUID
     * @returns {string} token
     */
    generateToken(identityA, identityB, uuid) {
        const payload = {
            uuid: uuid,
            type: 'anonymous',
            identityHash: this.generateIdentityHash(identityA, identityB),
            timestamp: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
        
        // 简单的token生成（实际项目中应该使用JWT）
        const tokenData = btoa(JSON.stringify(payload));
        return `anonymous_${tokenData}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 验证token有效性
     * @param {string} token - 认证token
     * @returns {Promise<Object>} 验证结果
     */
    async validateToken(token) {
        try {
            if (!token || !token.startsWith('anonymous_')) {
                return { valid: false, error: 'Invalid token format' };
            }

            // 解析token
            const parts = token.split('_');
            if (parts.length < 2) {
                return { valid: false, error: 'Invalid token structure' };
            }

            const payloadStr = parts[1];
            const payload = JSON.parse(atob(payloadStr));

            // 检查过期时间
            if (Date.now() > payload.expiresAt) {
                return { valid: false, error: 'Token expired' };
            }

            return { 
                valid: true, 
                payload,
                uuid: payload.uuid,
                type: payload.type
            };

        } catch (error) {
            console.error('Token验证失败:', error);
            return { valid: false, error: error.message };
        }
    }

    /**
     * 获取用户内容
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {Promise<Object>} 用户内容
     */
    async getUserContent(identityA, identityB) {
        try {
            // 验证格式
            if (!this.validateABFormat(identityA, identityB)) {
                return {
                    success: false,
                    error: 'A+B组合格式错误'
                };
            }

            // 生成UUID
            const uuid = await this.generateUUID(identityA, identityB);

            // 模拟用户内容
            const mockContent = {
                stories: [
                    {
                        id: `story_${uuid}_1`,
                        title: '我的就业故事',
                        content: '这是一个关于求职经历的故事...',
                        status: 'approved',
                        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                questionnaires: [
                    {
                        id: `questionnaire_${uuid}_1`,
                        title: '就业现状调研',
                        responses: { q1: '已就业', q2: '满意', q3: '推荐' },
                        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                voices: []
            };

            return {
                success: true,
                data: {
                    uuid,
                    content: mockContent,
                    stats: {
                        totalStories: mockContent.stories.length,
                        totalQuestionnaires: mockContent.questionnaires.length,
                        totalVoices: mockContent.voices.length
                    }
                }
            };

        } catch (error) {
            console.error('获取用户内容失败:', error);
            return {
                success: false,
                error: '获取内容失败，请稍后再试'
            };
        }
    }

    /**
     * 登出
     */
    logout() {
        // 清除本地存储的认证信息
        localStorage.removeItem('identity_a');
        localStorage.removeItem('identity_b');
        localStorage.removeItem('auth_type');
        localStorage.removeItem('auth_time');
        localStorage.removeItem('ab_auth_token');
        localStorage.removeItem('ab_auth_state');
        
        console.log('半匿名用户已登出');
    }

    /**
     * 检查是否已登录
     * @returns {boolean} 是否已登录
     */
    isAuthenticated() {
        const authType = localStorage.getItem('auth_type');
        const authTime = localStorage.getItem('auth_time');
        const token = localStorage.getItem('ab_auth_token');
        
        if (authType !== 'anonymous' || !authTime || !token) {
            return false;
        }
        
        // 检查是否过期（24小时）
        const loginTime = new Date(authTime).getTime();
        const currentTime = Date.now();
        const timeDiff = currentTime - loginTime;
        
        if (timeDiff > 24 * 60 * 60 * 1000) {
            this.logout(); // 自动清除过期登录
            return false;
        }
        
        return true;
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户信息
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }
        
        const token = localStorage.getItem('ab_auth_token');
        if (!token) {
            return null;
        }
        
        try {
            const validation = this.validateToken(token);
            return validation.valid ? validation.payload : null;
        } catch (error) {
            console.error('获取当前用户失败:', error);
            return null;
        }
    }

    /**
     * 获取测试组合列表（用于调试）
     * @returns {Array} 测试组合列表
     */
    getTestCombinations() {
        return this.validCombinations.map(combo => ({
            a: combo.a,
            b: combo.b,
            name: combo.name
        }));
    }
}

// 创建全局实例
const anonymousAuthService = new AnonymousAuthService();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = anonymousAuthService;
} else {
    window.AnonymousAuthService = anonymousAuthService;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugAnonymousAuth = {
        testAllCombinations: async function() {
            console.log('测试所有A+B组合:');
            const combinations = anonymousAuthService.getTestCombinations();
            
            for (const combo of combinations) {
                const result = await anonymousAuthService.login(combo.a, combo.b);
                console.log(`${combo.name} (${combo.a}/${combo.b}): ${result.success ? '✅' : '❌'}`);
            }
        },
        
        getCurrentState: function() {
            return {
                isAuthenticated: anonymousAuthService.isAuthenticated(),
                currentUser: anonymousAuthService.getCurrentUser(),
                validCombinations: anonymousAuthService.getTestCombinations()
            };
        },
        
        clearAuth: function() {
            anonymousAuthService.logout();
            console.log('半匿名认证状态已清除');
        }
    };
}
