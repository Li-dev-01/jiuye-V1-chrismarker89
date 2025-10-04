#!/usr/bin/env node

/**
 * 数据库类型不匹配修复脚本
 * 安全执行数据库结构修复
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  migrationFile: path.join(__dirname, '../migrations/027_fix_data_type_consistency.sql'),
  backupDir: path.join(__dirname, '../backups'),
  logFile: path.join(__dirname, '../logs/database-fix.log'),
  dryRun: process.argv.includes('--dry-run'),
  force: process.argv.includes('--force')
};

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // 写入日志文件
  const logDir = path.dirname(CONFIG.logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
}

// 检查前置条件
function checkPrerequisites() {
  log('🔍 检查前置条件...');
  
  // 检查迁移文件是否存在
  if (!fs.existsSync(CONFIG.migrationFile)) {
    log(`❌ 迁移文件不存在: ${CONFIG.migrationFile}`, 'ERROR');
    return false;
  }
  
  // 检查备份目录
  if (!fs.existsSync(CONFIG.backupDir)) {
    log(`📁 创建备份目录: ${CONFIG.backupDir}`);
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  log('✅ 前置条件检查通过');
  return true;
}

// 分析当前数据库状态
function analyzeDatabaseState() {
  log('📊 分析当前数据库状态...');
  
  // 这里应该连接数据库并检查表结构
  // 由于我们使用Cloudflare D1，需要使用wrangler命令
  
  const analysisQueries = [
    "PRAGMA table_info(universal_questionnaire_responses);",
    "PRAGMA table_info(users);",
    "SELECT COUNT(*) as total_responses FROM universal_questionnaire_responses;",
    "SELECT COUNT(DISTINCT user_id) as unique_users FROM universal_questionnaire_responses WHERE user_id IS NOT NULL;"
  ];
  
  log('📋 需要执行的分析查询:');
  analysisQueries.forEach((query, index) => {
    log(`  ${index + 1}. ${query}`);
  });
  
  return true;
}

// 创建数据备份
function createBackup() {
  log('💾 创建数据备份...');
  
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(CONFIG.backupDir, `database-backup-${backupTimestamp}.sql`);
  
  // 备份命令（需要根据实际数据库类型调整）
  const backupCommands = [
    'wrangler d1 export college-employment-survey --output ' + backupFile
  ];
  
  log(`📁 备份文件将保存到: ${backupFile}`);
  log('💡 请手动执行以下命令创建备份:');
  backupCommands.forEach(cmd => {
    log(`  ${cmd}`);
  });
  
  return backupFile;
}

// 验证修复脚本
function validateMigrationScript() {
  log('🔍 验证修复脚本...');
  
  const migrationContent = fs.readFileSync(CONFIG.migrationFile, 'utf8');
  
  // 检查关键操作
  const criticalOperations = [
    'CREATE TABLE.*backup',
    'ALTER TABLE',
    'DROP TABLE',
    'FOREIGN KEY',
    'INSERT INTO.*SELECT'
  ];
  
  let validationPassed = true;
  
  criticalOperations.forEach(pattern => {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(migrationContent)) {
      log(`✅ 发现关键操作: ${pattern}`);
    } else {
      log(`⚠️  未发现预期操作: ${pattern}`, 'WARN');
    }
  });
  
  // 检查是否包含回滚机制
  if (migrationContent.includes('backup')) {
    log('✅ 包含备份机制');
  } else {
    log('⚠️  未发现备份机制', 'WARN');
    validationPassed = false;
  }
  
  return validationPassed;
}

// 生成执行计划
function generateExecutionPlan() {
  log('📋 生成执行计划...');
  
  const plan = {
    steps: [
      {
        id: 1,
        name: '创建数据备份',
        description: '备份universal_questionnaire_responses表',
        risk: 'LOW',
        rollback: '从备份恢复数据'
      },
      {
        id: 2,
        name: '分析现有数据',
        description: '检查user_id字段的数据分布和引用',
        risk: 'LOW',
        rollback: '无需回滚'
      },
      {
        id: 3,
        name: '创建新表结构',
        description: '创建user_id为TEXT类型的新表',
        risk: 'LOW',
        rollback: '删除新创建的表'
      },
      {
        id: 4,
        name: '数据迁移',
        description: '将数据从旧表迁移到新表，转换user_id类型',
        risk: 'MEDIUM',
        rollback: '从备份表恢复数据'
      },
      {
        id: 5,
        name: '替换原表',
        description: '删除旧表，重命名新表',
        risk: 'HIGH',
        rollback: '从备份表重建原表'
      },
      {
        id: 6,
        name: '重建约束和索引',
        description: '添加外键约束和性能索引',
        risk: 'LOW',
        rollback: '删除约束和索引'
      },
      {
        id: 7,
        name: '验证修复结果',
        description: '检查数据完整性和外键约束',
        risk: 'LOW',
        rollback: '无需回滚'
      }
    ],
    estimatedTime: '5-10分钟',
    riskLevel: 'MEDIUM',
    prerequisites: [
      '数据库备份已创建',
      '应用服务已停止或处于维护模式',
      '有足够的磁盘空间进行表重建'
    ]
  };
  
  log('📊 执行计划:');
  plan.steps.forEach(step => {
    log(`  ${step.id}. ${step.name} (风险: ${step.risk})`);
    log(`     ${step.description}`);
    log(`     回滚: ${step.rollback}`);
  });
  
  log(`⏱️  预计执行时间: ${plan.estimatedTime}`);
  log(`⚠️  总体风险级别: ${plan.riskLevel}`);
  
  return plan;
}

// 主执行函数
async function main() {
  log('🚀 开始数据库类型不匹配修复流程');
  log(`🔧 模式: ${CONFIG.dryRun ? 'DRY RUN (仅分析)' : 'EXECUTION (实际执行)'}`);
  
  try {
    // 1. 检查前置条件
    if (!checkPrerequisites()) {
      log('❌ 前置条件检查失败，退出', 'ERROR');
      process.exit(1);
    }
    
    // 2. 分析数据库状态
    if (!analyzeDatabaseState()) {
      log('❌ 数据库状态分析失败，退出', 'ERROR');
      process.exit(1);
    }
    
    // 3. 验证修复脚本
    if (!validateMigrationScript()) {
      log('❌ 修复脚本验证失败，退出', 'ERROR');
      if (!CONFIG.force) {
        process.exit(1);
      }
      log('⚠️  使用 --force 参数强制继续', 'WARN');
    }
    
    // 4. 生成执行计划
    const plan = generateExecutionPlan();
    
    if (CONFIG.dryRun) {
      log('✅ DRY RUN 完成 - 未执行实际修复');
      log('💡 要执行实际修复，请运行: node fix-database-types.js');
      return;
    }
    
    // 5. 确认执行
    log('⚠️  即将执行数据库修复，这将修改表结构');
    log('💡 建议先运行 --dry-run 模式进行测试');
    log('💡 确保已创建数据库备份');
    
    if (!CONFIG.force) {
      log('❌ 为安全起见，请添加 --force 参数确认执行');
      process.exit(1);
    }
    
    // 6. 执行修复
    log('🔧 开始执行数据库修复...');
    
    // 创建备份
    const backupFile = createBackup();
    
    // 执行迁移脚本
    log('📝 执行迁移脚本...');
    log('💡 请手动执行以下命令:');
    log(`  wrangler d1 execute college-employment-survey --file=${CONFIG.migrationFile}`);
    
    log('✅ 修复脚本准备完成');
    log('📋 下一步操作:');
    log('  1. 创建数据库备份');
    log('  2. 停止应用服务（可选）');
    log('  3. 执行迁移脚本');
    log('  4. 验证修复结果');
    log('  5. 重启应用服务');
    
  } catch (error) {
    log(`❌ 执行失败: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    process.exit(1);
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
数据库类型不匹配修复工具

用法:
  node fix-database-types.js [选项]

选项:
  --dry-run    仅分析，不执行实际修复
  --force      强制执行修复（跳过确认）
  --help       显示此帮助信息

示例:
  node fix-database-types.js --dry-run    # 分析模式
  node fix-database-types.js --force      # 执行修复

注意:
  - 执行前请确保已创建数据库备份
  - 建议先在测试环境中验证
  - 修复过程中会重建表结构
`);
}

// 处理命令行参数
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// 运行主程序
main().catch(error => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
});
