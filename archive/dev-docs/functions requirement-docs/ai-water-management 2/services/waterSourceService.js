/**
 * 水源管理服务
 * 
 * 管理AI提供商水源的配置、连接、监控和状态管理
 * 提供统一的水源操作接口
 */

class WaterSourceService {
    constructor() {
        this.sources = new Map();
        this.adapters = new Map();
        this.defaultConfig = {
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            healthCheckInterval: 300000 // 5分钟
        };
        
        // 初始化默认水源
        this.initializeDefaultSources();
        
        // 注册默认适配器
        this.registerDefaultAdapters();
    }

    /**
     * 初始化默认水源配置
     */
    initializeDefaultSources() {
        const defaultSources = [
            {
                id: 'openai',
                name: 'OpenAI GPT-4',
                type: 'primary',
                status: 'active',
                config: {
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    model: 'gpt-4',
                    thinkingModel: 'gpt-4-turbo',
                    maxConcurrent: 10,
                    rateLimit: 60,
                    costPerToken: 0.000030,
                    timeout: 30000
                },
                health: {
                    lastCheck: new Date().toISOString(),
                    responseTime: 500,
                    successRate: 98.5,
                    errorCount: 0,
                    uptime: 99.9
                },
                usage: {
                    requestsToday: 150,
                    tokensUsed: 75000,
                    costToday: 2.45,
                    lastUsed: new Date().toISOString()
                }
            },
            {
                id: 'grok',
                name: 'Grok AI',
                type: 'backup',
                status: 'inactive',
                config: {
                    endpoint: 'https://api.x.ai/v1/chat/completions',
                    model: 'grok-beta',
                    maxConcurrent: 5,
                    rateLimit: 30,
                    costPerToken: 0.000020,
                    timeout: 30000
                },
                health: {
                    lastCheck: new Date().toISOString(),
                    responseTime: 0,
                    successRate: 0,
                    errorCount: 5,
                    uptime: 0
                },
                usage: {
                    requestsToday: 0,
                    tokensUsed: 0,
                    costToday: 0,
                    lastUsed: 'never'
                }
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                type: 'secondary',
                status: 'inactive',
                config: {
                    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
                    model: 'gemini-pro',
                    maxConcurrent: 8,
                    rateLimit: 40,
                    costPerToken: 0.000025,
                    timeout: 30000
                },
                health: {
                    lastCheck: new Date().toISOString(),
                    responseTime: 0,
                    successRate: 0,
                    errorCount: 0,
                    uptime: 0
                },
                usage: {
                    requestsToday: 0,
                    tokensUsed: 0,
                    costToday: 0,
                    lastUsed: 'never'
                }
            }
        ];

        defaultSources.forEach(source => {
            this.sources.set(source.id, source);
        });

        console.log(`初始化了 ${defaultSources.length} 个默认水源`);
    }

