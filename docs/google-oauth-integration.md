# 🔐 Google OAuth 统一集成方案

## 📊 **现有Google OAuth架构分析**

### **双域Google OAuth实现**

```mermaid
graph TB
    subgraph "前端 Frontend"
        GOB[GoogleLoginButton<br/>组件]
        GOS[GoogleOAuthService<br/>服务]
    end
    
    subgraph "后端 Backend"
        subgraph "问卷域 OAuth"
            QGA[/api/auth/google/questionnaire]
            QGC[/api/auth/google/callback?userType=questionnaire]
        end
        
        subgraph "管理域 OAuth"
            MGA[/api/auth/google/management]
            MGC[/api/auth/google/callback?userType=management]
            GWL[Google白名单验证]
        end
    end
    
    subgraph "数据库"
        UU[universal_users表]
        GW[google_oauth_whitelist表]
    end
    
    GOB --> GOS
    GOS -->|问卷用户| QGA
    GOS -->|管理员| MGA
    
    QGA --> UU
    MGA --> GWL
    GWL --> GW
    MGA --> UU
```

### **现有实现特点**

1. **问卷域Google OAuth**:
   - 任何Google账号都可以注册
   - 自动创建`semi_anonymous`用户
   - 存储在`universal_users`表
   - 生成显示名称和匿名身份

2. **管理域Google OAuth**:
   - 需要邮箱在白名单中
   - 白名单存储在`google_oauth_whitelist`表
   - 根据白名单角色创建管理员用户
   - 支持`admin`, `reviewer`, `super_admin`角色

## 🎯 **统一权限系统集成**

### **集成策略**

#### **1. 保持现有API不变**
```typescript
// 现有API继续工作
POST /api/auth/google/questionnaire  // 问卷用户Google登录
POST /api/auth/google/management     // 管理员Google登录
POST /api/auth/google/callback       // OAuth回调处理
```

#### **2. 统一前端调用**
```typescript
// 统一的Google OAuth登录
const { loginWithGoogle } = useUnifiedAuthStore();

// 问卷用户Google登录
await loginWithGoogle(googleUser, UserDomain.QUESTIONNAIRE, UnifiedUserType.SEMI_ANONYMOUS);

// 管理员Google登录
await loginWithGoogle(googleUser, UserDomain.MANAGEMENT);
```

#### **3. 统一Token格式**
```typescript
// Google OAuth Token格式
google_token_{timestamp}

// 在统一中间件中处理
if (token.startsWith('google_token_')) {
  await handleGoogleToken(token, env, c);
}
```

## 🔧 **具体实现方案**

### **前端集成**

#### **1. 更新GoogleLoginButton组件**
```typescript
// 使用统一认证Store
import { useUnifiedAuthStore } from '../../stores/unifiedAuthStore';

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ userType, onSuccess }) => {
  const { loginWithGoogle } = useUnifiedAuthStore();
  
  const handleGoogleLogin = async () => {
    // 执行Google OAuth
    const googleUser = await googleOAuthService.signIn(userType);
    
    // 使用统一登录
    const domain = userType === 'management' ? UserDomain.MANAGEMENT : UserDomain.QUESTIONNAIRE;
    const success = await loginWithGoogle(googleUser, domain);
    
    if (success) {
      onSuccess?.();
    }
  };
};
```

#### **2. 统一认证服务集成**
```typescript
// 在UnifiedAuthService中
private async loginWithGoogle(credentials: UnifiedCredentials): Promise<UnifiedAuthResult> {
  const { googleUser, domain } = credentials;
  
  if (domain === UserDomain.MANAGEMENT) {
    return await this.loginGoogleManagement(googleUser);
  } else {
    return await this.loginGoogleQuestionnaire(googleUser);
  }
}

private async loginGoogleManagement(googleUser: any): Promise<UnifiedAuthResult> {
  // 调用现有管理员Google OAuth API
  const response = await fetch('/api/auth/google/management', {
    method: 'POST',
    body: JSON.stringify({ googleUser })
  });
  
  // 转换为统一格式
  const result = await response.json();
  const user = await this.convertToUnifiedUser(result.data, UserDomain.MANAGEMENT);
  // ...
}
```

