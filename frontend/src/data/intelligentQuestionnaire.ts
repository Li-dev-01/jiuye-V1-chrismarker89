/**
 * 多维度条件判断智能问卷
 * 结构：固定类问题 + 角色类问题 + 状态类问题 + 常规问题
 */

import type { UniversalQuestionnaire } from '../types/universal-questionnaire';

export const intelligentQuestionnaire: UniversalQuestionnaire = {
  id: 'intelligent-employment-survey-2025',
  title: '2025年智能就业调查',
  description: '基于心理学和数据科学原则设计的智能问卷，提供个性化的调研体验',
  
  sections: [
    // 1. 固定类问题：基础信息（所有人必答）
    {
      id: 'fixed-basic-info',
      title: '基础信息',
      description: '请填写基本信息，后续问题将根据您的情况智能匹配',
      questions: [
        {
          id: 'age-range',
          type: 'radio',
          title: '您的年龄段是？',
          description: '用于了解不同年龄段的就业特点',
          required: true,
          options: [
            { value: 'under-20', label: '20岁以下' },
            { value: '20-25', label: '20-25岁' },
            { value: '26-30', label: '26-30岁' },
            { value: '31-35', label: '31-35岁' },
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
          id: 'gender',
          type: 'radio',
          title: '您的性别是？',
          description: '用于分析不同性别的就业状况差异',
          required: true,
          options: [
            { value: 'male', label: '男' },
            { value: 'female', label: '女' },
            { value: 'prefer-not-say', label: '不愿透露' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          }
        },
        {
          id: 'location',
          type: 'radio',
          title: '您目前所在的城市类型是？',
          description: '用于分析不同地区的就业情况',
          required: true,
          options: [
            { value: 'tier1', label: '一线城市（北上广深）' },
            { value: 'new-tier1', label: '新一线城市（成都、杭州、武汉等）' },
            { value: 'tier2', label: '二线城市' },
            { value: 'tier3', label: '三线及以下城市' },
            { value: 'rural', label: '农村地区' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },
    
    // 2. 角色类问题：身份识别（条件判断的核心）
    {
      id: 'role-identification',
      title: '身份信息',
      description: '请选择您的身份，后续问题将根据您的身份智能匹配',
      questions: [
        {
          id: 'identity',
          type: 'radio',
          title: '您的身份是？',
          description: '请选择最符合您当前情况的身份',
          required: true,
          options: [
            { value: 'student', label: '大学生（在校）' },
            { value: 'graduate', label: '应届毕业生' },
            { value: 'employed', label: '在职人员' },
            { value: 'unemployed', label: '失业人员' },
            { value: 'job-seeking', label: '求职者' },
            { value: 'freelancer', label: '自由职业者' },
            { value: 'entrepreneur', label: '创业者' }
          ],
          statistics: {
            enabled: true,
            chartType: 'donut',
            showPercentage: true
          }
        }
      ]
    },
    
    // 3. 角色类问题：大学生专属
    {
      id: 'student-specific',
      title: '学生信息',
      description: '请填写您的学习相关信息',
      condition: {
        dependsOn: 'identity',
        operator: 'equals',
        value: 'student'
      },
      questions: [
        {
          id: 'education-level',
          type: 'radio',
          title: '您的学历层次是？',
          description: '请选择您当前的学历层次',
          required: true,
          options: [
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
          id: 'grade-level',
          type: 'radio',
          title: '您目前的年级是？',
          description: '请选择您当前的学习阶段',
          required: true,
          options: [
            { value: 'freshman', label: '大一' },
            { value: 'sophomore', label: '大二' },
            { value: 'junior', label: '大三' },
            { value: 'senior', label: '大四' },
            { value: 'graduate-1', label: '研一' },
            { value: 'graduate-2', label: '研二' },
            { value: 'graduate-3', label: '研三及以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'major-field',
          type: 'radio',
          title: '您的专业领域是？',
          description: '请选择您的专业所属学科门类',
          required: true,
          options: [
            { value: 'engineering', label: '工学' },
            { value: 'science', label: '理学' },
            { value: 'medicine', label: '医学' },
            { value: 'management', label: '管理学' },
            { value: 'economics', label: '经济学' },
            { value: 'law', label: '法学' },
            { value: 'education', label: '教育学' },
            { value: 'literature', label: '文学' },
            { value: 'art', label: '艺术学' },
            { value: 'other', label: '其他' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },
    
    // 4. 角色类问题：失业人员专属
    {
      id: 'unemployed-specific',
      title: '失业情况',
      description: '请填写您的失业相关信息',
      condition: {
        dependsOn: 'identity',
        operator: 'equals',
        value: 'unemployed'
      },
      questions: [
        {
          id: 'unemployment-duration',
          type: 'radio',
          title: '您失业多长时间了？',
          description: '请选择您失业的时长',
          required: true,
          options: [
            { value: 'within-1month', label: '1个月以内' },
            { value: '1-3months', label: '1-3个月' },
            { value: '3-6months', label: '3-6个月' },
            { value: '6-12months', label: '6-12个月' },
            { value: '1-2years', label: '1-2年' },
            { value: 'over-2years', label: '2年以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'unemployment-reason',
          type: 'radio',
          title: '您失业的主要原因是？',
          description: '请选择最主要的失业原因',
          required: true,
          options: [
            { value: 'company-closure', label: '公司倒闭/裁员' },
            { value: 'contract-end', label: '合同到期未续约' },
            { value: 'voluntary-quit', label: '主动辞职' },
            { value: 'performance-issue', label: '工作表现问题' },
            { value: 'industry-decline', label: '行业衰退' },
            { value: 'personal-reason', label: '个人/家庭原因' },
            { value: 'other', label: '其他原因' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 5. 角色类问题：在职人员专属
    {
      id: 'employed-specific',
      title: '工作信息',
      description: '请填写您的工作相关信息',
      condition: {
        dependsOn: 'identity',
        operator: 'equals',
        value: 'employed'
      },
      questions: [
        {
          id: 'work-experience',
          type: 'radio',
          title: '您的工作经验是？',
          description: '请选择您的总工作经验',
          required: true,
          options: [
            { value: 'less-1year', label: '1年以下' },
            { value: '1-3years', label: '1-3年' },
            { value: '3-5years', label: '3-5年' },
            { value: '5-10years', label: '5-10年' },
            { value: 'over-10years', label: '10年以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'current-industry',
          type: 'radio',
          title: '您目前工作的行业是？',
          description: '请选择您当前工作所属的行业',
          required: true,
          options: [
            { value: 'internet-tech', label: '互联网/信息技术' },
            { value: 'finance', label: '金融/银行/保险' },
            { value: 'education', label: '教育/培训' },
            { value: 'healthcare', label: '医疗/生物/制药' },
            { value: 'manufacturing', label: '制造业' },
            { value: 'government', label: '政府机关/事业单位' },
            { value: 'other', label: '其他行业' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 6. 状态类问题：当前就业状态（所有人）
    {
      id: 'employment-status',
      title: '就业状态',
      description: '请选择您当前的就业状态',
      questions: [
        {
          id: 'current-status',
          type: 'radio',
          title: '您目前的就业状态是？',
          description: '请选择最符合您当前情况的状态',
          required: true,
          options: [
            { value: 'working', label: '正在工作' },
            { value: 'job-seeking', label: '正在求职' },
            { value: 'studying', label: '正在学习/进修' },
            { value: 'resting', label: '暂时休息' },
            { value: 'preparing-startup', label: '准备创业' }
          ],
          statistics: {
            enabled: true,
            chartType: 'donut',
            showPercentage: true
          }
        }
      ]
    },

    // 7. 状态类问题：失业时长详情（失业人员 + 正在求职）
    {
      id: 'unemployment-details',
      title: '失业详情',
      description: '请详细说明您的失业情况',
      condition: {
        dependsOn: ['identity', 'current-status'],
        operator: 'and',
        conditions: [
          { field: 'identity', operator: 'equals', value: 'unemployed' },
          { field: 'current-status', operator: 'equals', value: 'job-seeking' }
        ]
      },
      questions: [
        {
          id: 'unemployment-financial-status',
          type: 'radio',
          title: '失业期间您的经济状况如何？',
          description: '请选择最符合您情况的选项',
          required: true,
          options: [
            { value: 'sufficient', label: '经济充裕，无压力' },
            { value: 'manageable', label: '基本够用，略有压力' },
            { value: 'tight', label: '比较紧张，压力较大' },
            { value: 'difficult', label: '非常困难，急需工作' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'job-search-intensity',
          type: 'radio',
          title: '您目前的求职频率是？',
          description: '请选择您的求职活跃程度',
          required: true,
          options: [
            { value: 'daily', label: '每天都在找工作' },
            { value: 'frequent', label: '经常找工作（每周3-4次）' },
            { value: 'moderate', label: '偶尔找工作（每周1-2次）' },
            { value: 'passive', label: '很少主动找工作' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 8. 状态类问题：一线城市生活成本（一线城市用户）
    {
      id: 'tier1-city-costs',
      title: '一线城市生活成本',
      description: '了解您在一线城市的生活成本情况',
      condition: {
        dependsOn: 'location',
        operator: 'equals',
        value: 'tier1'
      },
      questions: [
        {
          id: 'housing-cost',
          type: 'radio',
          title: '您每月的住房支出是？',
          description: '包括房租、房贷等住房相关费用',
          required: true,
          options: [
            { value: 'below-2k', label: '2000元以下' },
            { value: '2k-4k', label: '2000-4000元' },
            { value: '4k-6k', label: '4000-6000元' },
            { value: '6k-8k', label: '6000-8000元' },
            { value: '8k-12k', label: '8000-12000元' },
            { value: 'above-12k', label: '12000元以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 9. 常规问题：通用结尾问题（所有人）
    {
      id: 'common-final',
      title: '总体评价',
      description: '最后几个问题，了解您的整体看法',
      questions: [
        {
          id: 'employment-difficulty',
          type: 'radio',
          title: '您认为当前就业难度如何？',
          description: '请根据您的感受和观察进行评价',
          required: true,
          options: [
            { value: '1', label: '非常容易' },
            { value: '2', label: '比较容易' },
            { value: '3', label: '一般' },
            { value: '4', label: '比较困难' },
            { value: '5', label: '非常困难' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'suggestions',
          type: 'textarea',
          title: '您对改善就业状况有什么建议？',
          description: '请分享您的想法和建议（选填）',
          required: false,
          placeholder: '请输入您的建议...',
          config: {
            rows: 4,
            maxLength: 500
          }
        }
      ]
    }
  ],
  
  config: {
    allowBackward: true,
    showProgress: true,
    autoSave: true,
    submitOnComplete: true,
    validation: {
      stopOnFirstError: false,
      showValidationSummary: true
    },
    ui: {
      theme: 'modern',
      showQuestionNumbers: true,
      compactMode: false
    }
  },
  
  metadata: {
    id: 'intelligent-employment-survey-2024',
    version: '3.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: '智能问卷系统',
    category: '多维度条件判断',
    tags: ['智能', '条件判断', '多维度', '就业调研'],
    estimatedTime: 5,
    targetAudience: '所有人群',
    language: 'zh-CN',
    status: 'published'
  }
};
