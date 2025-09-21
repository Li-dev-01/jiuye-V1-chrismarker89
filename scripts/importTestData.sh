#!/bin/bash

# 测试数据导入脚本 (适配项目结构)
# 使用方法: bash scripts/importTestData.sh

set -e  # 遇到错误立即退出

# 项目配置
DATABASE_NAME="college-employment-survey"
SQL_DIR="test-data/sql"
BACKEND_DIR="backend"

echo "🗄️ 开始导入测试数据到数据库: $DATABASE_NAME"
echo "📁 SQL文件目录: $SQL_DIR"
echo "🔧 Backend目录: $BACKEND_DIR"
echo ""

# 检查必要的目录和文件
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend目录不存在: $BACKEND_DIR"
    exit 1
fi

if [ ! -f "$BACKEND_DIR/wrangler.toml" ]; then
    echo "❌ wrangler.toml 文件不存在: $BACKEND_DIR/wrangler.toml"
    exit 1
fi

if [ ! -d "$SQL_DIR" ]; then
    echo "❌ SQL文件目录不存在: $SQL_DIR"
    echo "💡 请先运行: node test-data/scripts/importToDatabase.cjs"
    exit 1
fi

# 检查wrangler是否安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler 未安装，请先安装 Cloudflare Wrangler CLI"
    echo "💡 安装命令: npm install -g wrangler"
    exit 1
fi

echo "🔍 检查数据库连接..."
cd "$BACKEND_DIR"

if ! wrangler d1 list | grep -q "$DATABASE_NAME"; then
    echo "⚠️  警告: 数据库 '$DATABASE_NAME' 可能不存在"
    echo "📝 请确认数据库名称是否正确"
    echo ""
fi

cd ..

# 询问用户确认
echo "📋 即将执行以下操作:"
echo "   1. 清理现有测试数据"
echo "   2. 导入 1,200 个测试用户"
echo "   3. 导入 1,800 份完整问卷 (分64批)"
echo ""
read -p "🤔 确认继续? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 用户取消操作"
    exit 1
fi

echo ""
echo "🚀 开始导入数据..."

# 记录开始时间
START_TIME=$(date +%s)

# 进入backend目录执行wrangler命令
cd "$BACKEND_DIR"

# 1. 清理现有测试数据
echo "🧹 第1步: 清理现有测试数据..."
if wrangler d1 execute "$DATABASE_NAME" --file="../$SQL_DIR/01-cleanup.sql"; then
    echo "   ✅ 清理完成"
else
    echo "   ❌ 清理失败"
    cd ..
    exit 1
fi

# 2. 导入用户数据
echo "👥 第2步: 导入用户数据..."
if wrangler d1 execute "$DATABASE_NAME" --file="../$SQL_DIR/02-users.sql"; then
    echo "   ✅ 用户数据导入完成 (1,200 用户)"
else
    echo "   ❌ 用户数据导入失败"
    cd ..
    exit 1
fi

# 3. 导入问卷数据 (分批)
echo "📝 第3步: 导入问卷数据 (分批执行)..."

# 统计批次文件数量
BATCH_COUNT=$(ls "../$SQL_DIR"/03-responses-batch-*.sql | wc -l)
echo "   📊 总批次数: $BATCH_COUNT"

CURRENT_BATCH=0
FAILED_BATCHES=0

for batch_file in "../$SQL_DIR"/03-responses-batch-*.sql; do
    CURRENT_BATCH=$((CURRENT_BATCH + 1))
    batch_name=$(basename "$batch_file")
    
    echo -n "   📦 执行批次 $CURRENT_BATCH/$BATCH_COUNT ($batch_name)... "
    
    if wrangler d1 execute "$DATABASE_NAME" --file="$batch_file" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌"
        FAILED_BATCHES=$((FAILED_BATCHES + 1))
        echo "      ⚠️  批次 $batch_name 导入失败"
    fi
    
    # 每10个批次显示进度
    if [ $((CURRENT_BATCH % 10)) -eq 0 ]; then
        echo "   📈 进度: $CURRENT_BATCH/$BATCH_COUNT 批次已完成"
    fi
done

# 计算耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "🎉 数据导入完成！"
echo ""
echo "📊 导入统计:"
echo "   - 总耗时: ${DURATION} 秒"
echo "   - 成功批次: $((BATCH_COUNT - FAILED_BATCHES))/$BATCH_COUNT"
if [ $FAILED_BATCHES -gt 0 ]; then
    echo "   - 失败批次: $FAILED_BATCHES"
    echo "   ⚠️  建议检查失败的批次并重新执行"
fi

echo ""
echo "🔍 验证导入结果..."

# 验证数据导入
echo "📋 执行验证查询..."

# 检查用户数量
echo -n "   👥 测试用户数量: "
USER_COUNT=$(wrangler d1 execute "$DATABASE_NAME" --command="SELECT COUNT(*) as count FROM users WHERE is_test_data = 1;" --json | jq -r '.[0].results[0].count' 2>/dev/null || echo "查询失败")
echo "$USER_COUNT"

# 检查问卷数量
echo -n "   📝 问卷回答数量: "
RESPONSE_COUNT=$(wrangler d1 execute "$DATABASE_NAME" --command="SELECT COUNT(*) as count FROM questionnaire_responses WHERE is_test_data = 1;" --json | jq -r '.[0].results[0].count' 2>/dev/null || echo "查询失败")
echo "$RESPONSE_COUNT"

# 检查答案数量
echo -n "   💬 问卷答案数量: "
ANSWER_COUNT=$(wrangler d1 execute "$DATABASE_NAME" --command="SELECT COUNT(*) as count FROM questionnaire_answers WHERE is_test_data = 1;" --json | jq -r '.[0].results[0].count' 2>/dev/null || echo "查询失败")
echo "$ANSWER_COUNT"

# 回到项目根目录
cd ..

echo ""
if [ "$USER_COUNT" = "1200" ] && [ "$RESPONSE_COUNT" = "1800" ]; then
    echo "✅ 数据导入验证成功！"
    echo ""
    echo "📋 下一步操作:"
    echo "   1. 访问可视化页面验证数据显示"
    echo "   2. 测试社会观察功能"
    echo "   3. 验证所有数据相关功能"
    echo ""
    echo "🔗 可视化页面: https://your-frontend-url/analytics"
else
    echo "⚠️  数据导入可能不完整，请检查:"
    echo "   - 预期用户数: 1200，实际: $USER_COUNT"
    echo "   - 预期问卷数: 1800，实际: $RESPONSE_COUNT"
    echo ""
    echo "💡 如需重新导入，请重新运行此脚本"
fi

echo ""
echo "🧹 清理测试数据命令 (如需要):"
echo "   cd backend && wrangler d1 execute $DATABASE_NAME --file=../test-data/sql/01-cleanup.sql"
