#!/bin/bash

echo "🔍 检查Google OAuth设置..."
echo ""

# 检查邮箱白名单
echo "📧 检查邮箱白名单..."
npx wrangler d1 execute college-employment-survey --remote --command "SELECT email, is_active, two_factor_enabled, created_at FROM email_whitelist WHERE is_active = 1;"

echo ""
echo "👤 检查角色账号..."
npx wrangler d1 execute college-employment-survey --remote --command "SELECT id, email, role, username, display_name, is_active FROM role_accounts WHERE is_active = 1;"

echo ""
echo "✅ 检查完成！"

