#!/bin/bash

# 快速回退脚本
# 在部署出现问题时快速回退到上一个稳定版本

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/rollback.log"

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

# 检查回退条件
check_rollback_conditions() {
    log "检查回退条件..."
    
    # 检查是否有备份
    if [ ! -d "$BACKUP_DIR" ]; then
        error "备份目录不存在: $BACKUP_DIR"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_DIR/latest_backup" ]; then
        error "未找到备份信息"
        exit 1
    fi
    
    # 检查Git状态
    cd "$PROJECT_ROOT"
    if ! git status &> /dev/null; then
        error "不是Git仓库或Git状态异常"
        exit 1
    fi
    
    success "回退条件检查通过"
}

# 停止当前服务
stop_current_services() {
    log "停止当前服务..."
    
    cd "$PROJECT_ROOT"
    
    # 停止主应用 (根据实际情况调整)
    if pgrep -f "node.*server" > /dev/null; then
        log "停止Node.js应用..."
        pkill -f "node.*server" || true
    fi
    
    # 停止监控服务
    if command -v docker &> /dev/null && [ -f "monitoring/docker-compose.yml" ]; then
        log "停止监控服务..."
        cd monitoring
        docker-compose down || true
        cd ..
    fi
    
    # 等待服务完全停止
    sleep 5
    
    success "服务停止完成"
}

# 回退代码
rollback_code() {
    log "回退代码..."
    
    cd "$PROJECT_ROOT"
    
    # 获取备份标签
    BACKUP_NAME=$(cat "$BACKUP_DIR/latest_backup")
    log "回退到备份: $BACKUP_NAME"
    
    # 保存当前状态 (以防需要恢复)
    CURRENT_COMMIT=$(git rev-parse HEAD)
    echo "$CURRENT_COMMIT" > "$BACKUP_DIR/rollback_from"
    
    # 回退到备份标签
    if git tag | grep -q "$BACKUP_NAME"; then
        git checkout "$BACKUP_NAME" || {
            error "代码回退失败"
            return 1
        }
    else {
        error "备份标签不存在: $BACKUP_NAME"
        return 1
    fi
    
    success "代码回退完成"
}

# 回退配置文件
rollback_config() {
    log "回退配置文件..."
    
    BACKUP_NAME=$(cat "$BACKUP_DIR/latest_backup")
    
    # 回退环境配置
    if [ -f "$BACKUP_DIR/.env.$BACKUP_NAME" ]; then
        cp "$BACKUP_DIR/.env.$BACKUP_NAME" "$PROJECT_ROOT/.env"
        log "环境配置已回退"
    fi
    
    # 回退其他配置文件
    if [ -f "$BACKUP_DIR/package.json.$BACKUP_NAME" ]; then
        cp "$BACKUP_DIR/package.json.$BACKUP_NAME" "$PROJECT_ROOT/package.json"
        log "package.json已回退"
    fi
    
    success "配置文件回退完成"
}

# 回退数据库
rollback_database() {
    log "回退数据库..."
    
    BACKUP_NAME=$(cat "$BACKUP_DIR/latest_backup")
    
    # 回退本地数据库文件
    if [ -f "$BACKUP_DIR/local.db.$BACKUP_NAME" ]; then
        cp "$BACKUP_DIR/local.db.$BACKUP_NAME" "$PROJECT_ROOT/database/local.db"
        log "本地数据库已回退"
    fi
    
    # 如果使用远程数据库，这里添加相应的回退逻辑
    # 注意：远程数据库回退需要特别谨慎
    
    success "数据库回退完成"
}

# 清理缓存和临时文件
cleanup_cache() {
    log "清理缓存和临时文件..."
    
    cd "$PROJECT_ROOT"
    
    # 清理npm缓存
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        log "node_modules已清理"
    fi
    
    # 清理构建文件
    if [ -d "dist" ]; then
        rm -rf dist
        log "构建文件已清理"
    fi
    
    if [ -d "build" ]; then
        rm -rf build
        log "构建文件已清理"
    fi
    
    # 清理日志文件
    if [ -d "logs" ]; then
        rm -rf logs/*
        log "日志文件已清理"
    fi
    
    success "缓存清理完成"
}

# 重新安装依赖
reinstall_dependencies() {
    log "重新安装依赖..."
    
    cd "$PROJECT_ROOT"
    
    # 安装npm依赖
    if [ -f "package.json" ]; then
        npm install || {
            error "依赖安装失败"
            return 1
        }
    fi
    
    # 如果有其他依赖管理器，在这里添加
    
    success "依赖安装完成"
}

# 重启服务
restart_services() {
    log "重启服务..."
    
    cd "$PROJECT_ROOT"
    
    # 重启主应用
    if [ -f "package.json" ] && grep -q "start" package.json; then
        log "启动主应用..."
        nohup npm start > logs/app.log 2>&1 &
        sleep 10
    fi
    
    # 重启监控服务 (可选)
    if command -v docker &> /dev/null && [ -f "monitoring/docker-compose.yml" ]; then
        log "启动监控服务..."
        cd monitoring
        docker-compose up -d || warning "监控服务启动失败"
        cd ..
    fi
    
    success "服务重启完成"
}

# 验证回退
verify_rollback() {
    log "验证回退..."
    
    # 等待服务启动
    sleep 15
    
    # 检查主应用
    if command -v curl &> /dev/null; then
        if curl -f http://localhost:8787/api/health &> /dev/null; then
            success "主应用健康检查通过"
        else
            error "主应用健康检查失败"
            return 1
        fi
    fi
    
    # 检查基本功能
    if curl -f http://localhost:8787/api/admin/users &> /dev/null; then
        success "基本功能验证通过"
    else
        warning "基本功能验证失败，但服务已启动"
    fi
    
    success "回退验证完成"
}

# 快速回退 (5分钟内完成)
quick_rollback() {
    log "执行快速回退..."
    
    check_rollback_conditions || exit 1
    stop_current_services || exit 1
    rollback_code || exit 1
    rollback_config || exit 1
    restart_services || exit 1
    verify_rollback || exit 1
    
    success "快速回退完成"
}

# 完整回退 (15分钟内完成)
full_rollback() {
    log "执行完整回退..."
    
    check_rollback_conditions || exit 1
    stop_current_services || exit 1
    rollback_code || exit 1
    rollback_config || exit 1
    rollback_database || exit 1
    cleanup_cache || exit 1
    reinstall_dependencies || exit 1
    restart_services || exit 1
    verify_rollback || exit 1
    
    success "完整回退完成"
}

# 显示回退状态
show_rollback_status() {
    log "回退状态信息:"
    
    cd "$PROJECT_ROOT"
    
    # 显示当前Git状态
    log "当前Git提交: $(git rev-parse HEAD)"
    log "当前Git分支: $(git branch --show-current)"
    
    # 显示备份信息
    if [ -f "$BACKUP_DIR/latest_backup" ]; then
        log "最新备份: $(cat "$BACKUP_DIR/latest_backup")"
    fi
    
    if [ -f "$BACKUP_DIR/rollback_from" ]; then
        log "回退前提交: $(cat "$BACKUP_DIR/rollback_from")"
    fi
    
    # 显示服务状态
    if pgrep -f "node.*server" > /dev/null; then
        log "主应用状态: 运行中"
    else
        log "主应用状态: 已停止"
    fi
    
    # 显示监控状态
    if command -v docker &> /dev/null; then
        if docker ps | grep -q "monitoring"; then
            log "监控服务状态: 运行中"
        else
            log "监控服务状态: 已停止"
        fi
    fi
}

# 恢复到回退前状态
restore_from_rollback() {
    log "恢复到回退前状态..."
    
    if [ ! -f "$BACKUP_DIR/rollback_from" ]; then
        error "未找到回退前状态信息"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    PREVIOUS_COMMIT=$(cat "$BACKUP_DIR/rollback_from")
    git checkout "$PREVIOUS_COMMIT" || {
        error "恢复失败"
        exit 1
    }
    
    success "已恢复到回退前状态"
}

# 显示帮助信息
show_help() {
    echo "回退脚本使用说明"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  quick      快速回退 (5分钟内，不包含数据库和依赖)"
    echo "  full       完整回退 (15分钟内，包含所有组件)"
    echo "  status     显示回退状态信息"
    echo "  restore    恢复到回退前状态"
    echo "  help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 quick   # 执行快速回退"
    echo "  $0 full    # 执行完整回退"
    echo "  $0 status  # 查看回退状态"
    echo ""
}

# 主函数
main() {
    case "${1:-quick}" in
        "quick")
            quick_rollback
            ;;
        "full")
            full_rollback
            ;;
        "status")
            show_rollback_status
            ;;
        "restore")
            restore_from_rollback
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
    
    # 显示最终状态
    echo ""
    log "=== 回退操作完成 ==="
    log "时间: $(date)"
    log "日志文件: $LOG_FILE"
    log "如需帮助，请运行: $0 help"
}

# 执行主函数
main "$@"
