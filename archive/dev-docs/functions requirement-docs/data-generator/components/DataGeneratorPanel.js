/**
 * 数据生成器面板交互逻辑
 * 
 * 功能特性：
 * - 多标签页管理
 * - AI和本地数据生成
 * - 实时进度监控
 * - 配置管理
 * - 性能统计
 */

class DataGeneratorPanel {
    constructor(options = {}) {
        this.container = options.container || '#data-generator-container';
        this.config = {
            defaultType: 'questionnaire',
            defaultCount: 15,
            defaultQuality: 'standard',
            enableAI: true,
            enableLocal: true,
            ...options.config
        };
        
        // 回调函数
        this.onGenerationStart = options.onGenerationStart || (() => {});
        this.onGenerationProgress = options.onGenerationProgress || (() => {});
        this.onGenerationComplete = options.onGenerationComplete || (() => {});
        this.onError = options.onError || (() => {});
        
        // 状态管理
        this.currentTab = 'dashboard';
        this.generationTasks = new Map();
        this.systemStats = {
            todayGenerated: 0,
            pendingReview: 0,
            passRate: 85.2,
            responseTime: 1250,
            successRate: 94.8,
            errorRate: 5.2
        };
        
        // 性能监控
        this.performanceMonitor = new PerformanceMonitor();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadSystemStats();
        this.updatePreview();
        this.startPerformanceMonitoring();
        
        console.log('🤖 数据生成器面板已初始化');
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
        document.getElementById('refresh-stats-btn')?.addEventListener('click', () => {
            this.refreshStats();
        });
        
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        // 问卷生成配置
        this.bindQuestionnaireEvents();
        
        // 故事生成配置
        this.bindStoryEvents();
        
        // 用户生成配置
        this.bindUserEvents();
        
        // 本地测试配置
        this.bindLocalTestEvents();
        
        // 历史记录配置
        this.bindHistoryEvents();
        
        // 进度监控模态框
        this.bindProgressModalEvents();
        
        // 配置变更监听
        this.bindConfigChangeEvents();
    }
    
    bindQuestionnaireEvents() {
        // AI生成按钮
        document.getElementById('start-ai-generation')?.addEventListener('click', async () => {
            await this.startAIGeneration('questionnaire');
        });
        
        // 本地生成按钮
        document.getElementById('start-local-generation')?.addEventListener('click', async () => {
            await this.startLocalGeneration('questionnaire');
        });
    }
    
    bindStoryEvents() {
        // 故事生成按钮
        document.getElementById('start-story-generation')?.addEventListener('click', async () => {
            await this.startAIGeneration('story');
        });
        
        // 预览模板按钮
        document.getElementById('preview-story')?.addEventListener('click', () => {
            this.previewStoryTemplate();
        });
        
        // 创意度滑块
        document.getElementById('s-creativity')?.addEventListener('input', (e) => {
            document.getElementById('creativity-value').textContent = e.target.value;
        });
    }
    
    bindUserEvents() {
        // 用户生成按钮
        document.getElementById('start-user-generation')?.addEventListener('click', async () => {
            await this.startAIGeneration('user');
        });
        
        // 批量导入按钮
        document.getElementById('batch-import-users')?.addEventListener('click', () => {
            this.showBatchImportDialog();
        });
    }
    
    bindLocalTestEvents() {
        // 本地测试生成按钮
        document.getElementById('start-local-test')?.addEventListener('click', async () => {
            await this.startLocalTestGeneration();
        });
        
        // 验证数据按钮
        document.getElementById('verify-local-data')?.addEventListener('click', async () => {
            await this.verifyLocalData();
        });
    }
    
    bindHistoryEvents() {
        // 刷新历史按钮
        document.getElementById('refresh-history')?.addEventListener('click', () => {
            this.loadGenerationHistory();
        });
        
        // 导出历史按钮
        document.getElementById('export-history')?.addEventListener('click', () => {
            this.exportGenerationHistory();
        });
        
        // 历史筛选
        document.getElementById('history-type-filter')?.addEventListener('change', () => {
            this.filterHistory();
        });
        
        document.getElementById('history-status-filter')?.addEventListener('change', () => {
            this.filterHistory();
        });
        
        document.getElementById('history-date-filter')?.addEventListener('change', () => {
            this.filterHistory();
        });
    }
    
