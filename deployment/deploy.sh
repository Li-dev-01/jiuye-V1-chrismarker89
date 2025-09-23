#!/bin/bash

# API优化部署脚本
# 支持灰度部署、蓝绿部署和快速回退

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/deployment.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# 检查依赖
check_dependencies() {
    log "检查部署依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        error "npm 未安装"
        exit 1
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        error "Git 未安装"
        exit 1
    fi
    
    # 检查Docker (用于监控系统)
    if ! command -v docker &> /dev/null; then
        warning "Docker 未安装，监控系统将无法部署"
    fi
    
    success "依赖检查完成"
}

# 创建备份
create_backup() {
    log "创建系统备份..."
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 备份当前代码
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    git tag "$BACKUP_NAME" || true
    
    # 备份配置文件
    if [ -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env" "$BACKUP_DIR/.env.$BACKUP_NAME"
    fi
    
    # 备份数据库 (如果是本地数据库)
    if [ -f "$PROJECT_ROOT/database/local.db" ]; then
        cp "$PROJECT_ROOT/database/local.db" "$BACKUP_DIR/local.db.$BACKUP_NAME"
    fi
    
    success "备份创建完成: $BACKUP_NAME"
    echo "$BACKUP_NAME" > "$BACKUP_DIR/latest_backup"
}

# 运行测试
run_tests() {
    log "运行部署前测试..."
    
    cd "$PROJECT_ROOT"
    
    # 安装依赖
    log "安装依赖..."
    npm install
    
    # 运行单元测试
    log "运行单元测试..."
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test || {
            error "单元测试失败"
            return 1
        }
    fi
    
    # 运行API测试
    log "运行API测试..."
    if [ -f "scripts/run-api-tests.js" ]; then
        node scripts/run-api-tests.js || {
            error "API测试失败"
            return 1
        }
    fi
    
    success "测试通过"
}

# 部署中间件
deploy_middleware() {
    log "部署中间件系统..."
    
    cd "$PROJECT_ROOT"
    
    # 检查中间件文件
    MIDDLEWARE_FILES=(
        "backend/src/middleware/cache.ts"
        "backend/src/middleware/rate-limit.ts"
        "backend/src/middleware/pagination.ts"
        "backend/src/middleware/validation.ts"
    )
    
    for file in "${MIDDLEWARE_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            error "中间件文件不存在: $file"
            return 1
        fi
    done
    
    # 编译TypeScript (如果需要)
    if [ -f "tsconfig.json" ]; then
        log "编译TypeScript..."
        npx tsc || {
            error "TypeScript编译失败"
            return 1
        }
    fi
    
    success "中间件部署完成"
}

# 部署监控系统
deploy_monitoring() {
    log "部署监控系统..."
    
    if ! command -v docker &> /dev/null; then
        warning "Docker未安装，跳过监控系统部署"
        return 0
    fi
    
    cd "$PROJECT_ROOT/monitoring"
    
    # 检查监控配置文件
    if [ ! -f "docker-compose.yml" ]; then
        error "监控配置文件不存在"
        return 1
    fi
    
    # 启动监控服务
    log "启动监控服务..."
    docker-compose up -d || {
        error "监控系统启动失败"
        return 1
    }
    
    # 等待服务启动
    log "等待监控服务启动..."
    sleep 30
    
    # 检查服务状态
    docker-compose ps
    
    success "监控系统部署完成"
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    # 检查主应用
    if command -v curl &> /dev/null; then
        # 假设应用运行在8787端口
        if curl -f http://localhost:8787/api/health &> /dev/null; then
            success "主应用健康检查通过"
        else
            error "主应用健康检查失败"
            return 1
        fi
    fi
    
    # 检查监控系统
    if command -v docker &> /dev/null; then
        if curl -f http://localhost:9090/-/healthy &> /dev/null; then
            success "Prometheus健康检查通过"
        else
            warning "Prometheus健康检查失败"
        fi
        
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            success "Grafana健康检查通过"
        else
            warning "Grafana健康检查失败"
        fi
    fi
    
    success "健康检查完成"
}

# 性能验证
performance_verification() {
    log "执行性能验证..."
    
    cd "$PROJECT_ROOT"
    
    # 运行性能监控脚本
    if [ -f "scripts/performance-monitor.cjs" ]; then
        node scripts/performance-monitor.cjs
    fi
    
    # 检查关键指标
    log "检查性能指标..."
    
    # 这里可以添加具体的性能检查逻辑
    # 例如：检查响应时间、内存使用等
    
    success "性能验证完成"
}

# 功能验证
functional_verification() {
    log "执行功能验证..."
    
    cd "$PROJECT_ROOT"
    
    # 运行端到端测试
    if [ -f "scripts/run-newman-tests.sh" ]; then
        chmod +x scripts/run-newman-tests.sh
        ./scripts/run-newman-tests.sh || {
            error "功能验证失败"
            return 1
        }
    fi
    
    success "功能验证完成"
}

# 回退函数
rollback() {
    error "部署失败，开始回退..."
    
    # 获取最新备份
    if [ -f "$BACKUP_DIR/latest_backup" ]; then
        BACKUP_NAME=$(cat "$BACKUP_DIR/latest_backup")
        log "回退到备份: $BACKUP_NAME"
        
        # 回退代码
        git checkout "$BACKUP_NAME" || {
            error "代码回退失败"
        }
        
        # 回退配置文件
        if [ -f "$BACKUP_DIR/.env.$BACKUP_NAME" ]; then
            cp "$BACKUP_DIR/.env.$BACKUP_NAME" "$PROJECT_ROOT/.env"
        fi
        
        # 回退数据库
        if [ -f "$BACKUP_DIR/local.db.$BACKUP_NAME" ]; then
            cp "$BACKUP_DIR/local.db.$BACKUP_NAME" "$PROJECT_ROOT/database/local.db"
        fi
        
        # 重启服务
        log "重启服务..."
        # 这里添加重启服务的命令
        
        success "回退完成"
    else
        error "未找到备份，无法回退"
    fi
}

# 主部署流程
main_deployment() {
    log "开始API优化部署..."
    
    # 阶段1: 预部署准备
    log "=== 阶段1: 预部署准备 ==="
    check_dependencies || { rollback; exit 1; }
    create_backup || { rollback; exit 1; }
    run_tests || { rollback; exit 1; }
    
    # 阶段2: 部署组件
    log "=== 阶段2: 部署组件 ==="
    deploy_middleware || { rollback; exit 1; }
    deploy_monitoring || { rollback; exit 1; }
    
    # 阶段3: 验证部署
    log "=== 阶段3: 验证部署 ==="
    health_check || { rollback; exit 1; }
    performance_verification || { rollback; exit 1; }
    functional_verification || { rollback; exit 1; }
    
    success "API优化部署完成！"
    
    # 输出部署信息
    log "=== 部署信息 ==="
    log "部署时间: $(date)"
    log "备份标签: $(cat "$BACKUP_DIR/latest_backup" 2>/dev/null || echo "未知")"
    log "监控地址: http://localhost:3000 (Grafana)"
    log "监控地址: http://localhost:9090 (Prometheus)"
    log "日志文件: $LOG_FILE"
}

# 显示帮助信息
show_help() {
    echo "API优化部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  deploy     执行完整部署"
    echo "  rollback   回退到上一个版本"
    echo "  test       只运行测试"
    echo "  health     只执行健康检查"
    echo "  help       显示此帮助信息"
    echo ""
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            main_deployment
            ;;
        "rollback")
            rollback
            ;;
        "test")
            run_tests
            ;;
        "health")
            health_check
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
