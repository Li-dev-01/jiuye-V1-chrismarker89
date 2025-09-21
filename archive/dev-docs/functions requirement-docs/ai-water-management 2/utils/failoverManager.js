/**
 * 故障转移管理器
 * 
 * 管理AI水源的故障转移机制，在主要水源不可用时自动切换到备用水源
 * 提供故障检测、自动切换和恢复检测功能
 */

class FailoverManager {
    constructor() {
        this.config = {
            enabled: true,
            healthCheckInterval: 60000, // 1分钟检查一次
            failureThreshold: 3, // 连续3次失败触发转移
            recoveryTimeout: 300000, // 5分钟后检查恢复
            halfOpenMaxCalls: 3, // 半开状态最大调用次数
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                recoveryTimeout: 60000,
                halfOpenMaxCalls: 3
            }
        };
        
        this.sourceStates = new Map(); // 水源状态跟踪
        this.failoverHistory = []; // 故障转移历史
        this.circuitBreakers = new Map(); // 熔断器状态
        this.recoveryTimers = new Map(); // 恢复检查定时器
        
        // 回调函数
        this.onFailover = null;
        this.onRecovery = null;
        this.onCircuitBreakerOpen = null;
        this.onCircuitBreakerClose = null;
        
        // 初始化水源状态
        this.initializeSourceStates();
        
