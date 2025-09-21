# 数据库导入说明

## 📊 数据概览
- 用户数量: 1,200个
- 问卷数量: 1,800份 (100%完整)
- 数据质量: 优秀 (无逻辑错误)

## 🔧 导入步骤

### 方法1: 使用wrangler (推荐)
```bash
# 1. 清理现有测试数据
wrangler d1 execute employment-survey-db --file=generated-data/sql/01-cleanup.sql

# 2. 导入用户数据
wrangler d1 execute employment-survey-db --file=generated-data/sql/02-users.sql

# 3. 导入问卷数据 (分批执行)
wrangler d1 execute employment-survey-db --file=generated-data/sql/03-responses-batch-01.sql
wrangler d1 execute employment-survey-db --file=generated-data/sql/03-responses-batch-02.sql
# ... 继续执行其他批次
```

### 方法2: 使用Cloudflare Dashboard
1. 登录 Cloudflare Dashboard
2. 进入 D1 数据库管理页面
3. 选择你的数据库
4. 在 Console 中依次执行SQL文件内容

### 方法3: 批量执行脚本
```bash
# 执行所有SQL文件
for file in generated-data/sql/*.sql; do
  echo "执行: $file"
  wrangler d1 execute employment-survey-db --file="$file"
done
```

## ✅ 验证导入结果
```sql
-- 检查导入的数据量
SELECT COUNT(*) as user_count FROM users WHERE is_test_data = 1;
SELECT COUNT(*) as response_count FROM questionnaire_responses WHERE is_test_data = 1;
SELECT COUNT(*) as answer_count FROM questionnaire_answers WHERE is_test_data = 1;

-- 检查数据分布
SELECT current_status, COUNT(*) as count 
FROM questionnaire_responses r
JOIN questionnaire_answers a ON r.id = a.response_id
WHERE r.is_test_data = 1 AND a.question_id = 'current-status'
GROUP BY current_status;
```

## 🧹 清理测试数据 (如需要)
```sql
DELETE FROM questionnaire_answers WHERE is_test_data = 1;
DELETE FROM questionnaire_responses WHERE is_test_data = 1;
DELETE FROM users WHERE is_test_data = 1;
```

## 📝 注意事项
- 所有测试数据都有 `is_test_data = 1` 标识
- 可以安全地与生产数据共存
- 建议在非生产环境先测试导入流程
- 如遇到错误，可以先执行清理脚本再重新导入