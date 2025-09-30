#!/bin/bash

# 邮箱与角色账号系统数据库初始化脚本

echo "🚀 开始初始化邮箱与角色账号系统..."

# 执行SQL文件
echo "📝 执行数据库Schema..."
npx wrangler d1 execute college-employment-survey \
  --remote \
  --file=database/email-role-account-schema.sql

if [ $? -eq 0 ]; then
  echo "✅ 数据库Schema执行成功"
else
  echo "❌ 数据库Schema执行失败"
  exit 1
fi

# 验证表创建
echo ""
echo "🔍 验证表创建..."
npx wrangler d1 execute college-employment-survey \
  --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('email_whitelist', 'role_accounts', 'login_sessions', 'login_attempts', 'two_factor_verifications', 'account_audit_logs')"

# 查看邮箱白名单
echo ""
echo "📧 邮箱白名单："
npx wrangler d1 execute college-employment-survey \
  --remote \
  --command "SELECT id, email, is_active, two_factor_enabled, created_by, notes FROM email_whitelist ORDER BY id"

# 查看角色账号
echo ""
echo "👤 角色账号："
npx wrangler d1 execute college-employment-survey \
  --remote \
  --command "SELECT id, email, role, username, display_name, permissions, allow_password_login, is_active FROM role_accounts ORDER BY email, role"

# 统计信息
echo ""
echo "📊 统计信息："
npx wrangler d1 execute college-employment-survey \
  --remote \
  --command "SELECT 
    (SELECT COUNT(*) FROM email_whitelist) as total_emails,
    (SELECT COUNT(*) FROM role_accounts) as total_accounts,
    (SELECT COUNT(*) FROM role_accounts WHERE role='super_admin') as super_admins,
    (SELECT COUNT(*) FROM role_accounts WHERE role='admin') as admins,
    (SELECT COUNT(*) FROM role_accounts WHERE role='reviewer') as reviewers"

# 显示一个邮箱多个角色的示例
echo ""
echo "🎯 一个邮箱多个角色示例："
npx wrangler d1 execute college-employment-survey \
  --remote \
  --command "SELECT email, COUNT(*) as role_count, GROUP_CONCAT(role, ', ') as roles 
    FROM role_accounts 
    GROUP BY email 
    HAVING COUNT(*) > 1"

echo ""
echo "✅ 初始化完成！"
echo ""
echo "📝 数据库结构："
echo "  - email_whitelist: 邮箱白名单（身份验证）"
echo "  - role_accounts: 角色账号（实际账户）"
echo "  - login_sessions: 登录会话"
echo "  - login_attempts: 登录尝试记录"
echo "  - two_factor_verifications: 2FA验证记录"
echo "  - account_audit_logs: 审计日志"
echo ""
echo "🎯 核心概念："
echo "  - 一个邮箱可以有多个角色账号"
echo "  - 邮箱用于Google OAuth身份验证"
echo "  - 角色账号是实际的系统账户"
echo "  - 登录时先选择角色，然后用邮箱验证"
echo ""

