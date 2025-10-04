-- 问卷2专用图表统计表
-- 每个图表一个专用表，优化查询性能

-- 经济压力分析专用表
CREATE TABLE IF NOT EXISTS questionnaire_v2_economic_pressure_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL, -- 'debt_situation', 'monthly_burden', 'pressure_level'
  metric_value TEXT NOT NULL, -- 'student-loan', 'below-300', 'medium' etc.
  count INTEGER NOT NULL DEFAULT 0,
  percentage REAL NOT NULL DEFAULT 0.0,
  age_group TEXT, -- 'under-20', '20-22', etc.
  education_level TEXT, -- 'bachelor', 'master', etc.
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,
  UNIQUE(metric_name, metric_value, age_group, education_level)
);

-- 就业信心指数专用表
CREATE TABLE IF NOT EXISTS questionnaire_v2_employment_confidence_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_period TEXT NOT NULL, -- '6months', '1year'
  confidence_level TEXT NOT NULL, -- 'very-confident', 'confident', etc.
  count INTEGER NOT NULL DEFAULT 0,
  percentage REAL NOT NULL DEFAULT 0.0,
  age_group TEXT,
  education_level TEXT,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,
  UNIQUE(time_period, confidence_level, age_group, education_level)
);

-- 现代负债分析专用表
CREATE TABLE IF NOT EXISTS questionnaire_v2_modern_debt_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debt_type TEXT NOT NULL, -- 'student-loan', 'alipay-huabei', etc.
  count INTEGER NOT NULL DEFAULT 0,
  percentage REAL NOT NULL DEFAULT 0.0,
  avg_amount REAL, -- 平均负债金额
  age_group TEXT,
  education_level TEXT,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,
  UNIQUE(debt_type, age_group, education_level)
);

-- 基础信息统计表
CREATE TABLE IF NOT EXISTS questionnaire_v2_demographics_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension TEXT NOT NULL, -- 'age_range', 'education_level', 'current_status'
  value TEXT NOT NULL, -- '20-22', 'bachelor', 'fulltime'
  count INTEGER NOT NULL DEFAULT 0,
  percentage REAL NOT NULL DEFAULT 0.0,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,
  UNIQUE(dimension, value)
);

-- 综合分析汇总表
CREATE TABLE IF NOT EXISTS questionnaire_v2_summary_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_responses INTEGER NOT NULL DEFAULT 0,
  completion_rate REAL NOT NULL DEFAULT 0.0,
  avg_economic_pressure REAL, -- 平均经济压力评分
  avg_employment_confidence REAL, -- 平均就业信心评分
  avg_debt_burden REAL, -- 平均负债负担
  top_concerns TEXT, -- JSON格式的主要关注点
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_q2_economic_pressure_metric ON questionnaire_v2_economic_pressure_stats(metric_name, calculated_at);
CREATE INDEX IF NOT EXISTS idx_q2_employment_confidence_period ON questionnaire_v2_employment_confidence_stats(time_period, calculated_at);
CREATE INDEX IF NOT EXISTS idx_q2_modern_debt_type ON questionnaire_v2_modern_debt_stats(debt_type, calculated_at);
CREATE INDEX IF NOT EXISTS idx_q2_demographics_dimension ON questionnaire_v2_demographics_stats(dimension, calculated_at);
CREATE INDEX IF NOT EXISTS idx_q2_summary_calculated ON questionnaire_v2_summary_stats(calculated_at);