### **后端集成**

#### **1. 统一中间件支持**
```typescript
// 在unifiedAuth.ts中添加Google Token处理
async function handleGoogleToken(token: string, env: Env, c: Context): Promise<AuthResult> {
  // 从数据库查找Google OAuth用户
  const user = await db.queryFirst(`
    SELECT * FROM universal_users 
    WHERE JSON_EXTRACT(metadata, '$.registrationMethod') LIKE '%google%'
    AND status = 'active'
  `);
  
  // 映射到统一用户类型和权限
  const userType = mapToUnifiedUserType(user.user_type);
  const domain = getDomainFromUserType(userType);
  
  c.set('user', user);
  c.set('userType', userType);
  c.set('domain', domain);
  c.set('permissions', getPermissionsByType(userType));
}
```

#### **2. 现有API保持不变**
```typescript
// google-auth.ts 保持现有实现
googleAuth.post('/questionnaire', async (c) => {
  // 现有问卷用户Google登录逻辑
  // 返回格式保持不变
});

googleAuth.post('/management', async (c) => {
  // 现有管理员Google登录逻辑
  // 白名单验证逻辑保持不变
});
```

## 📋 **迁移步骤**

### **阶段1: 前端统一** (10分钟)
1. 更新`GoogleLoginButton`使用统一Store
2. 在`UnifiedAuthService`中添加Google OAuth支持
3. 测试问卷用户和管理员Google登录

### **阶段2: 后端集成** (15分钟)
1. 在统一中间件中添加Google Token处理
2. 更新管理员和审核员路由使用统一中间件
3. 测试API认证

### **阶段3: 完整验证** (5分钟)
1. 测试问卷用户Google登录流程
2. 测试管理员Google登录和白名单验证
3. 验证权限边界正确工作

## 🎯 **权限边界保证**

### **问卷域Google用户**
```typescript
// 自动创建为semi_anonymous用户
userType: UnifiedUserType.SEMI_ANONYMOUS
domain: UserDomain.QUESTIONNAIRE
permissions: ['VIEW_CONTENT', 'SUBMIT_QUESTIONNAIRE', 'CREATE_CONTENT']

// 只能访问问卷相关页面
allowedRoutes: ['/', '/analytics', '/stories', '/voices', '/submit']
```

### **管理域Google用户**
```typescript
// 根据白名单角色创建
userType: UnifiedUserType.ADMIN | UnifiedUserType.REVIEWER | UnifiedUserType.SUPER_ADMIN
domain: UserDomain.MANAGEMENT
permissions: getManagementPermissions(userType)

// 可以访问管理页面 + 问卷页面
allowedRoutes: ['/admin/*', '/reviewer/*', '/', '/analytics', ...]
```

## 🔒 **安全考虑**

### **白名单验证**
- 管理员Google登录必须通过白名单验证
- 白名单由超级管理员维护
- 支持角色分配（admin, reviewer, super_admin）

### **Token安全**
- Google OAuth Token有时效性
- 统一中间件验证Token有效性
- 支持Token刷新机制

### **权限隔离**
- 问卷域用户无法访问管理功能
- 管理域用户权限严格按角色分配
- 跨域访问被统一中间件拦截

## ✅ **验证清单**

### **功能验证**
- [ ] 问卷用户可以通过Google登录
- [ ] 管理员可以通过Google白名单登录
- [ ] Google用户权限正确映射
- [ ] Token认证正常工作

### **权限验证**
- [ ] 问卷Google用户无法访问管理页面
- [ ] 管理Google用户可以访问对应权限页面
- [ ] 白名单验证正确工作
- [ ] 角色权限正确分配

### **兼容性验证**
- [ ] 现有Google OAuth流程不受影响
- [ ] 白名单管理功能正常
- [ ] 数据库结构无需变更
- [ ] API接口向后兼容

---

**结论**: 现有的Google OAuth实现已经很完善，统一权限系统只需要在前端和中间件层面进行集成，无需修改核心OAuth逻辑，保证了系统的稳定性和向后兼容性。
