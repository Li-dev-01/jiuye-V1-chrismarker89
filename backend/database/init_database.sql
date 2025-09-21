-- 问卷数据库初始化脚本
-- 创建数据库和表结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS questionnaire_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE questionnaire_db;

-- 1. 问卷回答主表
CREATE TABLE questionnaire_responses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64) UNIQUE NOT NULL COMMENT '匿名会话ID',
    ip_hash VARCHAR(64) COMMENT 'IP地址哈希（用于防重复）',
    user_agent_hash VARCHAR(64) COMMENT '浏览器指纹哈希',
    
    -- 完成状态
    is_completed BOOLEAN DEFAULT FALSE COMMENT '是否完成问卷',
    completion_percentage DECIMAL(5,2) DEFAULT 0 COMMENT '完成百分比',
    
    -- 时间戳
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 元数据
    total_time_seconds INT COMMENT '总用时（秒）',
    device_type ENUM('desktop', 'mobile', 'tablet') COMMENT '设备类型',
    browser_type VARCHAR(50) COMMENT '浏览器类型',
    
    -- 数据质量标记
    is_valid BOOLEAN DEFAULT TRUE COMMENT '数据是否有效',
    quality_score DECIMAL(3,2) COMMENT '数据质量评分(0-1)',
    
    INDEX idx_completed (is_completed),
    INDEX idx_started_at (started_at),
    INDEX idx_quality (is_valid, quality_score),
    INDEX idx_session (session_id)
) COMMENT='问卷回答主表';

-- 2. 问卷答案详情表
CREATE TABLE questionnaire_answers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    response_id BIGINT NOT NULL COMMENT '关联问卷回答ID',
    question_id VARCHAR(100) NOT NULL COMMENT '问题ID',
    question_type ENUM('radio', 'checkbox', 'text', 'number', 'date') NOT NULL,
    
    -- 答案内容（JSON格式存储，支持多选）
    answer_value JSON NOT NULL COMMENT '答案内容',
    answer_text TEXT COMMENT '文本答案（如果有）',
    
    -- 答题行为数据
    time_spent_seconds INT COMMENT '答题用时',
    revision_count INT DEFAULT 0 COMMENT '修改次数',
    
    -- 时间戳
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (response_id) REFERENCES questionnaire_responses(id) ON DELETE CASCADE,
    INDEX idx_response_question (response_id, question_id),
    INDEX idx_question_id (question_id),
    INDEX idx_question_type (question_type)
) COMMENT='问卷答案详情表';

-- 3. 数据统计缓存表
CREATE TABLE analytics_cache (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cache_key VARCHAR(255) UNIQUE NOT NULL COMMENT '缓存键',
    cache_type ENUM('basic_stats', 'cross_analysis', 'distribution', 'trend') NOT NULL,
    
    -- 缓存内容
    cache_data JSON NOT NULL COMMENT '缓存的统计数据',
    sample_size INT NOT NULL COMMENT '样本数量',
    
    -- 缓存管理
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    is_valid BOOLEAN DEFAULT TRUE,
    
    INDEX idx_cache_key (cache_key),
    INDEX idx_expires (expires_at),
    INDEX idx_type (cache_type)
) COMMENT='数据统计缓存表';

-- 4. 问卷配置表（存储问卷结构）
CREATE TABLE questionnaire_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(20) NOT NULL COMMENT '问卷版本',
    config_data JSON NOT NULL COMMENT '问卷配置JSON',
    is_active BOOLEAN DEFAULT FALSE COMMENT '是否为当前版本',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_version (version),
    INDEX idx_active (is_active)
) COMMENT='问卷配置表';

-- 5. 数据导入日志表
CREATE TABLE data_import_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    import_type ENUM('mock_data', 'real_data', 'migration') NOT NULL,
    file_name VARCHAR(255) COMMENT '导入文件名',
    total_records INT NOT NULL COMMENT '总记录数',
    success_records INT NOT NULL COMMENT '成功记录数',
    failed_records INT NOT NULL COMMENT '失败记录数',
    error_details JSON COMMENT '错误详情',
    import_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_import_type (import_type),
    INDEX idx_status (import_status),
    INDEX idx_started_at (started_at)
) COMMENT='数据导入日志表';

