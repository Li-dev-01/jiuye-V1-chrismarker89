#!/bin/bash

# 部署验证脚本
# 用途: 验证生产环境部署是否成功

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 验证数据库迁移
verify_database_migration() {
    log_info "验证数据库迁移状态..."
    
    # 检查迁移日志表
    if wrangler d1 execute college-employment-survey --command="SELECT COUNT(*) as count FROM migration_logs;" --remote --json > /dev/null 2>&1; then
        log_success "迁移日志表存在"
        
        # 获取最新迁移记录
        local latest_migration=$(wrangler d1 execute college-employment-survey --command="SELECT migration_name, status FROM migration_logs ORDER BY executed_at DESC LIMIT 1;" --remote --json)
        
        if echo "$latest_migration" | jq -e '.results[0].status == "completed"' > /dev/null; then
            log_success "最新迁移状态: 已完成"
        else
            log_warning "最新迁移状态可能有问题"
        fi
    else
        log_error "迁移日志表不存在"
        return 1
    fi
    
    # 验证user_id字段类型
    local table_info=$(wrangler d1 execute college-employment-survey --command="PRAGMA table_info(universal_questionnaire_responses);" --remote --json)
    
    if echo "$table_info" | jq -r '.results[] | select(.name=="user_id") | .type' | grep -q "TEXT"; then
        log_success "user_id字段类型验证通过: TEXT"
    else
        log_error "user_id字段类型验证失败"
        return 1
    fi
}

# 验证健康检查端点
verify_health_endpoints() {
    log_info "验证健康检查端点..."
    
    # 这里需要您提供实际的Worker URL
    local worker_url="https://your-worker.workers.dev"
    
    log_info "请提供您的Worker URL (例如: https://your-worker.workers.dev):"
    read -r worker_url
    
    if [[ -z "$worker_url" ]]; then
        log_warning "未提供Worker URL，跳过端点验证"
        return 0
    fi
    
    # 测试基础健康检查
    log_info "测试基础健康检查..."
    if curl -s "$worker_url/api/health" | jq -e '.success == true' > /dev/null; then
        log_success "基础健康检查正常"
    else
        log_error "基础健康检查失败"
        return 1
    fi
    
    # 测试数据库健康检查
    log_info "测试数据库健康检查..."
    if curl -s "$worker_url/api/system-health/database" | jq -e '.success == true' > /dev/null; then
        log_success "数据库健康检查正常"
    else
        log_warning "数据库健康检查可能有问题"
    fi
    
    # 测试数据一致性检查
    log_info "测试数据一致性检查..."
    if curl -s "$worker_url/api/system-health/consistency" | jq -e '.success == true' > /dev/null; then
        log_success "数据一致性检查正常"
    else
        log_warning "数据一致性检查可能有问题"
    fi
}

# 验证前端构建
verify_frontend_build() {
    log_info "验证前端构建..."
    
    if [[ -d "frontend/dist" ]]; then
        log_success "前端构建目录存在"
        
        if [[ -f "frontend/dist/index.html" ]]; then
            log_success "前端入口文件存在"
        else
            log_warning "前端入口文件不存在"
        fi
    else
        log_warning "前端构建目录不存在，可能需要重新构建"
    fi
}

# 生成验证报告
generate_verification_report() {
    log_info "生成验证报告..."
    
    local report_file="verification-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 部署验证报告

**验证时间**: $(date)

## 验证结果

### 数据库迁移验证
- 迁移日志表: $(wrangler d1 execute college-employment-survey --command="SELECT COUNT(*) as count FROM migration_logs;" --remote --json 2>/dev/null | jq -r '.results[0].count // "未知"') 条记录
- user_id字段类型: $(wrangler d1 execute college-employment-survey --command="PRAGMA table_info(universal_questionnaire_responses);" --remote --json 2>/dev/null | jq -r '.results[] | select(.name=="user_id") | .type // "未知"')

### 健康检查端点验证
- 基础健康检查: 需要手动验证
- 数据库健康检查: 需要手动验证
- 数据一致性检查: 需要手动验证

### 前端构建验证
- 构建目录: $([ -d "frontend/dist" ] && echo "存在" || echo "不存在")
- 入口文件: $([ -f "frontend/dist/index.html" ] && echo "存在" || echo "不存在")

## 建议

1. 如果健康检查端点验证失败，请检查Worker部署状态
2. 如果前端构建不存在，请运行: cd frontend && npm run build
3. 定期监控健康检查端点确保系统正常运行

EOF

    log_success "验证报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始验证部署状态..."
    log_info "========================================"
    
    local verification_passed=true
    
    # 验证数据库迁移
    if verify_database_migration; then
        log_success "数据库迁移验证通过"
    else
        log_error "数据库迁移验证失败"
        verification_passed=false
    fi
    
    # 验证健康检查端点
    if verify_health_endpoints; then
        log_success "健康检查端点验证通过"
    else
        log_warning "健康检查端点验证有问题"
    fi
    
    # 验证前端构建
    verify_frontend_build
    
    # 生成报告
    generate_verification_report
    
    echo
    log_info "========================================"
    if $verification_passed; then
        log_success "部署验证完成!"
    else
        log_warning "部署验证完成，但发现一些问题"
    fi
    log_info "请查看验证报告了解详细信息"
}

# 执行主函数
main "$@"
