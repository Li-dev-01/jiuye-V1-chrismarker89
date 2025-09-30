# 🚨 用户举报审核系统设计方案

**设计时间**: 2025-09-30  
**设计模式**: INNOVATE (RIPER-5-AI)  
**核心理念**: 平衡用户举报与内容有效性，防止漏网之鱼和恶意举报

---

## 🎯 设计目标

### 核心平衡点

1. **防止漏网之鱼** ✅
   - 用户举报触发二次审核
   - 多次举报提高优先级
   - 社区监督补充自动审核

2. **防止恶意举报** ✅
   - 人工审核通过后获得免疫
   - 举报人信誉评分系统
   - 恶意举报者惩罚机制

3. **防止资源浪费** ✅
   - 重复举报自动过滤
   - 免疫内容自动驳回
   - 智能优先级排序

---

## 🏗️ 系统架构

### 举报处理流程

```
用户举报
  ↓
检查内容免疫状态
  ├─ 有免疫 → 自动驳回 (记录日志)
  └─ 无免疫 → 继续处理
       ↓
检查举报人信誉
  ├─ 信誉差 → 降低优先级/直接拒绝
  └─ 信誉正常 → 继续处理
       ↓
检查重复举报
  ├─ 重复举报 → 合并处理
  └─ 首次举报 → 创建举报记录
       ↓
触发二次审核流程
  ├─ 第一层：规则审核
  ├─ 第二层：AI审核
  └─ 第三层：人工审核
       ↓
审核结果处理
  ├─ 内容违规 → 删除内容 + 举报有效 + 举报人信誉+10
  ├─ 内容无问题 → 授予免疫 + 举报无效 + 举报人信誉-5
  └─ 恶意举报 → 警告/封禁举报人 + 信誉-20
```

---

## 📊 核心功能设计

### 1. 内容审核免疫机制

#### 免疫触发条件

```typescript
// 免疫类型
enum ImmunityType {
  MANUAL_APPROVED = 'manual_approved',       // 人工审核通过
  AI_HIGH_CONFIDENCE = 'ai_high_confidence', // AI高置信度通过
  MULTIPLE_REVIEWS = 'multiple_reviews',     // 多次审核通过
  ADMIN_WHITELIST = 'admin_whitelist'        // 管理员白名单
}

// 免疫授予逻辑
function grantImmunity(content, reviewResult) {
  // 条件1: 人工审核通过
  if (reviewResult.reviewType === 'manual' && reviewResult.decision === 'approved') {
    return {
      type: ImmunityType.MANUAL_APPROVED,
      expires: null, // 永久免疫
      reason: '人工审核确认内容无问题'
    };
  }
  
  // 条件2: AI高置信度通过 (置信度 > 0.95)
  if (reviewResult.reviewType === 'ai' && 
      reviewResult.decision === 'approved' && 
      reviewResult.confidence > 0.95) {
    return {
      type: ImmunityType.AI_HIGH_CONFIDENCE,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天
      reason: 'AI高置信度判定为安全内容'
    };
  }
  
  // 条件3: 多次审核通过 (3次以上举报均判定无问题)
  if (content.reviewCount >= 3 && content.allApproved) {
    return {
      type: ImmunityType.MULTIPLE_REVIEWS,
      expires: null, // 永久免疫
      reason: '多次审核均确认内容无问题'
    };
  }
  
  return null;
}
```

#### 免疫检查逻辑

```typescript
// 检查内容是否有免疫
async function checkImmunity(contentType, contentId) {
  const immunity = await db.query(`
    SELECT * FROM content_review_immunity
    WHERE content_type = ? 
      AND content_id = ?
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `, [contentType, contentId]);
  
  if (immunity) {
    return {
      hasImmunity: true,
      immunityType: immunity.immunity_type,
      grantedBy: immunity.immunity_granted_by,
      grantedAt: immunity.immunity_granted_at,
      reviewCount: immunity.review_count
    };
  }
  
  return { hasImmunity: false };
}
```

---

### 2. 举报人信誉系统

#### 信誉评分计算

