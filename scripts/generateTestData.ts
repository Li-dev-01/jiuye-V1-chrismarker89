#!/usr/bin/env ts-node

/**
 * 测试数据生成器
 * 生成符合真实分布的问卷测试数据
 */

import { randomBytes } from 'crypto';

// 数据分布权重配置
const REALISTIC_WEIGHTS = {
  'age-range': {
    '18-22': 0.35,
    '23-25': 0.40,
    '26-30': 0.20,
    '31-35': 0.04,
    'over-35': 0.01
  },
  'gender': {
    'male': 0.52,
    'female': 0.46,
    'prefer-not-say': 0.02
  },
  'education-level': {
    'high-school': 0.05,
    'junior-college': 0.15,
    'bachelor': 0.65,
    'master': 0.13,
    'phd': 0.02
  },
  'current-status': {
    'employed': 0.45,
    'unemployed': 0.25,
    'student': 0.25,
    'preparing': 0.04,
    'other': 0.01
  },
  'major-field': {
    'engineering': 0.25,
    'management': 0.18,
    'economics': 0.15,
    'science': 0.12,
    'literature': 0.10,
    'medicine': 0.08,
    'law': 0.05,
    'education': 0.04,
    'art': 0.02,
    'other': 0.01
  }
};

// 逻辑一致性规则
const CONSISTENCY_RULES = {
  ageEducationConsistency: {
    '18-22': ['high-school', 'junior-college', 'bachelor'],
    '23-25': ['bachelor', 'master'],
    '26-30': ['bachelor', 'master', 'phd'],
    '31-35': ['bachelor', 'master', 'phd'],
    'over-35': ['bachelor', 'master', 'phd']
  },
  educationSalaryCorrelation: {
    'phd': ['8k-12k', '12k-20k', 'above-20k'],
    'master': ['5k-8k', '8k-12k', '12k-20k', 'above-20k'],
    'bachelor': ['3k-5k', '5k-8k', '8k-12k', '12k-20k'],
    'junior-college': ['below-3k', '3k-5k', '5k-8k'],
    'high-school': ['below-3k', '3k-5k']
  }
};

// 测试用户生成器
class TestUserGenerator {
  private usedEmails = new Set<string>();
  private usedPhones = new Set<string>();

  generateUser(index: number): TestUser {
    const email = this.generateUniqueEmail(index);
    const phone = this.generateUniquePhone();
    
    return {
      id: `test_user_${index.toString().padStart(6, '0')}`,
      email,
      phone,
      nickname: `测试用户${index}`,
      password: 'test123456', // 统一测试密码
      isTestData: true,
      createdAt: this.generateRandomDate(),
      profile: {
        avatar: null,
        bio: null,
        location: null
      }
    };
  }

  private generateUniqueEmail(index: number): string {
    const domains = ['test.com', 'example.org', 'demo.net'];
    const domain = domains[index % domains.length];
    const email = `testuser${index}@${domain}`;
    
    if (this.usedEmails.has(email)) {
      return `testuser${index}_${randomBytes(4).toString('hex')}@${domain}`;
    }
    
    this.usedEmails.add(email);
    return email;
  }

  private generateUniquePhone(): string {
    let phone: string;
    do {
      phone = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
    } while (this.usedPhones.has(phone));
    
    this.usedPhones.add(phone);
    return phone;
  }

  private generateRandomDate(): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 60); // 最近60天
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }
}

