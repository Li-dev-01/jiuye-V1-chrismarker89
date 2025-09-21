/**
 * 健康检查器
 * 
 * 定期检查AI水源的健康状态，监控响应时间、成功率等指标
 * 提供健康报告和告警功能
 */

class HealthChecker {
    constructor() {
        this.config = {
            checkInterval: 300000, // 5分钟
            timeout: 10000, // 10秒超时
            retryAttempts: 3,
            retryDelay: 5000,
            healthThresholds: {
                responseTime: {
                    good: 2000,    // 2秒以下为良好
                    warning: 5000, // 5秒以下为警告
                    critical: 10000 // 10秒以上为严重
                },
                successRate: {
                    good: 95,      // 95%以上为良好
                    warning: 85,   // 85%以上为警告
                    critical: 70   // 70%以下为严重
                },
                uptime: {
                    good: 99,      // 99%以上为良好
                    warning: 95,   // 95%以上为警告
                    critical: 90   // 90%以下为严重
                }
            }
        };
        
        this.checks = [
            {
                name: 'api_connectivity',
                description: 'API连接性检查',
                critical: true,
                enabled: true
            },
            {
                name: 'response_time',
                description: '响应时间检查',
                threshold: 5000,
                critical: false,
                enabled: true
            },
            {
                name: 'error_rate',
                description: '错误率检查',
                threshold: 0.05, // 5%错误率阈值
                critical: true,
                enabled: true
            },
            {
                name: 'rate_limit',
                description: '速率限制检查',
                critical: false,
                enabled: true
            },
            {
                name: 'model_availability',
                description: '模型可用性检查',
                critical: true,
                enabled: true
            }
        ];
        
        this.healthHistory = new Map(); // 按水源ID存储健康历史
        this.checkResults = new Map();  // 最新检查结果
        this.alerts = [];
        this.isRunning = false;
        this.intervalId = null;
        
        // 回调函数
        this.onHealthChange = null;
        this.onAlert = null;
        
        console.log('健康检查器已初始化');
    }

    /**
     * 启动健康检查
     * @param {number} interval - 检查间隔（毫秒）
     */
    start(interval = this.config.checkInterval) {
        if (this.isRunning) {
            console.log('健康检查器已在运行');
            return;
        }

        this.config.checkInterval = interval;
        this.isRunning = true;

        // 立即执行一次检查
        this.checkAllSources();

        // 设置定期检查
        this.intervalId = setInterval(() => {
            this.checkAllSources();
        }, interval);

        console.log(`健康检查器已启动，检查间隔: ${interval / 1000}秒`);
    }

