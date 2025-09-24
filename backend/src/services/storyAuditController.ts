/**
 * 故事审核流程控制器
 * 统一管理三层审核流程：规则审核 → AI审核 → 人工审核
 */

import { TieredAuditManager } from './tieredAuditService';
import { BatchAIAuditService } from './batchAIAuditService';

export interface StorySubmission {
  user_id: number;
  content: string;
  user_ip?: string;
  user_agent?: string;
  session_id?: string;
}

export interface AuditFlowResult {
  success: boolean;
  story_id?: number;
  status: 'pending' | 'rule_passed' | 'ai_checking' | 'approved' | 'rejected' | 'manual_review';
  message: string;
  next_step?: string;
}

export class StoryAuditController {
  private env: any;
  private db: any;
  private auditManager: TieredAuditManager;
  private batchAIService: BatchAIAuditService;

  constructor(env: any, db: any) {
    this.env = env;
    this.db = db;
    this.auditManager = new TieredAuditManager(env);
    this.batchAIService = new BatchAIAuditService(env, db);
  }

  /**
   * 处理故事提交 - 主入口
   */
  async processStorySubmission(submission: StorySubmission): Promise<AuditFlowResult> {
    try {
      console.log(`[STORY_AUDIT] 开始处理用户 ${submission.user_id} 的故事提交`);

      // 1. 检查用户是否被封禁
      const userCheck = await this.checkUserStatus(submission.user_id);
      if (!userCheck.allowed) {
        return {
          success: false,
          status: 'rejected',
          message: userCheck.reason || '用户被限制发布内容'
        };
      }

      // 2. 创建待审核记录
      const storyId = await this.createPendingStory(submission);

      // 3. 执行第一层：规则审核
      const ruleResult = await this.performRuleAudit(storyId, submission.content, submission.user_ip);

      if (ruleResult.decision === 'approve') {
        // 规则审核通过，直接批准
        await this.approveStoryDirectly(storyId);
        return {
          success: true,
          story_id: storyId,
          status: 'approved',
          message: '故事已发布成功',
          next_step: 'story_published'
        };
      } else if (ruleResult.decision === 'reject') {
        // 规则审核拒绝
        await this.rejectStory(storyId, ruleResult);
        return {
          success: false,
          story_id: storyId,
          status: 'rejected',
          message: '内容不符合社区规范，发布失败'
        };
      } else {
        // 规则审核无法确定，进入AI审核
        await this.updateStoryStatus(storyId, 'rule_passed', ruleResult);
        await this.scheduleAIAudit(storyId);
        
        return {
          success: true,
          story_id: storyId,
          status: 'rule_passed',
          message: '故事已提交，正在审核中',
          next_step: 'ai_audit_scheduled'
        };
      }

    } catch (error) {
      console.error('[STORY_AUDIT] 故事提交处理失败:', error);
      return {
        success: false,
        status: 'pending',
        message: '系统错误，请稍后重试'
      };
    }
  }

  /**
   * 检查用户状态
   */
  private async checkUserStatus(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    // 检查用户是否被封禁
    const userAnalysis = await this.db.prepare(`
      SELECT is_blocked, block_reason, risk_level, violations_last_24h
      FROM user_violation_analysis 
      WHERE user_id = ?
    `).bind(userId).first();

    if (userAnalysis?.is_blocked) {
      return {
        allowed: false,
        reason: userAnalysis.block_reason || '用户已被封禁'
      };
    }

    // 检查24小时内违规次数
    if (userAnalysis?.violations_last_24h >= 5) {
      return {
        allowed: false,
        reason: '24小时内违规次数过多，请稍后再试'
      };
    }

    // 检查风险等级
    if (userAnalysis?.risk_level === 'critical') {
      return {
        allowed: false,
        reason: '用户风险等级过高'
      };
    }

    return { allowed: true };
  }

