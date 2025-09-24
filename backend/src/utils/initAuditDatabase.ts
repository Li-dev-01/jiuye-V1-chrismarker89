/**
 * 初始化审核系统数据库
 * 创建所有必要的表和索引
 */

export async function initAuditDatabase(db: any): Promise<void> {
  console.log('[DB_INIT] 开始初始化审核系统数据库...');

  try {
    // 1. 创建待审核故事表
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pending_stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        audit_level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        rule_audit_at DATETIME,
        ai_audit_at DATETIME,
        manual_audit_at DATETIME,
        approved_at DATETIME,
        rule_audit_result TEXT,
        ai_audit_result TEXT,
        manual_audit_result TEXT,
        ai_batch_id TEXT,
        user_ip TEXT,
        user_agent TEXT
      )
    `).run();

    // 2. 创建违规内容记录表
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS violation_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pending_story_id INTEGER,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        violation_type TEXT NOT NULL,
        detected_by TEXT NOT NULL,
        violation_details TEXT,
        risk_score REAL,
        confidence REAL,
        user_ip TEXT,
        user_agent TEXT,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_analyzed BOOLEAN DEFAULT FALSE,
        is_pattern BOOLEAN DEFAULT FALSE,
        pattern_group_id TEXT
      )
    `).run();

    // 3. 创建用户违规行为分析表
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_violation_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        total_violations INTEGER DEFAULT 0,
        violation_types TEXT,
        first_violation_at DATETIME,
        last_violation_at DATETIME,
        violations_last_24h INTEGER DEFAULT 0,
        violations_last_7d INTEGER DEFAULT 0,
        violations_last_30d INTEGER DEFAULT 0,
        is_suspicious BOOLEAN DEFAULT FALSE,
        is_malicious BOOLEAN DEFAULT FALSE,
        risk_level TEXT DEFAULT 'low',
        rapid_submission_count INTEGER DEFAULT 0,
        similar_content_count INTEGER DEFAULT 0,
        is_blocked BOOLEAN DEFAULT FALSE,
        block_reason TEXT,
        blocked_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 4. 创建AI批量审核批次表
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_audit_batches (
        id TEXT PRIMARY KEY,
        story_count INTEGER NOT NULL,
        batch_type TEXT DEFAULT 'scheduled',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        processing_time_ms INTEGER,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        approved_count INTEGER DEFAULT 0,
        rejected_count INTEGER DEFAULT 0,
        manual_review_count INTEGER DEFAULT 0,
        batch_result TEXT,
        error_details TEXT
      )
    `).run();

    // 5. 创建人工审核队列表
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS manual_review_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pending_story_id INTEGER NOT NULL UNIQUE,
        priority INTEGER DEFAULT 5,
        assigned_to TEXT,
        assigned_at DATETIME,
        status TEXT DEFAULT 'waiting',
        review_result TEXT,
        review_reason TEXT,
        review_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME
      )
    `).run();

    // 6. 创建索引优化查询性能
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_pending_stories_status ON pending_stories(status)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_pending_stories_user_id ON pending_stories(user_id)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_pending_stories_created_at ON pending_stories(created_at)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_pending_stories_ai_batch ON pending_stories(ai_batch_id)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_violation_records_user_id ON violation_records(user_id)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_violation_records_type ON violation_records(violation_type)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_violation_records_hash ON violation_records(content_hash)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_violation_records_created_at ON violation_records(created_at)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_manual_review_status ON manual_review_queue(status)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_manual_review_priority ON manual_review_queue(priority)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_manual_review_assigned ON manual_review_queue(assigned_to)`).run();

    // 7. 创建触发器自动更新统计 (暂时跳过，触发器在D1中可能有兼容性问题)

    // 8. 确保stories表存在（如果不存在则创建）
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        audit_status TEXT DEFAULT 'approved',
        audit_type TEXT DEFAULT 'rule_based'
      )
    `).run();

    console.log('[DB_INIT] 审核系统数据库初始化完成');

    // 9. 验证表创建
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN (
        'pending_stories', 'violation_records', 'user_violation_analysis',
        'ai_audit_batches', 'manual_review_queue', 'stories'
      )
    `).all();

    console.log('[DB_INIT] 已创建的表:', tables.map(t => t.name));

    if (tables.length < 6) {
      throw new Error('部分表创建失败');
    }

  } catch (error) {
    console.error('[DB_INIT] 数据库初始化失败:', error);
    throw error;
  }
}

// 检查数据库是否已初始化
export async function checkAuditDatabaseInit(db: any): Promise<boolean> {
  try {
    const tables = await db.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type='table' AND name IN (
        'pending_stories', 'violation_records', 'user_violation_analysis',
        'ai_audit_batches', 'manual_review_queue'
      )
    `).first();

    return tables.count >= 5;
  } catch (error) {
    console.error('[DB_INIT] 检查数据库初始化状态失败:', error);
    return false;
  }
}
