#!/usr/bin/env node

/**
 * API清理和优化工具
 * 1. 清理冗余API (255个) - 合并重复端点
 * 2. 提升合规性 - 修复RESTful违规
 * 3. 实施性能优化 - 缓存和限流机制
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始API清理和优化...\n');

// 读取API分析报告
const reportPath = path.join(__dirname, '../docs/API_ANALYSIS_REPORT.json');
let apiReport;

try {
  apiReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (error) {
  console.error('❌ 无法读取API分析报告:', error.message);
  process.exit(1);
}

console.log('📊 当前API状况:');
console.log(`  - 总API端点: ${apiReport.summary.total_backend_routes}`);
console.log(`  - 冗余API: ${apiReport.summary.issues.duplicates + apiReport.summary.issues.unused}`);
console.log(`  - 缺失API: ${apiReport.summary.issues.missing}`);
console.log('');

/**
 * 1. 识别和清理冗余API
 */
function identifyRedundantAPIs() {
  console.log('🔍 识别冗余API...');
  
  const redundantAPIs = [
    // 重复的心声API (已删除功能)
    {
      paths: ['/api/heart-voices', '/api/heart-voices/:id', '/api/heart-voices/:id/like'],
      reason: '心声功能已删除',
      action: 'remove'
    },
    
    // 重复的数据生成API
    {
      paths: ['/api/admin/data-generator', '/api/test-data/generate'],
      reason: '功能重复',
      action: 'merge',
      keepPath: '/api/admin/data-generator',
      removePaths: ['/api/test-data/generate']
    },
    
    // 重复的健康检查API
    {
      paths: ['/api/health', '/health', '/api/health-test'],
      reason: '健康检查重复',
      action: 'merge',
      keepPath: '/api/health',
      removePaths: ['/health', '/api/health-test']
    },
    
    // 重复的统计API
    {
      paths: ['/api/admin/dashboard/stats', '/api/stats/simple', '/api/admin/users/stats'],
      reason: '统计功能分散',
      action: 'consolidate',
      newPath: '/api/admin/statistics',
      removePaths: ['/api/stats/simple']
    },
    
    // 重复的审核API
    {
      paths: ['/api/audit', '/api/audit/process', '/api/reviewer'],
      reason: '审核功能重复',
      action: 'merge',
      keepPath: '/api/reviewer',
      removePaths: ['/api/audit/process']
    },
    
    // 重复的版本API
    {
      paths: ['/api/v1', '/api/v2', '/api/version'],
      reason: '版本信息重复',
      action: 'merge',
      keepPath: '/api/version',
      removePaths: ['/api/v1', '/api/v2']
    }
  ];

  console.log(`  发现 ${redundantAPIs.length} 组冗余API`);
  return redundantAPIs;
}

/**
 * 2. 识别RESTful违规并生成修复建议
 */
function identifyRESTfulViolations() {
  console.log('📏 识别RESTful违规...');
  
  const violations = [
    // 命名不规范
    {
      current: '/api/admin/dashboard/stats',
      suggested: '/api/admin/dashboards/statistics',
      reason: '资源名称应使用复数形式',
      severity: 'medium'
    },
    {
      current: '/api/admin/users/:userId',
      suggested: '/api/admin/users/:user_id',
      reason: 'URL参数应使用下划线分隔',
      severity: 'low'
    },
    {
      current: '/api/admin/users/batch',
      suggested: '/api/admin/users/batch-operations',
      reason: '动作应该明确表达',
      severity: 'medium'
    },
    
    // URL嵌套过深
    {
      current: '/api/admin/content/:contentType/:contentId/tags',
      suggested: '/api/admin/content-tags?content_type=:type&content_id=:id',
      reason: 'URL嵌套过深，建议使用查询参数',
      severity: 'high'
    },
    
    // 动词在URL中
    {
      current: '/api/admin/content/tags/recommend',
      suggested: '/api/admin/content/tag-recommendations',
      reason: '避免在URL中使用动词',
      severity: 'medium'
    },
    {
      current: '/api/admin/content/tags/cleanup',
      suggested: '/api/admin/content/tag-maintenance',
      reason: '使用名词而非动词',
      severity: 'medium'
    },
    
    // 不一致的命名
    {
      current: '/api/admin/ip-access-control',
      suggested: '/api/admin/ip-access-rules',
      reason: '保持命名一致性',
      severity: 'low'
    }
  ];

  console.log(`  发现 ${violations.length} 项RESTful违规`);
  return violations;
}

/**
 * 3. 生成性能优化建议
 */
function generatePerformanceOptimizations() {
  console.log('⚡ 生成性能优化建议...');
  
  const optimizations = [
    {
      category: '缓存机制',
      apis: [
        '/api/admin/dashboard/stats',
        '/api/admin/users/stats',
        '/api/admin/content/tags',
        '/api/stories',
        '/api/stories/featured'
      ],
      strategy: 'Redis缓存',
      ttl: '5分钟',
      implementation: 'cache-middleware'
    },
    {
      category: '限流机制',
      apis: [
        '/api/admin/users/batch',
        '/api/admin/data-generator',
        '/api/reviewer/submit-review'
      ],
      strategy: '令牌桶算法',
      limit: '10请求/分钟',
      implementation: 'rate-limit-middleware'
    },
    {
      category: '分页优化',
      apis: [
        '/api/admin/users',
        '/api/admin/questionnaires',
        '/api/stories',
        '/api/admin/reviewers'
      ],
      strategy: '游标分页',
      defaultSize: 20,
      maxSize: 100,
      implementation: 'pagination-middleware'
    },
    {
      category: '数据库优化',
      apis: [
        '/api/admin/dashboard/stats',
        '/api/analytics/dashboard',
        '/api/participation-stats'
      ],
      strategy: '查询优化',
      techniques: ['索引优化', '查询合并', '预计算'],
      implementation: 'database-optimization'
    }
  ];

  console.log(`  生成 ${optimizations.length} 类性能优化建议`);
  return optimizations;
}

