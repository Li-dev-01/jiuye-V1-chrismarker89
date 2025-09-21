-- Migration: 015_create_ml_security_tables
-- Description: 创建机器学习和智能安全相关表
-- Created: 2025-08-13

-- 用户行为模式表
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
    id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    
    -- 行为特征
    login_frequency_pattern TEXT, -- JSON格式，登录频率模式
    active_hours_pattern TEXT, -- JSON格式，活跃时间模式
    location_pattern TEXT, -- JSON格式，常用位置模式
    device_pattern TEXT, -- JSON格式，常用设备模式
    
    -- 统计特征
    avg_session_duration INTEGER, -- 平均会话时长（秒）
    typical_login_interval INTEGER, -- 典型登录间隔（秒）
    common_ip_addresses TEXT, -- JSON数组，常用IP地址
    common_user_agents TEXT, -- JSON数组，常用User-Agent
    
    -- 行为指纹
    click_pattern TEXT, -- JSON格式，点击行为模式
    navigation_pattern TEXT, -- JSON格式，导航行为模式
    typing_pattern TEXT, -- JSON格式，打字行为模式
    
    -- 模型相关
    pattern_confidence REAL DEFAULT 0.0, -- 模式置信度 0-1
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    sample_count INTEGER DEFAULT 0, -- 样本数量
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 异常检测记录表
CREATE TABLE IF NOT EXISTS anomaly_detections (
    id TEXT PRIMARY KEY,
    user_uuid TEXT,
    session_id TEXT,
    
    -- 异常类型
    anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
        'unusual_login_time', 'unusual_location', 'unusual_device',
        'unusual_behavior', 'velocity_anomaly', 'pattern_deviation',
        'suspicious_navigation', 'bot_behavior', 'account_takeover'
    )),
    
    -- 异常详情
    anomaly_score REAL NOT NULL, -- 异常分数 0-1
    confidence_level REAL NOT NULL, -- 置信度 0-1
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- 检测数据
    detected_features TEXT, -- JSON格式，检测到的特征
    baseline_features TEXT, -- JSON格式，基线特征
    deviation_metrics TEXT, -- JSON格式，偏差指标
    
    -- 上下文信息
    ip_address TEXT,
    user_agent TEXT,
    location_info TEXT, -- JSON格式，位置信息
    device_info TEXT, -- JSON格式，设备信息
    
    -- 处理状态
    status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'confirmed', 'false_positive', 'resolved')),
    auto_action_taken TEXT, -- 自动采取的行动
    manual_review_required BOOLEAN DEFAULT FALSE,
    
    -- 反馈学习
    feedback_provided BOOLEAN DEFAULT FALSE,
    feedback_correct BOOLEAN, -- 检测是否正确
    feedback_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 威胁情报数据表
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id TEXT PRIMARY KEY,
    
    -- 威胁标识
    threat_type TEXT NOT NULL CHECK (threat_type IN (
        'malicious_ip', 'suspicious_domain', 'known_attacker',
        'botnet_member', 'tor_exit_node', 'vpn_service',
        'compromised_credential', 'phishing_source'
    )),
    
    -- 威胁数据
    indicator_value TEXT NOT NULL, -- IP地址、域名、邮箱等
    indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain', 'email', 'hash', 'url')),
    
    -- 威胁详情
    threat_level TEXT DEFAULT 'medium' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
    confidence_score REAL DEFAULT 0.5, -- 威胁情报置信度
    description TEXT,
    
    -- 来源信息
    source_name TEXT NOT NULL, -- 威胁情报来源
    source_reliability TEXT DEFAULT 'unknown' CHECK (source_reliability IN ('high', 'medium', 'low', 'unknown')),
    
    -- 时效性
    first_seen DATETIME,
    last_seen DATETIME,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 关联信息
    related_campaigns TEXT, -- JSON数组，相关攻击活动
    attack_techniques TEXT, -- JSON数组，攻击技术
    target_sectors TEXT, -- JSON数组，目标行业
    
    -- 地理信息
    country_code TEXT,
    region TEXT,
    asn INTEGER, -- 自治系统号
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 高级设备指纹表
CREATE TABLE IF NOT EXISTS advanced_device_fingerprints (
    id TEXT PRIMARY KEY,
    user_uuid TEXT,
    session_id TEXT,
    
    -- 基础指纹
    basic_fingerprint TEXT NOT NULL, -- 基础设备指纹
    
    -- 高级指纹特征
    canvas_fingerprint TEXT, -- Canvas指纹
    webgl_fingerprint TEXT, -- WebGL指纹
    audio_fingerprint TEXT, -- 音频指纹
    font_fingerprint TEXT, -- 字体指纹
    
    -- 硬件特征
    screen_resolution TEXT,
    color_depth INTEGER,
    pixel_ratio REAL,
    timezone_offset INTEGER,
    language_settings TEXT, -- JSON数组
    
    -- 浏览器特征
    plugins_list TEXT, -- JSON数组，插件列表
    extensions_detected TEXT, -- JSON数组，检测到的扩展
    browser_features TEXT, -- JSON格式，浏览器特性
    
    -- 网络特征
    connection_type TEXT,
    effective_bandwidth INTEGER,
    rtt_estimate INTEGER, -- 往返时间估计
    
    -- 行为特征
    mouse_movement_pattern TEXT, -- JSON格式，鼠标移动模式
    keyboard_timing_pattern TEXT, -- JSON格式，键盘时序模式
    scroll_behavior_pattern TEXT, -- JSON格式，滚动行为模式
    
    -- 指纹稳定性
    fingerprint_stability REAL DEFAULT 0.0, -- 指纹稳定性评分
    change_frequency INTEGER DEFAULT 0, -- 变化频率
    
    -- 风险评估
    risk_score REAL DEFAULT 0.0, -- 风险评分
    is_suspicious BOOLEAN DEFAULT FALSE,
    anomaly_flags TEXT, -- JSON数组，异常标记
    
    -- 关联分析
    similar_fingerprints TEXT, -- JSON数组，相似指纹ID
    cluster_id TEXT, -- 指纹聚类ID
    
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 自动化安全响应规则表
CREATE TABLE IF NOT EXISTS automated_response_rules (
    id TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    description TEXT,
    
    -- 触发条件
    trigger_conditions TEXT NOT NULL, -- JSON格式，触发条件
    trigger_threshold REAL DEFAULT 0.7, -- 触发阈值
    
    -- 响应动作
    response_actions TEXT NOT NULL, -- JSON数组，响应动作
    escalation_rules TEXT, -- JSON格式，升级规则
    
    -- 适用范围
    applies_to_user_types TEXT, -- JSON数组，适用用户类型
    applies_to_threat_types TEXT, -- JSON数组，适用威胁类型
    
    -- 规则状态
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,
    
    -- 执行统计
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_executed DATETIME,
    
    -- 学习优化
    effectiveness_score REAL DEFAULT 0.0, -- 有效性评分
    false_positive_rate REAL DEFAULT 0.0, -- 误报率
    
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 安全合规报告表
CREATE TABLE IF NOT EXISTS compliance_reports (
    id TEXT PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'security_audit', 'access_review', 'incident_summary',
        'compliance_check', 'risk_assessment', 'vulnerability_scan'
    )),
    
    -- 报告基本信息
    report_title TEXT NOT NULL,
    report_period_start DATETIME NOT NULL,
    report_period_end DATETIME NOT NULL,
    
    -- 报告内容
    executive_summary TEXT,
    detailed_findings TEXT, -- JSON格式，详细发现
    recommendations TEXT, -- JSON格式，建议
    metrics_data TEXT, -- JSON格式，指标数据
    
    -- 合规状态
    compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('compliant', 'non_compliant', 'partial', 'pending')),
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- 报告元数据
    generated_by TEXT NOT NULL,
    reviewed_by TEXT,
    approved_by TEXT,
    
    -- 状态跟踪
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_user ON user_behavior_patterns(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_updated ON user_behavior_patterns(last_updated);

CREATE INDEX IF NOT EXISTS idx_anomaly_detections_user ON anomaly_detections(user_uuid);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_type ON anomaly_detections(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_score ON anomaly_detections(anomaly_score);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_severity ON anomaly_detections(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_status ON anomaly_detections(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_created ON anomaly_detections(created_at);

CREATE INDEX IF NOT EXISTS idx_threat_intelligence_indicator ON threat_intelligence(indicator_value);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_type ON threat_intelligence(threat_type);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_level ON threat_intelligence(threat_level);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_active ON threat_intelligence(is_active);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_expires ON threat_intelligence(expires_at);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user ON advanced_device_fingerprints(user_uuid);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_basic ON advanced_device_fingerprints(basic_fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_risk ON advanced_device_fingerprints(risk_score);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_suspicious ON advanced_device_fingerprints(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_cluster ON advanced_device_fingerprints(cluster_id);

CREATE INDEX IF NOT EXISTS idx_response_rules_active ON automated_response_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_response_rules_priority ON automated_response_rules(priority);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports(report_period_start, report_period_end);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_user_behavior_patterns_timestamp 
    AFTER UPDATE ON user_behavior_patterns
    FOR EACH ROW
BEGIN
    UPDATE user_behavior_patterns 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_anomaly_detections_timestamp 
    AFTER UPDATE ON anomaly_detections
    FOR EACH ROW
BEGIN
    UPDATE anomaly_detections 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_threat_intelligence_timestamp 
    AFTER UPDATE ON threat_intelligence
    FOR EACH ROW
BEGIN
    UPDATE threat_intelligence 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_device_fingerprints_timestamp 
    AFTER UPDATE ON advanced_device_fingerprints
    FOR EACH ROW
BEGIN
    UPDATE advanced_device_fingerprints 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_response_rules_timestamp 
    AFTER UPDATE ON automated_response_rules
    FOR EACH ROW
BEGIN
    UPDATE automated_response_rules 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_compliance_reports_timestamp 
    AFTER UPDATE ON compliance_reports
    FOR EACH ROW
BEGIN
    UPDATE compliance_reports 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
