-- 心声功能数据库初始化脚本 (SQLite)
-- 创建心声相关的表和数据

-- 创建原始心声表
CREATE TABLE IF NOT EXISTS raw_heart_voices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    emotion_score INTEGER CHECK (emotion_score >= 1 AND emotion_score <= 5),
    tags TEXT, -- JSON as TEXT
    is_anonymous BOOLEAN DEFAULT 1,
    questionnaire_id TEXT,
    ip_address TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_status TEXT DEFAULT 'pending' CHECK (raw_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 创建有效心声表
CREATE TABLE IF NOT EXISTS valid_heart_voices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id INTEGER NOT NULL,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    emotion_score INTEGER CHECK (emotion_score >= 1 AND emotion_score <= 5),
    tags TEXT, -- JSON as TEXT
    is_anonymous BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    author_name TEXT DEFAULT '匿名用户',
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_status TEXT DEFAULT 'approved' CHECK (audit_status IN ('approved', 'rejected', 'pending')),
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    png_status TEXT DEFAULT 'none' CHECK (png_status IN ('none', 'pending', 'completed', 'failed')),
    FOREIGN KEY (raw_id) REFERENCES raw_heart_voices(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_raw_heart_voices_user ON raw_heart_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_heart_voices_status ON raw_heart_voices(raw_status);
CREATE INDEX IF NOT EXISTS idx_raw_heart_voices_submitted ON raw_heart_voices(submitted_at);

CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_user ON valid_heart_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_status ON valid_heart_voices(audit_status);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_approved ON valid_heart_voices(approved_at);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_category ON valid_heart_voices(category);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_featured ON valid_heart_voices(is_featured);

-- 插入测试数据
INSERT OR REPLACE INTO raw_heart_voices (
    id, data_uuid, user_id, content, category, emotion_score, tags, is_anonymous, submitted_at, raw_status
) VALUES
(1, 'raw-voice-001', 'user-001', '找工作真的太难了，投了100多份简历才收到几个面试邀请。希望学弟学妹们早做准备！', 'experience', 3, '["求职", "经验分享"]', 1, '2024-01-15 20:00:00', 'completed'),
(2, 'raw-voice-002', 'user-002', '感谢学校的就业指导中心，老师们给了我很多帮助，最终拿到了心仪的offer！', 'gratitude', 5, '["感谢", "就业指导"]', 1, '2024-01-16 21:00:00', 'completed'),
(3, 'raw-voice-003', 'user-003', '面试时要保持自信，即使被拒绝也不要气馁。每次面试都是学习的机会。', 'advice', 4, '["面试技巧", "心态调整"]', 1, '2024-01-17 19:30:00', 'completed'),
(4, 'raw-voice-004', 'user-004', '实习经历真的很重要，建议大家在校期间多参加实习，积累工作经验。', 'advice', 4, '["实习", "经验积累"]', 1, '2024-01-18 22:15:00', 'completed'),
(5, 'raw-voice-005', 'user-005', '虽然就业压力很大，但相信只要努力就一定会有收获。加油！', 'encouragement', 4, '["鼓励", "正能量"]', 1, '2024-01-19 18:45:00', 'completed');

INSERT OR REPLACE INTO valid_heart_voices (
    id, raw_id, data_uuid, user_id, content, category, emotion_score, tags, is_anonymous, is_featured, author_name, approved_at, audit_status, like_count, dislike_count, view_count, png_status
) VALUES
(1, 1, 'voice-001', 'user-001', '找工作真的太难了，投了100多份简历才收到几个面试邀请。希望学弟学妹们早做准备！', 'experience', 3, '["求职", "经验分享"]', 1, 0, '匿名用户', '2024-01-15 20:05:00', 'approved', 15, 2, 89, 'none'),
(2, 2, 'voice-002', 'user-002', '感谢学校的就业指导中心，老师们给了我很多帮助，最终拿到了心仪的offer！', 'gratitude', 5, '["感谢", "就业指导"]', 1, 1, '匿名用户', '2024-01-16 21:05:00', 'approved', 28, 0, 156, 'none'),
(3, 3, 'voice-003', 'user-003', '面试时要保持自信，即使被拒绝也不要气馁。每次面试都是学习的机会。', 'advice', 4, '["面试技巧", "心态调整"]', 1, 0, '匿名用户', '2024-01-17 19:35:00', 'approved', 22, 1, 134, 'none'),
(4, 4, 'voice-004', 'user-004', '实习经历真的很重要，建议大家在校期间多参加实习，积累工作经验。', 'advice', 4, '["实习", "经验积累"]', 1, 0, '匿名用户', '2024-01-18 22:20:00', 'approved', 19, 0, 98, 'none'),
(5, 5, 'voice-005', 'user-005', '虽然就业压力很大，但相信只要努力就一定会有收获。加油！', 'encouragement', 4, '["鼓励", "正能量"]', 1, 1, '匿名用户', '2024-01-19 18:50:00', 'approved', 35, 1, 201, 'none');
