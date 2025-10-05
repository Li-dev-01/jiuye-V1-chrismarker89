# 故事圈子功能产品规格文档

> **版本**: v1.0  
> **状态**: 📝 规划中（下一迭代版本）  
> **创建日期**: 2025-10-05  
> **目标版本**: v2.0

---

## 📋 产品概述

### 愿景
基于用户画像标签系统，构建轻量级社交圈子功能，让有相似经历、相同标签的用户能够聚集在一起，分享故事、交流经验，形成有温度的就业互助社区。

### 核心价值
1. **精准匹配**：基于问卷标签自动推荐相关圈子
2. **情感共鸣**：相似背景的用户更容易产生共鸣
3. **互助支持**：求职者、在职者、创业者互相鼓励
4. **轻量社交**：避免复杂功能，专注内容分享

---

## 🎯 功能范围

### V2.0 核心功能（MVP）

#### 1. 圈子发现
- ✅ 基于用户标签自动推荐圈子
- ✅ 圈子列表展示（热门、推荐、全部）
- ✅ 圈子搜索（按名称、标签）
- ✅ 圈子详情页

#### 2. 圈子管理
- ✅ 加入/退出圈子
- ✅ 圈子成员列表
- ✅ 圈子统计（成员数、故事数）

#### 3. 圈子内容
- ✅ 圈子故事流（只显示该圈子相关故事）
- ✅ 发布故事时选择圈子
- ✅ 故事标签与圈子关联

#### 4. 用户体验
- ✅ 我的圈子（已加入的圈子）
- ✅ 圈子推荐算法
- ✅ 圈子活跃度展示

### V3.0 增强功能（未来）
- 🔮 圈子内讨论（评论系统）
- 🔮 圈子管理员机制
- 🔮 圈子活动（话题讨论）
- 🔮 圈子徽章系统
- 🔮 跨圈子推荐

---

## 🗄️ 数据库设计

### 1. 圈子表 (circles)
```sql
CREATE TABLE IF NOT EXISTS circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 基本信息
  name TEXT NOT NULL UNIQUE,                -- 圈子名称（如：应届求职者圈）
  description TEXT,                         -- 圈子描述
  icon TEXT,                                -- 圈子图标URL
  cover_image TEXT,                         -- 封面图
  
  -- 标签关联
  tag_keys TEXT NOT NULL,                   -- 关联标签（JSON数组）
  primary_tag TEXT,                         -- 主标签（用于分类）
  
  -- 统计数据
  member_count INTEGER DEFAULT 0,           -- 成员数
  story_count INTEGER DEFAULT 0,            -- 故事数
  active_level INTEGER DEFAULT 0,           -- 活跃度（0-100）
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,           -- 是否启用
  is_official BOOLEAN DEFAULT FALSE,        -- 是否官方圈子
  
  -- 元数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME,                -- 最后活跃时间
  
  -- 索引
  INDEX idx_primary_tag (primary_tag),
  INDEX idx_active_level (active_level),
  INDEX idx_member_count (member_count)
);
```

### 2. 圈子成员表 (circle_members)
```sql
CREATE TABLE IF NOT EXISTS circle_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 关联
  circle_id INTEGER NOT NULL,
  user_uuid TEXT NOT NULL,                  -- 用户UUID（匿名用户也可加入）
  
  -- 角色
  role TEXT DEFAULT 'member',               -- member/moderator/admin
  
  -- 统计
  contribution_count INTEGER DEFAULT 0,     -- 贡献故事数
  
  -- 时间
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME,
  
  -- 约束
  UNIQUE(circle_id, user_uuid),
  FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
);
```

### 3. 圈子-故事关联表 (circle_stories)
```sql
CREATE TABLE IF NOT EXISTS circle_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  circle_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  
  -- 关联方式
  association_type TEXT DEFAULT 'manual',   -- manual/auto（手动/自动关联）
  
  -- 统计
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(circle_id, story_id),
  FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES valid_stories(id) ON DELETE CASCADE
);
```

### 4. 圈子推荐记录表 (circle_recommendations)
```sql
CREATE TABLE IF NOT EXISTS circle_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  user_uuid TEXT NOT NULL,
  circle_id INTEGER NOT NULL,
  
  -- 推荐依据
  match_score REAL,                         -- 匹配度（0-1）
  matched_tags TEXT,                        -- 匹配的标签（JSON数组）
  
  -- 用户行为
  is_viewed BOOLEAN DEFAULT FALSE,          -- 是否查看过
  is_joined BOOLEAN DEFAULT FALSE,          -- 是否加入
  
  recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
);
```

---

## 🏗️ 系统架构

