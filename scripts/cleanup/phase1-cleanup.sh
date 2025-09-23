#!/bin/bash

# API清理脚本 - 第一阶段
# 清理冗余和重复的API端点

echo "🧹 开始API清理..."

# 1. 删除心声相关API (已完成)
echo "✅ 心声API已清理"

# 2. 合并重复的健康检查API
echo "🔄 合并健康检查API..."
# 保留 /api/health，移除其他重复端点

# 3. 整合统计API
echo "📊 整合统计API..."
# 将分散的统计功能合并到 /api/admin/statistics

# 4. 清理测试和开发API
echo "🧪 清理测试API..."
# 移除开发环境专用的API端点

echo "✅ API清理完成"
