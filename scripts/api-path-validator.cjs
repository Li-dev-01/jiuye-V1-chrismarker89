#!/usr/bin/env node

/**
 * API路径验证脚本
 * 检测前端API调用路径与后端路由注册路径的匹配情况
 */

const fs = require('fs');
const path = require('path');

class ApiPathValidator {
  constructor() {
    this.frontendPath = path.join(__dirname, '../frontend');
    this.backendPath = path.join(__dirname, '../backend');
    this.frontendApiCalls = new Set();
    this.backendRoutes = new Set();
    this.issues = [];
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
      const content = fs.readFileSync(file, 'utf8');
      this.extractApiCalls(content, file);
    });

    console.log(`  发现 ${this.frontendApiCalls.size} 个API调用`);
    return Array.from(this.frontendApiCalls);
  }

  /**
   * 提取API调用路径
   */
  extractApiCalls(content, filePath) {
    // 匹配各种API调用模式
    const patterns = [
      // axios 调用
      /apiClient\.get\(['"`]([^'"`]+)['"`]/g,
      /apiClient\.post\(['"`]([^'"`]+)['"`]/g,
      /apiClient\.put\(['"`]([^'"`]+)['"`]/g,
      /apiClient\.delete\(['"`]([^'"`]+)['"`]/g,
      
      // fetch 调用
      /fetch\(['"`]([^'"`]*\/api\/[^'"`]+)['"`]/g,
      
      // axios create 实例调用
      /\.get\(['"`]([^'"`]+)['"`]/g,
      /\.post\(['"`]([^'"`]+)['"`]/g,
      /\.put\(['"`]([^'"`]+)['"`]/g,
      /\.delete\(['"`]([^'"`]+)['"`]/g,
      
      // 直接的API路径字符串
      /['"`](\/api\/[^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const apiPath = match[1];
        if (apiPath && this.isValidApiPath(apiPath)) {
          this.frontendApiCalls.add(apiPath);
          console.log(`    发现API调用: ${apiPath} (在 ${path.relative(this.frontendPath, filePath)})`);
        }
      }
    });
  }

  /**
   * 判断是否为有效的API路径
   */
  isValidApiPath(path) {
    // 必须以 /api/ 开头或者是相对路径
    if (path.startsWith('/api/') || path.startsWith('api/')) {
      return true;
    }
    
    // 或者是以 / 开头的相对API路径
    if (path.startsWith('/') && !path.includes('http') && !path.includes('.')) {
      return true;
    }
    
    return false;
  }

  /**
   * 扫描后端路由注册
   */
  scanBackendRoutes() {
    console.log('\n🔍 扫描后端路由注册...');
    
    const indexFile = path.join(this.backendPath, 'src/index.ts');
    const workerFile = path.join(this.backendPath, 'src/worker.ts');
    
    [indexFile, workerFile].forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        this.extractRoutes(content, file);
      }
    });

    console.log(`  发现 ${this.backendRoutes.size} 个后端路由`);
    return Array.from(this.backendRoutes);
  }

  /**
   * 提取路由注册
   */
  extractRoutes(content, filePath) {
    // 匹配路由注册模式
    const patterns = [
      // api.route('/path', handler)
      /api\.route\(['"`]([^'"`]+)['"`]/g,
      
      // app.route('/api/path', handler)
      /app\.route\(['"`](\/api\/[^'"`]+)['"`]/g,
      
      // 直接的路由定义
      /\.route\(['"`]([^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const routePath = match[1];
        if (routePath) {
          // 构建完整的API路径
          const fullPath = routePath.startsWith('/api/') ? routePath : `/api${routePath}`;
          this.backendRoutes.add(fullPath);
          console.log(`    发现路由: ${fullPath} (在 ${path.relative(this.backendPath, filePath)})`);
        }
      }
    });
  }

  /**
   * 验证路径匹配
   */
  validatePathMatching() {
    console.log('\n🔍 验证API路径匹配...');
    
    const frontendCalls = this.scanFrontendApiCalls();
    const backendRoutes = this.scanBackendRoutes();

    // 检查前端调用但后端没有的路由
    frontendCalls.forEach(apiCall => {
      // 移除查询参数和片段
      const cleanPath = apiCall.split('?')[0].split('#')[0];
      
      // 检查是否有匹配的后端路由
      const hasMatch = backendRoutes.some(route => {
        // 精确匹配
        if (route === cleanPath) return true;
        
        // 前缀匹配（考虑子路由）
        if (cleanPath.startsWith(route + '/')) return true;
        
        return false;
      });

      if (!hasMatch) {
        this.issues.push({
          type: 'missing_backend_route',
          severity: 'high',
          message: `前端调用的API路径 "${cleanPath}" 在后端未找到匹配的路由`,
          frontendPath: cleanPath,
          suggestion: `检查后端路由注册，确保有对应的路由处理 "${cleanPath}"`
        });
      }
    });

    // 检查后端有但前端未使用的路由（可能的冗余）
    backendRoutes.forEach(route => {
      const hasMatch = frontendCalls.some(call => {
        const cleanCall = call.split('?')[0].split('#')[0];
        return cleanCall === route || cleanCall.startsWith(route + '/');
      });

      if (!hasMatch) {
        this.issues.push({
          type: 'unused_backend_route',
          severity: 'low',
          message: `后端路由 "${route}" 前端未使用`,
          backendRoute: route,
          suggestion: `确认是否需要保留此路由，或者前端是否遗漏了相关调用`
        });
      }
    });

    return this.issues;
  }

  /**
   * 递归查找文件
   */
  findFiles(dir, extensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findFiles(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });

    return files;
  }

  /**
   * 生成修复建议
   */
  generateFixSuggestions() {
    console.log('\n📋 API路径验证结果:');
    
    if (this.issues.length === 0) {
      console.log('✅ 所有API路径匹配正常！');
      return;
    }

    const highSeverityIssues = this.issues.filter(issue => issue.severity === 'high');
    const lowSeverityIssues = this.issues.filter(issue => issue.severity === 'low');

    if (highSeverityIssues.length > 0) {
      console.log('\n🚨 高优先级问题 (需要立即修复):');
      highSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        console.log(`   建议: ${issue.suggestion}`);
      });
    }

    if (lowSeverityIssues.length > 0) {
      console.log('\n💡 低优先级问题 (建议检查):');
      lowSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        console.log(`   建议: ${issue.suggestion}`);
      });
    }
  }

  /**
   * 运行完整验证
   */
  async run() {
    console.log('🔍 开始API路径验证...\n');
    
    try {
      const issues = this.validatePathMatching();
      
      console.log('\n📊 验证结果:');
      console.log(`  前端API调用: ${this.frontendApiCalls.size} 个`);
      console.log(`  后端路由: ${this.backendRoutes.size} 个`);
      console.log(`  发现问题: ${issues.length} 个`);
      
      this.generateFixSuggestions();
      
      return {
        frontendCalls: Array.from(this.frontendApiCalls),
        backendRoutes: Array.from(this.backendRoutes),
        issues: issues,
        summary: {
          total: issues.length,
          high: issues.filter(i => i.severity === 'high').length,
          low: issues.filter(i => i.severity === 'low').length
        }
      };
      
    } catch (error) {
      console.error('❌ 验证过程中出现错误:', error);
      throw error;
    }
  }
}

// 运行验证
if (require.main === module) {
  const validator = new ApiPathValidator();
  validator.run()
    .then(result => {
      process.exit(result.summary.high > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('验证失败:', error);
      process.exit(1);
    });
}

module.exports = ApiPathValidator;
