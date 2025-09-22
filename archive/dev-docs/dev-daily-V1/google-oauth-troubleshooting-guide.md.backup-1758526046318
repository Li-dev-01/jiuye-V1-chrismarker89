# Google OAuth故障排除技术手册

**创建日期**: 2025-08-13  
**适用版本**: v2.0.1  
**维护状态**: 活跃维护  

## 🎯 使用说明

本手册专门用于Google OAuth功能的故障排除和技术支持，提供详细的诊断步骤和解决方案。

## 🔍 常见问题诊断

### 问题1: Google OAuth初始化失败

#### 症状
```
错误信息: "Google OAuth初始化失败"
控制台错误: Failed to load resource: the server responded with a status of 400
CSP警告: Refused to load script from 'https://www.gstatic.com/...'
```

#### 诊断步骤
```bash
# 1. 检查前端环境变量
echo "VITE_GOOGLE_CLIENT_ID: $VITE_GOOGLE_CLIENT_ID"

# 2. 验证CSP配置
curl -I https://college-employment-survey-frontend.pages.dev/auth/login

# 3. 检查Google API脚本加载
# 在浏览器开发者工具中检查Network标签
```

#### 解决方案A: CSP策略调整
```bash
# 编辑 frontend/public/_headers
# 临时使用更宽松的CSP策略进行测试
Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' *;
```

#### 解决方案B: 重新部署配置
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=college-employment-survey-frontend
```

### 问题2: 后端Google OAuth API错误

#### 症状
```
API响应: 500 Internal Server Error
后端日志: Google Client Secret not found
```

#### 诊断步骤
```bash
# 1. 检查后端环境变量
npx wrangler secret list

# 2. 验证wrangler.toml配置
cat backend/wrangler.toml | grep GOOGLE

# 3. 测试API端点
curl -X POST https://employment-survey-api-prod.justpm2099.workers.dev/api/auth/google/questionnaire \
  -H "Content-Type: application/json" \
  -d '{"googleUser":{"email":"test@example.com","name":"Test User","id":"123"}}'
```

#### 解决方案
```bash
# 重新设置环境变量并部署
cd backend
npx wrangler deploy
```

### 问题3: Google Cloud Console配置错误

#### 症状
```
错误: "redirect_uri_mismatch"
错误: "unauthorized_client"
```

#### 检查清单
- [ ] Client ID是否正确配置
- [ ] 授权域名是否匹配
- [ ] 重定向URI是否完全一致
- [ ] OAuth同意屏幕是否已配置

#### 正确配置示例
```
Client ID: 947246726899-e2nuehhp0ngdcecaj67i1dbrevdu308o.apps.googleusercontent.com
JavaScript Origins: https://college-employment-survey-frontend.pages.dev
Redirect URIs: https://college-employment-survey-frontend.pages.dev/auth/google/callback
```

## 🛠️ 调试工具和命令

### 前端调试
```javascript
// 在浏览器控制台中运行
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('Redirect URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);

// 检查Google API加载状态
console.log('Google API loaded:', typeof window.gapi !== 'undefined');
```

### 后端调试
```bash
# 查看Worker日志
npx wrangler tail

# 测试环境变量
npx wrangler dev --local
```

### 网络调试
```bash
# 检查DNS解析
nslookup college-employment-survey-frontend.pages.dev

# 测试HTTPS连接
curl -v https://college-employment-survey-frontend.pages.dev

# 检查CSP头部
curl -I https://college-employment-survey-frontend.pages.dev/auth/login
```

## 🔧 配置文件模板

### CSP配置模板 (`frontend/public/_headers`)
```
/*
  # 生产环境CSP（严格）
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://ssl.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://employment-survey-api-prod.justpm2099.workers.dev https://accounts.google.com https://www.googleapis.com; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'
  
  # 调试环境CSP（宽松）
  # Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *;
  
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 环境变量模板
```env
# .env.development
VITE_GOOGLE_CLIENT_ID=947246726899-e2nuehhp0ngdcecaj67i1dbrevdu308o.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://college-employment-survey-frontend.pages.dev/auth/google/callback

# .env.production
VITE_GOOGLE_CLIENT_ID=947246726899-e2nuehhp0ngdcecaj67i1dbrevdu308o.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://college-employment-survey-frontend.pages.dev/auth/google/callback
```

## 📊 监控和日志

### 前端错误监控
```javascript
// 添加到 main.tsx 或 App.tsx
window.addEventListener('error', (event) => {
  if (event.message.includes('google') || event.message.includes('gapi')) {
    console.error('Google OAuth Error:', event);
    // 发送到错误监控服务
  }
});
```

### 后端日志监控
```typescript
// 在 google-auth.ts 中添加详细日志
console.log('Google OAuth request:', {
  clientId: GOOGLE_CLIENT_ID,
  hasClientSecret: !!env.GOOGLE_CLIENT_SECRET,
  timestamp: new Date().toISOString()
});
```

## 🚨 应急处理方案

### 方案1: 临时禁用Google OAuth
```typescript
// 在 GoogleLoginButton.tsx 中
const isGoogleOAuthEnabled = false; // 临时禁用

if (!isGoogleOAuthEnabled) {
  return null; // 不显示Google登录按钮
}
```

### 方案2: 降级到A+B登录
```typescript
// 在登录页面添加提示
{!isGoogleOAuthAvailable && (
  <Alert 
    message="Google登录暂时不可用，请使用A+B登录方式" 
    type="info" 
  />
)}
```

### 方案3: 快速回滚
```bash
# 回滚到上一个稳定版本
git log --oneline -10
git checkout <previous-stable-commit>

# 重新部署
npm run build
npx wrangler pages deploy dist --project-name=college-employment-survey-frontend
```

## 📋 测试检查清单

### 功能测试
- [ ] A+B登录功能正常
- [ ] Google OAuth按钮显示
- [ ] Google API脚本加载成功
- [ ] CSP策略不阻止必要资源
- [ ] 错误处理正常显示

### 兼容性测试
- [ ] Chrome浏览器
- [ ] Firefox浏览器  
- [ ] Safari浏览器
- [ ] 移动端浏览器
- [ ] 不同网络环境

### 安全测试
- [ ] CSP策略有效
- [ ] HTTPS连接正常
- [ ] 敏感信息不泄露
- [ ] 跨域请求安全

## 📞 升级支持

### 联系方式
- **技术文档**: `/dev-daily-v1/` 目录
- **配置文件**: 见相关文件清单
- **日志位置**: Cloudflare Workers日志

### 相关文档
- `2025-08-13-google-oauth-configuration-complete.md` - 主配置文档
- `2025-08-13-phase1-5-security-system-complete.md` - 安全系统文档
- `DOCUMENTATION_INDEX.md` - 完整文档索引

---

**重要提醒**: 
1. 在生产环境中进行任何更改前，请先在开发环境测试
2. 保持CSP策略的安全性，避免过度放宽权限
3. 定期检查Google Cloud Console的配置状态
4. A+B登录系统是主要登录方式，确保其稳定性优先
