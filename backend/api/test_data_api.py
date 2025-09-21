"""
测试数据生成API
提供REST接口支持前端测试数据生成功能
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
from test_data_service import TestDataService
from smart_data_generator import SmartDataGenerator

app = Flask(__name__)
CORS(app)

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': ''  # MySQL安装时没有设置密码,  # 需要配置实际密码
    'database': 'questionnaire_db',
    'charset': 'utf8mb4',
    'autocommit': False
}

# 创建测试数据服务实例
test_service = TestDataService(DB_CONFIG)
smart_generator = SmartDataGenerator(DB_CONFIG)

@app.route('/api/test-data/stats', methods=['GET'])
def get_current_stats():
    """获取当前数据统计"""
    try:
        stats = test_service.get_current_stats()
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': time.time()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-data/generate', methods=['POST'])
def generate_test_data():
    """生成测试数据"""
    try:
        params = request.get_json()
        
        # 验证参数
        if not params or 'count' not in params:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: count'
            }), 400
        
        # 限制生成数量
        count = params['count']
        if count > 10000:
            return jsonify({
                'success': False,
                'error': 'Maximum generation count is 10000'
            }), 400
        
        # 生成数据
        result = test_service.batch_generate(params)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'generated': result['generated'],
                    'failed': result['failed'],
                    'preview': result['preview']
                },
                'timestamp': time.time()
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Generation failed')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-data/clear', methods=['DELETE'])
def clear_all_data():
    """清除所有测试数据"""
    try:
        result = test_service.clear_all_data()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'cleared_counts': result['cleared_counts'],
                    'total_cleared': result['total_cleared']
                },
                'timestamp': time.time()
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Clear operation failed')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-data/preview', methods=['POST'])
def preview_generation():
    """预览生成参数的效果"""
    try:
        params = request.get_json()
        
        # 生成少量预览数据
        preview_params = params.copy()
        preview_params['count'] = 5
        
        preview_data = []
        for i in range(5):
            data = test_service.generate_questionnaire_data(preview_params)
            preview_data.append({
                'id': f'preview_{i+1}',
                'education': data['answers']['education-level'],
                'employment': data['answers']['current-status'],
                'gender': data['answers']['gender'],
                'completed': data['is_completed'],
                'quality': f"{data['quality_score']:.2f}"
            })
        
        return jsonify({
            'success': True,
            'data': {
                'preview': preview_data,
                'estimated_distribution': {
                    'completion_rate': params.get('completionRate', 90),
                    'avg_quality': params.get('qualityScore', 85),
                    'education_dist': params.get('educationDistribution', {}),
                    'employment_dist': params.get('employmentDistribution', {})
                }
            },
            'timestamp': time.time()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-data/validate', methods=['POST'])
def validate_parameters():
    """验证生成参数"""
    try:
        params = request.get_json()
        
        errors = []
        warnings = []
        
        # 验证必需参数
        if 'count' not in params:
            errors.append('Missing required parameter: count')
        elif params['count'] <= 0:
            errors.append('Count must be greater than 0')
        elif params['count'] > 10000:
            errors.append('Count cannot exceed 10000')
        
        # 验证完成率
        completion_rate = params.get('completionRate', 90)
        if completion_rate < 0 or completion_rate > 100:
            errors.append('Completion rate must be between 0 and 100')
        elif completion_rate < 50:
            warnings.append('Low completion rate may affect data quality')
        
        # 验证质量分
        quality_score = params.get('qualityScore', 85)
        if quality_score < 0 or quality_score > 100:
            errors.append('Quality score must be between 0 and 100')
        elif quality_score < 60:
            warnings.append('Low quality score may generate unrealistic data')
        
        # 验证分布参数
        education_dist = params.get('educationDistribution', {})
        if education_dist:
            total = sum(education_dist.values())
            if abs(total - 100) > 1:  # 允许1%的误差
                warnings.append('Education distribution should sum to 100%')
        
        return jsonify({
            'success': True,
            'data': {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings
            },
            'timestamp': time.time()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-data/templates', methods=['GET'])
def get_generation_templates():
    """获取预定义的生成模板"""
    templates = [
        {
            'id': 'small_test',
            'name': '小规模测试',
            'description': '适合功能测试的小数据集',
            'params': {
                'count': 10,
                'completionRate': 100,
                'qualityScore': 95,
                'timeRange': 'recent'
            }
        },
        {
            'id': 'medium_test',
            'name': '中等规模测试',
            'description': '适合性能测试的中等数据集',
            'params': {
                'count': 100,
                'completionRate': 90,
                'qualityScore': 85,
                'timeRange': 'quarter'
            }
        },
        {
            'id': 'large_test',
            'name': '大规模测试',
            'description': '适合压力测试的大数据集',
            'params': {
                'count': 1000,
                'completionRate': 85,
                'qualityScore': 80,
                'timeRange': 'halfyear'
            }
        },
        {
            'id': 'stress_test',
            'name': '压力测试',
            'description': '极限数据量测试',
            'params': {
                'count': 5000,
                'completionRate': 75,
                'qualityScore': 70,
                'timeRange': 'year'
            }
        },
        {
            'id': 'realistic_scenario',
            'name': '真实场景模拟',
            'description': '模拟真实的问卷收集场景',
            'params': {
                'count': 500,
                'completionRate': 78,
                'qualityScore': 82,
                'timeRange': 'quarter',
                'includeHeartVoices': True,
                'includeStoryWall': True
            }
        }
    ]
    
    return jsonify({
        'success': True,
        'data': templates,
        'timestamp': time.time()
    })

@app.route('/api/test-data/health', methods=['GET'])
def health_check():
    """健康检查"""
    try:
        # 测试数据库连接
        stats = test_service.get_current_stats()
        
        return jsonify({
            'success': True,
            'data': {
                'status': 'healthy',
                'database': 'connected',
                'current_records': stats['totalRecords']
            },
            'timestamp': time.time()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'data': {
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            },
            'timestamp': time.time()
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

# ============================================
# 智能数据生成API端点
# ============================================

@app.route('/api/admin/data-generator/clear', methods=['POST'])
def clear_data():
    """清除现有数据"""
    try:
        data = request.get_json()
        data_type = data.get('dataType', 'all')

        result = smart_generator.clear_data(data_type)

        if result['success']:
            return jsonify({
                'success': True,
                'message': result['message'],
                'data': result.get('details', {})
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'清除数据失败: {str(e)}'
        }), 500

@app.route('/api/admin/data-generator/smart-voice', methods=['POST'])
def generate_smart_voice_data():
    """生成智能心声数据"""
    try:
        config = request.get_json()

        result = smart_generator.generate_smart_voice_data(config)

        if result['success']:
            return jsonify({
                'success': True,
                'message': result['message'],
                'data': result.get('data', {})
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'生成心声数据失败: {str(e)}'
        }), 500

@app.route('/api/admin/data-generator/smart-story', methods=['POST'])
def generate_smart_story_data():
    """生成智能故事数据"""
    try:
        config = request.get_json()

        result = smart_generator.generate_smart_story_data(config)

        if result['success']:
            return jsonify({
                'success': True,
                'message': result['message'],
                'data': result.get('data', {})
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'生成故事数据失败: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Test Data Generation API Server...")
    print("📊 Available endpoints:")
    print("   GET  /api/test-data/stats - Get current data statistics")
    print("   POST /api/test-data/generate - Generate test data")
    print("   DELETE /api/test-data/clear - Clear all test data")
    print("   POST /api/test-data/preview - Preview generation parameters")
    print("   POST /api/test-data/validate - Validate parameters")
    print("   GET  /api/test-data/templates - Get generation templates")
    print("   GET  /api/test-data/health - Health check")
    print()
    print("🌐 Server running on: http://localhost:8000")
    print("📝 CORS enabled for frontend integration")
    print()
    
    app.run(host='0.0.0.0', port=8000, debug=True)
