/**
 * 中英文双语标题映射配置
 * 为图表标题和数据标签提供国际化支持
 */

export interface BilingualTitle {
  chinese: string;
  english: string;
}

/**
 * 图表标题中英文映射
 */
export const CHART_TITLE_BILINGUAL_MAP: Record<string, BilingualTitle> = {
  // 就业形势总览
  '当前身份状态分布': {
    chinese: '当前身份状态分布',
    english: 'Current Employment Status Distribution'
  },
  '就业难度感知': {
    chinese: '就业难度感知',
    english: 'Employment Difficulty Perception'
  },
  '同龄人就业率': {
    chinese: '同龄人就业率',
    english: 'Peer Employment Rate'
  },
  '薪资水平感知': {
    chinese: '薪资水平感知',
    english: 'Salary Level Perception'
  },

  // 人口结构分析
  '性别分布': {
    chinese: '性别分布',
    english: 'Gender Distribution'
  },
  '年龄分布': {
    chinese: '年龄分布',
    english: 'Age Distribution'
  },
  '年龄段分布': {
    chinese: '年龄段分布',
    english: 'Age Distribution'
  },
  '学历分布': {
    chinese: '学历分布',
    english: 'Education Level Distribution'
  },
  '学历层次分布': {
    chinese: '学历层次分布',
    english: 'Education Level Distribution'
  },
  '教育水平分布': {
    chinese: '教育水平分布',
    english: 'Education Level Distribution'
  },
  '专业分布': {
    chinese: '专业分布',
    english: 'Major Field Distribution'
  },
  '地域分布': {
    chinese: '地域分布',
    english: 'Geographic Distribution'
  },
  '同龄人就业率观察': {
    chinese: '同龄人就业率观察',
    english: 'Peer Employment Rate Observation'
  },
  '身份状态分布': {
    chinese: '身份状态分布',
    english: 'Current Status Distribution'
  },
  '就业准备情况': {
    chinese: '就业准备情况',
    english: 'Career Preparation Status'
  },

  // 就业市场分析
  '行业就业分布': {
    chinese: '行业就业分布',
    english: 'Industry Employment Distribution'
  },
  '薪资水平分布': {
    chinese: '薪资水平分布',
    english: 'Salary Level Distribution'
  },
  '求职时长分析': {
    chinese: '求职时长分析',
    english: 'Job Search Duration Analysis'
  },
  '求职困难分析': {
    chinese: '求职困难分析',
    english: 'Job Search Difficulties Analysis'
  },

  // 学生就业准备
  '学年分布': {
    chinese: '学年分布',
    english: 'Academic Year Distribution'
  },
  '学生就业准备情况': {
    chinese: '学生就业准备情况',
    english: 'Student Career Preparation Status'
  },

  // 生活成本压力
  '住房成本分布': {
    chinese: '住房成本分布',
    english: 'Housing Cost Distribution'
  },
  '一线城市生活压力': {
    chinese: '一线城市生活压力',
    english: 'Living Pressure in Tier-1 Cities'
  },
  '经济压力感知': {
    chinese: '经济压力感知',
    english: 'Financial Pressure Perception'
  },

  // 政策建议洞察
  '改善建议统计': {
    chinese: '改善建议统计',
    english: 'Improvement Suggestions Statistics'
  }
};

/**
 * 数据标签中英文映射
 */
