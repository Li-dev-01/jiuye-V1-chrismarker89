-- Migration: 010_create_participation_stats_table
-- Description: 创建页面参与统计表，用于集中管理各页面的参与数量统计
-- Created: 2025-08-11

-- =====================================================
-- 1. 页面参与统计表（主表）
-- =====================================================
CREATE TABLE IF NOT EXISTS participation_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 统计标识
    stat_type TEXT NOT NULL, -- 'questionnaire', 'stories', 'voices', 'overall'
    stat_date DATE NOT NULL DEFAULT (date('now')), -- 统计日期
    
    -- 问卷统计
    questionnaire_participants INTEGER DEFAULT 0, -- 问卷参与人数
    questionnaire_responses INTEGER DEFAULT 0,    -- 问卷回答总数
    questionnaire_completed INTEGER DEFAULT 0,    -- 完成问卷数
    
    -- 故事统计
    stories_published INTEGER DEFAULT 0,          -- 发表故事数
    stories_authors INTEGER DEFAULT 0,            -- 故事作者数
    stories_approved INTEGER DEFAULT 0,           -- 审核通过故事数
    stories_total_views INTEGER DEFAULT 0,        -- 故事总浏览量
    stories_total_likes INTEGER DEFAULT 0,        -- 故事总点赞数
    
    -- 心声统计
    voices_published INTEGER DEFAULT 0,           -- 发表心声数
    voices_authors INTEGER DEFAULT 0,             -- 心声作者数
    voices_approved INTEGER DEFAULT 0,            -- 审核通过心声数
    voices_total_views INTEGER DEFAULT 0,         -- 心声总浏览量
    voices_total_likes INTEGER DEFAULT 0,         -- 心声总点赞数
    
    -- 用户统计
    total_users INTEGER DEFAULT 0,                -- 总用户数
    active_users INTEGER DEFAULT 0,               -- 活跃用户数（最近30天有活动）
    new_users_today INTEGER DEFAULT 0,            -- 今日新增用户
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    UNIQUE(stat_type, stat_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_participation_stats_type_date ON participation_stats(stat_type, stat_date);
CREATE INDEX IF NOT EXISTS idx_participation_stats_date ON participation_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_participation_stats_updated ON participation_stats(updated_at);

-- =====================================================
-- 2. 统计历史表（用于趋势分析）
-- =====================================================
CREATE TABLE IF NOT EXISTS participation_stats_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联主表
    stats_id INTEGER NOT NULL,
    
    -- 变更信息
    change_type TEXT NOT NULL, -- 'daily_update', 'hourly_sync', 'manual_refresh'
    previous_values TEXT,      -- JSON格式的变更前数据
    new_values TEXT,           -- JSON格式的变更后数据
    change_summary TEXT,       -- 变更摘要
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (stats_id) REFERENCES participation_stats(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_stats_history_stats_id ON participation_stats_history(stats_id);
CREATE INDEX IF NOT EXISTS idx_stats_history_type ON participation_stats_history(change_type);
CREATE INDEX IF NOT EXISTS idx_stats_history_created ON participation_stats_history(created_at);

-- =====================================================
-- 3. 统计配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS participation_stats_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 配置项
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_description TEXT,
    
    -- 配置类型
    config_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    
    -- 是否启用
    is_enabled INTEGER DEFAULT 1,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT OR IGNORE INTO participation_stats_config (config_key, config_value, config_description, config_type) VALUES
('sync_interval_minutes', '10', '统计数据同步间隔（分钟）', 'number'),
('enable_hourly_sync', 'true', '是否启用每小时同步', 'boolean'),
('enable_daily_summary', 'true', '是否启用每日汇总', 'boolean'),
('cache_duration_minutes', '5', '统计数据缓存时长（分钟）', 'number'),
('enable_history_tracking', 'true', '是否启用历史记录跟踪', 'boolean'),
('max_history_days', '90', '历史记录保留天数', 'number');

-- =====================================================
-- 4. 初始化今日统计记录
-- =====================================================
INSERT OR IGNORE INTO participation_stats (stat_type, stat_date) VALUES
('questionnaire', date('now')),
('stories', date('now')),
('voices', date('now')),
('overall', date('now'));

-- =====================================================
-- 5. 创建视图（便于查询）
-- =====================================================

-- 最新统计数据视图
CREATE VIEW IF NOT EXISTS v_latest_participation_stats AS
SELECT 
    stat_type,
    questionnaire_participants,
    questionnaire_responses,
    questionnaire_completed,
    stories_published,
    stories_authors,
    stories_approved,
    stories_total_views,
    stories_total_likes,
    voices_published,
    voices_authors,
    voices_approved,
    voices_total_views,
    voices_total_likes,
    total_users,
    active_users,
    new_users_today,
    stat_date,
    updated_at
FROM participation_stats 
WHERE stat_date = date('now')
ORDER BY stat_type;

-- 汇总统计视图
CREATE VIEW IF NOT EXISTS v_participation_summary AS
SELECT 
    SUM(questionnaire_participants) as total_questionnaire_participants,
    SUM(questionnaire_responses) as total_questionnaire_responses,
    SUM(stories_published) as total_stories_published,
    SUM(stories_authors) as total_stories_authors,
    SUM(voices_published) as total_voices_published,
    SUM(voices_authors) as total_voices_authors,
    MAX(total_users) as total_users,
    MAX(active_users) as active_users,
    MAX(updated_at) as last_updated
FROM participation_stats 
WHERE stat_date = date('now');
