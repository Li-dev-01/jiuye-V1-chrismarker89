#!/bin/bash

echo "🚀 开始部署测试..."

# 检查当前目录
echo "📁 当前目录: $(pwd)"
echo "📂 目录内容:"
ls -la

# 检查backend目录
if [ -d "backend" ]; then
    echo "✅ backend目录存在"
    cd backend
    
    echo "📁 backend目录内容:"
    ls -la
    
    # 检查wrangler.toml
    if [ -f "wrangler.toml" ]; then
        echo "✅ wrangler.toml存在"
        echo "📄 wrangler.toml内容:"
        cat wrangler.toml
    else
        echo "❌ wrangler.toml不存在"
    fi
    
    # 检查package.json
    if [ -f "package.json" ]; then
        echo "✅ package.json存在"
        echo "📦 检查部署脚本:"
        grep -A 5 -B 5 "deploy" package.json
    else
        echo "❌ package.json不存在"
    fi
    
    # 尝试部署
    echo "🚀 开始部署后端..."
    npm run deploy
    
else
    echo "❌ backend目录不存在"
fi
