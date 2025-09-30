# 🔐 Google OAuth 重定向 URI 配置指南

**更新时间**: 2025年9月30日  
**Client ID**: `23546164414-3t3g8n9hvnv4ekjok90co2sm3sfb6mt8.apps.googleusercontent.com`

---

## 📋 需要配置的所有重定向 URI

### 1. 审核员/管理员仪表板（reviewer-admin-dashboard）

#### 主域名（生产环境）
```
https://reviewer-admin-dashboard.pages.dev/auth/google/callback
```

#### 当前预览部署
```
https://b5ed477a.reviewer-admin-dashboard.pages.dev/auth/google/callback
```

#### 历史预览部署（可选，用于回滚）
```
https://d6623aa7.reviewer-admin-dashboard.pages.dev/auth/google/callback
https://a151e2c8.reviewer-admin-dashboard.pages.dev/auth/google/callback
https://eaf08921.reviewer-admin-dashboard.pages.dev/auth/google/callback
https://3907bf3e.reviewer-admin-dashboard.pages.dev/auth/google/callback
https://6d83bdfb.reviewer-admin-dashboard.pages.dev/auth/google/callback
https://8b7c3c10.reviewer-admin-dashboard.pages.dev/auth/google/callback
```

---

### 2. 问卷前端（college-employment-survey-frontend）

#### 主域名（生产环境）
```
https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback
https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/questionnaire
https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/management
```

#### 预览部署（可选）
```
https://110cad7e.college-employment-survey-frontend-l84.pages.dev/auth/google/callback
https://110cad7e.college-employment-survey-frontend-l84.pages.dev/auth/google/callback/questionnaire
https://110cad7e.college-employment-survey-frontend-l84.pages.dev/auth/google/callback/management
```

---

### 3. 本地开发环境

```
http://localhost:3000/auth/google/callback
http://localhost:5173/auth/google/callback
http://localhost:5174/auth/google/callback
```

---

## 🔧 配置步骤

### 步骤 1: 访问 Google Cloud Console

1. 打开浏览器，访问：https://console.cloud.google.com/apis/credentials
2. 确保选择了正确的项目

### 步骤 2: 找到 OAuth 2.0 客户端 ID

1. 在"凭据"页面，找到 OAuth 2.0 客户端 ID 部分
2. 找到 Client ID: `23546164414-3t3g8n9hvnv4ekjok90co2sm3sfb6mt8.apps.googleusercontent.com`
3. 点击客户端 ID 旁边的**编辑图标**（铅笔图标）

### 步骤 3: 添加重定向 URI

1. 在"已获授权的重定向 URI"部分
2. 点击"**添加 URI**"按钮
3. 逐个复制粘贴上述 URI
4. 确保每个 URI 都准确无误（包括 `https://` 或 `http://`）

### 步骤 4: 保存配置

1. 检查所有 URI 是否正确
2. 点击页面底部的"**保存**"按钮
3. 等待配置生效（通常立即生效，但可能需要几分钟）

---

## ✅ 验证配置

### 测试审核员/管理员仪表板

1. 访问：https://b5ed477a.reviewer-admin-dashboard.pages.dev/unified-login
2. 选择"超级管理员"标签
3. 点击"🔧 使用 Google 一键登录"按钮
4. 应该能够成功跳转到 Google 登录页面
5. 登录后应该能够成功回调

### 测试问卷前端

1. 访问：https://college-employment-survey-frontend-l84.pages.dev
2. 点击"使用 Google 登录"按钮
3. 应该能够成功跳转到 Google 登录页面
4. 登录后应该能够成功回调

---

## 🚨 常见错误

### 错误 1: `redirect_uri_mismatch`

**原因**: 回调 URI 不在 Google Console 的白名单中

**解决方案**:
1. 检查浏览器地址栏中的错误 URL
2. 复制错误信息中的 `redirect_uri` 参数
3. 在 Google Console 中添加该 URI
4. 保存并重试

**示例错误信息**:
```
redirect_uri: https://reviewer-admin-dashboard.pages.dev/auth/google/callback
```

### 错误 2: 配置未生效

