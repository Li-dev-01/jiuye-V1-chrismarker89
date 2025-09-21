#!/usr/bin/env python3
"""
分级审核系统数据库迁移脚本
创建必要的表结构和初始数据
"""

import mysql.connector
from mysql.connector import Error
import json
import sys
import os
from datetime import datetime

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'questionnaire_db',
    'charset': 'utf8mb4',
    'autocommit': False
}

def get_connection():
    """获取数据库连接"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"数据库连接错误: {e}")
        return None

def create_audit_level_configs_table(cursor):
    """创建审核级别配置表"""
    sql = """
    CREATE TABLE IF NOT EXISTS audit_level_configs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        level ENUM('level1', 'level2', 'level3') NOT NULL,
        config_name VARCHAR(100) NOT NULL,
        description TEXT,
        
        -- 规则配置
        rule_strictness DECIMAL(2,1) DEFAULT 1.0,
        ai_threshold DECIMAL(3,2) DEFAULT 0.5,
        manual_review_ratio DECIMAL(3,2) DEFAULT 0.1,
        
        -- 规则启用状态
        enabled_categories JSON,
        disabled_rules JSON,
        
        -- 性能配置
        max_processing_time_ms INT DEFAULT 100,
        batch_size INT DEFAULT 10,
        
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_level_config (level, is_active)
    )
    """
    cursor.execute(sql)
    print("✅ 创建 audit_level_configs 表")

def create_audit_level_history_table(cursor):
    """创建审核级别历史记录表"""
    sql = """
    CREATE TABLE IF NOT EXISTS audit_level_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        from_level ENUM('level1', 'level2', 'level3'),
        to_level ENUM('level1', 'level2', 'level3') NOT NULL,
        trigger_reason VARCHAR(200),
        trigger_data JSON,
        switched_by ENUM('auto', 'manual') DEFAULT 'auto',
        admin_id VARCHAR(36),
        switched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_level_history_time (switched_at),
        INDEX idx_level_history_level (to_level, switched_at)
    )
    """
    cursor.execute(sql)
    print("✅ 创建 audit_level_history 表")

def create_audit_realtime_stats_table(cursor):
    """创建实时统计表"""
    sql = """
    CREATE TABLE IF NOT EXISTS audit_realtime_stats (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        time_window TIMESTAMP NOT NULL,
        
        total_submissions INT DEFAULT 0,
        violation_count INT DEFAULT 0,
        violation_rate DECIMAL(4,3) DEFAULT 0.0,
        
        spam_count INT DEFAULT 0,
        coordinated_ips JSON,
        
        manual_review_queue_size INT DEFAULT 0,
        ai_review_count INT DEFAULT 0,
        auto_approved_count INT DEFAULT 0,
        auto_rejected_count INT DEFAULT 0,
        
        current_audit_level ENUM('level1', 'level2', 'level3') DEFAULT 'level1',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_time_window (time_window),
        INDEX idx_stats_time (time_window),
        INDEX idx_stats_level (current_audit_level, time_window)
    )
    """
    cursor.execute(sql)
    print("✅ 创建 audit_realtime_stats 表")

def extend_audit_records_table(cursor):
    """扩展现有audit_records表"""
    # 检查表是否存在
    cursor.execute("SHOW TABLES LIKE 'audit_records'")
    if not cursor.fetchone():
        print("⚠️  audit_records 表不存在，跳过扩展")
        return

    # 检查列是否已存在
    cursor.execute("SHOW COLUMNS FROM audit_records LIKE 'violation_categories'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE audit_records ADD COLUMN violation_categories JSON")
        print("✅ 添加 violation_categories 列到 audit_records")

    cursor.execute("SHOW COLUMNS FROM audit_records LIKE 'rule_hits'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE audit_records ADD COLUMN rule_hits JSON")
        print("✅ 添加 rule_hits 列到 audit_records")

    cursor.execute("SHOW COLUMNS FROM audit_records LIKE 'risk_score'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE audit_records ADD COLUMN risk_score DECIMAL(3,2) DEFAULT 0.0")
        print("✅ 添加 risk_score 列到 audit_records")

    # 检查现有audit_level列的类型
    cursor.execute("SHOW COLUMNS FROM audit_records LIKE 'audit_level'")
    existing_column = cursor.fetchone()
    if existing_column:
        # 如果列存在但类型不对，添加新的列
        cursor.execute("SHOW COLUMNS FROM audit_records LIKE 'tiered_audit_level'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE audit_records ADD COLUMN tiered_audit_level ENUM('level1', 'level2', 'level3') DEFAULT 'level1'")
            print("✅ 添加 tiered_audit_level 列到 audit_records")
    else:
        cursor.execute("ALTER TABLE audit_records ADD COLUMN tiered_audit_level ENUM('level1', 'level2', 'level3') DEFAULT 'level1'")
        print("✅ 添加 tiered_audit_level 列到 audit_records")

def insert_default_level_configs(cursor):
    """插入默认审核级别配置"""
    # 检查是否已有配置
    cursor.execute("SELECT COUNT(*) FROM audit_level_configs")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print("⚠️  审核级别配置已存在，跳过插入")
        return
    
    configs = [
        {
            'level': 'level1',
            'config_name': '一级审核 (宽松)',
            'description': '正常运营期，注重用户体验',
            'rule_strictness': 0.8,
            'ai_threshold': 0.3,
            'manual_review_ratio': 0.05,
            'enabled_categories': '["POL", "POR", "VIO", "PRI"]'
        },
        {
            'level': 'level2',
            'config_name': '二级审核 (标准)',
            'description': '内容质量下降，平衡审核',
            'rule_strictness': 1.0,
            'ai_threshold': 0.5,
            'manual_review_ratio': 0.15,
            'enabled_categories': '["POL", "POR", "VIO", "ADV", "PRI", "DIS"]'
        },
        {
            'level': 'level3',
            'config_name': '三级审核 (严格)',
            'description': '恶意攻击期，严格把控',
            'rule_strictness': 1.2,
            'ai_threshold': 0.7,
            'manual_review_ratio': 0.30,
            'enabled_categories': '["POL", "POR", "VIO", "ADV", "PRI", "DIS", "OTH"]'
        }
    ]
    
    for config in configs:
        cursor.execute("""
            INSERT INTO audit_level_configs 
            (level, config_name, description, rule_strictness, ai_threshold, 
             manual_review_ratio, enabled_categories) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            config['level'],
            config['config_name'],
            config['description'],
            config['rule_strictness'],
            config['ai_threshold'],
            config['manual_review_ratio'],
            config['enabled_categories']
        ))
    
    print("✅ 插入默认审核级别配置")

