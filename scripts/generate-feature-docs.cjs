#!/usr/bin/env node

/**
 * 功能文档自动生成工具
 * 
 * 功能：
 * 1. 扫描后端代码，提取API端点
 * 2. 扫描前端代码，提取页面路由
 * 3. 扫描数据库Schema，提取表结构
 * 4. 生成功能清单和API索引
 * 
 * 使用方法：
 * node scripts/generate-feature-docs.cjs
 */

const fs = require('fs');
const path = require('path');

// ===== 配置 =====
const CONFIG = {
  backendPath: path.join(__dirname, '../backend/src'),
  frontendPath: path.join(__dirname, '../frontend/src'),
  databasePath: path.join(__dirname, '../database/schemas'),
  outputPath: path.join(__dirname, '../docs/generated'),
};

// ===== API端点扫描器 =====
class APIScanner {
  constructor() {
    this.endpoints = [];
  }

  /**
   * 扫描后端路由文件
   */
  scanBackend() {
    console.log('🔍 扫描后端API端点...');
    const routesPath = path.join(CONFIG.backendPath, 'routes');
    
    if (!fs.existsSync(routesPath)) {
      console.warn('⚠️  后端路由目录不存在');
      return;
    }

    const files = this.getAllFiles(routesPath, ['.ts', '.js']);
    
    files.forEach(file => {
      this.scanRouteFile(file);
    });

    console.log(`✅ 发现 ${this.endpoints.length} 个API端点`);
  }

  /**
   * 扫描单个路由文件
   */
  scanRouteFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(CONFIG.backendPath, filePath);

    // 匹配路由定义模式
    const patterns = [
      // Hono路由: router.get('/path', handler)
      {
        regex: /(?:router|app|api|admin|reviewer|stories|questionnaire)\.(?<method>get|post|put|delete|patch)\(['"`](?<path>[^'"`]+)['"`]/g,
        type: 'hono'
      },
      // 路由注册: api.route('/path', handler)
      {
        regex: /\.route\(['"`](?<path>[^'"`]+)['"`]/g,
        type: 'route',
        method: 'ALL'
      }
    ];

    patterns.forEach(({ regex, type, method: defaultMethod }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const endpoint = {
          method: (match.groups?.method || defaultMethod || 'GET').toUpperCase(),
          path: match.groups?.path || match[1],
          file: relativePath,
          type: type,
          line: this.getLineNumber(content, match.index)
        };

        // 尝试提取注释作为描述
        const description = this.extractDescription(content, match.index);
        if (description) {
          endpoint.description = description;
        }

        this.endpoints.push(endpoint);
      }
    });
  }

  /**
   * 提取注释作为描述
   */
  extractDescription(content, index) {
    const lines = content.substring(0, index).split('\n');
    const currentLine = lines.length - 1;
    
    // 查找前面的注释
    for (let i = currentLine - 1; i >= Math.max(0, currentLine - 5); i--) {
      const line = lines[i].trim();
      if (line.startsWith('//')) {
        return line.replace('//', '').trim();
      }
      if (line.startsWith('*')) {
        return line.replace('*', '').trim();
      }
    }
    
    return null;
  }

  /**
   * 获取行号
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 递归获取所有文件
   */
  getAllFiles(dir, extensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.getAllFiles(fullPath, extensions));
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
   * 生成API索引文档
   */
  generateAPIIndex() {
    console.log('📝 生成API索引文档...');

    // 按路径分组
    const grouped = this.groupByPrefix(this.endpoints);

    let markdown = '# 📡 API端点索引\n\n';
    markdown += `> **总计**: ${this.endpoints.length} 个API端点\n`;
    markdown += `> **最后更新**: ${new Date().toLocaleDateString('zh-CN')}\n\n`;
    markdown += '## 📊 统计\n\n';
    
    // 统计各类API数量
    const stats = this.calculateStats(grouped);
    markdown += '| 分类 | 数量 |\n';
    markdown += '|------|------|\n';
    Object.entries(stats).forEach(([category, count]) => {
      markdown += `| ${category} | ${count} |\n`;
    });
    markdown += '\n---\n\n';

    // 按分组生成文档
    Object.entries(grouped).forEach(([prefix, endpoints]) => {
      markdown += `## ${this.getCategoryName(prefix)}\n\n`;
      markdown += '| 方法 | 路径 | 描述 | 文件 |\n';
      markdown += '|------|------|------|------|\n';
      
      endpoints.forEach(endpoint => {
        const method = endpoint.method.padEnd(6);
        const description = endpoint.description || '-';
        markdown += `| \`${method}\` | \`${endpoint.path}\` | ${description} | ${endpoint.file} |\n`;
      });
      
      markdown += '\n';
    });

    return markdown;
  }

  /**
   * 按路径前缀分组
   */
  groupByPrefix(endpoints) {
    const grouped = {};
    
    endpoints.forEach(endpoint => {
      const parts = endpoint.path.split('/').filter(p => p);
      const prefix = parts.length > 1 ? `/${parts[0]}/${parts[1]}` : `/${parts[0]}`;
      
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      
      grouped[prefix].push(endpoint);
    });

    return grouped;
  }

  /**
   * 计算统计数据
   */
  calculateStats(grouped) {
    const stats = {};
    
    Object.entries(grouped).forEach(([prefix, endpoints]) => {
      const category = this.getCategoryName(prefix);
      stats[category] = endpoints.length;
    });

    return stats;
  }

  /**
   * 获取分类名称
   */
  getCategoryName(prefix) {
    const categoryMap = {
      '/api/uuid': '🔵 用户认证',
      '/api/questionnaire': '📝 问卷系统',
      '/api/stories': '📖 故事系统',
      '/api/simple-reviewer': '🟢 审核员',
      '/api/simple-admin': '🟡 管理员',
      '/api/super-admin': '🔴 超级管理员',
      '/api/ai-moderation': '🤖 AI审核',
      '/api/cloudflare': '☁️ Cloudflare',
      '/api/analytics': '📊 数据分析',
    };

    return categoryMap[prefix] || prefix;
  }
}

// ===== 页面路由扫描器 =====
class RouteScanner {
  constructor() {
    this.routes = [];
  }