**原因**: Google 配置可能需要几分钟才能生效

**解决方案**:
1. 等待 2-5 分钟
2. 清除浏览器缓存
3. 使用无痕模式重试

### 错误 3: 多个项目混淆

**原因**: 有两个前端项目使用同一个 Google OAuth Client ID

**解决方案**:
- ✅ 这是正常的，两个项目可以共享同一个 Client ID
- ✅ 只需要确保所有项目的回调 URI 都在白名单中

---

## 📊 项目对比

### 项目 1: 问卷前端（college-employment-survey-frontend）

- **用途**: 学生填写就业问卷
- **Google OAuth 用途**: 
  - 问卷用户一键登录（自动创建匿名身份）
  - 管理员白名单登录
- **回调 URL 模式**: 
  - `/auth/google/callback/questionnaire` - 问卷用户
  - `/auth/google/callback/management` - 管理员

### 项目 2: 审核员/管理员仪表板（reviewer-admin-dashboard）

- **用途**: 审核员、管理员、超级管理员的工作台
- **Google OAuth 用途**: 
  - 审核员白名单登录
  - 管理员白名单登录
  - 超级管理员白名单登录
- **回调 URL 模式**: 
  - `/auth/google/callback` - 所有角色共用

---

## 🔗 相关文档

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [重定向 URI 验证规则](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 📝 配置清单

使用此清单确保所有 URI 都已添加：

### 必须添加（生产环境）

- [ ] `https://reviewer-admin-dashboard.pages.dev/auth/google/callback`
- [ ] `https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback`
- [ ] `https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/questionnaire`
- [ ] `https://college-employment-survey-frontend-l84.pages.dev/auth/google/callback/management`

### 推荐添加（当前预览部署）

- [ ] `https://b5ed477a.reviewer-admin-dashboard.pages.dev/auth/google/callback`

### 可选添加（本地开发）

- [ ] `http://localhost:3000/auth/google/callback`
- [ ] `http://localhost:5173/auth/google/callback`
- [ ] `http://localhost:5174/auth/google/callback`

---

## 🎯 配置完成后的测试

### 1. 测试超级管理员登录

```bash
# 访问统一登录页面
https://b5ed477a.reviewer-admin-dashboard.pages.dev/unified-login

# 操作步骤:
1. 选择"超级管理员"标签
2. 点击"🔧 使用 Google 一键登录"
3. 选择 Google 账号
4. 应该成功回调并登录
```

### 2. 测试管理员登录

```bash
# 访问统一登录页面
https://b5ed477a.reviewer-admin-dashboard.pages.dev/unified-login

# 操作步骤:
1. 选择"管理员"标签
2. 点击"🔧 使用 Google 一键登录"
3. 选择 Google 账号
4. 应该成功回调并登录
```

### 3. 测试审核员登录

```bash
# 访问统一登录页面
https://b5ed477a.reviewer-admin-dashboard.pages.dev/unified-login

# 操作步骤:
1. 选择"审核员"标签
2. 点击"🔧 使用 Google 一键登录"
3. 选择 Google 账号
4. 应该成功回调并登录
```

---

## 🔐 安全注意事项

### 1. 白名单验证

- ✅ 所有管理员登录都需要邮箱在白名单中
- ✅ 超级管理员可以管理白名单
- ✅ 问卷用户不需要白名单（自动创建匿名身份）

### 2. 回调 URL 安全

- ✅ 只添加你控制的域名
- ✅ 使用 HTTPS（生产环境）
- ✅ 定期清理不再使用的预览部署 URL

### 3. Client Secret 保护

- ✅ Client Secret 存储在后端环境变量中
- ✅ 前端只使用 Client ID（公开的）
- ✅ 不要在前端代码中硬编码 Client Secret

---

## 📞 支持

如果配置后仍然遇到问题：

1. 检查浏览器控制台的错误信息
2. 检查 Google OAuth 错误页面的详细信息
3. 确认 Client ID 和 Client Secret 正确
4. 确认后端 API 正常运行

---

**配置完成时间**: _____________  
**配置人**: _____________  
**验证状态**: [ ] 通过 [ ] 失败


