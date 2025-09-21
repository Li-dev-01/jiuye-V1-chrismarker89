# 数据同步机制设计

## 概述

本文档描述了大学生就业问卷调查平台的3层数据同步机制，确保数据从临时表A流向有效数据表B，再到可视化副表的完整流程。

## 数据流向图

```
用户提交 → 临时表A → 审核 → 有效数据表B → 定时同步 → 可视化副表
         (temp)      (manual)    (valid)      (scheduled)   (analytics)
```

## 1. 临时表A → 有效数据表B (审核流程)

### 触发条件
- 管理员手动审核通过问卷
- API调用: `PUT /api/admin/questionnaire/:id/approve`

### 同步逻辑
```sql
-- 1. 更新临时表审核状态
UPDATE questionnaire_submissions_temp 
SET review_status = 'approved',
    reviewer_id = :reviewer_id,
    review_notes = :review_notes,
    reviewed_at = NOW()
WHERE id = :submission_id;

-- 2. 复制数据到有效数据表
INSERT INTO questionnaire_submissions (
    temp_submission_id, user_id, age, gender, education_level, major, graduation_year,
    location_province, location_city, employment_status, job_title,
    company_name, company_size, industry, work_experience_years,
    current_salary, expected_salary, salary_satisfaction,
    job_search_duration_months, job_applications_count, interviews_count, job_offers_count,
    job_search_channels, technical_skills, soft_skills, certifications,
    career_goals, industry_preference, work_location_preference, work_mode_preference,
    job_search_challenges, skill_gaps, market_concerns,
    original_submission_time, approved_by
)
SELECT 
    id, user_id, age, gender, education_level, major, graduation_year,
    location_province, location_city, employment_status, job_title,
    company_name, company_size, industry, work_experience_years,
    current_salary, expected_salary, salary_satisfaction,
    job_search_duration_months, job_applications_count, interviews_count, job_offers_count,
    job_search_channels, technical_skills, soft_skills, certifications,
    career_goals, industry_preference, work_location_preference, work_mode_preference,
    job_search_challenges, skill_gaps, market_concerns,
    submission_time, :reviewer_id
FROM questionnaire_submissions_temp 
WHERE id = :submission_id;

-- 3. 记录审计日志
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
VALUES (:reviewer_id, 'approve', 'questionnaire', :submission_id, :approval_data);
```

### 错误处理
- 事务回滚机制
- 重复审核检查
- 数据完整性验证

## 2. 有效数据表B → 可视化副表 (定时同步)

### 触发条件
- 每日凌晨2:00自动执行
- 手动触发同步 (管理员操作)
- 数据变更达到阈值时触发

### 同步任务列表

#### 2.1 总体统计摘要同步
```sql
-- 更新 analytics_summary 表
INSERT INTO analytics_summary (
    total_submissions, total_users, completion_rate, employment_rate,
    average_salary, median_salary, salary_satisfaction_avg,
    avg_job_search_duration, avg_applications_count, avg_interview_success_rate,
    period_type, period_start, period_end, last_updated
)
SELECT 
    COUNT(*) as total_submissions,
    COUNT(DISTINCT user_id) as total_users,
    100.0 as completion_rate,
    (COUNT(CASE WHEN employment_status = 'employed' THEN 1 END) * 100.0 / COUNT(*)) as employment_rate,
    AVG(current_salary) as average_salary,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY current_salary) as median_salary,
    AVG(CASE 
        WHEN salary_satisfaction = 'very_satisfied' THEN 5
        WHEN salary_satisfaction = 'satisfied' THEN 4
        WHEN salary_satisfaction = 'neutral' THEN 3
        WHEN salary_satisfaction = 'dissatisfied' THEN 2
        WHEN salary_satisfaction = 'very_dissatisfied' THEN 1
    END) as salary_satisfaction_avg,
    AVG(job_search_duration_months) as avg_job_search_duration,
    AVG(job_applications_count) as avg_applications_count,
    AVG(CASE WHEN job_offers_count > 0 THEN (job_offers_count * 100.0 / job_applications_count) END) as avg_interview_success_rate,
    'daily' as period_type,
    CURRENT_DATE as period_start,
    CURRENT_DATE as period_end,
    NOW() as last_updated
FROM questionnaire_submissions
WHERE approved_at >= CURRENT_DATE - INTERVAL '1 day'
ON DUPLICATE KEY UPDATE
    total_submissions = VALUES(total_submissions),
    total_users = VALUES(total_users),
    employment_rate = VALUES(employment_rate),
    average_salary = VALUES(average_salary),
    median_salary = VALUES(median_salary),
    salary_satisfaction_avg = VALUES(salary_satisfaction_avg),
    avg_job_search_duration = VALUES(avg_job_search_duration),
    avg_applications_count = VALUES(avg_applications_count),
    avg_interview_success_rate = VALUES(avg_interview_success_rate),
    last_updated = VALUES(last_updated);
```

