# 测试文件归档目录

本目录包含项目开发过程中创建的所有测试文件，已按类型和功能分类整理。

## 📁 目录结构

```
test-files/
├── html/                    # HTML测试页面 (8个)
├── scripts/                 # JavaScript测试脚本 (22个)
│   ├── api/                 # API测试 (2个)
│   ├── questionnaire/       # 问卷测试 (11个)
│   ├── data/                # 数据测试 (3个)
│   └── other/               # 其他测试 (6个)
└── shell/                   # Shell测试脚本 (7个)
```

**总计**: 37个测试文件

---

## 📋 分类说明

### 1. html/ - HTML测试页面 (8个)

用于浏览器端的功能测试和调试。

**文件列表**:
- `test-anti-spam.html` - 反垃圾测试页面
- `test-api.html` - API接口测试页面
- `test-combo-generator.html` - 组合生成器测试
- `test-fixes.html` - 修复验证测试页面
- `test-google-oauth.html` - Google OAuth测试
- `test-questionnaire2-debug.html` - 问卷2调试页面
- `test-questionnaire2-navigation.html` - 问卷2导航测试
- `test-questionnaire2-visualization.html` - 问卷2可视化测试

**使用方法**:
```bash
# 在浏览器中打开
open archive/test-files/html/test-api.html
```

---

### 2. scripts/api/ - API测试脚本 (2个)

测试后端API接口的功能和性能。

**文件列表**:
- `test-api-routes.js` - API路由测试
- `test-frontend-api.js` - 前端API集成测试

**使用方法**:
```bash
# 使用Node.js运行
node archive/test-files/scripts/api/test-api-routes.js
```

---

### 3. scripts/questionnaire/ - 问卷测试脚本 (11个)

问卷系统的各类功能测试。

**文件列表**:
- `test-questionnaire-api.js` - 问卷API测试
- `test-questionnaire-flow.js` - 问卷流程测试
- `test-questionnaire-independence.js` - 问卷独立性测试
- `test-questionnaire2-economic-questions.js` - 问卷2经济问题测试
- `test-economic-questions.js` - 经济问题测试
- `test-economic-questions-enhanced.js` - 增强版经济问题测试
- `test-phase2-completion.js` - 阶段2完成测试
- `test-phase3-completion.js` - 阶段3完成测试
- `test-phase3-progress.js` - 阶段3进度测试
- `test-hybrid-visualization.js` - 混合可视化测试
- `test-visualization-completeness.js` - 可视化完整性测试

**主要测试内容**:
- 问卷数据提交和验证
- 七维度可视化系统
- 问卷流程完整性
- 数据准确性验证

**使用方法**:
```bash
# 运行问卷API测试
node archive/test-files/scripts/questionnaire/test-questionnaire-api.js
```

---

### 4. scripts/data/ - 数据测试脚本 (3个)

数据生成、验证和提交测试。

**文件列表**:
- `test-data-generation.js` - 数据生成测试
- `test-data-accuracy-validation.js` - 数据准确性验证
- `test-submission.js` - 数据提交测试

**主要测试内容**:
- 测试数据生成
- 数据完整性验证
- 提交流程测试

**使用方法**:
```bash
# 运行数据生成测试
node archive/test-files/scripts/data/test-data-generation.js
```

---

### 5. scripts/other/ - 其他测试脚本 (6个)

综合性和专项测试脚本。

**文件列表**:
- `test-complete-flow.js` - 完整流程测试
- `test-e2e-functionality.js` - 端到端功能测试
- `test-fixes-simple.js` - 简单修复测试
- `test-import-fix.js` - 导入修复测试
- `test-performance-optimization.js` - 性能优化测试
- `test-ux-enhancement.js` - UX增强测试

**主要测试内容**:
- 端到端流程
- 性能优化验证
- 用户体验改进
- Bug修复验证

**使用方法**:
```bash
# 运行端到端测试
node archive/test-files/scripts/other/test-e2e-functionality.js
```

---

### 6. shell/ - Shell测试脚本 (7个)

使用Shell脚本进行的系统级测试。

**文件列表**:
- `test-account-operations.sh` - 账户操作测试
- `test-admin-auth-system.sh` - 管理员认证系统测试
- `test-email-role-accounts.sh` - 邮箱角色账户测试
- `test-questionnaire2-api.sh` - 问卷2 API测试
- `test-questionnaire2-flow.sh` - 问卷2流程测试
- `test-reviewer-api.sh` - 审核员API测试
- `test-super-admin-auth.sh` - 超级管理员认证测试

