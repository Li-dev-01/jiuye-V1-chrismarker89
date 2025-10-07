#!/bin/bash

# 测试文件整理脚本
# 将根目录下的37个test文件按类型整理到不同文件夹

echo "=========================================="
echo "开始整理测试文件"
echo "=========================================="
echo ""

# 创建目标文件夹结构
echo "📁 创建文件夹结构..."

mkdir -p archive/test-files/html
mkdir -p archive/test-files/scripts/api
mkdir -p archive/test-files/scripts/questionnaire
mkdir -p archive/test-files/scripts/auth
mkdir -p archive/test-files/scripts/data
mkdir -p archive/test-files/scripts/other
mkdir -p archive/test-files/shell

echo "✅ 文件夹结构创建完成"
echo ""

# 移动文件计数器
MOVED=0

echo "📦 开始移动文件..."
echo ""

# ==================== 1. HTML测试文件 ====================
echo "1️⃣  整理HTML测试文件..."
mv ./test-anti-spam.html archive/test-files/html/ 2>/dev/null && ((MOVED++))
mv ./test-api.html archive/test-files/html/ 2>/dev/null && ((MOVED++))
mv ./test-combo-generator.html archive/test-files/html/ 2>/dev/null && ((MOVED++))
mv ./test-fixes.html archive/test-files/html/ 2>/dev/null && ((MOVED++))
mv ./test-google-oauth.html archive/test-files/html/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire2-debug.html archive/test-files/html/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire2-navigation.html archive/test-files/html/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire2-visualization.html archive/test-files/html/ 2>/dev/null && ((MOVED++))

# ==================== 2. API测试脚本 ====================
echo "2️⃣  整理API测试脚本..."
mv ./test-api-routes.js archive/test-files/scripts/api/ 2>/dev/null && ((MOVED++))
mv ./test-frontend-api.js archive/test-files/scripts/api/ 2>/dev/null && ((MOVED++))

# ==================== 3. 问卷测试脚本 ====================
echo "3️⃣  整理问卷测试脚本..."
mv ./test-questionnaire-api.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire-flow.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire-independence.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire2-economic-questions.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-economic-questions.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-economic-questions-enhanced.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-phase2-completion.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-phase3-completion.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-phase3-progress.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-hybrid-visualization.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./test-visualization-completeness.js archive/test-files/scripts/questionnaire/ 2>/dev/null && ((MOVED++))

# ==================== 4. 数据测试脚本 ====================
echo "4️⃣  整理数据测试脚本..."
mv ./test-data-generation.js archive/test-files/scripts/data/ 2>/dev/null && ((MOVED++))
mv ./test-data-accuracy-validation.js archive/test-files/scripts/data/ 2>/dev/null && ((MOVED++))
mv ./test-submission.js archive/test-files/scripts/data/ 2>/dev/null && ((MOVED++))

# ==================== 5. 其他JS测试脚本 ====================
echo "5️⃣  整理其他JS测试脚本..."
mv ./test-complete-flow.js archive/test-files/scripts/other/ 2>/dev/null && ((MOVED++))
mv ./test-e2e-functionality.js archive/test-files/scripts/other/ 2>/dev/null && ((MOVED++))
mv ./test-fixes-simple.js archive/test-files/scripts/other/ 2>/dev/null && ((MOVED++))
mv ./test-import-fix.js archive/test-files/scripts/other/ 2>/dev/null && ((MOVED++))
mv ./test-performance-optimization.js archive/test-files/scripts/other/ 2>/dev/null && ((MOVED++))
mv ./test-ux-enhancement.js archive/test-files/scripts/other/ 2>/dev/null && ((MOVED++))

