/**
 * 问卷逻辑一致性验证工具
 * 用于检查问卷配置中的逻辑错误和不一致性
 */

import type { UniversalQuestionnaire, QuestionnaireSection, Question } from '../types/questionnaire';

export interface LogicValidationIssue {
  type: 'error' | 'warning' | 'info';
  section: string;
  question?: string;
  message: string;
  suggestion?: string;
}

export interface LogicValidationResult {
  isValid: boolean;
  issues: LogicValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * 问卷逻辑验证器
 */
export class QuestionnaireLogicValidator {
  private questionnaire: UniversalQuestionnaire;
  private issues: LogicValidationIssue[] = [];

  constructor(questionnaire: UniversalQuestionnaire) {
    this.questionnaire = questionnaire;
  }

  /**
   * 执行完整的逻辑验证
   */
  validate(): LogicValidationResult {
    this.issues = [];

    // 1. 检查重复的问题ID
    this.checkDuplicateQuestionIds();

    // 2. 检查条件分支逻辑
    this.checkConditionalLogic();

    // 3. 检查问题内容与条件的一致性
    this.checkContentConditionConsistency();

    // 4. 检查依赖关系
    this.checkDependencies();

    // 5. 检查数据类型一致性
    this.checkDataTypeConsistency();

    const summary = this.getSummary();

    return {
      isValid: summary.errors === 0,
      issues: this.issues,
      summary
    };
  }

  /**
   * 检查重复的问题ID
   */
  private checkDuplicateQuestionIds(): void {
    const questionIds = new Map<string, string[]>();

    this.questionnaire.sections.forEach(section => {
      section.questions.forEach(question => {
        if (!questionIds.has(question.id)) {
          questionIds.set(question.id, []);
        }
        questionIds.get(question.id)!.push(section.id);
      });
    });

    questionIds.forEach((sectionIds, questionId) => {
      if (sectionIds.length > 1) {
        this.addIssue({
          type: 'error',
          section: sectionIds.join(', '),
          question: questionId,
          message: `问题ID "${questionId}" 在多个section中重复使用`,
          suggestion: '为每个问题使用唯一的ID，可以添加section前缀'
        });
      }
    });
  }

  /**
   * 检查条件分支逻辑
   */
  private checkConditionalLogic(): void {
    this.questionnaire.sections.forEach(section => {
      if (section.condition) {
        this.validateSectionCondition(section);
      }

      section.questions.forEach(question => {
        if (question.condition) {
          this.validateQuestionCondition(section, question);
        }
      });
    });
  }

  /**
   * 检查问题内容与条件的一致性
   */
  private checkContentConditionConsistency(): void {
    this.questionnaire.sections.forEach(section => {
      if (section.condition) {
        this.checkSectionContentConsistency(section);
      }
    });
  }

  /**
   * 检查section内容与条件的一致性
   */
  private checkSectionContentConsistency(section: QuestionnaireSection): void {
    const condition = section.condition;
    if (!condition) return;

    // 检查失业相关section中的问题
    if (this.isUnemploymentCondition(condition)) {
      section.questions.forEach(question => {
        if (this.isCurrentJobQuestion(question)) {
          this.addIssue({
            type: 'error',
            section: section.id,
            question: question.id,
            message: `失业人员section中不应包含"当前工作"相关问题: "${question.title}"`,
            suggestion: '将问题改为"上一份工作"或"期望工作"相关'
          });
        }

        if (this.isCurrentSalaryQuestion(question)) {
          this.addIssue({
            type: 'error',
            section: section.id,
            question: question.id,
            message: `失业人员section中不应包含"当前薪资"问题: "${question.title}"`,
            suggestion: '改为"上一份工作薪资"或"期望薪资"'
          });
        }
      });
    }

    // 检查学生相关section中的问题
    if (this.isStudentCondition(condition)) {
      section.questions.forEach(question => {
        if (this.isWorkExperienceQuestion(question)) {
          this.addIssue({
            type: 'warning',
            section: section.id,
            question: question.id,
            message: `学生section中包含工作经验问题可能不合适: "${question.title}"`,
            suggestion: '考虑改为实习经验或兼职经验'
          });
        }
      });
    }

    // 检查在职人员section中的问题
    if (this.isEmployedCondition(condition)) {
      section.questions.forEach(question => {
        if (this.isJobSearchQuestion(question)) {
          this.addIssue({
            type: 'warning',
            section: section.id,
            question: question.id,
            message: `在职人员section中包含求职问题: "${question.title}"`,
            suggestion: '考虑改为职业发展或跳槽意向相关问题'
          });
        }
      });
    }
  }

