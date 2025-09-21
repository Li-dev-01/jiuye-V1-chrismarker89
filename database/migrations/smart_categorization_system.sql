-- 智能分类和标签系统数据库结构调整
-- 确保数据库字段与前端新功能完全匹配

-- ============================================
-- 1. 心声表 (heart_voices) 结构优化
-- ============================================

-- 检查并添加缺失的字段
ALTER TABLE heart_voices 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other',
ADD COLUMN IF NOT EXISTS tags JSON DEFAULT '[]',
ADD COLUMN IF NOT EXISTS emotion_score INTEGER DEFAULT 3 CHECK (emotion_score >= 1 AND emotion_score <= 5),
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 创建心声分类枚举约束
ALTER TABLE heart_voices 
DROP CONSTRAINT IF EXISTS heart_voices_category_check;

ALTER TABLE heart_voices 
ADD CONSTRAINT heart_voices_category_check 
CHECK (category IN ('gratitude', 'suggestion', 'reflection', 'experience', 'other'));

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_heart_voices_category ON heart_voices(category);
CREATE INDEX IF NOT EXISTS idx_heart_voices_like_count ON heart_voices(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_heart_voices_emotion_score ON heart_voices(emotion_score);
CREATE INDEX IF NOT EXISTS idx_heart_voices_status ON heart_voices(status);
CREATE INDEX IF NOT EXISTS idx_heart_voices_created_at ON heart_voices(created_at DESC);

-- 为标签字段创建GIN索引（支持JSON查询）
CREATE INDEX IF NOT EXISTS idx_heart_voices_tags ON heart_voices USING GIN (tags);

-- ============================================
-- 2. 故事表 (stories) 结构优化
-- ============================================

-- 检查并添加缺失的字段
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'job_search',
ADD COLUMN IF NOT EXISTS tags JSON DEFAULT '[]',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 创建故事分类枚举约束
ALTER TABLE stories 
DROP CONSTRAINT IF EXISTS stories_category_check;

ALTER TABLE stories 
ADD CONSTRAINT stories_category_check 
CHECK (category IN ('job_search', 'interview', 'career_change', 'internship', 'workplace', 'growth', 'advice'));

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_like_count ON stories(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- 为标签字段创建GIN索引
CREATE INDEX IF NOT EXISTS idx_stories_tags ON stories USING GIN (tags);

-- ============================================
-- 3. 创建标签统计表
-- ============================================

CREATE TABLE IF NOT EXISTS tag_statistics (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL UNIQUE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('voice', 'story')),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建标签统计索引
CREATE INDEX IF NOT EXISTS idx_tag_statistics_content_type ON tag_statistics(content_type);
CREATE INDEX IF NOT EXISTS idx_tag_statistics_usage_count ON tag_statistics(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_statistics_tag_name ON tag_statistics(tag_name);

-- ============================================
-- 4. 创建分类统计表
-- ============================================

CREATE TABLE IF NOT EXISTS category_statistics (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('voice', 'story')),
    content_count INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    average_emotion_score DECIMAL(3,2) DEFAULT 0,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(category_name, content_type)
);

-- 创建分类统计索引
CREATE INDEX IF NOT EXISTS idx_category_statistics_content_type ON category_statistics(content_type);
CREATE INDEX IF NOT EXISTS idx_category_statistics_content_count ON category_statistics(content_count DESC);

-- ============================================
-- 5. 创建用户行为统计表
-- ============================================

CREATE TABLE IF NOT EXISTS user_content_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('voice', 'story')),
    content_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'dislike', 'view', 'share')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, content_type, content_id, interaction_type)
);

-- 创建用户行为索引
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_content ON user_content_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_content_interactions(interaction_type);

-- ============================================
-- 6. 创建触发器自动更新统计数据
-- ============================================

-- 心声标签统计更新函数
CREATE OR REPLACE FUNCTION update_voice_tag_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- 处理新增或更新的标签
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- 更新标签使用统计
        INSERT INTO tag_statistics (tag_name, content_type, usage_count, last_used_at)
        SELECT 
            tag_value,
            'voice',
            1,
            CURRENT_TIMESTAMP
        FROM json_array_elements_text(NEW.tags) AS tag_value
        ON CONFLICT (tag_name) 
        DO UPDATE SET 
            usage_count = tag_statistics.usage_count + 1,
            last_used_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- 处理删除的标签
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        -- 减少旧标签的使用统计
        UPDATE tag_statistics 
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE tag_name = ANY(
            SELECT json_array_elements_text(COALESCE(OLD.tags, '[]'::json))
        ) AND content_type = 'voice';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 创建心声标签统计触发器
