/**
 * 重构后的问卷结构
 * 基于用户建议的5层结构设计：
 * 1. 角色维度（基本信息）
 * 2. 状态维度（当前状态）
 * 3. 差异化问卷（基于前两页）
 * 4. 差异化问卷续页（如需要）
 * 5. 通用问卷
 */

import type { UniversalQuestionnaire } from '../types/universal-questionnaire';

export const sampleUniversalQuestionnaire: UniversalQuestionnaire = {
  id: 'restructured-employment-survey-2024',
  title: '2024年大学生就业调查（重构版）',
  description: '基于角色-状态-差异化-通用的清晰结构设计',
  
  sections: [
    // 第1页：角色维度 - 基本信息收集
    {
      id: 'role-demographics',
      title: '第1页：基本信息',
      description: '请填写您的基本信息，用于了解不同群体的就业特点（约1分钟）',
      questions: [
        {
          id: 'age-range',
          type: 'radio',
          title: '您的年龄段是？',
          description: '用于分析不同年龄段的就业特点',
          required: true,
          options: [
            { value: '18-22', label: '18-22岁' },
            { value: '23-25', label: '23-25岁' },
            { value: '26-30', label: '26-30岁' },
            { value: '31-35', label: '31-35岁' },
            { value: 'over-35', label: '35岁以上' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'gender',
          type: 'radio',
          title: '您的性别是？',
          description: '用于分析性别对就业的影响',
          required: true,
          options: [
            { value: 'male', label: '男' },
            { value: 'female', label: '女' },
            { value: 'prefer-not-say', label: '不愿透露' }
          ],
          statistics: { enabled: true, chartType: 'pie', showPercentage: true }
        },
        {
          id: 'location',
          type: 'radio',
          title: '您目前所在的城市类型是？',
          description: '用于分析不同地区的就业环境',
          required: true,
          options: [
            { value: 'tier1', label: '一线城市（北上广深）' },
            { value: 'new-tier1', label: '新一线城市（成都、杭州、武汉等）' },
            { value: 'tier2', label: '二线城市' },
            { value: 'tier3', label: '三线及以下城市' },
            { value: 'rural', label: '农村地区' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'education-level',
          type: 'radio',
          title: '您的最高学历是？',
          description: '请选择您已获得或即将获得的最高学历',
          required: true,
          options: [
            { value: 'high-school', label: '高中及以下' },
            { value: 'junior-college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士研究生' },
            { value: 'phd', label: '博士研究生' }
          ],
          statistics: { enabled: true, chartType: 'pie', showPercentage: true }
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
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        }
      ]
    },

    // 第2页：状态维度 - 当前状态信息收集
    {
      id: 'status-identification',
      title: '第2页：当前状态',
      description: '请选择您当前的状态，后续问题将根据您的状态智能匹配（约30秒）',
      questions: [
        {
          id: 'current-status',
          type: 'radio',
          title: '您目前的主要状态是？',
          description: '请选择最符合您当前情况的状态，这将决定后续问题内容',
          required: true,
          options: [
            { value: 'employed', label: '已就业（包括全职、兼职、实习）' },
            { value: 'unemployed', label: '失业/求职中' },
            { value: 'student', label: '在校学生' },
            { value: 'preparing', label: '备考/进修中' },
            { value: 'other', label: '其他状态' }
          ],
          statistics: { enabled: true, chartType: 'donut', showPercentage: true }
        }
      ]
    },

    // 第3页：差异化问卷 - 已就业人群
    {
      id: 'employed-details',
      title: '第3页：工作情况详情',
      description: '请详细填写您的工作相关信息（约2分钟）',
      condition: {
        dependsOn: 'current-status',
        operator: 'equals',
        value: 'employed'
      },
      questions: [
        {
          id: 'employment-type',
          type: 'radio',
          title: '您的具体就业类型是？',
          required: true,
          options: [
            { value: 'fulltime', label: '全职工作' },
            { value: 'parttime', label: '兼职工作' },
            { value: 'internship', label: '实习' },
            { value: 'freelance', label: '自由职业' }
          ],
          statistics: { enabled: true, chartType: 'pie', showPercentage: true }
        },
        {
          id: 'current-salary',
          type: 'radio',
          title: '您目前的月薪范围是？（税前）',
          required: true,
          options: [
            { value: 'below-3k', label: '3000元以下' },
            { value: '3k-5k', label: '3000-5000元' },
            { value: '5k-8k', label: '5000-8000元' },
            { value: '8k-12k', label: '8000-12000元' },
            { value: '12k-20k', label: '12000-20000元' },
            { value: 'above-20k', label: '20000元以上' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'work-industry',
          type: 'radio',
          title: '您目前工作的行业是？',
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
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'job-satisfaction',
          type: 'radio',
          title: '您对目前工作的满意度如何？',
          required: true,
          options: [
            { value: 'very-satisfied', label: '非常满意' },
            { value: 'satisfied', label: '比较满意' },
            { value: 'neutral', label: '一般' },
            { value: 'dissatisfied', label: '不太满意' },
            { value: 'very-dissatisfied', label: '非常不满意' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        }
      ]
    },

    // 第3页：差异化问卷 - 失业/求职人群
    {
      id: 'unemployed-details',
      title: '第3页：求职情况详情',
      description: '请详细填写您的求职相关信息（约2分钟）',
      condition: {
        dependsOn: 'current-status',
        operator: 'equals',
        value: 'unemployed'
      },
      questions: [
        {
          id: 'unemployment-duration',
          type: 'radio',
          title: '您失业/求职多长时间了？',
          required: true,
          options: [
            { value: 'less-1month', label: '不到1个月' },
            { value: '1-3months', label: '1-3个月' },
            { value: '3-6months', label: '3-6个月' },
            { value: '6-12months', label: '6个月-1年' },
            { value: 'over-1year', label: '1年以上' },
            { value: 'fresh-graduate', label: '应届毕业生，从未工作' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'last-job-salary',
          type: 'radio',
          title: '您上一份工作的月薪范围是？（税前）',
          description: '如果从未工作过，请选择"从未工作过"',
          required: true,
          options: [
            { value: 'below-3k', label: '3000元以下' },
            { value: '3k-5k', label: '3000-5000元' },
            { value: '5k-8k', label: '5000-8000元' },
            { value: '8k-12k', label: '8000-12000元' },
            { value: '12k-20k', label: '12000-20000元' },
            { value: 'above-20k', label: '20000元以上' },
            { value: 'never-worked', label: '从未工作过' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'job-search-channels',
          type: 'checkbox',
          title: '您主要通过哪些渠道求职？（可多选）',
          required: true,
          options: [
            { value: 'online-platforms', label: '招聘网站（智联、前程无忧等）' },
            { value: 'social-media', label: '社交媒体（LinkedIn、微信群等）' },
            { value: 'campus-recruitment', label: '校园招聘' },
            { value: 'referrals', label: '朋友/同事推荐' },
            { value: 'headhunters', label: '猎头推荐' },
            { value: 'company-websites', label: '公司官网直投' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'job-search-difficulties',
          type: 'checkbox',
          title: '您在求职过程中遇到的主要困难是？（可多选）',
          required: true,
          options: [
            { value: 'lack-experience', label: '缺乏工作经验' },
            { value: 'skill-mismatch', label: '技能与岗位不匹配' },
            { value: 'high-competition', label: '竞争激烈' },
            { value: 'low-salary', label: '薪资待遇不理想' },
            { value: 'location-mismatch', label: '工作地点不理想' },
            { value: 'few-opportunities', label: '合适机会较少' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        }
      ]
    },

    // 第3页：差异化问卷 - 在校学生
    {
      id: 'student-details',
      title: '第3页：学习与规划情况',
      description: '请详细填写您的学习和未来规划信息（约2分钟）',
      condition: {
        dependsOn: 'current-status',
        operator: 'equals',
        value: 'student'
      },
      questions: [
        {
          id: 'study-year',
          type: 'radio',
          title: '您目前是几年级？',
          required: true,
          options: [
            { value: 'freshman', label: '大一' },
            { value: 'sophomore', label: '大二' },
            { value: 'junior', label: '大三' },
            { value: 'senior', label: '大四' },
            { value: 'graduate', label: '研究生' },
            { value: 'phd', label: '博士生' }
          ],
          statistics: { enabled: true, chartType: 'pie', showPercentage: true }
        },
        {
          id: 'career-planning',
          type: 'radio',
          title: '您毕业后的主要规划是？',
          required: true,
          options: [
            { value: 'direct-employment', label: '直接就业' },
            { value: 'continue-study', label: '继续深造（考研/读博）' },
            { value: 'study-abroad', label: '出国留学' },
            { value: 'entrepreneurship', label: '创业' },
            { value: 'civil-service', label: '考公务员/事业单位' },
            { value: 'undecided', label: '还未确定' }
          ],
          statistics: { enabled: true, chartType: 'pie', showPercentage: true }
        },
        {
          id: 'internship-experience',
          type: 'radio',
          title: '您的实习经验情况是？',
          required: true,
          options: [
            { value: 'none', label: '没有实习经验' },
            { value: 'one', label: '1次实习经验' },
            { value: 'two-three', label: '2-3次实习经验' },
            { value: 'multiple', label: '3次以上实习经验' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        }
      ]
    },

    // 第4页：通用问卷 - 职业规划与技能评估
    {
      id: 'career-skills-universal',
      title: '第4页：职业规划与技能',
      description: '请分享您的职业规划和技能情况，这些信息对所有人都很重要（约2分钟）',
      questions: [
        {
          id: 'career-goal',
          type: 'radio',
          title: '您未来3-5年的职业目标是？',
          description: '请选择您最主要的职业发展目标',
          required: true,
          options: [
            { value: 'technical-expert', label: '成为技术专家' },
            { value: 'management', label: '走管理路线' },
            { value: 'entrepreneurship', label: '自主创业' },
            { value: 'stable-job', label: '稳定的工作' },
            { value: 'work-life-balance', label: '工作生活平衡' },
            { value: 'high-income', label: '追求高收入' },
            { value: 'social-impact', label: '产生社会影响' },
            { value: 'undecided', label: '还未确定' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'skill-confidence',
          type: 'radio',
          title: '您对自己的专业技能信心如何？',
          description: '请评估您在专业领域的技能水平',
          required: true,
          options: [
            { value: 'very-confident', label: '非常有信心' },
            { value: 'confident', label: '比较有信心' },
            { value: 'neutral', label: '一般' },
            { value: 'lacking', label: '有所欠缺' },
            { value: 'very-lacking', label: '明显不足' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },
        {
          id: 'preferred-work-location',
          type: 'radio',
          title: '您理想的工作地点是？',
          description: '请选择您最希望工作的城市类型',
          required: true,
          options: [
            { value: 'tier1', label: '一线城市（北上广深）' },
            { value: 'new-tier1', label: '新一线城市' },
            { value: 'tier2', label: '二线城市' },
            { value: 'hometown', label: '回家乡发展' },
            { value: 'flexible', label: '无所谓，看机会' }
          ],
          statistics: { enabled: true, chartType: 'pie', showPercentage: true }
        },
        {
          id: 'employment-difficulty',
          type: 'radio',
          title: '您认为当前大学生就业难度如何？',
          description: '请基于您的观察和体验进行评价',
          required: true,
          options: [
            { value: 'very-easy', label: '非常容易' },
            { value: 'easy', label: '比较容易' },
            { value: 'moderate', label: '一般' },
            { value: 'difficult', label: '比较困难' },
            { value: 'very-difficult', label: '非常困难' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        }
      ]
    },

    // 第5页：通用问卷 - 建议与反馈
    {
      id: 'feedback-universal',
      title: '第5页：建议与反馈',
      description: '请分享您的建议和想法，帮助我们改善就业环境（约1分钟）',
      questions: [
        {
          id: 'policy-suggestions',
          type: 'checkbox',
          title: '您认为哪些措施最有助于改善大学生就业状况？（可多选）',
          description: '请选择您认为最重要的改善措施',
          required: false,
          options: [
            { value: 'more-internships', label: '增加实习机会' },
            { value: 'skill-training', label: '加强技能培训' },
            { value: 'career-guidance', label: '提供职业指导' },
            { value: 'reduce-discrimination', label: '减少就业歧视' },
            { value: 'startup-support', label: '支持大学生创业' },
            { value: 'salary-standards', label: '规范薪资标准' },
            { value: 'job-matching', label: '改善岗位匹配' },
            { value: 'education-reform', label: '教育体系改革' }
          ],
          statistics: { enabled: true, chartType: 'bar', showPercentage: true }
        },

      ]
    }
  ],

  config: {
    title: "大学生就业问卷调查",
    description: "了解大学生就业现状和需求",
    allowAnonymous: true,
    requireEmail: false,
    allowBackward: true,
    showProgress: true,
    autoSave: true,
    submitOnComplete: true
  },

  metadata: {
    id: 'restructured-employment-survey-2024',
    version: '2.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: '大学生就业调研团队（重构版）',
    category: '就业调研',
    tags: ['就业', '大学生', '调研', '重构', '逻辑一致'],
    estimatedTime: 5,
    targetAudience: '大学生及毕业生',
    language: 'zh-CN',
    status: 'published'
  }
};
