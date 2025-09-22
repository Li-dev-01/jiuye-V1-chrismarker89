# 📊 故事墙数据库结构分析与测试数据方案

## 🎯 **项目目标**
为故事墙页面创建完整的测试数据，验证以下功能：
1. 数据驱动的内容组织（分类、筛选）
2. 简化的搜索功能（关键词、标签、快筛）
3. 收藏功能（本地存储）
4. 内容质量保障（举报机制）

## 📋 **数据库现状分析**

### ✅ **现有核心表**

#### **1. `questionnaire_heart_voices` - 故事内容表**
```sql
-- 现有字段（满足基本需求）
id INTEGER PRIMARY KEY                    -- 故事ID
user_id TEXT NOT NULL                    -- 用户UUID（支持半匿名）
content TEXT NOT NULL                    -- 故事内容
category TEXT DEFAULT 'employment-feedback' -- 分类
tags TEXT                               -- 标签（JSON格式）
is_public BOOLEAN DEFAULT true          -- 是否公开
is_approved BOOLEAN DEFAULT true        -- 是否审核通过
status TEXT DEFAULT 'active'            -- 状态
submission_type TEXT DEFAULT 'anonymous' -- 提交类型
anonymous_nickname TEXT                 -- 匿名昵称
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### **2. `users` - 用户表**
```sql
-- 现有字段（满足半匿名需求）
id TEXT PRIMARY KEY                      -- 用户UUID
username TEXT NOT NULL                   -- 用户名
email TEXT NOT NULL                     -- 邮箱
password_hash TEXT NOT NULL             -- 密码哈希
role TEXT DEFAULT 'user'                -- 角色
created_at TEXT DEFAULT datetime('now')
updated_at TEXT DEFAULT datetime('now')
```

### ⚠️ **缺失字段分析**

#### **1. 故事墙功能增强字段（建议添加）**
```sql
-- 建议为 questionnaire_heart_voices 表添加：
ALTER TABLE questionnaire_heart_voices ADD COLUMN title TEXT; -- 故事标题
ALTER TABLE questionnaire_heart_voices ADD COLUMN summary TEXT; -- 故事摘要
ALTER TABLE questionnaire_heart_voices ADD COLUMN likes_count INTEGER DEFAULT 0; -- 点赞数
ALTER TABLE questionnaire_heart_voices ADD COLUMN views_count INTEGER DEFAULT 0; -- 浏览数
ALTER TABLE questionnaire_heart_voices ADD COLUMN major_field TEXT; -- 专业领域
ALTER TABLE questionnaire_heart_voices ADD COLUMN employment_status TEXT; -- 就业状态
ALTER TABLE questionnaire_heart_voices ADD COLUMN region TEXT; -- 地域
ALTER TABLE questionnaire_heart_voices ADD COLUMN employment_destination TEXT; -- 就业去向
ALTER TABLE questionnaire_heart_voices ADD COLUMN story_type TEXT; -- 故事类型
```

#### **2. 用户交互表（建议新建）**
```sql
-- 用户点赞表
CREATE TABLE user_story_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  story_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (story_id) REFERENCES questionnaire_heart_voices(id),
  UNIQUE(user_id, story_id)
);

