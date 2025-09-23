#!/usr/bin/env node

/**
 * API扫描与分析工具
 * 扫描项目中的所有API端点，生成完整的API清单和架构图
 */

const fs = require('fs');
const path = require('path');

class APIScanner {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendPath = path.join(this.projectRoot, 'backend');
    this.frontendPath = path.join(this.projectRoot, 'frontend/src');
    
    // API端点收集
    this.backendRoutes = new Set();
    this.frontendApiCalls = new Set();
    this.pythonApiEndpoints = new Set();
    
    // 分析结果
    this.apiInventory = {
      backend: {
        typescript: [],
        python: []
      },
      frontend: {
        calls: [],
        services: []
      },
      analysis: {
        duplicates: [],
        inconsistencies: [],
        unused: [],
        missing: []
      }
    };
  }

  /**
   * 扫描TypeScript后端路由
   */
  scanTypeScriptBackend() {
    console.log('🔍 扫描TypeScript后端路由...');
    
    // 扫描路由文件
    const routesDir = path.join(this.backendPath, 'src/routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir)
        .filter(file => file.endsWith('.ts'))
        .map(file => path.join(routesDir, file));
      
      routeFiles.forEach(file => {
        this.extractTypeScriptRoutes(file);
      });
    }
    
    // 扫描主要配置文件
    const configFiles = [
      path.join(this.backendPath, 'src/worker.ts'),
      path.join(this.backendPath, 'src/index.ts')
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.extractTypeScriptRoutes(file);
      }
    });
    
    console.log(`  发现 ${this.backendRoutes.size} 个TypeScript路由`);
  }

  /**
   * 提取TypeScript路由
   */
  extractTypeScriptRoutes(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.backendPath, filePath);
    
    // 匹配路由定义模式
    const patterns = [
      // Hono路由: router.get('/path', handler)
      /(?:router|app|api|admin|reviewer|stories|questionnaire)\.(?:get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,

      // 路由注册: api.route('/path', handler)
      /\.route\(['"`]([^'"`]+)['"`]/g,

      // 直接路径定义
      /['"`](\/api\/[^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const routePath = match[1];
        if (routePath && routePath.startsWith('/')) {
          let fullPath = routePath.startsWith('/api/') ? routePath : `/api${routePath}`;

          // 处理嵌套路由前缀
          if (relativePath.includes('routes/admin.ts') && !fullPath.startsWith('/api/admin/')) {
            fullPath = `/api/admin${routePath}`;
          } else if (relativePath.includes('routes/reviewer.ts') && !fullPath.startsWith('/api/reviewer/')) {
            fullPath = `/api/reviewer${routePath}`;
          } else if (relativePath.includes('routes/stories.ts') && !fullPath.startsWith('/api/stories/')) {
            fullPath = `/api/stories${routePath}`;
          } else if (relativePath.includes('routes/questionnaire.ts') && !fullPath.startsWith('/api/questionnaire/')) {
            fullPath = `/api/questionnaire${routePath}`;
          } else if (relativePath.includes('routes/login-monitor.ts') && !fullPath.startsWith('/api/admin/login-monitor/')) {
            fullPath = `/api/admin/login-monitor${routePath}`;
          } else if (relativePath.includes('routes/ip-access-control.ts') && !fullPath.startsWith('/api/admin/ip-access-control/')) {
            fullPath = `/api/admin/ip-access-control${routePath}`;
          } else if (relativePath.includes('routes/intelligent-security.ts') && !fullPath.startsWith('/api/admin/intelligent-security/')) {
            fullPath = `/api/admin/intelligent-security${routePath}`;
          } else if (relativePath.includes('routes/google-whitelist.ts') && !fullPath.startsWith('/api/admin/google-whitelist/')) {
            fullPath = `/api/admin/google-whitelist${routePath}`;
          }

          this.backendRoutes.add(fullPath);

          this.apiInventory.backend.typescript.push({
            path: fullPath,
            file: relativePath,
            type: 'route'
          });
        }
      }
    });
  }

  /**
   * 扫描Python API端点
   */
  scanPythonBackend() {
    console.log('🔍 扫描Python API端点...');
    
    const pythonApiDir = path.join(this.backendPath, 'api');
    if (fs.existsSync(pythonApiDir)) {
      const pythonFiles = fs.readdirSync(pythonApiDir)
        .filter(file => file.endsWith('.py'))
        .map(file => path.join(pythonApiDir, file));
      
      pythonFiles.forEach(file => {
        this.extractPythonRoutes(file);
      });
    }
    
    console.log(`  发现 ${this.pythonApiEndpoints.size} 个Python API端点`);
  }

  /**
   * 提取Python路由
   */
  extractPythonRoutes(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.backendPath, filePath);
    
    // 匹配Flask路由模式
    const patterns = [
      // @app.route('/path', methods=['GET'])
      /@app\.route\(['"`]([^'"`]+)['"`]/g,
      
      // @bp.route('/path', methods=['GET'])
      /@\w+\.route\(['"`]([^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const routePath = match[1];
        if (routePath) {
          this.pythonApiEndpoints.add(routePath);
          
          this.apiInventory.backend.python.push({
            path: routePath,
            file: relativePath,
            type: 'flask_route'
          });
        }
      }
    });
  }

  /**
   * 扫描前端API调用
   */
  scanFrontendApiCalls() {
    console.log('🔍 扫描前端API调用...');
    
    const files = this.findFiles(this.frontendPath, ['.ts', '.tsx'])
      .filter(file => {
        const relativePath = path.relative(this.frontendPath, file);
        return !relativePath.includes('dist/') && 
               !relativePath.includes('node_modules/') &&
               !relativePath.includes('.d.ts');
      });
    
    files.forEach(file => {
      this.extractFrontendApiCalls(file);
    });

    console.log(`  发现 ${this.frontendApiCalls.size} 个前端API调用`);
  }

  /**
   * 提取前端API调用
   */
  extractFrontendApiCalls(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.frontendPath, filePath);
    
    // 匹配API调用模式
    const patterns = [
      // fetch调用
      /fetch\(['"`]([^'"`]*\/api\/[^'"`]+)['"`]/g,
      
      // axios调用
      /(?:apiClient|axios)\.(?:get|post|put|delete)\(['"`]([^'"`]+)['"`]/g,
      
      // 服务调用
      /\.(?:get|post|put|delete)\(['"`]([^'"`]+)['"`]/g,
      
      // API路径常量
      /['"`](\/api\/[^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let apiPath = match[1];
        
        // 清理URL，提取路径部分
        if (apiPath.includes('://')) {
          try {
            const url = new URL(apiPath);
            apiPath = url.pathname;
          } catch (e) {
            continue;
          }
        }
        
        if (apiPath && apiPath.startsWith('/api/')) {
          this.frontendApiCalls.add(apiPath);
          
          this.apiInventory.frontend.calls.push({
            path: apiPath,
            file: relativePath,
            type: 'api_call'
          });
        }
      }
    });
  }

  /**
   * 递归查找文件
   */
  findFiles(dir, extensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  /**
   * 分析API一致性
   */
  analyzeConsistency() {
    console.log('🔍 分析API一致性...');
    
    const allBackendRoutes = new Set([
      ...this.backendRoutes,
      ...this.pythonApiEndpoints
    ]);
    
    // 查找前端调用但后端不存在的API
    this.frontendApiCalls.forEach(apiCall => {
      if (!allBackendRoutes.has(apiCall)) {
        this.apiInventory.analysis.missing.push({
          path: apiCall,
          type: 'missing_backend',
          description: '前端调用但后端未实现'
        });
      }
    });
    
    // 查找后端定义但前端未使用的API
    allBackendRoutes.forEach(backendRoute => {
      if (!this.frontendApiCalls.has(backendRoute)) {
        this.apiInventory.analysis.unused.push({
          path: backendRoute,
          type: 'unused_api',
          description: '后端已定义但前端未使用'
        });
      }
    });
    
    // 查找重复定义
    const pathCounts = {};
    [...this.apiInventory.backend.typescript, ...this.apiInventory.backend.python]
      .forEach(route => {
        pathCounts[route.path] = (pathCounts[route.path] || 0) + 1;
      });
    
    Object.entries(pathCounts).forEach(([path, count]) => {
      if (count > 1) {
        this.apiInventory.analysis.duplicates.push({
          path,
          count,
          type: 'duplicate_definition',
          description: `API路径重复定义${count}次`
        });
      }
    });
  }

  /**
   * 生成API清单报告
   */
  generateReport() {
    console.log('📊 生成API分析报告...');
    
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        total_backend_routes: this.backendRoutes.size + this.pythonApiEndpoints.size,
        typescript_routes: this.backendRoutes.size,
        python_routes: this.pythonApiEndpoints.size,
        frontend_calls: this.frontendApiCalls.size,
        issues: {
          missing: this.apiInventory.analysis.missing.length,
          unused: this.apiInventory.analysis.unused.length,
          duplicates: this.apiInventory.analysis.duplicates.length
        }
      },
      inventory: this.apiInventory,
      recommendations: this.generateRecommendations()
    };
    
    // 保存报告
    const reportPath = path.join(this.projectRoot, 'docs/API_ANALYSIS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 生成Markdown报告
    this.generateMarkdownReport(report);
    
    console.log(`📄 报告已保存到: ${reportPath}`);
    return report;
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.apiInventory.analysis.missing.length > 0) {
      recommendations.push({
        type: 'missing_apis',
        priority: 'high',
        description: '实现缺失的API端点',
        count: this.apiInventory.analysis.missing.length
      });
    }
    
    if (this.apiInventory.analysis.duplicates.length > 0) {
      recommendations.push({
        type: 'duplicate_apis',
        priority: 'medium',
        description: '解决重复的API定义',
        count: this.apiInventory.analysis.duplicates.length
      });
    }
    
    if (this.apiInventory.analysis.unused.length > 0) {
      recommendations.push({
        type: 'unused_apis',
        priority: 'low',
        description: '清理未使用的API端点',
        count: this.apiInventory.analysis.unused.length
      });
    }
    
    return recommendations;
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport(report) {
    const markdown = `# API分析报告

生成时间: ${new Date().toLocaleString()}

## 概览

- **总API端点**: ${report.summary.total_backend_routes}
  - TypeScript路由: ${report.summary.typescript_routes}
  - Python路由: ${report.summary.python_routes}
- **前端API调用**: ${report.summary.frontend_calls}

## 问题统计

- **缺失API**: ${report.summary.issues.missing}
- **未使用API**: ${report.summary.issues.unused}
- **重复定义**: ${report.summary.issues.duplicates}

## 建议

${report.recommendations.map(rec => 
  `- **${rec.type}** (${rec.priority}): ${rec.description} (${rec.count}个)`
).join('\n')}

## 详细分析

### 缺失的API端点
${report.inventory.analysis.missing.map(item => 
  `- \`${item.path}\` - ${item.description}`
).join('\n')}

### 未使用的API端点
${report.inventory.analysis.unused.map(item => 
  `- \`${item.path}\` - ${item.description}`
).join('\n')}

### 重复定义的API
${report.inventory.analysis.duplicates.map(item => 
  `- \`${item.path}\` - ${item.description}`
).join('\n')}
`;

    const markdownPath = path.join(this.projectRoot, 'docs/API_ANALYSIS_REPORT.md');
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Markdown报告已保存到: ${markdownPath}`);
  }

  /**
   * 运行完整扫描
   */
  async run() {
    console.log('🚀 开始API扫描与分析...\n');
    
    this.scanTypeScriptBackend();
    this.scanPythonBackend();
    this.scanFrontendApiCalls();
    this.analyzeConsistency();
    
    const report = this.generateReport();
    
    console.log('\n✅ API扫描完成!');
    console.log(`📊 发现 ${report.summary.total_backend_routes} 个后端API端点`);
    console.log(`📱 发现 ${report.summary.frontend_calls} 个前端API调用`);
    console.log(`⚠️  发现 ${Object.values(report.summary.issues).reduce((a, b) => a + b, 0)} 个问题`);
    
    return report;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const scanner = new APIScanner();
  scanner.run().catch(console.error);
}

module.exports = APIScanner;
