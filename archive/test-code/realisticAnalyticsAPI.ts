/**
 * 基于实际问卷数据的分析API
 * 只提供问卷中真实存在的数据维度
 */

// 基于实际问卷的数据类型定义
export interface QuestionnaireResponse {
  // 第1页：个人基本信息
  educationLevel: 'high-school' | 'junior-college' | 'bachelor' | 'master' | 'phd';
  majorField: 'engineering' | 'science' | 'medicine' | 'agriculture' | 'management' | 'economics' | 'law' | 'education' | 'literature' | 'history' | 'philosophy' | 'art';
  graduationYear: '2024' | '2023' | '2022' | '2021' | '2020' | 'before-2020';
  gender: 'male' | 'female' | 'other' | 'prefer-not-say';
  ageRange: 'under-20' | '20-22' | '23-25' | '26-28' | '29-35' | 'over-35';
  universityTier: '985' | '211' | 'double-first-class' | 'regular-public' | 'private' | 'vocational' | 'overseas';
  
  // 第2页：就业现状
  currentStatus: 'fulltime' | 'parttime' | 'internship' | 'freelance' | 'unemployed' | 'student' | 'preparing';
  jobSatisfaction?: '1' | '2' | '3' | '4' | '5';
  currentSalary?: 'below-3k' | '3k-5k' | '5k-8k' | '8k-12k' | '12k-20k' | '20k-30k' | 'above-30k';
  workIndustry?: 'internet-tech' | 'finance' | 'education' | 'healthcare' | 'manufacturing' | 'real-estate' | 'government' | 'media' | 'retail' | 'logistics' | 'other';
  workLocation?: string;
  majorMatch?: '1' | '2' | '3' | '4' | '5';
  
  // 第3页：求职经历
  unemploymentDuration?: 'within-3months' | '3-6months' | '6-12months' | 'over-1year' | 'never-unemployed';
  jobHuntingDifficulties?: string[]; // 多选
  jobSearchChannels?: string[]; // 多选
  interviewCount?: 'none' | '1-3' | '4-10' | '11-20' | 'over-20';
  resumeCount?: 'under-10' | '10-50' | '51-100' | '101-200' | 'over-200';
  jobSearchCost?: 'under-1k' | '1k-3k' | '3k-5k' | '5k-10k' | 'over-10k';
}

// 统计数据类型
export interface StatisticsData {
  totalResponses: number;
  lastUpdated: string;
  
  // 基础分布统计
  educationDistribution: Array<{ label: string; value: number; percentage: number }>;
  majorDistribution: Array<{ label: string; value: number; percentage: number }>;
  employmentStatusDistribution: Array<{ label: string; value: number; percentage: number }>;
  salaryDistribution: Array<{ label: string; value: number; percentage: number }>;
  industryDistribution: Array<{ label: string; value: number; percentage: number }>;
  
  // 详细交叉分析（匿名数据无隐私限制）
  employmentByEducation: Array<{
    education: string;
    employed: number;
    unemployed: number;
    total: number;
    employmentRate: number;
  }>;

  // 性别就业分析
  employmentByGender: Array<{
    gender: string;
    employed: number;
    unemployed: number;
    total: number;
    employmentRate: number;
    avgSatisfaction: number;
  }>;

  // 院校类型详细分析
  universityTypeAnalysis: Array<{
    universityType: string;
    totalStudents: number;
    employmentRate: number;
    topSalaryRange: string;
    avgSatisfaction: number;
    topIndustries: string[];
  }>;

  // 专业-薪资交叉分析
  majorSalaryMatrix: Array<{
    major: string;
    salaryDistribution: Record<string, number>;
    avgSatisfactionByRange: Record<string, number>;
    employmentRate: number;
  }>;
  
  salaryByMajor: Array<{
    major: string;
    salaryRanges: Array<{ range: string; count: number; percentage: number }>;
    medianRange: string;
  }>;
  
  // 求职困难统计
  jobDifficulties: Array<{
    difficulty: string;
    count: number;
    percentage: number;
  }>;
  
  // 求职渠道效果
  jobChannels: Array<{
    channel: string;
    usage: number;
    usageRate: number;
  }>;
}

