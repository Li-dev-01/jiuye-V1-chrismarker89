#!/usr/bin/env node

/**
 * API路由冲突清理脚本
 * 检测和修复重复的路由注册
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  indexFile: path.join(__dirname, '../src/index.ts'),
  backupFile: path.join(__dirname, '../backups/index.ts.backup'),
  logFile: path.join(__dirname, '../logs/route-cleanup.log'),
  dryRun: process.argv.includes('--dry-run')
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

// 分析路由注册
function analyzeRoutes(content) {
  log('🔍 分析路由注册...');
  
  const routes = [];
  const duplicates = [];
  
  // 匹配路由注册模式
  const routePatterns = [
    /api\.route\(['"`]([^'"`]+)['"`]/g,
    /app\.route\(['"`]([^'"`]+)['"`]/g,
    /api\.post\(['"`]([^'"`]+)['"`]/g,
    /api\.get\(['"`]([^'"`]+)['"`]/g
  ];
  
  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const route = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      const routeInfo = {
        path: route,
        line: lineNumber,
        fullMatch: match[0]
      };
      
      // 检查是否重复
      const existing = routes.find(r => r.path === route);
      if (existing) {
        duplicates.push({
          original: existing,
          duplicate: routeInfo
        });
      }
      
      routes.push(routeInfo);
    }
  });
  
  return { routes, duplicates };
}

// 检测重复的代码块
function detectDuplicateBlocks(content) {
  log('🔍 检测重复的代码块...');
  
  const lines = content.split('\n');
  const duplicateBlocks = [];
  
  // 查找重复的路由注册块
  const blockPatterns = [
    {
      name: 'questionnaire-auth',
      start: /问卷用户认证路由/,
      end: /console\.log\('✅.*questionnaire.*auth.*routes.*registered/
    },
    {
      name: 'health-routes',
      start: /健康检查路由/,
      end: /api\.route\(['"`]\/health['"`]/
    },
    {
      name: 'database-routes',
      start: /数据库监测管理路由/,
      end: /api\.route\(['"`]\/admin\/database['"`]/
    }
  ];
  
  blockPatterns.forEach(pattern => {
    const blocks = [];
    let currentBlock = null;
    
    lines.forEach((line, index) => {
      if (pattern.start.test(line)) {
        currentBlock = {
          name: pattern.name,
          startLine: index + 1,
          startContent: line.trim()
        };
      }
      
      if (currentBlock && pattern.end.test(line)) {
        currentBlock.endLine = index + 1;
        currentBlock.endContent = line.trim();
        blocks.push(currentBlock);
        currentBlock = null;
      }
    });
    
    if (blocks.length > 1) {
      duplicateBlocks.push({
        pattern: pattern.name,
        blocks: blocks
      });
    }
  });
  
  return duplicateBlocks;
}

// 生成清理计划
function generateCleanupPlan(duplicates, duplicateBlocks) {
  log('📋 生成清理计划...');
  
  const plan = {
    routeDuplicates: duplicates,
    blockDuplicates: duplicateBlocks,
    actions: []
  };
  
  // 处理重复路由
  duplicates.forEach(dup => {
    plan.actions.push({
      type: 'remove_duplicate_route',
      description: `移除重复的路由注册: ${dup.duplicate.path}`,
      line: dup.duplicate.line,
      risk: 'LOW'
    });
  });
  
  // 处理重复代码块
  duplicateBlocks.forEach(block => {
    block.blocks.slice(1).forEach(duplicateBlock => {
      plan.actions.push({
        type: 'remove_duplicate_block',
        description: `移除重复的代码块: ${block.pattern}`,
        startLine: duplicateBlock.startLine,
        endLine: duplicateBlock.endLine,
        risk: 'MEDIUM'
      });
    });
  });
  
  return plan;
}

// 执行清理
function executeCleanup(content, plan) {
  log('🔧 执行路由清理...');
  
  const lines = content.split('\n');
  const linesToRemove = new Set();
  
  // 标记要删除的行
  plan.actions.forEach(action => {
    if (action.type === 'remove_duplicate_route') {
      linesToRemove.add(action.line - 1); // 转换为0基索引
    } else if (action.type === 'remove_duplicate_block') {
      for (let i = action.startLine - 1; i < action.endLine; i++) {
        linesToRemove.add(i);
      }
    }
  });
  
  // 创建清理后的内容
  const cleanedLines = lines.filter((line, index) => !linesToRemove.has(index));
  
  return cleanedLines.join('\n');
}

// 验证清理结果
function validateCleanup(originalContent, cleanedContent) {
  log('✅ 验证清理结果...');
  
  const originalAnalysis = analyzeRoutes(originalContent);
  const cleanedAnalysis = analyzeRoutes(cleanedContent);
  
  const validation = {
    originalRoutes: originalAnalysis.routes.length,
    cleanedRoutes: cleanedAnalysis.routes.length,
    removedDuplicates: originalAnalysis.duplicates.length,
    remainingDuplicates: cleanedAnalysis.duplicates.length,
    success: cleanedAnalysis.duplicates.length === 0
  };
  
  log(`📊 清理结果:`);
  log(`  原始路由数: ${validation.originalRoutes}`);
  log(`  清理后路由数: ${validation.cleanedRoutes}`);
  log(`  移除重复数: ${validation.removedDuplicates}`);
  log(`  剩余重复数: ${validation.remainingDuplicates}`);
  log(`  清理状态: ${validation.success ? '✅ 成功' : '❌ 失败'}`);
  
  return validation;
}

// 主执行函数
async function main() {
  log('🚀 开始API路由冲突清理');
  log(`🔧 模式: ${CONFIG.dryRun ? 'DRY RUN (仅分析)' : 'EXECUTION (实际清理)'}`);
  
  try {
    // 1. 读取源文件
    if (!fs.existsSync(CONFIG.indexFile)) {
      log(`❌ 源文件不存在: ${CONFIG.indexFile}`, 'ERROR');
      process.exit(1);
    }
    
    const originalContent = fs.readFileSync(CONFIG.indexFile, 'utf8');
    log(`📁 读取源文件: ${CONFIG.indexFile}`);
    
    // 2. 分析路由
    const { routes, duplicates } = analyzeRoutes(originalContent);
    log(`📊 发现 ${routes.length} 个路由注册`);
    log(`⚠️  发现 ${duplicates.length} 个重复路由`);
    
    if (duplicates.length > 0) {
      log('🔍 重复路由详情:');
      duplicates.forEach(dup => {
        log(`  ${dup.duplicate.path} (行 ${dup.original.line} 和 ${dup.duplicate.line})`);
      });
    }
    
    // 3. 检测重复代码块
    const duplicateBlocks = detectDuplicateBlocks(originalContent);
    log(`📦 发现 ${duplicateBlocks.length} 个重复代码块`);
    
    if (duplicateBlocks.length > 0) {
      log('🔍 重复代码块详情:');
      duplicateBlocks.forEach(block => {
        log(`  ${block.pattern}: ${block.blocks.length} 个重复`);
        block.blocks.forEach((b, index) => {
          log(`    ${index + 1}. 行 ${b.startLine}-${b.endLine}`);
        });
      });
    }
    
    // 4. 生成清理计划
    const plan = generateCleanupPlan(duplicates, duplicateBlocks);
    log(`📋 生成清理计划: ${plan.actions.length} 个操作`);
    
    if (CONFIG.dryRun) {
      log('✅ DRY RUN 完成 - 未执行实际清理');
      log('💡 要执行实际清理，请运行: node clean-route-conflicts.js');
      return;
    }
    
    if (plan.actions.length === 0) {
      log('✅ 未发现需要清理的冲突');
      return;
    }
    
    // 5. 创建备份
    const backupDir = path.dirname(CONFIG.backupFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.backupFile, originalContent);
    log(`💾 创建备份: ${CONFIG.backupFile}`);
    
    // 6. 执行清理
    const cleanedContent = executeCleanup(originalContent, plan);
    
    // 7. 验证结果
    const validation = validateCleanup(originalContent, cleanedContent);
    
    if (!validation.success) {
      log('❌ 清理验证失败，不写入文件', 'ERROR');
      return;
    }
    
    // 8. 写入清理后的文件
    fs.writeFileSync(CONFIG.indexFile, cleanedContent);
    log(`✅ 清理完成，已写入: ${CONFIG.indexFile}`);
    
    log('📋 清理总结:');
    log(`  移除了 ${validation.removedDuplicates} 个重复路由`);
    log(`  清理了 ${duplicateBlocks.length} 个重复代码块`);
    log(`  备份文件: ${CONFIG.backupFile}`);
    
  } catch (error) {
    log(`❌ 执行失败: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    process.exit(1);
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
API路由冲突清理工具

用法:
  node clean-route-conflicts.js [选项]

选项:
  --dry-run    仅分析，不执行实际清理
  --help       显示此帮助信息

示例:
  node clean-route-conflicts.js --dry-run    # 分析模式
  node clean-route-conflicts.js              # 执行清理

注意:
  - 执行前会自动创建备份文件
  - 建议先在测试环境中验证
  - 清理后需要重启服务
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
