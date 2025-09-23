// 问卷表单相关类型定义

// 基础类型定义
export interface PersonalInfo {
  name: string;
  gender: 'male' | 'female' | 'prefer-not-say';
  age: number;
  phone: string;
  email: string;
}

export interface EducationInfo {
  university: string;
  major: string;
  degree: 'bachelor' | 'master' | 'doctor';
  graduationYear: number;
  gpa?: number;
}

export interface EmploymentInfo {
  preferredIndustry: string[];
  preferredPosition: string;
  expectedSalary: number;
  preferredLocation: string[];
  workExperience: string;
}

export interface JobSearchInfo {
  searchChannels: string[];
  interviewCount: number;
  offerCount: number;
  searchDuration: number; // 求职时长（月）
}

export interface EmploymentStatus {
  currentStatus: 'employed' | 'unemployed' | 'continuing_education' | 'other';
  currentCompany?: string;
  currentPosition?: string;
  currentSalary?: number;
  satisfactionLevel?: number; // 1-5分
}

// 组合类型定义
export interface QuestionnaireFormData {
  personalInfo: PersonalInfo;
  educationInfo: EducationInfo;
  employmentInfo: EmploymentInfo;
  jobSearchInfo: JobSearchInfo;
  employmentStatus: EmploymentStatus;
}

// 表单步骤定义
export interface FormStep {
  key: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

// 选项数据
export const GENDER_OPTIONS = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '不愿透露', value: 'prefer-not-say' }
];

export const DEGREE_OPTIONS = [
  { label: '本科', value: 'bachelor' },
  { label: '硕士', value: 'master' },
  { label: '博士', value: 'doctor' }
];

export const INDUSTRY_OPTIONS = [
  '互联网/软件',
  '金融/银行',
  '制造业',
  '教育/培训',
  '医疗/健康',
  '咨询/服务',
  '政府/公共事业',
  '媒体/广告',
  '房地产/建筑',
  '零售/电商',
  '能源/环保',
  '交通/物流',
  '其他'
];

export const LOCATION_OPTIONS = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '南京',
  '武汉',
  '成都',
  '西安',
  '重庆',
  '天津',
  '青岛',
  '大连',
  '厦门',
  '苏州',
  '其他'
];

export const SEARCH_CHANNEL_OPTIONS = [
  '校园招聘',
  '网络招聘平台',
  '朋友推荐',
  '导师推荐',
  '实习转正',
  '企业官网',
  '招聘会',
  '猎头推荐',
  '其他'
];

export const EMPLOYMENT_STATUS_OPTIONS = [
  { label: '已就业', value: 'employed' },
  { label: '待就业', value: 'unemployed' },
  { label: '继续深造', value: 'continuing_education' },
  { label: '其他', value: 'other' }
];

// 表单验证规则
export const FORM_RULES = {
  name: [
    { required: true, message: '请输入姓名' },
    { min: 2, message: '姓名至少2个字符' },
    { max: 20, message: '姓名最多20个字符' }
  ],
  gender: [
    { required: true, message: '请选择性别' }
  ],
  age: [
    { required: true, message: '请输入年龄' },
    { type: 'number', min: 16, max: 60, message: '年龄应在16-60岁之间' }
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' }
  ],
  university: [
    { required: true, message: '请输入学校名称' },
    { min: 2, message: '学校名称至少2个字符' }
  ],
  major: [
    { required: true, message: '请输入专业名称' },
    { min: 2, message: '专业名称至少2个字符' }
  ],
  degree: [
    { required: true, message: '请选择学历' }
  ],
  graduationYear: [
    { required: true, message: '请选择毕业年份' },
    { type: 'number', min: 2020, max: 2030, message: '毕业年份应在2020-2030年之间' }
  ],
  preferredIndustry: [
    { required: true, message: '请选择期望行业' },
    { type: 'array', min: 1, message: '至少选择一个行业' }
  ],
  preferredPosition: [
    { required: true, message: '请输入期望职位' }
  ],
  expectedSalary: [
    { required: true, message: '请输入期望薪资' },
    { type: 'number', min: 1000, message: '期望薪资应大于1000' }
  ],
  preferredLocation: [
    { required: true, message: '请选择期望工作地点' },
    { type: 'array', min: 1, message: '至少选择一个地点' }
  ],
  workExperience: [
    { required: true, message: '请描述工作经验' }
  ],
  searchChannels: [
    { required: true, message: '请选择求职渠道' },
    { type: 'array', min: 1, message: '至少选择一个渠道' }
  ],
  interviewCount: [
    { required: true, message: '请输入面试次数' },
    { type: 'number', min: 0, message: '面试次数不能为负数' }
  ],
  offerCount: [
    { required: true, message: '请输入收到offer数量' },
    { type: 'number', min: 0, message: 'offer数量不能为负数' }
  ],
  searchDuration: [
    { required: true, message: '请输入求职时长' },
    { type: 'number', min: 0, message: '求职时长不能为负数' }
  ],
  currentStatus: [
    { required: true, message: '请选择当前就业状态' }
  ]
};
