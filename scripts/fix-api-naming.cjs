#!/usr/bin/env node

/**
 * API命名规范修复脚本
 * 自动修复API路径命名不规范的问题
 */

const fs = require('fs');
const path = require('path');

class ApiNamingFixer {
  constructor() {
    this.backendPath = path.join(__dirname, '../backend/src');
    this.frontendPath = path.join(__dirname, '../frontend/src');
    this.fixes = [];
    this.errors = [];
    
    // API路径重命名映射
    this.pathMappings = {
      // 简化长路径
      'universal-questionnaire': 'questionnaires',
      'participation-stats': 'participation/stats',
      'questionnaire-auth': 'auth/questionnaires',
      'heart-voices': 'heart-voices', // 保持一致
      'heart-voice': 'heart-voices', // 统一命名
      'auto-png': 'images/auto-generate',
      'png-test': 'images/test',
      'png-management': 'images/management',
      'png-queue': 'images/queue',
      'file-management': 'files',
      'database-monitor': 'admin/database',
      'tiered-audit': 'admin/audit',
      'super-admin': 'admin/super',
      'ai-sources': 'ai/sources'
    };
    
    // 查询参数重命名
    this.paramMappings = {
      'questionnaire_id': 'questionnaireId',
      'user_id': 'userId',
      'submission_id': 'submissionId',
      'heart_voice_id': 'heartVoiceId'
    };
  }

  /**
   * 扫描后端路由文件
   */
  scanBackendFiles() {
    console.log('🔍 扫描后端路由文件...');
    
    const files = [];
    const routesDir = path.join(this.backendPath, 'routes');
    
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir)
        .filter(file => file.endsWith('.ts'))
        .map(file => path.join(routesDir, file));
      
