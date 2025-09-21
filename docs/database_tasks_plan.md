# 数据库任务计划 - 用户系统与三层数据架构

## 📋 **任务概述**

基于项目需求，需要实现完整的用户系统和三层数据架构（A类原始表 → 审核机制 → B类有效表 → C类功能静态表），支持全匿名用户和半匿名用户的权限管理。

## 🎯 **核心需求**

### **用户角色定义**
1. **全匿名用户 (Anonymous)**
   - 权限：参与问卷、浏览内容
   - 限制：无下载权限、不能发布问卷心声和故事

2. **半匿名用户 (Semi-Anonymous)**
   - 注册方式：A+B方式注册登录（全局权限）
   - 权限：全匿名用户权限 + 内容关联 + PNG卡片下载权限
   - 功能：问卷心声和故事墙内容转PNG下载/分享

### **数据架构要求**
- **A类表**: 原始数据表（接收所有用户提交）
- **审核机制**: 规则、AI、人工审核
- **B类表**: 有效数据表（审核通过的清洁数据）
- **C类表**: 功能静态表（针对不同业务需求的汇总表）

---

## 🗄️ **数据库设计任务**

### **阶段1: 用户系统核心表** (优先级: 高)

#### **任务1.1: 用户主表设计**
```sql
-- 文件: backend/database/01_users_core_tables.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) NOT NULL UNIQUE COMMENT '用户UUID',
    
    -- 用户类型
    user_type ENUM('anonymous', 'semi_anonymous', 'reviewer', 'admin') NOT NULL DEFAULT 'anonymous',
    
    -- A+B身份验证（半匿名用户）
    identity_a VARCHAR(11) COMMENT 'A值（11位数字）',
    identity_b VARCHAR(6) COMMENT 'B值（4或6位数字）',
    identity_hash VARCHAR(64) COMMENT 'A+B组合哈希',
    
    -- 基础信息
    username VARCHAR(50) COMMENT '用户名',
    nickname VARCHAR(100) COMMENT '昵称',
    
    -- 状态信息
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    
    -- 权限配置
    permissions JSON COMMENT '用户权限列表',
    
    -- 时间信息
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    
    -- 追踪信息
    registration_ip VARCHAR(45) COMMENT '注册IP',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    
    -- 索引
    INDEX idx_user_type (user_type),
    INDEX idx_identity_hash (identity_hash),
    INDEX idx_status (status),
    UNIQUE INDEX idx_ab_identity (identity_a, identity_b)
) COMMENT='用户主表';
```

#### **任务1.2: 匿名会话表设计**
```sql
-- 匿名用户会话管理
CREATE TABLE anonymous_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_uuid CHAR(36) NOT NULL UNIQUE,
    user_id BIGINT COMMENT '关联用户ID',
    
    -- 会话信息
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_fingerprint VARCHAR(255),
    
    -- 追踪信息
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    
    -- 状态信息
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    
    -- 时间信息
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT='匿名用户会话表';
```

### **阶段2: A类表（原始数据表）** (优先级: 高)

#### **任务2.1: 原始问卷数据表**
```sql
-- 文件: backend/database/02_raw_data_tables.sql
CREATE TABLE raw_questionnaire_responses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    data_uuid CHAR(36) NOT NULL UNIQUE,
    
    -- 用户关联
    user_id BIGINT COMMENT '用户ID',
    session_uuid CHAR(36) COMMENT '匿名会话UUID',
    
    -- 提交信息
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 问卷数据
    questionnaire_data JSON NOT NULL,
    completion_status ENUM('partial', 'completed') NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    
    -- 质量指标
    device_type VARCHAR(50),
    quality_indicators JSON,
    
    -- 原始状态
    raw_status ENUM('pending', 'processing', 'processed', 'rejected') DEFAULT 'pending',
    processing_attempts INT DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_uuid) REFERENCES anonymous_sessions(session_uuid) ON DELETE SET NULL
) COMMENT='原始问卷数据表';
```