export const DATA_LABEL_BILINGUAL_MAP: Record<string, BilingualTitle> = {
  // 就业状态 - API数据格式
  '已就业': { chinese: '已就业', english: 'Employed' },
  '求职中': { chinese: '求职中', english: 'Job Seeking' },
  '继续深造': { chinese: '继续深造', english: 'Further Study' },
  '其他': { chinese: '其他', english: 'Others' },

  // 就业状态 - 回退数据格式
  '全职工作': { chinese: '全职工作', english: 'Full-time Employment' },
  '备考/准备': { chinese: '备考/准备', english: 'Exam Preparation' },
  '在校学生': { chinese: '在校学生', english: 'Student' },
  '失业/求职中': { chinese: '失业/求职中', english: 'Job Seeking' },
  'other': { chinese: '其他', english: 'Others' },

  // 性别
  '女性': { chinese: '女性', english: 'Female' },
  '男性': { chinese: '男性', english: 'Male' },
  '不愿透露': { chinese: '不愿透露', english: 'Prefer not to say' },

  // 年龄段
  '18-22岁': { chinese: '18-22岁', english: '18-22 years' },
  '23-25岁': { chinese: '23-25岁', english: '23-25 years' },
  '26-30岁': { chinese: '26-30岁', english: '26-30 years' },
  '31-35岁': { chinese: '31-35岁', english: '31-35 years' },
  '35岁以上': { chinese: '35岁以上', english: 'Over 35 years' },
  'over-35': { chinese: '35岁以上', english: 'Over 35' },

  // 学历
  '高中及以下': { chinese: '高中及以下', english: 'High School or Below' },
  '高中/中专以下': { chinese: '高中/中专以下', english: 'High School or Below' },
  '专科': { chinese: '专科', english: 'Associate Degree' },
  '大专': { chinese: '大专', english: 'Associate Degree' },
  '本科': { chinese: '本科', english: 'Bachelor Degree' },
  '硕士': { chinese: '硕士', english: 'Master Degree' },
  '硕士研究生': { chinese: '硕士研究生', english: 'Master Degree' },
  '博士': { chinese: '博士', english: 'PhD' },
  '博士研究生': { chinese: '博士研究生', english: 'PhD' },

  // 行业
  '互联网/科技': { chinese: '互联网/科技', english: 'IT/Tech' },
  '金融服务': { chinese: '金融服务', english: 'Finance' },
  '制造业': { chinese: '制造业', english: 'Manufacturing' },
  '教育培训': { chinese: '教育培训', english: 'Education' },
  '医疗健康': { chinese: '医疗健康', english: 'Healthcare' },
  '政府机关': { chinese: '政府机关', english: 'Government' },
  '其他行业': { chinese: '其他行业', english: 'Others' },

  // 薪资范围
  '3K以下': { chinese: '3K以下', english: 'Below 3K' },
  '3K-5K': { chinese: '3K-5K', english: '3K-5K' },
  '5K-8K': { chinese: '5K-8K', english: '5K-8K' },
  '8K-12K': { chinese: '8K-12K', english: '8K-12K' },
  '12K-20K': { chinese: '12K-20K', english: '12K-20K' },
  '20K以上': { chinese: '20K以上', english: 'Above 20K' },

  // 求职时长
  '1个月内': { chinese: '1个月内', english: 'Within 1 Month' },
  '1-3个月': { chinese: '1-3个月', english: '1-3 Months' },
  '3-6个月': { chinese: '3-6个月', english: '3-6 Months' },
  '6-12个月': { chinese: '6-12个月', english: '6-12 Months' },
  '12个月以上': { chinese: '12个月以上', english: 'Over 12 Months' },

  // 求职困难
  '缺乏经验': { chinese: '缺乏经验', english: 'Lack of Experience' },
  '技能不匹配': { chinese: '技能不匹配', english: 'Skill Mismatch' },
  '竞争激烈': { chinese: '竞争激烈', english: 'High Competition' },
  '薪资期望': { chinese: '薪资期望', english: 'Salary Expectation' },
  '地域限制': { chinese: '地域限制', english: 'Location Constraint' },
  '其他原因': { chinese: '其他原因', english: 'Others' },

  // 就业难度感知
  '非常困难': { chinese: '非常困难', english: 'Very Difficult' },
  '比较困难': { chinese: '比较困难', english: 'Difficult' },
  '一般': { chinese: '一般', english: 'Average' },
  '比较容易': { chinese: '比较容易', english: 'Easy' },
  '非常容易': { chinese: '非常容易', english: 'Very Easy' },

  // 薪资感知
  '低于预期': { chinese: '低于预期', english: 'Below Expectation' },
  '符合预期': { chinese: '符合预期', english: 'Meet Expectation' },
  '高于预期': { chinese: '高于预期', english: 'Above Expectation' },
  '远超预期': { chinese: '远超预期', english: 'Far Above' },

  // 专业分布
  '计算机科学': { chinese: '计算机科学', english: 'Computer Science' },
  '经济学': { chinese: '经济学', english: 'Economics' },
  '工程学': { chinese: '工程学', english: 'Engineering' },
  '管理学': { chinese: '管理学', english: 'Management' },
  '文学': { chinese: '文学', english: 'Literature' },
  '理学': { chinese: '理学', english: 'Science' },
  '医学': { chinese: '医学', english: 'Medicine' },
  '法学': { chinese: '法学', english: 'Law' },
  '教育学': { chinese: '教育学', english: 'Education' },
  '艺术学': { chinese: '艺术学', english: 'Arts' },

  // 地域分布
  '北京': { chinese: '北京', english: 'Beijing' },
  '上海': { chinese: '上海', english: 'Shanghai' },
  '深圳': { chinese: '深圳', english: 'Shenzhen' },
  '广州': { chinese: '广州', english: 'Guangzhou' },
  '杭州': { chinese: '杭州', english: 'Hangzhou' },
  '其他城市': { chinese: '其他城市', english: 'Other Cities' },

  // 就业准备情况
  '充分准备': { chinese: '充分准备', english: 'Well Prepared' },
  '基本准备': { chinese: '基本准备', english: 'Basically Prepared' },
  '准备不足': { chinese: '准备不足', english: 'Insufficiently Prepared' },
  '完全没准备': { chinese: '完全没准备', english: 'Not Prepared' },
  '不确定': { chinese: '不确定', english: 'Uncertain' },

  // 住房成本范围 (这些是数值范围，通常不需要双语处理，但保留以防特殊需要)
  '2000-3000': { chinese: '2000-3000', english: '2000-3000' },
  '3000-4000': { chinese: '3000-4000', english: '3000-4000' },
  '4000-5000': { chinese: '4000-5000', english: '4000-5000' },
  '5000-6000': { chinese: '5000-6000', english: '5000-6000' },
  '6000以上': { chinese: '6000以上', english: 'Above 6000' }
};

