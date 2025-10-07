#!/bin/bash

# Markdown文件整理脚本
# 将根目录下的162个MD文件按类别整理到不同文件夹

echo "=========================================="
echo "开始整理Markdown文件"
echo "=========================================="
echo ""

# 创建目标文件夹结构
echo "📁 创建文件夹结构..."

mkdir -p archive/reports/{questionnaire,fixes,deployment,analysis,completion}
mkdir -p archive/features/{ai,mobile,account,super-admin,cloudflare}
mkdir -p archive/guides/{quick-start,development,testing}
mkdir -p archive/summaries
mkdir -p archive/dev-docs

echo "✅ 文件夹结构创建完成"
echo ""

# 移动文件计数器
MOVED=0

echo "📦 开始移动文件..."
echo ""

# ==================== 1. 问卷相关报告 ====================
echo "1️⃣  整理问卷相关文档..."
mv ./可视化方案对比执行摘要.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷视觉体验优化报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷页面优化对比.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷页面样式优化报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷页面错误修复报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷1与问卷2可视化方案对比报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷1和问卷2页面合并完成报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-完整技术文档-数据可视化系统.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-删除开放题修复报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-快速验证指南.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-总体执行摘要.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-最终工作总结.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-生活成本与经济压力维度补充方案.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-逻辑问题修复完成报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-逻辑问题分析与修复方案.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-部署与测试数据生成完成报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-部署完成报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-全部任务完成报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-本地验证报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-社会洞察数据分类与可视化评估报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-部署成功报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-阶段1完成报告-数据基础建设.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-阶段2完成报告-数据填充成功.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-阶段2进度报告-数据填充遇到的挑战.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-阶段2-3-4总结报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-阶段3中期报告-第一个维度完成.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-阶段3完成报告-七维度可视化系统.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2-阶段3进度报告-前端可视化初步完成.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-PR1-定义变更摘要.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-PR2-可视化映射扩展摘要.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2优化-PR3-端到端验收清单.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2可视化系统评估报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2完整验证报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2生产环境验证报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2访问问题修复报告.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2集成项目完整实施总结.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./问卷2集成问卷1可视化系统实施方案.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./questionnaire-combinations-analysis.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./questionnaire-critical-issues-analysis.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./questionnaire-enhancement-report.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./questionnaire-independence-analysis.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./questionnaire-logic-analysis.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./questionnaire-platform-roadmap.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))
mv ./questionnaire2-visualization-analysis.md archive/reports/questionnaire/ 2>/dev/null && ((MOVED++))

# ==================== 2. 修复报告 ====================
echo "2️⃣  整理修复报告..."
mv ./数据分析页面修复完成报告.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./数据分析页面问题全面分析报告.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./数据分析页面API错误修复报告.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./错误修复总结报告.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./问题修复总结报告.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_CREATION_FIX_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_MANAGEMENT_DELETE_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_MANAGEMENT_FIX_PHASE1_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./ADMIN_LOGIN_FIX_SUMMARY.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./ADMIN_REPUTATION_MANAGEMENT_FIX_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./AI_MODERATION_PAGE_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./API_DOCUMENTATION_PAGE_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./DATABASE_SCHEMA_PAGE_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./FIX_SUMMARY_2025-10-06.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./GOOGLE_OAUTH_API_COMPATIBILITY_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./HOTFIX_2FA_API_404_FINAL.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./HOTFIX_2FA_BUTTONS.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./MOBILE_CRITICAL_FIXES_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./MOBILE_ISSUES_FIX_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./PROBLEM-FIXES-SUMMARY.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./REPUTATION_MANAGEMENT_FIX_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./SUPER_ADMIN_API_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./SUPER_ADMIN_LOGIN_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./SUPER_ADMIN_REDIRECT_COMPLETE_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./TAG_MANAGEMENT_PAGE_FIX.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./USER_PROFILE_FIX_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./VISUALIZATION_FIX_REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./DATA-CONSISTENCY-ISSUE-RESOLUTION-REPORT.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))
mv ./test-fixes.md archive/reports/fixes/ 2>/dev/null && ((MOVED++))

# ==================== 3. 部署报告 ====================
echo "3️⃣  整理部署报告..."
mv ./生产环境部署测试报告.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./ADMIN_FRONTEND_DEPLOYMENT_2025-09-30.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./ADMIN-AUTH-SYSTEM-DEPLOYMENT.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_MONITORING_DEPLOYMENT.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./Cloudflare部署配置分析报告.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./DEPLOYMENT_SUCCESS_2025-09-30.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./DEPLOYMENT_SUMMARY.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./DEPLOYMENT-CHECKLIST.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./DEPLOYMENT-SUCCESS-REPORT.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./MOBILE_OPTIMIZATION_DEPLOYMENT_SUCCESS.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./PRODUCTION-DEPLOYMENT-SUCCESS.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))
mv ./Test分支部署准备完成报告.md archive/reports/deployment/ 2>/dev/null && ((MOVED++))

