# 🤖 Cloudflare AI Gateway 配置指南

## 📋 前置条件检查

### ✅ 当前状态
- Cloudflare账户: ✅ 已有 (chrismarker89@gmail.com)
- Workers部署: ✅ 已完成
- 管理后台: ✅ 已部署

### ❌ 缺失配置
- AI Gateway: ❌ 未创建
- AI模型配置: ❌ 未设置
- Workers AI绑定: ❌ 未配置

## 🚀 配置步骤

### 第一步：创建AI Gateway

1. **访问AI Gateway页面**
   - 地址: https://dash.cloudflare.com/9b15e8449073204a6ca924e44366f/ai/ai-gateway
   - 点击 "Create Gateway" 按钮

2. **配置Gateway设置**
   ```
   Gateway Name: employment-survey-ai-gateway
   Description: AI content moderation for employment survey platform
   ```

3. **获取Gateway信息**
   - Gateway ID: [创建后获得]
   - Gateway URL: [创建后获得]
   - API Token: [创建后获得]

### 第二步：配置AI模型

1. **启用Workers AI**
   - 在Cloudflare Dashboard中启用Workers AI
   - 确认可用的AI模型列表

2. **验证模型可用性**
   ```bash
   # 测试文本分类模型
   curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/huggingface/distilbert-sst-2-int8" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     -d '{"text": "test content"}'
   
   # 测试内容安全模型
   curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-guard-3-8b" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "test content"}]}'
   ```

### 第三步：更新Worker配置

1. **添加AI绑定到wrangler.toml**
   ```toml
   [[ai]]
   binding = "AI"
   
   [vars]
   AI_GATEWAY_ID = "your-gateway-id"
   AI_GATEWAY_TOKEN = "your-gateway-token"
   ```

2. **更新环境变量**
   ```bash
   wrangler secret put AI_GATEWAY_TOKEN
   wrangler secret put CLOUDFLARE_API_TOKEN
   ```

### 第四步：修复API路径

当前问题：前端调用 `/api/ai-moderation/*` 但后端是 `/api/simple-admin/ai-moderation/*`

**解决方案1：修复前端API路径**
```typescript
// 在 api.ts 中添加
AI_MODERATION_CONFIG: '/api/simple-admin/ai-moderation/config',
AI_MODERATION_STATS: '/api/simple-admin/ai-moderation/stats',
AI_MODERATION_TEST: '/api/simple-admin/ai-moderation/test',
```

**解决方案2：修复后端路由**
```typescript
// 在 simpleAdmin.ts 中添加别名路由
app.route('/api/ai-moderation', simpleAdmin);
```

## 🔧 立即修复步骤

### 1. 创建AI Gateway
- 访问: https://dash.cloudflare.com/9b15e8449073204a6ca924e44366f/ai/ai-gateway
- 点击 "Create Gateway"
- 配置名称: `employment-survey-ai-gateway`

### 2. 修复API路径问题
需要更新前端API配置以匹配后端路由

### 3. 配置Workers AI绑定
在wrangler.toml中添加AI绑定配置

### 4. 测试AI模型可用性
验证所选模型是否在您的账户中可用

## 📝 配置模板

### wrangler.toml 更新
```toml
name = "employment-survey-api-prod"
main = "src/index.ts"
compatibility_date = "2024-09-01"

[[d1_databases]]
binding = "DB"
database_name = "college-employment-survey"
database_id = "your-database-id"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "employment-survey-storage"

[[ai]]
binding = "AI"

[vars]
ENVIRONMENT = "production"
JWT_SECRET = "your-jwt-secret"
CORS_ORIGIN = "*"
R2_BUCKET_NAME = "employment-survey-storage"
AI_GATEWAY_ID = "employment-survey-ai-gateway"
```

### 环境变量设置
```bash
# 设置AI Gateway相关密钥
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put AI_GATEWAY_TOKEN

# 重新部署Worker
wrangler deploy
```

## ⚠️ 重要注意事项

1. **账户限制**: 确认您的Cloudflare账户支持Workers AI
2. **模型可用性**: 不是所有模型在所有账户中都可用
3. **费用**: Workers AI按使用量计费，请注意成本控制
4. **配额限制**: 免费账户有使用限制

## 🎯 下一步行动

1. **立即**: 创建AI Gateway
2. **然后**: 修复API路径问题
3. **接着**: 配置Workers AI绑定
4. **最后**: 测试AI功能

完成这些步骤后，AI审核功能就能正常工作了！
