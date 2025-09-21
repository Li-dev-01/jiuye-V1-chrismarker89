#!/usr/bin/env python3
"""
启动管理员API服务的简单脚本
"""

import subprocess
import sys
import os

def start_admin_api():
    """启动管理员API服务"""
    try:
        print("🔧 启动管理员API服务...")
        
        # 确保在正确的目录
        script_dir = os.path.dirname(os.path.abspath(__file__))
        admin_api_path = os.path.join(script_dir, 'backend', 'api', 'admin_api.py')
        
        if not os.path.exists(admin_api_path):
            print(f"❌ 找不到管理员API文件: {admin_api_path}")
            return False
        
        # 启动管理员API
        process = subprocess.Popen([
            sys.executable, admin_api_path
        ], cwd=script_dir)
        
        print(f"✅ 管理员API服务已启动，进程ID: {process.pid}")
        print("🌐 服务地址: http://localhost:8007")
        
        # 等待进程
        process.wait()
        
    except KeyboardInterrupt:
        print("\n🛑 收到停止信号，正在关闭管理员API服务...")
        if 'process' in locals():
            process.terminate()
    except Exception as e:
        print(f"❌ 启动管理员API失败: {e}")
        return False
    
    return True

if __name__ == '__main__':
    start_admin_api()
