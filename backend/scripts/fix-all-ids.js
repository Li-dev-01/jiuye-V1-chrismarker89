#!/usr/bin/env node

/**
 * 修复所有ID为camelCase格式
 * 确保TypeScript编译通过
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, '../src/data/secondQuestionnaire2025-v2.ts');

// 转换为camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

function fixAllIds() {
  console.log('🔧 开始修复所有ID为camelCase格式...');
  
  // 读取文件内容
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // 定义ID映射
  const idMappings = {
    'employment_survey_2024': 'employmentSurvey2024',
    'participant_classification': 'participantClassification',
    'participant_group': 'participantGroup',
    'education_level': 'educationLevel',
    'unemployment_duration': 'unemploymentDuration',
    'fresh_graduate_details': 'freshGraduateDetails',
    'graduation_timeline': 'graduationTimeline',
    'job_search_preparation': 'jobSearchPreparation',
    'employment_expectations': 'employmentExpectations',
    'junior_professional_details': 'juniorProfessionalDetails',
    'work_experience_years': 'workExperienceYears',
    'career_transition_challenges': 'careerTransitionChallenges',
    'senior_professional_details': 'seniorProfessionalDetails',
    'career_level': 'careerLevel',
    'psychological_support_analysis': 'psychologicalSupportAnalysis',
    'common_demographics': 'commonDemographics',
    'age_range': 'ageRange',
    'user_experience_feedback': 'userExperienceFeedback',
    'employment_survey_2024_v2': 'employmentSurvey2024V2'
  };
  
  let changeCount = 0;
  
  // 替换所有ID引用
  Object.entries(idMappings).forEach(([oldId, newId]) => {
    // 替换id字段
    const idPattern = new RegExp(`id:\\s*'${oldId}'`, 'g');
    const idMatches = content.match(idPattern);
    if (idMatches) {
      content = content.replace(idPattern, `id: '${newId}'`);
      changeCount += idMatches.length;
      console.log(`✅ 替换ID: ${oldId} -> ${newId} (${idMatches.length}次)`);
    }
    
    // 替换dependsOn字段
    const dependsPattern = new RegExp(`dependsOn:\\s*'${oldId}'`, 'g');
    const dependsMatches = content.match(dependsPattern);
    if (dependsMatches) {
      content = content.replace(dependsPattern, `dependsOn: '${newId}'`);
      changeCount += dependsMatches.length;
      console.log(`✅ 替换dependsOn: ${oldId} -> ${newId} (${dependsMatches.length}次)`);
    }
    
    // 替换其他引用
    const refPattern = new RegExp(`'${oldId}'`, 'g');
    const refMatches = content.match(refPattern);
    if (refMatches) {
      content = content.replace(refPattern, `'${newId}'`);
      changeCount += refMatches.length;
      console.log(`✅ 替换引用: ${oldId} -> ${newId} (${refMatches.length}次)`);
    }
  });
  
  // 写回文件
  fs.writeFileSync(targetFile, content);
  
  console.log(`🎉 修复完成！总共替换了 ${changeCount} 个ID引用`);
  console.log(`📁 文件已更新: ${targetFile}`);
}

// 执行修复
try {
  fixAllIds();
} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
