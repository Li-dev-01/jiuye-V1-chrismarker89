/**
 * 数据生成定时任务
 * 每小时自动生成测试数据：用户注册、问卷提交、故事发布
 */

import type { Env } from '../types/api';

// 扩展Env类型以包含新的环境变量
interface ExtendedEnv extends Env {
  API_BASE_URL?: string;
  ADMIN_TOKEN?: string;
}

export interface ScheduledEvent {
  type: 'scheduled';
  scheduledTime: number;
  cron: string;
}

/**
 * 定时任务处理器 - 每小时执行一次
 * Cron表达式: "0 * * * *" (每小时的第0分钟执行)
 */
export async function handleScheduledGeneration(
  event: ScheduledEvent,
  env: ExtendedEnv,
  ctx: ExecutionContext
): Promise<void> {
  console.log('🕐 开始执行定时数据生成任务...');
  
  try {
    // 调用数据生成API
    const response = await fetch(`${env.API_BASE_URL || 'https://your-worker.your-subdomain.workers.dev'}/api/admin/data-generator/scheduled-generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.ADMIN_TOKEN || 'admin-token'}` // 管理员令牌
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'cron-scheduler'
      })
    });
    
    if (response.ok) {
      const result = await response.json() as any;
      console.log('✅ 定时数据生成成功:', result);

      // 记录成功日志
      await logGenerationResult(env, {
        success: true,
        timestamp: new Date().toISOString(),
        data: result.data,
        message: result.message
      });
    } else {
      const error = await response.text();
      console.error('❌ 定时数据生成失败:', error);
      
      // 记录失败日志
      await logGenerationResult(env, {
        success: false,
        timestamp: new Date().toISOString(),
        error: error,
        message: '定时任务调用API失败'
      });
    }
    
  } catch (error) {
    console.error('❌ 定时任务执行异常:', error);
    
    // 记录异常日志
    await logGenerationResult(env, {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      message: '定时任务执行异常'
    });
  }
}

/**
 * 记录生成结果到数据库
 */
async function logGenerationResult(env: ExtendedEnv, result: {
  success: boolean;
  timestamp: string;
  data?: any;
  error?: string;
  message: string;
}): Promise<void> {
  try {
    // 这里可以记录到数据库或日志系统
    // 暂时使用console.log记录
    console.log('📊 生成结果记录:', {
      success: result.success,
      timestamp: result.timestamp,
      message: result.message,
      data: result.data ? {
        totalInserted: result.data.totalInserted,
        users: result.data.results?.users,
        questionnaires: result.data.results?.questionnaires,
        stories: result.data.results?.stories
      } : null,
      error: result.error
    });
    
    // 如果需要持久化日志，可以在这里添加数据库操作
    // const db = createDatabaseService(env);
    // await db.execute('INSERT INTO generation_logs ...');
    
  } catch (error) {
    console.error('记录日志失败:', error);
  }
}

/**
 * 获取定时任务状态
 */
export async function getSchedulerStatus(env: ExtendedEnv): Promise<{
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  totalRuns: number;
  successRate: number;
}> {
  // 这里可以从数据库获取实际状态
  // 暂时返回模拟数据
  return {
    enabled: true,
    lastRun: new Date(Date.now() - 3600000).toISOString(), // 1小时前
    nextRun: new Date(Date.now() + 3600000).toISOString(), // 1小时后
    totalRuns: 24, // 假设运行了24次
    successRate: 95.8 // 95.8%成功率
  };
}

/**
 * 手动触发数据生成（用于测试）
 */
export async function triggerManualGeneration(env: ExtendedEnv): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  console.log('🎯 手动触发数据生成...');
  
  try {
    const mockEvent: ScheduledEvent = {
      type: 'scheduled',
      scheduledTime: Date.now(),
      cron: '0 * * * *'
    };
    
    const ctx = {
      waitUntil: (promise: Promise<any>) => promise,
      passThroughOnException: () => {},
      props: {}
    } as ExecutionContext;
    
    await handleScheduledGeneration(mockEvent, env, ctx);
    
    return {
      success: true,
      message: '手动生成任务已触发'
    };
    
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '手动生成失败'
    };
  }
}

/**
 * 定时数据提交处理器 - 每10分钟执行一次
 * 从测试数据库随机选择高质量数据提交到主数据库
 */
export async function handleScheduledSubmission(
  event: ScheduledEvent,
  env: ExtendedEnv,
  ctx: ExecutionContext
): Promise<void> {
  console.log('📤 开始执行定时数据提交任务...');

  try {
    // 调用数据提交API
    const response = await fetch(`${env.API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev'}/api/admin/data-generator/submit-random-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.ADMIN_TOKEN || 'admin-token'}`
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'cron-scheduler',
        type: 'scheduled-submission'
      })
    });

    if (response.ok) {
      const result = await response.json() as any;
      console.log('✅ 定时数据提交成功:', result);

      // 记录成功日志
      await logSubmissionResult(env, {
        success: true,
        timestamp: new Date().toISOString(),
        data: result.data,
        message: result.message
      });
    } else {
      const error = await response.text();
      console.error('❌ 定时数据提交失败:', error);

      // 记录失败日志
      await logSubmissionResult(env, {
        success: false,
        timestamp: new Date().toISOString(),
        error: error,
        message: '定时提交任务调用API失败'
      });
    }

  } catch (error) {
    console.error('❌ 定时提交任务执行异常:', error);

    // 记录异常日志
    await logSubmissionResult(env, {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      message: '定时提交任务执行异常'
    });
  }
}

/**
 * 记录提交结果到日志
 */
async function logSubmissionResult(env: ExtendedEnv, result: {
  success: boolean;
  timestamp: string;
  data?: any;
  error?: string;
  message: string;
}): Promise<void> {
  try {
    console.log('📊 提交结果记录:', {
      success: result.success,
      timestamp: result.timestamp,
      message: result.message,
      data: result.data ? {
        totalSubmitted: result.data.totalSubmitted,
        stories: result.data.results?.stories,
        questionnaires: result.data.results?.questionnaires,
        users: result.data.results?.users
      } : null,
      error: result.error
    });

    // 如果需要持久化日志，可以在这里添加数据库操作

  } catch (error) {
    console.error('记录提交日志失败:', error);
  }
}
