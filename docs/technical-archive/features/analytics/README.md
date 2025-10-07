# 📊 数据分析系统功能文档

> **模块**: 数据统计与可视化分析  
> **完成度**: 100%  
> **最后更新**: 2025年10月7日

## 📋 模块概述

### 基本信息
- **模块名称**: 数据分析与可视化系统
- **负责范围**: 统计分析、数据可视化、实时监控、报表生成
- **技术栈**: React + ECharts + D1 + Cloudflare Analytics
- **依赖模块**: 问卷系统、故事系统、认证系统

### 系统架构
数据分析系统采用**多维度分析 + 实时统计**架构：

```
数据采集层
├── 问卷数据（V1 + V2）
├── 故事数据
├── 用户行为数据
└── 系统运行数据

统计计算层
├── 实时统计（触发器）
├── 定时聚合（批处理）
├── 缓存优化（Redis）
└── 交叉分析（多维度）

可视化展示层
├── 统计看板
├── 图表组件
├── 报表生成
└── 数据导出
```

---

## 🎯 功能清单

### 1. 统计看板

#### 功能ID: ANALYTICS-001
- **角色**: 管理员、审核员
- **用途**: 查看系统整体数据统计
- **API端点**: 
  - `GET /api/analytics/dashboard` - 仪表板数据
  - `GET /api/analytics/real-data` - 真实数据概览
  - `GET /api/simple-admin/dashboard` - 管理员仪表板
- **数据库表**: 
  - `universal_questionnaire_responses` - 问卷响应
  - `valid_stories` - 有效故事
  - `users` - 用户数据
- **前端页面**: 
  - `/admin/dashboard` - 管理员仪表板
  - `/reviewer/dashboard` - 审核员仪表板
- **测试覆盖**: ✅ 完整测试
- **相关文档**: [可视化修复](../../../../VISUALIZATION_FIX_REPORT.md)

#### 统计指标

**核心指标**:
```typescript
interface DashboardStats {
  // 内容统计
  totalQuestionnaires: number;  // 问卷总数
  totalStories: number;         // 故事总数
  totalHeartVoices: number;     // 心声总数
  totalUsers: number;           // 用户总数
  
  // 今日数据
  todayQuestionnaires: number;
  todayStories: number;
  todayUsers: number;
  
  // 审核统计
  pendingReviews: number;       // 待审核数
  approvedToday: number;        // 今日通过数
  rejectedToday: number;        // 今日拒绝数
  approvalRate: number;         // 通过率
  
  // 系统指标
  activeUsers: number;          // 活跃用户
  responseTime: number;         // 平均响应时间
  errorRate: number;            // 错误率
}
```

**实现示例**:
```typescript
async function getDashboardStats(db: D1Database): Promise<DashboardStats> {
  // 并行查询所有统计数据
  const [
    questionnaireCount,
    storyCount,
    userCount,
    todayData,
    reviewStats
  ] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM universal_questionnaire_responses').first(),
    db.prepare('SELECT COUNT(*) as count FROM valid_stories').first(),
    db.prepare('SELECT COUNT(*) as count FROM users').first(),
    getTodayStats(db),
    getReviewStats(db)
  ]);
  
  return {
    totalQuestionnaires: questionnaireCount.count,
    totalStories: storyCount.count,
    totalUsers: userCount.count,
    ...todayData,
    ...reviewStats
  };
}
```

---

### 2. 问卷数据可视化

#### 功能ID: ANALYTICS-002
- **角色**: 所有用户
- **用途**: 可视化展示问卷统计结果
- **API端点**: 
  - `GET /api/universal-questionnaire/statistics/:questionnaireId` - 问卷统计
  - `GET /api/analytics/cross-analysis` - 交叉分析
  - `GET /api/visualization/charts/:questionId` - 图表数据
- **数据库表**: 
  - `questionnaire_v2_statistics` - V2统计表
  - `questionnaire_v2_economic_pressure_stats` - 经济压力统计
  - `questionnaire_v2_employment_confidence_stats` - 就业信心统计
- **前端页面**: 
  - `/analytics/visualization` - 数据可视化页
  - `/questionnaire-v2/results` - V2结果展示
- **测试覆盖**: ✅ 完整测试
- **相关文档**: [可视化系统指南](../../../../frontend/src/pages/analytics/README.md)

#### 六维度分析框架

**1. 就业形势总览**:
- 当前就业状态分布
- 就业难度感知
- 薪资水平分布
- 求职时长统计

**2. 人口结构分析**:
- 年龄分布
- 性别比例
- 学历层次
- 专业分布

**3. 就业市场深度分析**:
- 行业分布
- 薪资区间分析
- 求职渠道效果
- 地域就业差异

