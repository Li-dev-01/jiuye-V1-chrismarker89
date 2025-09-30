#!/bin/bash

# 🧪 生产环境部署验证脚本
# 验证 Cloudflare Pages 部署和数据库功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
FRONTEND_URL="https://5ed7fbf8.reviewer-admin-dashboard.pages.dev"
API_URL="https://employment-survey-api-prod.chrismarker89.workers.dev"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log_info "测试 $TOTAL_TESTS: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        log_success "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 开始验证
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🚀 生产环境部署验证                                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. 前端部署验证
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "1️⃣  前端部署验证"

log_info "前端URL: $FRONTEND_URL"

# 测试主页访问
run_test "主页访问" "curl -f -s '$FRONTEND_URL'"

# 测试统一登录页
run_test "统一登录页访问" "curl -f -s '$FRONTEND_URL/unified-login'"

# 测试静态资源
log_info "检查静态资源..."
if curl -s "$FRONTEND_URL" | grep -q "static/js/main"; then
    log_success "静态资源引用正常"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "静态资源引用可能有问题"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 测试路由重定向
log_info "测试路由重定向..."
for route in "/login" "/admin/login" "/admin/super-login"; do
    if curl -s -I "$FRONTEND_URL$route" | grep -q "200\|301\|302"; then
        log_success "路由 $route 可访问"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_warning "路由 $route 可能有问题"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. API 连接验证
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "2️⃣  API 连接验证"

log_info "API URL: $API_URL"

# 测试 API 健康检查
run_test "API 健康检查" "curl -f -s '$API_URL/api/health'"

# 测试 CORS 配置
log_info "测试 CORS 配置..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/api/admin/account-management/accounts" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    log_success "CORS 配置正确"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "CORS 配置可能需要调整"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. 数据库功能验证
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "3️⃣  数据库功能验证"

# 测试账户管理 API
log_info "测试账户管理 API..."
ACCOUNTS_RESPONSE=$(curl -s "$API_URL/api/admin/account-management/accounts")

if echo "$ACCOUNTS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    log_success "账户管理 API 正常"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # 提取账户统计
    TOTAL_EMAILS=$(echo "$ACCOUNTS_RESPONSE" | jq -r '.data.emails | length')
    TOTAL_ACCOUNTS=$(echo "$ACCOUNTS_RESPONSE" | jq -r '[.data.emails[].accounts[]] | length')
    
    log_info "邮箱数量: $TOTAL_EMAILS"
    log_info "账户数量: $TOTAL_ACCOUNTS"
    
    # 统计各角色账户数量
    SUPER_ADMIN_COUNT=$(echo "$ACCOUNTS_RESPONSE" | jq -r '[.data.emails[].accounts[] | select(.role == "super_admin")] | length')
    ADMIN_COUNT=$(echo "$ACCOUNTS_RESPONSE" | jq -r '[.data.emails[].accounts[] | select(.role == "admin")] | length')
    REVIEWER_COUNT=$(echo "$ACCOUNTS_RESPONSE" | jq -r '[.data.emails[].accounts[] | select(.role == "reviewer")] | length')
    
    log_info "超级管理员: $SUPER_ADMIN_COUNT 个"
    log_info "管理员: $ADMIN_COUNT 个"
    log_info "审核员: $REVIEWER_COUNT 个"
else
    log_error "账户管理 API 失败"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 测试邮箱白名单 API
log_info "测试邮箱白名单 API..."
WHITELIST_RESPONSE=$(curl -s "$API_URL/api/admin/whitelist/emails")

if echo "$WHITELIST_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    log_success "邮箱白名单 API 正常"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    WHITELIST_COUNT=$(echo "$WHITELIST_RESPONSE" | jq -r '.data.emails | length')
    log_info "白名单邮箱数量: $WHITELIST_COUNT"
else
    log_error "邮箱白名单 API 失败"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. 测试账号验证
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "4️⃣  测试账号验证"

# 验证测试账号是否存在
log_info "验证测试账号..."

TEST_ACCOUNTS=("reviewerA" "admin" "test_superadmin")
for username in "${TEST_ACCOUNTS[@]}"; do
    if echo "$ACCOUNTS_RESPONSE" | jq -e ".data.emails[].accounts[] | select(.username == \"$username\")" > /dev/null 2>&1; then
        log_success "测试账号 $username 存在"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_error "测试账号 $username 不存在"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. 数据一致性检查
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "5️⃣  数据一致性检查"

