/**
 * 第二问卷定义 - 完全独立的问卷系统
 * 基于差异化群体分析的深度就业调研问卷
 * 与第一问卷完全独立，仅共用用户认证系统
 */

import type { UniversalQuestionnaire } from '../types/universal-questionnaire';

export const secondQuestionnaire2024: UniversalQuestionnaire = {
  id: 'employmentSurvey2024',
  title: '2025年智能就业调查（第二版）',
  description: '基于差异化群体分析的深度就业调研问卷，采用H5对话式交互体验',
  
  sections: [
    // 第1部分：群体识别（关键分支点）
    {
      id: 'participantClassification',
      title: '身份确认',
      description: '请选择最符合您当前情况的身份，后续问题将据此个性化定制',
      metadata: {
        estimatedTime: 30,
        cognitiveLoad: 'low',
        priority: 'critical',
        branchingPoint: true
      },
      questions: [
        {
          id: 'participantGroup',
          type: 'radio',
          title: '请选择您目前的身份类型',
          description: '这将决定您后续看到的问题类型，我们会为不同群体提供个性化的问题',
          required: true,
          options: [
            {
              value: 'fresh_graduate',
              label: '应届毕业生',
              description: '在毕业学年或毕业后规定期限内，首次面临就业市场，拥有应届生身份'
            },
            {
              value: 'junior_professional',
              label: '职场新人期（往届毕业生）',
              description: '毕业1-5年内，已失去应届生身份，但工作经验尚浅或经历过短期就业后失业'
            },
            {
              value: 'senior_professional',
              label: '职业发展期（往届毕业生）',
              description: '毕业6年以上，通常有一定年限的工作经验，但因各种原因面临就业挑战'
            }
          ],
          statistics: {
            enabled: true,
            chartType: 'donut',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: [
              'fresh-graduate-details',
              'juniorProfessionalDetails',
              'seniorProfessionalDetails'
            ]
          }
        }
      ]
    },
        {
          id: 'educationLevel',
          type: 'radio',
          title: '您的最高学历是？',
          description: '用于分析不同教育背景的就业情况',
          required: true,
          options: [
            { value: 'high-school', label: '高中/中专及以下' },
            { value: 'junior-college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士研究生' },
            { value: 'phd', label: '博士研究生' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          }
        },
        {
          id: 'unemploymentDuration',
          type: 'radio',
          title: '您当前的失业时长是？',
          description: '请选择最接近的时间段',
          required: true,
          options: [
            { value: 'less-1month', label: '不到1个月' },
            { value: '1-3months', label: '1-3个月' },
            { value: '3-6months', label: '3-6个月' },
            { value: '6-12months', label: '6个月-1年' },
            { value: '1-2years', label: '1-2年' },
            { value: 'over-2years', label: '2年以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },
    
    // 第3部分：应届毕业生专属问题
    {
      id: 'fresh_graduate_details',
      title: '应届毕业生就业情况',
      description: '了解应届毕业生的就业困境、期望与现实的差距',
      condition: {
        dependsOn: 'participantGroup',
        operator: 'equals',
        value: 'fresh_graduate'
      },
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        targetAudience: 'fresh-graduates'
      },
      questions: [
        {
          id: 'graduationTimeline',
          type: 'radio',
          title: '您的毕业时间是？',
          required: true,
          options: [
            { value: 'current_year', label: '今年毕业' },
            { value: 'last_year', label: '去年毕业' },
            { value: 'within_two_years', label: '两年内毕业' }
          ]
        },
        {
          id: 'job-search_preparation',
          type: 'checkbox',
          title: '您在校期间做了哪些就业准备？（可多选）',
          description: '了解学生的就业准备情况',
          required: true,
          options: [
            { value: 'internship_experience', label: '参加实习' },
            { value: 'career_planning', label: '职业规划咨询' },
            { value: 'skill_training', label: '技能培训和认证' },
            { value: 'resume_preparation', label: '简历制作和优化' },
            { value: 'interview_training', label: '面试技巧培训' },
            { value: 'networking', label: '人脉建设和社交' },
            { value: 'graduate_exam', label: '准备考研' },
            { value: 'civil_service', label: '准备公务员考试' },
            { value: 'none', label: '没有特别准备' }
          ],
          config: {
            maxSelections: 5
          }
        },
        {
          id: 'employmentExpectations',
          type: 'checkbox',
          title: '您对第一份工作的主要期望是？（可多选）',
          required: true,
          options: [
            { value: 'high_salary', label: '薪资待遇优厚' },
            { value: 'career_development', label: '职业发展空间大' },
            { value: 'work_life_balance', label: '工作生活平衡' },
            { value: 'company_reputation', label: '公司知名度高' },
            { value: 'skill_learning', label: '能学到专业技能' },
            { value: 'job_stability', label: '工作稳定性' },
            { value: 'location_preference', label: '工作地点理想' }
          ]
        }
      ]
    },
    
    // 第4部分：职场新人期专属问题  
    {
      id: 'junior-professional_details',
      title: '职场新人期就业情况',
      description: '了解职场新人的转型困难、身份劣势和发展需求',
      condition: {
        dependsOn: 'participantGroup',
        operator: 'equals', 
        value: 'junior_professional'
      },
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        targetAudience: 'junior-professionals'
      },
      questions: [
        {
          id: 'work-experience_years',
          type: 'radio',
          title: '您有多少年全职工作经验？',
          required: true,
          options: [
            { value: 'less_than_1', label: '不到1年' },
            { value: '1_to_2', label: '1-2年' },
            { value: '2_to_3', label: '2-3年' },
            { value: '3_to_5', label: '3-5年' }
          ]
        },
        {
          id: 'graduate_status_impact',
          type: 'radio',
          title: '您认为失去"应届生"身份对您的求职影响有多大？',
          description: '1分为无影响，5分为影响很大',
          required: true,
          options: [
            { value: '1', label: '1分 - 无影响' },
            { value: '2', label: '2分 - 影响较小' },
            { value: '3', label: '3分 - 影响适中' },
            { value: '4', label: '4分 - 影响较大' },
            { value: '5', label: '5分 - 影响很大' }
          ]
        },
        {
          id: 'career-transition_challenges',
          type: 'checkbox',
          title: '您在职业发展中遇到的主要困难是？（可多选）',
          required: true,
          options: [
            { value: 'skill_gap', label: '技能与市场需求不匹配' },
            { value: 'career_direction', label: '职业方向不明确' },
            { value: 'promotion_difficulty', label: '晋升机会有限' },
            { value: 'salary_growth', label: '薪资增长缓慢' },
            { value: 'work_life_balance', label: '工作生活平衡困难' },
            { value: 'industry_change', label: '行业变化快，难以适应' },
            { value: 'job_hopping_stigma', label: '频繁跳槽导致求职困难' }
          ]
        }
      ]
    },

    // 第5部分：职业发展期专属问题
    {
      id: 'senior-professional_details',
      title: '职业发展期就业情况',
      description: '了解资深职场人士面临的挑战、年龄歧视和家庭压力',
      condition: {
        dependsOn: 'participantGroup',
        operator: 'equals',
        value: 'senior_professional'
      },
      metadata: {
        estimatedTime: 150,
        cognitiveLoad: 'medium',
        targetAudience: 'senior-professionals'
      },
      questions: [
        {
          id: 'careerLevel',
          type: 'radio',
          title: '您失业前主要担任的岗位级别是？',
          required: true,
          options: [
            { value: 'basic_employee', label: '基层员工' },
            { value: 'senior_specialist', label: '资深专业人士' },
            { value: 'team_leader', label: '团队负责人/中层管理' },
            { value: 'senior_management', label: '高层管理' }
          ]
        },
        {
          id: 'age_discrimination_perception',
          type: 'radio',
          title: '您认为"年龄"在您的求职过程中造成了多大阻碍？',
          description: '1分为无阻碍，5分为巨大阻碍',
          required: true,
          options: [
            { value: '1', label: '1分 - 无阻碍' },
            { value: '2', label: '2分 - 阻碍较小' },
            { value: '3', label: '3分 - 阻碍适中' },
            { value: '4', label: '4分 - 阻碍较大' },
            { value: '5', label: '5分 - 巨大阻碍' }
          ]
        },
        {
          id: 'family_financial_pressure',
          type: 'checkbox',
          title: '您目前承担的家庭经济责任有？（可多选）',
          required: true,
          options: [
            { value: 'mortgage', label: '房贷' },
            { value: 'car_loan', label: '车贷' },
            { value: 'children_education', label: '子女教育费用' },
            { value: 'elderly_care', label: '赡养老人' },
            { value: 'family_living', label: '家庭日常开销' },
            { value: 'medical_expenses', label: '医疗费用' },
            { value: 'none', label: '无特别经济压力' }
          ]
        },
        {
          id: 'salary_reduction_acceptance',
          type: 'radio',
          title: '为了尽快再就业，您愿意接受的薪资降幅最大是多少？',
          required: true,
          options: [
            { value: 'no_reduction', label: '不接受降薪' },
            { value: 'within_10', label: '10%以内' },
            { value: '10_to_20', label: '10%-20%' },
            { value: '20_to_30', label: '20%-30%' },
            { value: 'over_30', label: '30%以上' }
          ]
        }
      ]
    },

    // 第6部分：通用心理状态与支持需求
    {
      id: 'psychological-support_analysis',
      title: '心理状态与支持需求',
      description: '了解失业期间的心理状态和最需要的帮助',
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        priority: 'high'
      },
      questions: [
        {
          id: 'emotional_state',
          type: 'checkbox',
          title: '在失业期间，您最常感受到以下哪种情绪？（可多选）',
          required: true,
          options: [
            { value: 'anxiety', label: '焦虑' },
            { value: 'depression', label: '沮丧/抑郁' },
            { value: 'confusion', label: '迷茫' },
            { value: 'financial_pressure', label: '经济压力' },
            { value: 'confidence_loss', label: '自信心受挫' },
            { value: 'anger', label: '愤怒/不公感' },
            { value: 'calm_planning', label: '平静/积极规划' },
            { value: 'hopeful', label: '充满希望' }
          ]
        },
        {
          id: 'support_needs',
          type: 'checkbox',
          title: '您最希望获得哪些方面的支持以帮助您再就业？（可多选）',
          required: true,
          options: [
            { value: 'job_information', label: '就业信息/岗位推荐' },
            { value: 'career_guidance', label: '职业规划指导' },
            { value: 'skill_training', label: '技能培训/再教育' },
            { value: 'interview_coaching', label: '面试辅导/简历优化' },
            { value: 'psychological_support', label: '心理咨询/情绪支持' },
            { value: 'entrepreneurship_support', label: '创业扶持' },
            { value: 'financial_aid', label: '经济补贴/生活援助' },
            { value: 'policy_consultation', label: '政策咨询' }
          ]
        }
      ]
    },

    // 第7部分：基础信息（移到最后）
    {
      id: 'commonDemographics',
      title: '基础信息',
      description: '请提供一些基本信息，用于统计分析',
      metadata: {
        estimatedTime: 60,
        cognitiveLoad: 'low',
        priority: 'high'
      },
      questions: [
        {
          id: 'ageRange',
          type: 'radio',
          title: '您的年龄段是？',
          description: '用于了解不同年龄群体的就业特点',
          required: true,
          options: [
            { value: '18-22', label: '18-22岁' },
            { value: '23-25', label: '23-25岁' },
            { value: '26-28', label: '26-28岁' },
            { value: '29-35', label: '29-35岁' },
            { value: '36-40', label: '36-40岁' },
            { value: 'over-40', label: '40岁以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'educationLevel',
          type: 'radio',
          title: '您的最高学历是？',
          description: '用于分析不同教育背景的就业情况',
          required: true,
          options: [
            { value: 'high-school', label: '高中/中专及以下' },
            { value: 'junior-college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士研究生' },
            { value: 'phd', label: '博士研究生' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          }
        },
        {
          id: 'unemploymentDuration',
          type: 'radio',
          title: '您当前的失业时长是？',
          description: '请选择最接近的时间段',
          required: true,
          options: [
            { value: 'less-1month', label: '不到1个月' },
            { value: '1-3months', label: '1-3个月' },
            { value: '3-6months', label: '3-6个月' },
            { value: '6-12months', label: '6个月-1年' },
            { value: '1-2years', label: '1-2年' },
            { value: 'over-2years', label: '2年以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第8部分：用户体验反馈（第二问卷特有）
    {
      id: 'user-experience_feedback',
      title: '问卷体验反馈',
      description: '请对本次问卷的体验进行评价，帮助我们改进',
      metadata: {
        estimatedTime: 60,
        cognitiveLoad: 'low',
        priority: 'medium'
      },
      questions: [
        {
          id: 'questionnaire_experience_rating',
          type: 'radio',
          title: '您对本次问卷的整体体验评分是？',
          required: true,
          options: [
            { value: '10', label: '10分 - 非常满意' },
            { value: '9', label: '9分 - 很满意' },
            { value: '8', label: '8分 - 满意' },
            { value: '7', label: '7分 - 较满意' },
            { value: '6', label: '6分 - 一般' },
            { value: '5', label: '5分 - 不太满意' },
            { value: '4', label: '4分及以下 - 不满意' }
          ]
        },
        {
          id: 'interaction_preference',
          type: 'radio',
          title: '您更喜欢哪种问卷交互方式？',
          required: true,
          options: [
            { value: 'conversational', label: '对话式（像聊天一样）' },
            { value: 'traditional', label: '传统表单式' },
            { value: 'mixed', label: '两种结合' },
            { value: 'no_preference', label: '无特别偏好' }
          ]
        }
      ]
    }
  ],
  
  // 配置信息
  config: {
    title: '2025年智能就业调查（第二版）',
    description: '基于差异化群体分析的深度就业调研问卷',
    allowAnonymous: true,
    requireEmail: false,
    allowBackward: true,
    showProgress: true,
    autoSave: true,
    autoSaveInterval: 30000,
    
    // 第二问卷特有配置
    conversationalMode: true,
    animationEnabled: true,
    tagSelectorMode: true
  },
  
  metadata: {
    id: 'employmentSurvey2024V2',
    version: '2.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: '第二问卷系统',
    category: '差异化群体分析',
    tags: ['智能', '群体分析', '差异化', '就业调研', 'V2', 'H5对话式'],
    estimatedTime: 10,
    targetAudience: '失业群体（分类分析）',
    language: 'zh-CN',
    status: 'published'
  }
};
