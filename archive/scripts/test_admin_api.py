#!/usr/bin/env python3
"""
测试管理员API是否可以启动
"""

import os
import sys

def test_admin_api():
    """测试管理员API启动"""
    try:
        print("🔧 测试管理员API...")
        
        # 检查文件是否存在
        admin_api_path = 'backend/api/admin_api.py'
        if not os.path.exists(admin_api_path):
            print(f"❌ 找不到管理员API文件: {admin_api_path}")
            return False
        
        print(f"✅ 找到管理员API文件: {admin_api_path}")
        
        # 尝试导入模块
        sys.path.insert(0, 'backend/api')
        
        try:
            import admin_api
            print("✅ 管理员API模块导入成功")
        except Exception as e:
            print(f"❌ 管理员API模块导入失败: {e}")
            return False
        
        print("🌐 尝试启动管理员API服务...")
        
        # 直接运行管理员API
        os.system('python3 backend/api/admin_api.py')
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False
    
    return True

if __name__ == '__main__':
    test_admin_api()
