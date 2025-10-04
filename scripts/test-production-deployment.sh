#!/bin/bash

# 生产环境部署测试脚本
# 验证问卷2 API和前端功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
FRONTEND_URL="https://c35ca874.college-employment-survey-frontend-l84.pages.dev"
BACKEND_URL="https://employment-survey-api-prod.chrismarker89.workers.dev"

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 显示标题
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           生产环境部署功能测试                             ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "测试 $TOTAL_TESTS: $test_name"
    
    result=$(eval "$test_command" 2>&1)
    
    if echo "$result" | grep -q "$expected_result"; then
        success "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        error "$test_name"
        echo "  预期: $expected_result"
        echo "  实际: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 开始测试
echo "🔍 开始测试..."
echo ""

# ============================================
# 第一部分：后端API测试
# ============================================
echo "📡 第一部分：后端API测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 问卷2系统信息API
run_test "问卷2系统信息API" \
    "curl -s '$BACKEND_URL/api/questionnaire-v2/system-info' | jq -r '.success'" \
    "true"

# 2. 问卷2分析API
run_test "问卷2分析API" \
    "curl -s '$BACKEND_URL/api/questionnaire-v2/analytics/questionnaire-v2-2024?include_test_data=true' | jq -r '.success'" \
    "true"

# 3. 问卷2分析数据完整性
run_test "问卷2分析数据包含charts" \
    "curl -s '$BACKEND_URL/api/questionnaire-v2/analytics/questionnaire-v2-2024?include_test_data=true' | jq -r '.data.charts | length > 0'" \
    "true"

# 4. 问卷2分析数据包含summary
run_test "问卷2分析数据包含summary" \
    "curl -s '$BACKEND_URL/api/questionnaire-v2/analytics/questionnaire-v2-2024?include_test_data=true' | jq -r '.data.summary != null'" \
    "true"

# 5. Universal问卷API（确保未受影响）
run_test "Universal问卷统计API" \
    "curl -s '$BACKEND_URL/api/universal-questionnaire/statistics/employment-survey-2024?include_test_data=true' | jq -r '.success'" \
    "true"

# 6. 健康检查API
run_test "后端健康检查API" \
    "curl -s -o /dev/null -w '%{http_code}' '$BACKEND_URL/health'" \
    "200"

echo ""

# ============================================
# 第二部分：前端页面测试
# ============================================
echo "🌐 第二部分：前端页面测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 7. 首页可访问性
run_test "首页可访问性" \
    "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL/'" \
    "200"

# 8. 数据分析页面可访问性
run_test "数据分析页面可访问性" \
    "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL/analytics'" \
    "200"

# 9. 问卷2页面可访问性
run_test "问卷2页面可访问性" \
    "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL/second-questionnaire'" \
    "200"

# 10. 问卷2分析页面可访问性
run_test "问卷2分析页面可访问性" \
    "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL/second-questionnaire/analytics'" \
    "200"

echo ""

# ============================================
# 第三部分：数据源配置验证
# ============================================
echo "⚙️  第三部分：数据源配置验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 11. 验证前端使用真实API
log "检查前端数据源配置..."
if grep -q "CURRENT_SOURCE: 'api'" frontend/src/config/dataSourceConfig.ts; then
    success "前端数据源配置为 'api'"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    error "前端数据源配置不是 'api'"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 12. 验证开发环境强制模拟已禁用
log "检查开发环境强制模拟配置..."
if grep -q "FORCE_MOCK_IN_DEV: false" frontend/src/config/dataSourceConfig.ts; then
    success "开发环境强制模拟已禁用"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    error "开发环境强制模拟未禁用"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# ============================================
# 第四部分：问卷2特有功能测试
# ============================================
echo "🎯 第四部分：问卷2特有功能测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 13. 经济压力分析数据
run_test "经济压力分析数据" \
    "curl -s '$BACKEND_URL/api/questionnaire-v2/analytics/questionnaire-v2-2024?include_test_data=true' | jq -r '.data.charts[] | select(.id == \"economic-pressure\") | .id'" \
    "economic-pressure"

# 14. 就业信心指数数据
run_test "就业信心指数数据" \
    "curl -s '$BACKEND_URL/api/questionnaire-v2/analytics/questionnaire-v2-2024?include_test_data=true' | jq -r '.data.charts[] | select(.id == \"employment-confidence\") | .id'" \
    "employment-confidence"

# 15. 现代负债分析数据
run_test "现代负债分析数据" \
    "curl -s '$BACKEND_URL/api/questionnaire-v2/analytics/questionnaire-v2-2024?include_test_data=true' | jq -r '.data.charts[] | select(.id == \"modern-debt\") | .id'" \
    "modern-debt"

echo ""

# ============================================
# 测试总结
# ============================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                      测试总结                              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

# 计算通过率
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "通过率: $PASS_RATE%"
echo ""

# 显示部署信息
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                    部署信息                                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "前端地址: $FRONTEND_URL"
echo "后端地址: $BACKEND_URL"
echo ""

echo "功能页面:"
echo "  - 首页: $FRONTEND_URL/"
echo "  - 数据分析: $FRONTEND_URL/analytics"
echo "  - 问卷2: $FRONTEND_URL/second-questionnaire"
echo "  - 问卷2分析: $FRONTEND_URL/second-questionnaire/analytics"
echo ""

# 显示下一步操作
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                    下一步操作                              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    success "所有测试通过！"
    echo ""
    echo "✅ 可以安全删除 employment-survey-api-test"
    echo ""
    echo "删除方法:"
    echo "  1. 登录 Cloudflare Dashboard"
    echo "  2. 进入 Workers & Pages"
    echo "  3. 找到 'employment-survey-api-test'"
    echo "  4. 点击 Settings → Delete Worker"
    echo ""
    echo "或使用命令行:"
    echo "  wrangler delete employment-survey-api-test --env test"
    echo ""
else
    warning "有 $FAILED_TESTS 个测试失败"
    echo ""
    echo "建议:"
    echo "  1. 检查失败的测试"
    echo "  2. 修复问题后重新测试"
    echo "  3. 确认所有测试通过后再删除测试环境"
    echo ""
fi

# 退出码
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi
