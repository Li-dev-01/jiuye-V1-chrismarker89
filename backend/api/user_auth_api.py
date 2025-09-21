#!/usr/bin/env python3
"""
用户认证API服务
处理半匿名用户和匿名用户的认证
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import uuid
import time
import json
import re
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# 测试用的A+B组合
TEST_COMBINATIONS = [
    {"a": "12345678901", "b": "1234", "name": "测试用户1"},
    {"a": "98765432109", "b": "5678", "name": "测试用户2"},
    {"a": "11111111111", "b": "0000", "name": "测试用户3"},
    {"a": "13800138000", "b": "1234", "name": "手机号测试"},
    {"a": "15912345678", "b": "5678", "name": "手机号测试2"}
]

# 内存存储（生产环境应使用数据库）
users_db = {}
sessions_db = {}

def validate_ab_format(identity_a, identity_b):
    """验证A+B格式"""
    if not identity_a or not identity_b:
        return False, "A值和B值不能为空"
    
    if not re.match(r'^\d{11}$', identity_a):
        return False, "A值必须是11位数字"
    
    if not re.match(r'^(\d{4}|\d{6})$', identity_b):
        return False, "B值必须是4位或6位数字"
    
    return True, ""

def generate_identity_hash(identity_a, identity_b):
    """生成身份哈希"""
    combined = f"{identity_a}:{identity_b}"
    return hashlib.sha256(combined.encode()).hexdigest()

def generate_user_uuid(identity_hash):
    """生成用户UUID"""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, identity_hash))

def is_test_combination(identity_a, identity_b):
    """检查是否为测试组合"""
    for combo in TEST_COMBINATIONS:
        if combo["a"] == identity_a and combo["b"] == identity_b:
            return True, combo["name"]
    return False, None

@app.route('/api/uuid/auth/semi-anonymous', methods=['POST'])
def auth_semi_anonymous():
    """半匿名用户认证"""
    try:
        data = request.get_json()
        identity_a = data.get('identityA')
        identity_b = data.get('identityB')
        device_info = data.get('deviceInfo', {})
        
        # 验证A+B格式
        is_valid, error_msg = validate_ab_format(identity_a, identity_b)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': error_msg
            }), 400
        
        # 检查是否为测试组合
        is_test, test_name = is_test_combination(identity_a, identity_b)
        if not is_test:
            return jsonify({
                'success': False,
                'error': 'Authentication Failed',
                'message': '无效的A+B组合，请使用测试账号'
            }), 401
        
        # 生成身份标识
        identity_hash = generate_identity_hash(identity_a, identity_b)
        user_uuid = generate_user_uuid(identity_hash)
        
        # 创建或获取用户
        if user_uuid not in users_db:
            users_db[user_uuid] = {
                'uuid': user_uuid,
                'userType': 'semi_anonymous',
                'identityHash': identity_hash,
                'displayName': f'半匿名用户_{test_name}',
                'role': 'semi_anonymous',
                'permissions': [
                    'browse_content',
                    'submit_questionnaire',
                    'manage_own_content',
                    'download_content',
                    'delete_own_content'
                ],
                'profile': {
                    'language': 'zh-CN',
                    'timezone': 'Asia/Shanghai',
                    'notifications': {'email': False, 'push': False, 'sms': False},
                    'privacy': {'showProfile': False, 'allowTracking': False, 'dataRetention': 30}
                },
                'metadata': {
                    'loginCount': 0,
                    'contentStats': {
                        'totalSubmissions': 0,
                        'approvedSubmissions': 0,
                        'rejectedSubmissions': 0,
                        'downloads': 0
                    },
                    'securityFlags': {
                        'isSuspicious': False,
                        'failedLoginAttempts': 0,
                        'twoFactorEnabled': False
                    }
                },
                'status': 'active',
                'createdAt': datetime.now().isoformat(),
                'lastLoginAt': datetime.now().isoformat()
            }
        
        # 更新登录信息
        user = users_db[user_uuid]
        user['metadata']['loginCount'] += 1
        user['lastLoginAt'] = datetime.now().isoformat()
        
        # 创建会话
        session_id = str(uuid.uuid4())
        session = {
            'sessionId': session_id,
            'userId': user_uuid,
            'userType': 'semi_anonymous',
            'createdAt': datetime.now().isoformat(),
            'expiresAt': (datetime.now() + timedelta(days=30)).isoformat(),
            'isActive': True,
            'deviceInfo': device_info,
            'permissions': user['permissions']
        }
        
        sessions_db[session_id] = session
        
        return jsonify({
            'success': True,
            'data': {
                'user': user,
                'session': session
            },
            'message': '半匿名认证成功'
        })
        
    except Exception as e:
        print(f"半匿名认证错误: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': '认证失败，请稍后重试'
        }), 500

@app.route('/api/uuid/auth/anonymous', methods=['POST'])
def auth_anonymous():
    """全匿名用户认证"""
    try:
        data = request.get_json()
        device_info = data.get('deviceInfo', {})
        
        # 生成匿名用户UUID
        user_uuid = str(uuid.uuid4())
        
        # 创建匿名用户
        user = {
            'uuid': user_uuid,
            'userType': 'anonymous',
            'displayName': f'匿名用户_{user_uuid[-8:]}',
            'role': 'anonymous',
            'permissions': [
                'browse_content'
            ],
            'profile': {
                'language': 'zh-CN',
                'timezone': 'Asia/Shanghai'
            },
            'metadata': {
                'sessionCount': 1
            },
            'status': 'active',
            'createdAt': datetime.now().isoformat()
        }
        
        users_db[user_uuid] = user
        
        # 创建会话
        session_id = str(uuid.uuid4())
        session = {
            'sessionId': session_id,
            'userId': user_uuid,
            'userType': 'anonymous',
            'createdAt': datetime.now().isoformat(),
            'expiresAt': (datetime.now() + timedelta(hours=24)).isoformat(),
            'isActive': True,
            'deviceInfo': device_info,
            'permissions': user['permissions']
        }
        
        sessions_db[session_id] = session
        
        return jsonify({
            'success': True,
            'data': {
                'user': user,
                'session': session
            },
            'message': '匿名认证成功'
        })
        
    except Exception as e:
        print(f"匿名认证错误: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': '认证失败，请稍后重试'
        }), 500

@app.route('/api/uuid/test-combinations', methods=['GET'])
def get_test_combinations():
    """获取测试A+B组合"""
    return jsonify({
        'success': True,
        'data': TEST_COMBINATIONS,
        'message': '获取测试组合成功'
    })

@app.route('/api/uuid/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """获取会话信息"""
    session = sessions_db.get(session_id)
    if not session:
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': '会话不存在'
        }), 404
    
    # 检查会话是否过期
    expires_at = datetime.fromisoformat(session['expiresAt'])
    if datetime.now() > expires_at:
        session['isActive'] = False
        return jsonify({
            'success': False,
            'error': 'Session Expired',
            'message': '会话已过期'
        }), 401
    
    return jsonify({
        'success': True,
        'data': session,
        'message': '获取会话成功'
    })

@app.route('/api/uuid/users/statistics', methods=['GET'])
def get_user_statistics():
    """获取用户统计"""
    total_users = len(users_db)
    anonymous_users = len([u for u in users_db.values() if u['userType'] == 'anonymous'])
    semi_anonymous_users = len([u for u in users_db.values() if u['userType'] == 'semi_anonymous'])
    active_sessions = len([s for s in sessions_db.values() if s['isActive']])
    
    return jsonify({
        'success': True,
        'data': {
            'totalUsers': total_users,
            'anonymousUsers': anonymous_users,
            'semiAnonymousUsers': semi_anonymous_users,
            'activeUsers': active_sessions
        },
        'message': '获取用户统计成功'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'service': 'User Auth API',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🔐 Starting User Authentication API Server...")
    print("🎯 Features:")
    print("   • Semi-anonymous user authentication (A+B)")
    print("   • Anonymous user authentication")
    print("   • Session management")
    print("   • User statistics")
    print("")
    print("🔌 Available endpoints:")
    print("   POST /api/uuid/auth/semi-anonymous - Semi-anonymous auth")
    print("   POST /api/uuid/auth/anonymous - Anonymous auth")
    print("   GET  /api/uuid/test-combinations - Get test A+B combinations")
    print("   GET  /api/uuid/session/<id> - Get session info")
    print("   GET  /api/uuid/users/statistics - Get user statistics")
    print("")
    print("🌐 Server running on: http://localhost:8008")
    print("📝 CORS enabled for frontend integration")
    print("")
    print("🧪 Test A+B combinations:")
    for combo in TEST_COMBINATIONS:
        print(f"   • {combo['name']}: A={combo['a']}, B={combo['b']}")
    print("")

    app.run(host='0.0.0.0', port=8008, debug=True)
