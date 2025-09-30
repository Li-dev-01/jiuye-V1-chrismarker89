import { Hono } from 'hono';
import { Env } from '../types/api';

const userReports = new Hono<{ Bindings: Env }>();

// 🚨 用户举报内容 (静默处理，对用户无感)
userReports.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { content_type, content_id, report_type, report_reason, user_id } = body;

    console.log('🚨 [USER_REPORT] 收到举报:', {
      content_type,
      content_id,
      report_type,
      user_id
    });

    // 验证必填字段
    if (!content_type || !content_id || !report_type || !user_id) {
      return c.json({
        success: false,
        message: '缺少必填字段'
      }, 400);
    }

    const db = c.env.DB;

    // 步骤1: 检查举报人信誉 (静默检查，不提示用户)
    const reputation = await db.prepare(`
      SELECT * FROM reporter_reputation WHERE user_id = ?
    `).bind(user_id).first();

    // 如果是恶意举报者，静默忽略 (不提示，避免重复注册)
    if (reputation && reputation.is_restricted) {
      console.log('⚠️ [USER_REPORT] 举报人被限制，静默忽略:', user_id);
      
      // 返回成功，但实际不处理
      return c.json({
        success: true,
        message: '举报已提交，感谢您的反馈'
      });
    }

    // 检查24小时内举报次数
    const recentReports = await db.prepare(`
      SELECT COUNT(*) as count FROM user_reports
      WHERE reporter_user_id = ?
        AND created_at > datetime('now', '-24 hours')
    `).bind(user_id).first();

    // 如果24小时内举报超过10次，静默忽略
    if (recentReports && recentReports.count >= 10) {
      console.log('⚠️ [USER_REPORT] 24小时内举报过多，静默忽略:', user_id);
      
      return c.json({
        success: true,
        message: '举报已提交，感谢您的反馈'
      });
    }

    // 步骤2: 检查内容免疫状态
    const immunity = await db.prepare(`
      SELECT * FROM content_review_immunity
      WHERE content_type = ?
        AND content_id = ?
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(content_type, content_id).first();

    if (immunity) {
      console.log('✅ [USER_REPORT] 内容有免疫，自动驳回举报');
      
      // 创建举报记录，但标记为自动驳回
      await db.prepare(`
        INSERT INTO user_reports (
          content_type, content_id, reporter_user_id, reported_user_id,
          report_type, report_reason, status, review_result,
          reporter_ip, reporter_user_agent, reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'auto_dismissed', 'content_approved', ?, ?, datetime('now'))
      `).bind(
        content_type,
        content_id,
        user_id,
        0, // 需要从内容中获取
        report_type,
        report_reason || '',
        c.req.header('CF-Connecting-IP'),
        c.req.header('User-Agent')
      ).run();

      return c.json({
        success: true,
        message: '举报已提交，感谢您的反馈'
      });
    }

    // 步骤3: 获取被举报内容的作者ID
    let reported_user_id = 0;
    if (content_type === 'story') {
      const story = await db.prepare(`
        SELECT user_id FROM valid_stories WHERE id = ?
      `).bind(content_id).first();
      reported_user_id = story ? parseInt(story.user_id) : 0;
    }

    // 步骤4: 检查重复举报
    const existingReport = await db.prepare(`
      SELECT * FROM user_reports
      WHERE content_type = ?
        AND content_id = ?
        AND reporter_user_id = ?
        AND status IN ('pending', 'reviewing')
    `).bind(content_type, content_id, user_id).first();

    if (existingReport) {
      console.log('⚠️ [USER_REPORT] 重复举报，忽略');
      
      return c.json({
        success: true,
        message: '举报已提交，感谢您的反馈'
      });
    }

    // 步骤5: 创建举报记录
    const reportResult = await db.prepare(`
      INSERT INTO user_reports (
        content_type, content_id, content_uuid, reporter_user_id, reported_user_id,
        report_type, report_reason, status, reporter_ip, reporter_user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      content_type,
      content_id,
      '', // content_uuid
      user_id,
      reported_user_id,
      report_type,
      report_reason || '',
      c.req.header('CF-Connecting-IP'),
      c.req.header('User-Agent')
    ).run();

    const reportId = reportResult.meta.last_row_id;

    console.log('✅ [USER_REPORT] 举报记录创建成功:', reportId);

    // 步骤6: 计算优先级
    const priority = await calculatePriority(db, {
      reportType: report_type,
      reporterUserId: user_id,
      contentType: content_type,
      contentId: content_id,
      reportedUserId: reported_user_id
    });

    // 步骤7: 添加到审核队列
    await db.prepare(`
      INSERT INTO report_review_queue (
        report_id, priority, status
      ) VALUES (?, ?, 'waiting')
    `).bind(reportId, priority).run();

    // 步骤8: 记录操作日志
    await db.prepare(`
      INSERT INTO report_action_logs (
        report_id, action_type, action_by, action_details
      ) VALUES (?, 'created', ?, ?)
    `).bind(
      reportId,
      user_id.toString(),
      JSON.stringify({ report_type, priority })
    ).run();

    // 步骤9: 触发二次审核 (异步处理)
    // 这里可以调用审核控制器，但为了不阻塞用户请求，可以使用队列
    console.log('🔄 [USER_REPORT] 触发二次审核流程');

    // 返回成功 (对用户无感，不透露任何审核细节)
    return c.json({
      success: true,
      message: '举报已提交，感谢您的反馈'
    });

  } catch (error) {
    console.error('❌ [USER_REPORT] 举报处理失败:', error);
    
    // 即使失败也返回成功，避免暴露系统信息
    return c.json({
      success: true,
      message: '举报已提交，感谢您的反馈'
    });
  }
});

