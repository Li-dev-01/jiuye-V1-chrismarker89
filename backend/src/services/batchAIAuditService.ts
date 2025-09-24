/**
 * 批量AI审核服务
 * 实现每10条或1分钟周期的批量AI审核机制
 */

import { CloudflareEmploymentSafetyChecker } from '../utils/employmentContentSafety';
import { getRecommendedModelConfig } from '../utils/aiModelChecker';

export interface PendingStory {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_ip?: string;
}

export interface BatchAuditResult {
  batchId: string;
  processedCount: number;
  approvedCount: number;
  rejectedCount: number;
  manualReviewCount: number;
  processingTimeMs: number;
  results: StoryAuditResult[];
}

export interface StoryAuditResult {
  storyId: number;
  decision: 'approve' | 'reject' | 'manual_review';
  riskScore: number;
  confidence: number;
  violations: string[];
  aiAnalysis: any;
}

export class BatchAIAuditService {
  private env: any;
  private db: any;
  private batchQueue: PendingStory[] = [];
  private isProcessing = false;
  private lastBatchTime = Date.now();
  
  // 配置参数
  private readonly BATCH_SIZE = 10;           // 批量大小
  private readonly BATCH_TIMEOUT = 60000;    // 1分钟超时
  private readonly CHECK_INTERVAL = 10000;   // 10秒检查间隔

  constructor(env: any, db: any) {
    this.env = env;
    this.db = db;
    this.startScheduler();
  }

  /**
   * 启动批量审核调度器
   */
  private startScheduler() {
    setInterval(async () => {
      await this.checkAndProcessBatch();
    }, this.CHECK_INTERVAL);

    console.log('[BATCH_AUDIT] 批量AI审核调度器已启动');
  }

