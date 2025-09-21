"""
审核员API
为现有审核员页面提供数据接口，连接三层审核系统
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

def check_reviewer_permission(user_id) -> bool:
    """检查审核员权限"""
    # 支持预置审核员账号
    preset_reviewers = ['reviewerA', 'reviewerB', 'reviewerC']
    preset_admins = ['admin', 'superadmin']

    # 如果是预置审核员账号
    if isinstance(user_id, str) and user_id in preset_reviewers:
        return True

    # 如果是预置管理员账号
    if isinstance(user_id, str) and user_id in preset_admins:
        return True

    # 对于数据库用户，进行数据库查询
    if isinstance(user_id, int):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT user_type
                FROM users
                WHERE id = %s AND status = 'active'
            """, (user_id,))

            user = cursor.fetchone()
            if not user:
                return False

            # 检查是否是审核员或管理员
            return user['user_type'] in ['reviewer', 'admin']

        except Exception as e:
            print(f"权限检查错误: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    # 其他情况返回False
    return False

@app.route('/api/reviewer/pending-reviews', methods=['GET'])
def get_pending_reviews():
    """获取待人工审核的内容列表（第三层审核）"""
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        content_type = request.args.get('content_type')  # 'heart_voice', 'story', 'questionnaire'
        
        offset = (page - 1) * page_size
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 构建查询条件 - 只获取需要人工审核的内容
            where_conditions = ["ar.audit_result = 'pending'"]
            params = []

            if content_type:
                if content_type == 'heart_voice' or content_type == 'voice':
                    where_conditions.append("ar.content_type = 'heart_voice'")
                elif content_type == 'story':
                    where_conditions.append("ar.content_type = 'story'")

            where_clause = " AND ".join(where_conditions)
            
            # 获取总数
            count_sql = f"""
                SELECT COUNT(*) as total
                FROM audit_records ar
                WHERE {where_clause}
            """
            cursor.execute(count_sql, params)
            total = cursor.fetchone()['total']
            
            # 获取待审核列表
            list_sql = f"""
                SELECT
                    ar.id as audit_id, ar.content_type, ar.content_id, ar.raw_id,
                    ar.audit_level, ar.audit_result, ar.audit_score,
                    ar.audit_reason, ar.audited_at
                FROM audit_records ar
                WHERE {where_clause}
                ORDER BY ar.audited_at ASC
                LIMIT %s OFFSET %s
            """
            
            cursor.execute(list_sql, params + [page_size, offset])
            audits = cursor.fetchall()
            
            # 获取详细内容并格式化
            formatted_reviews = []
            for audit in audits:
                review_item = format_review_item(cursor, audit)
                if review_item:
                    formatted_reviews.append(review_item)
            
            return jsonify({
                'success': True,
                'data': {
                    'reviews': formatted_reviews,
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

def format_review_item(cursor, audit_record):
    """格式化审核项目为审核员页面需要的格式"""
    try:
        content_type = audit_record['content_type']
        raw_id = audit_record['raw_id']

        # 根据内容类型获取原始内容
        if content_type == 'heart_voice':
            cursor.execute("""
                SELECT rhv.*, u.username, u.nickname
                FROM raw_heart_voices rhv
                LEFT JOIN users u ON rhv.user_id = u.id
                WHERE rhv.id = %s
            """, (raw_id,))
            raw_data = cursor.fetchone()
            
            if not raw_data:
                return None
                
            return {
                'id': f"voice_{raw_id}",
                'auditId': audit_record['audit_id'],
                'type': 'voice',
                'userId': raw_data['user_id'],
                'username': raw_data['username'] or raw_data['nickname'] or '匿名用户',
                'content': raw_data['content'],
                'category': raw_data['category'],
                'mood': get_mood_from_emotion_score(raw_data.get('emotion_score', 3)),
                'rating': raw_data.get('emotion_score', 3),
                'submittedAt': raw_data['submitted_at'].isoformat(),
                'status': 'pending',
                'auditDetails': {'reason': audit_record['audit_reason']} if audit_record['audit_reason'] else {},
                'confidenceScore': float(audit_record['audit_score']) if audit_record['audit_score'] else 0.5
            }
            
        elif content_type == 'story':
            cursor.execute("""
                SELECT rss.*, u.username, u.nickname
                FROM raw_story_submissions rss
                LEFT JOIN users u ON rss.user_id = u.id
                WHERE rss.id = %s
            """, (raw_id,))
            raw_data = cursor.fetchone()
            
            if not raw_data:
                return None
                
            return {
                'id': f"story_{raw_id}",
                'auditId': audit_record['audit_id'],
                'type': 'story',
                'userId': raw_data['user_id'],
                'username': raw_data['username'] or raw_data['nickname'] or '匿名用户',
                'title': raw_data['title'],
                'content': raw_data['content'],
                'tags': json.loads(raw_data['tags']) if raw_data['tags'] else [],
                'submittedAt': raw_data['submitted_at'].isoformat(),
                'status': 'pending',
                'auditDetails': json.loads(audit_record['audit_details']) if audit_record['audit_details'] else {},
                'confidenceScore': float(audit_record['confidence_score']) if audit_record['confidence_score'] else 0.5
            }
            
        elif source_table == 'raw_questionnaire_submissions':
            cursor.execute("""
                SELECT rqs.*, u.username, u.nickname 
                FROM raw_questionnaire_submissions rqs
                LEFT JOIN users u ON rqs.user_id = u.id
                WHERE rqs.id = %s
            """, (source_id,))
            raw_data = cursor.fetchone()
            
            if not raw_data:
                return None
                
            return {
                'id': f"questionnaire_{source_id}",
                'auditId': audit_record['audit_id'],
                'type': 'questionnaire',
                'userId': raw_data['user_id'],
                'username': raw_data['username'] or raw_data['nickname'] or '匿名用户',
                'data': json.loads(raw_data['form_data']) if raw_data['form_data'] else {},
                'submittedAt': raw_data['submitted_at'].isoformat(),
                'status': 'pending',
                'auditDetails': json.loads(audit_record['audit_details']) if audit_record['audit_details'] else {},
                'confidenceScore': float(audit_record['confidence_score']) if audit_record['confidence_score'] else 0.5
            }
        
        return None
        
    except Exception as e:
        print(f"格式化审核项目错误: {e}")
        return None

def get_mood_from_emotion_score(score):
    """根据情感评分获取心情"""
    if score >= 4:
        return 'positive'
    elif score >= 3:
        return 'neutral'
    else:
        return 'negative'

@app.route('/api/reviewer/submit-review', methods=['POST'])
def submit_review():
    """提交人工审核结果"""
    try:
        data = request.get_json()
        
        # 验证参数
        required_fields = ['auditId', 'action', 'reviewerId']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        audit_id = data['auditId']
        action = data['action']  # 'approve' or 'reject'
        reviewer_id = data['reviewerId']
        reason = data.get('reason', '')

        # 转换action为decision
        decision = 'approved' if action == 'approve' else 'rejected'
        
        # 检查审核员权限
        if not check_reviewer_permission(reviewer_id):
            return jsonify({
                'success': False,
                'error': 'Insufficient permissions'
            }), 403
        
        if action not in ['approve', 'reject']:
            return jsonify({
                'success': False,
                'error': 'Invalid action'
            }), 400
        
        # 调用审核模块的人工审核接口
        import requests
        try:
            print(f"调用审核系统API: audit_id={audit_id}, decision={decision}, reviewer_id={reviewer_id}")
            audit_response = requests.post('http://localhost:8005/api/audit/manual-review',
                json={
                    'audit_id': audit_id,
                    'decision': decision,
                    'reviewer_id': reviewer_id,
                    'notes': reason
                },
                timeout=10
            )
            print(f"审核系统API响应: status={audit_response.status_code}, content={audit_response.text[:200]}")
            
            if audit_response.status_code == 200:
                audit_result = audit_response.json()
                return jsonify(audit_result)
            else:
                return jsonify({
                    'success': False,
                    'error': 'Audit service error'
                }), 500
                
        except Exception as audit_error:
            print(f"审核服务调用失败: {audit_error}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': 'Audit service unavailable'
            }), 503
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/reviewer/stats', methods=['GET'])
def get_reviewer_stats():
    """获取审核员统计数据"""
    try:
        reviewer_id = request.args.get('reviewer_id')
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取待审核统计 - 只统计故事和心声，问卷由内置规则处理
            cursor.execute("""
                SELECT
                    COUNT(CASE WHEN ar.content_type = 'heart_voice' THEN 1 END) as pending_voices,
                    COUNT(CASE WHEN ar.content_type = 'story' THEN 1 END) as pending_stories
                FROM audit_records ar
                WHERE ar.audit_result = 'pending'
                AND ar.content_type IN ('heart_voice', 'story')
            """)
            pending_stats = cursor.fetchone()
            
            # 获取今日审核统计（如果提供了reviewer_id）
            today_stats = {'today_reviewed': 0, 'total_reviewed': 0}
            if reviewer_id:
                cursor.execute("""
                    SELECT
                        COUNT(CASE WHEN DATE(ar.audited_at) = CURDATE() THEN 1 END) as today_reviewed,
                        COUNT(*) as total_reviewed
                    FROM audit_records ar
                    WHERE ar.auditor_id = %s AND ar.audit_level = 'human_review'
                """, (reviewer_id,))
                today_result = cursor.fetchone()
                if today_result:
                    today_stats = today_result
            
            return jsonify({
                'success': True,
                'data': {
                    'pendingVoices': pending_stats['pending_voices'] or 0,
                    'pendingStories': pending_stats['pending_stories'] or 0,
                    'pendingQuestionnaires': 0,  # 问卷不需要人工审核
                    'todayReviewed': today_stats['today_reviewed'] or 0,
                    'totalReviewed': today_stats['total_reviewed'] or 0,
                    'averageReviewTime': 3.5  # 模拟数据
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
    print("👥 Starting Reviewer API Server...")
    print("🎯 Features:")
    print("   • Third-layer manual review interface")
    print("   • Integration with existing reviewer pages")
    print("   • Three-layer audit system support")
    print("   • Reviewer statistics and dashboard data")
    print()
    print("🔌 Available endpoints:")
    print("   GET  /api/reviewer/pending-reviews - Get pending manual reviews")
    print("   POST /api/reviewer/submit-review - Submit manual review")
    print("   GET  /api/reviewer/stats - Get reviewer statistics")
    print()
    print("🌐 Server running on: http://localhost:8006")
    print("📝 CORS enabled for frontend integration")
    print()
    
    app.run(host='0.0.0.0', port=8006, debug=True)
