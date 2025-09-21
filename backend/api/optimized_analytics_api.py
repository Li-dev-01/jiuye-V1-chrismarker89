"""
优化的数据分析API
基于静态汇总表的高性能API服务
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
import logging
from optimized_analytics_service import OptimizedAnalyticsService

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Redis配置
REDIS_CONFIG = {
    'host': 'localhost',
    'port': 6379,
    'db': 0,
    'decode_responses': True
}

# 创建优化的分析服务实例
analytics_service = OptimizedAnalyticsService(DB_CONFIG, REDIS_CONFIG)

@app.route('/api/analytics/basic-stats', methods=['GET'])
def get_basic_statistics():
    """获取基础统计数据（优化版）"""
    try:
        dimension = request.args.get('dimension')
        value = request.args.get('value')
        use_cache = request.args.get('useCache', 'true').lower() == 'true'
        
        stats = analytics_service.get_basic_statistics(dimension, value, use_cache)
        
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in get_basic_statistics: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/distribution', methods=['GET'])
def get_distribution_data():
    """获取分布数据（优化版）"""
    try:
        question_id = request.args.get('questionId')
        if not question_id:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: questionId'
            }), 400
        
        dimension = request.args.get('dimension')
        value = request.args.get('value')
        use_cache = request.args.get('useCache', 'true').lower() == 'true'
        
        distribution = analytics_service.get_distribution_data(question_id, dimension, value, use_cache)
        
        return jsonify({
            'success': True,
            'data': distribution,
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in get_distribution_data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/cross-analysis', methods=['GET'])
def get_cross_analysis():
    """获取交叉分析数据（优化版）"""
    try:
        dimension1 = request.args.get('dimension1')
        dimension2 = request.args.get('dimension2')
        
        if not dimension1 or not dimension2:
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: dimension1, dimension2'
            }), 400
        
        use_cache = request.args.get('useCache', 'true').lower() == 'true'
        
        cross_data = analytics_service.get_cross_analysis(dimension1, dimension2, use_cache)
        
        return jsonify({
            'success': True,
            'data': cross_data,
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in get_cross_analysis: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/sync', methods=['POST'])
def trigger_sync():
    """手动触发数据同步"""
    try:
        data = request.get_json() or {}
        force = data.get('force', False)
        
        result = analytics_service.sync_all_data(force)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result,
                'message': '数据同步已启动',
                'timestamp': time.time()
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'data': result
            }), 400
            
    except Exception as e:
        logger.error(f"Error in trigger_sync: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/sync/status', methods=['GET'])
def get_sync_status():
    """获取同步状态"""
    try:
        status = analytics_service.get_sync_status()
        
        return jsonify({
            'success': True,
            'data': status['tasks'] if status['success'] else [],
            'lastSync': status.get('lastSync'),
            'nextScheduledSync': status.get('nextScheduledSync'),
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in get_sync_status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/performance', methods=['GET'])
def get_performance_metrics():
    """获取性能指标"""
    try:
        metrics = analytics_service.get_performance_metrics()
        
        return jsonify({
            'success': True,
            'data': metrics,
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in get_performance_metrics: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """清除缓存"""
    try:
        data = request.get_json() or {}
        pattern = data.get('pattern')
        
        analytics_service.invalidate_cache(pattern)
        
        return jsonify({
            'success': True,
            'message': '缓存已清除',
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in invalidate_cache: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/health', methods=['GET'])
def health_check():
    """健康检查（优化版）"""
    try:
        # 检查数据库连接
        stats = analytics_service.get_basic_statistics(use_cache=False)
        
        # 检查同步状态
        sync_status = analytics_service.get_sync_status()
        
        # 检查Redis连接
        redis_status = 'connected'
        if analytics_service.redis_client:
            try:
                analytics_service.redis_client.ping()
            except:
                redis_status = 'disconnected'
        else:
            redis_status = 'not_configured'
        
        return jsonify({
            'success': True,
            'data': {
                'status': 'healthy',
                'database': 'connected',
                'redis': redis_status,
                'totalRecords': stats.get('totalResponses', 0),
                'lastSync': sync_status.get('lastSync'),
                'syncScheduler': 'running' if analytics_service.scheduler else 'stopped'
            },
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in health_check: {e}")
        return jsonify({
            'success': False,
            'data': {
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            },
            'timestamp': time.time()
        }), 500

# 兼容性端点（保持与原API的兼容性）
@app.route('/api/analytics/employment', methods=['GET'])
def get_employment_analysis():
    """就业分析数据（兼容性端点）"""
    try:
        # 使用交叉分析获取学历与就业状态的关系
        cross_data = analytics_service.get_cross_analysis('education-level', 'current-status')
        
        # 转换为就业分析格式
        employment_data = []
        for item in cross_data:
            education = item['category']
            total = item['total']
            
            employed = 0
            unemployed = 0
            
            for breakdown in item['breakdown']:
                if breakdown['label'] in ['fulltime', 'parttime']:
                    employed += breakdown['value']
                elif breakdown['label'] == 'unemployed':
                    unemployed += breakdown['value']
            
            employment_rate = round((employed / max(total, 1)) * 100, 1)
            
            employment_data.append({
                'education': education,
                'total': total,
                'employed': employed,
                'unemployed': unemployed,
                'employmentRate': employment_rate
            })
        
        return jsonify({
            'success': True,
            'data': employment_data,
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in get_employment_analysis: {e}")
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
    print("🚀 Starting Optimized Analytics API Server...")
    print("📊 Performance Features:")
    print("   • Static aggregation tables for fast queries")
    print("   • 5-minute data synchronization")
    print("   • Multi-layer caching (Redis + Database)")
    print("   • Automatic background sync scheduler")
    print()
    print("🔌 Available endpoints:")
    print("   GET  /api/analytics/basic-stats - Get basic statistics (optimized)")
    print("   GET  /api/analytics/distribution - Get distribution data (optimized)")
    print("   GET  /api/analytics/cross-analysis - Get cross analysis (optimized)")
    print("   POST /api/analytics/sync - Trigger manual sync")
    print("   GET  /api/analytics/sync/status - Get sync status")
    print("   GET  /api/analytics/performance - Get performance metrics")
    print("   POST /api/analytics/cache/invalidate - Clear cache")
    print("   GET  /api/analytics/health - Health check (optimized)")
    print("   GET  /api/analytics/employment - Employment analysis (compatibility)")
    print()
    print("⚡ Performance targets:")
    print("   • Query response time: <200ms")
    print("   • Cache hit rate: >80%")
    print("   • Sync duration: <10s")
    print("   • Support 10,000 queries/minute")
    print()
    
    # 启动定时同步调度器
    analytics_service.start_scheduler()
    
    try:
        app.run(host='0.0.0.0', port=8001, debug=False)
    finally:
        # 停止调度器
        analytics_service.stop_scheduler()
