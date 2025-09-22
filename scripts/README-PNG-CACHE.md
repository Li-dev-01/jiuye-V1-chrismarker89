# PNG缓存管理工具

## 概述

由于书信体样式已更新，需要清理旧的PNG缓存以确保用户看到最新样式的PNG卡片。本工具提供了多种清理方式。

## 🚀 快速开始

### 方式1: 一键清理脚本（推荐）

```bash
# 清理所有PNG缓存
./scripts/clear-all-png-cache.sh
```

### 方式2: Node.js脚本

```bash
# 清理所有PNG缓存
node scripts/clear-png-cache.js --all

# 清理所有缓存并删除R2文件（谨慎使用）
node scripts/clear-png-cache.js --all-with-files

# 清理特定主题
node scripts/clear-png-cache.js --theme gradient

# 清理特定内容类型
node scripts/clear-png-cache.js --type story
```

### 方式3: 直接API调用

```bash
# 清理所有缓存 (线上环境)
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/png-management/cache/clear-all \
  -H "Content-Type: application/json" \
  -d '{"reason":"书信体样式更新"}'

# 清理渐变主题
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/png-management/cache/clear-theme/gradient

# 清理故事缓存
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/png-management/cache/clear-type/story
```

### 方式4: Web管理界面

访问管理后台进行可视化操作：

```bash
# 线上环境
https://e40566b0.college-employment-survey-frontend-l84.pages.dev/admin/png-cache

# 本地环境
http://localhost:3000/admin/png-cache
```

## 📋 清理选项说明

### 全量清理
- **清理所有缓存**: 删除数据库中的所有PNG缓存记录
- **清理缓存+删除文件**: 同时删除R2存储中的PNG文件（谨慎使用）

### 按主题清理
- `gradient`: 渐变主题
- `light`: 浅色主题  
- `dark`: 深色主题

### 按内容类型清理
- `story`: 就业故事
- `heart_voice`: 问卷心声

## 🔧 配置

### 环境变量
```bash
# API基础URL（默认: 线上环境）
export API_BASE_URL=https://employment-survey-api-prod.chrismarker89.workers.dev

# 本地开发环境
export API_BASE_URL=http://localhost:8787
```

### 依赖检查
- **Bash脚本**: 需要 `curl` 命令
- **Node.js脚本**: 需要 Node.js 环境
- **Web界面**: 需要管理员权限

## 📊 清理效果

清理后的效果：
1. ✅ 旧的PNG缓存被删除
2. ✅ 下次用户下载时会重新生成PNG
3. ✅ 新生成的PNG使用最新的书信体样式
4. ✅ 用户看到更新后的排版效果

## ⚠️ 注意事项

1. **性能影响**: 清理后首次下载需要重新生成，可能需要几秒钟
2. **建议时机**: 在低峰期进行清理操作
3. **文件删除**: 谨慎使用"删除R2文件"选项，这会永久删除已生成的PNG
4. **权限要求**: API调用可能需要管理员权限

## 🔍 故障排除

### API服务检查
```bash
# 检查API服务状态
curl http://localhost:8787/health

# 检查PNG管理接口
curl http://localhost:8787/api/png-management/queue/status
```

### 常见问题

**Q: 脚本执行失败？**
A: 检查API服务是否运行，确认端口号正确

**Q: 权限不足？**
A: 确保使用管理员账号或正确的API密钥

**Q: 清理后PNG还是旧样式？**
A: 检查浏览器缓存，或等待几分钟让缓存完全失效

## 📈 监控和验证

### 验证清理效果
1. 查看清理统计信息
2. 测试下载几个PNG确认新样式
3. 检查数据库中的缓存记录数量

### 监控指标
- 缓存命中率变化
- PNG生成时间
- 用户下载成功率

## 🎯 推荐流程

对于书信体样式更新，推荐以下流程：

1. **测试新样式**: 先用几个内容测试新样式效果
2. **备份确认**: 确认新样式满意后再进行批量清理
3. **执行清理**: 使用一键脚本清理所有缓存
4. **验证效果**: 下载几个PNG确认新样式生效
5. **监控观察**: 观察用户反馈和系统性能

```bash
# 推荐的一键执行命令
./scripts/clear-all-png-cache.sh
```

这样就能确保所有用户立即看到新的书信体样式！
