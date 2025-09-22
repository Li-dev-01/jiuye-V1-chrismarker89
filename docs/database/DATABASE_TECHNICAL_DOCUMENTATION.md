# 数据库技术文档

## 📋 目录

1. [架构概览](#架构概览)
2. [多级专用表系统](#多级专用表系统)
3. [性能优化策略](#性能优化策略)
4. [维护指南](#维护指南)
5. [故障排除](#故障排除)
6. [监控与告警](#监控与告警)
7. [扩容策略](#扩容策略)
8. [API参考](#api参考)

---

## 🏗️ 架构概览

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端应用层                                │
│  React + TypeScript + Ant Design + Recharts               │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                 API网关层                                   │
│  Cloudflare Workers + Hono Framework                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                多级专用表系统                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Tier 1    │  │   Tier 2    │  │   Tier 3    │         │
│  │  主数据表    │  │  业务专用表  │  │  统计缓存表  │         │
│  │             │  │             │  │             │         │
│  │ 写优化      │  │ 功能分离    │  │ 查询优化    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Tier 4    │  │  监控系统    │  │  智能扩容    │         │
│  │  视图缓存表  │  │             │  │             │         │
│  │             │  │ 性能监控    │  │ 动态调优    │         │
│  │ 显示优化    │  │ 定时任务    │  │ 自动扩容    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Cloudflare D1 数据库                        │
│  SQLite-compatible, Edge-distributed                      │
└─────────────────────────────────────────────────────────────┘
```

### 核心设计原则

1. **读写分离**: 主表专注写入，专用表优化查询
2. **多级缓存**: 4层缓存架构，逐级优化性能
3. **智能同步**: 基于使用模式的动态同步策略
4. **自动扩容**: 根据数据量和流量自动调整配置
5. **实时监控**: 全方位性能监控和告警机制

---

## 🗄️ 多级专用表系统

### Tier 1: 主数据表 (写优化)

#### 核心表结构

```sql
-- 通用问卷响应表 (主表)
universal_questionnaire_responses
├── id (主键)
├── questionnaire_id (问卷ID)
├── user_id (用户ID)
├── response_data (JSON格式响应数据)
├── is_complete (是否完成)
├── is_test_data (是否测试数据)
├── created_at (创建时间)
└── updated_at (更新时间)

-- 用户表
users
├── id (主键)
├── username (用户名)
├── email (邮箱)
├── user_type (用户类型)
├── is_anonymous (是否匿名)
└── created_at (创建时间)
```

**特点**:
- 专注于数据写入和完整性
- 最小化写入延迟
- 保持数据的原始完整性

### Tier 2: 业务专用表 (功能分离)

#### 分析专用表
```sql
analytics_responses
├── id (主键)
├── questionnaire_id
├── user_id
├── age_range (预处理年龄段)
├── education_level (预处理学历)
├── employment_status (预处理就业状态)
├── gender (预处理性别)
├── major_category (预处理专业类别)
├── salary_range (预处理薪资范围)
├── location (预处理地区)
├── is_test_data
└── created_at
```

#### 管理专用表
```sql
admin_responses
├── id (主键)
├── response_id (关联主表)
├── review_status (审核状态)
├── data_quality_score (数据质量评分)
├── anomaly_flags (异常标记)
└── processed_at
```

#### 社会洞察数据表
```sql
social_insights_data
├── id (主键)
├── insight_type (洞察类型)
├── data_snapshot (数据快照)
├── generated_insights (生成的洞察)
├── confidence_score (置信度)
└── created_at
```

### Tier 3: 统计缓存表 (查询优化)

#### 实时统计表
```sql
realtime_stats
├── id (主键)
├── stat_key (统计键)
├── stat_category (统计类别)
├── count_value (计数值)
├── percentage_value (百分比值)
├── time_window (时间窗口)
└── last_updated
```

#### 聚合统计表
```sql
aggregated_stats
├── id (主键)
├── aggregation_type (聚合类型)
├── dimension (维度)
├── metric_name (指标名称)
├── metric_value (指标值)
├── period (统计周期)
└── calculated_at
```

### Tier 4: 视图缓存表 (显示优化)

#### 仪表板缓存
```sql
dashboard_cache
├── id (主键)
├── cache_key (缓存键)
├── widget_type (组件类型)
├── widget_data (组件数据)
├── expires_at (过期时间)
└── updated_at
```

#### 可视化缓存
```sql
enhanced_visualization_cache
├── id (主键)
├── cache_key (缓存键)
├── visualization_type (可视化类型)
├── page_context (页面上下文)
├── chart_data (图表数据)
├── expires_at (过期时间)
└── updated_at
```

---

## ⚡ 性能优化策略

### 同步策略配置

| 同步任务 | 频率 | 目标 | 优化重点 |
|---------|------|------|----------|
| main_to_analytics | 实时 | 数据一致性 | 写入性能 |
| analytics_to_realtime | 5分钟 | 实时统计 | 计算效率 |
| realtime_to_aggregated | 10分钟 | 聚合数据 | 存储优化 |
| aggregated_to_dashboard | 15分钟 | 仪表板 | 显示性能 |
| dashboard_to_visualization | 15分钟 | 可视化 | 渲染优化 |

### 索引策略

#### 主要索引
```sql
-- 性能关键索引
CREATE INDEX idx_responses_questionnaire_created ON universal_questionnaire_responses(questionnaire_id, created_at);
CREATE INDEX idx_responses_user_complete ON universal_questionnaire_responses(user_id, is_complete);
CREATE INDEX idx_analytics_employment_age ON analytics_responses(employment_status, age_range);
CREATE INDEX idx_analytics_education_salary ON analytics_responses(education_level, salary_range);

-- 统计查询索引
CREATE INDEX idx_realtime_stats_category_key ON realtime_stats(stat_category, stat_key);
CREATE INDEX idx_aggregated_stats_type_period ON aggregated_stats(aggregation_type, period);

-- 缓存查询索引
CREATE INDEX idx_dashboard_cache_key_expires ON dashboard_cache(cache_key, expires_at);
CREATE INDEX idx_visualization_cache_key_expires ON enhanced_visualization_cache(cache_key, expires_at);
```

### 查询优化

#### 统计查询优化
```sql
-- 优化前 (直接查询主表)
SELECT employment_status, COUNT(*) 
FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'employment-survey-2024'
GROUP BY employment_status;

-- 优化后 (使用专用表)
SELECT stat_key, count_value 
FROM realtime_stats 
WHERE stat_category = 'employment' 
AND time_window = '5min';
```

---

## 🔧 维护指南

### 日常维护任务

#### 每日维护 (自动化)
```bash
# 数据一致性检查
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/consistency-check/employment-survey-2024"

# 性能指标检查
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/performance/metrics?timeRange=24h"

# 缓存健康度检查
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/cache/usage-patterns?timeRange=24h"
```

#### 每周维护 (半自动)
```bash
# 性能基准更新
curl -X POST "${API_BASE_URL}/api/universal-questionnaire/performance/baseline"

# 扩容分析
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/scaling/analysis"

# 数据质量报告
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/data-quality/employment-survey-2024"
```

#### 每月维护 (手动)
1. **数据库优化**
   ```sql
   ANALYZE; -- 更新统计信息
   VACUUM; -- 清理碎片
   ```

2. **索引维护**
   ```sql
   -- 检查索引使用情况
   SELECT name, sql FROM sqlite_master WHERE type='index';
   
   -- 重建必要索引
   REINDEX idx_responses_questionnaire_created;
   ```

3. **历史数据归档**
   ```sql
   -- 归档6个月前的性能指标
   DELETE FROM performance_metrics 
   WHERE timestamp < datetime('now', '-6 months');
   ```

### 数据备份策略

#### 自动备份
```bash
# 每日备份 (Cloudflare D1 自动)
wrangler d1 backup create college-employment-survey

# 导出关键数据
wrangler d1 execute college-employment-survey --command="
  SELECT * FROM analytics_responses 
  WHERE created_at >= datetime('now', '-1 day')
" --output backup_$(date +%Y%m%d).json
```

#### 恢复流程
```bash
# 1. 停止写入服务
# 2. 恢复数据库
wrangler d1 backup restore college-employment-survey [backup-id]

# 3. 验证数据完整性
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/consistency-check/employment-survey-2024"

# 4. 重启服务
```

---

## 🚨 故障排除

### 常见问题诊断

#### 1. 响应时间过慢
**症状**: API响应时间 > 2秒
**诊断步骤**:
```sql
-- 检查缓存命中率
SELECT 
  AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
  AVG(response_time) as avg_response_time
FROM performance_metrics 
WHERE timestamp >= datetime('now', '-1 hour');

-- 检查慢查询
SELECT endpoint, response_time, data_source, timestamp
FROM performance_metrics 
WHERE response_time > 2000 
ORDER BY response_time DESC 
LIMIT 10;
```

**解决方案**:
1. 检查缓存配置
2. 优化同步频率
3. 重建索引

#### 2. 数据不一致
**症状**: 统计数据与实际数据不符
**诊断步骤**:
```sql
-- 检查各级表数据量
SELECT 'main' as table_name, COUNT(*) as count 
FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'employment-survey-2024'
UNION ALL
SELECT 'analytics', COUNT(*) 
FROM analytics_responses
UNION ALL
SELECT 'realtime_stats', COUNT(*) 
FROM realtime_stats 
WHERE stat_category = 'employment';
```

**解决方案**:
1. 手动触发同步
2. 重新计算统计数据
3. 检查同步任务状态

#### 3. 缓存失效
**症状**: 缓存命中率 < 80%
**诊断步骤**:
```sql
-- 检查缓存状态
SELECT cache_key, expires_at, updated_at
FROM enhanced_visualization_cache 
WHERE expires_at > datetime('now')
ORDER BY updated_at DESC;

-- 检查同步任务状态
SELECT * FROM v_cron_health 
WHERE health_status != 'healthy';
```

**解决方案**:
1. 调整缓存过期时间
2. 优化同步策略
3. 手动刷新缓存

### 紧急恢复流程

#### 系统完全故障
1. **立即响应** (5分钟内)
   - 切换到备用数据源
   - 启用降级模式
   - 通知相关人员

2. **问题诊断** (15分钟内)
   - 检查系统日志
   - 分析错误模式
   - 确定故障范围

3. **修复实施** (30分钟内)
   - 执行修复方案
   - 验证修复效果
   - 逐步恢复服务

4. **后续跟进** (24小时内)
   - 完整性检查
   - 性能验证
   - 故障总结

---

## 📊 监控与告警

### 关键指标监控

#### 性能指标
- **响应时间**: 平均 < 500ms, P95 < 1000ms
- **缓存命中率**: > 90%
- **错误率**: < 1%
- **并发用户数**: 实时监控

#### 业务指标
- **数据增长率**: 日/周/月增长趋势
- **用户活跃度**: DAU/MAU
- **问卷完成率**: > 95%
- **数据质量评分**: > 85分

#### 系统指标
- **同步任务成功率**: > 98%
- **数据一致性**: 100%
- **存储使用率**: < 80%
- **索引效率**: 查询优化比例

### 告警配置

#### 关键告警 (立即通知)
```yaml
critical_alerts:
  - name: "API响应时间过慢"
    condition: "avg_response_time > 2000ms"
    duration: "5分钟"
    
  - name: "缓存命中率过低"
    condition: "cache_hit_rate < 70%"
    duration: "10分钟"
    
  - name: "数据同步失败"
    condition: "sync_error_rate > 5%"
    duration: "1分钟"
```

#### 警告告警 (延迟通知)
```yaml
warning_alerts:
  - name: "数据增长异常"
    condition: "daily_growth_rate > 50%"
    duration: "1小时"
    
  - name: "用户并发过高"
    condition: "concurrent_users > 1000"
    duration: "15分钟"
```

---

## 🔄 扩容策略

### 自动扩容触发条件

#### 数据量扩容
- **触发条件**: 日增长率 > 20%
- **扩容动作**: 
  - 增加同步频率
  - 优化索引策略
  - 调整缓存配置

#### 流量扩容
- **触发条件**: 峰值流量 > 平均流量 3倍
- **扩容动作**:
  - 启用智能预热
  - 增加缓存层级
  - 优化查询路由

#### 性能扩容
- **触发条件**: 响应时间 > 1000ms
- **扩容动作**:
  - 资源重新分配
  - 查询优化
  - 缓存策略调整

### 扩容实施流程

1. **监控检测** → 2. **策略分析** → 3. **自动应用** → 4. **效果验证** → 5. **回滚准备**

---

## 📚 API参考

### 核心API端点

#### 统计数据API
```http
GET /api/universal-questionnaire/statistics/{questionnaireId}
```

#### 性能监控API
```http
GET /api/universal-questionnaire/performance/metrics
GET /api/universal-questionnaire/performance/realtime
GET /api/universal-questionnaire/performance/baseline
```

#### 缓存管理API
```http
GET /api/universal-questionnaire/cache/usage-patterns
GET /api/universal-questionnaire/cache/optimization-recommendations
POST /api/universal-questionnaire/cache/apply-optimizations
```

#### 智能扩容API
```http
GET /api/universal-questionnaire/scaling/analysis
POST /api/universal-questionnaire/scaling/apply
GET /api/universal-questionnaire/scaling/history
```

#### 定时任务API
```http
GET /api/universal-questionnaire/cron/status
GET /api/universal-questionnaire/cron/history/{pattern}
POST /api/universal-questionnaire/cron/trigger/{pattern}
```

---

## 📝 更新日志

### v2.0.0 (2025-09-21)
- ✅ 实现多级专用表架构
- ✅ 部署智能同步系统
- ✅ 集成性能监控
- ✅ 添加自动扩容机制
- ✅ 完善监控告警体系

### 下一版本计划
- 🔄 机器学习驱动的预测扩容
- 🔄 跨地域数据同步
- 🔄 高级数据分析引擎
- 🔄 实时流处理能力

---

## 🛠️ 快速故障排除指南

### 一键诊断命令

```bash
# 运行完整维护检查
cd backend && npx ts-node scripts/databaseMaintenance.ts

# 检查API健康状态
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/performance/metrics?timeRange=1h"

# 检查缓存状态
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/cache/usage-patterns?timeRange=24h"

# 检查同步任务
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/cron/status"
```

### 常用修复命令

```bash
# 手动触发数据同步
curl -X POST "${API_BASE_URL}/api/universal-questionnaire/cron/trigger/*/5 * * * *"

# 应用缓存优化
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/cache/optimization-recommendations"

# 智能扩容分析
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/scaling/analysis"

# 数据一致性检查
curl -X GET "${API_BASE_URL}/api/universal-questionnaire/consistency-check/employment-survey-2024"
```

### 紧急联系方式

- **技术负责人**: [联系信息]
- **系统管理员**: [联系信息]
- **24小时支持**: [联系信息]

---

## 📋 维护检查清单

### 每日检查 ✅
- [ ] API响应时间 < 500ms
- [ ] 缓存命中率 > 90%
- [ ] 错误率 < 1%
- [ ] 所有同步任务正常运行
- [ ] 数据一致性检查通过

### 每周检查 ✅
- [ ] 性能基准更新
- [ ] 扩容分析报告
- [ ] 数据质量评估
- [ ] 存储使用率检查
- [ ] 索引效率分析

### 每月检查 ✅
- [ ] 数据库优化 (ANALYZE, VACUUM)
- [ ] 索引重建
- [ ] 历史数据归档
- [ ] 备份验证
- [ ] 安全审计

---

**📞 技术支持**: 如有问题请联系开发团队或查看项目文档。