#### 2.2 人口统计数据同步
```sql
-- 按年龄维度统计
INSERT INTO analytics_demographics (
    dimension_type, dimension_value, count, percentage, avg_salary, employment_rate,
    period_start, period_end, last_updated
)
SELECT 
    'age' as dimension_type,
    CASE 
        WHEN age < 22 THEN '22岁以下'
        WHEN age BETWEEN 22 AND 24 THEN '22-24岁'
        WHEN age BETWEEN 25 AND 27 THEN '25-27岁'
        WHEN age > 27 THEN '27岁以上'
    END as dimension_value,
    COUNT(*) as count,
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questionnaire_submissions)) as percentage,
    AVG(current_salary) as avg_salary,
    (COUNT(CASE WHEN employment_status = 'employed' THEN 1 END) * 100.0 / COUNT(*)) as employment_rate,
    CURRENT_DATE as period_start,
    CURRENT_DATE as period_end,
    NOW() as last_updated
FROM questionnaire_submissions
GROUP BY dimension_value
ON DUPLICATE KEY UPDATE
    count = VALUES(count),
    percentage = VALUES(percentage),
    avg_salary = VALUES(avg_salary),
    employment_rate = VALUES(employment_rate),
    last_updated = VALUES(last_updated);
```

#### 2.3 就业状况统计同步
```sql
-- 按行业统计就业情况
INSERT INTO analytics_employment (
    employment_status, industry, company_size, work_mode,
    count, percentage, avg_salary, median_salary, salary_range_min, salary_range_max,
    period_start, period_end, last_updated
)
SELECT 
    employment_status,
    industry,
    company_size,
    work_mode_preference as work_mode,
    COUNT(*) as count,
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questionnaire_submissions WHERE employment_status = 'employed')) as percentage,
    AVG(current_salary) as avg_salary,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY current_salary) as median_salary,
    MIN(current_salary) as salary_range_min,
    MAX(current_salary) as salary_range_max,
    CURRENT_DATE as period_start,
    CURRENT_DATE as period_end,
    NOW() as last_updated
FROM questionnaire_submissions
WHERE employment_status = 'employed'
GROUP BY employment_status, industry, company_size, work_mode_preference
ON DUPLICATE KEY UPDATE
    count = VALUES(count),
    percentage = VALUES(percentage),
    avg_salary = VALUES(avg_salary),
    median_salary = VALUES(median_salary),
    salary_range_min = VALUES(salary_range_min),
    salary_range_max = VALUES(salary_range_max),
    last_updated = VALUES(last_updated);
```

#### 2.4 技能统计同步
```sql
-- 技能统计 (需要解析JSON字段)
INSERT INTO analytics_skills (
    skill_type, skill_name, mention_count, percentage,
    avg_salary_with_skill, employment_rate_with_skill,
    period_start, period_end, last_updated
)
SELECT 
    'technical' as skill_type,
    skill_name,
    COUNT(*) as mention_count,
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questionnaire_submissions)) as percentage,
    AVG(current_salary) as avg_salary_with_skill,
    (COUNT(CASE WHEN employment_status = 'employed' THEN 1 END) * 100.0 / COUNT(*)) as employment_rate_with_skill,
    CURRENT_DATE as period_start,
    CURRENT_DATE as period_end,
    NOW() as last_updated
FROM questionnaire_submissions,
JSON_TABLE(technical_skills, '$[*]' COLUMNS (skill_name VARCHAR(100) PATH '$')) as skills
GROUP BY skill_name
HAVING mention_count >= 3  -- 至少被提及3次的技能
ON DUPLICATE KEY UPDATE
    mention_count = VALUES(mention_count),
    percentage = VALUES(percentage),
    avg_salary_with_skill = VALUES(avg_salary_with_skill),
    employment_rate_with_skill = VALUES(employment_rate_with_skill),
    last_updated = VALUES(last_updated);
```

### 同步任务调度

#### Cron任务配置
```bash
# 每日凌晨2点执行数据同步
0 2 * * * /usr/bin/php /path/to/project/scripts/sync_analytics_data.php

# 每小时检查是否有新的审核通过数据
0 * * * * /usr/bin/php /path/to/project/scripts/check_new_approvals.php
```

#### 同步脚本示例 (PHP)
```php
<?php
// scripts/sync_analytics_data.php

class AnalyticsDataSync {
    private $db;
    
    public function __construct() {
        $this->db = new PDO($dsn, $username, $password);
    }
    
    public function syncAll() {
        $this->logSyncStart();
        
        try {
            $this->syncSummaryData();
            $this->syncDemographicsData();
            $this->syncEmploymentData();
            $this->syncSkillsData();
            
            $this->logSyncSuccess();
        } catch (Exception $e) {
            $this->logSyncError($e->getMessage());
            throw $e;
        }
    }
    
    private function logSyncStart() {
        $sql = "INSERT INTO data_sync_logs (sync_type, status, started_at) 
                VALUES ('valid_to_analytics', 'running', NOW())";
        $this->db->exec($sql);
    }
    
    // ... 其他同步方法
}

$sync = new AnalyticsDataSync();
$sync->syncAll();
?>
```

## 3. 数据一致性保证

### 事务管理
- 所有同步操作使用数据库事务
- 失败时自动回滚
- 记录详细的错误日志

### 数据校验
- 同步前后数据量对比
- 关键指标合理性检查
- 异常数据报警机制

### 监控与报警
- 同步任务执行状态监控
- 数据延迟报警
- 异常数据报警
- 性能指标监控

## 4. 性能优化

### 索引优化
- 为常用查询字段创建索引
- 复合索引优化多维度查询
- 定期分析查询性能

### 分批处理
- 大量数据分批同步
- 避免长时间锁表
- 控制内存使用

### 缓存策略
- Redis缓存热点数据
- 查询结果缓存
- 定期刷新缓存

## 5. 故障恢复

### 备份策略
- 每日全量备份
- 增量备份
- 跨地域备份

### 恢复流程
- 数据损坏检测
- 自动恢复机制
- 手动恢复流程

### 应急预案
- 同步失败处理
- 数据不一致修复
- 服务降级方案