  /**
   * 创建待审核故事记录
   */
  private async createPendingStory(submission: StorySubmission): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO pending_stories (
        user_id, content, status, audit_level, 
        user_ip, user_agent, created_at
      ) VALUES (?, ?, 'pending', 1, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = await stmt.bind(
      submission.user_id,
      submission.content,
      submission.user_ip,
      submission.user_agent
    ).run();

    const storyId = result.meta.last_row_id;
    console.log(`[STORY_AUDIT] 创建待审核故事记录，ID: ${storyId}`);
    
    return storyId;
  }

  /**
   * 执行规则审核
   */
  private async performRuleAudit(storyId: number, content: string, userIP?: string): Promise<any> {
    console.log(`[STORY_AUDIT] 开始规则审核，故事ID: ${storyId}`);

    try {
      // 使用现有的分级审核服务
      const auditResult = await this.auditManager.checkContent(content, 'story', userIP);
      
      // 更新审核状态
      await this.updateStoryStatus(storyId, 'rule_checking', null);

      // 决策逻辑
      let decision: 'approve' | 'reject' | 'uncertain';
      
      if (auditResult.action === 'approve') {
        decision = 'approve';
      } else if (auditResult.action === 'reject') {
        decision = 'reject';
      } else {
        decision = 'uncertain';
      }

      const result = {
        decision,
        auditResult,
        processingTime: Date.now()
      };

      console.log(`[STORY_AUDIT] 规则审核完成，故事ID: ${storyId}, 决策: ${decision}`);
      return result;

    } catch (error) {
      console.error(`[STORY_AUDIT] 规则审核失败，故事ID: ${storyId}:`, error);
      return {
        decision: 'uncertain',
        auditResult: { action: 'review', reason: 'rule_audit_error' },
        error: error.message
      };
    }
  }

  /**
   * 安排AI审核
   */
  private async scheduleAIAudit(storyId: number): Promise<void> {
    console.log(`[STORY_AUDIT] 安排AI审核，故事ID: ${storyId}`);

    // 获取故事信息
    const story = await this.db.prepare('SELECT * FROM pending_stories WHERE id = ?')
      .bind(storyId).first();

    if (!story) {
      throw new Error(`故事 ${storyId} 不存在`);
    }

    // 添加到批量AI审核队列
    await this.batchAIService.addToBatch({
      id: story.id,
      user_id: story.user_id,
      content: story.content,
      created_at: story.created_at,
      user_ip: story.user_ip
    });

    console.log(`[STORY_AUDIT] 故事 ${storyId} 已加入AI审核队列`);
  }

  /**
   * 直接批准故事
   */
  private async approveStoryDirectly(storyId: number): Promise<void> {
    console.log(`[STORY_AUDIT] 直接批准故事，ID: ${storyId}`);

    // 获取待审核故事
    const pendingStory = await this.db.prepare('SELECT * FROM pending_stories WHERE id = ?')
      .bind(storyId).first();

    if (!pendingStory) {
      throw new Error(`故事 ${storyId} 不存在`);
    }

    // 插入到正式故事表
    const insertStmt = this.db.prepare(`
      INSERT INTO stories (user_id, content, created_at, audit_status, audit_type)
      VALUES (?, ?, ?, 'approved', 'rule_based')
    `);

    await insertStmt.bind(
      pendingStory.user_id,
      pendingStory.content,
      pendingStory.created_at
    ).run();

    // 更新待审核表状态
    await this.updateStoryStatus(storyId, 'approved', null);

    console.log(`[STORY_AUDIT] 故事 ${storyId} 已直接批准并发布`);
  }

  /**
   * 拒绝故事
   */
  private async rejectStory(storyId: number, auditResult: any): Promise<void> {
    console.log(`[STORY_AUDIT] 拒绝故事，ID: ${storyId}`);

    // 更新故事状态
    await this.updateStoryStatus(storyId, 'rejected', auditResult);

    // 记录违规内容
    await this.recordRuleViolation(storyId, auditResult);

    console.log(`[STORY_AUDIT] 故事 ${storyId} 已拒绝`);
  }