        console.log('故障转移管理器已初始化');
    }

    /**
     * 初始化水源状态
     */
    initializeSourceStates() {
        const defaultSources = ['openai', 'grok', 'gemini'];
        
        defaultSources.forEach(sourceId => {
            this.sourceStates.set(sourceId, {
                status: 'active',
                failureCount: 0,
                lastFailure: null,
                lastSuccess: Date.now(),
                consecutiveFailures: 0,
                totalRequests: 0,
                successfulRequests: 0
            });
            
            this.circuitBreakers.set(sourceId, {
                state: 'closed', // closed, open, half-open
                failureCount: 0,
                lastFailure: null,
                nextAttempt: null,
                halfOpenCalls: 0
            });
        });
    }

    /**
     * 设置启用状态
     * @param {boolean} enabled - 是否启用
     * @returns {Promise<Object>} 操作结果
     */
    async setEnabled(enabled) {
        try {
            this.config.enabled = enabled;
            
            console.log(`故障转移管理器已${enabled ? '启用' : '禁用'}`);
            
            return {
                success: true,
                enabled,
                message: `故障转移管理器已${enabled ? '启用' : '禁用'}`
            };
            
        } catch (error) {
            console.error('设置故障转移状态失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 更新配置
     * @param {Object} newConfig - 新配置
     * @returns {Promise<Object>} 操作结果
     */
    async updateConfig(newConfig) {
        try {
            this.config = {
                ...this.config,
                ...newConfig
            };
            
            console.log('故障转移配置已更新:', newConfig);
            
            return {
                success: true,
                config: this.config,
                message: '故障转移配置已更新'
            };
            
        } catch (error) {
            console.error('更新故障转移配置失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 记录请求结果
     * @param {string} sourceId - 水源ID
     * @param {boolean} success - 是否成功
     * @param {Object} details - 详细信息
     */
    recordRequest(sourceId, success, details = {}) {
        if (!this.config.enabled) return;
        
        const state = this.sourceStates.get(sourceId);
        const circuitBreaker = this.circuitBreakers.get(sourceId);
        
        if (!state || !circuitBreaker) {
            console.warn(`未知的水源ID: ${sourceId}`);
            return;
        }
        
        // 更新请求统计
        state.totalRequests++;
        
        if (success) {
            this.handleSuccessfulRequest(sourceId, state, circuitBreaker, details);
        } else {
            this.handleFailedRequest(sourceId, state, circuitBreaker, details);
        }
        
        // 检查是否需要触发故障转移
        this.checkFailoverConditions(sourceId, state);
        
        // 更新熔断器状态
        this.updateCircuitBreakerState(sourceId, circuitBreaker, success);
    }

    /**
     * 处理成功请求
     * @param {string} sourceId - 水源ID
     * @param {Object} state - 水源状态
     * @param {Object} circuitBreaker - 熔断器状态
     * @param {Object} details - 详细信息
     */
    handleSuccessfulRequest(sourceId, state, circuitBreaker, details) {
        state.successfulRequests++;
        state.lastSuccess = Date.now();
        state.consecutiveFailures = 0;
        
        // 如果之前是故障状态，现在恢复了
        if (state.status === 'failed') {
            this.handleSourceRecovery(sourceId, state);
        }
        
        // 重置熔断器失败计数
        if (circuitBreaker.state === 'half-open') {
            circuitBreaker.halfOpenCalls++;
            
            // 如果半开状态下成功调用达到阈值，关闭熔断器
            if (circuitBreaker.halfOpenCalls >= this.config.circuitBreaker.halfOpenMaxCalls) {
                this.closeCircuitBreaker(sourceId, circuitBreaker);
            }
        }
    }

    /**
     * 处理失败请求
     * @param {string} sourceId - 水源ID
     * @param {Object} state - 水源状态
     * @param {Object} circuitBreaker - 熔断器状态
     * @param {Object} details - 详细信息
     */
    handleFailedRequest(sourceId, state, circuitBreaker, details) {
        state.failureCount++;
        state.consecutiveFailures++;
        state.lastFailure = Date.now();
        
        // 更新熔断器失败计数
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailure = Date.now();
        
        console.log(`水源 ${sourceId} 请求失败，连续失败次数: ${state.consecutiveFailures}`);
    }

    /**
     * 检查故障转移条件
     * @param {string} sourceId - 水源ID
     * @param {Object} state - 水源状态
     */
    checkFailoverConditions(sourceId, state) {
        // 检查是否达到故障转移阈值
        if (state.consecutiveFailures >= this.config.failureThreshold && state.status !== 'failed') {
            this.triggerFailover(sourceId, state);
        }
    }

    /**
     * 触发故障转移
     * @param {string} sourceId - 水源ID
     * @param {Object} state - 水源状态
     */
    triggerFailover(sourceId, state) {
        console.log(`触发水源 ${sourceId} 的故障转移`);
        
        // 更新水源状态
        state.status = 'failed';
        
        // 记录故障转移历史
        const failoverEvent = {
            id: this.generateFailoverId(),
            sourceId,
            timestamp: Date.now(),
            reason: `连续 ${state.consecutiveFailures} 次失败`,
            failureCount: state.failureCount,
            consecutiveFailures: state.consecutiveFailures,
            type: 'automatic'
        };
        
        this.failoverHistory.push(failoverEvent);
        
        // 保持历史记录大小限制
        if (this.failoverHistory.length > 100) {
            this.failoverHistory = this.failoverHistory.slice(-100);
        }
        
        // 启动恢复检查定时器
        this.startRecoveryTimer(sourceId);
        
        // 触发故障转移回调
        if (this.onFailover) {
            this.onFailover({
                from: sourceId,
                to: this.getBackupSource(sourceId),
                reason: failoverEvent.reason,
                timestamp: failoverEvent.timestamp
            });
        }
        
        console.log(`水源 ${sourceId} 故障转移已触发`);
    }

    /**
     * 执行手动故障转移
     * @param {string} fromSource - 源水源ID
     * @param {string} toSource - 目标水源ID
     * @returns {Promise<Object>} 操作结果
     */
    async executeFailover(fromSource, toSource) {
        try {
            const fromState = this.sourceStates.get(fromSource);
            const toState = this.sourceStates.get(toSource);
            
            if (!fromState || !toState) {
                throw new Error('无效的水源ID');
            }
            
            // 检查目标水源是否可用
            if (toState.status === 'failed') {
                throw new Error(`目标水源 ${toSource} 不可用`);
            }
            
            // 更新水源状态
            fromState.status = 'failed';
            
            // 记录手动故障转移
            const failoverEvent = {
                id: this.generateFailoverId(),
                sourceId: fromSource,
                targetSource: toSource,
                timestamp: Date.now(),
                reason: '手动故障转移',
                type: 'manual'
            };
            
            this.failoverHistory.push(failoverEvent);
            
            // 触发回调
            if (this.onFailover) {
                this.onFailover({
                    from: fromSource,
                    to: toSource,
                    reason: '手动故障转移',
                    timestamp: failoverEvent.timestamp
                });
            }
            
            console.log(`手动故障转移完成: ${fromSource} -> ${toSource}`);
            
            return {
                success: true,
                from: fromSource,
                to: toSource,
                message: '手动故障转移完成'
            };
            
        } catch (error) {
            console.error('执行故障转移失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 处理水源恢复
     * @param {string} sourceId - 水源ID
     * @param {Object} state - 水源状态
     */
    handleSourceRecovery(sourceId, state) {
        console.log(`水源 ${sourceId} 已恢复`);
        
        // 更新状态
        state.status = 'active';
        state.consecutiveFailures = 0;
        
        // 清除恢复定时器
        this.clearRecoveryTimer(sourceId);
        
        // 记录恢复事件
        const recoveryEvent = {
            id: this.generateRecoveryId(),
            sourceId,
            timestamp: Date.now(),
            downtime: Date.now() - (state.lastFailure || Date.now()),
            type: 'automatic'
        };
        
        // 触发恢复回调
        if (this.onRecovery) {
            this.onRecovery(recoveryEvent);
        }
        
        console.log(`水源 ${sourceId} 恢复事件已记录`);
    }

    /**
     * 启动恢复检查定时器
     * @param {string} sourceId - 水源ID
     */
    startRecoveryTimer(sourceId) {
        // 清除现有定时器
        this.clearRecoveryTimer(sourceId);
        
        const timer = setTimeout(() => {
            this.checkSourceRecovery(sourceId);
        }, this.config.recoveryTimeout);
        
        this.recoveryTimers.set(sourceId, timer);
        
        console.log(`水源 ${sourceId} 恢复检查定时器已启动`);
    }

    /**
     * 清除恢复定时器
     * @param {string} sourceId - 水源ID
     */
    clearRecoveryTimer(sourceId) {
        const timer = this.recoveryTimers.get(sourceId);
        if (timer) {
            clearTimeout(timer);
            this.recoveryTimers.delete(sourceId);
        }
    }

    /**
     * 检查水源恢复
     * @param {string} sourceId - 水源ID
     */
    async checkSourceRecovery(sourceId) {
        try {
            console.log(`检查水源 ${sourceId} 是否恢复...`);
            
            // 这里应该调用实际的健康检查
            const isHealthy = await this.performHealthCheck(sourceId);
            
            if (isHealthy) {
                const state = this.sourceStates.get(sourceId);
                if (state) {
                    this.handleSourceRecovery(sourceId, state);
                }
            } else {
                // 如果仍然不健康，继续等待
                this.startRecoveryTimer(sourceId);
            }
            
        } catch (error) {
            console.error(`检查水源 ${sourceId} 恢复失败:`, error);
            // 继续等待下次检查
            this.startRecoveryTimer(sourceId);
        }
    }

    /**
     * 执行健康检查（模拟）
     * @param {string} sourceId - 水源ID
     * @returns {Promise<boolean>} 是否健康
     */
    async performHealthCheck(sourceId) {
        // 模拟健康检查
        // 实际实现中应该调用HealthChecker或WaterSourceService
        return Math.random() > 0.3; // 70%概率恢复
    }

    /**
     * 更新熔断器状态
     * @param {string} sourceId - 水源ID
     * @param {Object} circuitBreaker - 熔断器状态
     * @param {boolean} success - 请求是否成功
     */
    updateCircuitBreakerState(sourceId, circuitBreaker, success) {
        if (!this.config.circuitBreaker.enabled) return;
        
        switch (circuitBreaker.state) {
            case 'closed':
                if (!success && circuitBreaker.failureCount >= this.config.circuitBreaker.failureThreshold) {
                    this.openCircuitBreaker(sourceId, circuitBreaker);
                }
                break;
                
            case 'open':
                if (Date.now() - circuitBreaker.lastFailure >= this.config.circuitBreaker.recoveryTimeout) {
                    this.halfOpenCircuitBreaker(sourceId, circuitBreaker);
                }
                break;
                
            case 'half-open':
                if (!success) {
                    this.openCircuitBreaker(sourceId, circuitBreaker);
                }
                break;
        }
    }

    /**
     * 打开熔断器
     * @param {string} sourceId - 水源ID
     * @param {Object} circuitBreaker - 熔断器状态
     */
    openCircuitBreaker(sourceId, circuitBreaker) {
        circuitBreaker.state = 'open';
        circuitBreaker.nextAttempt = Date.now() + this.config.circuitBreaker.recoveryTimeout;
        
        console.log(`水源 ${sourceId} 熔断器已打开`);
        
        if (this.onCircuitBreakerOpen) {
            this.onCircuitBreakerOpen({
                sourceId,
                timestamp: Date.now(),
                failureCount: circuitBreaker.failureCount
            });
        }
    }

    /**
     * 半开熔断器
     * @param {string} sourceId - 水源ID
     * @param {Object} circuitBreaker - 熔断器状态
     */
    halfOpenCircuitBreaker(sourceId, circuitBreaker) {
        circuitBreaker.state = 'half-open';
        circuitBreaker.halfOpenCalls = 0;
        
        console.log(`水源 ${sourceId} 熔断器已半开`);
    }

    /**
     * 关闭熔断器
     * @param {string} sourceId - 水源ID
     * @param {Object} circuitBreaker - 熔断器状态
     */
    closeCircuitBreaker(sourceId, circuitBreaker) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failureCount = 0;
        circuitBreaker.halfOpenCalls = 0;
        
        console.log(`水源 ${sourceId} 熔断器已关闭`);
        
        if (this.onCircuitBreakerClose) {
            this.onCircuitBreakerClose({
                sourceId,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 获取备用水源
     * @param {string} primarySource - 主要水源ID
     * @returns {string} 备用水源ID
     */
    getBackupSource(primarySource) {
        // 简化的备用水源选择逻辑
        const backupMap = {
            openai: 'gemini',
            grok: 'openai',
            gemini: 'openai'
        };
        
        return backupMap[primarySource] || 'openai';
    }

    /**
     * 检查水源是否可用
     * @param {string} sourceId - 水源ID
     * @returns {boolean} 是否可用
     */
    isSourceAvailable(sourceId) {
        const state = this.sourceStates.get(sourceId);
        const circuitBreaker = this.circuitBreakers.get(sourceId);
        
        if (!state || !circuitBreaker) return false;
        
        // 检查水源状态
        if (state.status === 'failed') return false;
        
        // 检查熔断器状态
        if (circuitBreaker.state === 'open') {
            // 检查是否可以尝试半开
            if (Date.now() >= circuitBreaker.nextAttempt) {
                this.halfOpenCircuitBreaker(sourceId, circuitBreaker);
                return true;
            }
            return false;
        }
        
        return true;
    }

    /**
     * 获取故障转移历史
     * @param {Object} filters - 过滤条件
     * @returns {Array} 故障转移历史
     */
    getFailoverHistory(filters = {}) {
        let history = [...this.failoverHistory];
        
        if (filters.sourceId) {
            history = history.filter(event => event.sourceId === filters.sourceId);
        }
        
        if (filters.type) {
            history = history.filter(event => event.type === filters.type);
        }
        
        if (filters.limit) {
            history = history.slice(-filters.limit);
        }
        
        return history.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * 获取系统状态
     * @returns {Object} 系统状态
     */
    getSystemStatus() {
        const sources = Array.from(this.sourceStates.entries());
        const circuitBreakers = Array.from(this.circuitBreakers.entries());
        
        return {
            enabled: this.config.enabled,
            sources: sources.map(([sourceId, state]) => ({
                sourceId,
                status: state.status,
                failureCount: state.failureCount,
                consecutiveFailures: state.consecutiveFailures,
                successRate: state.totalRequests > 0 ? 
                    (state.successfulRequests / state.totalRequests) * 100 : 0,
                lastFailure: state.lastFailure,
                lastSuccess: state.lastSuccess
            })),
            circuitBreakers: circuitBreakers.map(([sourceId, cb]) => ({
                sourceId,
                state: cb.state,
                failureCount: cb.failureCount,
                nextAttempt: cb.nextAttempt
            })),
            recentFailovers: this.getFailoverHistory({ limit: 10 }),
            statistics: this.generateStatistics()
        };
    }

    /**
     * 生成统计信息
     * @returns {Object} 统计信息
     */
    generateStatistics() {
        const sources = Array.from(this.sourceStates.values());
        const totalRequests = sources.reduce((sum, state) => sum + state.totalRequests, 0);
        const totalFailures = sources.reduce((sum, state) => sum + state.failureCount, 0);
        
        return {
            totalRequests,
            totalFailures,
            overallSuccessRate: totalRequests > 0 ? 
                ((totalRequests - totalFailures) / totalRequests) * 100 : 0,
            totalFailovers: this.failoverHistory.length,
            activeSources: sources.filter(state => state.status === 'active').length,
            failedSources: sources.filter(state => state.status === 'failed').length
        };
    }

    /**
     * 重置水源状态
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 操作结果
     */
    async resetSourceState(sourceId) {
        try {
            const state = this.sourceStates.get(sourceId);
            const circuitBreaker = this.circuitBreakers.get(sourceId);
            
            if (!state || !circuitBreaker) {
                throw new Error(`水源 ${sourceId} 不存在`);
            }
            
            // 重置状态
            state.status = 'active';
            state.failureCount = 0;
            state.consecutiveFailures = 0;
            state.lastFailure = null;
            
            // 重置熔断器
            circuitBreaker.state = 'closed';
            circuitBreaker.failureCount = 0;
            circuitBreaker.halfOpenCalls = 0;
            
            // 清除恢复定时器
            this.clearRecoveryTimer(sourceId);
            
            console.log(`水源 ${sourceId} 状态已重置`);
            
            return {
                success: true,
                sourceId,
                message: '水源状态已重置'
            };
            
        } catch (error) {
            console.error('重置水源状态失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成故障转移ID
     * @returns {string} 故障转移ID
     */
    generateFailoverId() {
        return `failover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成恢复ID
     * @returns {string} 恢复ID
     */
    generateRecoveryId() {
        return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 创建全局实例
const failoverManager = new FailoverManager();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = failoverManager;
} else {
    window.FailoverManager = failoverManager;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugFailover = {
        // 模拟故障
        simulateFailure: (sourceId, failureCount = 5) => {
            console.log(`模拟水源 ${sourceId} 故障，失败次数: ${failureCount}`);
            
            for (let i = 0; i < failureCount; i++) {
                failoverManager.recordRequest(sourceId, false, {
                    error: '模拟故障',
                    responseTime: 0
                });
            }
            
            const status = failoverManager.getSystemStatus();
            console.log('系统状态:', status);
            return status;
        },
        
        // 模拟恢复
        simulateRecovery: (sourceId, successCount = 3) => {
            console.log(`模拟水源 ${sourceId} 恢复，成功次数: ${successCount}`);
            
            for (let i = 0; i < successCount; i++) {
                failoverManager.recordRequest(sourceId, true, {
                    responseTime: 500
                });
            }
            
            const status = failoverManager.getSystemStatus();
            console.log('系统状态:', status);
            return status;
        },
        
        // 获取故障转移历史
        getHistory: (sourceId = null) => {
            const history = failoverManager.getFailoverHistory({
                sourceId,
                limit: 20
            });
            console.log('故障转移历史:', history);
            return history;
        },
        
        // 手动故障转移
        manualFailover: async (from, to) => {
            const result = await failoverManager.executeFailover(from, to);
            console.log('手动故障转移结果:', result);
            return result;
        }
    };
}
