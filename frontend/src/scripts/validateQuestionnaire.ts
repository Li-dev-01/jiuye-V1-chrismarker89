/**
 * 问卷逻辑验证脚本
 * 用于验证问卷配置的逻辑一致性
 */

import { validateQuestionnaireLogic } from '../utils/questionnaireLogicValidator';
import { sampleUniversalQuestionnaire } from '../data/sampleUniversalQuestionnaire';

/**
 * 运行问卷验证
 */
function runValidation() {
  console.log('🔍 开始验证问卷逻辑一致性...\n');

  const result = validateQuestionnaireLogic(sampleUniversalQuestionnaire);

  console.log('📊 验证结果摘要:');
  console.log(`- 错误: ${result.summary.errors}`);
  console.log(`- 警告: ${result.summary.warnings}`);
  console.log(`- 信息: ${result.summary.info}`);
  console.log(`- 总体状态: ${result.isValid ? '✅ 通过' : '❌ 失败'}\n`);

  if (result.issues.length > 0) {
    console.log('📋 详细问题列表:\n');

    result.issues.forEach((issue, index) => {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${index + 1}. ${icon} [${issue.type.toUpperCase()}] ${issue.section}${issue.question ? ` > ${issue.question}` : ''}`);
      console.log(`   问题: ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   建议: ${issue.suggestion}`);
      }
      console.log('');
    });
  } else {
    console.log('🎉 恭喜！没有发现逻辑问题。');
  }

  return result;
}

// 如果直接运行此脚本
if (require.main === module) {
  runValidation();
}

export { runValidation };
