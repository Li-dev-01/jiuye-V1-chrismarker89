"""
审核模块API
处理A表到B表的审核流程，支持自动审核和人工审核
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
import sys

# 添加services目录到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

try:
    from tiered_audit_service import TieredAuditEngine, AuditLevel
    TIERED_AUDIT_ENABLED = True
except ImportError as e:
    print(f"警告: 无法导入分级审核服务: {e}")
    TIERED_AUDIT_ENABLED = False

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

# 审核配置
AUDIT_CONFIG = {
    'auto_approve_enabled': True,  # 是否启用自动审核
    'auto_approve_all': False,     # 关闭全部自动通过，启用分级审核
    'manual_review_threshold': 0.5, # 需要人工审核的阈值
    'content_filters': {
        'min_length': 10,
        'max_length': 2000,
        'forbidden_words': ['spam', 'test'],  # 简单的敏感词过滤
    }
}

# 初始化分级审核引擎
tiered_audit_engine = None
if TIERED_AUDIT_ENABLED:
    try:
        tiered_audit_engine = TieredAuditEngine(DB_CONFIG)
        print("分级审核引擎初始化成功")
    except Exception as e:
        print(f"分级审核引擎初始化失败: {e}")
        TIERED_AUDIT_ENABLED = False

def get_connection():
    """获取数据库连接"""
    return mysql.connector.connect(**DB_CONFIG)

def check_user_permission(user_id, permission: str) -> bool:
    """检查用户权限"""
    # 支持预置审核员账号
    preset_reviewers = ['reviewerA', 'reviewerB', 'reviewerC']
    preset_admins = ['admin', 'superadmin']

    # 如果是预置审核员账号
    if isinstance(user_id, str) and user_id in preset_reviewers:
        if permission == 'review':
            return True
        return False

    # 如果是预置管理员账号
    if isinstance(user_id, str) and user_id in preset_admins:
        return True  # 管理员有所有权限

    # 对于数据库用户，进行数据库查询
    if isinstance(user_id, int):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT user_type, permissions
                FROM users
                WHERE id = %s AND status = 'active'
            """, (user_id,))

            user = cursor.fetchone()
            if not user:
                return False

            # 审核员权限检查
            if permission == 'review' and user['user_type'] not in ['reviewer', 'admin']:
                return False

            return True

        except Exception as e:
            print(f"权限检查错误: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    # 其他情况返回False
    return False

def layer1_rule_audit(content_type: str, content_data: dict) -> dict:
    """第一层：分级规则审核 (处理70%内容)"""
    # 使用分级审核引擎
    if TIERED_AUDIT_ENABLED and tiered_audit_engine:
        try:
            content = content_data.get('content', '')
            title = content_data.get('title', '')
            full_content = f"{title} {content}".strip()
            user_ip = content_data.get('user_ip', '127.0.0.1')

            # 调用分级审核
            decision = tiered_audit_engine.check_content_with_level(
                full_content, content_type, user_ip
            )

            # 转换为原有格式
            audit_result = {
                'layer': 1,
                'passed': decision.passed,
                'score': 1.0 - decision.risk_score,
                'reasons': [f"{v.category}: {v.matched_text}" for v in decision.violations],
                'requires_next_layer': not decision.passed and decision.action == 'ai_review',
                'confidence': decision.confidence,
                'audit_level': decision.audit_level,
                'action': decision.action,
                'violations': [
                    {
                        'rule_id': v.rule_id,
                        'category': v.category,
                        'matched_text': v.matched_text,
                        'severity': v.severity,
                        'confidence': v.confidence
                    } for v in decision.violations
                ]
            }

            return audit_result

        except Exception as e:
            print(f"分级审核失败，回退到传统审核: {e}")
            # 回退到传统审核逻辑

    # 传统审核逻辑（作为备用）
    audit_result = {
        'layer': 1,
        'passed': True,
        'score': 1.0,
        'reasons': [],
        'requires_next_layer': False,
        'confidence': 0.9,
        'audit_level': 'level1',
        'action': 'approve'
    }

    # 如果配置为全部通过，直接返回通过
    if AUDIT_CONFIG['auto_approve_all']:
        audit_result['confidence'] = 1.0
        return audit_result

    content = content_data.get('content', '')
    title = content_data.get('title', '')

    # 1. 基础长度检查
    if len(content) < AUDIT_CONFIG['content_filters']['min_length']:
        audit_result['passed'] = False
        audit_result['score'] = 0.1
        audit_result['confidence'] = 0.95
        audit_result['reasons'].append('内容长度不足')
        return audit_result

    if len(content) > AUDIT_CONFIG['content_filters']['max_length']:
        audit_result['passed'] = False
        audit_result['score'] = 0.2
        audit_result['confidence'] = 0.95
        audit_result['reasons'].append('内容长度超限')
        return audit_result

    # 2. 敏感词检查
    forbidden_words = AUDIT_CONFIG['content_filters']['forbidden_words']
    for word in forbidden_words:
        if word.lower() in content.lower() or (title and word.lower() in title.lower()):
            audit_result['passed'] = False
            audit_result['score'] = 0.05
            audit_result['confidence'] = 0.98
            audit_result['reasons'].append(f'包含敏感词: {word}')
            return audit_result

    # 3. 格式规范检查
    if content.count('\n') > 50:  # 过多换行
        audit_result['requires_next_layer'] = True
        audit_result['reasons'].append('格式异常，需要进一步审核')
        audit_result['confidence'] = 0.6

    # 4. 基础质量评分
    quality_score = min(1.0, len(content) / 200)  # 基于长度的评分
    if title:
        quality_score = min(1.0, quality_score + 0.2)  # 有标题加分

    audit_result['score'] = quality_score

    # 5. 决定是否需要下一层审核
    if quality_score < 0.7:  # 70%的内容在此层处理
        audit_result['requires_next_layer'] = True
        audit_result['reasons'].append('质量分数较低，需要AI审核')
        audit_result['confidence'] = 0.5

    return audit_result

def layer2_ai_audit(content_type: str, content_data: dict, layer1_result: dict) -> dict:
    """第二层：AI智能审核 (处理20%内容)"""
    audit_result = {
        'layer': 2,
        'passed': True,
        'score': layer1_result['score'],
        'reasons': layer1_result['reasons'].copy(),
        'requires_manual': False,
        'confidence': 0.8,
        'ai_recommendation': 'approve'
    }

    # 模拟AI审核逻辑（实际应该调用AI服务）
    content = content_data.get('content', '')

    # 1. 内容质量分析
    if len(content) > 100:
        audit_result['score'] += 0.1

    # 2. 情感倾向分析
    positive_words = ['好', '棒', '优秀', '成功', '希望', '感谢']
    negative_words = ['差', '糟糕', '失败', '绝望', '愤怒']

    positive_count = sum(1 for word in positive_words if word in content)
    negative_count = sum(1 for word in negative_words if word in content)

    if positive_count > negative_count:
        audit_result['score'] += 0.1
        audit_result['confidence'] += 0.1
    elif negative_count > positive_count * 2:
        audit_result['requires_manual'] = True
        audit_result['reasons'].append('负面情绪较强，需要人工审核')
        audit_result['ai_recommendation'] = 'manual_review'
        audit_result['confidence'] = 0.6

    # 3. 语义理解检查（简化）
    if '测试' in content or 'test' in content.lower():
        audit_result['requires_manual'] = True
        audit_result['reasons'].append('疑似测试内容，需要人工确认')
        audit_result['ai_recommendation'] = 'manual_review'

    # 4. 最终决策
    if audit_result['score'] < 0.5:
        audit_result['passed'] = False
        audit_result['ai_recommendation'] = 'reject'
        audit_result['confidence'] = 0.85
    elif audit_result['score'] > 0.8 and not audit_result['requires_manual']:
        audit_result['passed'] = True
        audit_result['ai_recommendation'] = 'approve'
        audit_result['confidence'] = 0.9
    else:
        audit_result['requires_manual'] = True
        audit_result['ai_recommendation'] = 'manual_review'

    return audit_result

@app.route('/api/audit/process', methods=['POST'])
def process_audit():
    """处理审核请求（A表→B表）"""
    try:
        data = request.get_json()
        
        # 验证参数
        required_fields = ['source_table', 'source_id', 'content_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        source_table = data['source_table']
        source_id = data['source_id']
        content_type = data['content_type']
        force_manual = data.get('force_manual', False)
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取原始数据
            cursor.execute(f"""
                SELECT * FROM {source_table} 
                WHERE id = %s AND raw_status = 'pending'
            """, (source_id,))
            
            raw_data = cursor.fetchone()
            if not raw_data:
                return jsonify({
                    'success': False,
                    'error': 'Raw data not found or already processed'
                }), 404
            
            # 检查是否已有审核记录
            cursor.execute("""
                SELECT * FROM audit_records 
                WHERE source_table = %s AND source_id = %s
            """, (source_table, source_id))
            
            existing_audit = cursor.fetchone()
            if existing_audit and existing_audit['audit_result'] != 'pending':
                return jsonify({
                    'success': False,
                    'error': 'Already audited'
                }), 400
            
            # 执行三层审核流程
            if force_manual:
                # 强制人工审核
                final_result = 'flagged'
                audit_type = 'manual_required'
                audit_result = {
                    'layer': 3,
                    'score': 0.5,
                    'reasons': ['强制人工审核'],
                    'confidence': 0.0
                }
            else:
                # 第一层：内置规则审核
                layer1_result = layer1_rule_audit(content_type, raw_data)

                if not layer1_result['passed']:
                    # 第一层直接拒绝
                    final_result = 'rejected'
                    audit_type = 'layer1_auto'
                    audit_result = layer1_result
                elif not layer1_result['requires_next_layer']:
                    # 第一层直接通过
                    final_result = 'approved'
                    audit_type = 'layer1_auto'
                    audit_result = layer1_result
                else:
                    # 进入第二层：AI审核
                    layer2_result = layer2_ai_audit(content_type, raw_data, layer1_result)

                    if layer2_result['requires_manual']:
                        # 需要第三层人工审核
                        final_result = 'flagged'
                        audit_type = 'manual_required'
                        audit_result = layer2_result
                    elif layer2_result['passed']:
                        # AI审核通过
                        final_result = 'approved'
                        audit_type = 'layer2_ai'
                        audit_result = layer2_result
                    else:
                        # AI审核拒绝
                        final_result = 'rejected'
                        audit_type = 'layer2_ai'
                        audit_result = layer2_result
            
            # 更新或创建审核记录
            if existing_audit:
                cursor.execute("""
                    UPDATE audit_records 
                    SET audit_type = %s, audit_result = %s, confidence_score = %s,
                        audit_details = %s, reviewed_at = %s
                    WHERE id = %s
                """, (
                    audit_type, final_result, audit_result['score'],
                    json.dumps(audit_result), datetime.now(), existing_audit['id']
                ))
            else:
                cursor.execute("""
                    INSERT INTO audit_records (
                        source_table, source_id, audit_type, audit_result,
                        confidence_score, audit_details, auditor_type, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    source_table, source_id, audit_type, final_result,
                    audit_result['score'], json.dumps(audit_result),
                    'system', datetime.now()
                ))
            
            # 如果自动通过，迁移到B表
            if final_result == 'approved':
                success = migrate_to_valid_table(cursor, source_table, raw_data, content_type)
                if not success:
                    conn.rollback()
                    return jsonify({
                        'success': False,
                        'error': 'Failed to migrate to valid table'
                    }), 500
            
            # 更新原始数据状态
            cursor.execute(f"""
                UPDATE {source_table} 
                SET raw_status = 'processed' 
                WHERE id = %s
            """, (source_id,))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'data': {
                    'audit_result': final_result,
                    'audit_type': audit_type,
                    'score': audit_result['score'],
                    'reasons': audit_result['reasons'],
                    'requires_manual': audit_result['requires_manual']
                },
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

def migrate_to_valid_table(cursor, source_table: str, raw_data: dict, content_type: str) -> bool:
    """迁移数据到有效数据表（B表）"""
    try:
        if content_type == 'heart_voice':
            cursor.execute("""
                INSERT INTO valid_heart_voices (
                    raw_id, data_uuid, user_id, content, category,
                    emotion_score, tags, is_anonymous, questionnaire_id,
                    audit_status, approved_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                raw_data['id'], raw_data['data_uuid'], raw_data['user_id'],
                raw_data['content'], raw_data['category'], raw_data['emotion_score'],
                raw_data['tags'], raw_data['is_anonymous'], raw_data['questionnaire_id'],
                'approved', datetime.now()
            ))
            
            valid_id = cursor.lastrowid
            
        elif content_type == 'story':
            cursor.execute("""
                INSERT INTO valid_stories (
                    raw_id, data_uuid, user_id, title, content, summary,
                    category, tags, author_name, is_anonymous, questionnaire_id,
                    audit_status, is_published, approved_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                raw_data['id'], raw_data['data_uuid'], raw_data['user_id'],
                raw_data['title'], raw_data['content'], 
                raw_data['content'][:200] + '...' if len(raw_data['content']) > 200 else raw_data['content'],
                raw_data['category'], raw_data['tags'], raw_data['author_name'],
                raw_data['is_anonymous'], raw_data['questionnaire_id'],
                'approved', True, datetime.now()
            ))
            
            valid_id = cursor.lastrowid
            
        else:
            return False
        
        # 创建用户内容管理记录
        cursor.execute("""
            INSERT INTO user_content_management (
                user_id, content_type, content_id, can_download
            ) VALUES (%s, %s, %s, %s)
        """, (
            raw_data['user_id'], content_type, valid_id, True
        ))
        
        return True
        
    except Exception as e:
        print(f"迁移到有效数据表失败: {e}")
        return False

@app.route('/api/audit/pending', methods=['GET'])
def get_pending_audits():
    """获取待审核列表"""
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        content_type = request.args.get('content_type')
        
        offset = (page - 1) * page_size
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 构建查询条件
            where_conditions = ["ar.audit_result = 'flagged'"]
            params = []
            
            if content_type:
                if content_type == 'heart_voice':
                    where_conditions.append("ar.source_table = 'raw_heart_voices'")
                elif content_type == 'story':
                    where_conditions.append("ar.source_table = 'raw_story_submissions'")
            
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
                    ar.id as audit_id, ar.source_table, ar.source_id,
                    ar.audit_type, ar.audit_result, ar.confidence_score,
                    ar.audit_details, ar.created_at,
                    u.nickname as author_name
                FROM audit_records ar
                LEFT JOIN users u ON (
                    (ar.source_table = 'raw_heart_voices' AND EXISTS(
                        SELECT 1 FROM raw_heart_voices rhv WHERE rhv.id = ar.source_id AND rhv.user_id = u.id
                    )) OR
                    (ar.source_table = 'raw_story_submissions' AND EXISTS(
                        SELECT 1 FROM raw_story_submissions rss WHERE rss.id = ar.source_id AND rss.user_id = u.id
                    ))
                )
                WHERE {where_clause}
                ORDER BY ar.created_at DESC
                LIMIT %s OFFSET %s
            """
            
            cursor.execute(list_sql, params + [page_size, offset])
            audits = cursor.fetchall()
            
            # 获取详细内容
            formatted_audits = []
            for audit in audits:
                # 获取原始内容
                if audit['source_table'] == 'raw_heart_voices':
                    cursor.execute("SELECT * FROM raw_heart_voices WHERE id = %s", (audit['source_id'],))
                    content_data = cursor.fetchone()
                    content_preview = content_data['content'][:100] + '...' if content_data else ''
                    content_title = '问卷心声'
                elif audit['source_table'] == 'raw_story_submissions':
                    cursor.execute("SELECT * FROM raw_story_submissions WHERE id = %s", (audit['source_id'],))
                    content_data = cursor.fetchone()
                    content_preview = content_data['content'][:100] + '...' if content_data else ''
                    content_title = content_data['title'] if content_data else ''
                else:
                    content_preview = ''
                    content_title = ''
                
                formatted_audits.append({
                    'auditId': audit['audit_id'],
                    'sourceTable': audit['source_table'],
                    'sourceId': audit['source_id'],
                    'contentType': 'heart_voice' if audit['source_table'] == 'raw_heart_voices' else 'story',
                    'contentTitle': content_title,
                    'contentPreview': content_preview,
                    'authorName': audit['author_name'] or '匿名用户',
                    'auditType': audit['audit_type'],
                    'auditResult': audit['audit_result'],
                    'confidenceScore': float(audit['confidence_score']) if audit['confidence_score'] else 0,
                    'auditDetails': json.loads(audit['audit_details']) if audit['audit_details'] else {},
                    'createdAt': audit['created_at'].isoformat()
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'audits': formatted_audits,
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

@app.route('/api/audit/manual-review', methods=['POST'])
def manual_review():
    """人工审核"""
    try:
        data = request.get_json()
        print(f"收到人工审核请求: {data}")

        # 验证参数
        required_fields = ['audit_id', 'decision', 'reviewer_id']
        for field in required_fields:
            if field not in data:
                print(f"缺少必需字段: {field}")
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        audit_id = data['audit_id']
        decision = data['decision']  # 'approved' or 'rejected'
        reviewer_id = data['reviewer_id']
        notes = data.get('notes', '')
        
        # 检查审核员权限
        print(f"检查审核员权限: {reviewer_id}")
        if not check_user_permission(reviewer_id, 'review'):
            print(f"权限检查失败: {reviewer_id}")
            return jsonify({
                'success': False,
                'error': 'Insufficient permissions'
            }), 403
        print(f"权限检查通过: {reviewer_id}")
        
        if decision not in ['approved', 'rejected']:
            return jsonify({
                'success': False,
                'error': 'Invalid decision'
            }), 400
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取审核记录
            print(f"查询审核记录: audit_id={audit_id}")
            cursor.execute("""
                SELECT * FROM audit_records WHERE id = %s AND audit_result = 'pending'
            """, (audit_id,))

            audit_record = cursor.fetchone()
            print(f"查询到的审核记录: {audit_record}")
            if not audit_record:
                print(f"未找到审核记录: audit_id={audit_id}")
                return jsonify({
                    'success': False,
                    'error': 'Audit record not found or already processed'
                }), 404
            
            # 更新审核记录
            print(f"更新审核记录: audit_id={audit_id}, decision={decision}")
            cursor.execute("""
                UPDATE audit_records
                SET audit_result = %s, audit_level = 'human_review', auditor_id = %s,
                    audit_reason = %s, audited_at = %s
                WHERE id = %s
            """, (
                decision, str(reviewer_id), notes if notes else None,
                datetime.now(), audit_id
            ))
            print(f"审核记录更新成功")

            # 暂时跳过数据迁移，只更新审核状态
            # TODO: 后续实现数据迁移功能
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'data': {
                    'audit_id': audit_id,
                    'decision': decision,
                    'reviewed_at': datetime.now().isoformat()
                },
                'message': f'审核{decision}成功',
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
        print(f"人工审核错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/audit/config', methods=['GET', 'POST'])
def audit_config():
    """获取或更新审核配置"""
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'data': AUDIT_CONFIG,
            'timestamp': time.time()
        })
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            
            # 检查管理员权限
            if not check_user_permission(user_id, 'admin'):
                return jsonify({
                    'success': False,
                    'error': 'Admin permission required'
                }), 403
            
            # 更新配置
            if 'auto_approve_enabled' in data:
                AUDIT_CONFIG['auto_approve_enabled'] = data['auto_approve_enabled']
            if 'auto_approve_all' in data:
                AUDIT_CONFIG['auto_approve_all'] = data['auto_approve_all']
            if 'manual_review_threshold' in data:
                AUDIT_CONFIG['manual_review_threshold'] = data['manual_review_threshold']
            
            return jsonify({
                'success': True,
                'data': AUDIT_CONFIG,
                'message': '审核配置更新成功',
                'timestamp': time.time()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

# ==================== 分级审核API ====================

@app.route('/api/audit/level', methods=['GET', 'POST'])
def audit_level_control():
    """审核级别控制"""
    if not TIERED_AUDIT_ENABLED or not tiered_audit_engine:
        return jsonify({
            'success': False,
            'error': 'Tiered audit not enabled',
            'message': '分级审核未启用'
        }), 503

    if request.method == 'GET':
        try:
            current_level = tiered_audit_engine.current_level
            config = tiered_audit_engine.level_configs.get(current_level)

            return jsonify({
                'success': True,
                'data': {
                    'current_level': current_level.value,
                    'config': {
                        'config_name': config.config_name if config else 'Unknown',
                        'description': config.description if config else '',
                        'rule_strictness': config.rule_strictness if config else 1.0,
                        'ai_threshold': config.ai_threshold if config else 0.5,
                        'manual_review_ratio': config.manual_review_ratio if config else 0.1,
                        'enabled_categories': config.enabled_categories if config else [],
                    },
                    'auto_switch': True  # 假设自动切换总是启用
                },
                'message': '获取审核级别成功'
            })

        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'message': '获取审核级别失败'
            }), 500

    elif request.method == 'POST':
        try:
            data = request.get_json()
            new_level_str = data.get('level')
            admin_id = data.get('admin_id', 'unknown')

            if new_level_str not in ['level1', 'level2', 'level3']:
                return jsonify({
                    'success': False,
                    'error': 'Invalid level',
                    'message': '无效的审核级别'
                }), 400

            new_level = AuditLevel(new_level_str)
            old_level = tiered_audit_engine.current_level

            # 切换级别
            tiered_audit_engine.switch_level(new_level, f"手动切换 by {admin_id}", admin_id)

            return jsonify({
                'success': True,
                'data': {
                    'old_level': old_level.value,
                    'new_level': new_level.value,
                    'config': tiered_audit_engine.level_configs[new_level].__dict__ if new_level in tiered_audit_engine.level_configs else {}
                },
                'message': f'审核级别已切换到{new_level_str}'
            })

        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'message': '切换审核级别失败'
            }), 500

@app.route('/api/audit/stats', methods=['GET'])
def audit_stats():
    """获取审核统计信息"""
    if not TIERED_AUDIT_ENABLED or not tiered_audit_engine:
        return jsonify({
            'success': False,
            'error': 'Tiered audit not enabled'
        }), 503

    try:
        stats_monitor = tiered_audit_engine.stats_monitor
        current_stats = stats_monitor.get_current_hour_stats()

        # 计算违规率
        violation_rate = 0.0
        if current_stats.get('total_submissions', 0) > 0:
            violation_rate = current_stats.get('violation_count', 0) / current_stats['total_submissions']

        return jsonify({
            'success': True,
            'data': {
                'current_level': tiered_audit_engine.current_level.value,
                'current_hour_stats': {
                    'total_submissions': current_stats.get('total_submissions', 0),
                    'violation_count': current_stats.get('violation_count', 0),
                    'violation_rate': round(violation_rate * 100, 2),
                    'spam_count': current_stats.get('spam_count', 0),
                    'manual_review_count': current_stats.get('manual_review_count', 0),
                    'unique_ips': len(current_stats.get('ips', set()))
                },
                'level_configs': {
                    level.value: {
                        'config_name': config.config_name,
                        'description': config.description,
                        'ai_threshold': config.ai_threshold,
                        'manual_review_ratio': config.manual_review_ratio
                    }
                    for level, config in tiered_audit_engine.level_configs.items()
                }
            },
            'message': '获取审核统计成功'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '获取审核统计失败'
        }), 500

@app.route('/api/audit/history', methods=['GET'])
def audit_level_history():
    """获取审核级别切换历史"""
    if not TIERED_AUDIT_ENABLED:
        return jsonify({
            'success': False,
            'error': 'Tiered audit not enabled'
        }), 503

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # 获取最近的切换历史
        cursor.execute("""
            SELECT from_level, to_level, trigger_reason, switched_by,
                   admin_id, switched_at
            FROM audit_level_history
            ORDER BY switched_at DESC
            LIMIT 50
        """)

        history = cursor.fetchall()

        # 转换时间格式
        for record in history:
            if record['switched_at']:
                record['switched_at'] = record['switched_at'].isoformat()

        return jsonify({
            'success': True,
            'data': history,
            'message': '获取切换历史成功'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '获取切换历史失败'
        }), 500
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/audit/test', methods=['POST'])
def test_audit():
    """测试审核功能"""
    if not TIERED_AUDIT_ENABLED or not tiered_audit_engine:
        return jsonify({
            'success': False,
            'error': 'Tiered audit not enabled'
        }), 503

    try:
        data = request.get_json()
        content = data.get('content', '')
        content_type = data.get('content_type', 'story')

        if not content:
            return jsonify({
                'success': False,
                'error': 'Content required',
                'message': '内容不能为空'
            }), 400

        # 执行审核测试
        decision = tiered_audit_engine.check_content_with_level(content, content_type)

        return jsonify({
            'success': True,
            'data': {
                'passed': decision.passed,
                'action': decision.action,
                'audit_level': decision.audit_level,
                'risk_score': decision.risk_score,
                'confidence': decision.confidence,
                'reason': decision.reason,
                'violations': [
                    {
                        'rule_id': v.rule_id,
                        'category': v.category,
                        'matched_text': v.matched_text,
                        'severity': v.severity,
                        'confidence': v.confidence
                    } for v in decision.violations
                ]
            },
            'message': '审核测试完成'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '审核测试失败'
        }), 500

if __name__ == '__main__':
    print("启动分级审核API服务...")
    print(f"分级审核引擎状态: {'启用' if TIERED_AUDIT_ENABLED else '禁用'}")
    if TIERED_AUDIT_ENABLED and tiered_audit_engine:
        print(f"当前审核级别: {tiered_audit_engine.current_level.value}")
    app.run(host='0.0.0.0', port=5001, debug=True)

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
    print("🔍 Starting Audit API Server...")
    print("🎯 Features:")
    print("   • Automatic content review (A→B table migration)")
    print("   • Manual review workflow")
    print("   • Configurable audit rules")
    print("   • Audit queue management")
    print(f"   • Auto-approve mode: {'ON' if AUDIT_CONFIG['auto_approve_all'] else 'OFF'}")
    print()
    print("🔌 Available endpoints:")
    print("   POST /api/audit/process - Process audit (A→B)")
    print("   GET  /api/audit/pending - Get pending audits")
    print("   POST /api/audit/manual-review - Manual review")
    print("   GET  /api/audit/config - Get audit config")
    print("   POST /api/audit/config - Update audit config")
    print()
    print("🌐 Server running on: http://localhost:8005")
    print("📝 CORS enabled for frontend integration")
    print()
    
    app.run(host='0.0.0.0', port=8005, debug=True)
