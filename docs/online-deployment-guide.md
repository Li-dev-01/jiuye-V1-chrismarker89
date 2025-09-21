# 分级审核系统线上部署指南

> **目标**: 将分级审核系统部署到线上Cloudflare环境  
> **状态**: 准备就绪，等待部署  
> **预计时间**: 30-60分钟

## 🎯 部署概览

### 部署架构
```
前端 (Cloudflare Pages) 
    ↓
分级审核Worker (Cloudflare Workers)
    ↓  
线上数据库 (MySQL)
```

### 核心组件
1. **数据库迁移脚本** - 创建分级审核表结构
2. **Cloudflare Worker** - 分级审核API服务
3. **前端组件** - 管理界面和服务集成

## 📋 部署步骤

### 第一步：数据库迁移

#### 1.1 执行SQL脚本
```sql
-- 在线上数据库执行以下脚本
-- 文件位置: backend/scripts/deploy_tiered_audit_online.sql

-- 1. 创建审核级别配置表
CREATE TABLE IF NOT EXISTS audit_level_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    level ENUM('level1', 'level2', 'level3') NOT NULL,
    config_name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_strictness DECIMAL(2,1) DEFAULT 1.0,
    ai_threshold DECIMAL(3,2) DEFAULT 0.5,
    manual_review_ratio DECIMAL(3,2) DEFAULT 0.1,
    enabled_categories JSON,
    disabled_rules JSON,
    max_processing_time_ms INT DEFAULT 100,
    batch_size INT DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_level_config (level, is_active)
);

-- 2. 创建其他必要表...
-- (完整脚本见 backend/scripts/deploy_tiered_audit_online.sql)
```

#### 1.2 验证迁移结果
```sql
-- 检查表是否创建成功
SHOW TABLES LIKE 'audit_%';

-- 检查配置数据
SELECT level, config_name, description FROM audit_level_configs ORDER BY level;
```

### 第二步：部署Cloudflare Worker

#### 2.1 创建新的Worker
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages
3. 创建新的Worker，命名为 `tiered-audit-api`

#### 2.2 部署Worker代码
```javascript
// 复制 backend/cloudflare/tiered-audit-worker.js 的内容
// 粘贴到Worker编辑器中

// 核心功能包括:
// - GET/POST /api/audit/level - 级别控制
// - POST /api/audit/test - 内容测试
// - GET /api/audit/stats - 统计信息
```

#### 2.3 配置Worker路由
```
# 添加路由规则
your-domain.com/api/audit/* -> tiered-audit-api
```

#### 2.4 测试Worker部署
```bash
# 测试API可用性
curl https://your-domain.com/api/audit/level

# 预期响应
{
  "success": true,
  "data": {
    "current_level": "level1",
    "config": {...},
    "auto_switch": true
  }
}
```

### 第三步：前端集成

#### 3.1 更新API配置
```typescript
// frontend/src/config/apiConfig.ts 已更新
export const API_ENDPOINTS = {
  // ... 其他端点
  AUDIT_LEVEL: '/api/audit/level',
  AUDIT_TEST: '/api/audit/test',
  AUDIT_STATS: '/api/audit/stats',
  AUDIT_HISTORY: '/api/audit/history',
};
```

#### 3.2 部署前端更新
```bash
# 构建前端
cd frontend
npm run build

# 部署到Cloudflare Pages
# (通过Git推送自动部署或手动上传)
```

#### 3.3 验证前端集成
1. 访问管理后台
2. 进入"审核管理" → "分级审核"标签页
3. 检查功能是否正常工作

## 🧪 功能测试

### 基础功能测试

#### 1. API健康检查
```bash
curl -X GET "https://your-domain.com/api/audit/level"
```

#### 2. 级别切换测试
```bash
curl -X POST "https://your-domain.com/api/audit/level" \
  -H "Content-Type: application/json" \
  -d '{"level": "level2", "admin_id": "test_admin"}'
```

