#!/usr/bin/env node

/**
 * 数据库Schema验证器
 * 验证本地与线上数据库结构的一致性
 */

const fs = require('fs');
const path = require('path');
const { SchemaExtractor } = require('./schema-extractor.cjs');

class SchemaValidator {
  constructor() {
    this.productionSchemaPath = path.join(__dirname, '..', 'schemas', 'production', 'schema.json');
    this.localSchemaPath = path.join(__dirname, '..', 'schemas', 'local', 'schema.json');
    this.reportDir = path.join(__dirname, '..', 'reports');
    this.ensureReportDir();
  }

  ensureReportDir() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * 加载Schema文件
   */
  loadSchema(schemaPath) {
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema文件不存在: ${schemaPath}`);
    }
    
    return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  }

  /**
   * 比较两个Schema
   */
  compareSchemas(productionSchema, localSchema) {
    const differences = {
      summary: {
        hasChanges: false,
        tableChanges: 0,
        columnChanges: 0,
        foreignKeyChanges: 0,
        indexChanges: 0
      },
      tables: {}
    };

    // 获取所有表名
    const prodTables = new Set(Object.keys(productionSchema.tables));
    const localTables = new Set(Object.keys(localSchema.tables));
    const allTables = new Set([...prodTables, ...localTables]);

    for (const tableName of allTables) {
      const tableDiff = this.compareTable(
        productionSchema.tables[tableName],
        localSchema.tables[tableName],
        tableName
      );

      if (tableDiff.hasChanges) {
        differences.tables[tableName] = tableDiff;
        differences.summary.hasChanges = true;
        differences.summary.tableChanges++;
        differences.summary.columnChanges += tableDiff.columnChanges.length;
        differences.summary.foreignKeyChanges += tableDiff.foreignKeyChanges.length;
        differences.summary.indexChanges += tableDiff.indexChanges.length;
      }
    }

    return differences;
  }

  /**
   * 比较单个表
   */
  compareTable(prodTable, localTable, tableName) {
    const diff = {
      hasChanges: false,
      status: 'unchanged',
      columnChanges: [],
      foreignKeyChanges: [],
      indexChanges: []
    };

    // 检查表是否存在
    if (!prodTable && localTable) {
      diff.status = 'local_only';
      diff.hasChanges = true;
      return diff;
    }

    if (prodTable && !localTable) {
      diff.status = 'production_only';
      diff.hasChanges = true;
      return diff;
    }

    if (!prodTable && !localTable) {
      return diff;
    }

    // 比较列
    const columnDiffs = this.compareColumns(prodTable.columns, localTable.columns);
    if (columnDiffs.length > 0) {
      diff.columnChanges = columnDiffs;
      diff.hasChanges = true;
    }

    // 比较外键
    const foreignKeyDiffs = this.compareForeignKeys(prodTable.foreignKeys, localTable.foreignKeys);
    if (foreignKeyDiffs.length > 0) {
      diff.foreignKeyChanges = foreignKeyDiffs;
      diff.hasChanges = true;
    }

    // 比较索引
    const indexDiffs = this.compareIndexes(prodTable.indexes, localTable.indexes);
    if (indexDiffs.length > 0) {
      diff.indexChanges = indexDiffs;
      diff.hasChanges = true;
    }

    return diff;
  }

  /**
   * 比较列
   */
  compareColumns(prodColumns, localColumns) {
    const changes = [];
    const prodColMap = new Map(prodColumns.map(col => [col.name, col]));
    const localColMap = new Map(localColumns.map(col => [col.name, col]));

    // 检查所有列
    const allColumns = new Set([...prodColMap.keys(), ...localColMap.keys()]);

    for (const columnName of allColumns) {
      const prodCol = prodColMap.get(columnName);
      const localCol = localColMap.get(columnName);

      if (!prodCol && localCol) {
        changes.push({
          type: 'local_only',
          column: columnName,
          localColumn: localCol
        });
      } else if (prodCol && !localCol) {
        changes.push({
          type: 'production_only',
          column: columnName,
          productionColumn: prodCol
        });
      } else if (prodCol && localCol) {
        const columnDiff = this.compareColumn(prodCol, localCol);
        if (columnDiff.length > 0) {
          changes.push({
            type: 'modified',
            column: columnName,
            differences: columnDiff,
            productionColumn: prodCol,
            localColumn: localCol
          });
        }
      }
    }

    return changes;
  }

  /**
   * 比较单个列
   */
  compareColumn(prodCol, localCol) {
    const differences = [];

    if (prodCol.type !== localCol.type) {
      differences.push({
        field: 'type',
        production: prodCol.type,
        local: localCol.type
      });
    }

    if (prodCol.notnull !== localCol.notnull) {
      differences.push({
        field: 'notnull',
        production: prodCol.notnull,
        local: localCol.notnull
      });
    }

    if (prodCol.default_value !== localCol.default_value) {
      differences.push({
        field: 'default_value',
        production: prodCol.default_value,
        local: localCol.default_value
      });
    }

    if (prodCol.primary_key !== localCol.primary_key) {
      differences.push({
        field: 'primary_key',
        production: prodCol.primary_key,
        local: localCol.primary_key
      });
    }

    return differences;
  }

  /**
   * 比较外键
   */
  compareForeignKeys(prodFKs, localFKs) {
    const changes = [];
    
    // 简化比较：转换为字符串进行比较
    const prodFKStrings = prodFKs.map(fk => `${fk.from}->${fk.table}.${fk.to}`);
    const localFKStrings = localFKs.map(fk => `${fk.from}->${fk.table}.${fk.to}`);

    const prodSet = new Set(prodFKStrings);
    const localSet = new Set(localFKStrings);

    for (const fkString of prodSet) {
      if (!localSet.has(fkString)) {
        changes.push({
          type: 'production_only',
          foreignKey: fkString
        });
      }
    }

    for (const fkString of localSet) {
      if (!prodSet.has(fkString)) {
        changes.push({
          type: 'local_only',
          foreignKey: fkString
        });
      }
    }

    return changes;
  }

  /**
   * 比较索引
   */
  compareIndexes(prodIndexes, localIndexes) {
    const changes = [];
    
    const prodIndexNames = new Set(prodIndexes.map(idx => idx.name));
    const localIndexNames = new Set(localIndexes.map(idx => idx.name));

    for (const indexName of prodIndexNames) {
      if (!localIndexNames.has(indexName)) {
        changes.push({
          type: 'production_only',
          index: indexName
        });
      }
    }

    for (const indexName of localIndexNames) {
      if (!prodIndexNames.has(indexName)) {
        changes.push({
          type: 'local_only',
          index: indexName
        });
      }
    }

    return changes;
  }

  /**
   * 生成验证报告
   */
  generateValidationReport(differences, productionSchema, localSchema) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(this.reportDir, `validation-report-${timestamp}.md`);

    let report = `# 数据库Schema验证报告\n\n`;
    report += `**验证时间**: ${new Date().toISOString()}\n`;
    report += `**生产环境Schema**: ${productionSchema.extractedAt}\n`;
    report += `**本地环境Schema**: ${localSchema.extractedAt}\n\n`;

    if (!differences.summary.hasChanges) {
      report += `## ✅ 验证结果: 通过\n\n`;
      report += `生产环境与本地环境的数据库结构完全一致。\n\n`;
    } else {
      report += `## ❌ 验证结果: 发现差异\n\n`;
      report += `**差异统计**:\n`;
      report += `- 表变更: ${differences.summary.tableChanges}\n`;
      report += `- 列变更: ${differences.summary.columnChanges}\n`;
      report += `- 外键变更: ${differences.summary.foreignKeyChanges}\n`;
      report += `- 索引变更: ${differences.summary.indexChanges}\n\n`;

      report += `## 详细差异\n\n`;

      for (const [tableName, tableDiff] of Object.entries(differences.tables)) {
        report += `### 表: ${tableName}\n\n`;

        if (tableDiff.status === 'production_only') {
          report += `⚠️ **仅存在于生产环境**\n\n`;
        } else if (tableDiff.status === 'local_only') {
          report += `⚠️ **仅存在于本地环境**\n\n`;
        }

        if (tableDiff.columnChanges.length > 0) {
          report += `**列变更**:\n`;
          for (const change of tableDiff.columnChanges) {
            report += `- ${change.type}: ${change.column}\n`;
            if (change.differences) {
              for (const diff of change.differences) {
                report += `  - ${diff.field}: 生产(${diff.production}) vs 本地(${diff.local})\n`;
              }
            }
          }
          report += `\n`;
        }

        if (tableDiff.foreignKeyChanges.length > 0) {
          report += `**外键变更**:\n`;
          for (const change of tableDiff.foreignKeyChanges) {
            report += `- ${change.type}: ${change.foreignKey}\n`;
          }
          report += `\n`;
        }

        if (tableDiff.indexChanges.length > 0) {
          report += `**索引变更**:\n`;
          for (const change of tableDiff.indexChanges) {
            report += `- ${change.type}: ${change.index}\n`;
          }
          report += `\n`;
        }
      }
    }

    fs.writeFileSync(reportFile, report);
    return reportFile;
  }

