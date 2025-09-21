# Google OAuth 配置指南

本文档介绍如何配置Google OAuth登录功能，包括问卷用户的便捷注册和管理员的白名单登录。

## 📋 前置要求

1. Google Cloud Platform账号
2. 项目已部署到可访问的域名
3. 超级管理员权限

## 🔧 Google Cloud Platform配置

### 1. 创建Google Cloud项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 记录项目ID

### 2. 启用Google+ API

1. 在Google Cloud Console中，导航到"API和服务" > "库"
2. 搜索"Google+ API"
3. 点击启用

### 3. 创建OAuth 2.0凭据

1. 导航到"API和服务" > "凭据"
2. 点击"创建凭据" > "OAuth 2.0客户端ID"
3. 选择应用类型："Web应用"
4. 配置授权重定向URI：
   - 开发环境: `http://localhost:5174/auth/google/callback`
   - 生产环境: `https://yourdomain.com/auth/google/callback`
5. 记录客户端ID和客户端密钥

## ⚙️ 项目配置

### 1. 前端环境变量

创建或更新 `frontend/.env` 文件：

```env
# Google OAuth配置
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5174/auth/google/callback

# 生产环境
# VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

### 2. 后端环境变量

更新Cloudflare Workers的环境变量：

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. 数据库迁移

运行数据库迁移创建白名单表：

```sql
-- 这个迁移会自动执行
-- backend/migrations/011_create_google_oauth_whitelist_table.sql
```

## 👥 白名单管理

### 1. 访问白名单管理

1. 使用超级管理员账号登录
2. 访问 `/admin/google-whitelist`
3. 或通过管理后台导航菜单

### 2. 添加管理员邮箱

1. 点击"添加邮箱"按钮
2. 输入Google邮箱地址
3. 选择角色（审核员/管理员/超级管理员）
4. 可选：设置显示名称
5. 点击"添加"

### 3. 管理现有条目

- **编辑**：修改角色或显示名称
- **禁用**：暂时禁用某个邮箱
- **删除**：永久移除白名单条目

## 🔐 安全配置

### 1. 域名验证

确保在Google Cloud Console中配置了正确的授权域名：

1. 在OAuth同意屏幕中添加授权域名
2. 确保重定向URI与实际部署域名匹配

### 2. 权限范围

项目使用的OAuth权限范围：
- `openid` - 基本身份验证
- `email` - 邮箱地址
- `profile` - 基本资料信息

### 3. 安全建议

- 定期审查白名单条目
- 监控登录日志
- 使用HTTPS部署
- 定期轮换客户端密钥

## 🧪 测试配置

### 1. 测试Google登录

1. 访问 `/test/login-separation`
2. 点击"Google 一键注册"按钮
3. 验证登录流程

### 2. 测试管理员登录

1. 确保邮箱在白名单中
2. 访问 `/management-portal`
3. 点击"Google 管理员登录"
4. 验证权限分配

## 🐛 故障排除

### 常见问题

1. **"Google登录未配置"**
   - 检查环境变量是否正确设置
   - 确认客户端ID格式正确

2. **"您的邮箱不在管理员白名单中"**
   - 检查邮箱是否已添加到白名单
   - 确认邮箱状态为"启用"

3. **重定向URI不匹配**
   - 检查Google Cloud Console中的重定向URI配置
   - 确保与环境变量中的URI一致

4. **OAuth同意屏幕错误**
   - 确保应用已通过Google审核（如需要）
   - 检查授权域名配置

### 调试步骤

1. 检查浏览器控制台错误
2. 查看网络请求响应
3. 验证环境变量加载
4. 检查后端API日志

## 📚 相关文档

- [Google OAuth 2.0文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [项目登录分离测试页面](/test/login-separation)

## 🔄 更新记录

- **2025-08-13**: 初始版本，包含基础配置指南
- **Phase 1**: 登录入口分离完成
- **Phase 2**: Google OAuth集成和白名单管理完成

---

如有问题，请查看测试页面或联系技术支持。