DROP TRIGGER IF EXISTS trigger_update_voice_tag_statistics ON heart_voices;
CREATE TRIGGER trigger_update_voice_tag_statistics
    AFTER INSERT OR UPDATE OR DELETE ON heart_voices
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_tag_statistics();

-- 故事标签统计更新函数
CREATE OR REPLACE FUNCTION update_story_tag_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- 处理新增或更新的标签
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO tag_statistics (tag_name, content_type, usage_count, last_used_at)
        SELECT 
            tag_value,
            'story',
            1,
            CURRENT_TIMESTAMP
        FROM json_array_elements_text(NEW.tags) AS tag_value
        ON CONFLICT (tag_name) 
        DO UPDATE SET 
            usage_count = tag_statistics.usage_count + 1,
            last_used_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- 处理删除的标签
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        UPDATE tag_statistics 
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE tag_name = ANY(
            SELECT json_array_elements_text(COALESCE(OLD.tags, '[]'::json))
        ) AND content_type = 'story';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 创建故事标签统计触发器
DROP TRIGGER IF EXISTS trigger_update_story_tag_statistics ON stories;
CREATE TRIGGER trigger_update_story_tag_statistics
    AFTER INSERT OR UPDATE OR DELETE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_story_tag_statistics();

-- ============================================
-- 7. 分类统计更新函数
-- ============================================

-- 更新心声分类统计
CREATE OR REPLACE FUNCTION update_voice_category_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新分类统计
    INSERT INTO category_statistics (
        category_name, 
        content_type, 
        content_count, 
        total_likes, 
        average_emotion_score,
        last_updated_at
    )
    SELECT 
        NEW.category,
        'voice',
        1,
        NEW.like_count,
        NEW.emotion_score,
        CURRENT_TIMESTAMP
    ON CONFLICT (category_name, content_type)
    DO UPDATE SET
        content_count = category_statistics.content_count + 1,
        total_likes = category_statistics.total_likes + NEW.like_count,
        average_emotion_score = (
            category_statistics.average_emotion_score * (category_statistics.content_count - 1) + NEW.emotion_score
        ) / category_statistics.content_count,
        last_updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建心声分类统计触发器
DROP TRIGGER IF EXISTS trigger_update_voice_category_statistics ON heart_voices;
CREATE TRIGGER trigger_update_voice_category_statistics
    AFTER INSERT ON heart_voices
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_category_statistics();

-- ============================================
-- 8. 清理现有不匹配数据的函数
-- ============================================

-- 清理心声数据函数
CREATE OR REPLACE FUNCTION clean_heart_voices_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除所有现有心声数据
    DELETE FROM heart_voices;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 重置序列
    ALTER SEQUENCE heart_voices_id_seq RESTART WITH 1;
    
    -- 清理相关统计数据
    DELETE FROM tag_statistics WHERE content_type = 'voice';
    DELETE FROM category_statistics WHERE content_type = 'voice';
    DELETE FROM user_content_interactions WHERE content_type = 'voice';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 清理故事数据函数
CREATE OR REPLACE FUNCTION clean_stories_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除所有现有故事数据
    DELETE FROM stories;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 重置序列
    ALTER SEQUENCE stories_id_seq RESTART WITH 1;
    
    -- 清理相关统计数据
    DELETE FROM tag_statistics WHERE content_type = 'story';
    DELETE FROM category_statistics WHERE content_type = 'story';
    DELETE FROM user_content_interactions WHERE content_type = 'story';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. 数据验证和约束
-- ============================================

-- 确保JSON标签格式正确
ALTER TABLE heart_voices 
ADD CONSTRAINT heart_voices_tags_format 
CHECK (json_typeof(tags) = 'array');

ALTER TABLE stories 
ADD CONSTRAINT stories_tags_format 
CHECK (json_typeof(tags) = 'array');

-- 确保数值字段非负
ALTER TABLE heart_voices 
ADD CONSTRAINT heart_voices_counts_positive 
CHECK (like_count >= 0 AND dislike_count >= 0 AND view_count >= 0);

ALTER TABLE stories 
ADD CONSTRAINT stories_counts_positive 
CHECK (like_count >= 0 AND dislike_count >= 0 AND view_count >= 0 AND comment_count >= 0);

-- ============================================
-- 执行完成提示
-- ============================================

-- 创建执行日志
INSERT INTO system_logs (
    level, 
    message, 
    details, 
    created_at
) VALUES (
    'INFO',
    'Smart categorization system database migration completed',
    'All tables, indexes, triggers, and constraints have been created successfully',
    CURRENT_TIMESTAMP
);

-- 显示执行结果
SELECT 
    'Smart Categorization System Migration Completed' as status,
    CURRENT_TIMESTAMP as completed_at,
    'Ready for intelligent data generation' as next_step;
