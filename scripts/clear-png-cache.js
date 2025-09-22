#!/usr/bin/env node

/**
 * PNG缓存清理脚本
 * 用于书信体样式更新后快速清理所有PNG缓存
 */

const https = require('https');
const http = require('http');

// 配置 - 优先使用线上环境
const API_BASE_URL = process.env.API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const CLEAR_ALL_ENDPOINT = '/api/png-management/cache/clear-all';

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function clearAllCache(options = {}) {
  const url = `${API_BASE_URL}${CLEAR_ALL_ENDPOINT}`;
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const requestData = {
    reason: '书信体样式更新',
    deleteR2Files: options.deleteFiles || false,
    ...options
  };

  try {
    log('🧹 开始清理PNG缓存...', 'cyan');
    log(`📡 请求地址: ${url}`, 'blue');
    
    const response = await makeRequest(url, requestOptions, requestData);
    
    if (response.statusCode === 200 && response.data.success) {
      log('✅ PNG缓存清理成功!', 'green');
      log(`📊 清理统计:`, 'cyan');
      log(`   - 缓存条目: ${response.data.data.deletedCacheCount}个`, 'yellow');
      
      if (response.data.data.deletedR2Count !== undefined) {
        log(`   - R2文件: ${response.data.data.deletedR2Count}个`, 'yellow');
      }
      
      if (response.data.data.contentType) {
        log(`   - 内容类型: ${response.data.data.contentType}`, 'yellow');
      }
      
      if (response.data.data.theme) {
        log(`   - 主题: ${response.data.data.theme}`, 'yellow');
      }
      
      log(`💬 ${response.data.message}`, 'green');
      
    } else {
      log('❌ PNG缓存清理失败!', 'red');
      log(`状态码: ${response.statusCode}`, 'red');
      log(`错误信息: ${response.data.message || response.data.error || '未知错误'}`, 'red');
    }
    
  } catch (error) {
    log('❌ 请求失败!', 'red');
    log(`错误详情: ${error.message}`, 'red');
    log('请检查API服务是否正常运行', 'yellow');
  }
}

async function clearThemeCache(theme) {
  const url = `${API_BASE_URL}/api/png-management/cache/clear-theme/${theme}`;
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    log(`🧹 开始清理${theme}主题缓存...`, 'cyan');
    
    const response = await makeRequest(url, requestOptions);
    
    if (response.statusCode === 200 && response.data.success) {
      log(`✅ ${theme}主题缓存清理成功!`, 'green');
      log(`📊 清理了 ${response.data.data.deletedCount} 个缓存条目`, 'yellow');
    } else {
      log(`❌ ${theme}主题缓存清理失败!`, 'red');
      log(`错误信息: ${response.data.message || response.data.error || '未知错误'}`, 'red');
    }
    
  } catch (error) {
    log('❌ 请求失败!', 'red');
    log(`错误详情: ${error.message}`, 'red');
  }
}

async function clearContentTypeCache(contentType) {
  const url = `${API_BASE_URL}/api/png-management/cache/clear-type/${contentType}`;
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const typeName = contentType === 'heart_voice' ? '问卷心声' : '就业故事';
    log(`🧹 开始清理${typeName}缓存...`, 'cyan');
    
    const response = await makeRequest(url, requestOptions);
    
    if (response.statusCode === 200 && response.data.success) {
      log(`✅ ${typeName}缓存清理成功!`, 'green');
      log(`📊 清理了 ${response.data.data.deletedCount} 个缓存条目`, 'yellow');
    } else {
      log(`❌ ${typeName}缓存清理失败!`, 'red');
      log(`错误信息: ${response.data.message || response.data.error || '未知错误'}`, 'red');
    }
    
  } catch (error) {
    log('❌ 请求失败!', 'red');
    log(`错误详情: ${error.message}`, 'red');
  }
}

function showHelp() {
  log('PNG缓存清理工具', 'cyan');
  log('用法:', 'yellow');
  log('  node clear-png-cache.js [选项]', 'white');
  log('', 'white');
  log('选项:', 'yellow');
  log('  --all                清理所有PNG缓存', 'white');
  log('  --all-with-files     清理所有PNG缓存并删除R2文件', 'white');
  log('  --theme <主题名>      清理特定主题缓存 (gradient, light, dark)', 'white');
  log('  --type <内容类型>     清理特定内容类型缓存 (story, heart_voice)', 'white');
  log('  --help              显示帮助信息', 'white');
  log('', 'white');
  log('示例:', 'yellow');
  log('  node clear-png-cache.js --all', 'white');
  log('  node clear-png-cache.js --theme gradient', 'white');
  log('  node clear-png-cache.js --type story', 'white');
  log('  node clear-png-cache.js --all-with-files', 'white');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    return;
  }

  log('🎨 PNG缓存清理工具', 'magenta');
  log('📅 书信体样式更新专用', 'cyan');
  log('', 'white');

  if (args.includes('--all')) {
    await clearAllCache();
  } else if (args.includes('--all-with-files')) {
    await clearAllCache({ deleteFiles: true });
  } else if (args.includes('--theme')) {
    const themeIndex = args.indexOf('--theme');
    const theme = args[themeIndex + 1];
    if (theme) {
      await clearThemeCache(theme);
    } else {
      log('❌ 请指定主题名称', 'red');
      showHelp();
    }
  } else if (args.includes('--type')) {
    const typeIndex = args.indexOf('--type');
    const contentType = args[typeIndex + 1];
    if (contentType && ['story', 'heart_voice'].includes(contentType)) {
      await clearContentTypeCache(contentType);
    } else {
      log('❌ 请指定有效的内容类型 (story 或 heart_voice)', 'red');
      showHelp();
    }
  } else {
    log('❌ 无效的选项', 'red');
    showHelp();
  }
}

// 运行主函数
main().catch(error => {
  log('❌ 程序执行失败!', 'red');
  log(`错误详情: ${error.message}`, 'red');
  process.exit(1);
});
