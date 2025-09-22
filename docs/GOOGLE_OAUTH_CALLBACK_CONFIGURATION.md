# Google OAuth 回调URL配置指南

## 🎯 新的回调URL架构

我们现在实现了**分离式回调URL**架构，为不同用户类型提供专用的回调处理：

### 📋 需要在Google Console中配置的回调URL

请在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 中为OAuth 2.0客户端ID添加以下**所有**回调URL：

#### 🌐 生产环境回调URL（必须全部添加）

```
https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback
https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/questionnaire
https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/management
```

#### 🔄 预览环境回调URL（当前部署）

```
https://c5174850.college-employment-survey-frontend-l84.pages.dev/auth/google/callback
https://c5174850.college-employment-survey-frontend-l84.pages.dev/auth/google/callback/questionnaire
https://c5174850.college-employment-survey-frontend-l84.pages.dev/auth/google/callback/management
```

## 🏗️ 架构说明

### 1. **问卷用户回调** (`/auth/google/callback/questionnaire`)
- **用途**：处理普通用户的Google一键注册
- **功能**：创建半匿名身份，生成A+B组合
- **跳转**：登录成功后跳转到首页 (`/`)
- **组件**：`GoogleQuestionnaireCallbackPage.tsx`

### 2. **管理员回调** (`/auth/google/callback/management`)
- **用途**：处理管理员的Google白名单登录
- **功能**：验证邮箱白名单，分配管理权限
- **跳转**：根据角色跳转到对应管理页面
- **组件**：`GoogleManagementCallbackPage.tsx`

### 3. **通用回调** (`/auth/google/callback`)
- **用途**：兼容性回调，处理旧版本或未指定类型的请求
- **功能**：根据sessionStorage中的用户类型进行分发
- **组件**：`GoogleCallbackPage.tsx`

## 🔧 技术实现

### 动态回调URL生成
```typescript
// 根据用户类型获取不同的回调URL
const getRedirectUri = (userType: 'questionnaire' | 'management') => {
  const baseUrl = window.location.origin;
  switch (userType) {
    case 'questionnaire':
      return `${baseUrl}/auth/google/callback/questionnaire`;
    case 'management':
      return `${baseUrl}/auth/google/callback/management`;
    default:
      return `${baseUrl}/auth/google/callback`;
  }
};
```

### Google OAuth服务更新
```typescript
// 支持用户类型参数的登录方法
async signIn(userType: 'questionnaire' | 'management' = 'questionnaire'): Promise<GoogleUser> {
  const redirectUri = getRedirectUri(userType);
  const authUrl = this.generateAuthUrl(state, redirectUri);
  // ...
}
```

## 🎯 用户体验优化

### 1. **问卷用户登录流程**
1. 用户点击"Google 一键注册"
2. 重定向到Google OAuth（使用问卷专用回调URL）
3. 用户授权后回调到 `/auth/google/callback/questionnaire`
4. 系统创建半匿名身份
5. 自动跳转到首页，用户可以开始填写问卷

### 2. **管理员登录流程**
1. 管理员点击"Google 管理员登录"
2. 重定向到Google OAuth（使用管理专用回调URL）
3. 管理员授权后回调到 `/auth/google/callback/management`
4. 系统验证邮箱白名单
5. 根据角色跳转到对应管理后台

## 🔒 安全特性

### 白名单验证
管理员回调会验证以下邮箱：
- `chrismarker89@gmail.com` (超级管理员)
- `justpm2099@gmail.com` (管理员)
- `AIbook2099@gmail.com` (审核员)

### State参数验证
所有回调都会验证OAuth state参数，防止CSRF攻击。

### 用户类型隔离
不同用户类型使用完全独立的回调处理逻辑，避免权限混淆。

## 📱 测试链接

### 当前可测试的URL
- **主域名**: https://college-employment-survey-frontend-l84.pages.dev
- **当前部署**: https://c5174850.college-employment-survey-frontend-l84.pages.dev

### 测试步骤
1. **问卷用户测试**：
   - 访问主页 → 点击"半匿名登录" → 点击"Google 一键注册"
   - 或访问 `/admin/login` → 点击"Google 管理员登录"

2. **管理员测试**：
   - 访问 `/admin/login` → 点击"Google 管理员登录"
   - 使用白名单邮箱登录

## ⚠️ 重要提醒

### Google Console配置要求
1. **必须添加所有回调URL**：主域名和当前预览域名的所有三个回调路径
2. **JavaScript Origins**：确保添加了对应的域名
3. **OAuth同意屏幕**：确保配置了正确的应用信息

### 部署注意事项
- 每次Cloudflare Pages部署都会生成新的预览URL
- 需要在Google Console中添加新的预览URL回调地址
- 建议使用主域名进行生产环境测试

---

**配置完成后，所有Google OAuth登录功能都应该正常工作！** 🎉
