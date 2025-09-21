#!/usr/bin/env node

/**
 * 全局API端点审计工具
 * 扫描整个项目，检查API端点使用的一致性和正确性
 */

const fs = require('fs');
const path = require('path');

// ===== 1. 配置和常量 =====

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend/src');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend/src');

// 已知的正确API端点
const CORRECT_API_ENDPOINTS = {
  // Universal Questionnaire API
  'universal-questionnaire-statistics': '/api/universal-questionnaire/statistics/employment-survey-2024',
  'universal-questionnaire-submit': '/api/universal-questionnaire/submit',
  'universal-questionnaire-definition': '/api/universal-questionnaire/definition',
  
  // Analytics API
  'analytics-dashboard': '/api/analytics/dashboard',
  'analytics-real-time': '/api/analytics/real-time-stats',
  
  // 已弃用的API端点
  'deprecated-real-data': '/api/analytics/real-data', // 应该被替换
  'deprecated-mock-data': '/api/analytics/mock-data', // 应该被替换
};

// 错误的API端点模式
const PROBLEMATIC_PATTERNS = [
  {
    pattern: /\/api\/analytics\/real-data/g,
    issue: 'deprecated_endpoint',
    severity: 'error',
    replacement: '/api/universal-questionnaire/statistics/employment-survey-2024',
    description: '使用了已弃用的 real-data 端点'
  },
  {
    pattern: /\/api\/analytics\/mock-data/g,
    issue: 'deprecated_endpoint',
    severity: 'error',
    replacement: '/api/universal-questionnaire/statistics/employment-survey-2024',
    description: '使用了已弃用的 mock-data 端点'
  },
  {
    pattern: /localhost:8005/g,
    issue: 'hardcoded_localhost',
    severity: 'warning',
    replacement: 'import.meta.env.VITE_API_BASE_URL',
    description: '硬编码了 localhost 地址'
  },
  {
    pattern: /http:\/\/localhost:\d+/g,
    issue: 'hardcoded_url',
    severity: 'warning',
    replacement: '使用环境变量',
    description: '硬编码了完整的本地URL'
  }
];

// ===== 2. 文件扫描器 =====

class FileScanner {
  constructor() {
    this.results = [];
    this.scannedFiles = 0;
    this.totalIssues = 0;
  }

  /**
   * 扫描目录中的所有相关文件
   */
  scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    if (!fs.existsSync(dir)) {
      console.warn(`目录不存在: ${dir}`);
      return;
    }

    const files = this.getAllFiles(dir, extensions);
    console.log(`📁 扫描目录: ${dir}`);
    console.log(`📄 找到 ${files.length} 个文件`);

