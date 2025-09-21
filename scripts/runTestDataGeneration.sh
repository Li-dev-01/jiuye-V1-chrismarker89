#!/bin/bash

# 测试数据生成和导入脚本
# 用于为可视化系统生成足够的测试数据

set -e  # 遇到错误立即退出

echo "🚀 开始测试数据生成流程..."

# 检查必要的依赖
echo "📋 检查环境依赖..."

# 检查Node.js和TypeScript
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx 未找到，请确保 Node.js 安装正确"
    exit 1
fi

echo "✅ Node.js 环境检查通过"

# 检查TypeScript
if ! npx tsc --version &> /dev/null; then
    echo "📦 安装 TypeScript..."
    npm install -g typescript ts-node
fi

echo "✅ TypeScript 环境检查通过"

# 创建输出目录
echo "📁 创建输出目录..."
mkdir -p ./generated-data
mkdir -p ./logs

# 设置日志文件
LOG_FILE="./logs/test-data-generation-$(date +%Y%m%d_%H%M%S).log"

echo "📊 开始生成测试数据..."
echo "   - 日志文件: $LOG_FILE"

# 执行数据生成
echo "🎲 第1步：生成测试数据..." | tee -a "$LOG_FILE"
npx ts-node scripts/generateTestData.ts 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 测试数据生成成功" | tee -a "$LOG_FILE"
else
    echo "❌ 测试数据生成失败" | tee -a "$LOG_FILE"
    exit 1
fi

# 移动生成的文件到输出目录
echo "📦 整理生成的文件..." | tee -a "$LOG_FILE"
if [ -f "./test-users.json" ]; then
    mv ./test-users.json ./generated-data/
    echo "   - test-users.json 已移动到 generated-data/" | tee -a "$LOG_FILE"
fi

if [ -f "./test-responses.json" ]; then
    mv ./test-responses.json ./generated-data/
    echo "   - test-responses.json 已移动到 generated-data/" | tee -a "$LOG_FILE"
fi

if [ -f "./data-analysis.json" ]; then
    mv ./data-analysis.json ./generated-data/
    echo "   - data-analysis.json 已移动到 generated-data/" | tee -a "$LOG_FILE"
fi

# 显示生成的数据统计
echo "📈 数据生成统计:" | tee -a "$LOG_FILE"
if [ -f "./generated-data/data-analysis.json" ]; then
    echo "   - 详细统计请查看: ./generated-data/data-analysis.json" | tee -a "$LOG_FILE"
    
    # 提取关键统计信息
    if command -v jq &> /dev/null; then
        echo "   - 总回答数: $(jq '.total' ./generated-data/data-analysis.json)" | tee -a "$LOG_FILE"
        echo "   - 完成率: $(jq '.completionRate' ./generated-data/data-analysis.json)%" | tee -a "$LOG_FILE"
    fi
fi

# 检查文件大小
echo "📁 生成文件信息:" | tee -a "$LOG_FILE"
ls -lh ./generated-data/ | tee -a "$LOG_FILE"

echo ""
echo "🎉 测试数据生成完成！"
echo ""
echo "📋 生成的文件:"
echo "   - ./generated-data/test-users.json      - 测试用户数据"
echo "   - ./generated-data/test-responses.json  - 问卷回答数据"
echo "   - ./generated-data/data-analysis.json   - 数据分析报告"
echo ""
echo "📝 下一步操作:"
echo "   1. 检查生成的数据质量: cat ./generated-data/data-analysis.json"
echo "   2. 导入数据库: npm run import-test-data"
echo "   3. 验证可视化效果: 访问可视化页面"
echo ""
echo "🔧 如需重新生成数据:"
echo "   bash scripts/runTestDataGeneration.sh"
echo ""
echo "📊 日志文件: $LOG_FILE"
