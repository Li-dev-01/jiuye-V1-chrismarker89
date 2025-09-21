"""
UUID生成工具
支持包含日期时间的UUID格式，便于统计和追踪
"""

import uuid
import random
import string
from datetime import datetime
from typing import Literal

UserType = Literal['admin', 'reviewer', 'semi_anonymous', 'full_anonymous']

class UUIDGenerator:
    """UUID生成器类"""
    
    @staticmethod
    def generate_user_uuid(user_type: UserType) -> str:
        """
        生成用户UUID
        格式: {type}-{YYYYMMDD}-{HHMMSS}-{random}
        
        Args:
            user_type: 用户类型
            
        Returns:
            str: 生成的UUID
            
        Examples:
            admin: 'adm-20250801-143022-abc123'
            reviewer: 'rev-20250801-143022-def456'  
            semi_anonymous: 'sa-20250801-143022-ghi789'
            full_anonymous: 'fa-20250801-143022-jkl012'
        """
        now = datetime.now()
        date_str = now.strftime('%Y%m%d')
        time_str = now.strftime('%H%M%S')
        
        # 生成6位随机字符串
        random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        
        # 用户类型前缀映射
        type_prefixes = {
            'admin': 'adm',
            'reviewer': 'rev',
            'semi_anonymous': 'sa',
            'full_anonymous': 'fa'
        }
        
        prefix = type_prefixes.get(user_type, 'unk')
        
        return f"{prefix}-{date_str}-{time_str}-{random_str}"
    
    @staticmethod
    def parse_user_uuid(user_uuid: str) -> dict:
        """
        解析用户UUID，提取信息
        
        Args:
            user_uuid: 用户UUID
            
        Returns:
            dict: 解析结果
        """
        try:
            parts = user_uuid.split('-')
            if len(parts) != 4:
                return {'valid': False, 'error': 'Invalid UUID format'}
            
            prefix, date_str, time_str, random_str = parts
            
            # 解析用户类型
            type_mapping = {
                'adm': 'admin',
                'rev': 'reviewer',
                'sa': 'semi_anonymous',
                'fa': 'full_anonymous'
            }
            
            user_type = type_mapping.get(prefix, 'unknown')
            
            # 解析日期时间
            try:
                creation_date = datetime.strptime(f"{date_str}{time_str}", '%Y%m%d%H%M%S')
            except ValueError:
                return {'valid': False, 'error': 'Invalid date/time format'}
            
            return {
                'valid': True,
                'user_type': user_type,
                'creation_date': creation_date,
                'date_str': date_str,
                'time_str': time_str,
                'random_str': random_str,
                'prefix': prefix
            }
            
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    
    @staticmethod
    def get_daily_user_count_query(date_str: str, user_type: UserType = None) -> str:
        """
        生成查询指定日期新增用户数量的SQL
        
        Args:
            date_str: 日期字符串 (YYYYMMDD)
            user_type: 用户类型（可选）
            
        Returns:
            str: SQL查询语句
        """
        base_query = f"SELECT COUNT(*) FROM users WHERE user_uuid LIKE '%{date_str}%'"
        
        if user_type:
            type_prefixes = {
                'admin': 'adm',
                'reviewer': 'rev',
                'semi_anonymous': 'sa',
                'full_anonymous': 'fa'
            }
            prefix = type_prefixes.get(user_type, 'unk')
            base_query += f" AND user_uuid LIKE '{prefix}-%'"
        
        return base_query
    
    @staticmethod
    def generate_session_id() -> str:
        """
        生成会话ID
        
        Returns:
            str: 会话ID
        """
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_content_id(content_type: str) -> str:
        """
        生成内容ID
        
        Args:
            content_type: 内容类型 (heart_voice, story, questionnaire)
            
        Returns:
            str: 内容ID
        """
        now = datetime.now()
        date_str = now.strftime('%Y%m%d')
        time_str = now.strftime('%H%M%S')
        random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        
        type_prefixes = {
            'heart_voice': 'hv',
            'story': 'st',
            'questionnaire': 'qn'
        }
        
        prefix = type_prefixes.get(content_type, 'ct')
        
        return f"{prefix}-{date_str}-{time_str}-{random_str}"

# 使用示例和测试
if __name__ == "__main__":
    # 测试UUID生成
    print("=== UUID生成测试 ===")
    
    user_types = ['admin', 'reviewer', 'semi_anonymous', 'full_anonymous']
    
    for user_type in user_types:
        uuid_str = UUIDGenerator.generate_user_uuid(user_type)
        print(f"{user_type}: {uuid_str}")
        
        # 测试解析
        parsed = UUIDGenerator.parse_user_uuid(uuid_str)
        if parsed['valid']:
            print(f"  解析结果: {parsed['user_type']}, 创建时间: {parsed['creation_date']}")
        else:
            print(f"  解析失败: {parsed['error']}")
        print()
    
    # 测试查询生成
    print("=== 查询生成测试 ===")
    today = datetime.now().strftime('%Y%m%d')
    
    print("今日所有新增用户:")
    print(UUIDGenerator.get_daily_user_count_query(today))
    
    print("\n今日新增审核员:")
    print(UUIDGenerator.get_daily_user_count_query(today, 'reviewer'))
    
    # 测试其他ID生成
    print("\n=== 其他ID生成测试 ===")
    print(f"会话ID: {UUIDGenerator.generate_session_id()}")
    print(f"心声ID: {UUIDGenerator.generate_content_id('heart_voice')}")
    print(f"故事ID: {UUIDGenerator.generate_content_id('story')}")
