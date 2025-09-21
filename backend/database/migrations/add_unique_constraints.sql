-- 添加唯一性约束防止重复数据
-- 创建时间: 2025-07-31

-- 为心声表添加内容唯一性约束
-- 注意：这会防止完全相同的心声内容被重复插入

-- 1. 首先检查并删除现有的重复数据
-- 保留每组重复数据中ID最小的记录
DELETE v1 FROM valid_heart_voices v1
INNER JOIN valid_heart_voices v2 
WHERE v1.id > v2.id 
AND v1.content = v2.content 
AND v1.category = v2.category;

-- 2. 为有效心声表添加内容唯一性约束
-- 使用内容的哈希值来创建唯一索引，避免内容过长的问题
ALTER TABLE valid_heart_voices 
ADD COLUMN content_hash VARCHAR(64) GENERATED ALWAYS AS (SHA2(CONCAT(content, '|', category), 256)) STORED;

-- 3. 创建唯一索引
CREATE UNIQUE INDEX idx_unique_heart_voice_content 
ON valid_heart_voices (content_hash);

-- 4. 清理原始心声表中的重复数据
DELETE r1 FROM raw_heart_voices r1
INNER JOIN raw_heart_voices r2
WHERE r1.id > r2.id
AND r1.content = r2.content
AND r1.category = r2.category;

-- 5. 为原始心声表也添加相同的约束
ALTER TABLE raw_heart_voices
ADD COLUMN content_hash VARCHAR(64) GENERATED ALWAYS AS (SHA2(CONCAT(content, '|', category), 256)) STORED;

CREATE UNIQUE INDEX idx_unique_raw_heart_voice_content
ON raw_heart_voices (content_hash);

-- 6. 为故事表添加类似的约束
DELETE s1 FROM valid_stories s1
INNER JOIN valid_stories s2 
WHERE s1.id > s2.id 
AND s1.title = s2.title 
AND s1.content = s2.content;

ALTER TABLE valid_stories 
ADD COLUMN content_hash VARCHAR(64) GENERATED ALWAYS AS (SHA2(CONCAT(title, '|', content), 256)) STORED;

CREATE UNIQUE INDEX idx_unique_story_content 
ON valid_stories (content_hash);

ALTER TABLE raw_story_submissions 
ADD COLUMN content_hash VARCHAR(64) GENERATED ALWAYS AS (SHA2(CONCAT(title, '|', content), 256)) STORED;

CREATE UNIQUE INDEX idx_unique_raw_story_content 
ON raw_story_submissions (content_hash);

-- 完成
SELECT 'Unique constraints added successfully!' as status;
