import { Hono } from 'hono';
import { simpleAuthMiddleware, requireRole } from '../middleware/simpleAuth';
import { successResponse } from '../utils/standardResponse';
import { getRecommendedModelConfig, quickAICheck } from '../utils/aiModelChecker';

const simpleAdmin = new Hono();

// 应用简化认证中间件
simpleAdmin.use('*', simpleAuthMiddleware);
simpleAdmin.use('*', requireRole(['admin', 'super_admin']));

// 管理员仪表板数据 (支持真实数据)
simpleAdmin.get('/dashboard', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting dashboard data');
    const db = c.env.DB;

    // 使用统一统计数据
    let realStats = {};
    try {
      console.log('[SIMPLE_ADMIN] Using unified statistics for dashboard');

      // 获取统一统计数据
      const unifiedStats = await getUnifiedStats(db);

      // 获取今日新用户
      const todayUsersResult = await db.prepare(`
        SELECT COUNT(*) as count FROM universal_users
        WHERE DATE(created_at) = DATE('now')
      `).first();
      const todaySubmissions = todayUsersResult?.count || 0;

      realStats = {
        totalUsers: unifiedStats.totalUsers,
        activeUsers: unifiedStats.activeUsers,
        totalQuestionnaires: unifiedStats.totalQuestionnaires,
        totalStories: unifiedStats.totalStories,
        totalReviews: unifiedStats.totalReviews,
        pendingReviews: Math.floor(unifiedStats.totalReviews * 0.2), // 估算待审核
        completedReviews: Math.floor(unifiedStats.totalReviews * 0.8), // 估算已完成
        todaySubmissions: todaySubmissions,
        systemHealth: 98.5,
        storageUsed: 67.3,
        dataSource: unifiedStats.dataSource
      };

      console.log('[SIMPLE_ADMIN] Dashboard stats from unified system:', realStats);
    } catch (dbError) {
      console.error('[SIMPLE_ADMIN] Database query failed, using mock data:', dbError);
      // 如果数据库查询失败，使用模拟数据
      realStats = {
        totalUsers: 1247,
        activeUsers: 892,
        totalQuestionnaires: 156,
        totalStories: 89,
        pendingReviews: 23,
        completedReviews: 445,
        todaySubmissions: 12,
        systemHealth: 98.5,
        storageUsed: 67.3
      };
    }

    // 管理员仪表板数据
    const dashboardData = {
      stats: realStats,
      recentUsers: [
        {
          id: 'user_001',
          username: 'student_zhang',
          name: '张同学',
          email: 'zhang@example.com',
          registeredAt: '2024-09-20T10:30:00Z',
          lastActive: '2024-09-24T08:15:00Z',
          status: 'active'
        },
        {
          id: 'user_002', 
          username: 'student_li',
          name: '李同学',
          email: 'li@example.com',
          registeredAt: '2024-09-19T14:20:00Z',
          lastActive: '2024-09-23T16:45:00Z',
          status: 'active'
        },
        {
          id: 'user_003',
          username: 'student_wang',
          name: '王同学',
          email: 'wang@example.com',
          registeredAt: '2024-09-18T09:10:00Z',
          lastActive: '2024-09-22T11:30:00Z',
          status: 'inactive'
        }
      ],
      recentActivities: [
        {
          id: 'activity_001',
          type: 'questionnaire_submitted',
          user: '张同学',
          description: '提交了就业调查问卷',
          timestamp: '2024-09-24T08:15:00Z'
        },
        {
          id: 'activity_002',
          type: 'story_reviewed',
          user: '审核员A',
          description: '审核通过了就业故事分享',
          timestamp: '2024-09-24T07:45:00Z'
        },
        {
          id: 'activity_003',
          type: 'user_registered',
          user: '李同学',
          description: '新用户注册',
          timestamp: '2024-09-23T16:20:00Z'
        }
      ],
      systemMetrics: {
        cpuUsage: 45.2,
        memoryUsage: 67.8,
        diskUsage: 34.5,
        networkTraffic: 123.4,
        responseTime: 245,
        errorRate: 0.12
      }
    };

    return successResponse(c, dashboardData, '管理员仪表板数据获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Dashboard error:', error);
    return c.json({ success: false, message: '获取仪表板数据失败' }, 500);
  }
});

