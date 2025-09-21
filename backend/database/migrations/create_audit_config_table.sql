-- 审核配置表
-- 存储三层审核机制的配置参数

CREATE TABLE IF NOT EXISTS audit_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- 审核模式 (单选)
    audit_mode ENUM(
        'disabled',      -- 关闭审核
        'local_only',    -- 仅本地规则
        'ai_only',       -- 仅AI审核
        'human_only',    -- 仅人工审核
        'local_ai',      -- 本地规则 + AI审核 (推荐)
        'local_human'    -- 本地规则 + 人工审核 (过渡)
    ) NOT NULL DEFAULT 'disabled',
    
    -- 本地规则配置
    local_confidence_threshold INT DEFAULT 80 COMMENT '本地规则置信度阈值(0-100)',
    local_max_content_length INT DEFAULT 1000 COMMENT '本地规则最大处理长度',
    local_sensitive_level ENUM('strict', 'normal', 'loose') DEFAULT 'normal' COMMENT '敏感词检测级别',
    
    -- AI审核配置
    ai_confidence_threshold INT DEFAULT 70 COMMENT 'AI审核置信度阈值(0-100)',
    ai_timeout_seconds INT DEFAULT 30 COMMENT 'AI审核超时时间(秒)',
    ai_fallback_to_human BOOLEAN DEFAULT TRUE COMMENT 'AI失败时是否转人工审核',
    ai_provider VARCHAR(50) DEFAULT 'openai' COMMENT '当前AI供应商',
    
    -- 人工审核配置
    human_timeout_hours INT DEFAULT 24 COMMENT '人工审核超时时间(小时)',
    human_auto_approve_on_timeout BOOLEAN DEFAULT FALSE COMMENT '超时是否自动通过',
    
    -- 触发条件配置
    trigger_on_uncertain BOOLEAN DEFAULT TRUE COMMENT '本地规则无法确定时触发下级',
    trigger_on_edge_content BOOLEAN DEFAULT TRUE COMMENT '边缘敏感内容触发下级',
    trigger_on_length_exceed BOOLEAN DEFAULT TRUE COMMENT '内容长度超限触发下级',
    trigger_on_user_appeal BOOLEAN DEFAULT TRUE COMMENT '用户申诉强制人工审核',
    
    -- 系统字段
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用此配置',
    created_by VARCHAR(50) COMMENT '创建者',
    updated_by VARCHAR(50) COMMENT '更新者',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 配置描述
    description TEXT COMMENT '配置说明',
    
    INDEX idx_audit_mode (audit_mode),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核规则配置表';

-- 插入默认配置
INSERT INTO audit_config (
    audit_mode,
    local_confidence_threshold,
    local_max_content_length,
    local_sensitive_level,
    ai_confidence_threshold,
    ai_timeout_seconds,
    ai_fallback_to_human,
    ai_provider,
    human_timeout_hours,
    human_auto_approve_on_timeout,
    trigger_on_uncertain,
    trigger_on_edge_content,
    trigger_on_length_exceed,
    trigger_on_user_appeal,
    created_by,
    description
) VALUES (
    'disabled',  -- 默认关闭审核
    80,          -- 本地规则置信度阈值
    1000,        -- 最大处理长度
    'normal',    -- 普通敏感词级别
    70,          -- AI置信度阈值
    30,          -- AI超时30秒
    TRUE,        -- AI失败转人工
    'openai',    -- 默认AI供应商
    24,          -- 人工审核24小时超时
    FALSE,       -- 超时不自动通过
    TRUE,        -- 无法确定时触发下级
    TRUE,        -- 边缘内容触发下级
    TRUE,        -- 长度超限触发下级
    TRUE,        -- 用户申诉强制人工
    'system',    -- 系统创建
    '默认审核配置 - 所有审核功能关闭，内容直接通过'
);

-- AI供应商配置表
CREATE TABLE IF NOT EXISTS ai_providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_name VARCHAR(50) NOT NULL UNIQUE COMMENT '供应商名称',
    provider_type ENUM('openai', 'claude', 'gemini', 'baidu', 'alibaba', 'tencent', 'custom') NOT NULL COMMENT '供应商类型',
    api_endpoint VARCHAR(255) COMMENT 'API端点',
    api_key_encrypted TEXT COMMENT '加密的API密钥',
    model_name VARCHAR(100) COMMENT '使用的模型名称',
    max_tokens INT DEFAULT 1000 COMMENT '最大token数',
    temperature DECIMAL(3,2) DEFAULT 0.3 COMMENT '温度参数',
    is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    priority INT DEFAULT 1 COMMENT '优先级(数字越小优先级越高)',
    cost_per_1k_tokens DECIMAL(10,6) COMMENT '每1K token成本',
    rate_limit_per_minute INT DEFAULT 60 COMMENT '每分钟请求限制',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_provider_type (provider_type),
    INDEX idx_is_enabled (is_enabled),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI供应商配置表';

-- 插入默认AI供应商
INSERT INTO ai_providers (
    provider_name,
    provider_type,
    api_endpoint,
    model_name,
    max_tokens,
    temperature,
    is_enabled,
    priority,
    cost_per_1k_tokens,
    rate_limit_per_minute
) VALUES 
('OpenAI GPT-4', 'openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4', 1000, 0.3, FALSE, 1, 0.03, 60),
('Claude 3', 'claude', 'https://api.anthropic.com/v1/messages', 'claude-3-sonnet', 1000, 0.3, FALSE, 2, 0.015, 60),
('Gemini Pro', 'gemini', 'https://generativelanguage.googleapis.com/v1/models', 'gemini-pro', 1000, 0.3, FALSE, 3, 0.001, 60),
('百度文心一言', 'baidu', 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop', 'ernie-bot', 1000, 0.3, FALSE, 4, 0.008, 60),
('阿里通义千问', 'alibaba', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', 'qwen-max', 1000, 0.3, FALSE, 5, 0.01, 60);

-- 本地规则配置表
CREATE TABLE IF NOT EXISTS local_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    rule_type ENUM('keyword', 'regex', 'length', 'format', 'custom') NOT NULL COMMENT '规则类型',
    rule_content TEXT NOT NULL COMMENT '规则内容(关键词、正则表达式等)',
    action ENUM('approve', 'reject', 'flag') NOT NULL COMMENT '匹配后的动作',
    priority INT DEFAULT 1 COMMENT '优先级',
    is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    description TEXT COMMENT '规则描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_rule_type (rule_type),
    INDEX idx_is_enabled (is_enabled),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='本地审核规则表';

-- 插入默认本地规则
INSERT INTO local_rules (rule_name, rule_type, rule_content, action, priority, description) VALUES
('基础长度检查', 'length', '{"min_length": 10, "max_length": 2000}', 'flag', 1, '内容长度必须在10-2000字符之间'),
('空内容过滤', 'custom', 'empty_content', 'reject', 1, '拒绝空内容或纯空格内容'),
('基础格式检查', 'format', 'basic_format', 'flag', 2, '检查基础格式规范'),
('测试敏感词', 'keyword', '测试敏感词,违禁内容', 'flag', 3, '测试用敏感词过滤');
