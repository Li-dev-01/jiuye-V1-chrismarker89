-- 增强用户管理系统
-- 包含UUID体系、审核员日志、内容分类管理

-- 用户类型枚举和UUID规则
-- admin: 'adm-YYYYMMDD-HHMMSS-random'
-- reviewer: 'rev-YYYYMMDD-HHMMSS-random'  
-- semi_anonymous: 'sa-YYYYMMDD-HHMMSS-random'
-- full_anonymous: 'fa-YYYYMMDD-HHMMSS-random'

-- 增强用户表 (修改现有users表)
-- 修改user_uuid字段长度以支持新的UUID格式
ALTER TABLE users MODIFY COLUMN user_uuid VARCHAR(50) UNIQUE COMMENT '用户UUID，包含类型和时间信息';

-- 修改user_type字段以支持更多用户类型
ALTER TABLE users MODIFY COLUMN user_type ENUM('admin', 'reviewer', 'semi_anonymous', 'full_anonymous', 'anonymous') NOT NULL DEFAULT 'full_anonymous' COMMENT '用户类别';

-- 添加新字段
ALTER TABLE users
ADD COLUMN registration_ip VARCHAR(45) COMMENT '注册IP地址',
ADD COLUMN last_login_ip VARCHAR(45) COMMENT '最后登录IP',
ADD COLUMN permissions JSON COMMENT '用户权限配置',
ADD COLUMN profile_data JSON COMMENT '用户档案数据';

-- 添加索引
ALTER TABLE users
ADD INDEX idx_user_category (user_type),
ADD INDEX idx_created_at_category (created_at, user_type);

-- 审核员活动日志表
CREATE TABLE IF NOT EXISTS reviewer_activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reviewer_uuid VARCHAR(50) NOT NULL COMMENT '审核员UUID',
    activity_type ENUM('login', 'logout', 'review_approve', 'review_reject', 'review_flag') NOT NULL COMMENT '活动类型',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    content_id INT COMMENT '审核的内容ID（如果是审核操作）',
    content_type ENUM('heart_voice', 'story', 'questionnaire') COMMENT '审核的内容类型',
    session_id VARCHAR(100) COMMENT '会话ID',
    details JSON COMMENT '活动详细信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_reviewer_uuid (reviewer_uuid),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reviewer_created (reviewer_uuid, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核员活动日志表';

-- 审核员工作统计表（预计算统计数据）
CREATE TABLE IF NOT EXISTS reviewer_work_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reviewer_uuid VARCHAR(50) NOT NULL COMMENT '审核员UUID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    login_count INT DEFAULT 0 COMMENT '登录次数',
    total_reviews INT DEFAULT 0 COMMENT '总审核数量',
    approved_count INT DEFAULT 0 COMMENT '通过数量',
    rejected_count INT DEFAULT 0 COMMENT '拒绝数量',
    flagged_count INT DEFAULT 0 COMMENT '标记数量',
    work_duration_minutes INT DEFAULT 0 COMMENT '工作时长（分钟）',
    first_login_at TIMESTAMP NULL COMMENT '首次登录时间',
    last_logout_at TIMESTAMP NULL COMMENT '最后登出时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_reviewer_date (reviewer_uuid, stat_date),
    INDEX idx_reviewer_uuid (reviewer_uuid),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核员工作统计表';

-- 内容分类管理表
CREATE TABLE IF NOT EXISTS content_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_key VARCHAR(50) NOT NULL UNIQUE COMMENT '分类键名',
    category_name VARCHAR(100) NOT NULL COMMENT '分类显示名称',
    category_name_en VARCHAR(100) COMMENT '英文名称',
    description TEXT COMMENT '分类描述',
    parent_id INT NULL COMMENT '父分类ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    icon VARCHAR(50) COMMENT '图标',
    color VARCHAR(20) COMMENT '颜色代码',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    content_type ENUM('heart_voice', 'story', 'questionnaire', 'all') DEFAULT 'all' COMMENT '适用内容类型',
    display_rules JSON COMMENT '显示规则配置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category_key (category_key),
    INDEX idx_parent_id (parent_id),
    INDEX idx_content_type (content_type),
    INDEX idx_sort_order (sort_order),
    FOREIGN KEY (parent_id) REFERENCES content_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容分类管理表';

