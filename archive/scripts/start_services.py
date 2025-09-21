#!/usr/bin/env python3
"""
启动所有后端服务的脚本
确保测试环境准备就绪
"""

import subprocess
import time
import requests
import os
import signal
import sys
from threading import Thread

# 服务配置
SERVICES = [
    {
        'name': 'Analytics API',
        'script': 'backend/api/analytics_service.py',
        'port': 8001,
        'url': 'http://localhost:8001/api'
    },
    {
        'name': 'PNG Cards API',
        'script': 'backend/api/png_card_api.py',
        'port': 8002,
        'url': 'http://localhost:8002/api/cards'
    },
    {
        'name': 'Heart Voice API',
        'script': 'backend/api/heart_voice_api.py',
        'port': 8003,
        'url': 'http://localhost:8003/api/heart-voices'
    },
    {
        'name': 'Story API',
        'script': 'backend/api/story_api.py',
        'port': 8004,
        'url': 'http://localhost:8004/api/stories'
    },
    {
        'name': 'Audit API',
        'script': 'backend/api/audit_api.py',
        'port': 8005,
        'url': 'http://localhost:8005/api/audit'
    },
    {
        'name': 'Reviewer API',
        'script': 'backend/api/reviewer_api.py',
        'port': 8006,
        'url': 'http://localhost:8006/api/reviewer'
    },
    {
        'name': 'Admin API',
        'script': 'backend/api/admin_api.py',
        'port': 8007,
        'url': 'http://localhost:8007/api/admin'
    }
]

class ServiceManager:
    """服务管理器"""
    
    def __init__(self):
        self.processes = {}
        self.running = True
        
        # 注册信号处理器
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        """信号处理器"""
        print("\n🛑 收到停止信号，正在关闭所有服务...")
        self.stop_all_services()
        sys.exit(0)
    
    def check_port(self, port):
        """检查端口是否被占用"""
        try:
            response = requests.get(f'http://localhost:{port}', timeout=1)
            return True
        except:
            return False
    
    def start_service(self, service):
        """启动单个服务"""
        script_path = service['script']
        
        if not os.path.exists(script_path):
            print(f"❌ 服务脚本不存在: {script_path}")
            return None
        
        # 检查端口是否已被占用
        if self.check_port(service['port']):
            print(f"⚠️ {service['name']} 端口 {service['port']} 已被占用")
            return None
        
        try:
            # 启动服务
            process = subprocess.Popen(
                ['python3', script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )
            
            print(f"🚀 启动 {service['name']} (PID: {process.pid}, 端口: {service['port']})")
            return process
            
        except Exception as e:
            print(f"❌ 启动 {service['name']} 失败: {e}")
            return None
    
    def wait_for_service(self, service, timeout=30):
        """等待服务启动完成"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(service['url'], timeout=2)
                if response.status_code in [200, 404]:  # 404也表示服务在运行
                    print(f"✅ {service['name']} 启动成功")
                    return True
            except:
                pass
            
            time.sleep(1)
        
        print(f"❌ {service['name']} 启动超时")
        return False
    
    def start_all_services(self):
        """启动所有服务"""
        print("🚀 启动所有后端服务...")
        print("=" * 50)
        
        for service in SERVICES:
            process = self.start_service(service)
            if process:
                self.processes[service['name']] = process
                
                # 等待服务启动
                if self.wait_for_service(service):
                    print(f"✅ {service['name']} 就绪")
                else:
                    print(f"❌ {service['name']} 启动失败")
                    # 终止失败的进程
                    process.terminate()
                    del self.processes[service['name']]
            
            time.sleep(2)  # 间隔启动避免端口冲突
        
        print("\n" + "=" * 50)
        print(f"📊 服务启动完成: {len(self.processes)}/{len(SERVICES)} 个服务运行中")
        
        if len(self.processes) == len(SERVICES):
            print("🎉 所有服务启动成功！")
            return True
        else:
            print("⚠️ 部分服务启动失败")
            return False
    
    def stop_all_services(self):
        """停止所有服务"""
        print("\n🛑 停止所有服务...")
        
        for name, process in self.processes.items():
            try:
                print(f"🛑 停止 {name} (PID: {process.pid})")
                process.terminate()
                
                # 等待进程结束
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    print(f"⚠️ {name} 未响应，强制终止")
                    process.kill()
                    
            except Exception as e:
                print(f"❌ 停止 {name} 失败: {e}")
        
        self.processes.clear()
        print("✅ 所有服务已停止")
    
    def monitor_services(self):
        """监控服务状态"""
        print("\n👀 监控服务状态 (按 Ctrl+C 停止)")
        print("-" * 50)
        
        try:
            while self.running:
                alive_count = 0
                
                for name, process in list(self.processes.items()):
                    if process.poll() is None:  # 进程仍在运行
                        alive_count += 1
                    else:
                        print(f"❌ {name} 已停止 (退出码: {process.returncode})")
                        del self.processes[name]
                
                if alive_count == 0:
                    print("❌ 所有服务都已停止")
                    break
                
                print(f"📊 {alive_count}/{len(SERVICES)} 个服务运行中", end='\r')
                time.sleep(5)
                
        except KeyboardInterrupt:
            pass
    
    def check_services_status(self):
        """检查服务状态"""
        print("\n🔍 检查服务状态...")
        print("-" * 50)
        
        for service in SERVICES:
            try:
                response = requests.get(service['url'], timeout=3)
                if response.status_code in [200, 404]:
                    print(f"✅ {service['name']} - 正常运行")
                else:
                    print(f"⚠️ {service['name']} - 状态异常 ({response.status_code})")
            except requests.exceptions.ConnectionError:
                print(f"❌ {service['name']} - 连接失败")
            except Exception as e:
                print(f"❌ {service['name']} - 检查失败: {e}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='服务管理脚本')
    parser.add_argument('action', choices=['start', 'stop', 'status', 'monitor'], 
                       help='操作类型')
    
    args = parser.parse_args()
    
    manager = ServiceManager()
    
    if args.action == 'start':
        print("🚀 启动服务模式")
        if manager.start_all_services():
            print("\n✅ 服务启动完成，可以运行测试脚本")
            print("💡 运行 'python3 test_automation.py' 开始自动化测试")
            print("💡 按 Ctrl+C 停止所有服务")
            manager.monitor_services()
        else:
            print("\n❌ 服务启动失败")
            manager.stop_all_services()
    
    elif args.action == 'stop':
        print("🛑 停止服务模式")
        manager.stop_all_services()
    
    elif args.action == 'status':
        print("🔍 检查服务状态")
        manager.check_services_status()
    
    elif args.action == 'monitor':
        print("👀 监控服务状态")
        manager.monitor_services()

if __name__ == "__main__":
    main()
