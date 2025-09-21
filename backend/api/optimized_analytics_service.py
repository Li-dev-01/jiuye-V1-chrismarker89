"""
优化的数据分析API服务
基于静态汇总表提供高性能数据查询
支持5分钟同步策略和多层缓存
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector import Error
import redis
import hashlib
from apscheduler.schedulers.background import BackgroundScheduler
import logging

class OptimizedAnalyticsService:
    """优化的数据分析服务"""
    
    def __init__(self, db_config: Dict, redis_config: Dict = None):
        self.db_config = db_config
        self.redis_client = None
        self.scheduler = None
        
        if redis_config:
            self.redis_client = redis.Redis(**redis_config)
        
        # 设置日志
        self.logger = logging.getLogger(__name__)
    
    def get_connection(self):
        """获取数据库连接"""
        return mysql.connector.connect(**self.db_config)
    
    def cache_key(self, prefix: str, **params) -> str:
        """生成缓存键"""
        param_str = json.dumps(params, sort_keys=True)
        hash_str = hashlib.md5(param_str.encode()).hexdigest()[:8]
        return f"analytics:{prefix}:{hash_str}"
    
    def get_cached_data(self, cache_key: str) -> Optional[Dict]:
        """从Redis获取缓存数据"""
        if not self.redis_client:
            return None
        
        try:
            cached = self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            self.logger.warning(f"Cache get error: {e}")
        return None
    
    def set_cached_data(self, cache_key: str, data: Dict, ttl: int = 300):
        """设置Redis缓存数据（默认5分钟TTL）"""
        if not self.redis_client:
            return
        
        try:
            self.redis_client.setex(
                cache_key, 
                ttl, 
                json.dumps(data, default=str)
            )
        except Exception as e:
            self.logger.warning(f"Cache set error: {e}")
    
    def get_basic_statistics(self, dimension: str = None, value: str = None, use_cache: bool = True) -> Dict[str, Any]:
        """获取基础统计数据（从静态汇总表）"""
        cache_key = self.cache_key("basic_stats", dimension=dimension, value=value)
        
        if use_cache:
            cached = self.get_cached_data(cache_key)
            if cached:
                cached['source'] = 'cache'
                return cached
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 从静态汇总表查询
            where_conditions = ["summary_type = 'basic'"]
            params = []
            
            if dimension and value:
                where_conditions.extend(["dimension = %s", "dimension_value = %s"])
                params.extend([dimension, value])
            elif not dimension:
                where_conditions.append("dimension IS NULL")
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            SELECT 
                total_responses,
                completed_responses,
                completion_rate,
                avg_completion_time,
                avg_quality_score,
                employment_count,
                unemployment_count,
                employment_rate,
                data_range_from,
                data_range_to,
                last_updated
            FROM analytics_summary
            WHERE {where_clause}
            ORDER BY last_updated DESC
            LIMIT 1
            """
            
            cursor.execute(query, params)
            result = cursor.fetchone()
            
            if not result:
                # 如果静态表没有数据，返回默认值
                result = {
                    'total_responses': 0,
                    'completed_responses': 0,
                    'completion_rate': 0,
                    'avg_completion_time': 0,
                    'avg_quality_score': 0,
                    'employment_count': 0,
                    'unemployment_count': 0,
                    'employment_rate': 0,
                    'data_range_from': None,
                    'data_range_to': None,
                    'last_updated': datetime.now()
                }
            
            # 格式化响应
            response = {
                'totalResponses': result['total_responses'],
                'completedResponses': result['completed_responses'],
                'completionRate': float(result['completion_rate']),
                'avgCompletionTime': float(result['avg_completion_time']),
                'qualityScore': float(result['avg_quality_score']),
                'employmentRate': float(result['employment_rate']),
                'unemploymentRate': round(100 - float(result['employment_rate']), 2),
                'dataRange': {
                    'from': result['data_range_from'].isoformat() if result['data_range_from'] else None,
                    'to': result['data_range_to'].isoformat() if result['data_range_to'] else None
                },
                'lastUpdated': result['last_updated'].isoformat(),
                'source': 'static'
            }
            
            # 缓存结果
            if use_cache:
                self.set_cached_data(cache_key, response, 300)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting basic statistics: {e}")
            raise
        finally:
            cursor.close()
            conn.close()
    
    def get_distribution_data(self, question_id: str, dimension: str = None, value: str = None, use_cache: bool = True) -> List[Dict]:
        """获取分布数据（从静态汇总表）"""
        cache_key = self.cache_key("distribution", question_id=question_id, dimension=dimension, value=value)
        
        if use_cache:
            cached = self.get_cached_data(cache_key)
            if cached:
                return cached
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 从静态汇总表查询
            where_conditions = ["question_id = %s"]
            params = [question_id]
            
            if dimension and value:
                where_conditions.extend(["dimension = %s", "dimension_value = %s"])
                params.extend([dimension, value])
            else:
                where_conditions.append("dimension IS NULL")
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            SELECT 
                option_value as label,
                count as value,
                percentage
            FROM analytics_distribution
            WHERE {where_clause}
            ORDER BY count DESC
            """
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            # 格式化响应
            distribution = []
            for row in results:
                distribution.append({
                    'label': row['label'],
                    'value': row['value'],
                    'percentage': float(row['percentage'])
                })
            
            # 缓存结果
            if use_cache:
                self.set_cached_data(cache_key, distribution, 300)
            
            return distribution
            
        except Exception as e:
            self.logger.error(f"Error getting distribution data: {e}")
            raise
        finally:
            cursor.close()
            conn.close()
    
    def get_cross_analysis(self, dimension1: str, dimension2: str, use_cache: bool = True) -> List[Dict]:
        """获取交叉分析数据（从静态汇总表）"""
        cache_key = self.cache_key("cross_analysis", dim1=dimension1, dim2=dimension2)
        
        if use_cache:
            cached = self.get_cached_data(cache_key)
            if cached:
                return cached
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                value1 as category,
                value2 as subcategory,
                count,
                percentage
            FROM analytics_cross
            WHERE dimension1 = %s AND dimension2 = %s
            ORDER BY value1, count DESC
            """
            
            cursor.execute(query, [dimension1, dimension2])
            results = cursor.fetchall()
            
            # 处理交叉分析结果
            cross_data = {}
            for row in results:
                category = row['category']
                if category not in cross_data:
                    cross_data[category] = {
                        'category': category,
                        'total': 0,
                        'breakdown': []
                    }
                
                cross_data[category]['breakdown'].append({
                    'label': row['subcategory'],
                    'value': row['count'],
                    'percentage': float(row['percentage'])
                })
                cross_data[category]['total'] += row['count']
            
            # 转换为列表格式
            result = list(cross_data.values())
            
            # 缓存结果
            if use_cache:
                self.set_cached_data(cache_key, result, 300)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error getting cross analysis: {e}")
            raise
        finally:
            cursor.close()
            conn.close()
    
    def sync_all_data(self, force: bool = False) -> Dict:
        """手动触发数据同步"""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 检查是否有正在运行的同步任务
            if not force:
                cursor.execute("""
                    SELECT id FROM analytics_sync_tasks 
                    WHERE status = 'running' 
                    AND started_at > NOW() - INTERVAL 10 MINUTE
                """)
                running_task = cursor.fetchone()
                if running_task:
                    return {
                        'success': False,
                        'error': 'Sync already running',
                        'taskId': running_task['id']
                    }
            
            # 调用存储过程
            cursor.execute("CALL SyncAllAnalyticsData()")
            conn.commit()
            
            # 获取最新的同步任务
            cursor.execute("""
                SELECT id, task_type, status, started_at, completed_at, 
                       affected_rows, duration_seconds
                FROM analytics_sync_tasks
                WHERE task_type IN ('basic_statistics', 'distribution_data')
                ORDER BY id DESC
                LIMIT 5
            """)
            tasks = cursor.fetchall()
            
            # 清除Redis缓存
            if self.redis_client:
                try:
                    # 删除所有analytics相关的缓存
                    keys = self.redis_client.keys('analytics:*')
                    if keys:
                        self.redis_client.delete(*keys)
                    self.logger.info(f"Cleared {len(keys)} cache keys")
                except Exception as e:
                    self.logger.warning(f"Cache clear error: {e}")
            
            return {
                'success': True,
                'tasks': [
                    {
                        'id': task['id'],
                        'type': task['task_type'],
                        'status': task['status'],
                        'startedAt': task['started_at'].isoformat() if task['started_at'] else None,
                        'completedAt': task['completed_at'].isoformat() if task['completed_at'] else None,
                        'duration': task['duration_seconds'],
                        'affectedRows': task['affected_rows']
                    }
                    for task in tasks
                ]
            }
            
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error syncing data: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            cursor.close()
            conn.close()
    
    def get_sync_status(self) -> Dict:
        """获取同步状态"""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取最近的同步任务
            cursor.execute("""
                SELECT id, task_type as type, status, 
                       started_at as startedAt, 
                       completed_at as completedAt,
                       duration_seconds as duration,
                       affected_rows as affectedRows,
                       error_message as errorMessage
                FROM analytics_sync_tasks
                ORDER BY id DESC
                LIMIT 10
            """)
            tasks = cursor.fetchall()
            
            # 格式化时间
            for task in tasks:
                if task['startedAt']:
                    task['startedAt'] = task['startedAt'].isoformat()
                if task['completedAt']:
                    task['completedAt'] = task['completedAt'].isoformat()
            
            # 获取最后同步时间
            cursor.execute("""
                SELECT MAX(completed_at) as last_sync
                FROM analytics_sync_tasks
                WHERE status = 'completed'
            """)
            last_sync_result = cursor.fetchone()
            last_sync = last_sync_result['last_sync'].isoformat() if last_sync_result and last_sync_result['last_sync'] else None
            
            # 计算下次计划同步时间
            next_sync = None
            if last_sync:
                next_sync_time = datetime.fromisoformat(last_sync.replace('Z', '+00:00')) + timedelta(minutes=5)
                next_sync = next_sync_time.isoformat()
            
            return {
                'success': True,
                'tasks': tasks,
                'lastSync': last_sync,
                'nextScheduledSync': next_sync
            }
            
        except Exception as e:
            self.logger.error(f"Error getting sync status: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            cursor.close()
            conn.close()
    
    def start_scheduler(self):
        """启动定时同步调度器"""
        if self.scheduler:
            return
        
        self.scheduler = BackgroundScheduler()
        
        # 每5分钟同步一次数据
        @self.scheduler.scheduled_job('interval', minutes=5, id='sync_analytics_data')
        def scheduled_sync_job():
            self.logger.info("Running scheduled analytics data sync")
            try:
                result = self.sync_all_data()
                if result['success']:
                    self.logger.info("Scheduled sync completed successfully")
                else:
                    self.logger.error(f"Scheduled sync failed: {result.get('error')}")
            except Exception as e:
                self.logger.error(f"Scheduled sync error: {str(e)}")
        
        self.scheduler.start()
        self.logger.info("Analytics data sync scheduler started")
    
    def stop_scheduler(self):
        """停止定时同步调度器"""
        if self.scheduler:
            self.scheduler.shutdown()
            self.scheduler = None
            self.logger.info("Analytics data sync scheduler stopped")
    
    def invalidate_cache(self, pattern: str = None):
        """清除缓存"""
        if not self.redis_client:
            return
        
        try:
            if pattern:
                keys = self.redis_client.keys(f"analytics:{pattern}*")
            else:
                keys = self.redis_client.keys('analytics:*')
            
            if keys:
                self.redis_client.delete(*keys)
                self.logger.info(f"Invalidated {len(keys)} cache keys")
        except Exception as e:
            self.logger.warning(f"Cache invalidation error: {e}")
    
    def get_performance_metrics(self) -> Dict:
        """获取性能指标"""
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 获取同步性能指标
            cursor.execute("""
                SELECT 
                    task_type,
                    AVG(duration_seconds) as avg_duration,
                    MAX(duration_seconds) as max_duration,
                    MIN(duration_seconds) as min_duration,
                    AVG(affected_rows) as avg_affected_rows,
                    COUNT(*) as total_runs,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs
                FROM analytics_sync_tasks
                WHERE completed_at > NOW() - INTERVAL 24 HOUR
                GROUP BY task_type
            """)
            sync_metrics = cursor.fetchall()
            
            # 获取缓存命中率（如果有Redis）
            cache_metrics = {}
            if self.redis_client:
                try:
                    info = self.redis_client.info()
                    cache_metrics = {
                        'hits': info.get('keyspace_hits', 0),
                        'misses': info.get('keyspace_misses', 0),
                        'hit_rate': round(info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0), 1) * 100, 2)
                    }
                except Exception as e:
                    self.logger.warning(f"Cache metrics error: {e}")
            
            return {
                'success': True,
                'syncMetrics': [
                    {
                        'taskType': metric['task_type'],
                        'avgDuration': float(metric['avg_duration'] or 0),
                        'maxDuration': metric['max_duration'] or 0,
                        'minDuration': metric['min_duration'] or 0,
                        'avgAffectedRows': float(metric['avg_affected_rows'] or 0),
                        'totalRuns': metric['total_runs'],
                        'successfulRuns': metric['successful_runs'],
                        'successRate': round(metric['successful_runs'] / max(metric['total_runs'], 1) * 100, 2)
                    }
                    for metric in sync_metrics
                ],
                'cacheMetrics': cache_metrics
            }
            
        except Exception as e:
            self.logger.error(f"Error getting performance metrics: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            cursor.close()
            conn.close()