-- 内容标签管理表
CREATE TABLE IF NOT EXISTS content_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tag_key VARCHAR(50) NOT NULL UNIQUE COMMENT '标签键名',
    tag_name VARCHAR(100) NOT NULL COMMENT '标签显示名称',
    tag_name_en VARCHAR(100) COMMENT '英文名称',
    description TEXT COMMENT '标签描述',
    tag_type ENUM('system', 'user', 'auto') DEFAULT 'system' COMMENT '标签类型',
    color VARCHAR(20) COMMENT '标签颜色',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    content_type ENUM('heart_voice', 'story', 'questionnaire', 'all') DEFAULT 'all' COMMENT '适用内容类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tag_key (tag_key),
    INDEX idx_tag_type (tag_type),
    INDEX idx_content_type (content_type),
    INDEX idx_usage_count (usage_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容标签管理表';

-- 内容展示规则表
CREATE TABLE IF NOT EXISTS content_display_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    rule_type ENUM('category', 'tag', 'user_type', 'time', 'custom') NOT NULL COMMENT '规则类型',
    target_type ENUM('heart_voice', 'story', 'questionnaire', 'all') NOT NULL COMMENT '目标内容类型',
    conditions JSON NOT NULL COMMENT '规则条件配置',
    actions JSON NOT NULL COMMENT '规则动作配置',
    priority INT DEFAULT 0 COMMENT '优先级',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    description TEXT COMMENT '规则描述',
    created_by VARCHAR(50) COMMENT '创建者',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_rule_type (rule_type),
    INDEX idx_target_type (target_type),
    INDEX idx_priority (priority),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容展示规则表';

-- 用户权限配置表
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_category ENUM('admin', 'reviewer', 'semi_anonymous', 'full_anonymous') NOT NULL COMMENT '用户类别',
    permission_key VARCHAR(100) NOT NULL COMMENT '权限键名',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    description TEXT COMMENT '权限描述',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否为默认权限',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_category_permission (user_category, permission_key),
    INDEX idx_user_category (user_category),
    INDEX idx_permission_key (permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户权限配置表';

-- 插入默认内容分类
INSERT INTO content_categories (category_key, category_name, category_name_en, description, content_type, sort_order, icon, color) VALUES
('job_search', '求职找工作', 'Job Search', '求职相关的心声和故事', 'all', 1, '💼', '#1890ff'),
('interview', '面试经历', 'Interview', '面试过程和经验分享', 'all', 2, '🎯', '#52c41a'),
('success', '成功经验', 'Success Stories', '成功案例和经验分享', 'all', 3, '🎉', '#faad14'),
('challenge', '职场挑战', 'Workplace Challenges', '职场困难和挑战', 'all', 4, '💪', '#f5222d'),
('growth', '个人成长', 'Personal Growth', '个人发展和成长经历', 'all', 5, '🌱', '#722ed1'),
('advice', '建议分享', 'Advice & Tips', '经验建议和技巧分享', 'all', 6, '💡', '#13c2c2');

-- 插入默认内容标签
INSERT INTO content_tags (tag_key, tag_name, tag_name_en, description, tag_type, color, content_type) VALUES
('urgent', '紧急', 'Urgent', '需要紧急处理的内容', 'system', '#f5222d', 'all'),
('featured', '精选', 'Featured', '精选推荐内容', 'system', '#faad14', 'all'),
('trending', '热门', 'Trending', '热门内容', 'system', '#52c41a', 'all'),
('beginner', '新手', 'Beginner', '适合新手的内容', 'system', '#1890ff', 'all'),
('experienced', '有经验', 'Experienced', '适合有经验者的内容', 'system', '#722ed1', 'all'),
('anonymous', '匿名', 'Anonymous', '匿名发布的内容', 'system', '#8c8c8c', 'all');

-- 插入默认用户权限
INSERT INTO user_permissions (user_category, permission_key, permission_name, description, is_default) VALUES
-- 全匿名用户权限
('full_anonymous', 'questionnaire_participate', '参与问卷', '可以参与问卷调查', TRUE),
('full_anonymous', 'content_view', '查看内容', '可以查看公开内容', TRUE),

-- 半匿名用户权限
('semi_anonymous', 'questionnaire_participate', '参与问卷', '可以参与问卷调查', TRUE),
('semi_anonymous', 'content_view', '查看内容', '可以查看公开内容', TRUE),
('semi_anonymous', 'content_like', '点赞内容', '可以对内容进行点赞', TRUE),
('semi_anonymous', 'content_download', '下载内容', '可以下载内容', TRUE),
('semi_anonymous', 'content_publish', '发布内容', '可以发布心声和故事', TRUE),
('semi_anonymous', 'content_comment', '评论内容', '可以对内容进行评论', TRUE),

-- 审核员权限
('reviewer', 'content_review', '内容审核', '可以审核用户提交的内容', TRUE),
('reviewer', 'content_view_all', '查看所有内容', '可以查看包括待审核的所有内容', TRUE),
('reviewer', 'review_history', '查看审核历史', '可以查看自己的审核历史', TRUE),

-- 管理员权限
('admin', 'user_manage', '用户管理', '可以管理所有用户', TRUE),
('admin', 'reviewer_manage', '审核员管理', '可以管理审核员', TRUE),
('admin', 'system_config', '系统配置', '可以配置系统参数', TRUE),
('admin', 'content_manage', '内容管理', '可以管理内容分类和标签', TRUE),
('admin', 'audit_config', '审核配置', '可以配置审核规则', TRUE),
('admin', 'data_export', '数据导出', '可以导出系统数据', TRUE);
