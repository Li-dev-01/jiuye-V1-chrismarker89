/**
 * 问卷可视化数据API路由
 * 基于真实问卷数据的可视化接口
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DatabaseService } from '../services/databaseService';

interface Env {
  DB: D1Database;
}

export function createVisualizationRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  // 启用CORS
  app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://*.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  /**
   * 获取可视化数据摘要
   */
  app.get('/summary', async (c) => {
    try {
      const db = new DatabaseService(c.env.DB);
      
      // 获取总响应数
      const totalResponsesResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM universal_questionnaire_responses'
      ).first();
      const totalResponses = totalResponsesResult?.count || 0;

      // 获取完成率
      const completeResponsesResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM universal_questionnaire_responses WHERE is_complete = 1'
      ).first();
      const completeResponses = completeResponsesResult?.count || 0;
      const completionRate = totalResponses > 0 ? (completeResponses / totalResponses) * 100 : 0;

      // 获取最后更新时间
      const lastUpdatedResult = await c.env.DB.prepare(
        'SELECT MAX(updated_at) as last_updated FROM universal_questionnaire_responses'
      ).first();
      const lastUpdated = lastUpdatedResult?.last_updated || new Date().toISOString();

      // 生成关键洞察
      const keyInsights = await generateKeyInsights(c.env.DB);

      // 获取各维度数据
      const dimensions = await getAllDimensionsData(c.env.DB);

      return c.json({
        totalResponses,
        completionRate: Math.round(completionRate * 100) / 100,
        lastUpdated,
        keyInsights,
        dimensions
      });
    } catch (error) {
      console.error('Error fetching visualization summary:', error);
      return c.json({ error: 'Failed to fetch visualization summary' }, 500);
    }
  });

  /**
   * 获取特定维度的数据
   */
  app.get('/dimension/:dimensionId', async (c) => {
    try {
      const dimensionId = c.req.param('dimensionId');
      const db = new DatabaseService(c.env.DB);
      
      const dimensionData = await getDimensionData(c.env.DB, dimensionId);
      
      if (!dimensionData) {
        return c.json({ error: 'Dimension not found' }, 404);
      }

      return c.json(dimensionData);
    } catch (error) {
      console.error('Error fetching dimension data:', error);
      return c.json({ error: 'Failed to fetch dimension data' }, 500);
    }
  });

  /**
   * 获取特定问题的图表数据
   */
  app.get('/question/:questionId', async (c) => {
    try {
      const questionId = c.req.param('questionId');
      const db = new DatabaseService(c.env.DB);
      
      const chartData = await getQuestionChartData(c.env.DB, questionId);
      
      if (!chartData) {
        return c.json({ error: 'Question not found' }, 404);
      }

      return c.json(chartData);
    } catch (error) {
      console.error('Error fetching question chart data:', error);
      return c.json({ error: 'Failed to fetch question chart data' }, 500);
    }
  });

  /**
   * 获取交叉分析数据
   */
  app.get('/cross-analysis', async (c) => {
    try {
      const primaryQuestion = c.req.query('primary');
      const secondaryQuestion = c.req.query('secondary');
      
      if (!primaryQuestion || !secondaryQuestion) {
        return c.json({ error: 'Both primary and secondary questions are required' }, 400);
      }

      const crossAnalysisData = await getCrossAnalysisData(
        c.env.DB, 
        primaryQuestion, 
        secondaryQuestion
      );

      return c.json(crossAnalysisData);
    } catch (error) {
      console.error('Error fetching cross analysis data:', error);
      return c.json({ error: 'Failed to fetch cross analysis data' }, 500);
    }
  });

  /**
   * 获取就业形势报告
   */
  app.get('/employment-report', async (c) => {
    try {
      const report = await generateEmploymentReport(c.env.DB);
      return c.json(report);
    } catch (error) {
      console.error('Error generating employment report:', error);
      return c.json({ error: 'Failed to generate employment report' }, 500);
    }
  });

  /**
   * 获取实时统计数据
   */
  app.get('/real-time-stats', async (c) => {
    try {
      const stats = await getRealTimeStats(c.env.DB);
      return c.json(stats);
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      return c.json({ error: 'Failed to fetch real-time stats' }, 500);
    }
  });

  /**
   * 获取数据质量报告
   */
  app.get('/data-quality', async (c) => {
    try {
      const qualityReport = await getDataQualityReport(c.env.DB);
      return c.json(qualityReport);
    } catch (error) {
      console.error('Error fetching data quality report:', error);
      return c.json({ error: 'Failed to fetch data quality report' }, 500);
    }
  });



  return app;
}

