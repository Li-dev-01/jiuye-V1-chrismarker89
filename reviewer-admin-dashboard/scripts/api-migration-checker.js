#!/usr/bin/env node

/**
 * API迁移检测工具
 * 自动检测项目中使用已弃用API端点的代码
 */

const fs = require('fs');
const path = require('path');

// 已弃用的API端点映射
const DEPRECATED_API_MAPPINGS = {
  // 管理员API
  '/api/admin/dashboard/stats': '/api/simple-admin/dashboard',
  '/api/admin/questionnaires': '/api/simple-admin/questionnaires',
  '/api/admin/users/export': '/api/simple-admin/users/export',
  '/api/admin/users': '/api/simple-admin/users',
  
  // 审核员API
  '/api/reviewer/content': '/api/simple-reviewer/pending-reviews',
  '/api/reviewer/audit/submit': '/api/simple-reviewer/submit-review',
  '/api/reviewer/stats': '/api/simple-reviewer/stats',
  '/api/reviewer/dashboard': '/api/simple-reviewer/dashboard',
  
  // 其他API
  '/api/analytics/real-data': '/api/analytics/basic-stats',
  '/api/analytics/mock-data': '/api/analytics/distribution'
};

// 需要扫描的文件扩展名
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// 需要扫描的目录
const SCAN_DIRECTORIES = [
  'src',
  '../frontend/src',
  '../backend/src'
];

class APIMigrationChecker {
  constructor() {
    this.issues = [];
    this.scannedFiles = 0;
    this.totalIssues = 0;
  }

