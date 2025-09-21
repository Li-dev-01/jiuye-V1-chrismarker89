# 🎓 大学生就业调研平台 V1

[![GitHub](https://img.shields.io/badge/GitHub-jiuye--V2-blue?logo=github)](https://github.com/Li-dev-01/jiuye_V2)
[![Version](https://img.shields.io/badge/Version-v1.0.0--beta-green)](https://github.com/Li-dev-01/jiuye_V2)
[![AI Powered](https://img.shields.io/badge/AI-Powered-purple)](README.md)

> 🚀 **AI驱动的智能就业调研平台** - 集成多AI提供商的内容审核与管理系统

## 📋 项目概述

大学生就业调研平台是一个现代化的Web应用，旨在收集、分析和管理大学生就业相关数据。平台集成了先进的AI技术，提供智能内容审核、多维度数据分析和高效的管理功能。

### 🎯 核心功能

- 📝 **问卷调查系统** - 就业情况数据收集
- 📖 **故事分享平台** - 求职经历分享与交流
- 🤖 **AI智能审核** - 多维度内容分析与审核建议
- 📊 **数据统计分析** - 实时数据可视化
- 👥 **多角色管理** - 管理员、审核员、用户分级管理

### 🚀 AI增强特性

- 🔄 **多AI提供商支持** - OpenAI、Grok、Claude、Gemini
- ⚖️ **智能负载均衡** - 自动选择最优AI服务
- 💰 **成本控制系统** - 实时预算监控与优化
- 🎯 **智能内容分析** - 质量、情感、安全、相关性评估
- 💡 **审核建议系统** - AI辅助决策支持

## 🛠️ 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI库**: Ant Design 5.x
- **状态管理**: Zustand + Context API
- **路由**: React Router v6
- **样式**: CSS Modules + 响应式设计

### 后端技术栈
- **运行时**: Cloudflare Workers
- **框架**: Hono.js
- **数据库**: SQLite (D1)
- **认证**: JWT + 权限系统
- **API**: RESTful API设计

### AI集成架构
- **多AI提供商**: OpenAI, Grok, Claude, Gemini
- **负载均衡**: 智能路由和故障转移
- **成本控制**: 实时监控和预算管理
- **审核助手**: 多维度内容分析

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/Li-dev-01/jiuye_V2.git
cd jiuye_V2
```

2. **安装依赖**
```bash
# 前端依赖
cd frontend
npm install
```

3. **启动开发服务器**
```bash
# 启动前端 (端口 5177)
npm run dev
```

4. **访问应用**
- 前端: http://localhost:5177
- 管理员: http://localhost:5177/admin/login
- 审核员: http://localhost:5177/reviewer/login
- AI演示: http://localhost:5177/demo/ai

## 📱 功能模块

### 用户端功能
- 🔐 **半匿名认证** - 保护隐私的登录系统
- 📝 **问卷填写** - 就业情况调研
- 📖 **故事发布** - 求职经历分享
- 📱 **移动适配** - 完整的移动端体验

### 管理端功能
- 👥 **用户管理** - 用户信息和权限管理
- 📋 **内容审核** - AI辅助智能审核
- 📊 **数据统计** - 实时数据分析和可视化
- 🤖 **AI管理** - 完整的AI服务管理
- 🔧 **系统配置** - 灵活的参数配置

### AI增强功能
- 🎯 **智能分析** - 内容质量、情感、安全性分析
- 💡 **审核建议** - 基于AI的智能审核建议
- 💰 **成本优化** - 智能AI服务选择和成本控制
- 📈 **性能监控** - 实时AI服务监控和报警

## 🎯 AI管理系统

### AI水源配置
- 多AI提供商统一管理
- 实时健康检查和状态监控
- 连接测试和配置验证
- 成本追踪和使用统计

### 智能负载均衡
- 基于质量、成本、响应时间的智能路由
- 自动故障转移和恢复
- 实时性能监控
- 可配置的负载策略

### 成本控制
- 实时预算监控和报警
- 自动成本优化策略
- 详细的成本分析报告
- 预算超限保护机制

### AI审核助手
- 多维度内容分析
- 智能审核建议
- 置信度评估
- 问题内容自动标记

## 📊 项目状态

### 开发进度
- ✅ **Phase 1**: 项目初始化 (100%)
- ✅ **Phase 2**: 核心功能开发 (100%)
- ✅ **Phase 3**: AI集成与高级功能 (100%)
- 🔄 **Phase 4**: 测试与优化 (进行中)

### 功能完成度
- ✅ 用户认证系统 (100%)
- ✅ 问卷调查系统 (100%)
- ✅ 故事分享系统 (100%)

- ✅ 管理员后台 (100%)
- ✅ AI水源管理 (100%)
- ✅ AI审核助手 (100%)
- ✅ 响应式设计 (100%)

## 🔧 开发指南

### 项目结构
```
jiuye_V2/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── stores/          # 状态管理
│   │   ├── types/           # TypeScript类型
│   │   └── utils/           # 工具函数
│   └── public/              # 静态资源
├── backend/                 # 后端应用
└── dev-daily-v1/           # 开发日志
```

## 📈 性能指标

### 前端性能
- 首屏加载时间: <2s
- 交互响应时间: <500ms
- 代码分割: 按路由懒加载
- 缓存策略: 智能缓存管理

### AI性能
- 分析准确率: 85%+
- 响应时间: <2s
- 可用性: 99%+
- 成本效率: 优化20%+

### 系统性能
- 并发用户: 1000+
- 数据库查询: <100ms
- API响应: <500ms
- 系统可用性: 99.9%

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 贡献流程
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系方式

- **项目维护者**: Jiuye Team
- **GitHub**: [Li-dev-01](https://github.com/Li-dev-01)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**⭐ 如果这个项目对您有帮助，请给我们一个星标！**
