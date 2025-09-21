#!/usr/bin/env node

/**
 * API端点审计工具
 * 检查项目中所有API调用，识别错误的端点使用
 * 确保数据一致性和API规范性
 */

const fs = require('fs');
const path = require('path');

class APIEndpointAuditor {
  constructor() {
    this.projectRoot = process.cwd();
    this.frontendDir = path.join(this.projectRoot, 'frontend/src');
    this.backendDir = path.join(this.projectRoot, 'backend/src');
    
    this.apiCalls = [];
    this.issues = [];
    this.recommendations = [];
    
    // 定义正确的API端点
    this.correctEndpoints = {
      statistics: '/api/universal-questionnaire/statistics/employment-survey-2024',
      questionnaire: '/api/universal-questionnaire',
      analytics: '/api/analytics',
      reviewer: '/api/reviewer'
    };
    
    // 定义已知的错误端点
    this.deprecatedEndpoints = [
      '/api/analytics/real-data',
      '/api/analytics/dashboard',
      '/questionnaire/statistics',
      '/api/questionnaire/statistics'
    ];
  }

  /**
   * 扫描文件中的API调用
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);
      
      // 匹配fetch调用
      const fetchMatches = content.match(/fetch\s*\(\s*[`'"](.*?)[`'"]/g);
      if (fetchMatches) {
        fetchMatches.forEach(match => {
          const url = match.match(/[`'"](.*?)[`'"]/)[1];
          this.apiCalls.push({
            file: relativePath,
            type: 'fetch',
            url: url,
            line: this.getLineNumber(content, match)
          });
        });
      }
      
      // 匹配axios调用
      const axiosMatches = content.match(/axios\.(get|post|put|delete|patch)\s*\(\s*[`'"](.*?)[`'"]/g);
      if (axiosMatches) {
        axiosMatches.forEach(match => {
          const url = match.match(/[`'"](.*?)[`'"]/)[1];
          this.apiCalls.push({
            file: relativePath,
            type: 'axios',
            url: url,
            line: this.getLineNumber(content, match)
          });
        });
      }
      
      // 匹配ApiService调用
      const apiServiceMatches = content.match(/ApiService\.(get|post|put|delete|patch)\s*\(\s*[`'"](.*?)[`'"]/g);
      if (apiServiceMatches) {
        apiServiceMatches.forEach(match => {
          const url = match.match(/[`'"](.*?)[`'"]/)[1];
          this.apiCalls.push({
            file: relativePath,
            type: 'ApiService',
            url: url,
            line: this.getLineNumber(content, match)
          });
        });
      }
      
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
    }
  }

  /**
   * 获取匹配内容的行号
   */
  getLineNumber(content, match) {
    const index = content.indexOf(match);
    if (index === -1) return 0;
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 递归扫描目录
   */
  scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // 跳过node_modules和其他不需要的目录
          if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
            this.scanDirectory(filePath);
          }
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
          this.scanFile(filePath);
        }
      });
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error.message);
    }
  }

  /**
   * 分析API调用
   */
  analyzeAPICalls() {
    this.apiCalls.forEach(call => {
      // 检查是否使用了已弃用的端点
      const isDeprecated = this.deprecatedEndpoints.some(deprecated => 
        call.url.includes(deprecated)
      );
      
      if (isDeprecated) {
        this.issues.push({
          type: 'deprecated_endpoint',
          severity: 'high',
          file: call.file,
          line: call.line,
          current: call.url,
          message: `使用了已弃用的API端点: ${call.url}`,
          recommendation: this.getRecommendation(call.url)
        });
      }
      
      // 检查统计数据API的使用
      if (call.url.includes('/analytics/real-data')) {
        this.issues.push({
          type: 'incorrect_statistics_api',
          severity: 'critical',
          file: call.file,
          line: call.line,
          current: call.url,
          message: '使用了错误的统计API端点，会导致数据百分比计算错误',
          recommendation: '应使用: /api/universal-questionnaire/statistics/employment-survey-2024'
        });
      }
      
      // 检查相对路径API调用
      if (call.url.startsWith('/api/') && !call.url.includes('${')) {
        this.recommendations.push({
          type: 'hardcoded_api_url',
          severity: 'medium',
          file: call.file,
          line: call.line,
          current: call.url,
          message: '硬编码的API URL，建议使用环境变量',
          recommendation: '使用 ${apiBaseUrl} 前缀'
        });
      }
    });
  }

  /**
   * 获取推荐的替代端点
   */
  getRecommendation(url) {
    if (url.includes('/analytics/real-data')) {
      return '/api/universal-questionnaire/statistics/employment-survey-2024';
    }
    if (url.includes('/questionnaire/statistics')) {
      return '/api/universal-questionnaire/statistics/employment-survey-2024';
    }
    return '请查阅API文档获取正确端点';
  }

  /**
   * 生成审计报告
   */
  generateReport() {
    console.log('\n🔍 API端点审计报告');
    console.log('='.repeat(60));
    
    console.log(`\n📊 扫描统计:`);
    console.log(`  • 扫描文件: ${this.getUniqueFiles().length} 个`);
    console.log(`  • API调用: ${this.apiCalls.length} 个`);
    console.log(`  • 发现问题: ${this.issues.length} 个`);
    console.log(`  • 改进建议: ${this.recommendations.length} 个`);

    if (this.issues.length > 0) {
      console.log('\n❌ 发现的问题:');
      this.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.message}`);
        console.log(`   文件: ${issue.file}:${issue.line}`);
        console.log(`   当前: ${issue.current}`);
        console.log(`   建议: ${issue.recommendation}`);
        console.log(`   严重性: ${this.getSeverityIcon(issue.severity)} ${issue.severity}`);
      });
    }

    if (this.recommendations.length > 0) {
      console.log('\n💡 改进建议:');
      this.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.message}`);
        console.log(`   文件: ${rec.file}:${rec.line}`);
        console.log(`   当前: ${rec.current}`);
        console.log(`   建议: ${rec.recommendation}`);
      });
    }

    console.log('\n📋 API端点使用统计:');
    const endpointStats = this.getEndpointStats();
    Object.entries(endpointStats).forEach(([endpoint, count]) => {
      const status = this.deprecatedEndpoints.some(dep => endpoint.includes(dep)) ? '❌' : '✅';
      console.log(`  ${status} ${endpoint}: ${count} 次使用`);
    });

    const criticalIssues = this.issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = this.issues.filter(issue => issue.severity === 'high').length;
    
    console.log('\n🎯 审计结果:');
    if (criticalIssues > 0) {
      console.log(`  ❌ 发现 ${criticalIssues} 个严重问题，需要立即修复`);
    }
    if (highIssues > 0) {
      console.log(`  ⚠️  发现 ${highIssues} 个高优先级问题`);
    }
    if (criticalIssues === 0 && highIssues === 0) {
      console.log('  ✅ 未发现严重的API端点问题');
    }

    return criticalIssues === 0 && highIssues === 0;
  }

  /**
   * 获取严重性图标
   */
  getSeverityIcon(severity) {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '💡',
      low: 'ℹ️'
    };
    return icons[severity] || 'ℹ️';
  }

  /**
   * 获取唯一文件列表
   */
  getUniqueFiles() {
    return [...new Set(this.apiCalls.map(call => call.file))];
  }

  /**
   * 获取端点使用统计
   */
  getEndpointStats() {
    const stats = {};
    this.apiCalls.forEach(call => {
      const endpoint = call.url.split('?')[0]; // 移除查询参数
      stats[endpoint] = (stats[endpoint] || 0) + 1;
    });
    return stats;
  }

  /**
   * 运行完整审计
   */
  async runAudit() {
    console.log('🚀 启动API端点审计...\n');
    
    // 扫描前端代码
    console.log('📁 扫描前端代码...');
    this.scanDirectory(this.frontendDir);
    
    // 扫描后端代码
    console.log('📁 扫描后端代码...');
    this.scanDirectory(this.backendDir);
    
    // 分析API调用
    console.log('🔍 分析API调用...');
    this.analyzeAPICalls();
    
    // 生成报告
    return this.generateReport();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const auditor = new APIEndpointAuditor();
  
  auditor.runAudit()
    .then(isHealthy => {
      process.exit(isHealthy ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 审计工具运行失败:', error);
      process.exit(1);
    });
}

module.exports = { APIEndpointAuditor };
