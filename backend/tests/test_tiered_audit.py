"""
分级审核系统测试用例
包括单元测试、集成测试、压力测试等
"""

import unittest
import json
import time
import threading
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.tiered_audit_service import TieredAuditEngine, AuditLevel, RealTimeStatsMonitor

class TestTieredAuditEngine(unittest.TestCase):
    """分级审核引擎测试"""
    
    def setUp(self):
        """测试前准备"""
        self.mock_db_config = {
            'host': 'localhost',
            'user': 'test',
            'password': 'test',
            'database': 'test_db'
        }
        
        # Mock数据库连接
        self.mock_connection = Mock()
        self.mock_cursor = Mock()
        self.mock_connection.cursor.return_value = self.mock_cursor
        self.mock_cursor.fetchall.return_value = []
        self.mock_cursor.fetchone.return_value = None
        
        with patch('mysql.connector.connect', return_value=self.mock_connection):
            self.engine = TieredAuditEngine(self.mock_db_config)
    
    def test_initialization(self):
        """测试引擎初始化"""
        self.assertIsNotNone(self.engine)
        self.assertEqual(self.engine.current_level, AuditLevel.LEVEL1)
        self.assertIsInstance(self.engine.audit_rules, dict)
        self.assertIn('POL', self.engine.audit_rules)
        self.assertIn('POR', self.engine.audit_rules)
    
    def test_text_preprocessing(self):
        """测试文本预处理"""
        # 测试全角半角转换
        text1 = "测试（内容）"
        processed1 = self.engine.preprocess_text(text1)
        self.assertIn('(', processed1)
        self.assertIn(')', processed1)
        
        # 测试干扰字符去除
        text2 = "测-试*内.容"
        processed2 = self.engine.preprocess_text(text2)
        self.assertEqual(processed2, "测试内容")
        
        # 测试数字字母替换
        text3 = "测试1234"
        processed3 = self.engine.preprocess_text(text3)
        self.assertNotIn('1', processed3)
        self.assertNotIn('2', processed3)
    
    def test_rule_matching(self):
        """测试规则匹配"""
        # 测试政治敏感词
        rule = {'rule_id': 'POL-001', 'pattern': '习近平', 'severity': 'high'}
        violations = self.engine.match_rule("习近平是国家主席", rule)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0].category, 'POL')
        self.assertEqual(violations[0].matched_text, '习近平')
        
        # 测试正则表达式
        rule = {'rule_id': 'PRI-001', 'pattern': r'\d{18}', 'severity': 'high'}
        violations = self.engine.match_rule("我的身份证号是123456789012345678", rule)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0].matched_text, '123456789012345678')
        
        # 测试无匹配
        rule = {'rule_id': 'TEST-001', 'pattern': '不存在的词', 'severity': 'low'}
        violations = self.engine.match_rule("正常的内容", rule)
        self.assertEqual(len(violations), 0)
    
    def test_risk_score_calculation(self):
        """测试风险分数计算"""
        from services.tiered_audit_service import ViolationResult
        
        # 高风险违规
        high_violations = [
            ViolationResult('POL-001', 'POL', '习近平', 'high', 0.9, 0),
            ViolationResult('POR-001', 'POR', '色情', 'high', 0.8, 5)
        ]
        score = self.engine.calculate_risk_score(high_violations, 1.0)
        self.assertGreater(score, 0.8)
        
        # 低风险违规
        low_violations = [
            ViolationResult('DIS-001', 'DIS', '垃圾', 'low', 0.6, 0)
        ]
        score = self.engine.calculate_risk_score(low_violations, 1.0)
        self.assertLess(score, 0.3)
        
        # 无违规
        score = self.engine.calculate_risk_score([], 1.0)
        self.assertEqual(score, 0.0)
    
    def test_level_specific_rules(self):
        """测试级别特定规则"""
        # 设置不同级别配置
        from services.tiered_audit_service import AuditLevelConfig
        
        level1_config = AuditLevelConfig(
            level=AuditLevel.LEVEL1,
            config_name="测试一级",
            description="测试",
            rule_strictness=0.8,
            ai_threshold=0.3,
            manual_review_ratio=0.05,
            enabled_categories=['POL', 'POR'],
            disabled_rules=[],
            max_processing_time_ms=100
        )
        
        level3_config = AuditLevelConfig(
            level=AuditLevel.LEVEL3,
            config_name="测试三级",
            description="测试",
            rule_strictness=1.2,
            ai_threshold=0.7,
            manual_review_ratio=0.3,
            enabled_categories=['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS', 'OTH'],
            disabled_rules=[],
            max_processing_time_ms=200
        )
        
        self.engine.level_configs[AuditLevel.LEVEL1] = level1_config
        self.engine.level_configs[AuditLevel.LEVEL3] = level3_config
        
        # 测试一级审核（宽松）
        self.engine.current_level = AuditLevel.LEVEL1
        violations1 = self.engine.apply_level_rules("测试垃圾内容", "story", level1_config)
        
        # 测试三级审核（严格）
        self.engine.current_level = AuditLevel.LEVEL3
        violations3 = self.engine.apply_level_rules("测试垃圾内容", "story", level3_config)
        
        # 三级审核应该检测到更多违规
        self.assertGreaterEqual(len(violations3), len(violations1))
    
    def test_decision_making(self):
        """测试决策逻辑"""
        from services.tiered_audit_service import AuditLevelConfig, ViolationResult
        
        config = AuditLevelConfig(
            level=AuditLevel.LEVEL2,
            config_name="测试",
            description="测试",
            rule_strictness=1.0,
            ai_threshold=0.5,
            manual_review_ratio=0.1,
            enabled_categories=['POL', 'POR'],
            disabled_rules=[],
            max_processing_time_ms=100
        )
        
        # 测试高危违规直接拒绝
        high_violations = [
            ViolationResult('POL-001', 'POL', '习近平', 'high', 0.9, 0)
        ]
        decision = self.engine.make_decision(0.8, high_violations, config)
        self.assertFalse(decision['passed'])
        self.assertEqual(decision['action'], 'reject')
        
        # 测试中等风险需要AI审核
        medium_violations = [
            ViolationResult('VIO-001', 'VIO', '暴力', 'medium', 0.7, 0)
        ]
        decision = self.engine.make_decision(0.6, medium_violations, config)
        self.assertFalse(decision['passed'])
        self.assertEqual(decision['action'], 'ai_review')
        
        # 测试低风险通过
        decision = self.engine.make_decision(0.2, [], config)
        self.assertTrue(decision['passed'])
        self.assertEqual(decision['action'], 'approve')
    
    def test_level_switching(self):
        """测试级别切换"""
        original_level = self.engine.current_level
        
        # 测试切换到三级
        self.engine.switch_level(AuditLevel.LEVEL3, "测试切换", "test_admin")
        self.assertEqual(self.engine.current_level, AuditLevel.LEVEL3)
        
        # 测试切换回原级别
        self.engine.switch_level(original_level, "测试回退", "test_admin")
        self.assertEqual(self.engine.current_level, original_level)


