-- Migration: 002_create_questionnaire_temp_table
-- Description: 创建问卷临时存储表 (表A)
-- Created: 2024-01-27

CREATE TABLE IF NOT EXISTS questionnaire_submissions_temp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    
    -- 基本信息
    age INT,
    gender ENUM('male', 'female', 'other'),
    education_level ENUM('high_school', 'associate', 'bachelor', 'master', 'phd'),
    major VARCHAR(100),
    graduation_year INT,
    location_province VARCHAR(50),
    location_city VARCHAR(50),
    
    -- 就业状况
    employment_status ENUM('employed', 'unemployed', 'student', 'freelance'),
    job_title VARCHAR(100),
    company_name VARCHAR(100),
    company_size ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    industry VARCHAR(100),
    work_experience_years INT,
    
    -- 薪资信息
    current_salary INT,
    expected_salary INT,
    salary_satisfaction ENUM('very_dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very_satisfied'),
    
    -- 求职经历
    job_search_duration_months INT,
    job_applications_count INT,
    interviews_count INT,
    job_offers_count INT,
    job_search_channels JSON,
    
    -- 技能与培训
    technical_skills JSON,
    soft_skills JSON,
    certifications JSON,
    training_programs JSON,
    
    -- 职业发展
    career_goals TEXT,
    industry_preference JSON,
    work_location_preference JSON,
    work_mode_preference ENUM('onsite', 'remote', 'hybrid'),
    
    -- 挑战与困难
    job_search_challenges JSON,
    skill_gaps JSON,
    market_concerns TEXT,
    
    -- 元数据
    submission_source VARCHAR(50) DEFAULT 'web',
    ip_address INET,
    user_agent TEXT,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 审核状态
    review_status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    reviewer_id UUID,
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX idx_temp_user_id ON questionnaire_submissions_temp(user_id);
CREATE INDEX idx_temp_review_status ON questionnaire_submissions_temp(review_status);
CREATE INDEX idx_temp_submission_time ON questionnaire_submissions_temp(submission_time);
CREATE INDEX idx_temp_reviewer_id ON questionnaire_submissions_temp(reviewer_id);
CREATE INDEX idx_temp_age ON questionnaire_submissions_temp(age);
CREATE INDEX idx_temp_gender ON questionnaire_submissions_temp(gender);
CREATE INDEX idx_temp_education ON questionnaire_submissions_temp(education_level);
CREATE INDEX idx_temp_employment ON questionnaire_submissions_temp(employment_status);
CREATE INDEX idx_temp_location ON questionnaire_submissions_temp(location_province);
CREATE INDEX idx_temp_industry ON questionnaire_submissions_temp(industry);