-- 内容举报表
CREATE TABLE content_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  story_id INTEGER NOT NULL,
  report_type TEXT NOT NULL, -- 举报类型
  report_reason TEXT,        -- 举报原因
  status TEXT DEFAULT 'pending', -- 处理状态
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (story_id) REFERENCES questionnaire_heart_voices(id)
);
```

## 🎯 **测试数据生成方案**

### **1. 数据量规划**
- **用户数据**: 50个半匿名用户（注册用户）
- **故事数据**: 200个故事（覆盖所有分类）
- **交互数据**: 500个点赞记录，50个举报记录

### **2. 分类分布策略**

#### **就业状态分布**
- 已就业 (employed): 40% (80个故事)
- 求职中 (job-seeking): 25% (50个故事)
- 继续深造 (further-study): 15% (30个故事)
- 创业中 (entrepreneurship): 10% (20个故事)
- 待定中 (undecided): 10% (20个故事)

#### **专业领域分布**
- 计算机类: 25% (50个故事)
- 经济管理: 20% (40个故事)
- 工程技术: 15% (30个故事)
- 文科类: 12% (24个故事)
- 理科类: 10% (20个故事)
- 医学类: 8% (16个故事)
- 教育类: 6% (12个故事)
- 艺术类: 4% (8个故事)

#### **地域分布**
- 一线城市: 35% (70个故事)
- 二线城市: 30% (60个故事)
- 三四线城市: 20% (40个故事)
- 回乡就业: 10% (20个故事)
- 海外发展: 5% (10个故事)

### **3. 半匿名用户策略**
```javascript
// 用户生成策略
const userGenerationStrategy = {
  // 用户类型分布
  userTypes: {
    'registered_anonymous': 0.7,  // 注册但使用匿名昵称
    'registered_real': 0.2,       // 注册使用真实信息
    'admin': 0.05,                // 管理员
    'reviewer': 0.05              // 审核员
  },
  
  // 匿名昵称生成规则
  anonymousNicknames: [
    '求职小白', '职场新人', '迷茫大学生', '奋斗青年',
    '技术爱好者', '文科生', '理工男', '设计师',
    '北漂青年', '海归小伙', '创业者', '实习生'
  ],
  
  // 用户UUID格式
  uuidFormat: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
};
```

### **4. 故事内容生成策略**
```javascript
// 故事模板分类
const storyTemplates = {
  'interview-experience': {
    titleTemplates: [
      '我的{company}面试经历分享',
      '{position}岗位面试全过程记录',
      '从简历投递到offer：我的求职路'
    ],
    contentKeywords: ['面试', '笔试', 'HR', '技术面', '群面'],
    avgLength: 800
  },
  
  'internship-experience': {
    titleTemplates: [
      '在{company}实习的{duration}个月',
      '{major}专业实习生的真实体验',
      '实习期间学到的那些事'
    ],
    contentKeywords: ['实习', '导师', '项目', '学习', '成长'],
    avgLength: 600
  },
  
  'career-planning': {
    titleTemplates: [
      '从{major}到{industry}的转行之路',
      '毕业三年的职业规划反思',
      '如何找到适合自己的发展方向'
    ],
    contentKeywords: ['规划', '目标', '发展', '选择', '未来'],
    avgLength: 1000
  }
};
```

## 🛠️ **实施步骤**

### **阶段1: 数据库结构优化（可选）**
1. 评估是否需要添加缺失字段
2. 创建用户交互表（如果需要真实的点赞/举报功能）
3. 更新数据库迁移脚本

### **阶段2: 测试数据生成**
1. 生成50个半匿名用户
2. 生成200个分类完整的故事
3. 生成用户交互数据（点赞、举报）
4. 确保数据的一致性和完整性

### **阶段3: 功能验证**
1. 验证搜索功能（关键词、标签、分类）
2. 验证筛选功能（多维度筛选）
3. 验证收藏功能（前端localStorage）
4. 验证举报功能（数据记录）

## 🔧 **技术实现要点**

### **1. 数据一致性保证**
- 用户UUID格式统一
- 外键约束正确设置
- 时间戳格式一致
- 分类值与前端配置匹配

### **2. 性能考虑**
- 为常用查询字段添加索引
- 控制单个故事内容长度
- 合理分布创建时间

### **3. 安全性考虑**
- 敏感信息脱敏
- 测试数据明确标识
- 避免真实个人信息

## 📝 **下一步行动**

1. **确认数据库结构**: 是否需要添加建议的字段？
2. **生成测试数据**: 基于现有结构创建测试数据
3. **验证功能**: 在线上环境测试所有故事墙功能
4. **性能优化**: 根据测试结果优化查询性能

---

**总结**: 现有数据库结构基本满足故事墙功能需求，主要缺少一些增强字段。我们可以基于现有结构生成测试数据，验证核心功能，然后根据需要逐步优化数据库结构。
