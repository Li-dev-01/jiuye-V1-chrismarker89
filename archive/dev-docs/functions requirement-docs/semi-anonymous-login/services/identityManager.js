/**
 * 统一身份管理服务
 * 确保单一身份登录，防止多重身份冲突
 */

// 身份类型定义
const IDENTITY_TYPES = {
    ANONYMOUS: 'anonymous',
    ADMIN: 'admin',
    REVIEWER: 'reviewer',
    SUPERADMIN: 'superadmin'
};

// 存储键名
const STORAGE_KEYS = {
    CURRENT_IDENTITY: 'current_identity',
    IDENTITY_TOKENS: 'identity_tokens',
    IDENTITY_HISTORY: 'identity_history'
};

class IdentityManager {
    constructor() {
        this.currentIdentity = null;
        this.identityChangeListeners = [];
        this.init();
    }

    /**
     * 初始化身份管理器
     */
    init() {
        this.loadCurrentIdentity();
        this.setupStorageListener();
        console.log('IdentityManager initialized');
    }

    /**
     * 获取当前身份
     * @returns {Object|null} 当前身份信息
     */
    getCurrentIdentity() {
        if (this.currentIdentity) {
            // 检查是否过期
            if (this.isIdentityExpired(this.currentIdentity)) {
                this.clearCurrentIdentity();
                return null;
            }
        }
        return this.currentIdentity;
    }

    /**
     * 设置当前身份
     * @param {Object} identity - 身份信息
     */
    setCurrentIdentity(identity) {
        try {
            // 先清除所有现有身份
            this.clearAllIdentities();
            
            // 设置新身份
            this.currentIdentity = {
                ...identity,
                loginTime: Math.floor(Date.now() / 1000)
            };
            
            // 保存到localStorage
            localStorage.setItem(STORAGE_KEYS.CURRENT_IDENTITY, JSON.stringify(this.currentIdentity));
            
            // 保存到对应的身份存储中（兼容现有系统）
            this.saveToLegacyStorage(identity);
            
            // 记录身份历史
            this.recordIdentityHistory(identity);
            
            // 通知身份变化
            this.notifyIdentityChange(identity);
            
            console.log(`身份已设置: ${identity.type}`);
        } catch (error) {
            console.error('设置身份失败:', error);
        }
    }

    /**
     * 清除当前身份
     */
    clearCurrentIdentity() {
        if (this.currentIdentity) {
            const oldIdentity = this.currentIdentity;
            this.currentIdentity = null;
            
            // 清除localStorage
            localStorage.removeItem(STORAGE_KEYS.CURRENT_IDENTITY);
            
            // 清除对应的身份存储
            this.clearLegacyStorage(oldIdentity.type);
            
            // 通知身份变化
            this.notifyIdentityChange(null);
            
            console.log(`身份已清除: ${oldIdentity.type}`);
        }
    }

    /**
     * 清除所有身份
     */
    clearAllIdentities() {
        // 清除当前身份
        this.currentIdentity = null;
        localStorage.removeItem(STORAGE_KEYS.CURRENT_IDENTITY);
        
        // 清除所有类型的身份存储
        Object.values(IDENTITY_TYPES).forEach(type => {
            this.clearLegacyStorage(type);
        });
        
        console.log('所有身份已清除');
    }

    /**
     * 强制登出当前身份
     */
    forceLogoutCurrent() {
        const current = this.getCurrentIdentity();
        if (current) {
            console.log(`强制登出当前身份: ${current.type}`);
            this.clearCurrentIdentity();
        }
    }

    /**
     * 检查身份切换确认
     * @param {string} newIdentityType - 新身份类型
     * @returns {Object} 确认信息
     */
    checkIdentitySwitchConfirm(newIdentityType) {
        const current = this.getCurrentIdentity();
        
        if (!current) {
            return { needConfirm: false };
        }
        
        if (current.type === newIdentityType) {
            return { needConfirm: false };
        }
        
        const typeNames = {
            [IDENTITY_TYPES.ANONYMOUS]: '半匿名身份',
            [IDENTITY_TYPES.ADMIN]: '管理员身份',
            [IDENTITY_TYPES.REVIEWER]: '审核员身份',
            [IDENTITY_TYPES.SUPERADMIN]: '超级管理员身份'
        };
        
        return {
            needConfirm: true,
            message: `检测到您已以${typeNames[current.type]}登录，切换到${typeNames[newIdentityType]}将清除当前登录状态。是否继续？`
        };
    }

    /**
     * 验证身份权限
     * @param {string|Array} requiredType - 需要的身份类型
     * @returns {boolean} 是否有权限
     */
    hasPermission(requiredType) {
        const current = this.getCurrentIdentity();
        if (!current) return false;
        
        const required = Array.isArray(requiredType) ? requiredType : [requiredType];
        return required.includes(current.type);
    }

    /**
     * 获取当前身份的认证头
     * @returns {Object} 认证头
     */
    getCurrentAuthHeaders() {
        const current = this.getCurrentIdentity();
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (current?.token) {
            headers['Authorization'] = `Bearer ${current.token}`;
        }
        
        return headers;
    }

    /**
     * 添加身份变化监听器
     * @param {Function} listener - 监听器函数
     */
    addIdentityChangeListener(listener) {
        this.identityChangeListeners.push(listener);
    }

    /**
     * 移除身份变化监听器
     * @param {Function} listener - 监听器函数
     */
    removeIdentityChangeListener(listener) {
        const index = this.identityChangeListeners.indexOf(listener);
        if (index > -1) {
            this.identityChangeListeners.splice(index, 1);
        }
    }