  /**
   * 扫描前端路由
   */
  scanFrontend() {
    console.log('🔍 扫描前端路由...');
    
    const appFile = path.join(CONFIG.frontendPath, 'App.tsx');
    
    if (!fs.existsSync(appFile)) {
      console.warn('⚠️  App.tsx 不存在');
      return;
    }

    this.scanRouteFile(appFile);
    
    console.log(`✅ 发现 ${this.routes.length} 个前端路由`);
  }

  /**
   * 扫描路由文件
   */
  scanRouteFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // 匹配 <Route path="..." element={...} />
    const routeRegex = /<Route\s+path=["']([^"']+)["']\s+element=\{<([^>]+)/g;
    
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      this.routes.push({
        path: match[1],
        component: match[2],
        line: this.getLineNumber(content, match.index)
      });
    }
  }

  /**
   * 获取行号
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 生成路由索引文档
   */
  generateRouteIndex() {
    console.log('📝 生成路由索引文档...');

    let markdown = '# 🗺️ 前端路由索引\n\n';
    markdown += `> **总计**: ${this.routes.length} 个路由\n`;
    markdown += `> **最后更新**: ${new Date().toLocaleDateString('zh-CN')}\n\n`;

    // 按路径分组
    const grouped = this.groupByPrefix(this.routes);

    Object.entries(grouped).forEach(([prefix, routes]) => {
      markdown += `## ${prefix}\n\n`;
      markdown += '| 路径 | 组件 |\n';
      markdown += '|------|------|\n';
      
      routes.forEach(route => {
        markdown += `| \`${route.path}\` | ${route.component} |\n`;
      });
      
      markdown += '\n';
    });

    return markdown;
  }

  /**
   * 按路径前缀分组
   */
  groupByPrefix(routes) {
    const grouped = {};
    
    routes.forEach(route => {
      const parts = route.path.split('/').filter(p => p && !p.startsWith(':'));
      const prefix = parts.length > 0 ? `/${parts[0]}` : '/';
      
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      
      grouped[prefix].push(route);
    });

    return grouped;
  }
}

// ===== 主程序 =====
async function main() {
  console.log('🚀 开始生成功能文档...\n');

  // 创建输出目录
  if (!fs.existsSync(CONFIG.outputPath)) {
    fs.mkdirSync(CONFIG.outputPath, { recursive: true });
  }

  // 扫描API端点
  const apiScanner = new APIScanner();
  apiScanner.scanBackend();
  const apiIndex = apiScanner.generateAPIIndex();
  fs.writeFileSync(
    path.join(CONFIG.outputPath, 'API_INDEX.md'),
    apiIndex
  );
  console.log('✅ API索引已生成: docs/generated/API_INDEX.md\n');

  // 扫描前端路由
  const routeScanner = new RouteScanner();
  routeScanner.scanFrontend();
  const routeIndex = routeScanner.generateRouteIndex();
  fs.writeFileSync(
    path.join(CONFIG.outputPath, 'ROUTE_INDEX.md'),
    routeIndex
  );
  console.log('✅ 路由索引已生成: docs/generated/ROUTE_INDEX.md\n');

  console.log('🎉 文档生成完成！');
}

// 运行主程序
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  });
}

module.exports = { APIScanner, RouteScanner };

