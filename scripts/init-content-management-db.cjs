#!/usr/bin/env node

/**
 * 用户内容管理系统数据库初始化脚本
 * 创建必要的数据库表和索引，用于支持内容管理功能
 */

const fs = require('fs');
const path = require('path');

// 数据库表创建SQL
const createTablesSQL = `
-- 1. 内容管理日志表
CREATE TABLE IF NOT EXISTS content_management_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_ids TEXT,
    reason TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_logs_operation_type ON content_management_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_content_logs_operator_id ON content_management_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_content_logs_created_at ON content_management_logs(created_at);

-- 2. 可疑内容标记表
CREATE TABLE IF NOT EXISTS suspicious_content_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    user_id TEXT,
    ip_address TEXT,
    flag_reason TEXT NOT NULL,
    flag_type TEXT NOT NULL,
    confidence_score REAL,
    auto_detected BOOLEAN DEFAULT 0,
    flagged_by TEXT NOT NULL,
    flagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    resolved_by TEXT,
    resolved_at DATETIME,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_suspicious_content_type_id ON suspicious_content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_user_id ON suspicious_content_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_ip_address ON suspicious_content_flags(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_flag_type ON suspicious_content_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_status ON suspicious_content_flags(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_flagged_at ON suspicious_content_flags(flagged_at);

-- 3. IP地址信息表
CREATE TABLE IF NOT EXISTS ip_address_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL UNIQUE,
    country TEXT,
    region TEXT,
    city TEXT,
    isp TEXT,
    organization TEXT,
    is_proxy BOOLEAN DEFAULT 0,
    is_vpn BOOLEAN DEFAULT 0,
    is_tor BOOLEAN DEFAULT 0,
    risk_score REAL DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    unique_users_count INTEGER DEFAULT 0,
    first_seen DATETIME,
    last_seen DATETIME,
    is_blocked BOOLEAN DEFAULT 0,
    blocked_reason TEXT,
    blocked_at DATETIME,
    blocked_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ip_info_ip_address ON ip_address_info(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_info_country ON ip_address_info(country);
CREATE INDEX IF NOT EXISTS idx_ip_info_risk_score ON ip_address_info(risk_score);
CREATE INDEX IF NOT EXISTS idx_ip_info_submission_count ON ip_address_info(submission_count);
CREATE INDEX IF NOT EXISTS idx_ip_info_is_blocked ON ip_address_info(is_blocked);
CREATE INDEX IF NOT EXISTS idx_ip_info_last_seen ON ip_address_info(last_seen);

-- 4. 用户提交统计表
CREATE TABLE IF NOT EXISTS user_submission_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    user_uuid TEXT,
    ip_address TEXT,
    questionnaire_count INTEGER DEFAULT 0,
    heart_voice_count INTEGER DEFAULT 0,
    story_count INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    first_submission DATETIME,
    last_submission DATETIME,
    avg_content_length REAL,
    flagged_count INTEGER DEFAULT 0,
    deleted_count INTEGER DEFAULT 0,
    risk_score REAL DEFAULT 0,
    is_suspicious BOOLEAN DEFAULT 0,
    suspicious_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_submission_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_uuid ON user_submission_stats(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_stats_ip_address ON user_submission_stats(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_submissions ON user_submission_stats(total_submissions);
CREATE INDEX IF NOT EXISTS idx_user_stats_risk_score ON user_submission_stats(risk_score);
CREATE INDEX IF NOT EXISTS idx_user_stats_is_suspicious ON user_submission_stats(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_submission ON user_submission_stats(last_submission);

-- 5. 内容相似度检测表
CREATE TABLE IF NOT EXISTS content_similarity_detection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id_1 TEXT NOT NULL,
    content_id_2 TEXT NOT NULL,
    similarity_score REAL NOT NULL,
    similarity_type TEXT NOT NULL,
    detection_method TEXT NOT NULL,
    user_id_1 TEXT,
    user_id_2 TEXT,
    ip_address_1 TEXT,
    ip_address_2 TEXT,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed BOOLEAN DEFAULT 0,
    review_result TEXT,
    reviewed_by TEXT,
    reviewed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_similarity_content_type ON content_similarity_detection(content_type);
CREATE INDEX IF NOT EXISTS idx_similarity_score ON content_similarity_detection(similarity_score);
CREATE INDEX IF NOT EXISTS idx_similarity_type ON content_similarity_detection(similarity_type);
CREATE INDEX IF NOT EXISTS idx_similarity_detected_at ON content_similarity_detection(detected_at);
CREATE INDEX IF NOT EXISTS idx_similarity_reviewed ON content_similarity_detection(reviewed);

-- 6. 批量操作记录表
CREATE TABLE IF NOT EXISTS batch_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id TEXT NOT NULL UNIQUE,
    operation_type TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    target_criteria TEXT NOT NULL,
    affected_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    progress REAL DEFAULT 0,
    error_details TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batch_ops_operation_id ON batch_operations(operation_id);
CREATE INDEX IF NOT EXISTS idx_batch_ops_operation_type ON batch_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_batch_ops_operator_id ON batch_operations(operator_id);
CREATE INDEX IF NOT EXISTS idx_batch_ops_status ON batch_operations(status);
CREATE INDEX IF NOT EXISTS idx_batch_ops_created_at ON batch_operations(created_at);

-- 7. 内容审核队列表
CREATE TABLE IF NOT EXISTS content_review_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    user_id TEXT,
    ip_address TEXT,
    priority INTEGER DEFAULT 5,
    review_reason TEXT NOT NULL,
    auto_flagged BOOLEAN DEFAULT 0,
    flag_details TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'pending',
    review_result TEXT,
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_queue_content_type_id ON content_review_queue(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_user_id ON content_review_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_ip_address ON content_review_queue(ip_address);
CREATE INDEX IF NOT EXISTS idx_review_queue_priority ON content_review_queue(priority);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON content_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_assigned_to ON content_review_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_review_queue_created_at ON content_review_queue(created_at);

-- 8. 系统配置表
CREATE TABLE IF NOT EXISTS content_management_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_sensitive BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_config_key ON content_management_config(config_key);
CREATE INDEX IF NOT EXISTS idx_config_category ON content_management_config(category);
`;