    /**
     * 通知身份变化
     * @param {Object|null} identity - 新身份
     */
    notifyIdentityChange(identity) {
        this.identityChangeListeners.forEach(listener => {
            try {
                listener(identity);
            } catch (error) {
                console.error('身份变化监听器执行失败:', error);
            }
        });
    }

    /**
     * 加载当前身份
     */
    loadCurrentIdentity() {
        try {
            const identityJson = localStorage.getItem(STORAGE_KEYS.CURRENT_IDENTITY);
            if (identityJson) {
                const identity = JSON.parse(identityJson);
                
                // 检查是否过期
                if (!this.isIdentityExpired(identity)) {
                    this.currentIdentity = identity;
                    console.log(`已加载身份: ${identity.type}`);
                } else {
                    // 过期则清除
                    localStorage.removeItem(STORAGE_KEYS.CURRENT_IDENTITY);
                    console.log('身份已过期，已清除');
                }
            }
        } catch (error) {
            console.error('加载身份失败:', error);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_IDENTITY);
        }
    }

    /**
     * 检查身份是否过期
     * @param {Object} identity - 身份信息
     * @returns {boolean} 是否过期
     */
    isIdentityExpired(identity) {
        if (!identity.expiresAt) return false;
        return Date.now() > identity.expiresAt;
    }

    /**
     * 保存到旧版存储（兼容现有系统）
     * @param {Object} identity - 身份信息
     */
    saveToLegacyStorage(identity) {
        switch (identity.type) {
            case IDENTITY_TYPES.ANONYMOUS:
                localStorage.setItem('ab_auth_token', identity.token);
                localStorage.setItem('ab_auth_state', JSON.stringify({
                    isAuthenticated: true,
                    token: identity.token,
                    user: identity.user,
                    expiresAt: identity.expiresAt
                }));
                localStorage.setItem('auth_type', 'anonymous');
                localStorage.setItem('auth_time', new Date().toISOString());
                break;
                
            case IDENTITY_TYPES.ADMIN:
            case IDENTITY_TYPES.SUPERADMIN:
                localStorage.setItem('adminToken', identity.token);
                localStorage.setItem('adminUser', JSON.stringify(identity.user));
                break;
                
            case IDENTITY_TYPES.REVIEWER:
                localStorage.setItem('reviewerToken', identity.token);
                localStorage.setItem('reviewerUser', JSON.stringify(identity.user));
                break;
        }
    }

    /**
     * 清除旧版存储
     * @param {string} identityType - 身份类型
     */
    clearLegacyStorage(identityType) {
        switch (identityType) {
            case IDENTITY_TYPES.ANONYMOUS:
                localStorage.removeItem('ab_auth_token');
                localStorage.removeItem('ab_auth_state');
                localStorage.removeItem('auth_type');
                localStorage.removeItem('auth_time');
                localStorage.removeItem('identity_a');
                localStorage.removeItem('identity_b');
                break;
                
            case IDENTITY_TYPES.ADMIN:
            case IDENTITY_TYPES.SUPERADMIN:
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                break;
                
            case IDENTITY_TYPES.REVIEWER:
                localStorage.removeItem('reviewerToken');
                localStorage.removeItem('reviewerUser');
                break;
        }
    }

    /**
     * 记录身份历史
     * @param {Object} identity - 身份信息
     */
    recordIdentityHistory(identity) {
        try {
            const historyJson = localStorage.getItem(STORAGE_KEYS.IDENTITY_HISTORY);
            let history = historyJson ? JSON.parse(historyJson) : [];
            
            // 添加新记录
            history.unshift({
                type: identity.type,
                loginTime: Date.now(),
                userInfo: {
                    id: identity.user?.id,
                    name: identity.user?.name,
                    role: identity.user?.role
                }
            });
            
            // 只保留最近10条记录
            history = history.slice(0, 10);
            
            localStorage.setItem(STORAGE_KEYS.IDENTITY_HISTORY, JSON.stringify(history));
        } catch (error) {
            console.error('记录身份历史失败:', error);
        }
    }

    /**
     * 获取身份历史
     * @returns {Array} 身份历史
     */
    getIdentityHistory() {
        try {
            const historyJson = localStorage.getItem(STORAGE_KEYS.IDENTITY_HISTORY);
            return historyJson ? JSON.parse(historyJson) : [];
        } catch (error) {
            console.error('获取身份历史失败:', error);
            return [];
        }
    }

    /**
     * 设置存储监听器（跨标签页同步）
     */
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEYS.CURRENT_IDENTITY) {
                // 重新加载身份
                this.loadCurrentIdentity();
                
                // 通知变化
                this.notifyIdentityChange(this.currentIdentity);
            }
        });
    }

    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            currentIdentity: this.currentIdentity,
            identityHistory: this.getIdentityHistory(),
            storageKeys: STORAGE_KEYS,
            identityTypes: IDENTITY_TYPES,
            listenerCount: this.identityChangeListeners.length
        };
    }
}

// 创建全局实例
const identityManager = new IdentityManager();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        identityManager,
        IDENTITY_TYPES,
        STORAGE_KEYS
    };
} else {
    window.IdentityManager = identityManager;
    window.IDENTITY_TYPES = IDENTITY_TYPES;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugIdentity = {
        getCurrentIdentity: () => identityManager.getCurrentIdentity(),
        clearAllIdentities: () => identityManager.clearAllIdentities(),
        getDebugInfo: () => identityManager.getDebugInfo(),
        getHistory: () => identityManager.getIdentityHistory(),
        
        // 测试身份切换
        testIdentitySwitch: (newType) => {
            const check = identityManager.checkIdentitySwitchConfirm(newType);
            console.log('身份切换检查:', check);
            return check;
        }
    };
}
