#!/bin/bash

# 🚀 Cloudflare Pages 前端部署脚本
# 用于部署就业问卷调查系统前端应用

set -e  # 遇到错误立即退出

echo "🚀 开始部署前端到Cloudflare Pages..."
echo "=================================================="

# 检查是否在正确的目录
if [ ! -f "frontend/package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 进入前端目录
cd frontend

echo "📦 安装依赖..."
npm install

echo "🔨 构建生产版本..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist目录不存在"
    exit 1
fi

echo "📊 构建统计:"
echo "  - 构建目录: $(pwd)/dist"
echo "  - 文件数量: $(find dist -type f | wc -l)"
echo "  - 总大小: $(du -sh dist | cut -f1)"

echo ""
echo "🚀 部署到Cloudflare Pages..."

# 部署到Pages
wrangler pages deploy dist --project-name college-employment-survey-frontend

echo ""
echo "⏳ 等待部署完成..."
sleep 5

# 获取部署URL (这里需要根据实际情况调整)
PAGES_URL="https://college-employment-survey-frontend.pages.dev"

echo "🔍 测试前端应用..."
if curl -f "$PAGES_URL" > /dev/null 2>&1; then
    echo "✅ 前端部署成功！"
    echo "🌐 访问地址: $PAGES_URL"
    
    echo ""
    echo "🧪 建议测试项目:"
    echo "  1. 访问主页是否正常加载"
    echo "  2. 用户注册/登录功能"
    echo "  3. 问卷填写功能"
    echo "  4. 数据分析页面"
    echo "  5. 审核员功能"
    echo "  6. 管理员功能"
    
    echo ""
    echo "⚙️ 如果API连接有问题，请检查:"
    echo "  1. 前端环境变量配置"
    echo "  2. 后端CORS设置"
    echo "  3. API域名配置"
    
else
    echo "⚠️ 前端部署完成，但无法访问"
    echo "🔍 请手动检查: $PAGES_URL"
fi

echo ""
echo "🎉 前端部署完成！"
echo "=================================================="
echo "📊 部署摘要:"
echo "  - 项目名称: college-employment-survey-frontend"
echo "  - 访问地址: $PAGES_URL"
echo "  - 构建目录: $(pwd)/dist"

echo ""
echo "🔧 后续配置:"
echo "  1. 在Cloudflare Dashboard中配置自定义域名"
echo "  2. 设置环境变量 (如果需要)"
echo "  3. 配置缓存策略"
echo "  4. 设置访问分析"

echo ""
echo "📝 有用的命令:"
echo "  - 查看Pages项目: wrangler pages project list"
echo "  - 查看部署历史: wrangler pages deployment list college-employment-survey-frontend"
echo "  - 删除部署: wrangler pages deployment delete <deployment-id>"

echo ""
echo "🎯 部署脚本执行完成！"