def insert_initial_level_history(cursor):
    """插入初始级别历史记录"""
    cursor.execute("""
        INSERT INTO audit_level_history 
        (from_level, to_level, trigger_reason, switched_by, admin_id)
        VALUES (NULL, 'level1', '系统初始化', 'manual', 'system')
    """)
    print("✅ 插入初始级别历史记录")

def create_indexes(cursor):
    """创建必要的索引"""
    indexes = [
        ("idx_audit_records_tiered_level", "CREATE INDEX idx_audit_records_tiered_level ON audit_records(tiered_audit_level, audited_at)"),
        ("idx_audit_records_risk", "CREATE INDEX idx_audit_records_risk ON audit_records(risk_score DESC, audited_at)"),
        ("idx_level_configs_active", "CREATE INDEX idx_level_configs_active ON audit_level_configs(is_active, level)")
    ]

    for index_name, index_sql in indexes:
        try:
            # 先检查索引是否存在
            cursor.execute("SHOW INDEX FROM audit_records WHERE Key_name = %s", (index_name,))
            if cursor.fetchone():
                print(f"✅ 索引已存在: {index_name}")
                continue

            cursor.execute(index_sql)
            print(f"✅ 创建索引: {index_name}")
        except Error as e:
            if "Duplicate key name" not in str(e):
                print(f"⚠️  索引创建失败 {index_name}: {e}")

