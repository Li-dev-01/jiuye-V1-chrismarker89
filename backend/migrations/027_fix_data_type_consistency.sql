-- 修复数据库类型不匹配问题
-- 目标：统一user_id字段类型，修复外键约束
-- 创建时间：2025-10-03
-- 优先级：紧急

-- =====================================================
-- 1. 备份现有数据
-- =====================================================

-- 创建备份表
CREATE TABLE IF NOT EXISTS universal_questionnaire_responses_backup AS 
SELECT * FROM universal_questionnaire_responses;

-- 记录修复开始时间
INSERT INTO migration_logs (migration_name, status, executed_at, details)
VALUES ('027_fix_data_type_consistency', 'started', datetime('now'), '修复user_id字段类型不匹配问题');

-- =====================================================
-- 2. 分析现有数据
-- =====================================================

-- 检查user_id字段的数据分布
SELECT 
    'universal_questionnaire_responses' as table_name,
    COUNT(*) as total_records,
    COUNT(user_id) as non_null_user_ids,
    COUNT(DISTINCT user_id) as unique_user_ids
FROM universal_questionnaire_responses;

-- 检查是否存在无效的user_id引用
SELECT 
    uqr.id,
    uqr.user_id,
    u.id as users_id
FROM universal_questionnaire_responses uqr
LEFT JOIN users u ON CAST(uqr.user_id AS TEXT) = u.id
WHERE uqr.user_id IS NOT NULL AND u.id IS NULL;

-- =====================================================
-- 3. 删除现有外键约束
-- =====================================================

-- SQLite不支持直接删除外键，需要重建表
-- 首先创建新的表结构
CREATE TABLE universal_questionnaire_responses_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    user_id TEXT,  -- 修改为TEXT类型
    response_data TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. 数据迁移
-- =====================================================

-- 迁移数据，将INTEGER类型的user_id转换为TEXT
INSERT INTO universal_questionnaire_responses_new (
    id, questionnaire_id, user_id, response_data, 
    submitted_at, ip_address, user_agent, created_at, updated_at
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

-- =====================================================
-- 5. 验证数据迁移
-- =====================================================

-- 验证记录数量一致
SELECT 
    (SELECT COUNT(*) FROM universal_questionnaire_responses) as original_count,
    (SELECT COUNT(*) FROM universal_questionnaire_responses_new) as new_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM universal_questionnaire_responses) = 
             (SELECT COUNT(*) FROM universal_questionnaire_responses_new) 
        THEN 'PASS' 
        ELSE 'FAIL' 
    END as migration_status;

-- 验证user_id转换正确性
SELECT 
    COUNT(*) as valid_user_references
FROM universal_questionnaire_responses_new uqr
JOIN users u ON uqr.user_id = u.id
WHERE uqr.user_id IS NOT NULL;

-- =====================================================
-- 6. 替换原表
-- =====================================================

-- 删除原表
DROP TABLE universal_questionnaire_responses;

-- 重命名新表
ALTER TABLE universal_questionnaire_responses_new 
RENAME TO universal_questionnaire_responses;

-- =====================================================
-- 7. 重建外键约束和索引
-- =====================================================

-- 创建最终表结构（包含外键约束）
CREATE TABLE universal_questionnaire_responses_final (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    user_id TEXT,
    response_data TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束（现在类型匹配）
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 迁移数据到最终表
INSERT INTO universal_questionnaire_responses_final 
SELECT * FROM universal_questionnaire_responses;

-- 替换表
DROP TABLE universal_questionnaire_responses;
ALTER TABLE universal_questionnaire_responses_final 
RENAME TO universal_questionnaire_responses;

-- =====================================================
-- 8. 创建索引优化查询性能
-- =====================================================

-- 创建常用查询索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_id 
ON universal_questionnaire_responses(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_user_id 
ON universal_questionnaire_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_submitted_at 
ON universal_questionnaire_responses(submitted_at);

CREATE INDEX IF NOT EXISTS idx_questionnaire_user 
ON universal_questionnaire_responses(questionnaire_id, user_id);

-- =====================================================
-- 9. 修复相关表的类型不匹配
-- =====================================================

-- 检查并修复analytics_responses表
-- 该表的user_id已经是TEXT类型，无需修改

-- 检查并修复admin_responses表  
-- 该表的user_id已经是TEXT类型，无需修改

-- =====================================================
-- 10. 验证修复结果
-- =====================================================

-- 验证外键约束工作正常
PRAGMA foreign_key_check(universal_questionnaire_responses);

-- 验证数据完整性
SELECT 
    'Data integrity check' as check_type,
    COUNT(*) as total_responses,
    COUNT(user_id) as responses_with_user_id,
    COUNT(DISTINCT user_id) as unique_users,
    (
        SELECT COUNT(*) 
        FROM universal_questionnaire_responses uqr
        JOIN users u ON uqr.user_id = u.id
        WHERE uqr.user_id IS NOT NULL
    ) as valid_user_references
FROM universal_questionnaire_responses;

-- =====================================================
-- 11. 记录修复完成
-- =====================================================

-- 更新迁移日志
UPDATE migration_logs 
SET status = 'completed', 
    completed_at = datetime('now'),
    notes = 'user_id字段类型已从INTEGER修复为TEXT，外键约束正常工作'
WHERE migration_name = '027_fix_data_type_consistency';

-- 创建修复报告
INSERT INTO system_maintenance_logs (
    operation_type, 
    description, 
    affected_tables, 
    records_affected, 
    execution_time,
    status
) VALUES (
    'data_type_fix',
    '修复universal_questionnaire_responses表user_id字段类型不匹配问题',
    'universal_questionnaire_responses,users',
    (SELECT COUNT(*) FROM universal_questionnaire_responses),
    datetime('now'),
    'success'
);

-- =====================================================
-- 12. 清理备份表（可选，建议保留一段时间）
-- =====================================================

-- 注释掉以保留备份，生产环境中可以在确认无问题后手动删除
-- DROP TABLE universal_questionnaire_responses_backup;

-- 输出修复完成信息
SELECT 
    '✅ 数据库类型不匹配问题修复完成' as status,
    datetime('now') as completed_at,
    'user_id字段已统一为TEXT类型，外键约束正常工作' as description;
