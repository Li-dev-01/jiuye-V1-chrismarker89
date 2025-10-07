# 数据备份与恢复系统

## 📋 功能概述

完整的数据库备份与恢复机制，支持自动备份、手动备份、数据恢复和7天滚动备份策略。

### 核心功能

1. **自动备份**：每天凌晨2点自动创建数据库完整备份
2. **手动备份**：超级管理员可随时手动创建备份
3. **数据恢复**：从任意备份点恢复数据库
4. **滚动清理**：自动删除7天前的旧备份
5. **R2存储**：所有备份存储在Cloudflare R2

---

## 🏗️ 系统架构

### 后端服务

#### DatabaseBackupService
**文件**: `backend/src/services/databaseBackupService.ts`

**核心方法**:
- `createFullBackup()`: 创建完整数据库备份
- `restoreFromBackup(backupId)`: 从备份恢复数据库
- `listBackups()`: 获取所有备份列表
- `cleanupOldBackups()`: 清理7天前的旧备份

**备份内容**:
```typescript
const TABLES_TO_BACKUP = [
  'users',
  'login_sessions',
  'universal_questionnaire_responses',
  'questionnaire_responses',
  'pending_stories',
  'valid_stories',
  'raw_story_submissions',
  'story_likes',
  'png_cards',
  'audit_records',
  'violation_content',
  'content_reports',
  'user_reputation',
  'user_activity_logs',
  'system_config',
  'admin_operations',
  'questionnaire_v2_statistics',
  'tag_statistics',
  'questionnaire_progress'
];
```

### 数据库表

#### database_backups
**文件**: `backend/migrations/028_create_database_backups_table.sql`

**字段**:
- `id`: 自增主键
- `backup_id`: 备份唯一标识
- `timestamp`: 备份时间戳
- `date`: 备份日期 (YYYY-MM-DD)
- `size`: 备份文件大小（字节）
- `table_count`: 备份的表数量
- `record_count`: 备份的总记录数
- `status`: 备份状态 (completed/failed/in_progress)
- `error`: 错误信息
- `r2_key`: R2存储的key
- `created_at`: 创建时间
- `updated_at`: 更新时间

### API端点

**基础路径**: `/api/super-admin/backup`

| 端点 | 方法 | 说明 | 权限 |
|------|------|------|------|
| `/create` | POST | 创建数据库备份 | 超级管理员 |
| `/list` | GET | 获取备份列表 | 超级管理员 |
| `/restore` | POST | 恢复数据库 | 超级管理员 |
| `/cleanup` | POST | 清理旧备份 | 超级管理员 |

#### 创建备份
```http
POST /api/super-admin/backup/create
Authorization: Bearer {super_admin_token}

Response:
{
  "success": true,
  "data": {
    "backupId": "backup_1696723200000",
    "metadata": {
      "backupId": "backup_1696723200000",
      "timestamp": "2025-10-07T02:00:00.000Z",
      "date": "2025-10-07",
      "size": 15728640,
      "tableCount": 19,
      "recordCount": 12500,
      "status": "completed"
    },
    "r2Key": "backups/database/2025-10-07/backup_1696723200000.json"
  },
  "message": "数据库备份创建成功"
}
```

#### 获取备份列表
```http
GET /api/super-admin/backup/list
Authorization: Bearer {super_admin_token}

Response:
{
  "success": true,
  "data": {
    "backups": [
      {
        "backupId": "backup_1696723200000",
        "timestamp": "2025-10-07T02:00:00.000Z",
        "date": "2025-10-07",
        "size": 15728640,
        "tableCount": 19,
        "recordCount": 12500,
        "status": "completed"
      }
    ],
    "total": 7
  }
}
```

#### 恢复数据库
```http
POST /api/super-admin/backup/restore
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "backupId": "backup_1696723200000"
}

Response:
{
  "success": true,
  "data": {
    "restoredTables": 19,
    "restoredRecords": 12500
  },
  "message": "数据库恢复成功"
}
```

### 定时任务

**配置文件**: `backend/wrangler.toml`

```toml
[triggers]
crons = [
  "*/30 * * * *",   # 每30分钟：问卷2数据同步到静态表
  "0 2 * * *"       # 每天凌晨2点：数据库备份 + 清理旧备份
]
```

**处理函数**: `backend/src/worker.ts`

```typescript
async function handleDatabaseBackup(event, env, ctx) {
  // 1. 创建备份
  const backupService = new DatabaseBackupService(env);
  const backupResult = await backupService.createFullBackup();
  
  // 2. 清理旧备份（保留最近7天）
  const deletedCount = await backupService.cleanupOldBackups();
}
```

