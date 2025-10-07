#!/bin/bash

# 管理员认证系统测试脚本

echo "🧪 开始测试管理员认证系统..."
echo ""

# 配置
BACKEND_URL="https://employment-survey-api-prod.chrismarker89.workers.dev"
FRONTEND_URL="https://8b7c3c10.reviewer-admin-dashboard.pages.dev"
DB_NAME="college-employment-survey"

echo "📋 测试配置："
echo "  后端: $BACKEND_URL"
echo "  前端: $FRONTEND_URL"
echo "  数据库: $DB_NAME"
echo ""

# 测试1: 验证数据库表
echo "🗄️  测试1: 验证数据库表..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TABLES=$(npx wrangler d1 execute $DB_NAME --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'admin%'" 2>&1)

if echo "$TABLES" | grep -q "admin_whitelist"; then
  echo "✅ admin_whitelist 表存在"
else
  echo "❌ admin_whitelist 表不存在"
fi

if echo "$TABLES" | grep -q "admin_sessions"; then
  echo "✅ admin_sessions 表存在"
else
  echo "❌ admin_sessions 表不存在"
fi

if echo "$TABLES" | grep -q "admin_login_attempts"; then
  echo "✅ admin_login_attempts 表存在"
else
  echo "❌ admin_login_attempts 表不存在"
fi

if echo "$TABLES" | grep -q "admin_audit_logs"; then
  echo "✅ admin_audit_logs 表存在"
else
  echo "❌ admin_audit_logs 表不存在"
fi

echo ""

# 测试2: 验证超级管理员白名单
echo "👥 测试2: 验证超级管理员白名单..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WHITELIST=$(npx wrangler d1 execute $DB_NAME --remote --command="SELECT email, role, is_active FROM admin_whitelist WHERE role='super_admin'" 2>&1)

if echo "$WHITELIST" | grep -q "chrismarker89@gmail.com"; then
  echo "✅ chrismarker89@gmail.com 已添加"
else
  echo "❌ chrismarker89@gmail.com 未找到"
fi

if echo "$WHITELIST" | grep -q "aibook2099@gmail.com"; then
  echo "✅ aibook2099@gmail.com 已添加"
else
  echo "❌ aibook2099@gmail.com 未找到"
fi

if echo "$WHITELIST" | grep -q "justpm2099@gmail.com"; then
  echo "✅ justpm2099@gmail.com 已添加"
else
  echo "❌ justpm2099@gmail.com 未找到"
fi

echo ""

# 测试3: 测试后端健康检查
echo "🏥 测试3: 测试后端健康检查..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")

if echo "$HEALTH_RESPONSE" | grep -q "success"; then
  echo "✅ 后端健康检查通过"
  echo "   响应: $(echo $HEALTH_RESPONSE | jq -r '.data.status' 2>/dev/null || echo 'OK')"
else
  echo "❌ 后端健康检查失败"
fi

echo ""

# 测试4: 测试前端页面可访问性
echo "🌐 测试4: 测试前端页面可访问性..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 测试统一登录页
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/login-unified")
if [ "$LOGIN_STATUS" = "200" ]; then
  echo "✅ 统一登录页面可访问 ($FRONTEND_URL/login-unified)"
else
  echo "⚠️  统一登录页面返回状态码: $LOGIN_STATUS"
fi

# 测试OAuth回调页
CALLBACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/auth/google/callback")
if [ "$CALLBACK_STATUS" = "200" ]; then
  echo "✅ OAuth回调页面可访问 ($FRONTEND_URL/auth/google/callback)"
else
  echo "⚠️  OAuth回调页面返回状态码: $CALLBACK_STATUS"
fi

echo ""

# 测试5: 测试API端点（无需认证的端点）
echo "🔌 测试5: 测试API端点..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 测试白名单API（应该返回401未授权）
WHITELIST_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/admin/whitelist")
if [ "$WHITELIST_API_STATUS" = "401" ]; then
  echo "✅ 白名单API正确返回401（需要认证）"
else
  echo "⚠️  白名单API返回状态码: $WHITELIST_API_STATUS"
fi

echo ""

# 测试6: 数据库统计
echo "📊 测试6: 数据库统计..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_USERS=$(npx wrangler d1 execute $DB_NAME --remote --command="SELECT COUNT(*) as count FROM admin_whitelist" 2>&1 | grep -oP '\d+' | tail -1)
SUPER_ADMINS=$(npx wrangler d1 execute $DB_NAME --remote --command="SELECT COUNT(*) as count FROM admin_whitelist WHERE role='super_admin'" 2>&1 | grep -oP '\d+' | tail -1)
ACTIVE_USERS=$(npx wrangler d1 execute $DB_NAME --remote --command="SELECT COUNT(*) as count FROM admin_whitelist WHERE is_active=1" 2>&1 | grep -oP '\d+' | tail -1)

echo "  总用户数: ${TOTAL_USERS:-N/A}"
echo "  超级管理员: ${SUPER_ADMINS:-N/A}"
echo "  激活用户: ${ACTIVE_USERS:-N/A}"

echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 测试完成！"
echo ""
echo "📋 下一步操作："
echo "  1. 访问统一登录页面: $FRONTEND_URL/login-unified"
echo "  2. 使用Gmail白名单账号登录（Google OAuth）"
echo "  3. 访问账户管理页面: $FRONTEND_URL/admin/account-management"
echo "  4. 创建审核员和管理员账户"
echo "  5. 为超级管理员启用2FA"
echo ""
echo "🔐 超级管理员白名单："
echo "  - chrismarker89@gmail.com"
echo "  - aibook2099@gmail.com"
echo "  - justpm2099@gmail.com"
echo ""
echo "📚 查看完整文档: DEPLOYMENT-SUCCESS-REPORT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

