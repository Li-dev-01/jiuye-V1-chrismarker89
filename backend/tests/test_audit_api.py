"""
分级审核API测试脚本
测试所有API端点的功能和性能
"""

import requests
import json
import time
import threading
from concurrent.futures import ThreadPoolExecutor
import random

class AuditAPITester:
    def __init__(self, base_url="http://localhost:5001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_result(self, test_name, success, message, duration=None):
        """记录测试结果"""
        result = {
            'test_name': test_name,
            'success': success,
            'message': message,
            'duration': duration,
            'timestamp': time.time()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        duration_str = f" ({duration:.2f}ms)" if duration else ""
        print(f"{status} {test_name}{duration_str}: {message}")
    
    def test_api_health(self):
        """测试API健康状态"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/audit/level")
            duration = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("API健康检查", True, "API服务正常", duration)
                    return True
                else:
                    self.log_result("API健康检查", False, f"API返回错误: {data.get('error', 'Unknown')}", duration)
            else:
                self.log_result("API健康检查", False, f"HTTP状态码: {response.status_code}", duration)
        except Exception as e:
            self.log_result("API健康检查", False, f"连接失败: {str(e)}")
        
        return False
    
    def test_get_audit_level(self):
        """测试获取审核级别"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/audit/level")
            duration = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'current_level' in data.get('data', {}):
                    level = data['data']['current_level']
                    self.log_result("获取审核级别", True, f"当前级别: {level}", duration)
                    return level
                else:
                    self.log_result("获取审核级别", False, "响应数据格式错误", duration)
            else:
                self.log_result("获取审核级别", False, f"HTTP状态码: {response.status_code}", duration)
        except Exception as e:
            self.log_result("获取审核级别", False, f"请求失败: {str(e)}")
        
        return None
    
    def test_switch_audit_level(self, target_level):
        """测试切换审核级别"""
        try:
            start_time = time.time()
            payload = {
                'level': target_level,
                'admin_id': 'test_admin'
            }
            response = self.session.post(
                f"{self.base_url}/api/audit/level",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            duration = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("切换审核级别", True, f"成功切换到 {target_level}", duration)
                    return True
                else:
                    self.log_result("切换审核级别", False, f"切换失败: {data.get('error', 'Unknown')}", duration)
            else:
                self.log_result("切换审核级别", False, f"HTTP状态码: {response.status_code}", duration)
        except Exception as e:
            self.log_result("切换审核级别", False, f"请求失败: {str(e)}")
        
        return False
    
    def test_get_audit_stats(self):
        """测试获取审核统计"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/audit/stats")
            duration = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'current_hour_stats' in data.get('data', {}):
                    stats = data['data']['current_hour_stats']
                    self.log_result("获取审核统计", True, f"统计数据: {stats}", duration)
                    return stats
                else:
                    self.log_result("获取审核统计", False, "响应数据格式错误", duration)
            else:
                self.log_result("获取审核统计", False, f"HTTP状态码: {response.status_code}", duration)
        except Exception as e:
            self.log_result("获取审核统计", False, f"请求失败: {str(e)}")
        
        return None
    
    def test_audit_content(self, content, content_type="story"):
        """测试内容审核"""
        try:
            start_time = time.time()
            payload = {
                'content': content,
                'content_type': content_type
            }
            response = self.session.post(
                f"{self.base_url}/api/audit/test",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            duration = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    result = data['data']
                    action = result.get('action', 'unknown')
                    risk_score = result.get('risk_score', 0)
                    self.log_result("内容审核测试", True, f"动作: {action}, 风险分数: {risk_score:.2f}", duration)
                    return result
                else:
                    self.log_result("内容审核测试", False, f"审核失败: {data.get('error', 'Unknown')}", duration)
            else:
                self.log_result("内容审核测试", False, f"HTTP状态码: {response.status_code}", duration)
        except Exception as e:
            self.log_result("内容审核测试", False, f"请求失败: {str(e)}")
        
        return None
    
    def test_get_audit_history(self):
        """测试获取审核历史"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/audit/history")
            duration = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    history = data.get('data', [])
                    self.log_result("获取审核历史", True, f"历史记录数: {len(history)}", duration)
                    return history
                else:
                    self.log_result("获取审核历史", False, f"获取失败: {data.get('error', 'Unknown')}", duration)
            else:
                self.log_result("获取审核历史", False, f"HTTP状态码: {response.status_code}", duration)
        except Exception as e:
            self.log_result("获取审核历史", False, f"请求失败: {str(e)}")
        
        return None
    
    def test_content_samples(self):
        """测试各种内容样本"""
        test_cases = [
            {
                'name': '正常内容',
                'content': '这是一个正常的故事，讲述了一个人的成长经历。',
                'expected_action': 'approve'
            },
            {
                'name': '政治敏感内容',
                'content': '习近平是国家主席，这是政治敏感内容。',
                'expected_action': 'reject'
            },
            {
                'name': '色情内容',
                'content': '这里有一些色情和淫秽的内容描述。',
                'expected_action': 'reject'
            },
            {
                'name': '暴力内容',
                'content': '故事中描述了血腥的杀人场面。',
                'expected_action': 'ai_review'
            },
            {
                'name': '广告内容',
                'content': '加我微信号123456，有好东西分享。',
                'expected_action': 'flag'
            },
            {
                'name': '隐私信息',
                'content': '我的身份证号是123456789012345678。',
                'expected_action': 'reject'
            },
            {
                'name': '辱骂内容',
                'content': '你这个垃圾，真是个傻逼。',
                'expected_action': 'ai_review'
            }
        ]
        
        for case in test_cases:
            result = self.test_audit_content(case['content'])
            if result:
                actual_action = result.get('action')
                if actual_action == case['expected_action']:
                    self.log_result(f"内容测试-{case['name']}", True, f"预期动作匹配: {actual_action}")
                else:
                    self.log_result(f"内容测试-{case['name']}", False, f"预期: {case['expected_action']}, 实际: {actual_action}")
    
    def test_level_switching_flow(self):
        """测试级别切换流程"""
        # 获取当前级别
        original_level = self.test_get_audit_level()
        if not original_level:
            self.log_result("级别切换流程", False, "无法获取当前级别")
            return
        
        # 测试切换到不同级别
        levels = ['level1', 'level2', 'level3']
        for level in levels:
            if level != original_level:
                if self.test_switch_audit_level(level):
                    # 验证切换成功
                    current_level = self.test_get_audit_level()
                    if current_level == level:
                        self.log_result(f"级别切换验证-{level}", True, "切换成功并验证")
                    else:
                        self.log_result(f"级别切换验证-{level}", False, "切换后级别不匹配")
                
                # 短暂等待
                time.sleep(1)
        
        # 恢复原始级别
        if original_level != self.test_get_audit_level():
            self.test_switch_audit_level(original_level)
    
    def test_performance_batch(self, batch_size=50):
        """测试批量性能"""
        contents = [
            f"这是第{i}个测试内容，用于性能测试。内容包含一些随机文字以模拟真实场景。" 
            for i in range(batch_size)
        ]
        
        start_time = time.time()
        success_count = 0
        
        for i, content in enumerate(contents):
            result = self.test_audit_content(content)
            if result:
                success_count += 1
        
        total_time = time.time() - start_time
        avg_time = (total_time / batch_size) * 1000
        
        self.log_result(
            "批量性能测试", 
            success_count == batch_size,
            f"处理{batch_size}个内容，成功{success_count}个，总耗时{total_time:.2f}s，平均{avg_time:.2f}ms"
        )
    
    def test_concurrent_requests(self, concurrent_count=10):
        """测试并发请求"""
        def make_request(request_id):
            content = f"并发测试内容 {request_id}"
            start_time = time.time()
            result = self.test_audit_content(content)
            duration = (time.time() - start_time) * 1000
            return result is not None, duration
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=concurrent_count) as executor:
            futures = [executor.submit(make_request, i) for i in range(concurrent_count)]
            results = [future.result() for future in futures]
        
        total_time = time.time() - start_time
        success_count = sum(1 for success, _ in results if success)
        avg_duration = sum(duration for _, duration in results) / len(results)
        
        self.log_result(
            "并发请求测试",
            success_count == concurrent_count,
            f"{concurrent_count}个并发请求，成功{success_count}个，总耗时{total_time:.2f}s，平均响应{avg_duration:.2f}ms"
        )
    
    def run_full_test_suite(self):
        """运行完整测试套件"""
        print("=" * 80)
        print("分级审核API测试套件")
        print("=" * 80)
        
        # 基础功能测试
        print("\n🔍 基础功能测试")
        print("-" * 40)
        if not self.test_api_health():
            print("❌ API服务不可用，终止测试")
            return False
        
        self.test_get_audit_level()
        self.test_get_audit_stats()
        self.test_get_audit_history()
        
        # 内容审核测试
        print("\n📝 内容审核测试")
        print("-" * 40)
        self.test_content_samples()
        
        # 级别切换测试
        print("\n🔄 级别切换测试")
        print("-" * 40)
        self.test_level_switching_flow()
        
        # 性能测试
        print("\n⚡ 性能测试")
        print("-" * 40)
        self.test_performance_batch(20)
        self.test_concurrent_requests(5)
        
        # 输出测试结果汇总
        self.print_test_summary()
        
        return True
    
    def print_test_summary(self):
        """打印测试结果汇总"""
        print("\n" + "=" * 80)
        print("测试结果汇总")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests}")
        print(f"失败: {failed_tests}")
        print(f"成功率: {(passed_tests / total_tests * 100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ 失败的测试:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test_name']}: {result['message']}")
        
        # 性能统计
        durations = [r['duration'] for r in self.test_results if r['duration'] is not None]
        if durations:
            avg_duration = sum(durations) / len(durations)
            max_duration = max(durations)
            min_duration = min(durations)
            
            print(f"\n⚡ 性能统计:")
            print(f"  平均响应时间: {avg_duration:.2f}ms")
            print(f"  最大响应时间: {max_duration:.2f}ms")
            print(f"  最小响应时间: {min_duration:.2f}ms")
        
        print("=" * 80)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='分级审核API测试工具')
    parser.add_argument('--url', default='http://localhost:5001', help='API服务地址')
    parser.add_argument('--quick', action='store_true', help='快速测试模式')
    
    args = parser.parse_args()
    
    tester = AuditAPITester(args.url)
    
    if args.quick:
        # 快速测试模式
        print("🚀 快速测试模式")
        tester.test_api_health()
        tester.test_get_audit_level()
        tester.test_audit_content("这是一个测试内容")
    else:
        # 完整测试套件
        tester.run_full_test_suite()


if __name__ == '__main__':
    main()
