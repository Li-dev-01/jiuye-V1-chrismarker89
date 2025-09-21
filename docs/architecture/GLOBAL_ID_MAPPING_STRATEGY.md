# 🎯 全局ID映射和多语言架构策略

## 📋 问题分析

### 1. 当前系统的ID映射混乱

**发现的问题**:
- **问卷系统**: 3套ID体系 (前端维度ID、API字段、问卷题目ID)
- **故事墙系统**: 混合使用 `id`、`uuid`、`category`、`tags`
- **UUID用户系统**: `user_uuid`、`content_type`、`content_id` 映射关系复杂
- **内容管理**: `ContentType`、`ContentStatus` 枚举与数据库字段不一致

### 2. 多语言环境的挑战

**底层英文 vs 应用层中文**:
- 数据库字段: `employment_status`, `education_level`, `gender`
- API返回值: `"male"`, `"employed"`, `"bachelor"`
- 前端显示: `"男性"`, `"全职工作"`, `"本科"`
- 用户输入: 中文表单和选项

## 🛠️ 系统性解决方案

### 方案1: 统一ID映射架构

#### 1.1 建立全局ID注册表

**创建文件**: `frontend/src/config/globalIdRegistry.ts`

```typescript
// 全局ID映射注册表
export interface GlobalIdMapping {
  // 系统标识
  system: 'questionnaire' | 'story' | 'uuid' | 'content' | 'analytics';
  // 域标识
  domain: string;
  // ID映射关系
  mappings: {
    databaseField: string;    // 数据库字段名
    apiField: string;         // API字段名
    frontendId: string;       // 前端标识
    displayKey: string;       // 显示键名
    enumType?: string;        // 枚举类型
  }[];
}
```

#### 1.2 多系统ID映射配置

**问卷系统映射**:
```typescript
const QUESTIONNAIRE_ID_MAPPINGS: GlobalIdMapping = {
  system: 'questionnaire',
  domain: 'employment-survey',
  mappings: [
    {
      databaseField: 'current_status',
      apiField: 'employmentStatus', 
      frontendId: 'employment-overview',
      displayKey: 'employment.status',
      enumType: 'EmploymentStatus'
    },
    {
      databaseField: 'gender',
      apiField: 'genderDistribution',
      frontendId: 'demographic-analysis',
      displayKey: 'demographics.gender',
      enumType: 'Gender'
    }
  ]
};
```

**故事墙系统映射**:
```typescript
const STORY_ID_MAPPINGS: GlobalIdMapping = {
  system: 'story',
  domain: 'user-content',
  mappings: [
    {
      databaseField: 'category',
      apiField: 'category',
      frontendId: 'story-category',
      displayKey: 'story.category',
      enumType: 'StoryCategory'
    },
    {
      databaseField: 'moderation_status',
      apiField: 'moderationStatus',
      frontendId: 'content-status',
      displayKey: 'content.status',
      enumType: 'ContentStatus'
    }
  ]
};
```

**UUID系统映射**:
```typescript
const UUID_ID_MAPPINGS: GlobalIdMapping = {
  system: 'uuid',
  domain: 'user-management',
  mappings: [
    {
      databaseField: 'content_type',
      apiField: 'contentType',
      frontendId: 'content-type',
      displayKey: 'content.type',
      enumType: 'ContentType'
    },
    {
      databaseField: 'user_type',
      apiField: 'userType',
      frontendId: 'user-type',
      displayKey: 'user.type',
      enumType: 'UserType'
    }
  ]
};
```

### 方案2: 多语言国际化架构

#### 2.1 分层国际化策略

**数据层 (英文)**:
```typescript
// 数据库和API保持英文
enum EmploymentStatus {
  STUDENT = 'student',
  EMPLOYED = 'employed', 
  UNEMPLOYED = 'unemployed',
  FREELANCE = 'freelance'
}
```

**显示层 (多语言)**:
```typescript
// 国际化配置
const i18nConfig = {
  'zh-CN': {
    'employment.status.student': '在校学生',
    'employment.status.employed': '全职工作',
    'employment.status.unemployed': '失业/求职中',
    'employment.status.freelance': '自由职业',
    
    'story.category.job_search': '求职经历',
    'story.category.career_change': '职业转换',
    'story.category.success': '成功故事',
    
    'content.status.pending': '待审核',
    'content.status.approved': '已通过',
    'content.status.rejected': '已拒绝'
  },
  'en-US': {
    'employment.status.student': 'Student',
    'employment.status.employed': 'Employed',
    'employment.status.unemployed': 'Unemployed',
    'employment.status.freelance': 'Freelance'
  }
};
```

#### 2.2 智能转换服务

**创建文件**: `frontend/src/services/globalMappingService.ts`

```typescript
export class GlobalMappingService {
  /**
   * 数据库值 → 显示文本
   */
  translateToDisplay(
    system: string,
    domain: string, 
    field: string,
    value: string,
    locale: string = 'zh-CN'
  ): string {
    const mapping = this.getMapping(system, domain, field);
    const key = `${mapping.displayKey}.${value}`;
    return this.i18n.t(key, locale);
  }

  /**
   * 显示文本 → 数据库值
   */
  translateToDatabase(
    system: string,
    domain: string,
    field: string, 
    displayText: string,
    locale: string = 'zh-CN'
  ): string {
    // 反向查找映射
    const mapping = this.getMapping(system, domain, field);
    return this.reverseTranslate(mapping.displayKey, displayText, locale);
  }

  /**
   * API字段 → 前端ID
   */
  mapApiToFrontend(
    system: string,
    apiField: string
  ): string {
    const mappings = this.getSystemMappings(system);
    const mapping = mappings.find(m => m.apiField === apiField);
    return mapping?.frontendId || apiField;
  }
}
```

