# Google Console OAuth 配置

## 需要在Google Console中配置的回调URL

### 主域名回调URL
- `https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/questionnaire`
- `https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/management`
- `https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback`

### 预览域名回调URL（用于测试）
- `https://110cad7e.college-employment-survey-frontend-l84.pages.dev/auth/google/callback/questionnaire`
- `https://110cad7e.college-employment-survey-frontend-l84.pages.dev/auth/google/callback/management`
- `https://110cad7e.college-employment-survey-frontend-l84.pages.dev/auth/google/callback`

### 本地开发回调URL
- `http://localhost:5173/auth/google/callback/questionnaire`
- `http://localhost:5173/auth/google/callback/management`
- `http://localhost:5173/auth/google/callback`

## 当前问题分析

错误信息：`redirect_uri_mismatch`

这意味着我们发送给Google的回调URL与Google Console中配置的不匹配。

## 解决方案

1. 确保在Google Console的OAuth 2.0客户端ID配置中添加上述所有回调URL
2. 特别注意主域名和预览域名的区别
3. 确保代码中使用的是正确的固定域名

## 测试步骤

1. 访问调试页面：`/debug/oauth-url`
2. 生成OAuth URL并检查回调地址
3. 确保生成的回调地址在Google Console中已配置
4. 测试登录流程
