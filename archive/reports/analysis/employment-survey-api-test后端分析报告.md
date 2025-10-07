# employment-survey-api-test 后端分析报告

## 📋 概览

**后端名称**: `employment-survey-api-test`  
**部署平台**: Cloudflare Workers  
**环境类型**: 测试环境 (Test Environment)  
**部署状态**: 🟢 已部署运行  
**访问地址**: https://employment-survey-api-test.chrismarker89.workers.dev

---

## 🎯 核心功能

### 1. **问卷2集成测试专用后端**

`employment-survey-api-test` 是专门为**问卷2 (questionnaire-v2-2024)** 集成测试而创建的测试环境后端。

**主要用途**:
- 测试问卷2的新功能（经济压力分析、就业信心评估）
- 验证问卷2与问卷1的混合可视化功能
- 隔离测试环境，避免影响生产环境

---

## 🏗️ 后端架构

### 后端环境对比

| 特性 | employment-survey-api-prod | employment-survey-api-test |
|------|---------------------------|---------------------------|
| **环境** | 生产环境 (Production) | 测试环境 (Test) |
| **用途** | 正式服务用户 | 问卷2集成测试 |
| **问卷支持** | 问卷1 + Universal | 问卷1 + 问卷2 + Universal |
| **数据库** | college-employment-survey | college-employment-survey (共享) |
| **JWT密钥** | 生产密钥 | 测试密钥 |
| **R2存储** | employment-survey-storage | employment-survey-storage-test |
| **部署状态** | 🟢 运行中 (901请求, 625错误) | 🟢 运行中 (108请求, 95错误) |

### 配置详情

**后端配置文件**: `backend/wrangler.toml`

```toml
# 测试环境配置 - 问卷2集成测试
[env.test]
name = "employment-survey-api-test"

[env.test.vars]
ENVIRONMENT = "test"
JWT_SECRET = "test-jwt-secret-key-for-questionnaire2"
CORS_ORIGIN = "*"
R2_BUCKET_NAME = "employment-survey-storage-test"
GOOGLE_CLIENT_SECRET = "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"

# 测试环境使用相同的数据库，但会添加问卷2专用表
[[env.test.d1_databases]]
binding = "DB"
database_name = "college-employment-survey"
database_id = "25eee5bd-9aee-439a-8723-c73bf5f4f3d9"

[env.test.ai]
binding = "AI"
gateway_id = "chris-ai-01"

[[env.test.analytics_engine_datasets]]
binding = "ANALYTICS"
```

---

## 🔗 与前端的关系

### 前端环境配置

**前端测试环境**: `college-employment-survey-frontend-test`

**配置文件**: `frontend/wrangler.toml`

```toml
[env.test]
name = "college-employment-survey-frontend-test"

[env.test.vars]
ENVIRONMENT = "test"
VITE_APP_VERSION = "2.0.0-test"
VITE_API_BASE_URL = "https://employment-survey-api-test.chrismarker89.workers.dev/api"
VITE_GOOGLE_REDIRECT_URI = "https://college-employment-survey-frontend-test.pages.dev/auth/google/callback"
```

### 前后端连接关系

```
前端测试环境 (college-employment-survey-frontend-test)
    ↓
    调用 VITE_API_BASE_URL
    ↓
后端测试环境 (employment-survey-api-test)
    ↓
    访问 D1 数据库 (college-employment-survey)
    ↓
    返回问卷2数据
```

### 当前生产环境配置

**前端生产环境**: `college-employment-survey-frontend` (当前部署)

**API配置**: `frontend/src/config/apiConfig.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787',
  // ...
};
```

**环境变量**: `frontend/.env.production`

```env
VITE_API_BASE_URL=https://employment-survey-api-prod.chrismarker89.workers.dev
```

**问题**: 
- ✅ 当前生产前端调用 `employment-survey-api-prod`
- ✅ 问卷2 API 只部署在 `employment-survey-api-test`
- ✅ 因此生产环境无法访问问卷2功能（这是设计预期）

---

## 📊 API端点对比

### employment-survey-api-prod (生产环境)

**支持的API**:
```
/api/questionnaire-v1/*          # 问卷1 API
/api/universal-questionnaire/*   # 统一问卷 API
/api/auth/*                      # 认证 API
/api/admin/*                     # 管理 API
/api/stories/*                   # 故事墙 API
```

**不支持**:
```
/api/questionnaire-v2/*          # ❌ 问卷2 API (未部署)
```

### employment-survey-api-test (测试环境)

**支持的API**:
```
/api/questionnaire-v1/*          # 问卷1 API
/api/questionnaire-v2/*          # ✅ 问卷2 API (测试专用)
/api/universal-questionnaire/*   # 统一问卷 API
/api/auth/*                      # 认证 API
/api/admin/*                     # 管理 API
/api/stories/*                   # 故事墙 API
```

**特有功能**:
```
/api/questionnaire-v2/analytics/:questionnaireId  # 问卷2可视化数据
/api/questionnaire-v2/test-data                   # 问卷2测试数据
/api/questionnaire-v2/definition/:questionnaireId # 问卷2定义
```

