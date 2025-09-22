/**
 * 数据库修复路由
 * 用于修复故事表结构和数据问题
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';

export function createDatabaseFixRoutes() {
  const dbFix = new Hono<{ Bindings: Env }>();

  // 修复故事表结构
  dbFix.post('/fix-stories-tables', async (c) => {
    try {
      console.log('开始修复故事表结构...');
      const db = c.env.DB;

      // 1. 创建原始故事提交表
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS raw_story_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data_uuid TEXT UNIQUE NOT NULL,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT DEFAULT 'general',
          tags TEXT DEFAULT '[]',
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          raw_status TEXT DEFAULT 'completed',
          ip_address TEXT,
          user_agent TEXT
        )
      `).run();

      // 2. 创建有效故事表
      await db.prepare(`
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
          is_featured INTEGER DEFAULT 0,
          published_at DATETIME,
          png_status TEXT DEFAULT 'pending',
          png_generated_at DATETIME,
          png_themes_generated TEXT DEFAULT '[]',
          png_generation_attempts INTEGER DEFAULT 0,
          png_last_error TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // 3. 创建索引
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_valid_stories_audit_status ON valid_stories(audit_status)',
        'CREATE INDEX IF NOT EXISTS idx_valid_stories_approved_at ON valid_stories(approved_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_valid_stories_like_count ON valid_stories(like_count DESC)',
        'CREATE INDEX IF NOT EXISTS idx_valid_stories_view_count ON valid_stories(view_count DESC)',
        'CREATE INDEX IF NOT EXISTS idx_valid_stories_category ON valid_stories(category)',
        'CREATE INDEX IF NOT EXISTS idx_valid_stories_featured ON valid_stories(is_featured)',
        'CREATE INDEX IF NOT EXISTS idx_valid_stories_published_at ON valid_stories(published_at DESC)'
      ];

      for (const indexSql of indexes) {
        await db.prepare(indexSql).run();
      }

      console.log('故事表结构创建完成');

      return c.json({
        success: true,
        message: '故事表结构修复完成',
        data: {
          tables_created: ['raw_story_submissions', 'valid_stories'],
          indexes_created: indexes.length
        }
      });

    } catch (error) {
      console.error('修复故事表结构失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '修复故事表结构失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  // 插入测试数据
  dbFix.post('/insert-test-stories', async (c) => {
    try {
      console.log('开始插入测试故事数据...');
      const db = c.env.DB;

      // 检查是否已有数据
      const existingCount = await db.prepare('SELECT COUNT(*) as count FROM valid_stories').first();
      if (existingCount && existingCount.count > 0) {
        return c.json({
          success: true,
          message: '数据已存在，跳过插入',
          data: { existing_count: existingCount.count }
        });
      }

      // 插入原始故事数据
      const rawStories = [
        {
          id: 1,
          data_uuid: 'story-uuid-001',
          user_id: 'user-001',
          title: '我的第一份工作经历',
          content: '刚毕业时找工作真的很困难，投了上百份简历才收到几个面试邀请。但是通过这个过程，我学会了如何更好地展示自己，也明白了坚持的重要性。现在回想起来，那段经历虽然艰难，但让我成长了很多。',
          category: 'job_search',
          tags: '["求职经历", "新手"]'
        },
        {
          id: 2,
          data_uuid: 'story-uuid-002',
          user_id: 'user-002',
          title: '转行程序员的心路历程',
          content: '从传统行业转到IT行业并不容易，需要重新学习很多技术知识。我花了一年时间自学编程，参加了培训班，最终成功转行。虽然起薪不高，但我相信通过努力可以获得更好的发展。',
          category: 'career_change',
          tags: '["转行", "程序员"]'
        },
        {
          id: 3,
          data_uuid: 'story-uuid-003',
          user_id: 'user-003',
          title: '创业失败后的反思',
          content: '第一次创业失败了，损失了所有积蓄。但这次经历让我学到了很多宝贵的经验，包括市场调研的重要性、团队管理的技巧等。现在我在一家公司工作，积累经验，为下次创业做准备。',
          category: 'entrepreneurship',
          tags: '["创业", "反思"]'
        },
        {
          id: 4,
          data_uuid: 'story-uuid-004',
          user_id: 'user-004',
          title: '职场新人的成长之路',
          content: '刚进入职场时，我什么都不懂，经常犯错。但是在同事和领导的帮助下，我逐渐适应了工作节奏，学会了很多实用的技能。现在回想起来，那段迷茫的时光也是很宝贵的成长经历。',
          category: 'workplace_life',
          tags: '["职场新人", "成长"]'
        },
        {
          id: 5,
          data_uuid: 'story-uuid-005',
          user_id: 'user-005',
          title: '远程工作的利与弊',
          content: '疫情期间开始远程工作，一开始觉得很自由，但后来发现也有很多挑战。比如沟通效率降低、工作与生活界限模糊等。不过总的来说，远程工作让我学会了更好地管理时间和自我驱动。',
          category: 'workplace_life',
          tags: '["远程工作", "经验分享"]'
        },
        {
          id: 6,
          data_uuid: 'story-uuid-006',
          user_id: 'user-006',
          title: '考研还是工作的选择',
          content: '大四时面临考研还是直接工作的选择，经过深思熟虑，我选择了先工作积累经验。虽然有时会想如果考研会怎样，但我不后悔自己的选择，因为工作让我更快地了解了社会和自己。',
          category: 'career_planning',
          tags: '["考研", "工作选择"]'
        }
      ];

      // 插入原始数据
      for (const story of rawStories) {
        await db.prepare(`
          INSERT OR REPLACE INTO raw_story_submissions 
          (id, data_uuid, user_id, title, content, category, tags, submitted_at, raw_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), 'completed')
        `).bind(
          story.id,
          story.data_uuid,
          story.user_id,
          story.title,
          story.content,
          story.category,
          story.tags,
          (story.id - 1) * 5 + 4  // 时间间隔
        ).run();
      }

      // 插入有效故事数据
      const validStories = [
        { id: 1, author_name: '小李同学', like_count: 156, view_count: 1245, is_featured: 1 },
        { id: 2, author_name: '转行小王', like_count: 234, view_count: 1876, is_featured: 0 },
        { id: 3, author_name: '创业者张三', like_count: 189, view_count: 1432, is_featured: 0 },
        { id: 4, author_name: '职场萌新', like_count: 98, view_count: 876, is_featured: 0 },
        { id: 5, author_name: '远程工作者', like_count: 267, view_count: 2103, is_featured: 1 },
        { id: 6, author_name: '选择困难户', like_count: 145, view_count: 987, is_featured: 0 }
      ];

      for (let i = 0; i < rawStories.length; i++) {
        const raw = rawStories[i];
        const valid = validStories[i];
        
        await db.prepare(`
          INSERT OR REPLACE INTO valid_stories 
          (id, raw_id, data_uuid, user_id, title, content, category, tags, author_name,
           audit_status, approved_at, like_count, dislike_count, view_count, is_featured, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 
                  datetime('now', '-' || ? || ' days'), ?, ?, ?, ?, 
                  datetime('now', '-' || ? || ' days'))
        `).bind(
          valid.id,
          raw.id,
          raw.data_uuid,
          raw.user_id,
          raw.title,
          raw.content,
          raw.category,
          raw.tags,
          valid.author_name,
          (raw.id - 1) * 5 + 4,  // approved_at
          valid.like_count,
          Math.floor(Math.random() * 10),  // dislike_count
          valid.view_count,
          valid.is_featured,
          (raw.id - 1) * 5 + 4   // published_at
        ).run();
      }

      console.log('测试故事数据插入完成');

      return c.json({
        success: true,
        message: '测试故事数据插入完成',
        data: {
          raw_stories_inserted: rawStories.length,
          valid_stories_inserted: validStories.length
        }
      });

    } catch (error) {
      console.error('插入测试故事数据失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '插入测试故事数据失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  // 检查数据库状态
  dbFix.get('/check-stories-status', async (c) => {
    try {
      const db = c.env.DB;

      // 检查表是否存在
      const tables = await db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('raw_story_submissions', 'valid_stories')
      `).all();

      const tableNames = tables.results.map((t: any) => t.name);

      let rawCount = 0;
      let validCount = 0;

      if (tableNames.includes('raw_story_submissions')) {
        const rawResult = await db.prepare('SELECT COUNT(*) as count FROM raw_story_submissions').first();
        rawCount = rawResult?.count || 0;
      }

      if (tableNames.includes('valid_stories')) {
        const validResult = await db.prepare('SELECT COUNT(*) as count FROM valid_stories').first();
        validCount = validResult?.count || 0;
      }

      return c.json({
        success: true,
        data: {
          tables_exist: tableNames,
          raw_stories_count: rawCount,
          valid_stories_count: validCount,
          status: validCount > 0 ? 'ready' : 'needs_data'
        }
      });

    } catch (error) {
      console.error('检查数据库状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '检查数据库状态失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  return dbFix;
}
