
# 问卷2测试数据导入指南

## 数据概览
- 总数据量: 1000条
- 分布: 学生200, 应届毕业生180, 在职青年250, 35+失业120, 女性育龄150, 高负债100

## 导入命令

```bash
cd backend/generated-data

npx wrangler d1 execute college-employment-survey --remote --file=import_test_data_part1.sql
npx wrangler d1 execute college-employment-survey --remote --file=import_test_data_part2.sql
```

## 验证导入

```sql
SELECT COUNT(*) FROM universal_questionnaire_responses WHERE questionnaire_id = 'questionnaire-v2-2024';
```

预期结果: 1000条