### R2存储结构

```
employment-survey-storage/
└── backups/
    └── database/
        ├── 2025-10-01/
        │   └── backup_1696118400000.json
        ├── 2025-10-02/
        │   └── backup_1696204800000.json
        ├── 2025-10-03/
        │   └── backup_1696291200000.json
        ├── 2025-10-04/
        │   └── backup_1696377600000.json
        ├── 2025-10-05/
        │   └── backup_1696464000000.json
        ├── 2025-10-06/
        │   └── backup_1696550400000.json
        └── 2025-10-07/
            └── backup_1696636800000.json
```

### 前端页面

**文件**: `reviewer-admin-dashboard/src/pages/SuperAdminBackupManagement.tsx`

**功能**:
- 📊 备份统计：总数、成功数、总大小
- 📋 备份列表：显示所有备份的详细信息
- 🔄 创建备份：手动触发备份创建
- 💾 恢复数据：从备份恢复数据库
- 🧹 清理旧备份：手动清理7天前的备份

**菜单路径**: 超级管理功能 → 数据备份

---

## 🚀 部署步骤

### 1. 执行数据库迁移

```bash
# 创建备份元数据表
wrangler d1 execute college-employment-survey \
  --file=backend/migrations/028_create_database_backups_table.sql \
  --remote
```

### 2. 部署后端

```bash
cd backend
npm run deploy
```

### 3. 部署前端

```bash
cd reviewer-admin-dashboard
npm run build
npm run deploy
```

### 4. 验证定时任务

```bash
# 查看定时任务配置
wrangler deployments list

# 手动触发测试（可选）
# 通过超级管理员界面手动创建备份进行测试
```

---

## 📊 使用指南

### 超级管理员操作

1. **访问备份管理页面**
   - 登录超级管理员账号
   - 导航到：超级管理功能 → 数据备份

2. **创建手动备份**
   - 点击"创建备份"按钮
   - 等待备份完成（通常需要10-30秒）
   - 查看备份列表确认

3. **恢复数据库**
   - 在备份列表中找到目标备份
   - 点击"恢复"按钮
   - 确认警告提示
   - 等待恢复完成

4. **清理旧备份**
   - 点击"清理旧备份"按钮
   - 确认删除7天前的备份
   - 查看删除结果

### 自动备份

- **时间**: 每天凌晨2点（UTC时间）
- **频率**: 每天1次
- **保留**: 最近7天
- **清理**: 自动删除第8天的备份

---

## ⚠️ 注意事项

### 数据恢复警告

1. **数据覆盖**: 恢复操作会删除当前所有数据
2. **不可逆**: 恢复后无法撤销
3. **停机时间**: 恢复期间系统应暂停服务
4. **验证**: 恢复后应立即验证数据完整性

### 备份大小

- 平均备份大小：10-20 MB
- 7天总存储：70-140 MB
- R2存储成本：约 $0.015/月

### 性能影响

- 备份时间：10-30秒（取决于数据量）
- 恢复时间：30-60秒（取决于数据量）
- 定时任务：凌晨2点执行，对用户无影响

---

## 🔧 故障排除

### 备份失败

**症状**: 备份状态显示"失败"

**可能原因**:
1. R2存储空间不足
2. 数据库连接超时
3. 表结构变更

**解决方案**:
```bash
# 1. 检查R2存储空间
wrangler r2 bucket list

# 2. 查看错误日志
wrangler tail employment-survey-api-prod

# 3. 手动测试备份
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/super-admin/backup/create \
  -H "Authorization: Bearer {token}"
```

### 恢复失败

**症状**: 恢复操作报错

**可能原因**:
1. 备份文件损坏
2. 表结构不匹配
3. 权限不足

**解决方案**:
1. 验证备份文件完整性
2. 检查数据库表结构
3. 确认超级管理员权限

---

## 📈 监控指标

### 关键指标

- 备份成功率：> 99%
- 备份大小增长：< 10% /月
- 恢复成功率：100%
- 清理成功率：100%

### 告警规则

- 连续3天备份失败 → 发送告警
- 备份大小超过50MB → 发送告警
- R2存储使用超过80% → 发送告警

---

## 🎯 未来优化

1. **增量备份**: 只备份变更的数据
2. **压缩备份**: 使用gzip压缩减少存储
3. **多地域备份**: 备份到多个R2 bucket
4. **备份加密**: 对敏感数据加密存储
5. **恢复预览**: 恢复前预览备份内容

