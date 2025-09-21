/**
 * 基于真实的universal-questionnaire-v1数据生成统计缓存
 * 使用方法: node scripts/generate-universal-stats-cache.js
 */

import { execSync } from 'child_process';

// 统计字段映射
const STATS_MAPPING = {
  // 年龄分布
  'age-range': {
    field: 'sectionResponses.section1.age',
    transform: (age) => {
      const ageNum = parseInt(age);
      if (ageNum < 20) return '20以下';
      if (ageNum <= 22) return '20-22';
      if (ageNum <= 25) return '23-25';
      if (ageNum <= 28) return '26-28';
      if (ageNum <= 35) return '29-35';
      return '35以上';
    }
  },
  // 性别分布
  'gender': {
    field: 'sectionResponses.section1.gender',
    transform: (gender) => gender
  },
  // 教育水平分布
  'education-level': {
    field: 'sectionResponses.section2.degree',
    transform: (degree) => degree
  },
  // 专业分布
  'major-field': {
    field: 'sectionResponses.section2.major',
    transform: (major) => {
      // 简化专业分类
      if (major.includes('计算机') || major.includes('软件') || major.includes('信息') || major.includes('电子')) return '工学';
      if (major.includes('管理') || major.includes('经济') || major.includes('金融')) return '管理学';
      if (major.includes('数学') || major.includes('物理') || major.includes('化学')) return '理学';
      if (major.includes('文学') || major.includes('语言') || major.includes('新闻')) return '文学';
      if (major.includes('医学') || major.includes('临床') || major.includes('护理')) return '医学';
      if (major.includes('教育') || major.includes('师范')) return '教育学';
      if (major.includes('艺术') || major.includes('设计') || major.includes('美术')) return '艺术学';
      if (major.includes('法学') || major.includes('法律')) return '法学';
      return '其他';
    }
  },
  // 就业状态分布
  'current-status': {
    field: 'sectionResponses.section3.currentStatus',
    transform: (status) => status
  }
};

async function generateUniversalStatsCache() {
  console.log('🔄 开始生成universal问卷统计缓存...');
  
  try {
    // 1. 获取所有问卷响应数据
    console.log('📊 获取问卷响应数据...');
    const getResponsesCmd = `npx wrangler d1 execute college-employment-survey-isolated --remote --command "SELECT responses FROM universal_questionnaire_responses WHERE questionnaire_id = 'employment-survey-2024' AND is_valid = 1;"`;
    const responsesOutput = execSync(getResponsesCmd, { encoding: 'utf8' });
    
    // 解析响应数据
    const responses = parseUniversalResponsesFromOutput(responsesOutput);
    console.log(`📈 找到 ${responses.length} 条有效响应`);
    
    if (responses.length === 0) {
      console.log('⚠️ 没有找到有效的问卷响应数据');
      return;
    }
    
    // 2. 统计每个问题的选项分布
    const questionStats = {};
    
    responses.forEach((responseData, index) => {
      try {
        const parsedResponse = JSON.parse(responseData);
        
        // 遍历统计字段
        Object.entries(STATS_MAPPING).forEach(([questionId, config]) => {
          const value = getNestedValue(parsedResponse, config.field);
          if (value !== undefined && value !== null && value !== '') {
            const transformedValue = config.transform(value);
            
            if (!questionStats[questionId]) {
              questionStats[questionId] = {};
            }
            
            if (!questionStats[questionId][transformedValue]) {
              questionStats[questionId][transformedValue] = 0;
            }
            
            questionStats[questionId][transformedValue]++;
          }
        });
      } catch (error) {
        console.warn(`⚠️ 解析第${index + 1}条响应数据失败:`, error.message);
      }
    });
    
    console.log('📊 统计结果:', Object.keys(questionStats).map(qId => `${qId}: ${Object.keys(questionStats[qId]).length}个选项`).join(', '));
    
    // 3. 生成缓存插入语句
    const insertStatements = [];
    const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    Object.entries(questionStats).forEach(([questionId, optionCounts]) => {
      const totalResponses = Object.values(optionCounts).reduce((sum, count) => sum + count, 0);
      
      Object.entries(optionCounts).forEach(([optionValue, count]) => {
        const percentage = ((count / totalResponses) * 100).toFixed(2);
        
        insertStatements.push(
          `('employment-survey-2024', '${questionId}', '${optionValue.replace(/'/g, "''")}', ${count}, ${percentage}, ${totalResponses}, '${currentTime}')`
        );
      });
    });
    
    if (insertStatements.length === 0) {
      console.log('⚠️ 没有生成任何统计数据');
      return;
    }
    
    // 4. 批量插入统计缓存
    console.log('💾 插入统计缓存数据...');
    const insertCmd = `npx wrangler d1 execute college-employment-survey-isolated --remote --command "INSERT INTO questionnaire_stats_cache (questionnaire_id, question_id, option_value, count, percentage, total_responses, last_updated) VALUES ${insertStatements.join(', ')};"`;
    
    execSync(insertCmd, { encoding: 'utf8' });
    
    console.log(`✅ 统计缓存生成完成！共插入 ${insertStatements.length} 条记录`);
    
    // 5. 验证结果
    console.log('🔍 验证统计缓存...');
    const verifyCmd = `npx wrangler d1 execute college-employment-survey-isolated --remote --command "SELECT question_id, COUNT(*) as option_count, MAX(total_responses) as total_responses FROM questionnaire_stats_cache WHERE questionnaire_id = 'employment-survey-2024' GROUP BY question_id;"`;
    const verifyOutput = execSync(verifyCmd, { encoding: 'utf8' });
    console.log('验证结果:');
    console.log(verifyOutput);
    
  } catch (error) {
    console.error('❌ 生成统计缓存失败:', error.message);
    process.exit(1);
  }
}

function parseUniversalResponsesFromOutput(output) {
  const responses = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    // 查找包含JSON数据的行
    if (line.includes('│') && line.includes('{') && line.includes('}')) {
      // 提取JSON数据
      const startIndex = line.indexOf('{');
      const endIndex = line.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const jsonStr = line.substring(startIndex, endIndex + 1).trim();
        if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
          responses.push(jsonStr);
        }
      }
    }
  }
  
  console.log(`🔍 从输出中解析到 ${responses.length} 条响应数据`);
  return responses;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// 运行脚本
generateUniversalStatsCache().catch(console.error);

export { generateUniversalStatsCache };
