"""
分级审核服务
实现三级分级审核系统，根据平台状态动态调整审核严格程度
"""

import json
import time
import re
import random
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector import Error

class AuditLevel(Enum):
    LEVEL1 = "level1"  # 宽松
    LEVEL2 = "level2"  # 标准  
    LEVEL3 = "level3"  # 严格

@dataclass
class AuditLevelConfig:
    level: AuditLevel
    config_name: str
    description: str
    rule_strictness: float
    ai_threshold: float
    manual_review_ratio: float
    enabled_categories: List[str]
    disabled_rules: List[str]
    max_processing_time_ms: int

@dataclass
class ViolationResult:
    rule_id: str
    category: str
    matched_text: str
    severity: str
    confidence: float
    position: int

@dataclass
class AuditDecision:
    passed: bool
    action: str  # 'approve', 'reject', 'ai_review', 'manual_review'
    requires_manual: bool
    confidence: float
    reason: str
    risk_score: float
    violations: List[ViolationResult]
    audit_level: str

class TieredAuditEngine:
    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.current_level = AuditLevel.LEVEL1
        self.level_configs = {}
        self.audit_rules = {}
        self.stats_monitor = RealTimeStatsMonitor(db_config)
        self.load_level_configs()
        self.load_audit_rules()
    
    def get_db_connection(self):
        """获取数据库连接"""
        try:
            connection = mysql.connector.connect(**self.db_config)
            return connection
        except Error as e:
            print(f"数据库连接错误: {e}")
            return None
    
    def load_level_configs(self):
        """从数据库加载级别配置"""
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT * FROM audit_level_configs 
                WHERE is_active = true 
                ORDER BY level
            """)
            
            configs = cursor.fetchall()
            for config in configs:
                level = AuditLevel(config['level'])
                self.level_configs[level] = AuditLevelConfig(
                    level=level,
                    config_name=config['config_name'],
                    description=config['description'],
                    rule_strictness=float(config['rule_strictness']),
                    ai_threshold=float(config['ai_threshold']),
                    manual_review_ratio=float(config['manual_review_ratio']),
                    enabled_categories=json.loads(config['enabled_categories'] or '[]'),
                    disabled_rules=json.loads(config['disabled_rules'] or '[]'),
                    max_processing_time_ms=config['max_processing_time_ms']
                )
                
        except Error as e:
            print(f"加载级别配置错误: {e}")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    def load_audit_rules(self):
        """加载审核规则"""
        # 预置规则库
        self.audit_rules = {
            'POL': [
                {'rule_id': 'POL-001', 'pattern': '习近平|李克强|中央政府|国家主席', 'severity': 'high'},
                {'rule_id': 'POL-002', 'pattern': '反[政正]府|推翻制度|颠覆国家', 'severity': 'high'},
                {'rule_id': 'POL-003', 'pattern': '台独|港独|疆独|藏独', 'severity': 'high'},
            ],
            'POR': [
                {'rule_id': 'POR-001', 'pattern': '性交|裸照|黄片|做爱|性爱', 'severity': 'high'},
                {'rule_id': 'POR-002', 'pattern': '色情|淫秽|三级片|成人电影', 'severity': 'high'},
                {'rule_id': 'POR-003', 'pattern': '约炮|一夜情|援交|包养', 'severity': 'medium'},
            ],
            'VIO': [
                {'rule_id': 'VIO-001', 'pattern': '杀人|血腥|爆炸|持刀|持枪', 'severity': 'medium'},
                {'rule_id': 'VIO-002', 'pattern': '自杀|跳楼|割腕|上吊', 'severity': 'high'},
                {'rule_id': 'VIO-003', 'pattern': '恐怖主义|炸弹|袭击|暴力', 'severity': 'high'},
            ],
            'ADV': [
                {'rule_id': 'ADV-001', 'pattern': '微信号|QQ号|VX|电话|手机', 'severity': 'medium'},
                {'rule_id': 'ADV-002', 'pattern': '加我|联系我|私聊|扫码', 'severity': 'low'},
                {'rule_id': 'ADV-003', 'pattern': '代购|刷单|兼职|赚钱', 'severity': 'medium'},
            ],
            'PRI': [
                {'rule_id': 'PRI-001', 'pattern': r'\d{18}|\d{15}', 'severity': 'high'},
                {'rule_id': 'PRI-002', 'pattern': r'1[3-9]\d{9}', 'severity': 'high'},
                {'rule_id': 'PRI-003', 'pattern': r'\d{4}\s?\d{4}\s?\d{4}\s?\d{4}', 'severity': 'high'},
            ],
            'DIS': [
                {'rule_id': 'DIS-001', 'pattern': '垃圾|傻逼|废物|白痴|智障', 'severity': 'low'},
                {'rule_id': 'DIS-002', 'pattern': '滚蛋|去死|操你|草你', 'severity': 'medium'},
                {'rule_id': 'DIS-003', 'pattern': '歧视|仇恨|种族|性别', 'severity': 'medium'},
            ],
            'OTH': [
                {'rule_id': 'OTH-001', 'pattern': '测试|test|spam|垃圾信息', 'severity': 'low'},
                {'rule_id': 'OTH-002', 'pattern': '刷屏|灌水|复制粘贴', 'severity': 'low'},
            ]
        }
    
    def preprocess_text(self, text: str) -> str:
        """文本预处理：处理变形、空格插入等规避手段"""
        if not text:
            return ""
            
        # 全角半角转换
        text = text.replace('（', '(').replace('）', ')').replace('，', ',')
        
        # 去除干扰字符
        text = re.sub(r'[\s\-_\*\.\u200b\u200c\u200d]+', '', text)
        
        # 数字字母替换
        replacements = {
            '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', 
            '6': 'g', '7': 't', '8': 'b', '9': 'g'
        }
        for num, letter in replacements.items():
            text = text.replace(num, letter)
        
        return text.lower()
    
    def check_content_with_level(self, content: str, content_type: str, user_ip: str = None) -> AuditDecision:
        """根据当前级别检查内容"""
        start_time = time.time()
        
        # 获取当前级别配置
        config = self.level_configs.get(self.current_level)
        if not config:
            # 如果没有配置，使用默认的level1
            config = self.get_default_config()
        
        # 预处理内容
        processed_content = self.preprocess_text(content)
        
        # 应用级别特定的规则
        violations = self.apply_level_rules(processed_content, content_type, config)
        
        # 计算风险分数
        risk_score = self.calculate_risk_score(violations, config.rule_strictness)
        
        # 决策逻辑
        decision = self.make_decision(risk_score, violations, config)
        
        # 检查处理时间
        processing_time = (time.time() - start_time) * 1000
        if processing_time > config.max_processing_time_ms:
            print(f"警告: 审核处理时间超时 {processing_time}ms > {config.max_processing_time_ms}ms")
        
        # 更新统计
        self.stats_monitor.update_stats(decision, violations, user_ip)
        
        # 检查是否需要切换级别
        self.check_and_switch_level()
        
        return AuditDecision(
            passed=decision['passed'],
            action=decision['action'],
            requires_manual=decision['requires_manual'],
            confidence=decision['confidence'],
            reason=decision['reason'],
            risk_score=risk_score,
            violations=violations,
            audit_level=self.current_level.value
        )
    
    def apply_level_rules(self, content: str, content_type: str, config: AuditLevelConfig) -> List[ViolationResult]:
        """应用特定级别的规则"""
        violations = []
        
        for category in config.enabled_categories:
            if category not in self.audit_rules:
                continue
                
            for rule in self.audit_rules[category]:
                if rule['rule_id'] in config.disabled_rules:
                    continue
                
                # 应用严格度调整
                adjusted_confidence = self.get_adjusted_confidence(rule, config.rule_strictness)
                
                # 匹配规则
                matches = self.match_rule(content, rule, adjusted_confidence)
                violations.extend(matches)
        
        return violations
    
    def match_rule(self, content: str, rule: dict, min_confidence: float = 0.7) -> List[ViolationResult]:
        """匹配单个规则"""
        violations = []
        pattern = rule['pattern']
        
        try:
            # 使用正则表达式匹配
            matches = re.finditer(pattern, content, re.IGNORECASE)
            
            for match in matches:
                confidence = min(1.0, min_confidence + 0.1)  # 基础置信度
                
                violation = ViolationResult(
                    rule_id=rule['rule_id'],
                    category=rule['rule_id'].split('-')[0],
                    matched_text=match.group(),
                    severity=rule['severity'],
                    confidence=confidence,
                    position=match.start()
                )
                violations.append(violation)
                
        except re.error as e:
            print(f"正则表达式错误 {pattern}: {e}")
        
        return violations
    
    def get_adjusted_confidence(self, rule: dict, strictness: float) -> float:
        """根据严格度调整置信度阈值"""
        base_confidence = 0.7
        
        if strictness > 1.0:
            # 更严格：降低置信度阈值
            return max(0.5, base_confidence - (strictness - 1.0) * 0.2)
        elif strictness < 1.0:
            # 更宽松：提高置信度阈值
            return min(0.9, base_confidence + (1.0 - strictness) * 0.2)
        
        return base_confidence
    
    def calculate_risk_score(self, violations: List[ViolationResult], strictness: float) -> float:
        """计算风险分数"""
        if not violations:
            return 0.0
        
        total_score = 0.0
        severity_weights = {'high': 1.0, 'medium': 0.6, 'low': 0.3}
        
        for violation in violations:
            weight = severity_weights.get(violation.severity, 0.5)
            score = weight * violation.confidence
            total_score += score
        
        # 应用严格度调整
        adjusted_score = total_score * strictness
        
        # 归一化到0-1范围
        return min(1.0, adjusted_score)
    
    def make_decision(self, risk_score: float, violations: List[ViolationResult], config: AuditLevelConfig) -> dict:
        """根据级别配置做出审核决策"""
        # 高危违规直接拒绝
        high_severity_violations = [v for v in violations if v.severity == 'high']
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
    
    def get_default_config(self) -> AuditLevelConfig:
        """获取默认配置"""
        return AuditLevelConfig(
            level=AuditLevel.LEVEL1,
            config_name="默认配置",
            description="默认一级审核配置",
            rule_strictness=1.0,
            ai_threshold=0.5,
            manual_review_ratio=0.1,
            enabled_categories=['POL', 'POR', 'VIO', 'PRI'],
            disabled_rules=[],
            max_processing_time_ms=100
        )
    
    def switch_level(self, new_level: AuditLevel, reason: str = "manual", admin_id: str = None):
        """切换审核级别"""
        if new_level == self.current_level:
            return
        
        old_level = self.current_level
        self.current_level = new_level
        
        # 记录切换历史
        self.record_level_switch(old_level, new_level, reason, admin_id)
        
        print(f"审核级别已切换: {old_level.value} -> {new_level.value}, 原因: {reason}")
    
    def record_level_switch(self, from_level: AuditLevel, to_level: AuditLevel, reason: str, admin_id: str = None):
        """记录级别切换历史"""
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO audit_level_history 
                (from_level, to_level, trigger_reason, switched_by, admin_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                from_level.value if from_level else None,
                to_level.value,
                reason,
                'manual' if admin_id else 'auto',
                admin_id
            ))
            connection.commit()
            
        except Error as e:
            print(f"记录级别切换历史错误: {e}")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    def check_and_switch_level(self):
        """检查并自动切换级别"""
        new_level = self.stats_monitor.check_level_switch_triggers(self.current_level)
        if new_level and new_level != self.current_level:
            trigger_data = self.stats_monitor.get_current_hour_stats()
            reason = f"自动切换: {trigger_data}"
            self.switch_level(new_level, reason)


class RealTimeStatsMonitor:
    """实时统计监控"""
    
    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.current_hour_stats = {}
        self.level_switch_cooldown = 0
        self.coordinated_attack_ips = set()
    
    def get_db_connection(self):
        """获取数据库连接"""
        try:
            connection = mysql.connector.connect(**self.db_config)
            return connection
        except Error as e:
            print(f"数据库连接错误: {e}")
            return None
    
    def update_stats(self, decision: dict, violations: List[ViolationResult], user_ip: str = None):
        """更新实时统计"""
        current_hour = self.get_current_hour()
        
        if current_hour not in self.current_hour_stats:
            self.current_hour_stats[current_hour] = {
                'total_submissions': 0,
                'violation_count': 0,
                'spam_count': 0,
                'manual_review_count': 0,
                'ips': set()
            }
        
        stats = self.current_hour_stats[current_hour]
        stats['total_submissions'] += 1
        
        if user_ip:
            stats['ips'].add(user_ip)
        
        if violations:
            stats['violation_count'] += 1
            
        if self.is_spam_pattern(violations):
            stats['spam_count'] += 1
            
        if decision['requires_manual']:
            stats['manual_review_count'] += 1
        
        # 保存到数据库
        self.save_stats_to_db(current_hour, stats)
    
    def get_current_hour(self) -> str:
        """获取当前小时时间窗口"""
        now = datetime.now()
        return now.strftime('%Y-%m-%d %H:00:00')
    
    def is_spam_pattern(self, violations: List[ViolationResult]) -> bool:
        """判断是否为垃圾内容模式"""
        spam_categories = ['ADV', 'OTH']
        return any(v.category in spam_categories for v in violations)
    
    def save_stats_to_db(self, time_window: str, stats: dict):
        """保存统计数据到数据库"""
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            cursor = connection.cursor()
            
            violation_rate = stats['violation_count'] / max(stats['total_submissions'], 1)
            
            cursor.execute("""
                INSERT INTO audit_realtime_stats 
                (time_window, total_submissions, violation_count, violation_rate, 
                 spam_count, manual_review_queue_size)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                total_submissions = VALUES(total_submissions),
                violation_count = VALUES(violation_count),
                violation_rate = VALUES(violation_rate),
                spam_count = VALUES(spam_count),
                manual_review_queue_size = VALUES(manual_review_queue_size)
            """, (
                time_window,
                stats['total_submissions'],
                stats['violation_count'],
                violation_rate,
                stats['spam_count'],
                stats['manual_review_count']
            ))
            connection.commit()
            
        except Error as e:
            print(f"保存统计数据错误: {e}")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    def check_level_switch_triggers(self, current_level: AuditLevel) -> Optional[AuditLevel]:
        """检查是否需要切换审核级别"""
        if time.time() < self.level_switch_cooldown:
            return None  # 冷却期内不切换
            
        current_stats = self.get_current_hour_stats()
        if not current_stats:
            return None
        
        # 计算违规率
        violation_rate = current_stats.get('violation_count', 0) / max(current_stats.get('total_submissions', 1), 1)
        
        # 检查升级条件
        if current_level == AuditLevel.LEVEL1:
            if (violation_rate > 0.15 or 
                current_stats.get('spam_count', 0) > 50 or
                current_stats.get('manual_review_count', 0) > 100):
                self.level_switch_cooldown = time.time() + 1800  # 30分钟冷却
                return AuditLevel.LEVEL2
                
        elif current_level == AuditLevel.LEVEL2:
            if (violation_rate > 0.25 or 
                current_stats.get('spam_count', 0) > 100 or
                self.detect_coordinated_attack(current_stats)):
                self.level_switch_cooldown = time.time() + 3600  # 1小时冷却
                return AuditLevel.LEVEL3
        
        # 检查降级条件
        if self.check_stable_period(6) and violation_rate < 0.05:
            if current_level == AuditLevel.LEVEL3:
                return AuditLevel.LEVEL2
            elif current_level == AuditLevel.LEVEL2:
                return AuditLevel.LEVEL1
        
        return None
    
    def get_current_hour_stats(self) -> dict:
        """获取当前小时统计"""
        current_hour = self.get_current_hour()
        return self.current_hour_stats.get(current_hour, {})
    
    def detect_coordinated_attack(self, stats: dict) -> bool:
        """检测协同攻击"""
        # 简化实现：检测短时间内来自少数IP的大量提交
        ips = stats.get('ips', set())
        total_submissions = stats.get('total_submissions', 0)
        
        if len(ips) < 5 and total_submissions > 100:
            return True  # 少于5个IP但提交超过100次
        
        return False
    
    def check_stable_period(self, hours: int) -> bool:
        """检查稳定期"""
        # 简化实现：检查过去几小时的违规率
        now = datetime.now()
        stable_count = 0
        
        for i in range(hours):
            hour_time = (now - timedelta(hours=i)).strftime('%Y-%m-%d %H:00:00')
            hour_stats = self.current_hour_stats.get(hour_time, {})
            
            if hour_stats:
                violation_rate = hour_stats.get('violation_count', 0) / max(hour_stats.get('total_submissions', 1), 1)
                if violation_rate < 0.05:
                    stable_count += 1
        
        return stable_count >= hours * 0.8  # 80%的时间稳定