// 现实的API服务
export class RealisticAnalyticsAPI {
  private baseUrl = '/api/analytics';
  
  /**
   * 获取基础统计数据
   */
  async getBasicStatistics(): Promise<StatisticsData> {
    const response = await fetch(`${this.baseUrl}/basic-stats`);
    return response.json();
  }
  
  /**
   * 获取就业状况分析
   */
  async getEmploymentAnalysis(filters?: {
    educationLevel?: string;
    majorField?: string;
    graduationYear?: string;
  }): Promise<{
    employmentRate: number;
    unemploymentRate: number;
    averageSalaryRange: string;
    topIndustries: Array<{ industry: string; percentage: number }>;
    satisfactionScore: number;
  }> {
    const params = new URLSearchParams(filters || {});
    const response = await fetch(`${this.baseUrl}/employment?${params}`);
    return response.json();
  }
  
  /**
   * 获取专业分析
   */
  async getMajorAnalysis(): Promise<Array<{
    major: string;
    totalResponses: number;
    employmentRate: number;
    topSalaryRange: string;
    topIndustries: string[];
    averageSatisfaction: number;
  }>> {
    const response = await fetch(`${this.baseUrl}/majors`);
    return response.json();
  }
  
  /**
   * 获取求职困难分析
   */
  async getJobHuntingChallenges(): Promise<{
    topDifficulties: Array<{ difficulty: string; percentage: number }>;
    averageJobSearchDuration: string;
    averageInterviewCount: string;
    averageResumeCount: string;
    effectiveChannels: Array<{ channel: string; effectiveness: number }>;
  }> {
    const response = await fetch(`${this.baseUrl}/job-hunting`);
    return response.json();
  }
  
  /**
   * 获取院校类型对比
   */
  async getUniversityComparison(): Promise<Array<{
    universityType: string;
    employmentRate: number;
    topSalaryRange: string;
    averageSatisfaction: number;
    sampleSize: number;
  }>> {
    const response = await fetch(`${this.baseUrl}/universities`);
    return response.json();
  }
  
  /**
   * 获取地区分析（基于工作地点）
   */
  async getLocationAnalysis(): Promise<Array<{
    location: string;
    jobCount: number;
    percentage: number;
    topIndustries: string[];
  }>> {
    const response = await fetch(`${this.baseUrl}/locations`);
    return response.json();
  }
}

// 注意：MockDataGenerator 已被移除，现在使用真实API数据
// 如需测试数据，请使用后端的测试数据生成接口

// 数据分析工具
export class DataAnalyzer {
  /**
   * 分析问卷数据并生成统计结果
   */
  analyzeData(responses: QuestionnaireResponse[]): StatisticsData {
    const total = responses.length;
    
    return {
      totalResponses: total,
      lastUpdated: new Date().toISOString(),
      
      educationDistribution: this.calculateDistribution(responses, 'educationLevel'),
      majorDistribution: this.calculateDistribution(responses, 'majorField'),
      employmentStatusDistribution: this.calculateDistribution(responses, 'currentStatus'),
      salaryDistribution: this.calculateDistribution(responses.filter(r => r.currentSalary), 'currentSalary'),
      industryDistribution: this.calculateDistribution(responses.filter(r => r.workIndustry), 'workIndustry'),
      
      employmentByEducation: this.analyzeEmploymentByEducation(responses),
      employmentByGender: this.analyzeEmploymentByGender(responses),
      universityTypeAnalysis: this.analyzeUniversityTypes(responses),
      majorSalaryMatrix: this.analyzeMajorSalaryMatrix(responses),
      salaryByMajor: this.analyzeSalaryByMajor(responses),
      jobDifficulties: this.analyzeJobDifficulties(responses),
      jobChannels: this.analyzeJobChannels(responses)
    };
  }
  
