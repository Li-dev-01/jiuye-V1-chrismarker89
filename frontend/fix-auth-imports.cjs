#!/usr/bin/env node

/**
 * 批量修复authStore导入问题
 * 将所有对authStore的引用替换为universalAuthStore
 */

const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'src/components/auth/QuickRegister.tsx',
  'src/components/auth/RouteGuard.tsx',
  'src/components/layout/RoleBasedHeader.tsx',
  'src/components/layout/RoleBasedLayout.tsx',
  'src/pages/reviewer/VoiceReviewPage.tsx',
  'src/pages/reviewer/ReviewHistoryPage.tsx',
  'src/pages/reviewer/StoryReviewPage.tsx',
  'src/pages/reviewer/QuestionnaireReviewPage.tsx',
  'src/pages/test/PermissionTestPage.tsx',
  'src/pages/admin/SystemManagementPage.tsx',
  'src/pages/admin/ReviewerManagementPage.tsx',
  'src/pages/admin/SystemLogsPage.tsx',
  'src/pages/admin/UserManagementPage.tsx',
  'src/pages/admin/ContentManagementPage.tsx',
  'src/pages/analytics/AnalyticsPage.tsx',
  'src/pages/analytics/AdvancedAnalyticsPage.tsx',
  'src/pages/debug/AuthDebugPage.tsx'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 替换导入语句
    if (content.includes("import { useAuthStore } from '../../stores/authStore';")) {
      content = content.replace(
        "import { useAuthStore } from '../../stores/authStore';",
        "// import { useAuthStore } from '../../stores/authStore'; // 已删除，使用universalAuthStore"
      );
      modified = true;
    }

    // 替换使用语句 - 简单替换
    if (content.includes('useAuthStore()')) {
      content = content.replace(/useAuthStore\(\)/g, 'useUniversalAuthStore()');
      modified = true;
    }

    if (content.includes('useAuthStore')) {
      content = content.replace(/useAuthStore/g, 'useUniversalAuthStore');
      modified = true;
    }

    // 替换变量名
    if (content.includes('authStore')) {
      content = content.replace(/authStore/g, 'universalAuthStore');
      modified = true;
    }

    // 确保有universalAuthStore的导入
    if (modified && !content.includes("import { useUniversalAuthStore }")) {
      // 在第一个import语句后添加
      const importMatch = content.match(/^import.*from.*['"];$/m);
      if (importMatch) {
        const insertIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, insertIndex) + 
          "\nimport { useUniversalAuthStore } from '../../stores/universalAuthStore';" +
          content.slice(insertIndex);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 修复完成: ${filePath}`);
    } else {
      console.log(`ℹ️  无需修复: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ 修复失败: ${filePath}`, error.message);
  }
}

console.log('🔧 开始批量修复authStore导入问题...\n');

filesToFix.forEach(fixFile);

console.log('\n🎉 批量修复完成！');
console.log('\n⚠️  注意: 请手动检查修复后的文件，确保逻辑正确。');
console.log('某些复杂的使用场景可能需要手动调整。');