  /**
   * 扫描目录
   */
  scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  目录不存在: ${dirPath}`);
      return;
    }

    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules和build目录
        if (!['node_modules', 'build', 'dist', '.git'].includes(item)) {
          this.scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (SCAN_EXTENSIONS.includes(ext)) {
          this.scanFile(fullPath);
        }
      }
    }
  }

  /**
   * 扫描文件
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.scannedFiles++;
      
      // 检查已弃用的API端点
      this.checkDeprecatedAPIs(filePath, content);
      
      // 检查认证方式
      this.checkAuthenticationMethod(filePath, content);
      
    } catch (error) {
      console.error(`❌ 读取文件失败: ${filePath}`, error.message);
    }
  }

  /**
   * 检查已弃用的API端点
   */
  checkDeprecatedAPIs(filePath, content) {
    const lines = content.split('\n');
    
    Object.entries(DEPRECATED_API_MAPPINGS).forEach(([deprecated, replacement]) => {
      lines.forEach((line, index) => {
        if (line.includes(deprecated)) {
          this.addIssue({
            type: 'deprecated_api',
            severity: 'high',
            file: filePath,
            line: index + 1,
            lineContent: line.trim(),
            deprecated: deprecated,
            replacement: replacement,
            message: `使用了已弃用的API端点: ${deprecated}`,
            recommendation: `建议替换为: ${replacement}`
          });
        }
      });
    });
  }

  /**
   * 检查认证方式
   */
  checkAuthenticationMethod(filePath, content) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // 检查是否使用了旧的认证方式
      if (line.includes('adminApi.') || line.includes('managementApi.')) {
        if (!line.includes('Bearer') && line.includes('get(') || line.includes('post(')) {
          this.addIssue({
            type: 'auth_method',
            severity: 'medium',
            file: filePath,
            line: index + 1,
            lineContent: line.trim(),
            message: '可能使用了旧的认证方式',
            recommendation: '确保使用Bearer token认证'
          });
        }
      }
    });
  }

  /**
   * 添加问题
   */
  addIssue(issue) {
    this.issues.push(issue);
    this.totalIssues++;
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n🔍 API迁移检测报告');
    console.log('='.repeat(50));
    console.log(`📁 扫描文件数: ${this.scannedFiles}`);
    console.log(`🚨 发现问题数: ${this.totalIssues}`);
    console.log('');

    if (this.totalIssues === 0) {
      console.log('✅ 恭喜！未发现需要迁移的API调用');
      return;
    }

    // 按严重程度分组
    const groupedIssues = this.groupIssuesBySeverity();
    
    Object.entries(groupedIssues).forEach(([severity, issues]) => {
      const icon = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
      console.log(`${icon} ${severity.toUpperCase()} 级别问题 (${issues.length}个):`);
      console.log('-'.repeat(30));
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        console.log(`   文件: ${issue.file}:${issue.line}`);
        console.log(`   代码: ${issue.lineContent}`);
        if (issue.deprecated && issue.replacement) {
          console.log(`   替换: ${issue.deprecated} → ${issue.replacement}`);
        }
        console.log(`   建议: ${issue.recommendation}`);
        console.log('');
      });
    });

    // 生成迁移建议
    this.generateMigrationSuggestions();
  }

  /**
   * 按严重程度分组问题
   */
  groupIssuesBySeverity() {
    return this.issues.reduce((groups, issue) => {
      const severity = issue.severity;
      if (!groups[severity]) {
        groups[severity] = [];
      }
      groups[severity].push(issue);
      return groups;
    }, {});
  }

  /**
   * 生成迁移建议
   */
  generateMigrationSuggestions() {
    console.log('💡 迁移建议:');
    console.log('-'.repeat(20));
    
    const deprecatedAPIs = this.issues.filter(issue => issue.type === 'deprecated_api');
    const authIssues = this.issues.filter(issue => issue.type === 'auth_method');
    
    if (deprecatedAPIs.length > 0) {
      console.log('1. API端点迁移:');
      const uniqueAPIs = [...new Set(deprecatedAPIs.map(issue => issue.deprecated))];
      uniqueAPIs.forEach(api => {
        const replacement = DEPRECATED_API_MAPPINGS[api];
        console.log(`   • ${api} → ${replacement}`);
      });
      console.log('');
    }
    
    if (authIssues.length > 0) {
      console.log('2. 认证方式更新:');
      console.log('   • 确保使用 Bearer token 认证');
      console.log('   • 检查 Authorization 头设置');
      console.log('   • 验证 token 获取方式');
      console.log('');
    }
    
    console.log('3. 下一步行动:');
    console.log('   • 查看 API-MIGRATION-GUIDE.md 获取详细迁移指南');
    console.log('   • 优先处理 HIGH 级别问题');
    console.log('   • 在测试环境验证修改');
    console.log('   • 逐步部署到生产环境');
  }

  /**
   * 生成JSON报告
   */
  generateJSONReport(outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        scannedFiles: this.scannedFiles,
        totalIssues: this.totalIssues,
        highSeverity: this.issues.filter(i => i.severity === 'high').length,
        mediumSeverity: this.issues.filter(i => i.severity === 'medium').length,
        lowSeverity: this.issues.filter(i => i.severity === 'low').length
      },
      issues: this.issues,
      recommendations: {
        apiMigrations: Object.entries(DEPRECATED_API_MAPPINGS),
        nextSteps: [
          '查看 API-MIGRATION-GUIDE.md',
          '优先处理 HIGH 级别问题',
          '在测试环境验证修改',
          '逐步部署到生产环境'
        ]
      }
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON报告已保存到: ${outputPath}`);
  }

  /**
   * 运行检测
   */
  run() {
    console.log('🚀 启动API迁移检测...\n');
    
    SCAN_DIRECTORIES.forEach(dir => {
      console.log(`📁 扫描目录: ${dir}`);
      this.scanDirectory(dir);
    });
    
    this.generateReport();
    
    // 生成JSON报告
    const jsonReportPath = path.join(__dirname, '../api-migration-report.json');
    this.generateJSONReport(jsonReportPath);
    
    // 返回退出码
    return this.totalIssues > 0 ? 1 : 0;
  }
}

// 主程序
if (require.main === module) {
  const checker = new APIMigrationChecker();
  const exitCode = checker.run();
  process.exit(exitCode);
}

module.exports = APIMigrationChecker;
