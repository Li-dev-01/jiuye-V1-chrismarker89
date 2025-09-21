/**
 * AI水源与水管管理面板交互逻辑
 * 
 * 功能特性：
 * - 水源管理和监控
 * - 智能分配策略
 * - 负载均衡控制
 * - 成本监控和优化
 * - 故障转移管理
 */

class AIWaterManagementPanel {
    constructor(options = {}) {
        this.container = options.container || '#ai-water-management-container';
        this.config = {
            autoHealthCheck: true,
            healthCheckInterval: 300000, // 5分钟
            enableCostControl: true,
            enableFailover: true,
            ...options.config
        };
        
        // 回调函数
        this.onWaterSourceChange = options.onWaterSourceChange || (() => {});
        this.onCostAlert = options.onCostAlert || (() => {});
        this.onFailover = options.onFailover || (() => {});
        this.onError = options.onError || (() => {});
        
        // 状态管理
        this.currentTab = 'water-factory';
        this.waterSources = new Map();
        this.terminalAllocations = new Map();
        this.systemStatus = {
            globalEnabled: true,
            activeSources: 1,
            totalSources: 3,
            todayRequests: 150,
            todayCost: 2.45,
            systemHealth: 98.5
        };
        
        // 服务实例
        this.waterSourceService = new WaterSourceService();
        this.loadBalancerService = new LoadBalancerService();
        this.costControlService = new CostControlService();
        this.healthChecker = new HealthChecker();
        this.performanceMonitor = new PerformanceMonitor();
        this.failoverManager = new FailoverManager();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadWaterSources();
        this.loadTerminalAllocations();
        this.loadSystemStatus();
        this.startHealthMonitoring();
        
        console.log('💧 AI水源与水管管理面板已初始化');
    }
    
    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // 头部操作按钮
        document.getElementById('health-check-btn')?.addEventListener('click', () => {
            this.performHealthCheck();
        });
        
        document.getElementById('refresh-status-btn')?.addEventListener('click', () => {
            this.refreshSystemStatus();
        });
        
        // 水源管理事件
        this.bindWaterSourceEvents();
        
        // 分配策略事件
        this.bindAllocationEvents();
        
        // 成本控制事件
        this.bindCostControlEvents();
        
