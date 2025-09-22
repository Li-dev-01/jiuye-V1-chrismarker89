# 数据库性能优化方案：多级专用表架构

## 🎯 **优化目标**

### **性能指标**
- 主表写入性能提升 80%
- 查询响应时间减少 90%
- 支持十万级数据量无性能衰减
- 读写比例优化到 1:100+

### **业务需求**
- 可视化页面 < 200ms 响应
- 统计数据实时性 < 5分钟
- 社会洞察数据 < 10分钟
- 管理员报表 < 1秒

## 🏗️ **多级表架构设计**

### **第1级：主数据表 (写入优化)**
```
用户提交 → 主数据表 (只写入，最小读取)
- questionnaire_responses (主表)
- questionnaire_answers (主表)
- users (主表)
```

### **第2级：业务专用表 (功能分离)**
```
主数据表 → 业务专用表 (按功能分离)
- analytics_responses (可视化专用)
- admin_responses (管理员专用)
- export_responses (导出专用)
- social_insights_data (AI分析专用)
```

### **第3级：统计缓存表 (查询优化)**
```
业务专用表 → 统计缓存表 (预聚合)
- realtime_stats (实时统计)
- daily_aggregates (日统计)
- weekly_aggregates (周统计)
- monthly_aggregates (月统计)
```

### **第4级：视图缓存表 (展示优化)**
```
统计缓存表 → 视图缓存表 (页面专用)
- dashboard_cache (仪表板)
- visualization_cache (可视化页面)
- report_cache (报表页面)
- api_response_cache (API响应)
```

## 📋 **具体表结构设计**

### **第2级：业务专用表**

#### **可视化专用表**
```sql
CREATE TABLE analytics_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    
    -- 预处理的统计字段
    age_range TEXT,
    education_level TEXT,
    employment_status TEXT,
    salary_range TEXT,
    work_location TEXT,
    industry TEXT,
    
    -- 多选字段 (JSON)
    job_search_channels TEXT,
    difficulties TEXT,
    skills TEXT,
    
    -- 元数据
    data_quality_score REAL DEFAULT 1.0,
    is_complete INTEGER DEFAULT 1,
    processing_version TEXT DEFAULT 'v1.0',
    
    -- 索引优化
    INDEX idx_analytics_age (age_range),
    INDEX idx_analytics_education (education_level),
    INDEX idx_analytics_employment (employment_status),
    INDEX idx_analytics_submitted (submitted_at),
    INDEX idx_analytics_quality (data_quality_score)
);
```

#### **管理员专用表**
```sql
CREATE TABLE admin_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_response_id TEXT NOT NULL,
    
    -- 管理员关注的字段
    submission_ip TEXT,
    user_agent TEXT,
    submission_duration INTEGER,
    completion_rate REAL,
    data_consistency_score REAL,
    
    -- 审核相关
    review_status TEXT DEFAULT 'pending',
    reviewer_id TEXT,
    review_notes TEXT,
    reviewed_at TEXT,
    
    -- 质量标记
    is_suspicious INTEGER DEFAULT 0,
    quality_flags TEXT, -- JSON
    risk_score INTEGER DEFAULT 0,
    
    -- 索引
    INDEX idx_admin_status (review_status),
    INDEX idx_admin_quality (data_consistency_score),
    INDEX idx_admin_risk (risk_score),
    INDEX idx_admin_reviewer (reviewer_id)
);
```

#### **AI分析专用表**
```sql
CREATE TABLE social_insights_data (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    
    -- AI分析维度
    employment_trend_score REAL,
    salary_satisfaction_score REAL,
    career_stability_score REAL,
    market_competitiveness_score REAL,
    
    -- 文本分析结果
    sentiment_score REAL,
    key_concerns TEXT, -- JSON array
    career_goals TEXT, -- JSON array
    
    -- 分类标签
    user_persona TEXT,
    career_stage TEXT,
    risk_category TEXT,
    
    -- 时间维度
    analysis_date TEXT,
    trend_period TEXT,
    
    INDEX idx_insights_trend (employment_trend_score),
    INDEX idx_insights_sentiment (sentiment_score),
    INDEX idx_insights_persona (user_persona),
    INDEX idx_insights_date (analysis_date)
);
```

