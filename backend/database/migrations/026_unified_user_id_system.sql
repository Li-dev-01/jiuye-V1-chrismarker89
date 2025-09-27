-- 统一用户ID生成系统优化
-- 支持3种用户创建模式的数据库结构

-- =====================================================
-- 1. 扩展用户表，添加创建模式字段
-- =====================================================

-- 添加用户创建模式字段
ALTER TABLE universal_users ADD COLUMN creation_mode TEXT DEFAULT 'manual' 
CHECK (creation_mode IN ('manual', 'google_oauth', 'auto_register'));

-- 添加用户ID生成相关字段
ALTER TABLE universal_users ADD COLUMN user_id_prefix TEXT; -- 1-9前缀或其他标识
ALTER TABLE universal_users ADD COLUMN google_id TEXT UNIQUE; -- Google用户ID
ALTER TABLE universal_users ADD COLUMN email TEXT UNIQUE; -- 邮箱地址
ALTER TABLE universal_users ADD COLUMN phone TEXT; -- 手机号码
ALTER TABLE universal_users ADD COLUMN id_generation_source TEXT; -- ID生成来源

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_universal_users_creation_mode ON universal_users(creation_mode);
CREATE INDEX IF NOT EXISTS idx_universal_users_user_id_prefix ON universal_users(user_id_prefix);
CREATE INDEX IF NOT EXISTS idx_universal_users_google_id ON universal_users(google_id);
CREATE INDEX IF NOT EXISTS idx_universal_users_email ON universal_users(email);

-- =====================================================
-- 2. 用户ID生成规则表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_id_generation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creation_mode TEXT NOT NULL CHECK (creation_mode IN ('manual', 'google_oauth', 'auto_register')),
    prefix_pattern TEXT, -- 前缀模式，如 '1-9' 表示1到9的数字前缀
    id_format TEXT NOT NULL, -- ID格式规则
    validation_rules TEXT, -- JSON格式的验证规则
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认规则
INSERT INTO user_id_generation_rules (creation_mode, prefix_pattern, id_format, validation_rules, description) VALUES
('manual', NULL, 'custom', '{"min_length": 3, "max_length": 50, "allowed_chars": "alphanumeric_underscore"}', '用户手动创建，自定义用户名'),
('google_oauth', 'google_', 'google_{google_id}', '{"source": "google", "auto_verify": true}', 'Google OAuth自动创建'),
('auto_register', '1-9', '{prefix}_{timestamp}_{random}', '{"prefix_range": [1, 9], "timestamp_format": "unix", "random_length": 6}', '自动注册，使用1-9数字前缀');

-- =====================================================
-- 3. 用户ID生成历史表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_id_generation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    creation_mode TEXT NOT NULL,
    generated_id TEXT NOT NULL,
    prefix_used TEXT,
    generation_method TEXT, -- 生成方法描述
    generation_params TEXT, -- JSON格式的生成参数
    collision_count INTEGER DEFAULT 0, -- 冲突次数
    success INTEGER NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_id_generation_history_user_uuid ON user_id_generation_history(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_id_generation_history_creation_mode ON user_id_generation_history(creation_mode);
CREATE INDEX IF NOT EXISTS idx_user_id_generation_history_generated_id ON user_id_generation_history(generated_id);

-- =====================================================
-- 4. 前缀使用统计表
-- =====================================================
CREATE TABLE IF NOT EXISTS prefix_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prefix TEXT NOT NULL,
    creation_mode TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    last_used_at DATETIME,
    is_available INTEGER DEFAULT 1,
    reserved_until DATETIME, -- 预留到某个时间
    metadata TEXT, -- JSON格式的额外信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(prefix, creation_mode)
);

-- 初始化1-9前缀
INSERT INTO prefix_usage_stats (prefix, creation_mode, usage_count) VALUES
('1', 'auto_register', 0),
('2', 'auto_register', 0),
('3', 'auto_register', 0),
('4', 'auto_register', 0),
('5', 'auto_register', 0),
('6', 'auto_register', 0),
('7', 'auto_register', 0),
('8', 'auto_register', 0),
('9', 'auto_register', 0);

-- =====================================================
-- 5. 用户身份验证方式表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_auth_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('password', 'google_oauth', 'ab_identity', 'anonymous')),
    auth_identifier TEXT, -- 认证标识符（邮箱、Google ID、A+B哈希等）
    auth_data TEXT, -- JSON格式的认证数据
    is_primary INTEGER DEFAULT 0, -- 是否为主要认证方式
    is_active INTEGER DEFAULT 1,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE,
    UNIQUE(auth_type, auth_identifier)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_auth_methods_user_uuid ON user_auth_methods(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_auth_methods_auth_type ON user_auth_methods(auth_type);
CREATE INDEX IF NOT EXISTS idx_user_auth_methods_auth_identifier ON user_auth_methods(auth_identifier);

-- =====================================================
-- 6. 更新触发器
-- =====================================================

-- 更新用户表的updated_at字段
CREATE TRIGGER IF NOT EXISTS update_universal_users_updated_at
    AFTER UPDATE ON universal_users
    FOR EACH ROW
BEGIN
    UPDATE universal_users SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid;
END;

-- 更新前缀使用统计
CREATE TRIGGER IF NOT EXISTS update_prefix_usage_stats
    AFTER INSERT ON universal_users
    FOR EACH ROW
    WHEN NEW.user_id_prefix IS NOT NULL
BEGIN
    UPDATE prefix_usage_stats 
    SET usage_count = usage_count + 1, 
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE prefix = NEW.user_id_prefix AND creation_mode = NEW.creation_mode;
END;