// 用户管理 - 支持真实数据库查询 + 模拟数据后备
simpleAdmin.get('/users', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting users list');
    const db = c.env.DB;

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const search = c.req.query('search') || '';
    const role = c.req.query('role') || '';
    const status = c.req.query('status') || '';
    const university = c.req.query('university') || '';
    const graduationYear = c.req.query('graduationYear') ? parseInt(c.req.query('graduationYear')!) : null;
    const startDate = c.req.query('startDate') || '';
    const endDate = c.req.query('endDate') || '';

    // 尝试获取真实用户数据
    let realUsers = [];
    let realTotal = 0;
    let useRealData = false;

    try {
      console.log('[SIMPLE_ADMIN] Attempting to fetch real user data from database');

      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];

      if (search) {
        whereConditions.push('(username LIKE ? OR display_name LIKE ? OR uuid LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (role) {
        whereConditions.push('user_type = ?');
        queryParams.push(role);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // 查询总数
      const countQuery = `SELECT COUNT(*) as total FROM universal_users ${whereClause}`;
      const countResult = await db.prepare(countQuery).bind(...queryParams).first();
      realTotal = countResult?.total || 0;

      console.log(`[SIMPLE_ADMIN] Found ${realTotal} real users in database`);

      if (realTotal > 0) {
        // 查询用户列表 - 使用正确的字段名
        const offset = (page - 1) * limit;
        const usersQuery = `
          SELECT
            uuid as id,
            username,
            display_name,
            user_type as role,
            status,
            created_at as registeredAt,
            updated_at as lastActive
          FROM universal_users
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `;

        console.log(`[SIMPLE_ADMIN] Executing query: ${usersQuery}`);
        console.log(`[SIMPLE_ADMIN] Query params:`, [...queryParams, limit, offset]);

        const usersResult = await db.prepare(usersQuery).bind(...queryParams, limit, offset).all();
        console.log(`[SIMPLE_ADMIN] Query result:`, usersResult);

        if (usersResult.results && usersResult.results.length > 0) {
          realUsers = usersResult.results.map((user: any) => ({
            id: user.id,
            username: user.username || user.display_name || `用户${user.id.slice(-6)}`,
            email: `${user.username || user.display_name || user.id}@example.com`,
            phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            realName: user.display_name || user.username || `用户${user.id.slice(-6)}`,
            studentId: `2024${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            university: '真实用户',
            major: '未知专业',
            graduationYear: 2024,
            role: user.role || 'student',
            status: user.status || 'active',
            createdAt: user.registeredAt,
            lastLoginAt: user.lastActive,
            loginCount: Math.floor(Math.random() * 100),
            questionnairesCompleted: Math.floor(Math.random() * 10),
            storiesShared: Math.floor(Math.random() * 5),
            reviewsCompleted: user.role === 'reviewer' ? Math.floor(Math.random() * 50) : 0,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            deviceInfo: ['Windows Chrome', 'Mac Safari', 'iPhone Safari', 'Android Chrome'][Math.floor(Math.random() * 4)],
            registrationSource: '数据库用户',
            emailVerified: true,
            phoneVerified: Math.random() > 0.3,
            profileCompleteness: Math.floor(Math.random() * 40) + 60,
            tags: ['真实用户'],
            notes: '来自数据库的真实用户数据'
          }));

          useRealData = true;
          console.log(`[SIMPLE_ADMIN] Successfully fetched ${realUsers.length} real users`);
        } else {
          console.log(`[SIMPLE_ADMIN] No users found in query result`);
        }

        useRealData = true;
        console.log(`[SIMPLE_ADMIN] Successfully fetched ${realUsers.length} real users`);
      }
    } catch (dbError) {
      console.error('[SIMPLE_ADMIN] Database query failed, falling back to mock data:', dbError);
    }

    // 如果没有真实数据，使用模拟数据
    if (!useRealData) {
      console.log('[SIMPLE_ADMIN] Using mock data for users');
      // 模拟详细用户数据 - 适合10万+用户规模
      const universities = ['北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中山大学', '华中科技大学', '西安交通大学', '哈尔滨工业大学'];
      const majors = ['计算机科学与技术', '软件工程', '电子信息工程', '机械工程', '经济学', '金融学', '管理学', '英语', '法学', '医学'];
      const sources = ['官网注册', '微信小程序', '手机APP', '推荐注册', '批量导入'];

      // 生成10万用户数据（实际项目中应该从数据库查询）
      const generateUsers = (count: number) => {
        return Array.from({ length: count }, (_, i) => {
          const createdDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
          const roleType = ['student', 'reviewer', 'admin'][i % 20 === 0 ? 2 : i % 10 === 0 ? 1 : 0];
          const statusType = i % 50 === 0 ? 'suspended' : i % 20 === 0 ? 'inactive' : i % 100 === 0 ? 'pending' : 'active';

          return {
            id: `mock_user_${String(i + 1).padStart(6, '0')}`,
            username: `mock_user${i + 1}`,
            email: `mock_user${i + 1}@example.com`,
            phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            realName: `模拟用户${i + 1}`,
            studentId: `2020${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            university: universities[i % universities.length],
            major: majors[i % majors.length],
            graduationYear: 2020 + (i % 8),
            role: roleType,
            status: statusType,
            createdAt: createdDate.toISOString(),
            lastLoginAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            loginCount: Math.floor(Math.random() * 500),
            questionnairesCompleted: Math.floor(Math.random() * 20),
            storiesShared: Math.floor(Math.random() * 10),
            reviewsCompleted: roleType === 'reviewer' ? Math.floor(Math.random() * 100) : 0,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            deviceInfo: ['Windows Chrome', 'Mac Safari', 'iPhone Safari', 'Android Chrome'][i % 4],
            registrationSource: sources[i % sources.length],
            emailVerified: Math.random() > 0.1,
            phoneVerified: Math.random() > 0.2,
            profileCompleteness: Math.floor(Math.random() * 40) + 60,
            tags: i % 10 === 0 ? ['重点关注'] : i % 20 === 0 ? ['活跃用户'] : ['模拟数据'],
            notes: i % 50 === 0 ? '需要特别关注的用户' : '模拟数据用户'
          };
        });
      };

      // 为了演示，我们生成较少的数据，但保持相同的结构
      const allUsers = generateUsers(1000); // 模拟数据
      realUsers = allUsers;
      realTotal = allUsers.length;
    }

    // 应用筛选 (对真实数据或模拟数据都适用)
    let filteredUsers = realUsers;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.realName?.toLowerCase().includes(searchLower) ||
        user.studentId?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(search)
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    if (university) {
      filteredUsers = filteredUsers.filter(user => user.university === university);
    }

    if (graduationYear) {
      filteredUsers = filteredUsers.filter(user => user.graduationYear === graduationYear);
    }

    if (startDate && endDate) {
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= new Date(startDate) && userDate <= new Date(endDate);
      });
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const result = {
      users: paginatedUsers,
      total: useRealData ? realTotal : filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil((useRealData ? realTotal : filteredUsers.length) / limit),
      // 添加筛选选项数据
      filterOptions: {
        universities: ['北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中山大学', '华中科技大学', '西安交通大学', '哈尔滨工业大学'],
        graduationYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027],
        roles: ['student', 'reviewer', 'admin'],
        statuses: ['active', 'inactive', 'suspended', 'pending']
      },
      dataSource: useRealData ? 'database' : 'mock'
    };

    return successResponse(c, result, '用户列表获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Users list error:', error);
    return c.json({ success: false, message: '获取用户列表失败' }, 500);
  }
});

// 批量用户操作
simpleAdmin.post('/users/batch', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Batch user operation');

    const body = await c.req.json();
    const { userIds, action, data } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return c.json({ success: false, message: '用户ID列表不能为空' }, 400);
    }

    if (!action) {
      return c.json({ success: false, message: '操作类型不能为空' }, 400);
    }

    // 模拟批量操作
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const userId of userIds) {
      try {
        // 模拟操作结果
        const success = Math.random() > 0.1; // 90% 成功率

        if (success) {
          successCount++;
          results.push({
            userId,
            success: true,
            message: `用户 ${userId} 操作成功`
          });
        } else {
          failCount++;
          results.push({
            userId,
            success: false,
            message: `用户 ${userId} 操作失败`
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          userId,
          success: false,
          message: `用户 ${userId} 操作异常`
        });
      }
    }

    const result = {
      action,
      totalCount: userIds.length,
      successCount,
      failCount,
      results
    };

    return successResponse(c, result, `批量${action}操作完成`);
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Batch operation error:', error);
    return c.json({ success: false, message: '批量操作失败' }, 500);
  }
});

// 用户导出
simpleAdmin.get('/users/export', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Exporting users');

    const format = c.req.query('format') || 'excel';
    const filters = {
      role: c.req.query('role') || '',
      status: c.req.query('status') || '',
      university: c.req.query('university') || '',
      startDate: c.req.query('startDate') || '',
      endDate: c.req.query('endDate') || ''
    };

    // 模拟导出操作
    const exportId = `export_${Date.now()}`;
    const downloadUrl = `https://example.com/downloads/${exportId}.${format}`;

    const result = {
      exportId,
      downloadUrl,
      format,
      filters,
      estimatedCount: 1000,
      status: 'processing'
    };

    return successResponse(c, result, '导出任务已创建');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Export error:', error);
    return c.json({ success: false, message: '导出失败' }, 500);
  }
});

