# 用户角色权限设计 V1

## 🎯 权限设计原则

- **最小权限原则**: 用户只获得完成工作所需的最小权限
- **角色分离**: 明确区分不同角色的职责和权限
- **权限继承**: 高级角色继承低级角色的权限
- **动态权限**: 支持运行时权限检查和调整
- **审计追踪**: 记录所有权限相关的操作

## 👤 角色定义

### 1. 匿名用户 (Anonymous)
**描述**: 未注册或未登录的访客用户

**权限范围**:
- ✅ 浏览公开内容 (首页、关于页面)
- ✅ 填写和提交问卷
- ✅ 查看数据可视化 (公开部分)
- ✅ 浏览已发布的问卷心声
- ✅ 浏览已发布的就业故事
- ❌ 访问管理功能
- ❌ 查看敏感数据
- ❌ 修改任何内容

**页面访问权限**:
```typescript
const anonymousPermissions = {
  pages: [
    '/',
    '/questionnaire',
    '/success',
    '/visualization',
    '/voices',
    '/stories',
    '/about',
    '/privacy',
    '/terms'
  ],
  actions: [
    'questionnaire:submit',
    'voices:view',
    'stories:view',
    'visualization:view'
  ]
};
```

### 2. 注册用户 (User)
**描述**: 已注册并登录的普通用户

**权限范围**:
- ✅ 继承匿名用户所有权限
- ✅ 查看个人提交历史
- ✅ 编辑个人资料
- ✅ 收藏心声和故事
- ✅ 点赞和评论 (如果开启)
- ❌ 访问管理功能
- ❌ 审核内容

**页面访问权限**:
```typescript
const userPermissions = {
  ...anonymousPermissions,
  pages: [
    ...anonymousPermissions.pages,
    '/profile',
    '/my-submissions',
    '/favorites'
  ],
  actions: [
    ...anonymousPermissions.actions,
    'profile:edit',
    'submissions:view',
    'content:like',
    'content:favorite'
  ]
};
```

### 3. 审核员 (Reviewer)
**描述**: 负责内容审核的专职人员

**权限范围**:
- ✅ 继承注册用户所有权限
- ✅ 查看待审核内容队列
- ✅ 审核问卷响应
- ✅ 审核问卷心声
- ✅ 审核就业故事
- ✅ 查看审核历史和统计
- ✅ 批量审核操作
- ❌ 用户管理
- ❌ 系统配置

**页面访问权限**:
```typescript
const reviewerPermissions = {
  ...userPermissions,
  pages: [
    ...userPermissions.pages,
    '/reviewer/dashboard',
    '/reviewer/queue',
    '/reviewer/history',
    '/reviewer/stats'
  ],
  actions: [
    ...userPermissions.actions,
    'content:review',
    'content:approve',
    'content:reject',
    'review:batch',
    'review:history'
  ]
};
```

### 4. 管理员 (Admin)
**描述**: 平台管理员，负责日常运营管理

**权限范围**:
- ✅ 继承审核员所有权限
- ✅ 用户管理 (查看、编辑、禁用)
- ✅ 内容管理 (所有内容的CRUD)
- ✅ 审核员管理
- ✅ 数据分析和报告
- ✅ 系统监控
- ❌ 系统核心配置
- ❌ 超级管理员功能

**页面访问权限**:
```typescript
const adminPermissions = {
  ...reviewerPermissions,
  pages: [
    ...reviewerPermissions.pages,
    '/admin/dashboard',
    '/admin/users',
    '/admin/questionnaires',
    '/admin/voices',
    '/admin/stories',
    '/admin/reviewers',
    '/admin/analytics',
    '/admin/reports'
  ],
  actions: [
    ...reviewerPermissions.actions,
    'users:manage',
    'content:manage',
    'reviewers:manage',
    'analytics:view',
    'reports:generate'
  ]
};
```

### 5. 超级管理员 (SuperAdmin)
**描述**: 系统最高权限用户，负责系统配置和维护

**权限范围**:
- ✅ 继承管理员所有权限
- ✅ 系统配置管理
- ✅ 数据库管理
- ✅ 安全设置
- ✅ 备份和恢复
- ✅ 日志查看
- ✅ 性能监控
- ✅ 管理员权限分配

**页面访问权限**:
```typescript
const superAdminPermissions = {
  ...adminPermissions,
  pages: [
    ...adminPermissions.pages,
    '/superadmin/system',
    '/superadmin/database',
    '/superadmin/security',
    '/superadmin/backup',
    '/superadmin/logs',
    '/superadmin/monitoring',
    '/superadmin/permissions'
  ],
  actions: [
    ...adminPermissions.actions,
    'system:configure',
    'database:manage',
    'security:manage',
    'backup:manage',
    'logs:view',
    'monitoring:view',
    'permissions:assign'
  ]
};
```

## 🔐 权限实现

### 权限检查中间件
```typescript
// 权限检查装饰器
function RequirePermission(permission: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const user = getCurrentUser();
      if (!hasPermission(user, permission)) {
        throw new ForbiddenError(`需要权限: ${permission}`);
      }
      return originalMethod.apply(this, args);
    };
  };
}

// 使用示例
class QuestionnaireController {
  @RequirePermission('content:review')
  async reviewQuestionnaire(id: string, action: string) {
    // 审核逻辑
  }
}
```

### 前端权限组件
```tsx
// 权限包装组件
interface PermissionWrapperProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  permission,
  fallback = null,
  children
}) => {
  const { user } = useAuth();
  const hasPermission = usePermission(permission);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// 使用示例
<PermissionWrapper permission="content:review">
  <ReviewButton />
</PermissionWrapper>
```

### 路由权限守卫
```tsx
// 路由权限守卫
interface ProtectedRouteProps {
  requiredRole?: UserRole;
  requiredPermission?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  requiredPermission,
  children
}) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && !hasRole(user, requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }
  
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/forbidden" />;
  }
  
  return <>{children}</>;
};
```

## 📊 权限矩阵

| 功能模块 | 匿名用户 | 注册用户 | 审核员 | 管理员 | 超级管理员 |
|----------|----------|----------|--------|--------|------------|
| 浏览公开内容 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 提交问卷 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看个人资料 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 审核内容 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 用户管理 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 系统配置 | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🔄 权限升级流程

### 申请审核员权限
1. 用户提交申请表单
2. 管理员审核申请
3. 通过后分配审核员角色
4. 发送通知邮件

### 申请管理员权限
1. 审核员提交申请
2. 超级管理员审核
3. 通过后分配管理员角色
4. 记录权限变更日志

## 🛡️ 安全考虑

### 权限验证
- 前端权限检查仅用于UI展示
- 后端必须进行权限验证
- 敏感操作需要二次确认
- 定期审计权限分配

### 会话管理
- JWT令牌包含用户角色信息
- 令牌过期时间设置
- 刷新令牌机制
- 登出时清除所有令牌

### 审计日志
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  details?: any;
}
```

## 📈 权限监控

### 权限使用统计
- 各角色活跃度统计
- 权限使用频率分析
- 异常权限访问检测
- 权限分配合理性评估

### 安全告警
- 权限提升异常
- 批量操作异常
- 敏感数据访问异常
- 登录异常检测

---

*此权限设计确保系统安全性和可管理性，为不同角色用户提供合适的功能访问权限。*
