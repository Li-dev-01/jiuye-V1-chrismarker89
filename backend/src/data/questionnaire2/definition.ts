/**
 * 问卷2独立定义文件
 * 完全独立的问卷配置，与问卷1无任何依赖关系
 * 专注于经济压力和就业信心评估
 */

import type { UniversalQuestionnaire } from '../../types/universal-questionnaire';

export const questionnaire2Definition: UniversalQuestionnaire = {
  id: 'questionnaire-v2-2024',
  title: '2025年智能就业调查（第二版）',
  description: '基于经济压力和生活态度的智能问卷系统，提供个性化的调研体验',
  
  sections: [
    // 第1部分：基础信息收集
    {
      id: 'basic-demographics-v2',
      title: '基本信息',
      description: '请提供一些基本信息，这将帮助我们为您定制后续问题（约1分钟）',
      metadata: {
        estimatedTime: 60,
        cognitiveLoad: 'low',
        priority: 'high'
      },
      questions: [
        {
          id: 'gender-v2',
          type: 'radio',
          title: '您的性别是？',
          description: '用于了解不同性别群体的就业特点与面临的挑战',
          required: true,
          options: [
            { value: 'male', label: '男' },
            { value: 'female', label: '女' },
            { value: 'other', label: '其他' },
            { value: 'prefer-not', label: '不愿透露' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: [
              'marriage-discrimination-detail-v2',
              'age-discrimination-detail-v2'
            ]
          }
        },
        {
          id: 'age-range-v2',
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
          branchLogic: {
            enabled: true,
            affectedSections: ['age-discrimination-detail-v2']
          }
        },
        {
          id: 'education-level-v2',
          type: 'radio',
          title: '您的最高学历是？',
          required: true,
          options: [
            { value: 'high-school', label: '高中及以下' },
            { value: 'vocational', label: '中专/技校' },
            { value: 'college', label: '大专' },
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
          id: 'marital-status-v2',
          type: 'radio',
          title: '您的婚姻状况是？',
          description: '用于了解婚姻状况对就业的影响',
          required: true,
          options: [
            { value: 'single', label: '未婚' },
            { value: 'married', label: '已婚' },
            { value: 'divorced', label: '离异' },
            { value: 'widowed', label: '丧偶' },
            { value: 'prefer-not', label: '不愿透露' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: ['marriage-discrimination-detail-v2']
          }
        },
        {
          id: 'has-children-v2',
          type: 'radio',
          title: '您是否有子女？',
          description: '用于了解育儿状况对就业的影响',
          required: true,
          condition: {
            dependsOn: 'marital-status-v2',
            operator: 'in',
            value: ['married', 'divorced', 'widowed']
          },
          options: [
            { value: 'yes', label: '是' },
            { value: 'no', label: '否' },
            { value: 'prefer-not', label: '不愿透露' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: ['marriage-discrimination-detail-v2']
          }
        },
        {
          id: 'fertility-intent-v2',
          type: 'radio',
          title: '您是否有生育计划？',
          description: '用于了解生育意愿对就业的影响（可选）',
          required: false,
          condition: {
            dependsOn: 'gender-v2',
            operator: 'equals',
            value: 'female'
          },
          options: [
            { value: 'yes-soon', label: '是，近期（1-2年内）' },
            { value: 'yes-later', label: '是，但较远期（3年以上）' },
            { value: 'no', label: '否，暂无生育计划' },
            { value: 'no-already', label: '已有子女，不打算再生' },
            { value: 'uncertain', label: '不确定' },
            { value: 'prefer-not', label: '不愿透露' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: ['marriage-discrimination-detail-v2']
          }
        },
        {
          id: 'current-city-tier-v2',
          type: 'radio',
          title: '您目前所在的城市层级是？',
          description: '用于了解地域对就业机会的影响',
          required: true,
          options: [
            { value: 'tier1', label: '一线城市（北上广深）' },
            { value: 'new-tier1', label: '新一线城市（成都、杭州、武汉等）' },
            { value: 'tier2', label: '二线城市' },
            { value: 'tier3-4', label: '三四线城市' },
            { value: 'county-town', label: '县城/乡镇' },
            { value: 'rural', label: '农村' },
            { value: 'overseas', label: '海外' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'hukou-type-v2',
          type: 'radio',
          title: '您的户籍类型是？',
          description: '用于了解户籍对就业的影响',
          required: true,
          options: [
            { value: 'urban', label: '城镇户口' },
            { value: 'rural', label: '农村户口' },
            { value: 'other', label: '其他' },
            { value: 'prefer-not', label: '不愿透露' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          }
        },
        {
          id: 'years-experience-v2',
          type: 'radio',
          title: '您的工作年限是？',
          description: '包括实习、兼职等各类工作经历',
          required: true,
          options: [
            { value: 'none', label: '无工作经验' },
            { value: 'less-1', label: '1年以下' },
            { value: '1-3', label: '1-3年' },
            { value: '3-5', label: '3-5年' },
            { value: '5-10', label: '5-10年' },
            { value: 'over-10', label: '10年以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第2部分：当前状态识别
    {
      id: 'current-status-v2',
      title: '当前状态',
      description: '请选择最符合您当前情况的身份',
      metadata: {
        estimatedTime: 30,
        cognitiveLoad: 'low',
        priority: 'critical',
        branchingPoint: true
      },
      questions: [
        {
          id: 'current-status-question-v2',
          type: 'radio',
          title: '您目前的状态是？',
          description: '后续问题将根据您的选择进行个性化定制',
          required: true,
          options: [
            { value: 'fulltime', label: '全职工作', description: '目前有稳定的全职工作' },
            { value: 'student', label: '在校学生', description: '目前在校学习（包括实习）' },
            { value: 'unemployed', label: '待业/求职中', description: '目前正在寻找工作机会' },
            { value: 'freelance', label: '自由职业', description: '独立工作，不隶属于特定雇主' },
            { value: 'entrepreneur', label: '创业', description: '正在创业或经营自己的事业' }
          ],
          statistics: {
            enabled: true,
            chartType: 'donut',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: [
              'employment-income-details-v2',
              'student-details-v2', 
              'job-seeking-details-v2',
              'economic-pressure-analysis-v2'
            ]
          }
        }
      ]
    },

    // 第3部分：通用经济压力评估（所有群体）
    {
      id: 'universal-economic-pressure-v2',
      title: '经济压力评估',
      description: '了解您当前面临的经济压力状况，这是影响生活态度的重要因素',
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        targetAudience: 'all-adults',
        priority: 'high'
      },
      questions: [
        {
          id: 'debt-situation-v2',
          type: 'checkbox',
          title: '您目前有以下哪些负债或贷款？（可多选）',
          description: '包括各种形式的借贷，完全匿名统计',
          required: true,
          options: [
            { value: 'student-loan', label: '助学贷款（国家助学贷款、生源地贷款等）' },
            { value: 'alipay-huabei', label: '支付宝花呗' },
            { value: 'credit-card', label: '信用卡账单' },
            { value: 'jd-baitiao', label: '京东白条' },
            { value: 'wechat-pay-later', label: '微信分付' },
            { value: 'consumer-loan', label: '其他消费贷款（借呗、微粒贷、360借条等）' },
            { value: 'mortgage', label: '房贷' },
            { value: 'car-loan', label: '车贷' },
            { value: 'family-debt', label: '家庭债务（为家人借贷）' },
            { value: 'business-loan', label: '创业/经营贷款' },
            { value: 'private-loan', label: '民间借贷' },
            { value: 'no-debt', label: '目前没有任何负债' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'monthly-debt-burden-v2',
          type: 'radio',
          title: '您每月需要偿还的各种贷款/账单总额大约是？',
          description: '包括助学贷款、花呗、信用卡、白条等所有还款',
          required: true,
          options: [
            { value: 'no-payment', label: '无需还款' },
            { value: 'below-300', label: '300元以下' },
            { value: '300-500', label: '300-500元' },
            { value: '500-1000', label: '500-1000元' },
            { value: '1000-2000', label: '1000-2000元' },
            { value: '2000-3000', label: '2000-3000元' },
            { value: '3000-5000', label: '3000-5000元' },
            { value: 'above-5000', label: '5000元以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'economic-pressure-level-v2',
          type: 'radio',
          title: '您目前感受到的经济压力程度是？',
          description: '请根据您的真实感受选择',
          required: true,
          options: [
            { value: 'no-pressure', label: '没有压力，经济状况良好' },
            { value: 'mild-pressure', label: '轻微压力，基本能应对' },
            { value: 'moderate-pressure', label: '中等压力，需要谨慎规划' },
            { value: 'high-pressure', label: '较大压力，经常为钱发愁' },
            { value: 'severe-pressure', label: '巨大压力，严重影响生活' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: ['high-pressure-coping-v2']
          }
        }
      ]
    },

    // 第4部分：在职人员收入状况（条件显示）
    {
      id: 'employment-income-details-v2',
      title: '收入与工作状况',
      description: '了解您的工作收入情况',
      condition: {
        dependsOn: 'current-status-v2',
        operator: 'equals',
        value: 'fulltime'
      },
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        targetAudience: 'employed-professionals'
      },
      questions: [
        {
          id: 'current-salary-v2',
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
        },
        {
          id: 'salary-debt-ratio-v2',
          type: 'radio',
          title: '您的月还款金额占月收入的比例大约是？',
          description: '用于评估收入与债务负担的关系',
          required: true,
          options: [
            { value: 'no-debt', label: '无债务负担' },
            { value: 'below-10', label: '10%以下' },
            { value: '10-20', label: '10%-20%' },
            { value: '20-30', label: '20%-30%' },
            { value: '30-50', label: '30%-50%' },
            { value: 'above-50', label: '50%以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第5部分：求职歧视与现实场景
    {
      id: 'discrimination-reality-v2',
      title: '求职歧视与现实场景',
      description: '了解您在求职过程中遇到或担忧的歧视情况，帮助我们更好地了解就业市场的真实状况',
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        priority: 'high',
        targetAudience: 'all-groups',
        sensitiveData: true
      },
      questions: [
        {
          id: 'experienced-discrimination-types-v2',
          type: 'checkbox',
          title: '您在求职过程中是否经历或担忧以下歧视情况？（可多选）',
          description: '包括已经遇到的和担心可能遇到的情况，完全匿名统计',
          required: true,
          options: [
            { value: 'work-experience', label: '工作经验要求过高或不合理' },
            { value: 'gender', label: '性别歧视' },
            { value: 'marriage-fertility', label: '婚育状况歧视（已婚、未婚、有无子女、生育计划等）' },
            { value: 'age', label: '年龄歧视（过大或过小）' },
            { value: 'region', label: '地域歧视（户籍、籍贯、方言等）' },
            { value: 'education-level', label: '学历歧视（学历层次要求）' },
            { value: 'school-tier', label: '学校层次歧视（985/211/双一流等）' },
            { value: 'major', label: '专业歧视' },
            { value: 'health', label: '健康状况歧视' },
            { value: 'appearance', label: '外貌/身高/体重歧视' },
            { value: 'political-status', label: '政治面貌要求' },
            { value: 'social-background', label: '家庭背景/社会关系' },
            { value: 'other', label: '其他歧视' },
            { value: 'none', label: '未经历或担忧任何歧视' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'discrimination-severity-v2',
          type: 'radio',
          title: '您认为这些歧视对您求职的影响程度是？',
          description: '请根据您的真实感受选择',
          required: true,
          condition: {
            dependsOn: 'experienced-discrimination-types-v2',
            operator: 'not_in',
            value: ['none']
          },
          options: [
            { value: 'no-impact', label: '没有影响' },
            { value: 'mild', label: '轻微影响，偶尔遇到' },
            { value: 'moderate', label: '中等影响，经常遇到' },
            { value: 'severe', label: '严重影响，大部分机会都受阻' },
            { value: 'very-severe', label: '极其严重，几乎无法找到合适工作' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'discrimination-channels-v2',
          type: 'checkbox',
          title: '您主要在哪些渠道或环节遇到这些歧视？（可多选）',
          description: '帮助我们了解歧视发生的具体场景',
          required: false,
          condition: {
            dependsOn: 'experienced-discrimination-types-v2',
            operator: 'not_in',
            value: ['none']
          },
          options: [
            { value: 'job-posting', label: '招聘广告/职位描述中的明确要求' },
            { value: 'online-platform', label: '在线招聘平台筛选' },
            { value: 'resume-screening', label: '简历筛选阶段' },
            { value: 'phone-interview', label: '电话面试' },
            { value: 'onsite-interview', label: '现场面试' },
            { value: 'background-check', label: '背景调查' },
            { value: 'offer-stage', label: 'Offer发放阶段' },
            { value: 'referral', label: '内推/熟人介绍时' },
            { value: 'other', label: '其他渠道' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'discrimination-case-open-v2',
          type: 'textarea',
          title: '如果您愿意，可以简要描述一次印象深刻的歧视经历（可选）',
          description: '您的分享将帮助我们更好地了解就业市场的真实状况，完全匿名',
          required: false,
          condition: {
            dependsOn: 'experienced-discrimination-types-v2',
            operator: 'not_in',
            value: ['none']
          },
          config: {
            maxLength: 500,
            rows: 4,
            placeholder: '例如：在某次面试中，面试官直接询问婚育计划，并表示公司不希望招聘近期有生育计划的女性...'
          },
          statistics: {
            enabled: false
          }
        }
      ]
    },

    // 第6部分：个人优势与忧虑
    {
      id: 'personal-perspective-v2',
      title: '个人优势与忧虑',
      description: '了解您对自身就业状况的看法与期望',
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        priority: 'high',
        targetAudience: 'all-groups'
      },
      questions: [
        {
          id: 'personal-advantages-v2',
          type: 'textarea',
          title: '您认为自己在就业市场上的主要优势是什么？',
          description: '可以是技能、经验、性格、资源等任何方面',
          required: false,
          config: {
            maxLength: 300,
            rows: 3,
            placeholder: '例如：专业技能扎实、有相关项目经验、沟通能力强、学习能力快...'
          },
          statistics: {
            enabled: false
          }
        },
        {
          id: 'employment-concerns-v2',
          type: 'textarea',
          title: '您当前在就业方面最主要的忧虑是什么？',
          description: '请分享您最担心的问题',
          required: false,
          config: {
            maxLength: 300,
            rows: 3,
            placeholder: '例如：担心年龄偏大找不到合适工作、担心行业不景气、担心薪资达不到预期...'
          },
          statistics: {
            enabled: false
          }
        },
        {
          id: 'support-needed-types-v2',
          type: 'checkbox',
          title: '您希望在就业方面得到哪些支持？（可多选）',
          description: '帮助我们了解求职者的真实需求',
          required: true,
          options: [
            { value: 'policy-support', label: '政策支持（就业补贴、创业扶持等）' },
            { value: 'skill-training', label: '技能培训与提升机会' },
            { value: 'career-guidance', label: '职业规划与咨询指导' },
            { value: 'job-info', label: '更多真实有效的招聘信息' },
            { value: 'anti-discrimination', label: '反歧视保护与监督' },
            { value: 'mental-support', label: '心理支持与压力疏导' },
            { value: 'networking', label: '行业人脉与社群资源' },
            { value: 'flexible-work', label: '更多灵活就业机会' },
            { value: 'fair-evaluation', label: '更公平的能力评估机制' },
            { value: 'other', label: '其他支持' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'support-needed-open-v2',
          type: 'textarea',
          title: '您还希望得到哪些具体的支持或建议？（可选）',
          description: '请自由分享您的想法',
          required: false,
          config: {
            maxLength: 300,
            rows: 3,
            placeholder: '例如：希望有更多针对35+人群的职业转型培训、希望平台能标注企业的真实评价...'
          },
          statistics: {
            enabled: false
          }
        }
      ]
    },

    // 第7部分：就业信心指数
    {
      id: 'employment-confidence-v2',
      title: '就业信心指数',
      description: '了解您对未来就业前景的信心程度',
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        priority: 'high',
        targetAudience: 'all-groups'
      },
      questions: [
        {
          id: 'employment-confidence-6months-v2',
          type: 'radio',
          title: '您对未来6个月的就业前景信心如何？',
          description: '无论您当前是学生、在职还是求职，都请根据您的真实感受选择',
          required: true,
          options: [
            { value: 'very-confident', label: '非常有信心' },
            { value: 'confident', label: '比较有信心' },
            { value: 'neutral', label: '一般' },
            { value: 'worried', label: '比较担心' },
            { value: 'very-worried', label: '非常担心' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'employment-confidence-1year-v2',
          type: 'radio',
          title: '您对未来1年的就业前景信心如何？',
          description: '请根据您的实际感受选择',
          required: true,
          options: [
            { value: 'very-confident', label: '非常有信心' },
            { value: 'confident', label: '比较有信心' },
            { value: 'neutral', label: '一般' },
            { value: 'worried', label: '比较担心' },
            { value: 'very-worried', label: '非常担心' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第8部分：年龄歧视细化（条件显示：35岁以上）
    {
      id: 'age-discrimination-detail-v2',
      title: '年龄与职业发展',
      description: '了解您在职业发展中与年龄相关的具体情况',
      condition: {
        dependsOn: 'age-range-v2',
        operator: 'equals',
        value: 'over-35'
      },
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        targetAudience: '35+ professionals'
      },
      questions: [
        {
          id: 'age-discrimination-frequency-v2',
          type: 'radio',
          title: '您在求职中遇到年龄限制的频率是？',
          required: true,
          options: [
            { value: 'never', label: '从未遇到' },
            { value: 'rarely', label: '偶尔遇到（少于20%的职位）' },
            { value: 'sometimes', label: '有时遇到（20-50%的职位）' },
            { value: 'often', label: '经常遇到（50-80%的职位）' },
            { value: 'always', label: '几乎总是（超过80%的职位）' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'career-transition-intent-v2',
          type: 'radio',
          title: '您是否考虑过职业转型？',
          required: true,
          options: [
            { value: 'no', label: '否，继续当前职业方向' },
            { value: 'considering', label: '正在考虑中' },
            { value: 'planning', label: '已有明确转型计划' },
            { value: 'in-progress', label: '正在转型过程中' },
            { value: 'completed', label: '已完成转型' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          }
        },
        {
          id: 'age-advantage-perception-v2',
          type: 'checkbox',
          title: '您认为年龄为您带来了哪些优势？（可多选）',
          required: false,
          options: [
            { value: 'experience', label: '丰富的工作经验' },
            { value: 'network', label: '广泛的人脉资源' },
            { value: 'stability', label: '更稳定可靠' },
            { value: 'maturity', label: '成熟的处事能力' },
            { value: 'expertise', label: '专业领域的深度积累' },
            { value: 'none', label: '没有明显优势' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第9部分：婚育歧视细化（条件显示：女性且已婚/有子女/计划生育）
    {
      id: 'marriage-discrimination-detail-v2',
      title: '婚育与职业发展',
      description: '了解您在职业发展中与婚育相关的具体情况',
      condition: {
        dependsOn: 'gender-v2',
        operator: 'equals',
        value: 'female'
      },
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        targetAudience: 'female professionals',
        sensitiveData: true
      },
      questions: [
        {
          id: 'marriage-inquiry-frequency-v2',
          type: 'radio',
          title: '您在求职面试中被询问婚育状况的频率是？',
          required: true,
          options: [
            { value: 'never', label: '从未被问及' },
            { value: 'rarely', label: '偶尔被问及（少于20%的面试）' },
            { value: 'sometimes', label: '有时被问及（20-50%的面试）' },
            { value: 'often', label: '经常被问及（50-80%的面试）' },
            { value: 'always', label: '几乎总是被问及（超过80%的面试）' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'marriage-impact-perception-v2',
          type: 'radio',
          title: '您认为婚育状况对您求职的影响程度是？',
          required: true,
          options: [
            { value: 'no-impact', label: '没有影响' },
            { value: 'slight-positive', label: '轻微正面影响' },
            { value: 'slight-negative', label: '轻微负面影响' },
            { value: 'moderate-negative', label: '中等负面影响' },
            { value: 'severe-negative', label: '严重负面影响' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'employer-requirements-v2',
          type: 'checkbox',
          title: '您遇到过哪些与婚育相关的用工要求？（可多选）',
          required: false,
          options: [
            { value: 'no-marriage-plan', label: '要求近期无结婚计划' },
            { value: 'no-fertility-plan', label: '要求近期无生育计划' },
            { value: 'already-married', label: '要求已婚已育' },
            { value: 'no-young-children', label: '要求无年幼子女' },
            { value: 'written-commitment', label: '要求签署婚育承诺书' },
            { value: 'other', label: '其他要求' },
            { value: 'none', label: '未遇到相关要求' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第10部分：求职细节（条件显示：待业/求职中）
    {
      id: 'job-seeking-detail-v2',
      title: '求职详情',
      description: '了解您的求职过程与渠道使用情况',
      condition: {
        dependsOn: 'current-status-question-v2',
        operator: 'equals',
        value: 'unemployed'
      },
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        targetAudience: 'job-seekers'
      },
      questions: [
        {
          id: 'job-seeking-duration-v2',
          type: 'radio',
          title: '您已经求职多长时间了？',
          required: true,
          options: [
            { value: 'less-1month', label: '不到1个月' },
            { value: '1-3months', label: '1-3个月' },
            { value: '3-6months', label: '3-6个月' },
            { value: '6-12months', label: '6-12个月' },
            { value: 'over-1year', label: '超过1年' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'applications-per-week-v2',
          type: 'radio',
          title: '您平均每周投递多少份简历？',
          required: true,
          options: [
            { value: 'less-5', label: '少于5份' },
            { value: '5-10', label: '5-10份' },
            { value: '10-20', label: '10-20份' },
            { value: '20-50', label: '20-50份' },
            { value: 'over-50', label: '50份以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'interview-conversion-v2',
          type: 'radio',
          title: '您的面试邀约率大约是？',
          description: '即投递简历后获得面试机会的比例',
          required: true,
          options: [
            { value: 'below-5', label: '低于5%' },
            { value: '5-10', label: '5-10%' },
            { value: '10-20', label: '10-20%' },
            { value: '20-30', label: '20-30%' },
            { value: 'above-30', label: '30%以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'channels-used-v2',
          type: 'checkbox',
          title: '您主要使用哪些求职渠道？（可多选）',
          required: true,
          options: [
            { value: 'boss', label: 'BOSS直聘' },
            { value: 'zhaopin', label: '智联招聘' },
            { value: '51job', label: '前程无忧' },
            { value: 'lagou', label: '拉勾网' },
            { value: 'liepin', label: '猎聘' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'company-website', label: '企业官网' },
            { value: 'referral', label: '内推/熟人介绍' },
            { value: 'campus', label: '校园招聘' },
            { value: 'social-media', label: '社交媒体（微信、微博等）' },
            { value: 'other', label: '其他渠道' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'offer-received-v2',
          type: 'radio',
          title: '您目前收到了多少个offer？',
          required: true,
          options: [
            { value: 'none', label: '0个' },
            { value: '1', label: '1个' },
            { value: '2-3', label: '2-3个' },
            { value: '4-5', label: '4-5个' },
            { value: 'over-5', label: '5个以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第11部分：学生职业规划（条件显示：在校学生）
    {
      id: 'student-career-planning-v2',
      title: '职业规划',
      description: '了解您的职业规划与准备情况',
      condition: {
        dependsOn: 'current-status-question-v2',
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
          id: 'internship-experience-v2',
          type: 'radio',
          title: '您有多少实习经验？',
          required: true,
          options: [
            { value: 'none', label: '无实习经验' },
            { value: 'less-3months', label: '少于3个月' },
            { value: '3-6months', label: '3-6个月' },
            { value: '6-12months', label: '6-12个月' },
            { value: 'over-1year', label: '超过1年' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'internship-difficulty-v2',
          type: 'radio',
          title: '您认为找到合适实习的难度如何？',
          required: true,
          options: [
            { value: 'very-easy', label: '非常容易' },
            { value: 'easy', label: '比较容易' },
            { value: 'moderate', label: '一般' },
            { value: 'difficult', label: '比较困难' },
            { value: 'very-difficult', label: '非常困难' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'further-education-intent-v2',
          type: 'radio',
          title: '您是否有继续深造的计划？',
          required: true,
          options: [
            { value: 'no', label: '否，计划直接就业' },
            { value: 'considering', label: '正在考虑中' },
            { value: 'yes-domestic', label: '是，计划国内读研' },
            { value: 'yes-overseas', label: '是，计划出国留学' },
            { value: 'yes-parttime', label: '是，计划在职进修' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          }
        },
        {
          id: 'career-preparation-v2',
          type: 'checkbox',
          title: '您为就业做了哪些准备？（可多选）',
          required: false,
          options: [
            { value: 'skill-training', label: '参加技能培训/考证' },
            { value: 'internship', label: '积累实习经验' },
            { value: 'project', label: '参与项目/竞赛' },
            { value: 'networking', label: '拓展人脉资源' },
            { value: 'career-planning', label: '职业规划咨询' },
            { value: 'resume', label: '简历优化' },
            { value: 'interview-prep', label: '面试技巧学习' },
            { value: 'none', label: '暂未做特别准备' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    }
  ],

  config: {
    title: '2025年智能就业调查（第二版）',
    description: '基于经济压力和生活态度的智能问卷系统',
    allowAnonymous: true,
    requireEmail: false,
    allowBackward: true,
    showProgress: true,
    autoSave: true,
    autoSaveInterval: 30000,
    
    // 第二问卷特有配置
    userExperience: {
      enableAnimations: true,
      animationDuration: 300,
      enableProgressPrediction: true,
      showEstimatedTime: true,
      enableSmartNavigation: true
    },
    
    dataQuality: {
      enableBranchPathTracking: true,
      enableDataCleaning: true,
      enableConsistencyCheck: true,
      enableSampleSizeMonitoring: true
    },
    
    performance: {
      enableLazyLoading: true,
      enableCaching: true,
      preloadNextSection: true,
      batchStateUpdates: true
    }
  },

  metadata: {
    id: 'questionnaire-v2-2024',
    version: '2.1.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: '问卷2系统',
    category: '智能经济压力与就业歧视分析',
    tags: ['智能', '经济压力', '就业信心', '就业歧视', '性别', '婚育', '年龄', '地域', '分支逻辑', 'V2'],
    estimatedTime: 12,
    targetAudience: '所有18+群体',
    language: 'zh-CN',
    status: 'published',
    designPrinciples: [
      '个体差异优先：通过性别、年龄、婚育、地域等维度捕捉个体特征',
      '现实场景聚焦：深入了解求职歧视的类型、严重度与发生渠道',
      '智能分支逻辑：根据用户画像动态展示相关问题，减少无关题目',
      '开放性补充：结合结构化题目与开放题，捕捉语义空白',
      '隐私保护：敏感问题提供"不愿透露"选项，完全匿名统计'
    ],
    qualityMetrics: {
      expectedCompletionRate: 75,
      maxCognitiveLoad: 7,
      targetResponseTime: 720,
      accessibilityScore: 'AA'
    }
  }
};