/**
 * 获取双语标题
 */
export function getBilingualTitle(title: string): BilingualTitle {
  return CHART_TITLE_BILINGUAL_MAP[title] || {
    chinese: title,
    english: title
  };
}

/**
 * 获取双语数据标签
 */
export function getBilingualDataLabel(label: string): BilingualTitle {
  return DATA_LABEL_BILINGUAL_MAP[label] || {
    chinese: label,
    english: label
  };
}

/**
 * 格式化双语标题（上下结构，左对齐）
 */
export function formatBilingualTitle(title: string): string {
  const bilingual = getBilingualTitle(title);
  return `${bilingual.chinese}\n${bilingual.english}`;
}

/**
 * 格式化双语数据标签（上下排列，居中对齐）
 */
export function formatBilingualDataLabel(label: string): string {
  const bilingual = getBilingualDataLabel(label);
  return `${bilingual.chinese}\n(${bilingual.english})`;
}

/**
 * 判断标签是否需要双语处理
 */
export function shouldApplyBilingualLabel(label: string): boolean {
  if (!label || typeof label !== 'string') return false;

  // 纯数字标签不需要双语处理
  if (/^\d+$/.test(label.trim())) return false;

  // 数值范围标签不需要双语处理 (如: "2000-3000", "3K-5K", "18-22")
  if (/^\d+[-~]\d+$/.test(label.trim())) return false;
  if (/^\d+[KkMm]?[-~]\d+[KkMm]?$/.test(label.trim())) return false;

  // 带单位的数值不需要双语处理 (如: "3K以下", "20K以上", "6000以上")
  if (/^\d+[KkMm]?以[下上]$/.test(label.trim())) return false;

  // 年龄范围特殊处理 (如: "18-22岁")
  if (/^\d+[-~]\d+岁$/.test(label.trim())) return true;

  // 百分比不需要双语处理
  if (/^\d+(\.\d+)?%$/.test(label.trim())) return false;

  // 货币金额不需要双语处理 (如: "¥2000", "$1000")
  if (/^[¥$€£]\d+/.test(label.trim())) return false;

  // 其他情况检查是否有双语映射
  const bilingual = DATA_LABEL_BILINGUAL_MAP[label];
  return bilingual && bilingual.chinese !== bilingual.english;
}

/**
 * 智能获取双语数据标签
 */
export function getSmartBilingualDataLabel(label: string): BilingualTitle {
  if (!shouldApplyBilingualLabel(label)) {
    // 不需要双语处理的标签，直接返回原标签
    return {
      chinese: label,
      english: label
    };
  }

  return getBilingualDataLabel(label);
}

/**
 * 智能格式化双语数据标签
 */
export function formatSmartBilingualDataLabel(label: string): string {
  if (!shouldApplyBilingualLabel(label)) {
    // 不需要双语处理的标签，直接返回原标签
    return label;
  }

  const bilingual = getBilingualDataLabel(label);
  if (bilingual.chinese === bilingual.english) {
    // 中英文相同时，只显示一次
    return bilingual.chinese;
  }

  return `${bilingual.chinese}\n(${bilingual.english})`;
}