    /**
     * 注册默认适配器
     */
    registerDefaultAdapters() {
        // OpenAI适配器
        this.adapters.set('openai', {
            makeRequest: async (prompt, options = {}) => {
                const response = await fetch(options.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${options.apiKey}`
                    },
                    body: JSON.stringify({
                        model: options.model || 'gpt-4',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: options.maxTokens || 1000,
                        temperature: options.temperature || 0.7
                    })
                });
                return response.json();
            },
            parseResponse: (response) => {
                return {
                    content: response.choices?.[0]?.message?.content || '',
                    usage: response.usage || {},
                    model: response.model || ''
                };
            }
        });

        // Grok适配器
        this.adapters.set('grok', {
            makeRequest: async (prompt, options = {}) => {
                const response = await fetch(options.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${options.apiKey}`
                    },
                    body: JSON.stringify({
                        model: options.model || 'grok-beta',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: options.maxTokens || 1000,
                        temperature: options.temperature || 0.7
                    })
                });
                return response.json();
            },
            parseResponse: (response) => {
                return {
                    content: response.choices?.[0]?.message?.content || '',
                    usage: response.usage || {},
                    model: response.model || ''
                };
            }
        });

        // Gemini适配器
        this.adapters.set('gemini', {
            makeRequest: async (prompt, options = {}) => {
                const response = await fetch(options.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': options.apiKey
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            maxOutputTokens: options.maxTokens || 1000,
                            temperature: options.temperature || 0.7
                        }
                    })
                });
                return response.json();
            },
            parseResponse: (response) => {
                return {
                    content: response.candidates?.[0]?.content?.parts?.[0]?.text || '',
                    usage: response.usageMetadata || {},
                    model: 'gemini-pro'
                };
            }
        });

        console.log(`注册了 ${this.adapters.size} 个适配器`);
    }

    /**
     * 获取所有水源
     * @returns {Promise<Array>} 水源列表
     */
    async getAllSources() {
        return Array.from(this.sources.values());
    }

    /**
     * 根据ID获取水源
     * @param {string} sourceId - 水源ID
     * @returns {Object|null} 水源对象
     */
    getSource(sourceId) {
        return this.sources.get(sourceId) || null;
    }

    /**
     * 添加新水源
     * @param {Object} sourceConfig - 水源配置
     * @returns {Promise<Object>} 操作结果
     */
    async addSource(sourceConfig) {
        try {
            // 验证配置
            const validation = this.validateSourceConfig(sourceConfig);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: `配置验证失败: ${validation.errors.join(', ')}`
                };
            }

            // 检查ID是否已存在
            if (this.sources.has(sourceConfig.id)) {
                return {
                    success: false,
                    error: `水源ID ${sourceConfig.id} 已存在`
                };
            }

            // 创建完整的水源对象
            const source = {
                ...sourceConfig,
                status: 'inactive',
                health: {
                    lastCheck: new Date().toISOString(),
                    responseTime: 0,
                    successRate: 0,
                    errorCount: 0,
                    uptime: 0
                },
                usage: {
                    requestsToday: 0,
                    tokensUsed: 0,
                    costToday: 0,
                    lastUsed: 'never'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 添加到水源列表
            this.sources.set(sourceConfig.id, source);

            console.log(`水源 ${sourceConfig.id} 添加成功`);

            return {
                success: true,
                data: source
            };

        } catch (error) {
            console.error('添加水源失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 更新水源配置
     * @param {string} sourceId - 水源ID
     * @param {Object} updates - 更新内容
     * @returns {Promise<Object>} 操作结果
     */
    async updateSource(sourceId, updates) {
        try {
            const source = this.sources.get(sourceId);
            if (!source) {
                return {
                    success: false,
                    error: `水源 ${sourceId} 不存在`
                };
            }

            // 合并更新
            const updatedSource = {
                ...source,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // 验证更新后的配置
            const validation = this.validateSourceConfig(updatedSource);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: `配置验证失败: ${validation.errors.join(', ')}`
                };
            }

            // 更新水源
            this.sources.set(sourceId, updatedSource);

            console.log(`水源 ${sourceId} 更新成功`);

            return {
                success: true,
                data: updatedSource
            };

        } catch (error) {
            console.error('更新水源失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 删除水源
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 操作结果
     */
    async removeSource(sourceId) {
        try {
            const source = this.sources.get(sourceId);
            if (!source) {
                return {
                    success: false,
                    error: `水源 ${sourceId} 不存在`
                };
            }

            // 检查是否为主要水源
            if (source.type === 'primary') {
                return {
                    success: false,
                    error: '不能删除主要水源'
                };
            }

            // 删除水源
            this.sources.delete(sourceId);

            console.log(`水源 ${sourceId} 删除成功`);

            return {
                success: true,
                message: `水源 ${sourceId} 已删除`
            };

        } catch (error) {
            console.error('删除水源失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 测试水源连接
     * @param {string|Object} sourceIdOrConfig - 水源ID或配置对象
     * @returns {Promise<Object>} 测试结果
     */
    async testConnection(sourceIdOrConfig) {
        try {
            let source;
            
            if (typeof sourceIdOrConfig === 'string') {
                source = this.sources.get(sourceIdOrConfig);
                if (!source) {
                    return {
                        success: false,
                        error: `水源 ${sourceIdOrConfig} 不存在`
                    };
                }
            } else {
                source = sourceIdOrConfig;
            }

            const adapter = this.adapters.get(source.id);
            if (!adapter) {
                return {
                    success: false,
                    error: `水源 ${source.id} 没有对应的适配器`
                };
            }

            const startTime = Date.now();
            
            // 发送测试请求
            const testPrompt = 'Hello, this is a connection test.';
            const response = await Promise.race([
                adapter.makeRequest(testPrompt, {
                    ...source.config,
                    maxTokens: 10
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('连接超时')), source.config.timeout || 30000)
                )
            ]);

            const responseTime = Date.now() - startTime;

            // 检查响应
            if (response.error) {
                throw new Error(response.error.message || '请求失败');
            }

            const parsedResponse = adapter.parseResponse(response);
            
            // 更新健康状态
            if (typeof sourceIdOrConfig === 'string') {
                this.updateHealthStatus(source.id, {
                    responseTime,
                    success: true,
                    lastCheck: new Date().toISOString()
                });
            }

            return {
                success: true,
                responseTime,
                response: parsedResponse,
                message: '连接测试成功'
            };

        } catch (error) {
            console.error('连接测试失败:', error);
            
            // 更新健康状态
            if (typeof sourceIdOrConfig === 'string') {
                this.updateHealthStatus(sourceIdOrConfig, {
                    responseTime: 0,
                    success: false,
                    error: error.message,
                    lastCheck: new Date().toISOString()
                });
            }

            return {
                success: false,
                error: error.message,
                responseTime: 0
            };
        }
    }

    /**
     * 更新健康状态
     * @param {string} sourceId - 水源ID
     * @param {Object} healthData - 健康数据
     */
    updateHealthStatus(sourceId, healthData) {
        const source = this.sources.get(sourceId);
        if (!source) return;

        const currentHealth = source.health || {};
        
        // 计算成功率
        let successRate = currentHealth.successRate || 0;
        if (healthData.success !== undefined) {
            const totalChecks = (currentHealth.totalChecks || 0) + 1;
            const successCount = Math.round((successRate / 100) * (totalChecks - 1)) + (healthData.success ? 1 : 0);
            successRate = (successCount / totalChecks) * 100;
            
            source.health.totalChecks = totalChecks;
        }

        // 更新健康状态
        source.health = {
            ...currentHealth,
            lastCheck: healthData.lastCheck || new Date().toISOString(),
            responseTime: healthData.responseTime || currentHealth.responseTime || 0,
            successRate: Math.round(successRate * 10) / 10,
            errorCount: healthData.success === false ? 
                (currentHealth.errorCount || 0) + 1 : 
                (currentHealth.errorCount || 0),
            uptime: successRate
        };

        // 更新状态
        if (healthData.success === true) {
            source.status = 'active';
        } else if (healthData.success === false) {
            source.status = 'error';
        }

        console.log(`水源 ${sourceId} 健康状态已更新:`, source.health);
    }

    /**
     * 获取系统状态
     * @returns {Promise<Object>} 系统状态
     */
    async getSystemStatus() {
        const sources = Array.from(this.sources.values());
        const activeSources = sources.filter(s => s.status === 'active').length;
        const totalSources = sources.length;
        
        // 计算今日统计
        const todayRequests = sources.reduce((sum, s) => sum + (s.usage?.requestsToday || 0), 0);
        const todayCost = sources.reduce((sum, s) => sum + (s.usage?.costToday || 0), 0);
        
        // 计算系统健康度
        const avgHealth = sources.reduce((sum, s) => sum + (s.health?.successRate || 0), 0) / totalSources;

        return {
            activeSources,
            totalSources,
            todayRequests,
            todayCost,
            systemHealth: Math.round(avgHealth * 10) / 10,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 获取水源统计
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 水源统计
     */
    async getSourceStats(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source) {
            throw new Error(`水源 ${sourceId} 不存在`);
        }

        return {
            id: source.id,
            name: source.name,
            status: source.status,
            health: source.health,
            usage: source.usage,
            config: {
                type: source.type,
                model: source.config?.model,
                maxConcurrent: source.config?.maxConcurrent,
                rateLimit: source.config?.rateLimit,
                costPerToken: source.config?.costPerToken
            }
        };
    }

    /**
     * 验证水源配置
     * @param {Object} config - 水源配置
     * @returns {Object} 验证结果
     */
    validateSourceConfig(config) {
        const errors = [];

        // 必填字段检查
        if (!config.id) errors.push('缺少水源ID');
        if (!config.name) errors.push('缺少水源名称');
        if (!config.type) errors.push('缺少水源类型');

        // 配置检查
        if (!config.config) {
            errors.push('缺少配置信息');
        } else {
            if (!config.config.endpoint) errors.push('缺少API端点');
            if (!config.config.model) errors.push('缺少AI模型');
        }

        // 类型检查
        const validTypes = ['primary', 'backup', 'secondary', 'emergency'];
        if (config.type && !validTypes.includes(config.type)) {
            errors.push(`无效的水源类型: ${config.type}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 注册适配器
     * @param {string} sourceId - 水源ID
     * @param {Object} adapter - 适配器对象
     */
    registerAdapter(sourceId, adapter) {
        this.adapters.set(sourceId, adapter);
        console.log(`适配器 ${sourceId} 注册成功`);
    }

    /**
     * 模拟故障
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 操作结果
     */
    async simulateFailure(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source) {
            return {
                success: false,
                error: `水源 ${sourceId} 不存在`
            };
        }

        source.status = 'error';
        source.health.errorCount = (source.health.errorCount || 0) + 1;
        source.health.successRate = 0;
        source.health.uptime = 0;

        console.log(`水源 ${sourceId} 故障模拟已启动`);

        return {
            success: true,
            message: `水源 ${sourceId} 故障模拟已启动`
        };
    }

    /**
     * 恢复服务
     * @param {string} sourceId - 水源ID
     * @returns {Promise<Object>} 操作结果
     */
    async restoreService(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source) {
            return {
                success: false,
                error: `水源 ${sourceId} 不存在`
            };
        }

        source.status = 'active';
        source.health.errorCount = 0;
        source.health.successRate = 98.5;
        source.health.uptime = 99.9;
        source.health.lastCheck = new Date().toISOString();

        console.log(`水源 ${sourceId} 服务已恢复`);

        return {
            success: true,
            message: `水源 ${sourceId} 服务已恢复`
        };
    }

    /**
     * 导出配置
     * @returns {Object} 配置数据
     */
    exportConfig() {
        const sources = Array.from(this.sources.values());
        return {
            sources: sources.map(source => ({
                ...source,
                config: {
                    ...source.config,
                    apiKey: '***' // 隐藏敏感信息
                }
            })),
            exportTime: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * 导入配置
     * @param {Object} configData - 配置数据
     * @returns {Promise<Object>} 操作结果
     */
    async importConfig(configData) {
        try {
            if (!configData.sources || !Array.isArray(configData.sources)) {
                throw new Error('无效的配置数据格式');
            }

            let importedCount = 0;
            const errors = [];

            for (const sourceConfig of configData.sources) {
                try {
                    const result = await this.addSource(sourceConfig);
                    if (result.success) {
                        importedCount++;
                    } else {
                        errors.push(`${sourceConfig.id}: ${result.error}`);
                    }
                } catch (error) {
                    errors.push(`${sourceConfig.id}: ${error.message}`);
                }
            }

            return {
                success: true,
                imported: importedCount,
                total: configData.sources.length,
                errors
            };

        } catch (error) {
            console.error('导入配置失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 创建全局实例
const waterSourceService = new WaterSourceService();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = waterSourceService;
} else {
    window.WaterSourceService = waterSourceService;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugWaterSource = {
        // 测试所有水源连接
        testAllConnections: async () => {
            const sources = await waterSourceService.getAllSources();
            const results = [];
            
            for (const source of sources) {
                const result = await waterSourceService.testConnection(source.id);
                results.push({
                    sourceId: source.id,
                    name: source.name,
                    success: result.success,
                    responseTime: result.responseTime,
                    error: result.error
                });
            }
            
            console.log('所有水源连接测试结果:', results);
            return results;
        },
        
        // 获取系统概览
        getSystemOverview: async () => {
            const status = await waterSourceService.getSystemStatus();
            const sources = await waterSourceService.getAllSources();
            
            const overview = {
                systemStatus: status,
                sourceDetails: sources.map(s => ({
                    id: s.id,
                    name: s.name,
                    status: s.status,
                    health: s.health,
                    usage: s.usage
                }))
            };
            
            console.log('系统概览:', overview);
            return overview;
        },
        
        // 模拟负载测试
        simulateLoad: async (sourceId, requestCount = 10) => {
            console.log(`开始对水源 ${sourceId} 进行负载测试...`);
            
            const results = [];
            const startTime = Date.now();
            
            for (let i = 0; i < requestCount; i++) {
                const result = await waterSourceService.testConnection(sourceId);
                results.push(result);
                
                // 等待一下避免过于频繁
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const totalTime = Date.now() - startTime;
            const successCount = results.filter(r => r.success).length;
            const avgResponseTime = results
                .filter(r => r.success)
                .reduce((sum, r) => sum + r.responseTime, 0) / successCount;
            
            const loadTestResult = {
                sourceId,
                requestCount,
                successCount,
                successRate: (successCount / requestCount) * 100,
                avgResponseTime: Math.round(avgResponseTime),
                totalTime,
                throughput: Math.round((requestCount / totalTime) * 1000)
            };
            
            console.log('负载测试结果:', loadTestResult);
            return loadTestResult;
        }
    };
}
