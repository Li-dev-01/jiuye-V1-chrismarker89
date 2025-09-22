#!/bin/bash

# PNG缓存一键清理脚本
# 用于书信体样式更新后快速清理所有PNG缓存

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API配置 - 优先使用线上环境
API_BASE_URL="${API_BASE_URL:-https://employment-survey-api-prod.chrismarker89.workers.dev}"
ENDPOINT="/api/png-management/cache/clear-all"

echo -e "${CYAN}🎨 PNG缓存清理工具${NC}"
echo -e "${CYAN}📅 书信体样式更新专用${NC}"
echo ""

# 检查curl是否可用
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl命令未找到，请先安装curl${NC}"
    exit 1
fi

echo -e "${BLUE}🧹 开始清理所有PNG缓存...${NC}"
echo -e "${BLUE}📡 请求地址: ${API_BASE_URL}${ENDPOINT}${NC}"

# 发送清理请求
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"reason":"书信体样式更新","deleteR2Files":false}' \
    "${API_BASE_URL}${ENDPOINT}")

# 分离HTTP状态码和响应体
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

# 检查响应
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PNG缓存清理成功!${NC}"
    
    # 尝试解析JSON响应
    if command -v jq &> /dev/null; then
        echo -e "${CYAN}📊 清理统计:${NC}"
        deleted_count=$(echo "$body" | jq -r '.data.deletedCacheCount // "未知"')
        message=$(echo "$body" | jq -r '.message // "清理完成"')
        
        echo -e "${YELLOW}   - 缓存条目: ${deleted_count}个${NC}"
        echo -e "${GREEN}💬 ${message}${NC}"
    else
        echo -e "${YELLOW}📄 响应详情: ${body}${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 所有PNG缓存已清理完成！${NC}"
    echo -e "${CYAN}📝 下次用户下载PNG时将使用新的书信体样式${NC}"
    
else
    echo -e "${RED}❌ PNG缓存清理失败!${NC}"
    echo -e "${RED}状态码: ${http_code}${NC}"
    echo -e "${RED}响应内容: ${body}${NC}"
    
    if [ "$http_code" -eq 000 ]; then
        echo -e "${YELLOW}💡 提示: 请检查API服务是否正常运行${NC}"
        echo -e "${YELLOW}   可以尝试: curl ${API_BASE_URL}/health${NC}"
    fi
    
    exit 1
fi

echo ""
echo -e "${CYAN}🔧 其他清理选项:${NC}"
echo -e "${YELLOW}   清理特定主题: curl -X POST ${API_BASE_URL}/api/png-management/cache/clear-theme/gradient${NC}"
echo -e "${YELLOW}   清理故事缓存: curl -X POST ${API_BASE_URL}/api/png-management/cache/clear-type/story${NC}"
echo -e "${YELLOW}   清理心声缓存: curl -X POST ${API_BASE_URL}/api/png-management/cache/clear-type/heart_voice${NC}"
