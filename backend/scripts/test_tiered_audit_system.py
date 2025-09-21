#!/usr/bin/env python3
"""
分级审核系统综合测试脚本
包含数据库迁移、单元测试、API测试等完整流程
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

class TieredAuditSystemTester:
    def __init__(self):
        self.project_root = project_root
        self.api_url = "http://localhost:5001"
        self.test_results = {
            'migration': False,
            'unit_tests': False,
            'api_tests': False,
            'integration_tests': False
        }
    
    def log(self, message, level="INFO"):
        """日志输出"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def run_command(self, command, cwd=None, timeout=300):
        """执行命令"""
        try:
            self.log(f"执行命令: {command}")
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd or self.project_root,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            if result.returncode == 0:
                self.log("命令执行成功")
                return True, result.stdout
            else:
                self.log(f"命令执行失败: {result.stderr}", "ERROR")
                return False, result.stderr
        
        except subprocess.TimeoutExpired:
            self.log(f"命令执行超时 ({timeout}s)", "ERROR")
            return False, "Timeout"
        except Exception as e:
            self.log(f"命令执行异常: {e}", "ERROR")
            return False, str(e)
    
    def check_dependencies(self):
        """检查依赖"""
        self.log("检查系统依赖...")
        
        # 检查Python版本
        python_version = sys.version_info
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 7):
            self.log("需要Python 3.7或更高版本", "ERROR")
            return False
        
        # 检查必要的Python包
        required_packages = ['mysql-connector-python', 'requests', 'flask', 'flask-cors']
        missing_packages = []
        
        for package in required_packages:
            try:
                __import__(package.replace('-', '_'))
            except ImportError:
                missing_packages.append(package)
        
        if missing_packages:
            self.log(f"缺少Python包: {', '.join(missing_packages)}", "ERROR")
            self.log("请运行: pip install " + " ".join(missing_packages))
            return False
        
        self.log("依赖检查通过")
        return True
    
    def test_database_migration(self):
        """测试数据库迁移"""
        self.log("开始数据库迁移测试...")
        
        migration_script = self.project_root / "scripts" / "migrate_tiered_audit.py"
        if not migration_script.exists():
            self.log("迁移脚本不存在", "ERROR")
            return False
        
        # 执行迁移
        success, output = self.run_command(f"python {migration_script} --force")
        if not success:
            self.log("数据库迁移失败", "ERROR")
            return False
        
        # 验证迁移
        success, output = self.run_command(f"python {migration_script} --verify-only")
        if success:
            self.log("数据库迁移验证通过")
            self.test_results['migration'] = True
            return True
        else:
            self.log("数据库迁移验证失败", "ERROR")
            return False
    
    def test_unit_tests(self):
        """运行单元测试"""
        self.log("开始单元测试...")
        
        test_script = self.project_root / "tests" / "test_tiered_audit.py"
        if not test_script.exists():
            self.log("单元测试脚本不存在", "ERROR")
            return False
        
        success, output = self.run_command(f"python {test_script}")
        if success:
            self.log("单元测试通过")
            self.test_results['unit_tests'] = True
            return True
        else:
            self.log("单元测试失败", "ERROR")
            self.log(output, "ERROR")
            return False
    
    def start_api_server(self):
        """启动API服务器"""
        self.log("启动API服务器...")
        
        api_script = self.project_root / "api" / "audit_api.py"
        if not api_script.exists():
            self.log("API脚本不存在", "ERROR")
            return None
        
        # 启动服务器进程
        try:
            process = subprocess.Popen(
                [sys.executable, str(api_script)],
                cwd=self.project_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # 等待服务器启动
            for i in range(30):  # 最多等待30秒
                try:
                    response = requests.get(f"{self.api_url}/api/audit/level", timeout=2)
                    if response.status_code in [200, 503]:  # 200正常，503服务未启用但API可达
                        self.log("API服务器启动成功")
                        return process
                except requests.exceptions.RequestException:
                    pass
                
                time.sleep(1)
            
            self.log("API服务器启动超时", "ERROR")
            process.terminate()
            return None
            
        except Exception as e:
            self.log(f"启动API服务器失败: {e}", "ERROR")
            return None
    
    def test_api_endpoints(self):
        """测试API端点"""
        self.log("开始API测试...")
        
        test_script = self.project_root / "tests" / "test_audit_api.py"
        if not test_script.exists():
            self.log("API测试脚本不存在", "ERROR")
            return False
        
        success, output = self.run_command(f"python {test_script} --url {self.api_url} --quick")
        if success:
            self.log("API测试通过")
            self.test_results['api_tests'] = True
            return True
        else:
            self.log("API测试失败", "ERROR")
            return False
    
    def test_integration_scenarios(self):
        """集成测试场景"""
        self.log("开始集成测试...")
        
        try:
            # 测试场景1: 级别切换流程
            self.log("测试场景1: 级别切换流程")
            
            # 获取当前级别
            response = requests.get(f"{self.api_url}/api/audit/level", timeout=10)
            if response.status_code != 200:
                self.log("无法获取当前审核级别", "ERROR")
                return False
            
            current_level = response.json().get('data', {}).get('current_level', 'level1')
            self.log(f"当前级别: {current_level}")
            
            # 切换到不同级别
            target_levels = ['level1', 'level2', 'level3']
            for level in target_levels:
                if level != current_level:
                    response = requests.post(
                        f"{self.api_url}/api/audit/level",
                        json={'level': level, 'admin_id': 'test_admin'},
                        timeout=10
                    )
                    if response.status_code == 200:
                        self.log(f"成功切换到 {level}")
                    else:
                        self.log(f"切换到 {level} 失败", "ERROR")
                        return False
                    
                    time.sleep(1)  # 短暂等待
            
            # 测试场景2: 内容审核
            self.log("测试场景2: 内容审核")
            
            test_contents = [
                "这是一个正常的测试内容",
                "习近平是国家主席",  # 政治敏感
                "这里有色情内容描述",  # 色情内容
                "加我微信号123456"    # 广告内容
            ]
            
            for content in test_contents:
                response = requests.post(
                    f"{self.api_url}/api/audit/test",
                    json={'content': content, 'content_type': 'story'},
                    timeout=10
                )
                if response.status_code == 200:
                    result = response.json().get('data', {})
                    action = result.get('action', 'unknown')
                    self.log(f"内容审核: {action} - {content[:20]}...")
                else:
                    self.log(f"内容审核失败: {content[:20]}...", "ERROR")
                    return False
            
            # 测试场景3: 统计信息
            self.log("测试场景3: 统计信息")
            
            response = requests.get(f"{self.api_url}/api/audit/stats", timeout=10)
            if response.status_code == 200:
                stats = response.json().get('data', {})
                self.log(f"统计信息获取成功: {stats.get('current_level', 'unknown')}")
            else:
                self.log("获取统计信息失败", "ERROR")
                return False
            
            self.log("集成测试通过")
            self.test_results['integration_tests'] = True
            return True
            
        except Exception as e:
            self.log(f"集成测试异常: {e}", "ERROR")
            return False
    
    def run_full_test_suite(self):
        """运行完整测试套件"""
        print("=" * 80)
        print("分级审核系统综合测试套件")
        print("=" * 80)
        
        start_time = time.time()
        
        # 1. 检查依赖
        if not self.check_dependencies():
            self.log("依赖检查失败，终止测试", "ERROR")
            return False
        
        # 2. 数据库迁移测试
        if not self.test_database_migration():
            self.log("数据库迁移测试失败", "ERROR")
            return False
        
        # 3. 单元测试
        if not self.test_unit_tests():
            self.log("单元测试失败", "ERROR")
            return False
        
        # 4. 启动API服务器
        api_process = self.start_api_server()
        if not api_process:
            self.log("无法启动API服务器", "ERROR")
            return False
        
        try:
            # 5. API测试
            if not self.test_api_endpoints():
                self.log("API测试失败", "ERROR")
                return False
            
            # 6. 集成测试
            if not self.test_integration_scenarios():
                self.log("集成测试失败", "ERROR")
                return False
            
        finally:
            # 关闭API服务器
            if api_process:
                self.log("关闭API服务器...")
                api_process.terminate()
                api_process.wait(timeout=10)
        
        # 输出测试结果
        self.print_test_summary(time.time() - start_time)
        
        return all(self.test_results.values())
    
    def print_test_summary(self, total_time):
        """打印测试结果汇总"""
        print("\n" + "=" * 80)
        print("测试结果汇总")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.test_results.values() if result)
        total_tests = len(self.test_results)
        
        print(f"总测试模块: {total_tests}")
        print(f"通过模块: {passed_tests}")
        print(f"失败模块: {total_tests - passed_tests}")
        print(f"成功率: {(passed_tests / total_tests * 100):.1f}%")
        print(f"总耗时: {total_time:.1f}秒")
        
        print(f"\n详细结果:")
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} {test_name}")
        
        if all(self.test_results.values()):
            print(f"\n🎉 所有测试通过！分级审核系统已准备就绪。")
        else:
            print(f"\n⚠️  部分测试失败，请检查错误信息并修复问题。")
        
        print("=" * 80)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='分级审核系统综合测试工具')
    parser.add_argument('--quick', action='store_true', help='快速测试模式（跳过部分测试）')
    parser.add_argument('--migration-only', action='store_true', help='仅执行数据库迁移测试')
    parser.add_argument('--unit-only', action='store_true', help='仅执行单元测试')
    parser.add_argument('--api-only', action='store_true', help='仅执行API测试')
    
    args = parser.parse_args()
    
    tester = TieredAuditSystemTester()
    
    if args.migration_only:
        success = tester.test_database_migration()
    elif args.unit_only:
        success = tester.test_unit_tests()
    elif args.api_only:
        # 启动API服务器并测试
        api_process = tester.start_api_server()
        if api_process:
            try:
                success = tester.test_api_endpoints()
            finally:
                api_process.terminate()
        else:
            success = False
    else:
        # 完整测试套件
        success = tester.run_full_test_suite()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
