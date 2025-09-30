# 🌐 生产环境快速访问指南

**部署地址**: https://5ed7fbf8.reviewer-admin-dashboard.pages.dev  
**API 地址**: https://employment-survey-api-prod.chrismarker89.workers.dev  
**部署时间**: 2025年9月30日

---

## 🔗 快速访问链接

### 登录入口
```
https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login
```

### 旧路由（自动重定向）
- `/login` → `/unified-login`
- `/admin/login` → `/unified-login`
- `/admin/super-login` → `/unified-login`

---

## 👤 测试账号

### 审核员
```
URL: https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login
用户名: reviewerA
密码: admin123
登录后跳转: /dashboard
```

### 管理员
```
URL: https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login
用户名: admin
密码: admin123
登录后跳转: /admin/dashboard
```

### 超级管理员
```
URL: https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login
用户名: test_superadmin
密码: admin123
登录后跳转: /admin/super
```

---

## 📱 功能页面

### 审核员功能
- **仪表板**: `/dashboard`
- **待审核列表**: `/pending-reviews`
- **审核历史**: `/review-history`

### 管理员功能
- **管理员仪表板**: `/admin/dashboard`
- **用户管理**: `/admin/users`
- **内容管理**: `/admin/stories`
- **标签管理**: `/admin/tags`
- **数据分析**: `/admin/analytics`
- **API 管理**: `/admin/api-management`

### 超级管理员功能
- **超级管理员面板**: `/admin/super`
- **账户管理**: `/admin/email-role-accounts`
- **系统设置**: `/admin/settings`
- **安全控制台**: `/admin/security-console`
- **系统日志**: `/admin/system-logs`
- **数据库监控**: `/admin/database-monitor`
- **Cloudflare 监控**: `/admin/cloudflare-monitoring`

---

## 🔧 API 端点

### 健康检查
```bash
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/health
```

### 账户管理
```bash
# 获取所有账户
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts

# 创建账户
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "roles": ["admin"],
    "password": "password123"
  }'
```

### 审核员 API
```bash
# 获取统计数据
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/reviewer/stats

# 获取待审核列表
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/reviewer/pending
```

---

## 🧪 快速测试

### 1. 测试登录
```bash
# 在浏览器中打开
open https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login

# 或使用 curl 测试
curl -I https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login
```

### 2. 测试 API
```bash
# 健康检查
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/health

# 账户数据
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts | jq '.'
```

### 3. 测试路由重定向
```bash
# 测试旧路由是否重定向
curl -I https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/login
curl -I https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/admin/login
curl -I https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/admin/super-login
```

---

## 📊 数据库状态

### 当前账户统计
- **邮箱总数**: 6
- **账户总数**: 8
- **超级管理员**: 4 个
- **管理员**: 2 个
- **审核员**: 2 个

### 账户列表

#### 超级管理员账户
1. **superadmin_chris** (chrismarker89@gmail.com)
2. **superadmin_aibook** (aibook2099@gmail.com)
3. **superadmin_justpm** (justpm2099@gmail.com)
4. **test_superadmin** (test@gmail.com)

#### 管理员账户
1. **test_admin** (test@gmail.com)
2. **admin** (admin@test.com)

#### 审核员账户
1. **test_reviewer** (test@gmail.com)
2. **reviewerA** (reviewer@test.com)

---

## 🎯 常用操作

### 登录流程
1. 访问 https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login
2. 选择角色标签（审核员/管理员/超级管理员）
3. 输入用户名和密码
4. 点击"登录"按钮
5. 自动跳转到对应的仪表板

### 创建新账户
1. 以超级管理员身份登录
2. 访问 `/admin/email-role-accounts`
3. 点击"创建管理员"按钮
4. 填写邮箱、选择角色、设置密码
5. 点击"创建"

### 管理账户
1. 访问账户管理页面
2. 查看所有邮箱和角色账户
3. 可以停用/启用账户
4. 可以删除账户
5. 可以添加新角色

---

## 🔍 故障排查

### 无法访问页面
```bash
# 检查前端是否在线
curl -I https://5ed7fbf8.reviewer-admin-dashboard.pages.dev

# 检查 API 是否在线
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/health
```

### 登录失败
1. 确认用户名和密码正确
2. 检查账户是否被停用
3. 检查网络连接
4. 查看浏览器控制台错误

### API 错误
```bash
# 查看 API 响应
curl -v https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts

# 检查 CORS
curl -I -X OPTIONS https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts \
  -H "Origin: https://5ed7fbf8.reviewer-admin-dashboard.pages.dev"
```

---

## 📈 性能监控

### 页面性能
```bash
# 测试页面加载时间
curl -o /dev/null -s -w 'Total: %{time_total}s\n' https://5ed7fbf8.reviewer-admin-dashboard.pages.dev
```

### API 性能
```bash
# 测试 API 响应时间
curl -o /dev/null -s -w 'Total: %{time_total}s\n' https://employment-survey-api-prod.chrismarker89.workers.dev/api/health
```

---

## 🔐 安全提示

### 生产环境注意事项
1. ✅ 调试功能已隐藏（不显示"自动登录"按钮）
2. ✅ 使用 HTTPS 加密传输
3. ✅ 密码已加密存储
4. ⚠️ 定期更改密码
5. ⚠️ 不要在公共场所登录

### 密码安全
- 使用强密码（至少8位，包含大小写字母、数字、特殊字符）
- 定期更换密码
- 不要与他人分享密码
- 不要在多个系统使用相同密码

---

## 📞 支持

### 文档
- [完整部署报告](./PRODUCTION-DEPLOYMENT-REPORT.md)
- [统一登录迁移报告](./UNIFIED-LOGIN-MIGRATION-REPORT.md)
- [迁移总结](./MIGRATION-SUMMARY.md)
- [快速参考](./QUICK-REFERENCE.md)

### 验证脚本
```bash
# 运行完整验证
./verify-production-deployment.sh
```

---

## 🎉 快速开始

### 最快速的测试方式

1. **打开登录页面**
   ```bash
   open https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/unified-login
   ```

2. **使用测试账号登录**
   - 用户名: `admin`
   - 密码: `admin123`

3. **访问账户管理**
   ```
   https://5ed7fbf8.reviewer-admin-dashboard.pages.dev/admin/email-role-accounts
   ```

4. **查看数据库数据**
   ```bash
   curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts | jq '.'
   ```

---

**最后更新**: 2025年9月30日  
**部署状态**: ✅ 在线运行  
**验证状态**: ✅ 已通过测试

