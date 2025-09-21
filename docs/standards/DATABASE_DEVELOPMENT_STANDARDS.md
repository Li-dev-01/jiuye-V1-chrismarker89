# 🗄️ **数据库开发规范**

## 📊 **架构背景**

我们的系统采用**主表与多组功能副表**架构：
- **主表**: `users`, `universal_questionnaire_responses`
- **功能副表**: `analytics_responses`, `admin_responses`, `social_insights_data`
- **缓存表**: `realtime_stats`, `aggregated_stats`, `dashboard_cache`

## ⚠️ **核心问题**

外键约束错误在我们的架构下**高频发生**，主要原因：
1. **数据类型不一致**: 主表与副表的关联字段类型不匹配
2. **插入顺序错误**: 副表数据先于主表数据插入
3. **孤儿数据产生**: 主表数据删除后副表数据残留

---

## 🔧 **1. 代码层面规范**

### **1.1 ORM事务管理**

```typescript
// ✅ 正确的事务操作顺序
async function createQuestionnaireWithAnalytics(userData: UserData, questionnaireData: QuestionnaireData) {
  return await db.transaction(async (tx) => {
    // 1. 先插入主表
    const user = await tx.insert(users).values(userData).returning();
    
    // 2. 再插入问卷表
    const questionnaire = await tx.insert(universal_questionnaire_responses)
      .values({
        ...questionnaireData,
        user_id: user.id  // 确保外键存在
      }).returning();
    
    // 3. 最后插入分析表
    const analytics = await tx.insert(analytics_responses)
      .values({
        ...generateAnalyticsData(questionnaire),
        user_id: user.id  // 确保外键存在
      });
    
    return { user, questionnaire, analytics };
  });
}
```

### **1.2 数据验证中间件**

```typescript
// 外键存在性验证
async function validateForeignKeys(data: any, tableName: string) {
  const foreignKeys = getForeignKeyConfig(tableName);
  
  for (const fk of foreignKeys) {
    const exists = await db.select().from(fk.table)
      .where(eq(fk.column, data[fk.field])).limit(1);
    
    if (!exists.length) {
      throw new Error(`Foreign key violation: ${fk.field} not found in ${fk.table}`);
    }
  }
}
```

---

## 🗄️ **2. 数据库层面规范**

### **2.1 统一的外键级联规则**

```sql
-- ✅ 标准外键定义模板
ALTER TABLE analytics_responses 
ADD CONSTRAINT fk_analytics_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- ✅ 软删除场景
ALTER TABLE analytics_responses 
ADD CONSTRAINT fk_analytics_user_soft 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;
```

### **2.2 数据类型一致性规范**

```sql
-- ✅ 主表字段类型定义
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT lower(hex(randomblob(16))),  -- 统一使用TEXT
  -- 其他字段...
);

-- ✅ 副表外键字段必须匹配主表类型
CREATE TABLE analytics_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT,  -- 必须与users.id类型一致
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ❌ 错误示例 - 类型不匹配
CREATE TABLE bad_table (
  user_id INTEGER,  -- 错误：与users.id的TEXT类型不匹配
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **2.3 字段类型标准化**

| 用途 | 数据类型 | 示例 |
|------|----------|------|
| 主键ID | `TEXT` | `lower(hex(randomblob(16)))` |
| 外键引用 | `TEXT` | 与主表ID类型一致 |
| 时间戳 | `TEXT` | `datetime('now')` |
| JSON数据 | `TEXT` | 问卷数据、配置信息 |
| 数值统计 | `INTEGER/REAL` | 计数、百分比 |

---

## 📝 **3. 迁移脚本规范**

### **3.1 迁移文件命名规范**

```
migrations/
├── 001_create_users_table.sql           # 主表优先
├── 002_create_questionnaire_table.sql   # 依赖主表的表
├── 003_create_analytics_table.sql       # 功能副表
├── 004_add_foreign_keys.sql             # 外键约束单独文件
├── 005_seed_test_data.sql               # 种子数据
```

### **3.2 迁移脚本模板**

```sql
-- ✅ 标准迁移脚本结构
-- migrations/003_create_analytics_table.sql

-- 1. 检查依赖表是否存在
SELECT CASE 
  WHEN COUNT(*) = 0 THEN RAISE(ABORT, 'Dependency table users not found')
  ELSE 0 
END 
FROM sqlite_master 
WHERE type='table' AND name='users';

-- 2. 创建表结构
CREATE TABLE IF NOT EXISTS analytics_responses (
  id TEXT PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
  user_id TEXT NOT NULL,
  -- 其他字段...
  created_at TEXT NOT NULL DEFAULT datetime('now'),
  updated_at TEXT NOT NULL DEFAULT datetime('now')
);

-- 3. 添加外键约束（如果支持）
-- FOREIGN KEY约束在表创建时定义，或使用ALTER TABLE

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_responses(created_at);
```

### **3.3 种子数据规范**

```sql
-- ✅ 种子数据插入顺序
-- 1. 主表数据
INSERT OR IGNORE INTO users (id, username, email, password_hash, role) VALUES
  ('test-user-001', 'testuser001', 'test001@example.com', 'hash123', 'user'),
  ('test-user-002', 'testuser002', 'test002@example.com', 'hash123', 'user');

