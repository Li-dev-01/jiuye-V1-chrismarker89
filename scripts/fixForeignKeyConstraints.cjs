#!/usr/bin/env node

/**
 * 外键约束修复脚本
 * 解决当前数据库中的类型不匹配和约束问题
 */

const fs = require('fs');
const path = require('path');

// 生成修复SQL脚本
function generateFixSQL() {
  const fixSQL = `
-- 🔧 外键约束修复脚本
-- 解决类型不匹配和约束问题

-- 1. 检查当前外键约束状态
PRAGMA foreign_key_list(analytics_responses);
PRAGMA foreign_key_list(universal_questionnaire_responses);

-- 2. 暂时禁用外键约束（仅在修复期间）
PRAGMA foreign_keys = OFF;

-- 3. 创建临时表来重建analytics_responses（如果需要修改结构）
-- 注意：SQLite不支持直接修改外键，需要重建表

-- 4. 数据完整性检查
-- 检查analytics_responses中的孤儿记录
SELECT 
  'analytics_responses orphans' as table_name,
  COUNT(*) as orphan_count
FROM analytics_responses ar
LEFT JOIN users u ON ar.user_id = u.id
WHERE u.id IS NULL;

-- 检查universal_questionnaire_responses中的孤儿记录
SELECT 
  'universal_questionnaire_responses orphans' as table_name,
  COUNT(*) as orphan_count
FROM universal_questionnaire_responses uqr
LEFT JOIN users u ON uqr.user_id = u.id
WHERE uqr.user_id IS NOT NULL AND u.id IS NULL;

-- 5. 清理孤儿数据（如果存在）
-- 删除analytics_responses中的孤儿记录
DELETE FROM analytics_responses 
WHERE user_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL);

-- 6. 重新启用外键约束
PRAGMA foreign_keys = ON;

-- 7. 验证修复结果
-- 再次检查孤儿记录
SELECT 
  'analytics_responses orphans after fix' as table_name,
  COUNT(*) as orphan_count
FROM analytics_responses ar
LEFT JOIN users u ON ar.user_id = u.id
WHERE u.id IS NULL;

-- 8. 测试外键约束是否正常工作
-- 尝试插入一条无效的外键记录（应该失败）
-- INSERT INTO analytics_responses (id, user_id, is_test_data) 
-- VALUES ('test-constraint', 'non-existent-user', 1);
`;

  return fixSQL;
}

// 生成数据完整性检查脚本
function generateIntegrityCheckSQL() {
  const checkSQL = `
-- 📊 数据完整性检查脚本

-- 1. 检查所有表的记录数
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'universal_questionnaire_responses', COUNT(*) FROM universal_questionnaire_responses
UNION ALL
SELECT 'analytics_responses', COUNT(*) FROM analytics_responses;

-- 2. 检查外键完整性
-- analytics_responses -> users
SELECT 
  'analytics_responses -> users' as relationship,
  COUNT(*) as total_records,
  COUNT(u.id) as valid_references,
  COUNT(*) - COUNT(u.id) as orphan_records
FROM analytics_responses ar
LEFT JOIN users u ON ar.user_id = u.id;

-- universal_questionnaire_responses -> users (允许NULL)
SELECT 
  'universal_questionnaire_responses -> users' as relationship,
  COUNT(*) as total_records,
  COUNT(uqr.user_id) as non_null_user_ids,
  COUNT(u.id) as valid_references,
  COUNT(uqr.user_id) - COUNT(u.id) as orphan_records
FROM universal_questionnaire_responses uqr
LEFT JOIN users u ON uqr.user_id = u.id;

-- 3. 检查数据类型一致性
PRAGMA table_info(users);
PRAGMA table_info(analytics_responses);
PRAGMA table_info(universal_questionnaire_responses);

-- 4. 检查外键约束定义
PRAGMA foreign_key_list(analytics_responses);
PRAGMA foreign_key_list(universal_questionnaire_responses);

-- 5. 检查测试数据标识
SELECT 
  'Test data in analytics_responses' as description,
  COUNT(*) as count
FROM analytics_responses 
WHERE is_test_data = 1;

SELECT 
  'Test data in universal_questionnaire_responses' as description,
  COUNT(*) as count
FROM universal_questionnaire_responses 
WHERE response_data LIKE '%test_user_identifier%';
`;

  return checkSQL;
}

