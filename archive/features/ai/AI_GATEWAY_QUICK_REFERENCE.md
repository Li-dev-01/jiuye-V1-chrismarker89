# 🚀 AI Gateway 优化配置 - 快速参考指南

## 📋 目录

1. [快速访问](#快速访问)
2. [配置建议](#配置建议)
3. [常用命令](#常用命令)
4. [故障排查](#故障排查)
5. [性能调优](#性能调优)

---

## 🔗 快速访问

### 管理后台

- **登录页面**: https://c45d1494.reviewer-admin-dashboard.pages.dev/admin/login
- **AI 审核页面**: https://c45d1494.reviewer-admin-dashboard.pages.dev/admin/ai-moderation
- **Gateway 优化**: 进入 AI 审核页面 → 点击 "Gateway 优化" Tab

### Cloudflare Dashboard

- **AI Gateway 概览**: https://dash.cloudflare.com/9b1815e8844907e320a6ca924e44366f/ai/ai-gateway/gateways/chris-ai-01
- **日志查看**: https://dash.cloudflare.com/9b1815e8844907e320a6ca924e44366f/ai/ai-gateway/gateways/chris-ai-01/logs
- **分析统计**: https://dash.cloudflare.com/9b1815e8844907e320a6ca924e44366f/ai/ai-gateway/gateways/chris-ai-01/analytics

### API 端点

```
后端 API: https://employment-survey-api-prod.chrismarker89.workers.dev
健康检查: https://employment-survey-api-prod.chrismarker89.workers.dev/health
```

---

## ⚙️ 配置建议

### 1️⃣ 缓存策略 (推荐配置)

```json
{
  "enabled": true,
  "ttl": 3600,                    // 1小时 (生产环境)
  "maxSize": 10000,               // 10000条 (根据内存调整)
  "strategy": "lru",              // LRU 策略
  "confidenceThreshold": 0.7,     // 只缓存高置信度结果
  "excludePatterns": ["test", "debug", "sample"]
}
```

**调优建议**:
- 开发环境: TTL = 600 (10分钟)
- 测试环境: TTL = 1800 (30分钟)
- 生产环境: TTL = 3600 (1小时)
- 高流量: maxSize = 50000+

### 2️⃣ 速率限制 (推荐配置)

```json
{
  "enabled": true,
  "perMinute": 100,               // 每分钟 100 次
  "perHour": 1000,                // 每小时 1000 次
  "perDay": 10000,                // 每天 10000 次
  "burstSize": 20,                // 突发 20 次
  "costBudget": 1.0,              // 每日预算 $1
  "alertThreshold": 80            // 80% 时告警
}
```

**调优建议**:
- 低流量: perMinute = 50, perHour = 500, perDay = 5000
- 中流量: perMinute = 100, perHour = 1000, perDay = 10000
- 高流量: perMinute = 200, perHour = 2000, perDay = 20000
- 成本敏感: costBudget = 0.5, alertThreshold = 70

### 3️⃣ 提示词管理 (推荐配置)

```json
{
  "enabled": true,
  "version": "1.0.0",
  "optimization": {
    "autoOptimize": false,        // 手动优化更可控
    "abTesting": false,           // 生产环境谨慎使用
    "performanceTracking": true   // 始终启用
  }
}
```

**调优建议**:
- 初期: 使用默认提示词，启用性能追踪
- 优化期: 根据追踪数据调整提示词
- 稳定期: 锁定版本，禁用自动优化

### 4️⃣ 告警配置 (推荐配置)

```json
{
  "enabled": true,
  "channels": {
    "email": false,               // 邮件 (可选)
    "webhook": true,              // Webhook (推荐)
    "dashboard": true             // 控制台 (必须)
  },
  "rules": {
    "highErrorRate": { "enabled": true, "threshold": 5 },
    "slowResponse": { "enabled": true, "threshold": 2000 },
    "costOverrun": { "enabled": true, "threshold": 80 },
    "quotaExceeded": { "enabled": true, "threshold": 90 },
    "anomalyDetection": { "enabled": true, "sensitivity": 0.8 }
  }
}
```

**调优建议**:
- 开发环境: 只启用 dashboard
- 测试环境: 启用 webhook + dashboard
- 生产环境: 启用所有渠道

---

## 💻 常用命令

### 获取认证 Token

```bash
TOKEN=$(curl -s -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin123"}' | jq -r '.data.token')

echo "Token: ${TOKEN:0:20}..."
```

### 查看当前配置

```bash
curl -s -X GET "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/gateway/config" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### 更新配置

```bash
curl -s -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/gateway/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cache": {
      "enabled": true,
      "ttl": 7200
    }
  }' | jq '.'
```

### 查看统计信息

```bash
curl -s -X GET "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/gateway/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### 清空缓存

```bash
curl -s -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/gateway/cache/clear" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### 查看配置历史

```bash
curl -s -X GET "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/gateway/config/history?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### 测试 AI 分析

```bash
# 第一次请求 (缓存未命中)
curl -s -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"测试内容","contentType":"story"}' | jq '{cached: .data.cached, processingTime: .data.processingTime}'

# 第二次请求 (应该缓存命中)
curl -s -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"测试内容","contentType":"story"}' | jq '{cached: .data.cached, processingTime: .data.processingTime}'
```

---

## 🔧 故障排查

### 问题 1: 缓存未命中

**症状**: `cached: null` 或 `cached: false`

**可能原因**:
1. 缓存未启用
2. 置信度低于阈值
3. 内容匹配排除模式
4. 缓存已过期

**解决方案**:
```bash
# 检查配置
curl -s -X GET ".../gateway/config" -H "Authorization: Bearer $TOKEN" | jq '.data.cache'

# 检查统计
curl -s -X GET ".../gateway/stats" -H "Authorization: Bearer $TOKEN" | jq '.data.cache'

# 调整配置
# 1. 确保 enabled = true
# 2. 降低 confidenceThreshold (如 0.5)
# 3. 检查 excludePatterns
```

### 问题 2: 速率限制触发

**症状**: `429 Too Many Requests`

**可能原因**:
1. 超过每分钟/小时/天限制
2. 超过成本预算

**解决方案**:
```bash
# 检查当前使用量
curl -s -X GET ".../gateway/stats" -H "Authorization: Bearer $TOKEN" | jq '.data.rateLimit'

# 调整限制
# 1. 增加 perMinute/perHour/perDay
# 2. 增加 costBudget
# 3. 等待时间窗口重置
```

### 问题 3: 响应时间慢

**症状**: `processingTime > 2000ms`

**可能原因**:
1. 缓存未启用或未命中
2. AI 模型响应慢
3. 网络延迟

**解决方案**:
```bash
# 启用缓存
# 1. 设置 cache.enabled = true
# 2. 增加 cache.ttl
# 3. 降低 confidenceThreshold

# 优化性能
# 1. 启用 performance.parallelRequests
# 2. 启用 performance.modelFallback
# 3. 减少 performance.timeoutMs
```

### 问题 4: 告警未触发

**症状**: 没有收到告警通知

**可能原因**:
1. 告警未启用
2. 渠道未配置
3. 阈值设置过高
4. Webhook URL 错误

**解决方案**:
```bash
# 检查告警配置
curl -s -X GET ".../gateway/config" -H "Authorization: Bearer $TOKEN" | jq '.data.alerts'

# 检查告警历史
curl -s -X GET ".../gateway/stats" -H "Authorization: Bearer $TOKEN" | jq '.data.alerts'

# 调整配置
# 1. 确保 alerts.enabled = true
# 2. 启用至少一个渠道
# 3. 降低阈值进行测试
# 4. 验证 webhookUrl
```

---

## 🎯 性能调优

### 场景 1: 高流量优化

**目标**: 处理大量请求，降低成本

**配置**:
```json
{
  "cache": {
    "enabled": true,
    "ttl": 7200,              // 增加到 2 小时
    "maxSize": 50000,         // 增加缓存容量
    "confidenceThreshold": 0.6  // 降低阈值，缓存更多
  },
  "rateLimit": {
    "perMinute": 200,
    "perHour": 2000,
    "perDay": 20000
  }
}
```

**预期效果**:
- 缓存命中率: 70-80%
- 成本降低: 70-80%
- 响应时间: <100ms (缓存命中)

### 场景 2: 低延迟优化

**目标**: 最快响应时间

**配置**:
```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 20000,
    "confidenceThreshold": 0.5  // 更激进的缓存
  },
  "performance": {
    "parallelRequests": true,
    "timeoutMs": 3000,          // 降低超时
    "retryAttempts": 1          // 减少重试
  }
}
```

**预期效果**:
- P50 响应时间: <100ms
- P95 响应时间: <500ms
- P99 响应时间: <1000ms

### 场景 3: 成本优化

**目标**: 最低成本

**配置**:
```json
{
  "cache": {
    "enabled": true,
    "ttl": 86400,             // 24 小时
    "maxSize": 100000,
    "confidenceThreshold": 0.5
  },
  "rateLimit": {
    "costBudget": 0.5,        // 严格预算
    "alertThreshold": 70      // 提前告警
  }
}
```

**预期效果**:
- 每日成本: <$0.50
- 缓存命中率: 80-90%
- API 调用减少: 80-90%

### 场景 4: 高准确率优化

**目标**: 最高准确率

**配置**:
```json
{
  "cache": {
    "enabled": true,
    "confidenceThreshold": 0.9  // 只缓存高置信度
  },
  "prompts": {
    "optimization": {
      "performanceTracking": true,
      "abTesting": true         // 启用 A/B 测试
    }
  }
}
```

**预期效果**:
- 准确率: 95%+
- 一致性: 90%+
- 缓存命中率: 40-50% (较低，但质量高)

---

## 📊 监控指标

### 关键指标

| 指标 | 健康范围 | 警告范围 | 危险范围 |
|------|----------|----------|----------|
| **缓存命中率** | >60% | 40-60% | <40% |
| **响应时间 (P95)** | <500ms | 500-1000ms | >1000ms |
| **错误率** | <1% | 1-5% | >5% |
| **每日成本** | <$0.50 | $0.50-$1.00 | >$1.00 |
| **请求量 (每分钟)** | <80 | 80-95 | >95 |

### 监控命令

```bash
# 每 30 秒刷新统计
watch -n 30 'curl -s -X GET "https://employment-survey-api-prod.chrismarker89.workers.dev/api/simple-admin/ai-moderation/gateway/stats" -H "Authorization: Bearer $TOKEN" | jq ".data.cache, .data.rateLimit"'
```

---

## 🆘 紧急操作

### 紧急停用 AI 服务

```bash
curl -s -X POST ".../gateway/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cache": {"enabled": false}, "rateLimit": {"enabled": false}}' | jq '.'
```

### 紧急清空缓存

```bash
curl -s -X POST ".../gateway/cache/clear" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### 紧急降低成本

```bash
curl -s -X POST ".../gateway/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rateLimit": {
      "perMinute": 10,
      "perHour": 100,
      "perDay": 1000,
      "costBudget": 0.1
    }
  }' | jq '.'
```

---

## 📞 支持联系

- **文档**: 查看 `AI_GATEWAY_OPTIMIZATION_COMPLETE.md`
- **Cloudflare 文档**: https://developers.cloudflare.com/ai-gateway/
- **Workers AI 文档**: https://developers.cloudflare.com/workers-ai/

---

**快速参考指南** - 随时查阅！ 📖