// 问卷数据生成器
class QuestionnaireDataGenerator {
  private weightedRandom<T>(weights: Record<string, number>): T {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return key as T;
      }
    }
    
    // 兜底返回第一个选项
    return Object.keys(weights)[0] as T;
  }

  private ensureConsistency(data: Partial<QuestionnaireResponse>): void {
    // 确保年龄与学历的一致性
    if (data.age && data.educationLevel) {
      const validEducations = CONSISTENCY_RULES.ageEducationConsistency[data.age];
      if (validEducations && !validEducations.includes(data.educationLevel)) {
        data.educationLevel = validEducations[Math.floor(Math.random() * validEducations.length)];
      }
    }

    // 确保学历与薪资的相关性
    if (data.educationLevel && data.currentSalary) {
      const validSalaries = CONSISTENCY_RULES.educationSalaryCorrelation[data.educationLevel];
      if (validSalaries && !validSalaries.includes(data.currentSalary)) {
        data.currentSalary = validSalaries[Math.floor(Math.random() * validSalaries.length)];
      }
    }
  }

  generateResponse(userId: string, completionType: 'full' | 'partial' | 'abandoned'): QuestionnaireResponse {
    const baseData: Partial<QuestionnaireResponse> = {
      id: `response_${randomBytes(8).toString('hex')}`,
      userId,
      questionnaireId: 'restructured-employment-survey-2024',
      isTestData: true,
      createdAt: this.generateRandomSubmissionDate(),
      updatedAt: new Date().toISOString(),
      status: completionType === 'full' ? 'completed' : 'in_progress'
    };

    // 第1页：基本信息 (所有类型都会填写)
    baseData.age = this.weightedRandom(REALISTIC_WEIGHTS['age-range']);
    baseData.gender = this.weightedRandom(REALISTIC_WEIGHTS['gender']);
    baseData.educationLevel = this.weightedRandom(REALISTIC_WEIGHTS['education-level']);
    baseData.majorField = this.weightedRandom(REALISTIC_WEIGHTS['major-field']);
    baseData.workLocationPreference = this.weightedRandom({
      'tier1': 0.35, 'new-tier1': 0.25, 'tier2': 0.20, 'tier3': 0.05, 'hometown': 0.10, 'flexible': 0.05
    });

    if (completionType === 'abandoned') {
      return baseData as QuestionnaireResponse;
    }

    // 第2页：状态识别
    baseData.currentStatus = this.weightedRandom(REALISTIC_WEIGHTS['current-status']);

    if (completionType === 'partial' && Math.random() < 0.3) {
      return baseData as QuestionnaireResponse;
    }

    // 第3页：差异化问卷
    this.generateStatusSpecificData(baseData);

    if (completionType === 'partial' && Math.random() < 0.5) {
      return baseData as QuestionnaireResponse;
    }

    // 第4页：通用问卷
    baseData.careerGoal = this.weightedRandom({
      'technical-expert': 0.20, 'management': 0.18, 'stable-job': 0.15, 'work-life-balance': 0.12,
      'high-income': 0.10, 'entrepreneurship': 0.08, 'social-impact': 0.07, 'undecided': 0.10
    });
    
    baseData.skillConfidence = this.weightedRandom({
      'confident': 0.35, 'neutral': 0.30, 'very-confident': 0.15, 'lacking': 0.15, 'very-lacking': 0.05
    });
    
    baseData.preferredWorkLocation = this.weightedRandom({
      'tier1': 0.30, 'new-tier1': 0.25, 'tier2': 0.20, 'hometown': 0.15, 'flexible': 0.10
    });
    
    baseData.employmentDifficulty = this.weightedRandom({
      'difficult': 0.40, 'moderate': 0.25, 'very-difficult': 0.20, 'easy': 0.10, 'very-easy': 0.05
    });

    // 第5页：建议反馈 (可选)
    if (Math.random() < 0.8) { // 80%的人会填写建议
      baseData.policySuggestions = this.generateMultipleChoice([
        'more-internships', 'skill-training', 'career-guidance', 'reduce-discrimination',
        'startup-support', 'salary-standards', 'job-matching', 'education-reform'
      ], 2, 4); // 选择2-4个建议
    }

    // 确保数据一致性
    this.ensureConsistency(baseData);

    return baseData as QuestionnaireResponse;
  }

  private generateStatusSpecificData(data: Partial<QuestionnaireResponse>): void {
    switch (data.currentStatus) {
      case 'employed':
        data.employmentType = this.weightedRandom({
          'fulltime': 0.70, 'parttime': 0.15, 'internship': 0.10, 'freelance': 0.05
        });
        data.currentSalary = this.weightedRandom({
          '5k-8k': 0.25, '8k-12k': 0.20, '3k-5k': 0.20, '12k-20k': 0.15, 'below-3k': 0.10, 'above-20k': 0.10
        });
        data.workIndustry = this.weightedRandom({
          'internet-tech': 0.25, 'finance': 0.15, 'manufacturing': 0.12, 'education': 0.10,
          'healthcare': 0.08, 'government': 0.15, 'other': 0.15
        });
        data.jobSatisfaction = this.weightedRandom({
          'satisfied': 0.35, 'neutral': 0.30, 'very-satisfied': 0.15, 'dissatisfied': 0.15, 'very-dissatisfied': 0.05
        });
        break;

      case 'unemployed':
        data.unemploymentDuration = this.weightedRandom({
          '1-3months': 0.30, '3-6months': 0.25, 'less-1month': 0.20, '6-12months': 0.15, 'fresh-graduate': 0.07, 'over-1year': 0.03
        });
        data.lastJobSalary = this.weightedRandom({
          '3k-5k': 0.25, '5k-8k': 0.20, 'never-worked': 0.15, 'below-3k': 0.15, '8k-12k': 0.15, '12k-20k': 0.07, 'above-20k': 0.03
        });
        data.jobSearchChannels = this.generateMultipleChoice([
          'online-platforms', 'social-media', 'campus-recruitment', 'referrals', 'headhunters', 'company-websites'
        ], 2, 4);
        data.jobSearchDifficulties = this.generateMultipleChoice([
          'lack-experience', 'skill-mismatch', 'high-competition', 'low-salary', 'location-mismatch', 'few-opportunities'
        ], 1, 3);
        break;

      case 'student':
        data.studyYear = this.weightedRandom({
          'junior': 0.25, 'senior': 0.25, 'sophomore': 0.20, 'graduate': 0.15, 'freshman': 0.10, 'phd': 0.05
        });
        data.careerPlanning = this.weightedRandom({
          'direct-employment': 0.35, 'continue-study': 0.25, 'civil-service': 0.15, 'undecided': 0.10,
          'study-abroad': 0.08, 'entrepreneurship': 0.07
        });
        data.internshipExperience = this.weightedRandom({
          'one': 0.30, 'two-three': 0.25, 'none': 0.25, 'multiple': 0.20
        });
        break;
    }
  }

  private generateMultipleChoice(options: string[], min: number, max: number): string[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private generateRandomSubmissionDate(): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 60); // 最近60天
    const hoursOffset = Math.floor(Math.random() * 24);
    const minutesOffset = Math.floor(Math.random() * 60);
    
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 + hoursOffset * 60 * 60 * 1000 + minutesOffset * 60 * 1000);
    return date.toISOString();
  }
}

