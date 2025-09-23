#!/bin/bash

# Newman API测试脚本
# 使用Postman集合进行API测试

set -e

echo "🚀 开始Newman API测试..."

# 检查Newman是否安装
if ! command -v newman &> /dev/null; then
    echo "❌ Newman未安装，正在安装..."
    npm install -g newman
fi

# 设置环境变量
export BASE_URL="https://employment-survey-api-prod.chrismarker89.workers.dev"
export AUTH_TOKEN=""

# 运行测试
echo "📮 运行Postman集合测试..."
newman run docs/postman-collection.json \
    --environment docs/test-environment.json \
    --reporters cli,html \
    --reporter-html-export reports/newman-report.html \
    --timeout-request 30000 \
    --delay-request 100

echo "✅ Newman测试完成！"
echo "📄 测试报告已保存到: reports/newman-report.html"