  private calculateDistribution(data: any[], field: string) {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const value = item[field];
      if (value) counts[value] = (counts[value] || 0) + 1;
    });
    
    const total = data.length;
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      percentage: Math.round((value / total) * 100 * 10) / 10
    }));
  }
  
  private analyzeEmploymentByEducation(responses: QuestionnaireResponse[]) {
    const groups: Record<string, { employed: number; unemployed: number; total: number }> = {};

    responses.forEach(r => {
      if (!groups[r.educationLevel]) {
        groups[r.educationLevel] = { employed: 0, unemployed: 0, total: 0 };
      }
      groups[r.educationLevel].total++;
      if (r.currentStatus === 'fulltime' || r.currentStatus === 'parttime') {
        groups[r.educationLevel].employed++;
      } else if (r.currentStatus === 'unemployed') {
        groups[r.educationLevel].unemployed++;
      }
    });

    return Object.entries(groups).map(([education, data]) => ({
      education,
      ...data,
      employmentRate: Math.round((data.employed / data.total) * 100 * 10) / 10
    }));
  }

  private analyzeEmploymentByGender(responses: QuestionnaireResponse[]) {
    const groups: Record<string, { employed: number; unemployed: number; total: number; satisfactionSum: number; satisfactionCount: number }> = {};

    responses.forEach(r => {
      if (!groups[r.gender]) {
        groups[r.gender] = { employed: 0, unemployed: 0, total: 0, satisfactionSum: 0, satisfactionCount: 0 };
      }
      groups[r.gender].total++;

      if (r.currentStatus === 'fulltime' || r.currentStatus === 'parttime') {
        groups[r.gender].employed++;
        if (r.jobSatisfaction) {
          groups[r.gender].satisfactionSum += parseInt(r.jobSatisfaction);
          groups[r.gender].satisfactionCount++;
        }
      } else if (r.currentStatus === 'unemployed') {
        groups[r.gender].unemployed++;
      }
    });

    return Object.entries(groups).map(([gender, data]) => ({
      gender,
      employed: data.employed,
      unemployed: data.unemployed,
      total: data.total,
      employmentRate: Math.round((data.employed / data.total) * 100 * 10) / 10,
      avgSatisfaction: data.satisfactionCount > 0 ? Math.round((data.satisfactionSum / data.satisfactionCount) * 10) / 10 : 0
    }));
  }

  private analyzeUniversityTypes(responses: QuestionnaireResponse[]) {
    const groups: Record<string, {
      total: number;
      employed: number;
      salaries: string[];
      satisfactionSum: number;
      satisfactionCount: number;
      industries: string[];
    }> = {};

    responses.forEach(r => {
      if (!groups[r.universityTier]) {
        groups[r.universityTier] = {
          total: 0,
          employed: 0,
          salaries: [],
          satisfactionSum: 0,
          satisfactionCount: 0,
          industries: []
        };
      }

      groups[r.universityTier].total++;

      if (r.currentStatus === 'fulltime' || r.currentStatus === 'parttime') {
        groups[r.universityTier].employed++;

        if (r.currentSalary) {
          groups[r.universityTier].salaries.push(r.currentSalary);
        }

        if (r.jobSatisfaction) {
          groups[r.universityTier].satisfactionSum += parseInt(r.jobSatisfaction);
          groups[r.universityTier].satisfactionCount++;
        }

        if (r.workIndustry) {
          groups[r.universityTier].industries.push(r.workIndustry);
        }
      }
    });

    return Object.entries(groups).map(([universityType, data]) => ({
      universityType,
      totalStudents: data.total,
      employmentRate: Math.round((data.employed / data.total) * 100 * 10) / 10,
      topSalaryRange: this.findTopSalaryRange(data.salaries),
      avgSatisfaction: data.satisfactionCount > 0 ? Math.round((data.satisfactionSum / data.satisfactionCount) * 10) / 10 : 0,
      topIndustries: this.findTopIndustries(data.industries, 3)
    }));
  }

  private analyzeMajorSalaryMatrix(responses: QuestionnaireResponse[]) {
    const groups: Record<string, {
      salaries: string[];
      satisfactionByRange: Record<string, { sum: number; count: number }>;
      employed: number;
      total: number;
    }> = {};

    responses.forEach(r => {
      if (!groups[r.majorField]) {
        groups[r.majorField] = {
          salaries: [],
          satisfactionByRange: {},
          employed: 0,
          total: 0
        };
      }

      groups[r.majorField].total++;

      if (r.currentStatus === 'fulltime' || r.currentStatus === 'parttime') {
        groups[r.majorField].employed++;

        if (r.currentSalary) {
          groups[r.majorField].salaries.push(r.currentSalary);

          if (r.jobSatisfaction) {
            if (!groups[r.majorField].satisfactionByRange[r.currentSalary]) {
              groups[r.majorField].satisfactionByRange[r.currentSalary] = { sum: 0, count: 0 };
            }
            groups[r.majorField].satisfactionByRange[r.currentSalary].sum += parseInt(r.jobSatisfaction);
            groups[r.majorField].satisfactionByRange[r.currentSalary].count++;
          }
        }
      }
    });

    return Object.entries(groups).map(([major, data]) => {
      const salaryDistribution: Record<string, number> = {};
      data.salaries.forEach(salary => {
        salaryDistribution[salary] = (salaryDistribution[salary] || 0) + 1;
      });

      const avgSatisfactionByRange: Record<string, number> = {};
      Object.entries(data.satisfactionByRange).forEach(([range, satisfaction]) => {
        avgSatisfactionByRange[range] = Math.round((satisfaction.sum / satisfaction.count) * 10) / 10;
      });

      return {
        major,
        salaryDistribution,
        avgSatisfactionByRange,
        employmentRate: Math.round((data.employed / data.total) * 100 * 10) / 10
      };
    });
  }

  private findTopSalaryRange(salaries: string[]): string {
    if (salaries.length === 0) return '暂无数据';
    const counts: Record<string, number> = {};
    salaries.forEach(s => counts[s] = (counts[s] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || '暂无数据';
  }

  private findTopIndustries(industries: string[], limit: number): string[] {
    const counts: Record<string, number> = {};
    industries.forEach(i => counts[i] = (counts[i] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, limit).map(([industry]) => industry);
  }
  
  private analyzeSalaryByMajor(responses: QuestionnaireResponse[]) {
    const groups: Record<string, string[]> = {};
    
    responses.forEach(r => {
      if (r.currentSalary && r.majorField) {
        if (!groups[r.majorField]) groups[r.majorField] = [];
        groups[r.majorField].push(r.currentSalary);
      }
    });
    
    return Object.entries(groups).map(([major, salaries]) => {
      const distribution = this.calculateDistribution(salaries.map(s => ({ salary: s })), 'salary');
      return {
        major,
        salaryRanges: distribution,
        medianRange: this.findMedianSalaryRange(salaries)
      };
    });
  }
  
  private analyzeJobDifficulties(responses: QuestionnaireResponse[]) {
    const difficulties: Record<string, number> = {};
    let totalSelections = 0;
    
    responses.forEach(r => {
      if (r.jobHuntingDifficulties) {
        r.jobHuntingDifficulties.forEach(difficulty => {
          difficulties[difficulty] = (difficulties[difficulty] || 0) + 1;
          totalSelections++;
        });
      }
    });
    
    return Object.entries(difficulties).map(([difficulty, count]) => ({
      difficulty,
      count,
      percentage: Math.round((count / totalSelections) * 100 * 10) / 10
    }));
  }
  
  private analyzeJobChannels(responses: QuestionnaireResponse[]) {
    const channels: Record<string, number> = {};
    let totalUsers = 0;
    
    responses.forEach(r => {
      if (r.jobSearchChannels && r.jobSearchChannels.length > 0) {
        totalUsers++;
        r.jobSearchChannels.forEach(channel => {
          channels[channel] = (channels[channel] || 0) + 1;
        });
      }
    });
    
    return Object.entries(channels).map(([channel, usage]) => ({
      channel,
      usage,
      usageRate: Math.round((usage / totalUsers) * 100 * 10) / 10
    }));
  }
  
  private findMedianSalaryRange(salaries: string[]): string {
    // 简化的中位数计算，实际应该根据薪资区间排序
    const counts: Record<string, number> = {};
    salaries.forEach(s => counts[s] = (counts[s] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'unknown';
  }
}
