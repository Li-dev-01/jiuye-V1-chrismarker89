#!/bin/bash

# 🚀 Cloudflare Workers 后端部署脚本
# 用于部署就业问卷调查系统后端API

set -e  # 遇到错误立即退出

echo "🚀 开始部署后端API到Cloudflare Workers..."
echo "=================================================="

# 检查是否在正确的目录
if [ ! -f "backend/wrangler.toml" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 进入后端目录
cd backend

echo "📦 安装依赖..."
npm install

echo "🔨 构建项目..."
npm run build

echo "🚀 部署到开发环境..."
wrangler deploy --env development

# 等待部署完成
echo "⏳ 等待部署完成..."
sleep 10

# 测试开发环境健康检查
echo "🔍 测试开发环境API健康状态..."
DEV_URL="https://employment-survey-api-dev.chrismarker89.workers.dev"

if curl -f "$DEV_URL/health" > /dev/null 2>&1; then
    echo "✅ 开发环境部署成功！"
    echo "🌐 开发环境URL: $DEV_URL"
    
    # 测试核心API端点
    echo "🧪 测试核心API端点..."
    
    echo "  - 测试分析API..."
    if curl -f "$DEV_URL/api/analytics/dashboard" > /dev/null 2>&1; then
        echo "    ✅ Analytics API 正常"
    else
        echo "    ⚠️ Analytics API 可能有问题"
    fi
    
    echo "  - 测试审核员API..."
    if curl -f "$DEV_URL/api/reviewer/stats" > /dev/null 2>&1; then
        echo "    ✅ Reviewer API 正常"
    else
        echo "    ⚠️ Reviewer API 可能有问题"
    fi
    
    echo ""
    echo "🎯 开发环境部署完成！"
    echo "=================================================="
    
    # 询问是否部署到生产环境
    read -p "🤔 是否部署到生产环境? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 部署到生产环境..."
        wrangler deploy --env production
        
        # 等待生产部署完成
        echo "⏳ 等待生产部署完成..."
        sleep 10
        
        # 测试生产环境
        echo "🔍 测试生产环境API健康状态..."
        PROD_URL="https://employment-survey-api-prod.chrismarker89.workers.dev"
        
        if curl -f "$PROD_URL/health" > /dev/null 2>&1; then
            echo "✅ 生产环境部署成功！"
            echo "🌐 生产环境URL: $PROD_URL"
            echo ""
            echo "🎉 全部部署完成！"
            echo "=================================================="
            echo "📊 部署摘要:"
            echo "  - 开发环境: $DEV_URL"
            echo "  - 生产环境: $PROD_URL"
            echo ""
            echo "🔧 后续操作:"
            echo "  1. 更新前端API配置指向生产环境"
            echo "  2. 测试所有功能是否正常"
            echo "  3. 监控API性能和错误率"
            echo ""
            echo "📝 监控命令:"
            echo "  wrangler tail employment-survey-api-prod"
        else
            echo "❌ 生产环境部署失败！"
            echo "🔍 请检查日志: wrangler tail employment-survey-api-prod"
            exit 1
        fi
    else
        echo "⏭️ 跳过生产环境部署"
        echo ""
        echo "🎯 开发环境部署完成！"
        echo "=================================================="
        echo "📊 部署摘要:"
        echo "  - 开发环境: $DEV_URL"
        echo ""
        echo "🔧 后续操作:"
        echo "  1. 测试开发环境功能"
        echo "  2. 确认无误后部署到生产环境"
        echo ""
        echo "📝 监控命令:"
        echo "  wrangler tail employment-survey-api-dev"
    fi
    
else
    echo "❌ 开发环境部署失败！"
    echo "🔍 请检查错误信息:"
    echo "  1. 运行 'wrangler tail employment-survey-api-dev' 查看日志"
    echo "  2. 检查 wrangler.toml 配置"
    echo "  3. 确认D1数据库配置正确"
    exit 1
fi

echo ""
echo "🎉 部署脚本执行完成！"