### **第3级：统计缓存表**

#### **实时统计表**
```sql
CREATE TABLE realtime_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_key TEXT NOT NULL,
    stat_category TEXT NOT NULL, -- 'basic', 'employment', 'education', 'salary'
    
    -- 统计值
    count_value INTEGER DEFAULT 0,
    percentage_value REAL DEFAULT 0.0,
    average_value REAL DEFAULT 0.0,
    total_sample_size INTEGER DEFAULT 0,
    
    -- 时间窗口
    time_window TEXT NOT NULL, -- '5min', '1hour', '1day'
    window_start TEXT NOT NULL,
    window_end TEXT NOT NULL,
    
    -- 元数据
    last_updated TEXT NOT NULL,
    data_source TEXT NOT NULL,
    confidence_level REAL DEFAULT 1.0,
    
    UNIQUE(stat_key, time_window, window_start),
    INDEX idx_realtime_category (stat_category),
    INDEX idx_realtime_window (time_window),
    INDEX idx_realtime_updated (last_updated)
);
```

#### **聚合统计表**
```sql
CREATE TABLE aggregated_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dimension TEXT NOT NULL, -- 'age', 'education', 'employment', 'salary'
    dimension_value TEXT NOT NULL,
    
    -- 基础统计
    count INTEGER DEFAULT 0,
    percentage REAL DEFAULT 0.0,
    rank_position INTEGER DEFAULT 0,
    
    -- 交叉统计
    cross_dimension TEXT,
    cross_stats TEXT, -- JSON
    
    -- 趋势数据
    trend_direction TEXT, -- 'up', 'down', 'stable'
    trend_percentage REAL DEFAULT 0.0,
    
    -- 时间维度
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_date TEXT NOT NULL,
    
    -- 数据质量
    sample_size INTEGER DEFAULT 0,
    confidence_interval REAL DEFAULT 0.0,
    
    UNIQUE(dimension, dimension_value, period_type, period_date),
    INDEX idx_aggregated_dimension (dimension),
    INDEX idx_aggregated_period (period_type, period_date),
    INDEX idx_aggregated_rank (rank_position)
);
```

## ⚡ **同步策略设计**

### **分层同步频率**
```
主数据表 → 业务专用表: 实时 (触发器)
业务专用表 → 统计缓存表: 5分钟
统计缓存表 → 视图缓存表: 10分钟
特殊需求: 1分钟 (关键指标)
```

### **智能同步策略**
```sql
-- 数据变化阈值触发
CREATE TABLE sync_thresholds (
    table_name TEXT PRIMARY KEY,
    change_threshold INTEGER DEFAULT 10, -- 变化条数阈值
    time_threshold INTEGER DEFAULT 300,  -- 时间阈值(秒)
    last_sync_time TEXT,
    pending_changes INTEGER DEFAULT 0
);

-- 同步任务队列
CREATE TABLE sync_task_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,
    source_table TEXT NOT NULL,
    target_table TEXT NOT NULL,
    priority INTEGER DEFAULT 5, -- 1-10, 1最高
    scheduled_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);
```

## 🔄 **同步机制实现**

### **触发器同步 (实时)**
```sql
-- 主表到业务表的实时同步
CREATE TRIGGER sync_to_analytics_table
AFTER INSERT ON questionnaire_responses
FOR EACH ROW
BEGIN
    INSERT INTO analytics_responses (
        id, user_id, submitted_at, age_range, education_level, 
        employment_status, data_quality_score
    )
    SELECT 
        NEW.id, NEW.user_id, NEW.submitted_at,
        (SELECT answer_value FROM questionnaire_answers 
         WHERE response_id = NEW.id AND question_id = 'age-range'),
        (SELECT answer_value FROM questionnaire_answers 
         WHERE response_id = NEW.id AND question_id = 'education-level'),
        (SELECT answer_value FROM questionnaire_answers 
         WHERE response_id = NEW.id AND question_id = 'current-status'),
        1.0;
END;
```

