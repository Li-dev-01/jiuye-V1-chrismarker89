#!/usr/bin/env node

/**
 * 修复连字符ID问题
 * 将所有包含连字符的ID替换为下划线
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, '../src/data/secondQuestionnaire2024.ts');

function fixHyphenIds() {
  console.log('🔧 开始修复连字符ID问题...');
  
  // 读取文件内容
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // 定义需要替换的模式
  const replacements = [
    // ID字段
    { from: /id:\s*'([^']*)-([^']*)'/g, to: "id: '$1_$2'" },
    { from: /id:\s*'([^']*)-([^']*)-([^']*)'/g, to: "id: '$1_$2_$3'" },
    { from: /id:\s*'([^']*)-([^']*)-([^']*)-([^']*)'/g, to: "id: '$1_$2_$3_$4'" },
    
    // dependsOn字段
    { from: /dependsOn:\s*'([^']*)-([^']*)'/g, to: "dependsOn: '$1_$2'" },
    { from: /dependsOn:\s*'([^']*)-([^']*)-([^']*)'/g, to: "dependsOn: '$1_$2_$3'" },
    
    // 其他引用
    { from: /'participant-group'/g, to: "'participant_group'" },
    { from: /'education-level'/g, to: "'education_level'" },
    { from: /'unemployment-duration'/g, to: "'unemployment_duration'" },
    { from: /'graduation-timeline'/g, to: "'graduation_timeline'" },
    { from: /'job-search-preparation'/g, to: "'job_search_preparation'" },
    { from: /'employment-expectations'/g, to: "'employment_expectations'" },
    { from: /'junior-professional-details'/g, to: "'junior_professional_details'" },
    { from: /'work-experience-years'/g, to: "'work_experience_years'" },
    { from: /'career-transition-challenges'/g, to: "'career_transition_challenges'" },
    { from: /'senior-professional-details'/g, to: "'senior_professional_details'" },
    { from: /'career-level'/g, to: "'career_level'" },
    { from: /'psychological-support-analysis'/g, to: "'psychological_support_analysis'" },
    { from: /'common-demographics'/g, to: "'common_demographics'" },
    { from: /'age-range'/g, to: "'age_range'" },
    { from: /'user-experience-feedback'/g, to: "'user_experience_feedback'" },
    { from: /'employment-survey-2024'/g, to: "'employment_survey_2024'" },
    { from: /'employment-survey-2024-v2'/g, to: "'employment_survey_2024_v2'" }
  ];
  
  let changeCount = 0;
  
  // 应用所有替换
  replacements.forEach(replacement => {
    const before = content;
    content = content.replace(replacement.from, replacement.to);
    if (content !== before) {
      const matches = before.match(replacement.from);
      if (matches) {
        changeCount += matches.length;
        console.log(`✅ 替换了 ${matches.length} 个匹配项: ${replacement.from}`);
      }
    }
  });
  
  // 写回文件
  fs.writeFileSync(targetFile, content);
  
  console.log(`🎉 修复完成！总共替换了 ${changeCount} 个连字符ID`);
  console.log(`📁 文件已更新: ${targetFile}`);
}

// 执行修复
try {
  fixHyphenIds();
} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
