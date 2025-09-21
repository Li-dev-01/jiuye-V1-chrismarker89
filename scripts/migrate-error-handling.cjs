#!/usr/bin/env node

/**
 * 错误处理迁移脚本
 * 自动将现有的错误处理代码迁移到标准化格式
 */

const fs = require('fs');
const path = require('path');

class ErrorHandlingMigrator {
  constructor() {
    this.backendPath = path.join(__dirname, '../backend/src');
    this.routesPath = path.join(this.backendPath, 'routes');
    this.migratedFiles = [];
    this.errors = [];
  }

  /**
   * 扫描所有路由文件
   */
  scanRouteFiles() {
    console.log('🔍 扫描路由文件...');
    
    const files = [];
    
    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      });
    }
    
    scanDirectory(this.routesPath);
    
    console.log(`  发现 ${files.length} 个TypeScript文件`);
    return files;
  }

  /**
   * 分析文件中的错误处理模式
   */
  analyzeErrorPatterns(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const patterns = [];
    
    // 查找错误处理模式
    const errorPatterns = [
      // 模式1: return c.json({ success: false, error: ... })
      {
        regex: /return\s+c\.json\(\s*{\s*success:\s*false[^}]*}/g,
        type: 'direct_error_response'
      },
      // 模式2: catch块中的错误处理
      {
        regex: /catch\s*\([^)]*\)\s*{[^}]*return\s+c\.json[^}]*}/g,
        type: 'catch_block_error'
      },
      // 模式3: 条件错误返回
      {
        regex: /if\s*\([^)]*\)\s*{[^}]*return\s+c\.json\([^}]*success:\s*false[^}]*}/g,
        type: 'conditional_error'
      }
    ];
    
    errorPatterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        patterns.push({
          type: pattern.type,
          count: matches.length,
          examples: matches.slice(0, 3) // 保留前3个示例
        });
      }
    });
    
    return patterns;
  }

  /**
   * 生成迁移后的代码
   */
  generateMigratedCode(originalCode) {
    let migratedCode = originalCode;
    
    // 添加标准响应工具的导入
    if (!migratedCode.includes('standardResponse')) {
      const importMatch = migratedCode.match(/import[^;]+from\s+['"][^'"]+['"];?\s*\n/g);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        const importIndex = migratedCode.indexOf(lastImport) + lastImport.length;
        
        const standardImport = `import {\n  successResponse,\n  errorResponse,\n  validationErrorResponse,\n  authenticationErrorResponse,\n  authorizationErrorResponse,\n  notFoundResponse,\n  internalErrorResponse,\n  databaseErrorResponse,\n  routeErrorHandler,\n  ErrorCodes\n} from '../utils/standardResponse';\n\n`;
        
        migratedCode = migratedCode.slice(0, importIndex) + standardImport + migratedCode.slice(importIndex);
      }
    }
    
    // 替换常见的错误处理模式
    const replacements = [
      // 替换简单的成功响应
      {
        pattern: /return\s+c\.json\(\s*{\s*success:\s*true,\s*data:\s*([^,}]+),?\s*message:\s*['"]([^'"]+)['"][^}]*}\s*\)/g,
        replacement: 'return successResponse(c, $1, "$2")'
      },
      // 替换简单的错误响应
      {
        pattern: /return\s+c\.json\(\s*{\s*success:\s*false,\s*error:\s*['"]([^'"]+)['"],?\s*message:\s*['"]([^'"]+)['"][^}]*}\s*,?\s*(\d+)?\s*\)/g,
        replacement: 'return errorResponse(c, ErrorCodes.INTERNAL_ERROR, "$2")'
      },
      // 替换验证错误
      {
        pattern: /return\s+c\.json\(\s*{\s*success:\s*false,\s*error:\s*['"]Validation\s*Error['"],?\s*message:\s*['"]([^'"]+)['"][^}]*}\s*,?\s*400\s*\)/g,
        replacement: 'return validationErrorResponse(c, "$1")'
      },
      // 替换认证错误
      {
        pattern: /return\s+c\.json\(\s*{\s*success:\s*false,\s*error:\s*['"]Authentication\s*Error['"],?\s*message:\s*['"]([^'"]+)['"][^}]*}\s*,?\s*401\s*\)/g,
        replacement: 'return authenticationErrorResponse(c, "$1")'
      },
      // 替换未找到错误
      {
        pattern: /return\s+c\.json\(\s*{\s*success:\s*false,\s*error:\s*['"]Not\s*Found['"],?\s*message:\s*['"]([^'"]+)['"][^}]*}\s*,?\s*404\s*\)/g,
        replacement: 'return notFoundResponse(c, "$1")'
      }
    ];
    
    replacements.forEach(({ pattern, replacement }) => {
      migratedCode = migratedCode.replace(pattern, replacement);
    });
    
    return migratedCode;
  }

  /**
   * 迁移单个文件
   */
  migrateFile(filePath) {
    console.log(`📝 迁移文件: ${path.relative(this.backendPath, filePath)}`);
    
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const patterns = this.analyzeErrorPatterns(filePath);
      
      if (patterns.length === 0) {
        console.log('  ✅ 无需迁移');
        return { migrated: false, patterns: 0 };
      }
      
      const migratedContent = this.generateMigratedCode(originalContent);
      
      // 创建备份
      const backupPath = filePath + '.backup';
      fs.writeFileSync(backupPath, originalContent);
      
      // 写入迁移后的内容
      fs.writeFileSync(filePath, migratedContent);
      
      const totalPatterns = patterns.reduce((sum, p) => sum + p.count, 0);
      
      console.log(`  ✅ 迁移完成，处理了 ${totalPatterns} 个错误处理模式`);
      console.log(`  📄 备份文件: ${path.relative(this.backendPath, backupPath)}`);
      
      this.migratedFiles.push({
        file: filePath,
        patterns: totalPatterns,
        backup: backupPath
      });
      
      return { migrated: true, patterns: totalPatterns };
      
    } catch (error) {
      console.error(`  ❌ 迁移失败: ${error.message}`);
      this.errors.push({
        file: filePath,
        error: error.message
      });
      
      return { migrated: false, patterns: 0, error: error.message };
    }
  }

  /**
   * 生成迁移报告
   */
  generateMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.migratedFiles.length,
        totalPatterns: this.migratedFiles.reduce((sum, f) => sum + f.patterns, 0),
        errors: this.errors.length
      },
      migratedFiles: this.migratedFiles,
      errors: this.errors,
      recommendations: []
    };
    
    // 生成建议
    if (report.summary.totalPatterns > 0) {
      report.recommendations.push('建议测试所有迁移的端点以确保功能正常');
      report.recommendations.push('可以删除备份文件（.backup）如果迁移成功');
    }
    
    if (report.summary.errors > 0) {
      report.recommendations.push('检查失败的文件并手动修复');
    }
    
    // 保存报告
    fs.writeFileSync('error-handling-migration-report.json', JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * 显示迁移摘要
   */
  showMigrationSummary(report) {
    console.log('\n📊 错误处理迁移报告');
    console.log('=' * 50);
    
    console.log(`迁移文件数: ${report.summary.totalFiles}`);
    console.log(`处理模式数: ${report.summary.totalPatterns}`);
    console.log(`错误数量: ${report.summary.errors}`);
    
    if (report.summary.totalFiles > 0) {
      console.log('\n✅ 成功迁移的文件:');
      report.migratedFiles.forEach(file => {
        const relativePath = path.relative(this.backendPath, file.file);
        console.log(`  ${relativePath} (${file.patterns} 个模式)`);
      });
    }
    
    if (report.summary.errors > 0) {
      console.log('\n❌ 迁移失败的文件:');
      report.errors.forEach(error => {
        const relativePath = path.relative(this.backendPath, error.file);
        console.log(`  ${relativePath}: ${error.error}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n📄 详细报告已保存: error-handling-migration-report.json`);
  }

  /**
   * 执行完整迁移
   */
  async runMigration() {
    console.log('🚀 开始错误处理迁移...\n');
    
    try {
      const files = this.scanRouteFiles();
      
      console.log('\n📝 开始迁移文件...');
      
      for (const file of files) {
        this.migrateFile(file);
      }
      
      const report = this.generateMigrationReport();
      this.showMigrationSummary(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ 迁移过程中出现错误:', error.message);
      throw error;
    }
  }

  /**
   * 回滚迁移
   */
  rollbackMigration() {
    console.log('🔄 回滚错误处理迁移...');
    
    let rolledBack = 0;
    
    this.migratedFiles.forEach(file => {
      try {
        if (fs.existsSync(file.backup)) {
          const backupContent = fs.readFileSync(file.backup, 'utf8');
          fs.writeFileSync(file.file, backupContent);
          fs.unlinkSync(file.backup);
          
          const relativePath = path.relative(this.backendPath, file.file);
          console.log(`  ✅ 回滚: ${relativePath}`);
          rolledBack++;
        }
      } catch (error) {
        console.error(`  ❌ 回滚失败: ${file.file} - ${error.message}`);
      }
    });
    
    console.log(`\n回滚完成，处理了 ${rolledBack} 个文件`);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  const migrator = new ErrorHandlingMigrator();

  switch (command) {
    case 'migrate':
      const report = await migrator.runMigration();
      process.exit(report.summary.errors > 0 ? 1 : 0);
      break;

    case 'rollback':
      // 加载之前的迁移报告
      try {
        const reportData = fs.readFileSync('error-handling-migration-report.json', 'utf8');
        const report = JSON.parse(reportData);
        migrator.migratedFiles = report.migratedFiles;
        migrator.rollbackMigration();
      } catch (error) {
        console.error('❌ 无法加载迁移报告，无法回滚:', error.message);
        process.exit(1);
      }
      break;

    case 'analyze':
      // 只分析，不迁移
      const files = migrator.scanRouteFiles();
      console.log('\n📊 错误处理模式分析:');
      
      files.forEach(file => {
        const patterns = migrator.analyzeErrorPatterns(file);
        if (patterns.length > 0) {
          const relativePath = path.relative(migrator.backendPath, file);
          console.log(`\n${relativePath}:`);
          patterns.forEach(pattern => {
            console.log(`  ${pattern.type}: ${pattern.count} 个`);
          });
        }
      });
      break;

    default:
      console.log('用法: node migrate-error-handling.cjs [migrate|rollback|analyze]');
      console.log('  migrate  - 执行错误处理迁移');
      console.log('  rollback - 回滚迁移更改');
      console.log('  analyze  - 只分析错误处理模式');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('错误处理迁移失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  ErrorHandlingMigrator
};
