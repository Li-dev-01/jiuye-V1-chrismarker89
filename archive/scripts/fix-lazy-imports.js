#!/usr/bin/env node

/**
 * 修复懒加载导入问题的脚本
 * 检查所有页面组件的导出方式，并修复App.tsx中的导入
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要检查的页面目录
const pageDirs = [
  'src/pages',
  'src/components'
];

// 存储组件导出信息
const componentExports = new Map();

/**
 * 检查文件的导出方式
 */
function checkExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.tsx');
    
    // 检查是否有默认导出
    const hasDefaultExport = /export\s+default\s+/.test(content);
    
    // 检查是否有命名导出（匹配文件名）
    const namedExportRegex = new RegExp(`export\\s+const\\s+${fileName}\\s*[:=]`, 'g');
    const hasNamedExport = namedExportRegex.test(content);
    
    // 检查其他命名导出
    const otherNamedExports = [];
    const namedExportMatches = content.match(/export\s+const\s+(\w+)\s*[:=]/g);
    if (namedExportMatches) {
      namedExportMatches.forEach(match => {
        const name = match.match(/export\s+const\s+(\w+)/)[1];
        if (name !== fileName) {
          otherNamedExports.push(name);
        }
      });
    }
    
    return {
      filePath,
      fileName,
      hasDefaultExport,
      hasNamedExport,
      otherNamedExports,
      content
    };
  } catch (error) {
    console.error(`检查文件失败: ${filePath}`, error.message);
    return null;
  }
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir) {
  const fullPath = path.join(__dirname, dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`目录不存在: ${fullPath}`);
    return;
  }
  
  const items = fs.readdirSync(fullPath);
  
  items.forEach(item => {
    const itemPath = path.join(fullPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      scanDirectory(path.join(dir, item));
    } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.spec.')) {
      const exportInfo = checkExports(itemPath);
      if (exportInfo) {
        const relativePath = path.relative(__dirname, itemPath);
        componentExports.set(relativePath, exportInfo);
      }
    }
  });
}

/**
 * 分析App.tsx中的懒加载导入
 */
function analyzeAppImports() {
  const appPath = path.join(__dirname, 'src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // 匹配所有懒加载导入
  const lazyImportRegex = /const\s+(\w+)\s*=\s*React\.lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)(?:\.then\(module\s*=>\s*\(\{\s*default:\s*module\.([^}]+)\s*\}\)\))?/g;
  
  const imports = [];
  let match;
  
  while ((match = lazyImportRegex.exec(appContent)) !== null) {
    const [fullMatch, componentName, importPath, moduleProperty] = match;
    imports.push({
      componentName,
      importPath,
      moduleProperty,
      fullMatch,
      line: appContent.substring(0, match.index).split('\n').length
    });
  }
  
  return imports;
}

/**
 * 生成修复建议
 */
function generateFixSuggestions() {
  console.log('🔍 分析懒加载导入问题...\n');
  
  // 扫描所有页面组件
  pageDirs.forEach(dir => {
    console.log(`扫描目录: ${dir}`);
    scanDirectory(dir);
  });
  
  console.log(`\n📊 找到 ${componentExports.size} 个组件文件\n`);
  
  // 分析App.tsx中的导入
  const appImports = analyzeAppImports();
  console.log(`📋 找到 ${appImports.length} 个懒加载导入\n`);
  
  // 检查每个导入是否正确
  const issues = [];
  
  appImports.forEach(importInfo => {
    const { componentName, importPath, moduleProperty } = importInfo;
    
    // 查找对应的组件文件
    const possiblePaths = [
      `src/${importPath}.tsx`,
      `src/${importPath}/index.tsx`
    ];
    
    let componentInfo = null;
    for (const possiblePath of possiblePaths) {
      if (componentExports.has(possiblePath)) {
        componentInfo = componentExports.get(possiblePath);
        break;
      }
    }
    
    if (!componentInfo) {
      issues.push({
        type: 'FILE_NOT_FOUND',
        importInfo,
        message: `找不到组件文件: ${importPath}`
      });
      return;
    }
    
    // 检查导出方式是否匹配
    if (moduleProperty) {
      if (moduleProperty === 'default') {
        // 期望默认导出
        if (!componentInfo.hasDefaultExport) {
          issues.push({
            type: 'MISSING_DEFAULT_EXPORT',
            importInfo,
            componentInfo,
            message: `组件 ${componentName} 期望默认导出，但文件中没有默认导出`
          });
        }
      } else {
        // 期望命名导出
        const expectedName = moduleProperty;
        if (!componentInfo.hasNamedExport && expectedName === componentInfo.fileName) {
          issues.push({
            type: 'MISSING_NAMED_EXPORT',
            importInfo,
            componentInfo,
            message: `组件 ${componentName} 期望命名导出 ${expectedName}，但文件中没有该导出`
          });
        } else if (!componentInfo.otherNamedExports.includes(expectedName) && expectedName !== componentInfo.fileName) {
          issues.push({
            type: 'WRONG_NAMED_EXPORT',
            importInfo,
            componentInfo,
            message: `组件 ${componentName} 期望命名导出 ${expectedName}，但文件中没有该导出`
          });
        }
      }
    } else {
      // 没有.then()，期望默认导出
      if (!componentInfo.hasDefaultExport) {
        issues.push({
          type: 'NEEDS_THEN_CLAUSE',
          importInfo,
          componentInfo,
          message: `组件 ${componentName} 没有默认导出，需要添加.then()子句`
        });
      }
    }
  });
  
  // 输出问题报告
  if (issues.length === 0) {
    console.log('✅ 没有发现懒加载导入问题！');
    return;
  }
  
  console.log(`❌ 发现 ${issues.length} 个懒加载导入问题:\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.type}: ${issue.message}`);
    console.log(`   文件: ${issue.importInfo.importPath}`);
    console.log(`   组件: ${issue.importInfo.componentName}`);
    console.log(`   行号: ${issue.importInfo.line}`);
    
    if (issue.componentInfo) {
      console.log(`   导出情况: 默认导出=${issue.componentInfo.hasDefaultExport}, 命名导出=${issue.componentInfo.hasNamedExport}`);
      if (issue.componentInfo.otherNamedExports.length > 0) {
        console.log(`   其他导出: ${issue.componentInfo.otherNamedExports.join(', ')}`);
      }
    }
    console.log('');
  });
  
  // 生成修复建议
  console.log('🔧 修复建议:\n');
  
  issues.forEach((issue, index) => {
    const { importInfo, componentInfo } = issue;
    
    switch (issue.type) {
      case 'MISSING_DEFAULT_EXPORT':
        if (componentInfo.hasNamedExport) {
          console.log(`${index + 1}. 修改导入为: .then(module => ({ default: module.${componentInfo.fileName} }))`);
        }
        break;
        
      case 'NEEDS_THEN_CLAUSE':
        if (componentInfo.hasNamedExport) {
          console.log(`${index + 1}. 修改导入为: .then(module => ({ default: module.${componentInfo.fileName} }))`);
        }
        break;
        
      case 'WRONG_NAMED_EXPORT':
        if (componentInfo.hasDefaultExport) {
          console.log(`${index + 1}. 修改导入为: .then(module => ({ default: module.default }))`);
        } else if (componentInfo.hasNamedExport) {
          console.log(`${index + 1}. 修改导入为: .then(module => ({ default: module.${componentInfo.fileName} }))`);
        }
        break;
    }
  });
}

// 运行分析
generateFixSuggestions();
