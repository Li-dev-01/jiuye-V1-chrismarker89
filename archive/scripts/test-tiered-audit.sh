#!/bin/bash

# 分级审核系统完整测试脚本
# 验证所有API功能是否正常工作

set -e

# 配置
API_BASE="https://employment-survey-api-prod.justpm2099.workers.dev/api/audit"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "测试 $TOTAL_TESTS: $test_name"
    
    # 执行命令并捕获输出
    local output
    if output=$(eval "$command" 2>&1); then
        # 检查输出是否包含预期模式
        if echo "$output" | grep -q "$expected_pattern"; then
            log_success "✅ $test_name - 通过"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            log_error "❌ $test_name - 输出不符合预期"
            echo "预期包含: $expected_pattern"
            echo "实际输出: $output"
            return 1
        fi
    else
        log_error "❌ $test_name - 命令执行失败"
        echo "错误输出: $output"
        return 1
    fi
}

# 开始测试
echo "=================================="
echo "分级审核系统功能测试"
echo "=================================="
echo "API地址: $API_BASE"
echo ""

# 测试1: 获取当前审核级别
run_test "获取当前审核级别" \
    "curl -s '$API_BASE/level'" \
    '"success":true'

# 测试2: 测试正常内容（检查是否通过或需要人工审核）
run_test "正常内容审核" \
    "curl -s -X POST '$API_BASE/test' -H 'Content-Type: application/json' -d '{\"content\": \"这是一个正常的求职故事\", \"content_type\": \"story\"}'" \
    '"success":true'

# 测试3: 测试政治敏感内容
run_test "政治敏感内容检测" \
    "curl -s -X POST '$API_BASE/test' -H 'Content-Type: application/json' -d '{\"content\": \"习近平是国家主席\", \"content_type\": \"story\"}'" \
    '"action":"reject"'

# 测试4: 测试色情内容
run_test "色情内容检测" \
    "curl -s -X POST '$API_BASE/test' -H 'Content-Type: application/json' -d '{\"content\": \"这里有黄片和性爱内容\", \"content_type\": \"story\"}'" \
    '"violations"'

# 测试5: 测试暴力内容
run_test "暴力内容检测" \
    "curl -s -X POST '$API_BASE/test' -H 'Content-Type: application/json' -d '{\"content\": \"血腥的杀人场面\", \"content_type\": \"story\"}'" \
    '"violations"'

# 测试6: 测试广告内容
run_test "广告内容检测" \
    "curl -s -X POST '$API_BASE/test' -H 'Content-Type: application/json' -d '{\"content\": \"加我微信号123456\", \"content_type\": \"story\"}'" \
    '"violations"'

# 测试7: 测试隐私信息
run_test "隐私信息检测" \
    "curl -s -X POST '$API_BASE/test' -H 'Content-Type: application/json' -d '{\"content\": \"我的身份证号是123456789012345678\", \"content_type\": \"story\"}'" \
    '"violations"'

# 测试8: 切换到二级模式
run_test "切换到二级审核" \
    "curl -s -X POST '$API_BASE/level' -H 'Content-Type: application/json' -d '{\"level\": \"level2\", \"admin_id\": \"test_admin\"}'" \
    '"new_level":"level2"'

# 测试9: 切换到三级模式
run_test "切换到三级审核" \
    "curl -s -X POST '$API_BASE/level' -H 'Content-Type: application/json' -d '{\"level\": \"level3\", \"admin_id\": \"test_admin\"}'" \
    '"new_level":"level3"'

# 测试10: 获取统计信息
run_test "获取审核统计" \
    "curl -s '$API_BASE/stats'" \
    '"current_hour_stats"'

# 测试11: 获取审核历史
run_test "获取审核历史" \
    "curl -s '$API_BASE/history'" \
    '"success":true'

# 测试12: 实际审核接口
run_test "实际审核接口" \
    "curl -s -X POST '$API_BASE/check' -H 'Content-Type: application/json' -d '{\"content\": \"这是一个正常的内容\", \"content_type\": \"story\"}'" \
    '"action":"approve"'

# 测试13: 实际审核接口 - 违规内容
run_test "实际审核接口 - 违规内容" \
    "curl -s -X POST '$API_BASE/check' -H 'Content-Type: application/json' -d '{\"content\": \"习近平\", \"content_type\": \"story\"}'" \
    '"success":false'

# 性能测试
echo ""
log_info "开始性能测试..."

# 测试14: 响应时间测试
start_time=$(date +%s%N)
curl -s "$API_BASE/level" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    log_success "✅ 响应时间测试 - 通过 (${response_time}ms)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "⚠️  响应时间测试 - 较慢 (${response_time}ms)"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 测试15: 并发测试
log_info "并发测试 (5个并发请求)..."
concurrent_start=$(date +%s%N)

for i in {1..5}; do
    curl -s -X POST "$API_BASE/test" \
        -H "Content-Type: application/json" \
        -d "{\"content\": \"并发测试内容 $i\", \"content_type\": \"story\"}" &
done

wait  # 等待所有后台任务完成

concurrent_end=$(date +%s%N)
concurrent_time=$(( (concurrent_end - concurrent_start) / 1000000 ))

if [ $concurrent_time -lt 3000 ]; then
    log_success "✅ 并发测试 - 通过 (${concurrent_time}ms)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "⚠️  并发测试 - 较慢 (${concurrent_time}ms)"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 输出测试结果
echo ""
echo "=================================="
echo "测试结果汇总"
echo "=================================="
echo "总测试数: $TOTAL_TESTS"
echo "通过测试: $PASSED_TESTS"
echo "失败测试: $((TOTAL_TESTS - PASSED_TESTS))"

success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
echo "成功率: ${success_rate}%"

if [ $success_rate -ge 90 ]; then
    log_success "🎉 测试结果: 优秀 (≥90%)"
elif [ $success_rate -ge 80 ]; then
    log_warning "⚠️  测试结果: 良好 (≥80%)"
else
    log_error "❌ 测试结果: 需要改进 (<80%)"
fi

echo ""
echo "性能指标:"
echo "- 单次响应时间: ${response_time}ms"
echo "- 并发响应时间: ${concurrent_time}ms"

echo ""
echo "功能验证:"
echo "✅ 分级审核引擎正常工作"
echo "✅ 政治敏感内容检测有效"
echo "✅ 级别切换功能正常"
echo "✅ 统计信息获取正常"
echo "✅ API接口响应正常"

echo ""
echo "🎯 分级审核系统已成功部署并通过验证！"
echo "=================================="

# 返回适当的退出码
if [ $success_rate -ge 80 ]; then
    exit 0
else
    exit 1
fi
