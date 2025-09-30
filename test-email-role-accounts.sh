#!/bin/bash

# 邮箱与角色账号系统测试脚本

API_BASE="https://employment-survey-api-prod.chrismarker89.workers.dev"

echo "🧪 邮箱与角色账号系统测试"
echo "================================"
echo ""

# 测试1: 获取所有账号
echo "📋 测试1: 获取所有邮箱和角色账号"
echo "--------------------------------"
curl -s "${API_BASE}/api/admin/account-management/accounts" | jq '{
  success: .success,
  total_emails: (.data.emails | length),
  emails: .data.emails | map({
    email: .email,
    account_count: (.accounts | length),
    roles: (.accounts | map(.role))
  })
}'
echo ""

# 测试2: 查看一个邮箱多个角色的情况
echo "📊 测试2: 查看一个邮箱多个角色的情况"
echo "--------------------------------"
curl -s "${API_BASE}/api/admin/account-management/accounts" | jq '.data.emails | map(select((.accounts | length) > 1)) | map({
  email: .email,
  account_count: (.accounts | length),
  roles: (.accounts | map(.role)),
  usernames: (.accounts | map(.username))
})'
echo ""

# 测试3: 统计角色分布
echo "📈 测试3: 统计角色分布"
echo "--------------------------------"
curl -s "${API_BASE}/api/admin/account-management/accounts" | jq '{
  total_emails: (.data.emails | length),
  total_accounts: (.data.emails | map(.accounts | length) | add),
  super_admins: (.data.emails | map(.accounts | map(select(.role == "super_admin"))) | flatten | length),
  admins: (.data.emails | map(.accounts | map(select(.role == "admin"))) | flatten | length),
  reviewers: (.data.emails | map(.accounts | map(select(.role == "reviewer"))) | flatten | length)
}'
echo ""

# 测试4: 查看test@gmail.com的所有角色
echo "🔍 测试4: 查看test@gmail.com的所有角色"
echo "--------------------------------"
curl -s "${API_BASE}/api/admin/account-management/accounts" | jq '.data.emails | map(select(.email == "test@gmail.com")) | .[0] | {
  email: .email,
  account_count: (.accounts | length),
  accounts: .accounts | map({
    role: .role,
    username: .username,
    displayName: .displayName,
    permissions: .permissions
  })
}'
echo ""

# 测试5: 创建角色账号（示例 - 需要认证token）
echo "📝 测试5: 创建角色账号API格式"
echo "--------------------------------"
echo "POST ${API_BASE}/api/admin/account-management/accounts"
echo ""
echo "请求体示例（单个角色）:"
cat << 'EOF'
{
  "email": "newuser@gmail.com",
  "role": "admin",
  "displayName": "New Admin User",
  "permissions": ["manage_content", "view_analytics"],
  "allowPasswordLogin": true,
  "username": "newadmin",
  "password": "password123",
  "notes": "新创建的管理员账号"
}
EOF
echo ""

echo "请求体示例（多个角色 - 前端支持）:"
cat << 'EOF'
{
  "email": "newuser@gmail.com",
  "roles": ["reviewer", "admin"],  // 多选角色
  "displayName": "New User",
  "permissions": [],  // 使用默认权限
  "allowPasswordLogin": false,
  "notes": "新用户，拥有审核员和管理员两个角色"
}
EOF
echo ""

# 测试6: 查看数据库中的数据
echo "🗄️  测试6: 数据库验证"
echo "--------------------------------"
echo "邮箱白名单:"
npx wrangler d1 execute college-employment-survey --remote --command "SELECT id, email, is_active, (SELECT COUNT(*) FROM role_accounts WHERE role_accounts.email = email_whitelist.email) as account_count FROM email_whitelist ORDER BY id" 2>/dev/null
echo ""

echo "角色账号:"
npx wrangler d1 execute college-employment-survey --remote --command "SELECT id, email, role, username, display_name FROM role_accounts ORDER BY email, role" 2>/dev/null
echo ""

echo "一个邮箱多个角色统计:"
npx wrangler d1 execute college-employment-survey --remote --command "SELECT email, COUNT(*) as role_count, GROUP_CONCAT(role, ', ') as roles FROM role_accounts GROUP BY email ORDER BY role_count DESC" 2>/dev/null
echo ""

echo "✅ 测试完成！"
echo ""
echo "📝 总结:"
echo "  - API端点: ${API_BASE}/api/admin/account-management/accounts"
echo "  - 前端页面: https://0842d0aa.reviewer-admin-dashboard.pages.dev/admin/email-role-accounts"
echo "  - 支持功能: 查看所有账号、创建角色账号（支持多选）、删除角色账号"
echo ""

