#!/bin/bash

# 分级审核系统线上部署脚本
# 自动化部署流程，减少手动操作

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

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_error "curl 未安装，请先安装 curl"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 Node.js 和 npm"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 构建前端
build_frontend() {
    log_info "构建前端代码..."
    
    cd frontend
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 构建
    log_info "构建前端..."
    npm run build
    
    cd ..
    log_success "前端构建完成"
}

# 验证Worker代码
validate_worker() {
    log_info "验证Worker代码..."
    
    if [ ! -f "backend/cloudflare/tiered-audit-worker.js" ]; then
        log_error "Worker代码文件不存在: backend/cloudflare/tiered-audit-worker.js"
        exit 1
    fi
    
    # 检查代码语法
    node -c backend/cloudflare/tiered-audit-worker.js
    log_success "Worker代码验证通过"
}

# 测试API端点
test_api() {
    local base_url=$1
    log_info "测试API端点: $base_url"
    
    # 测试健康检查
    log_info "测试级别获取接口..."
    response=$(curl -s -w "%{http_code}" -o /tmp/api_response "$base_url/api/audit/level")
    
    if [ "$response" = "200" ]; then
        log_success "API健康检查通过"
        cat /tmp/api_response | head -c 200
        echo ""
    else
        log_warning "API可能尚未部署或配置有误 (HTTP $response)"
        if [ -f /tmp/api_response ]; then
            cat /tmp/api_response
        fi
    fi
    
    # 测试内容审核
    log_info "测试内容审核接口..."
    curl -s -X POST "$base_url/api/audit/test" \
        -H "Content-Type: application/json" \
        -d '{"content": "测试内容", "content_type": "story"}' \
        -w "\nHTTP Status: %{http_code}\n" || log_warning "内容审核测试失败"
}

# 生成部署报告
generate_report() {
    local domain=$1
    log_info "生成部署报告..."
    
    cat > deployment-report.md << EOF
# 分级审核系统部署报告

**部署时间**: $(date)
**部署域名**: $domain

## 部署文件清单

### 数据库迁移
- \`backend/scripts/deploy_tiered_audit_online.sql\` - 数据库迁移脚本

### Cloudflare Worker
- \`backend/cloudflare/tiered-audit-worker.js\` - 分级审核API服务

### 前端代码
- \`frontend/dist/\` - 构建后的前端代码

## API端点

- \`GET $domain/api/audit/level\` - 获取当前审核级别
- \`POST $domain/api/audit/level\` - 切换审核级别
- \`POST $domain/api/audit/test\` - 测试内容审核
- \`GET $domain/api/audit/stats\` - 获取统计信息

## 部署后检查清单

### 数据库
- [ ] 执行迁移脚本: \`backend/scripts/deploy_tiered_audit_online.sql\`
- [ ] 验证表创建: \`SHOW TABLES LIKE 'audit_%';\`
- [ ] 检查配置数据: \`SELECT * FROM audit_level_configs;\`

### Cloudflare Worker
- [ ] 创建Worker: \`tiered-audit-api\`
- [ ] 部署代码: 复制 \`tiered-audit-worker.js\` 内容
- [ ] 配置路由: \`$domain/api/audit/* -> tiered-audit-api\`
- [ ] 测试API: \`curl $domain/api/audit/level\`

### 前端部署
- [ ] 上传构建文件: \`frontend/dist/\`
- [ ] 验证页面加载: 访问管理后台
- [ ] 测试分级审核界面: 审核管理 → 分级审核

## 测试用例

### 1. 基础功能测试
\`\`\`bash
# 获取当前级别
curl $domain/api/audit/level

# 切换级别
curl -X POST $domain/api/audit/level \\
  -H "Content-Type: application/json" \\
  -d '{"level": "level2", "admin_id": "admin"}'

# 测试正常内容
curl -X POST $domain/api/audit/test \\
  -H "Content-Type: application/json" \\
  -d '{"content": "这是正常内容", "content_type": "story"}'

# 测试违规内容
curl -X POST $domain/api/audit/test \\
  -H "Content-Type: application/json" \\
  -d '{"content": "习近平", "content_type": "story"}'
\`\`\`

### 2. 预期结果
- 正常内容: \`"action": "approve"\`
- 违规内容: \`"action": "reject"\`
- 级别切换: \`"success": true\`

## 监控建议

1. **性能监控**: 关注API响应时间 (< 100ms)
2. **错误监控**: 监控Worker错误日志
3. **使用统计**: 定期查看审核统计数据
4. **数据清理**: 定期清理历史数据

## 故障排除

如遇问题，请参考 \`docs/online-deployment-guide.md\` 中的故障排除章节。

---
**部署完成**: $(date)
EOF

    log_success "部署报告已生成: deployment-report.md"
}

# 主函数
main() {
    echo "=================================="
    echo "分级审核系统线上部署工具"
    echo "=================================="
    
    # 获取域名参数
    DOMAIN=${1:-"your-domain.com"}
    
    log_info "目标域名: $DOMAIN"
    
    # 确认部署
    echo ""
    read -p "确认要开始部署吗? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    check_dependencies
    validate_worker
    build_frontend
    
    echo ""
    log_info "准备工作完成！"
    echo ""
    echo "接下来请手动完成以下步骤:"
    echo ""
    echo "1. 📊 数据库迁移:"
    echo "   在线上数据库执行: backend/scripts/deploy_tiered_audit_online.sql"
    echo ""
    echo "2. ⚡ 部署Cloudflare Worker:"
    echo "   - 创建Worker: tiered-audit-api"
    echo "   - 复制代码: backend/cloudflare/tiered-audit-worker.js"
    echo "   - 配置路由: $DOMAIN/api/audit/* -> tiered-audit-api"
    echo ""
    echo "3. 🌐 部署前端:"
    echo "   - 上传 frontend/dist/ 到 Cloudflare Pages"
    echo "   - 或通过Git推送触发自动部署"
    echo ""
    
    # 等待用户确认完成
    read -p "完成上述步骤后，按回车键继续测试..." -r
    
    # 测试部署结果
    test_api "https://$DOMAIN"
    
    # 生成报告
    generate_report "https://$DOMAIN"
    
    echo ""
    log_success "部署流程完成！"
    echo ""
    echo "📋 部署报告: deployment-report.md"
    echo "📖 详细文档: docs/online-deployment-guide.md"
    echo ""
    echo "🎯 下一步:"
    echo "1. 访问管理后台验证功能"
    echo "2. 进行完整的功能测试"
    echo "3. 监控系统运行状态"
    echo ""
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
