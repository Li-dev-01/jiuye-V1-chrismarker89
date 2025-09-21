#!/usr/bin/env node

/**
 * API管理规范修复脚本
 * 自动检测和修复API管理中的问题
 */

const fs = require('fs');
const path = require('path');

/**
 * API管理问题检测器
 */
class ApiManagementFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.backendPath = path.join(__dirname, '../backend/src');
  }

  /**
   * 检测路由配置不一致问题
   */
  checkRouteConsistency() {
    console.log('🔍 检查路由配置一致性...');
    
    try {
      // 读取 index.ts 和 worker.ts
      const indexPath = path.join(this.backendPath, 'index.ts');
      const workerPath = path.join(this.backendPath, 'worker.ts');
      
      if (!fs.existsSync(indexPath) || !fs.existsSync(workerPath)) {
        this.issues.push({
          type: 'missing_files',
          severity: 'high',
          message: 'index.ts 或 worker.ts 文件不存在'
        });
        return;
      }
      
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const workerContent = fs.readFileSync(workerPath, 'utf8');
      
      // 提取路由配置
      const indexRoutes = this.extractRoutes(indexContent);
      const workerRoutes = this.extractRoutes(workerContent);
      
      // 比较路由差异
      const indexOnly = indexRoutes.filter(route => !workerRoutes.includes(route));
      const workerOnly = workerRoutes.filter(route => !indexRoutes.includes(route));
      
      if (indexOnly.length > 0) {
        this.issues.push({
          type: 'route_inconsistency',
          severity: 'medium',
          message: `index.ts 中有但 worker.ts 中缺失的路由: ${indexOnly.join(', ')}`,
          data: { missing: indexOnly, file: 'worker.ts' }
        });
      }
      
      if (workerOnly.length > 0) {
        this.issues.push({
          type: 'route_inconsistency',
          severity: 'medium',
          message: `worker.ts 中有但 index.ts 中缺失的路由: ${workerOnly.join(', ')}`,
          data: { missing: workerOnly, file: 'index.ts' }
        });
      }
      
      console.log(`  发现 ${indexOnly.length + workerOnly.length} 个路由不一致问题`);
      
    } catch (error) {
      this.issues.push({
        type: 'check_error',
        severity: 'high',
        message: `检查路由一致性失败: ${error.message}`
      });
    }
  }

  /**
   * 提取路由配置
   */
  extractRoutes(content) {
    const routes = [];
    const routeRegex = /api\.route\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      routes.push(match[1]);
    }
    
    return routes;
  }

  /**
   * 检测API版本管理
   */
  checkVersionManagement() {
    console.log('🔍 检查API版本管理...');
    
    try {
      const workerPath = path.join(this.backendPath, 'worker.ts');
      const content = fs.readFileSync(workerPath, 'utf8');
      
      // 检查是否有版本前缀
      const hasVersionPrefix = content.includes('/api/v1') || content.includes('/v1/');
      
      if (!hasVersionPrefix) {
        this.issues.push({
          type: 'no_version_management',
          severity: 'high',
          message: 'API缺少版本管理，建议添加 /api/v1/ 前缀',
          fix: 'add_version_prefix'
        });
      }
      
      console.log(`  版本管理: ${hasVersionPrefix ? '✅ 已实施' : '❌ 缺失'}`);
      
    } catch (error) {
      this.issues.push({
        type: 'check_error',
        severity: 'high',
        message: `检查版本管理失败: ${error.message}`
      });
    }
  }

  /**
   * 检测错误处理一致性
   */
  checkErrorHandling() {
    console.log('🔍 检查错误处理一致性...');
    
    try {
      const routesDir = path.join(this.backendPath, 'routes');
      const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.ts'));
      
      const errorFormats = new Set();
      let totalErrorHandlers = 0;
      
      routeFiles.forEach(file => {
        const filePath = path.join(routesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 查找错误处理模式
        const errorPatterns = [
          /return c\.json\(\s*{\s*success:\s*false/g,
          /catch\s*\([^)]*\)\s*{[^}]*return c\.json/g
        ];
        
        errorPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            totalErrorHandlers += matches.length;
            matches.forEach(match => {
              errorFormats.add(this.normalizeErrorFormat(match));
            });
          }
        });
      });
      
      if (errorFormats.size > 3) {
        this.issues.push({
          type: 'inconsistent_error_handling',
          severity: 'medium',
          message: `发现 ${errorFormats.size} 种不同的错误处理格式，建议统一`,
          data: { formats: Array.from(errorFormats), count: totalErrorHandlers }
        });
      }
      
      console.log(`  错误处理格式: ${errorFormats.size} 种，总计 ${totalErrorHandlers} 个处理器`);
      
    } catch (error) {
      this.issues.push({
        type: 'check_error',
        severity: 'high',
        message: `检查错误处理失败: ${error.message}`
      });
    }
  }

  /**
   * 标准化错误格式用于比较
   */
  normalizeErrorFormat(errorString) {
    return errorString
      .replace(/\s+/g, ' ')
      .replace(/['"]/g, '')
      .substring(0, 100);
  }

  /**
   * 检测API命名规范
   */
  checkNamingConventions() {
    console.log('🔍 检查API命名规范...');
    
    try {
      const workerPath = path.join(this.backendPath, 'worker.ts');
      const content = fs.readFileSync(workerPath, 'utf8');
      
      // 提取API路径
      const pathRegex = /['"`]([^'"`]*(?:questionnaire|analytics|admin|auth)[^'"`]*)['"`]/g;
      const paths = [];
      let match;
      
      while ((match = pathRegex.exec(content)) !== null) {
        paths.push(match[1]);
      }
      
      const namingIssues = [];
      
      paths.forEach(path => {
        // 检查是否使用了不规范的命名
        if (path.includes('_')) {
          namingIssues.push(`${path} 使用下划线，建议使用连字符`);
        }
        
        if (path.includes('universal-questionnaire')) {
          namingIssues.push(`${path} 路径过长，建议简化为 questionnaires`);
        }
        
        if (path.includes('participation-stats')) {
          namingIssues.push(`${path} 建议改为 participation/stats`);
        }
      });
      
      if (namingIssues.length > 0) {
        this.issues.push({
          type: 'naming_convention',
          severity: 'low',
          message: `发现 ${namingIssues.length} 个命名规范问题`,
          data: { issues: namingIssues }
        });
      }
      
      console.log(`  命名规范问题: ${namingIssues.length} 个`);
      
    } catch (error) {
      this.issues.push({
        type: 'check_error',
        severity: 'high',
        message: `检查命名规范失败: ${error.message}`
      });
    }
  }

  /**
   * 生成修复建议
   */
  generateFixSuggestions() {
    console.log('\n💡 生成修复建议...');
    
    this.issues.forEach((issue, index) => {
      const suggestion = {
        id: index + 1,
        issue: issue,
        priority: this.getPriority(issue.severity),
        actions: this.getFixActions(issue)
      };
      
      this.fixes.push(suggestion);
    });
  }

  /**
   * 获取优先级
   */
  getPriority(severity) {
    const priorities = {
      'high': 1,
      'medium': 2,
      'low': 3
    };
    return priorities[severity] || 3;
  }

  /**
   * 获取修复操作
   */
  getFixActions(issue) {
    const actions = [];
    
    switch (issue.type) {
      case 'route_inconsistency':
        actions.push('同步路由配置');
        actions.push('确保两个文件使用相同的路由注册');
        break;
        
      case 'no_version_management':
        actions.push('添加API版本前缀 /api/v1/');
        actions.push('创建版本管理中间件');
        break;
        
      case 'inconsistent_error_handling':
        actions.push('创建统一的错误处理工具函数');
        actions.push('更新所有路由使用标准错误格式');
        break;
        
      case 'naming_convention':
        actions.push('重构API路径命名');
        actions.push('更新前端API配置');
        break;
        
      default:
        actions.push('需要手动检查和修复');
    }
    
    return actions;
  }

  /**
   * 生成修复报告
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        highSeverity: this.issues.filter(i => i.severity === 'high').length,
        mediumSeverity: this.issues.filter(i => i.severity === 'medium').length,
        lowSeverity: this.issues.filter(i => i.severity === 'low').length
      },
      issues: this.issues,
      fixes: this.fixes.sort((a, b) => a.priority - b.priority)
    };
    
    // 保存报告
    fs.writeFileSync('api-management-issues.json', JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * 显示报告摘要
   */
  showSummary(report) {
    console.log('\n📊 API管理问题分析报告');
    console.log('=' * 50);
    
    console.log(`总问题数: ${report.summary.totalIssues}`);
    console.log(`🔴 高严重性: ${report.summary.highSeverity}`);
    console.log(`🟠 中严重性: ${report.summary.mediumSeverity}`);
    console.log(`🟡 低严重性: ${report.summary.lowSeverity}`);
    
    console.log('\n🔥 优先修复项目:');
    report.fixes.slice(0, 5).forEach(fix => {
      const emoji = fix.issue.severity === 'high' ? '🔴' : 
                   fix.issue.severity === 'medium' ? '🟠' : '🟡';
      console.log(`${emoji} ${fix.issue.message}`);
      fix.actions.forEach(action => {
        console.log(`   - ${action}`);
      });
    });
    
    console.log(`\n📄 详细报告已保存: api-management-issues.json`);
  }

  /**
   * 执行完整检查
   */
  async runFullCheck() {
    console.log('🚀 开始API管理规范检查...\n');
    
    try {
      this.checkRouteConsistency();
      this.checkVersionManagement();
      this.checkErrorHandling();
      this.checkNamingConventions();
      
      this.generateFixSuggestions();
      const report = this.generateReport();
      this.showSummary(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ 检查过程中出现错误:', error.message);
      throw error;
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  switch (command) {
    case 'check':
      const fixer = new ApiManagementFixer();
      const report = await fixer.runFullCheck();
      
      // 如果有高严重性问题，退出码为1
      process.exit(report.summary.highSeverity > 0 ? 1 : 0);
      break;

    case 'routes':
      // 只检查路由一致性
      const routeFixer = new ApiManagementFixer();
      routeFixer.checkRouteConsistency();
      console.log(JSON.stringify(routeFixer.issues, null, 2));
      break;

    default:
      console.log('用法: node fix-api-management.cjs [check|routes]');
      console.log('  check  - 执行完整的API管理检查');
      console.log('  routes - 只检查路由一致性');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('API管理检查失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  ApiManagementFixer
};
