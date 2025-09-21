# 2025-08-01 技术归档文档

## 📚 **角色管理系统技术归档**

### 🎯 **文档目的**
为项目成员提供完整的技术参考，便于后续开发、维护和项目交接。

## 🛡️ **超级管理员 (SUPER_ADMIN) 技术归档**

### **核心职责**
专注于系统安全与可用性保障

### **技术栈**
```typescript
前端: React + TypeScript + Ant Design + CSS Modules
后端: Hono + TypeScript + SQLite
中间件: 安全防护中间件
数据库: SQLite (生产环境可升级为PostgreSQL)
```

### **关键文件结构**
```
frontend/src/
├── components/admin/
│   ├── SuperAdminDashboard.tsx          # 主控制台组件
│   └── SuperAdminDashboard.module.css   # 专用样式
├── pages/admin/
│   └── SuperAdminPage.tsx               # 页面容器
└── App.tsx                              # 路由配置

backend/src/
├── routes/
│   └── super-admin.ts                   # API路由
├── middleware/
│   └── security.ts                     # 安全中间件
└── types/                              # 类型定义

backend/database/
├── init_superadmin.sql                 # 数据库初始化
└── superadmin_tables.sql               # 表结构定义

docs/
├── SUPER_ADMIN_IMPLEMENTATION.md       # 详细实现文档
└── SUPER_ADMIN_SUMMARY.md             # 功能总结
```

### **API接口规范**
```typescript
// 项目状态控制
GET    /api/super-admin/project/status
POST   /api/super-admin/emergency/shutdown
POST   /api/super-admin/project/restore

// 安全监控
GET    /api/super-admin/security/metrics
GET    /api/super-admin/security/threats
POST   /api/super-admin/security/block-ip

// 权限验证中间件
authMiddleware + superAdminAuth
```

### **数据库表设计**
```sql
-- 系统配置表
system_config (id, config_key, config_value, updated_at, updated_by)

-- 安全事件表
security_events (id, event_type, severity, source_ip, details, status, created_at)

-- 操作日志表
admin_operation_logs (id, operator, operation, target, details, ip_address, created_at)

-- 用户行为分析表
user_behavior_analysis (id, user_uuid, ip_address, action_type, action_details, risk_score, created_at)
```

### **关键功能实现**
1. **紧急控制**: 通过system_config表控制项目状态
2. **威胁检测**: 基于用户行为分析和安全事件记录
3. **IP封禁**: 记录到security_events表，中间件自动拦截
4. **实时监控**: 定时查询安全指标，30秒刷新一次

## 👨‍💼 **管理员 (ADMIN) 技术归档**

### **核心职责**
专注于项目运维管理

### **关键文件结构**
```
frontend/src/
├── pages/admin/
│   ├── DashboardPage.tsx               # 管理员仪表板
│   ├── UserManagementPage.tsx          # 用户管理
│   ├── ContentManagementPage.tsx       # 内容管理
│   ├── AuditRulesPage.tsx             # 审核规则
│   └── ApiDataPage.tsx                # API与数据
├── components/admin/
│   ├── UserManagement.tsx              # 用户管理组件
│   ├── ContentManagement.tsx           # 内容管理组件
│   └── DataManagement.tsx             # 数据管理组件
└── stores/
    └── adminStore.ts                   # 管理员状态管理

backend/src/
├── routes/
│   ├── admin.ts                       # 管理员API
│   ├── users.ts                       # 用户管理API
│   └── content.ts                     # 内容管理API
```

### **API接口规范**
```typescript
// 用户管理
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id

// 内容管理
GET    /api/admin/content/questionnaires
GET    /api/admin/content/voices
GET    /api/admin/content/stories
PUT    /api/admin/content/:type/:id/status

// 系统配置
GET    /api/admin/config
PUT    /api/admin/config
GET    /api/admin/stats
```

### **权限控制**
- 需要ADMIN或SUPER_ADMIN角色
- 通过authMiddleware验证
- 操作日志记录到admin_operation_logs

## 👨‍⚖️ **审核员 (REVIEWER) 技术归档**

### **核心职责**
专注于内容审核工作

