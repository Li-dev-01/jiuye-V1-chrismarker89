/**
 * 第二问卷API路由 - 简化版本
 * 完全独立的路由系统，与第一问卷API完全隔离
 */

import { Hono } from 'hono';
// import { secondQuestionnaire2024 } from '../data/secondQuestionnaire2024';

const secondQuestionnaireRoutes = new Hono();

/**
 * 获取第二问卷定义
 */
secondQuestionnaireRoutes.get('/definition', async (c) => {
  try {
    console.log('第二问卷定义请求');
    
    return c.json({
      success: true,
      data: { id: 'employment-survey-2024-v2', title: '第二问卷测试' },
      message: '第二问卷定义获取成功'
    });
    
  } catch (error) {
    console.error('获取第二问卷定义失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取问卷定义失败'
    }, 500);
  }
});

/**
 * 测试路由
 */
secondQuestionnaireRoutes.get('/test', async (c) => {
  return c.json({
    success: true,
    message: '第二问卷路由正常工作',
    timestamp: new Date().toISOString()
  });
});

export { secondQuestionnaireRoutes };