    for (const file of files) {
      this.scanFile(file);
    }
  }

  /**
   * 递归获取所有指定扩展名的文件
   */
  getAllFiles(dir, extensions) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // 跳过 node_modules 和 .git 目录
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          files = files.concat(this.getAllFiles(fullPath, extensions));
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * 扫描单个文件
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      
      this.scannedFiles++;
      
      // 检查每个问题模式
      for (const pattern of PROBLEMATIC_PATTERNS) {
        const matches = [...content.matchAll(pattern.pattern)];
        
        for (const match of matches) {
          const lineNumber = this.getLineNumber(content, match.index);
          const lineContent = this.getLineContent(content, lineNumber);
          
          this.results.push({
            file: relativePath,
            line: lineNumber,
            issue: pattern.issue,
            severity: pattern.severity,
            description: pattern.description,
            found: match[0],
            replacement: pattern.replacement,
            lineContent: lineContent.trim(),
            context: this.getContext(content, lineNumber)
          });
          
          this.totalIssues++;
        }
      }

      // 检查API调用模式
      this.checkApiCallPatterns(content, relativePath);

    } catch (error) {
      console.error(`扫描文件失败 ${filePath}:`, error.message);
    }
  }

  /**
   * 检查API调用模式
   */
  checkApiCallPatterns(content, relativePath) {
    // 检查 fetch 调用
    const fetchPattern = /fetch\s*\(\s*[`'"](.*?)[`'"]/g;
    const fetchMatches = [...content.matchAll(fetchPattern)];
    
    for (const match of fetchMatches) {
      const url = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      
      // 检查是否使用了正确的API端点
      if (url.includes('/api/')) {
        const isKnownEndpoint = Object.values(CORRECT_API_ENDPOINTS).some(endpoint => 
          url.includes(endpoint)
        );
        
        if (!isKnownEndpoint && !url.includes('${') && !url.includes('import.meta.env')) {
          this.results.push({
            file: relativePath,
            line: lineNumber,
            issue: 'unknown_api_endpoint',
            severity: 'warning',
            description: '使用了未知的API端点',
            found: url,
            replacement: '检查是否应该使用标准端点',
            lineContent: this.getLineContent(content, lineNumber).trim(),
            context: this.getContext(content, lineNumber)
          });
          
          this.totalIssues++;
        }
      }
    }

    // 检查 axios 调用
    const axiosPattern = /axios\.(get|post|put|delete)\s*\(\s*[`'"](.*?)[`'"]/g;
    const axiosMatches = [...content.matchAll(axiosPattern)];
    
    for (const match of axiosMatches) {
      const url = match[2];
      const lineNumber = this.getLineNumber(content, match.index);
      
      if (url.includes('/api/') && !url.includes('${') && !url.includes('import.meta.env')) {
        const isKnownEndpoint = Object.values(CORRECT_API_ENDPOINTS).some(endpoint => 
          url.includes(endpoint)
        );
        
        if (!isKnownEndpoint) {
          this.results.push({
            file: relativePath,
            line: lineNumber,
            issue: 'unknown_api_endpoint',
            severity: 'warning',
            description: '使用了未知的API端点',
            found: url,
            replacement: '检查是否应该使用标准端点',
            lineContent: this.getLineContent(content, lineNumber).trim(),
            context: this.getContext(content, lineNumber)
          });
          
          this.totalIssues++;
        }
      }
    }
  }

  /**
   * 获取行号
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 获取指定行的内容
   */
  getLineContent(content, lineNumber) {
    const lines = content.split('\n');
    return lines[lineNumber - 1] || '';
  }

  /**
   * 获取上下文
   */
  getContext(content, lineNumber, contextLines = 2) {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    
    return lines.slice(start, end).map((line, index) => ({
      lineNumber: start + index + 1,
      content: line,
      isTarget: start + index + 1 === lineNumber
    }));
  }

  /**
   * 获取扫描结果
   */
  getResults() {
    return {
      summary: {
        scannedFiles: this.scannedFiles,
        totalIssues: this.totalIssues,
        errorCount: this.results.filter(r => r.severity === 'error').length,
        warningCount: this.results.filter(r => r.severity === 'warning').length,
        infoCount: this.results.filter(r => r.severity === 'info').length
      },
      issues: this.results,
      byFile: this.groupByFile(),
      bySeverity: this.groupBySeverity(),
      byIssueType: this.groupByIssueType()
    };
  }

  /**
   * 按文件分组
   */
  groupByFile() {
    const grouped = {};
    for (const result of this.results) {
      if (!grouped[result.file]) {
        grouped[result.file] = [];
      }
      grouped[result.file].push(result);
    }
    return grouped;
  }

  /**
   * 按严重程度分组
   */
  groupBySeverity() {
    const grouped = { error: [], warning: [], info: [] };
    for (const result of this.results) {
      grouped[result.severity].push(result);
    }
    return grouped;
  }

  /**
   * 按问题类型分组
   */
  groupByIssueType() {
    const grouped = {};
    for (const result of this.results) {
      if (!grouped[result.issue]) {
        grouped[result.issue] = [];
      }
      grouped[result.issue].push(result);
    }
    return grouped;
  }
}

// ===== 3. 报告生成器 =====

class ReportGenerator {
  /**
   * 生成控制台报告
   */
  static generateConsoleReport(results) {
    const { summary, issues, bySeverity } = results;
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 全局API端点审计报告');
    console.log('='.repeat(80));
    
    // 摘要
    console.log('\n📊 扫描摘要:');
    console.log(`   📄 扫描文件: ${summary.scannedFiles} 个`);
    console.log(`   🔍 发现问题: ${summary.totalIssues} 个`);
    console.log(`   ❌ 错误: ${summary.errorCount} 个`);
    console.log(`   ⚠️  警告: ${summary.warningCount} 个`);
    console.log(`   ℹ️  信息: ${summary.infoCount} 个`);
    
    // 按严重程度显示问题
    if (summary.errorCount > 0) {
      console.log('\n❌ 严重问题 (需要立即修复):');
      bySeverity.error.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.file}:${issue.line}`);
        console.log(`      问题: ${issue.description}`);
        console.log(`      发现: ${issue.found}`);
        console.log(`      建议: ${issue.replacement}`);
        console.log('');
      });
    }
    
    if (summary.warningCount > 0) {
      console.log('\n⚠️  警告问题 (建议修复):');
      bySeverity.warning.slice(0, 10).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.file}:${issue.line}`);
        console.log(`      问题: ${issue.description}`);
        console.log(`      发现: ${issue.found}`);
        console.log('');
      });
      
      if (bySeverity.warning.length > 10) {
        console.log(`   ... 还有 ${bySeverity.warning.length - 10} 个警告`);
      }
    }
    
    // 总体状态
    console.log('\n' + '='.repeat(80));
    if (summary.errorCount === 0) {
      console.log('✅ 审计状态: 通过 (无严重问题)');
    } else {
      console.log('❌ 审计状态: 失败 (存在严重问题)');
    }
    console.log('='.repeat(80));
  }

  /**
   * 生成JSON报告
   */
  static generateJsonReport(results, outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...results
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON报告已保存: ${outputPath}`);
  }
}

// ===== 4. 主程序 =====

async function main() {
  console.log('🚀 启动全局API端点审计...\n');
  
  const scanner = new FileScanner();
  
  // 扫描前端代码
  console.log('📱 扫描前端代码...');
  scanner.scanDirectory(FRONTEND_DIR);
  
  // 扫描后端代码
  console.log('\n🖥️  扫描后端代码...');
  scanner.scanDirectory(BACKEND_DIR);
  
  // 获取结果
  const results = scanner.getResults();
  
  // 生成报告
  ReportGenerator.generateConsoleReport(results);
  
  // 保存JSON报告
  const jsonReportPath = path.join(PROJECT_ROOT, 'docs/troubleshooting/api-audit-report.json');
  ReportGenerator.generateJsonReport(results, jsonReportPath);
  
  // 退出码
  process.exit(results.summary.errorCount > 0 ? 1 : 0);
}

// 运行主程序
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 审计失败:', error);
    process.exit(1);
  });
}

module.exports = { FileScanner, ReportGenerator };
