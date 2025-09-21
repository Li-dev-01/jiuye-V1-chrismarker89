/**
 * 性能监控器
 * 
 * 监控AI水源的性能指标，包括响应时间、吞吐量、错误率等
 * 提供性能分析、告警和优化建议功能
 */

class PerformanceMonitor {
    constructor() {
        this.config = {
            metricsInterval: 60000, // 1分钟收集一次指标
            retentionDays: 30,
            alertThresholds: {
                responseTime: {
                    warning: 3000,  // 3秒
                    critical: 5000  // 5秒
                },
                errorRate: {
                    warning: 0.05,  // 5%
                    critical: 0.10  // 10%
                },
                throughput: {
                    warning: 10,    // 每分钟10个请求以下
                    critical: 5     // 每分钟5个请求以下
                }
            }
        };
        
        this.metrics = new Map(); // 按水源ID存储指标
        this.alerts = [];
        this.reports = [];
        this.isCollecting = false;
        this.collectionInterval = null;
        
        // 回调函数
        this.onPerformanceAlert = null;
        this.onMetricUpdate = null;
        
        // 初始化指标收集
        this.initializeMetrics();
        
        console.log('性能监控器已初始化');
    }

    /**
     * 初始化指标收集
     */
    initializeMetrics() {
        const defaultSources = ['openai', 'grok', 'gemini'];
        
        defaultSources.forEach(sourceId => {
            this.metrics.set(sourceId, {
                responseTime: {
                    current: 0,
                    average: 0,
                    min: Infinity,
                    max: 0,
                    p95: 0,
                    p99: 0,
                    history: []
                },
                throughput: {
                    current: 0,
                    average: 0,
                    peak: 0,
                    history: []
                },
                errorRate: {
                    current: 0,
                    average: 0,
                    history: []
                },
                requests: {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    inProgress: 0
                },
                availability: {
                    uptime: 100,
                    downtime: 0,
                    history: []
                },
                lastUpdated: Date.now()
            });
        });
        
        // 启动指标收集
        this.startCollection();
    }

    /**
     * 启动指标收集
     */
    startCollection() {
        if (this.isCollecting) {
            console.log('性能监控已在运行');
            return;
        }
        
        this.isCollecting = true;
        
        // 定期收集指标
        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.metricsInterval);
        