**4. 学生就业准备**:
- 实习经验统计
- 技能准备情况
- 职业规划清晰度
- 求职信心指数

**5. 生活成本与压力**:
- 住房支出占比
- 经济压力等级
- 债务情况分析
- 生活质量评分

**6. 政策洞察与建议**:
- 政策效果评价
- 培训需求分析
- 改进建议汇总
- 支持措施期望

#### 图表类型

```typescript
type ChartType = 
  | 'pie'           // 饼图 - 分类占比
  | 'bar'           // 柱状图 - 数量对比
  | 'line'          // 折线图 - 趋势变化
  | 'radar'         // 雷达图 - 多维评估
  | 'scatter'       // 散点图 - 相关性分析
  | 'heatmap'       // 热力图 - 密度分布
  | 'funnel'        // 漏斗图 - 转化流程
  | 'gauge';        // 仪表盘 - 单一指标
```

**图表配置示例**:
```typescript
const chartConfig = {
  type: 'pie',
  title: '就业状态分布',
  data: [
    { name: '已就业', value: 450 },
    { name: '待就业', value: 280 },
    { name: '继续深造', value: 120 },
    { name: '创业', value: 50 }
  ],
  options: {
    legend: { show: true },
    tooltip: { show: true },
    label: { show: true, formatter: '{b}: {d}%' }
  }
};
```

---

### 3. 实时数据监控

#### 功能ID: ANALYTICS-003
- **角色**: 管理员、超级管理员
- **用途**: 实时监控系统运行状态
- **API端点**: 
  - `GET /api/analytics/cloudflare/metrics` - Cloudflare指标
  - `GET /api/analytics/real-time-stats` - 实时统计
  - `GET /api/participation-stats/summary` - 参与统计
- **数据库表**: 
  - `page_participation_stats` - 页面参与统计
  - `user_activity_logs` - 用户活动日志
- **前端页面**: 
  - `/admin/monitoring` - 系统监控页
  - `/super-admin/analytics` - 高级分析
- **测试覆盖**: ✅ 完整测试
- **相关文档**: [项目统计方案](../../../../PROJECT-STATISTICS-SOLUTION-COMPLETE-REPORT.md)

#### 监控指标

**系统性能**:
```typescript
interface SystemMetrics {
  // 请求统计
  totalRequests: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  
  // 错误统计
  errorCount: number;
  errorRate: number;
  errorTypes: Record<string, number>;
  
  // 数据库性能
  dbQueryTime: number;
  dbConnectionPool: number;
  slowQueries: number;
  
  // 缓存命中
  cacheHitRate: number;
  cacheSize: number;
}
```

**用户行为**:
```typescript
interface UserBehaviorMetrics {
  // 活跃度
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  
  // 页面访问
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  
  // 功能使用
  questionnaireSubmissions: number;
  storyPublications: number;
  interactions: number;
}
```

**Cloudflare Analytics集成**:
```typescript
class AnalyticsQueryService {
  async getRequestStats(timeRange: string) {
    const query = `
      SELECT
        sum(requests) as totalRequests,
        avg(duration) as avgDuration,
        sum(errors) as totalErrors
      FROM httpRequestsAdaptiveGroups
      WHERE datetime >= now() - interval '${timeRange}'
    `;
    
    return await this.executeQuery(query);
  }
  
  async getGeographyStats(timeRange: string) {
    // 地理分布统计
  }
  
  async getDatabaseStats(timeRange: string) {
    // 数据库性能统计
  }
}
```

---

### 4. 交叉分析

#### 功能ID: ANALYTICS-004
- **角色**: 管理员、研究人员
- **用途**: 多维度交叉数据分析
- **API端点**: 
  - `POST /api/analytics/cross-analysis` - 交叉分析
  - `GET /api/analytics/correlation` - 相关性分析
- **数据库表**: 
  - 使用问卷和故事数据进行交叉查询
- **前端页面**: 
  - `/analytics/cross-analysis` - 交叉分析页
- **测试覆盖**: ✅ 单元测试

#### 分析维度

**常见交叉分析**:
```typescript
// 学历 × 就业状态
const educationEmployment = await crossAnalysis({
  primary: 'education_level',
  secondary: 'employment_status'
});

// 专业 × 薪资水平
const majorSalary = await crossAnalysis({
  primary: 'major',
  secondary: 'salary_range'
});

// 地区 × 就业难度
const locationDifficulty = await crossAnalysis({
  primary: 'location',
  secondary: 'job_hunting_difficulty'
});
```

**相关性分析**:
```typescript
interface CorrelationAnalysis {
  variable1: string;
  variable2: string;
  correlationCoefficient: number;  // -1 到 1
  pValue: number;                  // 显著性
  sampleSize: number;
  interpretation: string;
}
```

