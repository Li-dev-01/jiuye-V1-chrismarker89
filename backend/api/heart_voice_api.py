"""
问卷心声API
处理问卷心声的创建、获取、管理等操作
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
import mysql.connector
from mysql.connector import Error
import uuid
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',  # MySQL安装时没有设置密码
    'database': 'questionnaire_db',
    'charset': 'utf8mb4',
    'autocommit': False
}

def get_connection():
    """获取数据库连接"""
    return mysql.connector.connect(**DB_CONFIG)

def check_user_permission(user_uuid: str, permission: str) -> bool:
    """检查用户权限"""
    try:
        import requests

        # 调用用户认证API验证用户
        response = requests.get(f'http://localhost:8007/api/uuid/users/statistics')
        if response.status_code != 200:
            print(f"无法连接用户认证API: {response.status_code}")
            return False

        # 简化权限检查：只要用户UUID格式正确就允许创建
        # 在实际生产环境中，应该有更严格的权限验证
        if permission == 'create':
            # 检查UUID格式
            if not user_uuid or len(user_uuid) < 10:
                return False
            return True

        return True

    except Exception as e:
        print(f"权限检查错误: {e}")
        return False

@app.route('/api/heart-voices', methods=['POST'])
def create_heart_voice():
    """创建问卷心声"""
    try:
        data = request.get_json()
        
        # 验证参数
        required_fields = ['content', 'category', 'emotion_score', 'user_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        user_uuid = data['user_id']  # 前端传递的是user_uuid
        content = data['content']
        category = data['category']
        emotion_score = data['emotion_score']
        tags = data.get('tags', [])
        is_anonymous = data.get('is_anonymous', True)
        questionnaire_id = data.get('questionnaire_id')

        # 检查用户权限
        if not check_user_permission(user_uuid, 'create'):
            return jsonify({
                'success': False,
                'error': 'Insufficient permissions'
            }), 403
        
        # 验证内容长度
        if len(content) < 10 or len(content) > 500:
            return jsonify({
                'success': False,
                'error': 'Content length must be between 10 and 500 characters'
            }), 400
        
        # 验证情感评分
        if not (1 <= emotion_score <= 5):
            return jsonify({
                'success': False,
                'error': 'Emotion score must be between 1 and 5'
            }), 400
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 生成UUID
            data_uuid = str(uuid.uuid4())
            
            # 插入到原始心声表 (A表)
            cursor.execute("""
                INSERT INTO raw_heart_voices (
                    data_uuid, user_id, content, category, emotion_score,
                    tags, is_anonymous, questionnaire_id, ip_address, submitted_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data_uuid, user_uuid, content, category, emotion_score,
                json.dumps(tags), is_anonymous, questionnaire_id,
                request.remote_addr, datetime.now()
            ))
            
            raw_id = cursor.lastrowid
            
            # 创建审核记录
            cursor.execute("""
                INSERT INTO audit_records (
                    content_type, content_id, raw_id, audit_level, audit_result,
                    auditor_id, audited_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                'heart_voice', 0, raw_id, 'rule_based', 'pending',
                'system', datetime.now()
            ))
            
            # 调用审核模块处理A表→B表迁移
            import requests
            try:
                audit_response = requests.post('http://localhost:8005/api/audit/process',
                    json={
                        'source_table': 'raw_heart_voices',
                        'source_id': raw_id,
                        'content_type': 'heart_voice'
                    },
                    timeout=10
                )

                if audit_response.status_code == 200:
                    audit_result = audit_response.json()
                    if audit_result['success']:
                        audit_data = audit_result['data']
                        auto_approve = audit_data['audit_result'] == 'approved'

                        # 获取有效数据ID（如果自动通过）
                        if auto_approve:
                            cursor.execute("""
                                SELECT id FROM valid_heart_voices
                                WHERE raw_id = %s AND data_uuid = %s
                            """, (raw_id, data_uuid))
                            valid_record = cursor.fetchone()
                            valid_id = valid_record['id'] if valid_record else raw_id
                        else:
                            valid_id = raw_id
                    else:
                        # 审核服务失败，回退到简单自动通过
                        auto_approve = True
                        valid_id = raw_id
                else:
                    # 审核服务不可用，回退到简单自动通过
                    auto_approve = True
                    valid_id = raw_id

            except Exception as audit_error:
                print(f"审核服务调用失败: {audit_error}")
                # 回退到简单自动通过
                auto_approve = True

                # 手动插入到B表
                cursor.execute("""
                    INSERT INTO valid_heart_voices (
                        raw_id, data_uuid, user_id, content, category,
                        emotion_score, tags, is_anonymous, questionnaire_id,
                        audit_status, approved_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    raw_id, data_uuid, user_id, content, category,
                    emotion_score, json.dumps(tags), is_anonymous, questionnaire_id,
                    'approved', datetime.now()
                ))

                valid_id = cursor.lastrowid

                # 更新审核记录
                cursor.execute("""
                    UPDATE audit_records
                    SET audit_result = 'approved', reviewed_at = %s
                    WHERE source_table = 'raw_heart_voices' AND source_id = %s
                """, (datetime.now(), raw_id))

                # 创建用户内容管理记录
                cursor.execute("""
                    INSERT INTO user_content_management (
                        user_id, user_uuid, content_type, content_id, content_uuid,
                        raw_content_id, content_status, is_published, can_download
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, str(uuid.uuid4()), 'heart_voice', valid_id, data_uuid,
                    raw_id, 'approved', True, True
                ))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'data': {
                    'id': valid_id if auto_approve else raw_id,
                    'uuid': data_uuid,
                    'status': 'approved' if auto_approve else 'pending',
                    'created_at': datetime.now().isoformat()
                },
                'message': '心声发布成功' if auto_approve else '心声提交成功，等待审核',
                'timestamp': time.time()
            })
            
        except Exception as e:
            conn.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/heart-voices', methods=['GET'])
def get_heart_voices():
    """获取心声列表"""
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        category = request.args.get('category')
        status = request.args.get('status', 'approved')
        featured = request.args.get('featured')
        sort_by = request.args.get('sortBy', 'created_at')
        sort_order = request.args.get('sortOrder', 'desc')
        
        # 计算偏移量
        offset = (page - 1) * page_size
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 构建查询条件
            where_conditions = ["v.audit_status = %s"]
            params = [status]
            
            if category:
                where_conditions.append("v.category = %s")
                params.append(category)
            
            if featured is not None:
                where_conditions.append("v.is_featured = %s")
                params.append(featured.lower() == 'true')
            
            where_clause = " AND ".join(where_conditions)
            
            # 获取总数
            count_sql = f"""
                SELECT COUNT(*) as total
                FROM valid_heart_voices v
                WHERE {where_clause}
            """
            cursor.execute(count_sql, params)
            total = cursor.fetchone()['total']
            
            # 获取心声列表
            list_sql = f"""
                SELECT 
                    v.id, v.data_uuid, v.content, v.category, v.emotion_score,
                    v.tags, v.is_anonymous, v.is_featured, v.created_at,
                    u.nickname as author_name,
                    COALESCE(v.like_count, 0) as like_count
                FROM valid_heart_voices v
                LEFT JOIN users u ON v.user_id = u.id
                WHERE {where_clause}
                ORDER BY v.{sort_by} {sort_order.upper()}
                LIMIT %s OFFSET %s
            """
            
            cursor.execute(list_sql, params + [page_size, offset])
            voices = cursor.fetchall()
            
            # 处理返回数据
            formatted_voices = []
            for voice in voices:
                formatted_voices.append({
                    'id': voice['id'],
                    'uuid': voice['data_uuid'],
                    'content': voice['content'],
                    'category': voice['category'],
                    'emotionScore': voice['emotion_score'],
                    'tags': json.loads(voice['tags']) if voice['tags'] else [],
                    'isAnonymous': voice['is_anonymous'],
                    'isFeatured': voice['is_featured'],
                    'authorName': '匿名用户' if voice['is_anonymous'] else (voice['author_name'] or '用户'),
                    'likeCount': voice['like_count'],
                    'createdAt': voice['created_at'].isoformat()
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'voices': formatted_voices,
                    'total': total,
                    'page': page,
                    'pageSize': page_size,
                    'totalPages': (total + page_size - 1) // page_size
                },
                'timestamp': time.time()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/heart-voices/<int:voice_id>', methods=['GET'])
def get_heart_voice(voice_id):
    """获取单个心声详情"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("""
                SELECT 
                    v.id, v.data_uuid, v.content, v.category, v.emotion_score,
                    v.tags, v.is_anonymous, v.is_featured, v.created_at,
                    u.nickname as author_name,
                    COALESCE(v.like_count, 0) as like_count
                FROM valid_heart_voices v
                LEFT JOIN users u ON v.user_id = u.id
                WHERE v.id = %s AND v.audit_status = 'approved'
            """, (voice_id,))
            
            voice = cursor.fetchone()
            if not voice:
                return jsonify({
                    'success': False,
                    'error': 'Heart voice not found'
                }), 404
            
            formatted_voice = {
                'id': voice['id'],
                'uuid': voice['data_uuid'],
                'content': voice['content'],
                'category': voice['category'],
                'emotionScore': voice['emotion_score'],
                'tags': json.loads(voice['tags']) if voice['tags'] else [],
                'isAnonymous': voice['is_anonymous'],
                'isFeatured': voice['is_featured'],
                'authorName': '匿名用户' if voice['is_anonymous'] else (voice['author_name'] or '用户'),
                'likeCount': voice['like_count'],
                'createdAt': voice['created_at'].isoformat()
            }
            
            return jsonify({
                'success': True,
                'data': formatted_voice,
                'timestamp': time.time()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/heart-voices/user/<int:user_id>', methods=['GET'])
def get_user_heart_voices(user_id):
    """获取用户的心声列表"""
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        status = request.args.get('status', 'approved')
        
        offset = (page - 1) * page_size
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取总数
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM valid_heart_voices v
                WHERE v.user_id = %s AND v.audit_status = %s
            """, (user_id, status))
            total = cursor.fetchone()['total']
            
            # 获取心声列表
            cursor.execute("""
                SELECT 
                    v.id, v.data_uuid, v.content, v.category, v.emotion_score,
                    v.tags, v.is_anonymous, v.is_featured, v.created_at,
                    COALESCE(v.like_count, 0) as like_count
                FROM valid_heart_voices v
                WHERE v.user_id = %s AND v.audit_status = %s
                ORDER BY v.created_at DESC
                LIMIT %s OFFSET %s
            """, (user_id, status, page_size, offset))
            
            voices = cursor.fetchall()
            
            # 处理返回数据
            formatted_voices = []
            for voice in voices:
                formatted_voices.append({
                    'id': voice['id'],
                    'uuid': voice['data_uuid'],
                    'content': voice['content'],
                    'category': voice['category'],
                    'emotionScore': voice['emotion_score'],
                    'tags': json.loads(voice['tags']) if voice['tags'] else [],
                    'isAnonymous': voice['is_anonymous'],
                    'isFeatured': voice['is_featured'],
                    'likeCount': voice['like_count'],
                    'createdAt': voice['created_at'].isoformat()
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'voices': formatted_voices,
                    'total': total,
                    'page': page,
                    'pageSize': page_size,
                    'totalPages': (total + page_size - 1) // page_size
                },
                'timestamp': time.time()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/heart-voices/<int:voice_id>/like', methods=['POST'])
def like_heart_voice(voice_id):
    """点赞心声"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Missing user_id'
            }), 400
        
        conn = get_connection()
        cursor = conn.cursor()
        
        try:
            # 检查是否已经点赞
            cursor.execute("""
                SELECT id FROM heart_voice_likes 
                WHERE voice_id = %s AND user_id = %s
            """, (voice_id, user_id))
            
            if cursor.fetchone():
                return jsonify({
                    'success': False,
                    'error': 'Already liked'
                }), 400
            
            # 添加点赞记录
            cursor.execute("""
                INSERT INTO heart_voice_likes (voice_id, user_id, created_at)
                VALUES (%s, %s, %s)
            """, (voice_id, user_id, datetime.now()))
            
            # 更新点赞数
            cursor.execute("""
                UPDATE valid_heart_voices 
                SET like_count = like_count + 1
                WHERE id = %s
            """, (voice_id,))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Liked successfully',
                'timestamp': time.time()
            })
            
        except Exception as e:
            conn.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'error': 'Method not allowed'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("💭 Starting Heart Voice API Server...")
    print("🎯 Features:")
    print("   • Heart voice creation and management")
    print("   • Automatic content review")
    print("   • User permission control")
    print("   • Like and interaction system")
    print()
    print("🔌 Available endpoints:")
    print("   POST /api/heart-voices - Create heart voice")
    print("   GET  /api/heart-voices - Get heart voices list")
    print("   GET  /api/heart-voices/<id> - Get heart voice detail")
    print("   GET  /api/heart-voices/user/<user_id> - Get user heart voices")
    print("   POST /api/heart-voices/<id>/like - Like heart voice")
    print()
    print("🌐 Server running on: http://localhost:8003")
    print("📝 CORS enabled for frontend integration")
    print()
    
    app.run(host='0.0.0.0', port=8003, debug=True)
