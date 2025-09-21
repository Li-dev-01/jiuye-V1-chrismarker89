/**
 * 成本控制服务
 * 
 * 监控和控制AI服务成本，提供预算管理、成本分析和优化建议
 * 支持自动成本控制和告警机制
 */

class CostControlService {
    constructor() {
        this.config = {
            dailyBudget: 50.00,
            monthlyBudget: 1500.00,
            alertThresholds: {
                daily: 40.00,
                monthly: 1200.00
            },
            costOptimization: {
                enabled: true,
                autoSwitchToLowerCost: true,
                costThresholdMultiplier: 1.5,
                qualityMinimumThreshold: 0.8
            },
            billing: {
                currency: 'USD',
                trackingEnabled: true,
                reportingInterval: 'daily',
                costBreakdownByTerminal: true
            }
        };
        
        this.costData = {
            daily: {
                total: 2.45,
                bySource: {
                    openai: 2.45,
                    grok: 0.00,
                    gemini: 0.00
                },
                byTerminal: {
                    data_generation: 1.47,
                    content_review: 0.73,
                    ai_learning: 0.25
                },
                date: new Date().toISOString().split('T')[0]
            },
            monthly: {
                total: 48.90,
                bySource: {
                    openai: 48.90,
                    grok: 0.00,
                    gemini: 0.00
                },
                byTerminal: {
                    data_generation: 29.34,
                    content_review: 14.67,
                    ai_learning: 4.89
                },
                month: new Date().toISOString().slice(0, 7)
            }
        };
        
        this.costHistory = [];
        this.alerts = [];
        this.optimizationSuggestions = [];
        
        // 初始化成本跟踪
        this.initializeCostTracking();
        
        // 生成优化建议
        this.generateOptimizationSuggestions();
    }

    /**
     * 初始化成本跟踪
     */
    initializeCostTracking() {
        // 定期更新成本数据
        setInterval(() => {
            this.updateCostData();
            this.checkBudgetAlerts();
        }, 60000); // 每分钟检查一次

        console.log('成本跟踪已初始化');
    }