def verify_migration(cursor):
    """验证迁移结果"""
    print("\n🔍 验证迁移结果:")
    
    # 检查表是否存在
    tables = ['audit_level_configs', 'audit_level_history', 'audit_realtime_stats']
    for table in tables:
        cursor.execute(f"SHOW TABLES LIKE '{table}'")
        if cursor.fetchone():
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  ✅ {table}: 存在，记录数: {count}")
        else:
            print(f"  ❌ {table}: 不存在")
    
    # 检查audit_records表扩展
    cursor.execute("SHOW TABLES LIKE 'audit_records'")
    if cursor.fetchone():
        cursor.execute("SHOW COLUMNS FROM audit_records")
        columns = [row[0] for row in cursor.fetchall()]
        extended_columns = ['violation_categories', 'rule_hits', 'risk_score', 'audit_level']
        
        for col in extended_columns:
            if col in columns:
                print(f"  ✅ audit_records.{col}: 已添加")
            else:
                print(f"  ❌ audit_records.{col}: 未添加")
    
    # 检查配置数据
    cursor.execute("SELECT level, config_name FROM audit_level_configs ORDER BY level")
    configs = cursor.fetchall()
    print(f"  📋 审核级别配置: {len(configs)} 个")
    for level, name in configs:
        print(f"    - {level}: {name}")

def rollback_migration(cursor):
    """回滚迁移（仅用于测试）"""
    print("⚠️  执行迁移回滚...")
    
    # 删除新创建的表
    tables = ['audit_realtime_stats', 'audit_level_history', 'audit_level_configs']
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")
        print(f"  🗑️  删除表: {table}")
    
    # 删除audit_records表的扩展列
    cursor.execute("SHOW TABLES LIKE 'audit_records'")
    if cursor.fetchone():
        extended_columns = ['audit_level', 'risk_score', 'rule_hits', 'violation_categories']
        for col in extended_columns:
            try:
                cursor.execute(f"ALTER TABLE audit_records DROP COLUMN {col}")
                print(f"  🗑️  删除列: audit_records.{col}")
            except Error:
                pass  # 列可能不存在
    
    print("✅ 回滚完成")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='分级审核系统数据库迁移工具')
    parser.add_argument('--rollback', action='store_true', help='回滚迁移')
    parser.add_argument('--verify-only', action='store_true', help='仅验证，不执行迁移')
    parser.add_argument('--force', action='store_true', help='强制执行，忽略警告')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("分级审核系统数据库迁移工具")
    print("=" * 60)
    
    # 连接数据库
    connection = get_connection()
    if not connection:
        print("❌ 无法连接到数据库")
        sys.exit(1)
    
    try:
        cursor = connection.cursor()
        
        if args.verify_only:
            # 仅验证
            verify_migration(cursor)
        elif args.rollback:
            # 回滚迁移
            if not args.force:
                confirm = input("⚠️  确定要回滚迁移吗？这将删除所有分级审核相关的表和数据 (y/N): ")
                if confirm.lower() != 'y':
                    print("取消回滚")
                    return
            
            rollback_migration(cursor)
            connection.commit()
        else:
            # 执行迁移
            print(f"📅 开始迁移: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"🎯 目标数据库: {DB_CONFIG['database']}")
            
            if not args.force:
                confirm = input("确定要执行迁移吗？(y/N): ")
                if confirm.lower() != 'y':
                    print("取消迁移")
                    return
            
            print("\n🚀 开始执行迁移...")
            
            # 创建表
            create_audit_level_configs_table(cursor)
            create_audit_level_history_table(cursor)
            create_audit_realtime_stats_table(cursor)
            
            # 扩展现有表
            extend_audit_records_table(cursor)
            
            # 插入初始数据
            insert_default_level_configs(cursor)
            insert_initial_level_history(cursor)
            
            # 创建索引
            create_indexes(cursor)
            
            # 提交事务
            connection.commit()
            print("\n✅ 迁移完成")
            
            # 验证结果
            verify_migration(cursor)
    
    except Error as e:
        print(f"❌ 迁移失败: {e}")
        connection.rollback()
        sys.exit(1)
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
    
    print("\n" + "=" * 60)
    print("迁移工具执行完成")
    print("=" * 60)

if __name__ == '__main__':
    main()
