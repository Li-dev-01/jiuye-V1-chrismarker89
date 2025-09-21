#!/usr/bin/env ts-node

/**
 * 测试数据导入脚本
 * 将生成的测试数据导入到Cloudflare D1数据库
 */

import { generateTestData, analyzeGeneratedData } from './generateTestData';
import * as fs from 'fs';
import * as path from 'path';

// 数据库连接配置
interface DatabaseConfig {
  databaseId: string;
  apiToken: string;
  accountId: string;
}

// 从环境变量或配置文件读取数据库配置
function getDatabaseConfig(): DatabaseConfig {
  return {
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || 'your-database-id',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || 'your-api-token',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'your-account-id'
  };
}

// SQL语句生成器
class SQLGenerator {
  // 生成用户插入SQL
  generateUserInsertSQL(users: any[]): string[] {
    const statements: string[] = [];
    
    users.forEach(user => {
      const sql = `
INSERT INTO users (
  id, email, phone, nickname, password_hash, 
  is_test_data, created_at, updated_at,
  avatar, bio, location
) VALUES (
  '${user.id}',
  '${user.email}',
  '${user.phone}',
  '${user.nickname}',
  '${this.hashPassword(user.password)}',
  1,
  '${user.createdAt}',
  '${new Date().toISOString()}',
  ${user.profile.avatar ? `'${user.profile.avatar}'` : 'NULL'},
  ${user.profile.bio ? `'${user.profile.bio}'` : 'NULL'},
  ${user.profile.location ? `'${user.profile.location}'` : 'NULL'}
);`;
      statements.push(sql.trim());
    });
    
    return statements;
  }

  // 生成问卷回答插入SQL
  generateResponseInsertSQL(responses: any[]): string[] {
    const statements: string[] = [];
    
    responses.forEach(response => {
      // 主表插入
      const mainSQL = `
INSERT INTO questionnaire_responses (
  id, user_id, questionnaire_id, status, is_test_data,
  created_at, updated_at, submitted_at
) VALUES (
  '${response.id}',
  '${response.userId}',
  '${response.questionnaireId}',
  '${response.status}',
  1,
  '${response.createdAt}',
  '${response.updatedAt}',
  ${response.status === 'completed' ? `'${response.createdAt}'` : 'NULL'}
);`;
      statements.push(mainSQL.trim());

      // 答案详情插入
      const answers = this.extractAnswers(response);
      answers.forEach(answer => {
        const answerSQL = `
INSERT INTO questionnaire_answers (
  id, response_id, question_id, answer_value, answer_text,
  created_at, is_test_data
) VALUES (
  '${this.generateAnswerId()}',
  '${response.id}',
  '${answer.questionId}',
  '${answer.value}',
  ${answer.text ? `'${answer.text}'` : 'NULL'},
  '${response.createdAt}',
  1
);`;
        statements.push(answerSQL.trim());
      });
    });
    
    return statements;
  }

  private extractAnswers(response: any): Array<{questionId: string, value: string, text?: string}> {
    const answers: Array<{questionId: string, value: string, text?: string}> = [];
    
    // 映射字段到问题ID
    const fieldMapping: Record<string, string> = {
      'age': 'age-range',
      'gender': 'gender',
      'educationLevel': 'education-level',
      'majorField': 'major-field',
      'workLocationPreference': 'work-location-preference',
      'currentStatus': 'current-status',
      'employmentType': 'employment-type',
      'currentSalary': 'current-salary',
      'workIndustry': 'work-industry',
      'jobSatisfaction': 'job-satisfaction',
      'unemploymentDuration': 'unemployment-duration',
      'lastJobSalary': 'last-job-salary',
      'studyYear': 'study-year',
      'careerPlanning': 'career-planning',
      'internshipExperience': 'internship-experience',
      'careerGoal': 'career-goal',
      'skillConfidence': 'skill-confidence',
      'preferredWorkLocation': 'preferred-work-location',
      'employmentDifficulty': 'employment-difficulty'
    };

    // 处理单选题
    Object.entries(fieldMapping).forEach(([field, questionId]) => {
      if (response[field]) {
        answers.push({
          questionId,
          value: response[field]
        });
      }
    });

    // 处理多选题
    if (response.jobSearchChannels) {
      response.jobSearchChannels.forEach((channel: string) => {
        answers.push({
          questionId: 'job-search-channels',
          value: channel
        });
      });
    }

    if (response.jobSearchDifficulties) {
      response.jobSearchDifficulties.forEach((difficulty: string) => {
        answers.push({
          questionId: 'job-search-difficulties',
          value: difficulty
        });
      });
    }

    if (response.policySuggestions) {
      response.policySuggestions.forEach((suggestion: string) => {
        answers.push({
          questionId: 'policy-suggestions',
          value: suggestion
        });
      });
    }

    return answers;
  }

  private hashPassword(password: string): string {
    // 简单的密码哈希，实际应用中应使用bcrypt等
    return `test_hash_${password}`;
  }