// 生成清理脚本
function generateCleanupSQL() {
  const cleanupSQL = `
-- 🧹 数据清理脚本

-- 1. 清理所有测试数据
DELETE FROM analytics_responses WHERE is_test_data = 1;
DELETE FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'employment-survey-2024' 
  AND (user_id IS NULL OR response_data LIKE '%test_user_identifier%');
DELETE FROM users WHERE id LIKE 'test-%';

-- 2. 重置自增ID（如果需要）
-- SQLite不支持重置自增，但可以清理后重新开始

-- 3. 验证清理结果
SELECT 'users after cleanup' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'universal_questionnaire_responses after cleanup', COUNT(*) FROM universal_questionnaire_responses
UNION ALL
SELECT 'analytics_responses after cleanup', COUNT(*) FROM analytics_responses;
`;

  return cleanupSQL;
}

// 生成标准化的测试数据
function generateStandardizedTestData() {
  const testDataSQL = `
-- 📝 标准化测试数据
-- 严格按照外键约束顺序插入

-- 1. 插入用户数据（主表）
INSERT OR IGNORE INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES
  ('std-user-001', 'stduser001', 'std001@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-002', 'stduser002', 'std002@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-003', 'stduser003', 'std003@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-004', 'stduser004', 'std004@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-005', 'stduser005', 'std005@example.com', 'hash123', 'user', datetime('now'), datetime('now'));

-- 2. 插入问卷数据（依赖用户表）
INSERT OR IGNORE INTO universal_questionnaire_responses 
(questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent, created_at, updated_at) VALUES
  ('employment-survey-2024', 'std-user-001', '{"age_range":"23-25","gender":"male","education_level":"bachelor","employment_status":"employed","work_location":"beijing","salary_range":"12000-18000","industry":"technology","test_user_identifier":"std-user-001"}', datetime('now'), '192.168.1.1', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-002', '{"age_range":"26-30","gender":"female","education_level":"master","employment_status":"employed","work_location":"shanghai","salary_range":"18000-25000","industry":"finance","test_user_identifier":"std-user-002"}', datetime('now'), '192.168.1.2', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-003', '{"age_range":"18-22","gender":"male","education_level":"bachelor","employment_status":"student","work_location":"guangzhou","salary_range":"","industry":"","test_user_identifier":"std-user-003"}', datetime('now'), '192.168.1.3', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-004', '{"age_range":"23-25","gender":"female","education_level":"bachelor","employment_status":"unemployed","work_location":"shenzhen","salary_range":"","industry":"","test_user_identifier":"std-user-004"}', datetime('now'), '192.168.1.4', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-005', '{"age_range":"26-30","gender":"male","education_level":"master","employment_status":"employed","work_location":"hangzhou","salary_range":"25000-35000","industry":"technology","test_user_identifier":"std-user-005"}', datetime('now'), '192.168.1.5', 'Test Browser', datetime('now'), datetime('now'));

-- 3. 插入分析数据（依赖用户表，外键约束）
INSERT OR IGNORE INTO analytics_responses 
(id, user_id, submitted_at, age_range, education_level, employment_status, salary_range, work_location, industry, gender, job_search_channels, difficulties, skills, policy_suggestions, salary_expectation, work_experience_months, job_search_duration_months, data_quality_score, is_complete, processing_version, is_test_data, created_at, updated_at) VALUES
  ('std-analytics-001', 'std-user-001', datetime('now'), '23-25', 'bachelor', 'employed', '12000-18000', 'beijing', 'technology', 'male', 'online_platforms', 'lack_experience', 'programming', 'more_internships', 15000, 24, 3, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-002', 'std-user-002', datetime('now'), '26-30', 'master', 'employed', '18000-25000', 'shanghai', 'finance', 'female', 'referrals', 'high_competition', 'communication', 'skill_training', 22000, 36, 2, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-003', 'std-user-003', datetime('now'), '18-22', 'bachelor', 'student', NULL, 'guangzhou', NULL, 'male', 'campus_recruitment', 'lack_experience', 'programming', 'more_internships', 8000, 0, 0, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-004', 'std-user-004', datetime('now'), '23-25', 'bachelor', 'unemployed', NULL, 'shenzhen', NULL, 'female', 'online_platforms', 'skill_mismatch', 'communication', 'skill_training', 10000, 12, 8, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-005', 'std-user-005', datetime('now'), '26-30', 'master', 'employed', '25000-35000', 'hangzhou', 'technology', 'male', 'direct_application', 'location_constraints', 'project_management', 'career_guidance', 30000, 48, 1, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now'));

-- 4. 验证插入结果
SELECT 'Standardized test data inserted' as status;
SELECT 'users' as table_name, COUNT(*) as count FROM users WHERE id LIKE 'std-%'
UNION ALL
SELECT 'questionnaires', COUNT(*) FROM universal_questionnaire_responses WHERE response_data LIKE '%std-user-%'
UNION ALL
SELECT 'analytics', COUNT(*) FROM analytics_responses WHERE user_id LIKE 'std-%';
`;

  return testDataSQL;
}

