#!/usr/bin/env node

/**
 * 检查懒加载导入问题的脚本
 * 分析App.tsx中的懒加载导入与实际组件导出的匹配情况
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取App.tsx文件
const appPath = path.join(__dirname, 'src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

// 提取所有懒加载导入
const lazyImportRegex = /const\s+(\w+)\s*=\s*React\.lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)(?:\.then\(module\s*=>\s*\(\{\s*default:\s*module\.([^}]+)\s*\}\)\))?\);/g;

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

console.log('🔍 检查懒加载导入问题...\n');
console.log(`📋 找到 ${imports.length} 个懒加载导入\n`);

// 检查每个导入
const issues = [];

imports.forEach(importInfo => {
  const { componentName, importPath, moduleProperty } = importInfo;
  
  // 构建文件路径
  const filePath = path.join(__dirname, 'src', importPath + '.tsx');
  
  if (!fs.existsSync(filePath)) {
    issues.push({
      type: 'FILE_NOT_FOUND',
      importInfo,
      message: `文件不存在: ${filePath}`
    });
    return;
  }
  
  // 读取文件内容
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // 检查导出方式
  const hasDefaultExport = /export\s+default\s+/.test(fileContent);
  const namedExportRegex = new RegExp(`export\\s+const\\s+${componentName}\\s*[:=]`, 'g');
  const hasNamedExport = namedExportRegex.test(fileContent);
  
  // 分析导入是否正确
  if (moduleProperty) {
    if (moduleProperty === 'default') {
      // 期望默认导出
      if (!hasDefaultExport) {
        issues.push({
          type: 'MISSING_DEFAULT_EXPORT',
          importInfo,
          message: `组件 ${componentName} 期望默认导出，但文件中没有默认导出`,
          hasNamedExport,
          hasDefaultExport
        });
      }
    } else {
      // 期望命名导出
      if (moduleProperty === componentName && !hasNamedExport) {
        issues.push({
          type: 'MISSING_NAMED_EXPORT',
          importInfo,
          message: `组件 ${componentName} 期望命名导出，但文件中没有该导出`,
          hasNamedExport,
          hasDefaultExport
        });
      }
    }
  } else {
    // 没有.then()，期望默认导出
    if (!hasDefaultExport) {
      issues.push({
        type: 'NEEDS_THEN_CLAUSE',
        importInfo,
        message: `组件 ${componentName} 没有默认导出，需要添加.then()子句`,
        hasNamedExport,
        hasDefaultExport
      });
    }
  }
  
  // 输出检查结果
  console.log(`✅ ${componentName}:`);
  console.log(`   路径: ${importPath}`);
  console.log(`   导入方式: ${moduleProperty ? `module.${moduleProperty}` : '默认导入'}`);
  console.log(`   文件导出: 默认=${hasDefaultExport}, 命名=${hasNamedExport}`);
  console.log('');
});

// 输出问题报告
if (issues.length === 0) {
  console.log('🎉 没有发现懒加载导入问题！');
} else {
  console.log(`❌ 发现 ${issues.length} 个懒加载导入问题:\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.type}: ${issue.message}`);
    console.log(`   文件: ${issue.importInfo.importPath}`);
    console.log(`   组件: ${issue.importInfo.componentName}`);
    console.log(`   行号: ${issue.importInfo.line}`);
    console.log(`   当前导入: ${issue.importInfo.fullMatch}`);
    
    // 生成修复建议
    switch (issue.type) {
      case 'MISSING_DEFAULT_EXPORT':
        if (issue.hasNamedExport) {
          console.log(`   修复建议: .then(module => ({ default: module.${issue.importInfo.componentName} }))`);
        }
        break;
        
      case 'NEEDS_THEN_CLAUSE':
        if (issue.hasNamedExport) {
          console.log(`   修复建议: .then(module => ({ default: module.${issue.importInfo.componentName} }))`);
        }
        break;
        
      case 'WRONG_NAMED_EXPORT':
        if (issue.hasDefaultExport) {
          console.log(`   修复建议: .then(module => ({ default: module.default }))`);
        } else if (issue.hasNamedExport) {
          console.log(`   修复建议: .then(module => ({ default: module.${issue.importInfo.componentName} }))`);
        }
        break;
    }
    console.log('');
  });
}

console.log('🔧 检查完成！');
