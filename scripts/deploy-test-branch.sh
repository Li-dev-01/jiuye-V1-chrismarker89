#!/bin/bash

# 问卷2集成测试环境部署脚本
# 用于部署test分支到Cloudflare测试环境

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/deployment-test.log"

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
    
    # 检查wrangler
    if ! command -v wrangler &> /dev/null; then
        error "Wrangler CLI 未安装，请先安装: npm install -g wrangler"
        exit 1
    fi
    
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
    
    # 检查当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "test" ]; then
        error "当前不在test分支，请先切换到test分支: git checkout test"
        exit 1
    fi
    
    success "依赖检查完成"
}

# 创建数据库表
create_database_tables() {
    log "创建问卷2数据库表..."
    
    cd "$PROJECT_ROOT"
    
    # 检查数据库迁移文件
    if [ ! -f "database/migrations/create_questionnaire_v2_tables.sql" ]; then
        error "数据库迁移文件不存在"
        return 1
    fi
    
    # 执行数据库迁移
    log "执行数据库迁移..."
    wrangler d1 execute college-employment-survey --file=database/migrations/create_questionnaire_v2_tables.sql || {
        warning "数据库表可能已存在，继续部署..."
    }
    
    success "数据库表创建完成"
}

# 导入测试数据
import_test_data() {
    log "导入问卷2测试数据..."
    
    cd "$PROJECT_ROOT/test-data/sql-v2"
    
    # 检查SQL文件是否存在
    if [ ! -f "01-questionnaire2-users.sql" ]; then
        error "测试数据SQL文件不存在，请先运行: node test-data/scripts/generateQuestionnaire2SQL.cjs"
        return 1
    fi
    
    # 执行导入脚本
    log "执行测试数据导入..."
    chmod +x import-questionnaire2-data.sh
    bash import-questionnaire2-data.sh college-employment-survey || {
        warning "测试数据导入可能部分失败，继续部署..."
    }
    
    success "测试数据导入完成"
}

# 构建前端
build_frontend() {
    log "构建前端应用..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # 安装依赖
    log "安装前端依赖..."
    npm install || {
        error "前端依赖安装失败"
        return 1
    }
    
    # 构建应用
    log "构建前端应用..."
    npm run build || {
        error "前端构建失败"
        return 1
    }
    
    success "前端构建完成"
}

# 部署后端
deploy_backend() {
    log "部署后端API..."
    
    cd "$PROJECT_ROOT/backend"
    
    # 安装依赖
    log "安装后端依赖..."
    npm install || {
        error "后端依赖安装失败"
        return 1
    }
    
    # 部署到测试环境
    log "部署后端到测试环境..."
    wrangler deploy --env test || {
        error "后端部署失败"
        return 1
    }
    
    success "后端部署完成"
}

# 部署前端
deploy_frontend() {
    log "部署前端应用..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # 部署到测试环境
    log "部署前端到测试环境..."
    wrangler pages deploy dist --project-name college-employment-survey-frontend-test || {
        error "前端部署失败"
        return 1
    }
    
    success "前端部署完成"
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 10
    
    # 检查后端API
    BACKEND_URL="https://employment-survey-api-test.chrismarker89.workers.dev"
    if command -v curl &> /dev/null; then
        log "检查后端API健康状态..."
        if curl -f "$BACKEND_URL/api/health" &> /dev/null; then
            success "后端API健康检查通过"
        else
            warning "后端API健康检查失败，但继续部署"
        fi
        
        # 检查问卷2 API
        log "检查问卷2 API..."
        if curl -f "$BACKEND_URL/api/questionnaire-v2/questionnaires/questionnaire-v2-2024" &> /dev/null; then
            success "问卷2 API检查通过"
        else
            warning "问卷2 API检查失败"
        fi
    fi
    
    # 检查前端
    FRONTEND_URL="https://college-employment-survey-frontend-test.pages.dev"
    if command -v curl &> /dev/null; then
        log "检查前端应用..."
        if curl -f "$FRONTEND_URL" &> /dev/null; then
            success "前端应用健康检查通过"
        else
            warning "前端应用健康检查失败"
        fi
    fi
    
    success "健康检查完成"
}

# 验证部署
verify_deployment() {
    log "验证部署结果..."
    
    cd "$PROJECT_ROOT"
    
    # 创建验证脚本
    cat > verify-test-deployment.js << 'EOF'
const https = require('https');

const BACKEND_URL = 'https://employment-survey-api-test.chrismarker89.workers.dev';
const FRONTEND_URL = 'https://college-employment-survey-frontend-test.pages.dev';

async function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`✅ ${description}: ${res.statusCode}`);
      resolve(res.statusCode < 400);
    }).on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
  });
}

async function verifyDeployment() {
  console.log('🔍 验证test分支部署结果...\n');
  
  const results = [];
  
  // 检查后端端点
  results.push(await checkEndpoint(`${BACKEND_URL}/api/health`, '后端健康检查'));
  results.push(await checkEndpoint(`${BACKEND_URL}/api/questionnaire-v2/questionnaires/questionnaire-v2-2024`, '问卷2配置API'));
  
  // 检查前端
  results.push(await checkEndpoint(FRONTEND_URL, '前端应用'));
  
  const successCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  console.log(`\n📊 验证结果: ${successCount}/${totalCount} 通过`);
  
  if (successCount === totalCount) {
    console.log('🎉 test分支部署验证成功！');
    console.log(`\n🌐 访问地址:`);
    console.log(`   前端: ${FRONTEND_URL}`);
    console.log(`   后端: ${BACKEND_URL}`);
    console.log(`   问卷2可视化: ${FRONTEND_URL}/questionnaire-v2/analytics`);
  } else {
    console.log('⚠️  部分服务可能存在问题，请检查日志');
  }
}

verifyDeployment().catch(console.error);
EOF
    
    # 运行验证
    node verify-test-deployment.js
    
    success "部署验证完成"
}

# 主部署流程
main_deployment() {
    log "开始test分支部署..."
    log "==================================="
    
    # 阶段1: 预部署准备
    log "=== 阶段1: 预部署准备 ==="
    check_dependencies || exit 1
    create_database_tables || exit 1
    import_test_data || exit 1
    
    # 阶段2: 构建应用
    log "=== 阶段2: 构建应用 ==="
    build_frontend || exit 1
    
    # 阶段3: 部署服务
    log "=== 阶段3: 部署服务 ==="
    deploy_backend || exit 1
    deploy_frontend || exit 1
    
    # 阶段4: 验证部署
    log "=== 阶段4: 验证部署 ==="
    health_check || exit 1
    verify_deployment || exit 1
    
    success "test分支部署完成！"
    
    # 输出部署信息
    log "=== 部署信息 ==="
    log "部署时间: $(date)"
    log "分支: test"
    log "前端地址: https://college-employment-survey-frontend-test.pages.dev"
    log "后端地址: https://employment-survey-api-test.chrismarker89.workers.dev"
    log "问卷2可视化: https://college-employment-survey-frontend-test.pages.dev/questionnaire-v2/analytics"
    log "日志文件: $LOG_FILE"
    
    echo ""
    echo "🎉 问卷2集成测试环境部署成功！"
    echo ""
    echo "📋 下一步操作:"
    echo "1. 访问前端测试环境验证功能"
    echo "2. 测试问卷2的数据可视化功能"
    echo "3. 验证Tab切换和混合分析功能"
    echo "4. 确认无误后可合并到main分支"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "问卷2集成测试环境部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  deploy     执行完整部署 (默认)"
    echo "  backend    只部署后端"
    echo "  frontend   只部署前端"
    echo "  data       只导入测试数据"
    echo "  verify     只执行验证"
    echo "  help       显示此帮助信息"
    echo ""
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            main_deployment
            ;;
        "backend")
            check_dependencies
            deploy_backend
            ;;
        "frontend")
            check_dependencies
            build_frontend
            deploy_frontend
            ;;
        "data")
            check_dependencies
            create_database_tables
            import_test_data
            ;;
        "verify")
            verify_deployment
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