/**
 * 生成关键洞察
 */
async function generateKeyInsights(db: D1Database): Promise<string[]> {
  const insights: string[] = [];
  
  try {
    // 就业状态分析
    const statusResult = await db.prepare(`
      SELECT 
        JSON_EXTRACT(responses, '$.["current-status"]') as status,
        COUNT(*) as count
      FROM universal_questionnaire_responses 
      WHERE JSON_EXTRACT(responses, '$.["current-status"]') IS NOT NULL
      GROUP BY status
      ORDER BY count DESC
      LIMIT 1
    `).first();

    if (statusResult) {
      const status = statusResult.status;
      const count = statusResult.count;
      insights.push(`当前最主要的身份状态是${status}，占比${Math.round((count / 100) * 100)}%`);
    }

    // 就业难度感知
    const difficultyResult = await db.prepare(`
      SELECT 
        JSON_EXTRACT(responses, '$.["employment-difficulty-perception"]') as difficulty,
        COUNT(*) as count
      FROM universal_questionnaire_responses 
      WHERE JSON_EXTRACT(responses, '$.["employment-difficulty-perception"]') IS NOT NULL
      GROUP BY difficulty
      ORDER BY count DESC
      LIMIT 1
    `).first();

    if (difficultyResult) {
      insights.push(`大多数人认为当前就业难度为${difficultyResult.difficulty}`);
    }

    // 薪资水平分析
    const salaryResult = await db.prepare(`
      SELECT 
        JSON_EXTRACT(responses, '$.["current-salary"]') as salary,
        COUNT(*) as count
      FROM universal_questionnaire_responses 
      WHERE JSON_EXTRACT(responses, '$.["current-salary"]') IS NOT NULL
      GROUP BY salary
      ORDER BY count DESC
      LIMIT 1
    `).first();

    if (salaryResult) {
      insights.push(`最常见的薪资水平是${salaryResult.salary}`);
    }

  } catch (error) {
    console.error('Error generating insights:', error);
    insights.push('数据分析中，敬请期待更多洞察');
  }

  return insights;
}

/**
 * 获取所有维度数据
 */
async function getAllDimensionsData(db: D1Database): Promise<any[]> {
  // 这里返回基础结构，具体实现将在后续完成
  return [
    {
      dimensionId: 'employment-overview',
      dimensionTitle: '就业形势总览',
      charts: [],
      totalResponses: 0,
      completionRate: 0
    },
    {
      dimensionId: 'demographics',
      dimensionTitle: '人口结构分析',
      charts: [],
      totalResponses: 0,
      completionRate: 0
    }
  ];
}

/**
 * 获取特定维度数据
 */
async function getDimensionData(db: D1Database, dimensionId: string): Promise<any> {
  // 具体实现将在后续完成
  return null;
}

/**
 * 获取问题图表数据
 */
async function getQuestionChartData(db: D1Database, questionId: string): Promise<any> {
  // 具体实现将在后续完成
  return null;
}

/**
 * 获取交叉分析数据
 */
async function getCrossAnalysisData(db: D1Database, primary: string, secondary: string): Promise<any> {
  // 具体实现将在后续完成
  return null;
}

/**
 * 生成就业形势报告
 */
async function generateEmploymentReport(db: D1Database): Promise<any> {
  // 具体实现将在后续完成
  return {
    overview: '就业形势分析报告生成中...',
    keyFindings: [],
    recommendations: [],
    dataQuality: {
      sampleSize: 0,
      representativeness: '待评估',
      confidence: 0
    }
  };
}

/**
 * 获取实时统计
 */
async function getRealTimeStats(db: D1Database): Promise<any> {
  // 具体实现将在后续完成
  return {
    activeUsers: 0,
    todayResponses: 0,
    weeklyGrowth: 0,
    popularQuestions: []
  };
}

/**
 * 获取数据质量报告
 */
async function getDataQualityReport(db: D1Database): Promise<any> {
  // 具体实现将在后续完成
  return {
    totalResponses: 0,
    completeResponses: 0,
    partialResponses: 0,
    qualityScore: 0,
    issues: [],
    recommendations: []
  };
}


