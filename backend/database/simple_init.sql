-- 简化的数据库初始化脚本
-- 兼容MySQL 9.0+

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uuid VARCHAR(36) UNIQUE NOT NULL,
    user_type ENUM('anonymous', 'semi_anonymous') NOT NULL,
    username VARCHAR(100),
    nickname VARCHAR(100),
    email VARCHAR(255),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建原始问卷回答表 (A表)
CREATE TABLE IF NOT EXISTS raw_questionnaire_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uuid VARCHAR(36) NOT NULL,
    form_data JSON NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_status (raw_status),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建有效问卷回答表 (B表)
CREATE TABLE IF NOT EXISTS valid_questionnaire_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_id INT NOT NULL,
    user_uuid VARCHAR(36) NOT NULL,
    form_data JSON NOT NULL,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    audit_status ENUM('approved', 'rejected', 'pending') DEFAULT 'approved',
    FOREIGN KEY (raw_id) REFERENCES raw_questionnaire_responses(id),
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_audit_status (audit_status),
    INDEX idx_approved_at (approved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建原始心声表 (A表)
CREATE TABLE IF NOT EXISTS raw_heart_voices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    emotion_score INT CHECK (emotion_score >= 1 AND emotion_score <= 5),
    tags JSON,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_status (raw_status),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建有效心声表 (B表)
CREATE TABLE IF NOT EXISTS valid_heart_voices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_id INT NOT NULL,
    data_uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    emotion_score INT CHECK (emotion_score >= 1 AND emotion_score <= 5),
    tags JSON,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    audit_status ENUM('approved', 'rejected', 'pending') DEFAULT 'approved',
    like_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    FOREIGN KEY (raw_id) REFERENCES raw_heart_voices(id),
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_audit_status (audit_status),
    INDEX idx_approved_at (approved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建原始故事表 (A表)
CREATE TABLE IF NOT EXISTS raw_story_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    tags JSON,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_status (raw_status),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建有效故事表 (B表)
CREATE TABLE IF NOT EXISTS valid_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_id INT NOT NULL,
    data_uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    tags JSON,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    audit_status ENUM('approved', 'rejected', 'pending') DEFAULT 'approved',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    FOREIGN KEY (raw_id) REFERENCES raw_story_submissions(id),
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_audit_status (audit_status),
    INDEX idx_approved_at (approved_at),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建PNG卡片表
CREATE TABLE IF NOT EXISTS content_png_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type ENUM('heart_voice', 'story', 'questionnaire') NOT NULL,
    content_id INT NOT NULL,
    content_uuid VARCHAR(36),
    creator_user_id VARCHAR(36) NOT NULL,
    card_style VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_creator_user_id (creator_user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建PNG下载记录表
CREATE TABLE IF NOT EXISTS png_download_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    user_id VARCHAR(36),
    download_ip VARCHAR(45),
    download_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES content_png_cards(id),
    INDEX idx_card_id (card_id),
    INDEX idx_user_id (user_id),
    INDEX idx_download_at (download_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户内容管理表
CREATE TABLE IF NOT EXISTS user_content_management (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content_type ENUM('questionnaire', 'heart_voice', 'story', 'user') NOT NULL,
    content_id INT NOT NULL,
    can_download BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_content_type_id (content_type, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建审核记录表
CREATE TABLE IF NOT EXISTS audit_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type ENUM('questionnaire', 'heart_voice', 'story') NOT NULL,
    content_id INT NOT NULL,
    raw_id INT NOT NULL,
    audit_level ENUM('rule_based', 'ai_based', 'human_review') NOT NULL,
    audit_result ENUM('approved', 'rejected', 'pending', 'flagged') NOT NULL,
    audit_score DECIMAL(3,2),
    audit_reason TEXT,
    auditor_id VARCHAR(36),
    audited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_audit_result (audit_result),
    INDEX idx_audited_at (audited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建卡片风格配置表
CREATE TABLE IF NOT EXISTS card_style_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    style_name VARCHAR(50) UNIQUE NOT NULL,
    style_display_name VARCHAR(100) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    background_color VARCHAR(20),
    text_color VARCHAR(20),
    font_family VARCHAR(100),
    font_size INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_style_name (style_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认卡片风格
INSERT IGNORE INTO card_style_configs (style_name, style_display_name, width, height, background_color, text_color, font_family, font_size) VALUES
('style_1', '经典风格', 800, 600, '#ffffff', '#333333', 'Arial', 16),
('style_2', '温暖风格', 800, 600, '#fff8f0', '#8b4513', 'Georgia', 16),
('style_3', '现代风格', 900, 700, '#f8f9fa', '#495057', 'Helvetica', 18),
('minimal', '简约风格', 600, 400, '#ffffff', '#000000', 'Arial', 14),
('colorful', '彩色风格', 1000, 800, '#e3f2fd', '#1565c0', 'Verdana', 16);

-- 创建基础视图
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN user_type = 'anonymous' THEN 1 ELSE 0 END) as anonymous_users,
    SUM(CASE WHEN user_type = 'semi_anonymous' THEN 1 ELSE 0 END) as semi_anonymous_users,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users
FROM users;

CREATE OR REPLACE VIEW v_content_statistics AS
SELECT 
    'questionnaire' as content_type,
    COUNT(*) as total_count,
    (SELECT COUNT(*) FROM valid_questionnaire_responses) as approved_count
FROM raw_questionnaire_responses
UNION ALL
SELECT 
    'heart_voice' as content_type,
    COUNT(*) as total_count,
    (SELECT COUNT(*) FROM valid_heart_voices) as approved_count
FROM raw_heart_voices
UNION ALL
SELECT 
    'story' as content_type,
    COUNT(*) as total_count,
    (SELECT COUNT(*) FROM valid_stories) as approved_count
FROM raw_story_submissions;

-- 完成初始化
SELECT 'Database initialization completed successfully!' as status;
