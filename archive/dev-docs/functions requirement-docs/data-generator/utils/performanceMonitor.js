/**
 * 性能监控器
 * 
 * 监控数据生成器的性能指标和事件
 * 提供实时统计和历史记录功能
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            apiResponseTime: 0,
            successRate: 0,
            errorRate: 0,
            generationEfficiency: 0,
            totalOperations: 0,
            averageGenerationTime: 0,
            memoryUsage: 0,
            cpuUsage: 0
        };
        
        this.events = [];
        this.maxEvents = 1000;
        this.startTime = Date.now();
        
        // 性能采样间隔
        this.samplingInterval = 5000; // 5秒
        this.samplingTimer = null;
        
        // 统计窗口
        this.windowSize = 50; // 最近50个事件
        
        this.startMonitoring();
    }

    /**
     * 记录事件
     * @param {string} type - 事件类型
     * @param {Object} data - 事件数据
     */
    recordEvent(type, data = {}) {
        const event = {
            id: this.generateEventId(),
            type,
            data,
            timestamp: Date.now(),
            duration: data.duration || 0,
            success: type === 'success' || data.success === true,
            error: type === 'error' || data.error
        };
        
        // 添加到事件列表
        this.events.unshift(event);
        
        // 保持事件数量限制
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(0, this.maxEvents);
        }
        
        // 更新指标
        this.updateMetrics();
        
        // 触发事件回调
        this.onEventRecorded?.(event);
        
        console.log(`[性能监控] ${type}:`, data);
    }

    /**
     * 记录API调用
     * @param {string} endpoint - API端点
     * @param {number} duration - 响应时间
     * @param {boolean} success - 是否成功
     * @param {string} error - 错误信息
     */
    recordAPICall(endpoint, duration, success = true, error = null) {
        this.recordEvent(success ? 'api_success' : 'api_error', {
            endpoint,
            duration,
            success,
            error,
            type: 'api_call'
        });
    }

    /**
     * 记录生成任务
     * @param {string} taskType - 任务类型
     * @param {number} count - 生成数量
     * @param {number} duration - 生成时间
     * @param {boolean} success - 是否成功
     */
    recordGenerationTask(taskType, count, duration, success = true) {
        const efficiency = success ? count / (duration / 1000) : 0; // 每秒生成数量
        
        this.recordEvent(success ? 'generation_success' : 'generation_error', {
            taskType,
            count,
            duration,
            efficiency,
            success,
            type: 'generation_task'
        });
    }

    /**
     * 记录用户操作
     * @param {string} action - 操作类型
     * @param {Object} details - 操作详情
     */
    recordUserAction(action, details = {}) {
        this.recordEvent('user_action', {
            action,
            details,
            type: 'user_interaction'
        });
    }

    /**
     * 记录系统错误
     * @param {Error} error - 错误对象
     * @param {string} context - 错误上下文
     */
    recordError(error, context = '') {
        this.recordEvent('error', {
            message: error.message,
            stack: error.stack,
            context,
            type: 'system_error'
        });
    }

    /**
     * 更新性能指标
     */
    updateMetrics() {
        const recentEvents = this.events.slice(0, this.windowSize);
        
        if (recentEvents.length === 0) return;
        
        // 计算成功率和错误率
        const successEvents = recentEvents.filter(e => e.success);
        const errorEvents = recentEvents.filter(e => e.error || e.type === 'error');
        
        this.metrics.successRate = (successEvents.length / recentEvents.length) * 100;
        this.metrics.errorRate = (errorEvents.length / recentEvents.length) * 100;
        this.metrics.totalOperations = this.events.length;
        
        // 计算API响应时间
        const apiEvents = recentEvents.filter(e => e.data?.type === 'api_call' && e.duration > 0);
        if (apiEvents.length > 0) {
            this.metrics.apiResponseTime = apiEvents.reduce((sum, e) => sum + e.duration, 0) / apiEvents.length;
        }
        
        // 计算生成效率
        const generationEvents = recentEvents.filter(e => e.data?.type === 'generation_task' && e.data?.efficiency);
        if (generationEvents.length > 0) {
            this.metrics.generationEfficiency = generationEvents.reduce((sum, e) => sum + e.data.efficiency, 0) / generationEvents.length;
        }
        
        // 计算平均生成时间
        const generationTimes = generationEvents.filter(e => e.duration > 0);
        if (generationTimes.length > 0) {
            this.metrics.averageGenerationTime = generationTimes.reduce((sum, e) => sum + e.duration, 0) / generationTimes.length;
        }
        
        // 更新系统资源使用情况
        this.updateSystemMetrics();
    }

    /**
     * 更新系统指标
     */
    updateSystemMetrics() {
        try {
            // 内存使用情况
            if (performance.memory) {
                this.metrics.memoryUsage = Math.round((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100);
            }
            
            // CPU使用情况（估算）
            const now = Date.now();
            const timeDiff = now - (this.lastCPUCheck || now);
            this.lastCPUCheck = now;
            
            // 基于事件频率估算CPU使用率
            const recentEventCount = this.events.filter(e => now - e.timestamp < 5000).length;
            this.metrics.cpuUsage = Math.min(recentEventCount * 2, 100);
            
        } catch (error) {
            console.warn('更新系统指标失败:', error);
        }
    }

    /**
     * 获取当前指标
     * @returns {Object} 性能指标
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * 获取最近事件
     * @param {number} limit - 事件数量限制
     * @returns {Array} 事件列表
     */
    getRecentEvents(limit = 20) {
        return this.events.slice(0, limit);
    }

    /**
     * 获取事件统计
     * @param {number} timeWindow - 时间窗口（毫秒）
     * @returns {Object} 事件统计
     */
    getEventStats(timeWindow = 3600000) { // 默认1小时
        const cutoffTime = Date.now() - timeWindow;
        const recentEvents = this.events.filter(e => e.timestamp > cutoffTime);
        
        const stats = {
            total: recentEvents.length,
            success: 0,
            error: 0,
            apiCalls: 0,
            generations: 0,
            userActions: 0,
            averageDuration: 0,
            eventTypes: {}
        };
        
        let totalDuration = 0;
        let durationCount = 0;
        
        recentEvents.forEach(event => {
            // 统计事件类型
            stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
            
            // 统计成功/失败
            if (event.success) stats.success++;
            if (event.error) stats.error++;
            
            // 统计具体类型
            if (event.data?.type === 'api_call') stats.apiCalls++;
            if (event.data?.type === 'generation_task') stats.generations++;
            if (event.data?.type === 'user_interaction') stats.userActions++;
            
            // 计算平均持续时间
            if (event.duration > 0) {
                totalDuration += event.duration;
                durationCount++;
            }
        });
        
        if (durationCount > 0) {
            stats.averageDuration = totalDuration / durationCount;
        }
        
        return stats;
    }

    /**
     * 获取性能趋势
     * @param {number} intervals - 时间间隔数量
     * @param {number} intervalSize - 每个间隔的大小（毫秒）
     * @returns {Array} 趋势数据
     */
    getPerformanceTrend(intervals = 12, intervalSize = 300000) { // 默认12个5分钟间隔
        const now = Date.now();
        const trend = [];
        
        for (let i = 0; i < intervals; i++) {
            const endTime = now - (i * intervalSize);
            const startTime = endTime - intervalSize;
            
            const intervalEvents = this.events.filter(e => 
                e.timestamp >= startTime && e.timestamp < endTime
            );
            
            const successCount = intervalEvents.filter(e => e.success).length;
            const errorCount = intervalEvents.filter(e => e.error).length;
            const totalCount = intervalEvents.length;
            
            const avgResponseTime = intervalEvents
                .filter(e => e.data?.type === 'api_call' && e.duration > 0)
                .reduce((sum, e, _, arr) => sum + e.duration / arr.length, 0) || 0;
            
            trend.unshift({
                timestamp: startTime,
                totalEvents: totalCount,
                successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
                errorRate: totalCount > 0 ? (errorCount / totalCount) * 100 : 0,
                avgResponseTime: Math.round(avgResponseTime)
            });
        }
        
        return trend;
    }

    /**
     * 获取错误分析
     * @param {number} timeWindow - 时间窗口（毫秒）
     * @returns {Object} 错误分析
     */
    getErrorAnalysis(timeWindow = 3600000) {
        const cutoffTime = Date.now() - timeWindow;
        const errorEvents = this.events.filter(e => 
            e.timestamp > cutoffTime && (e.error || e.type === 'error')
        );
        
        const analysis = {
            totalErrors: errorEvents.length,
            errorTypes: {},
            errorMessages: {},
            errorContexts: {},
            mostCommonError: null,
            errorRate: 0
        };
        
        errorEvents.forEach(event => {
            // 统计错误类型
            const errorType = event.data?.type || event.type;
            analysis.errorTypes[errorType] = (analysis.errorTypes[errorType] || 0) + 1;
            
            // 统计错误消息
            const errorMessage = event.data?.message || event.data?.error || 'Unknown error';
            analysis.errorMessages[errorMessage] = (analysis.errorMessages[errorMessage] || 0) + 1;
            
            // 统计错误上下文
            const context = event.data?.context || event.data?.endpoint || 'Unknown context';
            analysis.errorContexts[context] = (analysis.errorContexts[context] || 0) + 1;
        });
        
        // 找出最常见的错误
        const sortedErrors = Object.entries(analysis.errorMessages)
            .sort(([,a], [,b]) => b - a);
        
        if (sortedErrors.length > 0) {
            analysis.mostCommonError = {
                message: sortedErrors[0][0],
                count: sortedErrors[0][1]
            };
        }
        
        // 计算错误率
        const totalEvents = this.events.filter(e => e.timestamp > cutoffTime).length;
        analysis.errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;
        
        return analysis;
    }

    /**
     * 开始监控
     */
    startMonitoring() {
        if (this.samplingTimer) {
            clearInterval(this.samplingTimer);
        }
        
        this.samplingTimer = setInterval(() => {
            this.updateMetrics();
            this.performHealthCheck();
        }, this.samplingInterval);
        
        console.log('性能监控已启动');
    }

    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.samplingTimer) {
            clearInterval(this.samplingTimer);
            this.samplingTimer = null;
        }
        
        console.log('性能监控已停止');
    }

    /**
     * 执行健康检查
     */
    performHealthCheck() {
        const metrics = this.getMetrics();
        const issues = [];
        
        // 检查错误率
        if (metrics.errorRate > 10) {
            issues.push(`错误率过高: ${metrics.errorRate.toFixed(1)}%`);
        }
        
        // 检查响应时间
        if (metrics.apiResponseTime > 5000) {
            issues.push(`API响应时间过长: ${metrics.apiResponseTime.toFixed(0)}ms`);
        }
        
        // 检查内存使用
        if (metrics.memoryUsage > 90) {
            issues.push(`内存使用率过高: ${metrics.memoryUsage}%`);
        }
        
        // 检查生成效率
        if (metrics.generationEfficiency < 0.1) {
            issues.push(`生成效率过低: ${metrics.generationEfficiency.toFixed(2)}/秒`);
        }
        
        if (issues.length > 0) {
            this.recordEvent('health_warning', {
                issues,
                metrics,
                type: 'health_check'
            });
            
            console.warn('健康检查发现问题:', issues);
        }
    }

    /**
     * 重置统计
     */
    reset() {
        this.events = [];
        this.metrics = {
            apiResponseTime: 0,
            successRate: 0,
            errorRate: 0,
            generationEfficiency: 0,
            totalOperations: 0,
            averageGenerationTime: 0,
            memoryUsage: 0,
            cpuUsage: 0
        };
        this.startTime = Date.now();
        
        console.log('性能监控统计已重置');
    }

    /**
     * 导出监控数据
     * @returns {Object} 监控数据
     */
    exportData() {
        return {
            metrics: this.getMetrics(),
            events: this.getRecentEvents(100),
            stats: this.getEventStats(),
            trend: this.getPerformanceTrend(),
            errorAnalysis: this.getErrorAnalysis(),
            exportTime: new Date().toISOString(),
            monitoringDuration: Date.now() - this.startTime
        };
    }

    /**
     * 生成事件ID
     * @returns {string} 事件ID
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 格式化持续时间
     * @param {number} duration - 持续时间（毫秒）
     * @returns {string} 格式化的持续时间
     */
    formatDuration(duration) {
        if (duration < 1000) {
            return `${duration}ms`;
        } else if (duration < 60000) {
            return `${(duration / 1000).toFixed(1)}s`;
        } else {
            return `${(duration / 60000).toFixed(1)}m`;
        }
    }

    /**
     * 获取性能等级
     * @returns {string} 性能等级
     */
    getPerformanceGrade() {
        const metrics = this.getMetrics();
        
        let score = 100;
        
        // 错误率影响
        score -= metrics.errorRate * 2;
        
        // 响应时间影响
        if (metrics.apiResponseTime > 3000) {
            score -= (metrics.apiResponseTime - 3000) / 100;
        }
        
        // 内存使用影响
        if (metrics.memoryUsage > 80) {
            score -= (metrics.memoryUsage - 80) * 2;
        }
        
        // 生成效率影响
        if (metrics.generationEfficiency < 1) {
            score -= (1 - metrics.generationEfficiency) * 20;
        }
        
        score = Math.max(0, Math.min(100, score));
        
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
} else {
    window.PerformanceMonitor = PerformanceMonitor;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugPerformanceMonitor = {
        // 创建测试监控器
        createTestMonitor: () => {
            const monitor = new PerformanceMonitor();
            
            // 模拟一些事件
            monitor.recordAPICall('/api/test', 1200, true);
            monitor.recordAPICall('/api/test', 800, true);
            monitor.recordAPICall('/api/test', 2000, false, 'Timeout');
            monitor.recordGenerationTask('questionnaire', 10, 5000, true);
            monitor.recordGenerationTask('story', 5, 8000, true);
            monitor.recordUserAction('click_generate', { type: 'questionnaire' });
            monitor.recordError(new Error('Test error'), 'test context');
            
            console.log('测试监控器已创建:', monitor);
            return monitor;
        },
        
        // 测试性能指标
        testMetrics: (monitor) => {
            const metrics = monitor.getMetrics();
            console.log('性能指标:', metrics);
            return metrics;
        },
        
        // 测试事件统计
        testEventStats: (monitor) => {
            const stats = monitor.getEventStats();
            console.log('事件统计:', stats);
            return stats;
        },
        
        // 测试错误分析
        testErrorAnalysis: (monitor) => {
            const analysis = monitor.getErrorAnalysis();
            console.log('错误分析:', analysis);
            return analysis;
        },
        
        // 测试性能趋势
        testPerformanceTrend: (monitor) => {
            const trend = monitor.getPerformanceTrend();
            console.log('性能趋势:', trend);
            return trend;
        }
    };
}
