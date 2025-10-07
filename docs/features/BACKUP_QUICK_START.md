# 数据备份系统 - 快速开始

## 🚀 5分钟快速部署

### 步骤1: 执行数据库迁移

```bash
cd backend

# 创建备份元数据表
wrangler d1 execute college-employment-survey \
  --file=migrations/028_create_database_backups_table.sql \
  --remote

# 验证表已创建
wrangler d1 execute college-employment-survey \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name='database_backups';" \
  --remote
```

### 步骤2: 部署后端

```bash
# 确保在backend目录
cd backend

# 部署到Cloudflare Workers
npm run deploy

# 验证部署成功
curl https://employment-survey-api-prod.chrismarker89.workers.dev/api/super-admin/backup/list \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

### 步骤3: 部署前端

```bash
# 切换到前端目录
cd ../reviewer-admin-dashboard

# 构建
npm run build

# 部署到Cloudflare Pages
npm run deploy
```

### 步骤4: 测试功能

1. **访问备份管理页面**
   - URL: https://reviewer-admin-dashboard.pages.dev/admin/backup-management
   - 使用超级管理员账号登录

2. **创建第一个备份**
   - 点击"创建备份"按钮
   - 等待10-30秒
   - 查看备份列表确认成功

3. **验证定时任务**
   ```bash
   # 查看定时任务日志
   wrangler tail employment-survey-api-prod --format=pretty
   
   # 等待凌晨2点自动备份执行
   # 或手动触发测试
   ```

---

## 📋 常用操作

### 手动创建备份

**方法1: 通过界面**
1. 登录超级管理员账号
2. 导航到：超级管理功能 → 数据备份
3. 点击"创建备份"按钮

**方法2: 通过API**
```bash
curl -X POST \
  https://employment-survey-api-prod.chrismarker89.workers.dev/api/super-admin/backup/create \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 查看备份列表

**方法1: 通过界面**
- 访问备份管理页面，自动显示所有备份

**方法2: 通过API**
```bash
curl -X GET \
  https://employment-survey-api-prod.chrismarker89.workers.dev/api/super-admin/backup/list \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

### 恢复数据库

**⚠️ 警告：此操作会覆盖当前所有数据！**

**方法1: 通过界面**
1. 在备份列表中找到目标备份
2. 点击"恢复"按钮
3. 阅读警告提示
4. 确认执行

**方法2: 通过API**
```bash
curl -X POST \
  https://employment-survey-api-prod.chrismarker89.workers.dev/api/super-admin/backup/restore \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backupId": "backup_1696723200000"}'
```

### 清理旧备份

**方法1: 通过界面**
1. 点击"清理旧备份"按钮
2. 确认删除7天前的备份

**方法2: 通过API**
```bash
curl -X POST \
  https://employment-survey-api-prod.chrismarker89.workers.dev/api/super-admin/backup/cleanup \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔍 故障排查

### 问题1: 备份创建失败

**检查步骤**:
```bash
# 1. 查看Worker日志
wrangler tail employment-survey-api-prod

# 2. 检查R2存储空间
wrangler r2 bucket list

# 3. 验证数据库连接
wrangler d1 execute college-employment-survey \
  --command="SELECT COUNT(*) FROM users;" \
  --remote

# 4. 检查表是否存在
wrangler d1 execute college-employment-survey \
  --command="SELECT name FROM sqlite_master WHERE type='table';" \
  --remote
```

### 问题2: 恢复失败

**检查步骤**:
```bash
# 1. 验证备份文件存在
# 通过界面查看备份列表

# 2. 检查备份状态
# 确保status为'completed'

# 3. 查看错误日志
wrangler tail employment-survey-api-prod --format=pretty
```

### 问题3: 定时任务未执行

**检查步骤**:
```bash
# 1. 查看定时任务配置
cat backend/wrangler.toml | grep -A 5 "triggers"

# 2. 查看部署状态
wrangler deployments list

# 3. 手动触发测试
# 通过界面手动创建备份
```

---

## 📊 监控指标

### 关键指标查看

```bash
# 1. 查看备份数量
wrangler d1 execute college-employment-survey \
  --command="SELECT COUNT(*) as total, status FROM database_backups GROUP BY status;" \
  --remote

# 2. 查看备份大小
wrangler d1 execute college-employment-survey \
  --command="SELECT date, size/1024/1024 as size_mb FROM database_backups ORDER BY date DESC LIMIT 7;" \
  --remote

# 3. 查看最近备份
wrangler d1 execute college-employment-survey \
  --command="SELECT backup_id, date, status FROM database_backups ORDER BY timestamp DESC LIMIT 5;" \
  --remote
```

---

## 🎯 最佳实践

### 1. 备份策略

- ✅ 依赖自动备份（每天凌晨2点）
- ✅ 重大操作前手动备份
- ✅ 定期验证备份完整性
- ✅ 保持7天滚动备份

### 2. 恢复策略

- ⚠️ 恢复前先创建当前备份
- ⚠️ 在维护窗口执行恢复
- ⚠️ 恢复后立即验证数据
- ⚠️ 通知所有用户停机时间

### 3. 安全建议

- 🔒 仅超级管理员可访问
- 🔒 恢复操作需二次确认
- 🔒 记录所有备份/恢复操作
- 🔒 定期审计备份日志

---

## 📞 支持

### 文档

- 完整文档: `docs/features/DATABASE_BACKUP_SYSTEM.md`
- API文档: `docs/technical-archive/api/endpoints/super-admin.md`

### 日志查看

```bash
# 实时日志
wrangler tail employment-survey-api-prod --format=pretty

# 过滤备份相关日志
wrangler tail employment-survey-api-prod | grep -i backup
```

### 紧急联系

如遇紧急问题，请：
1. 立即停止所有备份/恢复操作
2. 查看Worker日志定位问题
3. 联系系统管理员
4. 保留错误日志和截图

---

## ✅ 验证清单

部署完成后，请验证以下项目：

- [ ] 数据库表 `database_backups` 已创建
- [ ] 后端API `/api/super-admin/backup/*` 可访问
- [ ] 前端页面 `/admin/backup-management` 可访问
- [ ] 菜单中显示"数据备份"选项
- [ ] 可以成功创建手动备份
- [ ] 备份列表正常显示
- [ ] 定时任务配置正确（每天凌晨2点）
- [ ] R2存储中可以看到备份文件

---

## 🎉 完成！

恭喜！数据备份与恢复系统已成功部署。

**下一步建议**:
1. 创建第一个测试备份
2. 验证备份文件在R2中
3. 等待自动备份执行
4. 定期检查备份状态