#### **任务2.2: 原始心声数据表**
```sql
CREATE TABLE raw_heart_voices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    data_uuid CHAR(36) NOT NULL UNIQUE,
    
    -- 用户关联
    user_id BIGINT,
    session_uuid CHAR(36),
    response_data_uuid CHAR(36) COMMENT '关联问卷UUID',
    
    -- 内容信息
    content TEXT NOT NULL,
    emotion_tags JSON,
    is_anonymous BOOLEAN DEFAULT TRUE,
    
    -- 提交信息
    ip_address VARCHAR(45) NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 原始状态
    raw_status ENUM('pending', 'processing', 'processed', 'rejected') DEFAULT 'pending',
    content_length INT GENERATED ALWAYS AS (CHAR_LENGTH(content)) STORED,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_uuid) REFERENCES anonymous_sessions(session_uuid) ON DELETE SET NULL
) COMMENT='原始心声数据表';
```

#### **任务2.3: 原始故事数据表**
```sql
CREATE TABLE raw_story_submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    data_uuid CHAR(36) NOT NULL UNIQUE,
    
    -- 用户关联
    user_id BIGINT,
    session_uuid CHAR(36),
    response_data_uuid CHAR(36),
    
    -- 故事内容
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags JSON,
    category VARCHAR(100),
    
    -- 作者信息
    author_name VARCHAR(100),
    is_anonymous BOOLEAN DEFAULT TRUE,
    
    -- 提交信息
    ip_address VARCHAR(45) NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 原始状态
    raw_status ENUM('pending', 'processing', 'processed', 'rejected') DEFAULT 'pending',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_uuid) REFERENCES anonymous_sessions(session_uuid) ON DELETE SET NULL
) COMMENT='原始故事数据表';
```

### **阶段3: 审核机制表** (优先级: 中)

#### **任务3.1: 审核规则配置表**
```sql
-- 文件: backend/database/03_audit_mechanism_tables.sql
CREATE TABLE audit_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    rule_type ENUM('questionnaire', 'heart_voice', 'story', 'general') NOT NULL,
    rule_category ENUM('duplicate', 'quality', 'content', 'spam', 'security') NOT NULL,
    rule_config JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 100,
    execution_type ENUM('automatic', 'ai_assisted', 'manual_required') NOT NULL,
    threshold_score DECIMAL(5,2) DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='审核规则配置表';
```

#### **任务3.2: 审核记录表**
```sql
CREATE TABLE audit_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_table ENUM('raw_questionnaire_responses', 'raw_heart_voices', 'raw_story_submissions') NOT NULL,
    source_id BIGINT NOT NULL,
    audit_type ENUM('automatic', 'ai_review', 'manual_review') NOT NULL,
    audit_result ENUM('pending', 'approved', 'rejected', 'flagged') NOT NULL,
    confidence_score DECIMAL(5,2),
    applied_rules JSON,
    audit_details JSON,
    rejection_reasons JSON,
    auditor_type ENUM('system', 'ai', 'human') NOT NULL,
    auditor_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    
    UNIQUE INDEX idx_source (source_table, source_id)
) COMMENT='审核记录表';
```

### **阶段4: B类表（有效数据表）** (优先级: 高)

#### **任务4.1: 有效问卷数据表**
```sql
-- 文件: backend/database/04_valid_data_tables.sql
CREATE TABLE valid_questionnaire_responses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    raw_id BIGINT NOT NULL,
    data_uuid CHAR(36) NOT NULL UNIQUE,
    
    -- 用户关联
    user_id BIGINT,
    session_uuid CHAR(36),
    
    -- 基础信息
    ip_hash VARCHAR(64) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- 时间信息
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    total_time_seconds INT,
    
    -- 质量信息
    device_type VARCHAR(50),
    quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- 审核信息
    audit_status ENUM('approved', 'flagged') NOT NULL DEFAULT 'approved',
    audit_score DECIMAL(5,2),
    approved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (raw_id) REFERENCES raw_questionnaire_responses(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT='有效问卷数据表';
```

### **阶段5: C类表（功能静态表）** (优先级: 中)

