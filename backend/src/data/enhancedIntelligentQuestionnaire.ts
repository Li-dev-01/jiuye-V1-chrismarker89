/**
 * 升级版多维度条件判断智能问卷 - 后端版本
 * 基于优秀问卷设计原则的全面升级版本
 * 与前端保持完全一致的配置
 * 
 * 升级要素：
 * - 专业的问题设计（心理学原则）
 * - 完善的分支逻辑（数据清理、路径记录）
 * - 优化的用户体验（动画、错误处理）
 * - 性能优化（懒加载、缓存）
 */

import type { UniversalQuestionnaire } from '../types/universal-questionnaire';

// 分支路径记录接口
export interface BranchPath {
  identity: string;
  status: string;
  location: string;
  timestamp: number;
  completedSections: string[];
}

// 数据清理配置接口
export interface DataCleanupConfig {
  [sectionId: string]: {
    condition: string;
    fieldsToClean: string[];
    cleanupReason: string;
  };
}

export const enhancedIntelligentQuestionnaire: UniversalQuestionnaire = {
  id: 'employment-survey-2024',
  title: '2025年智能就业调查（升级版）',
  description: '基于心理学和数据科学原则设计的智能问卷，提供个性化的调研体验',
  
  sections: [
    // 第1部分：基础信息收集（认知负荷最小化）
    {
      id: 'basic-demographics',
      title: '基本信息',
      description: '请提供一些基本信息，这将帮助我们为您定制后续问题（约1分钟）',
      metadata: {
        estimatedTime: 60,
        cognitiveLoad: 'low',
        priority: 'high'
      },
      questions: [
        {
          id: 'age-range',
          type: 'radio',
          title: '您的年龄段是？',
          description: '用于了解不同年龄群体的就业特点',
          required: true,
          options: [
            { value: 'under-20', label: '20岁以下' },
            { value: '20-22', label: '20-22岁（在校大学生为主）' },
            { value: '23-25', label: '23-25岁（应届毕业生为主）' },
            { value: '26-28', label: '26-28岁（职场新人为主）' },
            { value: '29-35', label: '29-35岁（职场中坚为主）' },
            { value: 'over-35', label: '35岁以上（职场资深为主）' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          },
          validation: [
            {
              type: 'required',
              message: '请选择您的年龄段'
            }
          ]
        },
        {
          id: 'gender',
          type: 'radio',
          title: '您的性别是？',
          description: '用于分析性别对就业状况的影响（可选择不透露）',
          required: true,
          options: [
            { value: 'male', label: '男性' },
            { value: 'female', label: '女性' },
            { value: 'prefer-not-say', label: '不愿透露' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          },
          accessibility: {
            ariaLabel: '性别选择，可选择不透露',
            description: '此信息仅用于统计分析，完全保密'
          }
        },
        {
          id: 'work-location-preference',
          type: 'radio',
          title: '您目前主要生活/工作的城市类型是？',
          description: '用于分析不同地区的就业环境差异',
          required: true,
          options: [
            { value: 'tier1', label: '一线城市（北京、上海、广州、深圳）' },
            { value: 'new-tier1', label: '新一线城市（成都、杭州、武汉、西安等）' },
            { value: 'tier2', label: '二线城市（省会城市及重要地级市）' },
            { value: 'tier3', label: '三线及以下城市' },
            { value: 'hometown', label: '家乡所在地' },
            { value: 'flexible', label: '灵活选择' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'education-level',
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
          id: 'major-field',
          type: 'radio',
          title: '您的专业大类是？',
          description: '用于分析不同专业的就业情况',
          required: true,
          options: [
            { value: 'engineering', label: '工学（计算机、机械、电子等）' },
            { value: 'management', label: '经济管理类（金融、会计、市场营销等）' },
            { value: 'science', label: '理学（数学、物理、化学、生物等）' },
            { value: 'literature', label: '文学（中文、外语、新闻传播等）' },
            { value: 'medicine', label: '医学（临床医学、护理、药学等）' },
            { value: 'education', label: '教育学（师范类专业）' },
            { value: 'law', label: '法学' },
            { value: 'art', label: '艺术学（设计、音乐、美术等）' },
            { value: 'economics', label: '经济学' },
            { value: 'philosophy', label: '哲学' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },
    
    // 第2部分：身份识别（分支逻辑核心）
    {
      id: 'identity-classification',
      title: '身份确认',
      description: '请选择最符合您当前情况的身份，后续问题将据此个性化定制',
      metadata: {
        estimatedTime: 30,
        cognitiveLoad: 'medium',
        priority: 'critical',
        branchingPoint: true
      },
      questions: [
        {
          id: 'current-status',
          type: 'radio',
          title: '您目前的主要身份是？',
          description: '请选择最能代表您当前状况的选项',
          required: true,
          options: [
            {
              value: 'student',
              label: '在校学生',
              description: '正在高校就读，尚未毕业'
            },
            {
              value: 'unemployed',
              label: '失业/求职中',
              description: '目前没有工作，正在寻找机会'
            },
            {
              value: 'fulltime',
              label: '全职工作',
              description: '目前有稳定的全职工作'
            },
            {
              value: 'internship',
              label: '实习中',
              description: '目前在实习岗位工作'
            },
            {
              value: 'freelance',
              label: '自由职业',
              description: '独立工作，不隶属于特定雇主'
            },
            {
              value: 'parttime',
              label: '兼职工作',
              description: '目前从事兼职工作'
            },
            {
              value: 'preparing',
              label: '备考/进修',
              description: '正在备考或进修学习'
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
              'student-details',
              'employment-details', 
              'unemployment-details',
              'freelance-details',
              'entrepreneur-details'
            ]
          }
        }
      ]
    },

    // 第3部分：在职人员详细信息（条件显示）
    {
      id: 'employment-details',
      title: '工作情况',
      description: '请填写您的工作相关信息，这将为同行业同背景人员提供薪酬参考',
      condition: {
        dependsOn: 'current-status',
        operator: 'equals',
        value: 'fulltime'
      },
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        targetAudience: 'employed'
      },
      questions: [
        {
          id: 'work-industry',
          type: 'radio',
          title: '您所在的行业是？',
          description: '请选择最符合您当前工作的行业分类',
          required: true,
          options: [
            { value: 'internet-tech', label: '互联网/科技' },
            { value: 'finance', label: '金融/银行/保险' },
            { value: 'manufacturing', label: '制造业' },
            { value: 'education', label: '教育/培训' },
            { value: 'healthcare', label: '医疗/健康' },
            { value: 'real-estate', label: '房地产/建筑' },
            { value: 'retail-commerce', label: '零售/电商' },
            { value: 'media-advertising', label: '媒体/广告/文化' },
            { value: 'consulting', label: '咨询/专业服务' },
            { value: 'government', label: '政府/事业单位' },
            { value: 'transportation', label: '交通/物流' },
            { value: 'energy', label: '能源/化工' },
            { value: 'agriculture', label: '农业/食品' },
            { value: 'other', label: '其他行业' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'current-salary',
          type: 'radio',
          title: '您目前的月薪范围是？（税前）',
          description: '此数据将用于同行业同背景薪酬参考，完全匿名',
          required: true,
          options: [
            { value: 'below-3k', label: '3000元以下' },
            { value: '3k-5k', label: '3000-5000元' },
            { value: '5k-8k', label: '5000-8000元' },
            { value: '8k-12k', label: '8000-12000元' },
            { value: '12k-20k', label: '12000-20000元' },
            { value: '20k-30k', label: '20000-30000元' },
            { value: '30k-50k', label: '30000-50000元' },
            { value: 'above-50k', label: '50000元以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第4部分：学生专属信息（条件显示）
    {
      id: 'student-details',
      title: '学习情况',
      description: '请填写您的学习相关信息，帮助我们了解在校学生的就业准备情况',
      condition: {
        dependsOn: 'current-status',
        operator: 'equals',
        value: 'student'
      },
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        targetAudience: 'students'
      },
      questions: [
        {
          id: 'academic-year',
          type: 'radio',
          title: '您目前的年级是？',
          description: '请选择您当前的学习阶段',
          required: true,
          options: [
            { value: 'year-1', label: '一年级' },
            { value: 'year-2', label: '二年级' },
            { value: 'year-3', label: '三年级' },
            { value: 'year-4', label: '四年级' },
            { value: 'year-5-plus', label: '五年级及以上' },
            { value: 'graduate-1', label: '研究生一年级' },
            { value: 'graduate-2', label: '研究生二年级' },
            { value: 'graduate-3-plus', label: '研究生三年级及以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'career-preparation',
          type: 'checkbox',
          title: '您目前在为就业做哪些准备？（可多选）',
          description: '了解学生的就业准备情况',
          required: false,
          options: [
            { value: 'internship', label: '参加实习' },
            { value: 'skill-training', label: '技能培训和认证' },
            { value: 'job-search', label: '投递简历找工作' },
            { value: 'graduate-exam', label: '准备考研' },
            { value: 'civil-service', label: '准备公务员考试' },
            { value: 'study-abroad', label: '准备出国留学' },
            { value: 'entrepreneurship', label: '创业准备' },
            { value: 'none', label: '暂时没有特别准备' }
          ],
          config: {
            maxSelections: 5
          },
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第5部分：求职人员详细信息（条件显示）
    {
      id: 'job-seeking-details',
      title: '求职情况',
      description: '请填写您的求职相关信息，这将为其他求职者提供市场参考',
      condition: {
        dependsOn: 'current-status',
        operator: 'equals',
        value: 'unemployed'
      },
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        targetAudience: 'job-seekers'
      },
      questions: [
        {
          id: 'job-search-duration',
          type: 'radio',
          title: '您求职多长时间了？',
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
        },
        {
          id: 'job-search-difficulties',
          type: 'checkbox',
          title: '您在求职过程中遇到的主要困难是？（可多选）',
          description: '请选择您实际遇到的困难',
          required: true,
          config: {
            maxSelections: 5
          },
          options: [
            { value: 'lack-experience', label: '缺乏相关工作经验' },
            { value: 'skill-mismatch', label: '技能与岗位要求不匹配' },
            { value: 'no-response', label: '简历投递无回应' },
            { value: 'interview-failure', label: '面试表现不佳' },
            { value: 'salary-gap', label: '薪资期望与现实差距大' },
            { value: 'location-limit', label: '地域限制' },
            { value: 'age-discrimination', label: '年龄限制' },
            { value: 'education-requirement', label: '学历要求过高' },
            { value: 'market-competition', label: '市场竞争激烈' },
            { value: 'industry-decline', label: '目标行业不景气' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第6部分：就业状态确认（所有人）
    {
      id: 'employment-status',
      title: '当前状态',
      description: '请确认您当前的具体状态，这将影响后续问题的个性化匹配',
      metadata: {
        estimatedTime: 30,
        cognitiveLoad: 'low',
        priority: 'high',
        branchingPoint: true
      },
      questions: [
        {
          id: 'current-activity',
          type: 'radio',
          title: '您目前主要在做什么？',
          description: '请选择最符合您当前情况的活动状态',
          required: true,
          options: [
            { value: 'working-fulltime', label: '全职工作' },
            { value: 'working-parttime', label: '兼职工作' },
            { value: 'job-seeking', label: '积极求职中' },
            { value: 'studying-fulltime', label: '全职学习/进修' },
            { value: 'preparing-exams', label: '备考（考研/公考/其他）' },
            { value: 'resting', label: '暂时休息调整' },
            { value: 'caring-family', label: '照顾家庭' },
            { value: 'starting-business', label: '准备创业' }
          ],
          statistics: {
            enabled: true,
            chartType: 'donut',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: [
              'job-seeking-details',
              'tier1-city-costs',
              'employment-satisfaction'
            ]
          }
        }
      ]
    },

    // 第7部分：求职详情（多维度条件：失业+求职）
    {
      id: 'job-seeking-intensity',
      title: '求职详情',
      description: '请分享您的求职经历和遇到的挑战',
      condition: {
        dependsOn: 'current-activity',
        operator: 'equals',
        value: 'job-seeking'
      },
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        targetAudience: 'job-seekers',
        conditionalLogic: 'multi-dimensional'
      },
      questions: [
        {
          id: 'job-search-intensity',
          type: 'radio',
          title: '您目前的求职频率是？',
          description: '请选择最符合您求职活跃程度的选项',
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
        },
        {
          id: 'financial-pressure',
          type: 'radio',
          title: '失业期间您的经济压力如何？',
          description: '请选择最符合您情况的选项',
          required: true,
          options: [
            { value: 'no-pressure', label: '没有经济压力，可以慢慢找' },
            { value: 'mild-pressure', label: '有一定压力，但还能承受' },
            { value: 'moderate-pressure', label: '压力较大，需要尽快找到工作' },
            { value: 'severe-pressure', label: '压力很大，急需工作维持生活' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          },
          metadata: {
            sensitivityLevel: 'high',
            privacyNote: '此信息仅用于统计分析，完全保密'
          }
        }
      ]
    },

    // 第8部分：一线城市生活成本（地区条件）
    {
      id: 'tier1-city-costs',
      title: '一线城市生活成本',
      description: '了解您在一线城市的生活成本和压力情况',
      condition: {
        dependsOn: 'work-location-preference',
        operator: 'equals',
        value: 'tier1'
      },
      metadata: {
        estimatedTime: 60,
        cognitiveLoad: 'low',
        targetAudience: 'tier1-residents'
      },
      questions: [
        {
          id: 'monthly-housing-cost',
          type: 'radio',
          title: '您每月的住房支出大约是？',
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
        },
        {
          id: 'life-pressure-tier1',
          type: 'radio',
          title: '您在一线城市的整体生活压力如何？',
          description: '请根据您的真实感受选择',
          required: true,
          options: [
            { value: 'very-low', label: '压力很小，生活轻松' },
            { value: 'low', label: '压力较小，基本适应' },
            { value: 'moderate', label: '压力适中，有挑战但可承受' },
            { value: 'high', label: '压力较大，比较辛苦' },
            { value: 'very-high', label: '压力很大，难以承受' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第9部分：通用结尾问题（所有人）
    {
      id: 'universal-conclusion',
      title: '综合评价',
      description: '最后几个问题，了解您对就业市场的整体看法',
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'low',
        priority: 'medium'
      },
      questions: [
        {
          id: 'employment-difficulty-perception',
          type: 'radio',
          title: '您认为当前的就业难度如何？',
          description: '请根据您的观察和感受进行评价',
          required: true,
          options: [
            { value: 'very-easy', label: '非常容易，机会很多' },
            { value: 'easy', label: '比较容易，机会较多' },
            { value: 'moderate', label: '一般，有机会但需要努力' },
            { value: 'difficult', label: '比较困难，机会较少' },
            { value: 'very-difficult', label: '非常困难，机会很少' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'salary-level-perception',
          type: 'radio',
          title: '您认为当前市场的整体薪资水平如何？',
          description: '相比您的期望或了解的情况',
          required: true,
          options: [
            { value: 'much-higher', label: '比预期高很多' },
            { value: 'higher', label: '比预期稍高' },
            { value: 'as-expected', label: '符合预期' },
            { value: 'lower', label: '比预期稍低' },
            { value: 'much-lower', label: '比预期低很多' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'peer-employment-rate',
          type: 'radio',
          title: '您身边的同学/同事的就业率如何？',
          description: '请根据您了解的情况，评估您周围同龄人的就业状况',
          required: true,
          options: [
            { value: 'very-high', label: '非常高（90%以上都有工作）' },
            { value: 'high', label: '比较高（70%-90%有工作）' },
            { value: 'moderate', label: '一般（50%-70%有工作）' },
            { value: 'low', label: '比较低（30%-50%有工作）' },
            { value: 'very-low', label: '很低（30%以下有工作）' },
            { value: 'unknown', label: '不太了解' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'employment-advice',
          type: 'checkbox',
          title: '您认为改善就业状况最需要的是？（可多选）',
          description: '请选择您认为最重要的改善方向',
          required: true,
          config: {
            maxSelections: 3
          },
          options: [
            { value: 'education-reform', label: '教育体系改革，更贴近市场需求' },
            { value: 'skill-training', label: '加强职业技能培训' },
            { value: 'policy-support', label: '政府政策支持和就业服务' },
            { value: 'economic-growth', label: '促进经济发展，创造更多岗位' },
            { value: 'fair-recruitment', label: '规范招聘流程，减少歧视' },
            { value: 'salary-standards', label: '规范薪资标准，提高透明度' },
            { value: 'work-life-balance', label: '改善工作环境和工作生活平衡' },
            { value: 'entrepreneurship', label: '鼓励创业创新' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第10部分：提交方式选择（所有人）
    {
      id: 'submission-preference',
      title: '提交方式',
      description: '请选择您希望的提交方式，我们完全尊重您的隐私选择',
      metadata: {
        estimatedTime: 30,
        cognitiveLoad: 'low',
        priority: 'medium'
      },
      questions: [
        {
          id: 'submission-type',
          type: 'radio',
          title: '您希望如何提交这份问卷？',
          description: '为了确保问卷数据的真实性和防止恶意提交，我们要求用户登录后提交问卷：\n• Google一键登录：使用Google账号快速登录\n• 自动登录：系统自动创建匿名账户，无需手动注册',
          required: true,
          options: [
            {
              value: 'google-login',
              label: 'Google一键登录',
              description: '使用Google账号登录，快速安全，会获取您的邮箱地址用于身份验证'
            },
            {
              value: 'auto-login',
              label: '自动登录',
              description: '系统自动创建匿名账户，通过简单验证后即可登录提交'
            }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: [
              'google-auth',
              'auto-registration'
            ]
          }
        }
      ]
    }
  ],

  // 升级版配置
  config: {
    title: '2025年智能就业调查（升级版）',
    description: '基于心理学和数据科学原则设计的智能问卷',
    allowAnonymous: true,
    requireEmail: false,
    allowBackward: true,
    showProgress: true,
    autoSave: true,
    autoSaveInterval: 30000,

    // 新增：用户体验优化
    userExperience: {
      enableAnimations: true,
      animationDuration: 300,
      enableProgressPrediction: true,
      showEstimatedTime: true,
      enableSmartNavigation: true
    },

    // 新增：数据质量保证
    dataQuality: {
      enableBranchPathTracking: true,
      enableDataCleaning: true,
      enableConsistencyCheck: true,
      enableSampleSizeMonitoring: true
    },

    // 新增：性能优化
    performance: {
      enableLazyLoading: true,
      enableCaching: true,
      preloadNextSection: true,
      batchStateUpdates: true
    },

    // 新增：可访问性支持
    accessibility: {
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      enableHighContrast: false,
      enableFocusManagement: true
    },

    // 验证配置
    validation: {
      stopOnFirstError: false,
      showValidationSummary: true,
      enableRealTimeValidation: true,
      enableDynamicValidation: true
    },

    // 统计配置
    statistics: {
      enabled: true,
      position: 'bottom',
      updateRealtime: true,
      updateInterval: 3000,
      enableBranchComparison: true
    }
  },

  // 升级版元数据
  metadata: {
    id: 'employment-survey-2024',
    version: '2.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: '智能问卷系统升级版',
    category: '多维度条件判断（升级版）',
    tags: ['智能', '条件判断', '多维度', '就业调研', '升级版', '心理学优化'],
    estimatedTime: 8,
    targetAudience: '所有人群',
    language: 'zh-CN',
    status: 'published',

    // 新增：设计原则记录
    designPrinciples: [
      '认知负荷最小化',
      '渐进式信息披露',
      '数据质量优先',
      '用户体验至上',
      '可访问性友好'
    ],

    // 新增：质量指标
    qualityMetrics: {
      expectedCompletionRate: 0.85,
      maxCognitiveLoad: 3, // 数值类型
      targetResponseTime: 300,
      accessibilityScore: 'AA'
    }
  }
};