  /**
   * 执行完整验证
   */
  async validate() {
    console.log('🔍 开始Schema验证...');

    try {
      // 首先提取最新的生产环境Schema
      console.log('📊 提取生产环境Schema...');
      const extractor = new SchemaExtractor();
      await extractor.extractFullSchema();

      // 加载Schema文件
      console.log('📋 加载Schema文件...');
      const productionSchema = this.loadSchema(this.productionSchemaPath);
      
      if (!fs.existsSync(this.localSchemaPath)) {
        console.log('⚠️ 本地Schema文件不存在，将生产环境Schema复制为本地Schema');
        fs.copyFileSync(this.productionSchemaPath, this.localSchemaPath);
        console.log('✅ 验证完成: 已同步生产环境Schema到本地');
        return;
      }

      const localSchema = this.loadSchema(this.localSchemaPath);

      // 比较Schema
      console.log('🔄 比较Schema差异...');
      const differences = this.compareSchemas(productionSchema, localSchema);

      // 生成报告
      const reportFile = this.generateValidationReport(differences, productionSchema, localSchema);

      if (differences.summary.hasChanges) {
        console.log('❌ 发现Schema差异!');
        console.log(`   - 表变更: ${differences.summary.tableChanges}`);
        console.log(`   - 列变更: ${differences.summary.columnChanges}`);
        console.log(`   - 外键变更: ${differences.summary.foreignKeyChanges}`);
        console.log(`   - 索引变更: ${differences.summary.indexChanges}`);
        console.log(`   - 详细报告: ${reportFile}`);
        
        console.log('\n🔧 建议操作:');
        console.log('   1. 检查报告中的差异详情');
        console.log('   2. 运行 npm run db:sync 同步Schema');
        console.log('   3. 重新生成测试数据');
        
        process.exit(1);
      } else {
        console.log('✅ Schema验证通过: 生产环境与本地环境完全一致');
        console.log(`   - 验证报告: ${reportFile}`);
      }

    } catch (error) {
      console.error('❌ Schema验证失败:', error.message);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const validator = new SchemaValidator();
  validator.validate();
}

module.exports = { SchemaValidator };

/**
 * 数据同步工具
 */
class SchemaSyncer {
  constructor() {
    this.productionSchemaPath = path.join(__dirname, '..', 'schemas', 'production', 'schema.json');
    this.localSchemaPath = path.join(__dirname, '..', 'schemas', 'local', 'schema.json');
  }

  /**
   * 同步生产环境Schema到本地
   */
  async syncToLocal() {
    console.log('🔄 同步生产环境Schema到本地...');

    if (!fs.existsSync(this.productionSchemaPath)) {
      throw new Error('生产环境Schema文件不存在，请先运行 npm run db:extract');
    }

    // 确保本地Schema目录存在
    const localSchemaDir = path.dirname(this.localSchemaPath);
    if (!fs.existsSync(localSchemaDir)) {
      fs.mkdirSync(localSchemaDir, { recursive: true });
    }

    // 复制Schema文件
    fs.copyFileSync(this.productionSchemaPath, this.localSchemaPath);

    console.log('✅ Schema同步完成');
    console.log(`   - 源文件: ${this.productionSchemaPath}`);
    console.log(`   - 目标文件: ${this.localSchemaPath}`);
  }

  /**
   * 生成迁移脚本
   */
  generateMigrationScript(differences) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const migrationFile = path.join(__dirname, '..', 'migrations', `migration-${timestamp}.sql`);

    let migration = `-- 数据库迁移脚本\n`;
    migration += `-- 生成时间: ${new Date().toISOString()}\n\n`;

    // 这里可以根据differences生成具体的SQL迁移语句
    // 由于SQLite的限制，某些操作可能需要重建表

    fs.writeFileSync(migrationFile, migration);
    return migrationFile;
  }
}

module.exports = { SchemaValidator, SchemaSyncer };
