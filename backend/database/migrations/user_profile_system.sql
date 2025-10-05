-- ============================================
-- 用户画像系统数据库迁移脚本
-- 版本: v1.0
-- 创建日期: 2025-10-05
-- 适用于: Cloudflare D1 (SQLite)
-- ============================================

-- ============================================
-- 1. 问卷标签统计表
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_tag_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 问卷关联
  questionnaire_id TEXT NOT NULL,           -- 问卷ID（如：questionnaire-v2-2024）
  
  -- 标签信息
  tag_key TEXT NOT NULL,                    -- 标签键（如：young-graduate-job-seeker）
  tag_name TEXT NOT NULL,                   -- 标签名（如：应届求职者）
  tag_category TEXT,                        -- 标签分类（如：年龄段、就业状态、心态）
  
  -- 统计数据
  count INTEGER DEFAULT 0,                  -- 该标签出现次数
  percentage REAL DEFAULT 0,                -- 占比（百分比）
  
  -- 时间戳
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 唯一约束
  UNIQUE(questionnaire_id, tag_key)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tag_statistics_questionnaire 
  ON questionnaire_tag_statistics(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_tag_statistics_category 
  ON questionnaire_tag_statistics(tag_category);
CREATE INDEX IF NOT EXISTS idx_tag_statistics_count 
  ON questionnaire_tag_statistics(count DESC);

-- ============================================
-- 2. 问卷情绪统计表
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_emotion_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 问卷关联
  questionnaire_id TEXT NOT NULL,
  
  -- 情绪类型
  emotion_type TEXT NOT NULL,               -- positive/neutral/negative
  
  -- 统计数据
  count INTEGER DEFAULT 0,                  -- 该情绪类型出现次数
  percentage REAL DEFAULT 0,                -- 占比（百分比）
  
  -- 时间戳
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 唯一约束
  UNIQUE(questionnaire_id, emotion_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_emotion_statistics_questionnaire 
  ON questionnaire_emotion_statistics(questionnaire_id);

-- ============================================
-- 3. 励志名言库表
-- ============================================
CREATE TABLE IF NOT EXISTS motivational_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 名言内容
  quote_text TEXT NOT NULL,                 -- 名言内容
  author TEXT,                              -- 作者（可选）
  
  -- 分类
  category TEXT NOT NULL,                   -- 分类（学习成长、求职励志、经济励志、心态调节等）
  
  -- 目标定向
  emotion_target TEXT,                      -- 目标情绪（negative/neutral/positive/all）
  tag_keys TEXT,                            -- 关联标签（JSON数组，如：["job-seeking", "anxious"]）
  
  -- 统计
  usage_count INTEGER DEFAULT 0,            -- 使用次数
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,           -- 是否启用
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_quotes_category 
  ON motivational_quotes(category);
CREATE INDEX IF NOT EXISTS idx_quotes_emotion_target 
  ON motivational_quotes(emotion_target);
CREATE INDEX IF NOT EXISTS idx_quotes_active 
  ON motivational_quotes(is_active);

-- ============================================
-- 4. 初始化励志名言数据
-- ============================================

-- 求职励志类
INSERT INTO motivational_quotes (quote_text, author, category, emotion_target, tag_keys) VALUES
('机会总是留给有准备的人', '路易·巴斯德', '求职励志', 'negative', '["job-seeking", "anxious"]'),
('每一次拒绝都是离成功更近一步', NULL, '求职励志', 'negative', '["job-seeking", "young-graduate-job-seeker"]'),
('求职路上的每一次尝试，都是在为成功铺路', NULL, '求职励志', 'negative', '["job-seeking"]'),
('不要因为一时的失败而放弃，坚持就是胜利', NULL, '求职励志', 'negative', '["job-seeking", "anxious"]'),
('你的努力终将被看见，保持信心', NULL, '求职励志', 'negative', '["job-seeking"]');

-- 学习成长类
INSERT INTO motivational_quotes (quote_text, author, category, emotion_target, tag_keys) VALUES
('知识就是力量，你已经拥有了最好的武器', '培根', '学习成长', 'neutral', '["education-bachelor", "education-master"]'),
('优秀是一种习惯，你正在路上', '亚里士多德', '学习成长', 'positive', '["education-master", "confident"]'),
('学而时习之，不亦说乎', '孔子', '学习成长', 'neutral', '["education-bachelor"]'),
('书山有路勤为径，学海无涯苦作舟', NULL, '学习成长', 'neutral', '["education-bachelor", "education-master"]');

-- 经济励志类
INSERT INTO motivational_quotes (quote_text, author, category, emotion_target, tag_keys) VALUES
('债务是暂时的，能力是永久的', NULL, '经济励志', 'negative', '["has-debt", "high-economic-pressure"]'),
('今天的困难，是明天的财富', NULL, '经济励志', 'negative', '["high-economic-pressure"]'),
('经济压力只是暂时的，你的价值是永恒的', NULL, '经济励志', 'negative', '["has-debt", "high-economic-pressure"]'),
('理财从今天开始，未来会感谢现在的自己', NULL, '经济励志', 'negative', '["has-debt"]');

-- 心态调节类
INSERT INTO motivational_quotes (quote_text, author, category, emotion_target, tag_keys) VALUES
('保持乐观，世界因你而美好', NULL, '心态调节', 'positive', '["confident"]'),
('阳光总在风雨后', NULL, '心态调节', 'negative', '["anxious"]'),
('迷茫是成长的必经之路，勇敢走下去', NULL, '心态调节', 'negative', '["anxious", "job-seeking"]'),
('山重水复疑无路，柳暗花明又一村', '陆游', '心态调节', 'negative', '["anxious"]'),
('焦虑是正常的，但不要让它阻止你前进', NULL, '心态调节', 'negative', '["anxious", "high-economic-pressure"]'),
('每一天都是新的开始', NULL, '心态调节', 'neutral', NULL);

-- 青春励志类
INSERT INTO motivational_quotes (quote_text, author, category, emotion_target, tag_keys) VALUES
('青春是用来奋斗的，不是用来挥霍的', NULL, '青春励志', 'neutral', '["age-18-22", "age-23-25"]'),
('趁年轻，去做你想做的事', NULL, '青春励志', 'positive', '["age-18-22", "age-23-25"]'),
('年轻就是资本，勇敢去闯', NULL, '青春励志', 'neutral', '["age-18-22"]');

-- 职场励志类
INSERT INTO motivational_quotes (quote_text, author, category, emotion_target, tag_keys) VALUES
('成功的路上并不拥挤，因为坚持的人不多', NULL, '职场励志', 'negative', '["employed", "high-economic-pressure"]'),
('做自己喜欢的事，让喜欢的事有价值', NULL, '职场励志', 'positive', '["employed", "confident"]'),
('职场如战场，但你不是孤军奋战', NULL, '职场励志', 'negative', '["employed", "anxious"]');

-- 通用励志类
INSERT INTO motivational_quotes (quote_text, author, category, emotion_target, tag_keys) VALUES
('相信自己，你比想象中更强大', NULL, '通用励志', 'negative', NULL),
('困难只是暂时的，坚持就会看到希望', NULL, '通用励志', 'negative', NULL),
('你的未来，由你自己创造', NULL, '通用励志', 'neutral', NULL),
('不要害怕失败，失败是成功之母', NULL, '通用励志', 'negative', NULL),
('保持热爱，奔赴山海', NULL, '通用励志', 'positive', NULL);

-- ============================================
-- 5. 数据验证查询
-- ============================================

-- 查看励志名言统计
-- SELECT category, COUNT(*) as count 
-- FROM motivational_quotes 
-- GROUP BY category;

-- 查看情绪目标分布
-- SELECT emotion_target, COUNT(*) as count 
-- FROM motivational_quotes 
-- GROUP BY emotion_target;

-- ============================================
-- 迁移完成
-- ============================================

