-- 问卷2静态分析表创建脚本
-- 创建时间: 2025-01-05
-- 用途: 支持问卷2的7维度可视化系统

-- ============================================
-- 表1: 基础维度统计表
-- 用途: 支持Tab 1（人口结构与就业画像）
-- ============================================
CREATE TABLE IF NOT EXISTS q2_basic_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension VARCHAR(50) NOT NULL,      -- 维度名称（gender/age/education/marital/city/hukou等）
  value VARCHAR(100) NOT NULL,         -- 维度值（male/female/20-22/bachelor等）
  count INTEGER NOT NULL DEFAULT 0,    -- 数量
  percentage DECIMAL(5,2),             -- 百分比
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_basic_stats_dimension ON q2_basic_stats(dimension);
CREATE INDEX IF NOT EXISTS idx_q2_basic_stats_value ON q2_basic_stats(value);
CREATE INDEX IF NOT EXISTS idx_q2_basic_stats_updated ON q2_basic_stats(updated_at);

-- ============================================
-- 表2: 经济压力分析表
-- 用途: 支持Tab 2（经济压力与生活成本）
-- ============================================
CREATE TABLE IF NOT EXISTS q2_economic_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  age_range VARCHAR(20),                      -- 年龄段
  employment_status VARCHAR(50),              -- 就业状态
  avg_living_cost DECIMAL(10,2),              -- 平均生活开支
  avg_debt_burden DECIMAL(10,2),              -- 平均还款金额
  parental_support_rate DECIMAL(5,2),         -- 父母支援比例
  high_pressure_rate DECIMAL(5,2),            -- 高压力比例
  income_deficit_rate DECIMAL(5,2),           -- 入不敷出比例
  count INTEGER NOT NULL DEFAULT 0,           -- 样本数量
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_economic_age ON q2_economic_analysis(age_range);
CREATE INDEX IF NOT EXISTS idx_q2_economic_status ON q2_economic_analysis(employment_status);
CREATE INDEX IF NOT EXISTS idx_q2_economic_updated ON q2_economic_analysis(updated_at);

-- ============================================
-- 表3: 就业状态分析表
-- 用途: 支持Tab 3（就业状态与收入水平）
-- ============================================
CREATE TABLE IF NOT EXISTS q2_employment_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  age_range VARCHAR(20),                      -- 年龄段
  education_level VARCHAR(50),                -- 学历
  city_tier VARCHAR(20),                      -- 城市层级
  employment_status VARCHAR(50),              -- 就业状态
  avg_salary DECIMAL(10,2),                   -- 平均薪资
  unemployment_rate DECIMAL(5,2),             -- 失业率
  avg_job_search_months DECIMAL(5,2),         -- 平均求职时长（月）
  salary_debt_ratio_high_rate DECIMAL(5,2),   -- 薪资负债比>50%的比例
  count INTEGER NOT NULL DEFAULT 0,           -- 样本数量
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_employment_age ON q2_employment_analysis(age_range);
CREATE INDEX IF NOT EXISTS idx_q2_employment_edu ON q2_employment_analysis(education_level);
CREATE INDEX IF NOT EXISTS idx_q2_employment_city ON q2_employment_analysis(city_tier);
CREATE INDEX IF NOT EXISTS idx_q2_employment_status ON q2_employment_analysis(employment_status);
CREATE INDEX IF NOT EXISTS idx_q2_employment_updated ON q2_employment_analysis(updated_at);

-- ============================================
-- 表4: 歧视分析表
-- 用途: 支持Tab 4（求职歧视与公平性）
-- ============================================
CREATE TABLE IF NOT EXISTS q2_discrimination_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discrimination_type VARCHAR(50),            -- 歧视类型（gender/age/education/marriage等）
  gender VARCHAR(20),                         -- 性别
  age_range VARCHAR(20),                      -- 年龄段
  severity VARCHAR(20),                       -- 严重程度（mild/moderate/severe等）
  channel VARCHAR(50),                        -- 发生渠道（job-posting/interview/background-check等）
  count INTEGER NOT NULL DEFAULT 0,           -- 数量
  percentage DECIMAL(5,2),                    -- 百分比
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_discrim_type ON q2_discrimination_analysis(discrimination_type);
CREATE INDEX IF NOT EXISTS idx_q2_discrim_gender ON q2_discrimination_analysis(gender);
CREATE INDEX IF NOT EXISTS idx_q2_discrim_age ON q2_discrimination_analysis(age_range);
CREATE INDEX IF NOT EXISTS idx_q2_discrim_severity ON q2_discrimination_analysis(severity);
CREATE INDEX IF NOT EXISTS idx_q2_discrim_updated ON q2_discrimination_analysis(updated_at);

