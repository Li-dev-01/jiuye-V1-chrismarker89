#!/usr/bin/env node

/**
 * 数据库Schema提取器
 * 从线上数据库提取完整的表结构信息
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SchemaExtractor {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'schemas', 'production');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 执行数据库查询
   */
  async executeQuery(query) {
    try {
      const command = `wrangler d1 execute college-employment-survey --remote --command="${query}"`;
      const result = execSync(command, { encoding: 'utf8' });
      return this.parseWranglerOutput(result);
    } catch (error) {
      console.error(`查询执行失败: ${query}`);
      console.error(error.message);
      return null;
    }
  }

  /**
   * 解析Wrangler输出
   */
  parseWranglerOutput(output) {
    try {
      // 尝试解析JSON格式输出
      const jsonMatch = output.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        if (jsonData[0] && jsonData[0].results) {
          return jsonData[0].results;
        }
      }
    } catch (error) {
      // JSON解析失败，尝试表格格式解析
    }

    // 表格格式解析（兼容旧版本）
    const lines = output.split('\n');
    const dataLines = [];
    let inDataSection = false;
    let headerPassed = false;

    for (const line of lines) {
      // 检测表格开始
      if (line.includes('┌') && line.includes('─')) {
        inDataSection = true;
        continue;
      }

      // 检测表头分隔线
      if (line.includes('├') && line.includes('─')) {
        headerPassed = true;
        continue;
      }

      // 检测表格结束
      if (line.includes('└') && line.includes('─')) {
        break;
      }

      // 解析数据行
      if (inDataSection && headerPassed && line.includes('│')) {
        const cells = line.split('│')
          .map(cell => cell.trim())
          .filter(cell => cell && !cell.includes('─'));

        if (cells.length > 0) {
          dataLines.push(cells);
        }
      }
    }

    return dataLines;
  }

  /**
   * 获取所有表名
   */
  async getAllTables() {
    console.log('📋 获取所有表名...');
    const query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;";
    const result = await this.executeQuery(query);

    if (!result) return [];

    // 处理JSON格式结果
    const tables = result.map(row => {
      if (typeof row === 'object' && row.name) {
        return row.name;
      }
      return Array.isArray(row) ? row[0] : row;
    }).filter(name => name);

    console.log(`   发现 ${tables.length} 个表`);
    return tables;
  }

  /**
   * 获取表结构信息
   */
  async getTableSchema(tableName) {
    console.log(`📊 分析表: ${tableName}`);
    
    // 获取表结构
    const schemaQuery = `PRAGMA table_info(${tableName});`;
    const schemaResult = await this.executeQuery(schemaQuery);
    
    if (!schemaResult) return null;

    const columns = schemaResult.map(row => {
      if (typeof row === 'object') {
        return {
          cid: parseInt(row.cid || 0),
          name: row.name,
          type: row.type,
          notnull: row.notnull === '1' || row.notnull === 1,
          default_value: row.dflt_value === 'null' ? null : row.dflt_value,
          primary_key: row.pk === '1' || row.pk === 1
        };
      }
      return {
        cid: parseInt(row[0]),
        name: row[1],
        type: row[2],
        notnull: row[3] === '1',
        default_value: row[4] === 'null' ? null : row[4],
        primary_key: row[5] === '1'
      };
    });

    // 获取外键信息
    const foreignKeyQuery = `PRAGMA foreign_key_list(${tableName});`;
    const foreignKeyResult = await this.executeQuery(foreignKeyQuery);
    
    const foreignKeys = foreignKeyResult ? foreignKeyResult.map(row => ({
      id: parseInt(row[0]),
      seq: parseInt(row[1]),
      table: row[2],
      from: row[3],
      to: row[4],
      on_update: row[5],
      on_delete: row[6],
      match: row[7]
    })) : [];

    // 获取索引信息
    const indexQuery = `PRAGMA index_list(${tableName});`;
    const indexResult = await this.executeQuery(indexQuery);
    
    const indexes = indexResult ? indexResult.map(row => ({
      seq: parseInt(row[0]),
      name: row[1],
      unique: row[2] === '1',
      origin: row[3],
      partial: row[4] === '1'
    })) : [];

    // 获取数据统计
    const countQuery = `SELECT COUNT(*) as count FROM ${tableName};`;
    const countResult = await this.executeQuery(countQuery);
    const rowCount = countResult && countResult[0] ? parseInt(countResult[0][0]) : 0;

    return {
      name: tableName,
      columns,
      foreignKeys,
      indexes,
      rowCount,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * 提取完整的数据库Schema
   */
  async extractFullSchema() {
    console.log('🚀 开始提取数据库Schema...');
    
    const tables = await this.getAllTables();
    const schema = {
      database: 'college-employment-survey',
      environment: 'production',
      extractedAt: new Date().toISOString(),
      tables: {},
      summary: {
        tableCount: tables.length,
        totalRows: 0
      }
    };

    for (const tableName of tables) {
      const tableSchema = await this.getTableSchema(tableName);
      if (tableSchema) {
        schema.tables[tableName] = tableSchema;
        schema.summary.totalRows += tableSchema.rowCount;
      }
    }

    // 保存Schema文件
    const schemaFile = path.join(this.outputDir, 'schema.json');
    fs.writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
    
    // 生成可读的Schema报告
    this.generateSchemaReport(schema);
    
    console.log('✅ Schema提取完成!');
    console.log(`   - 表数量: ${schema.summary.tableCount}`);
    console.log(`   - 总记录数: ${schema.summary.totalRows}`);
    console.log(`   - 输出文件: ${schemaFile}`);
    
    return schema;
  }

  /**
   * 生成Schema报告
   */
  generateSchemaReport(schema) {
    const reportFile = path.join(this.outputDir, 'schema-report.md');
    
    let report = `# 数据库Schema报告\n\n`;
    report += `**数据库**: ${schema.database}\n`;
    report += `**环境**: ${schema.environment}\n`;
    report += `**提取时间**: ${schema.extractedAt}\n`;
    report += `**表数量**: ${schema.summary.tableCount}\n`;
    report += `**总记录数**: ${schema.summary.totalRows}\n\n`;

    report += `## 表结构详情\n\n`;

    for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
      report += `### ${tableName}\n\n`;
      report += `**记录数**: ${tableInfo.rowCount}\n\n`;
      
      report += `**字段信息**:\n`;
      report += `| 字段名 | 类型 | 非空 | 默认值 | 主键 |\n`;
      report += `|--------|------|------|--------|------|\n`;
      
      for (const column of tableInfo.columns) {
        const defaultValue = column.default_value || '-';
        report += `| ${column.name} | ${column.type} | ${column.notnull ? '是' : '否'} | ${defaultValue} | ${column.primary_key ? '是' : '否'} |\n`;
      }
      
      if (tableInfo.foreignKeys.length > 0) {
        report += `\n**外键关系**:\n`;
        report += `| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |\n`;
        report += `|----------|--------|----------|----------|----------|\n`;
        
        for (const fk of tableInfo.foreignKeys) {
          report += `| ${fk.from} | ${fk.table} | ${fk.to} | ${fk.on_delete} | ${fk.on_update} |\n`;
        }
      }
      
      if (tableInfo.indexes.length > 0) {
        report += `\n**索引信息**:\n`;
        report += `| 索引名 | 唯一 | 来源 |\n`;
        report += `|--------|------|------|\n`;
        
        for (const index of tableInfo.indexes) {
          report += `| ${index.name} | ${index.unique ? '是' : '否'} | ${index.origin} |\n`;
        }
      }
      
      report += `\n`;
    }

    fs.writeFileSync(reportFile, report);
    console.log(`   - 报告文件: ${reportFile}`);
  }

  /**
   * 生成TypeScript类型定义
   */
  generateTypeDefinitions(schema) {
    const typesFile = path.join(this.outputDir, 'types.ts');
    
    let types = `// 自动生成的数据库类型定义\n`;
    types += `// 生成时间: ${schema.extractedAt}\n\n`;

    for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
      const interfaceName = tableName.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');

      types += `export interface ${interfaceName} {\n`;
      
      for (const column of tableInfo.columns) {
        const tsType = this.sqliteToTypeScript(column.type);
        const optional = !column.notnull && !column.primary_key ? '?' : '';
        types += `  ${column.name}${optional}: ${tsType};\n`;
      }
      
      types += `}\n\n`;
    }

    fs.writeFileSync(typesFile, types);
    console.log(`   - 类型定义: ${typesFile}`);
  }

  /**
   * SQLite类型转TypeScript类型
   */
  sqliteToTypeScript(sqliteType) {
    const type = sqliteType.toUpperCase();
    
    if (type.includes('TEXT')) return 'string';
    if (type.includes('INTEGER')) return 'number';
    if (type.includes('REAL')) return 'number';
    if (type.includes('BLOB')) return 'Buffer';
    
    return 'any';
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const extractor = new SchemaExtractor();
  extractor.extractFullSchema()
    .then(schema => {
      extractor.generateTypeDefinitions(schema);
      console.log('🎉 Schema提取和类型生成完成!');
    })
    .catch(error => {
      console.error('❌ Schema提取失败:', error);
      process.exit(1);
    });
}

module.exports = { SchemaExtractor };
