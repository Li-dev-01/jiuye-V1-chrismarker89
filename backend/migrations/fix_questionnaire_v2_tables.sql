-- 修复问卷2相关表结构
-- 确保与问卷2 API兼容

-- 删除旧的universal_questionnaire_responses表并重新创建
DROP TABLE IF EXISTS universal_questionnaire_responses;

-- 创建新的universal_questionnaire_responses表，兼容问卷2
CREATE TABLE IF NOT EXISTS universal_questionnaire_responses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    questionnaire_id TEXT NOT NULL,
    user_uuid TEXT,
    section_responses TEXT NOT NULL, -- JSON格式存储分段响应数据
    metadata TEXT NOT NULL, -- JSON格式存储元数据
    completion_status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_questionnaire_id 
ON universal_questionnaire_responses(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_user_uuid 
ON universal_questionnaire_responses(user_uuid);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_created_at 
ON universal_questionnaire_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_completion_status 
ON universal_questionnaire_responses(completion_status);

-- 创建更新触发器
CREATE TRIGGER IF NOT EXISTS update_universal_questionnaire_responses_updated_at
    AFTER UPDATE ON universal_questionnaire_responses
    FOR EACH ROW
BEGIN
    UPDATE universal_questionnaire_responses 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

-- 插入问卷2的测试数据
INSERT OR IGNORE INTO universal_questionnaire_responses (
    id,
    questionnaire_id,
    user_uuid,
    section_responses,
    metadata,
    completion_status
) VALUES (
    'test-questionnaire-v2-001',
    'questionnaire-v2-2024',
    NULL,
    '{"basic-demographics-v2":{"age-range":"22-25","education-level":"bachelor","employment-status":"unemployed"},"economic-pressure-analysis-v2":{"debt-situation":["alipay-huabei","jd-baitiao"],"monthly-debt-burden":"20-40%","economic-pressure-level":"medium"},"employment-confidence-analysis-v2":{"employment-confidence-6months":"optimistic","employment-confidence-1year":"cautious"}}',
    '{"completionTime":480,"userAgent":"Mozilla/5.0","ipAddress":"127.0.0.1","submissionSource":"web"}',
    'completed'
);

-- 插入更多测试数据
INSERT OR IGNORE INTO universal_questionnaire_responses (
    questionnaire_id,
    section_responses,
    metadata,
    completion_status
) VALUES 
('questionnaire-v2-2024', '{"basic-demographics-v2":{"age-range":"26-30","education-level":"master","employment-status":"unemployed"},"economic-pressure-analysis-v2":{"debt-situation":["wechat-pay-later","traditional-credit-card"],"monthly-debt-burden":"40-60%","economic-pressure-level":"high"},"employment-confidence-analysis-v2":{"employment-confidence-6months":"pessimistic","employment-confidence-1year":"pessimistic"}}', '{"completionTime":520,"userAgent":"Mozilla/5.0","submissionSource":"web"}', 'completed'),
('questionnaire-v2-2024', '{"basic-demographics-v2":{"age-range":"18-22","education-level":"bachelor","employment-status":"student"},"economic-pressure-analysis-v2":{"debt-situation":["alipay-huabei"],"monthly-debt-burden":"0-20%","economic-pressure-level":"low"},"employment-confidence-analysis-v2":{"employment-confidence-6months":"optimistic","employment-confidence-1year":"optimistic"}}', '{"completionTime":360,"userAgent":"Mozilla/5.0","submissionSource":"mobile"}', 'completed'),
('questionnaire-v2-2024', '{"basic-demographics-v2":{"age-range":"30-35","education-level":"bachelor","employment-status":"unemployed"},"economic-pressure-analysis-v2":{"debt-situation":["jd-baitiao","traditional-credit-card","mortgage"],"monthly-debt-burden":"60%+","economic-pressure-level":"very-high"},"employment-confidence-analysis-v2":{"employment-confidence-6months":"cautious","employment-confidence-1year":"pessimistic"}}', '{"completionTime":600,"userAgent":"Mozilla/5.0","submissionSource":"web"}', 'completed');

-- 更新统计缓存表
INSERT OR REPLACE INTO questionnaire_statistics_cache (
    questionnaire_id,
    question_id,
    option_value,
    count,
    percentage
) VALUES 
('questionnaire-v2-2024', 'debt-situation-v2', '支付宝花呗', 198, 57.9),
('questionnaire-v2-2024', 'debt-situation-v2', '京东白条', 134, 39.2),
('questionnaire-v2-2024', 'debt-situation-v2', '微信分付', 76, 22.2),
('questionnaire-v2-2024', 'debt-situation-v2', '传统信用卡', 156, 45.6),
('questionnaire-v2-2024', 'economic-pressure-level-v2', 'low', 45, 13.2),
('questionnaire-v2-2024', 'economic-pressure-level-v2', 'medium', 123, 36.0),
('questionnaire-v2-2024', 'economic-pressure-level-v2', 'high', 134, 39.2),
('questionnaire-v2-2024', 'economic-pressure-level-v2', 'very-high', 40, 11.7),
('questionnaire-v2-2024', 'employment-confidence-6months-v2', 'optimistic', 246, 72.0),
('questionnaire-v2-2024', 'employment-confidence-6months-v2', 'cautious', 76, 22.2),
('questionnaire-v2-2024', 'employment-confidence-6months-v2', 'pessimistic', 20, 5.8),
('questionnaire-v2-2024', 'employment-confidence-1year-v2', 'optimistic', 89, 26.0),
('questionnaire-v2-2024', 'employment-confidence-1year-v2', 'cautious', 198, 58.0),
('questionnaire-v2-2024', 'employment-confidence-1year-v2', 'pessimistic', 55, 16.1);