      files.push(...routeFiles);
    }
    
    // 添加主要配置文件
    const configFiles = [
      path.join(this.backendPath, 'worker.ts'),
      path.join(this.backendPath, 'index.ts')
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        files.push(file);
      }
    });
    
    console.log(`  发现 ${files.length} 个后端文件`);
    return files;
  }

  /**
   * 扫描前端API配置文件
   */
  scanFrontendFiles() {
    console.log('🔍 扫描前端API配置文件...');
    
    const files = [];
    
    // 查找API配置文件
    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.includes('api') || item.includes('service')) {
          if (item.endsWith('.ts') || item.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      });
    }
    
    scanDirectory(this.frontendPath);
    
    console.log(`  发现 ${files.length} 个前端文件`);
    return files;
  }

  /**
   * 分析文件中的命名问题
   */
  analyzeNamingIssues(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 检查路径命名问题
    Object.entries(this.pathMappings).forEach(([oldPath, newPath]) => {
      const regex = new RegExp(`['"\`]([^'"\`]*${oldPath}[^'"\`]*)['"\`]`, 'g');
      const matches = content.match(regex);
      
      if (matches) {
        issues.push({
          type: 'path_naming',
          oldPath,
          newPath,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    });
    
    // 检查参数命名问题
    Object.entries(this.paramMappings).forEach(([oldParam, newParam]) => {
      const regex = new RegExp(`['"\`]${oldParam}['"\`]`, 'g');
      const matches = content.match(regex);
      
      if (matches) {
        issues.push({
          type: 'param_naming',
          oldParam,
          newParam,
          count: matches.length
        });
      }
    });
    
    // 检查下划线使用
    const underscoreMatches = content.match(/['"\`][^'"\`]*_[^'"\`]*['"\`]/g);
    if (underscoreMatches) {
      const apiPaths = underscoreMatches.filter(match => 
        match.includes('/') || match.includes('api')
      );
      
      if (apiPaths.length > 0) {
        issues.push({
          type: 'underscore_usage',
          count: apiPaths.length,
          examples: apiPaths.slice(0, 3)
        });
      }
    }
    
    return issues;
  }

  /**
   * 修复文件中的命名问题
   */
  fixFileNaming(filePath) {
    console.log(`📝 修复文件: ${path.relative(process.cwd(), filePath)}`);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let changeCount = 0;
      
      // 修复路径命名
      Object.entries(this.pathMappings).forEach(([oldPath, newPath]) => {
        const regex = new RegExp(`(['"\`])([^'"\`]*${oldPath}[^'"\`]*)(['"\`])`, 'g');
        const newContent = content.replace(regex, (match, quote1, path, quote2) => {
          changeCount++;
          return `${quote1}${path.replace(oldPath, newPath)}${quote2}`;
        });
        content = newContent;
      });
      
      // 修复参数命名
      Object.entries(this.paramMappings).forEach(([oldParam, newParam]) => {
        const regex = new RegExp(`(['"\`])${oldParam}(['"\`])`, 'g');
        const newContent = content.replace(regex, `$1${newParam}$2`);
        if (newContent !== content) {
          changeCount++;
          content = newContent;
        }
      });
      
      if (changeCount > 0) {
        // 创建备份
        const backupPath = filePath + '.naming-backup';
        fs.writeFileSync(backupPath, originalContent);
        
        // 写入修复后的内容
        fs.writeFileSync(filePath, content);
        
        console.log(`  ✅ 修复完成，处理了 ${changeCount} 个命名问题`);
        console.log(`  📄 备份文件: ${path.relative(process.cwd(), backupPath)}`);
        
        this.fixes.push({
          file: filePath,
          changes: changeCount,
          backup: backupPath
        });
        
        return { fixed: true, changes: changeCount };
      } else {
        console.log('  ✅ 无需修复');
        return { fixed: false, changes: 0 };
      }
      
    } catch (error) {
      console.error(`  ❌ 修复失败: ${error.message}`);
      this.errors.push({
        file: filePath,
        error: error.message
      });
      
      return { fixed: false, changes: 0, error: error.message };
    }
  }

  /**
   * 生成命名规范指南
   */
  generateNamingGuide() {
    const guide = {
      title: 'API命名规范指南',
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      
      pathNaming: {
        title: '路径命名规范',
        rules: [
          '使用小写字母和连字符（kebab-case）',
          '避免使用下划线',
          '使用复数形式表示资源集合',
          '保持路径简洁明了',
          '使用层级结构表示资源关系'
        ],
        examples: {
          good: [
            '/api/v1/questionnaires',
            '/api/v1/questionnaires/{id}/statistics',
            '/api/v1/admin/users',
            '/api/v1/images/auto-generate'
          ],
          bad: [
            '/api/universal-questionnaire',
            '/api/questionnaire_auth',
            '/api/png_test',
            '/api/participation-stats'
          ]
        }
      },
      
      parameterNaming: {
        title: '参数命名规范',
        rules: [
          '使用驼峰命名法（camelCase）',
          '避免使用下划线',
          '使用描述性的名称',
          '保持一致性'
        ],
        examples: {
          good: [
            'questionnaireId',
            'userId',
            'submissionId',
            'pageSize'
          ],
          bad: [
            'questionnaire_id',
            'user_id',
            'submission_id',
            'page_size'
          ]
        }
      },
      
      versionManagement: {
        title: '版本管理规范',
        rules: [
          '所有API使用版本前缀 /api/v1/',
          '主要版本变更时递增版本号',
          '保持向后兼容性',
          '提供版本迁移指南'
        ],
        examples: [
          '/api/v1/questionnaires',
          '/api/v2/questionnaires'
        ]
      },
      
      appliedMappings: {
        pathMappings: this.pathMappings,
        paramMappings: this.paramMappings
      }
    };
    
    fs.writeFileSync('api-naming-guide.json', JSON.stringify(guide, null, 2));
    console.log('📚 API命名规范指南已生成: api-naming-guide.json');
    
    return guide;
  }

  /**
   * 生成修复报告
   */
  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.fixes.length,
        totalChanges: this.fixes.reduce((sum, f) => sum + f.changes, 0),
        errors: this.errors.length
      },
      fixes: this.fixes,
      errors: this.errors,
      pathMappings: this.pathMappings,
      paramMappings: this.paramMappings,
      recommendations: [
        '测试所有修复的API端点',
        '更新API文档以反映新的命名规范',
        '通知前端团队更新API调用',
        '如果修复成功，可以删除备份文件'
      ]
    };
    
    fs.writeFileSync('api-naming-fix-report.json', JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * 显示修复摘要
   */
  showFixSummary(report) {
    console.log('\n📊 API命名规范修复报告');
    console.log('=' * 50);
    
    console.log(`修复文件数: ${report.summary.totalFiles}`);
    console.log(`总修复数: ${report.summary.totalChanges}`);
    console.log(`错误数量: ${report.summary.errors}`);
    
    if (report.summary.totalFiles > 0) {
      console.log('\n✅ 成功修复的文件:');
      report.fixes.forEach(fix => {
        const relativePath = path.relative(process.cwd(), fix.file);
        console.log(`  ${relativePath} (${fix.changes} 个修复)`);
      });
    }
    
    if (report.summary.errors > 0) {
      console.log('\n❌ 修复失败的文件:');
      report.errors.forEach(error => {
        const relativePath = path.relative(process.cwd(), error.file);
        console.log(`  ${relativePath}: ${error.error}`);
      });
    }
    
    console.log('\n🔄 主要路径映射:');
    Object.entries(this.pathMappings).forEach(([old, new_]) => {
      console.log(`  ${old} → ${new_}`);
    });
    
    console.log('\n💡 建议:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log(`\n📄 详细报告已保存: api-naming-fix-report.json`);
  }

  /**
   * 执行完整修复
   */
  async runFix() {
    console.log('🚀 开始API命名规范修复...\n');
    
    try {
      // 扫描文件
      const backendFiles = this.scanBackendFiles();
      const frontendFiles = this.scanFrontendFiles();
      const allFiles = [...backendFiles, ...frontendFiles];
      
      console.log('\n📝 开始修复文件...');
      
      // 修复每个文件
      for (const file of allFiles) {
        this.fixFileNaming(file);
      }
      
      // 生成指南和报告
      this.generateNamingGuide();
      const report = this.generateFixReport();
      this.showFixSummary(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ 修复过程中出现错误:', error.message);
      throw error;
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'fix';

  const fixer = new ApiNamingFixer();

  switch (command) {
    case 'fix':
      const report = await fixer.runFix();
      process.exit(report.summary.errors > 0 ? 1 : 0);
      break;

    case 'analyze':
      // 只分析，不修复
      const backendFiles = fixer.scanBackendFiles();
      const frontendFiles = fixer.scanFrontendFiles();
      const allFiles = [...backendFiles, ...frontendFiles];
      
      console.log('\n📊 API命名问题分析:');
      
      allFiles.forEach(file => {
        const issues = fixer.analyzeNamingIssues(file);
        if (issues.length > 0) {
          const relativePath = path.relative(process.cwd(), file);
          console.log(`\n${relativePath}:`);
          issues.forEach(issue => {
            console.log(`  ${issue.type}: ${issue.count} 个问题`);
          });
        }
      });
      break;

    case 'guide':
      // 只生成命名规范指南
      fixer.generateNamingGuide();
      break;

    default:
      console.log('用法: node fix-api-naming.cjs [fix|analyze|guide]');
      console.log('  fix     - 执行API命名规范修复');
      console.log('  analyze - 只分析命名问题');
      console.log('  guide   - 生成命名规范指南');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('API命名规范修复失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  ApiNamingFixer
};
