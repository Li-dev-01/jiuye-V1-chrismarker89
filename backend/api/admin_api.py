#!/usr/bin/env python3
"""
管理员API服务
提供管理员仪表板、用户管理、内容管理等功能
"""

import os
import sys
import time
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入UUID生成工具
try:
    from utils.uuid_generator import UUIDGenerator
except ImportError:
    print("Warning: Could not import UUIDGenerator, using fallback")
    class UUIDGenerator:
        @staticmethod
        def generate_user_uuid(user_type):
            import uuid
            return f"{user_type}-{str(uuid.uuid4())[:8]}"

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "http://127.0.0.1:5178"
])

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'questionnaire_db',
    'charset': 'utf8mb4',
    'autocommit': True
}

def get_connection():
    """获取数据库连接"""
    return mysql.connector.connect(**DB_CONFIG)

def check_admin_permission(user_id) -> bool:
    """检查管理员权限"""
    # 支持预置管理员账号
    preset_admins = ['admin', 'superadmin', 'adminA', 'adminB']
    
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
            
            # 检查是否是管理员
            return user['user_type'] in ['admin', 'super_admin']
            
        except Exception as e:
            print(f"权限检查错误: {e}")
            return False
        finally:
            cursor.close()
            conn.close()
    
    # 其他情况返回False
    return False