// 数据类型定义
interface TestUser {
  id: string;
  email: string;
  phone: string;
  nickname: string;
  password: string;
  isTestData: boolean;
  createdAt: string;
  profile: {
    avatar: string | null;
    bio: string | null;
    location: string | null;
  };
}

interface QuestionnaireResponse {
  id: string;
  userId: string;
  questionnaireId: string;
  isTestData: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'completed' | 'in_progress';
  
  // 基本信息
  age?: string;
  gender?: string;
  educationLevel?: string;
  majorField?: string;
  workLocationPreference?: string;
  
  // 状态信息
  currentStatus?: string;
  
  // 就业相关
  employmentType?: string;
  currentSalary?: string;
  workIndustry?: string;
  jobSatisfaction?: string;
  
  // 求职相关
  unemploymentDuration?: string;
  lastJobSalary?: string;
  jobSearchChannels?: string[];
  jobSearchDifficulties?: string[];
  
  // 学生相关
  studyYear?: string;
  careerPlanning?: string;
  internshipExperience?: string;
  
  // 通用信息
  careerGoal?: string;
  skillConfidence?: string;
  preferredWorkLocation?: string;
  employmentDifficulty?: string;
  policySuggestions?: string[];
}

// 主生成函数
export function generateTestData(config: {
  userCount: number;
  responseCount: number;
  completionRates: { full: number; partial: number; abandoned: number };
}): { users: TestUser[]; responses: QuestionnaireResponse[] } {
  
  const userGenerator = new TestUserGenerator();
  const responseGenerator = new QuestionnaireDataGenerator();
  
  // 生成用户
  const users: TestUser[] = [];
  for (let i = 1; i <= config.userCount; i++) {
    users.push(userGenerator.generateUser(i));
  }
  
  // 生成问卷回答
  const responses: QuestionnaireResponse[] = [];
  for (let i = 0; i < config.responseCount; i++) {
    const userId = users[Math.floor(Math.random() * users.length)].id;
    
    // 根据完成率配置决定完成类型
    const random = Math.random();
    let completionType: 'full' | 'partial' | 'abandoned';
    
    if (random < config.completionRates.full) {
      completionType = 'full';
    } else if (random < config.completionRates.full + config.completionRates.partial) {
      completionType = 'partial';
    } else {
      completionType = 'abandoned';
    }
    
    responses.push(responseGenerator.generateResponse(userId, completionType));
  }
  
  return { users, responses };
}