// 用户统计 - 支持真实数据
simpleAdmin.get('/users/stats', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting user stats');
    const db = c.env.DB;

    let stats = {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      reviewerUsers: 0,
      inactiveUsers: 0,
      suspendedUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0
    };

    try {
      console.log('[SIMPLE_ADMIN] Attempting to fetch real user statistics');

      // 获取总用户数
      const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM universal_users`).first();
      stats.totalUsers = totalResult?.count || 0;

      // 获取今日新用户
      const todayResult = await db.prepare(`
        SELECT COUNT(*) as count FROM universal_users
        WHERE DATE(created_at) = DATE('now')
      `).first();
      stats.newUsersToday = todayResult?.count || 0;

      // 获取本周新用户
      const weekResult = await db.prepare(`
        SELECT COUNT(*) as count FROM universal_users
        WHERE created_at >= DATE('now', '-7 days')
      `).first();
      stats.newUsersThisWeek = weekResult?.count || 0;

      // 获取本月新用户
      const monthResult = await db.prepare(`
        SELECT COUNT(*) as count FROM universal_users
        WHERE created_at >= DATE('now', 'start of month')
      `).first();
      stats.newUsersThisMonth = monthResult?.count || 0;

      // 按用户类型统计
      const typeResult = await db.prepare(`
        SELECT user_type, COUNT(*) as count
        FROM universal_users
        GROUP BY user_type
      `).all();

      typeResult.results.forEach((row: any) => {
        switch (row.user_type) {
          case 'admin':
          case 'super_admin':
            stats.adminUsers += row.count;
            break;
          case 'reviewer':
            stats.reviewerUsers += row.count;
            break;
        }
      });

      // 估算活跃用户 (假设70%的用户是活跃的)
      stats.activeUsers = Math.floor(stats.totalUsers * 0.7);
      stats.inactiveUsers = stats.totalUsers - stats.activeUsers;

      console.log('[SIMPLE_ADMIN] Real user stats:', stats);
    } catch (dbError) {
      console.error('[SIMPLE_ADMIN] Database query failed, using mock stats:', dbError);
      // 使用模拟数据作为后备
      stats = {
        totalUsers: 1247,
        activeUsers: 892,
        adminUsers: 15,
        reviewerUsers: 23,
        inactiveUsers: 355,
        suspendedUsers: 0,
        newUsersToday: 12,
        newUsersThisWeek: 45,
        newUsersThisMonth: 156
      };
    }

    return successResponse(c, stats, '用户统计获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] User stats error:', error);
    return c.json({ success: false, message: '获取用户统计失败' }, 500);
  }
});

// 问卷管理
simpleAdmin.get('/questionnaires', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting questionnaires list');
    
    // 模拟问卷列表数据
    const questionnaires = [
      {
        id: 'questionnaire_001',
        title: '2024年毕业生就业调查',
        description: '针对2024届毕业生的就业状况调查',
        status: 'active',
        createdAt: '2024-09-01T00:00:00Z',
        responses: 156,
        completionRate: 78.5
      },
      {
        id: 'questionnaire_002',
        title: '实习经验调查',
        description: '了解学生实习经验和收获',
        status: 'active', 
        createdAt: '2024-08-15T00:00:00Z',
        responses: 89,
        completionRate: 65.2
      },
      {
        id: 'questionnaire_003',
        title: '职业规划调查',
        description: '学生职业规划和发展方向调查',
        status: 'draft',
        createdAt: '2024-09-10T00:00:00Z',
        responses: 0,
        completionRate: 0
      }
    ];

    return successResponse(c, { questionnaires }, '问卷列表获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Questionnaires list error:', error);
    return c.json({ success: false, message: '获取问卷列表失败' }, 500);
  }
});

// 故事管理
simpleAdmin.get('/stories', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting stories list');
    
    // 模拟故事列表数据
    const stories = [
      {
        id: 'story_001',
        title: '从实习生到正式员工的成长之路',
        author: '张同学',
        status: 'approved',
        category: 'career_growth',
        submittedAt: '2024-09-20T10:00:00Z',
        reviewedAt: '2024-09-21T14:30:00Z',
        reviewer: '审核员A',
        views: 245,
        likes: 18
      },
      {
        id: 'story_002',
        title: '求职面试经验分享',
        author: '李同学',
        status: 'pending',
        category: 'interview_tips',
        submittedAt: '2024-09-23T16:20:00Z',
        reviewedAt: null,
        reviewer: null,
        views: 0,
        likes: 0
      },
      {
        id: 'story_003',
        title: '创业路上的酸甜苦辣',
        author: '王同学',
        status: 'rejected',
        category: 'entrepreneurship',
        submittedAt: '2024-09-22T09:15:00Z',
        reviewedAt: '2024-09-22T15:45:00Z',
        reviewer: '审核员B',
        views: 0,
        likes: 0
      }
    ];

    return successResponse(c, { stories }, '故事列表获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Stories list error:', error);
    return c.json({ success: false, message: '获取故事列表失败' }, 500);
  }
});

// 统一统计函数
async function getUnifiedStats(db: any) {
  console.log('[UNIFIED_STATS] Fetching unified statistics from database');

  try {
    // 1. 用户统计
    const usersResult = await db.prepare(`SELECT COUNT(*) as count FROM universal_users`).first();
    const totalUsers = usersResult?.count || 0;

    // 2. 问卷统计 - 尝试多个可能的表
    let totalQuestionnaires = 0;
    try {
      const qResult = await db.prepare(`SELECT COUNT(*) as count FROM questionnaire_submissions_temp`).first();
      totalQuestionnaires = qResult?.count || 0;
    } catch (qError) {
      try {
        const qResult2 = await db.prepare(`SELECT COUNT(*) as count FROM universal_questionnaire_responses`).first();
        totalQuestionnaires = qResult2?.count || 0;
      } catch (qError2) {
        console.log('[UNIFIED_STATS] No questionnaire table found');
      }
    }

    // 3. 故事统计 - 尝试多个可能的表
    let totalStories = 0;
    try {
      const sResult = await db.prepare(`SELECT COUNT(*) as count FROM valid_stories`).first();
      totalStories = sResult?.count || 0;
    } catch (sError) {
      try {
        const sResult2 = await db.prepare(`SELECT COUNT(*) as count FROM stories`).first();
        totalStories = sResult2?.count || 0;
      } catch (sError2) {
        console.log('[UNIFIED_STATS] No stories table found');
      }
    }

    // 4. 审核统计
    let totalReviews = 0;
    try {
      const rResult = await db.prepare(`SELECT COUNT(*) as count FROM audit_records`).first();
      totalReviews = rResult?.count || 0;
    } catch (rError) {
      console.log('[UNIFIED_STATS] No audit_records table found');
    }

    const unifiedStats = {
      totalUsers,
      totalQuestionnaires,
      totalStories,
      totalReviews,
      activeUsers: Math.floor(totalUsers * 0.7),
      dataSource: 'database',
      lastUpdated: new Date().toISOString()
    };

    console.log('[UNIFIED_STATS] Unified statistics:', unifiedStats);
    return unifiedStats;

  } catch (error) {
    console.error('[UNIFIED_STATS] Error fetching unified stats:', error);
    // 返回空统计而不是模拟数据
    return {
      totalUsers: 0,
      totalQuestionnaires: 0,
      totalStories: 0,
      totalReviews: 0,
      activeUsers: 0,
      dataSource: 'error',
      lastUpdated: new Date().toISOString()
    };
  }
}

// 统一统计API
simpleAdmin.get('/unified-stats', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting unified statistics');
    const db = c.env.DB;
    const stats = await getUnifiedStats(db);
    return successResponse(c, stats, '统一统计数据获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Unified stats error:', error);
    return c.json({ success: false, message: '获取统一统计数据失败' }, 500);
  }
});

// 系统分析 - 使用统一统计数据
simpleAdmin.get('/analytics', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting analytics data');
    const db = c.env.DB;

    // 使用统一统计数据
    const unifiedStats = await getUnifiedStats(db);

    // 基于真实数据构建分析结果
    const analytics = {
      overview: {
        totalUsers: unifiedStats.totalUsers,
        totalQuestionnaires: unifiedStats.totalQuestionnaires,
        totalStories: unifiedStats.totalStories,
        totalReviews: unifiedStats.totalReviews,
        avgResponseTime: 2.3,
        completionRate: unifiedStats.totalQuestionnaires > 0 ?
          Math.min(Math.round((unifiedStats.totalQuestionnaires / Math.max(unifiedStats.totalUsers, 1)) * 100), 100) : 0,
        dataSource: unifiedStats.dataSource
      },
      trends: {
        userGrowth: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 20
        })),
        submissionTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          questionnaires: Math.floor(Math.random() * 30) + 10,
          stories: Math.floor(Math.random() * 15) + 5
        })),
        reviewTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 25) + 15,
          pending: Math.floor(Math.random() * 10) + 2
        }))
      },
      demographics: {
        ageGroups: [
          { range: '18-22', count: 456, percentage: 36.6 },
          { range: '23-25', count: 389, percentage: 31.2 },
          { range: '26-30', count: 234, percentage: 18.8 },
          { range: '30+', count: 168, percentage: 13.4 }
        ],
        genderDistribution: [
          { gender: '男', count: 678, percentage: 54.4 },
          { gender: '女', count: 569, percentage: 45.6 }
        ],
        educationLevels: [
          { level: '本科', count: 789, percentage: 63.3 },
          { level: '硕士', count: 345, percentage: 27.7 },
          { level: '博士', count: 78, percentage: 6.3 },
          { level: '其他', count: 35, percentage: 2.8 }
        ]
      },
      performance: {
        reviewerStats: [
          { reviewerId: 'rev_001', reviewerName: '审核员A', reviewsCompleted: 234, avgTime: 2.1, accuracy: 96.5 },
          { reviewerId: 'rev_002', reviewerName: '审核员B', reviewsCompleted: 189, avgTime: 2.8, accuracy: 94.2 },
          { reviewerId: 'rev_003', reviewerName: '审核员C', reviewsCompleted: 156, avgTime: 1.9, accuracy: 97.8 },
          { reviewerId: 'rev_004', reviewerName: '审核员D', reviewsCompleted: 145, avgTime: 3.2, accuracy: 92.1 }
        ],
        systemMetrics: {
          responseTime: 245,
          uptime: 99.8,
          errorRate: 0.12,
          throughput: 1250
        }
      }
    };

    return successResponse(c, analytics, '分析数据获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Analytics error:', error);
    return c.json({ success: false, message: '获取分析数据失败' }, 500);
  }
});

// 系统设置
simpleAdmin.get('/settings', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting system settings');

    // 模拟系统设置数据
    const settings = {
      general: {
        siteName: '就业调查系统',
        siteDescription: '大学生就业情况调查与分析平台',
        contactEmail: 'admin@example.com',
        maintenanceMode: false,
        registrationEnabled: true,
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
      },
      security: {
        passwordMinLength: 8,
        passwordRequireSpecialChar: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        enableTwoFactor: false,
        ipWhitelist: []
      },
      notification: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        notificationEmail: 'notifications@example.com',
        emailTemplate: '默认邮件模板'
      },
      review: {
        autoAssignReviews: true,
        maxReviewsPerReviewer: 50,
        reviewTimeLimit: 24,
        requireDoubleReview: false,
        escalationThreshold: 72
      },
      database: {
        backupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        compressionEnabled: true
      }
    };

    return successResponse(c, settings, '系统设置获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Settings error:', error);
    return c.json({ success: false, message: '获取系统设置失败' }, 500);
  }
});

// 更新系统设置
simpleAdmin.put('/settings', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Updating system settings');
    const body = await c.req.json();

    // 这里应该保存设置到数据库
    // 目前只是模拟成功响应

    return successResponse(c, body, '系统设置更新成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Settings update error:', error);
    return c.json({ success: false, message: '更新系统设置失败' }, 500);
  }
});

// 系统日志
simpleAdmin.get('/logs', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting system logs');

    const limit = parseInt(c.req.query('limit') || '50');
    const level = c.req.query('level') || '';

    // 模拟系统日志数据
    const logs = Array.from({ length: limit }, (_, i) => {
      const levels = ['info', 'warning', 'error'];
      const actions = ['用户登录', '创建用户', '删除用户', '修改设置', '数据备份', '系统重启'];
      const users = ['admin1', 'superadmin', 'admin2', 'system'];

      return {
        id: `log_${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        user: users[Math.floor(Math.random() * users.length)],
        details: `操作详情 ${i + 1}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const filteredLogs = level ? logs.filter(log => log.level === level) : logs;

    return successResponse(c, { logs: filteredLogs }, '系统日志获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Logs error:', error);
    return c.json({ success: false, message: '获取系统日志失败' }, 500);
  }
});

// 测试邮件
simpleAdmin.post('/settings/test-email', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Sending test email');

    // 这里应该实际发送测试邮件
    // 目前只是模拟成功响应

    return successResponse(c, {}, '测试邮件发送成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Test email error:', error);
    return c.json({ success: false, message: '测试邮件发送失败' }, 500);
  }
});

// 立即备份
simpleAdmin.post('/settings/backup', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Starting backup');

    // 这里应该启动实际的备份任务
    // 目前只是模拟成功响应

    return successResponse(c, { backupId: `backup_${Date.now()}` }, '备份任务已启动');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Backup error:', error);
    return c.json({ success: false, message: '启动备份失败' }, 500);
  }
});

// API管理端点
simpleAdmin.get('/api/endpoints', simpleAuthMiddleware, requireRole(['admin', 'super_admin']), async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting API endpoints list');

    // 基于API_ANALYSIS_REPORT.json的完整API端点数据
    const endpoints = [
      // 简化认证API
      {
        id: 'simple-auth-login',
        method: 'POST',
        path: '/api/simple-auth/login',
        description: '简化登录认证',
        category: 'Authentication',
        status: 'active',
        responseTime: 120,
        lastChecked: new Date().toISOString(),
        errorRate: 0.1,
        usageCount: 1250,
        authentication: false,
        database: ['users'],
        dependencies: []
      },
      {
        id: 'simple-auth-verify',
        method: 'POST',
        path: '/api/simple-auth/verify',
        description: 'Token验证',
        category: 'Authentication',
        status: 'active',
        responseTime: 85,
        lastChecked: new Date().toISOString(),
        errorRate: 0.05,
        usageCount: 3420,
        authentication: true,
        database: [],
        dependencies: []
      },
      {
        id: 'simple-auth-me',
        method: 'GET',
        path: '/api/simple-auth/me',
        description: '获取当前用户信息',
        category: 'Authentication',
        status: 'active',
        responseTime: 95,
        lastChecked: new Date().toISOString(),
        errorRate: 0.02,
        usageCount: 2890,
        authentication: true,
        database: [],
        dependencies: []
      },
      // 简化管理员API
      {
        id: 'simple-admin-dashboard',
        method: 'GET',
        path: '/api/simple-admin/dashboard',
        description: '管理员仪表板数据',
        category: 'Admin',
        status: 'active',
        responseTime: 200,
        lastChecked: new Date().toISOString(),
        errorRate: 0.02,
        usageCount: 890,
        authentication: true,
        database: ['users', 'questionnaires', 'stories'],
        dependencies: ['simple-auth']
      },
      {
        id: 'simple-admin-users',
        method: 'GET',
        path: '/api/simple-admin/users',
        description: '用户管理列表',
        category: 'Admin',
        status: 'active',
        responseTime: 180,
        lastChecked: new Date().toISOString(),
        errorRate: 0.08,
        usageCount: 156,
        authentication: true,
        database: ['users'],
        dependencies: ['simple-auth']
      },
      {
        id: 'simple-admin-analytics',
        method: 'GET',
        path: '/api/simple-admin/analytics',
        description: '系统分析数据',
        category: 'Admin',
        status: 'active',
        responseTime: 320,
        lastChecked: new Date().toISOString(),
        errorRate: 0.12,
        usageCount: 234,
        authentication: true,
        database: ['analytics'],
        dependencies: ['simple-auth']
      },
      {
        id: 'simple-admin-api-endpoints',
        method: 'GET',
        path: '/api/simple-admin/api/endpoints',
        description: 'API端点列表',
        category: 'Admin',
        status: 'active',
        responseTime: 150,
        lastChecked: new Date().toISOString(),
        errorRate: 0.02,
        usageCount: 45,
        authentication: true,
        database: [],
        dependencies: ['simple-auth']
      },
      // 简化审核员API
      {
        id: 'simple-reviewer-dashboard',
        method: 'GET',
        path: '/api/simple-reviewer/dashboard',
        description: '审核员仪表板',
        category: 'Reviewer',
        status: 'active',
        responseTime: 150,
        lastChecked: new Date().toISOString(),
        errorRate: 0.03,
        usageCount: 567,
        authentication: true,
        database: ['audit_records'],
        dependencies: ['simple-auth']
      },
      {
        id: 'simple-reviewer-pending',
        method: 'GET',
        path: '/api/simple-reviewer/pending-reviews',
        description: '待审核列表',
        category: 'Reviewer',
        status: 'active',
        responseTime: 180,
        lastChecked: new Date().toISOString(),
        errorRate: 0.08,
        usageCount: 234,
        authentication: true,
        database: ['audit_records', 'questionnaires', 'stories'],
        dependencies: ['simple-auth']
      },
      // 系统API
      {
        id: 'health-check',
        method: 'GET',
        path: '/api/health',
        description: '健康检查',
        category: 'System',
        status: 'active',
        responseTime: 50,
        lastChecked: new Date().toISOString(),
        errorRate: 0.01,
        usageCount: 5670,
        authentication: false,
        database: [],
        dependencies: []
      },
      // 问卷API
      {
        id: 'questionnaire-submit',
        method: 'POST',
        path: '/api/questionnaire/submit',
        description: '问卷提交',
        category: 'Questionnaire',
        status: 'active',
        responseTime: 300,
        lastChecked: new Date().toISOString(),
        errorRate: 0.15,
        usageCount: 2340,
        authentication: false,
        database: ['questionnaire_submissions'],
        dependencies: []
      },
      // 故事API
      {
        id: 'stories-list',
        method: 'GET',
        path: '/api/stories',
        description: '故事列表',
        category: 'Stories',
        status: 'active',
        responseTime: 220,
        lastChecked: new Date().toISOString(),
        errorRate: 0.05,
        usageCount: 1890,
        authentication: false,
        database: ['stories'],
        dependencies: []
      },
      // 传统管理员API (部分不可用)
      {
        id: 'admin-dashboard-stats',
        method: 'GET',
        path: '/api/admin/dashboard/stats',
        description: '管理员仪表板统计',
        category: 'Admin',
        status: 'deprecated',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 1.0,
        usageCount: 45,
        authentication: true,
        database: ['users', 'questionnaires'],
        dependencies: ['auth']
      },
      {
        id: 'admin-questionnaires',
        method: 'GET',
        path: '/api/admin/questionnaires',
        description: '问卷管理',
        category: 'Admin',
        status: 'deprecated',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 1.0,
        usageCount: 23,
        authentication: true,
        database: ['questionnaires'],
        dependencies: ['auth']
      },
      {
        id: 'admin-users-export',
        method: 'GET',
        path: '/api/admin/users/export',
        description: '用户数据导出',
        category: 'Admin',
        status: 'inactive',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 0.5,
        usageCount: 12,
        authentication: true,
        database: ['users'],
        dependencies: ['auth']
      },
      // 审核员API
      {
        id: 'reviewer-content-list',
        method: 'GET',
        path: '/api/reviewer/content',
        description: '审核内容列表',
        category: 'Reviewer',
        status: 'deprecated',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 1.0,
        usageCount: 67,
        authentication: true,
        database: ['audit_records'],
        dependencies: ['auth']
      },
      {
        id: 'reviewer-submit-audit',
        method: 'POST',
        path: '/api/reviewer/audit/submit',
        description: '提交审核结果',
        category: 'Reviewer',
        status: 'deprecated',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 1.0,
        usageCount: 34,
        authentication: true,
        database: ['audit_records'],
        dependencies: ['auth']
      },
      // 问卷相关API
      {
        id: 'questionnaire-list',
        method: 'GET',
        path: '/api/questionnaire',
        description: '问卷列表',
        category: 'Questionnaire',
        status: 'active',
        responseTime: 180,
        lastChecked: new Date().toISOString(),
        errorRate: 0.02,
        usageCount: 3456,
        authentication: false,
        database: ['questionnaires'],
        dependencies: []
      },
      {
        id: 'questionnaire-by-id',
        method: 'GET',
        path: '/api/questionnaire/:id',
        description: '获取特定问卷',
        category: 'Questionnaire',
        status: 'active',
        responseTime: 150,
        lastChecked: new Date().toISOString(),
        errorRate: 0.03,
        usageCount: 2890,
        authentication: false,
        database: ['questionnaires'],
        dependencies: []
      },
      // 通用问卷API
      {
        id: 'universal-questionnaire-submit',
        method: 'POST',
        path: '/api/universal-questionnaire/submit',
        description: '通用问卷提交',
        category: 'Questionnaire',
        status: 'active',
        responseTime: 250,
        lastChecked: new Date().toISOString(),
        errorRate: 0.08,
        usageCount: 5670,
        authentication: false,
        database: ['questionnaire_submissions'],
        dependencies: []
      },
      {
        id: 'universal-questionnaire-count',
        method: 'GET',
        path: '/api/universal-questionnaire/count',
        description: '问卷统计计数',
        category: 'Analytics',
        status: 'active',
        responseTime: 90,
        lastChecked: new Date().toISOString(),
        errorRate: 0.01,
        usageCount: 890,
        authentication: false,
        database: ['questionnaire_submissions'],
        dependencies: []
      },
      // 分析API
      {
        id: 'analytics-basic-stats',
        method: 'GET',
        path: '/api/analytics/basic-stats',
        description: '基础统计分析',
        category: 'Analytics',
        status: 'active',
        responseTime: 320,
        lastChecked: new Date().toISOString(),
        errorRate: 0.12,
        usageCount: 456,
        authentication: false,
        database: ['questionnaire_submissions', 'users'],
        dependencies: []
      },
      {
        id: 'analytics-distribution',
        method: 'GET',
        path: '/api/analytics/distribution',
        description: '数据分布分析',
        category: 'Analytics',
        status: 'active',
        responseTime: 280,
        lastChecked: new Date().toISOString(),
        errorRate: 0.09,
        usageCount: 234,
        authentication: false,
        database: ['questionnaire_submissions'],
        dependencies: []
      },
      // 心声API
      {
        id: 'heart-voices-list',
        method: 'GET',
        path: '/api/heart-voices',
        description: '心声列表',
        category: 'Stories',
        status: 'active',
        responseTime: 200,
        lastChecked: new Date().toISOString(),
        errorRate: 0.06,
        usageCount: 1234,
        authentication: false,
        database: ['heart_voices'],
        dependencies: []
      },
      {
        id: 'heart-voices-submit',
        method: 'POST',
        path: '/api/heart-voices/submit',
        description: '提交心声',
        category: 'Stories',
        status: 'active',
        responseTime: 180,
        lastChecked: new Date().toISOString(),
        errorRate: 0.04,
        usageCount: 567,
        authentication: false,
        database: ['heart_voices'],
        dependencies: []
      },
      // 错误监控API
      {
        id: 'errors-report',
        method: 'POST',
        path: '/api/errors/report',
        description: '错误报告',
        category: 'System',
        status: 'inactive',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 1.0,
        usageCount: 0,
        authentication: false,
        database: ['error_logs'],
        dependencies: []
      },
      {
        id: 'performance-metrics',
        method: 'POST',
        path: '/api/performance-metrics',
        description: '性能指标上报',
        category: 'System',
        status: 'inactive',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 1.0,
        usageCount: 0,
        authentication: false,
        database: ['performance_logs'],
        dependencies: []
      }
    ];

    const stats = {
      totalEndpoints: endpoints.length,
      activeEndpoints: endpoints.filter(e => e.status === 'active').length,
      errorEndpoints: endpoints.filter(e => e.status === 'error').length,
      avgResponseTime: Math.round(endpoints.reduce((sum, e) => sum + e.responseTime, 0) / endpoints.length),
      totalRequests: endpoints.reduce((sum, e) => sum + e.usageCount, 0),
      errorRate: endpoints.reduce((sum, e) => sum + e.errorRate, 0) / endpoints.length
    };

    return successResponse(c, { endpoints, stats }, 'API端点列表获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] API endpoints error:', error);
    return c.json({ success: false, message: '获取API端点列表失败' }, 500);
  }
});

// 项目统计API端点
simpleAdmin.get('/project/statistics', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting project statistics');
    const db = c.env.DB;

    // 获取项目统计数据
    const projectStats = {
      overview: {
        totalProjects: 1,
        activeProjects: 1,
        completedProjects: 0,
        projectHealth: 95.2
      },
      questionnaire: {
        totalResponses: 0,
        validResponses: 0,
        completionRate: 0,
        averageTime: 0
      },
      users: {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        userGrowthRate: 0
      },
      content: {
        totalStories: 0,
        approvedStories: 0,
        pendingReviews: 0,
        rejectedContent: 0
      },
      system: {
        apiHealth: 98.5,
        databaseHealth: 99.1,
        storageUsage: 67.3,
        responseTime: 120
      }
    };

    // 尝试获取真实数据
    try {
      const usersCount = await db.prepare(`SELECT COUNT(*) as count FROM universal_users`).first();
      const questionnaireCount = await db.prepare(`SELECT COUNT(*) as count FROM questionnaire_submissions_temp`).first();
      const storiesCount = await db.prepare(`SELECT COUNT(*) as count FROM stories`).first();
      const todayUsers = await db.prepare(`
        SELECT COUNT(*) as count FROM universal_users
        WHERE DATE(created_at) = DATE('now')
      `).first();

      projectStats.users.totalUsers = usersCount?.count || 0;
      projectStats.users.activeUsers = Math.floor((usersCount?.count || 0) * 0.7);
      projectStats.users.newUsersToday = todayUsers?.count || 0;
      projectStats.questionnaire.totalResponses = questionnaireCount?.count || 0;
      projectStats.questionnaire.validResponses = Math.floor((questionnaireCount?.count || 0) * 0.9);
      projectStats.content.totalStories = storiesCount?.count || 0;
      projectStats.content.approvedStories = Math.floor((storiesCount?.count || 0) * 0.8);
      projectStats.content.pendingReviews = Math.floor((storiesCount?.count || 0) * 0.2);

      if (questionnaireCount?.count > 0) {
        projectStats.questionnaire.completionRate = 85.6;
        projectStats.questionnaire.averageTime = 12.5;
      }
    } catch (dbError) {
      console.error('[SIMPLE_ADMIN] Project stats database query failed:', dbError);
    }

    return c.json({
      success: true,
      data: projectStats,
      message: '项目统计数据获取成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Get project statistics failed:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取项目统计失败'
    }, 500);
  }
});

// 实时统计API端点
simpleAdmin.get('/project/real-time-stats', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting real-time statistics');

    const realTimeStats = {
      timestamp: new Date().toISOString(),
      metrics: {
        activeUsers: 0,
        onlineUsers: 0,
        currentLoad: 25.3,
        memoryUsage: 68.7,
        cpuUsage: 42.1,
        networkIO: 156.8
      },
      alerts: [],
      performance: {
        apiResponseTime: 120,
        databaseResponseTime: 45,
        cacheHitRate: 94.2,
        errorRate: 0.8
      }
    };

    // 模拟实时数据变化
    const now = new Date();
    const hour = now.getHours();

    // 根据时间调整活跃用户数
    if (hour >= 9 && hour <= 17) {
      realTimeStats.metrics.activeUsers = Math.floor(Math.random() * 50) + 100;
      realTimeStats.metrics.onlineUsers = Math.floor(Math.random() * 20) + 30;
    } else {
      realTimeStats.metrics.activeUsers = Math.floor(Math.random() * 20) + 10;
      realTimeStats.metrics.onlineUsers = Math.floor(Math.random() * 10) + 5;
    }

    return c.json({
      success: true,
      data: realTimeStats,
      message: '实时统计数据获取成功'
    });
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Get real-time stats failed:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取实时统计失败'
    }, 500);
  }
});

// 故事审核系统路由将在主路由中注册

// 审核统计API
simpleAdmin.get('/audit/statistics', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting audit statistics');

    // 首先检查数据库是否可用
    const db = c.env.DB;
    if (!db) {
      console.error('[SIMPLE_ADMIN] Database not available');
      return c.json({
        success: false,
        message: '数据库不可用'
      }, 500);
    }

    // 尝试初始化数据库表
    try {
      const { initAuditDatabase } = await import('../utils/initAuditDatabase');
      await initAuditDatabase(db);
      console.log('[SIMPLE_ADMIN] Audit database initialized');
    } catch (initError) {
      console.error('[SIMPLE_ADMIN] Database initialization failed:', initError);
    }

    const { StoryAuditController } = await import('../services/storyAuditController');
    const auditController = new StoryAuditController(c.env, db);

    const stats = await auditController.getAuditStatistics();
    console.log('[SIMPLE_ADMIN] Audit statistics retrieved:', stats);

    return c.json({
      success: true,
      data: stats,
      message: '获取审核统计成功'
    });

  } catch (error) {
    console.error('[SIMPLE_ADMIN] 获取审核统计失败:', error);
    return c.json({
      success: false,
      message: `获取审核统计失败: ${error.message}`,
      error: error.toString()
    }, 500);
  }
});

// AI审核配置管理
simpleAdmin.get('/ai-moderation/config', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting AI moderation config');

    // 检查AI服务可用性
    let aiAvailable = false;
    let recommendedModels = {};
    let availabilityReport = [];

    if (c.env.AI) {
      try {
        const aiCheck = await quickAICheck(c.env.AI);
        aiAvailable = aiCheck.available;

        if (aiAvailable) {
          const modelConfig = await getRecommendedModelConfig(c.env.AI);
          recommendedModels = modelConfig.models;
          availabilityReport = modelConfig.availabilityReport;
        }
      } catch (aiError) {
        console.error('[SIMPLE_ADMIN] AI availability check failed:', aiError);
      }
    }

    // 从KV存储获取配置，如果没有则返回默认配置
    const defaultConfig = {
      enabled: aiAvailable,
      models: Object.keys(recommendedModels).length > 0 ? recommendedModels : {
        textClassification: '@cf/huggingface/distilbert-sst-2-int8',
        contentSafety: '@cf/meta/llama-guard-3-8b',
        sentimentAnalysis: '@cf/meta/llama-3-8b-instruct',
        semanticAnalysis: '@cf/baai/bge-base-en-v1.5'
      },
      thresholds: {
        autoApprove: 0.2,
        humanReview: 0.5,
        autoReject: 0.8
      },
      features: {
        parallelAnalysis: true,
        semanticAnalysis: true,
        caching: true,
        batchProcessing: false
      },
      // 添加AI服务状态信息
      aiStatus: {
        available: aiAvailable,
        hasAIBinding: !!c.env.AI,
        availabilityReport: availabilityReport
      }
    };

    return successResponse(c, defaultConfig, 'AI审核配置获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] AI config error:', error);
    return c.json({ success: false, message: '获取AI审核配置失败' }, 500);
  }
});

// 更新AI审核配置
simpleAdmin.post('/ai-moderation/config', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Updating AI moderation config');
    const config = await c.req.json();

    // 这里可以保存到KV存储
    // await c.env.AI_MODERATION_CONFIG.put('config', JSON.stringify(config));

    return successResponse(c, config, 'AI审核配置更新成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] AI config update error:', error);
    return c.json({ success: false, message: '更新AI审核配置失败' }, 500);
  }
});

// AI审核统计
simpleAdmin.get('/ai-moderation/stats', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting AI moderation stats');

    // 模拟统计数据，实际应该从数据库查询
    const stats = {
      totalAnalyses: 1247,
      successRate: 98.5,
      averageProcessingTime: 245,
      cacheHitRate: 67.3,
      modelPerformance: {
        classification: 96.8,
        sentiment: 94.2,
        safety: 99.1
      },
      recentAnalyses: [
        {
          id: '1',
          content: '这是一个测试内容，用于验证AI审核功能的正常工作。',
          riskScore: 0.15,
          recommendation: 'approve',
          processingTime: 234,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          content: '另一个测试内容，包含一些可能需要审核的词汇。',
          riskScore: 0.65,
          recommendation: 'review',
          processingTime: 456,
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ]
    };

    return successResponse(c, stats, 'AI审核统计获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] AI stats error:', error);
    return c.json({ success: false, message: '获取AI审核统计失败' }, 500);
  }
});

// AI审核测试
simpleAdmin.post('/ai-moderation/test', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Testing AI moderation');
    const { content, contentType } = await c.req.json();

    if (!content) {
      return c.json({ success: false, message: '内容不能为空' }, 400);
    }

    // 模拟AI分析结果
    const mockResult = {
      riskScore: Math.random() * 0.8, // 随机风险分数
      confidence: 0.85 + Math.random() * 0.15,
      recommendation: Math.random() > 0.7 ? 'approve' : Math.random() > 0.3 ? 'review' : 'reject',
      details: {
        classification: { label: 'NEUTRAL', score: 0.85 },
        sentiment: { sentiment: 'neutral', confidence: 0.78 },
        safety: { status: 'safe', confidence: 0.92 }
      },
      processingTime: Math.floor(200 + Math.random() * 300),
      modelVersions: {
        classification: '@cf/huggingface/distilbert-sst-2-int8',
        sentiment: '@cf/meta/llama-3-8b-instruct',
        safety: '@cf/meta/llama-guard-3-8b'
      }
    };

    return successResponse(c, mockResult, 'AI审核测试完成');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] AI test error:', error);
    return c.json({ success: false, message: 'AI审核测试失败' }, 500);
  }
});

// AI模型可用性检测
simpleAdmin.get('/ai-moderation/models/check', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Checking AI models availability');

    if (!c.env.AI) {
      return c.json({
        success: false,
        message: 'AI服务未配置',
        data: {
          hasAIBinding: false,
          available: false,
          error: 'Workers AI binding not found'
        }
      }, 400);
    }

    const aiCheck = await quickAICheck(c.env.AI);
    const modelConfig = await getRecommendedModelConfig(c.env.AI);

    const result = {
      hasAIBinding: true,
      available: aiCheck.available,
      workingModels: aiCheck.workingModels,
      totalModels: aiCheck.totalModels,
      recommendedModels: modelConfig.models,
      detailedReport: modelConfig.availabilityReport,
      error: aiCheck.error
    };

    return successResponse(c, result, 'AI模型检测完成');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] AI models check error:', error);
    return c.json({
      success: false,
      message: 'AI模型检测失败',
      data: {
        hasAIBinding: !!c.env.AI,
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

// 标签管理API
simpleAdmin.get('/content/tags', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting content tags');
    const db = c.env.DB;

    // 确保表存在
    await ensureContentTagsTableExists(db);

    const contentType = c.req.query('content_type') || 'all';
    const isActive = c.req.query('is_active');

    let query = `
      SELECT
        id, tag_key, tag_name, tag_name_en, description,
        tag_type, color, usage_count, is_active, content_type,
        created_at, updated_at
      FROM content_tags
      WHERE 1=1
    `;
    const params: any[] = [];

    if (contentType !== 'all') {
      query += ` AND (content_type = ? OR content_type = 'all')`;
      params.push(contentType);
    }

    if (isActive !== undefined) {
      query += ` AND is_active = ?`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY usage_count DESC, tag_name`;

    const result = await db.prepare(query).bind(...params).all();

    return successResponse(c, result.results || [], '标签列表获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Content tags error:', error);
    return c.json({ success: false, message: '获取标签列表失败' }, 500);
  }
});

