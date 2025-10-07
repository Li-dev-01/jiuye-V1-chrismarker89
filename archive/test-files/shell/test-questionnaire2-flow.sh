#!/bin/bash

echo "🔍 测试问卷2流程逻辑..."

# 检查问卷2的章节结构
echo "📊 检查问卷2章节结构..."
curl -s "http://localhost:8787/api/universal-questionnaire/questionnaires/questionnaire-v2-2024" | jq '.data.sections[] | {
  id: .id,
  title: .title,
  questions: (.questions | length),
  condition: .condition,
  questionIds: [.questions[].id]
}' | jq -s '.'

echo ""
echo "🎯 分析章节逻辑:"

# 无条件章节
echo "✅ 无条件章节（应该立即显示）:"
curl -s "http://localhost:8787/api/universal-questionnaire/questionnaires/questionnaire-v2-2024" | jq -r '.data.sections[] | select(.condition == null) | "  - " + .id + ": " + .title'

echo ""
echo "🔀 条件章节（需要满足条件才显示）:"
curl -s "http://localhost:8787/api/universal-questionnaire/questionnaires/questionnaire-v2-2024" | jq -r '.data.sections[] | select(.condition != null) | "  - " + .id + ": " + .title + " (依赖: " + .condition.dependsOn + " = " + (.condition.value | tostring) + ")"'

echo ""
echo "🔧 问题ID映射检查:"
echo "章节ID: current-status-v2"
echo "问题ID: $(curl -s "http://localhost:8787/api/universal-questionnaire/questionnaires/questionnaire-v2-2024" | jq -r '.data.sections[] | select(.id == "current-status-v2") | .questions[0].id')"

echo ""
echo "📋 完整问题列表:"
curl -s "http://localhost:8787/api/universal-questionnaire/questionnaires/questionnaire-v2-2024" | jq -r '.data.sections[] as $section | $section.questions[] | "  " + $section.id + " -> " + .id + ": " + .title'

echo ""
echo "🎯 预期流程:"
echo "1. 初始显示: basic-demographics-v2, current-status-v2, universal-economic-pressure-v2, employment-confidence-v2"
echo "2. 回答 current-status-question-v2 = 'fulltime' 后显示: employment-income-details-v2"
echo "3. 总共应该有 10 个问题需要回答"

echo ""
echo "💡 修复要点:"
echo "✅ 初始化显示所有无条件章节（不只是第一个）"
echo "✅ 每次回答后都更新可见章节"
echo "✅ 修复问题ID映射（current-status-v2 -> current-status-question-v2）"
echo "✅ 添加详细的调试日志"