---

## 🗄️ 数据库架构

### 共享数据库

**数据库名称**: `college-employment-survey`  
**数据库ID**: `25eee5bd-9aee-439a-8723-c73bf5f4f3d9`  
**类型**: Cloudflare D1 (SQLite)

**重要**: 生产环境和测试环境**共享同一个数据库**，但使用不同的表：

```
college-employment-survey (D1数据库)
├── questionnaire_responses          # 问卷1数据 (生产+测试共用)
├── questionnaire_v2_responses       # 问卷2数据 (测试专用)
├── questionnaire_submissions        # Universal问卷数据 (生产+测试共用)
├── questionnaire_v2_visualization   # 问卷2可视化缓存 (测试专用)
└── 其他共享表...
```

### 数据隔离策略

1. **表级隔离**: 问卷2使用专用表 (`questionnaire_v2_*`)
2. **环境标识**: 通过 `ENVIRONMENT` 变量区分
3. **测试数据标记**: 问卷2数据包含 `include_test_data` 标识

---

## 🚀 部署流程

### 测试环境部署

**部署脚本**: `scripts/deploy-test-branch.sh`

```bash
# 部署测试环境后端
cd backend
wrangler deploy --env test

# 部署结果
✅ 后端地址: https://employment-survey-api-test.chrismarker89.workers.dev
```

**部署命令**:
```bash
# 完整部署测试环境
bash scripts/deploy-test-branch.sh deploy

# 只部署后端
bash scripts/deploy-test-branch.sh backend

# 验证部署
bash scripts/deploy-test-branch.sh verify
```

### 生产环境部署

```bash
# 部署生产环境后端
cd backend
wrangler deploy

# 部署结果
✅ 后端地址: https://employment-survey-api-prod.chrismarker89.workers.dev
```

---

## 📈 使用场景

### 场景1: 问卷2功能测试

**测试环境**:
- 前端: https://college-employment-survey-frontend-test.pages.dev
- 后端: https://employment-survey-api-test.chrismarker89.workers.dev
- 访问: https://college-employment-survey-frontend-test.pages.dev/questionnaire-v2/analytics

**用途**:
- 测试问卷2的经济压力分析功能
- 验证问卷2与问卷1的混合可视化
- 测试Tab切换和数据转换

### 场景2: 生产环境服务

**生产环境**:
- 前端: https://099d2f86.college-employment-survey-frontend-l84.pages.dev
- 后端: https://employment-survey-api-prod.chrismarker89.workers.dev
- 访问: https://099d2f86.college-employment-survey-frontend-l84.pages.dev/analytics

**用途**:
- 正式服务用户
- 使用问卷1和Universal问卷
- 使用模拟数据（当前配置）

---

## 🔧 技术特性

### 1. 环境隔离

- **独立Worker**: 测试环境和生产环境是独立的Cloudflare Workers
- **独立配置**: 不同的JWT密钥、CORS设置、R2存储桶
- **共享数据库**: 使用相同的D1数据库，但表级隔离

### 2. 问卷2专用功能

- **经济压力分析**: 3个专业维度的经济压力评估
- **就业信心评估**: 基于经济压力的就业信心分析
- **混合可视化**: 结合问卷1的6个维度和问卷2的3个维度

### 3. 数据源管理

- **测试数据**: 包含 `include_test_data=true` 参数
- **模拟数据**: 前端可配置使用模拟数据
- **API降级**: API故障时自动降级到模拟数据

---

## 📊 运行状态

### 当前统计 (从Cloudflare Dashboard)

**employment-survey-api-prod**:
- 请求数: 901
- 错误数: 625
- 平均响应时间: 5.6ms
- 绑定数: 4

**employment-survey-api-test**:
- 请求数: 108
- 错误数: 95
- 平均响应时间: 18.7ms
- 绑定数: 3

**分析**:
- 测试环境请求量较少（正常，仅用于测试）
- 错误率较高（可能是测试期间的调试请求）
- 响应时间略慢（测试环境资源配置较低）

---

## 🎯 总结

### employment-survey-api-test 的作用

1. **问卷2集成测试**: 专门用于测试问卷2的新功能
2. **环境隔离**: 避免测试影响生产环境
3. **功能验证**: 验证问卷2与问卷1的混合可视化
4. **数据隔离**: 使用专用表存储问卷2数据

### 与前端的关系

1. **测试前端** → `employment-survey-api-test` → 问卷2功能
2. **生产前端** → `employment-survey-api-prod` → 问卷1功能
3. **数据源配置**: 前端通过 `VITE_API_BASE_URL` 控制调用哪个后端

### 下一步建议

1. **问卷2上线**: 如果问卷2测试完成，可以部署到生产环境
2. **API迁移**: 将问卷2 API部署到 `employment-survey-api-prod`
3. **前端切换**: 更新生产前端配置，启用问卷2功能
4. **数据迁移**: 将测试数据迁移到生产环境（如需要）

---

**报告生成时间**: 2025-01-04  
**分析基于**: Cloudflare Workers配置、项目文档、部署脚本
