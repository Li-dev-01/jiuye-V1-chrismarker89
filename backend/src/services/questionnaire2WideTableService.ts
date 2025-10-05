/**
 * 问卷2宽表扁平化服务
 * 将嵌套的 sectionResponses 结构扁平化为宽表格式
 * 支持后续的多维度分析与派生表生成
 */

export interface WideTableRow {
  // 元数据字段
  response_id: string;
  questionnaire_id: string;
  created_at: number;
  start_time: number;
  end_time: number;
  total_time_spent: number;
  completion_path: string; // JSON string
  branching_decisions: string; // JSON string
  
  // 基础信息字段
  gender_v2?: string;
  age_range_v2?: string;
  education_level_v2?: string;
  marital_status_v2?: string;
  has_children_v2?: string;
  fertility_intent_v2?: string;
  current_city_tier_v2?: string;
  hukou_type_v2?: string;
  years_experience_v2?: string;
  
  // 当前状态字段
  current_status_question_v2?: string;
  
  // 经济压力字段
  debt_situation_v2?: string; // JSON array for checkbox
  monthly_debt_burden_v2?: string;
  economic_pressure_level_v2?: string;
  
  // 在职收入字段
  current_salary_v2?: string;
  salary_debt_ratio_v2?: string;
  
  // 求职歧视字段
  experienced_discrimination_types_v2?: string; // JSON array
  discrimination_severity_v2?: string;
  discrimination_channels_v2?: string; // JSON array
  discrimination_case_open_v2?: string; // text
  
  // 个人优势与忧虑字段
  personal_advantages_v2?: string; // text
  employment_concerns_v2?: string; // text
  support_needed_types_v2?: string; // JSON array
  support_needed_open_v2?: string; // text
  
  // 就业信心字段
  employment_confidence_6months_v2?: string;
  employment_confidence_1year_v2?: string;
  
  // 年龄歧视细化字段（条件显示）
  age_discrimination_frequency_v2?: string;
  career_transition_intent_v2?: string;
  age_advantage_perception_v2?: string; // JSON array
  
  // 婚育歧视细化字段（条件显示）
  marriage_inquiry_frequency_v2?: string;
  marriage_impact_perception_v2?: string;
  employer_requirements_v2?: string; // JSON array
  
  // 求职细节字段（条件显示）
  job_seeking_duration_v2?: string;
  applications_per_week_v2?: string;
  interview_conversion_v2?: string;
  channels_used_v2?: string; // JSON array
  offer_received_v2?: string;
  
  // 学生职业规划字段（条件显示）
  internship_experience_v2?: string;
  internship_difficulty_v2?: string;
  further_education_intent_v2?: string;
  career_preparation_v2?: string; // JSON array
}

export interface QuestionnaireV2Response {
  id: string;
  questionnaire_id: string;
  questionnaire: {
    section_responses: Array<{
      section_id: string;
      question_responses: Array<{
        question_id: string;
        value: any;
        timestamp: number;
      }>;
      completed_at: number;
      time_spent: number;
    }>;
    metadata: {
      start_time: number;
      end_time: number;
      total_time_spent: number;
      completion_path?: string[];
      branching_decisions?: Record<string, any>;
    };
  };
  created_at: string;
}

/**
 * 问卷2宽表扁平化服务类
 */
export class Questionnaire2WideTableService {
  /**
   * 将问卷2响应转换为宽表行
   */
  convertToWideTableRow(response: QuestionnaireV2Response): WideTableRow {
    const row: WideTableRow = {
      // 元数据
      response_id: response.id,
      questionnaire_id: response.questionnaire_id,
      created_at: new Date(response.created_at).getTime(),
      start_time: response.questionnaire.metadata.start_time,
      end_time: response.questionnaire.metadata.end_time,
      total_time_spent: response.questionnaire.metadata.total_time_spent,
      completion_path: JSON.stringify(response.questionnaire.metadata.completion_path || []),
      branching_decisions: JSON.stringify(response.questionnaire.metadata.branching_decisions || {}),
    };

    // 扁平化所有问题响应
    for (const section of response.questionnaire.section_responses) {
      for (const questionResponse of section.question_responses) {
        const columnName = this.questionIdToColumnName(questionResponse.question_id);
        const value = this.formatValue(questionResponse.value);
        (row as any)[columnName] = value;
      }
    }

    return row;
  }

  /**
   * 将 question_id 转换为列名（snake_case）
   */
  private questionIdToColumnName(questionId: string): string {
    // 已经是 snake_case 格式，直接使用
    return questionId.replace(/-/g, '_');
  }

