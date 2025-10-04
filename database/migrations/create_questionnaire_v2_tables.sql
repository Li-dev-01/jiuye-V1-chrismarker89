-- 问卷2独立数据库表创建脚本
-- 完全独立的表结构，与问卷1无任何依赖关系
-- 创建时间: 2024-10-04
-- 用途: 支持问卷2的经济压力、就业信心、现代负债分析

-- ============================================
-- 问卷2回答表 (完全独立)
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_v2_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  questionnaire_id TEXT NOT NULL DEFAULT 'questionnaire-v2-2024',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  -- 基础信息 (JSON格式存储)
  basic_info TEXT, -- 年龄、学历、地区等基础信息
  
  -- 问卷2特有维度数据
  economic_pressure_data TEXT, -- 经济压力相关回答
  employment_confidence_data TEXT, -- 就业信心相关回答
  modern_debt_data TEXT, -- 现代负债相关回答
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  
  -- 元数据
  completion_time INTEGER, -- 完成时间(秒)
  ip_address TEXT,
  user_agent TEXT,
  is_test_data INTEGER DEFAULT 0,
  
  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 问卷2答案详细表 (支持灵活查询)
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_v2_answers (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_value TEXT,
  answer_text TEXT, -- 开放式回答的文本内容
  
  -- 维度分类
  dimension_type TEXT CHECK (dimension_type IN ('economic_pressure', 'employment_confidence', 'modern_debt', 'basic_info')),
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,
  
  -- 外键约束
  FOREIGN KEY (response_id) REFERENCES questionnaire_v2_responses(id) ON DELETE CASCADE
);

-- ============================================
-- 问卷2分析缓存表 (性能优化)
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_v2_analytics (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  
  -- 分析维度
  dimension_type TEXT NOT NULL CHECK (dimension_type IN ('economic_pressure', 'employment_confidence', 'modern_debt')),
  
  -- 分析结果 (JSON格式)
  analysis_data TEXT, -- 维度分析结果
  chart_data TEXT, -- 图表数据
  insights TEXT, -- 洞察信息
  
  -- 统计指标
  pressure_score REAL, -- 压力评分 (0-100)
  confidence_score REAL, -- 信心评分 (0-100)
  debt_risk_score REAL, -- 负债风险评分 (0-100)
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,
  
  -- 外键约束
  FOREIGN KEY (response_id) REFERENCES questionnaire_v2_responses(id) ON DELETE CASCADE
);

-- ============================================
-- 问卷2统计汇总表 (实时统计)
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_v2_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionnaire_id TEXT NOT NULL DEFAULT 'questionnaire-v2-2024',
  
  -- 统计维度
  dimension_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  
  -- 分组信息
  group_by_field TEXT, -- 分组字段 (如: age_range, education_level)
  group_by_value TEXT, -- 分组值
  
  -- 时间范围
  date_range TEXT, -- 统计时间范围
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 元数据
  sample_size INTEGER, -- 样本数量
  confidence_level REAL, -- 置信度
  is_test_data INTEGER DEFAULT 0,
  
  -- 唯一约束
  UNIQUE(questionnaire_id, dimension_type, metric_name, group_by_field, group_by_value, date_range)
);

-- ============================================
-- 问卷2可视化缓存表 (混合可视化支持)
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_v2_visualization_cache (
  id TEXT PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  
  -- 缓存类型
  cache_type TEXT NOT NULL CHECK (cache_type IN ('q2_native', 'q1_hybrid', 'mixed_analysis')),
  
  -- 缓存数据
  visualization_data TEXT, -- 可视化数据 (JSON)
  chart_configs TEXT, -- 图表配置
  dimension_mapping TEXT, -- 维度映射关系
  
  -- 缓存元数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  hit_count INTEGER DEFAULT 0,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 数据版本
  data_version TEXT,
  is_test_data INTEGER DEFAULT 0
);

-- ============================================
-- 创建索引 (性能优化)
-- ============================================

-- 问卷2回答表索引
CREATE INDEX IF NOT EXISTS idx_q2_responses_user_id ON questionnaire_v2_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_q2_responses_questionnaire_id ON questionnaire_v2_responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_q2_responses_status ON questionnaire_v2_responses(status);
CREATE INDEX IF NOT EXISTS idx_q2_responses_created_at ON questionnaire_v2_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_q2_responses_test_data ON questionnaire_v2_responses(is_test_data);

-- 问卷2答案表索引
CREATE INDEX IF NOT EXISTS idx_q2_answers_response_id ON questionnaire_v2_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_q2_answers_question_id ON questionnaire_v2_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_q2_answers_dimension_type ON questionnaire_v2_answers(dimension_type);
CREATE INDEX IF NOT EXISTS idx_q2_answers_test_data ON questionnaire_v2_answers(is_test_data);

-- 问卷2分析表索引
CREATE INDEX IF NOT EXISTS idx_q2_analytics_response_id ON questionnaire_v2_analytics(response_id);
CREATE INDEX IF NOT EXISTS idx_q2_analytics_dimension_type ON questionnaire_v2_analytics(dimension_type);
CREATE INDEX IF NOT EXISTS idx_q2_analytics_created_at ON questionnaire_v2_analytics(created_at);

-- 问卷2统计表索引
CREATE INDEX IF NOT EXISTS idx_q2_statistics_questionnaire_id ON questionnaire_v2_statistics(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_q2_statistics_dimension_type ON questionnaire_v2_statistics(dimension_type);
CREATE INDEX IF NOT EXISTS idx_q2_statistics_metric_name ON questionnaire_v2_statistics(metric_name);
CREATE INDEX IF NOT EXISTS idx_q2_statistics_calculated_at ON questionnaire_v2_statistics(calculated_at);

-- 问卷2可视化缓存表索引
CREATE INDEX IF NOT EXISTS idx_q2_viz_cache_key ON questionnaire_v2_visualization_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_q2_viz_cache_type ON questionnaire_v2_visualization_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_q2_viz_expires_at ON questionnaire_v2_visualization_cache(expires_at);

-- ============================================
-- 插入初始配置数据
-- ============================================

-- 插入问卷2的基础统计配置
INSERT OR IGNORE INTO questionnaire_v2_statistics (
  questionnaire_id, dimension_type, metric_name, metric_value, 
  group_by_field, group_by_value, sample_size, is_test_data
) VALUES 
  ('questionnaire-v2-2024', 'economic_pressure', 'total_responses', 0, NULL, NULL, 0, 0),
  ('questionnaire-v2-2024', 'employment_confidence', 'total_responses', 0, NULL, NULL, 0, 0),
  ('questionnaire-v2-2024', 'modern_debt', 'total_responses', 0, NULL, NULL, 0, 0);

-- ============================================
-- 数据完整性检查
-- ============================================

-- 验证表创建
SELECT 
  name as table_name,
  sql as create_statement
FROM sqlite_master 
WHERE type = 'table' 
  AND name LIKE 'questionnaire_v2_%'
ORDER BY name;

-- 验证索引创建
SELECT 
  name as index_name,
  tbl_name as table_name
FROM sqlite_master 
WHERE type = 'index' 
  AND name LIKE 'idx_q2_%'
ORDER BY tbl_name, name;
