#!/usr/bin/env node

/**
 * API RESTful重构脚本
 * 修复API命名和结构违规
 */

const fs = require('fs');
const path = require('path');

console.log('📏 开始API RESTful重构...\n');

// RESTful重构映射
const refactorMappings = [
  // 1. 修复资源命名 - 使用复数形式
  {
    category: '资源命名修复',
    changes: [
      {
        from: '/api/admin/dashboard/stats',
        to: '/api/admin/dashboards/statistics',
        reason: '资源名称应使用复数形式'
      },
      {
        from: '/api/admin/content/tags/recommend',
        to: '/api/admin/content/tag-recommendations',
        reason: '避免在URL中使用动词，使用名词资源'
      },
      {
        from: '/api/admin/content/tags/cleanup',
        to: '/api/admin/content/tag-maintenance',
        reason: '使用名词而非动词'
      },
      {
        from: '/api/admin/content/tags/merge',
        to: '/api/admin/content/tag-merges',
        reason: '动作应该表示为资源'
      }
    ]
  },

  // 2. 修复URL参数命名 - 使用下划线
  {
    category: 'URL参数命名修复',
    changes: [
      {
        from: '/api/admin/users/:userId',
        to: '/api/admin/users/:user_id',
        reason: 'URL参数应使用下划线分隔'
      },
      {
        from: '/api/admin/content/:contentType/:contentId/tags',
        to: '/api/admin/content-tags?content_type=:type&content_id=:id',
        reason: 'URL嵌套过深，使用查询参数'
      }
    ]
  },

  // 3. 简化URL结构
  {
    category: 'URL结构简化',
    changes: [
      {
        from: '/api/admin/users/batch',
        to: '/api/admin/user-batch-operations',
        reason: '明确表达批量操作'
      },
      {
        from: '/api/admin/users/export',
        to: '/api/admin/user-exports',
        reason: '导出作为资源处理'
      },
      {
        from: '/api/admin/users/manage',
        to: '/api/admin/user-management',
        reason: '管理功能作为资源'
      }
    ]
  },

  // 4. 统一命名约定
  {
    category: '命名约定统一',
    changes: [
      {
        from: '/api/admin/ip-access-control',
        to: '/api/admin/ip-access-rules',
        reason: '保持命名一致性'
      },
      {
        from: '/api/admin/intelligent-security',
        to: '/api/admin/security-intelligence',
        reason: '调整词序保持一致性'
      }
    ]
  }
];

/**
 * 生成重构计划
 */
function generateRefactorPlan() {
  console.log('📋 生成重构计划...');
  
  const plan = {
    timestamp: new Date().toISOString(),
    summary: {
      total_changes: refactorMappings.reduce((sum, category) => sum + category.changes.length, 0),
      categories: refactorMappings.length
    },
    phases: refactorMappings.map((mapping, index) => ({
      phase: index + 1,
      name: mapping.category,
      changes: mapping.changes.length,
      estimated_time: `${Math.ceil(mapping.changes.length / 2)}小时`,
      changes_detail: mapping.changes
    })),
    implementation_steps: [
      {
        step: 1,
        description: '更新后端路由定义',
        files: ['backend/src/routes/admin.ts', 'backend/src/routes/*.ts'],
        action: '修改路由路径和参数名'
      },
      {
        step: 2,
        description: '更新前端API调用',
        files: ['frontend/src/**/*.ts', 'frontend/src/**/*.tsx'],
        action: '更新API调用路径'
      },
      {
        step: 3,
        description: '更新API文档',
        files: ['docs/API_DOCUMENTATION.md', 'docs/openapi.json'],
        action: '同步更新文档'
      },
      {
        step: 4,
        description: '更新测试用例',
        files: ['tests/api/*.test.js'],
        action: '修改测试中的API路径'
      }
    ]
  };

  return plan;
}

/**
 * 生成路由重构代码
 */
function generateRouteRefactorCode() {
  console.log('🔧 生成路由重构代码...');

  const refactorCode = `
// API路由重构 - 修复RESTful违规

// 1. 仪表板统计 - 修复资源命名
// 原: /api/admin/dashboard/stats
// 新: /api/admin/dashboards/statistics
admin.get('/dashboards/statistics', 
  cache(cacheConfigs.stats),
  async (c) => {
    // 原有逻辑保持不变
  }
);

// 2. 用户批量操作 - 明确表达操作
// 原: /api/admin/users/batch
// 新: /api/admin/user-batch-operations
admin.post('/user-batch-operations',
  rateLimit(rateLimitConfigs.strict),
  validateRequestBody({
    user_ids: { required: true, custom: (value) => Array.isArray(value) },
    action: { required: true, enum: ['activate', 'deactivate', 'delete'] }
  }),
  async (c) => {
    // 原有逻辑，但使用新的参数名
  }
);

// 3. 用户导出 - 作为资源处理
// 原: /api/admin/users/export
// 新: /api/admin/user-exports
admin.post('/user-exports',
  rateLimit(rateLimitConfigs.moderate),
  async (c) => {
    // 创建导出任务
  }
);

admin.get('/user-exports/:export_id',
  async (c) => {
    // 获取导出状态和下载链接
  }
);

// 4. 标签推荐 - 使用名词资源
// 原: /api/admin/content/tags/recommend
// 新: /api/admin/content/tag-recommendations
admin.get('/content/tag-recommendations',
  cache(cacheConfigs.content),
  async (c) => {
    // 获取标签推荐
  }
);

admin.post('/content/tag-recommendations',
  async (c) => {
    // 生成新的标签推荐
  }
);

// 5. 标签维护 - 替代cleanup动词
// 原: /api/admin/content/tags/cleanup
// 新: /api/admin/content/tag-maintenance
admin.post('/content/tag-maintenance',
  rateLimit(rateLimitConfigs.strict),
  async (c) => {
    // 执行标签清理维护
  }
);

// 6. 内容标签关联 - 简化嵌套URL
// 原: /api/admin/content/:contentType/:contentId/tags
// 新: /api/admin/content-tags (使用查询参数)
admin.get('/content-tags',
  validateQueryParams({
    content_type: { required: true, enum: ['story', 'questionnaire'] },
    content_id: { required: true, pattern: /^[a-f0-9-]{36}$/ }
  }),
  cache(cacheConfigs.content),
  async (c) => {
    const { content_type, content_id } = c.req.query();
    // 获取内容关联的标签
  }
);

// 7. IP访问规则 - 统一命名
// 原: /api/admin/ip-access-control
// 新: /api/admin/ip-access-rules
admin.get('/ip-access-rules',
  cache(cacheConfigs.medium),
  async (c) => {
    // 获取IP访问规则
  }
);

admin.post('/ip-access-rules',
  invalidateCache(['ip-access']),
  async (c) => {
    // 创建IP访问规则
  }
);
`;

  return refactorCode;
}

