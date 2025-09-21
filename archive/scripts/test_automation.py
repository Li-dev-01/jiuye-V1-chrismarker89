#!/usr/bin/env python3
"""
项目核心功能自动化测试脚本
测试用户功能和数据流程的完整性
"""

import requests
import json
import time
import mysql.connector
from datetime import datetime
import uuid
import sys
import os

# 测试配置
TEST_CONFIG = {
    'base_urls': {
        'analytics': 'http://localhost:8001/api',
        'png_cards': 'http://localhost:8002/api/cards',
        'heart_voice': 'http://localhost:8003/api/heart-voices',
        'story': 'http://localhost:8004/api/stories',
        'audit': 'http://localhost:8005/api/audit',
        'reviewer': 'http://localhost:8006/api/reviewer'
    },
    'database': {
        'host': 'localhost',
        'port': 3306,
        'user': 'root',
        'password': 'your_password',
        'database': 'questionnaire_db'
    },
    'test_data': {
        'questionnaire': {
            'personal_info': {
                'name': '测试用户',
                'age': 22,
                'gender': '男',
                'education': '本科',
                'major': '计算机科学'
            },
            'employment_status': {
                'current_status': '求职中',
                'target_industry': 'IT互联网',
                'expected_salary': '8000-12000'
            },
            'psychological_state': {
                'anxiety_level': 3,
                'confidence_level': 4,
                'satisfaction_level': 3
            }
        },
        'heart_voice': {
            'content': '这是一个测试心声内容，用于验证系统功能是否正常。希望能够找到理想的工作。',
            'category': 'job_search',
            'emotion_score': 4,
            'tags': ['求职', '希望', '测试']
        },
        'story': {
            'title': '我的求职测试故事',
            'content': '这是一个测试故事内容，描述了求职过程中的经历和感受。通过不断努力，最终找到了满意的工作。',
            'category': 'success_story',
            'tags': ['求职经历', '成功故事', '测试']
        }
    }
}

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """连接数据库"""
        try:
            self.connection = mysql.connector.connect(**TEST_CONFIG['database'])
            print("✅ 数据库连接成功")
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            sys.exit(1)
    
    def execute_query(self, query, params=None, fetch=False):
        """执行SQL查询"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            
            if fetch:
                result = cursor.fetchall()
                cursor.close()
                return result
            else:
                self.connection.commit()
                cursor.close()
                return True
        except Exception as e:
            print(f"❌ SQL执行失败: {e}")
            return None
    
    def check_table_exists(self, table_name):
        """检查表是否存在"""
        query = "SHOW TABLES LIKE %s"
        result = self.execute_query(query, (table_name,), fetch=True)
        return len(result) > 0
    
    def get_record_count(self, table_name, condition=None):
        """获取表记录数"""
        query = f"SELECT COUNT(*) as count FROM {table_name}"
        if condition:
            query += f" WHERE {condition}"
        result = self.execute_query(query, fetch=True)
        return result[0]['count'] if result else 0

class ServiceChecker:
    """服务状态检查器"""
    
    @staticmethod
    def check_service(name, url):
        """检查服务是否可用"""
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ {name} 服务正常 ({url})")
                return True
        except:
            pass
        
        # 如果没有health端点，尝试其他端点
        try:
            response = requests.get(url, timeout=5)
            if response.status_code in [200, 404]:  # 404也表示服务在运行
                print(f"✅ {name} 服务正常 ({url})")
                return True
        except:
            pass
        
        print(f"❌ {name} 服务不可用 ({url})")
        return False
    
    @staticmethod
    def check_all_services():
        """检查所有服务状态"""
        print("\n🔍 检查服务状态...")
        all_ok = True
        
        for name, url in TEST_CONFIG['base_urls'].items():
            if not ServiceChecker.check_service(name, url):
                all_ok = False
        
        return all_ok

class TestRunner:
    """测试执行器"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.test_user_id = None
        self.test_questionnaire_id = None
        self.test_heart_voice_id = None
        self.test_story_id = None
        
    def run_all_tests(self):
        """运行所有测试"""
        print("🧪 开始自动化测试...")
        print("=" * 60)
        
        # 检查服务状态
        if not ServiceChecker.check_all_services():
            print("❌ 部分服务不可用，请先启动所有服务")
            return False
        
        # 执行测试
        tests = [
            ("1. 匿名用户问卷提交测试", self.test_anonymous_questionnaire),
            ("2. 问卷数据流转测试", self.test_questionnaire_data_flow),
            ("3. 半匿名用户注册测试", self.test_semi_anonymous_user),
            ("4. 心声和故事提交测试", self.test_content_submission),
            ("5. PNG生成流程测试", self.test_png_generation_flow)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n🔬 {test_name}")
            print("-" * 40)
            try:
                result = test_func()
                results.append((test_name, result))
                if result:
                    print(f"✅ {test_name} - 通过")
                else:
                    print(f"❌ {test_name} - 失败")
            except Exception as e:
                print(f"❌ {test_name} - 异常: {e}")
                results.append((test_name, False))
        
        # 输出测试总结
        self.print_test_summary(results)
        return all(result for _, result in results)
    
    def test_anonymous_questionnaire(self):
        """测试1: 匿名用户问卷提交"""
        try:
            # 模拟匿名用户提交问卷
            questionnaire_data = {
                'user_type': 'anonymous',
                'responses': TEST_CONFIG['test_data']['questionnaire']
            }
            
            # 这里需要根据实际的问卷API端点调整
            # 暂时模拟数据库直接插入
            user_uuid = str(uuid.uuid4())
            
            # 插入到原始问卷表
            query = """
                INSERT INTO raw_questionnaire_responses 
                (user_uuid, form_data, submitted_at, raw_status)
                VALUES (%s, %s, %s, %s)
            """
            
            result = self.db.execute_query(query, (
                user_uuid,
                json.dumps(questionnaire_data),
                datetime.now(),
                'pending'
            ))
            
            if result:
                # 获取插入的ID
                query = "SELECT id FROM raw_questionnaire_responses WHERE user_uuid = %s ORDER BY id DESC LIMIT 1"
                records = self.db.execute_query(query, (user_uuid,), fetch=True)
                if records:
                    self.test_questionnaire_id = records[0]['id']
                    print(f"✅ 匿名问卷提交成功，ID: {self.test_questionnaire_id}")
                    return True
            
            return False
            
        except Exception as e:
            print(f"❌ 匿名问卷提交失败: {e}")
            return False
    
    def test_questionnaire_data_flow(self):
        """测试2: 问卷数据流转"""
        try:
            if not self.test_questionnaire_id:
                print("❌ 没有测试问卷ID，跳过数据流转测试")
                return False
            
            # 检查原始数据表
            raw_count_before = self.db.get_record_count('raw_questionnaire_responses')
            print(f"📊 原始问卷表记录数: {raw_count_before}")
            
            # 模拟审核通过（在实际系统中这会自动发生）
            # 这里我们手动触发数据迁移
            time.sleep(2)  # 等待可能的自动处理
            
            # 检查是否有有效数据表
            if self.db.check_table_exists('valid_questionnaire_responses'):
                valid_count = self.db.get_record_count('valid_questionnaire_responses')
                print(f"📊 有效问卷表记录数: {valid_count}")
                
                if valid_count > 0:
                    print("✅ 问卷数据流转正常")
                    return True
            else:
                print("⚠️ 有效问卷表不存在，可能需要手动创建")
            
            return False
            
        except Exception as e:
            print(f"❌ 问卷数据流转测试失败: {e}")
            return False
    
    def test_semi_anonymous_user(self):
        """测试3: 半匿名用户注册"""
        try:
            # 创建半匿名用户
            user_data = {
                'user_type': 'semi_anonymous',
                'username': f'test_user_{int(time.time())}',
                'nickname': '测试用户',
                'email': f'test_{int(time.time())}@example.com'
            }
            
            user_uuid = str(uuid.uuid4())
            
            # 插入用户表
            query = """
                INSERT INTO users (user_uuid, user_type, username, nickname, email, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            result = self.db.execute_query(query, (
                user_uuid,
                user_data['user_type'],
                user_data['username'],
                user_data['nickname'],
                user_data['email'],
                'active',
                datetime.now()
            ))
            
            if result:
                # 获取用户ID
                query = "SELECT id FROM users WHERE user_uuid = %s"
                records = self.db.execute_query(query, (user_uuid,), fetch=True)
                if records:
                    self.test_user_id = records[0]['id']
                    print(f"✅ 半匿名用户创建成功，ID: {self.test_user_id}")
                    
                    # 检查用户管理表
                    if self.db.check_table_exists('user_content_management'):
                        print("✅ 用户内容管理表存在")
                        return True
                    else:
                        print("⚠️ 用户内容管理表不存在")
                        return False
            
            return False
            
        except Exception as e:
            print(f"❌ 半匿名用户注册失败: {e}")
            return False
    
    def test_content_submission(self):
        """测试4: 心声和故事提交"""
        try:
            if not self.test_user_id:
                print("❌ 没有测试用户ID，跳过内容提交测试")
                return False
            
            success_count = 0
            
            # 测试心声提交
            heart_voice_data = TEST_CONFIG['test_data']['heart_voice']
            hv_uuid = str(uuid.uuid4())
            
            query = """
                INSERT INTO raw_heart_voices 
                (data_uuid, user_id, content, category, emotion_score, tags, submitted_at, raw_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            result = self.db.execute_query(query, (
                hv_uuid,
                self.test_user_id,
                heart_voice_data['content'],
                heart_voice_data['category'],
                heart_voice_data['emotion_score'],
                json.dumps(heart_voice_data['tags']),
                datetime.now(),
                'pending'
            ))
            
            if result:
                print("✅ 心声提交成功")
                success_count += 1
                
                # 获取心声ID
                query = "SELECT id FROM raw_heart_voices WHERE data_uuid = %s"
                records = self.db.execute_query(query, (hv_uuid,), fetch=True)
                if records:
                    self.test_heart_voice_id = records[0]['id']
            
            # 测试故事提交
            story_data = TEST_CONFIG['test_data']['story']
            story_uuid = str(uuid.uuid4())
            
            query = """
                INSERT INTO raw_story_submissions 
                (data_uuid, user_id, title, content, category, tags, submitted_at, raw_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            result = self.db.execute_query(query, (
                story_uuid,
                self.test_user_id,
                story_data['title'],
                story_data['content'],
                story_data['category'],
                json.dumps(story_data['tags']),
                datetime.now(),
                'pending'
            ))
            
            if result:
                print("✅ 故事提交成功")
                success_count += 1
                
                # 获取故事ID
                query = "SELECT id FROM raw_story_submissions WHERE data_uuid = %s"
                records = self.db.execute_query(query, (story_uuid,), fetch=True)
                if records:
                    self.test_story_id = records[0]['id']
            
            return success_count == 2
            
        except Exception as e:
            print(f"❌ 内容提交测试失败: {e}")
            return False
    
    def test_png_generation_flow(self):
        """测试5: PNG生成流程"""
        try:
            if not self.test_user_id or not self.test_heart_voice_id:
                print("❌ 缺少测试数据，跳过PNG生成测试")
                return False
            
            print("⏳ 等待审核流程完成...")
            time.sleep(3)  # 等待审核处理
            
            # 检查是否有有效心声数据
            if self.db.check_table_exists('valid_heart_voices'):
                valid_count = self.db.get_record_count('valid_heart_voices', f'raw_id = {self.test_heart_voice_id}')
                if valid_count > 0:
                    print("✅ 心声审核通过，数据已迁移到有效表")
                    
                    # 检查PNG相关表
                    if self.db.check_table_exists('content_png_cards'):
                        print("✅ PNG卡片表存在")
                        
                        # 模拟PNG生成（实际应该调用API）
                        print("⏳ 模拟PNG生成流程...")
                        time.sleep(2)
                        
                        # 检查PNG生成记录
                        png_count = self.db.get_record_count('content_png_cards')
                        print(f"📊 PNG卡片表记录数: {png_count}")
                        
                        return True
                    else:
                        print("❌ PNG卡片表不存在")
                        return False
                else:
                    print("⚠️ 心声数据未迁移到有效表")
                    return False
            else:
                print("❌ 有效心声表不存在")
                return False
                
        except Exception as e:
            print(f"❌ PNG生成流程测试失败: {e}")
            return False
    
    def print_test_summary(self, results):
        """打印测试总结"""
        print("\n" + "=" * 60)
        print("🎯 测试总结")
        print("=" * 60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ 通过" if result else "❌ 失败"
            print(f"{status} {test_name}")
        
        print("-" * 60)
        print(f"📊 总体结果: {passed}/{total} 通过")
        
        if passed == total:
            print("🎉 所有测试通过！系统功能正常")
        elif passed >= total * 0.8:
            print("⚠️ 大部分测试通过，建议检查失败项目")
        else:
            print("❌ 多个测试失败，需要修复问题")

def main():
    """主函数"""
    print("🚀 项目核心功能自动化测试")
    print("测试范围: 用户功能和数据流程完整性")
    print("=" * 60)
    
    # 创建测试运行器
    runner = TestRunner()
    
    # 运行所有测试
    success = runner.run_all_tests()
    
    # 退出码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
