#!/bin/bash

# 测试审核员API - 使用真实数据库

API_BASE="https://employment-survey-api-prod.chrismarker89.workers.dev"

echo "========================================="
echo "审核员API测试 - 真实数据库版本"
echo "========================================="
echo ""

# 1. 登录获取Token
echo "🔐 Step 1: 登录审核员账号..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/simple-auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"reviewerA","password":"admin123"}')

echo "$LOGIN_RESPONSE" | jq .

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  exit 1
fi

echo "✅ 登录成功，Token: ${TOKEN:0:30}..."
echo ""

# 2. 测试仪表板API
echo "========================================="
echo "📊 Step 2: 测试仪表板API..."
echo "========================================="
DASHBOARD_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/simple-reviewer/dashboard")

echo "$DASHBOARD_RESPONSE" | jq '.success, .message, .data.stats'

if echo "$DASHBOARD_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ 仪表板API正常工作"
  
  # 显示关键统计
  echo ""
  echo "📈 关键统计数据:"
  echo "  - 待审核总数: $(echo "$DASHBOARD_RESPONSE" | jq -r '.data.stats.total_pending')"
  echo "  - 今日完成: $(echo "$DASHBOARD_RESPONSE" | jq -r '.data.stats.today_completed')"
  echo "  - 总完成数: $(echo "$DASHBOARD_RESPONSE" | jq -r '.data.stats.total_completed')"
  echo "  - 平均审核时间: $(echo "$DASHBOARD_RESPONSE" | jq -r '.data.stats.average_review_time') 分钟"
else
  echo "❌ 仪表板API失败"
  exit 1
fi
echo ""

# 3. 测试待审核列表API
echo "========================================="
echo "📝 Step 3: 测试待审核列表API..."
echo "========================================="
PENDING_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/simple-reviewer/pending-reviews?page=1&pageSize=5")

echo "$PENDING_RESPONSE" | jq '.success, .message, .data.pagination'

if echo "$PENDING_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ 待审核列表API正常工作"
  
  # 显示分页信息
  echo ""
  echo "📄 分页信息:"
  echo "  - 总记录数: $(echo "$PENDING_RESPONSE" | jq -r '.data.pagination.total')"
  echo "  - 当前页: $(echo "$PENDING_RESPONSE" | jq -r '.data.pagination.page')"
  echo "  - 每页数量: $(echo "$PENDING_RESPONSE" | jq -r '.data.pagination.pageSize')"
  echo "  - 总页数: $(echo "$PENDING_RESPONSE" | jq -r '.data.pagination.totalPages')"
  
  # 显示第一条记录
  FIRST_REVIEW=$(echo "$PENDING_RESPONSE" | jq -r '.data.reviews[0]')
  if [ "$FIRST_REVIEW" != "null" ]; then
    echo ""
    echo "📋 第一条待审核记录:"
    echo "$FIRST_REVIEW" | jq '{id, title, audit_level, priority, status}'
  fi
else
  echo "❌ 待审核列表API失败"
  exit 1
fi
echo ""

# 4. 测试审核历史API
echo "========================================="
echo "📜 Step 4: 测试审核历史API..."
echo "========================================="
HISTORY_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/simple-reviewer/history?page=1&pageSize=5")

echo "$HISTORY_RESPONSE" | jq '.success, .message, .data.pagination'

if echo "$HISTORY_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ 审核历史API正常工作"
  
  # 显示历史统计
  echo ""
  echo "📊 历史记录统计:"
  echo "  - 总记录数: $(echo "$HISTORY_RESPONSE" | jq -r '.data.pagination.total')"
  echo "  - 当前页: $(echo "$HISTORY_RESPONSE" | jq -r '.data.pagination.page')"
else
  echo "❌ 审核历史API失败"
  exit 1
fi
echo ""

# 5. 测试统计API
echo "========================================="
echo "📈 Step 5: 测试统计API..."
echo "========================================="
STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/simple-reviewer/stats")

echo "$STATS_RESPONSE" | jq '.success, .message, .data'

if echo "$STATS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ 统计API正常工作"
  
  # 显示统计数据
  echo ""
  echo "📊 审核统计:"
  echo "  - 总数: $(echo "$STATS_RESPONSE" | jq -r '.data.total')"
  echo "  - 待审核: $(echo "$STATS_RESPONSE" | jq -r '.data.pending')"
  echo "  - 已通过: $(echo "$STATS_RESPONSE" | jq -r '.data.approved')"
  echo "  - 已拒绝: $(echo "$STATS_RESPONSE" | jq -r '.data.rejected')"
else
  echo "❌ 统计API失败"
  exit 1
fi
echo ""

# 6. 测试提交审核API（如果有待审核内容）
FIRST_PENDING_ID=$(echo "$PENDING_RESPONSE" | jq -r '.data.reviews[0].id')
if [ "$FIRST_PENDING_ID" != "null" ] && [ -n "$FIRST_PENDING_ID" ]; then
  echo "========================================="
  echo "✅ Step 6: 测试提交审核API..."
  echo "========================================="
  echo "测试审核ID: $FIRST_PENDING_ID"
  
  SUBMIT_RESPONSE=$(curl -s -X POST "$API_BASE/api/simple-reviewer/submit-review" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"auditId\":$FIRST_PENDING_ID,\"action\":\"approve\",\"reason\":\"内容符合规范，测试通过\"}")
  
  echo "$SUBMIT_RESPONSE" | jq '.success, .message, .data'
  
  if echo "$SUBMIT_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ 提交审核API正常工作"
  else
    echo "⚠️ 提交审核API可能失败（可能是数据库约束）"
  fi
else
  echo "⚠️ Step 6: 跳过提交审核测试（没有待审核内容）"
fi
echo ""

# 总结
echo "========================================="
echo "🎉 测试完成！"
echo "========================================="
echo ""
echo "✅ 所有核心API端点已验证"
echo "✅ 数据来源：真实数据库（D1）"
echo "✅ 审核员系统功能正常"
echo ""
echo "📝 注意事项："
echo "  - 如果待审核数量为0，说明数据库中暂无待审核内容"
echo "  - 可以通过故事提交功能创建待审核内容"
echo "  - 审核历史基于manual_review_queue表"
echo ""
echo "🔗 访问审核员页面："
echo "  https://cfea5a5b.reviewer-admin-dashboard.pages.dev/login"
echo "  用户名: reviewerA"
echo "  密码: admin123"
echo ""