// 默认配置数据
const defaultConfigSQL = `
-- 插入默认配置
INSERT OR IGNORE INTO content_management_config (config_key, config_value, config_type, description, category) VALUES
('duplicate_detection_threshold', '0.8', 'number', '重复内容检测阈值', 'detection'),
('ip_submission_limit', '10', 'number', '单IP每日提交限制', 'limits'),
('user_submission_limit', '5', 'number', '单用户每日提交限制', 'limits'),
('auto_flag_enabled', 'true', 'boolean', '是否启用自动标记', 'automation'),
('similarity_check_enabled', 'true', 'boolean', '是否启用相似度检测', 'detection'),
('high_risk_ip_threshold', '0.7', 'number', '高风险IP阈值', 'security'),
('batch_operation_limit', '1000', 'number', '批量操作限制', 'limits'),
('content_retention_days', '365', 'number', '内容保留天数', 'retention'),
('auto_review_enabled', 'false', 'boolean', '是否启用自动审核', 'automation'),
('suspicious_pattern_detection', 'true', 'boolean', '是否启用可疑模式检测', 'detection');
`;

// 触发器创建SQL
const createTriggersSQL = `
-- 创建触发器：自动更新IP统计信息
CREATE TRIGGER IF NOT EXISTS update_ip_stats_on_heart_voice_insert
AFTER INSERT ON valid_heart_voices
WHEN NEW.ip_address IS NOT NULL AND NEW.ip_address != ''
BEGIN
    INSERT OR REPLACE INTO ip_address_info (
        ip_address, 
        submission_count, 
        first_seen, 
        last_seen,
        updated_at
    ) VALUES (
        NEW.ip_address,
        COALESCE((SELECT submission_count FROM ip_address_info WHERE ip_address = NEW.ip_address), 0) + 1,
        COALESCE((SELECT first_seen FROM ip_address_info WHERE ip_address = NEW.ip_address), NEW.created_at),
        NEW.created_at,
        CURRENT_TIMESTAMP
    );
END;

-- 创建触发器：自动更新用户统计
CREATE TRIGGER IF NOT EXISTS update_user_stats_on_heart_voice_insert
AFTER INSERT ON valid_heart_voices
BEGIN
    INSERT OR REPLACE INTO user_submission_stats (
        user_id,
        ip_address,
        heart_voice_count,
        total_submissions,
        first_submission,
        last_submission,
        updated_at
    ) VALUES (
        NEW.user_id,
        NEW.ip_address,
        COALESCE((SELECT heart_voice_count FROM user_submission_stats WHERE user_id = NEW.user_id), 0) + 1,
        COALESCE((SELECT total_submissions FROM user_submission_stats WHERE user_id = NEW.user_id), 0) + 1,
        COALESCE((SELECT first_submission FROM user_submission_stats WHERE user_id = NEW.user_id), NEW.created_at),
        NEW.created_at,
        CURRENT_TIMESTAMP
    );
END;

-- 创建触发器：自动更新用户统计（故事）
CREATE TRIGGER IF NOT EXISTS update_user_stats_on_story_insert
AFTER INSERT ON valid_stories
BEGIN
    INSERT OR REPLACE INTO user_submission_stats (
        user_id,
        story_count,
        total_submissions,
        first_submission,
        last_submission,
        updated_at
    ) VALUES (
        NEW.user_id,
        COALESCE((SELECT story_count FROM user_submission_stats WHERE user_id = NEW.user_id), 0) + 1,
        COALESCE((SELECT total_submissions FROM user_submission_stats WHERE user_id = NEW.user_id), 0) + 1,
        COALESCE((SELECT first_submission FROM user_submission_stats WHERE user_id = NEW.user_id), NEW.created_at),
        NEW.created_at,
        CURRENT_TIMESTAMP
    );
END;

-- 创建触发器：自动更新用户统计（问卷）
CREATE TRIGGER IF NOT EXISTS update_user_stats_on_questionnaire_insert
AFTER INSERT ON universal_questionnaire_responses
BEGIN
    INSERT OR REPLACE INTO user_submission_stats (
        user_id,
        user_uuid,
        questionnaire_count,
        total_submissions,
        first_submission,
        last_submission,
        updated_at
    ) VALUES (
        COALESCE(NEW.user_uuid, NEW.user_id),
        NEW.user_uuid,
        COALESCE((SELECT questionnaire_count FROM user_submission_stats WHERE user_id = COALESCE(NEW.user_uuid, NEW.user_id)), 0) + 1,
        COALESCE((SELECT total_submissions FROM user_submission_stats WHERE user_id = COALESCE(NEW.user_uuid, NEW.user_id)), 0) + 1,
        COALESCE((SELECT first_submission FROM user_submission_stats WHERE user_id = COALESCE(NEW.user_uuid, NEW.user_id)), NEW.submitted_at),
        NEW.submitted_at,
        CURRENT_TIMESTAMP
    );
END;
`;