-- 插入默认问卷配置
INSERT INTO questionnaire_config (version, config_data, is_active) VALUES 
('v1.0', '{
  "title": "大学生就业状况调研问卷",
  "description": "本问卷旨在了解当前大学生的就业现状、求职经历和职业期望",
  "pages": [
    {
      "id": "personal-info",
      "title": "个人基本信息",
      "questions": [
        {"id": "education-level", "type": "radio", "required": true},
        {"id": "major-field", "type": "radio", "required": true},
        {"id": "graduation-year", "type": "radio", "required": true},
        {"id": "gender", "type": "radio", "required": true},
        {"id": "age-range", "type": "radio", "required": true},
        {"id": "university-tier", "type": "radio", "required": true}
      ]
    },
    {
      "id": "employment-status",
      "title": "就业现状",
      "questions": [
        {"id": "current-status", "type": "radio", "required": true},
        {"id": "job-satisfaction", "type": "radio", "required": false},
        {"id": "current-salary", "type": "radio", "required": false},
        {"id": "work-industry", "type": "radio", "required": false},
        {"id": "work-location", "type": "text", "required": false},
        {"id": "major-match", "type": "radio", "required": false}
      ]
    },
    {
      "id": "job-hunting",
      "title": "求职经历",
      "questions": [
        {"id": "unemployment-duration", "type": "radio", "required": false},
        {"id": "job-hunting-difficulties", "type": "checkbox", "required": false},
        {"id": "job-search-channels", "type": "checkbox", "required": false},
        {"id": "interview-count", "type": "radio", "required": false},
        {"id": "resume-count", "type": "radio", "required": false},
        {"id": "job-search-cost", "type": "radio", "required": false}
      ]
    }
  ]
}', TRUE);

-- 创建视图：完整的问卷回答视图
CREATE VIEW v_complete_responses AS
SELECT 
    r.id,
    r.session_id,
    r.is_completed,
    r.completion_percentage,
    r.started_at,
    r.completed_at,
    r.total_time_seconds,
    r.device_type,
    r.quality_score,
    -- 聚合所有答案为JSON对象
    JSON_OBJECTAGG(a.question_id, a.answer_value) as answers
FROM questionnaire_responses r
LEFT JOIN questionnaire_answers a ON r.id = a.response_id
WHERE r.is_valid = TRUE
GROUP BY r.id;

-- 创建视图：基础统计视图
CREATE VIEW v_basic_statistics AS
SELECT 
    COUNT(*) as total_responses,
    SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed_responses,
    AVG(completion_percentage) as avg_completion_rate,
    AVG(total_time_seconds) as avg_completion_time,
    AVG(quality_score) as avg_quality_score,
    COUNT(DISTINCT DATE(started_at)) as active_days,
    MIN(started_at) as first_response,
    MAX(started_at) as last_response
FROM questionnaire_responses
WHERE is_valid = TRUE;

-- 创建存储过程：清理过期缓存
DELIMITER //
CREATE PROCEDURE CleanExpiredCache()
BEGIN
    DELETE FROM analytics_cache 
    WHERE expires_at < NOW() OR is_valid = FALSE;
    
    SELECT ROW_COUNT() as deleted_rows;
END //
DELIMITER ;

-- 创建存储过程：获取统计数据
DELIMITER //
CREATE PROCEDURE GetAnalyticsData(
    IN cache_key_param VARCHAR(255),
    IN cache_type_param VARCHAR(50),
    IN ttl_minutes INT DEFAULT 60
)
BEGIN
    DECLARE cached_data JSON;
    
    -- 尝试从缓存获取
    SELECT cache_data INTO cached_data
    FROM analytics_cache 
    WHERE cache_key = cache_key_param 
      AND expires_at > NOW() 
      AND is_valid = TRUE
    LIMIT 1;
    
    -- 如果缓存存在，直接返回
    IF cached_data IS NOT NULL THEN
        SELECT cached_data as data, 'cache' as source;
    ELSE
        -- 缓存不存在，返回空结果，由应用层计算并缓存
        SELECT NULL as data, 'compute' as source;
    END IF;