  /**
   * 格式化值（数组转JSON字符串，文本保持原样）
   */
  private formatValue(value: any): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    
    if (Array.isArray(value)) {
      // 复选题：转为JSON数组字符串
      return JSON.stringify(value);
    }
    
    if (typeof value === 'object') {
      // 对象：转为JSON字符串
      return JSON.stringify(value);
    }
    
    // 字符串/数字：直接返回
    return String(value);
  }

  /**
   * 批量转换多个响应
   */
  convertBatch(responses: QuestionnaireV2Response[]): WideTableRow[] {
    return responses.map(response => this.convertToWideTableRow(response));
  }

  /**
   * 生成宽表的列定义（用于创建数据库表）
   */
  generateColumnDefinitions(): Record<string, string> {
    return {
      // 元数据列
      response_id: 'VARCHAR(255) PRIMARY KEY',
      questionnaire_id: 'VARCHAR(255)',
      created_at: 'BIGINT',
      start_time: 'BIGINT',
      end_time: 'BIGINT',
      total_time_spent: 'BIGINT',
      completion_path: 'TEXT',
      branching_decisions: 'TEXT',
      
      // 基础信息列
      gender_v2: 'VARCHAR(50)',
      age_range_v2: 'VARCHAR(50)',
      education_level_v2: 'VARCHAR(50)',
      marital_status_v2: 'VARCHAR(50)',
      has_children_v2: 'VARCHAR(50)',
      fertility_intent_v2: 'VARCHAR(50)',
      current_city_tier_v2: 'VARCHAR(50)',
      hukou_type_v2: 'VARCHAR(50)',
      years_experience_v2: 'VARCHAR(50)',
      
      // 当前状态列
      current_status_question_v2: 'VARCHAR(50)',
      
      // 经济压力列
      debt_situation_v2: 'TEXT', // JSON array
      monthly_debt_burden_v2: 'VARCHAR(50)',
      economic_pressure_level_v2: 'VARCHAR(50)',
      
      // 在职收入列
      current_salary_v2: 'VARCHAR(50)',
      salary_debt_ratio_v2: 'VARCHAR(50)',
      
      // 求职歧视列
      experienced_discrimination_types_v2: 'TEXT', // JSON array
      discrimination_severity_v2: 'VARCHAR(50)',
      discrimination_channels_v2: 'TEXT', // JSON array
      discrimination_case_open_v2: 'TEXT',
      
      // 个人优势与忧虑列
      personal_advantages_v2: 'TEXT',
      employment_concerns_v2: 'TEXT',
      support_needed_types_v2: 'TEXT', // JSON array
      support_needed_open_v2: 'TEXT',
      
      // 就业信心列
      employment_confidence_6months_v2: 'VARCHAR(50)',
      employment_confidence_1year_v2: 'VARCHAR(50)',
      
      // 年龄歧视细化列
      age_discrimination_frequency_v2: 'VARCHAR(50)',
      career_transition_intent_v2: 'VARCHAR(50)',
      age_advantage_perception_v2: 'TEXT', // JSON array
      
      // 婚育歧视细化列
      marriage_inquiry_frequency_v2: 'VARCHAR(50)',
      marriage_impact_perception_v2: 'VARCHAR(50)',
      employer_requirements_v2: 'TEXT', // JSON array
      
      // 求职细节列
      job_seeking_duration_v2: 'VARCHAR(50)',
      applications_per_week_v2: 'VARCHAR(50)',
      interview_conversion_v2: 'VARCHAR(50)',
      channels_used_v2: 'TEXT', // JSON array
      offer_received_v2: 'VARCHAR(50)',
      
      // 学生职业规划列
      internship_experience_v2: 'VARCHAR(50)',
      internship_difficulty_v2: 'VARCHAR(50)',
      further_education_intent_v2: 'VARCHAR(50)',
      career_preparation_v2: 'TEXT', // JSON array
    };
  }

  /**
   * 生成创建宽表的SQL语句（示例，适配具体数据库）
   */
  generateCreateTableSQL(tableName: string = 'questionnaire_v2_responses_wide'): string {
    const columns = this.generateColumnDefinitions();
    const columnDefs = Object.entries(columns)
      .map(([name, type]) => `  ${name} ${type}`)
      .join(',\n');
    
    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnDefs}\n);`;
  }
}

// 导出单例
export const questionnaire2WideTableService = new Questionnaire2WideTableService();

