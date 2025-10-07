#!/bin/bash

# 测试账户管理操作功能
# 包括：停用/启用账号、删除账号、删除邮箱

API_BASE="https://employment-survey-api-prod.chrismarker89.workers.dev"

echo "========================================="
echo "账户管理操作功能测试"
echo "========================================="
echo ""

# 1. 获取超级管理员token
echo "1. 登录超级管理员..."
SUPER_ADMIN_TOKEN=$(curl -s -X POST "${API_BASE}/api/simple-auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"admin123"}' | jq -r '.data.token')

if [ -z "$SUPER_ADMIN_TOKEN" ] || [ "$SUPER_ADMIN_TOKEN" = "null" ]; then
  echo "❌ 超级管理员登录失败"
  exit 1
fi

echo "✅ 超级管理员登录成功"
echo "Token: ${SUPER_ADMIN_TOKEN:0:30}..."
echo ""

# 2. 获取账户列表
echo "2. 获取账户列表..."
ACCOUNTS=$(curl -s "${API_BASE}/api/admin/account-management/accounts" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN")

echo "账户列表："
echo "$ACCOUNTS" | jq '.data.emails[] | {email: .email, accountCount: (.accounts | length), isActive: .isActive}'
echo ""

# 3. 测试停用/启用邮箱
echo "3. 测试停用/启用邮箱..."
FIRST_EMAIL_ID=$(echo "$ACCOUNTS" | jq -r '.data.emails[0].id')
FIRST_EMAIL=$(echo "$ACCOUNTS" | jq -r '.data.emails[0].email')
FIRST_EMAIL_STATUS=$(echo "$ACCOUNTS" | jq -r '.data.emails[0].isActive')

echo "选择邮箱: $FIRST_EMAIL (ID: $FIRST_EMAIL_ID, 当前状态: $FIRST_EMAIL_STATUS)"

# 注意：这里只是测试API调用，不会真正执行
echo "测试API调用（不执行）："
echo "PUT ${API_BASE}/api/admin/account-management/emails/${FIRST_EMAIL_ID}/toggle-status"
echo "Body: {\"isActive\": $([ "$FIRST_EMAIL_STATUS" = "true" ] && echo "false" || echo "true")}"
echo ""

# 4. 测试停用/启用角色账号
echo "4. 测试停用/启用角色账号..."
FIRST_ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.data.emails[0].accounts[0].id')
FIRST_ACCOUNT_USERNAME=$(echo "$ACCOUNTS" | jq -r '.data.emails[0].accounts[0].username')
FIRST_ACCOUNT_STATUS=$(echo "$ACCOUNTS" | jq -r '.data.emails[0].accounts[0].isActive')

echo "选择账号: $FIRST_ACCOUNT_USERNAME (ID: $FIRST_ACCOUNT_ID, 当前状态: $FIRST_ACCOUNT_STATUS)"

echo "测试API调用（不执行）："
echo "PUT ${API_BASE}/api/admin/account-management/accounts/${FIRST_ACCOUNT_ID}/toggle-status"
echo "Body: {\"isActive\": $([ "$FIRST_ACCOUNT_STATUS" = "true" ] && echo "false" || echo "true")}"
echo ""

# 5. 显示API接口总结
echo "========================================="
echo "API接口总结"
echo "========================================="
echo ""

echo "1. 停用/启用邮箱："
echo "   PUT ${API_BASE}/api/admin/account-management/emails/{emailId}/toggle-status"
echo "   Body: {\"isActive\": true/false}"
echo ""

echo "2. 删除邮箱："
echo "   DELETE ${API_BASE}/api/admin/account-management/emails/{emailId}"
echo ""

echo "3. 停用/启用角色账号："
echo "   PUT ${API_BASE}/api/admin/account-management/accounts/{accountId}/toggle-status"
echo "   Body: {\"isActive\": true/false}"
echo ""

echo "4. 删除角色账号："
echo "   DELETE ${API_BASE}/api/admin/account-management/accounts/{accountId}"
echo ""

echo "========================================="
echo "前端功能位置"
echo "========================================="
echo ""

echo "1. 邮箱级别操作（主表格）："
echo "   - 添加角色：蓝色链接按钮"
echo "   - 停用/启用：普通链接按钮"
echo "   - 删除邮箱：红色危险按钮（带确认对话框）"
echo ""

echo "2. 角色账号级别操作（展开行）："
echo "   - 停用/启用：小号普通链接按钮"
echo "   - 删除：小号红色危险按钮（带删除图标和确认对话框）"
echo ""

echo "========================================="
echo "测试完成"
echo "========================================="
echo ""

echo "📝 注意事项："
echo "1. 所有删除操作都有二次确认对话框"
echo "2. 停用邮箱会影响该邮箱下的所有角色账号"
echo "3. 删除邮箱会级联删除所有关联的角色账号"
echo "4. 所有操作都需要超级管理员权限"
echo ""

echo "🌐 访问地址："
echo "- 本地开发：http://localhost:3000/admin/email-role-accounts"
echo "- 生产环境：https://90d0884d.reviewer-admin-dashboard.pages.dev/admin/email-role-accounts"
echo ""

