# 🛠️ **数据库工具使用指南**

## 📋 **工具概述**

本项目提供了完整的数据库管理工具链，用于Schema同步、数据生成、一致性验证等操作。

## 🔧 **核心工具**

### **1. Schema提取器** (`database/tools/schema-extractor.cjs`)

**功能**：自动提取线上数据库的完整结构信息

**使用方法**：
```bash
# 提取Schema
npm run db:extract

# 或直接运行
node database/tools/schema-extractor.cjs
```

**输出文件**：
- `database/schemas/production/schema.json` - JSON格式Schema
- `database/schemas/production/schema-report.md` - 可读性报告
- `database/schemas/production/types.ts` - TypeScript类型定义

### **2. Schema验证器** (`database/tools/schema-validator.cjs`)

**功能**：验证本地与线上数据库结构的一致性

**使用方法**：
```bash
# 验证一致性
npm run db:validate

# 同步Schema到本地
npm run db:sync
```

**验证内容**：
- 表结构对比
- 字段类型检查
- 外键关系验证
- 索引差异检测

### **3. 智能数据生成器** (`database/tools/data-generator.cjs`)

**功能**：基于Schema自动生成符合结构的测试数据

**使用方法**：
```bash
# 生成少量测试数据（10条）
npm run db:generate-data:small

# 生成标准测试数据（100条）
npm run db:generate-data

# 生成大量测试数据（1000条）
npm run db:generate-data:large
```

**输出文件**：
- `database/test-data/generated/*.sql` - SQL插入文件
- `database/test-data/generated/import.sh` - 导入脚本
- `database/test-data/generated/data-report.md` - 数据报告

## 📊 **数据管理命令**

### **基础操作**
```bash
# 提取最新Schema
npm run db:extract

# 验证一致性
npm run db:validate

# 同步到本地
npm run db:sync

# 生成测试数据
npm run db:generate-data
```

### **工作流程**
```bash
# 完整设置流程
npm run workflow:setup

# 部署前检查
npm run db:pre-deploy-check

# 部署后验证
npm run db:post-deploy-validate
```

### **测试数据管理**
```bash
# 清理测试数据
npm run data:clean

# 导入测试数据
npm run data:import

# 查看数据状态
npm run data:status

# 完整测试数据流程
npm run workflow:test-data
```

## 🎯 **使用场景**

### **日常开发**
1. **开发前同步**：
   ```bash
   npm run db:extract && npm run db:sync
   ```

2. **需要测试数据**：
   ```bash
   npm run db:generate-data:small
   npm run data:import
   ```

3. **验证功能**：
   ```bash
   npm run data:status
   ```

### **部署流程**
1. **部署前检查**：
   ```bash
   npm run db:pre-deploy-check
   ```

2. **部署后验证**：
   ```bash
   npm run db:post-deploy-validate
   ```

### **问题排查**
1. **检查Schema差异**：
   ```bash
   npm run db:validate
   ```

2. **重新生成数据**：
   ```bash
   npm run data:clean
   npm run db:generate-data
   npm run data:import
   ```

## 🔍 **工具配置**

### **数据生成模板**
位置：`database/test-data/templates/`

**自定义模板示例**：
```json
{
  "tableName": "users",
  "dataDistributions": {
    "age_range": {
      "18-22": 0.25,
      "23-25": 0.45,
      "26-30": 0.25,
      "31-35": 0.04,
      "over-35": 0.01
    }
  },
  "customGenerators": {
    "email": "test{index}@example.com"
  }
}
```

### **Schema同步配置**
- **生产环境Schema**：`database/schemas/production/`
- **本地环境Schema**：`database/schemas/local/`
- **差异报告**：`database/reports/`

## ⚠️ **注意事项**

### **安全提醒**
- 测试数据生成器会创建大量数据，请在测试环境使用
- 清理命令会删除所有测试数据，请谨慎使用
- Schema提取需要数据库访问权限

### **性能考虑**
- 大量数据生成可能需要较长时间
- 建议分批导入大量测试数据
- 定期清理不需要的测试数据

### **最佳实践**
1. **定期同步**：每周运行一次Schema同步
2. **版本控制**：将Schema文件纳入Git管理
3. **团队协作**：使用统一的数据生成模板
4. **文档更新**：Schema变更后及时更新文档

## 🆘 **故障排查**

### **常见问题**
1. **Schema提取失败**：
   - 检查数据库连接
   - 确认Wrangler配置正确

2. **数据导入失败**：
   - 验证Schema一致性
   - 检查外键约束

3. **生成数据不符合预期**：
   - 检查数据模板配置
   - 验证字段类型映射

### **调试方法**
```bash
# 调试Schema提取
node database/tools/debug-parser.cjs

# 检查数据库状态
npm run data:status

# 验证API响应
npm run monitor:api
```

---

**📞 技术支持**：遇到工具使用问题请查看故障排查文档或联系技术团队。
