#!/bin/bash
echo "🚀 开始导入生产环境测试数据..."

echo "1. 导入用户数据..."
wrangler d1 execute college-employment-survey --remote --file="01-users.sql" --yes

echo "2. 导入问卷数据..."
wrangler d1 execute college-employment-survey --remote --file="02-questionnaires.sql" --yes

echo "3. 导入分析数据..."
wrangler d1 execute college-employment-survey --remote --file="03-analytics.sql" --yes

echo "✅ 导入完成！"