        // 模态框事件
        this.bindModalEvents();
    }
    
    bindWaterSourceEvents() {
        // 添加水源按钮
        document.getElementById('add-source-btn')?.addEventListener('click', () => {
            this.showAddSourceModal();
        });
        
        // 测试并添加水源
        document.getElementById('test-and-add-source')?.addEventListener('click', async () => {
            await this.testAndAddSource();
        });
    }
    
    bindAllocationEvents() {
        // 全局策略变更
        document.getElementById('global-strategy')?.addEventListener('change', (e) => {
            this.updateGlobalStrategy(e.target.value);
        });
        
        // 故障转移开关
        document.getElementById('failover-enabled')?.addEventListener('change', (e) => {
            this.toggleFailover(e.target.checked);
        });
        
        // 健康检查间隔
        document.getElementById('health-check-interval')?.addEventListener('change', (e) => {
            this.updateHealthCheckInterval(parseInt(e.target.value));
        });
    }
    
    bindCostControlEvents() {
        // 图表时间范围
        document.getElementById('chart-timerange')?.addEventListener('change', (e) => {
            this.updateChartTimeRange(e.target.value);
        });
    }
    
    bindModalEvents() {
        // 关闭模态框
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal);
            });
        });
        
        // 点击背景关闭模态框
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
        
        // 取消按钮
        document.getElementById('cancel-add-source')?.addEventListener('click', () => {
            this.hideModal(document.getElementById('add-source-modal'));
        });
    }
    
    // 标签页切换
    switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // 更新标签内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
        
        this.currentTab = tabName;
        
        // 标签页特定的初始化
        switch (tabName) {
            case 'water-sources':
                this.refreshWaterSources();
                break;
            case 'pipeline-network':
                this.refreshNetworkTopology();
                break;
            case 'usage-monitoring':
                this.refreshUsageMonitoring();
                break;
            case 'cost-control':
                this.refreshCostControl();
                break;
        }
        
        console.log(`切换到标签页: ${tabName}`);
    }
    
    // 加载水源列表
    async loadWaterSources() {
        try {
            const sources = await this.waterSourceService.getAllSources();
            
            sources.forEach(source => {
                this.waterSources.set(source.id, source);
            });
            
            this.renderWaterSources();
            console.log(`加载了 ${sources.length} 个水源`);
            
        } catch (error) {
            console.error('加载水源失败:', error);
            this.onError(error);
        }
    }
    
    // 渲染水源列表
    renderWaterSources() {
        const container = document.getElementById('sources-list');
        if (!container) return;
        
        const sources = Array.from(this.waterSources.values());
        
        if (sources.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无水源配置</div>';
            return;
        }
        
        const html = sources.map(source => `
            <div class="source-item" data-source-id="${source.id}">
                <div class="source-info">
                    <div class="source-avatar ${source.id}">
                        ${this.getSourceIcon(source.id)}
                    </div>
                    <div class="source-details">
                        <div class="source-name">${source.name}</div>
                        <div class="source-meta">
                            <span>类型: ${this.getSourceTypeText(source.type)}</span>
                            <span>状态: ${this.getSourceStatusText(source.status)}</span>
                            <span>响应时间: ${source.health?.responseTime || 0}ms</span>
                            <span>成功率: ${source.health?.successRate || 0}%</span>
                        </div>
                    </div>
                </div>
                <div class="source-actions">
                    <button class="action-btn" onclick="waterManagement.testSourceConnection('${source.id}')">
                        测试
                    </button>
                    <button class="action-btn primary" onclick="waterManagement.showSourceDetails('${source.id}')">
                        详情
                    </button>
                    <div class="status-badge ${source.status}">${this.getSourceStatusText(source.status)}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    // 加载终端分配
    async loadTerminalAllocations() {
        try {
            const allocations = await this.loadBalancerService.getAllocations();
            
            allocations.forEach(allocation => {
                this.terminalAllocations.set(allocation.terminalId, allocation);
            });
            
            this.renderTerminalAllocations();
            console.log(`加载了 ${allocations.length} 个终端分配`);
            
        } catch (error) {
            console.error('加载终端分配失败:', error);
            this.onError(error);
        }
    }
    
    // 渲染终端分配
    renderTerminalAllocations() {
        const container = document.getElementById('allocation-list');
        if (!container) return;
        
        const allocations = Array.from(this.terminalAllocations.values());
        
        const html = allocations.map(allocation => `
            <div class="allocation-item">
                <div class="allocation-header">
                    <div class="allocation-title">
                        ${this.getTerminalIcon(allocation.terminalType)} ${allocation.terminalName}
                    </div>
                    <div class="status-badge ${allocation.enabled ? 'active' : 'inactive'}">
                        ${allocation.enabled ? '启用' : '禁用'}
                    </div>
                </div>
                <div class="allocation-details">
                    <div class="detail-item">
                        <span class="detail-label">主要水源:</span>
                        <span class="detail-value">${this.getSourceName(allocation.primarySource)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">备用水源:</span>
                        <span class="detail-value">${allocation.backupSources.map(id => this.getSourceName(id)).join(', ')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">质量要求:</span>
                        <span class="detail-value">${this.getQualityText(allocation.qualityRequirement)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">成本优先级:</span>
                        <span class="detail-value">${this.getCostPriorityText(allocation.costPriority)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">最大成本:</span>
                        <span class="detail-value">$${allocation.maxCostPerRequest}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    // 加载系统状态
    async loadSystemStatus() {
        try {
            const status = await this.waterSourceService.getSystemStatus();
            this.systemStatus = { ...this.systemStatus, ...status };
            
            this.updateSystemOverview();
            console.log('系统状态已更新:', this.systemStatus);
            
        } catch (error) {
            console.error('加载系统状态失败:', error);
            // 使用默认状态
            this.updateSystemOverview();
        }
    }
    
    // 更新系统概览
    updateSystemOverview() {
        const { activeSources, totalSources, todayRequests, todayCost, systemHealth } = this.systemStatus;
        
        // 更新状态显示
        const factoryStatus = document.getElementById('factory-status');
        if (factoryStatus) {
            const status = systemHealth > 95 ? 'active' : systemHealth > 80 ? 'warning' : 'error';
            const text = systemHealth > 95 ? '正常运行' : systemHealth > 80 ? '运行异常' : '故障状态';
            factoryStatus.className = `status-badge ${status}`;
            factoryStatus.textContent = text;
        }
        
        // 更新统计数据
        document.getElementById('active-sources').textContent = `${activeSources}/${totalSources}`;
        document.getElementById('today-requests').textContent = todayRequests;
        document.getElementById('today-cost').textContent = `$${todayCost.toFixed(3)}`;
        document.getElementById('system-health').textContent = `${systemHealth}%`;
    }
    
    // 执行健康检查
    async performHealthCheck() {
        const btn = document.getElementById('health-check-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-icon">⏳</span>检查中...';
        }
        
        try {
            console.log('开始执行系统健康检查...');
            
            const results = await this.healthChecker.checkAllSources();
            
            // 更新水源健康状态
            results.forEach(result => {
                const source = this.waterSources.get(result.sourceId);
                if (source) {
                    source.health = {
                        ...source.health,
                        lastCheck: new Date().toISOString(),
                        responseTime: result.responseTime,
                        successRate: result.successRate,
                        errorCount: result.errorCount,
                        uptime: result.uptime
                    };
                    source.status = result.healthy ? 'active' : 'error';
                }
            });
            
            // 更新显示
            this.renderWaterSources();
            this.updateSystemOverview();
            
            // 显示检查结果
            const healthyCount = results.filter(r => r.healthy).length;
            const message = `健康检查完成: ${healthyCount}/${results.length} 个水源正常`;
            this.showNotification('success', message);
            
            console.log('健康检查完成:', results);
            
        } catch (error) {
            console.error('健康检查失败:', error);
            this.showNotification('error', '健康检查失败: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">🔍</span>系统检查';
            }
        }
    }
    
    // 刷新系统状态
    async refreshSystemStatus() {
        const btn = document.getElementById('refresh-status-btn');
        if (btn) {
            btn.disabled = true;
            btn.querySelector('.btn-icon').classList.add('animate-spin');
        }
        
        try {
            await Promise.all([
                this.loadSystemStatus(),
                this.loadWaterSources(),
                this.loadTerminalAllocations()
            ]);
            
            this.showNotification('success', '系统状态已刷新');
            
        } catch (error) {
            console.error('刷新系统状态失败:', error);
            this.showNotification('error', '刷新失败: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.querySelector('.btn-icon').classList.remove('animate-spin');
            }
        }
    }
    
    // 显示添加水源模态框
    showAddSourceModal() {
        const modal = document.getElementById('add-source-modal');
        if (modal) {
            // 重置表单
            document.getElementById('add-source-form').reset();
            modal.style.display = 'flex';
        }
    }
    
    // 测试并添加水源
    async testAndAddSource() {
        const form = document.getElementById('add-source-form');
        const formData = new FormData(form);
        
        const sourceConfig = {
            id: document.getElementById('source-id').value,
            name: document.getElementById('source-name').value,
            type: document.getElementById('source-type').value,
            config: {
                endpoint: document.getElementById('source-endpoint').value,
                apiKey: document.getElementById('source-api-key').value,
                model: document.getElementById('source-model').value,
                maxConcurrent: parseInt(document.getElementById('source-max-concurrent').value),
                rateLimit: parseInt(document.getElementById('source-rate-limit').value),
                costPerToken: parseFloat(document.getElementById('source-cost-per-token').value) || 0
            }
        };
        
        const btn = document.getElementById('test-and-add-source');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '测试中...';
        }
        
        try {
            // 先测试连接
            const testResult = await this.waterSourceService.testConnection(sourceConfig);
            
            if (!testResult.success) {
                throw new Error(`连接测试失败: ${testResult.error}`);
            }
            
            // 添加水源
            const addResult = await this.waterSourceService.addSource(sourceConfig);
            
            if (addResult.success) {
                // 更新本地状态
                this.waterSources.set(sourceConfig.id, {
                    ...sourceConfig,
                    status: 'active',
                    health: {
                        lastCheck: new Date().toISOString(),
                        responseTime: testResult.responseTime,
                        successRate: 100,
                        errorCount: 0,
                        uptime: 100
                    },
                    usage: {
                        requestsToday: 0,
                        tokensUsed: 0,
                        costToday: 0,
                        lastUsed: 'never'
                    }
                });
                
                // 刷新显示
                this.renderWaterSources();
                this.updateSystemOverview();
                
                // 关闭模态框
                this.hideModal(document.getElementById('add-source-modal'));
                
                this.showNotification('success', `水源 ${sourceConfig.name} 添加成功`);
                
                // 触发回调
                this.onWaterSourceChange(sourceConfig.id, 'added');
                
            } else {
                throw new Error(addResult.error || '添加水源失败');
            }
            
        } catch (error) {
            console.error('添加水源失败:', error);
            this.showNotification('error', error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '测试并添加';
            }
        }
    }
    
    // 测试水源连接
    async testSourceConnection(sourceId) {
        try {
            console.log(`测试水源连接: ${sourceId}`);
            
            const result = await this.waterSourceService.testConnection(sourceId);
            
            if (result.success) {
                this.showNotification('success', `水源 ${sourceId} 连接正常，响应时间: ${result.responseTime}ms`);
            } else {
                this.showNotification('error', `水源 ${sourceId} 连接失败: ${result.error}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('测试连接失败:', error);
            this.showNotification('error', `测试失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // 显示水源详情
    showSourceDetails(sourceId) {
        const source = this.waterSources.get(sourceId);
        if (!source) return;
        
        const modal = document.getElementById('source-details-modal');
        const titleElement = document.getElementById('source-details-title');
        const contentElement = document.getElementById('source-details-content');
        
        if (titleElement) {
            titleElement.textContent = `${source.name} - 详情`;
        }
        
        if (contentElement) {
            contentElement.innerHTML = this.generateSourceDetailsHTML(source);
        }
        
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    // 生成水源详情HTML
    generateSourceDetailsHTML(source) {
        return `
            <div class="source-details-grid">
                <div class="details-section">
                    <h4>基本信息</h4>
                    <div class="details-list">
                        <div class="detail-item">
                            <span class="detail-label">水源ID:</span>
                            <span class="detail-value">${source.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">水源名称:</span>
                            <span class="detail-value">${source.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">水源类型:</span>
                            <span class="detail-value">${this.getSourceTypeText(source.type)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">当前状态:</span>
                            <span class="detail-value">
                                <span class="status-badge ${source.status}">${this.getSourceStatusText(source.status)}</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>配置信息</h4>
                    <div class="details-list">
                        <div class="detail-item">
                            <span class="detail-label">API端点:</span>
                            <span class="detail-value">${source.config?.endpoint || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">AI模型:</span>
                            <span class="detail-value">${source.config?.model || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">最大并发:</span>
                            <span class="detail-value">${source.config?.maxConcurrent || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">速率限制:</span>
                            <span class="detail-value">${source.config?.rateLimit || 'N/A'} 请求/分钟</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">每Token成本:</span>
                            <span class="detail-value">$${source.config?.costPerToken || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>健康状态</h4>
                    <div class="details-list">
                        <div class="detail-item">
                            <span class="detail-label">最后检查:</span>
                            <span class="detail-value">${source.health?.lastCheck ? new Date(source.health.lastCheck).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">响应时间:</span>
                            <span class="detail-value">${source.health?.responseTime || 0}ms</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">成功率:</span>
                            <span class="detail-value">${source.health?.successRate || 0}%</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">错误次数:</span>
                            <span class="detail-value">${source.health?.errorCount || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">运行时间:</span>
                            <span class="detail-value">${source.health?.uptime || 0}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>使用统计</h4>
                    <div class="details-list">
                        <div class="detail-item">
                            <span class="detail-label">今日请求:</span>
                            <span class="detail-value">${source.usage?.requestsToday || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Token使用:</span>
                            <span class="detail-value">${source.usage?.tokensUsed || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">今日成本:</span>
                            <span class="detail-value">$${source.usage?.costToday || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">最后使用:</span>
                            <span class="detail-value">${source.usage?.lastUsed === 'never' ? '从未使用' : new Date(source.usage.lastUsed).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 更新全局策略
    async updateGlobalStrategy(strategy) {
        try {
            const result = await this.loadBalancerService.updateGlobalStrategy(strategy);
            
            if (result.success) {
                this.showNotification('success', `全局策略已更新为: ${this.getStrategyText(strategy)}`);
                console.log('全局策略已更新:', strategy);
            } else {
                throw new Error(result.error || '更新策略失败');
            }
            
        } catch (error) {
            console.error('更新全局策略失败:', error);
            this.showNotification('error', error.message);
        }
    }
    
    // 切换故障转移
    async toggleFailover(enabled) {
        try {
            const result = await this.failoverManager.setEnabled(enabled);
            
            if (result.success) {
                this.showNotification('success', `故障转移已${enabled ? '启用' : '禁用'}`);
                console.log('故障转移状态:', enabled);
            } else {
                throw new Error(result.error || '更新故障转移状态失败');
            }
            
        } catch (error) {
            console.error('切换故障转移失败:', error);
            this.showNotification('error', error.message);
        }
    }
    
    // 更新健康检查间隔
    async updateHealthCheckInterval(interval) {
        try {
            const result = await this.healthChecker.setInterval(interval);
            
            if (result.success) {
                this.showNotification('success', `健康检查间隔已更新为: ${interval}秒`);
                console.log('健康检查间隔已更新:', interval);
            } else {
                throw new Error(result.error || '更新健康检查间隔失败');
            }
            
        } catch (error) {
            console.error('更新健康检查间隔失败:', error);
            this.showNotification('error', error.message);
        }
    }
    
    // 刷新水源列表
    async refreshWaterSources() {
        try {
            await this.loadWaterSources();
            console.log('水源列表已刷新');
        } catch (error) {
            console.error('刷新水源列表失败:', error);
        }
    }
    
    // 刷新网络拓扑
    refreshNetworkTopology() {
        const container = document.getElementById('topology-container');
        if (container) {
            container.innerHTML = `
                <div class="topology-placeholder">
                    <div class="topology-icon">🌐</div>
                    <div class="topology-text">网络拓扑图</div>
                    <div class="topology-description">显示AI水源、网关和终端的连接关系</div>
                </div>
            `;
        }
        
        // 更新网络统计
        this.updateNetworkStats();
    }
    
    // 更新网络统计
    updateNetworkStats() {
        // 模拟网络统计数据
        const stats = {
            gatewayStatus: '健康',
            avgLatency: '245ms',
            throughput: '150/min',
            loadBalance: '正常'
        };
        
        document.getElementById('gateway-status').textContent = stats.gatewayStatus;
        document.getElementById('avg-latency').textContent = stats.avgLatency;
        document.getElementById('throughput').textContent = stats.throughput;
        document.getElementById('load-balance').textContent = stats.loadBalance;
    }
    
    // 刷新使用监控
    refreshUsageMonitoring() {
        this.updateUsageCharts();
        this.updateUsageTable();
    }
    
    // 更新使用图表
    updateUsageCharts() {
        const requestsChart = document.getElementById('requests-chart');
        const responseTimeChart = document.getElementById('response-time-chart');
        
        if (requestsChart) {
            requestsChart.innerHTML = '<div class="chart-placeholder">📈 请求量趋势图</div>';
        }
        
        if (responseTimeChart) {
            responseTimeChart.innerHTML = '<div class="chart-placeholder">⏱️ 响应时间分布图</div>';
        }
    }
    
    // 更新使用表格
    updateUsageTable() {
        const container = document.getElementById('usage-table');
        if (!container) return;
        
        const allocations = Array.from(this.terminalAllocations.values());
        
        const html = `
            <div class="table-header">
                <div>终端名称</div>
                <div>今日请求</div>
                <div>平均响应时间</div>
                <div>成功率</div>
                <div>今日成本</div>
                <div>状态</div>
            </div>
            ${allocations.map(allocation => `
                <div class="table-row">
                    <div>${allocation.terminalName}</div>
                    <div>${Math.floor(Math.random() * 100) + 50}</div>
                    <div>${Math.floor(Math.random() * 500) + 200}ms</div>
                    <div>${(Math.random() * 10 + 90).toFixed(1)}%</div>
                    <div>$${(Math.random() * 2 + 0.5).toFixed(3)}</div>
                    <div><span class="status-badge ${allocation.enabled ? 'active' : 'inactive'}">${allocation.enabled ? '正常' : '禁用'}</span></div>
                </div>
            `).join('')}
        `;
        
        container.innerHTML = html;
    }
    
    // 刷新成本控制
    refreshCostControl() {
        this.updateCostOverview();
        this.updateCostAnalysis();
        this.updateOptimizationSuggestions();
    }
    
    // 更新成本概览
    updateCostOverview() {
        // 模拟成本数据
        const costData = {
            daily: 2.45,
            monthly: 48.90,
            projected: 73.50,
            dailyBudget: 50.00,
            monthlyBudget: 1500.00
        };
        
        document.getElementById('daily-cost').textContent = `$${costData.daily.toFixed(3)}`;
        document.getElementById('monthly-cost').textContent = `$${costData.monthly.toFixed(2)}`;
        document.getElementById('projected-cost').textContent = `$${costData.projected.toFixed(2)}`;
        
        // 更新进度条
        const dailyProgress = (costData.daily / costData.dailyBudget) * 100;
        const monthlyProgress = (costData.monthly / costData.monthlyBudget) * 100;
        
        document.getElementById('daily-progress').style.width = `${dailyProgress}%`;
        document.getElementById('monthly-progress').style.width = `${monthlyProgress}%`;
    }
    
    // 更新成本分析
    updateCostAnalysis() {
        const sourceBreakdown = document.getElementById('source-breakdown');
        const terminalBreakdown = document.getElementById('terminal-breakdown');
        
        if (sourceBreakdown) {
            sourceBreakdown.innerHTML = `
                <div class="breakdown-item">
                    <span class="breakdown-label">OpenAI GPT-4</span>
                    <span class="breakdown-value">$2.45 (100%)</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Grok AI</span>
                    <span class="breakdown-value">$0.00 (0%)</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Google Gemini</span>
                    <span class="breakdown-value">$0.00 (0%)</span>
                </div>
            `;
        }
        
        if (terminalBreakdown) {
            terminalBreakdown.innerHTML = `
                <div class="breakdown-item">
                    <span class="breakdown-label">数据生成中心</span>
                    <span class="breakdown-value">$1.47 (60%)</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">内容审核系统</span>
                    <span class="breakdown-value">$0.73 (30%)</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">AI学习优化</span>
                    <span class="breakdown-value">$0.25 (10%)</span>
                </div>
            `;
        }
    }
    
    // 更新优化建议
    updateOptimizationSuggestions() {
        const container = document.getElementById('optimization-suggestions');
        if (!container) return;
        
        const suggestions = [
            {
                title: '启用Gemini作为备用水源',
                description: 'Gemini的成本比OpenAI低17%，可以在非关键任务中使用以降低成本',
                impact: '预计每月节省$12.50'
            },
            {
                title: '优化批次大小',
                description: '将数据生成的批次大小从3增加到5，可以提高效率并减少API调用次数',
                impact: '预计每月节省$8.30'
            },
            {
                title: '调整质量要求',
                description: 'AI学习优化模块可以使用中等质量设置，而不是高质量设置',
                impact: '预计每月节省$5.20'
            }
        ];
        
        const html = suggestions.map(suggestion => `
            <div class="optimization-item">
                <div class="optimization-title">${suggestion.title}</div>
                <div class="optimization-description">${suggestion.description}</div>
                <div class="optimization-impact">💰 ${suggestion.impact}</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    // 更新图表时间范围
    updateChartTimeRange(timeRange) {
        console.log('更新图表时间范围:', timeRange);
        this.updateUsageCharts();
    }
    
    // 开始健康监控
    startHealthMonitoring() {
        if (!this.config.autoHealthCheck) return;
        
        // 定期执行健康检查
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
        
        console.log(`健康监控已启动，间隔: ${this.config.healthCheckInterval / 1000}秒`);
    }
    
    // 显示模态框
    showModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    // 隐藏模态框
    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // 显示通知
    showNotification(type, message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 自动关闭
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // 手动关闭
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
    
    // 获取水源图标
    getSourceIcon(sourceId) {
        const icons = {
            openai: 'O',
            grok: 'G',
            gemini: 'G',
            claude: 'C'
        };
        return icons[sourceId] || '?';
    }
    
    // 获取水源类型文本
    getSourceTypeText(type) {
        const texts = {
            primary: '主要水源',
            backup: '备用水源',
            secondary: '次要水源',
            emergency: '应急水源'
        };
        return texts[type] || type;
    }
    
    // 获取水源状态文本
    getSourceStatusText(status) {
        const texts = {
            active: '活跃',
            inactive: '未激活',
            error: '错误',
            disabled: '已禁用'
        };
        return texts[status] || status;
    }
    
    // 获取终端图标
    getTerminalIcon(terminalType) {
        const icons = {
            generation: '🏭',
            review: '🔍',
            learning: '🧠',
            analysis: '📊'
        };
        return icons[terminalType] || '🔧';
    }
    
    // 获取水源名称
    getSourceName(sourceId) {
        const source = this.waterSources.get(sourceId);
        return source ? source.name : sourceId;
    }
    
    // 获取质量文本
    getQualityText(quality) {
        const texts = {
            low: '低质量',
            medium: '中等质量',
            high: '高质量',
            premium: '顶级质量'
        };
        return texts[quality] || quality;
    }
    
    // 获取成本优先级文本
    getCostPriorityText(priority) {
        const texts = {
            quality_first: '质量优先',
            cost_first: '成本优先',
            balanced: '平衡模式'
        };
        return texts[priority] || priority;
    }
    
    // 获取策略文本
    getStrategyText(strategy) {
        const texts = {
            quality_first: '质量优先',
            cost_first: '成本优先',
            balanced: '平衡模式',
            custom: '自定义'
        };
        return texts[strategy] || strategy;
    }
}

// 全局实例
let waterManagement;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    waterManagement = new AIWaterManagementPanel({
        container: '#ai-water-management-container',
        config: {
            autoHealthCheck: true,
            healthCheckInterval: 300000, // 5分钟
            enableCostControl: true,
            enableFailover: true
        },
        onWaterSourceChange: (sourceId, status) => {
            console.log(`水源变更: ${sourceId} -> ${status}`);
        },
        onCostAlert: (alert) => {
            console.log('成本预警:', alert);
        },
        onFailover: (from, to) => {
            console.log(`故障转移: ${from} -> ${to}`);
        },
        onError: (error) => {
            console.error('系统错误:', error);
        }
    });
    
    console.log('🚀 AI水源与水管管理面板已启动');
});

// 导出到全局
if (typeof window !== 'undefined') {
    window.AIWaterManagementPanel = AIWaterManagementPanel;
    window.waterManagement = waterManagement;
}
