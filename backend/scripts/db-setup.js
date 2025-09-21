#!/usr/bin/env node

/**
 * 数据库设置脚本
 * 用于创建D1数据库和执行迁移
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`执行命令: ${command}`, 'cyan');
    const result = execSync(command, { 
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'inherit',
      ...options 
    });
    return result;
  } catch (error) {
    log(`命令执行失败: ${error.message}`, 'red');
    throw error;
  }
}

async function createDatabase() {
  log('🗄️  创建D1数据库...', 'blue');
  
  try {
    // 检查是否已经存在数据库配置
    const wranglerConfig = join(projectRoot, 'wrangler.toml');
    if (existsSync(wranglerConfig)) {
      const config = readFileSync(wranglerConfig, 'utf8');
      if (config.includes('database_id = "placeholder-database-id"')) {
        log('⚠️  检测到占位符数据库ID，需要创建新数据库', 'yellow');
        
        // 创建数据库
        const createResult = execCommand('wrangler d1 create employment-survey-db', { stdio: 'pipe' });
        
        // 从输出中提取数据库ID
        const dbIdMatch = createResult.match(/database_id = "([^"]+)"/);
        if (dbIdMatch) {
          const databaseId = dbIdMatch[1];
          log(`✅ 数据库创建成功，ID: ${databaseId}`, 'green');
          
          // 更新wrangler.toml配置
          let configContent = readFileSync(wranglerConfig, 'utf8');
          configContent = configContent.replace(
            'database_id = "placeholder-database-id"',
            `database_id = "${databaseId}"`
          );
          
          // 写回配置文件
          require('fs').writeFileSync(wranglerConfig, configContent);
          log('✅ wrangler.toml配置已更新', 'green');
        }
      } else {
        log('✅ 数据库配置已存在', 'green');
      }
    }
  } catch (error) {
    log(`❌ 创建数据库失败: ${error.message}`, 'red');
    throw error;
  }
}

async function runMigrations() {
  log('🔄 执行数据库迁移...', 'blue');
  
  const migrationsDir = join(projectRoot, 'migrations');
  const migrationFiles = [
    '0001_initial.sql',
    '0002_seed_data.sql',
    '0003_uuid_system.sql',
    '004_create_universal_questionnaire_tables.sql'
  ];
  
  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file);
    if (existsSync(filePath)) {
      try {
        log(`执行迁移: ${file}`, 'cyan');
        execCommand(`wrangler d1 execute employment-survey-db --file=${filePath} --local`);
        log(`✅ ${file} 执行成功`, 'green');
      } catch (error) {
        log(`❌ ${file} 执行失败: ${error.message}`, 'red');
        throw error;
      }
    } else {
      log(`⚠️  迁移文件不存在: ${file}`, 'yellow');
    }
  }
}

async function verifyDatabase() {
  log('🔍 验证数据库设置...', 'blue');
  
  try {
    // 检查表是否创建成功
    execCommand('wrangler d1 execute employment-survey-db --command="SELECT name FROM sqlite_master WHERE type=\'table\';" --local');
    log('✅ 数据库验证成功', 'green');
  } catch (error) {
    log(`❌ 数据库验证失败: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  log('🚀 开始设置数据库...', 'magenta');
  
  try {
    await createDatabase();
    await runMigrations();
    await verifyDatabase();
    
    log('🎉 数据库设置完成！', 'green');
    log('', 'reset');
    log('下一步:', 'blue');
    log('1. 运行 pnpm dev 启动开发服务器', 'cyan');
    log('2. 访问 http://localhost:8787/health 检查API状态', 'cyan');
    log('3. 使用 wrangler d1 execute employment-survey-db --command="SELECT * FROM users;" --local 查看数据', 'cyan');
    
  } catch (error) {
    log('❌ 数据库设置失败', 'red');
    process.exit(1);
  }
}

// 检查命令行参数
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('数据库设置脚本', 'blue');
  log('', 'reset');
  log('用法:', 'cyan');
  log('  node scripts/db-setup.js', 'cyan');
  log('', 'reset');
  log('选项:', 'cyan');
  log('  --help, -h    显示帮助信息', 'cyan');
  process.exit(0);
}

main().catch(console.error);
