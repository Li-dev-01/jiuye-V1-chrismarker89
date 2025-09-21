# 分级审核系统实施方案

> **核心理念**: 根据平台状态动态调整审核严格程度  
> **目标**: 平衡内容质量与用户体验，降低运营成本  
> **状态**: 设计完成，准备实施

## 🎯 分级审核策略

### 📊 三级审核模式对比

| 审核级别 | 使用场景 | 本地规则覆盖率 | AI审核阈值 | 人工审核比例 | 通过率预期 |
|---------|---------|---------------|-----------|-------------|-----------|
| **一级 (宽松)** | 正常运营期 | 60% | 0.3 | 5% | 85-90% |
| **二级 (标准)** | 内容质量下降 | 70% | 0.5 | 15% | 75-80% |
| **三级 (严格)** | 恶意攻击期 | 80% | 0.7 | 30% | 60-70% |

### 🔄 动态切换机制

#### 自动触发条件
```typescript
interface AuditLevelTrigger {
  // 一级 → 二级触发条件
  level1_to_2: {
    violation_rate_1h: 0.15,      // 1小时违规率超过15%
    spam_submissions_1h: 50,       // 1小时垃圾提交超过50条
    manual_review_queue: 100       // 人工审核队列超过100条
  },
  
  // 二级 → 三级触发条件  
  level2_to_3: {
    violation_rate_1h: 0.25,      // 1小时违规率超过25%
    spam_submissions_1h: 100,      // 1小时垃圾提交超过100条
    coordinated_attack: true       // 检测到协同攻击
  },
  
  // 降级条件 (三级 → 二级 → 一级)
  downgrade: {
    stable_period_hours: 6,        // 稳定期6小时
    violation_rate_6h: 0.05,      // 6小时违规率低于5%
    manual_review_queue: 20        // 人工审核队列少于20条
  }
}
```

## 🏗️ 技术实现架构

### 1. 数据库设计扩展

```sql
-- 审核级别配置表
CREATE TABLE audit_level_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level ENUM('level1', 'level2', 'level3') NOT NULL,
    config_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 规则配置
    rule_strictness DECIMAL(2,1) DEFAULT 1.0,  -- 规则严格度倍数
    ai_threshold DECIMAL(3,2) DEFAULT 0.5,     -- AI审核阈值
    manual_review_ratio DECIMAL(3,2) DEFAULT 0.1, -- 强制人工审核比例
    
    -- 规则启用状态
    enabled_categories JSON, -- ['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS', 'OTH']
    disabled_rules JSON,     -- 禁用的具体规则ID
    
    -- 性能配置
    max_processing_time_ms INT DEFAULT 100,
    batch_size INT DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 审核级别历史记录
CREATE TABLE audit_level_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_level ENUM('level1', 'level2', 'level3'),
    to_level ENUM('level1', 'level2', 'level3') NOT NULL,
    trigger_reason VARCHAR(200),
    trigger_data JSON, -- 触发时的统计数据
    switched_by ENUM('auto', 'manual') DEFAULT 'auto',
    admin_id UUID,
    switched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level_history_time (switched_at),
    INDEX idx_level_history_level (to_level, switched_at)
);

-- 实时统计表
CREATE TABLE audit_realtime_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_window TIMESTAMP NOT NULL, -- 统计时间窗口(每小时)
    
    total_submissions INT DEFAULT 0,
    violation_count INT DEFAULT 0,
    violation_rate DECIMAL(4,3) DEFAULT 0.0,
    
    spam_count INT DEFAULT 0,
    coordinated_ips JSON, -- 协同攻击IP列表
    
    manual_review_queue_size INT DEFAULT 0,
    ai_review_count INT DEFAULT 0,
    auto_approved_count INT DEFAULT 0,
    auto_rejected_count INT DEFAULT 0,
    
    current_audit_level ENUM('level1', 'level2', 'level3') DEFAULT 'level1',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_time_window (time_window),
    INDEX idx_stats_time (time_window),
    INDEX idx_stats_level (current_audit_level, time_window)
);
```

### 2. 分级规则引擎

