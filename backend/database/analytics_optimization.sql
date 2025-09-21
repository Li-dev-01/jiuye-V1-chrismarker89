-- 数据可视化性能优化数据库结构
-- 创建静态汇总表，支持5分钟同步策略

-- 1. 基础统计汇总表
CREATE TABLE analytics_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    summary_type VARCHAR(50) NOT NULL COMMENT '汇总类型',
    dimension VARCHAR(50) NULL COMMENT '维度',
    dimension_value VARCHAR(100) NULL COMMENT '维度值',
    
    -- 基础统计数据
    total_responses INT NOT NULL DEFAULT 0,
    completed_responses INT NOT NULL DEFAULT 0,
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    avg_completion_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    avg_quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- 就业相关统计
    employment_count INT NOT NULL DEFAULT 0,
    unemployment_count INT NOT NULL DEFAULT 0,
    employment_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- 时间范围
    data_range_from TIMESTAMP NULL,
    data_range_to TIMESTAMP NULL,
    
    -- 元数据
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_version INT NOT NULL DEFAULT 1,
    
    -- 索引
    INDEX idx_summary_type (summary_type),
    INDEX idx_dimension (dimension, dimension_value),
    INDEX idx_last_updated (last_updated)
) COMMENT='数据可视化静态汇总表';

-- 2. 分布数据汇总表
CREATE TABLE analytics_distribution (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id VARCHAR(100) NOT NULL COMMENT '问题ID',
    option_value VARCHAR(100) NOT NULL COMMENT '选项值',
    option_label VARCHAR(255) NULL COMMENT '选项标签',
    
    -- 统计数据
    count INT NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- 筛选维度
    dimension VARCHAR(50) NULL COMMENT '筛选维度',
    dimension_value VARCHAR(100) NULL COMMENT '筛选值',
    
    -- 元数据
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_version INT NOT NULL DEFAULT 1,
    
    -- 索引
    UNIQUE INDEX idx_question_option_dim (question_id, option_value, dimension, dimension_value),
    INDEX idx_question_id (question_id),
    INDEX idx_last_updated (last_updated)
) COMMENT='选项分布静态汇总表';

-- 3. 交叉分析汇总表
CREATE TABLE analytics_cross (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dimension1 VARCHAR(100) NOT NULL COMMENT '维度1',
    value1 VARCHAR(100) NOT NULL COMMENT '值1',
    dimension2 VARCHAR(100) NOT NULL COMMENT '维度2',
    value2 VARCHAR(100) NOT NULL COMMENT '值2',
    
    -- 统计数据
    count INT NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- 元数据
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_version INT NOT NULL DEFAULT 1,
    
    -- 索引
    UNIQUE INDEX idx_dimensions (dimension1, value1, dimension2, value2),
    INDEX idx_dim1 (dimension1, value1),
    INDEX idx_dim2 (dimension2, value2),
    INDEX idx_last_updated (last_updated)
) COMMENT='交叉分析静态汇总表';

-- 4. 同步任务表
CREATE TABLE analytics_sync_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_type VARCHAR(50) NOT NULL COMMENT '任务类型',
    status ENUM('pending', 'running', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    affected_rows INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    
    -- 索引
    INDEX idx_task_type (task_type),
    INDEX idx_status (status),
    INDEX idx_completed_at (completed_at)
) COMMENT='数据同步任务记录表';

