"""
智能数据生成器
支持基于新分类和标签系统的智能数据生成
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import mysql.connector
from mysql.connector import Error

class SmartDataGenerator:
    """智能数据生成器"""
    
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        
        # 心声分类配置
        self.voice_categories = {
            'gratitude': {
                'name': '感谢',
                'weight': 20,
                'tags': ['问卷设计', '用户体验', '数据收集', '平台功能', '服务质量', '反馈机制'],
                'templates': [
                    "非常感谢这个问卷平台，{feature}设计得很人性化，让我能够轻松表达自己的就业想法。",
                    "问卷的{aspect}做得很好，希望能帮助更多像我一样的求职者。",
                    "感谢平台提供这样的机会让我们分享就业经历，{benefit}对我很有帮助。"
                ],
                'emotion_range': (3, 5)
            },
            'suggestion': {
                'name': '建议',
                'weight': 25,
                'tags': ['界面优化', '功能改进', '流程简化', '数据分析', '用户引导', '操作便捷'],
                'templates': [
                    "建议在{area}方面进行优化，比如{specific_suggestion}，这样会更方便用户使用。",
                    "希望能增加{feature}功能，这对{target_group}会很有帮助。",
                    "问卷的{aspect}可以再简化一些，{reason}。"
                ],
                'emotion_range': (2, 4)
            },
            'reflection': {
                'name': '感悟',
                'weight': 30,
                'tags': ['就业思考', '职业规划', '成长感悟', '人生感悟', '学习收获', '自我认知'],
                'templates': [
                    "通过填写这个问卷，我深刻反思了自己的{aspect}，意识到{realization}。",
                    "问卷让我重新审视了{topic}，{insight}是我最大的收获。",
                    "填写过程中，我对{subject}有了新的理解，{conclusion}。"
                ],
                'emotion_range': (2, 5)
            },
            'experience': {
                'name': '经验',
                'weight': 20,
                'tags': ['求职经验', '面试技巧', '职场经验', '学习方法', '技能提升', '人际关系'],
                'templates': [
                    "作为{background}，我想分享一些{experience_type}：{advice}。",
                    "在{situation}过程中，我学到了{lesson}，希望对其他人有帮助。",
                    "我的{experience_area}经历告诉我，{wisdom}是很重要的。"
                ],
                'emotion_range': (3, 5)
            },
            'other': {
                'name': '其他',
                'weight': 5,
                'tags': ['技术问题', '使用体验', '期望功能', '改进意见', '创新想法', '合作建议'],
                'templates': [
                    "关于{topic}，我有一些{type}想法：{content}。",
                    "希望平台能在{area}方面有所发展，{expectation}。",
                    "使用过程中遇到了{issue}，建议{solution}。"
                ],
                'emotion_range': (2, 4)
            }
        }
        
        # 故事分类配置
        self.story_categories = {
            'job_search': {
                'name': '求职经历',
                'weight': 25,
                'tags': ['求职经验', '面试技巧', '简历优化', '网申技巧', '求职心态', '应届生'],
                'templates': [
                    {
                        'title': '我的{duration}求职路：从{start_state}到{end_state}',
                        'content': '作为{background}，我的求职之路{description}。通过{method}，最终{result}。{advice}',
                        'length_range': (300, 800)
                    }
                ]
            },
            'interview': {
                'name': '面试经验',
                'weight': 20,
                'tags': ['面试准备', '面试技巧', '面试经验', '面试心得', '面试失败', '面试成功'],
                'templates': [
                    {
                        'title': '{company_type}面试经历分享',
                        'content': '最近参加了{company}的面试，{process}。面试官问了{questions}，{experience}。{conclusion}',
                        'length_range': (250, 600)
                    }
                ]
            },
            'career_change': {
                'name': '转行故事',
                'weight': 15,
                'tags': ['转行', '跳槽', '职业规划', '技能转换', '行业切换', '职业发展'],
                'templates': [
                    {
                        'title': '从{old_field}到{new_field}的转行之路',
                        'content': '我原本是{old_background}，后来决定转行到{new_field}。{reason}。转行过程中{challenges}，但最终{outcome}。',
                        'length_range': (400, 1000)
                    }
                ]
            },
            'internship': {
                'name': '实习感悟',
                'weight': 15,
                'tags': ['实习经历', '实习感悟', '实习收获', '实习建议', '实习心得', '职场新人'],
                'templates': [
                    {
                        'title': '在{company}实习的{duration}收获',
                        'content': '这次在{company}的实习让我{learning}。{specific_experience}。{growth}对我来说是最大的收获。',
                        'length_range': (200, 500)
                    }
                ]
            },
            'workplace': {
                'name': '职场生活',
                'weight': 15,
                'tags': ['工作环境', '团队合作', '职业发展', '工作压力', '工作技巧', '职场关系'],
                'templates': [
                    {
                        'title': '职场{topic}的一些思考',
                        'content': '工作{duration}以来，对{aspect}有了一些体会。{observation}。{advice}希望对大家有帮助。',
                        'length_range': (300, 700)
                    }
                ]
            },
            'growth': {
                'name': '成长感悟',
                'weight': 5,
                'tags': ['个人成长', '职业发展', '技能提升', '心态调整', '经验总结', '人生感悟'],
                'templates': [
                    {
                        'title': '{period}的成长与思考',
                        'content': '回顾{timeframe}，我在{aspects}方面有了很大成长。{specific_growth}。{reflection}',
                        'length_range': (400, 900)
                    }
                ]
            },
            'advice': {
                'name': '经验分享',
                'weight': 5,
                'tags': ['经验分享', '建议', '指导', '帮助', '支持', '学长学姐'],
                'templates': [
                    {
                        'title': '给{target_group}的一些建议',
                        'content': '作为{identity}，我想给{audience}分享一些{topic}的经验。{main_advice}。{encouragement}',
                        'length_range': (250, 600)
                    }
                ]
            }
        }
        
        # 点赞分布配置
        self.like_distributions = {
            'voice': {
                'hot': {'range': (50, 200), 'probability': 0.1},
                'medium': {'range': (10, 50), 'probability': 0.3},
                'normal': {'range': (1, 10), 'probability': 0.5},
                'new': {'range': (0, 5), 'probability': 0.1}
            },
            'story': {
                'viral': {'range': (100, 500), 'probability': 0.05},
                'popular': {'range': (20, 100), 'probability': 0.15},
                'medium': {'range': (5, 20), 'probability': 0.35},
                'normal': {'range': (1, 5), 'probability': 0.35},
                'new': {'range': (0, 2), 'probability': 0.1}
            }
        }
        
        # 内容变量池
        self.content_variables = {
            'features': ['界面设计', '数据分析', '用户体验', '反馈机制', '统计功能'],
            'aspects': ['问题设计', '流程设置', '数据收集', '结果展示', '用户引导'],
            'benefits': ['数据分析', '自我认知', '职业规划', '经验分享', '同伴交流'],
            'areas': ['界面设计', '功能布局', '操作流程', '数据展示', '用户体验'],
            'backgrounds': ['应届毕业生', '在职人员', '求职者', '转行人士', '实习生'],
            'companies': ['互联网公司', '传统企业', '外企', '国企', '创业公司'],
            'durations': ['三个月', '半年', '一年', '两年', '漫长'],
            'fields': ['技术', '产品', '运营', '市场', '设计', '销售', '人力资源']
        }

    def get_connection(self):
        """获取数据库连接"""
        return mysql.connector.connect(**self.db_config)

    def clear_data(self, data_type: str) -> Dict[str, Any]:
        """清除现有数据"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            if data_type == 'voice' or data_type == 'all':
                cursor.execute("DELETE FROM heart_voices")
                voice_count = cursor.rowcount
                
            if data_type == 'story' or data_type == 'all':
                cursor.execute("DELETE FROM stories")
                story_count = cursor.rowcount
                
            if data_type == 'questionnaire' or data_type == 'all':
                cursor.execute("DELETE FROM questionnaire_responses")
                cursor.execute("DELETE FROM questionnaire_answers")
                questionnaire_count = cursor.rowcount
            
            conn.commit()
            
            return {
                'success': True,
                'message': f'成功清除{data_type}数据',
                'details': {
                    'voice_count': voice_count if data_type in ['voice', 'all'] else 0,
                    'story_count': story_count if data_type in ['story', 'all'] else 0,
                    'questionnaire_count': questionnaire_count if data_type in ['questionnaire', 'all'] else 0
                }
            }
            
        except Error as e:
            conn.rollback()
            return {
                'success': False,
                'message': f'清除数据失败: {str(e)}'
            }
        finally:
            cursor.close()
            conn.close()

    def generate_smart_voice_data(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """生成智能心声数据"""
        count = config.get('count', 50)
        category_distribution = config.get('voiceConfig', {}).get('categories', {})
        
        # 使用默认分布如果没有指定
        if not category_distribution:
            category_distribution = {cat: info['weight'] for cat, info in self.voice_categories.items()}
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            generated_count = 0
            
            for i in range(count):
                # 选择分类
                category = self.weighted_choice(category_distribution)
                category_info = self.voice_categories[category]
                
                # 生成内容
                template = random.choice(category_info['templates'])
                content = self.fill_template(template, category)
                
                # 选择标签
                tags = random.sample(category_info['tags'], random.randint(2, 4))
                
                # 生成情感评分
                emotion_min, emotion_max = category_info['emotion_range']
                emotion_score = random.randint(emotion_min, emotion_max)
                
                # 生成点赞数
                like_count = self.generate_like_count('voice')
                
                # 插入数据
                insert_query = """
                INSERT INTO heart_voices 
                (content, category, tags, emotion_score, like_count, dislike_count, 
                 view_count, is_anonymous, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (
                    content,
                    category,
                    json.dumps(tags),
                    emotion_score,
                    like_count,
                    random.randint(0, max(1, like_count // 10)),  # dislike_count
                    random.randint(like_count, like_count * 5),   # view_count
                    True,
                    'approved',
                    datetime.now() - timedelta(days=random.randint(0, 30))
                ))
                
                generated_count += 1
            
            conn.commit()
            
            return {
                'success': True,
                'message': f'成功生成{generated_count}条智能心声数据',
                'data': {
                    'generated_count': generated_count,
                    'category_distribution': category_distribution
                }
            }
            
        except Error as e:
            conn.rollback()
            return {
                'success': False,
                'message': f'生成心声数据失败: {str(e)}'
            }
        finally:
            cursor.close()
            conn.close()

    def generate_smart_story_data(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """生成智能故事数据"""
        count = config.get('count', 30)
        category_distribution = config.get('storyConfig', {}).get('categories', {})
        
        # 使用默认分布如果没有指定
        if not category_distribution:
            category_distribution = {cat: info['weight'] for cat, info in self.story_categories.items()}
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            generated_count = 0
            
            for i in range(count):
                # 选择分类
                category = self.weighted_choice(category_distribution)
                category_info = self.story_categories[category]
                
                # 生成标题和内容
                template = random.choice(category_info['templates'])
                title = self.fill_template(template['title'], category)
                content = self.fill_template(template['content'], category)
                
                # 确保内容长度合适
                min_length, max_length = template['length_range']
                if len(content) < min_length:
                    content += self.generate_additional_content(category, min_length - len(content))
                elif len(content) > max_length:
                    content = content[:max_length] + "..."
                
                # 选择标签
                tags = random.sample(category_info['tags'], random.randint(3, 5))
                
                # 生成互动数据
                like_count = self.generate_like_count('story')
                view_count = random.randint(like_count * 2, like_count * 10)
                
                # 插入数据
                insert_query = """
                INSERT INTO stories 
                (title, content, category, tags, like_count, dislike_count, 
                 view_count, comment_count, is_featured, is_published, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (
                    title,
                    content,
                    category,
                    json.dumps(tags),
                    like_count,
                    random.randint(0, max(1, like_count // 15)),  # dislike_count
                    view_count,
                    random.randint(0, like_count // 3),          # comment_count
                    random.random() < 0.1,                      # is_featured (10%)
                    True,
                    'approved',
                    datetime.now() - timedelta(days=random.randint(0, 60))
                ))
                
                generated_count += 1
            
            conn.commit()
            
            return {
                'success': True,
                'message': f'成功生成{generated_count}条智能故事数据',
                'data': {
                    'generated_count': generated_count,
                    'category_distribution': category_distribution
                }
            }
            
        except Error as e:
            conn.rollback()
            return {
                'success': False,
                'message': f'生成故事数据失败: {str(e)}'
            }
        finally:
            cursor.close()
            conn.close()

    def weighted_choice(self, weights: Dict[str, float]) -> str:
        """根据权重选择"""
        items = list(weights.keys())
        weights_list = list(weights.values())
        return random.choices(items, weights=weights_list)[0]

    def generate_like_count(self, content_type: str) -> int:
        """生成符合分布的点赞数"""
        distribution = self.like_distributions[content_type]
        
        # 根据概率选择分布类型
        rand = random.random()
        cumulative = 0
        
        for dist_type, config in distribution.items():
            cumulative += config['probability']
            if rand <= cumulative:
                min_likes, max_likes = config['range']
                return random.randint(min_likes, max_likes)
        
        # 默认返回normal范围
        return random.randint(1, 10)

    def fill_template(self, template: str, category: str) -> str:
        """填充模板变量"""
        # 简单的模板变量替换
        variables = {
            'feature': random.choice(self.content_variables['features']),
            'aspect': random.choice(self.content_variables['aspects']),
            'benefit': random.choice(self.content_variables['benefits']),
            'area': random.choice(self.content_variables['areas']),
            'background': random.choice(self.content_variables['backgrounds']),
            'company': random.choice(self.content_variables['companies']),
            'duration': random.choice(self.content_variables['durations']),
            'field': random.choice(self.content_variables['fields']),
            'old_field': random.choice(self.content_variables['fields']),
            'new_field': random.choice(self.content_variables['fields']),
            'company_type': random.choice(['大厂', '外企', '国企', '创业公司']),
            'target_group': random.choice(['学弟学妹', '求职者', '应届生', '转行人士']),
            'period': random.choice(['这一年', '毕业后', '工作以来', '最近']),
            'timeframe': random.choice(['过去一年', '这段时间', '毕业至今', '工作期间'])
        }
        
        # 添加更多具体内容
        for key, value in variables.items():
            template = template.replace(f'{{{key}}}', value)
        
        return template

    def generate_additional_content(self, category: str, target_length: int) -> str:
        """生成额外内容以达到目标长度"""
        additional_sentences = [
            "这个经历让我学到了很多。",
            "希望我的分享对大家有帮助。",
            "每个人的情况不同，仅供参考。",
            "如果有问题欢迎交流讨论。",
            "感谢大家的阅读和支持。"
        ]
        
        content = ""
        while len(content) < target_length:
            content += " " + random.choice(additional_sentences)
        
        return content[:target_length]