/**
 * 执行SQL脚本
 */
function executeSQLScript(sqlScript, description) {
  console.log(`\n📝 ${description}...`);
  
  // 这里应该连接到实际的数据库执行SQL
  // 由于我们使用的是Cloudflare D1，这个脚本主要用于生成SQL文件
  
  console.log(`✅ ${description}完成`);
  return true;
}

/**
 * 生成完整的SQL文件
 */
function generateSQLFile() {
  const fullSQL = [
    '-- 用户内容管理系统数据库初始化脚本',
    '-- 生成时间: ' + new Date().toISOString(),
    '',
    createTablesSQL,
    '',
    defaultConfigSQL,
    '',
    createTriggersSQL
  ].join('\n');

  const outputPath = path.join(__dirname, 'content-management-init.sql');
  fs.writeFileSync(outputPath, fullSQL, 'utf8');
  
  console.log(`📄 完整SQL文件已生成: ${outputPath}`);
  return outputPath;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 用户内容管理系统数据库初始化');
  console.log('=' * 50);

  try {
    // 生成SQL文件
    const sqlFilePath = generateSQLFile();
    
    console.log('\n📊 数据库表结构:');
    console.log('  ✅ content_management_logs - 内容管理日志');
    console.log('  ✅ suspicious_content_flags - 可疑内容标记');
    console.log('  ✅ ip_address_info - IP地址信息');
    console.log('  ✅ user_submission_stats - 用户提交统计');
    console.log('  ✅ content_similarity_detection - 内容相似度检测');
    console.log('  ✅ batch_operations - 批量操作记录');
    console.log('  ✅ content_review_queue - 内容审核队列');
    console.log('  ✅ content_management_config - 系统配置');

    console.log('\n🔧 功能特性:');
    console.log('  ✅ IP地址追踪和统计');
    console.log('  ✅ 用户提交行为分析');
    console.log('  ✅ 重复内容检测');
    console.log('  ✅ 批量操作记录');
    console.log('  ✅ 可疑内容自动标记');
    console.log('  ✅ 内容审核队列管理');
    console.log('  ✅ 系统配置管理');

    console.log('\n📋 使用说明:');
    console.log('  1. 将生成的SQL文件导入到Cloudflare D1数据库');
    console.log('  2. 确保现有的表结构兼容');
    console.log('  3. 验证触发器正常工作');
    console.log('  4. 配置系统参数');

    console.log('\n🎉 数据库初始化脚本生成完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  createTablesSQL,
  defaultConfigSQL,
  createTriggersSQL,
  generateSQLFile
};
