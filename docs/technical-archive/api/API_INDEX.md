# 📚 API总索引

## 📋 目录结构

```
api/
├── API_INDEX.md              # 本文件 - API总索引
├── API_DOCUMENTATION.md      # API完整文档
├── endpoints/                # 端点详细文档
│   ├── authentication.md     # 认证相关端点
│   ├── questionnaire.md      # 问卷相关端点
│   ├── stories.md            # 故事相关端点
│   ├── review.md             # 审核相关端点
│   └── analytics.md          # 数据分析端点
└── schemas/                  # 数据模型定义
    ├── user.md               # 用户模型
    ├── questionnaire.md      # 问卷模型
    ├── story.md              # 故事模型
    └── review.md             # 审核模型
```

---

## 🎯 快速导航

### 按功能模块

#### 🔐 认证系统
- [认证端点文档](endpoints/authentication.md)
- [用户模型](schemas/user.md)

#### 📝 问卷系统
- [问卷端点文档](endpoints/questionnaire.md)
- [问卷模型](schemas/questionnaire.md)

#### 📖 故事系统
- [故事端点文档](endpoints/stories.md)
- [故事模型](schemas/story.md)

#### ✅ 审核系统
- [审核端点文档](endpoints/review.md)
- [审核模型](schemas/review.md)

#### 📊 数据分析
- [分析端点文档](endpoints/analytics.md)

---

## 📊 API端点统计

### 认证系统 (5个端点)
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 用户登出
- POST /api/auth/refresh - 刷新令牌
- GET /api/auth/profile - 获取用户信息

### 问卷系统 (6个端点)
- GET /api/questionnaires - 获取问卷列表
- GET /api/questionnaires/:id - 获取问卷详情
- POST /api/questionnaires/:id/submit - 提交问卷答案
- GET /api/questionnaires/:id/results - 获取问卷结果
- POST /api/questionnaires/:id/tags - 生成用户标签
- GET /api/questionnaires/stats - 问卷统计数据

### 故事系统 (8个端点)
- GET /api/stories - 获取故事列表
- GET /api/stories/:id - 获取故事详情
- POST /api/stories - 创建故事
- PUT /api/stories/:id - 更新故事
- DELETE /api/stories/:id - 删除故事
- POST /api/stories/:id/like - 点赞故事
- POST /api/stories/:id/comment - 评论故事
- GET /api/stories/recommended - 获取推荐故事

### 审核系统 (5个端点)
- GET /api/reviews/pending - 获取待审核列表
- GET /api/reviews/:id - 获取审核详情
- POST /api/reviews/:id/approve - 批准内容
- POST /api/reviews/:id/reject - 拒绝内容
- GET /api/reviews/history - 审核历史

### 数据分析 (4个端点)
- GET /api/analytics/overview - 总览数据
- GET /api/analytics/tags - 标签统计
- GET /api/analytics/stories - 故事统计
- GET /api/analytics/users - 用户统计

---

## 🔍 按HTTP方法分类

### GET 请求 (15个)
查询和获取数据的端点

### POST 请求 (11个)
创建和提交数据的端点

### PUT 请求 (1个)
更新数据的端点

### DELETE 请求 (1个)
删除数据的端点

---

## 📖 使用指南

### 1. 查看完整API文档
参考 [API_DOCUMENTATION.md](API_DOCUMENTATION.md) 获取所有端点的详细信息

### 2. 查看特定模块端点
访问 `endpoints/` 目录下的对应文件

### 3. 查看数据模型
访问 `schemas/` 目录下的对应文件

### 4. API调用示例
每个端点文档都包含：
- 请求参数说明
- 响应格式示例
- 错误处理说明
- 实际调用示例

---

## 🔗 相关文档

- [数据库设计](../database/DATABASE_SCHEMA.md)
- [功能模块索引](../features/FEATURE_INDEX.md)
- [常见问题](../troubleshooting/COMMON_ISSUES.md)

---

## 📝 更新日志

### 2025-01-XX
- ✅ 创建API索引文档
- ✅ 整理端点分类
- ✅ 添加快速导航

---

**最后更新**: 2025-01-XX  
**维护者**: 技术团队

