#!/usr/bin/env python3
"""
测试数据生成工具
为项目生成真实的测试数据，包括问卷、心声、故事等
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta

# API配置
API_ENDPOINTS = {
    'user_auth': 'http://localhost:8007/api/uuid/auth/semi-anonymous',
    'heart_voices': 'http://localhost:8003/api/heart-voices',
    'stories': 'http://localhost:8004/api/stories',
    'questionnaires': 'http://localhost:8001/api/questionnaires'
}

# 测试用户A+B组合
TEST_USERS = [
    {"a": "12345678901", "b": "1234", "name": "测试用户1"},
    {"a": "98765432109", "b": "5678", "name": "测试用户2"},
    {"a": "11111111111", "b": "0000", "name": "测试用户3"},
    {"a": "13800138000", "b": "1234", "name": "手机号测试"},
    {"a": "15912345678", "b": "5678", "name": "手机号测试2"}
]

# 测试数据模板
TEST_DATA_TEMPLATES = {
    'questionnaires': [
        {
            'personal_info': {
                'name': '张同学',
                'age': 22,
                'gender': '男',
                'education': '本科',
                'major': '计算机科学与技术',
                'university': '北京大学',
                'graduation_year': '2024'
            },
            'employment_status': {
                'current_status': '求职中',
                'target_industry': 'IT互联网',
                'expected_salary': '8000-12000',
                'work_location': '北京'
            },
            'psychological_state': {
                'anxiety_level': 3,
                'confidence_level': 4,
                'satisfaction_level': 3
            }
        },
        {
            'personal_info': {
                'name': '李同学',
                'age': 23,
                'gender': '女',
                'education': '硕士',
                'major': '金融学',
                'university': '清华大学',
                'graduation_year': '2024'
            },
            'employment_status': {
                'current_status': '已就业',
                'target_industry': '金融',
                'expected_salary': '12000-18000',
                'work_location': '上海'
            },
            'psychological_state': {
                'anxiety_level': 2,
                'confidence_level': 5,
                'satisfaction_level': 4
            }
        },
        {
            'personal_info': {
                'name': '王同学',
                'age': 24,
                'gender': '男',
                'education': '本科',
                'major': '市场营销',
                'university': '复旦大学',
                'graduation_year': '2024'
            },
            'employment_status': {
                'current_status': '求职中',
                'target_industry': '互联网',
                'expected_salary': '10000-15000',
                'work_location': '深圳'
            },
            'psychological_state': {
                'anxiety_level': 4,
                'confidence_level': 3,
                'satisfaction_level': 3
            }
        },
        {
            'personal_info': {
                'name': '陈同学',
                'age': 22,
                'gender': '女',
                'education': '本科',
                'major': '英语',
                'university': '北京外国语大学',
                'graduation_year': '2024'
            },
            'employment_status': {
                'current_status': '继续深造',
                'target_industry': '教育',
                'expected_salary': '6000-10000',
                'work_location': '北京'
            },
            'psychological_state': {
                'anxiety_level': 2,
                'confidence_level': 4,
                'satisfaction_level': 4
            }
        },
        {
            'personal_info': {
                'name': '刘同学',
                'age': 25,
                'gender': '男',
                'education': '硕士',
                'major': '机械工程',
                'university': '华中科技大学',
                'graduation_year': '2024'
            },
            'employment_status': {
                'current_status': '已就业',
                'target_industry': '制造业',
                'expected_salary': '8000-12000',
                'work_location': '武汉'
            },
            'psychological_state': {
                'anxiety_level': 1,
                'confidence_level': 5,
                'satisfaction_level': 5
            }
        }
    ],
    'heart_voices': [
        {
            'content': '刚毕业找工作真的很焦虑，投了很多简历都没有回音。希望能早日找到心仪的工作，加油！',
            'category': 'job_search',
            'emotion_score': 3,
            'tags': ['求职', '焦虑', '希望']
        },
        {
            'content': '终于收到心仪公司的offer了！感谢这段时间的努力和坚持，也感谢朋友们的支持。',
            'category': 'success',
            'emotion_score': 5,
            'tags': ['成功', '感谢', '努力']
        },
        {
            'content': '面试了好几家公司，每次都很紧张。希望能够调整好心态，展现最好的自己。',
            'category': 'interview',
            'emotion_score': 3,
            'tags': ['面试', '紧张', '调整']
        },
        {
            'content': '作为应届生，感觉自己的经验不足，但我相信通过学习和实践能够不断提升。',
            'category': 'growth',
            'emotion_score': 4,
            'tags': ['应届生', '学习', '提升']
        },
        {
            'content': '在小城市和大城市之间纠结，各有利弊。最终还是选择了挑战自己，去大城市发展。',
            'category': 'choice',
            'emotion_score': 4,
            'tags': ['选择', '挑战', '发展']
        },
        {
            'content': '实习期间学到了很多实用技能，感觉比在学校学的更有价值。实践真的是最好的老师！',
            'category': 'internship',
            'emotion_score': 4,
            'tags': ['实习', '技能', '实践']
        },
        {
            'content': '网申被拒了好多次，有点怀疑自己的能力。但是不能放弃，继续努力投简历！',
            'category': 'rejection',
            'emotion_score': 2,
            'tags': ['拒绝', '怀疑', '坚持']
        },
        {
            'content': '参加了学校的就业指导讲座，收获很大。原来简历还有这么多门道，学到了！',
            'category': 'guidance',
            'emotion_score': 4,
            'tags': ['指导', '简历', '学习']
        },
        {
            'content': '同宿舍的室友都找到工作了，只有我还在苦苦寻找。压力山大，但不能气馁。',
            'category': 'pressure',
            'emotion_score': 2,
            'tags': ['压力', '对比', '坚持']
        },
        {
            'content': '第一次群面，紧张得说话都结巴了。回来后反思了很多，下次一定要表现更好。',
            'category': 'experience',
            'emotion_score': 3,
            'tags': ['群面', '紧张', '反思']
        }
    ],
    'stories': [
        {
            'title': '从迷茫到清晰的求职路',
            'content': '刚毕业时完全不知道自己想做什么，投了很多简历都石沉大海。后来通过职业规划课程，明确了自己的方向，调整了求职策略，最终找到了心仪的工作。这个过程让我明白了目标的重要性。',
            'category': 'job_hunting',
            'tags': ['职业规划', '求职经验', '成长']
        },
        {
            'title': '转专业求职的挑战与收获',
            'content': '本科学的是机械工程，但发现自己更喜欢数据分析。虽然转行很困难，需要重新学习很多知识，但通过自学Python和参加实习项目，最终成功转型为数据分析师。',
            'category': 'career_change',
            'tags': ['转行', '自学', '坚持']
        },
        {
            'title': '实习经历让我成长',
            'content': '大三暑假在一家互联网公司实习，从最开始的什么都不会，到后来能够独立完成项目。这段经历不仅提升了我的技术能力，更重要的是让我了解了职场文化。',
            'category': 'internship',
            'tags': ['实习', '成长', '职场']
        },
        {
            'title': '小城市的就业机会',
            'content': '很多人都说要去大城市发展，但我选择留在家乡的小城市。虽然机会相对较少，但生活成本低，工作压力小，也能找到不错的工作。关键是要根据自己的情况做选择。',
            'category': 'location_choice',
            'tags': ['城市选择', '生活平衡', '个人选择']
        },
        {
            'title': '创业路上的酸甜苦辣',
            'content': '毕业后和同学一起创业，做了一个教育类的小程序。虽然最终没有成功，但这段经历让我学到了很多，也更加明确了自己的职业方向。失败也是一种宝贵的经验。',
            'category': 'entrepreneurship',
            'tags': ['创业', '经验', '成长']
        }
    ]
}

class TestDataGenerator:
    """测试数据生成器"""
    
    def __init__(self):
        self.users = []
        self.session = requests.Session()
    
    def create_test_users(self):
        """创建测试用户"""
        print("👥 创建测试用户...")
        
        for user_data in TEST_USERS:
            try:
                response = self.session.post(
                    API_ENDPOINTS['user_auth'],
                    json={
                        'identityA': user_data['a'],
                        'identityB': user_data['b']
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        user_info = result['data']['user']
                        session_info = result['data']['session']
                        self.users.append({
                            'user_id': user_info['uuid'],
                            'session_id': session_info['sessionId'],
                            'name': user_data['name']
                        })
                        print(f"  ✅ 创建用户: {user_data['name']}")
                    else:
                        print(f"  ❌ 创建用户失败: {user_data['name']} - {result.get('message')}")
                else:
                    print(f"  ❌ 创建用户失败: {user_data['name']} - HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ 创建用户异常: {user_data['name']} - {e}")
            
            time.sleep(1)  # 避免请求过快
        
        print(f"📊 成功创建 {len(self.users)} 个测试用户")
    
    def generate_questionnaires(self):
        """生成问卷数据"""
        print("\n📝 生成问卷数据...")

        if not self.users:
            print("❌ 没有可用的测试用户")
            return

        success_count = 0

        for i, template in enumerate(TEST_DATA_TEMPLATES['questionnaires']):
            if i >= len(self.users):
                break

            user = self.users[i]
            try:
                # 直接插入到数据库
                import mysql.connector

                db_config = {
                    'host': 'localhost',
                    'port': 3306,
                    'user': 'root',
                    'password': '',
                    'database': 'questionnaire_db',
                    'charset': 'utf8mb4'
                }

                conn = mysql.connector.connect(**db_config)
                cursor = conn.cursor()

                # 插入原始问卷数据
                query = """
                    INSERT INTO raw_questionnaire_responses
                    (user_uuid, form_data, raw_status)
                    VALUES (%s, %s, %s)
                """

                cursor.execute(query, (
                    user['user_id'],
                    json.dumps(template),
                    'pending'
                ))

                raw_id = cursor.lastrowid

                # 插入有效问卷数据（模拟审核通过）
                query = """
                    INSERT INTO valid_questionnaire_responses
                    (raw_id, user_uuid, form_data, audit_status)
                    VALUES (%s, %s, %s, %s)
                """

                cursor.execute(query, (
                    raw_id,
                    user['user_id'],
                    json.dumps(template),
                    'approved'
                ))

                conn.commit()
                cursor.close()
                conn.close()

                print(f"  ✅ 创建问卷: {user['name']} - {template['personal_info']['major']}")
                success_count += 1

            except Exception as e:
                print(f"  ❌ 生成问卷失败: {user['name']} - {e}")

        print(f"📊 成功创建 {success_count} 份问卷")
    
    def generate_heart_voices(self):
        """生成心声数据"""
        print("\n💭 生成心声数据...")
        
        if not self.users:
            print("❌ 没有可用的测试用户")
            return
        
        success_count = 0
        
        for template in TEST_DATA_TEMPLATES['heart_voices']:
            user = random.choice(self.users)
            
            try:
                response = self.session.post(
                    API_ENDPOINTS['heart_voices'],
                    json={
                        'user_id': user['user_id'],
                        'content': template['content'],
                        'category': template['category'],
                        'emotion_score': template['emotion_score'],
                        'tags': template['tags']
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        print(f"  ✅ 创建心声: {template['content'][:30]}...")
                        success_count += 1
                    else:
                        print(f"  ❌ 创建心声失败: {result.get('message')}")
                else:
                    print(f"  ❌ 创建心声失败: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ 创建心声异常: {e}")
            
            time.sleep(1)
        
        print(f"📊 成功创建 {success_count} 条心声")
    
    def generate_stories(self):
        """生成故事数据"""
        print("\n📚 生成故事数据...")

        if not self.users:
            print("❌ 没有可用的测试用户")
            return

        success_count = 0

        for template in TEST_DATA_TEMPLATES['stories']:
            user = random.choice(self.users)

            try:
                # 直接插入到数据库，避免API权限问题
                import mysql.connector

                db_config = {
                    'host': 'localhost',
                    'port': 3306,
                    'user': 'root',
                    'password': '',
                    'database': 'questionnaire_db',
                    'charset': 'utf8mb4'
                }

                conn = mysql.connector.connect(**db_config)
                cursor = conn.cursor()

                # 生成UUID
                story_uuid = f"story-{int(time.time())}-{success_count}"

                # 插入原始故事数据
                query = """
                    INSERT INTO raw_story_submissions
                    (data_uuid, user_id, title, content, category, tags, author_name, is_anonymous, raw_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                cursor.execute(query, (
                    story_uuid,
                    user['user_id'],
                    template['title'],
                    template['content'],
                    template['category'],
                    json.dumps(template['tags']),
                    user['name'],
                    False,
                    'pending'
                ))

                raw_id = cursor.lastrowid

                # 插入有效故事数据（模拟审核通过）
                query = """
                    INSERT INTO valid_stories
                    (raw_id, data_uuid, user_id, title, content, category, tags, author_name,
                     is_anonymous, is_published, is_featured, audit_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                cursor.execute(query, (
                    raw_id,
                    story_uuid,
                    user['user_id'],
                    template['title'],
                    template['content'],
                    template['category'],
                    json.dumps(template['tags']),
                    user['name'],
                    False,
                    True,
                    random.choice([True, False]),  # 随机设置精选
                    'approved'
                ))

                conn.commit()
                cursor.close()
                conn.close()

                print(f"  ✅ 创建故事: {template['title']}")
                success_count += 1

            except Exception as e:
                print(f"  ❌ 创建故事异常: {e}")

            time.sleep(0.5)

        print(f"📊 成功创建 {success_count} 个故事")
    
    def check_services(self):
        """检查服务状态"""
        print("🔍 检查服务状态...")

        services_status = {}

        # 直接测试API端点
        test_endpoints = {
            'user_auth': 'http://localhost:8007/api/uuid/test-combinations',
            'heart_voices': 'http://localhost:8003/api/heart-voices',
            'stories': 'http://localhost:8004/api/stories',
            'questionnaires': 'http://localhost:8001/api/analytics'
        }

        for name, url in test_endpoints.items():
            try:
                response = self.session.get(url, timeout=3)
                services_status[name] = response.status_code == 200
            except:
                services_status[name] = False

        for name, status in services_status.items():
            status_text = "✅ 正常" if status else "❌ 不可用"
            print(f"  {name}: {status_text}")

        available_services = sum(services_status.values())
        total_services = len(services_status)

        if available_services < total_services:
            print(f"\n⚠️ {total_services - available_services} 个服务不可用，可能影响数据生成")

        return available_services >= 2  # 至少需要2个服务可用
    
    def run(self):
        """运行数据生成"""
        print("🚀 开始生成测试数据")
        print("=" * 60)
        
        # 检查服务状态
        if not self.check_services():
            print("❌ 关键服务不可用，请先启动后端服务")
            return False
        
        # 创建测试用户
        self.create_test_users()
        
        if not self.users:
            print("❌ 无法创建测试用户，停止数据生成")
            return False
        
        # 生成各类数据
        self.generate_questionnaires()
        self.generate_heart_voices()
        self.generate_stories()
        
        print("\n" + "=" * 60)
        print("🎉 测试数据生成完成！")
        print("=" * 60)
        print("📊 生成统计:")
        print(f"  • 测试用户: {len(self.users)} 个")
        print(f"  • 问卷数据: {len(TEST_DATA_TEMPLATES['questionnaires'])} 份")
        print(f"  • 心声数据: {len(TEST_DATA_TEMPLATES['heart_voices'])} 条")
        print(f"  • 故事数据: {len(TEST_DATA_TEMPLATES['stories'])} 个")
        
        print("\n🎯 现在可以测试以下功能:")
        print("  • 访问 http://localhost:5173/voices 查看心声")
        print("  • 访问 http://localhost:5173/stories 查看故事")
        print("  • 访问 http://localhost:5173/analytics 查看数据分析")
        
        return True

def main():
    """主函数"""
    generator = TestDataGenerator()
    generator.run()

if __name__ == "__main__":
    main()
