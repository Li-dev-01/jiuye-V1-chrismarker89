#!/usr/bin/env node

/**
 * API规范性检查工具
 * 检查API是否符合RESTful规范，识别冗余和不一致的接口
 */

const fs = require('fs');
const path = require('path');

class APIComplianceChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.reportPath = path.join(this.projectRoot, 'docs/API_ANALYSIS_REPORT.json');
    
    // 规范性检查结果
    this.complianceReport = {
      restful: {
        violations: [],
        score: 0
      },
      naming: {
        violations: [],
        score: 0
      },
      consistency: {
        violations: [],
        score: 0
      },
      redundancy: {
        duplicates: [],
        similar: [],
        score: 0
      },
      security: {
        violations: [],
        score: 0
      },
      overall: {
        score: 0,
        grade: 'F'
      }
    };
  }

  /**
   * 加载API分析报告
   */
  loadApiReport() {
    if (!fs.existsSync(this.reportPath)) {
      throw new Error('API分析报告不存在，请先运行 api-scanner.cjs');
    }
    
    const reportContent = fs.readFileSync(this.reportPath, 'utf8');
    return JSON.parse(reportContent);
  }

  /**
   * 检查RESTful规范
   */
  checkRestfulCompliance(apiInventory) {
    console.log('🔍 检查RESTful规范...');
    
    const allApis = [
      ...apiInventory.backend.typescript,
      ...apiInventory.backend.python
    ];
    
    allApis.forEach(api => {
      const path = api.path;
      
      // 检查HTTP方法是否正确使用
      this.checkHttpMethods(api);
      
      // 检查资源命名
      this.checkResourceNaming(api);
      
      // 检查URL结构
      this.checkUrlStructure(api);
      
      // 检查状态码使用
      this.checkStatusCodes(api);
    });
    
    // 计算RESTful得分
    const totalChecks = allApis.length * 4; // 4个检查项
    const violations = this.complianceReport.restful.violations.length;
    this.complianceReport.restful.score = Math.max(0, (totalChecks - violations) / totalChecks * 100);
  }

  /**
   * 检查HTTP方法使用
   */
  checkHttpMethods(api) {
    const path = api.path;
    
    // 检查是否使用了正确的HTTP方法
    if (path.includes('/create') || path.includes('/add')) {
      this.complianceReport.restful.violations.push({
        api: path,
        type: 'http_method',
        issue: '应使用POST方法而不是在URL中包含create/add',
        suggestion: '使用POST到资源集合URL'
      });
    }
    
    if (path.includes('/update') || path.includes('/edit')) {
      this.complianceReport.restful.violations.push({
        api: path,
        type: 'http_method',
        issue: '应使用PUT/PATCH方法而不是在URL中包含update/edit',
        suggestion: '使用PUT/PATCH到具体资源URL'
      });
    }
    
    if (path.includes('/delete') || path.includes('/remove')) {
      this.complianceReport.restful.violations.push({
        api: path,
        type: 'http_method',
        issue: '应使用DELETE方法而不是在URL中包含delete/remove',
        suggestion: '使用DELETE到具体资源URL'
      });
    }
  }

  /**
   * 检查资源命名
   */
  checkResourceNaming(api) {
    const path = api.path;
    const segments = path.split('/').filter(s => s && s !== 'api');
    
    segments.forEach(segment => {
      // 检查是否使用复数形式
      if (!segment.includes(':') && !segment.includes('<') && !segment.includes('{')) {
        if (this.isSingularNoun(segment) && !this.isValidSingularEndpoint(segment)) {
          this.complianceReport.restful.violations.push({
            api: path,
            type: 'resource_naming',
            issue: `资源名称应使用复数形式: ${segment}`,
            suggestion: `将 ${segment} 改为复数形式`
          });
        }
      }
      
      // 检查命名约定
      if (segment.includes('_')) {
        this.complianceReport.restful.violations.push({
          api: path,
          type: 'naming_convention',
          issue: `URL段应使用连字符而不是下划线: ${segment}`,
          suggestion: `将 ${segment} 改为使用连字符`
        });
      }
      
      if (segment !== segment.toLowerCase()) {
        this.complianceReport.restful.violations.push({
          api: path,
          type: 'naming_convention',
          issue: `URL段应使用小写: ${segment}`,
          suggestion: `将 ${segment} 改为小写`
        });
      }
    });
  }

  /**
   * 检查URL结构
   */
  checkUrlStructure(api) {
    const path = api.path;
    
    // 检查嵌套深度
    const depth = path.split('/').length - 2; // 减去空字符串和'api'
    if (depth > 4) {
      this.complianceReport.restful.violations.push({
        api: path,
        type: 'url_structure',
        issue: 'URL嵌套过深，建议不超过4层',
        suggestion: '重新设计资源层次结构'
      });
    }
    
    // 检查是否有动词
    const verbs = ['get', 'post', 'put', 'delete', 'create', 'update', 'remove', 'add', 'fetch', 'retrieve'];
    const segments = path.toLowerCase().split('/');
    
    verbs.forEach(verb => {
      if (segments.some(segment => segment.includes(verb))) {
        this.complianceReport.restful.violations.push({
          api: path,
          type: 'url_structure',
          issue: `URL中不应包含HTTP动词: ${verb}`,
          suggestion: '使用HTTP方法表示操作，URL只表示资源'
        });
      }
    });
  }

  /**
   * 检查状态码使用
   */
  checkStatusCodes(api) {
    // 这里需要分析代码中的状态码使用
    // 由于无法直接从路径分析，这里做基本检查
    
    if (api.path.includes('/auth/') || api.path.includes('/login')) {
      // 认证相关API应该正确处理401/403状态码
      // 这里可以添加更详细的检查逻辑
    }
  }

  /**
   * 检查命名一致性
   */
  checkNamingConsistency(apiInventory) {
    console.log('🔍 检查命名一致性...');
    
    const allApis = [
      ...apiInventory.backend.typescript,
      ...apiInventory.backend.python
    ];
    
    // 收集所有资源名称
    const resourceNames = new Set();
    const namingPatterns = {};
    
    allApis.forEach(api => {
      const segments = api.path.split('/').filter(s => s && s !== 'api');
      segments.forEach(segment => {
        if (!segment.includes(':') && !segment.includes('<') && !segment.includes('{')) {
          resourceNames.add(segment);
          
          // 分析命名模式
          if (segment.includes('-')) {
            namingPatterns[segment] = 'kebab-case';
          } else if (segment.includes('_')) {
            namingPatterns[segment] = 'snake_case';
          } else if (/[A-Z]/.test(segment)) {
            namingPatterns[segment] = 'camelCase';
          } else {
            namingPatterns[segment] = 'lowercase';
          }
        }
      });
    });
    
    // 检查命名模式一致性
    const patterns = Object.values(namingPatterns);
    const uniquePatterns = [...new Set(patterns)];
    
    if (uniquePatterns.length > 1) {
      this.complianceReport.naming.violations.push({
        type: 'inconsistent_naming',
        issue: 'API中使用了多种命名模式',
        patterns: uniquePatterns,
        suggestion: '统一使用kebab-case命名模式'
      });
    }
    
    // 计算命名一致性得分
    const consistencyRatio = patterns.length > 0 ? 
      patterns.filter(p => p === 'kebab-case').length / patterns.length : 1;
    this.complianceReport.naming.score = consistencyRatio * 100;
  }

  /**
   * 检查冗余和重复
   */
  checkRedundancy(apiInventory) {
    console.log('🔍 检查API冗余...');
    
    // 从分析报告中获取重复定义
    if (apiInventory.analysis && apiInventory.analysis.duplicates) {
      this.complianceReport.redundancy.duplicates = apiInventory.analysis.duplicates;
    }
    
    // 检查相似的API
    const allApis = [
      ...apiInventory.backend.typescript,
      ...apiInventory.backend.python
    ];
    
    for (let i = 0; i < allApis.length; i++) {
      for (let j = i + 1; j < allApis.length; j++) {
        const similarity = this.calculateSimilarity(allApis[i].path, allApis[j].path);
        if (similarity > 0.8 && allApis[i].path !== allApis[j].path) {
          this.complianceReport.redundancy.similar.push({
            api1: allApis[i].path,
            api2: allApis[j].path,
            similarity: similarity,
            suggestion: '考虑合并或重新设计这些相似的API'
          });
        }
      }
    }
    
    // 计算冗余得分
    const totalApis = allApis.length;
    const redundantCount = this.complianceReport.redundancy.duplicates.length + 
                          this.complianceReport.redundancy.similar.length;
    this.complianceReport.redundancy.score = Math.max(0, (totalApis - redundantCount) / totalApis * 100);
  }

  /**
   * 检查安全性
   */
  checkSecurity(apiInventory) {
    console.log('🔍 检查API安全性...');
    
    const allApis = [
      ...apiInventory.backend.typescript,
      ...apiInventory.backend.python
    ];
    
    allApis.forEach(api => {
      const path = api.path;
      
      // 检查敏感信息暴露
      if (path.includes('/admin/') && !path.includes('/auth/')) {
        this.complianceReport.security.violations.push({
          api: path,
          type: 'admin_security',
          issue: '管理员API可能缺少认证检查',
          suggestion: '确保所有管理员API都有适当的认证和授权'
        });
      }
      
      // 检查参数注入风险
      if (path.includes('<') || path.includes(':')) {
        this.complianceReport.security.violations.push({
          api: path,
          type: 'parameter_injection',
          issue: '路径参数可能存在注入风险',
          suggestion: '确保对所有路径参数进行验证和清理'
        });
      }
      
      // 检查敏感操作
      if (path.includes('/delete') || path.includes('/remove') || path.includes('/clear')) {
        this.complianceReport.security.violations.push({
          api: path,
          type: 'destructive_operation',
          issue: '破坏性操作需要额外的安全措施',
          suggestion: '添加确认机制和审计日志'
        });
      }
    });
    
    // 计算安全得分
    const totalApis = allApis.length;
    const securityIssues = this.complianceReport.security.violations.length;
    this.complianceReport.security.score = Math.max(0, (totalApis - securityIssues) / totalApis * 100);
  }

  /**
   * 计算字符串相似度
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 判断是否为单数名词
   */
  isSingularNoun(word) {
    // 简单的单数判断逻辑
    const pluralEndings = ['s', 'es', 'ies', 'ves'];
    return !pluralEndings.some(ending => word.endsWith(ending));
  }

  /**
   * 判断是否为有效的单数端点
   */
  isValidSingularEndpoint(word) {
    // 某些单数形式是可接受的
    const validSingular = ['auth', 'login', 'logout', 'health', 'status', 'config', 'admin'];
    return validSingular.includes(word.toLowerCase());
  }

  /**
   * 计算总体得分
   */
  calculateOverallScore() {
    const scores = [
      this.complianceReport.restful.score,
      this.complianceReport.naming.score,
      this.complianceReport.consistency.score,
      this.complianceReport.redundancy.score,
      this.complianceReport.security.score
    ];
    
    this.complianceReport.overall.score = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // 确定等级
    const score = this.complianceReport.overall.score;
    if (score >= 90) this.complianceReport.overall.grade = 'A';
    else if (score >= 80) this.complianceReport.overall.grade = 'B';
    else if (score >= 70) this.complianceReport.overall.grade = 'C';
    else if (score >= 60) this.complianceReport.overall.grade = 'D';
    else this.complianceReport.overall.grade = 'F';
  }

  /**
   * 生成规范性报告
   */
  generateComplianceReport() {
    console.log('📊 生成规范性报告...');
    
    const reportPath = path.join(this.projectRoot, 'docs/API_COMPLIANCE_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.complianceReport, null, 2));
    
    // 生成Markdown报告
    this.generateMarkdownReport();
    
    console.log(`📄 规范性报告已保存到: ${reportPath}`);
    return this.complianceReport;
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport() {
    const markdown = `# API规范性检查报告

生成时间: ${new Date().toLocaleString()}

## 总体评分

**等级: ${this.complianceReport.overall.grade}** (${this.complianceReport.overall.score.toFixed(1)}分)

## 各项得分

- **RESTful规范**: ${this.complianceReport.restful.score.toFixed(1)}分
- **命名一致性**: ${this.complianceReport.naming.score.toFixed(1)}分
- **冗余检查**: ${this.complianceReport.redundancy.score.toFixed(1)}分
- **安全性**: ${this.complianceReport.security.score.toFixed(1)}分

## RESTful规范违规 (${this.complianceReport.restful.violations.length}项)

${this.complianceReport.restful.violations.map(v => 
  `- **${v.api}**: ${v.issue}\n  *建议: ${v.suggestion}*`
).join('\n\n')}

## 命名一致性问题 (${this.complianceReport.naming.violations.length}项)

${this.complianceReport.naming.violations.map(v => 
  `- **${v.type}**: ${v.issue}\n  *建议: ${v.suggestion}*`
).join('\n\n')}

## 冗余和重复

### 重复定义 (${this.complianceReport.redundancy.duplicates.length}项)
${this.complianceReport.redundancy.duplicates.map(d => 
  `- \`${d.path}\` - ${d.description}`
).join('\n')}

### 相似API (${this.complianceReport.redundancy.similar.length}项)
${this.complianceReport.redundancy.similar.map(s => 
  `- \`${s.api1}\` 与 \`${s.api2}\` 相似度: ${(s.similarity * 100).toFixed(1)}%\n  *${s.suggestion}*`
).join('\n\n')}

## 安全性问题 (${this.complianceReport.security.violations.length}项)

${this.complianceReport.security.violations.map(v => 
  `- **${v.api}**: ${v.issue}\n  *建议: ${v.suggestion}*`
).join('\n\n')}

## 改进建议

1. **统一命名规范**: 建议所有API使用kebab-case命名
2. **减少重复定义**: 合并重复的API端点
3. **加强安全措施**: 为敏感操作添加额外的安全检查
4. **遵循RESTful原则**: 使用HTTP方法表示操作，URL只表示资源
`;

    const markdownPath = path.join(this.projectRoot, 'docs/API_COMPLIANCE_REPORT.md');
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Markdown报告已保存到: ${markdownPath}`);
  }

  /**
   * 运行完整的规范性检查
   */
  async run() {
    console.log('🚀 开始API规范性检查...\n');
    
    try {
      const apiReport = this.loadApiReport();
      const apiInventory = apiReport.inventory;
      
      this.checkRestfulCompliance(apiInventory);
      this.checkNamingConsistency(apiInventory);
      this.checkRedundancy(apiInventory);
      this.checkSecurity(apiInventory);
      
      this.calculateOverallScore();
      
      const report = this.generateComplianceReport();
      
      console.log('\n✅ API规范性检查完成!');
      console.log(`📊 总体得分: ${report.overall.score.toFixed(1)} (${report.overall.grade})`);
      console.log(`⚠️  发现问题:`);
      console.log(`   - RESTful违规: ${report.restful.violations.length}项`);
      console.log(`   - 命名问题: ${report.naming.violations.length}项`);
      console.log(`   - 冗余API: ${report.redundancy.duplicates.length + report.redundancy.similar.length}项`);
      console.log(`   - 安全问题: ${report.security.violations.length}项`);
      
      return report;
    } catch (error) {
      console.error('❌ 检查失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new APIComplianceChecker();
  checker.run().catch(console.error);
}

module.exports = APIComplianceChecker;