@app.route('/api/admin/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """获取管理员仪表板统计数据"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 获取问卷统计
        cursor.execute("""
            SELECT
                COUNT(*) as total_questionnaires,
                SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as pending_questionnaires,
                SUM(CASE WHEN is_completed = 1 AND is_valid = 1 THEN 1 ELSE 0 END) as approved_questionnaires,
                SUM(CASE WHEN is_valid = 0 THEN 1 ELSE 0 END) as rejected_questionnaires
            FROM questionnaire_responses
        """)
        questionnaire_stats = cursor.fetchone()
        
        # 获取心声统计
        cursor.execute("""
            SELECT 
                COUNT(*) as total_voices,
                (SELECT COUNT(*) FROM raw_heart_voices) as raw_voices,
                (SELECT COUNT(*) FROM valid_heart_voices) as valid_voices
            FROM raw_heart_voices
        """)
        voice_stats = cursor.fetchone()
        
        # 获取故事统计
        cursor.execute("""
            SELECT 
                COUNT(*) as total_stories,
                (SELECT COUNT(*) FROM raw_story_submissions) as raw_stories,
                (SELECT COUNT(*) FROM valid_stories) as valid_stories
            FROM raw_story_submissions
        """)
        story_stats = cursor.fetchone()
        
        # 获取审核统计
        cursor.execute("""
            SELECT 
                COUNT(*) as total_audits,
                SUM(CASE WHEN audit_result = 'pending' THEN 1 ELSE 0 END) as pending_audits,
                SUM(CASE WHEN audit_result = 'approved' THEN 1 ELSE 0 END) as approved_audits,
                SUM(CASE WHEN audit_result = 'rejected' THEN 1 ELSE 0 END) as rejected_audits,
                SUM(CASE WHEN audit_level = 'human_review' THEN 1 ELSE 0 END) as human_reviews
            FROM audit_records
        """)
        audit_stats = cursor.fetchone()
        
        # 获取用户统计
        cursor.execute("""
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN user_type = 'reviewer' THEN 1 ELSE 0 END) as reviewers,
                SUM(CASE WHEN user_type = 'admin' THEN 1 ELSE 0 END) as admins
            FROM users
        """)
        user_stats = cursor.fetchone()
        
        # 获取今日统计
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            SELECT
                COUNT(*) as today_submissions
            FROM questionnaire_responses
            WHERE DATE(started_at) = %s
        """, (today,))
        today_stats = cursor.fetchone()

        cursor.execute("""
            SELECT
                COUNT(*) as today_audits
            FROM audit_records
            WHERE DATE(audited_at) = %s
        """, (today,))
        today_audit_stats = cursor.fetchone()
        
        return jsonify({
            'success': True,
            'data': {
                'questionnaires': questionnaire_stats,
                'voices': voice_stats,
                'stories': story_stats,
                'audits': audit_stats,
                'users': user_stats,
                'today': {
                    'submissions': today_stats['today_submissions'],
                    'audits': today_audit_stats['today_audits']
                }
            },
            'timestamp': time.time()
        })
        
    except Exception as e:
        print(f"获取仪表板统计失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/questionnaires', methods=['GET'])
def get_questionnaires():
    """获取问卷列表"""
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        is_completed = request.args.get('isCompleted')
        is_valid = request.args.get('isValid')

        offset = (page - 1) * page_size

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 构建查询条件
        where_conditions = []
        params = []

        if is_completed is not None:
            where_conditions.append("is_completed = %s")
            params.append(1 if is_completed.lower() == 'true' else 0)

        if is_valid is not None:
            where_conditions.append("is_valid = %s")
            params.append(1 if is_valid.lower() == 'true' else 0)
        
        where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM questionnaire_responses{where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        # 获取数据
        data_query = f"""
            SELECT
                id,
                session_id,
                is_completed,
                completion_percentage,
                started_at,
                completed_at,
                total_time_seconds,
                device_type,
                browser_type,
                is_valid,
                quality_score,
                last_updated_at as updated_at,
                started_at as created_at
            FROM questionnaire_responses
            {where_clause}
            ORDER BY started_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(data_query, params + [page_size, offset])
        questionnaires = cursor.fetchall()
        
        # 转换数据格式
        for q in questionnaires:
            if q['started_at']:
                q['started_at'] = q['started_at'].isoformat()
            if q['completed_at']:
                q['completed_at'] = q['completed_at'].isoformat()
            if q['created_at']:
                q['created_at'] = q['created_at'].isoformat()
            if q['updated_at']:
                q['updated_at'] = q['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'data': {
                'items': questionnaires,
                'pagination': {
                    'page': page,
                    'pageSize': page_size,
                    'total': total,
                    'totalPages': (total + page_size - 1) // page_size
                }
            },
            'timestamp': time.time()
        })
        
    except Exception as e:
        print(f"获取问卷列表失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/questionnaires/<int:questionnaire_id>', methods=['PUT'])
def update_questionnaire_status(questionnaire_id):
    """更新问卷状态"""
    try:
        data = request.get_json()
        status = data.get('status')
        comment = data.get('comment', '')

        if status not in ['approved', 'rejected']:
            return jsonify({
                'success': False,
                'error': 'Invalid status'
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 更新问卷状态 (使用is_valid字段)
        is_valid = 1 if status == 'approved' else 0
        cursor.execute("""
            UPDATE questionnaire_responses
            SET is_valid = %s, last_updated_at = %s
            WHERE id = %s
        """, (is_valid, datetime.now(), questionnaire_id))

        if cursor.rowcount == 0:
            return jsonify({
                'success': False,
                'error': 'Questionnaire not found'
            }), 404

        # 获取更新后的问卷
        cursor.execute("""
            SELECT * FROM questionnaire_responses WHERE id = %s
        """, (questionnaire_id,))
        questionnaire = cursor.fetchone()

        # 转换时间格式
        if questionnaire:
            for key in ['started_at', 'completed_at', 'created_at', 'updated_at']:
                if questionnaire[key]:
                    questionnaire[key] = questionnaire[key].isoformat()

        return jsonify({
            'success': True,
            'data': questionnaire,
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"更新问卷状态失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()



@app.route('/api/admin/audit-records', methods=['GET'])
def get_audit_records():
    """获取审核记录列表"""
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        content_type = request.args.get('contentType')
        audit_result = request.args.get('auditResult')

        offset = (page - 1) * page_size

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 构建查询条件
        where_conditions = []
        params = []

        if content_type:
            where_conditions.append("content_type = %s")
            params.append(content_type)

        if audit_result:
            where_conditions.append("audit_result = %s")
            params.append(audit_result)

        where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""

        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM audit_records{where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']

        # 获取数据
        data_query = f"""
            SELECT
                id,
                content_type,
                content_id,
                raw_id,
                audit_result,
                audit_level,
                audit_reason,
                auditor_id,
                audited_at,
                created_at
            FROM audit_records
            {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(data_query, params + [page_size, offset])
        audit_records = cursor.fetchall()

        # 转换数据格式
        for record in audit_records:
            for key in ['audited_at', 'created_at']:
                if record[key]:
                    record[key] = record[key].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'items': audit_records,
                'pagination': {
                    'page': page,
                    'pageSize': page_size,
                    'total': total,
                    'totalPages': (total + page_size - 1) // page_size
                }
            },
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取审核记录失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/audit-config', methods=['GET'])
def get_audit_config():
    """获取当前审核配置"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 获取当前活跃的审核配置
        cursor.execute("""
            SELECT * FROM audit_config
            WHERE is_active = TRUE
            ORDER BY created_at DESC
            LIMIT 1
        """)
        config = cursor.fetchone()

        if not config:
            return jsonify({
                'success': False,
                'error': 'No active audit configuration found'
            }), 404

        # 转换时间格式
        for key in ['created_at', 'updated_at']:
            if config[key]:
                config[key] = config[key].isoformat()

        return jsonify({
            'success': True,
            'data': config,
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取审核配置失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/audit-config', methods=['PUT'])
def update_audit_config():
    """更新审核配置"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id', 'admin')  # 临时使用，后续从认证中获取

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 验证审核模式
        valid_modes = ['disabled', 'local_only', 'ai_only', 'human_only', 'local_ai', 'local_human']
        audit_mode = data.get('audit_mode')
        if audit_mode not in valid_modes:
            return jsonify({
                'success': False,
                'error': f'Invalid audit mode. Must be one of: {valid_modes}'
            }), 400

        # 先将当前配置设为非活跃
        cursor.execute("UPDATE audit_config SET is_active = FALSE")

        # 插入新配置
        cursor.execute("""
            INSERT INTO audit_config (
                audit_mode,
                local_confidence_threshold,
                local_max_content_length,
                local_sensitive_level,
                ai_confidence_threshold,
                ai_timeout_seconds,
                ai_fallback_to_human,
                ai_provider,
                human_timeout_hours,
                human_auto_approve_on_timeout,
                trigger_on_uncertain,
                trigger_on_edge_content,
                trigger_on_length_exceed,
                trigger_on_user_appeal,
                is_active,
                created_by,
                updated_by,
                description
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            audit_mode,
            data.get('local_confidence_threshold', 80),
            data.get('local_max_content_length', 1000),
            data.get('local_sensitive_level', 'normal'),
            data.get('ai_confidence_threshold', 70),
            data.get('ai_timeout_seconds', 30),
            data.get('ai_fallback_to_human', True),
            data.get('ai_provider', 'openai'),
            data.get('human_timeout_hours', 24),
            data.get('human_auto_approve_on_timeout', False),
            data.get('trigger_on_uncertain', True),
            data.get('trigger_on_edge_content', True),
            data.get('trigger_on_length_exceed', True),
            data.get('trigger_on_user_appeal', True),
            True,  # is_active
            admin_id,  # created_by
            admin_id,  # updated_by
            data.get('description', f'审核配置更新 - 模式: {audit_mode}')
        ))

        # 获取新插入的配置
        new_config_id = cursor.lastrowid
        cursor.execute("SELECT * FROM audit_config WHERE id = %s", (new_config_id,))
        new_config = cursor.fetchone()

        # 转换时间格式
        for key in ['created_at', 'updated_at']:
            if new_config[key]:
                new_config[key] = new_config[key].isoformat()

        return jsonify({
            'success': True,
            'data': new_config,
            'message': f'审核配置已更新为: {audit_mode}',
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"更新审核配置失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/ai-providers', methods=['GET'])
def get_ai_providers():
    """获取AI供应商列表"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id, provider_name, provider_type, model_name,
                is_enabled, priority, cost_per_1k_tokens, rate_limit_per_minute,
                created_at, updated_at
            FROM ai_providers
            ORDER BY priority ASC, provider_name ASC
        """)
        providers = cursor.fetchall()

        # 转换时间格式
        for provider in providers:
            for key in ['created_at', 'updated_at']:
                if provider[key]:
                    provider[key] = provider[key].isoformat()

        return jsonify({
            'success': True,
            'data': providers,
            'timestamp': time.time()
        })
    except Exception as e:
        print(f"Error in get_ai_providers: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/admin/ai-sources', methods=['GET'])
def get_ai_sources():
    """获取AI水源列表"""
    try:
        # 真实数据验收阶段：返回空数据，提示用户需要配置
        return jsonify({
            'success': True,
            'data': [],
            'message': '真实AI水源API未配置，请先在数据库中配置AI供应商',
            'timestamp': time.time()
        })
    except Exception as e:
        print(f"Error in get_ai_sources: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/admin/ai-sources', methods=['POST'])
def create_ai_source():
    """创建AI水源"""
    try:
        data = request.get_json()

        # 真实数据验收阶段：返回提示信息
        return jsonify({
            'success': False,
            'error': '真实AI水源管理功能尚未实现，请联系开发团队配置',
            'timestamp': time.time()
        }), 501
    except Exception as e:
        print(f"Error in create_ai_source: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

    except Exception as e:
        print(f"获取AI供应商列表失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/local-rules', methods=['GET'])
def get_local_rules():
    """获取本地规则列表"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM local_rules
            ORDER BY priority ASC, rule_name ASC
        """)
        rules = cursor.fetchall()

        # 转换时间格式
        for rule in rules:
            for key in ['created_at', 'updated_at']:
                if rule[key]:
                    rule[key] = rule[key].isoformat()

        return jsonify({
            'success': True,
            'data': rules,
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取本地规则列表失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    """获取用户列表（支持分页和筛选）"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 10))
        user_type = request.args.get('userType', '')
        status = request.args.get('status', '')
        search = request.args.get('search', '')

        offset = (page - 1) * page_size

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 构建查询条件
        where_conditions = []
        params = []

        if user_type:
            where_conditions.append("user_type = %s")
            params.append(user_type)

        if status:
            where_conditions.append("status = %s")
            params.append(status)

        if search:
            where_conditions.append("(username LIKE %s OR nickname LIKE %s OR email LIKE %s)")
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])

        where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""

        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM users{where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']

        # 获取用户列表
        query = f"""
            SELECT
                id, user_uuid, user_type, username, nickname, email, status,
                registration_ip, last_login_ip, created_at, last_login_at
            FROM users
            {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [page_size, offset])
        users = cursor.fetchall()

        # 转换时间格式并解析UUID信息
        for user in users:
            for key in ['created_at', 'last_login_at']:
                if user[key]:
                    user[key] = user[key].isoformat()

            # 解析UUID信息
            if user['user_uuid']:
                uuid_info = UUIDGenerator.parse_user_uuid(user['user_uuid'])
                user['uuid_info'] = uuid_info

        return jsonify({
            'success': True,
            'data': {
                'items': users,
                'pagination': {
                    'page': page,
                    'pageSize': page_size,
                    'total': total,
                    'totalPages': (total + page_size - 1) // page_size
                }
            },
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取用户列表失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/users/stats', methods=['GET'])
def get_user_stats():
    """获取用户统计信息"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 按用户类型统计
        cursor.execute("""
            SELECT
                user_type,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count
            FROM users
            GROUP BY user_type
        """)
        type_stats = cursor.fetchall()

        # 今日新增用户统计
        today = datetime.now().strftime('%Y%m%d')
        cursor.execute(f"""
            SELECT COUNT(*) as today_new_users
            FROM users
            WHERE user_uuid LIKE '%{today}%'
        """)
        today_new = cursor.fetchone()['today_new_users']

        # 本周新增用户统计
        cursor.execute("""
            SELECT COUNT(*) as week_new_users
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        """)
        week_new = cursor.fetchone()['week_new_users']

        # 用户权限统计
        cursor.execute("""
            SELECT
                user_category,
                permission_key,
                permission_name,
                COUNT(*) as user_count
            FROM user_permissions up
            LEFT JOIN users u ON u.user_type = up.user_category
            WHERE up.is_default = TRUE
            GROUP BY user_category, permission_key, permission_name
        """)
        permission_stats = cursor.fetchall()

        return jsonify({
            'success': True,
            'data': {
                'type_stats': type_stats,
                'today_new_users': today_new,
                'week_new_users': week_new,
                'permission_stats': permission_stats
            },
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取用户统计失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/users/<user_id>/status', methods=['PUT'])
def update_user_status(user_id):
    """更新用户状态"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        admin_id = data.get('admin_id', 'admin')

        if new_status not in ['active', 'inactive', 'suspended']:
            return jsonify({
                'success': False,
                'error': 'Invalid status'
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 更新用户状态
        cursor.execute("""
            UPDATE users
            SET status = %s
            WHERE id = %s OR user_uuid = %s
        """, (new_status, user_id, user_id))

        if cursor.rowcount == 0:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # 记录操作日志（如果是审核员）
        cursor.execute("SELECT user_type, user_uuid FROM users WHERE id = %s OR user_uuid = %s", (user_id, user_id))
        user = cursor.fetchone()

        if user and user['user_type'] == 'reviewer':
            cursor.execute("""
                INSERT INTO reviewer_activity_logs (
                    reviewer_uuid, activity_type, ip_address, details
                ) VALUES (%s, %s, %s, %s)
            """, (
                user['user_uuid'],
                'status_change',
                request.remote_addr,
                json.dumps({
                    'old_status': 'unknown',
                    'new_status': new_status,
                    'changed_by': admin_id
                })
            ))

        return jsonify({
            'success': True,
            'message': f'User status updated to {new_status}',
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"更新用户状态失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()



@app.route('/api/admin/reviewers/<reviewer_id>/activity', methods=['GET'])
def get_reviewer_activity(reviewer_id):
    """获取审核员活动日志"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        activity_type = request.args.get('activityType', '')

        offset = (page - 1) * page_size

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 构建查询条件
        where_conditions = ["reviewer_uuid = %s"]
        params = [reviewer_id]

        if activity_type:
            where_conditions.append("activity_type = %s")
            params.append(activity_type)

        where_clause = " AND ".join(where_conditions)

        # 获取总数
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM reviewer_activity_logs
            WHERE {where_clause}
        """, params)
        total = cursor.fetchone()['total']

        # 获取活动日志
        cursor.execute(f"""
            SELECT
                id, activity_type, ip_address, content_id, content_type,
                session_id, details, created_at
            FROM reviewer_activity_logs
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, params + [page_size, offset])
        activities = cursor.fetchall()

        # 转换时间格式和解析详情
        for activity in activities:
            if activity['created_at']:
                activity['created_at'] = activity['created_at'].isoformat()
            if activity['details']:
                try:
                    activity['details'] = json.loads(activity['details'])
                except:
                    pass

        return jsonify({
            'success': True,
            'data': {
                'items': activities,
                'pagination': {
                    'page': page,
                    'pageSize': page_size,
                    'total': total,
                    'totalPages': (total + page_size - 1) // page_size
                }
            },
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取审核员活动日志失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/reviewers', methods=['GET'])
def get_reviewers():
    """获取审核员列表和工作统计"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 10))
        offset = (page - 1) * page_size

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 获取审核员总数
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE user_type = 'reviewer'")
        total = cursor.fetchone()['total']

        # 获取审核员列表
        cursor.execute("""
            SELECT
                u.id, u.user_uuid, u.username, u.nickname, u.email, u.status,
                u.created_at, u.last_login_at, u.last_login_ip
            FROM users u
            WHERE u.user_type = 'reviewer'
            ORDER BY u.created_at DESC
            LIMIT %s OFFSET %s
        """, (page_size, offset))
        reviewers = cursor.fetchall()

        # 获取每个审核员的工作统计
        for reviewer in reviewers:
            reviewer_uuid = reviewer['user_uuid']

            # 今日工作统计
            cursor.execute("""
                SELECT
                    COALESCE(total_reviews, 0) as today_reviews,
                    COALESCE(approved_count, 0) as today_approved,
                    COALESCE(rejected_count, 0) as today_rejected,
                    COALESCE(login_count, 0) as today_logins
                FROM reviewer_work_stats
                WHERE reviewer_uuid = %s AND stat_date = CURDATE()
            """, (reviewer_uuid,))
            today_stats = cursor.fetchone() or {
                'today_reviews': 0, 'today_approved': 0, 'today_rejected': 0, 'today_logins': 0
            }

            # 本周工作统计
            cursor.execute("""
                SELECT
                    COALESCE(SUM(total_reviews), 0) as week_reviews,
                    COALESCE(SUM(approved_count), 0) as week_approved,
                    COALESCE(SUM(rejected_count), 0) as week_rejected
                FROM reviewer_work_stats
                WHERE reviewer_uuid = %s
                AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            """, (reviewer_uuid,))
            week_stats = cursor.fetchone() or {
                'week_reviews': 0, 'week_approved': 0, 'week_rejected': 0
            }

            # 总计统计
            cursor.execute("""
                SELECT
                    COALESCE(SUM(total_reviews), 0) as total_reviews,
                    COALESCE(SUM(approved_count), 0) as total_approved,
                    COALESCE(SUM(rejected_count), 0) as total_rejected
                FROM reviewer_work_stats
                WHERE reviewer_uuid = %s
            """, (reviewer_uuid,))
            total_stats = cursor.fetchone() or {
                'total_reviews': 0, 'total_approved': 0, 'total_rejected': 0
            }

            # 合并统计数据
            reviewer.update(today_stats)
            reviewer.update(week_stats)
            reviewer.update(total_stats)

            # 转换时间格式
            for key in ['created_at', 'last_login_at']:
                if reviewer[key]:
                    reviewer[key] = reviewer[key].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'items': reviewers,
                'pagination': {
                    'page': page,
                    'pageSize': page_size,
                    'total': total,
                    'totalPages': (total + page_size - 1) // page_size
                }
            },
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取审核员列表失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/content/categories', methods=['GET'])
def get_content_categories():
    """获取内容分类列表"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id, category_key, category_name, category_name_en, description,
                parent_id, sort_order, icon, color, is_active, content_type,
                display_rules, created_at, updated_at
            FROM content_categories
            ORDER BY sort_order ASC, category_name ASC
        """)
        categories = cursor.fetchall()

        # 转换时间格式和解析JSON
        for category in categories:
            for key in ['created_at', 'updated_at']:
                if category[key]:
                    category[key] = category[key].isoformat()
            if category['display_rules']:
                try:
                    category['display_rules'] = json.loads(category['display_rules'])
                except:
                    category['display_rules'] = {}

        return jsonify({
            'success': True,
            'data': categories,
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取内容分类失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/content/tags', methods=['GET'])
def get_content_tags():
    """获取内容标签列表"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id, tag_key, tag_name, tag_name_en, description,
                tag_type, color, usage_count, is_active, content_type,
                created_at, updated_at
            FROM content_tags
            ORDER BY usage_count DESC, tag_name ASC
        """)
        tags = cursor.fetchall()

        # 转换时间格式
        for tag in tags:
            for key in ['created_at', 'updated_at']:
                if tag[key]:
                    tag[key] = tag[key].isoformat()

        return jsonify({
            'success': True,
            'data': tags,
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"获取内容标签失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/content/categories', methods=['POST'])
def create_content_category():
    """创建内容分类"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id', 'admin')

        required_fields = ['category_key', 'category_name', 'content_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 检查分类键是否已存在
        cursor.execute("SELECT id FROM content_categories WHERE category_key = %s", (data['category_key'],))
        if cursor.fetchone():
            return jsonify({
                'success': False,
                'error': 'Category key already exists'
            }), 400

        # 插入新分类
        cursor.execute("""
            INSERT INTO content_categories (
                category_key, category_name, category_name_en, description,
                parent_id, sort_order, icon, color, content_type, display_rules
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['category_key'],
            data['category_name'],
            data.get('category_name_en', ''),
            data.get('description', ''),
            data.get('parent_id'),
            data.get('sort_order', 0),
            data.get('icon', ''),
            data.get('color', '#1890ff'),
            data['content_type'],
            json.dumps(data.get('display_rules', {}))
        ))

        category_id = cursor.lastrowid

        # 获取新创建的分类
        cursor.execute("SELECT * FROM content_categories WHERE id = %s", (category_id,))
        new_category = cursor.fetchone()

        return jsonify({
            'success': True,
            'data': new_category,
            'message': 'Content category created successfully',
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"创建内容分类失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/content/tags', methods=['POST'])
def create_content_tag():
    """创建内容标签"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id', 'admin')

        required_fields = ['tag_key', 'tag_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 检查标签键是否已存在
        cursor.execute("SELECT id FROM content_tags WHERE tag_key = %s", (data['tag_key'],))
        if cursor.fetchone():
            return jsonify({
                'success': False,
                'error': 'Tag key already exists'
            }), 400

        # 插入新标签
        cursor.execute("""
            INSERT INTO content_tags (
                tag_key, tag_name, tag_name_en, description,
                tag_type, color, content_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data['tag_key'],
            data['tag_name'],
            data.get('tag_name_en', ''),
            data.get('description', ''),
            data.get('tag_type', 'system'),
            data.get('color', '#1890ff'),
            data.get('content_type', 'all')
        ))

        tag_id = cursor.lastrowid

        # 获取新创建的标签
        cursor.execute("SELECT * FROM content_tags WHERE id = %s", (tag_id,))
        new_tag = cursor.fetchone()

        return jsonify({
            'success': True,
            'data': new_tag,
            'message': 'Content tag created successfully',
            'timestamp': time.time()
        })

    except Exception as e:
        print(f"创建内容标签失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/database/status', methods=['GET'])
def get_database_status():
    """获取数据库状态和表信息"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 获取所有表的信息
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()

        table_info = []
        for table in tables:
            table_name = list(table.values())[0]

            # 获取表记录数
            cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
            count_result = cursor.fetchone()
            record_count = count_result['count'] if count_result else 0

            # 获取表状态信息
            cursor.execute(f"SHOW TABLE STATUS LIKE '{table_name}'")
            status_result = cursor.fetchone()

            # 分类表类型
            table_type = 'system'
            if 'temp' in table_name:
                table_type = 'temp'
            elif table_name.startswith('analytics_'):
                table_type = 'analytics'
            elif table_name in ['questionnaire_submissions', 'heart_voices_valid', 'stories_valid']:
                table_type = 'valid'

            table_info.append({
                'name': table_name,
                'type': table_type,
                'record_count': record_count,
                'size': status_result['Data_length'] if status_result else 0,
                'last_updated': status_result['Update_time'].isoformat() if status_result and status_result['Update_time'] else None,
                'engine': status_result['Engine'] if status_result else 'Unknown'
            })

        # 获取数据库总体信息
        cursor.execute("""
            SELECT
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_size_mb
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
        """)
        db_size = cursor.fetchone()

        return jsonify({
            'success': True,
            'data': {
                'tables': table_info,
                'database_size_mb': db_size['total_size_mb'] if db_size else 0,
                'total_tables': len(table_info),
                'timestamp': time.time()
            }
        })

    except Exception as e:
        print(f"获取数据库状态失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/api/stats', methods=['GET'])
def get_api_stats():
    """获取API调用统计（模拟数据，实际需要日志分析）"""
    try:
        # 这里返回模拟的API统计数据
        # 在实际环境中，这些数据应该来自API网关日志或访问日志
        api_stats = [
            {
                'endpoint': '/api/questionnaire/submit',
                'method': 'POST',
                'calls_today': 45,
                'calls_total': 1250,
                'avg_response_time': 120,
                'success_rate': 98.5,
                'last_called': time.time() - 300
            },
            {
                'endpoint': '/api/admin/dashboard/stats',
                'method': 'GET',
                'calls_today': 23,
                'calls_total': 890,
                'avg_response_time': 85,
                'success_rate': 100.0,
                'last_called': time.time() - 60
            },
            {
                'endpoint': '/api/admin/users',
                'method': 'GET',
                'calls_today': 12,
                'calls_total': 456,
                'avg_response_time': 95,
                'success_rate': 99.2,
                'last_called': time.time() - 180
            }
        ]

        return jsonify({
            'success': True,
            'data': {
                'api_endpoints': api_stats,
                'total_calls_today': sum(stat['calls_today'] for stat in api_stats),
                'total_calls_all': sum(stat['calls_total'] for stat in api_stats),
                'avg_success_rate': sum(stat['success_rate'] for stat in api_stats) / len(api_stats),
                'timestamp': time.time()
            }
        })

    except Exception as e:
        print(f"获取API统计失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/admin/project/status', methods=['GET'])
def get_project_status():
    """获取项目运行状态"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 获取项目状态配置
        cursor.execute("""
            SELECT config_key, config_value, updated_at, updated_by
            FROM system_config
            WHERE config_key IN ('project_enabled', 'maintenance_mode', 'emergency_shutdown')
        """)
        configs = cursor.fetchall()

        # 构建状态对象
        status = {
            'project_enabled': True,
            'maintenance_mode': False,
            'emergency_shutdown': False,
            'last_updated': None,
            'updated_by': None
        }

        for config in configs:
            if config['config_key'] == 'project_enabled':
                status['project_enabled'] = config['config_value'].lower() == 'true'
            elif config['config_key'] == 'maintenance_mode':
                status['maintenance_mode'] = config['config_value'].lower() == 'true'
            elif config['config_key'] == 'emergency_shutdown':
                status['emergency_shutdown'] = config['config_value'].lower() == 'true'

            if config['updated_at']:
                status['last_updated'] = config['updated_at'].isoformat()
                status['updated_by'] = config['updated_by']

        return jsonify({
            'success': True,
            'data': status
        })

    except Exception as e:
        print(f"获取项目状态失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/project/control', methods=['POST'])
def control_project():
    """控制项目状态（仅超级管理员）"""
    try:
        data = request.get_json()
        action = data.get('action')  # 'enable', 'disable', 'maintenance', 'emergency_shutdown'
        reason = data.get('reason', '')

        # 这里应该验证超级管理员权限
        # 暂时跳过权限验证

        conn = get_connection()
        cursor = conn.cursor()

        current_time = datetime.now()
        operator = 'superadmin'  # 实际应该从认证信息获取

        if action == 'enable':
            # 启用项目
            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('project_enabled', 'true', %s, %s)
                ON DUPLICATE KEY UPDATE
                config_value = 'true', updated_at = %s, updated_by = %s
            """, (current_time, operator, current_time, operator))

            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('maintenance_mode', 'false', %s, %s)
                ON DUPLICATE KEY UPDATE
                config_value = 'false', updated_at = %s, updated_by = %s
            """, (current_time, operator, current_time, operator))

        elif action == 'disable':
            # 禁用项目（维护模式）
            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('project_enabled', 'false', %s, %s)
                ON DUPLICATE KEY UPDATE
                config_value = 'false', updated_at = %s, updated_by = %s
            """, (current_time, operator, current_time, operator))

            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('maintenance_mode', 'true', %s, %s)
                ON DUPLICATE KEY UPDATE
                config_value = 'true', updated_at = %s, updated_by = %s
            """, (current_time, operator, current_time, operator))

        elif action == 'emergency_shutdown':
            # 紧急关闭
            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('emergency_shutdown', 'true', %s, %s)
                ON DUPLICATE KEY UPDATE
                config_value = 'true', updated_at = %s, updated_by = %s
            """, (current_time, operator, current_time, operator))

            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('project_enabled', 'false', %s, %s)
                ON DUPLICATE KEY UPDATE
                config_value = 'false', updated_at = %s, updated_by = %s
            """, (current_time, operator, current_time, operator))

        # 记录操作日志
        cursor.execute("""
            INSERT INTO admin_operation_logs
            (operator, operation, target, details, ip_address, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            operator,
            f'project_control_{action}',
            'system',
            json.dumps({'action': action, 'reason': reason}),
            request.remote_addr,
            current_time
        ))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'项目状态已更新: {action}'
        })

    except Exception as e:
        print(f"控制项目状态失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/user-behavior/analysis', methods=['GET'])
def get_user_behavior_analysis():
    """获取用户行为分析数据"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 获取重复IP分析
        cursor.execute("""
            SELECT
                ip_address,
                COUNT(DISTINCT user_uuid) as unique_users,
                COUNT(*) as total_submissions,
                GROUP_CONCAT(DISTINCT user_uuid) as user_uuids,
                MIN(created_at) as first_submission,
                MAX(created_at) as last_submission
            FROM (
                SELECT user_uuid, ip_address, created_at FROM questionnaire_responses_temp
                UNION ALL
                SELECT user_uuid, ip_address, created_at FROM heart_voices_temp
                UNION ALL
                SELECT user_uuid, ip_address, created_at FROM stories_temp
            ) as all_submissions
            WHERE ip_address IS NOT NULL
            GROUP BY ip_address
            HAVING COUNT(*) > 1
            ORDER BY total_submissions DESC
            LIMIT 50
        """)
        duplicate_ips = cursor.fetchall()

        # 获取重复用户分析
        cursor.execute("""
            SELECT
                user_uuid,
                COUNT(DISTINCT ip_address) as unique_ips,
                COUNT(*) as total_submissions,
                GROUP_CONCAT(DISTINCT ip_address) as ip_addresses,
                MIN(created_at) as first_submission,
                MAX(created_at) as last_submission
            FROM (
                SELECT user_uuid, ip_address, created_at FROM questionnaire_responses_temp
                UNION ALL
                SELECT user_uuid, ip_address, created_at FROM heart_voices_temp
                UNION ALL
                SELECT user_uuid, ip_address, created_at FROM stories_temp
            ) as all_submissions
            WHERE user_uuid IS NOT NULL
            GROUP BY user_uuid
            HAVING COUNT(*) > 3
            ORDER BY total_submissions DESC
            LIMIT 50
        """)
        duplicate_users = cursor.fetchall()

        # 获取可疑行为模式
        cursor.execute("""
            SELECT
                DATE(created_at) as submission_date,
                ip_address,
                user_uuid,
                COUNT(*) as submissions_count,
                'high_frequency' as pattern_type
            FROM (
                SELECT user_uuid, ip_address, created_at FROM questionnaire_responses_temp
                UNION ALL
                SELECT user_uuid, ip_address, created_at FROM heart_voices_temp
                UNION ALL
                SELECT user_uuid, ip_address, created_at FROM stories_temp
            ) as all_submissions
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAYS)
            GROUP BY DATE(created_at), ip_address, user_uuid
            HAVING COUNT(*) > 5
            ORDER BY submissions_count DESC
            LIMIT 30
        """)
        suspicious_patterns = cursor.fetchall()

        # 获取总体统计
        cursor.execute("""
            SELECT
                COUNT(DISTINCT ip_address) as unique_ips,
                COUNT(DISTINCT user_uuid) as unique_users,
                COUNT(*) as total_submissions
            FROM (
                SELECT user_uuid, ip_address FROM questionnaire_responses_temp
                UNION ALL
                SELECT user_uuid, ip_address FROM heart_voices_temp
                UNION ALL
                SELECT user_uuid, ip_address FROM stories_temp
            ) as all_submissions
        """)
        overall_stats = cursor.fetchone()

        return jsonify({
            'success': True,
            'data': {
                'duplicate_ips': duplicate_ips,
                'duplicate_users': duplicate_users,
                'suspicious_patterns': suspicious_patterns,
                'overall_stats': overall_stats,
                'analysis_timestamp': time.time()
            }
        })

    except Exception as e:
        print(f"获取用户行为分析失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/user-behavior/cleanup', methods=['POST'])
def cleanup_duplicate_data():
    """清理重复或可疑数据"""
    try:
        data = request.get_json()
        cleanup_type = data.get('type')  # 'ip', 'user', 'pattern'
        target_value = data.get('target')  # IP地址或用户UUID
        reason = data.get('reason', '')

        conn = get_connection()
        cursor = conn.cursor()

        current_time = datetime.now()
        operator = 'superadmin'  # 实际应该从认证信息获取

        deleted_count = 0

        if cleanup_type == 'ip':
            # 删除指定IP的所有提交
            cursor.execute("DELETE FROM questionnaire_responses_temp WHERE ip_address = %s", (target_value,))
            deleted_count += cursor.rowcount

            cursor.execute("DELETE FROM heart_voices_temp WHERE ip_address = %s", (target_value,))
            deleted_count += cursor.rowcount

            cursor.execute("DELETE FROM stories_temp WHERE ip_address = %s", (target_value,))
            deleted_count += cursor.rowcount

        elif cleanup_type == 'user':
            # 删除指定用户的所有提交
            cursor.execute("DELETE FROM questionnaire_responses_temp WHERE user_uuid = %s", (target_value,))
            deleted_count += cursor.rowcount

            cursor.execute("DELETE FROM heart_voices_temp WHERE user_uuid = %s", (target_value,))
            deleted_count += cursor.rowcount

            cursor.execute("DELETE FROM stories_temp WHERE user_uuid = %s", (target_value,))
            deleted_count += cursor.rowcount

        # 记录清理操作
        cursor.execute("""
            INSERT INTO admin_operation_logs
            (operator, operation, target, details, ip_address, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            operator,
            f'data_cleanup_{cleanup_type}',
            target_value,
            json.dumps({
                'cleanup_type': cleanup_type,
                'target': target_value,
                'reason': reason,
                'deleted_count': deleted_count
            }),
            request.remote_addr,
            current_time
        ))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'已清理 {deleted_count} 条数据',
            'deleted_count': deleted_count
        })

    except Exception as e:
        print(f"清理数据失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    print("🔧 Starting Admin API Server...")
    print("🎯 Features:")
    print("   • Dashboard statistics")
    print("   • Questionnaire management")
    print("   • User management")
    print("   • Content management")
    print("   • System monitoring")
    print("")
    print("🔌 Available endpoints:")
    print("   GET  /api/admin/dashboard/stats - Get dashboard statistics")
    print("   GET  /api/admin/questionnaires - Get questionnaires list")
    print("")
    print("🌐 Server running on: http://localhost:8007")
    print("📝 CORS enabled for frontend integration")
    print("")
    
    app.run(host='0.0.0.0', port=8007, debug=True)
