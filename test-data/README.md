# 测试数据管理中心

**目录**: `/test-data/`  
**用途**: 统一管理项目的测试数据、工具和文档  
**版本**: v1.0 (2025-09-21)  

## 📁 **目录结构**

```
test-data/
├── README.md                    # 本说明文档
├── data/                        # 测试数据文件
│   ├── test-users.json         # 测试用户数据 (1,200个)
│   ├── test-responses.json     # 问卷回答数据 (1,800份)
│   ├── data-analysis.json      # 数据分布统计
│   └── data-quality-report.json # 质量评估报告
├── sql/                         # 数据库导入文件
│   ├── README.md               # 导入说明
│   ├── 01-cleanup.sql          # 清理脚本
│   ├── 02-users.sql            # 用户数据
│   └── 03-responses-batch-*.sql # 问卷数据 (64个批次)
├── scripts/                     # 数据生成和管理工具
│   ├── generateTestData.cjs    # 数据生成器
│   ├── validateTestData.cjs    # 数据验证工具
│   ├── importToDatabase.cjs    # SQL文件生成器
│   └── batchImport.sh          # 批量导入脚本
└── docs/                        # 相关文档
    ├── TEST_DATA_IMPLEMENTATION_GUIDE.md
    ├── OPTIMIZED_TEST_DATA_REPORT.md
    ├── QUESTIONNAIRE_DATA_ANALYSIS.md
    └── SOCIAL_INSIGHTS_DESIGN.md
```

## 📊 **当前测试数据概览**

### **数据规模**
- **用户数量**: 1,200个半匿名测试用户
- **问卷数量**: 1,800份完整问卷 (100%完成率)
- **数据质量**: 优秀 (0个逻辑错误)
- **生成时间**: 2025-09-21

### **数据特征**
- ✅ **完整性**: 所有问卷都是完整提交
- ✅ **真实性**: 基于社会统计学的真实分布
- ✅ **一致性**: 年龄-学历、学历-薪资逻辑一致
- ✅ **唯一性**: 用户邮箱、手机号、回答ID全部唯一
- ✅ **关联性**: 用户-问卷100%正确关联

### **数据分布**
```
年龄分布:
- 23-25岁: 39.5% (研究生和应届毕业生)
- 18-22岁: 35.9% (本科生群体)
- 26-30岁: 19.9% (工作几年群体)
- 其他: 4.7%

学历分布:
- 本科: 73.9% (主体群体)
- 硕士: 12.8% (研究生群体)
- 大专: 8.0% (职业教育)
- 其他: 5.3%

就业状态:
- 已就业: 44.8%
- 学生: 27.1%
- 求职中: 23.6%
- 其他: 4.5%
```

## 🛠️ **使用方法**

### **重新生成数据**
```bash
# 进入测试数据目录
cd test-data

# 生成新的测试数据
node scripts/generateTestData.cjs

# 验证数据质量
node scripts/validateTestData.cjs

# 准备数据库导入文件
node scripts/importToDatabase.cjs
```

### **导入数据库**
```bash
# 一键批量导入 (推荐)
bash test-data/scripts/batchImport.sh employment-survey-db

# 或手动分步导入
wrangler d1 execute employment-survey-db --file=test-data/sql/01-cleanup.sql
wrangler d1 execute employment-survey-db --file=test-data/sql/02-users.sql
# ... 继续执行其他批次
```

### **验证导入结果**
```sql
-- 检查数据量
SELECT COUNT(*) FROM users WHERE is_test_data = 1;                    -- 应该是 1200
SELECT COUNT(*) FROM questionnaire_responses WHERE is_test_data = 1;  -- 应该是 1800
SELECT COUNT(*) FROM questionnaire_answers WHERE is_test_data = 1;    -- 应该是 ~15000

-- 检查数据分布
SELECT 
  a.answer_value as status, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / 1800, 1) as percentage
FROM questionnaire_responses r
JOIN questionnaire_answers a ON r.id = a.response_id
WHERE r.is_test_data = 1 AND a.question_id = 'current-status'
GROUP BY a.answer_value
ORDER BY count DESC;
```

## 🔧 **数据管理**

### **清理测试数据**
```sql
-- 清理所有测试数据
DELETE FROM questionnaire_answers WHERE is_test_data = 1;
DELETE FROM questionnaire_responses WHERE is_test_data = 1;
DELETE FROM users WHERE is_test_data = 1;
```

### **备份和恢复**
```bash
# 备份当前测试数据
cp -r test-data test-data-backup-$(date +%Y%m%d)

# 恢复测试数据
cp -r test-data-backup-20250921 test-data
```

### **版本管理**
```bash
# 创建新版本
mkdir test-data/versions/v1.1-$(date +%Y%m%d)
cp test-data/data/* test-data/versions/v1.1-$(date +%Y%m%d)/

# 查看版本历史
ls -la test-data/versions/
```

## 📈 **数据用途**

### **可视化测试**
- 替代模拟数据，验证真实数据流
- 测试所有图表类型和统计功能
- 验证数据源切换功能

### **社会观察功能**
- 为AI洞察生成提供真实数据基础
- 测试社会统计学分析功能
- 验证趋势分析和异常检测

### **性能测试**
- 在真实数据量下测试查询性能
- 验证大数据量的处理能力
- 测试数据库索引和优化效果

### **功能验证**
- 验证用户注册和登录流程
- 测试问卷提交和数据存储
- 验证数据查询和聚合功能

## 🔄 **更新和维护**

### **定期更新**
建议每月更新一次测试数据，以保持数据的时效性：
```bash
# 生成新的测试数据
cd test-data
node scripts/generateTestData.cjs

# 备份旧数据
mv data/test-users.json data/test-users-$(date +%Y%m%d).json.bak
mv data/test-responses.json data/test-responses-$(date +%Y%m%d).json.bak

# 重新导入数据库
bash scripts/batchImport.sh employment-survey-db
```

### **数据调整**
如需调整数据分布或规模，修改 `scripts/generateTestData.cjs` 中的配置：
```javascript
const DEFAULT_CONFIG = {
  userCount: 1200,        // 调整用户数量
  responseCount: 1800,    // 调整问卷数量
  onlyCompleted: true     // 只生成完整问卷
};

const REALISTIC_WEIGHTS = {
  // 调整各维度的分布权重
  'age-range': { ... },
  'education-level': { ... },
  // ...
};
```

## 📋 **注意事项**

### **数据安全**
- 所有测试数据都有 `isTestData: true` 标识
- 可以安全地与生产数据共存
- 建议在非生产环境进行测试

### **性能考虑**
- 大量数据导入可能需要较长时间
- 建议分批导入，避免超时
- 导入前确保数据库有足够空间

### **兼容性**
- SQL文件兼容 Cloudflare D1 数据库
- 脚本需要 Node.js 环境
- 导入工具需要 wrangler CLI

---

**📞 支持和反馈**

如有问题或建议，请查看 `docs/` 目录中的详细文档，或联系开发团队。

**🔄 最后更新**: 2025-09-21  
**📊 数据版本**: v1.0  
**🎯 状态**: 生产就绪
