#!/usr/bin/env python3
"""
创建测试审核员用户
"""

import mysql.connector
import json
from datetime import datetime

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'questionnaire_db',
    'charset': 'utf8mb4',
    'autocommit': True
}

def create_test_reviewers():
    """创建测试审核员用户"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # 检查是否已存在审核员
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE user_type = 'reviewer'")
        existing_count = cursor.fetchone()['count']
        
        if existing_count > 0:
            print(f"已存在 {existing_count} 个审核员用户")
            cursor.execute("SELECT user_uuid, username, nickname FROM users WHERE user_type = 'reviewer'")
            reviewers = cursor.fetchall()
            for reviewer in reviewers:
                print(f"  - {reviewer['username']} ({reviewer['nickname']}) - UUID: {reviewer['user_uuid']}")
            return
        
        # 创建测试审核员
        reviewers_data = [
            {
                'user_uuid': 'rev-550e8400-e29b-41d4-a716-446655440001',
                'username': 'reviewerA',
                'nickname': '审核员A',
                'email': 'reviewerA@example.com'
            },
            {
                'user_uuid': 'rev-550e8400-e29b-41d4-a716-446655440002',
                'username': 'reviewerB',
                'nickname': '审核员B',
                'email': 'reviewerB@example.com'
            }
        ]
        
        for reviewer in reviewers_data:
            cursor.execute("""
                INSERT INTO users (user_uuid, user_type, username, nickname, email, status, permissions, profile_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                reviewer['user_uuid'],
                'reviewer',
                reviewer['username'],
                reviewer['nickname'],
                reviewer['email'],
                'active',
                json.dumps([
                    "browse_content",
                    "review_content", 
                    "approve_content",
                    "reject_content",
                    "view_review_stats",
                    "manage_review_queue"
                ]),
                json.dumps({
                    "language": "zh-CN",
                    "timezone": "Asia/Shanghai",
                    "notifications": {
                        "email": False,
                        "push": True,
                        "sms": False
                    },
                    "privacy": {
                        "showProfile": False,
                        "allowTracking": False,
                        "dataRetention": 30
                    }
                })
            ))
            print(f"创建审核员: {reviewer['username']} ({reviewer['nickname']})")
        
        print(f"成功创建 {len(reviewers_data)} 个测试审核员用户")
        
    except Exception as e:
        print(f"创建审核员失败: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    create_test_reviewers()
