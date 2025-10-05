# 问卷2测试数据导入指南 V2

## 数据概览
- **总数据量**: 1000条
- **数据库表**: universal_questionnaire_responses
- **Schema字段**: questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent
- **数据分布**: 
  - 学生: 200条 (20%)
  - 应届毕业生: 180条 (18%)
  - 在职青年: 250条 (25%)
  - 35+失业: 120条 (12%)
  - 女性育龄: 150条 (15%)
  - 高负债: 100条 (10%)

## 导入命令

```bash
cd backend/generated-data-v2

# 导入第1部分（500条）
npx wrangler d1 execute college-employment-survey --remote --file=import_q2_test_data_part1.sql

# 导入第2部分（500条）
npx wrangler d1 execute college-employment-survey --remote --file=import_q2_test_data_part2.sql
```

## 验证导入

```bash
# 查询总数
npx wrangler d1 execute college-employment-survey --remote --command="SELECT COUNT(*) as total FROM universal_questionnaire_responses WHERE questionnaire_id = 'questionnaire-v2-2024';"

# 查询测试数据分布
npx wrangler d1 execute college-employment-survey --remote --command="SELECT json_extract(response_data, '$.metadata.testDataRole') as role, COUNT(*) as count FROM universal_questionnaire_responses WHERE questionnaire_id = 'questionnaire-v2-2024' AND json_extract(response_data, '$.metadata.isTestData') = 1 GROUP BY role;"
```

预期结果: 1000条测试数据

## 下一步：同步静态表

导入完成后，调用同步API：

```bash
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/questionnaire-v2/sync-static-tables
```
