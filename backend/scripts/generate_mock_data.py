#!/usr/bin/env python3
"""
问卷模拟数据生成器
基于真实问卷结构生成符合统计规律的测试数据
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any
import hashlib

class QuestionnaireDataGenerator:
    """问卷数据生成器"""
    
    def __init__(self):
        # 基于真实统计的权重分布
        self.distributions = {
            'education_level': {
                'bachelor': 0.50,
                'master': 0.30,
                'junior-college': 0.15,
                'phd': 0.04,
                'high-school': 0.01
            },
            'major_field': {
                'engineering': 0.25,
                'management': 0.18,
                'economics': 0.15,
                'science': 0.12,
                'literature': 0.10,
                'education': 0.08,
                'law': 0.05,
                'medicine': 0.04,
                'art': 0.03
            },
            'gender': {
                'female': 0.52,
                'male': 0.47,
                'prefer-not-say': 0.01
            },
            'university_tier': {
                'regular-public': 0.40,
                '211': 0.25,
                'private': 0.15,
                '985': 0.12,
                'vocational': 0.05,
                'double-first-class': 0.03
            },
            'current_status': {
                'fulltime': 0.45,
                'unemployed': 0.25,
                'preparing': 0.15,
                'parttime': 0.08,
                'student': 0.04,
                'internship': 0.02,
                'freelance': 0.01
            },
            'salary_ranges': {
                '5k-8k': 0.28,
                '8k-12k': 0.25,
                '3k-5k': 0.20,
                '12k-20k': 0.15,
                'below-3k': 0.07,
                '20k-30k': 0.04,
                'above-30k': 0.01
            },
            'industries': {
                'internet-tech': 0.22,
                'manufacturing': 0.18,
                'education': 0.15,
                'finance': 0.12,
                'government': 0.10,
                'healthcare': 0.08,
                'retail': 0.06,
                'real-estate': 0.05,
                'media': 0.02,
                'logistics': 0.02
            }
        }
        
        # 求职困难选项
        self.job_difficulties = [
            'market-competition',
            'skill-mismatch',
            'lack-experience',
            'resume-issues',
            'interview-problems',
            'information-gap',
            'location-limits',
            'salary-mismatch',
            'psychological-pressure'
        ]
        
        # 求职渠道选项
        self.job_channels = [
            'online-platforms',
            'social-recruitment',
            'campus-recruitment',
            'referrals',
            'company-websites',
            'headhunters',
            'job-fairs',
            'social-media'
        ]
        
        # 城市列表
        self.cities = [
            '北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '西安',
            '南京', '天津', '苏州', '重庆', '青岛', '长沙', '大连', '厦门'
        ]

    def weighted_choice(self, choices: Dict[str, float]) -> str:
        """根据权重随机选择"""
        items = list(choices.items())
        weights = [item[1] for item in items]
        return random.choices([item[0] for item in items], weights=weights)[0]

    def multi_choice(self, options: List[str], min_count: int = 1, max_count: int = 3) -> List[str]:
        """多选题生成"""
        count = random.randint(min_count, min(max_count, len(options)))
        return random.sample(options, count)

    def generate_session_id(self) -> str:
        """生成匿名会话ID"""
        return str(uuid.uuid4())

    def generate_ip_hash(self) -> str:
        """生成IP哈希（模拟）"""
        fake_ip = f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
        return hashlib.md5(fake_ip.encode()).hexdigest()

    def generate_single_response(self) -> Dict[str, Any]:
        """生成单个问卷回答"""
        
        # 基础信息
        education = self.weighted_choice(self.distributions['education_level'])
        major = self.weighted_choice(self.distributions['major_field'])
        gender = self.weighted_choice(self.distributions['gender'])
        university = self.weighted_choice(self.distributions['university_tier'])
        
        # 就业状态（受学历影响）
        status_weights = self.distributions['current_status'].copy()
        if education in ['phd', 'master']:
            status_weights['fulltime'] *= 1.5
            status_weights['unemployed'] *= 0.7
        elif education == 'high-school':
            status_weights['fulltime'] *= 0.6
            status_weights['unemployed'] *= 1.4
            
        current_status = self.weighted_choice(status_weights)
        
        # 基础回答结构
        response = {
            'session_id': self.generate_session_id(),
            'ip_hash': self.generate_ip_hash(),
            'is_completed': random.choice([True] * 9 + [False]),  # 90%完成率
            'started_at': datetime.now() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            ),
            'device_type': random.choices(['desktop', 'mobile', 'tablet'], weights=[0.6, 0.35, 0.05])[0],
            'answers': {}
        }
        
        # 如果未完成，随机停止在某个问题
        if not response['is_completed']:
            response['completion_percentage'] = random.randint(20, 80)
        else:
            response['completion_percentage'] = 100
            response['completed_at'] = response['started_at'] + timedelta(
                minutes=random.randint(3, 15)
            )
        
        # 第1页：个人基本信息
        response['answers'].update({
            'education-level': education,
            'major-field': major,
            'graduation-year': random.choices(
                ['2024', '2023', '2022', '2021', '2020', 'before-2020'],
                weights=[0.4, 0.3, 0.15, 0.1, 0.03, 0.02]
            )[0],
            'gender': gender,
            'age-range': random.choices(
                ['20-22', '23-25', '26-28', '29-35', 'under-20', 'over-35'],
                weights=[0.3, 0.4, 0.2, 0.08, 0.01, 0.01]
            )[0],
            'university-tier': university
        })
        
        # 第2页：就业现状
        response['answers']['current-status'] = current_status
        
        # 只有就业的人才回答工作相关问题
        if current_status in ['fulltime', 'parttime']:
            # 薪资受学历和专业影响
            salary_weights = self.distributions['salary_ranges'].copy()
            if education in ['phd', 'master']:
                # 高学历倾向高薪
                for key in ['12k-20k', '20k-30k', 'above-30k']:
                    salary_weights[key] *= 2
                for key in ['below-3k', '3k-5k']:
                    salary_weights[key] *= 0.3
            elif major == 'engineering':
                # 工科倾向高薪
                for key in ['8k-12k', '12k-20k', '20k-30k']:
                    salary_weights[key] *= 1.5
                    
            response['answers'].update({
                'job-satisfaction': str(random.choices(
                    [1, 2, 3, 4, 5],
                    weights=[0.05, 0.15, 0.35, 0.35, 0.1]
                )[0]),
                'current-salary': self.weighted_choice(salary_weights),
                'work-industry': self.weighted_choice(self.distributions['industries']),
                'work-location': random.choice(self.cities),
                'major-match': str(random.choices(
                    [1, 2, 3, 4, 5],
                    weights=[0.1, 0.2, 0.3, 0.3, 0.1]
                )[0])
            })
        
        # 第3页：求职经历（失业或曾经求职的人回答）
        if current_status in ['unemployed', 'fulltime', 'parttime']:
            response['answers'].update({
                'unemployment-duration': random.choices(
                    ['within-3months', '3-6months', '6-12months', 'over-1year', 'never-unemployed'],
                    weights=[0.4, 0.3, 0.2, 0.08, 0.02]
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
                )[0],
                'job-search-cost': random.choices(
                    ['1k-3k', '3k-5k', 'under-1k', '5k-10k', 'over-10k'],
                    weights=[0.4, 0.25, 0.2, 0.1, 0.05]
                )[0]
            })
        
        # 计算总用时
        if response['is_completed']:
            response['total_time_seconds'] = int((response['completed_at'] - response['started_at']).total_seconds())
        
        # 数据质量评分
        response['quality_score'] = self.calculate_quality_score(response)
        
        return response

    def calculate_quality_score(self, response: Dict[str, Any]) -> float:
        """计算数据质量评分"""
        score = 1.0
        
        # 完成度影响
        if not response['is_completed']:
            score *= 0.7
        
        # 答题时间影响（过快或过慢都降分）
        if response['is_completed']:
            time_minutes = response['total_time_seconds'] / 60
            if time_minutes < 2:  # 过快
                score *= 0.5
            elif time_minutes > 30:  # 过慢
                score *= 0.8
        
        # 答案一致性检查
        answers = response['answers']
        if 'current-status' in answers and answers['current-status'] == 'unemployed':
            if 'current-salary' in answers:  # 失业但有薪资，逻辑不一致
                score *= 0.3
        
        return round(score, 2)

    def generate_batch(self, count: int) -> List[Dict[str, Any]]:
        """批量生成问卷数据"""
        return [self.generate_single_response() for _ in range(count)]

    def save_to_json(self, data: List[Dict[str, Any]], filename: str):
        """保存为JSON文件"""
        # 处理datetime序列化
        def json_serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=json_serializer)

def main():
    """主函数"""
    generator = QuestionnaireDataGenerator()
    
    # 生成不同规模的测试数据
    test_sizes = [100, 500, 1000, 2000, 5000]
    
    for size in test_sizes:
        print(f"生成 {size} 条测试数据...")
        data = generator.generate_batch(size)
        
        # 统计信息
        completed = sum(1 for item in data if item['is_completed'])
        avg_quality = sum(item['quality_score'] for item in data) / len(data)
        
        print(f"  完成率: {completed/size*100:.1f}%")
        print(f"  平均质量分: {avg_quality:.2f}")
        
        # 保存文件
        filename = f"mock_questionnaire_data_{size}.json"
        generator.save_to_json(data, filename)
        print(f"  已保存到: {filename}")
        print()

if __name__ == "__main__":
    main()
