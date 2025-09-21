#!/bin/bash
echo "🚀 开始导入测试数据..."

echo "📊 导入 users..."
wrangler d1 execute college-employment-survey --remote --file="users.sql" --yes

echo "✅ 导入完成!"