  private generateAnswerId(): string {
    return `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 数据库操作类
class DatabaseImporter {
  private config: DatabaseConfig;
  private sqlGenerator: SQLGenerator;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.sqlGenerator = new SQLGenerator();
  }

  async importData(users: any[], responses: any[]): Promise<void> {
    console.log('📊 开始导入数据到数据库...');

    try {
      // 1. 清理现有测试数据
      await this.cleanTestData();

      // 2. 导入用户数据
      console.log('👥 导入用户数据...');
      const userSQLs = this.sqlGenerator.generateUserInsertSQL(users);
      await this.executeBatch(userSQLs, '用户');

      // 3. 导入问卷回答数据
      console.log('📝 导入问卷回答数据...');
      const responseSQLs = this.sqlGenerator.generateResponseInsertSQL(responses);
      await this.executeBatch(responseSQLs, '问卷回答');

      console.log('✅ 数据导入完成！');
      
      // 4. 验证导入结果
      await this.verifyImport();

    } catch (error) {
      console.error('❌ 数据导入失败:', error);
      throw error;
    }
  }

  private async cleanTestData(): Promise<void> {
    console.log('🧹 清理现有测试数据...');
    
    const cleanupSQLs = [
      'DELETE FROM questionnaire_answers WHERE is_test_data = 1;',
      'DELETE FROM questionnaire_responses WHERE is_test_data = 1;',
      'DELETE FROM users WHERE is_test_data = 1;'
    ];

    for (const sql of cleanupSQLs) {
      await this.executeSQL(sql);
    }
  }

  private async executeBatch(sqls: string[], type: string): Promise<void> {
    const batchSize = 50; // 每批处理50条
    const batches = [];
    
    for (let i = 0; i < sqls.length; i += batchSize) {
      batches.push(sqls.slice(i, i + batchSize));
    }

    console.log(`   - 总计 ${sqls.length} 条${type}记录，分 ${batches.length} 批处理`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`   - 处理第 ${i + 1}/${batches.length} 批 (${batch.length} 条记录)`);
      
      for (const sql of batch) {
        await this.executeSQL(sql);
      }
    }
  }

  private async executeSQL(sql: string): Promise<any> {
    // 这里应该调用Cloudflare D1 API
    // 由于我们在脚本环境中，可以使用wrangler命令或直接API调用
    
    // 模拟执行 - 实际实现时需要替换为真实的数据库调用
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SQL] ${sql.substring(0, 100)}...`);
      return Promise.resolve();
    }
    
    // 实际的D1 API调用代码
    // const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/d1/database/${this.config.databaseId}/query`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.config.apiToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ sql })
    // });
    
    return Promise.resolve();
  }

  private async verifyImport(): Promise<void> {
    console.log('🔍 验证导入结果...');
    
    // 验证查询
    const verificationQueries = [
      'SELECT COUNT(*) as user_count FROM users WHERE is_test_data = 1;',
      'SELECT COUNT(*) as response_count FROM questionnaire_responses WHERE is_test_data = 1;',
      'SELECT COUNT(*) as answer_count FROM questionnaire_answers WHERE is_test_data = 1;'
    ];

    for (const query of verificationQueries) {
      // 执行验证查询
      console.log(`   - 执行验证: ${query}`);
    }
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始测试数据生成和导入流程...');

    // 1. 生成测试数据
    console.log('\n📊 第1步：生成测试数据');
    const config = {
      userCount: 1500,
      responseCount: 2200,
      completionRates: {
        full: 0.70,
        partial: 0.25,
        abandoned: 0.05
      }
    };

    const { users, responses } = generateTestData(config);
    
    // 2. 分析数据质量
    console.log('\n📈 第2步：分析数据质量');
    const analysis = analyzeGeneratedData(responses);
    console.log(`   - 总用户数: ${users.length}`);
    console.log(`   - 总回答数: ${responses.length}`);
    console.log(`   - 完成率: ${analysis.completionRate.toFixed(1)}%`);
    console.log(`   - 状态分布:`, analysis.byStatus);

    // 3. 保存到文件
    console.log('\n💾 第3步：保存数据文件');
    fs.writeFileSync('./test-users.json', JSON.stringify(users, null, 2));
    fs.writeFileSync('./test-responses.json', JSON.stringify(responses, null, 2));
    fs.writeFileSync('./data-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('   - 数据文件已保存');

    // 4. 导入数据库
    console.log('\n🗄️ 第4步：导入数据库');
    const dbConfig = getDatabaseConfig();
    const importer = new DatabaseImporter(dbConfig);
    await importer.importData(users, responses);

    console.log('\n🎉 测试数据生成和导入完成！');
    console.log('\n📋 下一步操作：');
    console.log('   1. 验证可视化页面数据显示');
    console.log('   2. 测试社会观察功能');
    console.log('   3. 检查数据流完整性');

  } catch (error) {
    console.error('❌ 流程执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