```typescript
// 信誉评分规则
const REPUTATION_RULES = {
  INITIAL_SCORE: 100,           // 初始分数
  VALID_REPORT_BONUS: 10,       // 有效举报 +10分
  INVALID_REPORT_PENALTY: -5,   // 无效举报 -5分
  MALICIOUS_REPORT_PENALTY: -20,// 恶意举报 -20分
  MIN_SCORE: 0,                 // 最低分数
  MAX_SCORE: 150                // 最高分数
};

// 信誉等级
const REPUTATION_LEVELS = {
  EXCELLENT: { min: 90, max: 150, label: '优秀', color: 'green' },
  GOOD: { min: 70, max: 89, label: '良好', color: 'blue' },
  NORMAL: { min: 50, max: 69, label: '正常', color: 'gray' },
  POOR: { min: 30, max: 49, label: '较差', color: 'orange' },
  BAD: { min: 0, max: 29, label: '恶劣', color: 'red' }
};

// 计算信誉评分
function calculateReputationScore(stats) {
  let score = REPUTATION_RULES.INITIAL_SCORE;
  
  score += stats.validReports * REPUTATION_RULES.VALID_REPORT_BONUS;
  score += stats.invalidReports * REPUTATION_RULES.INVALID_REPORT_PENALTY;
  score += stats.maliciousReports * REPUTATION_RULES.MALICIOUS_REPORT_PENALTY;
  
  // 限制在最小和最大值之间
  score = Math.max(REPUTATION_RULES.MIN_SCORE, score);
  score = Math.min(REPUTATION_RULES.MAX_SCORE, score);
  
  return score;
}

// 获取信誉等级
function getReputationLevel(score) {
  for (const [level, config] of Object.entries(REPUTATION_LEVELS)) {
    if (score >= config.min && score <= config.max) {
      return { level, ...config };
    }
  }
  return REPUTATION_LEVELS.NORMAL;
}
```

#### 举报限制规则

```typescript
// 举报限制检查
async function checkReportRestrictions(userId) {
  const reputation = await getReporterReputation(userId);
  
  // 检查是否被限制
  if (reputation.isRestricted && 
      reputation.restrictedUntil > new Date()) {
    return {
      allowed: false,
      reason: reputation.restrictionReason,
      restrictedUntil: reputation.restrictedUntil
    };
  }
  
  // 检查24小时内举报次数
  if (reputation.reportsLast24h >= 10) {
    return {
      allowed: false,
      reason: '24小时内举报次数过多，请稍后再试'
    };
  }
  
  // 检查信誉等级
  if (reputation.reputationLevel === 'BAD') {
    return {
      allowed: false,
      reason: '信誉评分过低，举报功能已被限制'
    };
  }
  
  return { allowed: true };
}
```

---

### 3. 举报优先级计算

#### 优先级因素

```typescript
// 优先级计算因素
interface PriorityFactors {
  reportType: string;           // 举报类型
  reporterReputation: number;   // 举报人信誉
  reportCount: number;          // 该内容被举报次数
  contentAge: number;           // 内容发布时长
  reportedUserHistory: number;  // 被举报用户历史违规次数
}

// 计算优先级 (1-10, 1最高)
function calculatePriority(factors: PriorityFactors): number {
  let priority = 5; // 默认中等优先级
  
  // 因素1: 举报类型严重程度
  const severityMap = {
    political: -3,      // 政治敏感 → 优先级+3
    pornographic: -3,   // 色情内容 → 优先级+3
    violent: -2,        // 暴力血腥 → 优先级+2
    privacy: -2,        // 隐私泄露 → 优先级+2
    harassment: -1,     // 骚扰辱骂 → 优先级+1
    spam: 0,            // 垃圾广告 → 不变
    fake_info: 0,       // 虚假信息 → 不变
    off_topic: 1,       // 偏离主题 → 优先级-1
    other: 1            // 其他 → 优先级-1
  };
  priority += severityMap[factors.reportType] || 0;
  
  // 因素2: 举报人信誉 (信誉高的举报更可信)
  if (factors.reporterReputation >= 90) priority -= 1; // 优秀举报人
  if (factors.reporterReputation < 50) priority += 1;  // 信誉差的举报人
  
  // 因素3: 重复举报次数 (多人举报提高优先级)
  if (factors.reportCount >= 5) priority -= 2;
  else if (factors.reportCount >= 3) priority -= 1;
  
  // 因素4: 内容年龄 (新内容优先处理)
  const ageHours = factors.contentAge / (1000 * 60 * 60);
  if (ageHours < 24) priority -= 1; // 24小时内的新内容
  
  // 因素5: 被举报用户历史
  if (factors.reportedUserHistory >= 5) priority -= 1; // 惯犯
  
  // 限制在1-10范围内
  return Math.max(1, Math.min(10, priority));
}
```

