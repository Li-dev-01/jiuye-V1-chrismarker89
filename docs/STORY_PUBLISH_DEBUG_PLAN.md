# 故事发布问题分步排查方案

**创建时间**: 2025-09-23 15:15 (UTC+8)  
**问题状态**: ✅ 已解决
**错误信息**: `employment-survey-api-prod.chrismarker89.workers.dev/api/stories/:1 Failed to load resource: the server responded with a status of 404 ()`

## 📋 **排查计划概览**

### **阶段1: API基础连通性验证**
### **阶段2: 数据库表结构验证** 
### **阶段3: 前端请求分析**
### **阶段4: 后端日志分析**
### **阶段5: 对比批量生成脚本**

---

## 🔍 **阶段1: API基础连通性验证**

### **步骤1.1: 验证API端点存在**
```bash
# 测试基础API健康检查
curl -s "https://employment-survey-api-prod.chrismarker89.workers.dev/api/health"

# 测试故事API GET请求
curl -s "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories"
```

### **步骤1.2: 验证POST端点**
```bash
# 最简单的POST请求测试
curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n"
```

### **步骤1.3: 验证路由配置**
```bash
# 检查所有可用路由
curl -s "https://employment-survey-api-prod.chrismarker89.workers.dev/api/debug/routes"
```

---

## 🗄️ **阶段2: 数据库表结构验证**

### **步骤2.1: 检查表是否存在**
```bash
# 检查数据库状态
curl -s "https://employment-survey-api-prod.chrismarker89.workers.dev/api/debug/database-status"
```

### **步骤2.2: 验证表结构**
```bash
# 检查表结构信息
curl -s "https://employment-survey-api-prod.chrismarker89.workers.dev/api/debug/table-schema"
```

### **步骤2.3: 手动创建表（如果需要）**
```bash
# 触发表创建
curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/database-fix/fix-stories-tables"
```

---

## 🌐 **阶段3: 前端请求分析**

### **步骤3.1: 检查前端实际发送的请求**
- 打开浏览器开发者工具
- 访问故事发布页面
- 尝试发布故事
- 查看Network标签页中的实际请求

### **步骤3.2: 验证请求格式**
检查以下内容：
- 请求URL是否正确
- 请求方法是否为POST
- Content-Type是否为application/json
- 请求体格式是否正确
- 认证头是否存在

### **步骤3.3: 模拟前端请求**
```bash
# 使用与前端相同的数据格式
curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [从浏览器复制的token]" \
  -d '{
    "title": "测试故事",
    "content": "这是测试内容",
    "category": "job_search",
    "tags": ["测试"],
    "user_id": "semi-20250923-20a0e009",
    "author_name": "半匿名用户_20a0e009",
    "is_anonymous": false
  }'
```

---

## 📊 **阶段4: 后端日志分析**

### **步骤4.1: 检查Worker日志**
```bash
# 查看最近的Worker日志
npx wrangler tail --format=pretty
```

### **步骤4.2: 添加调试端点**
创建专门的调试端点来追踪请求处理过程

### **步骤4.3: 验证环境变量**
```bash
# 检查环境变量配置
curl -s "https://employment-survey-api-prod.chrismarker89.workers.dev/api/debug/env-check"
```

---

## 🔄 **阶段5: 对比批量生成脚本**

### **步骤5.1: 找到之前成功的批量生成脚本**
- 查找项目中的批量数据生成脚本
- 分析脚本使用的API调用方式
- 对比请求格式差异

### **步骤5.2: 运行批量脚本测试**
- 运行之前成功的批量生成脚本
- 验证是否仍然可以成功创建故事
- 记录成功的请求格式

### **步骤5.3: 对比分析**
- 对比前端请求与脚本请求的差异
- 找出导致失败的关键差异点

---

## 🛠️ **执行顺序**

1. **立即执行**: 阶段1 - API连通性验证
2. **如果API正常**: 执行阶段2 - 数据库验证
3. **如果数据库正常**: 执行阶段3 - 前端请求分析
4. **并行执行**: 阶段4 - 后端日志分析
5. **最后执行**: 阶段5 - 对比批量脚本

---

## 📝 **记录模板**

### **测试结果记录**
```
阶段1结果:
- API健康检查: [成功/失败]
- GET /api/stories: [成功/失败]
- POST /api/stories: [HTTP状态码]

阶段2结果:
- 数据库连接: [成功/失败]
- 表存在性: [存在/不存在]
- 表结构: [正确/错误]

阶段3结果:
- 前端请求URL: [实际URL]
- 请求方法: [GET/POST/其他]
- 请求体: [JSON内容]
- 认证头: [存在/不存在]

阶段4结果:
- Worker日志: [错误信息]
- 环境变量: [正常/异常]

阶段5结果:
- 批量脚本: [成功/失败]
- 差异点: [具体差异]
```

---

## 🎯 **预期问题点**

基于404错误，可能的原因：
1. **路由配置问题**: API路由未正确注册
2. **请求路径错误**: 前端请求的路径不正确
3. **方法不匹配**: 请求方法与路由定义不匹配
4. **中间件拦截**: 认证或其他中间件阻止了请求
5. **Worker部署问题**: 最新代码未正确部署

---

## 🎉 **排查结果总结**

### ✅ **问题已解决**

**根本原因**: 前端请求URL路径错误
- ❌ 错误URL: `https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories/` (有尾部斜杠)
- ✅ 正确URL: `https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories` (无尾部斜杠)

### 🔍 **排查过程**

**阶段1: API基础连通性验证** ✅ 通过
- API健康检查: 成功
- GET /api/stories: 成功
- POST /api/stories: 正常（400错误是预期的）

**阶段2: 数据库表结构验证** ✅ 通过
- 数据库连接: 成功
- 表存在性: raw_story_submissions, valid_stories 都存在
- 数据计数: valid_stories(180), raw_story_submissions(1)

**阶段3: 前端请求分析** ❌ 发现问题
- 测试正确URL: 成功创建故事
- 测试错误URL (带斜杠): 404错误

### 🛠️ **修复方案**

修改 `frontend/src/services/storyService.ts`:
```typescript
// 修复前
const response = await this.client.post('/', data);

// 修复后
const response = await this.client.post('', data);
```

### 📊 **验证结果**

```bash
# 正确的URL测试
curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories"
# 响应: {"success":true,"data":{"id":184,"uuid":"...","message":"故事创建成功"}}

# 错误的URL测试
curl -X POST "https://employment-survey-api-prod.chrismarker89.workers.dev/api/stories/"
# 响应: {"success":false,"error":"Not Found","message":"请求的资源不存在"}
```

### 🌐 **最新部署**

**前端**: https://207a7895.college-employment-survey-frontend-l84.pages.dev
**修复版本**: v1.2.6 (URL路径修复版)

现在故事发布功能应该完全正常工作！