---

### 5. 报表生成

#### 功能ID: ANALYTICS-005
- **角色**: 管理员
- **用途**: 生成分析报告
- **API端点**: 
  - `GET /api/visualization/employment-report` - 就业形势报告
  - `POST /api/analytics/export` - 数据导出
- **数据库表**: 
  - 聚合多个统计表数据
- **前端页面**: 
  - `/analytics/reports` - 报表中心
- **测试覆盖**: ✅ 基础测试

#### 报告类型

**就业形势报告**:
```typescript
interface EmploymentReport {
  overview: {
    totalSamples: number;
    reportPeriod: string;
    keyFindings: string[];
  };
  
  employmentRate: {
    overall: number;
    byEducation: Record<string, number>;
    byMajor: Record<string, number>;
    byLocation: Record<string, number>;
  };
  
  salaryAnalysis: {
    median: number;
    average: number;
    distribution: Array<{ range: string; count: number }>;
  };
  
  challenges: {
    topChallenges: Array<{ challenge: string; percentage: number }>;
    supportNeeds: Array<{ need: string; percentage: number }>;
  };
  
  recommendations: string[];
}
```

**数据导出格式**:
- CSV - 表格数据
- Excel - 多sheet报表
- PDF - 可视化报告
- JSON - 原始数据

---

## 📊 数据库设计

### 统计缓存表
```sql
CREATE TABLE questionnaire_v2_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionnaire_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0.0,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(questionnaire_id, dimension, metric_name, metric_value)
);
```

### 页面参与统计表
```sql
CREATE TABLE page_participation_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_name TEXT NOT NULL,
  visit_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_duration REAL DEFAULT 0.0,
  bounce_rate REAL DEFAULT 0.0,
  date DATE NOT NULL,
  
  UNIQUE(page_name, date)
);
```

---

## ⚠️ 常见问题排查

### 问题1: 图表数据不显示

**原因**: 统计表数据未生成或API调用失败

**解决方案**:
```bash
# 1. 检查统计表数据
SELECT COUNT(*) FROM questionnaire_v2_statistics;

# 2. 手动触发统计计算
POST /api/universal-questionnaire/trigger-statistics

# 3. 检查API响应
curl https://api.domain.com/api/universal-questionnaire/statistics/employment-survey-2024
```

---

### 问题2: 统计数据不准确

**原因**: 缓存未更新或计算逻辑错误

**解决方案**:
```sql
-- 1. 清除统计缓存
DELETE FROM questionnaire_v2_statistics
WHERE calculated_at < datetime('now', '-1 day');

-- 2. 重新计算统计
-- 提交新问卷会自动触发统计更新

-- 3. 验证数据一致性
SELECT 
  (SELECT COUNT(*) FROM universal_questionnaire_responses) as total_responses,
  (SELECT SUM(count) FROM questionnaire_v2_statistics WHERE dimension = 'employment_status') as stats_total;
```

---

### 问题3: 实时监控延迟

**原因**: Cloudflare Analytics API限流或网络延迟

**解决方案**:
```typescript
// 1. 增加缓存时间
const CACHE_TTL = 5 * 60; // 5分钟

// 2. 使用本地聚合
const localStats = await db.query(`
  SELECT COUNT(*) as count
  FROM user_activity_logs
  WHERE created_at > datetime('now', '-1 hour')
`);

// 3. 降低刷新频率
const REFRESH_INTERVAL = 30000; // 30秒
```

---

## 📈 性能指标

- **统计查询速度**: < 200ms
- **图表渲染时间**: < 500ms
- **报表生成时间**: < 5s
- **实时数据延迟**: < 10s
- **并发查询支持**: 100+ req/s

---

## 🎯 最佳实践

### 1. 数据采集
- 使用触发器自动更新统计
- 定时批处理聚合历史数据
- 保留原始数据用于回溯

### 2. 性能优化
- 统计表缓存热点数据
- 使用索引加速查询
- 分页加载大数据集

### 3. 可视化设计
- 选择合适的图表类型
- 提供交互式筛选
- 支持数据钻取

### 4. 数据质量
- 验证数据完整性
- 标记异常数据
- 提供数据质量报告

---

## 📚 相关文档

- [可视化修复报告](../../../../VISUALIZATION_FIX_REPORT.md)
- [可视化系统指南](../../../../frontend/src/pages/analytics/README.md)
- [项目统计方案](../../../../PROJECT-STATISTICS-SOLUTION-COMPLETE-REPORT.md)
- [问卷系统](../questionnaire/README.md)
- [数据库设计](../../database/TABLES_INDEX.md)
