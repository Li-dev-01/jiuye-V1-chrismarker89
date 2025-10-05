-- 问卷2宽表创建脚本
-- 创建时间: 2025-01-05
-- 用途: 将嵌套的sectionResponses扁平化为宽表，支持高效查询和分析

CREATE TABLE IF NOT EXISTS questionnaire2_wide_table (
  -- 元数据字段
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id VARCHAR(50) UNIQUE NOT NULL,
  questionnaire_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  total_time_spent INTEGER,
  completion_path TEXT,
  branching_decisions TEXT,
  
  -- 基础信息字段（8个）
  gender_v2 VARCHAR(20),
  age_range_v2 VARCHAR(20),
  education_level_v2 VARCHAR(50),
  marital_status_v2 VARCHAR(20),
  has_children_v2 VARCHAR(10),
  fertility_intent_v2 VARCHAR(50),
  current_city_tier_v2 VARCHAR(20),
  hukou_type_v2 VARCHAR(20),
  years_experience_v2 VARCHAR(20),
  
  -- 当前状态字段（1个）
  current_status_question_v2 VARCHAR(50),
  
  -- 经济压力字段（7个）
  debt_situation_v2 TEXT,
  monthly_debt_burden_v2 VARCHAR(20),
  economic_pressure_level_v2 VARCHAR(20),
  monthly_living_cost_v2 VARCHAR(20),
  income_sources_v2 TEXT,
  parental_support_amount_v2 VARCHAR(20),
  income_expense_balance_v2 VARCHAR(50),
  
  -- 在职收入字段（2个）
  current_salary_v2 VARCHAR(20),
  salary_debt_ratio_v2 VARCHAR(20),
  
  -- 求职歧视字段（3个）
  experienced_discrimination_types_v2 TEXT,
  discrimination_severity_v2 VARCHAR(20),
  discrimination_channels_v2 TEXT,
  
  -- 个人优势与忧虑字段（1个）
  support_needed_types_v2 TEXT,
  
  -- 就业信心字段（4个）
  employment_confidence_v2 VARCHAR(10),
  confidence_factors_v2 TEXT,
  future_plans_v2 TEXT,
  job_search_motivation_v2 VARCHAR(50),
  
  -- 条件显示字段（求职细节，待业群体）
  job_search_duration_v2 VARCHAR(20),
  job_search_difficulties_v2 TEXT,
  job_search_channels_v2 TEXT,
  expected_salary_v2 VARCHAR(20),
  
  -- 条件显示字段（年龄歧视细节，35+群体）
  age_discrimination_severity_v2 VARCHAR(20),
  age_discrimination_impact_v2 TEXT,
  
  -- 条件显示字段（婚育歧视细节，女性群体）
  marriage_discrimination_types_v2 TEXT,
  marriage_discrimination_impact_v2 VARCHAR(50),
  
  -- 条件显示字段（学生职业规划，学生群体）
  career_planning_status_v2 VARCHAR(50),
  internship_experience_v2 VARCHAR(20),
  employment_preparation_v2 TEXT,
  
  -- 索引字段
  UNIQUE(response_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_q2_wide_questionnaire_id ON questionnaire2_wide_table(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_q2_wide_gender ON questionnaire2_wide_table(gender_v2);
CREATE INDEX IF NOT EXISTS idx_q2_wide_age ON questionnaire2_wide_table(age_range_v2);
CREATE INDEX IF NOT EXISTS idx_q2_wide_education ON questionnaire2_wide_table(education_level_v2);
CREATE INDEX IF NOT EXISTS idx_q2_wide_status ON questionnaire2_wide_table(current_status_question_v2);
CREATE INDEX IF NOT EXISTS idx_q2_wide_city ON questionnaire2_wide_table(current_city_tier_v2);
CREATE INDEX IF NOT EXISTS idx_q2_wide_created ON questionnaire2_wide_table(created_at);