**主要测试内容**:
- 认证系统
- 账户管理
- API接口
- 权限验证

**使用方法**:
```bash
# 运行Shell测试
bash archive/test-files/shell/test-admin-auth-system.sh
```

---

## 📊 统计信息

### 按类型分布

| 类型 | 数量 | 占比 |
|------|------|------|
| JavaScript脚本 | 22 | 59.5% |
| HTML页面 | 8 | 21.6% |
| Shell脚本 | 7 | 18.9% |

### 按功能分布

| 功能 | 数量 |
|------|------|
| 问卷系统 | 11 |
| HTML测试页面 | 8 |
| Shell脚本 | 7 |
| 其他综合测试 | 6 |
| 数据测试 | 3 |
| API测试 | 2 |

---

## 🎯 使用指南

### 运行HTML测试

```bash
# 在浏览器中打开
open archive/test-files/html/test-questionnaire2-visualization.html

# 或使用http-server
cd archive/test-files/html
npx http-server
```

### 运行JavaScript测试

```bash
# 单个测试
node archive/test-files/scripts/api/test-api-routes.js

# 批量运行某个分类
for file in archive/test-files/scripts/questionnaire/*.js; do
  echo "Running $file..."
  node "$file"
done
```

### 运行Shell测试

```bash
# 单个测试
bash archive/test-files/shell/test-admin-auth-system.sh

# 批量运行
for file in archive/test-files/shell/*.sh; do
  echo "Running $file..."
  bash "$file"
done
```

---

## 📝 测试文件说明

### HTML测试页面特点

- **独立运行**: 可直接在浏览器中打开
- **可视化调试**: 提供UI界面进行交互测试
- **实时反馈**: 即时显示测试结果

### JavaScript测试脚本特点

- **自动化**: 可通过Node.js自动执行
- **详细日志**: 输出详细的测试过程和结果
- **可集成**: 可集成到CI/CD流程

### Shell测试脚本特点

- **系统级**: 测试系统级功能和API
- **快速执行**: 执行速度快
- **易于调试**: 输出清晰的测试结果

---

## ⚠️ 注意事项

### 环境要求

**HTML测试**:
- 现代浏览器（Chrome、Firefox、Safari等）
- 可能需要本地服务器（避免CORS问题）

**JavaScript测试**:
- Node.js环境
- 可能需要安装依赖包
- 需要配置API端点

**Shell测试**:
- Bash环境
- curl命令
- jq命令（JSON处理）

### 配置说明

部分测试文件可能需要配置：
- API端点URL
- 认证令牌
- 测试数据

请在运行前检查文件中的配置部分。

---

## 🔄 维护说明

### 测试文件状态

这些测试文件是开发过程中创建的：
- ✅ 部分测试仍然有效
- ⚠️ 部分测试可能已过时
- 📝 建议在使用前检查和更新

### 更新建议

1. **定期检查**: 每季度检查一次测试文件
2. **删除过时**: 删除不再适用的测试
3. **更新配置**: 更新API端点和配置
4. **文档同步**: 保持文档与代码同步

---

## 📞 相关资源

### 当前测试

项目中的正式测试位于：
- **后端测试**: `/backend/tests/`
- **前端测试**: `/employment-survey-frontend/src/__tests__/`
- **管理后台测试**: `/reviewer-admin-dashboard/src/__tests__/`

### 文档链接

- **测试指南**: `/archive/guides/testing/`
- **API文档**: `/docs/technical-archive/api/`
- **功能文档**: `/docs/features/`

---

## ✅ 整理信息

- **整理日期**: 2025-10-07
- **文件总数**: 37个
- **分类数**: 6个
- **整理脚本**: `/organize_test_files.sh`

---

## 🎯 快速查找

### 按功能查找

**测试问卷系统**:
```bash
ls archive/test-files/scripts/questionnaire/
```

**测试API**:
```bash
ls archive/test-files/scripts/api/
ls archive/test-files/shell/
```

**测试数据**:
```bash
ls archive/test-files/scripts/data/
```

**HTML调试页面**:
```bash
ls archive/test-files/html/
```

### 按文件名搜索

```bash
# 搜索特定测试
find archive/test-files/ -name "*questionnaire*"

# 搜索所有JS测试
find archive/test-files/ -name "*.js"

# 搜索所有Shell测试
find archive/test-files/ -name "*.sh"
```

---

**所有测试文件已归档，便于查找和维护！** 🎊

