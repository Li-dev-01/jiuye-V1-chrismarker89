/**
 * 基于真实问卷数据生成统计缓存
 * 使用方法: node scripts/generate-real-stats-cache.js
 */

import { execSync } from 'child_process';

// 问题ID到选项的映射
const QUESTION_OPTIONS = {
  'age-range': ['20以下', '20-22', '23-25', '26-28', '29-35', '35以上'],
  'gender': ['male', 'female', 'other', 'prefer-not-to-say'],
  'education-level': ['high-school', 'associate', 'bachelor', 'master', 'doctorate'],
  'major-field': ['engineering', 'management', 'science', 'economics', 'literature', 'medicine', 'education', 'arts', 'law', 'other'],
  'current-status': ['employed', 'job-seeking', 'further-study', 'entrepreneurship', 'freelance', 'unemployed', 'other']
};

// 选项值到显示标签的映射
const OPTION_LABELS = {
  'age-range': {
    '20以下': '20岁以下',
    '20-22': '20-22岁 (在校大学生)',
    '23-25': '23-25岁 (应届毕业生)',
    '26-28': '26-28岁 (职场新人)',
    '29-35': '29-35岁 (职场经验者)',
    '35以上': '35岁以上 (资深从业者)'
  },
  'gender': {
    'male': '男',
    'female': '女',
    'other': '其他',
    'prefer-not-to-say': '不愿透露'
  },
  'education-level': {
    'high-school': '高中',
    'associate': '大专',
    'bachelor': '本科',
    'master': '硕士',
    'doctorate': '博士'
  },
  'major-field': {
    'engineering': '工学',
    'management': '管理学',
    'science': '理学',
    'economics': '经济学',
    'literature': '文学',
    'medicine': '医学',
    'education': '教育学',
    'arts': '艺术学',
    'law': '法学',
    'other': '其他'
  },
  'current-status': {
    'employed': '已就业',
    'job-seeking': '求职中',
    'further-study': '继续深造',
    'entrepreneurship': '创业',
    'freelance': '自由职业',
    'unemployed': '暂未就业',
    'other': '其他'
  }
};

async function generateStatsCache() {
  console.log('🔄 开始生成问卷统计缓存...');
  
  try {
    // 1. 获取所有问卷响应数据
    console.log('📊 获取问卷响应数据...');
    const getResponsesCmd = `npx wrangler d1 execute college-employment-survey-isolated --command "SELECT responses FROM universal_questionnaire_responses WHERE questionnaire_id = 'employment-survey-2024' AND is_valid = 1;"`;
    const responsesOutput = execSync(getResponsesCmd, { encoding: 'utf8' });
    
    // 解析响应数据
    const responses = parseResponsesFromOutput(responsesOutput);
    console.log(`📈 找到 ${responses.length} 条有效响应`);
    
    if (responses.length === 0) {
      console.log('⚠️ 没有找到有效的问卷响应数据');
      return;
    }
    
    // 2. 统计每个问题的选项分布
    const questionStats = {};
    
    responses.forEach(responseData => {
      try {
        const parsedResponse = JSON.parse(responseData);
        const sectionResponses = parsedResponse.sectionResponses || [];
        
        sectionResponses.forEach(section => {
          const questionResponses = section.questionResponses || [];
          
          questionResponses.forEach(qr => {
            const questionId = qr.questionId;
            const value = qr.value;
            
            if (!questionStats[questionId]) {
              questionStats[questionId] = {};
            }
            
            if (!questionStats[questionId][value]) {
              questionStats[questionId][value] = 0;
            }
            
            questionStats[questionId][value]++;
          });
        });
      } catch (error) {
        console.warn('⚠️ 解析响应数据失败:', error.message);
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
          `('employment-survey-2024', '${questionId}', '${optionValue}', ${count}, ${percentage}, ${totalResponses}, '${currentTime}')`
        );
      });
    });
    
    if (insertStatements.length === 0) {
      console.log('⚠️ 没有生成任何统计数据');
      return;
    }
    
    // 4. 批量插入统计缓存
    console.log('💾 插入统计缓存数据...');
    const insertCmd = `npx wrangler d1 execute college-employment-survey-isolated --command "INSERT INTO questionnaire_stats_cache (questionnaire_id, question_id, option_value, count, percentage, total_responses, last_updated) VALUES ${insertStatements.join(', ')};"`;
    
    execSync(insertCmd, { encoding: 'utf8' });
    
    console.log(`✅ 统计缓存生成完成！共插入 ${insertStatements.length} 条记录`);
    
    // 5. 验证结果
    console.log('🔍 验证统计缓存...');
    const verifyCmd = `npx wrangler d1 execute college-employment-survey-isolated --command "SELECT question_id, COUNT(*) as option_count, MAX(total_responses) as total_responses FROM questionnaire_stats_cache WHERE questionnaire_id = 'employment-survey-2024' GROUP BY question_id;"`;
    const verifyOutput = execSync(verifyCmd, { encoding: 'utf8' });
    console.log('验证结果:');
    console.log(verifyOutput);
    
  } catch (error) {
    console.error('❌ 生成统计缓存失败:', error.message);
    process.exit(1);
  }
}

function parseResponsesFromOutput(output) {
  const responses = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // 查找包含JSON数据的行
    if (line.includes('│') && line.includes('{') && line.includes('}')) {
      // 提取JSON数据 - 更宽松的匹配
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
  if (responses.length > 0) {
    console.log('📝 第一条数据示例:', responses[0].substring(0, 100) + '...');
  }

  return responses;
}

// 运行脚本
generateStatsCache().catch(console.error);

export { generateStatsCache };
