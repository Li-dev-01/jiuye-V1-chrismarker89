-- PNG卡片系统数据库表
-- 支持问卷心声和故事的PNG卡片生成、存储和下载

-- 1. 内容PNG卡片存储表
CREATE TABLE content_png_cards (
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
    
    -- 外键约束
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 索引
    UNIQUE INDEX idx_content_style (content_type, content_id, card_style),
    INDEX idx_creator (creator_user_id),
    INDEX idx_content_uuid (content_uuid),
    INDEX idx_generation_status (generation_status),
    INDEX idx_created_at (created_at),
    INDEX idx_file_path (file_path)
) COMMENT='内容PNG卡片存储表';

-- 2. PNG下载记录表
CREATE TABLE png_download_records (
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
    
    -- 外键约束
    FOREIGN KEY (downloader_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (png_card_id) REFERENCES content_png_cards(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_downloader (downloader_user_id, downloaded_at),
    INDEX idx_content (content_type, content_id),
    INDEX idx_png_card (png_card_id),
    INDEX idx_downloaded_at (downloaded_at),
    INDEX idx_download_ip (download_ip)
) COMMENT='PNG下载记录表';

-- 3. 用户内容管理表
CREATE TABLE user_content_management (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 用户信息
    user_id BIGINT NOT NULL COMMENT '用户ID',
    user_uuid CHAR(36) NOT NULL COMMENT '用户UUID',
    
    -- 内容信息
    content_type ENUM('questionnaire', 'heart_voice', 'story') NOT NULL COMMENT '内容类型',
    content_id BIGINT NOT NULL COMMENT '内容ID（B表中的ID）',
    content_uuid CHAR(36) NOT NULL COMMENT '内容UUID',
    raw_content_id BIGINT NOT NULL COMMENT '原始内容ID（A表中的ID）',
    
    -- 状态信息
    content_status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'deleted') NOT NULL,
    is_published BOOLEAN DEFAULT FALSE COMMENT '是否已发布',
    is_featured BOOLEAN DEFAULT FALSE COMMENT '是否精选',
    
    -- 权限信息
    can_edit BOOLEAN DEFAULT TRUE COMMENT '可编辑',
    can_delete BOOLEAN DEFAULT TRUE COMMENT '可删除',
    can_download BOOLEAN DEFAULT FALSE COMMENT '可下载（半匿名用户专用）',
    
    -- PNG生成状态
    png_generation_status ENUM('not_started', 'pending', 'generating', 'completed', 'failed') DEFAULT 'not_started',
    png_cards_count INT DEFAULT 0 COMMENT 'PNG卡片数量',
    
    -- 时间信息
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL COMMENT '发布时间',
    deleted_at TIMESTAMP NULL COMMENT '删除时间',
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 索引
    UNIQUE INDEX idx_user_content (user_id, content_type, content_id),
    INDEX idx_user_status (user_id, content_status),
    INDEX idx_content_uuid (content_uuid),
    INDEX idx_published (is_published, published_at),
    INDEX idx_png_status (png_generation_status),
    INDEX idx_can_download (can_download)
) COMMENT='用户内容管理表';

-- 4. 卡片风格配置表
CREATE TABLE card_style_configs (
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

-- 5. 插入默认卡片风格
INSERT INTO card_style_configs (
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

-- 6. 创建PNG生成任务表
CREATE TABLE png_generation_tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 任务信息
    task_uuid CHAR(36) NOT NULL UNIQUE COMMENT '任务UUID',
    task_type ENUM('single', 'batch', 'regenerate') NOT NULL DEFAULT 'single' COMMENT '任务类型',
    task_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    
    -- 内容信息
    content_type ENUM('heart_voice', 'story') NOT NULL COMMENT '内容类型',
    content_ids JSON NOT NULL COMMENT '内容ID列表',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    
    -- 生成配置
    styles JSON NOT NULL COMMENT '要生成的风格列表',
    priority INT DEFAULT 0 COMMENT '优先级',
    
    -- 进度信息
    total_cards INT DEFAULT 0 COMMENT '总卡片数',
    completed_cards INT DEFAULT 0 COMMENT '已完成卡片数',
    failed_cards INT DEFAULT 0 COMMENT '失败卡片数',
    progress_percentage DECIMAL(5,2) DEFAULT 0 COMMENT '完成百分比',
    
    -- 结果信息
    generated_card_ids JSON COMMENT '生成的卡片ID列表',
    error_message TEXT COMMENT '错误信息',
    
    -- 时间信息
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_task_uuid (task_uuid),
    INDEX idx_task_status (task_status),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_priority (priority)
) COMMENT='PNG生成任务表';

-- 7. 创建触发器：自动更新下载统计
DELIMITER //
CREATE TRIGGER update_download_stats 
AFTER INSERT ON png_download_records
FOR EACH ROW
BEGIN
    UPDATE content_png_cards 
    SET download_count = download_count + 1,
        last_downloaded_at = NEW.downloaded_at
    WHERE id = NEW.png_card_id;
END //
DELIMITER ;

-- 8. 创建存储过程：批量生成PNG卡片
DELIMITER //
CREATE PROCEDURE BatchGeneratePNGCards(
    IN p_user_id BIGINT,
    IN p_content_type VARCHAR(20),
    IN p_content_ids JSON,
    IN p_styles JSON
)
BEGIN
    DECLARE v_task_uuid CHAR(36);
    DECLARE v_total_cards INT;
    
    -- 生成任务UUID
    SET v_task_uuid = UUID();
    
    -- 计算总卡片数
    SET v_total_cards = JSON_LENGTH(p_content_ids) * JSON_LENGTH(p_styles);
    
    -- 创建生成任务
    INSERT INTO png_generation_tasks (
        task_uuid, task_type, content_type, content_ids, 
        user_id, styles, total_cards
    ) VALUES (
        v_task_uuid, 'batch', p_content_type, p_content_ids,
        p_user_id, p_styles, v_total_cards
    );
    
    -- 返回任务UUID
    SELECT v_task_uuid as task_uuid, v_total_cards as total_cards;
END //
DELIMITER ;

-- 9. 创建视图：用户内容统计
CREATE VIEW user_content_stats AS
SELECT 
    u.id as user_id,
    u.uuid as user_uuid,
    u.user_type,
    COUNT(CASE WHEN ucm.content_type = 'heart_voice' THEN 1 END) as heart_voices_count,
    COUNT(CASE WHEN ucm.content_type = 'story' THEN 1 END) as stories_count,
    COUNT(CASE WHEN ucm.content_type = 'questionnaire' THEN 1 END) as questionnaires_count,
    SUM(ucm.png_cards_count) as total_png_cards,
    COUNT(CASE WHEN ucm.png_generation_status = 'completed' THEN 1 END) as completed_generations,
    MAX(ucm.updated_at) as last_content_update
FROM users u
LEFT JOIN user_content_management ucm ON u.id = ucm.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.uuid, u.user_type;

-- 10. 创建索引优化查询性能
CREATE INDEX idx_content_png_cards_composite ON content_png_cards (creator_user_id, content_type, generation_status);
CREATE INDEX idx_png_download_records_composite ON png_download_records (downloader_user_id, content_type, downloaded_at);
CREATE INDEX idx_user_content_management_composite ON user_content_management (user_id, content_status, png_generation_status);

-- 完成提示
SELECT 'PNG卡片系统数据库表创建完成！' as message;
