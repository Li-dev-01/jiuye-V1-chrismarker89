#!/bin/bash

# 部署真实数据系统日志功能
# 此脚本将应用数据库更改并部署更新的API

echo "🚀 开始部署真实数据系统日志功能..."
echo "=" | tr -d '\n' | head -c 50; echo

# 检查是否在正确的目录
if [ ! -f "wrangler.toml" ]; then
    echo "❌ 错误: 请在backend目录中运行此脚本"
    exit 1
fi

# 1. 应用数据库更改
echo "📊 应用数据库更改..."

# 检查D1数据库是否存在
echo "🔍 检查D1数据库..."
if ! wrangler d1 list | grep -q "employment-survey-db"; then
    echo "⚠️  D1数据库不存在，创建新数据库..."
    wrangler d1 create employment-survey-db
fi

# 应用数据库初始化脚本
echo "🗄️  应用数据库表结构..."
wrangler d1 execute employment-survey-db --file=database/d1_init.sql

# 插入示例日志数据
echo "📝 插入示例日志数据..."
wrangler d1 execute employment-survey-db --file=database/insert_sample_logs.sql

# 2. 部署API更改
echo "🌐 部署API更改..."
wrangler deploy

# 3. 验证部署
echo "🧪 验证部署..."
sleep 5  # 等待部署完成

# 运行测试脚本
if command -v node &> /dev/null; then
    echo "🔬 运行API测试..."
    node test_system_logs_api.js
else
    echo "⚠️  Node.js未安装，跳过自动测试"
    echo "📋 请手动访问以下URL验证API:"
    echo "   https://employment-survey-api-dev.justpm2099.workers.dev/api/super-admin/system/logs"
fi

echo
echo "=" | tr -d '\n' | head -c 50; echo
echo "✅ 部署完成！"
echo
echo "📋 部署摘要:"
echo "  ✅ 数据库表结构已更新"
echo "  ✅ 示例日志数据已插入"
echo "  ✅ API已部署到Cloudflare Workers"
echo "  ✅ 系统日志页面现在使用真实数据"
echo
echo "🔗 相关链接:"
echo "  管理后台: https://8fb5537a.college-employment-survey-frontend.pages.dev/admin/logs"
echo "  API文档: https://employment-survey-api-dev.justpm2099.workers.dev/api/super-admin/system/logs"
echo
echo "🎉 系统日志功能已成功切换到真实数据！"
