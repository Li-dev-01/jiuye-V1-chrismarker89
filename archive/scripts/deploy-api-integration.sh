#!/bin/bash

# 部署API集成更新到Cloudflare
# 这个脚本将提交所有更改并部署到Cloudflare Pages

set -e

echo "🚀 开始部署API集成更新..."

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 添加所有更改
echo "📝 添加文件到Git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "feat: 完善API集成和问卷完成流程

- 实现问卷完成页面的真实API集成
- 添加心声生成页面的API调用
- 完善HeartVoiceService的AI生成功能
- 修复用户状态检测逻辑
- 更新问卷提交流程，跳转到新的完成页面
- 准备Cloudflare部署调试

主要更新：
1. QuestionnaireCompletion页面：集成universalQuestionnaireService
2. HeartVoiceGeneration页面：集成heartVoiceService
3. HeartVoiceService：添加AI生成和模板备用方案
4. 修复useQuestionnaireCompletion Hook的状态检测
5. 确保所有API调用指向正确的Cloudflare Workers端点"

# 推送到远程仓库
echo "🌐 推送到远程仓库..."
git push origin main

# 部署前端到Cloudflare Pages
echo "🎯 部署前端到Cloudflare Pages..."
cd frontend
npx wrangler pages deploy dist --project-name employment-survey-frontend

# 部署后端到Cloudflare Workers
echo "⚙️ 部署后端到Cloudflare Workers..."
cd ../backend
npx wrangler deploy

echo "✅ 部署完成！"
echo ""
echo "🔗 访问链接："
echo "   前端: https://employment-survey-frontend.pages.dev"
echo "   后端API: https://employment-survey-api.justpm2099.workers.dev"
echo ""
echo "🧪 现在可以在Cloudflare环境中测试新的API集成功能："
echo "   1. 问卷完成页面的用户状态检测"
echo "   2. 问卷数据的真实API提交"
echo "   3. 心声生成的AI功能和备用模板"
echo "   4. 完整的用户流程：问卷 → 完成页面 → 心声生成"