# ==================== 6. Shell测试脚本 ====================
echo "6️⃣  整理Shell测试脚本..."
mv ./test-account-operations.sh archive/test-files/shell/ 2>/dev/null && ((MOVED++))
mv ./test-admin-auth-system.sh archive/test-files/shell/ 2>/dev/null && ((MOVED++))
mv ./test-email-role-accounts.sh archive/test-files/shell/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire2-api.sh archive/test-files/shell/ 2>/dev/null && ((MOVED++))
mv ./test-questionnaire2-flow.sh archive/test-files/shell/ 2>/dev/null && ((MOVED++))
mv ./test-reviewer-api.sh archive/test-files/shell/ 2>/dev/null && ((MOVED++))
mv ./test-super-admin-auth.sh archive/test-files/shell/ 2>/dev/null && ((MOVED++))

echo ""
echo "=========================================="
echo "整理完成统计"
echo "=========================================="
echo ""
echo "✅ 已移动文件: $MOVED 个"
echo ""

# 统计剩余文件
REMAINING=$(find . -maxdepth 1 -name "test*" -type f | wc -l | tr -d ' ')
echo "📄 根目录剩余test文件: $REMAINING 个"

if [ $REMAINING -gt 0 ]; then
  echo ""
  echo "剩余文件列表:"
  find . -maxdepth 1 -name "test*" -type f | sort
fi

echo ""
echo "=========================================="
echo "文件夹结构:"
echo "=========================================="
echo ""

echo "archive/test-files/"
echo "├── html/                    (HTML测试页面)"
HTML_COUNT=$(find archive/test-files/html/ -name "*.html" 2>/dev/null | wc -l | tr -d ' ')
echo "│   └── $HTML_COUNT 个文件"
echo "├── scripts/"
echo "│   ├── api/                 (API测试)"
API_COUNT=$(find archive/test-files/scripts/api/ -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
echo "│   │   └── $API_COUNT 个文件"
echo "│   ├── questionnaire/       (问卷测试)"
QUEST_COUNT=$(find archive/test-files/scripts/questionnaire/ -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
echo "│   │   └── $QUEST_COUNT 个文件"
echo "│   ├── data/                (数据测试)"
DATA_COUNT=$(find archive/test-files/scripts/data/ -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
echo "│   │   └── $DATA_COUNT 个文件"
echo "│   └── other/               (其他测试)"
OTHER_COUNT=$(find archive/test-files/scripts/other/ -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
echo "│       └── $OTHER_COUNT 个文件"
echo "└── shell/                   (Shell测试脚本)"
SHELL_COUNT=$(find archive/test-files/shell/ -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')
echo "    └── $SHELL_COUNT 个文件"

echo ""
echo "=========================================="
echo "分类详情"
echo "=========================================="
echo ""

echo "HTML测试页面 ($HTML_COUNT 个):"
find archive/test-files/html/ -name "*.html" 2>/dev/null | sort | sed 's/^/  - /'
echo ""

echo "API测试脚本 ($API_COUNT 个):"
find archive/test-files/scripts/api/ -name "*.js" 2>/dev/null | sort | sed 's/^/  - /'
echo ""

echo "问卷测试脚本 ($QUEST_COUNT 个):"
find archive/test-files/scripts/questionnaire/ -name "*.js" 2>/dev/null | sort | sed 's/^/  - /'
echo ""

echo "数据测试脚本 ($DATA_COUNT 个):"
find archive/test-files/scripts/data/ -name "*.js" 2>/dev/null | sort | sed 's/^/  - /'
echo ""

echo "其他测试脚本 ($OTHER_COUNT 个):"
find archive/test-files/scripts/other/ -name "*.js" 2>/dev/null | sort | sed 's/^/  - /'
echo ""

echo "Shell测试脚本 ($SHELL_COUNT 个):"
find archive/test-files/shell/ -name "*.sh" 2>/dev/null | sort | sed 's/^/  - /'
echo ""

echo "=========================================="
echo "✅ 整理完成！"
echo "=========================================="
echo ""
echo "所有测试文件已归档到 archive/test-files/ 目录"
echo "根目录已清理，项目结构更加清晰"
echo ""