// 默认配置
const DEFAULT_CONFIG = {
  userCount: 1500,
  responseCount: 2200,
  completionRates: {
    full: 0.70,
    partial: 0.25,
    abandoned: 0.05
  }
};

// 数据统计分析
export function analyzeGeneratedData(responses: QuestionnaireResponse[]): DataAnalysis {
  const analysis: DataAnalysis = {
    total: responses.length,
    byStatus: {},
    byAge: {},
    byEducation: {},
    byGender: {},
    completionRate: 0,
    fieldCoverage: {}
  };

  // 统计各维度分布
  responses.forEach(response => {
    // 状态分布
    if (response.currentStatus) {
      analysis.byStatus[response.currentStatus] = (analysis.byStatus[response.currentStatus] || 0) + 1;
    }

    // 年龄分布
    if (response.age) {
      analysis.byAge[response.age] = (analysis.byAge[response.age] || 0) + 1;
    }

    // 学历分布
    if (response.educationLevel) {
      analysis.byEducation[response.educationLevel] = (analysis.byEducation[response.educationLevel] || 0) + 1;
    }

    // 性别分布
    if (response.gender) {
      analysis.byGender[response.gender] = (analysis.byGender[response.gender] || 0) + 1;
    }
  });

  // 计算完成率
  const completedCount = responses.filter(r => r.status === 'completed').length;
  analysis.completionRate = (completedCount / responses.length) * 100;

  return analysis;
}

interface DataAnalysis {
  total: number;
  byStatus: Record<string, number>;
  byAge: Record<string, number>;
  byEducation: Record<string, number>;
  byGender: Record<string, number>;
  completionRate: number;
  fieldCoverage: Record<string, number>;
}

// 主执行函数
async function main() {
  console.log('🎲 开始生成测试数据...');

  const { users, responses } = generateTestData(DEFAULT_CONFIG);

  console.log(`✅ 生成完成:`);
  console.log(`   - 用户数量: ${users.length}`);
  console.log(`   - 问卷回答: ${responses.length}`);
  console.log(`   - 完整回答: ${responses.filter(r => r.status === 'completed').length}`);
  console.log(`   - 部分回答: ${responses.filter(r => r.status === 'in_progress').length}`);

  // 数据分析
  const analysis = analyzeGeneratedData(responses);
  console.log(`   - 完成率: ${analysis.completionRate.toFixed(1)}%`);

  // 输出到文件
  const fs = await import('fs');
  fs.writeFileSync('./test-users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('./test-responses.json', JSON.stringify(responses, null, 2));
  fs.writeFileSync('./data-analysis.json', JSON.stringify(analysis, null, 2));

  console.log('📁 数据已保存到 test-users.json、test-responses.json 和 data-analysis.json');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
