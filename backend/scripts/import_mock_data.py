#!/usr/bin/env python3
"""
模拟数据导入脚本
将生成的JSON模拟数据导入到数据库中
"""

import json
import sys
import mysql.connector
from mysql.connector import Error
from datetime import datetime
from typing import Dict, List, Any
import argparse

class DataImporter:
    """数据导入器"""
    
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.connection = None
        self.import_log_id = None
    
    def connect(self):
        """连接数据库"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            print("✅ 数据库连接成功")
        except Error as e:
            print(f"❌ 数据库连接失败: {e}")
            sys.exit(1)
    
    def disconnect(self):
        """断开数据库连接"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✅ 数据库连接已关闭")
    
    def create_import_log(self, file_name: str, total_records: int) -> int:
        """创建导入日志"""
        cursor = self.connection.cursor()
        try:
            query = """
            INSERT INTO data_import_logs 
            (import_type, file_name, total_records, success_records, failed_records, import_status)
            VALUES ('mock_data', %s, %s, 0, 0, 'processing')
            """
            cursor.execute(query, (file_name, total_records))
            self.connection.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
    
    def update_import_log(self, log_id: int, success_count: int, failed_count: int, 
                         status: str = 'completed', error_details: Dict = None):
        """更新导入日志"""
        cursor = self.connection.cursor()
        try:
            query = """
            UPDATE data_import_logs 
            SET success_records = %s, failed_records = %s, import_status = %s,
                completed_at = %s, error_details = %s
            WHERE id = %s
            """
            cursor.execute(query, (
                success_count, failed_count, status, 
                datetime.now(), json.dumps(error_details) if error_details else None, log_id
            ))
            self.connection.commit()
        finally:
            cursor.close()
    
    def import_response(self, response_data: Dict) -> bool:
        """导入单个问卷回答"""
        cursor = self.connection.cursor()
        try:
            # 插入主记录
            response_query = """
            INSERT INTO questionnaire_responses 
            (session_id, ip_hash, is_completed, completion_percentage, 
             started_at, completed_at, total_time_seconds, device_type, 
             quality_score, is_valid)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            response_values = (
                response_data['session_id'],
                response_data['ip_hash'],
                response_data['is_completed'],
                response_data['completion_percentage'],
                response_data['started_at'],
                response_data.get('completed_at'),
                response_data.get('total_time_seconds'),
                response_data['device_type'],
                response_data['quality_score'],
                True  # is_valid
            )
            
            cursor.execute(response_query, response_values)
            response_id = cursor.lastrowid
            
            # 插入答案记录
            if 'answers' in response_data:
                answer_query = """
                INSERT INTO questionnaire_answers 
                (response_id, question_id, question_type, answer_value)
                VALUES (%s, %s, %s, %s)
                """
                
                for question_id, answer_value in response_data['answers'].items():
                    # 确定问题类型
                    question_type = self.get_question_type(question_id, answer_value)
                    
                    # 处理答案值
                    if isinstance(answer_value, list):
                        # 多选题
                        json_value = json.dumps(answer_value)
                    else:
                        # 单选题或文本题
                        json_value = json.dumps(answer_value)
                    
                    cursor.execute(answer_query, (
                        response_id, question_id, question_type, json_value
                    ))
            
            self.connection.commit()
            return True
            
        except Error as e:
            print(f"❌ 导入记录失败: {e}")
            self.connection.rollback()
            return False
        finally:
            cursor.close()
    
    def get_question_type(self, question_id: str, answer_value: Any) -> str:
        """根据问题ID和答案值确定问题类型"""
        # 多选题列表
        multi_choice_questions = [
            'job-hunting-difficulties',
            'job-search-channels',
            'expected-industry',
            'work-location-preference',
            'career-priorities',
            'employment-pressure'
        ]
        
        # 文本题列表
        text_questions = [
            'work-location',
            'suggestions'
        ]
        
        if question_id in multi_choice_questions:
            return 'checkbox'
        elif question_id in text_questions:
            return 'text'
        elif isinstance(answer_value, list):
            return 'checkbox'
        else:
            return 'radio'
    
    def import_from_json(self, file_path: str) -> Dict[str, int]:
        """从JSON文件导入数据"""
        print(f"📂 开始导入文件: {file_path}")
        
        # 读取JSON文件
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"❌ 读取文件失败: {e}")
            return {'success': 0, 'failed': 0}
        
        total_records = len(data)
        print(f"📊 总记录数: {total_records}")
        
        # 创建导入日志
        self.import_log_id = self.create_import_log(file_path, total_records)
        
        # 导入数据
        success_count = 0
        failed_count = 0
        errors = []
        
        for i, record in enumerate(data):
            try:
                if self.import_response(record):
                    success_count += 1
                else:
                    failed_count += 1
                    errors.append(f"Record {i}: Import failed")
                
                # 进度显示
                if (i + 1) % 100 == 0:
                    print(f"📈 进度: {i + 1}/{total_records} ({(i + 1)/total_records*100:.1f}%)")
                    
            except Exception as e:
                failed_count += 1
                errors.append(f"Record {i}: {str(e)}")
        
        # 更新导入日志
        error_details = {'errors': errors[:10]} if errors else None  # 只保存前10个错误
        self.update_import_log(
            self.import_log_id, success_count, failed_count, 
            'completed' if failed_count == 0 else 'partial', error_details
        )
        
        print(f"✅ 导入完成!")
        print(f"   成功: {success_count}")
        print(f"   失败: {failed_count}")
        print(f"   成功率: {success_count/total_records*100:.1f}%")
        
        return {'success': success_count, 'failed': failed_count}
    
    def clear_existing_data(self):
        """清除现有数据"""
        cursor = self.connection.cursor()
        try:
            print("🗑️  清除现有数据...")
            
            # 禁用外键检查
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # 清除数据
            cursor.execute("DELETE FROM questionnaire_answers")
            cursor.execute("DELETE FROM questionnaire_responses")
            cursor.execute("DELETE FROM analytics_cache")
            
            # 重置自增ID
            cursor.execute("ALTER TABLE questionnaire_answers AUTO_INCREMENT = 1")
            cursor.execute("ALTER TABLE questionnaire_responses AUTO_INCREMENT = 1")
            cursor.execute("ALTER TABLE analytics_cache AUTO_INCREMENT = 1")
            
            # 启用外键检查
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            self.connection.commit()
            print("✅ 现有数据已清除")
            
        except Error as e:
            print(f"❌ 清除数据失败: {e}")
            self.connection.rollback()
        finally:
            cursor.close()
    
    def verify_import(self) -> Dict[str, Any]:
        """验证导入结果"""
        cursor = self.connection.cursor(dictionary=True)
        try:
            # 统计导入结果
            stats_query = """
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed_responses,
                AVG(completion_percentage) as avg_completion_rate,
                AVG(quality_score) as avg_quality_score,
                COUNT(DISTINCT device_type) as device_types,
                MIN(started_at) as earliest_response,
                MAX(started_at) as latest_response
            FROM questionnaire_responses
            """
            
            cursor.execute(stats_query)
            stats = cursor.fetchone()
            
            # 统计答案数量
            answers_query = """
            SELECT 
                COUNT(*) as total_answers,
                COUNT(DISTINCT question_id) as unique_questions,
                COUNT(DISTINCT response_id) as responses_with_answers
            FROM questionnaire_answers
            """
            
            cursor.execute(answers_query)
            answers_stats = cursor.fetchone()
            
            return {
                'responses': stats,
                'answers': answers_stats
            }
            
        finally:
            cursor.close()

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='导入问卷模拟数据')
    parser.add_argument('file', help='JSON数据文件路径')
    parser.add_argument('--clear', action='store_true', help='清除现有数据')
    parser.add_argument('--host', default='localhost', help='数据库主机')
    parser.add_argument('--port', type=int, default=3306, help='数据库端口')
    parser.add_argument('--user', default='root', help='数据库用户名')
    parser.add_argument('--password', required=True, help='数据库密码')
    parser.add_argument('--database', default='questionnaire_db', help='数据库名')
    
    args = parser.parse_args()
    
    # 数据库配置
    db_config = {
        'host': args.host,
        'port': args.port,
        'user': args.user,
        'password': args.password,
        'database': args.database,
        'charset': 'utf8mb4',
        'autocommit': False
    }
    
    # 创建导入器
    importer = DataImporter(db_config)
    
    try:
        # 连接数据库
        importer.connect()
        
        # 清除现有数据（如果指定）
        if args.clear:
            importer.clear_existing_data()
        
        # 导入数据
        result = importer.import_from_json(args.file)
        
        # 验证导入结果
        verification = importer.verify_import()
        print("\n📊 导入验证:")
        print(f"   总回答数: {verification['responses']['total_responses']}")
        print(f"   完成回答数: {verification['responses']['completed_responses']}")
        print(f"   平均完成率: {verification['responses']['avg_completion_rate']:.1f}%")
        print(f"   平均质量分: {verification['responses']['avg_quality_score']:.2f}")
        print(f"   总答案数: {verification['answers']['total_answers']}")
        print(f"   问题类型数: {verification['answers']['unique_questions']}")
        
    finally:
        importer.disconnect()

if __name__ == "__main__":
    main()
