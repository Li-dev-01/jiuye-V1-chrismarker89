#!/bin/bash

# "我的内容"页面问题深度分析脚本
# 通过实际测试验证问题根源

API_BASE_URL="https://employment-survey-api-prod.chrismarker89.workers.dev"
FRONTEND_URL="https://1c62525d.college-employment-survey-frontend-l84.pages.dev"

# 测试用户信息
TEST_USER_A="13800138000"
TEST_USER_B="1234"

echo "🔍 开始深度分析'我的内容'页面问题..."
echo "=================================================="

# 步骤1: 测试用户登录API
echo ""
echo "📋 步骤1: 测试用户登录API"
echo "🔍 测试用户: $TEST_USER_A / $TEST_USER_B"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/uuid/auth/semi-anonymous" \
  -H "Content-Type: application/json" \
  -d "{
    \"identityA\": \"$TEST_USER_A\",
    \"identityB\": \"$TEST_USER_B\",
    \"deviceInfo\": {}
  }")

echo "📊 登录API响应:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# 提取用户信息
USER_UUID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.uuid // empty' 2>/dev/null)
USER_TYPE=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.userType // empty' 2>/dev/null)
SESSION_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.session.sessionId // empty' 2>/dev/null)
DISPLAY_NAME=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.displayName // empty' 2>/dev/null)

echo ""
echo "🔑 提取的用户信息:"
echo "  - UUID: $USER_UUID"
echo "  - 用户类型: $USER_TYPE"
echo "  - 会话ID: $SESSION_ID"
echo "  - 显示名称: $DISPLAY_NAME"

if [ -z "$USER_UUID" ]; then
    echo "❌ 登录失败，无法获取用户UUID"
    exit 1
fi

# 步骤2: 测试用户故事API
echo ""
echo "📋 步骤2: 测试用户故事API"
echo "🔍 查询用户ID: $USER_UUID"

STORIES_RESPONSE=$(curl -s -X GET "$API_BASE_URL/api/stories/user/$USER_UUID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_ID")

echo "📊 用户故事API响应:"
echo "$STORIES_RESPONSE" | jq '.' 2>/dev/null || echo "$STORIES_RESPONSE"

# 分析故事数据
STORIES_SUCCESS=$(echo "$STORIES_RESPONSE" | jq -r '.success // false' 2>/dev/null)
STORIES_COUNT=$(echo "$STORIES_RESPONSE" | jq -r '.data.stories | length // 0' 2>/dev/null)

echo ""
echo "📚 故事数据分析:"
echo "  - API调用成功: $STORIES_SUCCESS"
echo "  - 故事数量: $STORIES_COUNT"

if [ "$STORIES_COUNT" -gt 0 ]; then
    FIRST_STORY_TITLE=$(echo "$STORIES_RESPONSE" | jq -r '.data.stories[0].title // "无标题"' 2>/dev/null)
    FIRST_STORY_STATUS=$(echo "$STORIES_RESPONSE" | jq -r '.data.stories[0].status // .data.stories[0].audit_status // "未知"' 2>/dev/null)
    echo "  - 第一个故事标题: $FIRST_STORY_TITLE"
    echo "  - 第一个故事状态: $FIRST_STORY_STATUS"
fi

# 步骤3: 测试前端页面访问
echo ""
echo "📋 步骤3: 测试前端页面访问"
echo "🔍 访问URL: $FRONTEND_URL/my-content"

PAGE_RESPONSE=$(curl -s "$FRONTEND_URL/my-content")
PAGE_STATUS=$?

echo "📊 前端页面访问结果:"
echo "  - HTTP状态: $PAGE_STATUS"
echo "  - 页面内容长度: $(echo "$PAGE_RESPONSE" | wc -c)"

# 检查页面内容
NEEDS_LOGIN=$(echo "$PAGE_RESPONSE" | grep -c "需要登录访问" || echo "0")
HAS_LOGIN_FORM=$(echo "$PAGE_RESPONSE" | grep -c "请使用A+B方式登录后查看您的内容" || echo "0")
HAS_EMPTY_CONTENT=$(echo "$PAGE_RESPONSE" | grep -c "暂无内容" || echo "0")

echo ""
echo "🔍 页面内容分析:"
echo "  - 包含'需要登录访问': $NEEDS_LOGIN"
echo "  - 包含登录提示: $HAS_LOGIN_FORM"
echo "  - 包含'暂无内容': $HAS_EMPTY_CONTENT"

# 步骤4: 测试不同的API端点
echo ""
echo "📋 步骤4: 测试其他相关API端点"

# 测试错误的API端点（前端之前调用的）
echo "🔍 测试错误的API端点: /api/user/content"
WRONG_API_RESPONSE=$(curl -s "$API_BASE_URL/api/user/content" \
  -H "Authorization: Bearer $SESSION_ID")

echo "📊 错误API端点响应:"
echo "$WRONG_API_RESPONSE" | jq '.' 2>/dev/null || echo "$WRONG_API_RESPONSE"

# 测试数据库状态
echo ""
echo "🔍 测试数据库状态"
DB_STATUS_RESPONSE=$(curl -s "$API_BASE_URL/api/stories/debug/status")

echo "📊 数据库状态响应:"
echo "$DB_STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$DB_STATUS_RESPONSE"

# 步骤5: 综合分析
echo ""
echo "📋 步骤5: 综合分析和诊断"
echo "=================================================="

echo "🔍 测试结果汇总:"
echo "  1. 用户登录API: $([ -n "$USER_UUID" ] && echo "✅ 成功" || echo "❌ 失败")"
echo "  2. 用户故事API: $([ "$STORIES_SUCCESS" = "true" ] && echo "✅ 成功" || echo "❌ 失败")"
echo "  3. 前端页面访问: $([ $PAGE_STATUS -eq 0 ] && echo "✅ 成功" || echo "❌ 失败")"
echo "  4. 页面显示状态: $([ $NEEDS_LOGIN -gt 0 ] && echo "❌ 需要登录" || echo "✅ 正常")"

echo ""
echo "🔍 问题诊断:"

if [ $NEEDS_LOGIN -gt 0 ]; then
    echo "❌ 确认问题: 前端页面仍显示'需要登录访问'"
    echo ""
    echo "💡 可能的原因:"
    echo "  1. 前端权限检查逻辑问题"
    echo "  2. localStorage用户数据格式不匹配"
    echo "  3. 用户状态同步问题"
    echo "  4. 组件状态管理问题"
    echo ""
    echo "🛠️ 建议修复方案:"
    echo "  1. 检查前端MyContent组件的权限检查逻辑"
    echo "  2. 验证用户登录后localStorage中的数据格式"
    echo "  3. 简化权限检查条件"
    echo "  4. 添加更详细的调试日志"
elif [ "$STORIES_SUCCESS" != "true" ]; then
    echo "❌ 问题: 用户故事API调用失败"
    echo "💡 需要检查后端API实现"
elif [ -z "$USER_UUID" ]; then
    echo "❌ 问题: 用户登录失败"
    echo "💡 需要检查登录API实现"
else
    echo "✅ 所有API测试正常，问题可能在前端逻辑"
fi

echo ""
echo "📊 详细数据供进一步分析:"
echo "  - 用户UUID: $USER_UUID"
echo "  - 用户类型: $USER_TYPE"
echo "  - 故事数量: $STORIES_COUNT"
echo "  - 页面需要登录: $NEEDS_LOGIN"

echo ""
echo "🔍 测试完成！"
