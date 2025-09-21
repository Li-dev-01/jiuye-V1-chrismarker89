"""
真实数据分析API服务
替换前端的模拟数据，提供基于数据库的真实统计分析
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector import Error
import redis
import hashlib

class AnalyticsService:
    """数据分析服务"""
    
    def __init__(self, db_config: Dict, redis_config: Dict = None):
        self.db_config = db_config
        self.redis_client = None
        
        if redis_config:
            self.redis_client = redis.Redis(**redis_config)
    
    def get_connection(self):
        """获取数据库连接"""
        return mysql.connector.connect(**self.db_config)
    
    def cache_key(self, prefix: str, **params) -> str:
        """生成缓存键"""
        param_str = json.dumps(params, sort_keys=True)
        hash_str = hashlib.md5(param_str.encode()).hexdigest()[:8]
        return f"{prefix}:{hash_str}"
    
    def get_cached_data(self, cache_key: str) -> Optional[Dict]:
        """从缓存获取数据"""
        if not self.redis_client:
            return None
        
        try:
            cached = self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None
    
    def set_cached_data(self, cache_key: str, data: Dict, ttl: int = 3600):
        """设置缓存数据"""
        if not self.redis_client:
            return
        
        try:
            self.redis_client.setex(
                cache_key, 
                ttl, 
                json.dumps(data, default=str)
            )
        except Exception:
            pass
    
    def get_basic_statistics(self, filters: Dict = None) -> Dict[str, Any]:
        """获取基础统计数据"""
        cache_key = self.cache_key("basic_stats", **(filters or {}))
        cached = self.get_cached_data(cache_key)
        if cached:
            return cached
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 构建WHERE条件
            where_conditions = ["r.is_valid = TRUE"]
            params = []
            
            if filters:
                if filters.get('education_level'):
                    where_conditions.append("JSON_UNQUOTE(JSON_EXTRACT(a1.answer_value, '$')) = %s")
                    params.append(filters['education_level'])
                
                if filters.get('date_from'):
                    where_conditions.append("r.started_at >= %s")
                    params.append(filters['date_from'])
                
                if filters.get('date_to'):
                    where_conditions.append("r.started_at <= %s")
                    params.append(filters['date_to'])
            
            where_clause = " AND ".join(where_conditions)
            
            # 基础统计查询
            query = f"""
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN r.is_completed = TRUE THEN 1 ELSE 0 END) as completed_responses,
                AVG(r.completion_percentage) as avg_completion_rate,
                AVG(r.total_time_seconds) as avg_completion_time,
                AVG(r.quality_score) as avg_quality_score,
                MIN(r.started_at) as first_response,
                MAX(r.started_at) as last_response
            FROM questionnaire_responses r
            LEFT JOIN questionnaire_answers a1 ON r.id = a1.response_id AND a1.question_id = 'education-level'
            WHERE {where_clause}
            """
            
            cursor.execute(query, params)
            basic_stats = cursor.fetchone()
            
            # 计算就业率
            employment_query = f"""
            SELECT 
                COUNT(*) as total_employed
            FROM questionnaire_responses r
            JOIN questionnaire_answers a ON r.id = a.response_id
            LEFT JOIN questionnaire_answers a1 ON r.id = a1.response_id AND a1.question_id = 'education-level'
            WHERE {where_clause}
              AND a.question_id = 'current-status'
              AND JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) IN ('fulltime', 'parttime')
            """
            
            cursor.execute(employment_query, params)
            employment_data = cursor.fetchone()
            
            # 计算失业率
            unemployment_query = f"""
            SELECT 
                COUNT(*) as total_unemployed
            FROM questionnaire_responses r
            JOIN questionnaire_answers a ON r.id = a.response_id
            LEFT JOIN questionnaire_answers a1 ON r.id = a1.response_id AND a1.question_id = 'education-level'
            WHERE {where_clause}
              AND a.question_id = 'current-status'
              AND JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) = 'unemployed'
            """
            
            cursor.execute(unemployment_query, params)
            unemployment_data = cursor.fetchone()
            
            # 组装结果
            result = {
                'totalResponses': basic_stats['total_responses'],
                'completedResponses': basic_stats['completed_responses'],
                'completionRate': round(basic_stats['avg_completion_rate'] or 0, 1),
                'avgCompletionTime': round((basic_stats['avg_completion_time'] or 0) / 60, 1),  # 转换为分钟
                'qualityScore': round(basic_stats['avg_quality_score'] or 0, 2),
                'employmentRate': round((employment_data['total_employed'] / max(basic_stats['completed_responses'], 1)) * 100, 1),
                'unemploymentRate': round((unemployment_data['total_unemployed'] / max(basic_stats['completed_responses'], 1)) * 100, 1),
                'dataRange': {
                    'from': basic_stats['first_response'],
                    'to': basic_stats['last_response']
                },
                'lastUpdated': datetime.now().isoformat()
            }
            
            # 缓存结果
            self.set_cached_data(cache_key, result, 1800)  # 30分钟缓存
            return result
            
        finally:
            cursor.close()
            conn.close()
    
    def get_distribution_data(self, question_id: str, filters: Dict = None) -> List[Dict]:
        """获取分布数据"""
        cache_key = self.cache_key("distribution", question_id=question_id, **(filters or {}))
        cached = self.get_cached_data(cache_key)
        if cached:
            return cached
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # 构建查询
            where_conditions = ["r.is_valid = TRUE", "r.is_completed = TRUE"]
            params = [question_id]
            
            if filters:
                # 添加筛选条件
                pass
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) as label,
                COUNT(*) as value
            FROM questionnaire_responses r
            JOIN questionnaire_answers a ON r.id = a.response_id
            WHERE {where_clause}
              AND a.question_id = %s
              AND JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$')) IS NOT NULL
            GROUP BY JSON_UNQUOTE(JSON_EXTRACT(a.answer_value, '$'))
            ORDER BY value DESC
            """
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            # 计算百分比
            total = sum(row['value'] for row in results)
            distribution = []
            
            for row in results:
                distribution.append({
                    'label': row['label'],
                    'value': row['value'],
                    'percentage': round((row['value'] / max(total, 1)) * 100, 1)
                })
            
            # 缓存结果
            self.set_cached_data(cache_key, distribution, 1800)
            return distribution
            
        finally:
            cursor.close()
            conn.close()
    
    def get_cross_analysis(self, dimension1: str, dimension2: str, filters: Dict = None) -> List[Dict]:
        """获取交叉分析数据"""
        cache_key = self.cache_key("cross_analysis", dim1=dimension1, dim2=dimension2, **(filters or {}))
        cached = self.get_cached_data(cache_key)
        if cached:
            return cached
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(a1.answer_value, '$')) as dimension1_value,
                JSON_UNQUOTE(JSON_EXTRACT(a2.answer_value, '$')) as dimension2_value,
                COUNT(*) as count
            FROM questionnaire_responses r
            JOIN questionnaire_answers a1 ON r.id = a1.response_id AND a1.question_id = %s
            JOIN questionnaire_answers a2 ON r.id = a2.response_id AND a2.question_id = %s
            WHERE r.is_valid = TRUE AND r.is_completed = TRUE
            GROUP BY dimension1_value, dimension2_value
            ORDER BY count DESC
            """
            
            cursor.execute(query, [dimension1, dimension2])
            results = cursor.fetchall()
            
            # 处理交叉分析结果
            cross_data = {}
            for row in results:
                dim1_val = row['dimension1_value']
                dim2_val = row['dimension2_value']
                
                if dim1_val not in cross_data:
                    cross_data[dim1_val] = {}
                
                cross_data[dim1_val][dim2_val] = row['count']
            
            # 转换为前端需要的格式
            result = []
            for dim1_val, dim2_data in cross_data.items():
                total = sum(dim2_data.values())
                result.append({
                    'category': dim1_val,
                    'total': total,
                    'breakdown': [
                        {
                            'label': dim2_val,
                            'value': count,
                            'percentage': round((count / max(total, 1)) * 100, 1)
                        }
                        for dim2_val, count in dim2_data.items()
                    ]
                })
            
            # 缓存结果
            self.set_cached_data(cache_key, result, 1800)
            return result
            
        finally:
            cursor.close()
            conn.close()
    
    def get_employment_by_education(self, filters: Dict = None) -> List[Dict]:
        """获取按学历分组的就业数据"""
        cache_key = self.cache_key("employment_by_education", **(filters or {}))
        cached = self.get_cached_data(cache_key)
        if cached:
            return cached
        
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(a1.answer_value, '$')) as education,
                COUNT(*) as total,
                SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a2.answer_value, '$')) IN ('fulltime', 'parttime') THEN 1 ELSE 0 END) as employed,
                SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a2.answer_value, '$')) = 'unemployed' THEN 1 ELSE 0 END) as unemployed
            FROM questionnaire_responses r
            JOIN questionnaire_answers a1 ON r.id = a1.response_id AND a1.question_id = 'education-level'
            JOIN questionnaire_answers a2 ON r.id = a2.response_id AND a2.question_id = 'current-status'
            WHERE r.is_valid = TRUE AND r.is_completed = TRUE
            GROUP BY education
            ORDER BY 
                CASE education
                    WHEN 'phd' THEN 1
                    WHEN 'master' THEN 2
                    WHEN 'bachelor' THEN 3
                    WHEN 'junior-college' THEN 4
                    WHEN 'high-school' THEN 5
                    ELSE 6
                END
            """
            
            cursor.execute(query)
            results = cursor.fetchall()
            
            # 计算就业率
            employment_data = []
            for row in results:
                total = row['total']
                employed = row['employed']
                unemployed = row['unemployed']
                
                employment_data.append({
                    'education': row['education'],
                    'total': total,
                    'employed': employed,
                    'unemployed': unemployed,
                    'employmentRate': round((employed / max(total, 1)) * 100, 1)
                })
            
            # 缓存结果
            self.set_cached_data(cache_key, employment_data, 1800)
            return employment_data
            
        finally:
            cursor.close()
            conn.close()
    
    def invalidate_cache(self, pattern: str = None):
        """清除缓存"""
        if not self.redis_client:
            return
        
        try:
            if pattern:
                keys = self.redis_client.keys(f"{pattern}*")
                if keys:
                    self.redis_client.delete(*keys)
            else:
                self.redis_client.flushdb()
        except Exception:
            pass
