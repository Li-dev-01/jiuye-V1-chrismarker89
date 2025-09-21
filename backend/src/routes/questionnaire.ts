import { Hono } from 'hono';
import type { Env, AuthContext, CreateQuestionnaireRequest, QuestionnaireResponse, EmploymentStatus } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export function createQuestionnaireRoutes() {
  const questionnaire = new Hono<{ Bindings: Env; Variables: AuthContext }>();

  // 提交问卷 (公开接口，不需要认证)
  questionnaire.post('/', optionalAuthMiddleware, async (c) => {
    try {
      const body = await c.req.json() as CreateQuestionnaireRequest;
      const {
        personalInfo,
        educationInfo,
        employmentInfo,
        jobSearchInfo,
        employmentStatus
      } = body;

      // 类型转换
      const employmentStatusTyped = employmentStatus as EmploymentStatus;

      // 验证必填字段
      if (!personalInfo || !educationInfo || !employmentInfo || !jobSearchInfo || !employmentStatus) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '请完整填写所有必填信息'
        }, 400);
      }

      // 验证个人信息
      if (!personalInfo.name || !personalInfo.gender || !personalInfo.age || 
          !personalInfo.phone || !personalInfo.email) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '个人基本信息不完整'
        }, 400);
      }

      // 验证教育信息
      if (!educationInfo.university || !educationInfo.major || 
          !educationInfo.degree || !educationInfo.graduationYear) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '教育背景信息不完整'
        }, 400);
      }

      // 验证就业意向
      if (!employmentInfo.preferredIndustry || employmentInfo.preferredIndustry.length === 0 ||
          !employmentInfo.preferredPosition || !employmentInfo.expectedSalary ||
          !employmentInfo.preferredLocation || employmentInfo.preferredLocation.length === 0 ||
          !employmentInfo.workExperience) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '就业意向信息不完整'
        }, 400);
      }

      // 验证求职信息
      if (!jobSearchInfo.searchChannels || jobSearchInfo.searchChannels.length === 0 ||
          jobSearchInfo.interviewCount === undefined || jobSearchInfo.offerCount === undefined ||
          jobSearchInfo.searchDuration === undefined) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '求职过程信息不完整'
        }, 400);
      }

      // 验证就业状态
      if (!employmentStatusTyped?.currentStatus) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '当前就业状态不能为空'
        }, 400);
      }

      // 如果已就业，验证相关字段
      if (employmentStatusTyped?.currentStatus === 'employed') {
        if (!employmentStatusTyped.currentCompany || !employmentStatusTyped.currentPosition) {
          return c.json({
            success: false,
            error: 'Validation Error',
            message: '已就业状态需要填写公司和职位信息'
          }, 400);
        }
      }

      const db = createDatabaseService(c.env as Env);
      const user = c.get('user'); // 可能为空（匿名提交）

      // 插入问卷数据
      const result = await db.execute(
        `INSERT INTO questionnaire_responses 
         (user_id, personal_info, education_info, employment_info, job_search_info, employment_status, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user?.id || null,
          JSON.stringify(personalInfo),
          JSON.stringify(educationInfo),
          JSON.stringify(employmentInfo),
          JSON.stringify(jobSearchInfo),
          JSON.stringify(employmentStatus),
          'pending' // 默认状态为待审核
        ]
      );

      if (!result.success) {
        throw new Error('Failed to insert questionnaire');
      }

      // 获取插入的问卷数据
      const newQuestionnaire = await db.queryFirst<QuestionnaireResponse>(
        'SELECT * FROM questionnaire_responses WHERE rowid = ?',
        [result.meta.last_row_id]
      );

      if (!newQuestionnaire) {
        throw new Error('Failed to retrieve questionnaire');
      }

      // 记录系统日志
      if (user) {
        await db.execute(
          `INSERT INTO system_logs (user_id, action, resource_type, resource_id, details, ip_address) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            'CREATE',
            'questionnaire',
            newQuestionnaire.id,
            JSON.stringify({ action: 'submit_questionnaire', timestamp: new Date().toISOString() }),
            c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
          ]
        );
      }

      return c.json({
        success: true,
        data: {
          id: newQuestionnaire.id,
          status: newQuestionnaire.status,
          createdAt: newQuestionnaire.created_at
        },
        message: '问卷提交成功，感谢您的参与！'
      }, 201);

    } catch (error: any) {
      console.error('Questionnaire submission error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '提交失败，请稍后重试'
      }, 500);
    }
  });

  // 获取问卷列表 (需要认证)
  questionnaire.get('/', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '10');
      const status = c.req.query('status');
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');

      const db = createDatabaseService(c.env as Env);

      // 构建查询条件
      let whereClause = '1=1';
      const params: any[] = [];

      // 根据用户角色过滤数据
      if (user.role === 'user') {
        whereClause += ' AND user_id = ?';
        params.push(user.id);
      }

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (startDate) {
        whereClause += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND created_at <= ?';
        params.push(endDate);
      }

      const sql = `SELECT * FROM questionnaire_responses WHERE ${whereClause} ORDER BY created_at DESC`;

      const result = await db.paginate<QuestionnaireResponse>(sql, params, page, pageSize);

      return c.json({
        success: true,
        data: result,
        message: '获取问卷列表成功'
      });

    } catch (error: any) {
      console.error('Get questionnaires error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷列表失败'
      }, 500);
    }
  });

  // 获取单个问卷详情 (需要认证)
  questionnaire.get('/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const user = c.get('user');
      const db = createDatabaseService(c.env as Env);

      let sql = 'SELECT * FROM questionnaire_responses WHERE id = ?';
      const params = [id];

      // 普通用户只能查看自己的问卷
      if (user.role === 'user') {
        sql += ' AND user_id = ?';
        params.push(String(user.id));
      }

      const questionnaire = await db.queryFirst<QuestionnaireResponse>(sql, params);

      if (!questionnaire) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '问卷不存在或无权访问'
        }, 404);
      }

      return c.json({
        success: true,
        data: questionnaire,
        message: '获取问卷详情成功'
      });

    } catch (error: any) {
      console.error('Get questionnaire error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷详情失败'
      }, 500);
    }
  });

  // 更新问卷状态 (需要审核员权限)
  questionnaire.put('/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const user = c.get('user');
      const body = await c.req.json();
      const { status, comment } = body;

      // 检查权限
      if (!['reviewer', 'admin', 'super_admin'].includes(user.role)) {
        return c.json({
          success: false,
          error: 'Forbidden',
          message: '权限不足'
        }, 403);
      }

      // 验证状态
      if (!['approved', 'rejected'].includes(status)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '无效的状态值'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 检查问卷是否存在
      const questionnaire = await db.queryFirst<QuestionnaireResponse>(
        'SELECT * FROM questionnaire_responses WHERE id = ?',
        [id]
      );

      if (!questionnaire) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '问卷不存在'
        }, 404);
      }

      // 更新问卷状态
      await db.execute(
        'UPDATE questionnaire_responses SET status = ? WHERE id = ?',
        [status, id]
      );

      // 记录审核记录
      await db.execute(
        'INSERT INTO reviews (questionnaire_id, reviewer_id, status, comment) VALUES (?, ?, ?, ?)',
        [id, user.id, status, comment || '']
      );

      // 记录系统日志
      await db.execute(
        `INSERT INTO system_logs (user_id, action, resource_type, resource_id, details, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          'UPDATE',
          'questionnaire',
          id,
          JSON.stringify({ 
            action: `${status}_questionnaire`, 
            comment,
            timestamp: new Date().toISOString() 
          }),
          c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
        ]
      );

      return c.json({
        success: true,
        data: { id, status },
        message: `问卷${status === 'approved' ? '审核通过' : '审核拒绝'}`
      });

    } catch (error: any) {
      console.error('Update questionnaire error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新问卷状态失败'
      }, 500);
    }
  });

  return questionnaire;
}