-- 2. 依赖表数据
INSERT OR IGNORE INTO universal_questionnaire_responses (questionnaire_id, user_id, response_data) VALUES
  ('employment-survey-2024', 'test-user-001', '{"age_range":"23-25"}'),
  ('employment-survey-2024', 'test-user-002', '{"age_range":"26-30"}');

-- 3. 功能副表数据
INSERT OR IGNORE INTO analytics_responses (id, user_id, age_range, is_test_data) VALUES
  ('test-analytics-001', 'test-user-001', '23-25', 1),
  ('test-analytics-002', 'test-user-002', '26-30', 1);
```

---

## 🔍 **4. 数据完整性检查**

### **4.1 孤儿数据检查脚本**

```sql
-- 检查analytics_responses表中的孤儿记录
SELECT 
  ar.id,
  ar.user_id,
  'Missing user reference' as issue
FROM analytics_responses ar
LEFT JOIN users u ON ar.user_id = u.id
WHERE u.id IS NULL;

-- 检查universal_questionnaire_responses表中的孤儿记录
SELECT 
  uqr.id,
  uqr.user_id,
  'Missing user reference' as issue
FROM universal_questionnaire_responses uqr
LEFT JOIN users u ON uqr.user_id = u.id
WHERE uqr.user_id IS NOT NULL AND u.id IS NULL;
```

### **4.2 自动化检查脚本**

```typescript
// scripts/checkDataIntegrity.ts
async function checkDataIntegrity() {
  const orphanChecks = [
    {
      name: 'analytics_responses orphans',
      query: `
        SELECT COUNT(*) as count 
        FROM analytics_responses ar
        LEFT JOIN users u ON ar.user_id = u.id
        WHERE u.id IS NULL
      `
    },
    {
      name: 'questionnaire_responses orphans',
      query: `
        SELECT COUNT(*) as count 
        FROM universal_questionnaire_responses uqr
        LEFT JOIN users u ON uqr.user_id = u.id
        WHERE uqr.user_id IS NOT NULL AND u.id IS NULL
      `
    }
  ];

  for (const check of orphanChecks) {
    const result = await db.raw(check.query);
    if (result[0].count > 0) {
      console.error(`❌ Found ${result[0].count} orphan records in ${check.name}`);
    } else {
      console.log(`✅ No orphan records in ${check.name}`);
    }
  }
}
```

---

## 🚀 **5. CI/CD集成**

### **5.1 数据库测试流水线**

```yaml
# .github/workflows/database-tests.yml
name: Database Integrity Tests

on: [push, pull_request]

jobs:
  database-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Database
        run: |
          # 运行迁移脚本
          npm run db:migrate
          
      - name: Run Data Integrity Checks
        run: |
          # 检查外键完整性
          npm run db:check-integrity
          
      - name: Test Seed Data
        run: |
          # 测试种子数据导入
          npm run db:seed
          npm run db:check-integrity
```

### **5.2 部署前检查**

```bash
#!/bin/bash
# scripts/pre-deploy-check.sh

echo "🔍 Running pre-deployment database checks..."

# 1. 检查迁移脚本语法
echo "Checking migration syntax..."
for file in migrations/*.sql; do
  sqlite3 ":memory:" < "$file" || exit 1
done

# 2. 检查外键完整性
echo "Checking foreign key integrity..."
npm run db:check-integrity || exit 1

# 3. 测试种子数据
echo "Testing seed data..."
npm run db:seed:test || exit 1

echo "✅ All database checks passed!"
```

---

## 📋 **6. 开发流程规范**

### **6.1 新表创建流程**

1. **设计阶段**
   - 确定主表依赖关系
   - 统一字段类型（特别是外键字段）
   - 定义级联删除规则

2. **开发阶段**
   - 创建迁移脚本（遵循命名规范）
   - 添加外键约束和索引
   - 编写数据完整性检查

3. **测试阶段**
   - 本地运行完整性检查
   - 测试种子数据导入
   - 验证级联删除行为

4. **部署阶段**
   - 运行pre-deploy检查
   - 按顺序执行迁移
   - 部署后验证数据完整性

### **6.2 代码审查清单**

- [ ] 外键字段类型与主表一致
- [ ] 使用事务包装多表操作
- [ ] 添加了外键存在性验证
- [ ] 迁移脚本包含依赖检查
- [ ] 种子数据按正确顺序插入
- [ ] 添加了相应的完整性检查

---

## 🎯 **实施建议**

### **立即执行**
1. **修复当前类型不匹配问题**
2. **创建数据完整性检查脚本**
3. **建立迁移脚本规范**

### **短期目标（1-2周）**
1. **重构现有外键约束**
2. **实施CI/CD数据库测试**
3. **创建开发者工具脚本**

### **长期目标（1个月）**
1. **完善监控和告警**
2. **自动化数据修复工具**
3. **性能优化和索引调优**

---

**🎊 通过这套规范，我们可以从根本上解决外键约束问题，确保数据库的完整性和可靠性！**