class TestRealTimeStatsMonitor(unittest.TestCase):
    """实时统计监控测试"""
    
    def setUp(self):
        """测试前准备"""
        self.mock_db_config = {
            'host': 'localhost',
            'user': 'test',
            'password': 'test',
            'database': 'test_db'
        }
        
        # Mock数据库连接
        self.mock_connection = Mock()
        self.mock_cursor = Mock()
        self.mock_connection.cursor.return_value = self.mock_cursor
        
        with patch('mysql.connector.connect', return_value=self.mock_connection):
            self.monitor = RealTimeStatsMonitor(self.mock_db_config)
    
    def test_stats_update(self):
        """测试统计更新"""
        from services.tiered_audit_service import ViolationResult
        
        # 模拟决策和违规
        decision = {'passed': False, 'requires_manual': True}
        violations = [
            ViolationResult('ADV-001', 'ADV', '微信号', 'medium', 0.8, 0)
        ]
        
        # 更新统计
        self.monitor.update_stats(decision, violations, '192.168.1.1')
        
        # 检查统计数据
        current_hour = self.monitor.get_current_hour()
        stats = self.monitor.current_hour_stats.get(current_hour, {})
        
        self.assertEqual(stats['total_submissions'], 1)
        self.assertEqual(stats['violation_count'], 1)
        self.assertEqual(stats['manual_review_count'], 1)
        self.assertIn('192.168.1.1', stats['ips'])
    
    def test_spam_pattern_detection(self):
        """测试垃圾内容模式检测"""
        from services.tiered_audit_service import ViolationResult
        
        # 广告类违规
        ad_violations = [
            ViolationResult('ADV-001', 'ADV', '微信号', 'medium', 0.8, 0)
        ]
        self.assertTrue(self.monitor.is_spam_pattern(ad_violations))
        
        # 其他类违规
        other_violations = [
            ViolationResult('POL-001', 'POL', '政治', 'high', 0.9, 0)
        ]
        self.assertFalse(self.monitor.is_spam_pattern(other_violations))
    
    def test_coordinated_attack_detection(self):
        """测试协同攻击检测"""
        # 模拟少数IP大量提交
        stats = {
            'ips': {'192.168.1.1', '192.168.1.2'},
            'total_submissions': 150
        }
        self.assertTrue(self.monitor.detect_coordinated_attack(stats))
        
        # 模拟正常情况
        stats = {
            'ips': {'192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4', '192.168.1.5', '192.168.1.6'},
            'total_submissions': 50
        }
        self.assertFalse(self.monitor.detect_coordinated_attack(stats))