// 主函数
function generateFixScripts() {
  console.log('🔧 生成外键约束修复脚本...');
  
  const outputDir = path.join(__dirname, '../database-fixes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 生成各种修复脚本
  fs.writeFileSync(path.join(outputDir, '01-fix-foreign-keys.sql'), generateFixSQL());
  fs.writeFileSync(path.join(outputDir, '02-check-integrity.sql'), generateIntegrityCheckSQL());
  fs.writeFileSync(path.join(outputDir, '03-cleanup-data.sql'), generateCleanupSQL());
  fs.writeFileSync(path.join(outputDir, '04-standardized-test-data.sql'), generateStandardizedTestData());
  
  // 生成执行脚本
  const executeScript = `#!/bin/bash
# 外键约束修复执行脚本

DATABASE_NAME=\${1:-"college-employment-survey"}
SCRIPT_DIR="database-fixes"

echo "🔧 开始修复外键约束问题..."

echo "1. 检查数据完整性..."
wrangler d1 execute "\$DATABASE_NAME" --remote --file="\$SCRIPT_DIR/02-check-integrity.sql"

echo "2. 修复外键约束..."
wrangler d1 execute "\$DATABASE_NAME" --remote --file="\$SCRIPT_DIR/01-fix-foreign-keys.sql"

echo "3. 清理旧测试数据..."
wrangler d1 execute "\$DATABASE_NAME" --remote --file="\$SCRIPT_DIR/03-cleanup-data.sql"

echo "4. 插入标准化测试数据..."
wrangler d1 execute "\$DATABASE_NAME" --remote --file="\$SCRIPT_DIR/04-standardized-test-data.sql"

echo "5. 最终完整性检查..."
wrangler d1 execute "\$DATABASE_NAME" --remote --file="\$SCRIPT_DIR/02-check-integrity.sql"

echo "✅ 外键约束修复完成！"
`;
  
  fs.writeFileSync(path.join(outputDir, 'execute-fix.sh'), executeScript);
  fs.chmodSync(path.join(outputDir, 'execute-fix.sh'), '755');
  
  console.log(`✅ 修复脚本生成完成！`);
  console.log(`   - 输出目录: ${outputDir}`);
  console.log(`   - 执行命令: bash ${path.relative(process.cwd(), path.join(outputDir, 'execute-fix.sh'))}`);
  
  return outputDir;
}

// 如果直接运行此脚本
if (require.main === module) {
  generateFixScripts();
}

module.exports = { generateFixScripts };
