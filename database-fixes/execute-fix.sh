#!/bin/bash
# 外键约束修复执行脚本

DATABASE_NAME=${1:-"college-employment-survey"}
SCRIPT_DIR="database-fixes"

echo "🔧 开始修复外键约束问题..."

echo "1. 检查数据完整性..."
wrangler d1 execute "$DATABASE_NAME" --remote --file="$SCRIPT_DIR/02-check-integrity.sql"

echo "2. 修复外键约束..."
wrangler d1 execute "$DATABASE_NAME" --remote --file="$SCRIPT_DIR/01-fix-foreign-keys.sql"

echo "3. 清理旧测试数据..."
wrangler d1 execute "$DATABASE_NAME" --remote --file="$SCRIPT_DIR/03-cleanup-data.sql"

echo "4. 插入标准化测试数据..."
wrangler d1 execute "$DATABASE_NAME" --remote --file="$SCRIPT_DIR/04-standardized-test-data.sql"

echo "5. 最终完整性检查..."
wrangler d1 execute "$DATABASE_NAME" --remote --file="$SCRIPT_DIR/02-check-integrity.sql"

echo "✅ 外键约束修复完成！"
