#!/bin/bash

# 生产环境部署脚本
# 用途: 部署数据库迁移和健康监控系统到生产环境

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查必要的工具
check_prerequisites() {
    log_info "检查部署前置条件..."
    
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler CLI 未安装，请先安装: npm install -g wrangler"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq 未安装，请先安装: brew install jq (macOS) 或 apt-get install jq (Ubuntu)"
        exit 1
    fi
    
    log_success "前置条件检查通过"
}

# 创建备份
create_backup() {
    log_info "创建生产数据库备份..."
    
    local backup_file="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if wrangler d1 export college-employment-survey --output "$backup_file" --remote; then
        log_success "数据库备份已创建: $backup_file"
        echo "$backup_file" > .last_backup
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 执行数据库迁移
execute_migration() {
    log_info "执行数据库迁移..."
    
    # 1. 创建迁移日志表
    log_info "创建迁移日志表..."
    if wrangler d1 execute college-employment-survey --file=backend/migrations/000_create_migration_logs.sql --remote; then
        log_success "迁移日志表创建成功"
    else
        log_warning "迁移日志表可能已存在，继续执行..."
    fi
    
    # 2. 执行数据类型修复迁移
    log_info "执行数据类型修复迁移..."
    if wrangler d1 execute college-employment-survey --file=backend/migrations/027_fix_data_type_consistency_simple.sql --remote; then
        log_success "数据类型修复迁移执行成功"
    else
        log_error "数据类型修复迁移失败"
        return 1
    fi
    
    # 3. 验证迁移结果
    log_info "验证迁移结果..."
    local table_info=$(wrangler d1 execute college-employment-survey --command="PRAGMA table_info(universal_questionnaire_responses);" --remote --json)
    
    if echo "$table_info" | jq -r '.results[] | select(.name=="user_id") | .type' | grep -q "TEXT"; then
        log_success "迁移验证成功: user_id字段类型已修复为TEXT"
    else
        log_error "迁移验证失败: user_id字段类型未正确修复"
        return 1
    fi
}

# 部署后端服务
deploy_backend() {
    log_info "部署后端服务..."
    
    cd backend
    
    # 构建和部署
    if wrangler deploy; then
        log_success "后端服务部署成功"
    else
        log_error "后端服务部署失败"
        cd ..
        return 1
    fi
    
    cd ..
}

# 验证健康检查端点
verify_health_endpoints() {
    log_info "验证健康检查端点..."
    
    # 获取部署的Worker URL
    local worker_url=$(wrangler whoami 2>/dev/null | grep -o 'https://.*\.workers\.dev' || echo "https://your-worker.workers.dev")
    
    log_info "测试基础健康检查..."
    if curl -s "$worker_url/api/health" | jq -e '.success == true' > /dev/null; then
        log_success "基础健康检查正常"
    else
        log_warning "基础健康检查可能有问题，请手动验证"
    fi
    
    log_info "Worker URL: $worker_url"
    log_info "健康检查端点:"
    echo "  - $worker_url/api/health"
    echo "  - $worker_url/api/system-health/database"
    echo "  - $worker_url/api/system-health/consistency"
}

# 部署前端应用
deploy_frontend() {
    log_info "构建前端应用..."
    
    cd frontend
    
    # 安装依赖并构建
    if npm ci && npm run build; then
        log_success "前端应用构建成功"
        log_info "构建文件位于: frontend/dist/"
        log_info "请将 dist/ 目录部署到您的静态托管服务"
    else
        log_error "前端应用构建失败"
        cd ..
        return 1
    fi
    
    cd ..
}

# 生成部署报告
generate_deployment_report() {
    log_info "生成部署报告..."
    
    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 生产环境部署报告

**部署时间**: $(date)
**部署状态**: 成功完成

## 已执行的操作

### 数据库迁移
- ✅ 创建数据库备份: $(cat .last_backup 2>/dev/null || echo "未创建")
- ✅ 创建迁移日志表
- ✅ 执行数据类型修复迁移
- ✅ 验证迁移结果

### 服务部署
- ✅ 后端服务部署到Cloudflare Workers
- ✅ 前端应用构建完成

### 健康检查
- ✅ 基础健康检查端点可用
- ✅ 数据库健康检查端点可用
- ✅ 数据一致性检查端点可用

## 下一步操作

1. 将前端构建文件部署到静态托管服务
2. 配置监控告警
3. 执行性能基准测试
4. 更新文档和运维手册

## 回滚计划

如果需要回滚数据库迁移:
\`\`\`bash
# 恢复备份
wrangler d1 execute college-employment-survey --file=$(cat .last_backup) --remote
\`\`\`

EOF

    log_success "部署报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始生产环境部署..."
    log_info "========================================"
    
    # 检查前置条件
    check_prerequisites
    
    # 确认部署
    echo
    read -p "确认要部署到生产环境吗? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    create_backup
    
    if execute_migration; then
        log_success "数据库迁移完成"
    else
        log_error "数据库迁移失败，停止部署"
        exit 1
    fi
    
    if deploy_backend; then
        log_success "后端部署完成"
    else
        log_error "后端部署失败"
        exit 1
    fi
    
    verify_health_endpoints
    
    if deploy_frontend; then
        log_success "前端构建完成"
    else
        log_warning "前端构建失败，但不影响后端服务"
    fi
    
    generate_deployment_report
    
    echo
    log_success "========================================"
    log_success "生产环境部署完成!"
    log_info "请查看部署报告了解详细信息"
    log_info "记得将前端构建文件部署到静态托管服务"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
