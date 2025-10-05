# 导入新测试数据操作指南

## 📊 新数据特性

- **总数据量**: 1000条
- **包含生育意愿字段**: 347条（育龄人群）
- **生成时间**: 2025年（当前会话）
- **文件位置**: `backend/generated-data-v2/`

---

## 🔧 操作步骤

### 步骤1: 清空旧数据

在 Cloudflare D1 控制台执行：

```sql
-- 删除旧的问卷2测试数据
DELETE FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'questionnaire-v2-2024';
```

**验证删除**:
```sql
SELECT COUNT(*) FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'questionnaire-v2-2024';
-- 应返回: 0
```

---

### 步骤2: 导入新数据（第1部分）

在 Cloudflare D1 控制台执行：

**文件**: `backend/generated-data-v2/import_q2_test_data_part1.sql`

**内容**: 500条数据

**预期结果**: 
- 插入500条记录
- 约2010行SQL语句（每条记录约4行）

---

### 步骤3: 导入新数据（第2部分）

在 Cloudflare D1 控制台执行：

**文件**: `backend/generated-data-v2/import_q2_test_data_part2.sql`

**内容**: 500条数据

**预期结果**: 
- 插入500条记录
- 约2010行SQL语句

---

### 步骤4: 验证数据完整性

```sql
-- 1. 验证总数
SELECT COUNT(*) as total_count 
FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'questionnaire-v2-2024';
-- 应返回: 1000

-- 2. 验证生育意愿字段
SELECT COUNT(*) as fertility_count
FROM universal_questionnaire_responses
WHERE questionnaire_id = 'questionnaire-v2-2024'
AND response_data LIKE '%fertility-plan-v2%';
-- 应返回: 347

-- 3. 验证性别字段
SELECT COUNT(*) as gender_count
FROM universal_questionnaire_responses
WHERE questionnaire_id = 'questionnaire-v2-2024'
AND response_data LIKE '%gender-v2%';
-- 应返回: 1000

-- 4. 验证收入来源字段
SELECT COUNT(*) as income_sources_count
FROM universal_questionnaire_responses
WHERE questionnaire_id = 'questionnaire-v2-2024'
AND response_data LIKE '%income-sources-v2%';
-- 应返回: 1000
```

---

### 步骤5: 触发统计表同步

```bash
# 手动触发统计表同步
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/questionnaire-v2/sync-all-stats
```

**预期结果**:
```json
{
  "success": true,
  "message": "Statistics synced successfully",
  "stats": {
    "q2_basic_stats": 30,
    "q2_economic_analysis": 0,
    "q2_discrimination_analysis": 0
  }
}
```

---

### 步骤6: 验证API返回数据

```bash
# 1. 验证生育意愿数据
curl -s https://employment-survey-api-prod.chrismarker89.workers.dev/api/universal-questionnaire/statistics/questionnaire-v2-2024 | jq '.data.fertility.intent'

# 预期输出（示例）:
{
  "data": [
    { "name": "不打算生育", "value": 120, "percentage": 34.6 },
    { "name": "观望中", "value": 95, "percentage": 27.4 },
    { "name": "计划生1个", "value": 80, "percentage": 23.1 },
    { "name": "计划生2个", "value": 42, "percentage": 12.1 },
    { "name": "计划生3个或更多", "value": 10, "percentage": 2.9 }
  ],
  "total": 347
}

# 2. 验证收入来源数据
curl -s https://employment-survey-api-prod.chrismarker89.workers.dev/api/universal-questionnaire/statistics/questionnaire-v2-2024 | jq '.data.economic.incomeSources'

# 3. 验证父母支援数据
curl -s https://employment-survey-api-prod.chrismarker89.workers.dev/api/universal-questionnaire/statistics/questionnaire-v2-2024 | jq '.data.economic.parentalSupport'
```

---

### 步骤7: 验证前端页面

打开页面: https://42e07abe.college-employment-survey-frontend-l84.pages.dev/analytics/v3

**检查清单**:
- [ ] 所有标签显示为中文
- [ ] 所有百分比正确显示（不显示undefined%）
- [ ] "收入来源"图表有数据
- [ ] "父母支援金额"图表有数据
- [ ] "收支平衡"图表有数据
- [ ] **"生育意愿"图表有数据（新增）**

---

## 📝 数据分布统计

### 角色分布
- 学生 (student): 200条
- 应届毕业生 (fresh_graduate): 180条
- 年轻职场人 (young_professional): 250条
- 35岁以上失业者 (unemployed_35plus): 120条
- 育龄女性 (female_childbearing_age): 150条
- 高负债人群 (high_debt): 100条

### 生育意愿分布（预估）
- 育龄人群: 约347条（女性23-35岁 + 男性26-35岁）
- 非育龄人群: 约653条（不生成生育意愿数据）

---

## 🚨 注意事项

1. **数据备份**: 导入前建议备份现有数据（如果需要）
2. **分批导入**: 必须分两次导入（part1 和 part2），避免SQL语句过长
3. **验证完整性**: 导入后务必验证所有字段都存在
4. **同步统计表**: 导入后触发统计表同步，确保可视化页面显示最新数据

---

## ✅ 预期结果

导入完成后，所有21个图表应该都有数据：

| 维度 | 图表数 | 状态 |
|------|--------|------|
| 人口结构与就业画像 | 7个 | ✅ 有数据 |
| 经济压力与生活成本 | 6个 | ✅ 有数据 |
| 就业状态与收入水平 | 2个 | ✅ 有数据 |
| 求职歧视与公平性 | 3个 | ✅ 有数据 |
| 就业信心与未来预期 | 2个 | ✅ 有数据 |
| 生育意愿与婚育压力 | 1个 | ✅ 有数据（新增）|

**总计**: 21个图表全部有数据

---

## 🔄 如果遇到问题

### 问题1: 导入失败
- **原因**: SQL语句过长或格式错误
- **解决**: 检查SQL文件格式，确保分批导入

### 问题2: 生育意愿图表仍为空
- **原因**: 统计表未同步或API缓存
- **解决**: 手动触发同步，清除浏览器缓存

### 问题3: 部分字段缺失
- **原因**: 数据生成脚本问题
- **解决**: 重新生成数据，验证字段完整性

---

**操作完成后，请刷新前端页面验证所有图表都正常显示！** 🎉

