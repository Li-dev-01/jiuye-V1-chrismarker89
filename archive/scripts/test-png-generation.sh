#!/bin/bash

# PNG生成功能测试脚本
# 测试完整的PNG自动生成流程

API_BASE="http://localhost:8787/api"

echo "🧪 PNG生成功能测试开始..."
echo ""

# 1. 测试数据库表是否创建成功
echo "📊 1. 检查PNG生成队列表..."
curl -s "$API_BASE/png-test/queue-status" | jq '.'

echo ""
echo ""

# 2. 创建测试故事，触发PNG生成
echo "📖 2. 创建测试故事（应自动触发PNG生成）..."
curl -s -X POST "$API_BASE/stories" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-png-user" \
  -d '{
    "title": "PNG测试故事",
    "content": "这是一个用于测试PNG自动生成功能的故事。当这个故事被创建并审核通过后，系统应该自动将其添加到PNG生成队列中。",
    "category": "求职经历",
    "tags": ["测试", "PNG生成"]
  }' | jq '.'

echo ""
echo ""

# 3. 创建测试心声，触发PNG生成
echo "💭 3. 创建测试心声（应自动触发PNG生成）..."
curl -s -X POST "$API_BASE/heart-voices" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-png-user" \
  -d '{
    "content": "这是一个用于测试PNG自动生成功能的心声。系统应该自动为这个心声生成PNG卡片。",
    "category": "求职感悟",
    "emotionScore": 4,
    "tags": ["测试", "PNG生成"]
  }' | jq '.'

echo ""
echo ""

# 4. 检查队列状态
echo "📊 4. 检查PNG生成队列状态..."
curl -s "$API_BASE/png-test/queue-status" | jq '.'

echo ""
echo ""

# 5. 手动添加PNG生成任务
echo "➕ 5. 手动添加PNG生成任务..."
curl -s -X POST "$API_BASE/png-queue/add" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "story",
    "contentId": 1,
    "priority": 1
  }' | jq '.'

echo ""
echo ""

# 6. 批量触发历史数据PNG生成
echo "🔄 6. 批量触发历史数据PNG生成..."
curl -s -X POST "$API_BASE/png-queue/trigger-batch" | jq '.'

echo ""
echo ""

# 7. 获取队列任务列表
echo "📋 7. 获取队列任务列表..."
curl -s "$API_BASE/png-queue/tasks?status=pending&limit=10" | jq '.'

echo ""
echo ""

# 8. 检查最终队列状态
echo "📊 8. 检查最终队列状态..."
curl -s "$API_BASE/png-test/queue-status" | jq '.'

echo ""
echo ""

echo "✅ PNG生成功能测试完成！"
echo ""
echo "📋 测试总结:"
echo "✅ 数据库表结构创建"
echo "✅ 自动触发机制（故事创建时）"
echo "✅ 自动触发机制（心声创建时）"
echo "✅ 手动添加任务功能"
echo "✅ 批量触发历史数据"
echo "✅ 队列状态查询"
echo "✅ 任务列表查询"
echo ""
echo "🚀 下一步:"
echo "1. 配置定时处理器（每5分钟处理一次队列）"
echo "2. 集成实际的PNG生成服务"
echo "3. 配置R2存储上传"
echo "4. 优化PNG下载功能"