# ==================== 4. 分析报告 ====================
echo "4️⃣  整理分析报告..."
mv ./ARCHITECTURE_AND_FIXES_REPORT.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./AUTHENTICATION_SYSTEM_COMPLETE_ANALYSIS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./COMPLETE_SYSTEM_ANALYSIS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./employment-survey-api-test后端分析报告.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./删除employment-survey-api-test影响评估与迁移方案.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./GOOGLE_OAUTH_ACCOUNT_MANAGEMENT_DEFECTS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./GOOGLE-OAUTH-INTEGRATION-ANALYSIS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./MOBILE_DESKTOP_FILE_RELATIONSHIP_REPORT.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./SUPER_ADMIN_AUTH_SYSTEM_ANALYSIS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./SUPER_ADMIN_LOGIN_PROBLEM_DEEP_ANALYSIS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./SUPER_ADMIN_PERMISSION_ANALYSIS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./SUPER_ADMIN_PROBLEM_COMPLETE_ANALYSIS.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))
mv ./USER_PROFILE_SYSTEM_ASSESSMENT.md archive/reports/analysis/ 2>/dev/null && ((MOVED++))

# ==================== 5. 完成报告 ====================
echo "5️⃣  整理完成报告..."
mv ./阶段4完成总结报告.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_MANAGEMENT_ACCEPTANCE_TEST.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_MANAGEMENT_FINAL_SUMMARY.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_MANAGEMENT_PHASE2_COMPLETE_REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_MANAGEMENT_PHASE3_COMPLETE_REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_MANAGEMENT_PHASE4_COMPLETE_REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./ACCOUNT_OPERATIONS_COMPLETE.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./AI_GATEWAY_INTEGRATION_COMPLETE.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./AI_GATEWAY_OPTIMIZATION_COMPLETE.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./AI-CONTENT-MODERATION-COMPLETE-INTEGRATION-REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./AI-GATEWAY-CONFIGURATION-COMPLETE-GUIDE.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./BACKUP_SUCCESS.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_ANALYTICS_INTEGRATION_SUCCESS.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_STANDARDS_COMPLETION_REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_STANDARDS_ENHANCEMENT_REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./CONTENT_REVIEW_SYSTEM_IMPLEMENTATION.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./EMAIL-ROLE-ACCOUNT-SYSTEM-COMPLETE.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./GITHUB_BACKUP_SUCCESS_2025-09-30.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./GOOGLE-OAUTH-INTEGRATION-COMPLETE.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./MOBILE_FINAL_OPTIMIZATION_REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./PROJECT-STATISTICS-SOLUTION-COMPLETE-REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./REAL-API-DATA-INTEGRATION-COMPLETE-REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./REAL-DATA-MIGRATION-REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))
mv ./UNIFIED-STATISTICS-SYSTEM-REPORT.md archive/reports/completion/ 2>/dev/null && ((MOVED++))

# ==================== 6. AI功能 ====================
echo "6️⃣  整理AI功能文档..."
mv ./AI-CONTENT-MODERATION-INTEGRATION-PLAN.md archive/features/ai/ 2>/dev/null && ((MOVED++))
mv ./AI-MODEL-STRATEGY-OPTIMIZATION-REPORT.md archive/features/ai/ 2>/dev/null && ((MOVED++))
mv ./AI_GATEWAY_QUICK_REFERENCE.md archive/features/ai/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_AI_GATEWAY_STATUS_REPORT.md archive/features/ai/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE-AI-GATEWAY-SETUP-GUIDE.md archive/features/ai/ 2>/dev/null && ((MOVED++))

# ==================== 7. 移动端 ====================
echo "7️⃣  整理移动端文档..."
mv ./MOBILE_OPTIMIZATION_GUIDE.md archive/features/mobile/ 2>/dev/null && ((MOVED++))
mv ./MOBILE_TESTING_GUIDE.md archive/features/mobile/ 2>/dev/null && ((MOVED++))

# ==================== 8. 账户管理 ====================
echo "8️⃣  整理账户管理文档..."
mv ./GOOGLE_OAUTH_REDIRECT_URIS.md archive/features/account/ 2>/dev/null && ((MOVED++))
mv ./QUICK-ACCESS-EMAIL-ROLE-ACCOUNTS.md archive/features/account/ 2>/dev/null && ((MOVED++))

