# 测试数据管理规则

## 📋 概述

为了确保测试数据和生产数据的清晰分离，以及在切换到生产环境时能够安全清理测试数据，所有测试数据都必须遵循以下标识规则。

## 🏷️ 测试数据标识字段

### 1. 通用标识字段

所有包含测试数据的表都必须包含以下字段：

```sql
-- 测试数据标识字段
is_test_data INTEGER DEFAULT 0,  -- 0: 生产数据, 1: 测试数据
test_data_source TEXT,           -- 测试数据来源标识
test_data_created_at DATETIME,   -- 测试数据创建时间
```

### 2. 字段说明

- **is_test_data**: 
  - `0` = 生产数据（真实用户数据）
  - `1` = 测试数据（开发/测试环境数据）
  
- **test_data_source**: 测试数据来源标识
  - `"story-wall-generator"` = 故事墙测试数据生成器
  - `"questionnaire-generator"` = 问卷测试数据生成器
  - `"user-generator"` = 用户测试数据生成器
  - `"manual-test"` = 手工创建的测试数据
  - `"automated-test"` = 自动化测试数据
  
- **test_data_created_at**: 测试数据的创建时间戳

## 📊 涉及的数据表

### 1. 用户相关表
- `users` - 用户基础信息
- `user_profiles` - 用户详细资料

### 2. 问卷相关表
- `questionnaire_responses` - 问卷回答
- `questionnaire_answers` - 问卷答案详情
- `questionnaire_heart_voices` - 心声/故事内容

### 3. 故事墙相关表
- `valid_stories` - 有效故事
- `raw_story_submissions` - 原始故事提交

### 4. 系统相关表
- `content_tags` - 内容标签
- `user_favorites` - 用户收藏
- `content_reports` - 内容举报

## 🛠️ 数据生成器规范

### 1. 数据生成器必须实现

所有测试数据生成器都必须：

```javascript
// 在生成的数据中包含测试标识
const testDataFields = {
  is_test_data: 1,
  test_data_source: 'generator-name',
  test_data_created_at: new Date().toISOString()
};
```

### 2. SQL插入语句规范

```sql
-- 用户测试数据示例
INSERT INTO users (
  id, username, email, password_hash, role, 
  is_test_data, test_data_source, test_data_created_at,
  created_at, updated_at
) VALUES (
  'uuid-here', 'test_user_001', 'test@example.com', 'hash', 'user',
  1, 'user-generator', datetime('now'),
  datetime('now'), datetime('now')
);

-- 故事测试数据示例
INSERT INTO questionnaire_heart_voices (
  questionnaire_id, user_id, content, category, tags,
  is_test_data, test_data_source, test_data_created_at,
  created_at, updated_at
) VALUES (
  'questionnaire_1', 'user-uuid', '测试故事内容', 'employment-feedback', '["测试标签"]',
  1, 'story-wall-generator', datetime('now'),
  datetime('now'), datetime('now')
);
```

## 🧹 测试数据清理

### 1. 清理查询语句

```sql
-- 清理所有测试数据
DELETE FROM users WHERE is_test_data = 1;
DELETE FROM questionnaire_responses WHERE is_test_data = 1;
DELETE FROM questionnaire_heart_voices WHERE is_test_data = 1;
DELETE FROM valid_stories WHERE is_test_data = 1;

-- 按来源清理特定测试数据
DELETE FROM questionnaire_heart_voices 
WHERE is_test_data = 1 AND test_data_source = 'story-wall-generator';
```

### 2. 清理脚本示例

```bash
#!/bin/bash
# clean-test-data.sh

echo "开始清理测试数据..."

# 清理用户测试数据
npx wrangler d1 execute college-employment-survey --remote \
  --command="DELETE FROM users WHERE is_test_data = 1;"

# 清理故事测试数据
npx wrangler d1 execute college-employment-survey --remote \
  --command="DELETE FROM questionnaire_heart_voices WHERE is_test_data = 1;"

# 清理问卷测试数据
npx wrangler d1 execute college-employment-survey --remote \
  --command="DELETE FROM questionnaire_responses WHERE is_test_data = 1;"

echo "测试数据清理完成！"
```

## 📈 数据统计和监控

### 1. 测试数据统计查询

```sql
-- 统计各表的测试数据数量
SELECT 
  'users' as table_name,
  COUNT(*) as test_data_count,
  COUNT(CASE WHEN is_test_data = 0 THEN 1 END) as production_data_count
FROM users
WHERE is_test_data = 1

UNION ALL

SELECT 
  'questionnaire_heart_voices' as table_name,
  COUNT(*) as test_data_count,
  COUNT(CASE WHEN is_test_data = 0 THEN 1 END) as production_data_count
FROM questionnaire_heart_voices
WHERE is_test_data = 1;
```

### 2. 按来源统计测试数据

```sql
SELECT 
  test_data_source,
  COUNT(*) as count,
  MIN(test_data_created_at) as first_created,
  MAX(test_data_created_at) as last_created
FROM questionnaire_heart_voices 
WHERE is_test_data = 1
GROUP BY test_data_source
ORDER BY count DESC;
```

## ⚠️ 注意事项

### 1. 生产环境部署前检查

在部署到生产环境前，必须确认：
- [ ] 所有测试数据都已正确标识
- [ ] 测试数据清理脚本已准备就绪
- [ ] 生产数据不会被误删

### 2. 开发环境规范

- 开发环境可以混合测试数据和少量生产数据样本
- 测试环境应该只包含测试数据
- 生产环境严禁包含测试数据

### 3. 数据备份

在执行测试数据清理前，建议：
- 备份整个数据库
- 验证清理查询的正确性
- 在测试环境先执行清理操作

## 🔄 版本控制

- **版本**: 1.0
- **创建日期**: 2025-01-22
- **最后更新**: 2025-01-22
- **维护者**: 开发团队

## 📝 更新日志

- **2025-01-22**: 初始版本，建立测试数据管理规范
