-- 简化版数据库类型一致性修复
-- 修复 universal_questionnaire_responses 表中 user_id 字段类型不匹配问题

-- 记录修复开始
INSERT INTO migration_logs (migration_name, status, details) 
VALUES ('027_fix_data_type_consistency_simple', 'started', '开始修复user_id字段类型不匹配问题');

-- 第1步：检查当前表结构
-- 这里只是注释，实际检查通过PRAGMA table_info完成

-- 第2步：创建备份表
CREATE TABLE IF NOT EXISTS universal_questionnaire_responses_backup AS 
SELECT * FROM universal_questionnaire_responses;

-- 第3步：创建新表结构（user_id改为TEXT类型）
CREATE TABLE universal_questionnaire_responses_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    user_id TEXT,  -- 改为TEXT类型以匹配users.id
    response_data TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 第4步：迁移数据（将INTEGER类型的user_id转换为TEXT）
INSERT INTO universal_questionnaire_responses_new (
    id, questionnaire_id, user_id, response_data, submitted_at, 
    ip_address, user_agent, created_at, updated_at
)
SELECT 
    id, 
    questionnaire_id, 
    CASE 
        WHEN user_id IS NOT NULL THEN CAST(user_id AS TEXT)
        ELSE NULL 
    END as user_id,
    response_data, 
    submitted_at, 
    ip_address, 
    user_agent, 
    created_at, 
    updated_at
FROM universal_questionnaire_responses;

-- 第5步：删除原表
DROP TABLE universal_questionnaire_responses;

-- 第6步：重命名新表
ALTER TABLE universal_questionnaire_responses_new 
RENAME TO universal_questionnaire_responses;

-- 第7步：创建索引
CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_questionnaire_id 
ON universal_questionnaire_responses(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_user_id 
ON universal_questionnaire_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_submitted_at 
ON universal_questionnaire_responses(submitted_at);

-- 第8步：验证数据完整性
-- 检查记录数量是否一致（通过应用程序验证）

-- 记录修复完成
INSERT INTO migration_logs (migration_name, status, details) 
VALUES ('027_fix_data_type_consistency_simple', 'completed', 'user_id字段类型修复完成，已从INTEGER改为TEXT');

-- 清理备份表（可选，建议保留一段时间）
-- DROP TABLE universal_questionnaire_responses_backup;