```python
# backend/services/tiered_audit_service.py
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional
import json
import time

class AuditLevel(Enum):
    LEVEL1 = "level1"  # 宽松
    LEVEL2 = "level2"  # 标准  
    LEVEL3 = "level3"  # 严格

@dataclass
class AuditLevelConfig:
    level: AuditLevel
    rule_strictness: float
    ai_threshold: float
    manual_review_ratio: float
    enabled_categories: List[str]
    disabled_rules: List[str]
    max_processing_time_ms: int

class TieredAuditEngine:
    def __init__(self):
        self.current_level = AuditLevel.LEVEL1
        self.level_configs = {}
        self.stats_monitor = RealTimeStatsMonitor()
        self.load_level_configs()
    
    def load_level_configs(self):
        """加载各级别配置"""
        self.level_configs = {
            AuditLevel.LEVEL1: AuditLevelConfig(
                level=AuditLevel.LEVEL1,
                rule_strictness=0.8,  # 80%严格度
                ai_threshold=0.3,
                manual_review_ratio=0.05,
                enabled_categories=['POL', 'POR', 'VIO', 'PRI'], # 只启用高危类别
                disabled_rules=['DIS-001', 'ADV-002'], # 禁用部分争议规则
                max_processing_time_ms=50
            ),
            AuditLevel.LEVEL2: AuditLevelConfig(
                level=AuditLevel.LEVEL2,
                rule_strictness=1.0,  # 100%严格度
                ai_threshold=0.5,
                manual_review_ratio=0.15,
                enabled_categories=['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS'],
                disabled_rules=[],
                max_processing_time_ms=100
            ),
            AuditLevel.LEVEL3: AuditLevelConfig(
                level=AuditLevel.LEVEL3,
                rule_strictness=1.2,  # 120%严格度(更敏感)
                ai_threshold=0.7,
                manual_review_ratio=0.30,
                enabled_categories=['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS', 'OTH'],
                disabled_rules=[],
                max_processing_time_ms=200
            )
        }
    
    def check_content_with_level(self, content: str, content_type: str) -> dict:
        """根据当前级别检查内容"""
        config = self.level_configs[self.current_level]
        
        # 应用级别特定的规则
        violations = self.apply_level_rules(content, content_type, config)
        
        # 计算风险分数
        risk_score = self.calculate_risk_score(violations, config.rule_strictness)
        
        # 决策逻辑
        decision = self.make_decision(risk_score, violations, config)
        
        # 更新统计
        self.stats_monitor.update_stats(decision, violations)
        
        return {
            'audit_level': self.current_level.value,
            'passed': decision['passed'],
            'action': decision['action'],
            'risk_score': risk_score,
            'violations': violations,
            'requires_manual': decision['requires_manual'],
            'confidence': decision['confidence']
        }
    
    def apply_level_rules(self, content: str, content_type: str, config: AuditLevelConfig) -> List[dict]:
        """应用特定级别的规则"""
        violations = []
        
        # 获取适用规则
        applicable_rules = self.get_applicable_rules(
            content_type, 
            config.enabled_categories,
            config.disabled_rules
        )
        
        # 应用严格度调整
        for rule in applicable_rules:
            adjusted_rule = self.adjust_rule_strictness(rule, config.rule_strictness)
            matches = self.match_rule(content, adjusted_rule)
            violations.extend(matches)
        
        return violations
    
    def adjust_rule_strictness(self, rule: dict, strictness: float) -> dict:
        """根据严格度调整规则"""
        adjusted_rule = rule.copy()
        
        if strictness > 1.0:
            # 更严格：扩展匹配模式
            if rule['pattern_type'] == 'keyword':
                # 添加变形匹配
                adjusted_rule['pattern'] = self.expand_pattern_variations(rule['pattern'])
            elif rule['pattern_type'] == 'regex':
                # 降低匹配阈值
                adjusted_rule['min_confidence'] = 0.6
        elif strictness < 1.0:
            # 更宽松：提高匹配阈值
            adjusted_rule['min_confidence'] = 0.8
            
        return adjusted_rule
    
    def make_decision(self, risk_score: float, violations: List[dict], config: AuditLevelConfig) -> dict:
        """根据级别配置做出审核决策"""
        # 高危违规直接拒绝
        high_severity_violations = [v for v in violations if v['severity'] == 'high']
        if high_severity_violations:
            return {
                'passed': False,
                'action': 'reject',
                'requires_manual': False,
                'confidence': 0.95,
                'reason': 'high_severity_violation'
            }
        
        # 根据风险分数和AI阈值决策
        if risk_score >= config.ai_threshold:
            return {
                'passed': False,
                'action': 'ai_review',
                'requires_manual': False,
                'confidence': 0.7,
                'reason': 'ai_review_required'
            }
        
        # 强制人工审核比例
        import random
        if random.random() < config.manual_review_ratio:
            return {
                'passed': False,
                'action': 'manual_review',
                'requires_manual': True,
                'confidence': 0.5,
                'reason': 'random_manual_review'
            }
        
        # 通过
        return {
            'passed': True,
            'action': 'approve',
            'requires_manual': False,
            'confidence': 0.9,
            'reason': 'auto_approved'
        }

class RealTimeStatsMonitor:
    """实时统计监控"""
    
    def __init__(self):
        self.current_hour_stats = {}
        self.level_switch_cooldown = 0
    
    def update_stats(self, decision: dict, violations: List[dict]):
        """更新实时统计"""
        current_hour = self.get_current_hour()
        
        if current_hour not in self.current_hour_stats:
            self.current_hour_stats[current_hour] = {
                'total_submissions': 0,
                'violation_count': 0,
                'spam_count': 0,
                'manual_review_count': 0
            }
        
        stats = self.current_hour_stats[current_hour]
        stats['total_submissions'] += 1
        
        if violations:
            stats['violation_count'] += 1
            
        if self.is_spam_pattern(violations):
            stats['spam_count'] += 1
            
        if decision['requires_manual']:
            stats['manual_review_count'] += 1
    
    def check_level_switch_triggers(self, current_level: AuditLevel) -> Optional[AuditLevel]:
        """检查是否需要切换审核级别"""
        if time.time() < self.level_switch_cooldown:
            return None  # 冷却期内不切换
            
        current_stats = self.get_current_hour_stats()
        
        # 计算违规率
        violation_rate = (current_stats['violation_count'] / 
                         max(current_stats['total_submissions'], 1))
        
        # 检查升级条件
        if current_level == AuditLevel.LEVEL1:
            if (violation_rate > 0.15 or 
                current_stats['spam_count'] > 50 or
                current_stats['manual_review_count'] > 100):
                return AuditLevel.LEVEL2
                
        elif current_level == AuditLevel.LEVEL2:
            if (violation_rate > 0.25 or 
                current_stats['spam_count'] > 100 or
                self.detect_coordinated_attack()):
                return AuditLevel.LEVEL3
        
        # 检查降级条件
        if self.check_stable_period(6) and violation_rate < 0.05:
            if current_level == AuditLevel.LEVEL3:
                return AuditLevel.LEVEL2
            elif current_level == AuditLevel.LEVEL2:
                return AuditLevel.LEVEL1
        
        return None
    
    def detect_coordinated_attack(self) -> bool:
        """检测协同攻击"""
        # 检测短时间内大量相似提交
        # 检测来自相同IP段的异常提交
        # 检测内容模式相似度
        return False  # 简化实现
```

