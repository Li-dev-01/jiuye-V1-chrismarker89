#!/usr/bin/env node

/**
 * 混合架构设置脚本
 * 初始化混合架构数据库表并迁移现有数据
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  questionnaireId: 'employment-survey-2024',
  batchSize: 100,
  enableLogging: true
};

/**
 * 日志函数
 */
function log(message, type = 'info') {
  if (!CONFIG.enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    progress: '🔄'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * 执行SQL文件
 */
async function executeSQLFile(db, filePath) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement);
      }
    }
    
    log(`SQL文件执行成功: ${path.basename(filePath)}`, 'success');
    return true;
  } catch (error) {
    log(`SQL文件执行失败: ${path.basename(filePath)} - ${error.message}`, 'error');
    return false;
  }
}

/**
 * 检查表是否存在
 */
async function tableExists(db, tableName) {
  try {
    const result = await db.queryFirst(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `, [tableName]);
    return !!result;
  } catch (error) {
    return false;
  }
}

/**
 * 创建混合架构表
 */
async function createHybridTables(db) {
  log('开始创建混合架构表...', 'progress');
  
  const migrationFile = path.join(__dirname, '../database/hybrid_architecture_migration.sql');
  
  if (!fs.existsSync(migrationFile)) {
    log('混合架构迁移文件不存在', 'error');
    return false;
  }
  
  const success = await executeSQLFile(db, migrationFile);
  if (success) {
    log('混合架构表创建成功', 'success');
  }
  
  return success;
}

/**
 * 验证表结构
 */
async function validateTableStructure(db) {
  log('验证表结构...', 'progress');
  
  const requiredTables = [
    'questionnaire_core_stats',
    'questionnaire_user_paths',
    'questionnaire_enhanced_stats_cache',
    'questionnaire_data_quality'
  ];
  
  for (const tableName of requiredTables) {
    const exists = await tableExists(db, tableName);
    if (!exists) {
      log(`必需表不存在: ${tableName}`, 'error');
      return false;
    }
    log(`表验证通过: ${tableName}`, 'success');
  }
  
  return true;
}

/**
 * 迁移现有数据
 */
async function migrateExistingData(db) {
  log('开始迁移现有数据...', 'progress');
  
  try {
    // 检查是否已有数据
    const existingCount = await db.queryFirst(`
      SELECT COUNT(*) as count FROM questionnaire_core_stats
      WHERE questionnaire_id = ?
    `, [CONFIG.questionnaireId]);
    
    if (existingCount && existingCount.count > 0) {
      log(`已存在 ${existingCount.count} 条迁移数据，跳过迁移`, 'warning');
      return true;
    }
    
    // 获取原始数据
    const responses = await db.query(`
      SELECT id, responses, submitted_at
      FROM universal_questionnaire_responses
      WHERE questionnaire_id = ?
      ORDER BY submitted_at DESC
    `, [CONFIG.questionnaireId]);
    
    if (!responses || responses.length === 0) {
      log('没有找到需要迁移的数据', 'warning');
      return true;
    }
    
    log(`找到 ${responses.length} 条响应数据，开始迁移...`, 'progress');
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // 批量处理
    for (let i = 0; i < responses.length; i += CONFIG.batchSize) {
      const batch = responses.slice(i, i + CONFIG.batchSize);
      
      for (const response of batch) {
        try {
          const responseData = JSON.parse(response.responses);
          const coreStats = extractCoreStatistics(responseData);
          const userPath = analyzeUserPath(responseData);
          
          // 插入核心统计数据
          await db.execute(`
            INSERT OR REPLACE INTO questionnaire_core_stats (
              response_id, questionnaire_id, age_range, gender, education_level,
              major_field, graduation_year, work_location_preference, current_status,
              work_industry, work_experience, position_level, current_salary,
              job_satisfaction, job_search_intensity, financial_pressure,
              academic_performance, internship_experience, user_path,
              sections_completed, completion_percentage, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            response.id, CONFIG.questionnaireId,
            coreStats.ageRange, coreStats.gender, coreStats.educationLevel,
            coreStats.majorField, coreStats.graduationYear, coreStats.workLocationPreference,
            coreStats.currentStatus, coreStats.workIndustry, coreStats.workExperience,
            coreStats.positionLevel, coreStats.currentSalary, coreStats.jobSatisfaction,
            coreStats.jobSearchIntensity, coreStats.financialPressure,
            coreStats.academicPerformance, coreStats.internshipExperience,
            JSON.stringify(userPath.pathSequence), JSON.stringify(userPath.completedSections),
            userPath.completionPercentage, response.submitted_at
          ]);
          
          // 插入用户路径数据
          await db.execute(`
            INSERT OR REPLACE INTO questionnaire_user_paths (
              response_id, questionnaire_id, entry_point, path_sequence,
              branch_decisions, total_sections, completed_sections,
              total_time_seconds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            response.id, CONFIG.questionnaireId, userPath.entryPoint,
            JSON.stringify(userPath.pathSequence), JSON.stringify(userPath.branchDecisions),
            userPath.totalSections, userPath.completedSections.length,
            userPath.totalTimeSeconds
          ]);
          
          migratedCount++;
        } catch (error) {
          errorCount++;
          log(`迁移响应 ${response.id} 失败: ${error.message}`, 'error');
        }
      }
      
      // 显示进度
      const progress = Math.round(((i + batch.length) / responses.length) * 100);
      log(`迁移进度: ${progress}% (${migratedCount}/${responses.length})`, 'progress');
    }
    
    log(`数据迁移完成: 成功 ${migratedCount} 条，失败 ${errorCount} 条`, 'success');
    return errorCount === 0;
    
  } catch (error) {
    log(`数据迁移失败: ${error.message}`, 'error');
    return false;
  }
}

/**
 * 提取核心统计字段
 */
function extractCoreStatistics(responseData) {
  const flatData = {};
  
  if (responseData.sectionResponses) {
    for (const sectionResponse of responseData.sectionResponses) {
      if (sectionResponse.questionResponses) {
        for (const questionResponse of sectionResponse.questionResponses) {
          flatData[questionResponse.questionId] = questionResponse.value;
        }
      }
    }
  }
  
  return {
    ageRange: flatData['age-range'],
    gender: flatData['gender'],
    educationLevel: flatData['education-level'],
    majorField: flatData['major-field'],
    graduationYear: flatData['graduation-year'],
    workLocationPreference: flatData['work-location-preference'],
    currentStatus: flatData['current-status'],
    workIndustry: flatData['work-industry'],
    workExperience: flatData['work-experience'],
    positionLevel: flatData['position-level'],
    currentSalary: flatData['current-salary'],
    jobSatisfaction: flatData['job-satisfaction'],
    jobSearchIntensity: flatData['job-search-intensity'],
    financialPressure: flatData['financial-pressure'],
    academicPerformance: flatData['academic-performance'],
    internshipExperience: flatData['internship-experience']
  };
}

/**
 * 分析用户路径
 */
function analyzeUserPath(responseData) {
  const completedSections = [];
  const pathSequence = [];
  const branchDecisions = {};
  let entryPoint = 'unknown';
  
  if (responseData.sectionResponses) {
    for (const sectionResponse of responseData.sectionResponses) {
      completedSections.push(sectionResponse.sectionId);
      pathSequence.push(sectionResponse.sectionId);
      
      // 记录分支决策
      for (const questionResponse of sectionResponse.questionResponses) {
        if (questionResponse.questionId === 'current-status') {
          entryPoint = questionResponse.value;
          branchDecisions[questionResponse.questionId] = questionResponse.value;
        }
      }
    }
  }
  
  return {
    entryPoint,
    pathSequence,
    branchDecisions,
    completedSections,
    totalSections: 8, // 根据问卷定义调整
    completionPercentage: (completedSections.length / 8) * 100,
    totalTimeSeconds: 0
  };
}

/**
 * 生成统计缓存
 */
async function generateStatisticsCache(db) {
  log('生成统计缓存...', 'progress');
  
  try {
    // 清空旧缓存
    await db.execute(`
      DELETE FROM questionnaire_enhanced_stats_cache
      WHERE questionnaire_id = ?
    `, [CONFIG.questionnaireId]);
    
    // 核心字段列表
    const coreFields = [
      { field: 'age_range', questionId: 'age-range' },
      { field: 'gender', questionId: 'gender' },
      { field: 'education_level', questionId: 'education-level' },
      { field: 'major_field', questionId: 'major-field' },
      { field: 'current_status', questionId: 'current-status' },
      { field: 'work_industry', questionId: 'work-industry' },
      { field: 'job_satisfaction', questionId: 'job-satisfaction' }
    ];
    
    // 获取总响应数
    const totalResult = await db.queryFirst(`
      SELECT COUNT(*) as total FROM questionnaire_core_stats
      WHERE questionnaire_id = ?
    `, [CONFIG.questionnaireId]);
    
    const totalResponses = totalResult?.total || 0;
    
    for (const { field, questionId } of coreFields) {
      const stats = await db.query(`
        SELECT 
          ${field} as option_value,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / ?, 2) as percentage
        FROM questionnaire_core_stats
        WHERE questionnaire_id = ? AND ${field} IS NOT NULL
        GROUP BY ${field}
        ORDER BY count DESC
      `, [totalResponses, CONFIG.questionnaireId]);
      
      for (const stat of stats) {
        await db.execute(`
          INSERT INTO questionnaire_enhanced_stats_cache 
          (questionnaire_id, question_id, option_value, count, percentage, total_responses, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          CONFIG.questionnaireId,
          questionId,
          stat.option_value,
          stat.count,
          stat.percentage,
          totalResponses
        ]);
      }
      
      log(`生成 ${questionId} 统计缓存完成`, 'success');
    }
    
    log('统计缓存生成完成', 'success');
    return true;
    
  } catch (error) {
    log(`生成统计缓存失败: ${error.message}`, 'error');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  log('开始设置混合架构...', 'progress');
  
  try {
    // 这里需要根据实际环境初始化数据库连接
    // const db = await initializeDatabase();
    
    log('混合架构设置脚本准备就绪', 'success');
    log('请在实际环境中调用相应的函数:', 'info');
    log('1. createHybridTables(db)', 'info');
    log('2. validateTableStructure(db)', 'info');
    log('3. migrateExistingData(db)', 'info');
    log('4. generateStatisticsCache(db)', 'info');
    
  } catch (error) {
    log(`设置失败: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 导出函数供其他模块使用
module.exports = {
  createHybridTables,
  validateTableStructure,
  migrateExistingData,
  generateStatisticsCache,
  extractCoreStatistics,
  analyzeUserPath
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