#### 3. 内容审核测试
```bash
# 测试正常内容
curl -X POST "https://your-domain.com/api/audit/test" \
  -H "Content-Type: application/json" \
  -d '{"content": "这是一个正常的故事内容", "content_type": "story"}'

# 测试违规内容
curl -X POST "https://your-domain.com/api/audit/test" \
  -H "Content-Type: application/json" \
  -d '{"content": "习近平是国家主席", "content_type": "story"}'
```

#### 4. 统计信息测试
```bash
curl -X GET "https://your-domain.com/api/audit/stats"
```

### 前端功能测试

#### 1. 管理界面测试
- [ ] 访问分级审核控制台
- [ ] 查看当前审核级别
- [ ] 切换审核级别
- [ ] 查看统计信息
- [ ] 测试内容审核

#### 2. 集成测试
- [ ] 提交故事内容，验证审核流程
- [ ] 提交心声内容，验证审核流程
- [ ] 检查审核记录是否正确保存

## 📊 监控和维护

### 性能监控

#### 1. Worker性能
```javascript
// 在Worker中添加性能监控
console.log('Request processed in:', Date.now() - startTime, 'ms');
```

#### 2. 数据库监控
```sql
-- 监控审核统计
SELECT 
    current_audit_level,
    AVG(total_submissions) as avg_submissions,
    AVG(violation_rate) as avg_violation_rate
FROM audit_realtime_stats 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY current_audit_level;
```

### 日常维护

#### 1. 数据清理
```sql
-- 清理30天前的统计数据
DELETE FROM audit_realtime_stats 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 清理90天前的历史记录
DELETE FROM audit_level_history 
WHERE switched_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

#### 2. 规则优化
- 根据统计数据调整规则严格度
- 添加新的违规模式
- 优化误判率

## 🚨 故障排除

### 常见问题

#### 1. Worker无法访问
**症状**: API请求返回404或500错误
**解决方案**:
- 检查Worker部署状态
- 验证路由配置
- 查看Worker日志

#### 2. 数据库连接失败
**症状**: 统计信息无法加载
**解决方案**:
- 检查数据库表是否存在
- 验证SQL语法兼容性
- 检查数据库权限

#### 3. 前端集成问题
**症状**: 分级审核界面无法加载
**解决方案**:
- 检查API端点配置
- 验证CORS设置
- 查看浏览器控制台错误

### 调试工具

#### 1. API测试脚本
```bash
# 使用提供的测试脚本
python3 backend/tests/test_audit_api.py --url https://your-domain.com
```

#### 2. 前端调试
```javascript
// 在浏览器控制台执行
import { tieredAuditService } from './services/tieredAuditService';
await tieredAuditService.checkHealth();
```

## 📈 预期效果

### 性能指标
- **响应时间**: < 100ms
- **可用性**: 99.9%
- **并发处理**: 支持100+并发请求

### 业务效果
- **本地规则覆盖率**: 70%+
- **AI调用减少**: 50%+
- **审核准确率**: 95%+
- **误判率**: < 5%

## ✅ 部署检查清单

### 部署前检查
- [ ] 数据库迁移脚本准备完成
- [ ] Worker代码测试通过
- [ ] 前端代码构建成功
- [ ] API端点配置正确

### 部署后验证
- [ ] 数据库表创建成功
- [ ] Worker API正常响应
- [ ] 前端界面正常加载
- [ ] 基础功能测试通过

### 上线后监控
- [ ] 性能指标正常
- [ ] 错误率在可接受范围
- [ ] 用户反馈收集
- [ ] 系统稳定性监控

---

**注意事项**:
1. 部署前请备份现有数据
2. 建议在低峰期进行部署
3. 部署后密切监控系统状态
4. 如遇问题及时回滚

**联系支持**: 如遇部署问题，请查看故障排除章节或联系技术支持。
