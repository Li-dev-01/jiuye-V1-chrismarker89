"""
PNG卡片生成API
提供问卷心声和故事的PNG卡片生成、下载服务
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import time
import mysql.connector
from mysql.connector import Error
import uuid
from datetime import datetime
import os
import sys

# 添加服务路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
from png_card_generator import PNGCardGenerator, ContentData

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

# R2存储配置
R2_CONFIG = {
    'account_id': 'your_account_id',
    'access_key_id': 'your_access_key',
    'secret_access_key': 'your_secret_key',
    'bucket_name': 'questionnaire-cards',
    'domain': 'https://your-r2-domain.com'
}

# 创建PNG生成器实例
png_generator = PNGCardGenerator(R2_CONFIG)

def get_connection():
    """获取数据库连接"""
    return mysql.connector.connect(**DB_CONFIG)

def check_user_permission(user_id: int, permission: str) -> bool:
    """检查用户权限"""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 检查用户类型和权限
        cursor.execute("""
            SELECT user_type, permissions 
            FROM users 
            WHERE id = %s AND status = 'active'
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            return False
        
        # 半匿名用户才有下载权限
        if permission == 'download' and user['user_type'] != 'semi_anonymous':
            return False
        
        return True
        
    except Exception as e:
        print(f"权限检查错误: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

@app.route('/api/cards/generate', methods=['POST'])
def generate_cards():
    """生成PNG卡片"""
    try:
        data = request.get_json()
        
        # 验证参数
        required_fields = ['content_type', 'content_id', 'user_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        content_type = data['content_type']  # 'heart_voice' or 'story'
        content_id = data['content_id']
        user_id = data['user_id']
        styles = data.get('styles', ['style_1', 'style_2', 'minimal'])  # 默认生成3种风格
        
        # 检查用户权限
        if not check_user_permission(user_id, 'create'):
            return jsonify({
                'success': False,
                'error': 'Insufficient permissions'
            }), 403
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取内容数据
            if content_type == 'heart_voice':
                cursor.execute("""
                    SELECT v.*, u.nickname as author_name
                    FROM valid_heart_voices v
                    JOIN users u ON v.user_id = u.id
                    WHERE v.id = %s AND v.user_id = %s
                """, (content_id, user_id))
            elif content_type == 'story':
                cursor.execute("""
                    SELECT v.*, u.nickname as author_name
                    FROM valid_stories v
                    JOIN users u ON v.user_id = u.id
                    WHERE v.id = %s AND v.user_id = %s
                """, (content_id, user_id))
            else:
                return jsonify({
                    'success': False,
                    'error': 'Invalid content type'
                }), 400
            
            content = cursor.fetchone()
            if not content:
                return jsonify({
                    'success': False,
                    'error': 'Content not found or access denied'
                }), 404
            
            # 准备内容数据
            content_data = ContentData(
                content_type=content_type,
                title=content.get('title', '问卷心声'),
                content=content['content'],
                author_name=content['author_name'] or '匿名用户',
                created_at=content['created_at'].isoformat(),
                tags=json.loads(content.get('tags', '[]')) if content.get('tags') else [],
                emotion_score=float(content.get('emotion_score', 0)) if content.get('emotion_score') else None
            )
            
            # 生成指定风格的卡片
            generation_results = {}
            for style in styles:
                try:
                    if content_type == 'heart_voice':
                        image_data = png_generator.generate_heart_voice_card(content_data, style)
                    else:
                        image_data = png_generator.generate_story_card(content_data, style)
                    
                    # 生成文件名
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"{content_type}_{content_id}_{style}_{timestamp}.png"
                    
                    # 上传到R2
                    upload_result = png_generator.upload_to_r2(image_data, filename)
                    
                    if upload_result['success']:
                        # 保存到数据库
                        cursor.execute("""
                            INSERT INTO content_png_cards (
                                content_type, content_id, content_uuid, creator_user_id,
                                card_style, file_name, file_path, file_url, file_size,
                                image_width, image_height, generation_status,
                                generation_completed_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            content_type, content_id, content['data_uuid'], user_id,
                            style, filename, upload_result['file_path'], upload_result['file_url'],
                            upload_result['file_size'], 800, 600, 'completed', datetime.now()
                        ))
                        
                        card_id = cursor.lastrowid
                        generation_results[style] = {
                            'card_id': card_id,
                            'style': style,
                            'filename': filename,
                            'file_url': upload_result['file_url'],
                            'file_size': upload_result['file_size']
                        }
                    else:
                        generation_results[style] = {
                            'style': style,
                            'error': upload_result.get('error', 'Upload failed')
                        }
                        
                except Exception as e:
                    generation_results[style] = {
                        'style': style,
                        'error': str(e)
                    }
            
            # 更新用户内容管理状态
            cursor.execute("""
                UPDATE user_content_management 
                SET png_generation_status = 'completed',
                    png_cards_count = %s
                WHERE user_id = %s AND content_type = %s AND content_id = %s
            """, (len([r for r in generation_results.values() if 'card_id' in r]), 
                  user_id, content_type, content_id))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'data': {
                    'content_id': content_id,
                    'content_type': content_type,
                    'generated_cards': generation_results,
                    'total_generated': len([r for r in generation_results.values() if 'card_id' in r])
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

@app.route('/api/cards/download/<int:card_id>', methods=['GET'])
def download_card(card_id):
    """下载PNG卡片"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Missing user_id parameter'
            }), 400
        
        # 检查下载权限
        if not check_user_permission(int(user_id), 'download'):
            return jsonify({
                'success': False,
                'error': 'No download permission'
            }), 403
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取卡片信息
            cursor.execute("""
                SELECT * FROM content_png_cards 
                WHERE id = %s AND generation_status = 'completed'
            """, (card_id,))
            
            card = cursor.fetchone()
            if not card:
                return jsonify({
                    'success': False,
                    'error': 'Card not found'
                }), 404
            
            # 记录下载
            cursor.execute("""
                INSERT INTO png_download_records (
                    downloader_user_id, downloader_uuid, png_card_id,
                    content_type, content_id, download_method, download_ip
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, str(uuid.uuid4()), card_id,
                card['content_type'], card['content_id'], 'direct',
                request.remote_addr
            ))
            
            # 更新下载统计
            cursor.execute("""
                UPDATE content_png_cards 
                SET download_count = download_count + 1,
                    last_downloaded_at = NOW()
                WHERE id = %s
            """, (card_id,))
            
            conn.commit()
            
            # 返回下载URL（实际实现中应该返回文件流）
            return jsonify({
                'success': True,
                'data': {
                    'download_url': card['file_url'],
                    'filename': card['file_name'],
                    'file_size': card['file_size']
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

@app.route('/api/cards/user/<int:user_id>', methods=['GET'])
def get_user_cards(user_id):
    """获取用户的PNG卡片列表"""
    try:
        # 检查权限
        if not check_user_permission(user_id, 'view'):
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取用户的卡片
            cursor.execute("""
                SELECT c.*, 
                       CASE 
                           WHEN c.content_type = 'heart_voice' THEN h.content
                           WHEN c.content_type = 'story' THEN s.title
                       END as content_preview
                FROM content_png_cards c
                LEFT JOIN valid_heart_voices h ON c.content_type = 'heart_voice' AND c.content_id = h.id
                LEFT JOIN valid_stories s ON c.content_type = 'story' AND c.content_id = s.id
                WHERE c.creator_user_id = %s AND c.generation_status = 'completed'
                ORDER BY c.created_at DESC
            """, (user_id,))
            
            cards = cursor.fetchall()
            
            # 格式化返回数据
            formatted_cards = []
            for card in cards:
                formatted_cards.append({
                    'card_id': card['id'],
                    'content_type': card['content_type'],
                    'content_id': card['content_id'],
                    'card_style': card['card_style'],
                    'filename': card['file_name'],
                    'file_url': card['file_url'],
                    'file_size': card['file_size'],
                    'download_count': card['download_count'],
                    'content_preview': card['content_preview'][:50] + '...' if card['content_preview'] else '',
                    'created_at': card['created_at'].isoformat(),
                    'last_downloaded_at': card['last_downloaded_at'].isoformat() if card['last_downloaded_at'] else None
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'cards': formatted_cards,
                    'total_count': len(formatted_cards)
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

@app.route('/api/cards/styles', methods=['GET'])
def get_card_styles():
    """获取可用的卡片风格"""
    try:
        styles = []
        for style_name, style_config in png_generator.styles.items():
            styles.append({
                'style_id': style_name,
                'style_name': style_config.name,
                'width': style_config.width,
                'height': style_config.height,
                'description': f"{style_config.name} - {style_config.width}x{style_config.height}"
            })
        
        return jsonify({
            'success': True,
            'data': {
                'styles': styles,
                'total_count': len(styles)
            },
            'timestamp': time.time()
        })
        
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
    print("🎨 Starting PNG Card Generation API Server...")
    print("🖼️ Features:")
    print("   • Multi-style PNG card generation")
    print("   • Cloudflare R2 storage integration")
    print("   • User permission control")
    print("   • Download tracking and analytics")
    print()
    print("🔌 Available endpoints:")
    print("   POST /api/cards/generate - Generate PNG cards")
    print("   GET  /api/cards/download/<card_id> - Download PNG card")
    print("   GET  /api/cards/user/<user_id> - Get user's cards")
    print("   GET  /api/cards/styles - Get available card styles")
    print()
    print("🌐 Server running on: http://localhost:8002")
    print("📝 CORS enabled for frontend integration")
    print()
    
    app.run(host='0.0.0.0', port=8002, debug=True)
