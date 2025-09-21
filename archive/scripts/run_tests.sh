#!/bin/bash

# 项目核心功能自动化测试执行脚本

echo "🧪 项目核心功能自动化测试"
echo "=========================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

# 检查依赖
echo "📦 检查Python依赖..."
python3 -c "import requests, mysql.connector" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️ 缺少依赖，正在安装..."
    pip3 install requests mysql-connector-python
fi

# 检查数据库连接
echo "🗄️ 检查数据库连接..."
python3 -c "
import mysql.connector
try:
    conn = mysql.connector.connect(
        host='localhost',
        port=3306,
        user='root',
        password='your_password',
        database='questionnaire_db'
    )
    print('✅ 数据库连接正常')
    conn.close()
except Exception as e:
    print(f'❌ 数据库连接失败: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

# 启动服务
echo ""
echo "🚀 启动后端服务..."
python3 start_services.py start &
SERVICE_PID=$!

# 等待服务启动
echo "⏳ 等待服务启动完成..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
python3 start_services.py status

# 运行自动化测试
echo ""
echo "🧪 开始自动化测试..."
echo "=========================================="
python3 test_automation.py

TEST_RESULT=$?

# 停止服务
echo ""
echo "🛑 停止服务..."
kill $SERVICE_PID 2>/dev/null

# 输出结果
echo ""
echo "=========================================="
if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 自动化测试完成 - 所有测试通过"
    echo "✅ 系统功能正常，可以进行手工测试"
else
    echo "⚠️ 自动化测试完成 - 发现问题"
    echo "🔧 请检查失败的测试项目"
fi
echo "=========================================="

exit $TEST_RESULT
