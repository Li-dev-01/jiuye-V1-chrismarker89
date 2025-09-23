
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
