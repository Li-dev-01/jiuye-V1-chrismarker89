/**
 * 故事路由
 * 提供故事相关的API端点
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
// PNG相关服务已移除

// 内容清理函数 - 移除分类标识符
function cleanContent(content: string): string {
  if (!content) return '';

  // 移除开头的分类标识符，如 [growth]、[interview]、[career_change] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
}

export function createStoriesRoutes() {
  const stories = new Hono<{ Bindings: Env }>();

  // 数据库初始化检查和修复
  const ensureTablesExist = async (db: any) => {
    try {
      // 检查valid_stories表是否存在
      const tableCheck = await db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='valid_stories'
      `).first();

      if (!tableCheck) {
        console.log('valid_stories表不存在，正在创建...');

        // 先创建raw_story_submissions表
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

        // 创建valid_stories表
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // 创建索引
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_valid_stories_audit_status ON valid_stories(audit_status)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_valid_stories_approved_at ON valid_stories(approved_at DESC)').run();

        console.log('valid_stories表创建完成');
      }

      // 检查是否有数据，如果没有则插入测试数据
      const countResult = await db.prepare('SELECT COUNT(*) as count FROM valid_stories').first();
      if (!countResult || countResult.count === 0) {
        console.log('插入测试故事数据...');

        const testStories = [
          {
            data_uuid: 'story-uuid-001',
            user_id: 'user-001',
            title: '我的第一份工作经历',
            content: '刚毕业时找工作真的很困难，投了上百份简历才收到几个面试邀请。但是通过这个过程，我学会了如何更好地展示自己，也明白了坚持的重要性。现在回想起来，那段经历虽然艰难，但让我成长了很多。',
            category: 'job_search',
            tags: '["求职经历", "新手"]',
            author_name: '小李同学',
            like_count: 156,
            view_count: 1245,
            is_featured: 1
          },
          {
            data_uuid: 'story-uuid-002',
            user_id: 'user-002',
            title: '转行程序员的心路历程',
            content: '从传统行业转到IT行业并不容易，需要重新学习很多技术知识。我花了一年时间自学编程，参加了培训班，最终成功转行。虽然起薪不高，但我相信通过努力可以获得更好的发展。',
            category: 'career_change',
            tags: '["转行", "程序员"]',
            author_name: '转行小王',
            like_count: 234,
            view_count: 1876,
            is_featured: 0
          },
          {
            data_uuid: 'story-uuid-003',
            user_id: 'user-003',
            title: '创业失败后的反思',
            content: '第一次创业失败了，损失了所有积蓄。但这次经历让我学到了很多宝贵的经验，包括市场调研的重要性、团队管理的技巧等。现在我在一家公司工作，积累经验，为下次创业做准备。',
            category: 'entrepreneurship',
            tags: '["创业", "反思"]',
            author_name: '创业者张三',
            like_count: 189,
            view_count: 1432,
            is_featured: 0
          }
        ];

        for (const story of testStories) {
          await db.prepare(`
            INSERT INTO valid_stories
            (data_uuid, user_id, title, content, category, tags, author_name,
             audit_status, approved_at, like_count, view_count, is_featured, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', datetime('now'), ?, ?, ?, datetime('now'))
          `).bind(
            story.data_uuid, story.user_id, story.title, story.content,
            story.category, story.tags, story.author_name,
            story.like_count, story.view_count, story.is_featured
          ).run();
        }

        console.log('测试故事数据插入完成');
      }

      // 检查并创建content_tags表
      const contentTagsCheck = await db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='content_tags'
      `).first();

      if (!contentTagsCheck) {
        console.log('content_tags表不存在，正在创建...');

        // 创建content_tags表（与admin路由兼容的完整结构）
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS content_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_key TEXT NOT NULL UNIQUE,
            tag_name TEXT NOT NULL,
            tag_name_en TEXT,
            description TEXT,
            tag_type TEXT DEFAULT 'system' CHECK (tag_type IN ('system', 'user', 'auto')),
            color TEXT DEFAULT '#1890ff',
            usage_count INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            content_type TEXT DEFAULT 'all' CHECK (content_type IN ('story', 'voice', 'all')),
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // 创建索引
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_content_tags_type ON content_tags(content_type, tag_type)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_content_tags_active ON content_tags(is_active)').run();

        // 插入默认标签数据
        const defaultTags = [
          { tag_key: 'job_search', tag_name: '求职经历', tag_name_en: 'Job Search', description: '求职过程中的经历和心得', tag_type: 'system', color: '#1890ff', content_type: 'story' },
          { tag_key: 'career_change', tag_name: '转行经历', tag_name_en: 'Career Change', description: '职业转换的经历和感悟', tag_type: 'system', color: '#52c41a', content_type: 'story' },
          { tag_key: 'entrepreneurship', tag_name: '创业故事', tag_name_en: 'Entrepreneurship', description: '创业过程中的故事和经验', tag_type: 'system', color: '#fa8c16', content_type: 'story' },
          { tag_key: 'workplace_life', tag_name: '职场生活', tag_name_en: 'Workplace Life', description: '职场中的日常生活和体验', tag_type: 'system', color: '#722ed1', content_type: 'story' },
          { tag_key: 'skill_growth', tag_name: '技能成长', tag_name_en: 'Skill Growth', description: '技能学习和成长的经历', tag_type: 'system', color: '#13c2c2', content_type: 'story' },
          { tag_key: 'interview', tag_name: '面试经验', tag_name_en: 'Interview Experience', description: '面试过程中的经验和技巧', tag_type: 'system', color: '#eb2f96', content_type: 'story' },
          { tag_key: 'career_planning', tag_name: '职业规划', tag_name_en: 'Career Planning', description: '职业发展规划和思考', tag_type: 'system', color: '#f5222d', content_type: 'story' }
        ];

        for (const tag of defaultTags) {
          await db.prepare(`
            INSERT INTO content_tags (tag_key, tag_name, tag_name_en, description, tag_type, color, content_type, is_active, usage_count, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0)
          `).bind(tag.tag_key, tag.tag_name, tag.tag_name_en, tag.description, tag.tag_type, tag.color, tag.content_type).run();
        }

        console.log('content_tags表创建完成');
      }

    } catch (error) {
      console.error('数据库初始化失败:', error);
    }
  };

  // 获取故事列表
  stories.get('/', async (c) => {
    try {
      console.log('获取故事列表...');

      const db = c.env.DB;

      // 确保表存在
      await ensureTablesExist(db);

      // 获取查询参数
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const category = c.req.query('category');
      const tags = c.req.query('tags'); // 支持标签筛选
      const sortBy = c.req.query('sortBy') || 'approved_at';
      const sortOrder = c.req.query('sortOrder') || 'desc';
      const published = c.req.query('published') !== 'false'; // 默认只显示已发布的

      console.log('查询参数:', { page, pageSize, category, tags, sortBy, sortOrder, published });

      // 计算偏移量
      const offset = (page - 1) * pageSize;

      // 构建查询条件
      let whereClause = "vs.audit_status = 'approved'";
      const params: any[] = [];
      let joinClause = '';

      if (category) {
        whereClause += " AND vs.category = ?";
        params.push(category);
      }

      // 处理标签筛选
      if (tags) {
        const tagIds = tags.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
        if (tagIds.length > 0) {
          joinClause = `
            INNER JOIN content_tag_relations ctr ON vs.data_uuid = ctr.content_id AND ctr.content_type = 'story'
          `;
          whereClause += ` AND ctr.tag_id IN (${tagIds.map(() => '?').join(',')})`;
          params.push(...tagIds);
        }
      }

      // 获取故事列表 - 增强查询
      const storyQuery = `
        SELECT DISTINCT
          vs.id,
          vs.data_uuid,
          vs.user_id,
          vs.title,
          vs.content,
          vs.category,
          vs.tags,
          vs.author_name,
          vs.approved_at,
          vs.audit_status,
          vs.like_count,
          vs.dislike_count,
          vs.view_count,
          vs.is_featured,
          vs.published_at,
          vs.created_at
        FROM valid_stories vs
        ${joinClause}
        WHERE ${whereClause}
        ORDER BY vs.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `;

      console.log('执行查询:', storyQuery);
      console.log('查询参数:', [...params, pageSize, offset]);

      const storyResult = await db.prepare(storyQuery).bind(...params, pageSize, offset).all();
      const storyList = storyResult.results;

      // 获取总数
      const countQuery = `
        SELECT COUNT(DISTINCT vs.id) as total
        FROM valid_stories vs
        ${joinClause}
        WHERE ${whereClause}
      `;

      const totalResult = await db.prepare(countQuery).bind(...params).first();
      const total = totalResult?.total || 0;

      console.log(`找到 ${storyList.length} 条故事，总计 ${total} 条`);

      // 为每个故事获取关联的标签
      const storyIds = storyList.map((story: any) => story.data_uuid);
      let storyTags: any = {};

      if (storyIds.length > 0) {
        const tagsQuery = `
          SELECT
            ctr.content_id,
            ct.id as tag_id,
            ct.tag_key,
            ct.tag_name,
            ct.color
          FROM content_tag_relations ctr
          JOIN content_tags ct ON ctr.tag_id = ct.id
          WHERE ctr.content_id IN (${storyIds.map(() => '?').join(',')})
            AND ctr.content_type = 'story'
        `;

        const tagsResult = await db.prepare(tagsQuery).bind(...storyIds).all();

        // 组织标签数据
        tagsResult.results.forEach((tagRel: any) => {
          if (!storyTags[tagRel.content_id]) {
            storyTags[tagRel.content_id] = [];
          }
          storyTags[tagRel.content_id].push({
            id: tagRel.tag_id,
            key: tagRel.tag_key,
            name: tagRel.tag_name,
            color: tagRel.color
          });
        });
      }

      // 格式化数据 - 使用真实数据
      const formattedStories = storyList.map((story: any) => ({
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(story.content).substring(0, 100) + '...',
        category: story.category || 'general',
        tags: storyTags[story.data_uuid] || [],
        isAnonymous: true,
        authorName: story.author_name || '匿名用户',
        status: 'approved',
        isFeatured: story.is_featured || false,
        isPublished: true,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        createdAt: story.created_at || story.approved_at,
        publishedAt: story.published_at || story.approved_at
      }));
      
      return c.json({
        success: true,
        data: {
          stories: formattedStories,
          total: total,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(Number(total) / pageSize)
        },
        message: '故事列表获取成功'
      });
      
    } catch (error) {
      console.error('获取故事列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取故事列表失败'
      }, 500);
    }
  });

  // 获取精选故事 - 必须在 /:id 之前定义
  stories.get('/featured', async (c) => {
    try {
      console.log('获取精选故事...');

      const db = c.env.DB;

      // 确保表存在
      await ensureTablesExist(db);

      const pageSize = parseInt(c.req.query('pageSize') || '6');

      // 获取点赞数最多的故事作为精选
      console.log('执行精选故事查询，pageSize:', pageSize);

      const featuredResult = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          title,
          content,
          category,
          tags,
          approved_at as created_at,
          like_count,
          dislike_count,
          view_count
        FROM valid_stories
        WHERE audit_status = 'approved'
        ORDER BY like_count DESC, view_count DESC
        LIMIT ?
      `).bind(pageSize).all();

      console.log('查询结果对象:', featuredResult);
      const featuredStories = featuredResult.results;

      console.log('精选故事查询结果:', featuredStories);
      console.log('结果数量:', featuredStories ? featuredStories.length : 0);

      if (!featuredStories || featuredStories.length === 0) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '故事不存在'
        }, 404);
      }

      // 为精选故事获取关联的标签
      const storyIds = featuredStories.map((story: any) => story.data_uuid);
      let storyTags: any = {};

      if (storyIds.length > 0) {
        const tagsQuery = `
          SELECT
            ctr.content_id,
            ct.id as tag_id,
            ct.tag_key,
            ct.tag_name,
            ct.color
          FROM content_tag_relations ctr
          JOIN content_tags ct ON ctr.tag_id = ct.id
          WHERE ctr.content_id IN (${storyIds.map(() => '?').join(',')})
            AND ctr.content_type = 'story'
        `;

        const tagsResult = await db.prepare(tagsQuery).bind(...storyIds).all();

        // 组织标签数据
        tagsResult.results.forEach((tagRel: any) => {
          if (!storyTags[tagRel.content_id]) {
            storyTags[tagRel.content_id] = [];
          }
          storyTags[tagRel.content_id].push({
            id: tagRel.tag_id,
            key: tagRel.tag_key,
            name: tagRel.tag_name,
            color: tagRel.color
          });
        });
      }

      const formattedStories = featuredStories.map((story: any) => ({
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(story.content).substring(0, 100) + '...',
        category: story.category || 'general',
        tags: storyTags[story.data_uuid] || [],
        isAnonymous: true,
        authorName: '匿名用户',
        status: 'approved',
        isFeatured: true,
        isPublished: true,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        createdAt: story.created_at,
        publishedAt: story.created_at
      }));

      return c.json({
        success: true,
        data: {
          stories: formattedStories,
          total: formattedStories.length
        },
        message: '精选故事获取成功'
      });

    } catch (error) {
      console.error('获取精选故事失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取精选故事失败'
      }, 500);
    }
  });

  // 测试标签关联查询
  stories.get('/test-tags/:storyId', async (c) => {
    try {
      const storyId = c.req.param('storyId');
      const db = c.env.DB;

      // 查询指定故事的标签
      const tagsResult = await db.prepare(`
        SELECT
          ctr.content_id,
          ct.id as tag_id,
          ct.tag_key,
          ct.tag_name,
          ct.color
        FROM content_tag_relations ctr
        JOIN content_tags ct ON ctr.tag_id = ct.id
        WHERE ctr.content_id = ? AND ctr.content_type = 'story'
      `).bind(storyId).all();

      return c.json({
        success: true,
        data: {
          storyId,
          tags: tagsResult.results
        }
      });
    } catch (error) {
      console.error('Test tags error:', error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  // 获取所有可用标签
  stories.get('/available-tags', async (c) => {
    try {
      console.log('获取故事标签列表...');

      const db = c.env.DB;

      // 确保表存在
      await ensureTablesExist(db);

      // 获取所有故事相关的标签
      const tagsResult = await db.prepare(`
        SELECT
          ct.id,
          ct.tag_key,
          ct.tag_name,
          ct.tag_name_en,
          ct.description,
          ct.color,
          ct.usage_count,
          COUNT(ctr.id) as actual_usage
        FROM content_tags ct
        LEFT JOIN content_tag_relations ctr ON ct.id = ctr.tag_id AND ctr.content_type = 'story'
        WHERE ct.content_type IN ('story', 'all') AND ct.is_active = 1
        GROUP BY ct.id, ct.tag_key, ct.tag_name, ct.tag_name_en, ct.description, ct.color, ct.usage_count
        ORDER BY actual_usage DESC, ct.tag_name
      `).all();

      const tags = tagsResult.results;

      console.log(`找到 ${tags.length} 个可用标签`);

      return c.json({
        success: true,
        data: tags,
        message: '标签获取成功'
      });

    } catch (error) {
      console.error('获取标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取标签失败'
      }, 500);
    }
  });

  // 获取单个故事详情
  stories.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      console.log('获取故事详情:', id);
      
      const db = c.env.DB;

      // 增加浏览量
      await db.prepare(`
        UPDATE valid_stories
        SET view_count = view_count + 1
        WHERE id = ?
      `).bind(id).run();

      const story = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          title,
          content,
          category,
          tags,
          approved_at as created_at,
          like_count,
          dislike_count,
          view_count
        FROM valid_stories
        WHERE id = ? AND audit_status = 'approved'
      `).bind(id).first();
      
      if (!story) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '故事不存在'
        }, 404);
      }
      
      const formattedStory = {
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(String(story.content)).substring(0, 100) + '...',
        category: story.category,
        tags: story.tags ? JSON.parse(String(story.tags)) : [],
        isAnonymous: true,
        authorName: '匿名用户',
        status: 'approved',
        isFeatured: false,
        isPublished: true,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        createdAt: story.created_at,
        publishedAt: story.created_at
      };
      
      return c.json({
        success: true,
        data: formattedStory,
        message: '故事详情获取成功'
      });
      
    } catch (error) {
      console.error('获取故事详情失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取故事详情失败'
      }, 500);
    }
  });

  // 创建故事 - 使用三层审核流程
  stories.post('/', async (c) => {
    try {
      const body = await c.req.json();
      console.log('📝 [STORY_SUBMIT] 收到故事提交请求:', {
        user_id: body.user_id,
        title: body.title?.substring(0, 20)
      });

      const { title, content, category, tags, user_id, author_name, is_anonymous } = body;

      // 验证必填字段
      if (!title || !content || !category || !user_id) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少必填字段'
        }, 400);
      }

      const db = c.env.DB;

      // 确保审核系统表存在
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS pending_stories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT DEFAULT 'general',
          tags TEXT DEFAULT '[]',
          author_name TEXT DEFAULT '匿名用户',
          status TEXT DEFAULT 'pending' CHECK (status IN (
            'pending', 'rule_checking', 'rule_passed', 'ai_checking',
            'ai_passed', 'manual_review', 'approved', 'rejected'
          )),
          audit_level INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          rule_audit_at DATETIME,
          ai_audit_at DATETIME,
          manual_audit_at DATETIME,
          approved_at DATETIME,
          rule_audit_result TEXT,
          ai_audit_result TEXT,
          manual_audit_result TEXT,
          user_ip TEXT,
          user_agent TEXT
        )
      `).run();

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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // 🔥 使用审核控制器处理提交
      const { StoryAuditController } = await import('../services/storyAuditController');
      const auditController = new StoryAuditController(c.env, db);

      const auditResult = await auditController.processStorySubmission({
        user_id: user_id,
        title: title,
        content: content,
        category: category,
        tags: tags,
        author_name: author_name || '匿名用户',
        user_ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        user_agent: c.req.header('User-Agent')
      });

      console.log('✅ [STORY_SUBMIT] 审核结果:', auditResult);

      return c.json({
        success: auditResult.success,
        data: {
          story_id: auditResult.story_id,
          status: auditResult.status,
          message: auditResult.message
        },
        message: auditResult.message
      });
      
    } catch (error) {
      console.error('创建故事失败:', error);
      console.error('错误详情:', error instanceof Error ? error.message : String(error));
      console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '创建故事失败',
        debug: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // 点赞故事
  stories.post('/:id/like', async (c) => {
    try {
      const id = c.req.param('id');
      console.log('点赞故事:', id);

      const db = c.env.DB;

      // 增加点赞数
      await db.prepare(`
        UPDATE valid_stories
        SET like_count = like_count + 1
        WHERE id = ?
      `).bind(id).run();

      return c.json({
        success: true,
        message: '点赞成功'
      });

    } catch (error) {
      console.error('点赞失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '点赞失败'
      }, 500);
    }
  });

  // 删除故事
  stories.delete('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      console.log('删除故事:', id);

      const db = c.env.DB;

      // 首先检查故事是否存在
      const story = await db.prepare(`
        SELECT id, user_id FROM valid_stories WHERE id = ?
      `).bind(id).first();

      if (!story) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '故事不存在'
        }, 404);
      }

      // TODO: 这里应该添加权限检查，确保只有故事作者或管理员可以删除
      // 暂时允许所有删除操作

      // 删除故事（软删除，设置audit_status为deleted）
      const result = await db.prepare(`
        UPDATE valid_stories
        SET audit_status = 'deleted', updated_at = datetime('now')
        WHERE id = ?
      `).bind(id).run();

      if (result.success) {
        console.log('故事删除成功:', id);
        return c.json({
          success: true,
          data: { id: parseInt(id) },
          message: '故事删除成功'
        });
      } else {
        throw new Error('删除操作失败');
      }

    } catch (error) {
      console.error('删除故事失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '删除故事失败'
      }, 500);
    }
  });

  // 踩故事
  stories.post('/:id/dislike', async (c) => {
    try {
      const storyId = parseInt(c.req.param('id'));
      const userId = c.req.header('X-User-ID') || 'anonymous';
      const ipAddress = c.req.header('CF-Connecting-IP') ||
                       c.req.header('X-Forwarded-For') ||
                       'unknown';

      if (!storyId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '故事ID无效'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 检查是否已经踩过
      const existingDislike = await db.queryFirst(`
        SELECT id FROM story_dislikes
        WHERE story_id = ? AND user_id = ?
      `, [storyId, userId]);

      if (existingDislike) {
        return c.json({
          success: false,
          error: 'Already Disliked',
          message: '您已经踩过这个故事了'
        }, 400);
      }

      // 添加踩记录
      await db.execute(`
        INSERT INTO story_dislikes (story_id, user_id, ip_address)
        VALUES (?, ?, ?)
      `, [storyId, userId, ipAddress]);

      // 更新踩数量
      await db.execute(`
        UPDATE valid_stories
        SET dislike_count = dislike_count + 1
        WHERE id = ?
      `, [storyId]);

      return c.json({
        success: true,
        message: '踩成功',
        data: {
          storyId,
          action: 'dislike'
        }
      });

    } catch (error) {
      console.error('踩故事失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误，请稍后重试'
      }, 500);
    }
  });

  // 获取故事PNG卡片下载链接（暂时禁用权限验证）
  stories.get('/:id/png/:theme?', async (c) => {
    try {
      const storyId = parseInt(c.req.param('id'));
      const theme = c.req.param('theme') || 'gradient';

      if (!storyId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '故事ID无效'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 查找现有的PNG卡片
      const existingCard = await db.queryFirst(`
        SELECT card_id, download_url, r2_key
        FROM png_cards
        WHERE content_type = 'story' AND content_id = ? AND theme = ?
      `, [storyId, theme]);

      if (existingCard) {
        // 记录下载
        await db.execute(`
          INSERT INTO png_downloads (card_id, content_type, content_id, user_id, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          existingCard.card_id,
          'story',
          storyId,
          c.req.header('X-User-ID') || 'anonymous',
          c.req.header('CF-Connecting-IP') || 'unknown',
          c.req.header('User-Agent') || 'unknown'
        ]);

        // 更新下载计数
        await db.execute(`
          UPDATE png_cards
          SET download_count = download_count + 1
          WHERE card_id = ?
        `, [existingCard.card_id]);

        return c.json({
          success: true,
          data: {
            downloadUrl: existingCard.download_url,
            cardId: existingCard.card_id,
            theme
          }
        });
      } else {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '该主题的PNG卡片不存在，请先生成'
        }, 404);
      }

    } catch (error) {
      console.error('获取故事PNG下载链接失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误，请稍后重试'
      }, 500);
    }
  });

  // 获取用户故事列表
  stories.get('/user/:userId', async (c) => {
    try {
      const userId = c.req.param('userId');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const sortBy = c.req.query('sortBy') || 'created_at';
      const sortOrder = c.req.query('sortOrder') || 'desc';

      console.log('获取用户故事列表:', { userId, page, pageSize, sortBy, sortOrder });

      const db = c.env.DB;
      const offset = (page - 1) * pageSize;

      // 获取总数
      const countResult = await db.prepare(`
        SELECT COUNT(*) as total
        FROM valid_stories
        WHERE user_id = ? AND audit_status = 'approved'
      `).bind(userId).first();

      const total = countResult?.total || 0;

      // 获取故事列表
      const storiesResult = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          title,
          content,
          category,
          tags,
          approved_at as created_at,
          like_count,
          dislike_count,
          view_count,
          'approved' as status
        FROM valid_stories
        WHERE user_id = ? AND audit_status = 'approved'
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `).bind(userId, pageSize, offset).all();

      const userStories = storiesResult || [];

      // 格式化数据
      const formattedStories = (Array.isArray(userStories) ? userStories : (userStories as any).results || []).map((story: any) => ({
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(story.content).substring(0, 200) + '...',
        category: story.category,
        tags: story.tags ? JSON.parse(story.tags) : [],
        created_at: story.created_at,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        status: story.status
      }));

      return c.json({
        success: true,
        data: {
          stories: formattedStories,
          items: formattedStories, // 兼容前端期望的格式
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(Number(total) / pageSize)
          }
        }
      });

    } catch (error) {
      console.error('获取用户故事列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取用户故事列表失败'
      }, 500);
    }
  });

  // 数据库状态检查API
  stories.get('/debug/status', async (c) => {
    try {
      const db = c.env.DB;

      // 检查表是否存在
      const tables = await db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name IN ('valid_stories', 'raw_story_submissions', 'content_tags')
      `).all();

      const tableNames = tables.results.map((t: any) => t.name);

      let validStoriesCount = 0;
      let rawStoriesCount = 0;
      let tagsCount = 0;

      // 检查各表的数据量
      if (tableNames.includes('valid_stories')) {
        try {
          const result = await db.prepare('SELECT COUNT(*) as count FROM valid_stories').first();
          validStoriesCount = result?.count || 0;
        } catch (e) {
          console.error('查询valid_stories失败:', e);
        }
      }

      if (tableNames.includes('raw_story_submissions')) {
        try {
          const result = await db.prepare('SELECT COUNT(*) as count FROM raw_story_submissions').first();
          rawStoriesCount = result?.count || 0;
        } catch (e) {
          console.error('查询raw_story_submissions失败:', e);
        }
      }

      if (tableNames.includes('content_tags')) {
        try {
          const result = await db.prepare('SELECT COUNT(*) as count FROM content_tags').first();
          tagsCount = result?.count || 0;
        } catch (e) {
          console.error('查询content_tags失败:', e);
        }
      }

      // 如果valid_stories表存在但为空，尝试获取表结构
      let tableSchema = null;
      if (tableNames.includes('valid_stories')) {
        try {
          const schema = await db.prepare(`
            PRAGMA table_info(valid_stories)
          `).all();
          tableSchema = schema.results;
        } catch (e) {
          console.error('获取表结构失败:', e);
        }
      }

      return c.json({
        success: true,
        data: {
          database_status: 'connected',
          tables_exist: tableNames,
          data_counts: {
            valid_stories: validStoriesCount,
            raw_story_submissions: rawStoriesCount,
            content_tags: tagsCount
          },
          table_schema: tableSchema,
          needs_initialization: validStoriesCount === 0,
          timestamp: new Date().toISOString()
        },
        message: '数据库状态检查完成'
      });

    } catch (error) {
      console.error('数据库状态检查失败:', error);
      return c.json({
        success: false,
        error: 'Database Error',
        message: '数据库状态检查失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  // 调试：查看原始数据
  stories.get('/debug/raw-data', async (c) => {
    try {
      const db = c.env.DB;

      // 获取所有故事数据
      const allStories = await db.prepare('SELECT * FROM valid_stories').all();

      return c.json({
        success: true,
        data: {
          stories: allStories.results,
          count: allStories.results.length
        },
        message: '原始数据获取成功'
      });

    } catch (error) {
      console.error('获取原始数据失败:', error);
      return c.json({
        success: false,
        error: 'Database Error',
        message: '获取原始数据失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  // 强制初始化数据库
  stories.post('/debug/init', async (c) => {
    try {
      const db = c.env.DB;

      console.log('开始强制初始化数据库...');

      // 强制执行表创建和数据初始化
      await ensureTablesExist(db);

      // 再次检查状态
      const validStoriesCount = await db.prepare('SELECT COUNT(*) as count FROM valid_stories').first();
      const tagsCount = await db.prepare('SELECT COUNT(*) as count FROM content_tags').first();

      return c.json({
        success: true,
        data: {
          valid_stories_count: validStoriesCount?.count || 0,
          content_tags_count: tagsCount?.count || 0,
          initialization_completed: true,
          timestamp: new Date().toISOString()
        },
        message: '数据库初始化完成'
      });

    } catch (error) {
      console.error('数据库初始化失败:', error);
      return c.json({
        success: false,
        error: 'Database Error',
        message: '数据库初始化失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  return stories;
}