---

### 4. 举报处理流程

#### 完整处理逻辑

```typescript
// 处理用户举报
async function handleUserReport(report: UserReport) {
  console.log(`[REPORT] 处理举报 ID: ${report.id}`);
  
  // 步骤1: 检查内容免疫状态
  const immunity = await checkImmunity(report.contentType, report.contentId);
  
  if (immunity.hasImmunity) {
    console.log(`[REPORT] 内容有免疫，自动驳回举报`);
    
    await updateReportStatus(report.id, 'auto_dismissed', {
      reason: '内容已通过人工审核，确认无问题',
      immunityType: immunity.immunityType,
      reviewCount: immunity.reviewCount
    });
    
    // 记录日志
    await logReportAction(report.id, 'auto_dismissed', {
      immunityInfo: immunity
    });
    
    return {
      success: true,
      action: 'auto_dismissed',
      message: '该内容已经过审核确认无问题'
    };
  }
  
  // 步骤2: 检查举报人信誉
  const restriction = await checkReportRestrictions(report.reporterUserId);
  
  if (!restriction.allowed) {
    console.log(`[REPORT] 举报人被限制: ${restriction.reason}`);
    
    await updateReportStatus(report.id, 'invalid', {
      reason: restriction.reason
    });
    
    return {
      success: false,
      action: 'rejected',
      message: restriction.reason
    };
  }
  
  // 步骤3: 检查重复举报
  const existingReports = await findExistingReports(
    report.contentType, 
    report.contentId
  );
  
  if (existingReports.length > 0) {
    console.log(`[REPORT] 发现 ${existingReports.length} 条相关举报`);
    
    // 合并处理，提高优先级
    await mergeReports(report.id, existingReports);
  }
  
  // 步骤4: 计算优先级
  const priority = calculatePriority({
    reportType: report.reportType,
    reporterReputation: await getReporterReputation(report.reporterUserId),
    reportCount: existingReports.length + 1,
    contentAge: Date.now() - new Date(report.contentCreatedAt).getTime(),
    reportedUserHistory: await getUserViolationCount(report.reportedUserId)
  });
  
  console.log(`[REPORT] 计算优先级: ${priority}`);
  
  // 步骤5: 触发二次审核流程
  const auditResult = await triggerReviewAudit(report, priority);
  
  // 步骤6: 处理审核结果
  await processAuditResult(report, auditResult);
  
  return {
    success: true,
    action: 'review_triggered',
    priority: priority,
    message: '举报已提交，正在审核中'
  };
}

// 触发二次审核
async function triggerReviewAudit(report: UserReport, priority: number) {
  // 获取被举报的内容
  const content = await getContent(report.contentType, report.contentId);
  
  // 使用审核控制器进行二次审核
  const auditController = new StoryAuditController(env, db);
  
  const result = await auditController.processStorySubmission({
    user_id: content.userId,
    content: content.content,
    user_ip: content.userIp,
    user_agent: content.userAgent,
    // 标记为举报触发的审核
    trigger_type: 'user_report',
    report_id: report.id,
    priority: priority
  });
  
  return result;
}

// 处理审核结果
async function processAuditResult(report: UserReport, auditResult: any) {
  if (auditResult.status === 'rejected') {
    // 内容违规，删除内容
    await removeContent(report.contentType, report.contentId);
    
    // 更新举报状态为有效
    await updateReportStatus(report.id, 'valid', {
      reviewResult: 'content_removed',
      auditDetails: auditResult
    });
    
    // 更新举报人信誉 (+10分)
    await updateReporterReputation(report.reporterUserId, 'valid');
    
    // 记录被举报用户违规
    await recordUserViolation(report.reportedUserId, report.reportType);
    
  } else if (auditResult.status === 'approved') {
    // 内容无问题，授予免疫
    await grantContentImmunity(report.contentType, report.contentId, {
      type: ImmunityType.MANUAL_APPROVED,
      grantedBy: auditResult.reviewerId,
      reviewCount: 1
    });
    
    // 检查是否为恶意举报
    const isMalicious = await detectMaliciousReport(report);
    
    if (isMalicious) {
      // 恶意举报
      await updateReportStatus(report.id, 'malicious', {
        reviewResult: 'reporter_warned'
      });
      
      // 更新举报人信誉 (-20分)
      await updateReporterReputation(report.reporterUserId, 'malicious');
      
      // 警告或封禁举报人
      await warnOrBlockReporter(report.reporterUserId);
      
    } else {
      // 普通无效举报
      await updateReportStatus(report.id, 'invalid', {
        reviewResult: 'content_approved'
      });
      
      // 更新举报人信誉 (-5分)
      await updateReporterReputation(report.reporterUserId, 'invalid');
    }
  }
}
```