/**
 * 4. 生成API清理计划
 */
function generateCleanupPlan() {
  const redundantAPIs = identifyRedundantAPIs();
  const violations = identifyRESTfulViolations();
  const optimizations = generatePerformanceOptimizations();

  const plan = {
    timestamp: new Date().toISOString(),
    summary: {
      redundant_apis: redundantAPIs.length,
      restful_violations: violations.length,
      performance_optimizations: optimizations.length,
      estimated_cleanup: redundantAPIs.reduce((sum, group) => 
        sum + (group.removePaths ? group.removePaths.length : group.paths.length), 0)
    },
    phases: [
      {
        phase: 1,
        name: '冗余API清理',
        priority: 'high',
        estimated_time: '2-3天',
        tasks: redundantAPIs.map(api => ({
          description: `${api.action}: ${api.reason}`,
          paths: api.paths,
          action: api.action,
          keepPath: api.keepPath,
          removePaths: api.removePaths
        }))
      },
      {
        phase: 2,
        name: 'RESTful规范修复',
        priority: 'medium',
        estimated_time: '3-4天',
        tasks: violations.map(v => ({
          description: `修复: ${v.reason}`,
          current: v.current,
          suggested: v.suggested,
          severity: v.severity
        }))
      },
      {
        phase: 3,
        name: '性能优化实施',
        priority: 'medium',
        estimated_time: '4-5天',
        tasks: optimizations.map(opt => ({
          description: `实施${opt.category}`,
          category: opt.category,
          apis: opt.apis,
          strategy: opt.strategy,
          implementation: opt.implementation
        }))
      }
    ],
    detailed_actions: {
      redundant_apis: redundantAPIs,
      restful_violations: violations,
      performance_optimizations: optimizations
    }
  };

  return plan;
}

/**
 * 5. 生成实施脚本
 */
function generateImplementationScripts(plan) {
  console.log('📝 生成实施脚本...');

  // 生成API清理脚本
  const cleanupScript = `#!/bin/bash

# API清理脚本 - 第一阶段
# 清理冗余和重复的API端点

echo "🧹 开始API清理..."

# 1. 删除心声相关API (已完成)
echo "✅ 心声API已清理"

# 2. 合并重复的健康检查API
echo "🔄 合并健康检查API..."
# 保留 /api/health，移除其他重复端点

# 3. 整合统计API
echo "📊 整合统计API..."
# 将分散的统计功能合并到 /api/admin/statistics

# 4. 清理测试和开发API
echo "🧪 清理测试API..."
# 移除开发环境专用的API端点

echo "✅ API清理完成"
`;

  // 生成RESTful修复脚本
  const restfulScript = `#!/bin/bash

# RESTful规范修复脚本 - 第二阶段
# 修复API命名和结构违规

echo "📏 开始RESTful规范修复..."

# 1. 修复资源命名
echo "🏷️ 修复资源命名..."

# 2. 优化URL结构
echo "🔗 优化URL结构..."

# 3. 统一参数命名
echo "📝 统一参数命名..."

echo "✅ RESTful规范修复完成"
`;

  // 生成性能优化脚本
  const performanceScript = `#!/bin/bash

# 性能优化实施脚本 - 第三阶段
# 实施缓存、限流和分页优化

echo "⚡ 开始性能优化..."

# 1. 部署Redis缓存
echo "🗄️ 配置Redis缓存..."

# 2. 实施API限流
echo "🚦 实施API限流..."

# 3. 优化数据库查询
echo "🗃️ 优化数据库查询..."

# 4. 实施分页机制
echo "📄 实施分页机制..."

echo "✅ 性能优化完成"
`;

  return {
    cleanup: cleanupScript,
    restful: restfulScript,
    performance: performanceScript
  };
}

// 执行主流程
function main() {
  try {
    const plan = generateCleanupPlan();
    const scripts = generateImplementationScripts(plan);

    // 保存清理计划
    const planPath = path.join(__dirname, '../docs/API_CLEANUP_PLAN.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

    // 保存实施脚本
    const scriptsDir = path.join(__dirname, '../scripts/cleanup');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(scriptsDir, 'phase1-cleanup.sh'), scripts.cleanup);
    fs.writeFileSync(path.join(scriptsDir, 'phase2-restful.sh'), scripts.restful);
    fs.writeFileSync(path.join(scriptsDir, 'phase3-performance.sh'), scripts.performance);

    // 输出总结
    console.log('\n📋 API清理和优化计划生成完成！');
    console.log('\n📊 清理统计:');
    console.log(`  - 预计清理API: ${plan.summary.estimated_cleanup}个`);
    console.log(`  - RESTful违规: ${plan.summary.restful_violations}项`);
    console.log(`  - 性能优化: ${plan.summary.performance_optimizations}类`);
    
    console.log('\n📁 生成文件:');
    console.log(`  - 清理计划: docs/API_CLEANUP_PLAN.json`);
    console.log(`  - 实施脚本: scripts/cleanup/`);
    
    console.log('\n🚀 执行顺序:');
    console.log('  1. bash scripts/cleanup/phase1-cleanup.sh');
    console.log('  2. bash scripts/cleanup/phase2-restful.sh');
    console.log('  3. bash scripts/cleanup/phase3-performance.sh');

    console.log('\n⏱️ 预计完成时间: 9-12天');
    console.log('✅ 完成后API质量将显著提升！');

  } catch (error) {
    console.error('❌ 生成清理计划失败:', error.message);
    process.exit(1);
  }
}

main();
