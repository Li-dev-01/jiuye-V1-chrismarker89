/**
 * 测试数据导入脚本
 * 将生成的1000条测试数据导入到Cloudflare D1数据库
 *
 * 注意：由于模块导入问题，此脚本仅生成SQL文件
 * 实际数据生成请使用API端点
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 生成SQL插入语句
 */
function generateBatchInsertSQL(data: any[], batchSize: number = 50): string[] {
  const sqlStatements: string[] = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const values = batch.map(row => {
      const sectionResponses = row.section_responses.replace(/'/g, "''");
      const metadata = row.metadata.replace(/'/g, "''");
      
      return `(
        '${row.questionnaire_id}',
        '${sectionResponses}',
        '${metadata}',
        '${row.submitted_at}',
        ${row.completion_time},
        '${row.user_agent}',
        '${row.version}',
        '${row.submission_type}',
        ${row.user_id ? `'${row.user_id}'` : 'NULL'},
        ${row.is_completed},
        '${row.ip_address}'
      )`;
    }).join(',\n');

    const sql = `
INSERT INTO universal_questionnaire_responses (
  questionnaire_id,
  section_responses,
  metadata,
  submitted_at,
  completion_time,
  user_agent,
  version,
  submission_type,
  user_id,
  is_completed,
  ip_address
) VALUES
${values};
`;

    sqlStatements.push(sql);
  }

  return sqlStatements;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始生成问卷2测试数据（1000条）...\n');

  try {
    // 生成数据
    const { data, summary } = generateCompleteTestDataset();

    console.log('📊 生成摘要：');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\n✅ 总计生成 ${summary.total} 条测试数据\n`);

    // 转换为数据库格式
    const dbData = convertToDBFormat(data);

    // 创建输出目录
    const outputDir = path.join(__dirname, '../../generated-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 输出JSON文件（用于API导入）
    const jsonPath = path.join(outputDir, 'questionnaire2_test_data_1000.json');
    fs.writeFileSync(jsonPath, JSON.stringify(dbData, null, 2));
    console.log(`📄 JSON数据已保存到: ${jsonPath}`);

    // 生成SQL文件（用于wrangler导入）
    const sqlStatements = generateBatchInsertSQL(dbData, 50);
    
    // 将SQL语句分成多个文件（每个文件最多10个批次，即500条记录）
    const maxBatchesPerFile = 10;
    for (let i = 0; i < sqlStatements.length; i += maxBatchesPerFile) {
      const fileBatches = sqlStatements.slice(i, i + maxBatchesPerFile);
      const fileIndex = Math.floor(i / maxBatchesPerFile) + 1;
      const sqlPath = path.join(outputDir, `import_test_data_part${fileIndex}.sql`);
      
      fs.writeFileSync(sqlPath, fileBatches.join('\n\n'));
      console.log(`📝 SQL文件 ${fileIndex} 已保存到: ${sqlPath}`);
    }

    // 生成导入指令文件
    const totalFiles = Math.ceil(sqlStatements.length / maxBatchesPerFile);
    const instructionsPath = path.join(outputDir, 'IMPORT_INSTRUCTIONS.md');
    const instructions = `
# 问卷2测试数据导入指南

## 数据概览

- **总数据量**: ${summary.total} 条
- **数据分布**:
${Object.entries(summary).filter(([key]) => key !== 'total').map(([role, count]) => `  - ${role}: ${count}条`).join('\n')}

## 导入方法

### 方法1: 使用Wrangler CLI（推荐）

执行以下命令导入数据（分${totalFiles}个文件）：

\`\`\`bash
cd backend/generated-data

# 导入第1部分
npx wrangler d1 execute college-employment-survey --remote --file=import_test_data_part1.sql

# 导入第2部分
npx wrangler d1 execute college-employment-survey --remote --file=import_test_data_part2.sql

${totalFiles > 2 ? `# 继续导入其他部分...\n${Array.from({length: totalFiles - 2}, (_, i) => `npx wrangler d1 execute college-employment-survey --remote --file=import_test_data_part${i + 3}.sql`).join('\n')}` : ''}
\`\`\`

### 方法2: 使用API导入

\`\`\`bash
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/data-generator/questionnaire2/import-from-json \\
  -H "Content-Type: application/json" \\
  -d @questionnaire2_test_data_1000.json
\`\`\`

## 验证导入

导入完成后，执行以下SQL验证：

\`\`\`sql
SELECT COUNT(*) as total_count 
FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'questionnaire-v2-2024';

SELECT 
  json_extract(metadata, '$.testDataRole') as role,
  COUNT(*) as count
FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'questionnaire-v2-2024'
  AND json_extract(metadata, '$.isTestData') = true
GROUP BY role;
\`\`\`

预期结果：
- 总数：${summary.total}条
- 各角色分布与上述数据分布一致

## 下一步

导入完成后，执行静态表同步：

\`\`\`bash
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/questionnaire-v2/sync-static-tables
\`\`\`
`;

    fs.writeFileSync(instructionsPath, instructions);
    console.log(`📋 导入指南已保存到: ${instructionsPath}`);

    console.log('\n✅ 数据生成完成！');
    console.log(`\n💡 下一步：请查看 ${instructionsPath} 了解如何导入数据`);

  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

main();