  /**
   * 检查依赖关系
   */
  private checkDependencies(): void {
    const allQuestionIds = new Set<string>();
    
    this.questionnaire.sections.forEach(section => {
      section.questions.forEach(question => {
        allQuestionIds.add(question.id);
      });
    });

    this.questionnaire.sections.forEach(section => {
      if (section.condition && section.condition.dependsOn) {
        const dependsOn = Array.isArray(section.condition.dependsOn) 
          ? section.condition.dependsOn 
          : [section.condition.dependsOn];

        dependsOn.forEach(dep => {
          if (!allQuestionIds.has(dep)) {
            this.addIssue({
              type: 'error',
              section: section.id,
              message: `Section依赖的问题ID "${dep}" 不存在`,
              suggestion: '检查问题ID是否正确或确保依赖的问题已定义'
            });
          }
        });
      }
    });
  }

  /**
   * 检查数据类型一致性
   */
  private checkDataTypeConsistency(): void {
    this.questionnaire.sections.forEach(section => {
      section.questions.forEach(question => {
        // 检查选项值的一致性
        if (question.options) {
          const values = question.options.map(opt => opt.value);
          const uniqueValues = new Set(values);
          
          if (values.length !== uniqueValues.size) {
            this.addIssue({
              type: 'error',
              section: section.id,
              question: question.id,
              message: `问题选项中存在重复的value值`,
              suggestion: '确保每个选项的value值唯一'
            });
          }
        }
      });
    });
  }

  // 辅助方法
  private isUnemploymentCondition(condition: any): boolean {
    return condition.value === 'unemployed' || 
           condition.value === 'job-seeking' ||
           (condition.conditions && condition.conditions.some((c: any) => 
             c.value === 'unemployed' || c.value === 'job-seeking'
           ));
  }

  private isStudentCondition(condition: any): boolean {
    return condition.value === 'student';
  }

  private isEmployedCondition(condition: any): boolean {
    return condition.value === 'employed' || 
           condition.value === 'fulltime' || 
           condition.value === 'parttime';
  }

  private isCurrentJobQuestion(question: Question): boolean {
    const keywords = ['当前工作', '目前工作', '现在工作', '所在公司', '当前职位'];
    return keywords.some(keyword => question.title.includes(keyword));
  }

  private isCurrentSalaryQuestion(question: Question): boolean {
    const keywords = ['当前薪资', '目前薪资', '现在薪资', '当前月薪', '目前月薪'];
    return keywords.some(keyword => question.title.includes(keyword));
  }

  private isWorkExperienceQuestion(question: Question): boolean {
    const keywords = ['工作经验', '工作年限', '从业经历'];
    return keywords.some(keyword => question.title.includes(keyword));
  }

  private isJobSearchQuestion(question: Question): boolean {
    const keywords = ['求职', '找工作', '面试', '投简历'];
    return keywords.some(keyword => question.title.includes(keyword));
  }

  private validateSectionCondition(section: QuestionnaireSection): void {
    // 这里可以添加更多的section条件验证逻辑
  }

  private validateQuestionCondition(section: QuestionnaireSection, question: Question): void {
    // 这里可以添加更多的问题条件验证逻辑
  }

  private addIssue(issue: LogicValidationIssue): void {
    this.issues.push(issue);
  }

  private getSummary() {
    return {
      errors: this.issues.filter(i => i.type === 'error').length,
      warnings: this.issues.filter(i => i.type === 'warning').length,
      info: this.issues.filter(i => i.type === 'info').length
    };
  }
}

/**
 * 验证问卷逻辑一致性
 */
export function validateQuestionnaireLogic(questionnaire: UniversalQuestionnaire): LogicValidationResult {
  const validator = new QuestionnaireLogicValidator(questionnaire);
  return validator.validate();
}