END //
DELIMITER ;

-- 创建触发器：自动更新最后修改时间
DELIMITER //
CREATE TRIGGER tr_update_response_timestamp
    BEFORE UPDATE ON questionnaire_responses
    FOR EACH ROW
BEGIN
    SET NEW.last_updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- 创建函数：计算完成率
DELIMITER //
CREATE FUNCTION CalculateCompletionRate(response_id BIGINT) 
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total_questions INT DEFAULT 27;
    DECLARE answered_questions INT;
    
    SELECT COUNT(*) INTO answered_questions
    FROM questionnaire_answers 
    WHERE response_id = response_id;
    
    RETURN ROUND((answered_questions / total_questions) * 100, 2);
END //
DELIMITER ;

-- 插入测试配置数据
INSERT INTO analytics_cache (cache_key, cache_type, cache_data, sample_size, expires_at) VALUES
('test_basic_stats', 'basic_stats', '{"total": 0, "completed": 0}', 0, DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- =====================================================
-- PNG卡片系统表 (集成自06_png_card_system.sql)
-- =====================================================

-- 1. 内容PNG卡片存储表
CREATE TABLE IF NOT EXISTS content_png_cards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 内容关联
    content_type ENUM('heart_voice', 'story') NOT NULL COMMENT '内容类型',
    content_id BIGINT NOT NULL COMMENT '内容ID（B表中的ID）',
    content_uuid CHAR(36) NOT NULL COMMENT '内容UUID',

    -- 用户关联
    creator_user_id BIGINT NOT NULL COMMENT '创建者用户ID',
    creator_uuid CHAR(36) NOT NULL COMMENT '创建者UUID',

    -- PNG文件信息
    card_style ENUM('style_1', 'style_2', 'style_3', 'minimal', 'colorful') NOT NULL COMMENT '卡片风格',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_path VARCHAR(500) NOT NULL COMMENT 'R2存储路径',
    file_url VARCHAR(500) NOT NULL COMMENT '访问URL',
    file_size INT NOT NULL COMMENT '文件大小(字节)',

    -- 图片属性
    image_width INT NOT NULL DEFAULT 800 COMMENT '图片宽度',
    image_height INT NOT NULL DEFAULT 600 COMMENT '图片高度',
    image_format ENUM('png', 'jpg', 'webp') DEFAULT 'png' COMMENT '图片格式',

    -- 生成信息
    generation_status ENUM('pending', 'generating', 'completed', 'failed') DEFAULT 'pending',
    generation_started_at TIMESTAMP NULL COMMENT '生成开始时间',
    generation_completed_at TIMESTAMP NULL COMMENT '生成完成时间',
    generation_error TEXT NULL COMMENT '生成错误信息',

    -- 下载统计
    download_count INT DEFAULT 0 COMMENT '下载次数',
    last_downloaded_at TIMESTAMP NULL COMMENT '最后下载时间',

    -- 时间信息
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 索引
    UNIQUE INDEX idx_content_style (content_type, content_id, card_style),
    INDEX idx_creator (creator_user_id),
    INDEX idx_content_uuid (content_uuid),
    INDEX idx_generation_status (generation_status),
    INDEX idx_created_at (created_at),
    INDEX idx_file_path (file_path)
) COMMENT='内容PNG卡片存储表';

