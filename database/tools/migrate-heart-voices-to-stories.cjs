#!/usr/bin/env node

/**
 * 数据迁移脚本：将 questionnaire_heart_voices 数据迁移到 valid_stories 表
 * 用于解决前端API调用与数据库表结构不匹配的问题
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class HeartVoicesToStoriesMigrator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'test-data', 'generated');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 生成UUID
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * 生成标题（从内容中提取或生成）
   */
  generateTitle(content, category) {
    // 从内容中提取前30个字符作为标题
    let title = content.substring(0, 30).trim();
    
    // 如果标题太短，根据分类生成默认标题
    if (title.length < 10) {
      const categoryTitles = {
        'employment-feedback': '就业反馈分享',
        'campus-life': '校园生活回忆',
        'career-planning': '职业规划心得',
        'internship-experience': '实习经历分享',
        'interview-experience': '面试经验总结',
        'workplace-adaptation': '职场适应感悟'
      };
      title = categoryTitles[category] || '生活感悟分享';
    }
    
    // 确保标题不以标点符号结尾
    title = title.replace(/[。！？，、；：""''（）【】《》\s]+$/, '');
    
    return title + '...';
  }

  /**
   * 生成迁移SQL
   */
  generateMigrationSQL() {
    const sqlFile = path.join(this.outputDir, 'migrate_heart_voices_to_stories.sql');
    
    let sql = `-- 数据迁移脚本：questionnaire_heart_voices -> valid_stories
-- 生成时间: ${new Date().toISOString()}
-- 目的：解决前端API调用与数据库表结构不匹配问题

-- 1. 首先确保 valid_stories 表存在
CREATE TABLE IF NOT EXISTS valid_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_id INTEGER,
  data_uuid TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT DEFAULT '[]',
  author_name TEXT DEFAULT '匿名用户',
  audit_status TEXT DEFAULT 'approved',
  approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_test_data INTEGER DEFAULT 0,
  test_data_source TEXT,
  test_data_created_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_valid_stories_audit_status ON valid_stories(audit_status);
CREATE INDEX IF NOT EXISTS idx_valid_stories_approved_at ON valid_stories(approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_valid_stories_user_id ON valid_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_valid_stories_category ON valid_stories(category);
CREATE INDEX IF NOT EXISTS idx_valid_stories_test_data ON valid_stories(is_test_data);

-- 3. 清理现有的测试数据（如果存在）
DELETE FROM valid_stories WHERE is_test_data = 1;

-- 4. 从 questionnaire_heart_voices 迁移数据到 valid_stories
INSERT INTO valid_stories (
  data_uuid,
  user_id,
  title,
  content,
  category,
  tags,
  author_name,
  audit_status,
  approved_at,
  like_count,
  dislike_count,
  view_count,
  is_featured,
  published_at,
  is_test_data,
  test_data_source,
  test_data_created_at,
  created_at,
  updated_at
)
SELECT 
  -- 生成UUID作为data_uuid
  CASE 
    WHEN LENGTH(TRIM(COALESCE(qhv.questionnaire_id, ''))) > 0 
    THEN qhv.questionnaire_id || '-' || qhv.id
    ELSE 'story-' || qhv.id
  END as data_uuid,
  
  -- 用户ID
  qhv.user_id,
  
  -- 从内容生成标题
  CASE 
    WHEN LENGTH(TRIM(qhv.content)) > 30 
    THEN SUBSTR(TRIM(qhv.content), 1, 30) || '...'
    ELSE TRIM(qhv.content)
  END as title,
  
  -- 内容
  qhv.content,
  
  -- 分类
  COALESCE(qhv.category, 'general') as category,
  
  -- 标签
  COALESCE(qhv.tags, '[]') as tags,
  
  -- 作者名称
  CASE 
    WHEN qhv.anonymous_nickname IS NOT NULL AND LENGTH(TRIM(qhv.anonymous_nickname)) > 0
    THEN qhv.anonymous_nickname
    ELSE '匿名用户'
  END as author_name,
  
  -- 审核状态
  CASE 
    WHEN qhv.is_approved = 1 THEN 'approved'
    WHEN qhv.status = 'pending' THEN 'pending'
    ELSE 'approved'
  END as audit_status,
  
  -- 审核时间
  COALESCE(qhv.updated_at, qhv.created_at, datetime('now')) as approved_at,
  
  -- 点赞数（随机生成0-50）
  ABS(RANDOM() % 51) as like_count,
  
  -- 踩数（随机生成0-5）
  ABS(RANDOM() % 6) as dislike_count,
  
  -- 浏览数（随机生成0-200）
  ABS(RANDOM() % 201) as view_count,
  
  -- 是否精选（10%概率）
  CASE WHEN ABS(RANDOM() % 10) = 0 THEN 1 ELSE 0 END as is_featured,
  
  -- 发布时间
  COALESCE(qhv.created_at, datetime('now')) as published_at,
  
  -- 测试数据标识
  1 as is_test_data,
  
  -- 测试数据来源
  'heart-voices-migration' as test_data_source,
  
  -- 测试数据创建时间
  datetime('now') as test_data_created_at,
  
  -- 创建和更新时间
  COALESCE(qhv.created_at, datetime('now')) as created_at,
  COALESCE(qhv.updated_at, qhv.created_at, datetime('now')) as updated_at

FROM questionnaire_heart_voices qhv
WHERE qhv.is_public = 1  -- 只迁移公开的故事
  AND LENGTH(TRIM(qhv.content)) > 10  -- 确保内容有意义
ORDER BY qhv.created_at DESC;

-- 5. 验证迁移结果
-- 统计迁移的数据
SELECT 
  'Migration Summary' as info,
  COUNT(*) as migrated_stories_count,
  COUNT(CASE WHEN audit_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_count,
  AVG(like_count) as avg_likes,
  AVG(view_count) as avg_views
FROM valid_stories 
WHERE is_test_data = 1 AND test_data_source = 'heart-voices-migration';

-- 按分类统计
SELECT 
  category,
  COUNT(*) as count,
  AVG(like_count) as avg_likes,
  AVG(view_count) as avg_views
FROM valid_stories 
WHERE is_test_data = 1 AND test_data_source = 'heart-voices-migration'
GROUP BY category
ORDER BY count DESC;

-- 6. 创建内容标签表（如果不存在）
CREATE TABLE IF NOT EXISTS content_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'general',
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. 插入常用标签
INSERT OR IGNORE INTO content_tags (name, category, usage_count) VALUES
('已就业', 'employment_status', 50),
('求职中', 'employment_status', 40),
('继续深造', 'employment_status', 30),
('创业中', 'employment_status', 20),
('待定中', 'employment_status', 15),
('计算机类', 'major_field', 60),
('经济管理', 'major_field', 35),
('工程技术', 'major_field', 30),
('文科类', 'major_field', 25),
('理科类', 'major_field', 25),
('医学类', 'major_field', 20),
('教育类', 'major_field', 15),
('艺术类', 'major_field', 15),
('一线城市', 'location', 45),
('二线城市', 'location', 40),
('三四线城市', 'location', 30),
('回乡就业', 'location', 20),
('海外发展', 'location', 10),
('面试经历', 'story_type', 50),
('实习体验', 'story_type', 45),
('职业规划', 'story_type', 40),
('职场适应', 'story_type', 35),
('技能提升', 'story_type', 30),
('校园生活', 'story_type', 25),
('经验分享', 'story_type', 55),
('求职心得', 'story_type', 45),
('职场感悟', 'story_type', 40),
('学习成长', 'story_type', 35),
('人生感悟', 'story_type', 30);

-- 8. 完成提示
SELECT 'Migration completed successfully!' as status;
`;

    fs.writeFileSync(sqlFile, sql);
    console.log(`✅ 迁移SQL文件已生成: ${sqlFile}`);
    return sqlFile;
  }

  /**
   * 主执行函数
   */
  async run() {
    console.log('🚀 开始生成数据迁移脚本...\n');
    
    try {
      // 生成迁移SQL
      const sqlFile = this.generateMigrationSQL();
      
      console.log('\n🎉 数据迁移脚本生成完成！');
      console.log('\n📁 生成的文件:');
      console.log(`   - ${sqlFile}`);
      console.log('\n📋 执行步骤:');
      console.log('   1. 复制SQL文件到backend/database目录');
      console.log('   2. 使用wrangler执行迁移脚本');
      console.log('   3. 验证迁移结果');
      console.log('\n💡 执行命令:');
      console.log('   npx wrangler d1 execute college-employment-survey --remote --file=database/migrate_heart_voices_to_stories.sql');
      
      return sqlFile;
      
    } catch (error) {
      console.error('❌ 生成迁移脚本时出错:', error);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const migrator = new HeartVoicesToStoriesMigrator();
  migrator.run();
}

module.exports = HeartVoicesToStoriesMigrator;