    /**
     * 获取当前成本
     * @returns {Object} 当前成本数据
     */
    getCurrentCosts() {
        return {
            daily: this.costData.daily.total,
            monthly: this.costData.monthly.total,
            projected: this.calculateProjectedMonthlyCost(),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 获取预算限制
     * @returns {Object} 预算限制
     */
    getBudgetLimits() {
        return {
            daily: this.config.dailyBudget,
            monthly: this.config.monthlyBudget,
            alertThresholds: this.config.alertThresholds
        };
    }

    /**
     * 设置预算限制
     * @param {Object} limits - 预算限制
     * @returns {Promise<Object>} 操作结果
     */
    async setBudgetLimits(limits) {
        try {
            if (limits.dailyBudget) {
                this.config.dailyBudget = limits.dailyBudget;
            }
            
            if (limits.monthlyBudget) {
                this.config.monthlyBudget = limits.monthlyBudget;
            }
            
            if (limits.alertThresholds) {
                this.config.alertThresholds = {
                    ...this.config.alertThresholds,
                    ...limits.alertThresholds
                };
            }

            console.log('预算限制已更新:', limits);

            return {
                success: true,
                limits: this.getBudgetLimits(),
                message: '预算限制已更新'
            };

        } catch (error) {
            console.error('设置预算限制失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 启用预算控制
     * @param {Object} config - 控制配置
     * @returns {Promise<Object>} 操作结果
     */
    async enableBudgetControl(config = {}) {
        try {
            this.config.costOptimization = {
                ...this.config.costOptimization,
                enabled: true,
                ...config
            };

            console.log('预算控制已启用:', config);

            return {
                success: true,
                config: this.config.costOptimization,
                message: '预算控制已启用'
            };

        } catch (error) {
            console.error('启用预算控制失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取成本分析
     * @param {Object} options - 分析选项
     * @returns {Promise<Object>} 成本分析结果
     */
    async getAnalysis(options = {}) {
        try {
            const {
                period = 'current_month',
                groupBy = 'source',
                includeProjections = true
            } = options;

            const analysis = {
                period,
                groupBy,
                summary: this.generateCostSummary(period),
                breakdown: this.generateCostBreakdown(groupBy, period),
                trends: this.generateCostTrends(period),
                efficiency: this.calculateCostEfficiency(),
                timestamp: new Date().toISOString()
            };

            if (includeProjections) {
                analysis.projections = this.generateCostProjections();
            }

            return analysis;

        } catch (error) {
            console.error('获取成本分析失败:', error);
            throw error;
        }
    }

    /**
     * 生成成本摘要
     * @param {string} period - 时间周期
     * @returns {Object} 成本摘要
     */
    generateCostSummary(period) {
        const current = period === 'current_month' ? this.costData.monthly : this.costData.daily;
        const budget = period === 'current_month' ? this.config.monthlyBudget : this.config.dailyBudget;

        return {
            totalCost: current.total,
            budget,
            remaining: budget - current.total,
            utilizationRate: (current.total / budget) * 100,
            status: current.total > budget ? 'over_budget' : 
                   current.total > budget * 0.8 ? 'warning' : 'normal'
        };
    }

    /**
     * 生成成本分解
     * @param {string} groupBy - 分组方式
     * @param {string} period - 时间周期
     * @returns {Object} 成本分解
     */
    generateCostBreakdown(groupBy, period) {
        const current = period === 'current_month' ? this.costData.monthly : this.costData.daily;
        const data = groupBy === 'source' ? current.bySource : current.byTerminal;

        const breakdown = {};
        const total = current.total;

        Object.entries(data).forEach(([key, cost]) => {
            breakdown[key] = {
                cost,
                percentage: total > 0 ? (cost / total) * 100 : 0,
                trend: this.calculateCostTrend(key, groupBy)
            };
        });

        return breakdown;
    }

    /**
     * 生成成本趋势
     * @param {string} period - 时间周期
     * @returns {Array} 成本趋势数据
     */
    generateCostTrends(period) {
        // 模拟趋势数据
        const days = period === 'current_month' ? 30 : 7;
        const trends = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            trends.push({
                date: date.toISOString().split('T')[0],
                cost: Math.random() * 5 + 1, // 模拟每日成本
                requests: Math.floor(Math.random() * 200) + 50
            });
        }

        return trends;
    }

    /**
     * 计算成本效率
     * @returns {Object} 成本效率指标
     */
    calculateCostEfficiency() {
        const dailyCost = this.costData.daily.total;
        const dailyRequests = 150; // 模拟请求数
        
        return {
            costPerRequest: dailyRequests > 0 ? dailyCost / dailyRequests : 0,
            requestsPerDollar: dailyCost > 0 ? dailyRequests / dailyCost : 0,
            efficiency: this.calculateEfficiencyScore(),
            benchmark: {
                industry: 0.015, // 行业平均每请求成本
                target: 0.012    // 目标每请求成本
            }
        };
    }

    /**
     * 计算效率分数
     * @returns {number} 效率分数 (0-100)
     */
    calculateEfficiencyScore() {
        const costPerRequest = this.costData.daily.total / 150;
        const targetCost = 0.012;
        
        if (costPerRequest <= targetCost) {
            return 100;
        } else {
            return Math.max(0, 100 - ((costPerRequest - targetCost) / targetCost) * 100);
        }
    }

    /**
     * 生成成本预测
     * @returns {Object} 成本预测
     */
    generateCostProjections() {
        const currentDailyCost = this.costData.daily.total;
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const daysPassed = new Date().getDate();
        const remainingDays = daysInMonth - daysPassed;

        return {
            endOfMonth: {
                projected: this.costData.monthly.total + (currentDailyCost * remainingDays),
                confidence: 0.85,
                method: 'linear_trend'
            },
            nextMonth: {
                projected: currentDailyCost * daysInMonth,
                confidence: 0.70,
                method: 'current_rate'
            },
            quarter: {
                projected: (currentDailyCost * daysInMonth) * 3,
                confidence: 0.60,
                method: 'monthly_average'
            }
        };
    }

    /**
     * 计算预计月度成本
     * @returns {number} 预计月度成本
     */
    calculateProjectedMonthlyCost() {
        const currentDailyCost = this.costData.daily.total;
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const daysPassed = new Date().getDate();
        const remainingDays = daysInMonth - daysPassed;

        return this.costData.monthly.total + (currentDailyCost * remainingDays);
    }

    /**
     * 计算成本趋势
     * @param {string} key - 键名
     * @param {string} groupBy - 分组方式
     * @returns {string} 趋势方向
     */
    calculateCostTrend(key, groupBy) {
        // 模拟趋势计算
        const trends = ['up', 'down', 'stable'];
        return trends[Math.floor(Math.random() * trends.length)];
    }

    /**
     * 更新成本数据
     */
    updateCostData() {
        // 模拟成本数据更新
        const increment = Math.random() * 0.01; // 随机增加成本
        
        this.costData.daily.total += increment;
        this.costData.daily.bySource.openai += increment;
        this.costData.daily.byTerminal.data_generation += increment * 0.6;
        this.costData.daily.byTerminal.content_review += increment * 0.3;
        this.costData.daily.byTerminal.ai_learning += increment * 0.1;

        // 记录成本历史
        this.costHistory.push({
            timestamp: Date.now(),
            dailyCost: this.costData.daily.total,
            monthlyCost: this.costData.monthly.total
        });

        // 保持历史记录大小限制
        if (this.costHistory.length > 1000) {
            this.costHistory = this.costHistory.slice(-1000);
        }
    }

    /**
     * 检查预算告警
     */
    checkBudgetAlerts() {
        const dailyCost = this.costData.daily.total;
        const monthlyCost = this.costData.monthly.total;
        const projectedMonthlyCost = this.calculateProjectedMonthlyCost();

        // 检查日预算告警
        if (dailyCost > this.config.alertThresholds.daily) {
            this.triggerAlert({
                type: 'daily_budget_exceeded',
                severity: 'warning',
                message: `日成本 $${dailyCost.toFixed(3)} 超过告警阈值 $${this.config.alertThresholds.daily}`,
                cost: dailyCost,
                threshold: this.config.alertThresholds.daily
            });
        }

        // 检查月预算告警
        if (monthlyCost > this.config.alertThresholds.monthly) {
            this.triggerAlert({
                type: 'monthly_budget_exceeded',
                severity: 'warning',
                message: `月成本 $${monthlyCost.toFixed(2)} 超过告警阈值 $${this.config.alertThresholds.monthly}`,
                cost: monthlyCost,
                threshold: this.config.alertThresholds.monthly
            });
        }

        // 检查预计月成本告警
        if (projectedMonthlyCost > this.config.monthlyBudget) {
            this.triggerAlert({
                type: 'projected_budget_exceeded',
                severity: 'critical',
                message: `预计月成本 $${projectedMonthlyCost.toFixed(2)} 将超过月预算 $${this.config.monthlyBudget}`,
                cost: projectedMonthlyCost,
                threshold: this.config.monthlyBudget
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

        console.log('成本告警:', alertWithId);

        // 如果启用了自动成本控制，执行相应措施
        if (this.config.costOptimization.enabled && this.config.costOptimization.autoSwitchToLowerCost) {
            this.executeCostOptimization(alert);
        }
    }

    /**
     * 执行成本优化
     * @param {Object} alert - 触发的告警
     */
    executeCostOptimization(alert) {
        console.log('执行自动成本优化措施:', alert.type);
        
        // 这里可以实现自动切换到低成本水源等措施
        // 例如：通知LoadBalancerService切换到成本优先模式
    }

    /**
     * 生成告警ID
     * @returns {string} 告警ID
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取优化建议
     * @returns {Array} 优化建议列表
     */
    getOptimizationSuggestions() {
        return this.optimizationSuggestions;
    }

    /**
     * 生成优化建议
     */
    generateOptimizationSuggestions() {
        this.optimizationSuggestions = [
            {
                id: 'enable_gemini',
                title: '启用Gemini作为备用水源',
                description: 'Gemini的成本比OpenAI低17%，可以在非关键任务中使用以降低成本',
                impact: '预计每月节省$12.50',
                priority: 'high',
                category: 'source_optimization',
                implementation: {
                    effort: 'low',
                    timeToImplement: '15分钟',
                    risks: ['可能影响响应质量', '需要API密钥配置']
                }
            },
            {
                id: 'optimize_batch_size',
                title: '优化批次大小',
                description: '将数据生成的批次大小从3增加到5，可以提高效率并减少API调用次数',
                impact: '预计每月节省$8.30',
                priority: 'medium',
                category: 'efficiency_optimization',
                implementation: {
                    effort: 'low',
                    timeToImplement: '5分钟',
                    risks: ['可能增加单次请求延迟']
                }
            },
            {
                id: 'adjust_quality_requirements',
                title: '调整质量要求',
                description: 'AI学习优化模块可以使用中等质量设置，而不是高质量设置',
                impact: '预计每月节省$5.20',
                priority: 'medium',
                category: 'quality_optimization',
                implementation: {
                    effort: 'medium',
                    timeToImplement: '30分钟',
                    risks: ['可能影响学习效果']
                }
            },
            {
                id: 'implement_caching',
                title: '实施响应缓存',
                description: '对重复或相似的请求启用缓存，减少不必要的API调用',
                impact: '预计每月节省$15.80',
                priority: 'high',
                category: 'efficiency_optimization',
                implementation: {
                    effort: 'high',
                    timeToImplement: '2小时',
                    risks: ['需要额外的存储空间', '缓存失效策略复杂']
                }
            }
        ];
    }

    /**
     * 获取告警列表
     * @param {Object} filters - 过滤条件
     * @returns {Array} 告警列表
     */
    getAlerts(filters = {}) {
        let alerts = [...this.alerts];

        if (filters.severity) {
            alerts = alerts.filter(alert => alert.severity === filters.severity);
        }

        if (filters.type) {
            alerts = alerts.filter(alert => alert.type === filters.type);
        }

        if (filters.acknowledged !== undefined) {
            alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
        }

        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 确认告警
     * @param {string} alertId - 告警ID
     * @returns {Promise<Object>} 操作结果
     */
    async acknowledgeAlert(alertId) {
        try {
            const alert = this.alerts.find(a => a.id === alertId);
            
            if (!alert) {
                throw new Error(`告警 ${alertId} 不存在`);
            }

            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();

            return {
                success: true,
                alert,
                message: '告警已确认'
            };

        } catch (error) {
            console.error('确认告警失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 导出成本报告
     * @param {Object} options - 导出选项
     * @returns {Object} 成本报告
     */
    exportCostReport(options = {}) {
        const {
            format = 'json',
            period = 'current_month',
            includeDetails = true
        } = options;

        const report = {
            reportId: this.generateReportId(),
            generatedAt: new Date().toISOString(),
            period,
            summary: this.generateCostSummary(period),
            breakdown: {
                bySource: this.generateCostBreakdown('source', period),
                byTerminal: this.generateCostBreakdown('terminal', period)
            },
            trends: this.generateCostTrends(period),
            projections: this.generateCostProjections(),
            alerts: this.getAlerts({ acknowledged: false }),
            optimizationSuggestions: this.getOptimizationSuggestions()
        };

        if (includeDetails) {
            report.details = {
                config: this.config,
                costHistory: this.costHistory.slice(-100), // 最近100条记录
                efficiency: this.calculateCostEfficiency()
            };
        }

        return report;
    }

    /**
     * 生成报告ID
     * @returns {string} 报告ID
     */
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 创建全局实例
const costControlService = new CostControlService();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = costControlService;
} else {
    window.CostControlService = costControlService;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugCostControl = {
        // 模拟成本增长
        simulateCostGrowth: (days = 7) => {
            console.log(`模拟 ${days} 天的成本增长...`);
            
            for (let i = 0; i < days; i++) {
                costControlService.updateCostData();
            }
            
            const currentCosts = costControlService.getCurrentCosts();
            console.log('模拟后的成本:', currentCosts);
            return currentCosts;
        },
        
        // 触发预算告警测试
        triggerBudgetAlert: () => {
            costControlService.costData.daily.total = 45.00; // 超过告警阈值
            costControlService.checkBudgetAlerts();
            
            const alerts = costControlService.getAlerts({ acknowledged: false });
            console.log('触发的告警:', alerts);
            return alerts;
        },
        
        // 获取完整成本分析
        getFullAnalysis: async () => {
            const analysis = await costControlService.getAnalysis({
                period: 'current_month',
                groupBy: 'source',
                includeProjections: true
            });
            
            console.log('完整成本分析:', analysis);
            return analysis;
        },
        
        // 生成成本报告
        generateReport: () => {
            const report = costControlService.exportCostReport({
                format: 'json',
                period: 'current_month',
                includeDetails: true
            });
            
            console.log('成本报告:', report);
            return report;
        }
    };
}
