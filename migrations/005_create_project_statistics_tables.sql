-- =====================================================
-- 项目信息统计表迁移文件
-- 创建时间: 2024-09-24
-- 目的: 解决管理员仪表板数据显示问题
-- =====================================================

-- 1. 项目统计缓存表
CREATE TABLE IF NOT EXISTS project_statistics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 统计类型
    stat_type VARCHAR(50) NOT NULL, -- 'dashboard', 'project_overview', 'real_time'
    stat_key VARCHAR(100) NOT NULL, -- 具体统计项
    
    -- 统计数据
    stat_value INTEGER NOT NULL DEFAULT 0,
    stat_percentage DECIMAL(5,2) DEFAULT NULL,
    stat_metadata TEXT DEFAULT NULL, -- JSON格式的额外元数据
    
    -- 时间信息
    stat_date DATE NOT NULL, -- 统计日期
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束和索引
    UNIQUE(stat_type, stat_key, stat_date)
);

-- 为项目统计缓存表创建索引
CREATE INDEX IF NOT EXISTS idx_project_stats_type ON project_statistics_cache(stat_type);
CREATE INDEX IF NOT EXISTS idx_project_stats_date ON project_statistics_cache(stat_date);
CREATE INDEX IF NOT EXISTS idx_project_stats_updated ON project_statistics_cache(updated_at);

-- 2. 实时统计视图表
CREATE TABLE IF NOT EXISTS real_time_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 核心指标
    total_questionnaires INTEGER DEFAULT 0,
    total_stories INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- 今日数据
    today_submissions INTEGER DEFAULT 0,
    today_reviews INTEGER DEFAULT 0,
    today_new_users INTEGER DEFAULT 0,
    
    -- 状态统计
    pending_reviews INTEGER DEFAULT 0,
    approved_content INTEGER DEFAULT 0,
    rejected_content INTEGER DEFAULT 0,
    
    -- 系统健康
    system_health_score DECIMAL(5,2) DEFAULT 100.00,
    api_success_rate DECIMAL(5,2) DEFAULT 100.00,
    
    -- 时间戳
    snapshot_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 为实时统计表创建索引
CREATE INDEX IF NOT EXISTS idx_realtime_stats_time ON real_time_statistics(snapshot_time);

-- 3. 初始化基础统计数据
INSERT OR IGNORE INTO project_statistics_cache 
(stat_type, stat_key, stat_value, stat_date, created_at, updated_at) 
VALUES 
-- 仪表板统计
('dashboard', 'total_questionnaires', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dashboard', 'total_stories', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dashboard', 'total_users', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dashboard', 'total_reviews', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dashboard', 'today_submissions', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dashboard', 'today_reviews', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dashboard', 'pending_reviews', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 项目概览统计
('project_overview', 'completion_rate', 85, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('project_overview', 'quality_score', 92, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('project_overview', 'user_satisfaction', 88, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 实时统计
('real_time', 'active_users', 0, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('real_time', 'system_load', 25, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('real_time', 'api_response_time', 120, DATE('now'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. 初始化实时统计数据
INSERT INTO real_time_statistics 
(total_questionnaires, total_stories, total_users, total_reviews, 
 today_submissions, today_reviews, today_new_users,
 pending_reviews, approved_content, rejected_content,
 system_health_score, api_success_rate, snapshot_time)
VALUES 
(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 98.5, 99.2, CURRENT_TIMESTAMP);

-- 5. 创建统计数据更新触发器（如果支持）
-- 注意：SQLite的触发器功能有限，主要通过应用层定时更新

-- 6. 创建查询视图，方便数据获取
CREATE VIEW IF NOT EXISTS dashboard_statistics_view AS
SELECT 
    stat_key,
    stat_value,
    stat_percentage,
    stat_metadata,
    updated_at
FROM project_statistics_cache 
WHERE stat_type = 'dashboard' 
AND stat_date = DATE('now');

-- 7. 创建项目概览视图
CREATE VIEW IF NOT EXISTS project_overview_view AS
SELECT 
    stat_key,
    stat_value,
    stat_percentage,
    stat_metadata,
    updated_at
FROM project_statistics_cache 
WHERE stat_type = 'project_overview' 
AND stat_date = DATE('now');

-- 8. 创建最新实时统计视图
CREATE VIEW IF NOT EXISTS latest_real_time_stats AS
SELECT * FROM real_time_statistics 
ORDER BY snapshot_time DESC 
LIMIT 1;

-- =====================================================
-- 数据验证查询
-- =====================================================

-- 验证项目统计缓存表
-- SELECT COUNT(*) as cache_records FROM project_statistics_cache;

-- 验证实时统计表
-- SELECT COUNT(*) as realtime_records FROM real_time_statistics;

-- 查看仪表板统计
-- SELECT * FROM dashboard_statistics_view;

-- 查看最新实时统计
-- SELECT * FROM latest_real_time_stats;

-- =====================================================
-- 清理和维护
-- =====================================================

-- 清理30天前的历史统计数据（可选）
-- DELETE FROM project_statistics_cache 
-- WHERE stat_date < DATE('now', '-30 days');

-- 清理7天前的实时统计快照（可选）
-- DELETE FROM real_time_statistics 
-- WHERE snapshot_time < DATETIME('now', '-7 days');

-- =====================================================
-- 迁移完成标记
-- =====================================================
INSERT OR IGNORE INTO migration_history (version, description, executed_at) 
VALUES ('005', '创建项目信息统计表', CURRENT_TIMESTAMP);