#### **任务5.1: 数据可视化汇总表**
```sql
-- 文件: backend/database/05_functional_static_tables.sql
-- 继承之前设计的 analytics_summary, analytics_distribution, analytics_cross 表
-- 基于 valid_* 表进行汇总计算
```

#### **任务5.2: 用户内容权限表**
```sql
CREATE TABLE user_content_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content_type ENUM('questionnaire', 'heart_voice', 'story') NOT NULL,
    content_data_uuid CHAR(36) NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT FALSE, -- 重要：下载权限控制
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_user_content (user_id, content_type, content_data_uuid)
) COMMENT='用户内容权限表';
```

#### **任务5.3: PNG下载记录表**
```sql
CREATE TABLE png_download_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content_type ENUM('heart_voice_card', 'story_card') NOT NULL,
    content_id BIGINT NOT NULL,
    download_type ENUM('png', 'share_link') NOT NULL,
    file_path VARCHAR(500),
    download_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_downloads (user_id, download_at),
    INDEX idx_content (content_type, content_id)
) COMMENT='PNG下载记录表';
```

---

## 🔄 **实施计划**

### **第一阶段: 核心用户系统** (1-2天)
- [ ] 创建用户主表和会话表
- [ ] 实现A+B身份验证逻辑
- [ ] 配置用户权限系统
- [ ] 测试匿名和半匿名用户流程

### **第二阶段: 原始数据表** (1天)
- [ ] 创建A类表（原始数据表）
- [ ] 实现数据UUID生成机制
- [ ] 配置用户关联逻辑
- [ ] 测试数据接收流程

### **第三阶段: 审核机制** (2-3天)
- [ ] 创建审核规则和记录表
- [ ] 实现自动审核规则
- [ ] 配置AI审核接口（预留）
- [ ] 实现人工审核工作台

### **第四阶段: 有效数据表** (1天)
- [ ] 创建B类表（有效数据表）
- [ ] 实现审核通过数据迁移
- [ ] 配置数据质量评分
- [ ] 测试数据流转

### **第五阶段: 功能静态表** (1-2天)
- [ ] 创建C类表（功能静态表）
- [ ] 实现数据同步机制
- [ ] 配置权限控制表
- [ ] 实现PNG下载功能

---

## 🎯 **当前项目状态分析**

### **✅ 已实现功能**
1. **基础用户系统**: 有基本的用户注册登录
2. **权限框架**: 有完整的权限定义和检查机制
3. **A+B登录**: 有半匿名用户的A+B身份验证
4. **数据导出**: 有基础的CSV/JSON导出功能

### **❌ 缺失功能**
1. **PNG卡片下载**: 问卷心声和故事墙的PNG卡片生成和下载
2. **三层数据架构**: 缺少A→B→C的完整数据流
3. **审核机制**: 缺少完整的审核流程
4. **用户内容关联**: 缺少用户与内容的权限关联

### **🔧 需要补充实现**

#### **1. PNG卡片下载功能**
```typescript
// 需要实现的功能
interface CardDownloadService {
  generateHeartVoiceCard(voiceId: string): Promise<string>; // 生成心声卡片PNG
  generateStoryCard(storyId: string): Promise<string>;      // 生成故事卡片PNG
  downloadCard(cardUrl: string, filename: string): void;    // 下载卡片
  shareCard(cardUrl: string): Promise<string>;              // 分享卡片
}
```

#### **2. 用户权限验证**
```typescript
// 需要完善的权限检查
const canDownloadCard = (user: User, contentType: string): boolean => {
  // 全匿名用户：无下载权限
  if (user.user_type === 'anonymous') return false;
  
  // 半匿名用户：有下载权限
  if (user.user_type === 'semi_anonymous') return true;
  
  return false;
};
```

---

## 📋 **下一步行动**

### **立即执行**
1. **创建用户系统数据库表**
2. **实现PNG卡片下载功能**
3. **完善用户权限验证**

### **后续规划**
1. **实现三层数据架构**
2. **构建审核机制**
3. **优化性能和用户体验**

---

**总结**: 项目已有良好的基础架构，主要需要补充PNG下载功能和完善三层数据架构。建议优先实现用户最关心的PNG卡片下载功能。
