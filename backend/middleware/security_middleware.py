"""
安全防护中间件
用于检测和防护DDoS攻击、暴力破解等安全威胁
"""

import time
import json
from collections import defaultdict, deque
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
import mysql.connector
from backend.database.connection import get_connection

class SecurityMiddleware:
    def __init__(self):
        # IP访问频率记录 {ip: deque of timestamps}
        self.ip_access_log = defaultdict(lambda: deque())
        
        # 登录失败记录 {ip: {'count': int, 'last_attempt': timestamp}}
        self.login_failures = defaultdict(lambda: {'count': 0, 'last_attempt': 0})
        
        # 紧急关闭状态
        self.emergency_shutdown = False
        
        # 配置参数
        self.config = {
            'ddos_threshold': 100,  # 每分钟请求数阈值
            'ddos_window': 60,      # 检测窗口（秒）
            'brute_force_threshold': 5,  # 登录失败次数阈值
            'brute_force_window': 300,   # 暴力破解检测窗口（秒）
            'auto_emergency_threshold': 200,  # 自动紧急关闭阈值
        }
        
        # 从数据库加载配置
        self.load_config_from_db()
    
    def load_config_from_db(self):
        """从数据库加载安全配置"""
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT config_key, config_value 
                FROM system_config 
                WHERE config_key IN (
                    'ddos_protection_enabled',
                    'brute_force_protection_enabled', 
                    'auto_emergency_shutdown_threshold',
                    'emergency_shutdown',
                    'project_enabled'
                )
            """)
            
            configs = cursor.fetchall()
            for config in configs:
                key = config['config_key']
                value = config['config_value']
                
                if key == 'auto_emergency_shutdown_threshold':
                    self.config['auto_emergency_threshold'] = int(value)
                elif key == 'emergency_shutdown':
                    self.emergency_shutdown = value.lower() == 'true'
                elif key == 'project_enabled':
                    self.project_enabled = value.lower() == 'true'
                    
        except Exception as e:
            print(f"加载安全配置失败: {e}")
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
    
    def check_project_status(self):
        """检查项目状态"""
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT config_value 
                FROM system_config 
                WHERE config_key IN ('project_enabled', 'emergency_shutdown')
            """)
            
            configs = {row['config_key']: row['config_value'] for row in cursor.fetchall()}
            
            # 如果项目被禁用或处于紧急关闭状态
            if (configs.get('project_enabled', 'true').lower() == 'false' or 
                configs.get('emergency_shutdown', 'false').lower() == 'true'):
                return False
                
            return True
            
        except Exception as e:
            print(f"检查项目状态失败: {e}")
            return True  # 默认允许访问
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
    
    def detect_ddos(self, ip_address):
        """检测DDoS攻击"""
        current_time = time.time()
        
        # 清理过期记录
        while (self.ip_access_log[ip_address] and 
               current_time - self.ip_access_log[ip_address][0] > self.config['ddos_window']):
            self.ip_access_log[ip_address].popleft()
        
        # 添加当前访问记录
        self.ip_access_log[ip_address].append(current_time)
        
        # 检查是否超过阈值
        request_count = len(self.ip_access_log[ip_address])
        
        if request_count > self.config['ddos_threshold']:
            self.log_security_event('ddos_detected', 'high', ip_address, {
                'request_count': request_count,
                'window_seconds': self.config['ddos_window']
            })
            return True
        
        # 检查是否需要自动紧急关闭
        if request_count > self.config['auto_emergency_threshold']:
            self.trigger_emergency_shutdown(ip_address, 'auto_ddos_protection')
            return True
            
        return False
    
    def detect_brute_force(self, ip_address, is_login_failure=False):
        """检测暴力破解攻击"""
        current_time = time.time()
        
        if is_login_failure:
            # 清理过期记录
            if (current_time - self.login_failures[ip_address]['last_attempt'] > 
                self.config['brute_force_window']):
                self.login_failures[ip_address]['count'] = 0
            
            # 增加失败计数
            self.login_failures[ip_address]['count'] += 1
            self.login_failures[ip_address]['last_attempt'] = current_time
        
        # 检查是否超过阈值
        if self.login_failures[ip_address]['count'] > self.config['brute_force_threshold']:
            self.log_security_event('brute_force_detected', 'high', ip_address, {
                'failure_count': self.login_failures[ip_address]['count'],
                'window_seconds': self.config['brute_force_window']
            })
            return True
            
        return False
    
    def trigger_emergency_shutdown(self, source_ip, reason):
        """触发紧急关闭"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            current_time = datetime.now()
            
            # 更新系统配置
            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('emergency_shutdown', 'true', %s, %s)
                ON DUPLICATE KEY UPDATE 
                config_value = 'true', updated_at = %s, updated_by = %s
            """, (current_time, 'auto_security', current_time, 'auto_security'))
            
            cursor.execute("""
                INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
                VALUES ('project_enabled', 'false', %s, %s)
                ON DUPLICATE KEY UPDATE 
                config_value = 'false', updated_at = %s, updated_by = %s
            """, (current_time, 'auto_security', current_time, 'auto_security'))
            
            # 记录安全事件
            cursor.execute("""
                INSERT INTO security_events 
                (event_type, severity, source_ip, details, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                'emergency_shutdown_triggered',
                'critical',
                source_ip,
                json.dumps({'reason': reason, 'auto_triggered': True}),
                current_time
            ))
            
            conn.commit()
            self.emergency_shutdown = True
            
            print(f"紧急关闭已触发 - 原因: {reason}, 源IP: {source_ip}")
            
        except Exception as e:
            print(f"触发紧急关闭失败: {e}")
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
    
    def log_security_event(self, event_type, severity, source_ip, details):
        """记录安全事件"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO security_events 
                (event_type, severity, source_ip, details, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                event_type,
                severity,
                source_ip,
                json.dumps(details),
                datetime.now()
            ))
            
            conn.commit()
            
        except Exception as e:
            print(f"记录安全事件失败: {e}")
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()

# 全局安全中间件实例
security_middleware = SecurityMiddleware()

def security_check(f):
    """安全检查装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip_address = request.remote_addr
        
        # 检查项目状态
        if not security_middleware.check_project_status():
            return jsonify({
                'success': False,
                'error': '系统维护中，请稍后再试',
                'code': 'SYSTEM_MAINTENANCE'
            }), 503
        
        # DDoS检测
        if security_middleware.detect_ddos(ip_address):
            return jsonify({
                'success': False,
                'error': '请求过于频繁，请稍后再试',
                'code': 'RATE_LIMIT_EXCEEDED'
            }), 429
        
        # 暴力破解检测（仅对登录相关接口）
        if 'login' in request.endpoint or 'auth' in request.endpoint:
            if security_middleware.detect_brute_force(ip_address):
                return jsonify({
                    'success': False,
                    'error': '登录尝试过于频繁，请稍后再试',
                    'code': 'BRUTE_FORCE_DETECTED'
                }), 429
        
        # 记录用户行为
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO user_behavior_analysis 
                (ip_address, action_type, action_details, created_at)
                VALUES (%s, %s, %s, %s)
            """, (
                ip_address,
                request.endpoint or 'unknown',
                json.dumps({
                    'method': request.method,
                    'path': request.path,
                    'user_agent': request.headers.get('User-Agent', '')
                }),
                datetime.now()
            ))
            
            conn.commit()
            
        except Exception as e:
            print(f"记录用户行为失败: {e}")
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
        
        return f(*args, **kwargs)
    
    return decorated_function

def login_failure_handler(ip_address):
    """登录失败处理器"""
    security_middleware.detect_brute_force(ip_address, is_login_failure=True)
