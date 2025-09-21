"""
测试数据生成服务
支持参数化生成问卷数据、心声分享、故事墙等多种类型的测试数据
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import mysql.connector
from mysql.connector import Error
import hashlib

class TestDataService:
    """测试数据生成服务"""
    
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        
        # 预定义的数据分布
        self.default_distributions = {
            'education_level': {
                'bachelor': 50,
                'master': 30,
                'junior-college': 15,
                'phd': 4,
                'high-school': 1
            },
            'employment_status': {
                'fulltime': 45,
                'unemployed': 25,
                'preparing': 15,
                'parttime': 8,
                'student': 4,
                'internship': 2,
                'freelance': 1
            },
            'gender': {
                'female': 52,
                'male': 47,
                'prefer-not-say': 1
            },
            'major_field': {
                'engineering': 25,
                'management': 18,
                'economics': 15,
                'science': 12,
                'literature': 10,
                'education': 8,
                'law': 5,
                'medicine': 4,
                'art': 3
            },
            'university_tier': {
                'regular-public': 40,
                '211': 25,
                'private': 15,
                '985': 12,
                'vocational': 5,
                'double-first-class': 3
            }
        }
        
        # 求职困难选项
        self.job_difficulties = [
            'market-competition', 'skill-mismatch', 'lack-experience',
            'resume-issues', 'interview-problems', 'information-gap',
            'location-limits', 'salary-mismatch', 'psychological-pressure'
        ]
        
        # 求职渠道选项
        self.job_channels = [
            'online-platforms', 'social-recruitment', 'campus-recruitment',
            'referrals', 'company-websites', 'headhunters', 'job-fairs', 'social-media'
        ]
        
        # 城市列表
        self.cities = [
            '北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '西安',
            '南京', '天津', '苏州', '重庆', '青岛', '长沙', '大连', '厦门'
        ]
        
        # 心声模板
        self.heart_voice_templates = [
            "找工作真的太难了，投了{resume_count}份简历，只收到{interview_count}个面试机会...",
            "作为{education}毕业生，感觉就业压力很大，希望能找到专业对口的工作。",
            "在{city}找工作，房租太贵，薪资却不高，生活压力很大。",
            "面试了很多家公司，总是被拒绝，开始怀疑自己的能力...",
            "希望政府能提供更多的就业指导和培训机会。",
            "同学们都找到工作了，只有我还在家里待业，心理压力很大。"
        ]
        
        # 故事模板
        self.story_templates = [
            {
                "title": "从迷茫到清晰的求职路",
                "content": "刚毕业时完全不知道自己想做什么，投了很多简历都石沉大海。后来通过职业规划课程，明确了自己的方向，最终找到了心仪的工作。",
                "tags": ["职业规划", "求职经验", "成长"]
            },
            {
                "title": "转专业求职的挑战与收获",
                "content": "本科学的是{major}，但发现自己更喜欢{target_field}。虽然转行很困难，但通过自学和实习，最终成功转型。",
                "tags": ["转行", "自学", "坚持"]
            },
            {
                "title": "小城市vs大城市的就业选择",
                "content": "在大城市和小城市之间纠结了很久，最终选择了{city}。虽然竞争激烈，但机会更多，发展空间也更大。",
                "tags": ["城市选择", "职业发展", "生活平衡"]
            }
        ]

    def get_connection(self):
        """获取数据库连接"""
        return mysql.connector.connect(**self.db_config)

    def weighted_choice(self, distribution: Dict[str, float]) -> str:
        """根据权重随机选择"""
        total = sum(distribution.values())
        random_value = random.random() * total
        
        for key, weight in distribution.items():
            random_value -= weight
            if random_value <= 0:
                return key
        
        return list(distribution.keys())[0]

    def multi_choice(self, options: List[str], min_count: int = 1, max_count: int = 3) -> List[str]:
        """多选题生成"""
        count = random.randint(min_count, min(max_count, len(options)))
        return random.sample(options, count)

    def generate_questionnaire_data(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """生成单个问卷数据"""
        
        # 获取参数
        completion_rate = params.get('completionRate', 90) / 100
        quality_score = params.get('qualityScore', 85) / 100
        time_range = params.get('timeRange', 'recent')
        
        # 获取分布参数
        education_dist = params.get('educationDistribution', self.default_distributions['education_level'])
        employment_dist = params.get('employmentDistribution', self.default_distributions['employment_status'])
        gender_dist = params.get('genderDistribution', self.default_distributions['gender'])
        
        # 生成基础信息
        education = self.weighted_choice(education_dist)
        employment = self.weighted_choice(employment_dist)
        gender = self.weighted_choice(gender_dist)
        major = self.weighted_choice(self.default_distributions['major_field'])
        university = self.weighted_choice(self.default_distributions['university_tier'])
        
        # 生成时间
        if time_range == 'recent':
            days_ago = random.randint(0, 30)
        elif time_range == 'quarter':
            days_ago = random.randint(0, 90)
        elif time_range == 'halfyear':
            days_ago = random.randint(0, 180)
        else:  # year
            days_ago = random.randint(0, 365)
        
        started_at = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
        
        # 是否完成
        is_completed = random.random() < completion_rate
        
        # 生成问卷数据
        response_data = {
            'session_id': str(uuid.uuid4()),
            'ip_hash': hashlib.md5(f"192.168.1.{random.randint(1, 255)}".encode()).hexdigest(),
            'is_completed': is_completed,
            'completion_percentage': 100 if is_completed else random.randint(30, 90),
            'started_at': started_at,
            'device_type': random.choices(['desktop', 'mobile', 'tablet'], weights=[0.6, 0.35, 0.05])[0],
            'quality_score': max(0.3, min(1.0, quality_score + random.uniform(-0.15, 0.15))),
            'answers': {}
        }
        
        if is_completed:
            response_data['completed_at'] = started_at + timedelta(minutes=random.randint(3, 20))
            response_data['total_time_seconds'] = int((response_data['completed_at'] - started_at).total_seconds())
        
        # 生成答案
        response_data['answers'] = {
            'education-level': education,
            'major-field': major,
            'graduation-year': random.choices(['2024', '2023', '2022', '2021'], weights=[0.4, 0.3, 0.2, 0.1])[0],
            'gender': gender,
            'age-range': random.choices(['20-22', '23-25', '26-28'], weights=[0.3, 0.5, 0.2])[0],
            'university-tier': university,
            'current-status': employment
        }
        
        # 就业相关答案
        if employment in ['fulltime', 'parttime']:
            salary_weights = {
                '5k-8k': 0.28, '8k-12k': 0.25, '3k-5k': 0.20,
                '12k-20k': 0.15, 'below-3k': 0.07, '20k-30k': 0.04, 'above-30k': 0.01
            }
            
            # 学历影响薪资
            if education in ['phd', 'master']:
                salary_weights['12k-20k'] *= 2
                salary_weights['20k-30k'] *= 2
                salary_weights['above-30k'] *= 2
            
            response_data['answers'].update({
                'job-satisfaction': str(random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.15, 0.35, 0.35, 0.1])[0]),
                'current-salary': self.weighted_choice(salary_weights),
                'work-industry': self.weighted_choice({
                    'internet-tech': 0.22, 'manufacturing': 0.18, 'education': 0.15,
                    'finance': 0.12, 'government': 0.10, 'healthcare': 0.08,
                    'retail': 0.06, 'real-estate': 0.05, 'media': 0.02, 'logistics': 0.02
                }),
                'work-location': random.choice(self.cities),
                'major-match': str(random.choices([1, 2, 3, 4, 5], weights=[0.1, 0.2, 0.3, 0.3, 0.1])[0])
            })
        
        # 求职经历
        if employment in ['unemployed', 'fulltime', 'parttime']:
            response_data['answers'].update({
                'unemployment-duration': random.choices(
                    ['within-3months', '3-6months', '6-12months', 'over-1year'],
                    weights=[0.4, 0.35, 0.2, 0.05]
                )[0],
                'job-hunting-difficulties': self.multi_choice(self.job_difficulties, 1, 4),
                'job-search-channels': self.multi_choice(self.job_channels, 1, 3),
                'interview-count': random.choices(
                    ['1-3', '4-10', '11-20', 'over-20', 'none'],
                    weights=[0.3, 0.35, 0.2, 0.1, 0.05]
                )[0],
                'resume-count': random.choices(
                    ['10-50', '51-100', '101-200', 'under-10', 'over-200'],
                    weights=[0.35, 0.3, 0.2, 0.1, 0.05]
                )[0]
            })
        
        return response_data

    def generate_heart_voice(self, questionnaire_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成心声数据"""
        answers = questionnaire_data['answers']
        
        # 选择模板并填充数据
        template = random.choice(self.heart_voice_templates)
        content = template.format(
            resume_count=answers.get('resume-count', '很多'),
            interview_count=answers.get('interview-count', '几个'),
            education=answers.get('education-level', '大学'),
            city=answers.get('work-location', '这个城市')
        )
        
        return {
            'response_id': questionnaire_data.get('id'),
            'content': content,
            'emotion_score': random.uniform(0.2, 0.8),  # 情感分数
            'is_anonymous': True,
            'created_at': questionnaire_data['started_at'] + timedelta(minutes=random.randint(1, 60))
        }

    def generate_story(self, questionnaire_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成故事数据"""
        answers = questionnaire_data['answers']
        
        # 选择故事模板
        story_template = random.choice(self.story_templates)
        
        # 填充数据
        content = story_template['content'].format(
            major=answers.get('major-field', '计算机'),
            target_field='数据分析',
            city=answers.get('work-location', '北京')
        )
        
        return {
            'response_id': questionnaire_data.get('id'),
            'title': story_template['title'],
            'content': content,
            'tags': story_template['tags'],
            'is_featured': random.random() < 0.1,  # 10%概率成为精选
            'view_count': random.randint(10, 500),
            'like_count': random.randint(0, 50),
            'created_at': questionnaire_data['started_at'] + timedelta(days=random.randint(1, 30))
        }

    def batch_generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """批量生成测试数据"""
        count = params.get('count', 100)
        include_heart_voices = params.get('includeHeartVoices', False)
        include_story_wall = params.get('includeStoryWall', False)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            generated_count = 0
            failed_count = 0
            preview_data = []
            
            for i in range(count):
                try:
                    # 生成问卷数据
                    questionnaire_data = self.generate_questionnaire_data(params)
                    
                    # 插入问卷主记录
                    response_query = """
                    INSERT INTO questionnaire_responses 
                    (session_id, ip_hash, is_completed, completion_percentage, 
                     started_at, completed_at, total_time_seconds, device_type, 
                     quality_score, is_valid)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    cursor.execute(response_query, (
                        questionnaire_data['session_id'],
                        questionnaire_data['ip_hash'],
                        questionnaire_data['is_completed'],
                        questionnaire_data['completion_percentage'],
                        questionnaire_data['started_at'],
                        questionnaire_data.get('completed_at'),
                        questionnaire_data.get('total_time_seconds'),
                        questionnaire_data['device_type'],
                        questionnaire_data['quality_score'],
                        True
                    ))
                    
                    response_id = cursor.lastrowid
                    questionnaire_data['id'] = response_id
                    
                    # 插入答案记录
                    for question_id, answer_value in questionnaire_data['answers'].items():
                        answer_query = """
                        INSERT INTO questionnaire_answers 
                        (response_id, question_id, question_type, answer_value)
                        VALUES (%s, %s, %s, %s)
                        """
                        
                        question_type = 'checkbox' if isinstance(answer_value, list) else 'radio'
                        json_value = json.dumps(answer_value)
                        
                        cursor.execute(answer_query, (
                            response_id, question_id, question_type, json_value
                        ))
                    
                    # 生成心声数据
                    if include_heart_voices and random.random() < 0.3:  # 30%概率生成心声
                        heart_voice = self.generate_heart_voice(questionnaire_data)
                        # 这里可以插入心声表（待实现）
                    
                    # 生成故事数据
                    if include_story_wall and random.random() < 0.1:  # 10%概率生成故事
                        story = self.generate_story(questionnaire_data)
                        # 这里可以插入故事表（待实现）
                    
                    generated_count += 1
                    
                    # 收集预览数据
                    if len(preview_data) < 5:
                        preview_data.append({
                            'id': f'generated_{response_id}',
                            'education': questionnaire_data['answers']['education-level'],
                            'employment': questionnaire_data['answers']['current-status'],
                            'gender': questionnaire_data['answers']['gender'],
                            'completed': questionnaire_data['is_completed'],
                            'quality': f"{questionnaire_data['quality_score']:.2f}"
                        })
                    
                except Exception as e:
                    failed_count += 1
                    print(f"Failed to generate record {i}: {e}")
            
            conn.commit()
            
            return {
                'success': True,
                'generated': generated_count,
                'failed': failed_count,
                'preview': preview_data
            }
            
        except Exception as e:
            conn.rollback()
            return {
                'success': False,
                'error': str(e),
                'generated': 0,
                'failed': count
            }
        finally:
            cursor.close()
            conn.close()

    def clear_all_data(self) -> Dict[str, Any]:
        """清除所有测试数据"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # 禁用外键检查
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # 清除数据
            tables = ['questionnaire_answers', 'questionnaire_responses', 'analytics_cache']
            cleared_counts = {}
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                cleared_counts[table] = count
                
                cursor.execute(f"DELETE FROM {table}")
                cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")
            
            # 启用外键检查
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            conn.commit()
            
            return {
                'success': True,
                'cleared_counts': cleared_counts,
                'total_cleared': sum(cleared_counts.values())
            }
            
        except Exception as e:
            conn.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            cursor.close()
            conn.close()

    def get_current_stats(self) -> Dict[str, Any]:
        """获取当前数据统计"""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed_responses,
                AVG(quality_score) as avg_quality,
                MAX(started_at) as last_generated
            FROM questionnaire_responses
            WHERE is_valid = TRUE
            """
            
            cursor.execute(query)
            stats = cursor.fetchone()
            
            return {
                'totalRecords': stats['total_responses'] or 0,
                'completedRecords': stats['completed_responses'] or 0,
                'avgQuality': float(stats['avg_quality'] or 0),
                'lastGenerated': stats['last_generated'].isoformat() if stats['last_generated'] else None
            }
            
        finally:
            cursor.close()
            conn.close()