---

## 🎨 前端界面设计

### 1. 举报按钮和对话框

```typescript
// 故事卡片举报按钮
<Button 
  icon={<FlagOutlined />} 
  onClick={() => setReportModalVisible(true)}
  size="small"
>
  举报
</Button>

// 举报对话框
<Modal
  title="举报内容"
  visible={reportModalVisible}
  onOk={handleSubmitReport}
  onCancel={() => setReportModalVisible(false)}
>
  <Form layout="vertical">
    <Form.Item 
      label="举报类型" 
      name="reportType"
      rules={[{ required: true, message: '请选择举报类型' }]}
    >
      <Select placeholder="请选择举报类型">
        <Option value="political">🚫 政治敏感</Option>
        <Option value="pornographic">🔞 色情内容</Option>
        <Option value="violent">⚠️ 暴力血腥</Option>
        <Option value="harassment">😡 骚扰辱骂</Option>
        <Option value="spam">📢 垃圾广告</Option>
        <Option value="privacy">🔒 隐私泄露</Option>
        <Option value="fake_info">❌ 虚假信息</Option>
        <Option value="off_topic">📍 偏离主题</Option>
        <Option value="other">❓ 其他问题</Option>
      </Select>
    </Form.Item>
    
    <Form.Item 
      label="举报理由" 
      name="reportReason"
      rules={[
        { required: true, message: '请填写举报理由' },
        { min: 10, message: '请详细说明举报理由（至少10个字）' }
      ]}
    >
      <TextArea 
        rows={4} 
        placeholder="请详细说明您的举报理由..."
        maxLength={500}
        showCount
      />
    </Form.Item>
    
    <Alert
      message="举报须知"
      description="请确保您的举报真实有效。恶意举报将影响您的信誉评分，严重者将被限制举报功能。"
      type="warning"
      showIcon
    />
  </Form>
</Modal>
```

---

## 📈 预期效果

### 内容质量提升
- **漏网之鱼拦截率**: > 90%
- **社区监督参与度**: 提升50%
- **违规内容发现速度**: 提升3倍

### 恶意举报防范
- **恶意举报识别率**: > 85%
- **误判率**: < 10%
- **举报人信誉准确度**: > 90%

### 审核效率提升
- **重复审核减少**: 60%
- **自动驳回率**: 40% (免疫内容)
- **人工审核负担**: 减少30%

---

## 📝 实施建议

### 第一阶段: 基础功能 (1周)
1. 创建数据库表
2. 实现举报API
3. 实现免疫机制
4. 前端举报按钮和对话框

### 第二阶段: 信誉系统 (1周)
1. 实现信誉评分计算
2. 实现举报限制检查
3. 实现恶意举报检测
4. 管理员信誉管理界面

### 第三阶段: 优化完善 (1周)
1. 优先级智能计算
2. 举报统计分析
3. 性能优化
4. 测试和上线

---

**设计完成时间**: 2025-09-30  
**设计模式**: INNOVATE (RIPER-5-AI)  
**下一步**: 进入 PLAN 模式，制定实施计划