### 3. 前端管理界面

```typescript
// frontend/src/components/admin/TieredAuditControl.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Alert, Button, Switch, Statistic, Row, Col, 
  Timeline, Badge, Progress, Modal, Form, Slider 
} from 'antd';

interface AuditLevelStatus {
  current_level: 'level1' | 'level2' | 'level3';
  auto_switch_enabled: boolean;
  stats: {
    violation_rate_1h: number;
    spam_count_1h: number;
    manual_queue_size: number;
    total_submissions_1h: number;
  };
  triggers: {
    next_level_threshold: number;
    time_to_next_check: number;
  };
}

const TieredAuditControl: React.FC = () => {
  const [status, setStatus] = useState<AuditLevelStatus | null>(null);
  const [manualSwitchModal, setManualSwitchModal] = useState(false);
  
  const levelConfig = {
    level1: { 
      name: '一级 (宽松)', 
      color: 'green', 
      description: '正常运营期，注重用户体验' 
    },
    level2: { 
      name: '二级 (标准)', 
      color: 'orange', 
      description: '内容质量下降，平衡审核' 
    },
    level3: { 
      name: '三级 (严格)', 
      color: 'red', 
      description: '恶意攻击期，严格把控' 
    }
  };
  
  return (
    <div style={{ padding: '24px' }}>
      {/* 当前状态概览 */}
      <Card title="审核级别控制台" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="当前审核级别"
              value={levelConfig[status?.current_level || 'level1'].name}
              valueStyle={{ 
                color: levelConfig[status?.current_level || 'level1'].color === 'green' ? '#3f8600' : 
                       levelConfig[status?.current_level || 'level1'].color === 'orange' ? '#cf1322' : '#cf1322'
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="1小时违规率"
              value={status?.stats.violation_rate_1h || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: (status?.stats.violation_rate_1h || 0) > 15 ? '#cf1322' : '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待审核队列"
              value={status?.stats.manual_queue_size || 0}
              suffix="条"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="1小时提交量"
              value={status?.stats.total_submissions_1h || 0}
              suffix="条"
            />
          </Col>
        </Row>
        
        <div style={{ marginTop: 16 }}>
          <Alert
            message={levelConfig[status?.current_level || 'level1'].description}
            type={status?.current_level === 'level1' ? 'success' : 
                  status?.current_level === 'level2' ? 'warning' : 'error'}
            showIcon
          />
        </div>
      </Card>
      
      {/* 自动切换控制 */}
      <Card title="自动切换设置" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={12}>
            <div>
              <Switch 
                checked={status?.auto_switch_enabled}
                onChange={handleAutoSwitchToggle}
              />
              <span style={{ marginLeft: 8 }}>启用自动级别切换</span>
            </div>
            <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
              根据实时数据自动调整审核严格程度
            </div>
          </Col>
          <Col span={12}>
            <Button 
              type="primary" 
              onClick={() => setManualSwitchModal(true)}
            >
              手动切换级别
            </Button>
          </Col>
        </Row>
      </Card>
      
      {/* 级别切换历史 */}
      <Card title="切换历史">
        <Timeline>
          <Timeline.Item color="green">
            <div>2024-01-15 14:30 切换到一级模式</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              触发原因: 违规率降低，系统稳定
            </div>
          </Timeline.Item>
          <Timeline.Item color="red">
            <div>2024-01-15 10:15 切换到三级模式</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              触发原因: 检测到协同攻击，垃圾提交激增
            </div>
          </Timeline.Item>
        </Timeline>
      </Card>
    </div>
  );
};
```