-- 5. 基础统计数据同步存储过程
DELIMITER //
CREATE PROCEDURE SyncBasicStatistics()
BEGIN
    DECLARE sync_start TIMESTAMP;
    DECLARE affected_rows INT DEFAULT 0;
    DECLARE task_id INT;
    
    -- 创建同步任务记录
    INSERT INTO analytics_sync_tasks (task_type, status, started_at)
    VALUES ('basic_statistics', 'running', NOW());
    
    SET task_id = LAST_INSERT_ID();
    SET sync_start = NOW();
    
    -- 清空现有数据（全量更新）
    DELETE FROM analytics_summary WHERE summary_type = 'basic';
    
    -- 插入全局基础统计
    INSERT INTO analytics_summary (
        summary_type, dimension, dimension_value,
        total_responses, completed_responses, completion_rate,
        avg_completion_time, avg_quality_score,
        employment_count, unemployment_count, employment_rate,
        data_range_from, data_range_to, last_updated
    )
    SELECT 
        'basic' as summary_type, NULL as dimension, NULL as dimension_value,
        COUNT(*) as total_responses,
        SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed_responses,
        ROUND(AVG(completion_percentage), 2) as completion_rate,
        ROUND(AVG(total_time_seconds) / 60, 2) as avg_completion_time,
        ROUND(AVG(quality_score), 2) as avg_quality_score,
        
        (SELECT COUNT(*) FROM questionnaire_responses r
         JOIN questionnaire_answers a ON r.id = a.response_id
         WHERE a.question_id = 'current-status' 
         AND JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) IN ('fulltime', 'parttime')
         AND r.is_valid = TRUE) as employment_count,
         
        (SELECT COUNT(*) FROM questionnaire_responses r
         JOIN questionnaire_answers a ON r.id = a.response_id
         WHERE a.question_id = 'current-status' 
         AND JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) = 'unemployed'
         AND r.is_valid = TRUE) as unemployment_count,
         
        ROUND((SELECT COUNT(*) FROM questionnaire_responses r
               JOIN questionnaire_answers a ON r.id = a.response_id
               WHERE a.question_id = 'current-status' 
               AND JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) IN ('fulltime', 'parttime')
               AND r.is_valid = TRUE) / 
              (SELECT COUNT(*) FROM questionnaire_responses WHERE is_completed = TRUE AND is_valid = TRUE) * 100, 2) as employment_rate,
              
        MIN(started_at) as data_range_from,
        MAX(started_at) as data_range_to,
        NOW() as last_updated
    FROM questionnaire_responses
    WHERE is_valid = TRUE;
    
    SET affected_rows = affected_rows + ROW_COUNT();
    
    -- 按学历维度统计
    INSERT INTO analytics_summary (
        summary_type, dimension, dimension_value,
        total_responses, completed_responses, completion_rate,
        avg_completion_time, avg_quality_score,
        employment_count, unemployment_count, employment_rate,
        data_range_from, data_range_to, last_updated
    )
    SELECT 
        'basic' as summary_type, 'education_level' as dimension, 
        JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) as dimension_value,
        COUNT(DISTINCT r.id) as total_responses,
        SUM(CASE WHEN r.is_completed = TRUE THEN 1 ELSE 0 END) as completed_responses,
        ROUND(AVG(r.completion_percentage), 2) as completion_rate,
        ROUND(AVG(r.total_time_seconds) / 60, 2) as avg_completion_time,
        ROUND(AVG(r.quality_score), 2) as avg_quality_score,
        
        (SELECT COUNT(*) FROM questionnaire_responses r2
         JOIN questionnaire_answers a1 ON r2.id = a1.response_id AND a1.question_id = 'education-level'
         JOIN questionnaire_answers a2 ON r2.id = a2.response_id AND a2.question_id = 'current-status'
         WHERE JSON_UNQUOTE(JSON_EXTRACT(a1.answer_value, '$')) = JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$'))
         AND JSON_UNQUOTE(JSON_EXTRACT(a2.answer_value, '$')) IN ('fulltime', 'parttime')
         AND r2.is_valid = TRUE) as employment_count,
         
        (SELECT COUNT(*) FROM questionnaire_responses r2
         JOIN questionnaire_answers a1 ON r2.id = a1.response_id AND a1.question_id = 'education-level'
         JOIN questionnaire_answers a2 ON r2.id = a2.response_id AND a2.question_id = 'current-status'
         WHERE JSON_UNQUOTE(JSON_EXTRACT(a1.answer_value, '$')) = JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$'))
         AND JSON_UNQUOTE(JSON_EXTRACT(a2.answer_value, '$')) = 'unemployed'
         AND r2.is_valid = TRUE) as unemployment_count,
         
        ROUND((SELECT COUNT(*) FROM questionnaire_responses r2
               JOIN questionnaire_answers a1 ON r2.id = a1.response_id AND a1.question_id = 'education-level'
               JOIN questionnaire_answers a2 ON r2.id = a2.response_id AND a2.question_id = 'current-status'
               WHERE JSON_UNQUOTE(JSON_EXTRACT(a1.answer_value, '$')) = JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$'))
               AND JSON_UNQUOTE(JSON_EXTRACT(a2.answer_value, '$')) IN ('fulltime', 'parttime')
               AND r2.is_valid = TRUE) / 
              COUNT(DISTINCT CASE WHEN r.is_completed = TRUE THEN r.id ELSE NULL END) * 100, 2) as employment_rate,
              
        MIN(r.started_at) as data_range_from,
        MAX(r.started_at) as data_range_to,
        NOW() as last_updated
    FROM questionnaire_responses r
    JOIN questionnaire_answers a ON r.id = a.response_id AND a.question_id = 'education-level'
    WHERE r.is_valid = TRUE
    GROUP BY JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$'));
    
    SET affected_rows = affected_rows + ROW_COUNT();
    
    -- 更新同步任务状态
    UPDATE analytics_sync_tasks
    SET status = 'completed',
        completed_at = NOW(),
        affected_rows = affected_rows,
        duration_seconds = TIMESTAMPDIFF(SECOND, sync_start, NOW())
    WHERE id = task_id;
    
