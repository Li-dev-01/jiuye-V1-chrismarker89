#!/bin/bash

echo "🔧 添加 requires_2fa 列到 login_sessions 表..."
echo ""

# 添加 requires_2fa 列
npx wrangler d1 execute college-employment-survey --remote --command "ALTER TABLE login_sessions ADD COLUMN requires_2fa INTEGER DEFAULT 0;"

echo ""
echo "✅ 列添加完成！"
echo ""
echo "🔍 验证表结构..."
npx wrangler d1 execute college-employment-survey --remote --command "PRAGMA table_info(login_sessions);"