    /**
     * 停止健康检查
     */
    stop() {
        if (!this.isRunning) {
            console.log('健康检查器未在运行');
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        console.log('健康检查器已停止');
    }

    /**
     * 检查所有水源
     * @returns {Promise<Array>} 检查结果列表
     */
    async checkAllSources() {
        try {
            // 获取所有水源（这里应该从WaterSourceService获取）
            const sources = await this.getAllSources();
            
            const checkPromises = sources.map(source => 
                this.checkSource(source.id).catch(error => ({
                    sourceId: source.id,
                    healthy: false,
                    error: error.message,
                    timestamp: Date.now()
                }))
            );

            const results = await Promise.all(checkPromises);
            
            // 更新检查结果
            results.forEach(result => {
                this.checkResults.set(result.sourceId, result);
                this.updateHealthHistory(result.sourceId, result);
            });

            console.log(`完成 ${results.length} 个水源的健康检查`);
            return results;

        } catch (error) {
            console.error('检查所有水源失败:', error);
            return [];
        }
    }

    /**
     * 检查单个水源
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 检查结果
     */
    async checkSource(sourceId) {
        try {
            const source = await this.getSource(sourceId);
            if (!source) {
                throw new Error(`水源 ${sourceId} 不存在`);
            }

            const checkStartTime = Date.now();
            const checkResults = {};

            // 执行各项检查
            for (const check of this.checks) {
                if (!check.enabled) continue;

                try {
                    const result = await this.executeCheck(source, check);
                    checkResults[check.name] = result;
                } catch (error) {
                    checkResults[check.name] = {
                        success: false,
                        error: error.message,
                        critical: check.critical
                    };
                }
            }

            const totalCheckTime = Date.now() - checkStartTime;

            // 分析检查结果
            const analysis = this.analyzeCheckResults(checkResults);
            
            const healthResult = {
                sourceId,
                healthy: analysis.healthy,
                summary: analysis.summary,
                details: checkResults,
                responseTime: analysis.responseTime,
                successRate: analysis.successRate,
                uptime: analysis.uptime,
                errorCount: analysis.errorCount,
                issues: analysis.issues,
                checkDuration: totalCheckTime,
                timestamp: Date.now()
            };

            // 触发健康状态变更回调
            if (this.onHealthChange) {
                this.onHealthChange(sourceId, healthResult);
            }

            // 检查是否需要触发告警
            this.checkForAlerts(sourceId, healthResult);

            return healthResult;

        } catch (error) {
            console.error(`检查水源 ${sourceId} 失败:`, error);
            
            const errorResult = {
                sourceId,
                healthy: false,
                summary: `检查失败: ${error.message}`,
                error: error.message,
                responseTime: 0,
                successRate: 0,
                uptime: 0,
                errorCount: 1,
                issues: [error.message],
                timestamp: Date.now()
            };

            return errorResult;
        }
    }

    /**
     * 执行具体检查
     * @param {Object} source - 水源对象
     * @param {Object} check - 检查配置
     * @returns {Promise<Object>} 检查结果
     */
    async executeCheck(source, check) {
        const startTime = Date.now();

        switch (check.name) {
            case 'api_connectivity':
                return await this.checkApiConnectivity(source);
            
            case 'response_time':
                return await this.checkResponseTime(source, check.threshold);
            
            case 'error_rate':
                return await this.checkErrorRate(source, check.threshold);
            
            case 'rate_limit':
                return await this.checkRateLimit(source);
            
            case 'model_availability':
                return await this.checkModelAvailability(source);
            
            default:
                throw new Error(`未知的检查类型: ${check.name}`);
        }
    }

    /**
     * 检查API连接性
     * @param {Object} source - 水源对象
     * @returns {Promise<Object>} 检查结果
     */
    async checkApiConnectivity(source) {
        try {
            const testPrompt = 'Health check test';
            const startTime = Date.now();

            // 模拟API调用
            const response = await this.makeTestRequest(source, testPrompt);
            const responseTime = Date.now() - startTime;

            return {
                success: true,
                responseTime,
                message: 'API连接正常',
                details: {
                    endpoint: source.config?.endpoint,
                    statusCode: response.statusCode || 200
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'API连接失败'
            };
        }
    }

    /**
     * 检查响应时间
     * @param {Object} source - 水源对象
     * @param {number} threshold - 阈值（毫秒）
     * @returns {Promise<Object>} 检查结果
     */
    async checkResponseTime(source, threshold) {
        try {
            const testPrompt = 'Response time test';
            const startTime = Date.now();

            await this.makeTestRequest(source, testPrompt);
            const responseTime = Date.now() - startTime;

            const success = responseTime <= threshold;

            return {
                success,
                responseTime,
                threshold,
                message: success ? 
                    `响应时间正常 (${responseTime}ms)` : 
                    `响应时间过长 (${responseTime}ms > ${threshold}ms)`,
                level: this.getResponseTimeLevel(responseTime)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '响应时间检查失败'
            };
        }
    }

    /**
     * 检查错误率
     * @param {Object} source - 水源对象
     * @param {number} threshold - 错误率阈值
     * @returns {Promise<Object>} 检查结果
     */
    async checkErrorRate(source) {
        try {
            // 从历史记录中计算错误率
            const history = this.healthHistory.get(source.id) || [];
            const recentChecks = history.slice(-20); // 最近20次检查

            if (recentChecks.length === 0) {
                return {
                    success: true,
                    errorRate: 0,
                    message: '暂无历史数据'
                };
            }

            const errorCount = recentChecks.filter(check => !check.healthy).length;
            const errorRate = errorCount / recentChecks.length;
            const success = errorRate <= 0.05; // 5%错误率阈值

            return {
                success,
                errorRate,
                errorCount,
                totalChecks: recentChecks.length,
                message: success ? 
                    `错误率正常 (${(errorRate * 100).toFixed(1)}%)` : 
                    `错误率过高 (${(errorRate * 100).toFixed(1)}%)`,
                level: this.getErrorRateLevel(errorRate)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '错误率检查失败'
            };
        }
    }

    /**
     * 检查速率限制
     * @param {Object} source - 水源对象
     * @returns {Promise<Object>} 检查结果
     */
    async checkRateLimit(source) {
        try {
            // 模拟速率限制检查
            const rateLimit = source.config?.rateLimit || 60;
            const currentUsage = Math.floor(Math.random() * rateLimit); // 模拟当前使用量
            const utilizationRate = currentUsage / rateLimit;

            const success = utilizationRate < 0.9; // 使用率低于90%为正常

            return {
                success,
                rateLimit,
                currentUsage,
                utilizationRate,
                message: success ? 
                    `速率限制正常 (${currentUsage}/${rateLimit})` : 
                    `接近速率限制 (${currentUsage}/${rateLimit})`,
                level: utilizationRate > 0.9 ? 'critical' : 
                       utilizationRate > 0.7 ? 'warning' : 'good'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '速率限制检查失败'
            };
        }
    }

    /**
     * 检查模型可用性
     * @param {Object} source - 水源对象
     * @returns {Promise<Object>} 检查结果
     */
    async checkModelAvailability(source) {
        try {
            const model = source.config?.model;
            if (!model) {
                throw new Error('未配置模型');
            }

            // 模拟模型可用性检查
            const available = Math.random() > 0.1; // 90%概率可用

            return {
                success: available,
                model,
                message: available ? 
                    `模型 ${model} 可用` : 
                    `模型 ${model} 不可用`,
                details: {
                    model,
                    provider: source.id
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '模型可用性检查失败'
            };
        }
    }

    /**
     * 模拟测试请求
     * @param {Object} source - 水源对象
     * @param {string} prompt - 测试提示
     * @returns {Promise<Object>} 响应结果
     */
    async makeTestRequest(source, prompt) {
        // 模拟网络延迟
        const delay = Math.random() * 2000 + 500; // 500-2500ms
        await new Promise(resolve => setTimeout(resolve, delay));

        // 模拟成功/失败
        if (Math.random() < 0.95) { // 95%成功率
            return {
                statusCode: 200,
                data: { content: 'Test response' }
            };
        } else {
            throw new Error('模拟API错误');
        }
    }

    /**
     * 分析检查结果
     * @param {Object} checkResults - 检查结果
     * @returns {Object} 分析结果
     */
    analyzeCheckResults(checkResults) {
        const results = Object.values(checkResults);
        const successfulChecks = results.filter(r => r.success);
        const failedChecks = results.filter(r => !r.success);
        const criticalFailures = failedChecks.filter(r => r.critical);

        // 计算健康状态
        const healthy = criticalFailures.length === 0;
        
        // 计算响应时间
        const responseTimeResults = results.filter(r => r.responseTime);
        const avgResponseTime = responseTimeResults.length > 0 ?
            responseTimeResults.reduce((sum, r) => sum + r.responseTime, 0) / responseTimeResults.length : 0;

        // 计算成功率
        const successRate = results.length > 0 ? (successfulChecks.length / results.length) * 100 : 0;

        // 生成问题列表
        const issues = failedChecks.map(check => check.message || check.error).filter(Boolean);

        // 生成摘要
        let summary;
        if (healthy) {
            summary = `健康 - ${successfulChecks.length}/${results.length} 项检查通过`;
        } else {
            summary = `不健康 - ${failedChecks.length} 项检查失败`;
            if (criticalFailures.length > 0) {
                summary += ` (${criticalFailures.length} 项严重)`;
            }
        }

        return {
            healthy,
            summary,
            responseTime: Math.round(avgResponseTime),
            successRate: Math.round(successRate * 10) / 10,
            uptime: successRate, // 简化处理，实际应该基于历史数据
            errorCount: failedChecks.length,
            issues
        };
    }

    /**
     * 获取响应时间级别
     * @param {number} responseTime - 响应时间
     * @returns {string} 级别
     */
    getResponseTimeLevel(responseTime) {
        const thresholds = this.config.healthThresholds.responseTime;
        
        if (responseTime <= thresholds.good) return 'good';
        if (responseTime <= thresholds.warning) return 'warning';
        return 'critical';
    }

    /**
     * 获取错误率级别
     * @param {number} errorRate - 错误率
     * @returns {string} 级别
     */
    getErrorRateLevel(errorRate) {
        const successRate = (1 - errorRate) * 100;
        const thresholds = this.config.healthThresholds.successRate;
        
        if (successRate >= thresholds.good) return 'good';
        if (successRate >= thresholds.warning) return 'warning';
        return 'critical';
    }

    /**
     * 更新健康历史
     * @param {string} sourceId - 水源ID
     * @param {Object} result - 检查结果
     */
    updateHealthHistory(sourceId, result) {
        if (!this.healthHistory.has(sourceId)) {
            this.healthHistory.set(sourceId, []);
        }

        const history = this.healthHistory.get(sourceId);
        history.push({
            timestamp: result.timestamp,
            healthy: result.healthy,
            responseTime: result.responseTime,
            successRate: result.successRate,
            issues: result.issues
        });

        // 保持历史记录大小限制
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
    }

    /**
     * 检查告警条件
     * @param {string} sourceId - 水源ID
     * @param {Object} result - 检查结果
     */
    checkForAlerts(sourceId, result) {
        const alerts = [];

        // 健康状态告警
        if (!result.healthy) {
            alerts.push({
                type: 'health_check_failed',
                severity: 'critical',
                sourceId,
                message: `水源 ${sourceId} 健康检查失败: ${result.summary}`,
                details: result.issues
            });
        }

        // 响应时间告警
        if (result.responseTime > this.config.healthThresholds.responseTime.critical) {
            alerts.push({
                type: 'high_response_time',
                severity: 'warning',
                sourceId,
                message: `水源 ${sourceId} 响应时间过长: ${result.responseTime}ms`,
                threshold: this.config.healthThresholds.responseTime.critical
            });
        }

        // 成功率告警
        if (result.successRate < this.config.healthThresholds.successRate.critical) {
            alerts.push({
                type: 'low_success_rate',
                severity: 'critical',
                sourceId,
                message: `水源 ${sourceId} 成功率过低: ${result.successRate}%`,
                threshold: this.config.healthThresholds.successRate.critical
            });
        }

        // 触发告警
        alerts.forEach(alert => this.triggerAlert(alert));
    }

    /**
     * 触发告警
     * @param {Object} alert - 告警信息
     */
    triggerAlert(alert) {
        const alertWithId = {
            ...alert,
            id: this.generateAlertId(),
            timestamp: new Date().toISOString(),
            acknowledged: false
        };

        this.alerts.push(alertWithId);

        // 保持告警记录大小限制
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }

        console.log('健康检查告警:', alertWithId);

        // 触发告警回调
        if (this.onAlert) {
            this.onAlert(alertWithId);
        }
    }

    /**
     * 生成告警ID
     * @returns {string} 告警ID
     */
    generateAlertId() {
        return `health_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取所有水源（模拟）
     * @returns {Promise<Array>} 水源列表
     */
    async getAllSources() {
        // 这里应该从WaterSourceService获取
        return [
            { id: 'openai', name: 'OpenAI GPT-4', status: 'active' },
            { id: 'grok', name: 'Grok AI', status: 'inactive' },
            { id: 'gemini', name: 'Google Gemini', status: 'inactive' }
        ];
    }

    /**
     * 获取单个水源（模拟）
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 水源对象
     */
    async getSource(sourceId) {
        const sources = await this.getAllSources();
        return sources.find(s => s.id === sourceId);
    }

    /**
     * 设置检查间隔
     * @param {number} interval - 间隔时间（秒）
     * @returns {Promise<Object>} 操作结果
     */
    async setInterval(interval) {
        try {
            const intervalMs = interval * 1000;
            
            if (this.isRunning) {
                this.stop();
                this.start(intervalMs);
            } else {
                this.config.checkInterval = intervalMs;
            }

            return {
                success: true,
                interval: intervalMs,
                message: `健康检查间隔已设置为 ${interval} 秒`
            };

        } catch (error) {
            console.error('设置检查间隔失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取健康报告
     * @param {string} sourceId - 水源ID（可选）
     * @returns {Object} 健康报告
     */
    getHealthReport(sourceId = null) {
        if (sourceId) {
            const result = this.checkResults.get(sourceId);
            const history = this.healthHistory.get(sourceId) || [];
            
            return {
                sourceId,
                currentStatus: result || null,
                history: history.slice(-20), // 最近20次记录
                alerts: this.alerts.filter(a => a.sourceId === sourceId),
                summary: this.generateSourceSummary(sourceId, result, history)
            };
        } else {
            const allResults = Array.from(this.checkResults.entries());
            
            return {
                overview: {
                    totalSources: allResults.length,
                    healthySources: allResults.filter(([_, result]) => result.healthy).length,
                    unhealthySources: allResults.filter(([_, result]) => !result.healthy).length,
                    lastCheckTime: allResults.length > 0 ? 
                        Math.max(...allResults.map(([_, result]) => result.timestamp)) : null
                },
                sources: allResults.map(([sourceId, result]) => ({
                    sourceId,
                    healthy: result.healthy,
                    summary: result.summary,
                    responseTime: result.responseTime,
                    successRate: result.successRate,
                    lastCheck: result.timestamp
                })),
                alerts: this.alerts.filter(a => !a.acknowledged),
                statistics: this.generateHealthStatistics()
            };
        }
    }

    /**
     * 生成水源摘要
     * @param {string} sourceId - 水源ID
     * @param {Object} result - 最新结果
     * @param {Array} history - 历史记录
     * @returns {Object} 摘要信息
     */
    generateSourceSummary(sourceId, result, history) {
        if (!result || history.length === 0) {
            return {
                status: 'unknown',
                message: '暂无数据'
            };
        }

        const recentHistory = history.slice(-10);
        const healthyCount = recentHistory.filter(h => h.healthy).length;
        const avgResponseTime = recentHistory.reduce((sum, h) => sum + (h.responseTime || 0), 0) / recentHistory.length;

        return {
            status: result.healthy ? 'healthy' : 'unhealthy',
            message: result.summary,
            reliability: (healthyCount / recentHistory.length) * 100,
            averageResponseTime: Math.round(avgResponseTime),
            trend: this.calculateHealthTrend(recentHistory)
        };
    }

    /**
     * 计算健康趋势
     * @param {Array} history - 历史记录
     * @returns {string} 趋势方向
     */
    calculateHealthTrend(history) {
        if (history.length < 3) return 'stable';

        const recent = history.slice(-3);
        const earlier = history.slice(-6, -3);

        const recentHealthy = recent.filter(h => h.healthy).length / recent.length;
        const earlierHealthy = earlier.length > 0 ? earlier.filter(h => h.healthy).length / earlier.length : recentHealthy;

        if (recentHealthy > earlierHealthy + 0.1) return 'improving';
        if (recentHealthy < earlierHealthy - 0.1) return 'declining';
        return 'stable';
    }

    /**
     * 生成健康统计
     * @returns {Object} 统计信息
     */
    generateHealthStatistics() {
        const allHistory = Array.from(this.healthHistory.values()).flat();
        
        if (allHistory.length === 0) {
            return {
                totalChecks: 0,
                averageResponseTime: 0,
                overallSuccessRate: 0
            };
        }

        const totalChecks = allHistory.length;
        const healthyChecks = allHistory.filter(h => h.healthy).length;
        const avgResponseTime = allHistory.reduce((sum, h) => sum + (h.responseTime || 0), 0) / totalChecks;

        return {
            totalChecks,
            healthyChecks,
            overallSuccessRate: (healthyChecks / totalChecks) * 100,
            averageResponseTime: Math.round(avgResponseTime),
            checksInLast24Hours: allHistory.filter(h => 
                Date.now() - h.timestamp < 24 * 60 * 60 * 1000
            ).length
        };
    }
}

// 创建全局实例
const healthChecker = new HealthChecker();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = healthChecker;
} else {
    window.HealthChecker = healthChecker;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugHealthChecker = {
        // 立即执行健康检查
        runHealthCheck: async () => {
            console.log('执行健康检查...');
            const results = await healthChecker.checkAllSources();
            console.log('健康检查结果:', results);
            return results;
        },
        
        // 获取健康报告
        getReport: (sourceId = null) => {
            const report = healthChecker.getHealthReport(sourceId);
            console.log('健康报告:', report);
            return report;
        },
        
        // 模拟健康状态变化
        simulateHealthChange: async (sourceId, healthy = false) => {
            console.log(`模拟水源 ${sourceId} 健康状态变化为: ${healthy ? '健康' : '不健康'}`);
            
            // 模拟检查结果
            const mockResult = {
                sourceId,
                healthy,
                summary: healthy ? '所有检查通过' : '检查失败',
                responseTime: healthy ? 500 : 10000,
                successRate: healthy ? 98.5 : 45.0,
                issues: healthy ? [] : ['连接超时', 'API错误'],
                timestamp: Date.now()
            };
            
            healthChecker.checkResults.set(sourceId, mockResult);
            healthChecker.updateHealthHistory(sourceId, mockResult);
            healthChecker.checkForAlerts(sourceId, mockResult);
            
            return mockResult;
        },
        
        // 启动/停止健康检查
        toggle: () => {
            if (healthChecker.isRunning) {
                healthChecker.stop();
                console.log('健康检查已停止');
            } else {
                healthChecker.start();
                console.log('健康检查已启动');
            }
            return healthChecker.isRunning;
        }
    };
}
