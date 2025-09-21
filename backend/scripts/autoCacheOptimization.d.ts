/**
 * 自动缓存优化脚本
 * 定期分析缓存使用模式并应用优化建议
 */
export interface AutoOptimizationConfig {
    enabled: boolean;
    analysisInterval: number;
    applyThreshold: {
        minCacheHitRate: number;
        maxResponseTime: number;
        minRequestFrequency: number;
    };
    safetyLimits: {
        maxFrequencyIncrease: number;
        minFrequencyDecrease: number;
        maxSyncFrequency: number;
        minSyncFrequency: number;
    };
}
export declare class AutoCacheOptimizer {
    private db;
    private config;
    private cacheOptimizer;
    constructor(db: D1Database, config?: Partial<AutoOptimizationConfig>);
    /**
     * 执行自动优化
     */
    runAutoOptimization(): Promise<{
        success: boolean;
        analysis: any;
        recommendations: any[];
        applied: any[];
        skipped: any[];
        errors: string[];
    }>;
    /**
     * 筛选可应用的建议
     */
    private filterApplicableRecommendations;
    /**
     * 应用安全限制
     */
    private applySafetyLimits;
    /**
     * 记录优化历史
     */
    private recordOptimizationHistory;
    /**
     * 更新优化状态
     */
    private updateOptimizationStatus;
    /**
     * 获取优化历史
     */
    getOptimizationHistory(limit?: number): Promise<any[]>;
    /**
     * 获取优化状态
     */
    getOptimizationStatus(): Promise<any>;
}
//# sourceMappingURL=autoCacheOptimization.d.ts.map