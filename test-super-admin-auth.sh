#!/bin/bash

# 测试超级管理员认证
# 用于诊断为什么Google OAuth登录后无法访问超级管理员API

API_URL="https://employment-survey-api-dev.chrismarker89.workers.dev"

echo "🔍 测试超级管理员API认证..."
echo ""

# 测试1: 使用旧格式token
echo "📝 测试1: 使用旧格式token (mgmt_token_SUPER_ADMIN_xxx)"
OLD_TOKEN="mgmt_token_SUPER_ADMIN_$(date +%s)"
echo "Token: $OLD_TOKEN"
echo ""

curl -X GET "$API_URL/api/super-admin/project/status" \
  -H "Authorization: Bearer $OLD_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "---"
echo ""

# 测试2: 查询数据库中的会话
echo "📝 测试2: 查询数据库中的超级管理员会话"
echo ""

npx wrangler d1 execute college-employment-survey \
  --remote \
  --command "SELECT session_id, email, role, is_active, expires_at, created_at FROM login_sessions WHERE role = 'super_admin' ORDER BY created_at DESC LIMIT 5"

echo ""
echo "---"
echo ""

# 测试3: 如果有会话ID，使用它测试
echo "📝 测试3: 请手动输入从浏览器localStorage获取的super_admin_token"
echo "提示: 在浏览器控制台执行 localStorage.getItem('super_admin_token')"
echo ""
read -p "请输入token (或按Enter跳过): " USER_TOKEN

if [ -n "$USER_TOKEN" ]; then
  echo ""
  echo "使用token: ${USER_TOKEN:0:20}..."
  echo ""
  
  curl -X GET "$API_URL/api/super-admin/project/status" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | jq '.'
else
  echo "跳过测试3"
fi

echo ""
echo "✅ 测试完成"