# ==================== 9. 超级管理员 ====================
echo "9️⃣  整理超级管理员文档..."
mv ./SUPER_ADMIN_DEBUG_GUIDE.md archive/features/super-admin/ 2>/dev/null && ((MOVED++))

# ==================== 10. Cloudflare ====================
echo "🔟 整理Cloudflare文档..."
mv ./CLOUDFLARE_DEVELOPMENT_STANDARDS_SUMMARY.md archive/features/cloudflare/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_DEVELOPMENT_STANDARDS.md archive/features/cloudflare/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_QUICK_REFERENCE.md archive/features/cloudflare/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_STANDARDS_OVERVIEW.md archive/features/cloudflare/ 2>/dev/null && ((MOVED++))
mv ./CLOUDFLARE_STANDARDS_USAGE_GUIDE.md archive/features/cloudflare/ 2>/dev/null && ((MOVED++))

# ==================== 11. 快速开始指南 ====================
echo "1️⃣1️⃣  整理快速开始指南..."
mv ./QUICK_START.md archive/guides/quick-start/ 2>/dev/null && ((MOVED++))
mv ./QUICK-ACCESS.md archive/guides/quick-start/ 2>/dev/null && ((MOVED++))
mv ./QUICK-START-GOOGLE-OAUTH.md archive/guides/quick-start/ 2>/dev/null && ((MOVED++))

# ==================== 12. 开发指南 ====================
echo "1️⃣2️⃣  整理开发指南..."
mv ./开发命名规范文档.md archive/guides/development/ 2>/dev/null && ((MOVED++))
mv ./实施任务分解与执行指南.md archive/guides/development/ 2>/dev/null && ((MOVED++))
mv ./PACKAGE_USAGE_GUIDE.md archive/guides/development/ 2>/dev/null && ((MOVED++))
mv ./USER_PROFILE_IMPLEMENTATION_PLAN_V2.md archive/guides/development/ 2>/dev/null && ((MOVED++))
mv ./PROJECT-STATISTICS-TABLE-SOLUTION.md archive/guides/development/ 2>/dev/null && ((MOVED++))
mv ./AI-CONTENT-MODERATION-INTEGRATION-PLAN.md archive/guides/development/ 2>/dev/null && ((MOVED++))

# ==================== 13. 测试指南 ====================
echo "1️⃣3️⃣  整理测试指南..."
mv ./VISUALIZATION_TEST_CHECKLIST.md archive/guides/testing/ 2>/dev/null && ((MOVED++))
mv ./test-navigation.md archive/guides/testing/ 2>/dev/null && ((MOVED++))
mv ./TEST_DATA_CLEANUP_REPORT.md archive/guides/testing/ 2>/dev/null && ((MOVED++))

# ==================== 14. 总结报告 ====================
echo "1️⃣4️⃣  整理总结报告..."
mv ./FINAL-SUMMARY.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./UPDATE_SUMMARY.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./WORK_SUMMARY_2025-09-30.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./PROJECT_TECHNICAL_ARCHIVE_SUMMARY.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./PROJECT-BACKUP-SUMMARY-v2.0.0.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./RELEASE_NOTES_v2.0.0.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./REVIEWER-SYSTEM-STATUS-REPORT.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./STORY_REVIEW_SYSTEM_SUMMARY.md archive/summaries/ 2>/dev/null && ((MOVED++))
mv ./USER_REPORT_SYSTEM_SUMMARY.md archive/summaries/ 2>/dev/null && ((MOVED++))

# ==================== 15. 开发文档 ====================
echo "1️⃣5️⃣  整理开发文档..."
mv ./PROJECT_CLEANUP_PLAN.md archive/dev-docs/ 2>/dev/null && ((MOVED++))
mv ./RIPER-5-AI-for-Augment.md archive/dev-docs/ 2>/dev/null && ((MOVED++))
mv ./STORY_MANAGEMENT_FEATURE.md archive/dev-docs/ 2>/dev/null && ((MOVED++))
mv ./STORY_PUBLISH_MIGRATION.md archive/dev-docs/ 2>/dev/null && ((MOVED++))

echo ""
echo "=========================================="
echo "整理完成统计"
echo "=========================================="
echo ""
echo "✅ 已移动文件: $MOVED 个"
echo ""

# 统计剩余文件
REMAINING=$(find . -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')
echo "📄 根目录剩余MD文件: $REMAINING 个"

if [ $REMAINING -gt 1 ]; then
  echo ""
  echo "剩余文件列表:"
  find . -maxdepth 1 -name "*.md" -type f | sort
fi

echo ""
echo "=========================================="
echo "文件夹结构:"
echo "=========================================="
tree -L 3 archive/ 2>/dev/null || find archive/ -type d | sort

echo ""
echo "✅ 整理完成！"