## 📊 实施效果预测

### 成本效益分析
```typescript
interface CostBenefit {
  level1: {
    ai_calls_per_hour: 50,      // AI调用次数
    manual_reviews_per_hour: 5,  // 人工审核次数
    user_satisfaction: 0.9,      // 用户满意度
    content_quality: 0.8         // 内容质量
  },
  level2: {
    ai_calls_per_hour: 80,
    manual_reviews_per_hour: 15,
    user_satisfaction: 0.75,
    content_quality: 0.9
  },
  level3: {
    ai_calls_per_hour: 120,
    manual_reviews_per_hour: 30,
    user_satisfaction: 0.6,
    content_quality: 0.95
  }
}
```

### 智能切换示例场景
1. **正常时期**: 一级模式，85%通过率，用户体验优先
2. **内容质量下降**: 自动切换二级，加强AI审核
3. **恶意攻击**: 立即切换三级，严格把控
4. **攻击结束**: 6小时稳定期后自动降级

## 🎯 部署计划

### Week 1: 核心引擎开发
- [ ] 分级规则引擎实现
- [ ] 数据库结构扩展
- [ ] 基础API接口

### Week 2: 监控与切换逻辑
- [ ] 实时统计监控
- [ ] 自动切换算法
- [ ] 手动切换接口

### Week 3: 前端界面与测试
- [ ] 管理控制台
- [ ] 统计仪表板
- [ ] 系统测试与优化

## 🚀 立即可实施的快速原型

### 简化版分级配置 (可立即集成到现有系统)