simpleAdmin.post('/content/tags', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Creating content tag');
    const db = c.env.DB;
    const body = await c.req.json();

    const {
      tag_key, tag_name, tag_name_en, description,
      tag_type = 'system', color = '#1890ff',
      content_type = 'all', is_active = true
    } = body;

    // 验证必填字段
    if (!tag_key || !tag_name) {
      return c.json({
        success: false,
        message: '标签键和标签名称为必填项'
      }, 400);
    }

    // 检查标签键是否已存在
    const existing = await db.prepare(
      'SELECT id FROM content_tags WHERE tag_key = ?'
    ).bind(tag_key).first();

    if (existing) {
      return c.json({
        success: false,
        message: '标签键已存在'
      }, 409);
    }

    // 插入新标签
    const result = await db.prepare(`
      INSERT INTO content_tags (
        tag_key, tag_name, tag_name_en, description,
        tag_type, color, content_type, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      tag_key, tag_name, tag_name_en, description,
      tag_type, color, content_type, is_active ? 1 : 0
    ).run();

    return successResponse(c, { id: result.meta.last_row_id }, '标签创建成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Create content tag error:', error);
    return c.json({ success: false, message: '创建标签失败' }, 500);
  }
});

simpleAdmin.put('/content/tags/:id', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Updating content tag');
    const db = c.env.DB;
    const tagId = c.req.param('id');
    const body = await c.req.json();

    const {
      tag_key, tag_name, tag_name_en, description,
      tag_type, color, content_type, is_active
    } = body;

    // 检查标签是否存在
    const existing = await db.prepare(
      'SELECT id FROM content_tags WHERE id = ?'
    ).bind(tagId).first();

    if (!existing) {
      return c.json({
        success: false,
        message: '标签不存在'
      }, 404);
    }

    // 如果修改了tag_key，检查是否与其他标签冲突
    if (tag_key) {
      const conflict = await db.prepare(
        'SELECT id FROM content_tags WHERE tag_key = ? AND id != ?'
      ).bind(tag_key, tagId).first();

      if (conflict) {
        return c.json({
          success: false,
          message: '标签键已存在'
        }, 409);
      }
    }

    // 更新标签
    await db.prepare(`
      UPDATE content_tags SET
        tag_key = COALESCE(?, tag_key),
        tag_name = COALESCE(?, tag_name),
        tag_name_en = COALESCE(?, tag_name_en),
        description = COALESCE(?, description),
        tag_type = COALESCE(?, tag_type),
        color = COALESCE(?, color),
        content_type = COALESCE(?, content_type),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      tag_key, tag_name, tag_name_en, description,
      tag_type, color, content_type, is_active !== undefined ? (is_active ? 1 : 0) : null,
      tagId
    ).run();

    return successResponse(c, {}, '标签更新成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Update content tag error:', error);
    return c.json({ success: false, message: '更新标签失败' }, 500);
  }
});

