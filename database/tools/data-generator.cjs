#!/usr/bin/env node

/**
 * 智能测试数据生成器
 * 基于Schema自动生成符合结构的测试数据
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DataGenerator {
  constructor() {
    this.schemaPath = path.join(__dirname, '..', 'schemas', 'production', 'schema.json');
    this.templatesDir = path.join(__dirname, '..', 'test-data', 'templates');
    this.outputDir = path.join(__dirname, '..', 'test-data', 'generated');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.templatesDir, this.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 加载Schema
   */
  loadSchema() {
    if (!fs.existsSync(this.schemaPath)) {
      throw new Error(`Schema文件不存在: ${this.schemaPath}`);
    }
    return JSON.parse(fs.readFileSync(this.schemaPath, 'utf8'));
  }

  /**
   * 加载数据模板
   */
  loadTemplate(tableName) {
    const templateFile = path.join(this.templatesDir, `${tableName}.json`);
    if (fs.existsSync(templateFile)) {
      return JSON.parse(fs.readFileSync(templateFile, 'utf8'));
    }
    return this.generateDefaultTemplate(tableName);
  }

  /**
   * 生成默认数据模板
   */
  generateDefaultTemplate(tableName) {
    const template = {
      tableName,
      dataDistributions: {},
      customGenerators: {},
      relationships: {},
      constraints: {}
    };

    // 根据表名推断数据类型
    if (tableName === 'users' || tableName.includes('user')) {
      template.dataDistributions = {
        role: {
          'user': 0.85,
          'reviewer': 0.10,
          'admin': 0.04,
          'super_admin': 0.01
        },
        age_range: {
          '18-22': 0.25,
          '23-25': 0.45,
          '26-30': 0.25,
          '31-35': 0.04,
          'over-35': 0.01
        },
        gender: {
          'male': 0.52,
          'female': 0.46,
          'prefer-not-say': 0.02
        }
      };
    }

    // 保存默认模板
    const templateFile = path.join(this.templatesDir, `${tableName}.json`);
    fs.writeFileSync(templateFile, JSON.stringify(template, null, 2));
    
    return template;
  }

  /**
   * 根据字段类型生成数据
   */
  generateFieldValue(column, template, index) {
    const { name, type, notnull, default_value, primary_key } = column;

    // 主键处理
    if (primary_key) {
      if (type.includes('TEXT')) {
        return `test_${template.tableName}_${String(index).padStart(6, '0')}`;
      } else {
        return index;
      }
    }

    // 检查是否有自定义生成器
    if (template.customGenerators[name]) {
      return this.executeCustomGenerator(template.customGenerators[name], index);
    }

    // 检查是否有数据分布
    if (template.dataDistributions[name]) {
      return this.weightedRandom(template.dataDistributions[name]);
    }

    // 根据字段名推断数据类型
    if (name.includes('email')) {
      return `test${index}@example.com`;
    }

    if (name.includes('phone')) {
      return `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
    }

    if (name.includes('password')) {
      return crypto.randomBytes(16).toString('hex');
    }

    if (name.includes('name') || name.includes('title')) {
      return `测试${template.tableName}${index}`;
    }

    if (name.includes('url') || name.includes('link')) {
      return `https://example.com/${template.tableName}/${index}`;
    }

    if (name.includes('created_at') || name.includes('updated_at') || name.includes('submitted_at')) {
      const baseTime = Date.now();
      const randomOffset = Math.random() * 30 * 24 * 60 * 60 * 1000; // 30天内随机
      return new Date(baseTime - randomOffset).toISOString();
    }

    if (name.includes('ip_address')) {
      return `192.168.1.${Math.floor(Math.random() * 255)}`;
    }

    if (name.includes('user_agent')) {
      return 'Test Browser/1.0';
    }

    // 根据SQLite类型生成默认值
    if (type.includes('TEXT')) {
      return `test_${name}_${index}`;
    }

    if (type.includes('INTEGER')) {
      if (name.includes('score') || name.includes('rating')) {
        return Math.floor(Math.random() * 100);
      }
      if (name.includes('count') || name.includes('number')) {
        return Math.floor(Math.random() * 1000);
      }
      if (name.includes('months')) {
        return Math.floor(Math.random() * 24);
      }
      return Math.floor(Math.random() * 10000);
    }

    if (type.includes('REAL')) {
      return Math.random() * 100;
    }

    // 默认值
    if (default_value && default_value !== 'null') {
      return default_value.replace(/'/g, '');
    }

    return null;
  }

  /**
   * 权重随机选择
   */
  weightedRandom(distribution) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [key, weight] of Object.entries(distribution)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return key;
      }
    }
    
    return Object.keys(distribution)[0];
  }

  /**
   * 执行自定义生成器
   */
  executeCustomGenerator(generator, index) {
    if (typeof generator === 'function') {
      return generator(index);
    }
    
    if (typeof generator === 'string') {
      // 简单的模板替换
      return generator.replace(/\{index\}/g, index);
    }
    
    return generator;
  }

  /**
   * 生成表数据
   */
  generateTableData(tableName, tableSchema, count = 100) {
    console.log(`📊 生成表数据: ${tableName} (${count}条)`);
    
    const template = this.loadTemplate(tableName);
    const records = [];

    for (let i = 1; i <= count; i++) {
      const record = {};
      
      for (const column of tableSchema.columns) {
        const value = this.generateFieldValue(column, template, i);
        record[column.name] = value;
      }
      
      records.push(record);
    }

    return records;
  }

  /**
   * 生成SQL插入语句
   */
  generateInsertSQL(tableName, records) {
    if (records.length === 0) return '';

    const columns = Object.keys(records[0]);
    let sql = '';

    for (const record of records) {
      const values = columns.map(col => {
        const value = record[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
        }
        return value;
      }).join(', ');

      sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
    }

    return sql;
  }

  /**
   * 生成完整的测试数据
   */
  async generateTestData(options = {}) {
    const { recordCount = 100, tables = null } = options;
    
    console.log('🚀 开始生成测试数据...');
    
    const schema = this.loadSchema();
    const generatedData = {};
    const sqlFiles = {};

    // 确定要生成数据的表
    const targetTables = tables || Object.keys(schema.tables);

    // 按依赖顺序排序表（简单实现）
    const sortedTables = this.sortTablesByDependency(targetTables, schema.tables);

    for (const tableName of sortedTables) {
      const tableSchema = schema.tables[tableName];
      const records = this.generateTableData(tableName, tableSchema, recordCount);
      
      generatedData[tableName] = records;
      
      // 生成SQL文件
      const sql = this.generateInsertSQL(tableName, records);
      const sqlFile = path.join(this.outputDir, `${tableName}.sql`);
      fs.writeFileSync(sqlFile, sql);
      sqlFiles[tableName] = sqlFile;
      
      console.log(`   ✅ ${tableName}: ${records.length}条记录`);
    }

    // 生成导入脚本
    this.generateImportScript(sqlFiles);
    
    // 生成数据报告
    this.generateDataReport(generatedData, schema);

    console.log('✅ 测试数据生成完成!');
    console.log(`   - 输出目录: ${this.outputDir}`);
    console.log(`   - 表数量: ${Object.keys(generatedData).length}`);
    console.log(`   - 总记录数: ${Object.values(generatedData).reduce((sum, records) => sum + records.length, 0)}`);

    return generatedData;
  }

  /**
   * 按依赖关系排序表
   */
  sortTablesByDependency(tables, tableSchemas) {
    // 简单实现：将有外键的表放在后面
    const tablesWithFK = [];
    const tablesWithoutFK = [];

    for (const tableName of tables) {
      const tableSchema = tableSchemas[tableName];
      if (tableSchema && tableSchema.foreignKeys.length > 0) {
        tablesWithFK.push(tableName);
      } else {
        tablesWithoutFK.push(tableName);
      }
    }

    return [...tablesWithoutFK, ...tablesWithFK];
  }

  /**
   * 生成导入脚本
   */
  generateImportScript(sqlFiles) {
    const scriptFile = path.join(this.outputDir, 'import.sh');
    
    let script = `#!/bin/bash\n`;
    script += `echo "🚀 开始导入测试数据..."\n\n`;

    for (const [tableName, sqlFile] of Object.entries(sqlFiles)) {
      const fileName = path.basename(sqlFile);
      script += `echo "📊 导入 ${tableName}..."\n`;
      script += `wrangler d1 execute college-employment-survey --remote --file="${fileName}" --yes\n\n`;
    }

    script += `echo "✅ 导入完成!"\n`;

    fs.writeFileSync(scriptFile, script);
    fs.chmodSync(scriptFile, '755');
    
    console.log(`   - 导入脚本: ${scriptFile}`);
  }

  /**
   * 生成数据报告
   */
  generateDataReport(generatedData, schema) {
    const reportFile = path.join(this.outputDir, 'data-report.md');
    
    let report = `# 测试数据生成报告\n\n`;
    report += `**生成时间**: ${new Date().toISOString()}\n`;
    report += `**Schema版本**: ${schema.extractedAt}\n\n`;

    report += `## 数据统计\n\n`;
    report += `| 表名 | 记录数 | 文件大小 |\n`;
    report += `|------|--------|----------|\n`;

    for (const [tableName, records] of Object.entries(generatedData)) {
      const sqlFile = path.join(this.outputDir, `${tableName}.sql`);
      const fileSize = fs.existsSync(sqlFile) ? 
        (fs.statSync(sqlFile).size / 1024).toFixed(2) + ' KB' : 'N/A';
      
      report += `| ${tableName} | ${records.length} | ${fileSize} |\n`;
    }

    report += `\n## 使用说明\n\n`;
    report += `1. 运行导入脚本: \`./import.sh\`\n`;
    report += `2. 或手动导入单个表: \`wrangler d1 execute college-employment-survey --remote --file="表名.sql" --yes\`\n\n`;

    fs.writeFileSync(reportFile, report);
    console.log(`   - 数据报告: ${reportFile}`);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new DataGenerator();
  generator.generateTestData({ recordCount: 100 })
    .catch(error => {
      console.error('❌ 数据生成失败:', error);
      process.exit(1);
    });
}

module.exports = { DataGenerator };
