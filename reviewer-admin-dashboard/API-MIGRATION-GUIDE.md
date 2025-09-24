# API迁移指南

**创建时间**: 2024年9月24日  
**状态**: 🚨 紧急 - 需要立即执行  
**影响范围**: 传统API端点迁移到简化API系统

## 🎯 **迁移概述**

### **问题背景**
当前系统中存在多个已弃用的传统API端点仍在被前端代码使用，导致：
- 100%错误率的API调用
- 用户功能异常
- 系统稳定性问题

### **迁移目标**
将所有传统API调用迁移到新的简化API系统，确保：
- ✅ 功能正常运行
- ✅ 性能优化
- ✅ 代码维护性提升

## 📊 **需要迁移的API端点**

### **1. 管理员API迁移**

#### **仪表板统计**
```diff
- 旧端点: GET /api/admin/dashboard/stats
+ 新端点: GET /api/simple-admin/dashboard
```

**影响文件**:
- `frontend/src/services/adminService.ts:192`
- `frontend/src/services/ManagementAdminService.ts:178`

**迁移步骤**:
1. 更新API调用路径
2. 调整响应数据结构处理
3. 更新错误处理逻辑

#### **问卷管理**
```diff
- 旧端点: GET /api/admin/questionnaires
+ 新端点: GET /api/simple-admin/questionnaires (需要实现)
```

**影响文件**:
- `frontend/src/services/adminService.ts:210`
- `frontend/src/services/ManagementAdminService.ts:357`

#### **用户数据导出**
```diff
- 旧端点: GET /api/admin/users/export
+ 新端点: GET /api/simple-admin/users/export (需要实现)
```

**影响文件**:
- `frontend/src/services/ManagementAdminService.ts:331`

### **2. 审核员API迁移**

#### **审核内容列表**
```diff
- 旧端点: GET /api/reviewer/content
+ 新端点: GET /api/simple-reviewer/pending-reviews
```

#### **提交审核结果**
```diff
- 旧端点: POST /api/reviewer/audit/submit
+ 新端点: POST /api/simple-reviewer/submit-review
```

#### **审核统计**
```diff
- 旧端点: GET /api/reviewer/stats
+ 新端点: GET /api/simple-reviewer/stats
```

**影响文件**:
- `frontend/src/pages/reviewer/ReviewerDashboard.tsx:42`

## 🔧 **实施计划**

### **阶段1: 后端API实现** (优先级: 🔴 高)

需要在后端实现缺失的简化API端点：

1. **simple-admin端点**:
   ```typescript
   GET /api/simple-admin/questionnaires
   GET /api/simple-admin/users/export
   ```

2. **simple-reviewer端点**:
   ```typescript
   GET /api/simple-reviewer/stats
   POST /api/simple-reviewer/submit-review
   ```

### **阶段2: 前端代码迁移** (优先级: 🔴 高)

1. **更新服务文件**:
   - 修改API调用路径
   - 调整数据结构处理
   - 更新认证方式

2. **测试验证**:
   - 功能测试
   - 集成测试
   - 用户验收测试

### **阶段3: 清理工作** (优先级: 🟡 中)

1. **移除旧端点**:
   - 后端路由清理
   - 文档更新
   - 监控告警调整

## 📝 **具体迁移步骤**

### **步骤1: 后端API实现**

在 `backend/src/routes/simpleAdmin.ts` 中添加：

```typescript
// 问卷管理
simpleAdmin.get('/questionnaires', simpleAuthMiddleware, requireRole(['admin', 'super_admin']), async (c) => {
  // 实现问卷列表逻辑
});

// 用户数据导出
simpleAdmin.get('/users/export', simpleAuthMiddleware, requireRole(['admin', 'super_admin']), async (c) => {
  // 实现用户导出逻辑
});
```

在 `backend/src/routes/simpleReviewer.ts` 中添加：

```typescript
// 审核统计
simpleReviewer.get('/stats', simpleAuthMiddleware, requireRole(['reviewer', 'admin', 'super_admin']), async (c) => {
  // 实现审核统计逻辑
});

// 提交审核结果
simpleReviewer.post('/submit-review', simpleAuthMiddleware, requireRole(['reviewer', 'admin', 'super_admin']), async (c) => {
  // 实现审核提交逻辑
});
```

### **步骤2: 前端服务更新**

更新 `frontend/src/services/adminService.ts`:

```typescript
// 旧代码
static async getDashboardStats(): Promise<DashboardStats> {
  const response = await adminApi.get('/api/admin/dashboard/stats');
  return response.data.data;
}

// 新代码
static async getDashboardStats(): Promise<DashboardStats> {
  const response = await adminApi.get('/api/simple-admin/dashboard');
  return response.data.data;
}
```

### **步骤3: 认证方式调整**

确保使用正确的认证方式：

```typescript
// 使用simple-auth的JWT token
const token = localStorage.getItem('reviewer_token');
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## ⚠️ **注意事项**

### **数据结构差异**
- 简化API可能返回不同的数据结构
- 需要调整前端数据处理逻辑
- 确保向后兼容性

### **认证方式**
- 传统API使用不同的认证机制
- 简化API使用JWT Bearer token
- 需要更新认证头设置

### **错误处理**
- 简化API的错误响应格式可能不同
- 需要更新错误处理逻辑
- 确保用户友好的错误提示

## 🧪 **测试计划**

### **单元测试**
- [ ] API端点功能测试
- [ ] 数据结构验证
- [ ] 错误处理测试

### **集成测试**
- [ ] 前后端集成测试
- [ ] 认证流程测试
- [ ] 数据流测试

### **用户验收测试**
- [ ] 管理员功能测试
- [ ] 审核员功能测试
- [ ] 性能测试

## 📈 **预期收益**

### **技术收益**
- ✅ 消除100%错误率的API调用
- ✅ 统一认证机制
- ✅ 简化代码维护
- ✅ 提升系统稳定性

### **业务收益**
- ✅ 恢复正常功能
- ✅ 提升用户体验
- ✅ 减少支持工作量
- ✅ 提高开发效率

## 🚀 **执行时间表**

| 阶段 | 任务 | 预计时间 | 负责人 |
|------|------|----------|--------|
| 1 | 后端API实现 | 2-3天 | 后端开发 |
| 2 | 前端代码迁移 | 1-2天 | 前端开发 |
| 3 | 测试验证 | 1天 | QA团队 |
| 4 | 部署上线 | 0.5天 | DevOps |
| 5 | 清理工作 | 1天 | 全团队 |

**总计**: 5.5-7.5天

## 📞 **联系方式**

如有问题或需要支持，请联系：
- 技术负责人: [技术团队]
- 项目经理: [项目团队]
- 紧急联系: [紧急联系方式]

---

**⚠️ 重要提醒**: 此迁移工作影响核心功能，建议在非业务高峰期执行，并做好回滚准备。