```python
# 在现有 audit_api.py 中添加
TIERED_AUDIT_CONFIG = {
    'current_level': 'level1',  # 当前级别
    'auto_switch': True,        # 是否自动切换

    'level1': {  # 宽松模式
        'name': '一级审核 (宽松)',
        'ai_threshold': 0.3,
        'manual_ratio': 0.05,
        'enabled_categories': ['POL', 'POR', 'VIO', 'PRI'],
        'rule_multiplier': 0.8
    },
    'level2': {  # 标准模式
        'name': '二级审核 (标准)',
        'ai_threshold': 0.5,
        'manual_ratio': 0.15,
        'enabled_categories': ['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS'],
        'rule_multiplier': 1.0
    },
    'level3': {  # 严格模式
        'name': '三级审核 (严格)',
        'ai_threshold': 0.7,
        'manual_ratio': 0.30,
        'enabled_categories': ['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS', 'OTH'],
        'rule_multiplier': 1.2
    }
}

# 修改现有的 layer1_rule_audit 函数
def layer1_rule_audit_tiered(content_type: str, content_data: dict) -> dict:
    """分级本地规则审核"""
    current_config = TIERED_AUDIT_CONFIG[TIERED_AUDIT_CONFIG['current_level']]

    # 应用当前级别的规则
    audit_result = apply_tiered_rules(content_data, current_config)

    return audit_result

# 新增级别切换API
@app.route('/api/audit/level', methods=['GET', 'POST'])
def audit_level_control():
    """审核级别控制"""
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'data': {
                'current_level': TIERED_AUDIT_CONFIG['current_level'],
                'config': TIERED_AUDIT_CONFIG[TIERED_AUDIT_CONFIG['current_level']],
                'auto_switch': TIERED_AUDIT_CONFIG['auto_switch']
            }
        })

    elif request.method == 'POST':
        data = request.get_json()
        new_level = data.get('level')

        if new_level in ['level1', 'level2', 'level3']:
            TIERED_AUDIT_CONFIG['current_level'] = new_level
            return jsonify({
                'success': True,
                'message': f'审核级别已切换到{new_level}',
                'data': TIERED_AUDIT_CONFIG[new_level]
            })
```

### 前端快速控制面板

```typescript
// 可添加到现有管理页面的组件
const QuickAuditLevelControl: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState('level1');

  const levels = {
    level1: { name: '一级 (宽松)', color: 'green', desc: '正常运营' },
    level2: { name: '二级 (标准)', color: 'orange', desc: '质量下降' },
    level3: { name: '三级 (严格)', color: 'red', desc: '恶意攻击' }
  };

  const switchLevel = async (level: string) => {
    try {
      await fetch('/api/audit/level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      setCurrentLevel(level);
      message.success(`已切换到${levels[level].name}`);
    } catch (error) {
      message.error('切换失败');
    }
  };

  return (
    <Card title="审核级别控制" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          当前级别: <Tag color={levels[currentLevel].color}>
            {levels[currentLevel].name}
          </Tag>
        </div>
        <Radio.Group value={currentLevel} onChange={(e) => switchLevel(e.target.value)}>
          {Object.entries(levels).map(([key, config]) => (
            <Radio.Button key={key} value={key}>
              {config.name}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>
    </Card>
  );
};
```

## 💡 使用场景示例

### 场景1: 正常运营期 (一级模式)
- **特点**: 用户活跃，内容质量稳定
- **策略**: 宽松审核，优先用户体验
- **效果**: 85%内容自动通过，用户满意度高

### 场景2: 内容质量下降 (二级模式)
- **特点**: 垃圾内容增多，需要加强管控
- **策略**: 标准审核，平衡质量与体验
- **效果**: 70%内容通过，质量明显提升

### 场景3: 恶意攻击期 (三级模式)
- **特点**: 大量垃圾提交，协同攻击
- **策略**: 严格审核，保护平台安全
- **效果**: 60%内容通过，有效阻止攻击

### 场景4: 特殊时期 (手动切换)
- **特点**: 重要活动期间，需要特别管控
- **策略**: 管理员手动切换到严格模式
- **效果**: 确保内容质量，维护平台形象

## 🎯 实施优势

1. **灵活应对**: 根据实际情况动态调整
2. **成本控制**: 避免过度审核造成的资源浪费
3. **用户体验**: 正常时期保持良好体验
4. **安全保障**: 攻击时期快速响应保护
5. **运营效率**: 减少人工干预，自动化管理

这个分级审核系统将为您的平台提供强大的内容质量保护能力，既能在正常时期提供良好的用户体验，又能在面临攻击时快速响应，是一个非常实用的解决方案！
