#!/bin/bash
# 问卷2测试数据导入脚本
# 使用方法: bash import-questionnaire2-data.sh [database-name]

DATABASE_NAME=${1:-"college-employment-survey"}

echo "🚀 开始导入问卷2测试数据到数据库: $DATABASE_NAME"

echo "📊 导入用户数据..."
wrangler d1 execute $DATABASE_NAME --file=01-questionnaire2-users.sql

echo "📋 导入问卷回答数据..."
wrangler d1 execute $DATABASE_NAME --file=02-questionnaire2-responses.sql

echo "📝 导入详细答案数据..."
wrangler d1 execute $DATABASE_NAME --file=03-questionnaire2-answers.sql

echo "📈 导入分析数据..."
wrangler d1 execute $DATABASE_NAME --file=04-questionnaire2-analytics.sql

echo "✅ 问卷2测试数据导入完成！"

echo "🔍 验证导入结果..."
echo "用户数量:"
wrangler d1 execute $DATABASE_NAME --command="SELECT COUNT(*) as user_count FROM users WHERE email LIKE 'q2_test_%' AND is_test_data = 1;"

echo "问卷数量:"
wrangler d1 execute $DATABASE_NAME --command="SELECT COUNT(*) as response_count FROM questionnaire_v2_responses WHERE is_test_data = 1;"

echo "答案数量:"
wrangler d1 execute $DATABASE_NAME --command="SELECT COUNT(*) as answer_count FROM questionnaire_v2_answers WHERE is_test_data = 1;"

echo "分析数据数量:"
wrangler d1 execute $DATABASE_NAME --command="SELECT COUNT(*) as analytics_count FROM questionnaire_v2_analytics WHERE is_test_data = 1;"