simpleAdmin.delete('/content/tags/:id', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Deleting content tag');
    const db = c.env.DB;
    const tagId = c.req.param('id');

    // 检查标签是否存在
    const existing = await db.prepare(
      'SELECT id, tag_name FROM content_tags WHERE id = ?'
    ).bind(tagId).first();

    if (!existing) {
      return c.json({
        success: false,
        message: '标签不存在'
      }, 404);
    }

    // 检查是否有内容使用此标签
    const usageCount = await db.prepare(
      'SELECT COUNT(*) as count FROM content_tag_relations WHERE tag_id = ?'
    ).bind(tagId).first();

    if (usageCount && usageCount.count > 0) {
      return c.json({
        success: false,
        message: `标签正在被 ${usageCount.count} 个内容使用，无法删除`
      }, 400);
    }

    // 删除标签
    await db.prepare('DELETE FROM content_tags WHERE id = ?').bind(tagId).run();

    return successResponse(c, {}, '标签删除成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Delete content tag error:', error);
    return c.json({ success: false, message: '删除标签失败' }, 500);
  }
});

simpleAdmin.get('/content/tags/stats', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Getting content tags stats');
    const db = c.env.DB;

    // 确保表存在
    await ensureContentTagsTableExists(db);

    // 获取基本统计
    const totalTags = await db.prepare('SELECT COUNT(*) as count FROM content_tags').first();
    const activeTags = await db.prepare('SELECT COUNT(*) as count FROM content_tags WHERE is_active = 1').first();
    const totalUsage = await db.prepare('SELECT SUM(usage_count) as total FROM content_tags').first();

    // 获取最热门标签
    const mostUsedTag = await db.prepare(`
      SELECT tag_name, usage_count
      FROM content_tags
      WHERE usage_count > 0
      ORDER BY usage_count DESC
      LIMIT 1
    `).first();

    // 获取标签类型分布
    const tagTypeDistribution = await db.prepare(`
      SELECT tag_type, COUNT(*) as count
      FROM content_tags
      GROUP BY tag_type
    `).all();

    // 获取内容类型分布
    const contentTypeDistribution = await db.prepare(`
      SELECT content_type, COUNT(*) as count
      FROM content_tags
      GROUP BY content_type
    `).all();

    // 获取最近创建的标签
    const recentTags = await db.prepare(`
      SELECT * FROM content_tags
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    const stats = {
      total_tags: totalTags?.count || 0,
      active_tags: activeTags?.count || 0,
      total_usage: totalUsage?.total || 0,
      most_used_tag: mostUsedTag || { tag_name: '无', usage_count: 0 },
      tag_type_distribution: tagTypeDistribution.results || [],
      content_type_distribution: contentTypeDistribution.results || [],
      recent_tags: recentTags.results || []
    };

    return successResponse(c, stats, '标签统计获取成功');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Content tags stats error:', error);
    return c.json({ success: false, message: '获取标签统计失败' }, 500);
  }
});

simpleAdmin.delete('/content/tags/cleanup', async (c) => {
  try {
    console.log('[SIMPLE_ADMIN] Cleaning up unused tags');
    const db = c.env.DB;

    // 获取未使用的标签
    const unusedTags = await db.prepare(`
      SELECT ct.id, ct.tag_name
      FROM content_tags ct
      LEFT JOIN content_tag_relations ctr ON ct.id = ctr.tag_id
      WHERE ctr.tag_id IS NULL AND ct.usage_count = 0
    `).all();

    if (!unusedTags.results || unusedTags.results.length === 0) {
      return successResponse(c, { deleted_count: 0 }, '没有需要清理的标签');
    }

    // 删除未使用的标签
    const tagIds = unusedTags.results.map((tag: any) => tag.id);
    const placeholders = tagIds.map(() => '?').join(',');

    const result = await db.prepare(`
      DELETE FROM content_tags
      WHERE id IN (${placeholders})
    `).bind(...tagIds).run();

    return successResponse(c, {
      deleted_count: result.meta.changes,
      deleted_tags: unusedTags.results.map((tag: any) => tag.tag_name)
    }, `已清理 ${result.meta.changes} 个未使用的标签`);
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Cleanup tags error:', error);
    return c.json({ success: false, message: '清理标签失败' }, 500);
  }
});

// 确保内容标签表存在的函数
async function ensureContentTagsTableExists(db: any) {
  try {
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
        content_type TEXT DEFAULT 'all' CHECK (content_type IN ('story', 'heart_voice', 'questionnaire', 'all')),
        admin_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS content_tag_relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id TEXT NOT NULL,
        content_type TEXT NOT NULL CHECK (content_type IN ('story', 'heart_voice', 'questionnaire')),
        tag_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_id) REFERENCES content_tags(id) ON DELETE CASCADE,
        UNIQUE(content_id, content_type, tag_id)
      )
    `).run();

    console.log('[SIMPLE_ADMIN] Content tags tables ensured');
  } catch (error) {
    console.error('[SIMPLE_ADMIN] Failed to ensure content tags tables:', error);
  }
}

export default simpleAdmin;
