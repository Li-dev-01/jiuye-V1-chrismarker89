# 📊 Cloudflare Analytics 真实数据集成指南

**创建时间**: 2025-09-30  
**目的**: 将 Cloudflare 真实 Analytics 数据集成到监控面板

---

## 🎯 当前状态

### 已完成 ✅
- Cloudflare 监控面板 UI (使用模拟数据)
- 管理员前端部署
- 基础架构设计

### 待完成 ⏳
- 集成真实 Cloudflare Analytics API
- 配置 Workers Analytics Engine
- 添加自定义指标收集

---

## 📋 获取所需凭据

### 您的 Account ID (已获取) ✅

```
Account ID: 9b1815e8844907e320a6ca924e44366f
Account Name: Chrismarker89@gmail.com's Account
```

### 需要创建 API Token ⏳

**步骤**:

1. **登录 Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   ```

2. **进入 API Tokens 页面**
   - 点击右上角头像
   - 选择 **My Profile**
   - 左侧菜单选择 **API Tokens**
   - 点击 **Create Token**

3. **创建自定义 Token**
   - 选择 **Create Custom Token**
   - **Token name**: `Analytics Read Token`
   
4. **配置权限**
   ```
   Permissions:
   - Account → Analytics → Read
   - Account → Workers Analytics Engine → Read
   - Zone → Analytics → Read (如果有自定义域名)
   
   Account Resources:
   - Include → Chrismarker89@gmail.com's Account
   
   Zone Resources:
   - Include → All zones (或选择特定域名)
   ```

5. **创建并保存 Token**
   - 点击 **Continue to summary**
   - 点击 **Create Token**
   - **重要**: 复制生成的 Token (只显示一次)
   - 格式类似: `aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890`

---

## 🔧 集成方案

### 方案 1: Workers Analytics Engine (推荐)

**优势**:
- ✅ 完全控制收集的指标
- ✅ 无限基数 (unlimited cardinality)
- ✅ 实时数据
- ✅ 免费额度: 1000万 数据点/月

**实施步骤**:

#### 1. 添加 Analytics Engine 绑定

编辑 `backend/wrangler.toml`:

```toml
# Analytics Engine 配置
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

#### 2. 在 Worker 中记录指标

创建 `backend/src/services/analyticsEngine.ts`:

```typescript
export interface AnalyticsEngineDataPoint {
  blobs?: string[];
  doubles?: number[];
  indexes?: string[];
}

export class WorkerAnalyticsService {
  constructor(private analytics: AnalyticsEngineDataset) {}

  // 记录 HTTP 请求
  recordRequest(data: {
    path: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    country?: string;
  }) {
    this.analytics.writeDataPoint({
      blobs: [
        data.path,
        data.method,
        data.userAgent || 'unknown',
        data.country || 'unknown'
      ],
      doubles: [
        data.statusCode,
        data.responseTime
      ],
      indexes: [
        `status_${Math.floor(data.statusCode / 100)}xx`
      ]
    });
  }

  // 记录数据库查询
  recordDatabaseQuery(data: {
    queryType: 'read' | 'write';
    duration: number;
    success: boolean;
  }) {
    this.analytics.writeDataPoint({
      blobs: [data.queryType, data.success ? 'success' : 'error'],
      doubles: [data.duration],
      indexes: [`db_${data.queryType}`]
    });
  }

  // 记录缓存命中
  recordCacheHit(data: {
    hit: boolean;
    path: string;
  }) {
    this.analytics.writeDataPoint({
      blobs: [data.path],
      doubles: [data.hit ? 1 : 0],
      indexes: [data.hit ? 'cache_hit' : 'cache_miss']
    });
  }
}
```

#### 3. 在 Worker 中间件中使用

编辑 `backend/src/worker.ts`:

```typescript
import { WorkerAnalyticsService } from './services/analyticsEngine';

app.use('*', async (c, next) => {
  const startTime = Date.now();
  const analytics = new WorkerAnalyticsService(c.env.ANALYTICS);

  try {
    await next();
  } finally {
    const responseTime = Date.now() - startTime;
    
    // 记录请求指标
    analytics.recordRequest({
      path: new URL(c.req.url).pathname,
      method: c.req.method,
      statusCode: c.res.status,
      responseTime,
      userAgent: c.req.header('user-agent'),
      country: c.req.header('cf-ipcountry')
    });
  }
});
```

#### 4. 查询 Analytics Engine 数据

创建 API 端点 `backend/src/routes/analytics.ts`:

```typescript
import { Hono } from 'hono';

const analytics = new Hono();

// 获取 Analytics Engine 数据
analytics.get('/cloudflare/metrics', async (c) => {
  const accountId = '9b1815e8844907e320a6ca924e44366f';
  const apiToken = c.env.CLOUDFLARE_API_TOKEN;
  
  // 查询最近 24 小时的数据
  const query = `
    SELECT
      blob1 AS path,
      blob2 AS method,
      AVG(double2) AS avg_response_time,
      COUNT(*) AS request_count,
      SUM(CASE WHEN index1 = 'status_2xx' THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN index1 = 'status_4xx' THEN 1 ELSE 0 END) AS client_error_count,
      SUM(CASE WHEN index1 = 'status_5xx' THEN 1 ELSE 0 END) AS server_error_count
    FROM ANALYTICS
    WHERE timestamp >= NOW() - INTERVAL '24' HOUR
    GROUP BY path, method
    ORDER BY request_count DESC
    LIMIT 100
  `;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    }
  );

  const data = await response.json();
  
  return c.json({
    success: true,
    data
  });
});

export default analytics;
```

---

### 方案 2: GraphQL Analytics API (适用于有自定义域名)

**前提条件**:
- 需要有自定义域名绑定到 Pages/Workers
- 需要 Zone ID

**查询示例**:

```graphql
query {
  viewer {
    zones(filter: { zoneTag: "YOUR_ZONE_ID" }) {
      httpRequests1dGroups(
        limit: 1000
        filter: {
          date_gt: "2025-09-29T00:00:00Z"
          date_lt: "2025-09-30T00:00:00Z"
        }
      ) {
        sum {
          requests
          cachedRequests
          bytes
          cachedBytes
          threats
        }
        dimensions {
          date
        }
      }
    }
  }
}
```

---

## 🚀 实施步骤

### 第一步: 创建 API Token

**请您协助完成**:

1. 访问: https://dash.cloudflare.com/profile/api-tokens
2. 创建 Token (按照上面的步骤)
3. 复制 Token 并提供给我

### 第二步: 配置环境变量

将 API Token 添加到 Worker Secrets:

```bash
cd backend
npx wrangler secret put CLOUDFLARE_API_TOKEN
# 粘贴您的 API Token
```

### 第三步: 添加 Analytics Engine 绑定

编辑 `backend/wrangler.toml`:

```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

### 第四步: 部署更新

```bash
cd backend
npm run deploy
```

### 第五步: 更新前端

修改 `reviewer-admin-dashboard/src/pages/AdminCloudflareMonitoring.tsx`:

```typescript
const loadCloudflareAnalytics = async () => {
  setLoading(true);
  try {
    // 调用真实 API
    const response = await fetch('/api/analytics/cloudflare/metrics');
    const data = await response.json();
    
    if (data.success) {
      // 处理真实数据
      setAnalytics(processAnalyticsData(data.data));
    }
  } catch (error) {
    console.error('加载 Cloudflare Analytics 失败:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## 📊 可收集的指标

### HTTP 请求指标
- 总请求数
- 请求路径分布
- HTTP 方法分布
- 状态码分布 (2xx, 3xx, 4xx, 5xx)
- 平均响应时间
- P50, P95, P99 响应时间
- 地理分布 (通过 `cf-ipcountry` header)

### Worker 性能指标
- Worker 调用次数
- Worker 执行时间
- Worker 错误率
- CPU 时间

### D1 数据库指标
- 查询次数
- 读/写比例
- 平均查询时间
- 错误次数

### 缓存指标
- 缓存命中率
- 缓存未命中率
- 缓存节省的带宽

---

## 💰 成本估算

### Workers Analytics Engine 定价

**免费额度**:
- 1000万 数据点/月

**超出免费额度**:
- $0.25 / 100万 数据点

**预估**:
- 假设每个请求记录 3 个数据点
- 每天 10万 请求 = 30万 数据点/天
- 每月 900万 数据点
- **成本**: $0 (在免费额度内)

---

## 🎯 下一步

### 请您协助:

1. **创建 API Token**
   - 访问: https://dash.cloudflare.com/profile/api-tokens
   - 按照上面的步骤创建
   - 复制 Token 并提供给我

2. **确认是否有自定义域名**
   - 如果有，提供域名和 Zone ID
   - 如果没有，我们使用 Workers Analytics Engine

### 我将完成:

1. 添加 Analytics Engine 绑定
2. 实现数据收集中间件
3. 创建查询 API
4. 更新前端集成真实数据
5. 部署和测试

---

## 📚 参考文档

- [Workers Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
- [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)
- [API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

---

**准备好后，请提供 API Token，我将立即开始集成！** 🚀