### 后端服务

#### 1. CircleService (圈子核心服务)
```typescript
class CircleService {
  // 圈子CRUD
  async createCircle(data: CreateCircleDTO): Promise<Circle>
  async getCircle(id: number): Promise<Circle>
  async updateCircle(id: number, data: UpdateCircleDTO): Promise<Circle>
  async deleteCircle(id: number): Promise<void>
  
  // 圈子列表
  async listCircles(filter: CircleFilter): Promise<Circle[]>
  async getHotCircles(limit: number): Promise<Circle[]>
  async searchCircles(keyword: string): Promise<Circle[]>
  
  // 成员管理
  async joinCircle(circleId: number, userUuid: string): Promise<void>
  async leaveCircle(circleId: number, userUuid: string): Promise<void>
  async getCircleMembers(circleId: number): Promise<CircleMember[]>
  
  // 统计更新
  async updateCircleStats(circleId: number): Promise<void>
  async calculateActiveLevel(circleId: number): Promise<number>
}
```

#### 2. CircleRecommendationService (推荐服务)
```typescript
class CircleRecommendationService {
  // 基于用户标签推荐圈子
  async recommendCircles(userTags: string[]): Promise<CircleRecommendation[]>
  
  // 计算匹配度
  calculateMatchScore(userTags: string[], circleTags: string[]): number
  
  // 记录推荐
  async recordRecommendation(
    userUuid: string, 
    circleId: number, 
    matchScore: number
  ): Promise<void>
}
```

#### 3. CircleContentService (内容服务)
```typescript
class CircleContentService {
  // 获取圈子故事流
  async getCircleStories(
    circleId: number, 
    pagination: Pagination
  ): Promise<Story[]>
  
  // 关联故事到圈子
  async associateStory(
    circleId: number, 
    storyId: number, 
    type: 'manual' | 'auto'
  ): Promise<void>
  
  // 自动关联（基于标签）
  async autoAssociateStories(circleId: number): Promise<number>
}
```

---

## 🎨 前端页面设计

### 1. 圈子广场页面 (/circles)
```
┌─────────────────────────────────────────┐
│  🎯 发现圈子                             │
├─────────────────────────────────────────┤
│  [推荐] [热门] [全部]    🔍 搜索圈子     │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐             │
│  │ 应届求职者 │  │ 压力青年  │             │
│  │ 👥 1.2k   │  │ 👥 856   │             │
│  │ 📝 234    │  │ 📝 189   │             │
│  │ [加入]    │  │ [已加入]  │             │
│  └──────────┘  └──────────┘             │
│                                         │
│  ┌──────────┐  ┌──────────┐             │
│  │ 互联网人   │  │ 考研党    │             │
│  │ 👥 2.3k   │  │ 👥 1.5k  │             │
│  │ 📝 567    │  │ 📝 423   │             │
│  │ [加入]    │  │ [加入]    │             │
│  └──────────┘  └──────────┘             │
└─────────────────────────────────────────┘
```

### 2. 圈子详情页 (/circles/:id)
```
┌─────────────────────────────────────────┐
│  ← 返回                                  │
├─────────────────────────────────────────┤
│  🎯 应届求职者圈                          │
│  为应届毕业生提供求职经验分享和互助支持    │
│                                         │
│  👥 1,234 成员  📝 234 故事  🔥 活跃度 85 │
│  [已加入] [邀请好友]                     │
├─────────────────────────────────────────┤
│  [故事] [成员] [关于]                    │
├─────────────────────────────────────────┤
│  📝 最新故事                             │
│  ┌─────────────────────────────────┐   │
│  │ 从迷茫到offer，我的求职之路       │   │
│  │ 👤 匿名用户  ⏰ 2小时前           │   │
│  │ 💬 12  ❤️ 45                    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 面试被拒20次后，我学到了什么      │   │
│  │ 👤 匿名用户  ⏰ 5小时前           │   │
│  │ 💬 8   ❤️ 32                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 3. 我的圈子页面 (/my-circles)
```
┌─────────────────────────────────────────┐
│  我的圈子                                │
├─────────────────────────────────────────┤
│  已加入 3 个圈子                         │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ 🎯 应届求职者圈                   │  │
│  │ 今日新增 5 个故事                 │  │
│  │ [查看]                           │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 💼 互联网人                       │  │
│  │ 今日新增 12 个故事                │  │
│  │ [查看]                           │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 🎓 考研党                         │  │
│  │ 今日新增 3 个故事                 │  │
│  │ [查看]                           │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔄 核心流程

