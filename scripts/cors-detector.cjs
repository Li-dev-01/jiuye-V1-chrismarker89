#!/usr/bin/env node

/**
 * 全项目CORS问题检测脚本
 * 检测前端所有自定义HTTP头和后端CORS配置的匹配情况
 */

const fs = require('fs');
const path = require('path');

class CORSDetector {
  constructor() {
    this.frontendPath = path.join(__dirname, '../frontend');
    this.backendPath = path.join(__dirname, '../backend');
    this.customHeaders = new Set();
    this.corsAllowedHeaders = new Set();
    this.issues = [];
  }

  /**
   * 扫描前端代码中的自定义HTTP头
   */
  scanFrontendHeaders() {
    console.log('🔍 扫描前端自定义HTTP头...');

    const files = this.findFiles(this.frontendPath, ['.ts', '.tsx'])
      .filter(file => {
        // 排除编译后的文件和node_modules
        const relativePath = path.relative(this.frontendPath, file);
        return !relativePath.includes('dist/') &&
               !relativePath.includes('node_modules/') &&
               !relativePath.includes('.d.ts');
      });

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      this.extractHeaders(content, file);
    });

    console.log(`  发现 ${this.customHeaders.size} 个自定义HTTP头`);
    return Array.from(this.customHeaders);
  }

  /**
   * 提取文件中的HTTP头
   */
  extractHeaders(content, filePath) {
    // 匹配各种设置HTTP头的模式
    const patterns = [
      // axios headers 配置
      /headers\s*:\s*{[^}]*['"`]([X-][^'"`]+)['"`]/g,
      /config\.headers\[['"`]([X-][^'"`]+)['"`]\]/g,
      /config\.headers\.([X-][A-Za-z-]+)/g,
      /headers\[['"`]([X-][^'"`]+)['"`]\]/g,

      // fetch headers
      /['"`]([X-][A-Za-z-]+)['"`]\s*:\s*[^,}]+/g,

      // 特殊的认证和内容类型头（在headers对象中）
      /headers\s*:\s*{[^}]*['"`](Authorization|Accept|User-Agent|Content-Length|Accept-Encoding)['"`]/g,
      /config\.headers\[['"`](Authorization|Accept|User-Agent)['"`]\]/g,

      // 直接的头设置
      /\.headers\[['"`]([X-][^'"`]+)['"`]\]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const header = match[1];
        if (header && this.isValidHttpHeader(header)) {
          this.customHeaders.add(header);
          console.log(`    发现头: ${header} (在 ${path.relative(this.frontendPath, filePath)})`);
        }
      }
    });
  }

  /**
   * 判断是否为有效的HTTP头（需要CORS配置的头）
   */
  isValidHttpHeader(header) {
    // 排除CSS属性和无效字符串
    if (header.startsWith('-') && !header.startsWith('X-')) {
      return false; // CSS属性如 -webkit-font-smoothing
    }

    if (header.startsWith('--')) {
      return false; // CSS变量如 --ant-display
    }

    if (header.includes('%') || header.length < 3) {
      return false; // 无效的头名称
    }

    // X- 开头的都是自定义头
    if (header.startsWith('X-') || header.startsWith('x-')) {
      return true;
    }

    // 需要CORS配置的标准头
    const needsCors = [
      'Authorization', 'User-Agent', 'Content-Length',
      'Accept-Encoding', 'Origin', 'Referer'
    ];

    return needsCors.includes(header);
  }

  /**
   * 扫描后端CORS配置
   */
  scanBackendCORS() {
    console.log('\n🔍 扫描后端CORS配置...');
    
    const corsFile = path.join(this.backendPath, 'src/middleware/cors.ts');
    
    if (!fs.existsSync(corsFile)) {
      this.issues.push({
        type: 'missing_cors_file',
        severity: 'high',
        message: 'CORS配置文件不存在',
        file: corsFile
      });
      return [];
    }

    const content = fs.readFileSync(corsFile, 'utf8');
    this.extractCORSHeaders(content);

    console.log(`  CORS允许的头: ${Array.from(this.corsAllowedHeaders).join(', ')}`);
    return Array.from(this.corsAllowedHeaders);
  }

  /**
   * 提取CORS配置中允许的头
   */
  extractCORSHeaders(content) {
    // 匹配 Access-Control-Allow-Headers 配置
    const patterns = [
      /Access-Control-Allow-Headers['"`]\s*,\s*['"`]([^'"`]+)['"`]/g,
      /c\.header\(['"`]Access-Control-Allow-Headers['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const headersString = match[1];
        const headers = headersString.split(',').map(h => h.trim());
        headers.forEach(header => {
          if (header) {
            this.corsAllowedHeaders.add(header);
          }
        });
      }
    });
  }

  /**
   * 检测CORS问题
   */
  detectCORSIssues() {
    console.log('\n🔍 检测CORS问题...');
    
    const frontendHeaders = this.scanFrontendHeaders();
    const corsHeaders = this.scanBackendCORS();

    // 检查前端使用但CORS未允许的头
    frontendHeaders.forEach(header => {
      if (!corsHeaders.includes(header)) {
        this.issues.push({
          type: 'missing_cors_header',
          severity: 'high',
          message: `前端使用的头 "${header}" 未在CORS中配置`,
          header: header,
          solution: `在 backend/src/middleware/cors.ts 的 Access-Control-Allow-Headers 中添加 "${header}"`
        });
      }
    });

    // 检查CORS配置但前端未使用的头（可能是冗余配置）
    corsHeaders.forEach(header => {
      if (!frontendHeaders.includes(header) && this.isValidHttpHeader(header)) {
        this.issues.push({
          type: 'unused_cors_header',
          severity: 'low',
          message: `CORS配置的头 "${header}" 前端未使用`,
          header: header,
          solution: `可以考虑从CORS配置中移除 "${header}"（如果确实不需要）`
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
    console.log('\n📋 修复建议:');
    
    if (this.issues.length === 0) {
      console.log('✅ 未发现CORS问题！');
      return;
    }

    const highSeverityIssues = this.issues.filter(issue => issue.severity === 'high');
    const mediumSeverityIssues = this.issues.filter(issue => issue.severity === 'medium');
    const lowSeverityIssues = this.issues.filter(issue => issue.severity === 'low');

    if (highSeverityIssues.length > 0) {
      console.log('\n🚨 高优先级问题:');
      highSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.solution) {
          console.log(`   解决方案: ${issue.solution}`);
        }
      });
    }

    if (mediumSeverityIssues.length > 0) {
      console.log('\n⚠️  中优先级问题:');
      mediumSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.solution) {
          console.log(`   解决方案: ${issue.solution}`);
        }
      });
    }

    if (lowSeverityIssues.length > 0) {
      console.log('\n💡 低优先级问题:');
      lowSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.solution) {
          console.log(`   解决方案: ${issue.solution}`);
        }
      });
    }
  }

  /**
   * 运行完整检测
   */
  async run() {
    console.log('🔍 开始全项目CORS检测...\n');
    
    try {
      const issues = this.detectCORSIssues();
      
      console.log('\n📊 检测结果:');
      console.log(`  前端自定义头: ${this.customHeaders.size} 个`);
      console.log(`  CORS允许头: ${this.corsAllowedHeaders.size} 个`);
      console.log(`  发现问题: ${issues.length} 个`);
      
      this.generateFixSuggestions();
      
      return {
        frontendHeaders: Array.from(this.customHeaders),
        corsHeaders: Array.from(this.corsAllowedHeaders),
        issues: issues,
        summary: {
          total: issues.length,
          high: issues.filter(i => i.severity === 'high').length,
          medium: issues.filter(i => i.severity === 'medium').length,
          low: issues.filter(i => i.severity === 'low').length
        }
      };
      
    } catch (error) {
      console.error('❌ 检测过程中出现错误:', error);
      throw error;
    }
  }
}

// 运行检测
if (require.main === module) {
  const detector = new CORSDetector();
  detector.run()
    .then(result => {
      process.exit(result.summary.high > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('检测失败:', error);
      process.exit(1);
    });
}

module.exports = CORSDetector;
