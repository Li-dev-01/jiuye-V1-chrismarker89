# 🚀 样式系统迁移指南

## 📋 迁移概览

本指南将帮助您将现有的样式代码迁移到新的统一设计系统。新系统基于设计令牌（Design Tokens）和组件化样式，确保整个应用的视觉一致性。

## 🎯 迁移目标

- ✅ 统一颜色方案（蓝色主题）
- ✅ 标准化间距和尺寸
- ✅ 规范化圆角和阴影
- ✅ 优化响应式设计
- ✅ 提升代码可维护性

## 📚 新设计系统文件结构

```
frontend/src/styles/
├── design-tokens.css    # 设计令牌定义
├── components.css       # 统一组件样式
├── global.css          # 全局样式（已更新）
└── UnifiedPages.css    # 页面级样式（保留）
```

## 🔄 迁移步骤

### 第一步：引入设计系统

在您的组件CSS文件顶部添加：

```css
/* 引入设计令牌（如果需要） */
@import '../../styles/design-tokens.css';
```

### 第二步：替换硬编码值

#### 颜色迁移对照表

| 旧值 | 新值 | 用途 |
|------|------|------|
| `#1890ff` | `var(--primary-500)` | 主色 |
| `#40a9ff` | `var(--primary-400)` | 主色悬停 |
| `#096dd9` | `var(--primary-600)` | 主色激活 |
| `#f0f0f0` | `var(--border-secondary)` | 次要边框 |
| `#d9d9d9` | `var(--border-primary)` | 主要边框 |
| `#fafafa` | `var(--bg-secondary)` | 次要背景 |
| `#ffffff` | `var(--bg-primary)` | 主要背景 |
| `#262626` | `var(--text-primary)` | 主要文本 |
| `#595959` | `var(--text-secondary)` | 次要文本 |
| `#8c8c8c` | `var(--text-tertiary)` | 三级文本 |

#### 间距迁移对照表

| 旧值 | 新值 | 说明 |
|------|------|------|
| `4px` | `var(--spacing-1)` | 最小间距 |
| `8px` | `var(--spacing-2)` | 小间距 |
| `12px` | `var(--spacing-3)` | 中小间距 |
| `16px` | `var(--spacing-4)` | 中等间距 |
| `20px` | `var(--spacing-5)` | 中大间距 |
| `24px` | `var(--spacing-6)` | 大间距 |
| `32px` | `var(--spacing-8)` | 超大间距 |
| `48px` | `var(--spacing-12)` | 特大间距 |

#### 圆角迁移对照表

| 旧值 | 新值 | 用途 |
|------|------|------|
| `4px` | `var(--border-radius-sm)` | 小圆角 |
| `6px` | `var(--border-radius-base)` | 基础圆角 |
| `8px` | `var(--border-radius-md)` | 中等圆角 |
| `12px` | `var(--border-radius-lg)` | 大圆角 |
| `16px` | `var(--border-radius-xl)` | 超大圆角 |

#### 阴影迁移对照表

| 旧值 | 新值 | 用途 |
|------|------|------|
| `0 1px 2px rgba(0,0,0,0.03)` | `var(--shadow-sm)` | 小阴影 |
| `0 2px 8px rgba(0,0,0,0.06)` | `var(--shadow-md)` | 中等阴影 |
| `0 4px 12px rgba(0,0,0,0.08)` | `var(--shadow-lg)` | 大阴影 |
| `0 8px 24px rgba(0,0,0,0.12)` | `var(--shadow-xl)` | 超大阴影 |

### 第三步：使用统一组件类

#### 替换自定义卡片样式

**旧代码：**
```css
.myCard {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
```

**新代码：**
```css
.myCard {
  /* 使用统一卡片样式 */
  @extend .unified-card;
}

/* 或者直接在JSX中使用 */
<div className="unified-card">
  {/* 内容 */}
</div>
```

#### 替换容器样式

**旧代码：**
```css
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}
```

**新代码：**
```css
.container {
  @extend .unified-container--normal;
}

/* 或者 */
<div className="unified-container unified-container--normal">
  {/* 内容 */}
</div>
```

### 第四步：更新页面头部样式

**旧代码：**
```css
.pageHeader {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
  color: white;
}
```

**新代码：**
```css
.pageHeader {
  @extend .unified-page-header;
}

/* 或者直接使用 */
<div className="unified-page-header">
  <div className="unified-page-header__content">
    <h2>页面标题</h2>
    <p>页面描述</p>
  </div>
  <div className="unified-page-header__actions">
    {/* 按钮等操作 */}
  </div>
</div>
```

## 🎨 具体页面迁移示例

### Stories页面迁移

**迁移前：**
```css
.stories-page {
  padding: 24px;
  background-color: #f5f5f5;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
}
```

**迁移后：**
```css
.stories-page {
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
}

.page-header {
  @extend .unified-page-header;
}
```

### Voices页面迁移

**迁移前：**
```css
.voices-page {
  padding: 24px;
  background-color: #f5f5f5;
}

.page-header {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}
```

**迁移后：**
```css
.voices-page {
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
}

.page-header {
  @extend .unified-page-header;
  /* 统一使用蓝色主题，移除粉色渐变 */
}
```

## 📱 响应式设计更新

### 使用统一断点

**旧代码：**
```css
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
}
```

**新代码：**
```css
@media (max-width: 768px) {
  .container {
    padding: var(--mobile-spacing-lg);
  }
}
```

## ✅ 迁移检查清单

### 组件级别
- [ ] 替换所有硬编码颜色值
- [ ] 更新间距使用设计令牌
- [ ] 统一圆角半径
- [ ] 标准化阴影效果
- [ ] 使用统一字体大小和行高

### 页面级别
- [ ] 更新页面头部样式
- [ ] 统一内容区域样式
- [ ] 标准化筛选和分页组件
- [ ] 优化响应式断点

### 全局级别
- [ ] 引入设计系统文件
- [ ] 更新Ant Design主题配置
- [ ] 验证所有页面视觉一致性
- [ ] 测试移动端适配

## 🔧 工具和技巧

### CSS变量检查工具

创建一个简单的检查脚本：

```bash
# 查找硬编码的颜色值
grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.css" --include="*.module.css"

# 查找硬编码的像素值
grep -r "[0-9]\+px" src/ --include="*.css" --include="*.module.css"
```

### 渐进式迁移策略

1. **优先级排序**：先迁移使用频率高的组件
2. **分批迁移**：每次迁移一个页面或组件
3. **测试验证**：每次迁移后进行视觉回归测试
4. **文档更新**：及时更新组件文档

## 📈 迁移后的收益

- ✅ **视觉一致性**：所有页面使用统一的设计语言
- ✅ **开发效率**：减少重复样式代码，提高开发速度
- ✅ **维护成本**：集中管理样式，降低维护难度
- ✅ **用户体验**：统一的交互模式，提升用户体验
- ✅ **响应式优化**：更好的移动端适配

## 🆘 常见问题

### Q: 如何处理特殊的自定义样式？
A: 保留必要的自定义样式，但尽量使用设计令牌作为基础值。

### Q: 迁移过程中如何确保不破坏现有功能？
A: 建议分批迁移，每次迁移后进行充分测试。

### Q: 如何处理第三方组件的样式？
A: 通过CSS变量覆盖第三方组件样式，保持一致性。