### **定时同步 (批量)**
```sql
-- 统计数据同步存储过程
CREATE PROCEDURE sync_aggregated_stats()
BEGIN
    -- 1. 年龄分布统计
    INSERT OR REPLACE INTO aggregated_stats (
        dimension, dimension_value, count, percentage, 
        period_type, period_date, sample_size
    )
    SELECT 
        'age' as dimension,
        age_range as dimension_value,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses), 2) as percentage,
        'daily' as period_type,
        date('now') as period_date,
        (SELECT COUNT(*) FROM analytics_responses) as sample_size
    FROM analytics_responses
    WHERE date(submitted_at) = date('now')
    GROUP BY age_range;
    
    -- 2. 就业状态统计
    INSERT OR REPLACE INTO aggregated_stats (
        dimension, dimension_value, count, percentage, 
        period_type, period_date, sample_size
    )
    SELECT 
        'employment' as dimension,
        employment_status as dimension_value,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses), 2) as percentage,
        'daily' as period_type,
        date('now') as period_date,
        (SELECT COUNT(*) FROM analytics_responses) as sample_size
    FROM analytics_responses
    WHERE date(submitted_at) = date('now')
    GROUP BY employment_status;
END;
```

## 📊 **查询优化策略**

### **查询路由规则**
```typescript
interface QueryRouter {
  // 实时数据查询 → 主表
  realtime: string[];
  
  // 统计查询 → 缓存表
  analytics: string[];
  
  // 管理查询 → 专用表
  admin: string[];
  
  // 导出查询 → 专用表
  export: string[];
}

const QUERY_ROUTING: QueryRouter = {
  realtime: ['/api/questionnaire/submit', '/api/user/register'],
  analytics: ['/api/analytics/*', '/api/visualization/*'],
  admin: ['/api/admin/*', '/api/reports/*'],
  export: ['/api/export/*', '/api/download/*']
};
```

### **缓存失效策略**
```sql
-- 智能缓存失效
CREATE TABLE cache_invalidation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_table TEXT NOT NULL,
    trigger_table TEXT NOT NULL,
    trigger_condition TEXT, -- SQL条件
    invalidation_delay INTEGER DEFAULT 0, -- 延迟秒数
    batch_size INTEGER DEFAULT 100
);

-- 示例规则
INSERT INTO cache_invalidation_rules VALUES
(1, 'visualization_cache', 'questionnaire_responses', 'COUNT(*) % 10 = 0', 300, 100),
(2, 'realtime_stats', 'analytics_responses', 'COUNT(*) % 5 = 0', 60, 50),
(3, 'aggregated_stats', 'analytics_responses', 'COUNT(*) % 50 = 0', 600, 200);
```

## 🎯 **预期性能提升**

### **写入性能**
- 主表写入延迟: 50ms → 10ms (80%提升)
- 并发写入能力: 100/s → 500/s (400%提升)
- 写入锁定时间: 100ms → 20ms (80%减少)

### **查询性能**
- 可视化页面响应: 2000ms → 200ms (90%提升)
- 统计查询响应: 5000ms → 100ms (98%提升)
- 复杂聚合查询: 10000ms → 500ms (95%提升)

### **系统容量**
- 支持数据量: 1万 → 100万 (100倍提升)
- 并发用户数: 100 → 1000 (10倍提升)
- 存储效率: 提升30% (通过数据预处理)

## 📋 **实施计划**

### **第1阶段：基础架构 (1周)**
1. 创建业务专用表
2. 实现基础同步机制
3. 建立监控体系

### **第2阶段：统计优化 (1周)**
1. 创建统计缓存表
2. 实现智能同步策略
3. 优化查询路由

### **第3阶段：性能调优 (1周)**
1. 创建视图缓存表
2. 实现缓存失效机制
3. 性能测试和调优

### **第4阶段：监控完善 (3天)**
1. 完善监控指标
2. 建立告警机制
3. 文档和培训

---

**🎯 这个方案将彻底解决数据库性能瓶颈，为项目的长期发展奠定坚实基础！**
