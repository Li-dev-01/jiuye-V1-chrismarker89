# 大学生就业问卷调查平台 V1 - 开发指南

## 🎯 开发原则

### 核心理念
1. **用户优先**: 所有功能设计以大学生用户体验为中心，界面简洁易用
2. **数据驱动**: 基于真实的就业数据做决策，确保问卷设计的科学性
3. **渐进增强**: 先实现问卷提交和基础分析，再逐步完善高级功能
4. **安全第一**: 保护用户隐私和数据安全，符合数据保护法规
5. **可维护性**: 代码要清晰、文档要完整、架构要合理，便于后续扩展

### V1项目特定原则
1. **问卷质量**: 确保问卷内容的准确性和有效性
2. **数据完整性**: 保证收集数据的完整性和一致性
3. **审核机制**: 建立有效的内容审核和质量控制机制
4. **可视化效果**: 提供直观清晰的数据可视化展示

### 开发优先级
1. **功能稳定性** > 性能优化
2. **用户体验** > 技术炫技
3. **数据安全** > 开发便利
4. **长期维护** > 短期实现

## 🏗️ 架构规范

### 前端开发规范 (React 18 + TypeScript + Vite)

#### 组件设计原则
- **单一职责**: 每个组件只负责一个功能，如问卷表单、数据图表等
- **可复用性**: 通用组件要支持多场景使用，如表格、按钮、输入框等
- **状态管理**: 使用Zustand管理全局状态，React useState管理本地状态
- **性能优化**: 使用React.memo、useMemo、useCallback避免不必要的重渲染

#### V1项目文件组织结构
```
frontend/src/
├── components/          # 通用组件
│   ├── ui/             # 基础UI组件 (Button, Input, Modal等)
│   ├── forms/          # 表单组件 (QuestionnaireForm等)
│   ├── charts/         # 图表组件 (BarChart, PieChart等)
│   └── layout/         # 布局组件 (Header, Sidebar, Footer等)
├── pages/              # 页面组件
│   ├── public/         # 公开页面 (问卷填写页面)
│   ├── admin/          # 管理页面 (数据分析、审核管理)
│   └── auth/           # 认证页面 (登录、注册)
├── hooks/              # 自定义Hook
│   ├── useAuth.ts      # 认证相关Hook
│   ├── useApi.ts       # API调用Hook
│   └── usePermission.ts # 权限检查Hook
├── stores/             # Zustand状态管理
│   ├── authStore.ts    # 认证状态
│   ├── questionnaireStore.ts # 问卷数据状态
│   └── uiStore.ts      # UI状态
├── services/           # API服务
│   ├── api.ts          # API客户端配置
│   ├── auth.ts         # 认证相关API
│   └── questionnaire.ts # 问卷相关API
├── types/              # TypeScript类型定义
│   ├── auth.ts         # 认证相关类型
│   ├── questionnaire.ts # 问卷相关类型
│   └── api.ts          # API响应类型
├── utils/              # 工具函数
│   ├── validation.ts   # 数据验证
│   ├── format.ts       # 数据格式化
│   └── constants.ts    # 常量定义
└── styles/             # 样式文件
    ├── globals.css     # 全局样式
    └── components/     # 组件样式
```

#### 命名规范
- **组件**: PascalCase (QuestionnaireForm.tsx, DataChart.tsx)
- **文件夹**: kebab-case (questionnaire-management, data-analysis)
- **函数**: camelCase (submitQuestionnaire, analyzeData)
- **常量**: UPPER_SNAKE_CASE (API_BASE_URL, QUESTIONNAIRE_TYPES)

### 后端开发规范 (Cloudflare Workers + Hono.js + D1)

#### API设计原则
- **RESTful风格**: 遵循REST API设计规范，如 GET /api/questionnaire, POST /api/questionnaire
- **统一响应格式**: 所有API返回统一的数据结构 { success: boolean, data: any, message: string }
- **错误处理**: 完善的错误码和错误信息，便于前端处理和用户理解
- **版本控制**: API版本化管理，如 /api/v1/questionnaire
- **认证授权**: 使用JWT token进行身份验证和权限控制

#### V1项目API端点设计
```
# 认证相关
POST /api/auth/login          # 用户登录
POST /api/auth/logout         # 用户登出
GET  /api/auth/profile        # 获取用户信息

# 问卷相关
POST /api/questionnaire       # 提交问卷
GET  /api/questionnaire       # 获取问卷列表
GET  /api/questionnaire/:id   # 获取单个问卷
PUT  /api/questionnaire/:id   # 更新问卷状态

# 审核相关
GET  /api/review/pending      # 获取待审核问卷
POST /api/review/:id/approve  # 审核通过
POST /api/review/:id/reject   # 审核拒绝

# 数据分析
GET  /api/analytics/summary   # 获取数据摘要
GET  /api/analytics/charts    # 获取图表数据
```

#### Cloudflare D1 数据库设计规范
- **命名规范**: 表名和字段名使用snake_case (users, questionnaire_responses)
- **索引优化**: 为查询频繁的字段建立索引 (user_id, created_at等)
- **数据完整性**: 使用外键约束保证数据一致性
- **备份策略**: 利用Cloudflare D1的自动备份功能，定期导出重要数据

## 📝 代码规范

### 通用规范
- **注释**: 复杂逻辑必须添加注释说明
- **函数长度**: 单个函数不超过50行
- **变量命名**: 使用有意义的变量名
- **代码格式**: 使用统一的代码格式化工具