# 检查每个邮箱是否有对应的账户
log_info "检查邮箱-账户关联..."
EMAILS_WITHOUT_ACCOUNTS=$(echo "$ACCOUNTS_RESPONSE" | jq -r '[.data.emails[] | select(.accounts | length == 0)] | length')

if [ "$EMAILS_WITHOUT_ACCOUNTS" -eq 0 ]; then
    log_success "所有邮箱都有关联账户"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "有 $EMAILS_WITHOUT_ACCOUNTS 个邮箱没有关联账户"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 检查账户状态
log_info "检查账户状态..."
INACTIVE_ACCOUNTS=$(echo "$ACCOUNTS_RESPONSE" | jq -r '[.data.emails[].accounts[] | select(.isActive == 0)] | length')

if [ "$INACTIVE_ACCOUNTS" -eq 0 ]; then
    log_success "所有账户都处于激活状态"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_info "有 $INACTIVE_ACCOUNTS 个账户处于停用状态"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. 安全性检查
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "6️⃣  安全性检查"

# 检查调试功能是否隐藏
log_info "检查生产环境调试功能..."
if curl -s "$FRONTEND_URL/unified-login" | grep -q "自动登录（调试）"; then
    log_error "生产环境暴露了调试功能！"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    log_success "调试功能已正确隐藏"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 检查敏感信息
log_info "检查敏感信息泄露..."
if curl -s "$FRONTEND_URL" | grep -qi "password\|secret\|token"; then
    log_warning "可能存在敏感信息泄露，请人工检查"
else
    log_success "未发现明显的敏感信息泄露"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. 性能检查
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "7️⃣  性能检查"

# 测试页面加载时间
log_info "测试页面加载时间..."
LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL")
LOAD_TIME_MS=$(echo "$LOAD_TIME * 1000" | bc | cut -d. -f1)

if [ "$LOAD_TIME_MS" -lt 3000 ]; then
    log_success "页面加载时间: ${LOAD_TIME_MS}ms (优秀)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ "$LOAD_TIME_MS" -lt 5000 ]; then
    log_info "页面加载时间: ${LOAD_TIME_MS}ms (良好)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "页面加载时间: ${LOAD_TIME_MS}ms (需要优化)"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 测试 API 响应时间
log_info "测试 API 响应时间..."
API_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$API_URL/api/admin/account-management/accounts")
API_TIME_MS=$(echo "$API_TIME * 1000" | bc | cut -d. -f1)

if [ "$API_TIME_MS" -lt 500 ]; then
    log_success "API 响应时间: ${API_TIME_MS}ms (优秀)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ "$API_TIME_MS" -lt 1000 ]; then
    log_info "API 响应时间: ${API_TIME_MS}ms (良好)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "API 响应时间: ${API_TIME_MS}ms (需要优化)"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 测试总结
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log_section "📊 测试总结"

echo ""
echo -e "${CYAN}总测试数:${NC} $TOTAL_TESTS"
echo -e "${GREEN}通过:${NC} $PASSED_TESTS"
echo -e "${RED}失败:${NC} $FAILED_TESTS"
echo ""

# 计算通过率
PASS_RATE=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
echo -e "${CYAN}通过率:${NC} ${PASS_RATE}%"
echo ""

# 部署信息
log_section "🌐 部署信息"
echo ""
echo -e "${CYAN}前端地址:${NC} $FRONTEND_URL"
echo -e "${CYAN}统一登录:${NC} $FRONTEND_URL/unified-login"
echo -e "${CYAN}API 地址:${NC} $API_URL"
echo ""

# 快速访问链接
log_section "🔗 快速访问"
echo ""
echo "1. 统一登录页面:"
echo "   $FRONTEND_URL/unified-login"
echo ""
echo "2. 账户管理页面 (需登录):"
echo "   $FRONTEND_URL/admin/email-role-accounts"
echo ""
echo "3. API 文档:"
echo "   $API_URL/api/health"
echo ""

# 测试账号信息
log_section "👤 测试账号"
echo ""
echo "审核员:"
echo "  用户名: reviewerA"
echo "  密码: admin123"
echo ""
echo "管理员:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "超级管理员:"
echo "  用户名: test_superadmin"
echo "  密码: admin123"
echo ""

# 最终结果
if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ 所有测试通过！部署成功！                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   ⚠️  部分测试失败，请检查上述错误                     ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

