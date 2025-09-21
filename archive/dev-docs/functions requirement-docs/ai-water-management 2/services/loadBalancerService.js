/**
 * 负载均衡服务
 * 
 * 智能分配AI水源，根据质量、成本、性能等因素选择最优水源
 * 支持多种分配策略和故障转移机制
 */

class LoadBalancerService {
    constructor() {
        this.config = {
            globalEnabled: true,
            defaultStrategy: 'balanced',
            failoverEnabled: true,
            loadBalanceMode: 'percentage',
            providerPercentages: {
                openai: 100,
                grok: 0,
                gemini: 0
            },
            healthCheckInterval: 300000, // 5分钟
            maxRetries: 3,
            timeoutSeconds: 30,
            batchSize: 10
        };
        
        this.terminalAllocations = new Map();
        this.requestHistory = [];
        this.maxHistorySize = 1000;
        
        // 初始化终端分配
        this.initializeTerminalAllocations();
        
        // 启动负载监控
        this.startLoadMonitoring();
    }

    /**
     * 初始化终端分配配置
     */
    initializeTerminalAllocations() {
        const defaultAllocations = [
            {
                terminalId: 'data_generation',
                terminalName: '数据生成中心',
                terminalType: 'generation',
                primarySource: 'openai',
                backupSources: ['grok', 'gemini'],
                qualityRequirement: 'high',
                costPriority: 'quality_first',
                maxCostPerRequest: 0.05,
                enabled: true,
                allocation: {
                    strategy: 'quality_first',
                    fallbackChain: ['openai', 'grok', 'gemini'],
                    healthCheckInterval: 300,
                    maxRetries: 3,
                    timeoutSeconds: 30
                }
            },
            {
                terminalId: 'content_review',
                terminalName: '内容审核系统',
                terminalType: 'review',
                primarySource: 'openai',
                backupSources: ['gemini'],
                qualityRequirement: 'high',
                costPriority: 'balanced',
                maxCostPerRequest: 0.02,
                enabled: true,
                allocation: {
                    strategy: 'balanced',
                    fallbackChain: ['openai', 'gemini'],
                    healthCheckInterval: 180,
                    maxRetries: 2,
                    timeoutSeconds: 20
                }
            },
            {
                terminalId: 'ai_learning',
                terminalName: 'AI学习优化',
                terminalType: 'learning',
                primarySource: 'openai',
                backupSources: ['gemini'],
                qualityRequirement: 'medium',
                costPriority: 'cost_first',
                maxCostPerRequest: 0.01,
                enabled: true,
                allocation: {
                    strategy: 'cost_first',
                    fallbackChain: ['gemini', 'openai'],
                    healthCheckInterval: 600,
                    maxRetries: 1,
                    timeoutSeconds: 15
                }
            }
        ];

        defaultAllocations.forEach(allocation => {
            this.terminalAllocations.set(allocation.terminalId, allocation);
        });

        console.log(`初始化了 ${defaultAllocations.length} 个终端分配`);
    }

    /**
     * 获取最佳水源
     * @param {Object} requirements - 需求参数
     * @returns {Promise<Object>} 最佳水源
     */
    async getBestSource(requirements = {}) {
        try {
            const {
                terminalType = 'generation',
                qualityRequirement = 'medium',
                costPriority = 'balanced',
                maxCostPerRequest = 0.03,
                excludeSources = []
            } = requirements;

            // 获取可用水源
            const availableSources = await this.getAvailableSources(excludeSources);
            
            if (availableSources.length === 0) {
                throw new Error('没有可用的水源');
            }

            // 根据策略选择最佳水源
            const bestSource = await this.selectBestSource(
                availableSources,
                costPriority,
                qualityRequirement,
                maxCostPerRequest
            );

            // 记录请求历史
            this.recordRequest({
                terminalType,
                selectedSource: bestSource.id,
                strategy: costPriority,
                timestamp: Date.now()
            });

            console.log(`为终端类型 ${terminalType} 选择了水源: ${bestSource.id}`);

            return {
                success: true,
                source: bestSource,
                reason: this.getSelectionReason(bestSource, costPriority)
            };

        } catch (error) {
            console.error('获取最佳水源失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取可用水源列表
     * @param {Array} excludeSources - 排除的水源ID列表
     * @returns {Promise<Array>} 可用水源列表
     */
    async getAvailableSources(excludeSources = []) {
        // 这里应该从WaterSourceService获取水源列表
        // 为了演示，使用模拟数据
        const allSources = [
            {
                id: 'openai',
                name: 'OpenAI GPT-4',
                status: 'active',
                health: {
                    responseTime: 500,
                    successRate: 98.5,
                    uptime: 99.9
                },
                config: {
                    costPerToken: 0.000030,
                    maxConcurrent: 10,
                    rateLimit: 60
                },
                currentLoad: 0.3 // 30%负载
            },
            {
                id: 'grok',
                name: 'Grok AI',
                status: 'inactive',
                health: {
                    responseTime: 0,
                    successRate: 0,
                    uptime: 0
                },
                config: {
                    costPerToken: 0.000020,
                    maxConcurrent: 5,
                    rateLimit: 30
                },
                currentLoad: 0
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                status: 'inactive',
                health: {
                    responseTime: 0,
                    successRate: 0,
                    uptime: 0
                },
                config: {
                    costPerToken: 0.000025,
                    maxConcurrent: 8,
                    rateLimit: 40
                },
                currentLoad: 0
            }
        ];

        // 过滤可用水源
        return allSources.filter(source => 
            source.status === 'active' && 
            !excludeSources.includes(source.id) &&
            source.currentLoad < 0.9 // 负载不超过90%
        );
    }

    /**
     * 选择最佳水源
     * @param {Array} sources - 可用水源列表
     * @param {string} strategy - 选择策略
     * @param {string} qualityRequirement - 质量要求
     * @param {number} maxCost - 最大成本
     * @returns {Object} 最佳水源
     */
    async selectBestSource(sources, strategy, qualityRequirement, maxCost) {
        // 过滤符合成本要求的水源
        const affordableSources = sources.filter(source => 
            source.config.costPerToken <= maxCost / 1000 // 假设平均1000个token
        );

        if (affordableSources.length === 0) {
            throw new Error('没有符合成本要求的水源');
        }

        let selectedSource;

        switch (strategy) {
            case 'quality_first':
                selectedSource = this.selectByQuality(affordableSources, qualityRequirement);
                break;
            case 'cost_first':
                selectedSource = this.selectByCost(affordableSources);
                break;
            case 'balanced':
                selectedSource = this.selectBalanced(affordableSources, qualityRequirement);
                break;
            default:
                selectedSource = affordableSources[0];
        }

        return selectedSource;
    }

    /**
     * 按质量选择水源
     * @param {Array} sources - 水源列表
     * @param {string} qualityRequirement - 质量要求
     * @returns {Object} 选中的水源
     */
    selectByQuality(sources, qualityRequirement) {
        // 计算质量分数
        const sourcesWithScore = sources.map(source => ({
            ...source,
            qualityScore: this.calculateQualityScore(source, qualityRequirement)
        }));

        // 按质量分数排序
        sourcesWithScore.sort((a, b) => b.qualityScore - a.qualityScore);

        return sourcesWithScore[0];
    }

    /**
     * 按成本选择水源
     * @param {Array} sources - 水源列表
     * @returns {Object} 选中的水源
     */
    selectByCost(sources) {
        // 按成本排序（从低到高）
        const sortedSources = [...sources].sort((a, b) => 
            a.config.costPerToken - b.config.costPerToken
        );

        return sortedSources[0];
    }

    /**
     * 平衡选择水源
     * @param {Array} sources - 水源列表
     * @param {string} qualityRequirement - 质量要求
     * @returns {Object} 选中的水源
     */
    selectBalanced(sources, qualityRequirement) {
        // 计算综合分数（质量 + 成本 + 性能）
        const sourcesWithScore = sources.map(source => ({
            ...source,
            balancedScore: this.calculateBalancedScore(source, qualityRequirement)
        }));

        // 按综合分数排序
        sourcesWithScore.sort((a, b) => b.balancedScore - a.balancedScore);

        return sourcesWithScore[0];
    }

    /**
     * 计算质量分数
     * @param {Object} source - 水源对象
     * @param {string} qualityRequirement - 质量要求
     * @returns {number} 质量分数
     */
    calculateQualityScore(source, qualityRequirement) {
        const { health } = source;
        
        // 基础分数
        let score = 0;
        
        // 成功率权重 (40%)
        score += (health.successRate / 100) * 40;
        
        // 响应时间权重 (30%) - 响应时间越低分数越高
        const responseTimeScore = Math.max(0, (5000 - health.responseTime) / 5000);
        score += responseTimeScore * 30;
        
        // 运行时间权重 (20%)
        score += (health.uptime / 100) * 20;
        
        // 负载权重 (10%) - 负载越低分数越高
        score += (1 - source.currentLoad) * 10;
        
        // 质量要求调整
        const qualityMultiplier = {
            low: 0.8,
            medium: 1.0,
            high: 1.2,
            premium: 1.5
        };
        
        score *= qualityMultiplier[qualityRequirement] || 1.0;
        
        return Math.round(score * 10) / 10;
    }

    /**
     * 计算平衡分数
     * @param {Object} source - 水源对象
     * @param {string} qualityRequirement - 质量要求
     * @returns {number} 平衡分数
     */
    calculateBalancedScore(source, qualityRequirement) {
        // 质量分数 (50%)
        const qualityScore = this.calculateQualityScore(source, qualityRequirement) * 0.5;
        
        // 成本分数 (30%) - 成本越低分数越高
        const maxCost = 0.000050; // 假设最大成本
        const costScore = Math.max(0, (maxCost - source.config.costPerToken) / maxCost) * 30;
        
        // 性能分数 (20%)
        const performanceScore = (source.config.maxConcurrent / 20) * 20; // 假设最大并发20
        
        return Math.round((qualityScore + costScore + performanceScore) * 10) / 10;
    }

    /**
     * 获取选择原因
     * @param {Object} source - 选中的水源
     * @param {string} strategy - 选择策略
     * @returns {string} 选择原因
     */
    getSelectionReason(source, strategy) {
        const reasons = {
            quality_first: `选择 ${source.name}，因为其质量评分最高 (成功率: ${source.health.successRate}%, 响应时间: ${source.health.responseTime}ms)`,
            cost_first: `选择 ${source.name}，因为其成本最低 (每Token: $${source.config.costPerToken})`,
            balanced: `选择 ${source.name}，因为其综合评分最高 (平衡质量、成本和性能)`
        };
        
        return reasons[strategy] || `选择 ${source.name}`;
    }

    /**
     * 获取当前水源
     * @param {string} terminalType - 终端类型
     * @returns {Promise<Object>} 当前水源
     */
    async getCurrentSource(terminalType) {
        const allocation = this.terminalAllocations.get(`${terminalType}_terminal`) || 
                          this.terminalAllocations.get('data_generation');
        
        if (!allocation) {
            throw new Error(`未找到终端类型 ${terminalType} 的分配配置`);
        }

        // 检查主要水源是否可用
        const primarySource = await this.checkSourceAvailability(allocation.primarySource);
        
        if (primarySource.available) {
            return {
                id: allocation.primarySource,
                name: primarySource.name,
                type: 'primary'
            };
        }

        // 尝试备用水源
        for (const backupId of allocation.backupSources) {
            const backupSource = await this.checkSourceAvailability(backupId);
            if (backupSource.available) {
                return {
                    id: backupId,
                    name: backupSource.name,
                    type: 'backup'
                };
            }
        }

        throw new Error(`终端类型 ${terminalType} 没有可用的水源`);
    }

    /**
     * 检查水源可用性
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 可用性检查结果
     */
    async checkSourceAvailability(sourceId) {
        // 这里应该调用WaterSourceService检查水源状态
        // 为了演示，使用模拟数据
        const sourceStatus = {
            openai: { available: true, name: 'OpenAI GPT-4' },
            grok: { available: false, name: 'Grok AI' },
            gemini: { available: false, name: 'Google Gemini' }
        };

        return sourceStatus[sourceId] || { available: false, name: 'Unknown' };
    }

    /**
     * 更新全局策略
     * @param {string} strategy - 新策略
     * @returns {Promise<Object>} 操作结果
     */
    async updateGlobalStrategy(strategy) {
        try {
            const validStrategies = ['quality_first', 'cost_first', 'balanced', 'custom'];
            
            if (!validStrategies.includes(strategy)) {
                throw new Error(`无效的策略: ${strategy}`);
            }

            this.config.defaultStrategy = strategy;

            // 更新所有终端分配的策略
            for (const [terminalId, allocation] of this.terminalAllocations) {
                allocation.allocation.strategy = strategy;
            }

            console.log(`全局策略已更新为: ${strategy}`);

            return {
                success: true,
                strategy,
                message: `全局策略已更新为: ${strategy}`
            };

        } catch (error) {
            console.error('更新全局策略失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 更新全局配置
     * @param {Object} newConfig - 新配置
     * @returns {Promise<Object>} 操作结果
     */
    async updateGlobalConfig(newConfig) {
        try {
            this.config = {
                ...this.config,
                ...newConfig,
                updatedAt: new Date().toISOString()
            };

            console.log('全局配置已更新:', newConfig);

            return {
                success: true,
                config: this.config,
                message: '全局配置已更新'
            };

        } catch (error) {
            console.error('更新全局配置失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取所有终端分配
     * @returns {Promise<Array>} 终端分配列表
     */
    async getAllocations() {
        return Array.from(this.terminalAllocations.values());
    }

    /**
     * 更新终端分配
     * @param {string} terminalId - 终端ID
     * @param {Object} updates - 更新内容
     * @returns {Promise<Object>} 操作结果
     */
    async updateAllocation(terminalId, updates) {
        try {
            const allocation = this.terminalAllocations.get(terminalId);
            
            if (!allocation) {
                throw new Error(`终端 ${terminalId} 不存在`);
            }

            const updatedAllocation = {
                ...allocation,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            this.terminalAllocations.set(terminalId, updatedAllocation);

            console.log(`终端 ${terminalId} 分配已更新`);

            return {
                success: true,
                allocation: updatedAllocation,
                message: `终端 ${terminalId} 分配已更新`
            };

        } catch (error) {
            console.error('更新终端分配失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取负载分布
     * @returns {Promise<Object>} 负载分布
     */
    async getLoadDistribution() {
        const recentRequests = this.requestHistory.slice(-100); // 最近100个请求
        
        const distribution = {};
        recentRequests.forEach(request => {
            distribution[request.selectedSource] = (distribution[request.selectedSource] || 0) + 1;
        });

        // 计算百分比
        const total = recentRequests.length;
        const percentageDistribution = {};
        
        Object.keys(distribution).forEach(sourceId => {
            percentageDistribution[sourceId] = Math.round((distribution[sourceId] / total) * 100);
        });

        return {
            absolute: distribution,
            percentage: percentageDistribution,
            totalRequests: total,
            timeWindow: '最近100个请求'
        };
    }

    /**
     * 记录请求
     * @param {Object} requestData - 请求数据
     */
    recordRequest(requestData) {
        this.requestHistory.push({
            ...requestData,
            id: this.generateRequestId()
        });

        // 保持历史记录大小限制
        if (this.requestHistory.length > this.maxHistorySize) {
            this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * 生成请求ID
     * @returns {string} 请求ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 启动负载监控
     */
    startLoadMonitoring() {
        // 定期清理过期的请求历史
        setInterval(() => {
            const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
            this.requestHistory = this.requestHistory.filter(req => req.timestamp > cutoffTime);
        }, 60 * 60 * 1000); // 每小时清理一次

        console.log('负载监控已启动');
    }

    /**
     * 获取配置
     * @returns {Object} 当前配置
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 重置负载均衡器
     * @returns {Promise<Object>} 操作结果
     */
    async reset() {
        try {
            // 清空请求历史
            this.requestHistory = [];
            
            // 重置配置为默认值
            this.config = {
                globalEnabled: true,
                defaultStrategy: 'balanced',
                failoverEnabled: true,
                loadBalanceMode: 'percentage',
                providerPercentages: {
                    openai: 100,
                    grok: 0,
                    gemini: 0
                },
                healthCheckInterval: 300000,
                maxRetries: 3,
                timeoutSeconds: 30,
                batchSize: 10
            };

            // 重新初始化终端分配
            this.terminalAllocations.clear();
            this.initializeTerminalAllocations();

            console.log('负载均衡器已重置');

            return {
                success: true,
                message: '负载均衡器已重置'
            };

        } catch (error) {
            console.error('重置负载均衡器失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const recentRequests = this.requestHistory.slice(-100);
        const strategies = {};
        const terminals = {};

        recentRequests.forEach(request => {
            strategies[request.strategy] = (strategies[request.strategy] || 0) + 1;
            terminals[request.terminalType] = (terminals[request.terminalType] || 0) + 1;
        });

        return {
            totalRequests: this.requestHistory.length,
            recentRequests: recentRequests.length,
            strategyDistribution: strategies,
            terminalDistribution: terminals,
            averageRequestsPerHour: this.calculateAverageRequestsPerHour(),
            lastRequestTime: this.requestHistory.length > 0 ? 
                new Date(this.requestHistory[this.requestHistory.length - 1].timestamp).toISOString() : 
                null
        };
    }

    /**
     * 计算每小时平均请求数
     * @returns {number} 每小时平均请求数
     */
    calculateAverageRequestsPerHour() {
        if (this.requestHistory.length === 0) return 0;

        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentRequests = this.requestHistory.filter(req => req.timestamp > oneHourAgo);
        
        return recentRequests.length;
    }
}

// 创建全局实例
const loadBalancerService = new LoadBalancerService();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = loadBalancerService;
} else {
    window.LoadBalancerService = loadBalancerService;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugLoadBalancer = {
        // 测试负载均衡算法
        testLoadBalancing: async (requestCount = 50) => {
            console.log(`测试负载均衡算法，发送 ${requestCount} 个请求...`);
            
            const results = [];
            const strategies = ['quality_first', 'cost_first', 'balanced'];
            
            for (let i = 0; i < requestCount; i++) {
                const strategy = strategies[i % strategies.length];
                const result = await loadBalancerService.getBestSource({
                    terminalType: 'generation',
                    costPriority: strategy,
                    qualityRequirement: 'medium'
                });
                
                results.push({
                    requestId: i + 1,
                    strategy,
                    selectedSource: result.source?.id,
                    success: result.success
                });
            }
            
            // 统计结果
            const distribution = {};
            results.forEach(result => {
                if (result.selectedSource) {
                    distribution[result.selectedSource] = (distribution[result.selectedSource] || 0) + 1;
                }
            });
            
            const testResult = {
                totalRequests: requestCount,
                distribution,
                percentageDistribution: {},
                successRate: (results.filter(r => r.success).length / requestCount) * 100
            };
            
            // 计算百分比分布
            Object.keys(distribution).forEach(sourceId => {
                testResult.percentageDistribution[sourceId] = 
                    Math.round((distribution[sourceId] / requestCount) * 100);
            });
            
            console.log('负载均衡测试结果:', testResult);
            return testResult;
        },
        
        // 获取系统状态
        getSystemStatus: () => {
            const config = loadBalancerService.getConfig();
            const statistics = loadBalancerService.getStatistics();
            const loadDistribution = loadBalancerService.getLoadDistribution();
            
            const status = {
                config,
                statistics,
                loadDistribution,
                timestamp: new Date().toISOString()
            };
            
            console.log('负载均衡系统状态:', status);
            return status;
        },
        
        // 模拟不同策略的性能
        compareStrategies: async () => {
            const strategies = ['quality_first', 'cost_first', 'balanced'];
            const results = {};
            
            for (const strategy of strategies) {
                const startTime = Date.now();
                const testResults = [];
                
                for (let i = 0; i < 20; i++) {
                    const result = await loadBalancerService.getBestSource({
                        terminalType: 'generation',
                        costPriority: strategy,
                        qualityRequirement: 'medium'
                    });
                    testResults.push(result);
                }
                
                const duration = Date.now() - startTime;
                const successCount = testResults.filter(r => r.success).length;
                
                results[strategy] = {
                    totalRequests: 20,
                    successCount,
                    successRate: (successCount / 20) * 100,
                    averageResponseTime: duration / 20,
                    selectedSources: testResults
                        .filter(r => r.success)
                        .map(r => r.source?.id)
                        .reduce((acc, sourceId) => {
                            acc[sourceId] = (acc[sourceId] || 0) + 1;
                            return acc;
                        }, {})
                };
            }
            
            console.log('策略性能对比:', results);
            return results;
        }
    };
}