### 前端特定规范
```typescript
// ✅ 好的示例
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// ❌ 避免的写法
const getUser = (id) => {
  return fetch('/api/user/' + id).then(r => r.json());
};
```

### 后端特定规范
```javascript
// ✅ 好的示例
class UserService {
  async getUserById(userId) {
    if (!userId) {
      throw new Error('用户ID不能为空');
    }
    
    try {
      const user = await this.db.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).get(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      return user;
    } catch (error) {
      console.error('查询用户失败:', error);
      throw error;
    }
  }
}

// ❌ 避免的写法
const getUser = (id) => {
  return db.query('SELECT * FROM users WHERE id = ' + id);
};
```

## 🔧 开发工作流

### 功能开发流程
1. **需求分析**: 明确功能需求和验收标准
2. **技术设计**: 设计API接口和数据结构
3. **编码实现**: 按照规范编写代码
4. **自测验证**: 本地测试功能完整性
5. **代码审查**: 检查代码质量和规范
6. **部署上线**: 部署到生产环境
7. **功能验证**: 验证线上功能正常
8. **文档更新**: 更新相关文档

### 问题修复流程
1. **问题确认**: 复现问题并确定影响范围
2. **根因分析**: 分析问题产生的根本原因
3. **解决方案**: 设计修复方案并评估风险
4. **代码修复**: 实现修复代码
5. **测试验证**: 验证修复效果
6. **部署上线**: 部署修复版本
7. **效果监控**: 监控修复效果
8. **经验总结**: 记录问题和解决方案

## 🧪 测试策略

### 测试类型
- **单元测试**: 测试单个函数或组件
- **集成测试**: 测试模块间的交互
- **端到端测试**: 测试完整的用户流程
- **性能测试**: 测试系统性能指标

### 测试覆盖率要求
- **核心业务逻辑**: 90%以上
- **API接口**: 80%以上
- **前端组件**: 70%以上
- **工具函数**: 95%以上

### 测试最佳实践
- **测试先行**: 重要功能先写测试再写实现
- **独立性**: 测试之间不能相互依赖
- **可读性**: 测试代码要清晰易懂
- **维护性**: 及时更新过时的测试

## 🚀 部署规范

### 部署环境
- **开发环境**: 用于日常开发和调试
- **测试环境**: 用于功能测试和集成测试
- **预生产环境**: 用于上线前的最终验证
- **生产环境**: 用于正式对外服务

### 部署检查清单
- [ ] 代码已通过所有测试
- [ ] 数据库迁移脚本已准备
- [ ] 环境变量已正确配置
- [ ] 依赖包版本已锁定
- [ ] 监控和日志已配置
- [ ] 回滚方案已准备

### 部署后验证
- [ ] 核心功能正常工作
- [ ] API接口响应正常
- [ ] 数据库连接正常
- [ ] 性能指标在预期范围
- [ ] 错误日志无异常

## 📊 性能优化

### 前端性能优化
- **代码分割**: 按路由或功能分割代码
- **懒加载**: 非关键资源延迟加载
- **缓存策略**: 合理使用浏览器缓存
- **图片优化**: 压缩图片并使用合适格式

### 后端性能优化
- **数据库优化**: 优化查询语句和索引
- **缓存策略**: 使用Redis等缓存热点数据
- **异步处理**: 耗时操作使用异步处理
- **负载均衡**: 分散请求压力

## 🔐 安全规范

### 数据安全
- **输入验证**: 所有用户输入必须验证
- **SQL注入防护**: 使用参数化查询
- **XSS防护**: 对输出内容进行转义
- **CSRF防护**: 使用CSRF令牌

### 访问控制
- **身份认证**: 验证用户身份
- **权限控制**: 检查用户权限
- **会话管理**: 安全的会话处理
- **敏感数据**: 加密存储敏感信息

## 📚 文档规范

### 代码文档
- **函数注释**: 说明函数用途、参数和返回值
- **类注释**: 说明类的职责和使用方法
- **复杂逻辑**: 添加详细的实现说明
- **API文档**: 完整的API接口文档

### 项目文档
- **README**: 项目介绍和快速开始
- **架构文档**: 系统架构和设计思路
- **部署文档**: 部署步骤和配置说明
- **用户手册**: 功能使用说明

## 🤝 协作规范

### Git工作流
- **分支策略**: 使用feature分支开发
- **提交信息**: 清晰描述提交内容
- **代码审查**: 重要变更需要审查
- **合并策略**: 使用squash merge保持历史清晰

### 沟通协作
- **问题反馈**: 及时反馈遇到的问题
- **进度同步**: 定期同步开发进度
- **知识分享**: 分享技术经验和最佳实践
- **文档维护**: 及时更新相关文档

## 💡 最佳实践

### 开发效率
- **工具使用**: 熟练使用开发工具和IDE
- **快捷键**: 掌握常用快捷键提高效率
- **代码模板**: 使用代码模板减少重复工作
- **自动化**: 自动化重复性任务

### 问题解决
- **日志分析**: 通过日志快速定位问题
- **调试技巧**: 掌握有效的调试方法
- **搜索技能**: 善用搜索引擎和技术社区
- **经验积累**: 记录和分享解决方案

---

**版本**: v1.0
**最后更新**: 2025-07-27
**适用范围**: 大学生就业问卷调查平台 V1 项目开发

> 💡 **提醒**: 这些规范是为了提高开发效率和代码质量，请在实际开发中严格遵守。如有疑问或建议，请及时沟通。
