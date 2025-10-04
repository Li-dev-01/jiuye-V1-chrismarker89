/**
 * 问卷1独立定义文件
 * 完全独立的问卷配置，与问卷2无任何依赖关系
 */

import type { UniversalQuestionnaire } from '../../types/universal-questionnaire';

export const questionnaire1Definition: UniversalQuestionnaire = {
  id: 'questionnaire-v1-2024',
  title: '2025年大学生就业调查（第一版）',
  description: '传统问卷系统，专注于基础就业信息收集',
  
  sections: [
    // 第1部分：基础信息收集
    {
      id: 'basic-info-v1',
      title: '基本信息',
      description: '请提供您的基本信息',
      metadata: {
        estimatedTime: 60,
        cognitiveLoad: 'low',
        priority: 'high'
      },
      questions: [
        {
          id: 'age-group-v1',
          type: 'radio',
          title: '您的年龄段是？',
          description: '用于了解不同年龄群体的就业特点',
          required: true,
          options: [
            { value: 'under-20', label: '20岁以下' },
            { value: '20-22', label: '20-22岁' },
            { value: '23-25', label: '23-25岁' },
            { value: '26-28', label: '26-28岁' },
            { value: '29-35', label: '29-35岁' },
            { value: 'over-35', label: '35岁以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'education-level-v1',
          type: 'radio',
          title: '您的最高学历是？',
          required: true,
          options: [
            { value: 'high-school', label: '高中及以下' },
            { value: 'college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士' },
            { value: 'phd', label: '博士' }
          ],
          statistics: {
            enabled: true,
            chartType: 'pie',
            showPercentage: true
          }
        },
        {
          id: 'location-v1',
          type: 'radio',
          title: '您目前所在的城市类型是？',
          required: true,
          options: [
            { value: 'tier1', label: '一线城市（北上广深）' },
            { value: 'tier2', label: '二线城市' },
            { value: 'tier3', label: '三线城市' },
            { value: 'tier4', label: '四线及以下城市' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第2部分：就业状态
    {
      id: 'employment-status-v1',
      title: '就业状态',
      description: '请选择您当前的就业状态',
      metadata: {
        estimatedTime: 90,
        cognitiveLoad: 'medium',
        priority: 'high'
      },
      questions: [
        {
          id: 'current-status-v1',
          type: 'radio',
          title: '您目前的状态是？',
          required: true,
          options: [
            { value: 'employed', label: '已就业' },
            { value: 'unemployed', label: '待业/求职中' },
            { value: 'student', label: '在校学生' },
            { value: 'freelance', label: '自由职业' },
            { value: 'entrepreneur', label: '创业' }
          ],
          statistics: {
            enabled: true,
            chartType: 'donut',
            showPercentage: true
          },
          branchLogic: {
            enabled: true,
            affectedSections: ['employment-details-v1', 'job-search-v1', 'student-details-v1']
          }
        }
      ]
    },

    // 第3部分：就业详情（条件显示）
    {
      id: 'employment-details-v1',
      title: '工作详情',
      description: '请填写您的工作相关信息',
      condition: {
        dependsOn: 'current-status-v1',
        operator: 'equals',
        value: 'employed'
      },
      metadata: {
        estimatedTime: 120,
        cognitiveLoad: 'medium',
        targetAudience: 'employed'
      },
      questions: [
        {
          id: 'industry-v1',
          type: 'radio',
          title: '您所在的行业是？',
          required: true,
          options: [
            { value: 'tech', label: '科技/互联网' },
            { value: 'finance', label: '金融' },
            { value: 'education', label: '教育' },
            { value: 'healthcare', label: '医疗' },
            { value: 'manufacturing', label: '制造业' },
            { value: 'service', label: '服务业' },
            { value: 'government', label: '政府/事业单位' },
            { value: 'other', label: '其他' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'salary-range-v1',
          type: 'radio',
          title: '您的月薪范围是？（税前）',
          required: true,
          options: [
            { value: 'below-3k', label: '3000元以下' },
            { value: '3k-5k', label: '3000-5000元' },
            { value: '5k-8k', label: '5000-8000元' },
            { value: '8k-12k', label: '8000-12000元' },
            { value: '12k-20k', label: '12000-20000元' },
            { value: 'above-20k', label: '20000元以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        }
      ]
    },

    // 第4部分：求职情况（条件显示）
    {
      id: 'job-search-v1',
      title: '求职情况',
      description: '请填写您的求职相关信息',
      condition: {
        dependsOn: 'current-status-v1',
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
          id: 'job-search-duration-v1',
          type: 'radio',
          title: '您求职多长时间了？',
          required: true,
          options: [
            { value: 'less-1month', label: '不到1个月' },
            { value: '1-3months', label: '1-3个月' },
            { value: '3-6months', label: '3-6个月' },
            { value: '6-12months', label: '6个月-1年' },
            { value: 'over-1year', label: '1年以上' }
          ],
          statistics: {
            enabled: true,
            chartType: 'bar',
            showPercentage: true
          }
        },
        {
          id: 'job-search-difficulties-v1',
          type: 'checkbox',
          title: '您在求职过程中遇到的主要困难有？（可多选）',
          required: false,
          options: [
            { value: 'lack-experience', label: '缺乏工作经验' },
            { value: 'skill-mismatch', label: '技能不匹配' },
            { value: 'low-salary', label: '薪资待遇不理想' },
            { value: 'location-limit', label: '地域限制' },
            { value: 'competition', label: '竞争激烈' },
            { value: 'other', label: '其他' }
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
    title: '2025年大学生就业调查（第一版）',
    description: '传统问卷系统，专注于基础就业信息收集',
    allowAnonymous: true,
    requireEmail: false,
    allowBackward: true,
    showProgress: true,
    autoSave: true,
    submitOnComplete: true,
    validation: {
      stopOnFirstError: false,
      showValidationSummary: true
    },
    ui: {
      theme: 'classic',
      showQuestionNumbers: true,
      compactMode: false
    }
  },

  metadata: {
    id: 'questionnaire-v1-2024',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: '问卷1系统',
    category: '传统就业调研',
    tags: ['就业', '传统', '基础调研', 'V1'],
    estimatedTime: 5,
    targetAudience: '大学生及毕业生',
    language: 'zh-CN',
    status: 'published'
  }
};
