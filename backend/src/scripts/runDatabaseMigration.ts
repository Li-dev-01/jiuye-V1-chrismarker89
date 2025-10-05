/**
 * 数据库迁移脚本
 * 用于在Cloudflare D1数据库中创建问卷2的宽表和静态表
 */

console.log(`
==============================================
问卷2数据库迁移脚本
==============================================

本脚本将执行以下操作：
1. 创建问卷2宽表（questionnaire2_wide_table）
2. 创建7个静态分析表
3. 创建同步日志表

由于Cloudflare D1的限制，请手动执行以下步骤：

==============================================
步骤1：创建宽表
==============================================

使用Wrangler CLI执行：

npx wrangler d1 execute college-employment-survey --remote --file=src/migrations/create_q2_wide_table.sql

或者在Cloudflare Dashboard中执行SQL：
https://dash.cloudflare.com/

==============================================
步骤2：创建静态分析表
==============================================

使用Wrangler CLI执行：

npx wrangler d1 execute college-employment-survey --remote --file=src/migrations/create_q2_static_tables.sql

==============================================
步骤3：验证表创建
==============================================

执行以下SQL验证：

SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'q2_%';
SELECT name FROM sqlite_master WHERE type='table' AND name='questionnaire2_wide_table';

预期结果：
- questionnaire2_wide_table
- q2_basic_stats
- q2_economic_analysis
- q2_employment_analysis
- q2_discrimination_analysis
- q2_confidence_analysis
- q2_fertility_analysis
- q2_cross_analysis
- q2_sync_log

==============================================
步骤4：同步数据到静态表
==============================================

调用API端点：

curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/questionnaire-v2/sync-static-tables"

==============================================
`);

