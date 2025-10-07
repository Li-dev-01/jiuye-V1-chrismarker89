# 🔧 常见问题排查指南

> **最后更新**: 2025年10月7日  
> **适用版本**: v1.0.0

---

## 📋 目录

- [认证问题](#认证问题)
- [问卷问题](#问卷问题)
- [故事问题](#故事问题)
- [审核问题](#审核问题)
- [性能问题](#性能问题)
- [数据问题](#数据问题)
- [部署问题](#部署问题)

---

## 🔐 认证问题

### 问题1: Token过期导致401错误

**现象**:
```
Error: 401 Unauthorized
Message: "Token已过期"
```

**原因**:
- JWT Token默认24小时过期
- 用户长时间未活动
- 服务器时间不同步

**解决方案**:
```typescript
// 1. 前端实现自动刷新Token
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${oldToken}`
      }
    });
    const { token } = await response.json();
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    // Token无法刷新，跳转登录页
    window.location.href = '/login';
  }
};

// 2. 在请求拦截器中处理
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      error.config.headers['Authorization'] = `Bearer ${newToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

**预防措施**:
- 实现Token自动刷新机制
- 设置合理的过期时间
- 使用Refresh Token

---

### 问题2: Google OAuth回调失败

**现象**:
```
Error: OAuth callback failed
Message: "Invalid redirect_uri"
```

**原因**:
- Redirect URI配置不匹配
- Google Cloud Console配置错误
- HTTPS要求未满足

**解决方案**:
```bash
# 1. 检查Google Cloud Console配置
# 确保Redirect URI完全匹配
Authorized redirect URIs:
https://your-domain.com/api/google-auth/callback
https://your-domain.pages.dev/api/google-auth/callback

# 2. 检查环境变量
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $GOOGLE_REDIRECT_URI

# 3. 验证HTTPS
curl -I https://your-domain.com
# 应该返回 200 OK
```

**预防措施**:
- 使用环境变量管理配置
- 在多个环境中测试
- 记录详细的错误日志

---

### 问题3: 半匿名认证失败

**现象**:
```
Error: Authentication failed
Message: "Invalid identity combination"
```

**原因**:
- 学校+专业组合不存在
- 哈希计算错误
- 数据库查询失败

**解决方案**:
```typescript
// 1. 验证输入数据
const validateIdentity = (school: string, major: string) => {
  if (!school || !major) {
    throw new Error('学校和专业不能为空');
  }
  
  // 检查是否在允许列表中
  const validSchools = ['清华大学', '北京大学', ...];
  const validMajors = ['计算机科学', '软件工程', ...];
  
  if (!validSchools.includes(school)) {
    throw new Error('学校不在允许列表中');
  }
  
  if (!validMajors.includes(major)) {
    throw new Error('专业不在允许列表中');
  }
};

// 2. 正确计算哈希
import crypto from 'crypto';

const generateIdentityHash = (school: string, major: string) => {
  const combined = `${school}:${major}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

// 3. 查询或创建用户
const findOrCreateSemiAnonymousUser = async (school: string, major: string) => {
  const identityHash = generateIdentityHash(school, major);
  
  let user = await db.queryFirst(`
    SELECT * FROM users WHERE identity_hash = ?
  `, [identityHash]);
  
  if (!user) {
    user = await db.execute(`
      INSERT INTO users (uuid, user_type, identity_hash, display_name)
      VALUES (?, 'semi_anonymous', ?, ?)
    `, [generateUUID(), identityHash, `${school}-${major}`]);
  }
  
  return user;
};
```

---

## 📝 问卷问题

### 问题4: 问卷提交失败

**现象**:
```
Error: 500 Internal Server Error
Message: "Failed to submit questionnaire"
```

**原因**:
- 数据格式不正确
- 必填字段缺失
- 数据库写入失败

**解决方案**:
```typescript
// 1. 验证数据格式
const validateQuestionnaireData = (data: any) => {
  const required = ['user_id', 'questionnaire_id', 'responses'];
  
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`缺少必填字段: ${field}`);
    }
  }
  
  // 验证responses格式
  if (typeof data.responses !== 'object') {
    throw new Error('responses必须是对象');
  }
};

// 2. 使用事务确保数据一致性
const submitQuestionnaire = async (data: QuestionnaireData) => {
  await db.transaction(async (tx) => {
    // 插入响应
    const responseId = await tx.execute(`
      INSERT INTO universal_questionnaire_responses (...)
      VALUES (...)
    `);
    
    // 更新统计
    await tx.execute(`
      UPDATE questionnaire_v2_statistics
      SET count = count + 1
      WHERE ...
    `);
  });
};

// 3. 添加重试机制
const submitWithRetry = async (data: any, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await submitQuestionnaire(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // 指数退避
    }
  }
};
```

---

### 问题5: 统计数据不准确

**现象**:
- 统计数字与实际不符
- 百分比计算错误
- 数据延迟更新

**原因**:
- 缓存未更新
- 触发器未执行
- 并发写入冲突

**解决方案**:
```sql
-- 1. 清除统计缓存
DELETE FROM questionnaire_v2_statistics
WHERE calculated_at < datetime('now', '-1 day');

-- 2. 重新计算统计
-- 手动触发统计计算
INSERT OR REPLACE INTO questionnaire_v2_statistics (
  questionnaire_id, dimension, metric_name, metric_value, count, percentage
)
SELECT 
  'employment-survey-2024',
  'employment_status',
  'employed',
  'employed',
  COUNT(*),
  CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM universal_questionnaire_responses) AS REAL)
FROM universal_questionnaire_responses
WHERE JSON_EXTRACT(responses, '$.employment.status') = 'employed';

-- 3. 验证数据一致性
SELECT 
  (SELECT COUNT(*) FROM universal_questionnaire_responses) as total_responses,
  (SELECT SUM(count) FROM questionnaire_v2_statistics WHERE dimension = 'employment_status') as stats_total;
-- 两个数字应该相等
```

---

## 📖 故事问题

### 问题6: 故事一直pending不发布

**现象**:
- 故事提交成功但不显示
- 状态一直是pending
- 审核流程卡住

**原因**:
- AI审核服务不可用
- 人工审核队列积压
- 审核流程异常

**解决方案**:
```bash
# 1. 检查审核状态
wrangler d1 execute college-employment-survey --remote --command="
SELECT id, status, audit_level, created_at
FROM pending_stories
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 10;
"

# 2. 手动推进审核
wrangler d1 execute college-employment-survey --remote --command="
UPDATE pending_stories
SET status = 'approved', approved_at = CURRENT_TIMESTAMP
WHERE id = 123;
"

# 3. 移动到valid_stories
wrangler d1 execute college-employment-survey --remote --command="
INSERT INTO valid_stories (
  raw_id, data_uuid, user_id, title, content, category, tags, author_name
)
SELECT 
  id, hex(randomblob(16)), user_id, title, content, category, tags, author_name
FROM pending_stories
WHERE id = 123;
"

# 4. 检查AI服务状态
curl -X POST https://your-api.com/api/audit/test \
  -H "Content-Type: application/json" \
  -d '{"content": "测试内容", "content_type": "story"}'
```

---

### 问题7: PNG卡片生成失败

**现象**:
```
Error: PNG generation failed
Message: "Failed to upload to R2"
```

**原因**:
- R2存储配置错误
- 内容数据不完整
- 渲染引擎错误

**解决方案**:
```typescript
// 1. 检查R2配置
const r2Config = {
  accountId: env.R2_ACCOUNT_ID,
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucket: 'employment-survey-storage'
};

console.log('R2 Config:', {
  accountId: r2Config.accountId ? '✓' : '✗',
  accessKeyId: r2Config.accessKeyId ? '✓' : '✗',
  secretAccessKey: r2Config.secretAccessKey ? '✓' : '✗'
});

// 2. 验证内容数据
const story = await db.queryFirst(`
  SELECT * FROM valid_stories WHERE id = ?
`, [storyId]);

if (!story) {
  throw new Error('Story not found');
}

if (!story.title || !story.content) {
  throw new Error('Story data incomplete');
}

// 3. 清除缓存重试
await pngService.clearCache('story', storyId);
const result = await pngService.generatePng('story', storyId, 'gradient');

// 4. 检查R2权限
// 在Cloudflare Dashboard中验证R2 Bucket权限
```

---

## 🛡️ 审核问题

### 问题8: 误判率过高

**现象**:
- 正常内容被拒绝
- 违规内容被通过
- AI评分不准确

**原因**:
- 规则过于严格
- AI模型不准确
- 阈值设置不当

**解决方案**:
```typescript
// 1. 调整审核阈值
const config = {
  autoApproveScore: 50,  // 从60降到50
  autoRejectScore: 20,   // 从30降到20
};

// 2. 优化敏感词库
const sensitiveWords = [
  // 移除误判词汇
  // '求职', '面试' - 这些是正常词汇
  
  // 添加真正的违规词
  '垃圾广告',
  '色情内容',
  // ...
];

// 3. 切换AI模型
const aiConfig = {
  provider: 'claude',  // 使用更准确的模型
  model: 'claude-3-sonnet',
  temperature: 0.3  // 降低随机性
};

// 4. 人工审核兜底
if (aiScore >= 30 && aiScore < 60) {
  // 进入人工审核队列
  await addToManualReviewQueue(storyId);
}
```

---

## ⚡ 性能问题

### 问题9: API响应慢

**现象**:
- 接口响应时间 > 3s
- 数据库查询慢
- 页面加载卡顿

**原因**:
- 缺少索引
- N+1查询问题
- 未使用缓存

**解决方案**:
```sql
-- 1. 添加索引
CREATE INDEX IF NOT EXISTS idx_stories_category_approved 
ON valid_stories(category, approved_at);

CREATE INDEX IF NOT EXISTS idx_responses_questionnaire_submitted
ON universal_questionnaire_responses(questionnaire_id, submitted_at);

-- 2. 优化查询
-- 优化前（N+1问题）
SELECT * FROM valid_stories;
-- 然后对每个story查询点赞数

-- 优化后（JOIN查询）
SELECT 
  s.*,
  COUNT(l.id) as like_count
FROM valid_stories s
LEFT JOIN story_likes l ON s.id = l.story_id
GROUP BY s.id;

-- 3. 使用EXPLAIN分析查询
EXPLAIN QUERY PLAN
SELECT * FROM valid_stories
WHERE category = 'job_search'
ORDER BY approved_at DESC
LIMIT 20;
```

```typescript
// 4. 实现缓存
const cache = new Map();

const getCachedData = async (key: string, fetcher: () => Promise<any>, ttl = 300) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl * 1000) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

// 使用缓存
const stats = await getCachedData('dashboard-stats', async () => {
  return await getDashboardStats();
}, 60); // 缓存60秒
```

---

## 💾 数据问题

### 问题10: 数据不一致

**现象**:
- 统计数据与原始数据不符
- 关联数据丢失
- 数据重复

**原因**:
- 未使用事务
- 并发写入冲突
- 外键约束缺失

**解决方案**:
```typescript
// 1. 使用事务确保一致性
await db.transaction(async (tx) => {
  // 插入故事
  const storyId = await tx.execute(`
    INSERT INTO valid_stories (...) VALUES (...)
  `);
  
  // 更新用户统计
  await tx.execute(`
    UPDATE user_reputation
    SET approved_content_count = approved_content_count + 1
    WHERE user_id = ?
  `, [userId]);
  
  // 如果任何一步失败，整个事务回滚
});

// 2. 添加唯一约束防止重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_story_uuid
ON valid_stories(data_uuid);

// 3. 定期数据一致性检查
const checkDataConsistency = async () => {
  const results = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM valid_stories) as story_count,
      (SELECT SUM(approved_content_count) FROM user_reputation) as reputation_count
  `);
  
  if (results[0].story_count !== results[0].reputation_count) {
    console.error('数据不一致！需要修复');
    // 触发修复流程
  }
};
```

---

## 🚀 部署问题

### 问题11: Cloudflare Workers部署失败

**现象**:
```
Error: Deployment failed
Message: "Script too large"
```

**原因**:
- 代码包超过1MB限制
- 依赖包过大
- 未进行代码分割

**解决方案**:
```bash
# 1. 检查包大小
wrangler publish --dry-run --outdir=dist
ls -lh dist/

# 2. 优化依赖
# 移除未使用的依赖
npm prune

# 3. 使用外部依赖
# wrangler.toml
[build]
command = "npm run build"

[build.upload]
format = "modules"
main = "./dist/index.js"

# 4. 代码分割
# 将大型模块移到外部服务
# 使用Durable Objects存储状态
```

---

### 问题12: 环境变量未生效

**现象**:
- 配置读取失败
- 功能异常
- 连接错误

**解决方案**:
```bash
# 1. 检查环境变量
wrangler secret list

# 2. 设置环境变量
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET

# 3. 验证配置
wrangler tail --format=pretty
# 查看日志中的配置值

# 4. 本地开发配置
# .dev.vars
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
JWT_SECRET=xxx
```

---

## 📞 获取帮助

### 日志查看
```bash
# 实时日志
wrangler tail --format=pretty

# 过滤错误
wrangler tail --format=pretty | grep ERROR

# 查看特定时间段
wrangler tail --since=1h
```

### 数据库调试
```bash
# 连接数据库
wrangler d1 execute college-employment-survey --remote --command="SELECT * FROM users LIMIT 5;"

# 导出数据
wrangler d1 export college-employment-survey --remote --output=backup.sql

# 查看表结构
wrangler d1 execute college-employment-survey --remote --command="
SELECT sql FROM sqlite_master WHERE type='table';
"
```

### 联系支持
- 查看项目文档: `docs/technical-archive/`
- 搜索相关报告: `grep -r "关键词" docs/`
- 查看实现报告: 根目录下的各种报告文件

---

## 📚 相关文档

- [API文档](../api/API_DOCUMENTATION.md)
- [数据库设计](../database/DATABASE_SCHEMA.md)
- [功能索引](../features/FEATURE_INDEX.md)
- [认证系统](../features/authentication/README.md)
- [问卷系统](../features/questionnaire/README.md)
- [故事系统](../features/stories/README.md)
- [审核系统](../features/review/README.md)
