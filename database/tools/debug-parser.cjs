#!/usr/bin/env node

const { execSync } = require('child_process');

function parseWranglerOutput(output) {
  console.log('=== 原始输出 ===');
  console.log(output);
  console.log('=== 解析过程 ===');
  
  const lines = output.split('\n');
  const dataLines = [];
  let inDataSection = false;
  let headerPassed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`Line ${i}: "${line}"`);
    
    // 检测表格开始
    if (line.includes('┌') && line.includes('─')) {
      console.log('  -> 表格开始');
      inDataSection = true;
      continue;
    }
    
    // 检测表头分隔线
    if (line.includes('├') && line.includes('─')) {
      console.log('  -> 表头分隔线');
      headerPassed = true;
      continue;
    }
    
    // 检测表格结束
    if (line.includes('└') && line.includes('─')) {
      console.log('  -> 表格结束');
      break;
    }
    
    // 解析数据行
    if (inDataSection && headerPassed && line.includes('│')) {
      const cells = line.split('│')
        .map(cell => cell.trim())
        .filter(cell => cell && !cell.includes('─'));
      
      console.log(`  -> 数据行: [${cells.join(', ')}]`);
      
      if (cells.length > 0) {
        dataLines.push(cells);
      }
    }
  }

  console.log('=== 解析结果 ===');
  console.log(dataLines);
  return dataLines;
}

// 测试
try {
  const command = `wrangler d1 execute college-employment-survey --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name LIMIT 5;"`;
  const result = execSync(command, { encoding: 'utf8' });
  parseWranglerOutput(result);
} catch (error) {
  console.error('执行失败:', error.message);
}
