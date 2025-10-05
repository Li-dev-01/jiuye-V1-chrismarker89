/**
 * 运行测试数据生成脚本
 * 用于本地生成测试数据并输出JSON文件
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateCompleteTestDataset, convertToDBFormat } from './generateQuestionnaire2TestData';

async function main() {
  console.log('🚀 开始生成问卷2测试数据...\n');

  try {
    // 生成数据
    const { data, summary } = generateCompleteTestDataset();

    console.log('📊 生成摘要：');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\n✅ 总计生成 ${summary.total} 条测试数据\n`);

    // 转换为数据库格式
    const dbData = convertToDBFormat(data);

    // 输出JSON文件
    const outputDir = path.join(__dirname, '../../generated-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const jsonPath = path.join(outputDir, 'questionnaire2_test_data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(dbData, null, 2));
    console.log(`📄 JSON数据已保存到: ${jsonPath}`);

    // 输出前3条示例
    console.log('\n📝 前3条数据示例：');
    console.log(JSON.stringify(dbData.slice(0, 3), null, 2));

    console.log('\n✅ 数据生成完成！');
    console.log(`\n💡 提示：您可以使用以下方式导入数据：`);
    console.log(`1. 通过API导入（推荐）`);
    console.log(`2. 手动导入JSON文件到数据库`);

  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

main();