/**
 * 生成前端API调用更新代码
 */
function generateFrontendUpdateCode() {
  console.log('🎨 生成前端更新代码...');

  const frontendCode = `
// 前端API调用更新

// 1. 更新API路径常量
export const API_ENDPOINTS = {
  // 仪表板
  DASHBOARD_STATS: '/api/admin/dashboards/statistics', // 原: /dashboard/stats
  
  // 用户管理
  USERS: '/api/admin/users',
  USER_BATCH_OPS: '/api/admin/user-batch-operations', // 原: /users/batch
  USER_EXPORTS: '/api/admin/user-exports', // 原: /users/export
  
  // 内容管理
  CONTENT_TAGS: '/api/admin/content-tags', // 原: /content/:type/:id/tags
  TAG_RECOMMENDATIONS: '/api/admin/content/tag-recommendations', // 原: /content/tags/recommend
  TAG_MAINTENANCE: '/api/admin/content/tag-maintenance', // 原: /content/tags/cleanup
  
  // 安全管理
  IP_ACCESS_RULES: '/api/admin/ip-access-rules', // 原: /ip-access-control
  SECURITY_INTELLIGENCE: '/api/admin/security-intelligence' // 原: /intelligent-security
};

// 2. 更新API调用函数
export const adminAPI = {
  // 获取仪表板统计
  getDashboardStats: () => 
    fetch(API_ENDPOINTS.DASHBOARD_STATS).then(res => res.json()),
  
  // 批量操作用户
  batchOperateUsers: (user_ids: string[], action: string) =>
    fetch(API_ENDPOINTS.USER_BATCH_OPS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids, action }) // 使用下划线命名
    }).then(res => res.json()),
  
  // 获取内容标签 (使用查询参数)
  getContentTags: (content_type: string, content_id: string) =>
    fetch(\`\${API_ENDPOINTS.CONTENT_TAGS}?content_type=\${content_type}&content_id=\${content_id}\`)
      .then(res => res.json()),
  
  // 获取标签推荐
  getTagRecommendations: () =>
    fetch(API_ENDPOINTS.TAG_RECOMMENDATIONS).then(res => res.json()),
  
  // 执行标签维护
  performTagMaintenance: (options: any) =>
    fetch(API_ENDPOINTS.TAG_MAINTENANCE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    }).then(res => res.json())
};
`;

  return frontendCode;
}

/**
 * 主执行函数
 */
function main() {
  try {
    const plan = generateRefactorPlan();
    const routeCode = generateRouteRefactorCode();
    const frontendCode = generateFrontendUpdateCode();

    // 保存重构计划
    const planPath = path.join(__dirname, '../docs/API_RESTFUL_REFACTOR_PLAN.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

    // 保存重构代码
    const codeDir = path.join(__dirname, '../scripts/refactor');
    if (!fs.existsSync(codeDir)) {
      fs.mkdirSync(codeDir, { recursive: true });
    }

    fs.writeFileSync(path.join(codeDir, 'route-refactor.js'), routeCode);
    fs.writeFileSync(path.join(codeDir, 'frontend-update.js'), frontendCode);

    // 输出总结
    console.log('\n📋 RESTful重构计划生成完成！');
    console.log('\n📊 重构统计:');
    console.log(`  - 总变更数: ${plan.summary.total_changes}个`);
    console.log(`  - 变更类别: ${plan.summary.categories}类`);
    
    console.log('\n📁 生成文件:');
    console.log(`  - 重构计划: docs/API_RESTFUL_REFACTOR_PLAN.json`);
    console.log(`  - 路由重构代码: scripts/refactor/route-refactor.js`);
    console.log(`  - 前端更新代码: scripts/refactor/frontend-update.js`);
    
    console.log('\n🚀 实施步骤:');
    plan.implementation_steps.forEach(step => {
      console.log(`  ${step.step}. ${step.description}`);
    });

    console.log('\n⏱️ 预计完成时间: 1-2天');
    console.log('✅ 完成后API将完全符合RESTful规范！');

  } catch (error) {
    console.error('❌ 生成重构计划失败:', error.message);
    process.exit(1);
  }
}

main();
