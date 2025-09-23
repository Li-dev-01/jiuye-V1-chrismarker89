
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
    fetch(`${API_ENDPOINTS.CONTENT_TAGS}?content_type=${content_type}&content_id=${content_id}`)
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