### 方案3: 统一枚举管理

#### 3.1 全局枚举定义

**创建文件**: `shared/types/globalEnums.ts`

```typescript
// 就业状态枚举
export enum EmploymentStatus {
  STUDENT = 'student',
  EMPLOYED = 'employed',
  UNEMPLOYED = 'unemployed', 
  FREELANCE = 'freelance',
  PARTTIME = 'parttime',
  INTERNSHIP = 'internship',
  PREPARING = 'preparing'
}

// 故事分类枚举
export enum StoryCategory {
  JOB_SEARCH = 'job_search',
  CAREER_CHANGE = 'career_change', 
  SUCCESS = 'success',
  CHALLENGE = 'challenge',
  ADVICE = 'advice',
  INTERVIEW = 'interview',
  WORKPLACE = 'workplace'
}

// 内容类型枚举
export enum ContentType {
  QUESTIONNAIRE = 'questionnaire',
  STORY = 'story',
  VOICE = 'voice', 
  COMMENT = 'comment',
  DOWNLOAD = 'download',
  ANALYTICS = 'analytics'
}

// 内容状态枚举
export enum ContentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved', 
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}
```

#### 3.2 枚举验证和转换

```typescript
export class EnumValidator {
  /**
   * 验证枚举值有效性
   */
  static validateEnum<T>(
    enumObject: T,
    value: string
  ): value is T[keyof T] {
    return Object.values(enumObject).includes(value as T[keyof T]);
  }

  /**
   * 获取枚举的所有选项
   */
  static getEnumOptions<T>(
    enumObject: T,
    system: string,
    displayKey: string,
    locale: string = 'zh-CN'
  ): Array<{value: string, label: string}> {
    return Object.values(enumObject).map(value => ({
      value: value as string,
      label: globalMappingService.translateToDisplay(
        system, '', displayKey, value as string, locale
      )
    }));
  }
}
```

### 方案4: 数据一致性保障

#### 4.1 跨系统数据验证

**创建文件**: `database/tools/global-data-consistency-validator.cjs`

```javascript
// 验证所有系统的数据一致性
class GlobalDataConsistencyValidator {
  async validateCrossSystemConsistency() {
    const results = {
      questionnaire: await this.validateQuestionnaireData(),
      stories: await this.validateStoryData(), 
      uuid: await this.validateUuidData(),
      content: await this.validateContentData()
    };
    
    return this.generateConsistencyReport(results);
  }

  async validateQuestionnaireData() {
    // 验证问卷数据的枚举值是否符合定义
    const invalidStatuses = await this.db.query(`
      SELECT DISTINCT current_status 
      FROM universal_questionnaire_responses 
      WHERE current_status NOT IN ('student', 'employed', 'unemployed', 'freelance', 'parttime', 'internship', 'preparing')
    `);
    
    return { invalidStatuses };
  }

  async validateStoryData() {
    // 验证故事数据的分类和状态
    const invalidCategories = await this.db.query(`
      SELECT DISTINCT category 
      FROM stories 
      WHERE category NOT IN ('job_search', 'career_change', 'success', 'challenge', 'advice', 'interview', 'workplace')
    `);
    
    return { invalidCategories };
  }
}
```

#### 4.2 自动化数据修复

```javascript
class DataConsistencyRepairer {
  async repairInconsistentData() {
    // 修复不一致的枚举值
    await this.repairEmploymentStatus();
    await this.repairStoryCategories();
    await this.repairContentStatuses();
  }

  async repairEmploymentStatus() {
    // 映射旧值到新值
    const mappings = {
      '学生': 'student',
      '就业': 'employed', 
      '失业': 'unemployed',
      '自由职业者': 'freelance'
    };
    
    for (const [oldValue, newValue] of Object.entries(mappings)) {
      await this.db.query(`
        UPDATE universal_questionnaire_responses 
        SET current_status = ? 
        WHERE current_status = ?
      `, [newValue, oldValue]);
    }
  }
}
```

## 🎯 实施优先级和建议

### 高优先级 (立即实施)

1. **修复当前图表问题** ✅
   - 调整统一映射配置，只包含有API数据支持的维度
   - 确保所有映射的API字段都存在

2. **建立全局ID注册表**
   - 统一管理所有系统的ID映射关系
   - 提供统一的查询和转换接口

3. **实施多语言转换服务**
   - 分离数据存储(英文)和显示(中文)
   - 建立双向转换机制

### 中优先级 (近期实施)

4. **统一枚举管理**
   - 定义全局枚举类型
   - 实施枚举验证和转换

5. **跨系统数据验证**
   - 建立数据一致性检查工具
   - 自动化数据修复机制

### 低优先级 (长期规划)

6. **性能优化**
   - 缓存映射关系
   - 批量转换优化

7. **扩展性设计**
   - 支持动态添加新系统
   - 支持多语言扩展

## 🔧 技术实现要点

### 1. 保持向后兼容
- 渐进式迁移，不破坏现有功能
- 提供兼容性适配器

### 2. 性能考虑
- 映射关系缓存
- 懒加载和按需转换

### 3. 可维护性
- 集中化配置管理
- 自动化测试和验证

### 4. 扩展性
- 插件化架构
- 配置驱动的映射关系

这个方案将彻底解决ID映射混乱和多语言环境的问题，为系统的长期发展奠定坚实基础。
