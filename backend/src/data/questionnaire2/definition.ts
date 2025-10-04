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

    // 第5部分：就业信心指数
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
    version: '2.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: '问卷2系统',
    category: '智能经济压力分析',
    tags: ['智能', '经济压力', '就业信心', '生活态度', 'V2'],
    estimatedTime: 8,
    targetAudience: '所有18+群体',
    language: 'zh-CN',
    status: 'published'
  }
};