END //
DELIMITER ;

-- 6. 分布数据同步存储过程
DELIMITER //
CREATE PROCEDURE SyncDistributionData()
BEGIN
    DECLARE sync_start TIMESTAMP;
    DECLARE affected_rows INT DEFAULT 0;
    DECLARE task_id INT;
    
    -- 创建同步任务记录
    INSERT INTO analytics_sync_tasks (task_type, status, started_at)
    VALUES ('distribution_data', 'running', NOW());
    
    SET task_id = LAST_INSERT_ID();
    SET sync_start = NOW();
    
    -- 清空现有数据（全量更新）
    DELETE FROM analytics_distribution;
    
    -- 同步主要问题的分布数据
    INSERT INTO analytics_distribution (
        question_id, option_value, option_label,
        count, percentage, last_updated
    )
    SELECT 
        a.question_id,
        JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) as option_value,
        JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) as option_label,
        COUNT(*) as count,
        ROUND(COUNT(*) / (SELECT COUNT(*) FROM questionnaire_responses WHERE is_completed = TRUE AND is_valid = TRUE) * 100, 2) as percentage,
        NOW() as last_updated
    FROM questionnaire_answers a
    JOIN questionnaire_responses r ON a.response_id = r.id
    WHERE r.is_completed = TRUE 
      AND r.is_valid = TRUE
      AND a.question_id IN (
        'education-level', 'major-field', 'graduation-year', 'gender',
        'current-status', 'job-satisfaction', 'current-salary',
        'unemployment-duration', 'job-hunting-difficulties',
        'preferred-industries', 'expected-salary', 'work-location-preference'
      )
      AND a.question_type IN ('radio', 'checkbox')
    GROUP BY a.question_id, JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$'));
    
    SET affected_rows = affected_rows + ROW_COUNT();
    
    -- 更新同步任务状态
    UPDATE analytics_sync_tasks
    SET status = 'completed',
        completed_at = NOW(),
        affected_rows = affected_rows,
        duration_seconds = TIMESTAMPDIFF(SECOND, sync_start, NOW())
    WHERE id = task_id;
    
END //
DELIMITER ;

-- 7. 主同步存储过程
DELIMITER //
CREATE PROCEDURE SyncAllAnalyticsData()
BEGIN
    -- 同步所有数据
    CALL SyncBasicStatistics();
    CALL SyncDistributionData();
END //
DELIMITER ;

-- 8. 创建定时同步事件（每5分钟执行一次）
DELIMITER //
CREATE EVENT IF NOT EXISTS event_sync_analytics_data
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
    -- 检查是否有正在运行的同步任务
    IF NOT EXISTS (SELECT 1 FROM analytics_sync_tasks WHERE status = 'running' AND started_at > NOW() - INTERVAL 10 MINUTE) THEN
        CALL SyncAllAnalyticsData();
    END IF;
END //
DELIMITER ;

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;