-- ============================================
-- 表5: 交叉分析表
-- 用途: 支持Tab 7（交叉分析与洞察）
-- ============================================
CREATE TABLE IF NOT EXISTS q2_cross_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension1 VARCHAR(50) NOT NULL,            -- 第一维度名称
  value1 VARCHAR(100) NOT NULL,               -- 第一维度值
  dimension2 VARCHAR(50) NOT NULL,            -- 第二维度名称
  value2 VARCHAR(100) NOT NULL,               -- 第二维度值
  dimension3 VARCHAR(50),                     -- 第三维度名称（可选）
  value3 VARCHAR(100),                        -- 第三维度值（可选）
  metric_name VARCHAR(50) NOT NULL,           -- 指标名称（avg_salary/unemployment_rate/confidence_index等）
  metric_value DECIMAL(10,2),                 -- 指标值
  count INTEGER NOT NULL DEFAULT 0,           -- 样本数量
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_cross_dim1 ON q2_cross_analysis(dimension1, value1);
CREATE INDEX IF NOT EXISTS idx_q2_cross_dim2 ON q2_cross_analysis(dimension2, value2);
CREATE INDEX IF NOT EXISTS idx_q2_cross_dim3 ON q2_cross_analysis(dimension3, value3);
CREATE INDEX IF NOT EXISTS idx_q2_cross_metric ON q2_cross_analysis(metric_name);
CREATE INDEX IF NOT EXISTS idx_q2_cross_updated ON q2_cross_analysis(updated_at);

-- ============================================
-- 表6: 就业信心分析表
-- 用途: 支持Tab 5（就业信心与未来预期）
-- ============================================
CREATE TABLE IF NOT EXISTS q2_confidence_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  age_range VARCHAR(20),                      -- 年龄段
  employment_status VARCHAR(50),              -- 就业状态
  economic_pressure VARCHAR(20),              -- 经济压力程度
  avg_confidence_index DECIMAL(5,2),          -- 平均信心指数
  low_confidence_rate DECIMAL(5,2),           -- 低信心比例（<3分）
  high_confidence_rate DECIMAL(5,2),          -- 高信心比例（>4分）
  top_confidence_factor VARCHAR(100),         -- 最主要影响因素
  count INTEGER NOT NULL DEFAULT 0,           -- 样本数量
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_confidence_age ON q2_confidence_analysis(age_range);
CREATE INDEX IF NOT EXISTS idx_q2_confidence_status ON q2_confidence_analysis(employment_status);
CREATE INDEX IF NOT EXISTS idx_q2_confidence_pressure ON q2_confidence_analysis(economic_pressure);
CREATE INDEX IF NOT EXISTS idx_q2_confidence_updated ON q2_confidence_analysis(updated_at);

-- ============================================
-- 表7: 生育意愿分析表
-- 用途: 支持Tab 6（生育意愿与婚育压力）
-- ============================================
CREATE TABLE IF NOT EXISTS q2_fertility_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  age_range VARCHAR(20),                      -- 年龄段
  marital_status VARCHAR(20),                 -- 婚姻状况
  economic_pressure VARCHAR(20),              -- 经济压力程度
  fertility_intent VARCHAR(50),               -- 生育意愿
  has_children VARCHAR(10),                   -- 是否有子女
  no_fertility_rate DECIMAL(5,2),             -- 不打算生育比例
  marriage_discrimination_rate DECIMAL(5,2),  -- 遭遇婚育歧视比例
  count INTEGER NOT NULL DEFAULT 0,           -- 样本数量
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_fertility_age ON q2_fertility_analysis(age_range);
CREATE INDEX IF NOT EXISTS idx_q2_fertility_marital ON q2_fertility_analysis(marital_status);
CREATE INDEX IF NOT EXISTS idx_q2_fertility_pressure ON q2_fertility_analysis(economic_pressure);
CREATE INDEX IF NOT EXISTS idx_q2_fertility_updated ON q2_fertility_analysis(updated_at);

-- ============================================
-- 数据同步日志表
-- 用途: 记录静态表的同步状态
-- ============================================
CREATE TABLE IF NOT EXISTS q2_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name VARCHAR(50) NOT NULL,            -- 表名
  sync_type VARCHAR(20) NOT NULL,             -- 同步类型（full/incremental）
  records_processed INTEGER,                  -- 处理记录数
  records_inserted INTEGER,                   -- 插入记录数
  records_updated INTEGER,                    -- 更新记录数
  status VARCHAR(20) NOT NULL,                -- 状态（success/failed/partial）
  error_message TEXT,                         -- 错误信息
  started_at TIMESTAMP,                       -- 开始时间
  completed_at TIMESTAMP,                     -- 完成时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_q2_sync_table ON q2_sync_log(table_name);
CREATE INDEX IF NOT EXISTS idx_q2_sync_status ON q2_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_q2_sync_created ON q2_sync_log(created_at);

-- ============================================
-- 初始化完成标记
-- ============================================
INSERT INTO q2_sync_log (table_name, sync_type, status, started_at, completed_at)
VALUES ('ALL_TABLES', 'schema_creation', 'success', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

