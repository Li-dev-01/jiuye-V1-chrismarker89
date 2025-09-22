#!/usr/bin/env node

/**
 * 故事墙专用测试数据生成器
 * 为故事墙页面功能验证生成完整的测试数据
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class StoryWallDataGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'test-data', 'generated');
    this.ensureDirectories();
    
    // 加载分类配置（与前端保持一致）
    this.categories = this.loadCategories();
    
    // 故事模板
    this.storyTemplates = this.loadStoryTemplates();
    
    // 匿名昵称池
    this.anonymousNicknames = [
      '求职小白', '职场新人', '迷茫大学生', '奋斗青年', '技术爱好者',
      '文科生', '理工男', '设计师', '北漂青年', '海归小伙', '创业者',
      '实习生', '应届毕业生', '转行者', '斜杠青年', '自由职业者',
      '程序员小哥', '金融民工', '教育工作者', '医学生', '艺术生',
      '考研党', '保研生', '留学生', '回国发展', '小镇青年'
    ];
    
    // 生成的数据
    this.users = [];
    this.stories = [];
    this.likes = [];
    this.reports = [];
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 加载分类配置
   */
  loadCategories() {
    return {
      employmentStatus: [
        { value: 'employed', label: '已就业', keywords: ['入职', '工作', '就业', '上班', '职场'] },
        { value: 'job-seeking', label: '求职中', keywords: ['求职', '面试', '投简历', '找工作', '应聘'] },
        { value: 'further-study', label: '继续深造', keywords: ['考研', '读研', '出国', '深造', '学习'] },
        { value: 'entrepreneurship', label: '创业中', keywords: ['创业', '自主创业', '开公司', '创新'] },
        { value: 'undecided', label: '待定中', keywords: ['迷茫', '思考', '规划', '选择'] }
      ],
      majorField: [
        { value: 'computer-science', label: '计算机类', keywords: ['编程', '开发', '软件', '算法', 'IT'] },
        { value: 'business-management', label: '经济管理', keywords: ['管理', '经济', '金融', '商业', '市场'] },
        { value: 'engineering', label: '工程技术', keywords: ['工程', '技术', '机械', '电子', '建筑'] },
        { value: 'liberal-arts', label: '文科类', keywords: ['文学', '历史', '新闻', '传媒', '语言'] },
        { value: 'science', label: '理科类', keywords: ['数学', '物理', '化学', '生物', '科研'] },
        { value: 'medical', label: '医学类', keywords: ['医学', '护理', '药学', '医院', '健康'] },
        { value: 'education', label: '教育类', keywords: ['教育', '师范', '教学', '老师', '培训'] },
        { value: 'arts', label: '艺术类', keywords: ['艺术', '设计', '美术', '音乐', '创意'] }
      ],
      region: [
        { value: 'tier1-cities', label: '一线城市', keywords: ['北京', '上海', '广州', '深圳', '一线'] },
        { value: 'tier2-cities', label: '二线城市', keywords: ['杭州', '南京', '成都', '武汉', '西安', '二线'] },
        { value: 'tier3-cities', label: '三四线城市', keywords: ['三线', '四线', '小城市', '地级市'] },
        { value: 'hometown', label: '回乡就业', keywords: ['家乡', '回乡', '老家', '县城', '农村'] },
        { value: 'overseas', label: '海外发展', keywords: ['出国', '海外', '国外', '留学', '移民'] }
      ],
      storyType: [
        { value: 'interview-experience', label: '面试经历', keywords: ['面试', '笔试', '群面', '技术面', 'HR面'] },
        { value: 'internship-experience', label: '实习体验', keywords: ['实习', '实习生', '暑期实习', '校招实习'] },
        { value: 'career-planning', label: '职业规划', keywords: ['职业规划', '发展', '规划', '目标', '方向'] },
        { value: 'workplace-adaptation', label: '职场适应', keywords: ['职场', '适应', '新人', '工作环境', '同事'] },
        { value: 'skill-development', label: '技能提升', keywords: ['技能', '学习', '提升', '培训', '证书'] },
        { value: 'campus-life', label: '校园生活', keywords: ['校园', '大学', '学习', '社团', '课程'] }
      ]
    };
  }

  /**
   * 加载故事模板
   */
  loadStoryTemplates() {
    return {
      'interview-experience': {
        titles: [
          '我的{company}面试经历分享',
          '{position}岗位面试全过程记录',
          '从简历投递到offer：我的求职路',
          '三轮面试后的感悟与总结',
          '技术面试中的那些坑和经验'
        ],
        contents: [
          '分享一下最近的面试经历，希望对大家有帮助。整个面试过程分为三轮：首先是HR初筛，主要了解基本情况和期望薪资；然后是技术面试，考察专业技能和项目经验；最后是总监面试，更多关注个人发展规划和团队协作能力。',
          '从投简历到拿到offer，整个过程持续了两个月。期间经历了无数次的拒绝和等待，但每一次面试都是宝贵的学习机会。最重要的是要保持积极的心态，不断总结和改进。',
          '技术面试是最有挑战性的环节，不仅要展示编程能力，还要能够清晰地表达思路。建议大家平时多练习算法题，同时要能够结合实际项目经验来回答问题。'
        ]
      },
      'internship-experience': {
        titles: [
          '在{company}实习的{duration}个月',
          '{major}专业实习生的真实体验',
          '实习期间学到的那些事',
          '从实习生到正式员工的成长路',
          '大厂实习vs小公司实习的区别'
        ],
        contents: [
          '实习期间最大的收获是学会了如何在真实的工作环境中应用所学知识。理论和实践确实有很大差距，但正是这种差距让我快速成长。导师很耐心，同事们也很友善，整个团队氛围很好。',
          '三个月的实习让我对这个行业有了更深入的了解。不仅提升了专业技能，更重要的是培养了职场素养和团队协作能力。这段经历对我的职业规划产生了重要影响。',
          '实习不仅仅是工作经验的积累，更是人生阅历的丰富。通过与不同背景的同事交流，我开阔了视野，也更加明确了自己的发展方向。'
        ]
      },
      'career-planning': {
        titles: [
          '从{major}到{industry}的转行之路',
          '毕业三年的职业规划反思',
          '如何找到适合自己的发展方向',
          '职业规划中的那些弯路和收获',
          '选择比努力更重要：我的职业思考'
        ],
        contents: [
          '职业规划是一个动态的过程，需要根据市场变化和个人成长不断调整。最重要的是要了解自己的兴趣和优势，然后结合行业趋势来制定发展策略。',
          '回顾这几年的职业发展，有成功也有挫折。每一次选择都是对未来的投资，关键是要保持学习的心态，不断提升自己的核心竞争力。',
          '职业规划不是一成不变的，要根据实际情况灵活调整。重要的是要有明确的目标和执行计划，同时保持开放的心态去拥抱变化。'
        ]
      },
      'workplace-adaptation': {
        titles: [
          '初入职场的适应之路',
          '从学生到职场人的转变',
          '新人如何快速融入团队',
          '职场新人的生存指南',
          '我的职场适应经历分享'
        ],
        contents: [
          '刚入职场时确实有很多不适应的地方，从学校的自由环境到公司的规范制度，需要一个适应过程。最重要的是要保持学习的心态，多观察多请教。',
          '职场和学校最大的区别是责任感和团队协作。在学校主要是个人学习，但在职场需要考虑团队目标和公司利益。这种思维转变需要时间。',
          '适应职场最关键的是要主动沟通，不懂就问，不要怕犯错。同事们都很友善，愿意帮助新人成长。'
        ]
      },
      'skill-development': {
        titles: [
          '技能提升的那些年',
          '从零基础到熟练掌握',
          '持续学习的重要性',
          '技能提升路径分享',
          '我是如何提升专业技能的'
        ],
        contents: [
          '技能提升是一个持续的过程，需要制定明确的学习计划和目标。我通过在线课程、实践项目和同行交流不断提升自己的专业能力。',
          '在快速变化的行业中，持续学习是保持竞争力的关键。我建议大家要跟上技术趋势，同时也要注重基础知识的巩固。',
          '技能提升不仅仅是技术能力，还包括沟通能力、项目管理能力等软技能。这些综合能力对职业发展同样重要。'
        ]
      },
      'campus-life': {
        titles: [
          '我的大学四年回忆',
          '校园生活的美好时光',
          '大学期间的成长经历',
          '那些年的校园故事',
          '大学生活感悟分享'
        ],
        contents: [
          '大学四年是人生中最美好的时光之一，不仅学到了专业知识，更重要的是培养了独立思考和解决问题的能力。参加社团活动让我结识了很多朋友。',
          '校园生活丰富多彩，除了学习还有各种社团活动和实践机会。这些经历对我的个人成长和职业发展都产生了重要影响。',
          '大学不仅是知识的殿堂，更是人生的重要阶段。在这里我学会了如何与人相处，如何面对挑战，这些都是宝贵的财富。'
        ]
      }
    };
  }

  /**
   * 生成UUID
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * 生成随机日期
   */
  generateRandomDate(start = '2024-01-01', end = '2025-01-22') {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime).toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * 根据权重随机选择
   */
  weightedRandom(options) {
    const weights = Object.values(options);
    const keys = Object.keys(options);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return keys[i];
      }
    }
    return keys[keys.length - 1];
  }

  /**
   * 生成用户数据
   */
  generateUsers(count = 50) {
    console.log(`生成 ${count} 个用户...`);
    
    const roles = { 'user': 0.9, 'reviewer': 0.05, 'admin': 0.05 };
    
    for (let i = 0; i < count; i++) {
      const userId = this.generateUUID();
      const role = this.weightedRandom(roles);
      const isAnonymous = Math.random() < 0.7; // 70%使用匿名
      
      const user = {
        id: userId,
        username: isAnonymous ? `user_${i.toString().padStart(3, '0')}` : `realuser_${i}`,
        email: `testuser${i}@example.com`,
        password_hash: `hash_${crypto.randomBytes(16).toString('hex')}`,
        role: role,
        created_at: this.generateRandomDate('2024-01-01', '2024-12-31'),
        updated_at: this.generateRandomDate('2024-01-01', '2025-01-22')
      };
      
      this.users.push(user);
    }
    
    console.log(`✅ 生成了 ${this.users.length} 个用户`);
  }

  /**
   * 生成故事数据
   */
  generateStories(count = 200) {
    console.log(`生成 ${count} 个故事...`);
    
    // 分类权重配置
    const distributions = {
      employmentStatus: { 'employed': 0.4, 'job-seeking': 0.25, 'further-study': 0.15, 'entrepreneurship': 0.1, 'undecided': 0.1 },
      majorField: { 'computer-science': 0.25, 'business-management': 0.2, 'engineering': 0.15, 'liberal-arts': 0.12, 'science': 0.1, 'medical': 0.08, 'education': 0.06, 'arts': 0.04 },
      region: { 'tier1-cities': 0.35, 'tier2-cities': 0.3, 'tier3-cities': 0.2, 'hometown': 0.1, 'overseas': 0.05 },
      storyType: { 'interview-experience': 0.25, 'internship-experience': 0.2, 'career-planning': 0.18, 'workplace-adaptation': 0.15, 'skill-development': 0.12, 'campus-life': 0.1 }
    };
    
    for (let i = 0; i < count; i++) {
      // 随机选择用户
      const user = this.users[Math.floor(Math.random() * this.users.length)];
      
      // 根据权重选择分类
      const employmentStatus = this.weightedRandom(distributions.employmentStatus);
      const majorField = this.weightedRandom(distributions.majorField);
      const region = this.weightedRandom(distributions.region);
      const storyType = this.weightedRandom(distributions.storyType);
      
      // 生成故事内容
      const template = this.storyTemplates[storyType] || this.storyTemplates['interview-experience'];
      const title = template.titles[Math.floor(Math.random() * template.titles.length)]
        .replace('{company}', ['腾讯', '阿里巴巴', '字节跳动', '美团', '小米'][Math.floor(Math.random() * 5)])
        .replace('{position}', ['前端开发', '后端开发', '产品经理', '数据分析', '运营'][Math.floor(Math.random() * 5)])
        .replace('{duration}', ['3', '6', '12'][Math.floor(Math.random() * 3)])
        .replace('{major}', this.categories.majorField.find(m => m.value === majorField)?.label || '计算机')
        .replace('{industry}', ['互联网', '金融', '教育', '医疗'][Math.floor(Math.random() * 4)]);
      
      const content = template.contents[Math.floor(Math.random() * template.contents.length)];
      
      // 生成标签
      const tags = this.generateTags(employmentStatus, majorField, region, storyType);
      
      const story = {
        id: i + 1,
        user_id: user.id,
        questionnaire_id: `questionnaire_${Math.floor(Math.random() * 10) + 1}`,
        content: content,
        title: title,
        word_count: content.length,
        category: 'employment-feedback',
        tags: JSON.stringify(tags),
        employment_status: employmentStatus,
        major_field: majorField,
        region: region,
        story_type: storyType,
        emotion_score: Math.random() * 2 - 1, // -1 到 1
        emotion_category: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
        is_public: Math.random() < 0.85,
        is_approved: Math.random() < 0.9,
        status: this.weightedRandom({ 'active': 0.85, 'pending': 0.1, 'archived': 0.05 }),
        submission_type: this.weightedRandom({ 'anonymous': 0.7, 'semi-anonymous': 0.25, 'public': 0.05 }),
        anonymous_nickname: Math.random() < 0.7 ? this.anonymousNicknames[Math.floor(Math.random() * this.anonymousNicknames.length)] : null,
        likes_count: Math.floor(Math.random() * 50),
        views_count: Math.floor(Math.random() * 200) + 10,
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (compatible; TestDataGenerator)',
        created_at: this.generateRandomDate('2024-01-01', '2025-01-22'),
        updated_at: this.generateRandomDate('2024-01-01', '2025-01-22')
      };
      
      this.stories.push(story);
    }
    
    console.log(`✅ 生成了 ${this.stories.length} 个故事`);
  }

  /**
   * 生成标签
   */
  generateTags(employmentStatus, majorField, region, storyType) {
    const tags = [];
    
    // 添加分类相关标签
    const empCategory = this.categories.employmentStatus.find(c => c.value === employmentStatus);
    if (empCategory) tags.push(empCategory.label);
    
    const majorCategory = this.categories.majorField.find(c => c.value === majorField);
    if (majorCategory) tags.push(majorCategory.label);
    
    const regionCategory = this.categories.region.find(c => c.value === region);
    if (regionCategory) tags.push(regionCategory.label);
    
    const storyCategory = this.categories.storyType.find(c => c.value === storyType);
    if (storyCategory) tags.push(storyCategory.label);
    
    // 添加一些随机标签
    const randomTags = ['经验分享', '求职心得', '职场感悟', '学习成长', '人生感悟'];
    const randomTag = randomTags[Math.floor(Math.random() * randomTags.length)];
    if (!tags.includes(randomTag)) tags.push(randomTag);
    
    return tags.slice(0, 5); // 最多5个标签
  }

  /**
   * 保存数据到文件
   */
  saveData() {
    console.log('保存测试数据...');
    
    // 保存用户数据
    const usersFile = path.join(this.outputDir, 'story_wall_users.json');
    fs.writeFileSync(usersFile, JSON.stringify(this.users, null, 2));
    
    // 保存故事数据
    const storiesFile = path.join(this.outputDir, 'story_wall_stories.json');
    fs.writeFileSync(storiesFile, JSON.stringify(this.stories, null, 2));
    
    // 生成SQL插入语句
    this.generateSQL();
    
    console.log(`✅ 数据已保存到 ${this.outputDir}`);
    console.log(`📊 统计信息:`);
    console.log(`   - 用户数: ${this.users.length}`);
    console.log(`   - 故事数: ${this.stories.length}`);
  }

  /**
   * 生成SQL插入语句
   */
  generateSQL() {
    const sqlFile = path.join(this.outputDir, 'story_wall_test_data.sql');
    let sql = '-- 故事墙测试数据\n-- 生成时间: ' + new Date().toISOString() + '\n\n';
    
    // 用户数据SQL
    sql += '-- 插入用户数据\n';
    this.users.forEach(user => {
      sql += `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ('${user.id}', '${user.username}', '${user.email}', '${user.password_hash}', '${user.role}', '${user.created_at}', '${user.updated_at}');\n`;
    });
    
    sql += '\n-- 插入故事数据\n';
    this.stories.forEach(story => {
      const tags = story.tags.replace(/'/g, "''"); // 转义单引号
      const content = story.content.replace(/'/g, "''");
      const title = story.title.replace(/'/g, "''");
      
      sql += `INSERT INTO questionnaire_heart_voices (id, user_id, questionnaire_id, content, word_count, category, tags, emotion_score, emotion_category, is_public, is_approved, status, submission_type, anonymous_nickname, ip_address, user_agent, created_at, updated_at) VALUES (${story.id}, '${story.user_id}', '${story.questionnaire_id}', '${content}', ${story.word_count}, '${story.category}', '${tags}', ${story.emotion_score}, '${story.emotion_category}', ${story.is_public}, ${story.is_approved}, '${story.status}', '${story.submission_type}', ${story.anonymous_nickname ? "'" + story.anonymous_nickname + "'" : 'NULL'}, '${story.ip_address}', '${story.user_agent}', '${story.created_at}', '${story.updated_at}');\n`;
    });
    
    fs.writeFileSync(sqlFile, sql);
    console.log(`✅ SQL文件已生成: ${sqlFile}`);
  }

  /**
   * 主执行函数
   */
  async run() {
    console.log('🚀 开始生成故事墙测试数据...\n');
    
    try {
      // 生成用户
      this.generateUsers(50);
      
      // 生成故事
      this.generateStories(200);
      
      // 保存数据
      this.saveData();
      
      console.log('\n🎉 故事墙测试数据生成完成！');
      console.log('\n📁 生成的文件:');
      console.log(`   - ${this.outputDir}/story_wall_users.json`);
      console.log(`   - ${this.outputDir}/story_wall_stories.json`);
      console.log(`   - ${this.outputDir}/story_wall_test_data.sql`);
      
    } catch (error) {
      console.error('❌ 生成数据时出错:', error);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new StoryWallDataGenerator();
  generator.run();
}

module.exports = StoryWallDataGenerator;