class TestIntegration(unittest.TestCase):
    """集成测试"""
    
    def setUp(self):
        """测试前准备"""
        self.mock_db_config = {
            'host': 'localhost',
            'user': 'test',
            'password': 'test',
            'database': 'test_db'
        }
        
        # Mock数据库连接
        self.mock_connection = Mock()
        self.mock_cursor = Mock()
        self.mock_connection.cursor.return_value = self.mock_cursor
        self.mock_cursor.fetchall.return_value = []
        self.mock_cursor.fetchone.return_value = None
        
        with patch('mysql.connector.connect', return_value=self.mock_connection):
            self.engine = TieredAuditEngine(self.mock_db_config)
    
    def test_complete_audit_flow(self):
        """测试完整审核流程"""
        # 测试正常内容
        decision = self.engine.check_content_with_level(
            "这是一个正常的故事内容，没有任何违规信息。", 
            "story", 
            "192.168.1.1"
        )
        self.assertTrue(decision.passed)
        self.assertEqual(decision.action, 'approve')
        
        # 测试违规内容
        decision = self.engine.check_content_with_level(
            "习近平是国家主席，这是政治敏感内容。", 
            "story", 
            "192.168.1.2"
        )
        self.assertFalse(decision.passed)
        self.assertEqual(decision.action, 'reject')
        self.assertGreater(len(decision.violations), 0)
        
        # 测试需要AI审核的内容
        decision = self.engine.check_content_with_level(
            "这个内容包含一些垃圾信息，可能需要进一步审核。", 
            "story", 
            "192.168.1.3"
        )
        # 根据配置，可能通过或需要AI审核


class TestPerformance(unittest.TestCase):
    """性能测试"""
    
    def setUp(self):
        """测试前准备"""
        self.mock_db_config = {
            'host': 'localhost',
            'user': 'test',
            'password': 'test',
            'database': 'test_db'
        }
        
        # Mock数据库连接
        self.mock_connection = Mock()
        self.mock_cursor = Mock()
        self.mock_connection.cursor.return_value = self.mock_cursor
        self.mock_cursor.fetchall.return_value = []
        self.mock_cursor.fetchone.return_value = None
        
        with patch('mysql.connector.connect', return_value=self.mock_connection):
            self.engine = TieredAuditEngine(self.mock_db_config)
    
    def test_single_content_performance(self):
        """测试单个内容审核性能"""
        content = "这是一个测试内容，用于检测审核系统的性能表现。" * 10
        
        start_time = time.time()
        decision = self.engine.check_content_with_level(content, "story", "127.0.0.1")
        end_time = time.time()
        
        processing_time = (end_time - start_time) * 1000  # 转换为毫秒
        self.assertLess(processing_time, 100)  # 应该在100ms内完成
        print(f"单个内容审核耗时: {processing_time:.2f}ms")
    
    def test_batch_performance(self):
        """测试批量审核性能"""
        contents = [
            f"这是第{i}个测试内容，用于批量性能测试。" for i in range(100)
        ]
        
        start_time = time.time()
        for i, content in enumerate(contents):
            decision = self.engine.check_content_with_level(content, "story", f"192.168.1.{i%255}")
        end_time = time.time()
        
        total_time = end_time - start_time
        avg_time = (total_time / len(contents)) * 1000
        
        self.assertLess(avg_time, 50)  # 平均每个内容应该在50ms内完成
        print(f"批量审核100个内容总耗时: {total_time:.2f}s, 平均: {avg_time:.2f}ms")
    
    def test_concurrent_performance(self):
        """测试并发审核性能"""
        def audit_worker(content_id):
            content = f"并发测试内容 {content_id}"
            decision = self.engine.check_content_with_level(content, "story", f"192.168.1.{content_id%255}")
            return decision
        
        # 创建10个并发线程
        threads = []
        start_time = time.time()
        
        for i in range(10):
            thread = threading.Thread(target=audit_worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        self.assertLess(total_time, 2.0)  # 10个并发请求应该在2秒内完成
        print(f"10个并发审核耗时: {total_time:.2f}s")


def run_test_suite():
    """运行完整测试套件"""
    print("=" * 60)
    print("分级审核系统测试套件")
    print("=" * 60)
    
    # 创建测试套件
    suite = unittest.TestSuite()
    
    # 添加测试用例
    suite.addTest(unittest.makeSuite(TestTieredAuditEngine))
    suite.addTest(unittest.makeSuite(TestRealTimeStatsMonitor))
    suite.addTest(unittest.makeSuite(TestIntegration))
    suite.addTest(unittest.makeSuite(TestPerformance))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("测试结果汇总:")
    print(f"运行测试: {result.testsRun}")
    print(f"失败: {len(result.failures)}")
    print(f"错误: {len(result.errors)}")
    print(f"成功率: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print("=" * 60)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_test_suite()
    exit(0 if success else 1)