### 1. 圈子推荐流程
```
用户完成问卷
    ↓
生成用户标签
    ↓
匹配圈子标签
    ↓
计算匹配度（Jaccard相似度）
    ↓
排序推荐（Top 5）
    ↓
展示推荐圈子卡片
```

### 2. 加入圈子流程
```
用户点击"加入圈子"
    ↓
检查是否已加入
    ↓
创建成员记录
    ↓
更新圈子成员数 +1
    ↓
记录推荐转化
    ↓
返回成功，更新UI
```

### 3. 故事自动关联流程
```
用户发布故事
    ↓
提取故事标签
    ↓
查找匹配的圈子
    ↓
自动关联到相关圈子
    ↓
更新圈子故事数
    ↓
通知圈子成员（可选）
```

---

## 📊 推荐算法

### Jaccard相似度算法
```typescript
function calculateMatchScore(
  userTags: string[], 
  circleTags: string[]
): number {
  const userSet = new Set(userTags);
  const circleSet = new Set(circleTags);
  
  // 交集
  const intersection = new Set(
    [...userSet].filter(tag => circleSet.has(tag))
  );
  
  // 并集
  const union = new Set([...userSet, ...circleSet]);
  
  // Jaccard相似度 = 交集 / 并集
  return intersection.size / union.size;
}
```

### 推荐排序规则
1. **匹配度** (40%)：用户标签与圈子标签的相似度
2. **活跃度** (30%)：圈子的活跃程度
3. **规模** (20%)：圈子成员数（适中最佳）
4. **新鲜度** (10%)：最近活跃时间

---

## 🎯 初始圈子设计

### 官方圈子列表（预设）

| 圈子名称 | 主标签 | 关联标签 | 描述 |
|---------|--------|---------|------|
| 应届求职者圈 | young-graduate-job-seeker | age-18-22, job-seeking, education-bachelor | 应届毕业生求职经验分享 |
| 压力青年圈 | stressed-young-professional | age-23-25, high-economic-pressure, anxious | 年轻职场人压力释放与互助 |
| 互联网人圈 | tech-worker | employed, education-bachelor, confident | 互联网行业从业者交流 |
| 考研党圈 | graduate-exam | age-18-22, education-bachelor | 考研经验分享与鼓励 |
| 负债青年圈 | debt-youth | has-debt, high-economic-pressure | 经济压力与理财经验分享 |
| 自由职业者圈 | freelancer | employed, confident | 自由职业经验交流 |
| 创业者圈 | entrepreneur | employed, confident | 创业故事与经验分享 |
| 迷茫者互助圈 | confused-support | anxious, job-seeking | 职业迷茫期互相鼓励 |

---

## 📈 成功指标

### 核心指标
- **圈子加入率**：推荐圈子的加入转化率 > 30%
- **圈子活跃度**：每个圈子每周新增故事 > 5个
- **用户留存**：加入圈子的用户7日留存 > 50%
- **内容质量**：圈子内故事平均点赞数 > 10

### 数据监控
- 圈子成员增长趋势
- 圈子故事发布频率
- 用户跨圈子活跃度
- 推荐算法准确率

---

## 🚀 实施路线图

### Phase 1: 基础架构（2-3天）
- ✅ 数据库表设计和创建
- ✅ 后端API开发（CRUD）
- ✅ 推荐算法实现

### Phase 2: 前端页面（3-4天）
- ✅ 圈子广场页面
- ✅ 圈子详情页面
- ✅ 我的圈子页面
- ✅ 圈子推荐组件

### Phase 3: 内容集成（2-3天）
- ✅ 故事发布时选择圈子
- ✅ 圈子故事流
- ✅ 自动关联逻辑

### Phase 4: 优化与测试（2-3天）
- ✅ 推荐算法调优
- ✅ 性能优化
- ✅ 用户测试
- ✅ Bug修复

**总计：9-13天（约2周）**

---

## 🔒 技术约束

### 轻量级原则
- ❌ 不实现复杂的评论系统（避免内容审核负担）
- ❌ 不实现实时聊天功能（技术复杂度高）
- ❌ 不实现用户关注功能（避免社交网络化）
- ✅ 专注于内容聚合和发现

### 匿名性保护
- ✅ 用户可以匿名加入圈子
- ✅ 圈子内不显示用户真实身份
- ✅ 只显示用户标签和贡献度

---

## 📝 后续迭代方向

### V3.0 可能功能
- 圈子话题讨论（轻量级评论）
- 圈子管理员机制
- 圈子活动（每周话题）
- 圈子徽章系统
- 跨圈子内容推荐

---

**文档维护者**: AI Assistant  
**最后更新**: 2025-10-05  
**审核状态**: 待产品经理审核