  /**
   * 更新故事状态
   */
  private async updateStoryStatus(storyId: number, status: string, auditResult: any): Promise<void> {
    const updateFields: string[] = ['status = ?'];
    const params: any[] = [status];

    // 根据状态添加相应的时间戳和结果
    if (status === 'rule_checking' || status === 'rule_passed') {
      updateFields.push('rule_audit_at = CURRENT_TIMESTAMP');
      if (auditResult) {
        updateFields.push('rule_audit_result = ?');
        params.push(JSON.stringify(auditResult));
      }
    } else if (status === 'approved') {
      updateFields.push('approved_at = CURRENT_TIMESTAMP');
    }

    params.push(storyId);

    const stmt = this.db.prepare(`
      UPDATE pending_stories 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    await stmt.bind(...params).run();
  }

  /**
   * 记录规则违规
   */
  private async recordRuleViolation(storyId: number, auditResult: any): Promise<void> {
    const story = await this.db.prepare('SELECT * FROM pending_stories WHERE id = ?')
      .bind(storyId).first();

    if (!story) return;

    // 确定违规类型
    const violationType = this.determineViolationTypeFromRule(auditResult);
    
    const stmt = this.db.prepare(`
      INSERT INTO violation_records (
        pending_story_id, user_id, content, content_hash,
        violation_type, detected_by, violation_details,
        risk_score, confidence, user_ip, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const contentHash = await this.generateContentHash(story.content);

    await stmt.bind(
      storyId,
      story.user_id,
      story.content,
      contentHash,
      violationType,
      'backend_rule',
      JSON.stringify(auditResult),
      auditResult.auditResult?.risk_score || 0.8,
      0.9, // 规则检测置信度较高
      story.user_ip
    ).run();
  }

  /**
   * 从规则审核结果确定违规类型
   */
  private determineViolationTypeFromRule(auditResult: any): string {
    const reason = auditResult.auditResult?.reason || '';
    
    if (reason.includes('profanity') || reason.includes('offensive')) return 'profanity';
    if (reason.includes('political')) return 'political';
    if (reason.includes('adult') || reason.includes('sexual')) return 'adult_content';
    if (reason.includes('spam')) return 'spam';
    if (reason.includes('off_topic')) return 'off_topic';
    
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
   * 获取故事审核状态
   */
  async getStoryAuditStatus(storyId: number): Promise<any> {
    const story = await this.db.prepare(`
      SELECT 
        id, user_id, status, audit_level,
        created_at, rule_audit_at, ai_audit_at, manual_audit_at, approved_at,
        rule_audit_result, ai_audit_result, manual_audit_result,
        ai_batch_id
      FROM pending_stories 
      WHERE id = ?
    `).bind(storyId).first();

    if (!story) {
      // 检查是否在正式表中
      const publishedStory = await this.db.prepare(`
        SELECT id, user_id, created_at, audit_status, audit_type
        FROM stories 
        WHERE id = ? OR (user_id = ? AND created_at = ?)
      `).bind(storyId, storyId, storyId).first();

      if (publishedStory) {
        return {
          ...publishedStory,
          status: 'published',
          is_published: true
        };
      }

      return null;
    }

    return {
      ...story,
      is_published: story.status === 'approved'
    };
  }

  /**
   * 获取审核统计
   */
  async getAuditStatistics(): Promise<any> {
    const statsResult = await this.db.prepare(`
      SELECT
        status,
        COUNT(*) as count,
        AVG(
          CASE
            WHEN approved_at IS NOT NULL THEN
              (julianday(approved_at) - julianday(created_at)) * 24 * 60 * 60 * 1000
            ELSE NULL
          END
        ) as avg_processing_time_ms
      FROM pending_stories
      GROUP BY status
    `).all();

    // 确保我们有一个数组
    const stats = statsResult.results || [];
    console.log('[AUDIT_CONTROLLER] Stats query result:', stats);

    const batchStats = await this.batchAIService.getBatchAuditStats();

    return {
      story_status_distribution: stats,
      batch_ai_stats: batchStats,
      total_pending: stats.find(s => s.status === 'pending')?.count || 0,
      total_approved: stats.find(s => s.status === 'approved')?.count || 0,
      total_rejected: stats.find(s => s.status === 'rejected')?.count || 0,
      total_manual_review: stats.find(s => s.status === 'manual_review')?.count || 0
    };
  }
}