    bindProgressModalEvents() {
        // 关闭模态框
        document.getElementById('close-progress-modal')?.addEventListener('click', () => {
            this.hideProgressModal();
        });
        
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.hideProgressModal();
        });
        
        // 停止生成
        document.getElementById('stop-generation')?.addEventListener('click', () => {
            this.stopCurrentGeneration();
        });
        
        // 点击背景关闭
        document.getElementById('progress-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'progress-modal') {
                this.hideProgressModal();
            }
        });
    }
    
    bindConfigChangeEvents() {
        // 监听配置变更，实时更新预览
        const configInputs = [
            'q-count', 'q-quality', 'q-interval', 'q-batch-size',
            's-count', 's-category', 's-length',
            'u-count', 'u-type',
            'lt-count', 'lt-type'
        ];
        
        configInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.updatePreview();
                });
                element.addEventListener('input', () => {
                    this.updatePreview();
                });
            }
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
            case 'dashboard':
                this.refreshStats();
                break;
            case 'history':
                this.loadGenerationHistory();
                break;
        }
        
        console.log(`切换到标签页: ${tabName}`);
    }
    
    // 开始AI生成
    async startAIGeneration(type) {
        try {
            const config = this.getGenerationConfig(type);
            
            console.log(`开始AI生成 (${type}):`, config);
            this.onGenerationStart(config);
            
            // 显示进度监控
            this.showProgressModal();
            
            // 调用数据生成服务
            const result = await DataGenerationService.startAIGeneration(config);
            
            if (result.success) {
                const taskId = result.data.generationId;
                this.generationTasks.set(taskId, {
                    id: taskId,
                    type,
                    config,
                    startTime: Date.now(),
                    status: 'running'
                });
                
                // 开始监控进度
                this.monitorGenerationProgress(taskId);
                
                this.showNotification('success', `${type}生成任务已启动: ${taskId}`);
            } else {
                throw new Error(result.error || '启动生成任务失败');
            }
            
        } catch (error) {
            console.error('AI生成失败:', error);
            this.onError(error);
            this.showNotification('error', `AI生成失败: ${error.message}`);
            this.hideProgressModal();
        }
    }
    
    // 开始本地生成
    async startLocalGeneration(type) {
        try {
            const config = this.getGenerationConfig(type);
            config.useLocal = true;
            
            console.log(`开始本地生成 (${type}):`, config);
            this.onGenerationStart(config);
            
            // 显示进度监控
            this.showProgressModal();
            
            // 调用本地生成服务
            const result = await LocalGeneratorService.generate(config);
            
            if (result.success) {
                this.onGenerationComplete(result);
                this.showNotification('success', `本地生成完成: 生成了${result.data.count}条数据`);
                this.refreshStats();
            } else {
                throw new Error(result.error || '本地生成失败');
            }
            
        } catch (error) {
            console.error('本地生成失败:', error);
            this.onError(error);
            this.showNotification('error', `本地生成失败: ${error.message}`);
        } finally {
            this.hideProgressModal();
        }
    }
    
    // 开始本地测试生成
    async startLocalTestGeneration() {
        try {
            const config = {
                count: parseInt(document.getElementById('lt-count')?.value || '100'),
                type: document.getElementById('lt-type')?.value || 'questionnaire',
                features: {
                    includeVoices: document.getElementById('include-voices')?.checked || false,
                    includeMetadata: document.getElementById('include-metadata')?.checked || false,
                    deidentification: document.getElementById('enable-deidentification')?.checked || false
                },
                batchSize: 20,
                outputFormat: 'json'
            };
            
            console.log('开始本地测试生成:', config);
            
            // 显示结果区域
            const resultsCard = document.getElementById('local-test-results');
            if (resultsCard) {
                resultsCard.style.display = 'block';
                resultsCard.querySelector('.results-content').innerHTML = '<div class="loading">生成中...</div>';
            }
            
            // 调用本地测试生成服务
            const result = await LocalGeneratorService.generateTestData(config);
            
            if (result.success) {
                this.displayLocalTestResults(result.data);
                this.showNotification('success', '本地测试数据生成完成');
            } else {
                throw new Error(result.error || '本地测试生成失败');
            }
            
        } catch (error) {
            console.error('本地测试生成失败:', error);
            this.showNotification('error', `本地测试生成失败: ${error.message}`);
            
            const resultsCard = document.getElementById('local-test-results');
            if (resultsCard) {
                resultsCard.querySelector('.results-content').innerHTML = `<div class="error">生成失败: ${error.message}</div>`;
            }
        }
    }
    
    // 验证本地数据
    async verifyLocalData() {
        try {
            console.log('开始验证本地数据...');
            
            const result = await LocalGeneratorService.verifyData();
            
            if (result.success) {
                this.displayLocalTestResults(result.data, true);
                this.showNotification('success', '数据验证完成');
            } else {
                throw new Error(result.error || '数据验证失败');
            }
            
        } catch (error) {
            console.error('数据验证失败:', error);
            this.showNotification('error', `数据验证失败: ${error.message}`);
        }
    }
    
    // 获取生成配置
    getGenerationConfig(type) {
        const baseConfig = {
            type,
            timestamp: Date.now()
        };
        
        switch (type) {
            case 'questionnaire':
                return {
                    ...baseConfig,
                    count: parseInt(document.getElementById('q-count')?.value || '15'),
                    quality: document.getElementById('q-quality')?.value || 'standard',
                    interval: parseInt(document.getElementById('q-interval')?.value || '60'),
                    batchSize: parseInt(document.getElementById('q-batch-size')?.value || '3'),
                    aiProvider: document.getElementById('q-ai-provider')?.value || 'openai',
                    template: document.getElementById('q-template')?.value || 'basic'
                };
                
            case 'story':
                return {
                    ...baseConfig,
                    count: parseInt(document.getElementById('s-count')?.value || '8'),
                    category: document.getElementById('s-category')?.value || 'job-hunting',
                    length: document.getElementById('s-length')?.value || 'medium',
                    creativity: parseFloat(document.getElementById('s-creativity')?.value || '0.7'),
                    quality: 'standard'
                };
                
            case 'user':
                return {
                    ...baseConfig,
                    count: parseInt(document.getElementById('u-count')?.value || '14'),
                    userType: document.getElementById('u-type')?.value || 'mixed',
                    educationLevels: this.getCheckedValues('input[name="education"]:checked'),
                    majors: this.getCheckedValues('input[name="major"]:checked'),
                    quality: 'standard'
                };
                
            default:
                return baseConfig;
        }
    }
    
    // 获取选中的复选框值
    getCheckedValues(selector) {
        return Array.from(document.querySelectorAll(selector)).map(el => el.value);
    }
    
    // 更新预览信息
    updatePreview() {
        const type = this.currentTab === 'questionnaire' ? 'questionnaire' : 
                    this.currentTab === 'story' ? 'story' : 
                    this.currentTab === 'user' ? 'user' : 'questionnaire';
        
        const config = this.getGenerationConfig(type);
        
        // 更新预览数值
        if (document.getElementById('preview-count')) {
            document.getElementById('preview-count').textContent = `${config.count} 条${this.getTypeDisplayName(type)}`;
        }
        
        if (document.getElementById('preview-quality')) {
            document.getElementById('preview-quality').textContent = this.getQualityDisplayName(config.quality);
        }
        
        if (document.getElementById('preview-time')) {
            const estimatedTime = Math.ceil(config.count / (config.batchSize || 3) * (config.interval || 60) / 60);
            document.getElementById('preview-time').textContent = `${estimatedTime} 分钟`;
        }
        
        if (document.getElementById('preview-cost')) {
            const estimatedCost = (config.count * 0.03).toFixed(2);
            document.getElementById('preview-cost').textContent = `$${estimatedCost}`;
        }
    }
    
    // 获取类型显示名称
    getTypeDisplayName(type) {
        const names = {
            questionnaire: '问卷',
            story: '故事',
            user: '用户'
        };
        return names[type] || '数据';
    }
    
    // 获取质量显示名称
    getQualityDisplayName(quality) {
        const names = {
            basic: '基础质量',
            standard: '标准质量',
            premium: '高级质量'
        };
        return names[quality] || '标准质量';
    }
    
    // 显示进度监控模态框
    showProgressModal() {
        const modal = document.getElementById('progress-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // 重置进度显示
            document.getElementById('task-id').textContent = '生成中...';
            document.getElementById('task-status').textContent = '准备中';
            document.getElementById('task-progress').textContent = '0/0';
            document.getElementById('progress-fill').style.width = '0%';
            document.getElementById('progress-percentage').textContent = '0%';
        }
    }
    
    // 隐藏进度监控模态框
    hideProgressModal() {
        const modal = document.getElementById('progress-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // 监控生成进度
    async monitorGenerationProgress(taskId) {
        const task = this.generationTasks.get(taskId);
        if (!task) return;
        
        const monitor = setInterval(async () => {
            try {
                const status = await DataGenerationService.getGenerationStatus(taskId);
                
                // 更新进度显示
                this.updateProgressDisplay(status);
                
                // 更新任务状态
                task.status = status.status;
                task.progress = status.progress;
                
                // 检查是否完成
                if (status.status === 'completed' || status.status === 'failed' || status.status === 'stopped') {
                    clearInterval(monitor);
                    this.generationTasks.delete(taskId);
                    
                    if (status.status === 'completed') {
                        this.onGenerationComplete(status);
                        this.showNotification('success', '生成任务完成');
                        this.refreshStats();
                    } else {
                        this.onError(new Error(`生成任务${status.status}: ${status.error || '未知错误'}`));
                        this.showNotification('error', `生成任务${status.status}`);
                    }
                    
                    // 延迟关闭模态框
                    setTimeout(() => {
                        this.hideProgressModal();
                    }, 2000);
                }
                
            } catch (error) {
                console.error('获取生成状态失败:', error);
                clearInterval(monitor);
                this.generationTasks.delete(taskId);
                this.hideProgressModal();
            }
        }, 2000); // 每2秒检查一次
    }
    
    // 更新进度显示
    updateProgressDisplay(status) {
        document.getElementById('task-id').textContent = status.id || '-';
        document.getElementById('task-status').textContent = this.getStatusDisplayName(status.status);
        
        if (status.progress) {
            const { total, generated, submitted, transferred, reviewed } = status.progress;
            document.getElementById('task-progress').textContent = `${generated}/${total}`;
            
            const percentage = total > 0 ? Math.round((generated / total) * 100) : 0;
            document.getElementById('progress-fill').style.width = `${percentage}%`;
            document.getElementById('progress-percentage').textContent = `${percentage}%`;
            
            // 更新详细进度
            const details = document.getElementById('progress-details');
            if (details) {
                details.innerHTML = `
                    <div>已生成: ${generated}/${total}</div>
                    <div>已提交: ${submitted}/${total}</div>
                    <div>已传输: ${transferred}/${total}</div>
                    <div>已审核: ${reviewed}/${total}</div>
                `;
            }
        }
    }
    
    // 获取状态显示名称
    getStatusDisplayName(status) {
        const names = {
            pending: '等待中',
            running: '进行中',
            completed: '已完成',
            failed: '失败',
            stopped: '已停止'
        };
        return names[status] || status;
    }
    
    // 停止当前生成任务
    async stopCurrentGeneration() {
        const runningTasks = Array.from(this.generationTasks.values()).filter(task => task.status === 'running');
        
        if (runningTasks.length === 0) {
            this.showNotification('warning', '没有正在运行的生成任务');
            return;
        }
        
        try {
            for (const task of runningTasks) {
                await DataGenerationService.stopGeneration(task.id);
                task.status = 'stopped';
            }
            
            this.showNotification('success', '生成任务已停止');
            this.hideProgressModal();
            
        } catch (error) {
            console.error('停止生成任务失败:', error);
            this.showNotification('error', `停止任务失败: ${error.message}`);
        }
    }
    
    // 刷新系统统计
    async refreshStats() {
        try {
            const stats = await DataGenerationService.getCurrentStats();
            this.systemStats = { ...this.systemStats, ...stats };
            
            // 更新显示
            this.updateStatsDisplay();
            
            console.log('系统统计已刷新:', this.systemStats);
            
        } catch (error) {
            console.error('刷新统计失败:', error);
            this.showNotification('error', '刷新统计失败');
        }
    }
    
    // 更新统计显示
    updateStatsDisplay() {
        const { todayGenerated, pendingReview, passRate, responseTime, successRate, errorRate } = this.systemStats;
        
        // 仪表板统计
        if (document.getElementById('today-generated')) {
            document.getElementById('today-generated').textContent = todayGenerated;
        }
        if (document.getElementById('pending-review')) {
            document.getElementById('pending-review').textContent = pendingReview;
        }
        if (document.getElementById('pass-rate')) {
            document.getElementById('pass-rate').textContent = `${passRate}%`;
        }
        if (document.getElementById('response-time')) {
            document.getElementById('response-time').textContent = `${responseTime}ms`;
        }
        if (document.getElementById('success-rate')) {
            document.getElementById('success-rate').textContent = `${successRate}%`;
        }
        if (document.getElementById('error-rate')) {
            document.getElementById('error-rate').textContent = `${errorRate}%`;
        }
        
        // 各标签页统计
        if (document.getElementById('questionnaire-today')) {
            document.getElementById('questionnaire-today').textContent = Math.floor(todayGenerated * 0.6);
        }
        if (document.getElementById('questionnaire-pass-rate')) {
            document.getElementById('questionnaire-pass-rate').textContent = `${passRate}%`;
        }
        if (document.getElementById('users-today')) {
            document.getElementById('users-today').textContent = Math.floor(todayGenerated * 0.2);
        }
        if (document.getElementById('users-active-rate')) {
            document.getElementById('users-active-rate').textContent = `${(successRate * 0.8).toFixed(1)}%`;
        }
    }
    
    // 加载系统统计
    async loadSystemStats() {
        await this.refreshStats();
        this.loadRecentActivities();
    }
    
    // 加载最近活动
    loadRecentActivities() {
        const activities = this.performanceMonitor.getRecentEvents(10);
        const container = document.getElementById('recent-activities');
        
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="no-activities">暂无活动记录</div>';
            return;
        }
        
        const html = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-time">${new Date(activity.timestamp).toLocaleTimeString()}</div>
                <div class="activity-description">${this.getActivityDescription(activity)}</div>
                <div class="activity-status ${activity.type}">${this.getActivityStatusText(activity.type)}</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    // 获取活动描述
    getActivityDescription(activity) {
        const descriptions = {
            generation_start: '开始数据生成任务',
            generation_complete: '数据生成任务完成',
            generation_error: '数据生成任务失败',
            api_call: 'API调用',
            local_generation: '本地数据生成',
            data_validation: '数据验证',
            export_data: '数据导出'
        };
        
        return descriptions[activity.data?.type] || activity.data?.message || '未知活动';
    }
    
    // 获取活动状态文本
    getActivityStatusText(type) {
        const texts = {
            success: '成功',
            error: '失败',
            warning: '警告',
            info: '信息'
        };
        return texts[type] || type;
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
        
        // 记录到性能监控
        this.performanceMonitor.recordEvent(type, { message, timestamp: Date.now() });
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
    
    // 开始性能监控
    startPerformanceMonitoring() {
        // 定期更新性能指标
        setInterval(() => {
            const metrics = this.performanceMonitor.getMetrics();
            this.systemStats = {
                ...this.systemStats,
                responseTime: Math.round(metrics.apiResponseTime),
                successRate: Math.round(metrics.successRate * 10) / 10,
                errorRate: Math.round(metrics.errorRate * 10) / 10
            };
            
            this.updateStatsDisplay();
        }, 10000); // 每10秒更新一次
        
        // 定期刷新活动列表
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadRecentActivities();
            }
        }, 30000); // 每30秒刷新一次
    }
    
    // 预览故事模板
    previewStoryTemplate() {
        const category = document.getElementById('s-category')?.value || 'job-hunting';
        const length = document.getElementById('s-length')?.value || 'medium';
        
        // 模拟获取模板内容
        const templates = {
            'job-hunting': {
                title: '我的求职之路：从迷茫到收获心仪offer',
                content: '回想起自己的求职经历，真是五味杂陈。作为一名应届毕业生，求职路上充满了挑战...'
            },
            'career-change': {
                title: '转行程序员的心路历程',
                content: '从传统行业转向IT行业，这个决定改变了我的人生轨迹...'
            },
            'entrepreneurship': {
                title: '创业路上的酸甜苦辣',
                content: '创业两年来，经历了从0到1的艰难过程...'
            },
            'internship': {
                title: '实习经历让我成长了很多',
                content: '大三暑假的实习经历，让我对职场有了更深的认识...'
            }
        };
        
        const template = templates[category] || templates['job-hunting'];
        
        // 更新预览显示
        const preview = document.getElementById('story-preview');
        if (preview) {
            preview.querySelector('.story-title').textContent = template.title;
            preview.querySelector('.story-content').textContent = template.content;
            preview.querySelector('.story-category').textContent = this.getCategoryDisplayName(category);
            preview.querySelector('.story-length').textContent = this.getLengthDisplayName(length);
        }
        
        this.showNotification('info', '故事模板预览已更新');
    }
    
    // 获取分类显示名称
    getCategoryDisplayName(category) {
        const names = {
            'job-hunting': '求职经历',
            'career-change': '职业转换',
            'entrepreneurship': '创业经历',
            'internship': '实习体验'
        };
        return names[category] || category;
    }
    
    // 获取长度显示名称
    getLengthDisplayName(length) {
        const names = {
            short: '约400字',
            medium: '约800字',
            long: '约1500字'
        };
        return names[length] || '约800字';
    }
    
    // 显示批量导入对话框
    showBatchImportDialog() {
        // 这里可以实现批量导入用户的对话框
        this.showNotification('info', '批量导入功能开发中...');
    }
    
    // 显示本地测试结果
    displayLocalTestResults(data, isVerification = false) {
        const resultsCard = document.getElementById('local-test-results');
        if (!resultsCard) return;
        
        const title = isVerification ? '数据验证结果' : '生成结果';
        const content = resultsCard.querySelector('.results-content');
        
        const html = `
            <h5>${title}</h5>
            <div class="results-stats">
                <div class="result-item">
                    <span class="result-label">问卷数据:</span>
                    <span class="result-value">${data.questionnaires || 0} 条</span>
                </div>
                <div class="result-item">
                    <span class="result-label">故事数据:</span>
                    <span class="result-value">${data.stories || 0} 条</span>
                </div>
                <div class="result-item">
                    <span class="result-label">语音文件:</span>
                    <span class="result-value">${data.voices || 0} 个</span>
                </div>
                <div class="result-item">
                    <span class="result-label">审核通过率:</span>
                    <span class="result-value">${data.reviewPassRate || 0}%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">生成时间:</span>
                    <span class="result-value">${data.duration || 0}ms</span>
                </div>
            </div>
            ${data.errors && data.errors.length > 0 ? `
                <div class="results-errors">
                    <h6>错误信息:</h6>
                    <ul>
                        ${data.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        content.innerHTML = html;
        resultsCard.style.display = 'block';
    }
    
    // 加载生成历史
    async loadGenerationHistory() {
        try {
            const history = await DataGenerationService.getGenerationTasks({
                page: 1,
                pageSize: 50
            });
            
            this.displayGenerationHistory(history.data);
            
        } catch (error) {
            console.error('加载生成历史失败:', error);
            this.showNotification('error', '加载生成历史失败');
        }
    }
    
    // 显示生成历史
    displayGenerationHistory(history) {
        const container = document.getElementById('history-list');
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = '<div class="no-history">暂无生成历史</div>';
            return;
        }
        
        const html = history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-title">${item.templateName}</div>
                    <div class="history-meta">
                        ${new Date(item.startTime).toLocaleString()} | 
                        ${item.progress.total} 条数据 | 
                        耗时: ${this.calculateDuration(item.startTime, item.endTime)}
                    </div>
                </div>
                <div class="history-status ${item.status}">${this.getStatusDisplayName(item.status)}</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    // 计算持续时间
    calculateDuration(startTime, endTime) {
        if (!endTime) return '进行中';
        
        const duration = new Date(endTime) - new Date(startTime);
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        return `${minutes}分${seconds}秒`;
    }
    
    // 筛选历史记录
    filterHistory() {
        const typeFilter = document.getElementById('history-type-filter')?.value;
        const statusFilter = document.getElementById('history-status-filter')?.value;
        const dateFilter = document.getElementById('history-date-filter')?.value;
        
        // 这里可以实现筛选逻辑
        console.log('筛选历史记录:', { typeFilter, statusFilter, dateFilter });
        
        // 重新加载历史记录
        this.loadGenerationHistory();
    }
    
    // 导出数据
    exportData() {
        const data = {
            systemStats: this.systemStats,
            generationTasks: Array.from(this.generationTasks.values()),
            performanceMetrics: this.performanceMonitor.getMetrics(),
            recentEvents: this.performanceMonitor.getRecentEvents(50),
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-generator-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('success', '数据导出完成');
    }
    
    // 导出生成历史
    exportGenerationHistory() {
        // 这里可以实现导出历史记录的功能
        this.showNotification('info', '历史记录导出功能开发中...');
    }
}

// 全局实例
let dataGeneratorPanel;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    dataGeneratorPanel = new DataGeneratorPanel({
        container: '#data-generator-container',
        config: {
            defaultType: 'questionnaire',
            defaultCount: 15,
            defaultQuality: 'standard',
            enableAI: true,
            enableLocal: true
        },
        onGenerationStart: (config) => {
            console.log('生成开始:', config);
        },
        onGenerationProgress: (progress) => {
            console.log('生成进度:', progress);
        },
        onGenerationComplete: (result) => {
            console.log('生成完成:', result);
        },
        onError: (error) => {
            console.error('生成错误:', error);
        }
    });
    
    console.log('🚀 数据生成器面板已启动');
});

// 导出到全局
if (typeof window !== 'undefined') {
    window.DataGeneratorPanel = DataGeneratorPanel;
    window.dataGeneratorPanel = dataGeneratorPanel;
}