-- 2. PNG下载记录表
CREATE TABLE IF NOT EXISTS png_download_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 下载用户
    downloader_user_id BIGINT NOT NULL COMMENT '下载者用户ID',
    downloader_uuid CHAR(36) NOT NULL COMMENT '下载者UUID',

    -- 下载内容
    png_card_id BIGINT NOT NULL COMMENT 'PNG卡片ID',
    content_type ENUM('heart_voice', 'story') NOT NULL COMMENT '内容类型',
    content_id BIGINT NOT NULL COMMENT '内容ID',

    -- 下载信息
    download_method ENUM('direct', 'share_link', 'batch') DEFAULT 'direct' COMMENT '下载方式',
    download_ip VARCHAR(45) COMMENT '下载IP',
    user_agent TEXT COMMENT '用户代理',

    -- 时间信息
    downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_downloader (downloader_user_id, downloaded_at),
    INDEX idx_content (content_type, content_id),
    INDEX idx_png_card (png_card_id),
    INDEX idx_downloaded_at (downloaded_at),
    INDEX idx_download_ip (download_ip)
) COMMENT='PNG下载记录表';

-- 3. 卡片风格配置表
CREATE TABLE IF NOT EXISTS card_style_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- 风格信息
    style_id VARCHAR(50) NOT NULL UNIQUE COMMENT '风格ID',
    style_name VARCHAR(100) NOT NULL COMMENT '风格名称',
    style_description TEXT COMMENT '风格描述',

    -- 尺寸配置
    default_width INT NOT NULL DEFAULT 800 COMMENT '默认宽度',
    default_height INT NOT NULL DEFAULT 600 COMMENT '默认高度',

    -- 颜色配置
    background_color VARCHAR(50) NOT NULL DEFAULT '#ffffff' COMMENT '背景颜色',
    text_color VARCHAR(50) NOT NULL DEFAULT '#333333' COMMENT '文字颜色',
    accent_color VARCHAR(50) NOT NULL DEFAULT '#1890ff' COMMENT '强调色',

    -- 字体配置
    font_family VARCHAR(100) DEFAULT 'SimHei' COMMENT '字体族',
    font_size_title INT DEFAULT 24 COMMENT '标题字号',
    font_size_content INT DEFAULT 16 COMMENT '内容字号',
    font_size_meta INT DEFAULT 12 COMMENT '元信息字号',

    -- 布局配置
    padding INT DEFAULT 40 COMMENT '内边距',
    border_radius INT DEFAULT 12 COMMENT '圆角半径',

    -- 状态信息
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',

    -- 时间信息
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_style_id (style_id),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) COMMENT='卡片风格配置表';

-- 4. 插入默认卡片风格
INSERT IGNORE INTO card_style_configs (
    style_id, style_name, style_description,
    default_width, default_height,
    background_color, text_color, accent_color,
    font_family, font_size_title, font_size_content, font_size_meta,
    padding, border_radius, sort_order
) VALUES
('style_1', '经典风格', '简洁大方的经典设计', 800, 600, '#ffffff', '#333333', '#1890ff', 'SimHei', 24, 16, 12, 40, 12, 1),
('style_2', '温暖风格', '温馨舒适的暖色调设计', 800, 600, '#fef7e6', '#8b4513', '#ff7f50', 'SimHei', 26, 18, 14, 50, 16, 2),
('style_3', '现代风格', '时尚前卫的现代化设计', 900, 700, '#f8f9fa', '#2c3e50', '#e74c3c', 'SimHei', 28, 20, 16, 60, 20, 3),
('minimal', '简约风格', '极简主义的纯净设计', 600, 400, '#ffffff', '#000000', '#666666', 'SimHei', 20, 14, 10, 30, 8, 4),
('colorful', '彩色风格', '丰富多彩的渐变设计', 1000, 800, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '#ffffff', '#ffd700', 'SimHei', 32, 22, 18, 70, 24, 5);

-- 5. 完善用户内容管理表 - 添加PNG下载权限
ALTER TABLE user_content_management
ADD COLUMN IF NOT EXISTS can_download BOOLEAN DEFAULT FALSE COMMENT 'PNG下载权限';

-- 6. 为半匿名用户启用下载权限
UPDATE user_content_management ucm
JOIN users u ON ucm.user_id = u.id
SET ucm.can_download = TRUE
WHERE u.user_type = 'semi_anonymous';

COMMIT;

-- 完成提示
SELECT 'PNG卡片系统数据库表创建完成！' as message;