        console.log(`性能监控已启动，收集间隔: ${this.config.metricsInterval / 1000}秒`);
    }

    /**
     * 停止指标收集
     */
    stopCollection() {
        if (!this.isCollecting) {
            console.log('性能监控未在运行');
            return;
        }
        
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        
        this.isCollecting = false;
        console.log('性能监控已停止');
    }

    /**
     * 收集指标
     */
    async collectMetrics() {
        try {
            const sources = Array.from(this.metrics.keys());
            
            for (const sourceId of sources) {
                await this.collectSourceMetrics(sourceId);
            }
            
            // 检查告警条件
            this.checkAlertConditions();
            
            console.log('指标收集完成');
            
        } catch (error) {
            console.error('收集指标失败:', error);
        }
    }

    /**
     * 收集单个水源的指标
     * @param {string} sourceId - 水源ID
     */
    async collectSourceMetrics(sourceId) {
        try {
            const metrics = this.metrics.get(sourceId);
            if (!metrics) return;
            
            // 模拟指标数据（实际实现中应该从真实数据源获取）
            const currentMetrics = await this.getCurrentMetrics(sourceId);
            
            // 更新响应时间指标
            this.updateResponseTimeMetrics(metrics.responseTime, currentMetrics.responseTime);
            
            // 更新吞吐量指标
            this.updateThroughputMetrics(metrics.throughput, currentMetrics.throughput);
            
            // 更新错误率指标
            this.updateErrorRateMetrics(metrics.errorRate, currentMetrics.errorRate);
            
            // 更新请求统计
            this.updateRequestMetrics(metrics.requests, currentMetrics.requests);
            
            // 更新可用性指标
            this.updateAvailabilityMetrics(metrics.availability, currentMetrics.availability);
            
            // 更新时间戳
            metrics.lastUpdated = Date.now();
            
            // 触发指标更新回调
            if (this.onMetricUpdate) {
                this.onMetricUpdate({
                    sourceId,
                    metrics: this.getSourceMetrics(sourceId),
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error(`收集水源 ${sourceId} 指标失败:`, error);
        }
    }

    /**
     * 获取当前指标（模拟）
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 当前指标
     */
    async getCurrentMetrics(sourceId) {
        // 模拟不同水源的性能特征
        const sourceProfiles = {
            openai: {
                baseResponseTime: 800,
                baseThroughput: 50,
                baseErrorRate: 0.02
            },
            grok: {
                baseResponseTime: 1200,
                baseThroughput: 30,
                baseErrorRate: 0.08
            },
            gemini: {
                baseResponseTime: 600,
                baseThroughput: 40,
                baseErrorRate: 0.03
            }
        };
        
        const profile = sourceProfiles[sourceId] || sourceProfiles.openai;
        
        // 添加随机变化
        const responseTime = profile.baseResponseTime + (Math.random() - 0.5) * 400;
        const throughput = Math.max(0, profile.baseThroughput + (Math.random() - 0.5) * 20);
        const errorRate = Math.max(0, Math.min(1, profile.baseErrorRate + (Math.random() - 0.5) * 0.02));
        
        return {
            responseTime: Math.max(100, responseTime), // 最小100ms
            throughput,
            errorRate,
            requests: {
                total: Math.floor(throughput),
                successful: Math.floor(throughput * (1 - errorRate)),
                failed: Math.floor(throughput * errorRate),
                inProgress: Math.floor(Math.random() * 5)
            },
            availability: Math.random() > 0.1 ? 100 : 0 // 90%概率可用
        };
    }

    /**
     * 更新响应时间指标
     * @param {Object} metrics - 响应时间指标对象
     * @param {number} currentValue - 当前值
     */
    updateResponseTimeMetrics(metrics, currentValue) {
        metrics.current = currentValue;
        metrics.history.push({
            value: currentValue,
            timestamp: Date.now()
        });
        
        // 保持历史记录大小限制
        if (metrics.history.length > 1440) { // 24小时的分钟数
            metrics.history = metrics.history.slice(-1440);
        }
        
        // 计算统计值
        const values = metrics.history.map(h => h.value);
        metrics.average = values.reduce((sum, val) => sum + val, 0) / values.length;
        metrics.min = Math.min(metrics.min, currentValue);
        metrics.max = Math.max(metrics.max, currentValue);
        
        // 计算百分位数
        const sortedValues = [...values].sort((a, b) => a - b);
        metrics.p95 = this.calculatePercentile(sortedValues, 95);
        metrics.p99 = this.calculatePercentile(sortedValues, 99);
    }

    /**
     * 更新吞吐量指标
     * @param {Object} metrics - 吞吐量指标对象
     * @param {number} currentValue - 当前值
     */
    updateThroughputMetrics(metrics, currentValue) {
        metrics.current = currentValue;
        metrics.history.push({
            value: currentValue,
            timestamp: Date.now()
        });
        
        // 保持历史记录大小限制
        if (metrics.history.length > 1440) {
            metrics.history = metrics.history.slice(-1440);
        }
        
        // 计算统计值
        const values = metrics.history.map(h => h.value);
        metrics.average = values.reduce((sum, val) => sum + val, 0) / values.length;
        metrics.peak = Math.max(metrics.peak, currentValue);
    }

    /**
     * 更新错误率指标
     * @param {Object} metrics - 错误率指标对象
     * @param {number} currentValue - 当前值
     */
    updateErrorRateMetrics(metrics, currentValue) {
        metrics.current = currentValue;
        metrics.history.push({
            value: currentValue,
            timestamp: Date.now()
        });
        
        // 保持历史记录大小限制
        if (metrics.history.length > 1440) {
            metrics.history = metrics.history.slice(-1440);
        }
        
        // 计算平均值
        const values = metrics.history.map(h => h.value);
        metrics.average = values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * 更新请求统计
     * @param {Object} metrics - 请求指标对象
     * @param {Object} currentValue - 当前值
     */
    updateRequestMetrics(metrics, currentValue) {
        metrics.total += currentValue.total;
        metrics.successful += currentValue.successful;
        metrics.failed += currentValue.failed;
        metrics.inProgress = currentValue.inProgress;
    }

    /**
     * 更新可用性指标
     * @param {Object} metrics - 可用性指标对象
     * @param {number} currentValue - 当前值
     */
    updateAvailabilityMetrics(metrics, currentValue) {
        metrics.history.push({
            value: currentValue,
            timestamp: Date.now()
        });
        
        // 保持历史记录大小限制
        if (metrics.history.length > 1440) {
            metrics.history = metrics.history.slice(-1440);
        }
        
        // 计算运行时间
        const values = metrics.history.map(h => h.value);
        const totalTime = values.length;
        const upTime = values.filter(v => v > 0).length;
        
        metrics.uptime = totalTime > 0 ? (upTime / totalTime) * 100 : 100;
        metrics.downtime = 100 - metrics.uptime;
    }

    /**
     * 计算百分位数
     * @param {Array} sortedValues - 排序后的值数组
     * @param {number} percentile - 百分位数
     * @returns {number} 百分位数值
     */
    calculatePercentile(sortedValues, percentile) {
        if (sortedValues.length === 0) return 0;
        
        const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
        return sortedValues[Math.max(0, index)];
    }

    /**
     * 检查告警条件
     */
    checkAlertConditions() {
        const sources = Array.from(this.metrics.entries());
        
        sources.forEach(([sourceId, metrics]) => {
            this.checkResponseTimeAlert(sourceId, metrics.responseTime);
            this.checkErrorRateAlert(sourceId, metrics.errorRate);
            this.checkThroughputAlert(sourceId, metrics.throughput);
        });
    }

    /**
     * 检查响应时间告警
     * @param {string} sourceId - 水源ID
     * @param {Object} responseTimeMetrics - 响应时间指标
     */
    checkResponseTimeAlert(sourceId, responseTimeMetrics) {
        const current = responseTimeMetrics.current;
        const thresholds = this.config.alertThresholds.responseTime;
        
        if (current > thresholds.critical) {
            this.triggerAlert({
                type: 'high_response_time',
                severity: 'critical',
                sourceId,
                message: `水源 ${sourceId} 响应时间严重过高: ${current}ms`,
                value: current,
                threshold: thresholds.critical
            });
        } else if (current > thresholds.warning) {
            this.triggerAlert({
                type: 'high_response_time',
                severity: 'warning',
                sourceId,
                message: `水源 ${sourceId} 响应时间过高: ${current}ms`,
                value: current,
                threshold: thresholds.warning
            });
        }
    }

    /**
     * 检查错误率告警
     * @param {string} sourceId - 水源ID
     * @param {Object} errorRateMetrics - 错误率指标
     */
    checkErrorRateAlert(sourceId, errorRateMetrics) {
        const current = errorRateMetrics.current;
        const thresholds = this.config.alertThresholds.errorRate;
        
        if (current > thresholds.critical) {
            this.triggerAlert({
                type: 'high_error_rate',
                severity: 'critical',
                sourceId,
                message: `水源 ${sourceId} 错误率严重过高: ${(current * 100).toFixed(1)}%`,
                value: current,
                threshold: thresholds.critical
            });
        } else if (current > thresholds.warning) {
            this.triggerAlert({
                type: 'high_error_rate',
                severity: 'warning',
                sourceId,
                message: `水源 ${sourceId} 错误率过高: ${(current * 100).toFixed(1)}%`,
                value: current,
                threshold: thresholds.warning
            });
        }
    }

    /**
     * 检查吞吐量告警
     * @param {string} sourceId - 水源ID
     * @param {Object} throughputMetrics - 吞吐量指标
     */
    checkThroughputAlert(sourceId, throughputMetrics) {
        const current = throughputMetrics.current;
        const thresholds = this.config.alertThresholds.throughput;
        
        if (current < thresholds.critical) {
            this.triggerAlert({
                type: 'low_throughput',
                severity: 'critical',
                sourceId,
                message: `水源 ${sourceId} 吞吐量严重过低: ${current}/min`,
                value: current,
                threshold: thresholds.critical
            });
        } else if (current < thresholds.warning) {
            this.triggerAlert({
                type: 'low_throughput',
                severity: 'warning',
                sourceId,
                message: `水源 ${sourceId} 吞吐量过低: ${current}/min`,
                value: current,
                threshold: thresholds.warning
            });
        }
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
        
        console.log('性能告警:', alertWithId);
        
        // 触发告警回调
        if (this.onPerformanceAlert) {
            this.onPerformanceAlert(alertWithId);
        }
    }

    /**
     * 生成告警ID
     * @returns {string} 告警ID
     */
    generateAlertId() {
        return `perf_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取水源指标
     * @param {string} sourceId - 水源ID
     * @returns {Object} 水源指标
     */
    getSourceMetrics(sourceId) {
        const metrics = this.metrics.get(sourceId);
        if (!metrics) return null;
        
        return {
            sourceId,
            responseTime: {
                current: Math.round(metrics.responseTime.current),
                average: Math.round(metrics.responseTime.average),
                min: Math.round(metrics.responseTime.min),
                max: Math.round(metrics.responseTime.max),
                p95: Math.round(metrics.responseTime.p95),
                p99: Math.round(metrics.responseTime.p99)
            },
            throughput: {
                current: Math.round(metrics.throughput.current),
                average: Math.round(metrics.throughput.average),
                peak: Math.round(metrics.throughput.peak)
            },
            errorRate: {
                current: Math.round(metrics.errorRate.current * 1000) / 10, // 保留1位小数
                average: Math.round(metrics.errorRate.average * 1000) / 10
            },
            requests: metrics.requests,
            availability: {
                uptime: Math.round(metrics.availability.uptime * 10) / 10,
                downtime: Math.round(metrics.availability.downtime * 10) / 10
            },
            lastUpdated: metrics.lastUpdated
        };
    }

    /**
     * 获取所有指标
     * @returns {Object} 所有指标
     */
    getAllMetrics() {
        const sources = Array.from(this.metrics.keys());
        const result = {};
        
        sources.forEach(sourceId => {
            result[sourceId] = this.getSourceMetrics(sourceId);
        });
        
        return result;
    }

    /**
     * 生成性能报告
     * @param {Object} options - 报告选项
     * @returns {Promise<Object>} 性能报告
     */
    async generateReport(options = {}) {
        try {
            const {
                period = 'last_24_hours',
                includeMetrics = ['responseTime', 'successRate', 'throughput', 'errorRate'],
                groupBy = 'source'
            } = options;
            
            const report = {
                id: this.generateReportId(),
                generatedAt: new Date().toISOString(),
                period,
                summary: this.generateReportSummary(),
                metrics: this.generateMetricsReport(includeMetrics, groupBy),
                alerts: this.getRecentAlerts(),
                recommendations: this.generateOptimizationSuggestions(),
                trends: this.generateTrendAnalysis(period)
            };
            
            // 保存报告
            this.reports.push(report);
            
            // 保持报告记录大小限制
            if (this.reports.length > 50) {
                this.reports = this.reports.slice(-50);
            }
            
            return report;
            
        } catch (error) {
            console.error('生成性能报告失败:', error);
            throw error;
        }
    }

    /**
     * 生成报告摘要
     * @returns {Object} 报告摘要
     */
    generateReportSummary() {
        const allMetrics = this.getAllMetrics();
        const sources = Object.keys(allMetrics);
        
        const avgResponseTime = sources.reduce((sum, sourceId) => 
            sum + allMetrics[sourceId].responseTime.average, 0) / sources.length;
        
        const avgThroughput = sources.reduce((sum, sourceId) => 
            sum + allMetrics[sourceId].throughput.average, 0) / sources.length;
        
        const avgErrorRate = sources.reduce((sum, sourceId) => 
            sum + allMetrics[sourceId].errorRate.average, 0) / sources.length;
        
        const avgUptime = sources.reduce((sum, sourceId) => 
            sum + allMetrics[sourceId].availability.uptime, 0) / sources.length;
        
        return {
            totalSources: sources.length,
            averageResponseTime: Math.round(avgResponseTime),
            averageThroughput: Math.round(avgThroughput),
            averageErrorRate: Math.round(avgErrorRate * 10) / 10,
            averageUptime: Math.round(avgUptime * 10) / 10,
            activeAlerts: this.alerts.filter(a => !a.acknowledged).length
        };
    }

    /**
     * 生成指标报告
     * @param {Array} includeMetrics - 包含的指标
     * @param {string} groupBy - 分组方式
     * @returns {Object} 指标报告
     */
    generateMetricsReport(includeMetrics, groupBy) {
        const allMetrics = this.getAllMetrics();
        const report = {};
        
        Object.entries(allMetrics).forEach(([sourceId, metrics]) => {
            const sourceReport = {};
            
            includeMetrics.forEach(metricType => {
                if (metrics[metricType]) {
                    sourceReport[metricType] = metrics[metricType];
                }
            });
            
            report[sourceId] = sourceReport;
        });
        
        return report;
    }

    /**
     * 获取最近告警
     * @returns {Array} 最近告警列表
     */
    getRecentAlerts() {
        return this.alerts
            .filter(alert => Date.now() - new Date(alert.timestamp).getTime() < 24 * 60 * 60 * 1000)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 生成优化建议
     * @returns {Array} 优化建议列表
     */
    generateOptimizationSuggestions() {
        const suggestions = [];
        const allMetrics = this.getAllMetrics();
        
        Object.entries(allMetrics).forEach(([sourceId, metrics]) => {
            // 响应时间优化建议
            if (metrics.responseTime.average > 2000) {
                suggestions.push({
                    type: 'response_time',
                    sourceId,
                    priority: 'high',
                    title: `优化 ${sourceId} 响应时间`,
                    description: `当前平均响应时间 ${metrics.responseTime.average}ms，建议检查网络连接或调整超时设置`,
                    expectedImprovement: '响应时间可能降低20-30%'
                });
            }
            
            // 错误率优化建议
            if (metrics.errorRate.average > 5) {
                suggestions.push({
                    type: 'error_rate',
                    sourceId,
                    priority: 'critical',
                    title: `降低 ${sourceId} 错误率`,
                    description: `当前平均错误率 ${metrics.errorRate.average}%，建议检查API配置或增加重试机制`,
                    expectedImprovement: '错误率可能降低50-70%'
                });
            }
            
            // 吞吐量优化建议
            if (metrics.throughput.average < 20) {
                suggestions.push({
                    type: 'throughput',
                    sourceId,
                    priority: 'medium',
                    title: `提升 ${sourceId} 吞吐量`,
                    description: `当前平均吞吐量 ${metrics.throughput.average}/min，建议增加并发连接数或优化请求批次`,
                    expectedImprovement: '吞吐量可能提升30-50%'
                });
            }
        });
        
        return suggestions;
    }

    /**
     * 生成趋势分析
     * @param {string} period - 时间周期
     * @returns {Object} 趋势分析
     */
    generateTrendAnalysis(period) {
        // 简化的趋势分析
        return {
            responseTime: 'stable',
            throughput: 'improving',
            errorRate: 'declining',
            availability: 'stable'
        };
    }

    /**
     * 生成报告ID
     * @returns {string} 报告ID
     */
    generateReportId() {
        return `perf_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = performanceMonitor;
} else {
    window.PerformanceMonitor = performanceMonitor;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugPerformance = {
        // 获取实时指标
        getCurrentMetrics: (sourceId = null) => {
            if (sourceId) {
                const metrics = performanceMonitor.getSourceMetrics(sourceId);
                console.log(`水源 ${sourceId} 指标:`, metrics);
                return metrics;
            } else {
                const allMetrics = performanceMonitor.getAllMetrics();
                console.log('所有指标:', allMetrics);
                return allMetrics;
            }
        },
        
        // 生成性能报告
        generateReport: async (options = {}) => {
            const report = await performanceMonitor.generateReport(options);
            console.log('性能报告:', report);
            return report;
        },
        
        // 模拟性能问题
        simulatePerformanceIssue: (sourceId, issueType) => {
            console.log(`模拟水源 ${sourceId} 的 ${issueType} 问题`);
            
            const metrics = performanceMonitor.metrics.get(sourceId);
            if (!metrics) return;
            
            switch (issueType) {
                case 'high_latency':
                    performanceMonitor.updateResponseTimeMetrics(metrics.responseTime, 8000);
                    break;
                case 'high_error_rate':
                    performanceMonitor.updateErrorRateMetrics(metrics.errorRate, 0.15);
                    break;
                case 'low_throughput':
                    performanceMonitor.updateThroughputMetrics(metrics.throughput, 3);
                    break;
            }
            
            performanceMonitor.checkAlertConditions();
            
            const currentMetrics = performanceMonitor.getSourceMetrics(sourceId);
            console.log('更新后的指标:', currentMetrics);
            return currentMetrics;
        },
        
        // 获取告警列表
        getAlerts: () => {
            const alerts = performanceMonitor.getRecentAlerts();
            console.log('最近告警:', alerts);
            return alerts;
        }
    };
}