### **关键文件结构**
```
frontend/src/
├── pages/reviewer/
│   ├── ReviewerDashboard.tsx           # 审核员仪表板
│   ├── QuestionnaireReview.tsx         # 问卷审核
│   ├── VoiceReview.tsx                # 心声审核
│   └── StoryReview.tsx                # 故事审核
├── components/reviewer/
│   ├── ReviewCard.tsx                  # 审核卡片组件
│   ├── ReviewForm.tsx                  # 审核表单组件
│   └── ReviewStats.tsx                # 审核统计组件
└── stores/
    └── reviewerStore.ts               # 审核员状态管理

backend/src/
├── routes/
│   └── reviewer.ts                    # 审核员API
```

### **API接口规范**
```typescript
// 审核任务
GET    /api/reviewer/tasks
GET    /api/reviewer/tasks/:id
PUT    /api/reviewer/tasks/:id/review

// 审核统计
GET    /api/reviewer/stats
GET    /api/reviewer/history

// 权限验证
authMiddleware + reviewerAuth
```

### **审核流程**
1. 获取待审核内容列表
2. 逐一审核内容项
3. 提交审核结果（通过/拒绝/需修改）
4. 记录审核日志
5. 更新审核统计

## 🔐 **权限系统架构**

### **角色层次**
```
SUPER_ADMIN (超级管理员)
    ↓ 继承所有权限
ADMIN (管理员)
    ↓ 继承部分权限
REVIEWER (审核员)
    ↓ 基础权限
USER (普通用户)
```

### **权限验证流程**
```typescript
请求 → authMiddleware → 角色验证 → 权限检查 → 执行操作
```

### **中间件设计**
```typescript
// 通用认证中间件
authMiddleware: 验证JWT token，获取用户信息

// 角色权限中间件
adminAuth: 验证ADMIN或SUPER_ADMIN权限
reviewerAuth: 验证REVIEWER及以上权限
superAdminAuth: 验证SUPER_ADMIN权限

// 安全防护中间件
securityCheck: DDoS检测、暴力破解防护、行为记录
```

## 📊 **数据库设计规范**

### **表命名规范**
- 系统配置: `system_config`
- 用户相关: `users`, `user_sessions`
- 内容相关: `questionnaires`, `voices`, `stories`
- 审核相关: `review_logs`, `review_stats`
- 安全相关: `security_events`, `admin_operation_logs`

### **字段设计规范**
- 主键: `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- 时间戳: `created_at`, `updated_at` (DATETIME)
- 软删除: `deleted_at` (DATETIME NULL)
- JSON字段: `details`, `metadata` (TEXT)

### **索引设计**
- 查询频繁的字段添加索引
- 复合索引优化复杂查询
- 外键关系建立适当索引

## 🚀 **部署和配置**

### **环境变量配置**
```bash
# 安全配置
DDOS_THRESHOLD=100
BRUTE_FORCE_THRESHOLD=5
AUTO_EMERGENCY_THRESHOLD=200

# 数据库配置
DATABASE_URL=sqlite:./database.db

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### **数据库初始化**
```bash
# 执行初始化脚本
sqlite3 database.db < backend/database/init_superadmin.sql

# 创建超级管理员账号
UPDATE users SET role = 'SUPER_ADMIN' WHERE username = 'admin';
```

### **前端构建配置**
```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 类型检查
npm run type-check
```

## 📋 **开发规范**

### **代码规范**
- TypeScript严格模式
- ESLint + Prettier代码格式化
- 组件使用函数式组件 + Hooks
- CSS Modules避免样式冲突

### **API设计规范**
- RESTful API设计
- 统一的响应格式
- 详细的错误处理
- 完整的类型定义

### **安全规范**
- 所有API都需要权限验证
- 敏感操作记录详细日志
- 输入验证和SQL注入防护
- XSS和CSRF防护

## 🔄 **维护和扩展**

### **日常维护**
- 定期检查安全日志
- 监控系统性能指标
- 备份重要数据
- 更新依赖包版本

### **功能扩展**
- 新增角色权限
- 扩展API接口
- 优化数据库性能
- 增强安全防护

这份技术归档为项目的长期维护和团队协作提供了完整的技术参考。