  /**
   * 添加故事到批量审核队列
   */
  async addToBatch(story: PendingStory): Promise<void> {
    this.batchQueue.push(story);
    
    console.log(`[BATCH_AUDIT] 故事 ${story.id} 已加入批量队列，当前队列长度: ${this.batchQueue.length}`);

    // 检查是否需要立即处理
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      console.log('[BATCH_AUDIT] 队列已满，触发立即处理');
      await this.processBatch();
    }
  }

  /**
   * 检查并处理批次
   */
  private async checkAndProcessBatch(): Promise<void> {
    if (this.isProcessing || this.batchQueue.length === 0) {
      return;
    }

    const timeSinceLastBatch = Date.now() - this.lastBatchTime;
    const shouldProcessByTime = timeSinceLastBatch >= this.BATCH_TIMEOUT;
    const shouldProcessBySize = this.batchQueue.length >= this.BATCH_SIZE;

    if (shouldProcessByTime || shouldProcessBySize) {
      const reason = shouldProcessBySize ? '队列已满' : '时间到达';
      console.log(`[BATCH_AUDIT] ${reason}，开始处理批次，队列长度: ${this.batchQueue.length}`);
      await this.processBatch();
    }
  }

  /**
   * 处理当前批次
   */
  private async processBatch(): Promise<BatchAuditResult | null> {
    if (this.isProcessing || this.batchQueue.length === 0) {
      return null;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 取出当前批次的故事
    const currentBatch = this.batchQueue.splice(0, this.BATCH_SIZE);
    
    try {
      console.log(`[BATCH_AUDIT] 开始处理批次 ${batchId}，包含 ${currentBatch.length} 个故事`);

      // 创建批次记录
      await this.createBatchRecord(batchId, currentBatch.length);

      // 更新故事状态为AI审核中
      await this.updateStoriesStatus(currentBatch.map(s => s.id), 'ai_checking', batchId);

      // 执行AI批量审核
      const results = await this.performBatchAIAudit(currentBatch, batchId);

      // 处理审核结果
      await this.processBatchResults(batchId, results);

      const processingTime = Date.now() - startTime;
      
      // 统计结果
      const approvedCount = results.filter(r => r.decision === 'approve').length;
      const rejectedCount = results.filter(r => r.decision === 'reject').length;
      const manualReviewCount = results.filter(r => r.decision === 'manual_review').length;

      const batchResult: BatchAuditResult = {
        batchId,
        processedCount: results.length,
        approvedCount,
        rejectedCount,
        manualReviewCount,
        processingTimeMs: processingTime,
        results
      };

      // 更新批次记录
      await this.completeBatchRecord(batchId, batchResult);

      console.log(`[BATCH_AUDIT] 批次 ${batchId} 处理完成: ${approvedCount}通过, ${rejectedCount}拒绝, ${manualReviewCount}人工审核, 耗时${processingTime}ms`);

      this.lastBatchTime = Date.now();
      return batchResult;

    } catch (error) {
      console.error(`[BATCH_AUDIT] 批次 ${batchId} 处理失败:`, error);
      
      // 标记批次失败
      await this.failBatchRecord(batchId, error);
      
      // 将故事状态重置为待审核
      await this.updateStoriesStatus(currentBatch.map(s => s.id), 'rule_passed');
      
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 执行AI批量审核
   */
  private async performBatchAIAudit(stories: PendingStory[], batchId: string): Promise<StoryAuditResult[]> {
    // 获取AI模型配置
    const { models } = await getRecommendedModelConfig(this.env.AI);
    
    // 创建安全检测器
    const safetyChecker = new CloudflareEmploymentSafetyChecker(this.env.AI, models);
    
    // 并行处理所有故事
    const auditPromises = stories.map(async (story): Promise<StoryAuditResult> => {
      try {
        const safetyResult = await safetyChecker.checkContent(story.content, 'story');
        
        // 决策逻辑
        let decision: 'approve' | 'reject' | 'manual_review';
        
        if (safetyResult.riskScore < 0.3 && safetyResult.confidence > 0.8) {
          decision = 'approve';
        } else if (safetyResult.riskScore > 0.7 || safetyResult.violations.includes('profanity_detected')) {
          decision = 'reject';
        } else {
          decision = 'manual_review';
        }

        return {
          storyId: story.id,
          decision,
          riskScore: safetyResult.riskScore,
          confidence: safetyResult.confidence,
          violations: safetyResult.violations,
          aiAnalysis: safetyResult
        };

      } catch (error) {
        console.error(`[BATCH_AUDIT] 故事 ${story.id} AI审核失败:`, error);
        
        // AI失败时转人工审核
        return {
          storyId: story.id,
          decision: 'manual_review',
          riskScore: 0.5,
          confidence: 0.0,
          violations: ['ai_analysis_failed'],
          aiAnalysis: { error: error.message }
        };
      }
    });

    return await Promise.all(auditPromises);
  }

  /**
   * 处理批次审核结果
   */
  private async processBatchResults(batchId: string, results: StoryAuditResult[]): Promise<void> {
    for (const result of results) {
      try {
        // 更新故事状态和审核结果
        await this.updateStoryAuditResult(result);

        // 如果被拒绝，记录违规内容
        if (result.decision === 'reject') {
          await this.recordViolation(result);
        }

        // 如果需要人工审核，加入人工审核队列
        if (result.decision === 'manual_review') {
          await this.addToManualReviewQueue(result.storyId);
        }

        // 如果通过，移动到正式表
        if (result.decision === 'approve') {
          await this.approveStory(result.storyId);
        }

      } catch (error) {
        console.error(`[BATCH_AUDIT] 处理故事 ${result.storyId} 结果失败:`, error);
      }
    }
  }

  /**
   * 创建批次记录
   */
  private async createBatchRecord(batchId: string, storyCount: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_audit_batches (id, story_count, status, created_at)
      VALUES (?, ?, 'processing', CURRENT_TIMESTAMP)
    `);
    
    await stmt.bind(batchId, storyCount).run();
  }

  /**
   * 完成批次记录
   */
  private async completeBatchRecord(batchId: string, result: BatchAuditResult): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE ai_audit_batches 
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          processing_time_ms = ?,
          success_count = ?,
          approved_count = ?,
          rejected_count = ?,
          manual_review_count = ?,
          batch_result = ?
      WHERE id = ?
    `);
    
    await stmt.bind(
      result.processingTimeMs,
      result.processedCount,
      result.approvedCount,
      result.rejectedCount,
      result.manualReviewCount,
      JSON.stringify(result),
      batchId
    ).run();
  }

  /**
   * 标记批次失败
   */
  private async failBatchRecord(batchId: string, error: any): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE ai_audit_batches 
      SET status = 'failed',
          completed_at = CURRENT_TIMESTAMP,
          error_details = ?
      WHERE id = ?
    `);
    
    await stmt.bind(JSON.stringify({ error: error.message }), batchId).run();
  }

  /**
   * 更新故事状态
   */
  private async updateStoriesStatus(storyIds: number[], status: string, batchId?: string): Promise<void> {
    const placeholders = storyIds.map(() => '?').join(',');
    const setBatch = batchId ? ', ai_batch_id = ?' : '';
    const params = batchId ? [...storyIds, status, batchId] : [...storyIds, status];
    
    const stmt = this.db.prepare(`
      UPDATE pending_stories 
      SET status = ?${setBatch}
      WHERE id IN (${placeholders})
    `);
    
    await stmt.bind(...params.reverse()).run();
  }

  /**
   * 更新故事审核结果
   */
  private async updateStoryAuditResult(result: StoryAuditResult): Promise<void> {
    const status = result.decision === 'approve' ? 'ai_passed' : 
                  result.decision === 'reject' ? 'rejected' : 'manual_review';
    
    const stmt = this.db.prepare(`
      UPDATE pending_stories 
      SET status = ?,
          ai_audit_at = CURRENT_TIMESTAMP,
          ai_audit_result = ?
      WHERE id = ?
    `);
    
    await stmt.bind(status, JSON.stringify(result), result.storyId).run();
  }

  /**
   * 记录违规内容
   */
  private async recordViolation(result: StoryAuditResult): Promise<void> {
    // 获取故事详情
    const story = await this.db.prepare('SELECT * FROM pending_stories WHERE id = ?')
      .bind(result.storyId).first();
    
    if (!story) return;

    // 确定主要违规类型
    const violationType = this.determineViolationType(result.violations);
    
    const stmt = this.db.prepare(`
      INSERT INTO violation_records (
        pending_story_id, user_id, content, content_hash,
        violation_type, detected_by, violation_details,
        risk_score, confidence, user_ip, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const contentHash = await this.generateContentHash(story.content);
    
    await stmt.bind(
      result.storyId,
      story.user_id,
      story.content,
      contentHash,
      violationType,
      'ai_analysis',
      JSON.stringify(result.aiAnalysis),
      result.riskScore,
      result.confidence,
      story.user_ip
    ).run();
  }

  /**
   * 确定违规类型
   */
  private determineViolationType(violations: string[]): string {
    if (violations.includes('profanity_detected')) return 'profanity';
    if (violations.includes('political_content')) return 'political';
    if (violations.includes('adult_content')) return 'adult_content';
    if (violations.includes('off_topic')) return 'off_topic';
    return 'other';
  }

  /**
   * 生成内容哈希
   */
  private async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 添加到人工审核队列
   */
  private async addToManualReviewQueue(storyId: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO manual_review_queue (pending_story_id, priority, status, created_at)
      VALUES (?, 5, 'waiting', CURRENT_TIMESTAMP)
    `);
    
    await stmt.bind(storyId).run();
  }

  /**
   * 批准故事 - 移动到正式表
   */
  private async approveStory(storyId: number): Promise<void> {
    // 获取待审核故事
    const pendingStory = await this.db.prepare('SELECT * FROM pending_stories WHERE id = ?')
      .bind(storyId).first();
    
    if (!pendingStory) return;

    // 插入到正式故事表
    const insertStmt = this.db.prepare(`
      INSERT INTO stories (user_id, content, created_at, audit_status)
      VALUES (?, ?, ?, 'approved')
    `);
    
    await insertStmt.bind(
      pendingStory.user_id,
      pendingStory.content,
      pendingStory.created_at
    ).run();

    // 更新待审核表状态
    const updateStmt = this.db.prepare(`
      UPDATE pending_stories 
      SET status = 'approved', approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    await updateStmt.bind(storyId).run();

    console.log(`[BATCH_AUDIT] 故事 ${storyId} 已批准并移动到正式表`);
  }

  /**
   * 获取批量审核统计
   */
  async getBatchAuditStats(): Promise<any> {
    const stats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_batches,
        SUM(story_count) as total_stories_processed,
        SUM(approved_count) as total_approved,
        SUM(rejected_count) as total_rejected,
        SUM(manual_review_count) as total_manual_review,
        AVG(processing_time_ms) as avg_processing_time
      FROM ai_audit_batches
      WHERE status = 'completed'
    `).first();

    return {
      ...stats,
      queue_length: this.batchQueue.length,
      is_processing: this.isProcessing,
      last_batch_time: new Date(this.lastBatchTime).toISOString()
    };
  }
}
