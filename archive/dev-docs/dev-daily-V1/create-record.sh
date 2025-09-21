#!/bin/bash

# Dev-Daily-V1 记录文件创建脚本
# 用法: ./create-record.sh [类型] [描述]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}Dev-Daily-V1 记录文件创建脚本${NC}"
    echo ""
    echo "用法: $0 [类型] [描述]"
    echo ""
    echo "支持的类型:"
    echo "  progress-update     - 进度更新 (默认)"
    echo "  feature-development - 功能开发"
    echo "  issue-fix          - 问题修复"
    echo "  deployment-record  - 部署记录"
    echo "  architecture-change - 架构变更"
    echo "  testing-report     - 测试报告"
    echo "  weekly-summary     - 周度总结"
    echo "  monthly-review     - 月度回顾"
    echo ""
    echo "示例:"
    echo "  $0                                    # 创建今日进度更新"
    echo "  $0 feature-development questionnaire-form  # 创建功能开发记录"
    echo "  $0 issue-fix api-timeout             # 创建问题修复记录"
    echo "  $0 deployment-record v1.0.0          # 创建部署记录"
    echo ""
}

# 获取当前日期
get_date() {
    date +%Y-%m-%d
}

# 获取当前时间
get_time() {
    date +"%Y-%m-%d %H:%M"
}

# 选择模板
select_template() {
    local type="$1"
    
    case "$type" in
        "progress-update"|"feature-development"|"testing-report"|"weekly-summary"|"monthly-review")
            echo "$TEMPLATES_DIR/daily-update-template.md"
            ;;
        "issue-fix")
            echo "$TEMPLATES_DIR/issue-report-template.md"
            ;;
        "deployment-record")
            echo "$TEMPLATES_DIR/deployment-record-template.md"
            ;;
        "architecture-change")
            echo "$TEMPLATES_DIR/daily-update-template.md"
            ;;
        *)
            echo "$TEMPLATES_DIR/daily-update-template.md"
            ;;
    esac
}

# 生成文件名
generate_filename() {
    local type="$1"
    local description="$2"
    local date="$(get_date)"
    
    if [ -n "$description" ]; then
        echo "${date}-${type}-${description}.md"
    else
        echo "${date}-${type}.md"
    fi
}

# 创建记录文件
create_record() {
    local type="${1:-progress-update}"
    local description="$2"
    
    # 验证类型
    case "$type" in
        "progress-update"|"feature-development"|"issue-fix"|"deployment-record"|"architecture-change"|"testing-report"|"weekly-summary"|"monthly-review")
            ;;
        *)
            echo -e "${RED}错误: 不支持的类型 '$type'${NC}"
            show_help
            exit 1
            ;;
    esac
    
    # 生成文件名
    local filename="$(generate_filename "$type" "$description")"
    local filepath="$SCRIPT_DIR/$filename"
    
    # 检查文件是否已存在
    if [ -f "$filepath" ]; then
        echo -e "${YELLOW}警告: 文件 '$filename' 已存在${NC}"
        read -p "是否覆盖? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}操作已取消${NC}"
            exit 0
        fi
    fi
    
    # 选择模板
    local template="$(select_template "$type")"
    
    if [ ! -f "$template" ]; then
        echo -e "${RED}错误: 模板文件不存在: $template${NC}"
        exit 1
    fi
    
    # 复制模板
    cp "$template" "$filepath"
    
    # 替换模板中的占位符
    local current_date="$(get_date)"
    local current_time="$(get_time)"
    
    # 根据类型设置标题
    local title=""
    case "$type" in
        "progress-update")
            title="项目进度更新"
            ;;
        "feature-development")
            title="功能开发记录"
            if [ -n "$description" ]; then
                title="$title - $description"
            fi
            ;;
        "issue-fix")
            title="问题修复报告"
            if [ -n "$description" ]; then
                title="$title - $description"
            fi
            ;;
        "deployment-record")
            title="部署记录"
            if [ -n "$description" ]; then
                title="$title - $description"
            fi
            ;;
        "architecture-change")
            title="架构变更记录"
            if [ -n "$description" ]; then
                title="$title - $description"
            fi
            ;;
        "testing-report")
            title="测试报告"
            if [ -n "$description" ]; then
                title="$title - $description"
            fi
            ;;
        "weekly-summary")
            title="周度总结"
            ;;
        "monthly-review")
            title="月度回顾"
            ;;
    esac
    
    # 替换文件内容中的占位符
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/YYYY-MM-DD/$current_date/g" "$filepath"
        sed -i '' "s/项目进度更新/$title/g" "$filepath"
        sed -i '' "s/\[YYYY-MM-DD HH:MM\]/$current_time/g" "$filepath"
    else
        # Linux
        sed -i "s/YYYY-MM-DD/$current_date/g" "$filepath"
        sed -i "s/项目进度更新/$title/g" "$filepath"
        sed -i "s/\[YYYY-MM-DD HH:MM\]/$current_time/g" "$filepath"
    fi
    
    echo -e "${GREEN}✅ 成功创建记录文件: $filename${NC}"
    echo -e "${BLUE}📝 文件路径: $filepath${NC}"
    echo ""
    echo -e "${YELLOW}💡 提示:${NC}"
    echo "  1. 请编辑文件并填入具体内容"
    echo "  2. 记得更新项目总览文件 (如有重大变更)"
    echo "  3. 使用 'grep -r \"关键词\" dev-daily-V1/' 搜索历史记录"
    echo ""
    
    # 询问是否立即编辑
    read -p "是否立即编辑文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 尝试使用不同的编辑器
        if command -v code >/dev/null 2>&1; then
            code "$filepath"
        elif command -v nano >/dev/null 2>&1; then
            nano "$filepath"
        elif command -v vim >/dev/null 2>&1; then
            vim "$filepath"
        else
            echo -e "${YELLOW}未找到合适的编辑器，请手动编辑文件${NC}"
        fi
    fi
}

# 主函数
main() {
    # 检查参数
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    # 检查模板目录
    if [ ! -d "$TEMPLATES_DIR" ]; then
        echo -e "${RED}错误: 模板目录不存在: $TEMPLATES_DIR${NC}"
        exit 1
    fi
    
    # 创建记录文件
    create_record "$1" "$2"
}

# 运行主函数
main "$@"
