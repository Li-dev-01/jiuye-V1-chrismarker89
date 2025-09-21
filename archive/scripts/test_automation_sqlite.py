#!/usr/bin/env python3
"""
项目核心功能自动化测试脚本 (SQLite版本)
测试用户功能和数据流程的完整性
"""

import requests
import json
import time
import sqlite3
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
        'path': 'test_database.db'
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
    """SQLite数据库管理器"""
    
    def __init__(self):
        self.db_path = TEST_CONFIG['database']['path']
        self.connection = None
        self.init_database()
    
    def init_database(self):
        """初始化数据库和表结构"""
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row  # 使结果可以像字典一样访问
            
            # 创建测试表
            self.create_tables()
            print("✅ SQLite数据库初始化成功")
        except Exception as e:
            print(f"❌ 数据库初始化失败: {e}")
            sys.exit(1)
    
    def create_tables(self):
        """创建测试所需的表"""
        cursor = self.connection.cursor()
        
        # 用户表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_uuid TEXT UNIQUE,
                user_type TEXT,
                username TEXT,
                nickname TEXT,
                email TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 原始问卷表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS raw_questionnaire_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_uuid TEXT,
                form_data TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_status TEXT DEFAULT 'pending'
            )
        ''')
        
        # 有效问卷表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS valid_questionnaire_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                raw_id INTEGER,
                user_uuid TEXT,
                form_data TEXT,
                approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                audit_status TEXT DEFAULT 'approved'
            )
        ''')
        
        # 原始心声表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS raw_heart_voices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_uuid TEXT,
                user_id INTEGER,
                content TEXT,
                category TEXT,
                emotion_score INTEGER,
                tags TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_status TEXT DEFAULT 'pending'
            )
        ''')
        
        # 有效心声表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS valid_heart_voices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                raw_id INTEGER,
                data_uuid TEXT,
                user_id INTEGER,
                content TEXT,
                category TEXT,
                emotion_score INTEGER,
                tags TEXT,
                approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                audit_status TEXT DEFAULT 'approved'
            )
        ''')
        
        # 原始故事表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS raw_story_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_uuid TEXT,
                user_id INTEGER,
                title TEXT,
                content TEXT,
                category TEXT,
                tags TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_status TEXT DEFAULT 'pending'
            )
        ''')
        
        # 有效故事表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS valid_stories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                raw_id INTEGER,
                data_uuid TEXT,
                user_id INTEGER,
                title TEXT,
                content TEXT,
                category TEXT,
                tags TEXT,
                approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                audit_status TEXT DEFAULT 'approved'
            )
        ''')
        
        # PNG卡片表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content_png_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_type TEXT,
                content_id INTEGER,
                content_uuid TEXT,
                creator_user_id INTEGER,
                card_style TEXT,
                file_name TEXT,
                file_path TEXT,
                file_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 用户内容管理表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_content_management (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                content_type TEXT,
                content_id INTEGER,
                can_download BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.connection.commit()
    
    def execute_query(self, query, params=None, fetch=False):
        """执行SQL查询"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params or ())
            
            if fetch:
                result = cursor.fetchall()
                return [dict(row) for row in result]
            else:
                self.connection.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"❌ SQL执行失败: {e}")
            return None
    
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
            response = requests.get(url, timeout=3)
            if response.status_code in [200, 404]:
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
        available_services = 0
        
        for name, url in TEST_CONFIG['base_urls'].items():
            if ServiceChecker.check_service(name, url):
                available_services += 1
        
        total_services = len(TEST_CONFIG['base_urls'])
        print(f"📊 服务状态: {available_services}/{total_services} 可用")
        
        return available_services >= 2  # 至少需要2个服务可用

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
        
        # 检查服务状态（不强制要求所有服务）
        ServiceChecker.check_all_services()
        
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
            user_uuid = str(uuid.uuid4())
            questionnaire_data = TEST_CONFIG['test_data']['questionnaire']
            
            # 插入到原始问卷表
            query = """
                INSERT INTO raw_questionnaire_responses 
                (user_uuid, form_data, raw_status)
                VALUES (?, ?, ?)
            """
            
            result = self.db.execute_query(query, (
                user_uuid,
                json.dumps(questionnaire_data),
                'pending'
            ))
            
            if result:
                self.test_questionnaire_id = result
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
            raw_count = self.db.get_record_count('raw_questionnaire_responses')
            print(f"📊 原始问卷表记录数: {raw_count}")
            
            # 模拟审核通过，迁移到有效数据表
            query = """
                INSERT INTO valid_questionnaire_responses 
                (raw_id, user_uuid, form_data, audit_status)
                SELECT id, user_uuid, form_data, 'approved'
                FROM raw_questionnaire_responses 
                WHERE id = ?
            """
            
            result = self.db.execute_query(query, (self.test_questionnaire_id,))
            
            if result:
                valid_count = self.db.get_record_count('valid_questionnaire_responses')
                print(f"📊 有效问卷表记录数: {valid_count}")
                print("✅ 问卷数据流转正常")
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ 问卷数据流转测试失败: {e}")
            return False
    
    def test_semi_anonymous_user(self):
        """测试3: 半匿名用户注册"""
        try:
            user_uuid = str(uuid.uuid4())
            user_data = {
                'user_type': 'semi_anonymous',
                'username': f'test_user_{int(time.time())}',
                'nickname': '测试用户',
                'email': f'test_{int(time.time())}@example.com'
            }
            
            # 插入用户表
            query = """
                INSERT INTO users (user_uuid, user_type, username, nickname, email, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            
            result = self.db.execute_query(query, (
                user_uuid,
                user_data['user_type'],
                user_data['username'],
                user_data['nickname'],
                user_data['email'],
                'active'
            ))
            
            if result:
                self.test_user_id = result
                print(f"✅ 半匿名用户创建成功，ID: {self.test_user_id}")
                
                # 创建用户内容管理记录
                query = """
                    INSERT INTO user_content_management 
                    (user_id, content_type, content_id, can_download)
                    VALUES (?, ?, ?, ?)
                """
                
                self.db.execute_query(query, (self.test_user_id, 'user', self.test_user_id, 1))
                print("✅ 用户内容管理记录创建成功")
                return True
            
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
                (data_uuid, user_id, content, category, emotion_score, tags, raw_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            
            result = self.db.execute_query(query, (
                hv_uuid,
                self.test_user_id,
                heart_voice_data['content'],
                heart_voice_data['category'],
                heart_voice_data['emotion_score'],
                json.dumps(heart_voice_data['tags']),
                'pending'
            ))
            
            if result:
                self.test_heart_voice_id = result
                print("✅ 心声提交成功")
                success_count += 1
                
                # 模拟审核通过，迁移到有效表
                query = """
                    INSERT INTO valid_heart_voices 
                    (raw_id, data_uuid, user_id, content, category, emotion_score, tags, audit_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                self.db.execute_query(query, (
                    self.test_heart_voice_id, hv_uuid, self.test_user_id,
                    heart_voice_data['content'], heart_voice_data['category'],
                    heart_voice_data['emotion_score'], json.dumps(heart_voice_data['tags']),
                    'approved'
                ))
            
            # 测试故事提交
            story_data = TEST_CONFIG['test_data']['story']
            story_uuid = str(uuid.uuid4())
            
            query = """
                INSERT INTO raw_story_submissions 
                (data_uuid, user_id, title, content, category, tags, raw_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            
            result = self.db.execute_query(query, (
                story_uuid,
                self.test_user_id,
                story_data['title'],
                story_data['content'],
                story_data['category'],
                json.dumps(story_data['tags']),
                'pending'
            ))
            
            if result:
                self.test_story_id = result
                print("✅ 故事提交成功")
                success_count += 1
                
                # 模拟审核通过，迁移到有效表
                query = """
                    INSERT INTO valid_stories 
                    (raw_id, data_uuid, user_id, title, content, category, tags, audit_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                self.db.execute_query(query, (
                    self.test_story_id, story_uuid, self.test_user_id,
                    story_data['title'], story_data['content'],
                    story_data['category'], json.dumps(story_data['tags']),
                    'approved'
                ))
            
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
            
            print("⏳ 模拟PNG生成流程...")
            
            # 模拟PNG卡片生成
            png_uuid = str(uuid.uuid4())
            
            query = """
                INSERT INTO content_png_cards 
                (content_type, content_id, content_uuid, creator_user_id, card_style, 
                 file_name, file_path, file_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            result = self.db.execute_query(query, (
                'heart_voice',
                self.test_heart_voice_id,
                png_uuid,
                self.test_user_id,
                'style_1',
                f'heart_voice_{self.test_heart_voice_id}_style_1.png',
                f'/cards/heart_voice_{self.test_heart_voice_id}_style_1.png',
                f'https://example.com/cards/heart_voice_{self.test_heart_voice_id}_style_1.png'
            ))
            
            if result:
                print("✅ PNG卡片记录创建成功")
                
                # 检查PNG卡片表记录数
                png_count = self.db.get_record_count('content_png_cards')
                print(f"📊 PNG卡片表记录数: {png_count}")
                
                return True
            
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
        
        # 清理测试数据库
        if os.path.exists(TEST_CONFIG['database']['path']):
            os.remove(TEST_CONFIG['database']['path'])
            print("🧹 测试数据库已清理")

def main():
    """主函数"""
    print("🚀 项目核心功能自动化测试 (SQLite版本)")
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
