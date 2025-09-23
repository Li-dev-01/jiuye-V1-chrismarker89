/**
 * 数据生成器路由 - 增强版
 * 提供批量测试数据生成功能，支持定时任务和完整业务流程
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { createDatabaseService } from '../db';
import { authMiddleware } from '../middleware/auth';
import { createTestDatabaseService, type TestStoryData, type TestQuestionnaireData, type TestUserData } from '../services/testDatabaseService';
import { EnhancedQuestionnaireDataGenerator } from '../utils/enhancedQuestionnaireDataGenerator';
import { getAvailableQuestionnaireIds } from '../config/questionnaireDefinitions';
import type { Env } from '../types/api';

const dataGenerator = new Hono<{ Bindings: Env }>();

// 数据生成配置
interface GenerationConfig {
  type: 'questionnaire' | 'questionnaires' | 'enhanced-questionnaire' | 'story' | 'voice' | 'user' | 'semi-anonymous-user' | 'audit' | 'mixed';
  count: number;
  quality: 'basic' | 'standard' | 'premium';
  batchSize?: number;
  template?: string;
  questionnaireId?: string; // 新增：指定问卷ID
  options?: {
    includeVoices?: boolean;
    diversity?: number;
    realism?: number;
    creativity?: number;
    autoApprove?: boolean;
    generateUserFirst?: boolean;
    distributionWeights?: Record<string, Record<string, number>>; // 新增：选项权重分布
  };
}

// 定时生成配置
interface ScheduledGenerationConfig {
  enabled: boolean;
  intervalMinutes: number;
  batchConfig: {
    users: number;
    questionnaires: number;
    stories: number;
    voices: number;
  };
  quality: 'basic' | 'standard' | 'premium';
}

// 生成统计
interface GenerationStats {
  totalGenerated: number;
  todayGenerated: number;
  hourlyGenerated: number;
  successRate: number;
  lastGenerationTime: string;
  activeScheduler: boolean;
}

// 数据模板
const dataTemplates = {
  questionnaire: {
    personalInfo: {
      names: ['张伟', '李娜', '王强', '刘敏', '陈杰', '杨丽', '赵磊', '孙静', '周涛', '吴雪'],
      ages: [22, 23, 24, 25, 26],
      genders: ['male', 'female'],
      phones: ['138****1234', '139****5678', '186****9012'],
      emails: ['user@example.com', 'student@university.edu', 'graduate@company.com']
    },
    educationInfo: {
      universities: ['北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学'],
      majors: ['计算机科学与技术', '软件工程', '电子信息工程', '机械工程', '金融学', '市场营销'],
      degrees: ['bachelor', 'master', 'doctor'],
      graduationYears: [2022, 2023, 2024]
    },
    employmentInfo: {
      statuses: ['employed', 'unemployed', 'studying', 'entrepreneurship'],
      companies: ['阿里巴巴', '腾讯', '百度', '字节跳动', '美团', '滴滴', '京东', '网易'],
      positions: ['软件工程师', '产品经理', '数据分析师', '运营专员', '设计师', '测试工程师'],
      salaries: ['5000-8000', '8000-12000', '12000-20000', '20000-30000', '30000+']
    },
    jobSearchInfo: {
      industries: ['互联网', '金融', '教育', '医疗', '制造业', '房地产', '零售'],
      positions: ['技术岗位', '管理岗位', '销售岗位', '运营岗位', '设计岗位'],
      expectedSalaries: ['8000-12000', '12000-18000', '18000-25000', '25000+']
    },
    advice: [
      '建议学弟学妹们要注重实践能力的培养，多参加实习和项目经验。',
      '在校期间要保持学习的热情，技术更新很快，需要不断跟进。',
      '面试时要展现自己的项目经验和解决问题的能力。',
      '简历要突出重点，展示自己的核心竞争力。',
      '要有明确的职业规划，知道自己想要什么。'
    ],
    observations: [
      '当前就业市场竞争激烈，需要不断提升自己的综合能力。',
      '企业更看重实际能力和项目经验，而不仅仅是学历。',
      '新兴技术领域有更多机会，但也需要持续学习。',
      '软技能同样重要，沟通能力和团队协作能力不可忽视。',
      '要关注行业发展趋势，选择有前景的方向。'
    ]
  },
  story: {
    titles: [
      '我的求职之路：从迷茫到收获心仪offer',
      '转行程序员的心路历程',
      '应届生求职经验分享',
      '从实习到正式工作的转变',
      '职场新人的成长感悟'
    ],
    contents: [
      '回想起自己的求职经历，真是五味杂陈。作为一名应届毕业生，刚开始投简历时总是石沉大海，让我对自己的能力产生了怀疑。后来通过不断学习和练习，逐渐提升了技术水平，调整了求职策略，最终收到了心仪公司的offer。',
      '决定转行做程序员是一个艰难的决定。从零开始学习编程，每天都在挑战自己的极限。虽然过程很辛苦，但看到自己一点点进步，最终成功转行，这种成就感是无法言喻的。',
      '作为应届生，求职过程中遇到了很多挑战。技术面试、项目经验、简历优化等都需要认真准备。通过参加技术分享会、刷题练习、项目实战，最终找到了满意的工作。'
    ]
  },
  voice: {
    encouragements: [
      '相信自己，每一次努力都不会白费！',
      '求职路虽然艰辛，但坚持下去一定会有收获。',
      '不要害怕失败，每次面试都是宝贵的经验。',
      '保持积极的心态，机会总是留给有准备的人。',
      '学弟学妹们加油，你们一定可以的！'
    ],
    experiences: [
      '面试前一定要充分准备，了解公司和岗位要求。',
      '简历要简洁明了，突出自己的核心优势。',
      '技术面试要多练习，熟悉常见的算法和数据结构。',
      '项目经验很重要，要能清楚地表达自己的贡献。',
      '保持学习的习惯，技术更新很快。'
    ]
  }
};

// 生成随机数据
function generateRandomData(type: string, template: string, count: number) {
  const results = [];

  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'questionnaire':
        results.push(generateQuestionnaireData());
        break;
      case 'questionnaires':
        results.push(generateUniversalQuestionnaireData());
        break;
      case 'enhanced-questionnaire':
        // enhanced-questionnaire类型在插入时处理，这里返回占位符
        results.push({ type: 'enhanced-questionnaire' });
        break;
      case 'story':
        results.push(generateStoryData());
        break;
      case 'voice':
        results.push(generateVoiceData());
        break;
      case 'user':
        results.push(generateUserData());
        break;
      case 'semi-anonymous-user':
        results.push(generateSemiAnonymousUserData());
        break;
      case 'audit':
        results.push(generateAuditData());
        break;
    }
  }

  return results;
}

function generateQuestionnaireData() {
  const templates = dataTemplates.questionnaire;
  
  return {
    personalInfo: {
      name: getRandomItem(templates.personalInfo.names),
      age: getRandomItem(templates.personalInfo.ages),
      gender: getRandomItem(templates.personalInfo.genders),
      phone: getRandomItem(templates.personalInfo.phones),
      email: getRandomItem(templates.personalInfo.emails)
    },
    educationInfo: {
      university: getRandomItem(templates.educationInfo.universities),
      major: getRandomItem(templates.educationInfo.majors),
      degree: getRandomItem(templates.educationInfo.degrees),
      graduationYear: getRandomItem(templates.educationInfo.graduationYears)
    },
    employmentInfo: {
      currentStatus: getRandomItem(templates.employmentInfo.statuses),
      company: getRandomItem(templates.employmentInfo.companies),
      position: getRandomItem(templates.employmentInfo.positions),
      salary: getRandomItem(templates.employmentInfo.salaries)
    },
    jobSearchInfo: {
      preferredIndustry: getRandomItem(templates.jobSearchInfo.industries),
      preferredPosition: getRandomItem(templates.jobSearchInfo.positions),
      expectedSalary: getRandomItem(templates.jobSearchInfo.expectedSalaries)
    },
    employmentStatus: {
      isEmployed: Math.random() > 0.3,
      employmentType: Math.random() > 0.2 ? 'full-time' : 'part-time'
    },
    adviceForStudents: getRandomItem(templates.advice),
    observationsOnEmployment: getRandomItem(templates.observations)
  };
}

function generateStoryData() {
  const templates = dataTemplates.story;
  
  return {
    title: getRandomItem(templates.titles),
    content: getRandomItem(templates.contents),
    category: 'job_hunting',
    tags: ['求职', '经验分享', '职场'],
    author: getRandomItem(dataTemplates.questionnaire.personalInfo.names),
    status: 'pending'
  };
}

function generateVoiceData() {
  const templates = dataTemplates.voice;
  
  return {
    content: Math.random() > 0.5 
      ? getRandomItem(templates.encouragements)
      : getRandomItem(templates.experiences),
    type: Math.random() > 0.5 ? 'encouragement' : 'experience',
    author: getRandomItem(dataTemplates.questionnaire.personalInfo.names),
    status: 'pending'
  };
}

function generateUserData() {
  const templates = dataTemplates.questionnaire;

  return {
    username: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    displayName: getRandomItem(templates.personalInfo.names),
    email: getRandomItem(templates.personalInfo.emails),
    userType: 'semi_anonymous',
    status: 'active'
  };
}

function generateSemiAnonymousUserData() {
  const templates = dataTemplates.questionnaire;

  // 生成A+B组合
  const aValue = Math.floor(Math.random() * 90000000000) + 10000000000; // 11位数字
  const bValue = Math.random() > 0.5
    ? Math.floor(Math.random() * 9000) + 1000  // 4位数字
    : Math.floor(Math.random() * 900000) + 100000; // 6位数字

  // 生成身份哈希
  const identityHash = generateHash(`${aValue}:${bValue}`);

  // 生成UUID
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 8);
  const uuid = `semi_anonymous-${timestamp}-${randomStr}`;

  return {
    uuid,
    userType: 'semi_anonymous',
    identityHash,
    aValue: aValue.toString(),
    bValue: bValue.toString(),
    displayName: `匿名用户${Math.floor(Math.random() * 9999) + 1000}`,
    status: 'active',
    permissions: JSON.stringify(['questionnaire:submit', 'story:submit', 'voice:submit']),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
}

function generateUniversalQuestionnaireData() {
  const templates = dataTemplates.questionnaire;

  // 生成6页问卷数据
  const sectionResponses = {
    section1: { // 个人基本信息
      name: getRandomItem(templates.personalInfo.names),
      age: getRandomItem(templates.personalInfo.ages),
      gender: getRandomItem(templates.personalInfo.genders),
      phone: generatePhoneNumber(),
      email: generateEmail()
    },
    section2: { // 教育背景信息
      university: getRandomItem(templates.educationInfo.universities),
      major: getRandomItem(templates.educationInfo.majors),
      degree: getRandomItem(templates.educationInfo.degrees),
      graduationYear: getRandomItem(templates.educationInfo.graduationYears),
      gpa: (Math.random() * 1.5 + 2.5).toFixed(2) // 2.5-4.0
    },
    section3: { // 就业现状信息
      currentStatus: getRandomItem(templates.employmentInfo.statuses),
      company: getRandomItem(templates.employmentInfo.companies),
      position: getRandomItem(templates.employmentInfo.positions),
      salary: getRandomItem(templates.employmentInfo.salaries),
      workExperience: Math.floor(Math.random() * 5) + 1 // 1-5年
    },
    section4: { // 求职经历信息
      jobSearchDuration: Math.floor(Math.random() * 12) + 1, // 1-12个月
      applicationsCount: Math.floor(Math.random() * 50) + 10, // 10-60个
      interviewsCount: Math.floor(Math.random() * 20) + 5, // 5-25个
      offersCount: Math.floor(Math.random() * 5) + 1, // 1-5个
      preferredIndustry: getRandomItem(templates.jobSearchInfo.industries)
    },
    section5: { // 就业状态信息
      isEmployed: Math.random() > 0.3,
      employmentType: Math.random() > 0.2 ? 'full-time' : 'part-time',
      jobSatisfaction: Math.floor(Math.random() * 5) + 1, // 1-5分
      careerGoals: getRandomItem(['技术专家', '管理岗位', '创业', '自由职业', '继续深造'])
    },
    section6: { // 补充信息
      adviceForStudents: getRandomItem(templates.advice),
      observationsOnEmployment: getRandomItem(templates.observations),
      additionalComments: generateRandomComment()
    }
  };

  return {
    questionnaireId: 'questionnaires-v1',
    sectionResponses,
    metadata: {
      submissionTime: new Date().toISOString(),
      ipAddress: generateRandomIP(),
      userAgent: generateRandomUserAgent(),
      completionTime: Math.floor(Math.random() * 1800) + 300, // 5-35分钟
      isCompleted: true
    }
  };
}

function generateAuditData() {
  const contentTypes = ['heart_voice', 'story'];
  const contentType = getRandomItem(contentTypes);
  const contentId = Math.floor(Math.random() * 10) + 1;
  const userUuid = `test-user-${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`;

  return {
    content_type: contentType,
    content_id: contentId,
    content_uuid: `${contentType}-${String(contentId).padStart(3, '0')}`,
    user_uuid: userUuid,
    audit_result: 'pending',
    reviewer_id: null,
    audit_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function getRandomItem<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Array cannot be empty');
  }
  return array[Math.floor(Math.random() * array.length)];
}

function generateHash(input: string): string {
  // 简单的哈希函数（生产环境应使用更安全的哈希算法）
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

function generatePhoneNumber(): string {
  const prefixes = ['138', '139', '186', '188', '199', '133', '153', '180'];
  const prefix = getRandomItem(prefixes);
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${suffix}`;
}

function generateEmail(): string {
  const names = ['zhang', 'li', 'wang', 'liu', 'chen', 'yang', 'zhao', 'sun'];
  const domains = ['qq.com', '163.com', 'gmail.com', 'sina.com', 'outlook.com'];
  const name = getRandomItem(names);
  const number = Math.floor(Math.random() * 9999);
  const domain = getRandomItem(domains);
  return `${name}${number}@${domain}`;
}

function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];
  return getRandomItem(userAgents);
}

function generateRandomComment(): string {
  const comments = [
    '希望能够找到理想的工作机会',
    '感谢提供这个平台让我们分享经验',
    '求职过程确实不容易，需要坚持',
    '希望更多企业能够给应届生机会',
    '技能提升很重要，要持续学习',
    '网络求职渠道越来越重要了',
    '面试技巧需要多加练习',
    '职业规划要趁早做好'
  ];
  return getRandomItem(comments);
}

// 删除重复的函数定义

// 删除重复的函数定义

// 需要管理员权限 - 暂时禁用认证
// dataGenerator.use('*', authMiddleware);

// 开始数据生成
dataGenerator.post('/start', async (c) => {
  try {
    const config: GenerationConfig = await c.req.json();
    const db = createDatabaseService(c.env as Env);
    
    // 生成数据
    const generatedData = generateRandomData(
      config.type,
      config.template || 'basic',
      config.count
    );
    
    // 批量插入数据库
    let insertedCount = 0;
    const batchSize = config.batchSize || 10;
    
    for (let i = 0; i < generatedData.length; i += batchSize) {
      const batch = generatedData.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          if (config.type === 'questionnaire') {
            const questionnaireItem = item as any;
            await db.execute(
              `INSERT INTO questionnaire_responses
               (user_id, personal_info, education_info, employment_info, job_search_info, employment_status, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                null,
                JSON.stringify(questionnaireItem.personalInfo),
                JSON.stringify(questionnaireItem.educationInfo),
                JSON.stringify(questionnaireItem.employmentInfo),
                JSON.stringify(questionnaireItem.jobSearchInfo),
                JSON.stringify(questionnaireItem.employmentStatus),
                'pending',
                new Date().toISOString(),
                new Date().toISOString()
              ]
            );
            insertedCount++;
          } else if (config.type === 'questionnaires') {
            const universalItem = item as any;
            await db.execute(
              `INSERT INTO universal_questionnaire_responses
               (questionnaire_id, user_uuid, responses, submitted_at, is_completed, total_time_seconds, ip_address, user_agent)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                universalItem.questionnaireId,
                null, // 匿名提交
                JSON.stringify(universalItem.sectionResponses),
                universalItem.metadata.submissionTime,
                universalItem.metadata.isCompleted ? 1 : 0,
                universalItem.metadata.completionTime,
                universalItem.metadata.ipAddress,
                universalItem.metadata.userAgent
              ]
            );
            insertedCount++;
          } else if (config.type === 'enhanced-questionnaire') {
            // 使用增强版问卷生成器
            const questionnaireId = config.questionnaireId || 'employment-survey-2024';
            const enhancedGenerator = new EnhancedQuestionnaireDataGenerator({
              questionnaireId,
              count: 1, // 单个生成
              distributionWeights: config.options?.distributionWeights
            });

            const enhancedData = enhancedGenerator.generateBatch()[0];

            await db.execute(
              `INSERT INTO universal_questionnaire_responses
               (questionnaire_id, user_uuid, responses, submitted_at, is_completed, completion_percentage, total_time_seconds, ip_address, user_agent)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                enhancedData.questionnaireId,
                enhancedData.metadata.userId || null,
                JSON.stringify({
                  sectionResponses: enhancedData.sectionResponses,
                  metadata: enhancedData.metadata
                }),
                new Date(enhancedData.metadata.submittedAt).toISOString(),
                enhancedData.metadata.isCompleted ? 1 : 0,
                100,
                enhancedData.metadata.completionTime,
                enhancedData.metadata.ipAddress,
                enhancedData.metadata.userAgent
              ]
            );
            insertedCount++;
          } else if (config.type === 'story') {
            const storyItem = item as any;
            // 生成UUID
            const dataUuid = crypto.randomUUID();
            const userId = `test-user-${Math.floor(Math.random() * 100) + 1}`;

            // 插入到原始故事表
            const rawResult = await db.execute(
              `INSERT INTO raw_story_submissions
               (data_uuid, user_id, title, content, category, tags, submitted_at, raw_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                dataUuid,
                userId,
                storyItem.title,
                storyItem.content,
                storyItem.category,
                JSON.stringify(storyItem.tags || []),
                new Date().toISOString(),
                'completed'
              ]
            );

            // 直接插入到有效故事表（自动审核通过）
            await db.execute(
              `INSERT INTO valid_stories
               (raw_id, data_uuid, user_id, title, content, category, tags, approved_at, audit_status, like_count, view_count)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                rawResult.meta.last_row_id,
                dataUuid,
                userId,
                storyItem.title,
                storyItem.content,
                storyItem.category,
                JSON.stringify(storyItem.tags || []),
                new Date().toISOString(),
                'approved',
                0,
                0
              ]
            );
            insertedCount++;
          } else if (config.type === 'voice') {
            const voiceItem = item as any;
            console.log('处理voice数据:', voiceItem);

            // 生成UUID
            const dataUuid = crypto.randomUUID();
            const userId = `test-user-${Math.floor(Math.random() * 100) + 1}`;

            try {
              // 插入到原始心声表
              const rawResult = await db.execute(
                `INSERT INTO raw_heart_voices
                 (data_uuid, user_id, content, submitted_at, raw_status)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  dataUuid,
                  userId,
                  voiceItem.content,
                  new Date().toISOString(),
                  'completed'
                ]
              );

              // 直接插入到有效心声表（自动审核通过）
              await db.execute(
                `INSERT INTO valid_heart_voices
                 (raw_id, data_uuid, user_id, content, approved_at, audit_status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  rawResult.meta.last_row_id,
                  dataUuid,
                  userId,
                  voiceItem.content,
                  new Date().toISOString(),
                  'approved'
                ]
              );
              console.log('成功插入voice数据:', dataUuid);
              insertedCount++;
            } catch (voiceError) {
              console.error('插入voice数据失败:', voiceError);
            }
          } else if (config.type === 'audit') {
            const auditItem = item as any;
            await db.execute(
              `INSERT INTO audit_records
               (content_type, content_id, content_uuid, user_uuid, audit_result, reviewer_id, audit_notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                auditItem.content_type,
                auditItem.content_id,
                auditItem.content_uuid,
                auditItem.user_uuid,
                auditItem.audit_result,
                auditItem.reviewer_id,
                auditItem.audit_notes,
                auditItem.created_at,
                auditItem.updated_at
              ]
            );
            insertedCount++;
          }
          // 可以添加其他类型的数据插入逻辑
        } catch (error) {
          console.error('插入数据失败:', error);
        }
      }
    }
    
    return c.json({
      success: true,
      data: {
        generationId: `gen_${Date.now()}`,
        totalCount: config.count,
        insertedCount,
        batchSize: config.batchSize || 10,
        estimatedTime: config.count * 100,
        status: 'completed'
      },
      message: `成功生成 ${insertedCount} 条${config.type}数据`
    });
    
  } catch (error: any) {
    console.error('数据生成失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '数据生成失败'
    }, 500);
  }
});

// 获取页面参与统计（新增）
dataGenerator.get('/participation/stats', async (c) => {
  try {
    const db = (c.env as Env).DB;

    // 简化查询，逐个执行
    const questionnaireResult = await db.prepare(`
      SELECT COUNT(*) as total_responses
      FROM universal_questionnaire_responses
    `).first();

    const storyResult = await db.prepare(`
      SELECT COUNT(*) as published
      FROM valid_stories
    `).first();

    const voiceResult = await db.prepare(`
      SELECT COUNT(*) as published
      FROM valid_heart_voices
    `).first();

    return c.json({
      success: true,
      data: {
        questionnaire: {
          participantCount: questionnaireResult?.total_responses || 0,
          totalResponses: questionnaireResult?.total_responses || 0
        },
        stories: {
          publishedCount: storyResult?.published || 0,
          authorCount: storyResult?.published || 0
        },
        voices: {
          publishedCount: voiceResult?.published || 0,
          authorCount: voiceResult?.published || 0
        },
        lastUpdated: new Date().toISOString()
      },
      message: '获取参与统计成功'
    });

  } catch (error) {
    console.error('获取参与统计失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取参与统计失败'
    }, 500);
  }
});

// 获取可用问卷列表
dataGenerator.get('/questionnaires', authMiddleware, async (c) => {
  try {
    const availableQuestionnaires = getAvailableQuestionnaireIds().map(id => ({
      id,
      name: id === 'employment-survey-2024' ? '2025年智能就业调查（升级版）' : id,
      type: 'enhanced-questionnaire',
      version: '2.0.0'
    }));

    return c.json({
      success: true,
      data: availableQuestionnaires,
      message: '获取问卷列表成功'
    });
  } catch (error) {
    console.error('获取问卷列表失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取问卷列表失败'
    }, 500);
  }
});

// 获取生成统计
dataGenerator.get('/stats', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);

    // 获取今日生成数量（模拟数据）
    const todayGenerated = Math.floor(Math.random() * 50) + 20;
    const totalGenerated = Math.floor(Math.random() * 1000) + 500;
    const pendingReview = Math.floor(Math.random() * 100) + 50;
    
    return c.json({
      success: true,
      data: {
        todayGenerated,
        totalGenerated,
        pendingReview,
        approvedCount: totalGenerated - pendingReview,
        rejectedCount: Math.floor(totalGenerated * 0.1),
        passRate: 85.2,
        averageResponseTime: 1250,
        successRate: 94.8,
        errorRate: 5.2
      },
      message: '获取统计数据成功'
    });
    
  } catch (error: any) {
    console.error('获取统计失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取统计失败'
    }, 500);
  }
});

// 获取生成进度（模拟）
dataGenerator.get('/progress/:id', async (c) => {
  const generationId = c.req.param('id');
  
  return c.json({
    success: true,
    data: {
      generationId,
      completed: Math.floor(Math.random() * 100),
      total: 100,
      currentBatch: Math.floor(Math.random() * 10) + 1,
      totalBatches: 10,
      status: 'running',
      errors: [],
      estimatedTimeRemaining: Math.floor(Math.random() * 5000)
    },
    message: '获取进度成功'
  });
});

// 取消生成任务
dataGenerator.post('/cancel/:id', async (c) => {
  const generationId = c.req.param('id');

  return c.json({
    success: true,
    data: { generationId, status: 'cancelled' },
    message: '生成任务已取消'
  });
});

// 定时生成任务 - 每小时生成60条数据到测试数据库
dataGenerator.post('/scheduled-generation', async (c) => {
  try {
    const testDb = createTestDatabaseService(c.env as Env);
    const generationId = `scheduled_${Date.now()}`;

    // 每小时生成配置：60条数据，分配为20个用户、20个问卷、20个故事
    const hourlyConfig = {
      users: 20,
      questionnaires: 20,
      stories: 20
    };

    let totalGenerated = 0;
    const results = {
      users: 0,
      questionnaires: 0,
      stories: 0,
      errors: [] as string[]
    };

    // 记录生成开始
    await testDb.execute(`
      INSERT INTO test_generation_logs
      (generation_id, generation_type, started_at, status, generation_config)
      VALUES (?, ?, ?, ?, ?)
    `, [
      generationId,
      'scheduled',
      new Date().toISOString(),
      'running',
      JSON.stringify(hourlyConfig)
    ]);

    // 1. 生成用户数据到测试数据库
    console.log('开始生成用户数据到测试数据库...');
    for (let i = 0; i < hourlyConfig.users; i++) {
      try {
        const userData = generateSemiAnonymousUserData();
        const testUserData: TestUserData = {
          userType: userData.userType,
          identityHash: userData.identityHash,
          displayName: userData.displayName,
          userDataJson: JSON.stringify(userData),
          generatorVersion: 'v2.0'
        };

        await testDb.insertTestUser(testUserData);
        results.users++;
        totalGenerated++;
      } catch (error) {
        console.error('生成用户失败:', error);
        results.errors.push(`用户生成失败: ${error}`);
      }
    }

    // 2. 生成问卷数据到测试数据库
    console.log('开始生成问卷数据到测试数据库...');
    for (let i = 0; i < hourlyConfig.questionnaires; i++) {
      try {
        const questionnaireData = generateUniversalQuestionnaireData();
        const testQuestionnaireData: TestQuestionnaireData = {
          questionnaireType: 'universal',
          dataJson: JSON.stringify(questionnaireData),
          generatorVersion: 'v2.0',
          generationConfig: JSON.stringify({ template: 'standard', quality: 'high' })
        };

        await testDb.insertTestQuestionnaire(testQuestionnaireData);
        results.questionnaires++;
        totalGenerated++;
      } catch (error) {
        console.error('生成问卷失败:', error);
        results.errors.push(`问卷生成失败: ${error}`);
      }
    }

    // 3. 生成故事数据到测试数据库
    console.log('开始生成故事数据到测试数据库...');
    for (let i = 0; i < hourlyConfig.stories; i++) {
      try {
        const storyData = generateStoryData();
        const testStoryData: TestStoryData = {
          title: storyData.title,
          content: storyData.content,
          category: storyData.category || '求职经历',
          tags: storyData.tags || [],
          authorName: '匿名用户',
          generatorVersion: 'v2.0',
          generationTemplate: 'standard'
        };

        await testDb.insertTestStory(testStoryData);
        results.stories++;
        totalGenerated++;
      } catch (error) {
        console.error('生成故事失败:', error);
        results.errors.push(`故事生成失败: ${error}`);
      }
    }

    // 记录生成完成
    const completedAt = new Date().toISOString();
    const executionTime = Date.now() - parseInt(generationId.split('_')[1]);

    await testDb.execute(`
      UPDATE test_generation_logs
      SET completed_at = ?,
          execution_time_ms = ?,
          status = 'completed',
          total_generated = ?,
          users_generated = ?,
          questionnaires_generated = ?,
          stories_generated = ?
      WHERE generation_id = ?
    `, [
      completedAt,
      executionTime,
      totalGenerated,
      results.users,
      results.questionnaires,
      results.stories,
      generationId
    ]);

    return c.json({
      success: true,
      data: {
        generationId,
        totalGenerated,
        results,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime
      },
      message: `定时生成完成：用户${results.users}个，问卷${results.questionnaires}份，故事${results.stories}个（已存储到测试数据库）`
    });

  } catch (error: any) {
    console.error('定时生成失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '定时生成失败'
    }, 500);
  }
});

// 测试数据库统计信息
dataGenerator.get('/test-database/stats', async (c) => {
  console.log('🔍 开始获取测试数据库统计信息...');

  try {
    const testDb = createTestDatabaseService(c.env as Env);
    console.log('✅ 测试数据库服务创建成功');

    // 先测试基本连接
    console.log('🔍 测试数据库连接...');
    const connectionTest = await testDb.execute('SELECT 1 as test');
    console.log('✅ 数据库连接测试成功:', connectionTest);

    // 获取各类型数据统计
    console.log('🔍 查询故事统计...');
    const storyStats = await testDb.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN submitted_to_main = 1 THEN 1 END) as submitted,
        AVG(quality_score) as avg_quality,
        COUNT(CASE WHEN quality_score >= 80 THEN 1 END) as high_quality
      FROM test_story_data
    `);
    console.log('✅ 故事统计查询成功:', storyStats.results[0]);

    console.log('🔍 查询问卷统计...');
    const questionnaireStats = await testDb.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN submitted_to_main = 1 THEN 1 END) as submitted,
        AVG(quality_score) as avg_quality
      FROM test_questionnaire_data
    `);
    console.log('✅ 问卷统计查询成功:', questionnaireStats.results[0]);

    console.log('🔍 查询用户统计...');
    const userStats = await testDb.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN submitted_to_main = 1 THEN 1 END) as submitted,
        AVG(quality_score) as avg_quality
      FROM test_user_data
    `);
    console.log('✅ 用户统计查询成功:', userStats.results[0]);

    const result = {
      success: true,
      data: {
        connection: 'ok',
        byType: {
          stories: storyStats.results[0] || { total: 0, submitted: 0, avg_quality: 0, high_quality: 0 },
          questionnaires: questionnaireStats.results[0] || { total: 0, submitted: 0, avg_quality: 0 },
          users: userStats.results[0] || { total: 0, submitted: 0, avg_quality: 0 }
        }
      }
    };

    console.log('✅ 测试数据库统计获取成功:', result);
    return c.json(result);

  } catch (error: any) {
    console.error('❌ 获取测试数据库统计失败:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取测试数据库统计失败',
      details: error.message
    }, 500);
  }
});

// 清空测试数据库
dataGenerator.post('/test-database/clear', async (c) => {
  try {
    const testDb = createTestDatabaseService(c.env as Env);

    // 清空所有测试数据表
    await testDb.execute('DELETE FROM test_story_data');
    await testDb.execute('DELETE FROM test_questionnaire_data');
    await testDb.execute('DELETE FROM test_user_data');
    await testDb.execute('DELETE FROM test_generation_logs');
    await testDb.execute('DELETE FROM test_submission_logs');

    return c.json({
      success: true,
      message: '测试数据库已清空'
    });

  } catch (error: any) {
    console.error('清空测试数据库失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '清空测试数据库失败'
    }, 500);
  }
});

// 获取测试数据预览
dataGenerator.get('/test-database/preview/:type', async (c) => {
  try {
    const testDb = createTestDatabaseService(c.env as Env);
    const dataType = c.req.param('type'); // story, questionnaire, user
    const limit = parseInt(c.req.query('limit') || '10');

    const data = await testDb.getUnsubmittedData(dataType, limit);

    return c.json({
      success: true,
      data: {
        type: dataType,
        count: data.length,
        items: data
      }
    });

  } catch (error: any) {
    console.error('获取测试数据预览失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取测试数据预览失败'
    }, 500);
  }
});

// 随机数据提交系统 - 从测试数据库提交到主数据库
dataGenerator.post('/submit-random-data', async (c) => {
  console.log('🚀 开始随机数据提交...');

  try {
    console.log('🔍 初始化服务...');
    const testDb = createTestDatabaseService(c.env as Env);
    const mainDb = createDatabaseService(c.env as Env);
    const submissionId = `submission_${Date.now()}`;

    console.log('✅ 服务初始化成功:', { submissionId });

    // 提交配置：每次提交5条高质量数据（简化测试）
    const submissionConfig = {
      stories: 5,
      questionnaires: 5, // 启用问卷提交
      users: 5, // 启用用户提交
      minQualityScore: 75
    };

    console.log('📋 提交配置:', submissionConfig);

    let totalSubmitted = 0;
    const results = {
      stories: 0,
      questionnaires: 0,
      users: 0,
      errors: [] as string[]
    };

    // 记录提交开始
    await testDb.execute(`
      INSERT INTO test_submission_logs
      (submission_id, submission_type, started_at, status, selection_strategy, min_quality_threshold)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      submissionId,
      'manual',
      new Date().toISOString(),
      'running',
      'quality_based',
      submissionConfig.minQualityScore
    ]);

    // 1. 提交故事数据
    console.log('开始提交故事数据到主数据库...');
    const highQualityStories = await testDb.getHighQualityData('story', submissionConfig.minQualityScore, submissionConfig.stories);

    for (const storyData of highQualityStories) {
      try {
        const dataUuid = crypto.randomUUID();
        const userId = `test-user-${Math.floor(Math.random() * 1000) + 1}`;

        // 插入到主数据库的原始故事表
        const rawResult = await mainDb.execute(
          `INSERT INTO raw_story_submissions
           (data_uuid, user_id, title, content, submitted_at, raw_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            dataUuid,
            userId,
            storyData.title,
            storyData.content,
            new Date().toISOString(),
            'completed'
          ]
        );

        // 由于审核为默认通过模式，直接插入到有效故事表
        await mainDb.execute(
          `INSERT INTO valid_stories
           (raw_id, data_uuid, user_id, title, content, approved_at, audit_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            rawResult.meta.last_row_id,
            dataUuid,
            userId,
            storyData.title,
            storyData.content,
            new Date().toISOString(),
            'approved'
          ]
        );

        // 标记测试数据为已提交
        await testDb.markAsSubmitted('story', [storyData.id], {
          success: true,
          mainDataUuid: dataUuid,
          submittedAt: new Date().toISOString()
        });

        results.stories++;
        totalSubmitted++;

      } catch (error) {
        console.error('提交故事失败:', error);
        results.errors.push(`故事提交失败: ${error}`);
      }
    }

    // 2. 提交问卷数据
    console.log('开始提交问卷数据到主数据库...');
    const highQualityQuestionnaires = await testDb.getHighQualityData('questionnaire', submissionConfig.minQualityScore, submissionConfig.questionnaires);
    console.log(`找到${highQualityQuestionnaires.length}条高质量问卷数据`);

    for (const questionnaireData of highQualityQuestionnaires) {
      try {
        const dataUuid = crypto.randomUUID();
        const userId = `user_${Math.floor(Math.random() * 1000) + 1}`;

        // 解析问卷数据
        const parsedData = JSON.parse(questionnaireData.data_json);

        // 插入到主数据库的问卷响应表
        await mainDb.execute(`
          INSERT INTO universal_questionnaire_responses
          (questionnaire_id, user_uuid, session_id, responses, is_completed, is_valid, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          'employment-survey-2024',
          userId,
          `session_${Math.random().toString(36).substring(7)}`,
          questionnaireData.data_json,
          1,
          1,
          new Date().toISOString()
        ]);

        // 标记测试数据为已提交
        await testDb.markAsSubmitted('questionnaire', [questionnaireData.id], {
          success: true,
          mainDataUuid: dataUuid,
          submittedAt: new Date().toISOString()
        });

        results.questionnaires++;
        totalSubmitted++;

      } catch (error) {
        console.error('提交问卷失败:', error);
        results.errors.push(`问卷提交失败: ${error}`);
      }
    }

    // 3. 提交用户数据
    console.log('开始提交用户数据到主数据库...');
    const highQualityUsers = await testDb.getHighQualityData('user', submissionConfig.minQualityScore, submissionConfig.users);
    console.log(`找到${highQualityUsers.length}条高质量用户数据`);

    for (const userData of highQualityUsers) {
      try {
        const dataUuid = crypto.randomUUID();

        // 解析用户数据
        const parsedUserData = JSON.parse(userData.user_data_json);

        // 插入到主数据库的用户表
        await mainDb.execute(`
          INSERT INTO universal_users
          (uuid, user_type, identity_hash, display_name, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          dataUuid,
          userData.user_type,
          parsedUserData.identityHash || `hash_${Math.random().toString(36).substring(7)}`,
          userData.display_name,
          'active',
          new Date().toISOString()
        ]);

        // 标记测试数据为已提交
        await testDb.markAsSubmitted('user', [userData.id], {
          success: true,
          mainDataUuid: dataUuid,
          submittedAt: new Date().toISOString()
        });

        results.users++;
        totalSubmitted++;

      } catch (error) {
        console.error('提交用户失败:', error);
        results.errors.push(`用户提交失败: ${error}`);
      }
    }

    // 记录提交完成
    const completedAt = new Date().toISOString();
    const executionTime = Date.now() - parseInt(submissionId.split('_')[1]);

    await testDb.execute(`
      UPDATE test_submission_logs
      SET completed_at = ?,
          execution_time_ms = ?,
          status = 'completed',
          total_submitted = ?,
          stories_submitted = ?,
          questionnaires_submitted = ?,
          users_submitted = ?,
          success_count = ?,
          failure_count = ?,
          success_rate = ?
      WHERE submission_id = ?
    `, [
      completedAt,
      executionTime,
      totalSubmitted,
      results.stories,
      results.questionnaires,
      results.users,
      totalSubmitted,
      results.errors.length,
      totalSubmitted > 0 ? (totalSubmitted / (totalSubmitted + results.errors.length)) * 100 : 0,
      submissionId
    ]);

    return c.json({
      success: true,
      data: {
        submissionId,
        totalSubmitted,
        results,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime
      },
      message: `随机数据提交完成：故事${results.stories}个（已提交到主数据库并自动审核通过）`
    });

  } catch (error: any) {
    console.error('随机数据提交失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '随机数据提交失败'
    }, 500);
  }
});

// 获取提交历史记录
dataGenerator.get('/submission-history', async (c) => {
  try {
    const testDb = createTestDatabaseService(c.env as Env);
    const limit = parseInt(c.req.query('limit') || '10');

    const history = await testDb.execute(`
      SELECT * FROM test_submission_logs
      ORDER BY started_at DESC
      LIMIT ?
    `, [limit]);

    return c.json({
      success: true,
      data: {
        submissions: history.results,
        count: history.results.length
      }
    });

  } catch (error: any) {
    console.error('获取提交历史失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取提交历史失败'
    }, 500);
  }
});

// ============================================
// 智能数据生成API端点
// ============================================

// 清除现有数据
dataGenerator.post('/clear', async (c) => {
  try {
    const data = await c.req.json();
    const dataType = data.dataType || 'all';
    const db = createDatabaseService(c.env as Env);

    let deletedCounts = { voices: 0, stories: 0, questionnaires: 0 };

    if (dataType === 'voice' || dataType === 'all') {
      const voiceResult = await db.execute('DELETE FROM valid_heart_voices');
      await db.execute('DELETE FROM raw_heart_voices');
      deletedCounts.voices = voiceResult.meta.changes || 0;
    }

    if (dataType === 'story' || dataType === 'all') {
      const storyResult = await db.execute('DELETE FROM valid_stories');
      await db.execute('DELETE FROM raw_story_submissions');
      deletedCounts.stories = storyResult.meta.changes || 0;
    }

    if (dataType === 'questionnaire' || dataType === 'all') {
      const questionnaireResult = await db.execute('DELETE FROM universal_questionnaire_responses');
      deletedCounts.questionnaires = questionnaireResult.meta.changes || 0;
    }

    return c.json({
      success: true,
      message: `成功清除${dataType}数据`,
      data: deletedCounts
    });

  } catch (error: any) {
    console.error('清除数据失败:', error);
    return c.json({
      success: false,
      message: `清除数据失败: ${error.message}`
    }, 500);
  }
});

// 生成智能心声数据
dataGenerator.post('/smart-voice', async (c) => {
  try {
    const config = await c.req.json();
    console.log('收到智能心声生成请求:', config);

    const db = createDatabaseService(c.env as Env);
    const count = config.count || 50;
    console.log(`准备生成${count}条心声数据`);
    const voiceCategories = {
      'gratitude': { weight: 20, tags: ['问卷设计', '用户体验', '数据收集', '平台功能'] },
      'suggestion': { weight: 25, tags: ['界面优化', '功能改进', '流程简化', '数据分析'] },
      'reflection': { weight: 30, tags: ['就业思考', '职业规划', '成长感悟', '人生感悟'] },
      'experience': { weight: 20, tags: ['求职经验', '面试技巧', '职场经验', '学习方法'] },
      'other': { weight: 5, tags: ['技术问题', '使用体验', '期望功能', '改进意见'] }
    };

    const templates = {
      'gratitude': [
        '非常感谢这个问卷平台，{feature}设计得很人性化，让我能够轻松表达自己的就业想法。',
        '问卷的{aspect}做得很好，希望能帮助更多像我一样的求职者。'
      ],
      'suggestion': [
        '建议在{area}方面进行优化，比如{specific}，这样会更方便用户使用。',
        '希望能增加{feature}功能，这对{target}会很有帮助。'
      ],
      'reflection': [
        '通过填写这个问卷，我深刻反思了自己的{aspect}，意识到{realization}。',
        '问卷让我重新审视了{topic}，{insight}是我最大的收获。'
      ],
      'experience': [
        '作为{background}，我想分享一些{type}：{advice}。',
        '在{situation}过程中，我学到了{lesson}，希望对其他人有帮助。'
      ],
      'other': [
        '关于{topic}，我有一些{type}想法：{content}。',
        '希望平台能在{area}方面有所发展，{expectation}。'
      ]
    };

    let generatedCount = 0;
    console.log(`开始生成${count}条心声数据...`);

    for (let i = 0; i < count; i++) {
      console.log(`生成第${i + 1}条心声数据...`);
      // 根据权重选择分类
      const rand = Math.random() * 100;
      let cumulative = 0;
      let selectedCategory = 'other';

      for (const [category, info] of Object.entries(voiceCategories)) {
        cumulative += info.weight;
        if (rand <= cumulative) {
          selectedCategory = category;
          break;
        }
      }

      // 生成内容
      const categoryTemplates = templates[selectedCategory as keyof typeof templates];
      const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

      // 简单的变量替换
      const content = template
        .replace('{feature}', '界面设计')
        .replace('{aspect}', '用户体验')
        .replace('{area}', '功能设计')
        .replace('{specific}', '增加搜索功能')
        .replace('{target}', '求职者')
        .replace('{topic}', '就业规划')
        .replace('{background}', '应届毕业生')
        .replace('{type}', '经验')
        .replace('{advice}', '要多准备面试')
        .replace('{situation}', '求职')
        .replace('{lesson}', '坚持很重要')
        .replace('{realization}', '需要更好的规划')
        .replace('{insight}', '自我认知')
        .replace('{content}', '希望能改进')
        .replace('{expectation}', '更好的用户体验');

      // 选择标签
      const categoryInfo = voiceCategories[selectedCategory as keyof typeof voiceCategories];
      const tags = categoryInfo.tags.slice(0, Math.floor(Math.random() * 3) + 2);

      // 生成点赞数（符合真实分布）
      const likeRand = Math.random();
      let likeCount = 0;
      if (likeRand < 0.1) likeCount = Math.floor(Math.random() * 150) + 50; // 热门
      else if (likeRand < 0.4) likeCount = Math.floor(Math.random() * 40) + 10; // 中等
      else likeCount = Math.floor(Math.random() * 10) + 1; // 一般

      // 插入数据
      const dataUuid = crypto.randomUUID();
      const userId = `smart-user-${Math.floor(Math.random() * 1000) + 1}`;

      try {
        console.log(`准备插入心声数据: ${selectedCategory}, 内容长度: ${content.length}`);

        const finalContent = `[${selectedCategory}] ${content} #${tags.join(' #')}`;

        // 先插入原始数据
        const rawResult = await db.execute(
          `INSERT INTO raw_heart_voices
           (data_uuid, user_id, content, submitted_at, raw_status)
           VALUES (?, ?, ?, ?, ?)`,
          [
            dataUuid,
            userId,
            finalContent,
            new Date().toISOString(),
            'completed'
          ]
        );

        // 再插入有效数据
        const result = await db.execute(
          `INSERT INTO valid_heart_voices
           (raw_id, data_uuid, user_id, content, approved_at, audit_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rawResult.meta.last_row_id,
            dataUuid,
            userId,
            finalContent,
            new Date().toISOString(),
            'approved'
          ]
        );

        console.log(`插入成功，ID: ${result.meta.last_row_id}`);
        generatedCount++;
      } catch (error) {
        console.error('插入心声数据失败:', error, {
          dataUuid,
          userId,
          content: content.substring(0, 50),
          selectedCategory,
          tags
        });
      }
    }

    console.log(`生成完成，总计: ${generatedCount}条`);

    return c.json({
      success: true,
      message: `成功生成${generatedCount}条智能心声数据`,
      data: {
        generated_count: generatedCount,
        requested_count: count,
        debug_info: `循环执行了${count}次，成功插入${generatedCount}条`
      }
    });

  } catch (error: any) {
    console.error('生成心声数据失败:', error);
    return c.json({
      success: false,
      message: `生成心声数据失败: ${error.message}`
    }, 500);
  }
});

// 生成智能故事数据
dataGenerator.post('/smart-story', async (c) => {
  try {
    const config = await c.req.json();
    const db = createDatabaseService(c.env as Env);

    const count = config.count || 30;
    const storyCategories = {
      'job_search': { weight: 25, tags: ['求职经验', '面试技巧', '简历优化', '网申技巧'] },
      'interview': { weight: 20, tags: ['面试准备', '面试技巧', '面试经验', '面试心得'] },
      'career_change': { weight: 15, tags: ['转行', '跳槽', '职业规划', '技能转换'] },
      'internship': { weight: 15, tags: ['实习经历', '实习感悟', '实习收获', '实习建议'] },
      'workplace': { weight: 15, tags: ['工作环境', '团队合作', '职业发展', '工作压力'] },
      'growth': { weight: 5, tags: ['个人成长', '职业发展', '技能提升', '心态调整'] },
      'advice': { weight: 5, tags: ['经验分享', '建议', '指导', '帮助'] }
    };

    const storyTemplates = {
      'job_search': {
        titles: ['我的{duration}求职路：从{start}到{end}', '{company}求职经历分享'],
        contents: ['作为{background}，我的求职之路{description}。通过{method}，最终{result}。{advice}']
      },
      'interview': {
        titles: ['{company}面试经历分享', '面试{position}的经验总结'],
        contents: ['最近参加了{company}的面试，{process}。面试官问了{questions}，{experience}。{conclusion}']
      },
      'career_change': {
        titles: ['从{old_field}到{new_field}的转行之路', '转行{field}的心路历程'],
        contents: ['我原本是{old_background}，后来决定转行到{new_field}。{reason}。转行过程中{challenges}，但最终{outcome}。']
      },
      'internship': {
        titles: ['在{company}实习的{duration}收获', '{position}实习经验分享'],
        contents: ['这次在{company}的实习让我{learning}。{specific_experience}。{growth}对我来说是最大的收获。']
      },
      'workplace': {
        titles: ['职场{topic}的一些思考', '工作{duration}的感悟'],
        contents: ['工作{duration}以来，对{aspect}有了一些体会。{observation}。{advice}希望对大家有帮助。']
      },
      'growth': {
        titles: ['{period}的成长与思考', '个人成长的一些感悟'],
        contents: ['回顾{timeframe}，我在{aspects}方面有了很大成长。{specific_growth}。{reflection}']
      },
      'advice': {
        titles: ['给{target_group}的一些建议', '{topic}经验分享'],
        contents: ['作为{identity}，我想给{audience}分享一些{topic}的经验。{main_advice}。{encouragement}']
      }
    };

    let generatedCount = 0;

    for (let i = 0; i < count; i++) {
      // 根据权重选择分类
      const rand = Math.random() * 100;
      let cumulative = 0;
      let selectedCategory = 'job_search';

      for (const [category, info] of Object.entries(storyCategories)) {
        cumulative += info.weight;
        if (rand <= cumulative) {
          selectedCategory = category;
          break;
        }
      }

      // 生成标题和内容
      const categoryTemplates = storyTemplates[selectedCategory as keyof typeof storyTemplates];
      const title = categoryTemplates.titles[Math.floor(Math.random() * categoryTemplates.titles.length)];
      const content = categoryTemplates.contents[Math.floor(Math.random() * categoryTemplates.contents.length)];

      // 简单的变量替换
      const finalTitle = title
        .replace('{duration}', '半年')
        .replace('{start}', '迷茫')
        .replace('{end}', '收获')
        .replace('{company}', '某大厂')
        .replace('{position}', '产品经理')
        .replace('{old_field}', '传统行业')
        .replace('{new_field}', '互联网')
        .replace('{field}', '技术')
        .replace('{topic}', '沟通')
        .replace('{period}', '这一年')
        .replace('{target_group}', '学弟学妹');

      const finalContent = content
        .replace('{background}', '应届毕业生')
        .replace('{description}', '充满挑战')
        .replace('{method}', '不断学习和实践')
        .replace('{result}', '找到了心仪的工作')
        .replace('{advice}', '希望大家都能坚持下去')
        .replace('{company}', '某知名公司')
        .replace('{process}', '整个过程很顺利')
        .replace('{questions}', '很多技术问题')
        .replace('{experience}', '收获很大')
        .replace('{conclusion}', '总的来说是很好的经历')
        .replace('{old_background}', '传统行业从业者')
        .replace('{new_field}', '互联网行业')
        .replace('{reason}', '希望有更好的发展')
        .replace('{challenges}', '遇到了很多困难')
        .replace('{outcome}', '成功实现了转行')
        .replace('{learning}', '学到了很多')
        .replace('{specific_experience}', '参与了多个项目')
        .replace('{growth}', '技能的提升')
        .replace('{duration}', '一年多')
        .replace('{aspect}', '团队合作')
        .replace('{observation}', '沟通很重要')
        .replace('{timeframe}', '过去一年')
        .replace('{aspects}', '专业技能')
        .replace('{specific_growth}', '解决问题的能力提升了')
        .replace('{reflection}', '这让我更加自信')
        .replace('{identity}', '过来人')
        .replace('{audience}', '大家')
        .replace('{topic}', '求职')
        .replace('{main_advice}', '要保持积极的心态')
        .replace('{encouragement}', '相信大家都能成功');

      // 选择标签
      const categoryInfo = storyCategories[selectedCategory as keyof typeof storyCategories];
      const tags = categoryInfo.tags.slice(0, Math.floor(Math.random() * 3) + 3);

      // 生成互动数据（符合真实分布）
      const popularityRand = Math.random();
      let likeCount = 0, viewCount = 0;
      if (popularityRand < 0.05) { // 5% 爆款
        likeCount = Math.floor(Math.random() * 400) + 100;
        viewCount = Math.floor(Math.random() * 2000) + 500;
      } else if (popularityRand < 0.2) { // 15% 热门
        likeCount = Math.floor(Math.random() * 80) + 20;
        viewCount = Math.floor(Math.random() * 400) + 100;
      } else if (popularityRand < 0.55) { // 35% 中等
        likeCount = Math.floor(Math.random() * 15) + 5;
        viewCount = Math.floor(Math.random() * 80) + 20;
      } else { // 40% 一般
        likeCount = Math.floor(Math.random() * 5) + 1;
        viewCount = Math.floor(Math.random() * 30) + 10;
      }

      // 插入数据
      const dataUuid = crypto.randomUUID();
      const userId = `smart-user-${Math.floor(Math.random() * 1000) + 1}`;

      try {
        const enhancedTitle = `[${selectedCategory}] ${finalTitle}`;
        const enhancedContent = `${finalContent}\n\n标签: #${tags.join(' #')}`;

        // 先插入原始数据
        const rawResult = await db.execute(
          `INSERT INTO raw_story_submissions
           (data_uuid, user_id, title, content, submitted_at, raw_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            dataUuid,
            userId,
            enhancedTitle,
            enhancedContent,
            new Date().toISOString(),
            'completed'
          ]
        );

        // 再插入有效数据
        await db.execute(
          `INSERT INTO valid_stories
           (raw_id, data_uuid, user_id, title, content, approved_at, audit_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            rawResult.meta.last_row_id,
            dataUuid,
            userId,
            enhancedTitle,
            enhancedContent,
            new Date().toISOString(),
            'approved'
          ]
        );

        generatedCount++;
      } catch (error) {
        console.error('插入故事数据失败:', error, {
          dataUuid,
          userId,
          title: finalTitle.substring(0, 30),
          selectedCategory,
          tags
        });
      }
    }

    return c.json({
      success: true,
      message: `成功生成${generatedCount}条智能故事数据`,
      data: { generated_count: generatedCount }
    });

  } catch (error: any) {
    console.error('生成故事数据失败:', error);
    return c.json({
      success: false,
      message: `生成故事数据失败: ${error.message}`
    }, 500);
  }
});

// 测试数据库连接
dataGenerator.post('/test-insert', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);

    const testUuid = crypto.randomUUID();
    const testUserId = 'test-user-123';
    const testContent = '这是一条测试心声数据';

    console.log('开始测试插入...');

    // 先插入原始数据
    const rawResult = await db.execute(
      `INSERT INTO raw_heart_voices
       (data_uuid, user_id, content, submitted_at, raw_status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        testUuid,
        testUserId,
        testContent,
        new Date().toISOString(),
        'completed'
      ]
    );

    // 再插入有效数据
    const result = await db.execute(
      `INSERT INTO valid_heart_voices
       (raw_id, data_uuid, user_id, content, approved_at, audit_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        rawResult.meta.last_row_id,
        testUuid,
        testUserId,
        testContent,
        new Date().toISOString(),
        'approved'
      ]
    );

    console.log('测试插入成功:', result);

    return c.json({
      success: true,
      message: '测试插入成功',
      data: {
        inserted_id: result.meta.last_row_id,
        changes: result.meta.changes
      }
    });

  } catch (error: any) {
    console.error('测试插入失败:', error);
    return c.json({
      success: false,
      message: `测试插入失败: ${error.message}`,
      error: error.toString()
    }, 500);
  }
});

// 初始化内容管理表
dataGenerator.post('/init-content-tables', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);

    console.log('开始初始化内容管理表...');

    // 创建内容分类表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS content_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_key TEXT UNIQUE NOT NULL,
        category_name TEXT NOT NULL,
        category_name_en TEXT,
        description TEXT,
        parent_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        icon TEXT,
        color TEXT DEFAULT '#1890ff',
        is_active BOOLEAN DEFAULT true,
        content_type TEXT DEFAULT 'all',
        display_rules TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES content_categories(id)
      )
    `);

    // 创建内容标签表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS content_tags (
        id TEXT PRIMARY KEY,
        tag_key TEXT UNIQUE NOT NULL,
        tag_name TEXT NOT NULL,
        tag_name_en TEXT,
        description TEXT,
        tag_type TEXT DEFAULT 'system',
        color TEXT DEFAULT '#1890ff',
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        content_type TEXT DEFAULT 'all',
        admin_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建内容标签关联表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS content_tag_relations (
        id TEXT PRIMARY KEY,
        content_id TEXT NOT NULL,
        content_type TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_id) REFERENCES content_tags(id),
        UNIQUE(content_id, content_type, tag_id)
      )
    `);

    console.log('数据库表创建完成，开始插入初始数据...');

    // 插入基础内容分类
    const categories = [
      {
        key: 'job_search',
        name: '求职找工作',
        name_en: 'Job Search',
        description: '求职过程、面试经验、简历制作等相关内容',
        icon: '💼',
        color: '#1890ff',
        content_type: 'all',
        sort_order: 1
      },
      {
        key: 'career_development',
        name: '职业发展',
        name_en: 'Career Development',
        description: '职业规划、技能提升、晋升经验等',
        icon: '📈',
        color: '#52c41a',
        content_type: 'all',
        sort_order: 2
      },
      {
        key: 'workplace_culture',
        name: '职场文化',
        name_en: 'Workplace Culture',
        description: '工作环境、团队合作、企业文化等',
        icon: '🏢',
        color: '#fa8c16',
        content_type: 'all',
        sort_order: 3
      },
      {
        key: 'salary_benefits',
        name: '薪资福利',
        name_en: 'Salary & Benefits',
        description: '薪资待遇、福利政策、谈薪技巧等',
        icon: '💰',
        color: '#eb2f96',
        content_type: 'all',
        sort_order: 4
      },
      {
        key: 'education_training',
        name: '教育培训',
        name_en: 'Education & Training',
        description: '学历要求、技能培训、继续教育等',
        icon: '🎓',
        color: '#722ed1',
        content_type: 'all',
        sort_order: 5
      }
    ];

    for (const category of categories) {
      try {
        await db.execute(
          `INSERT OR IGNORE INTO content_categories
           (category_key, category_name, category_name_en, description, icon, color, content_type, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            category.key,
            category.name,
            category.name_en,
            category.description,
            category.icon,
            category.color,
            category.content_type,
            category.sort_order
          ]
        );
      } catch (error) {
        console.error(`插入分类 ${category.key} 失败:`, error);
      }
    }

    // 插入基础内容标签
    const tags = [
      // 求职相关标签
      { key: 'interview', name: '面试技巧', name_en: 'Interview', type: 'system', color: '#1890ff', content_type: 'all' },
      { key: 'resume', name: '简历制作', name_en: 'Resume', type: 'system', color: '#52c41a', content_type: 'all' },
      { key: 'job_hunting', name: '求职经验', name_en: 'Job Hunting', type: 'system', color: '#fa8c16', content_type: 'all' },
      { key: 'networking', name: '人脉建设', name_en: 'Networking', type: 'system', color: '#eb2f96', content_type: 'all' },

      // 职业发展标签
      { key: 'career_planning', name: '职业规划', name_en: 'Career Planning', type: 'system', color: '#722ed1', content_type: 'all' },
      { key: 'skill_development', name: '技能提升', name_en: 'Skill Development', type: 'system', color: '#13c2c2', content_type: 'all' },
      { key: 'promotion', name: '晋升经验', name_en: 'Promotion', type: 'system', color: '#a0d911', content_type: 'all' },
      { key: 'leadership', name: '领导力', name_en: 'Leadership', type: 'system', color: '#fadb14', content_type: 'all' },

      // 职场文化标签
      { key: 'teamwork', name: '团队合作', name_en: 'Teamwork', type: 'system', color: '#fa541c', content_type: 'all' },
      { key: 'communication', name: '沟通技巧', name_en: 'Communication', type: 'system', color: '#f759ab', content_type: 'all' },
      { key: 'work_life_balance', name: '工作生活平衡', name_en: 'Work-Life Balance', type: 'system', color: '#40a9ff', content_type: 'all' },
      { key: 'company_culture', name: '企业文化', name_en: 'Company Culture', type: 'system', color: '#36cfc9', content_type: 'all' },

      // 薪资福利标签
      { key: 'salary_negotiation', name: '薪资谈判', name_en: 'Salary Negotiation', type: 'system', color: '#ffc53d', content_type: 'all' },
      { key: 'benefits', name: '福利待遇', name_en: 'Benefits', type: 'system', color: '#ff7a45', content_type: 'all' },
      { key: 'stock_options', name: '股权激励', name_en: 'Stock Options', type: 'system', color: '#ff85c0', content_type: 'all' },

      // 教育培训标签
      { key: 'certification', name: '职业认证', name_en: 'Certification', type: 'system', color: '#9254de', content_type: 'all' },
      { key: 'online_learning', name: '在线学习', name_en: 'Online Learning', type: 'system', color: '#73d13d', content_type: 'all' },
      { key: 'mentorship', name: '导师指导', name_en: 'Mentorship', type: 'system', color: '#40a9ff', content_type: 'all' }
    ];

    for (const tag of tags) {
      try {
        const tagId = crypto.randomUUID();
        await db.execute(
          `INSERT OR IGNORE INTO content_tags
           (id, tag_key, tag_name, tag_name_en, tag_type, color, content_type, admin_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tagId,
            tag.key,
            tag.name,
            tag.name_en,
            tag.type,
            tag.color,
            tag.content_type,
            'system'
          ]
        );
      } catch (error) {
        console.error(`插入标签 ${tag.key} 失败:`, error);
      }
    }

    console.log('初始化完成');

    return c.json({
      success: true,
      message: '内容管理表初始化成功',
      data: {
        categories_created: categories.length,
        tags_created: tags.length
      }
    });

  } catch (error: any) {
    console.error('初始化内容管理表失败:', error);
    return c.json({
      success: false,
      message: `初始化失败: ${error.message}`
    }, 500);
  }
});

export { dataGenerator };