// 🔧 计算举报优先级
async function calculatePriority(db: any, factors: {
  reportType: string;
  reporterUserId: number;
  contentType: string;
  contentId: number;
  reportedUserId: number;
}): Promise<number> {
  let priority = 5; // 默认中等优先级

  // 因素1: 举报类型严重程度
  const severityMap: Record<string, number> = {
    political: -3,
    pornographic: -3,
    violent: -2,
    privacy: -2,
    harassment: -1,
    spam: 0,
    fake_info: 0,
    off_topic: 1,
    other: 1
  };
  priority += severityMap[factors.reportType] || 0;

  // 因素2: 举报人信誉
  const reputation = await db.prepare(`
    SELECT reputation_score FROM reporter_reputation WHERE user_id = ?
  `).bind(factors.reporterUserId).first();

  if (reputation) {
    if (reputation.reputation_score >= 90) priority -= 1; // 优秀举报人
    if (reputation.reputation_score < 50) priority += 1;  // 信誉差的举报人
  }

  // 因素3: 该内容被举报次数
  const reportCount = await db.prepare(`
    SELECT COUNT(*) as count FROM user_reports
    WHERE content_type = ? AND content_id = ?
      AND status IN ('pending', 'reviewing')
  `).bind(factors.contentType, factors.contentId).first();

  if (reportCount) {
    if (reportCount.count >= 5) priority -= 2;
    else if (reportCount.count >= 3) priority -= 1;
  }

  // 因素4: 被举报用户历史违规次数
  const violationCount = await db.prepare(`
    SELECT COUNT(*) as count FROM user_reports
    WHERE reported_user_id = ? AND status = 'valid'
  `).bind(factors.reportedUserId).first();

  if (violationCount && violationCount.count >= 5) {
    priority -= 1; // 惯犯
  }

  // 限制在1-10范围内
  return Math.max(1, Math.min(10, priority));
}

// 📊 管理员获取举报列表 (仅管理员可访问)
userReports.get('/admin/list', async (c) => {
  try {
    const { status, priority, content_type, page = '1', limit = '20' } = c.req.query();
    
    const db = c.env.DB;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        r.*,
        q.priority,
        q.status as queue_status,
        rep.reputation_score,
        rep.reputation_level
      FROM user_reports r
      LEFT JOIN report_review_queue q ON r.id = q.report_id
      LEFT JOIN reporter_reputation rep ON r.reporter_user_id = rep.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND q.priority <= ?';
      params.push(parseInt(priority));
    }

    if (content_type) {
      query += ' AND r.content_type = ?';
      params.push(content_type);
    }

    query += ' ORDER BY q.priority ASC, r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.results.length
      }
    });

  } catch (error) {
    console.error('获取举报列表失败:', error);
    return c.json({
      success: false,
      message: '获取举报列表失败'
    }, 500);
  }
});

// 📊 管理员获取恶意用户列表
userReports.get('/admin/malicious-users', async (c) => {
  try {
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT 
        user_id,
        total_reports,
        valid_reports,
        invalid_reports,
        malicious_reports,
        reputation_score,
        reputation_level,
        is_restricted,
        restriction_reason,
        last_report_at
      FROM reporter_reputation
      WHERE reputation_score < 50 OR malicious_reports > 0
      ORDER BY reputation_score ASC, malicious_reports DESC
    `).all();

    return c.json({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('获取恶意用户列表失败:', error);
    return c.json({
      success: false,
      message: '获取恶意用户列表失败'
    }, 500);
  }
});

export default userReports;

