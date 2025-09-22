#!/usr/bin/env node

/**
 * 远程数据库适配的故事墙测试数据生成器
 * 基于远程数据库实际结构生成测试数据
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class RemoteDBDataGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'test-data', 'generated');
    this.ensureDirectories();
    
    // 匿名昵称池
    this.anonymousNicknames = [
      '求职小白', '职场新人', '迷茫大学生', '奋斗青年', '技术爱好者',
      '文科生', '理工男', '设计师', '北漂青年', '海归小伙', '创业者',
      '实习生', '应届毕业生', '转行者', '斜杠青年', '自由职业者',
      '程序员小哥', '金融民工', '教育工作者', '医学生', '艺术生',
      '考研党', '保研生', '留学生', '回国发展', '小镇青年'
    ];
    
    // 故事内容模板
    this.storyContents = [
      '分享一下最近的面试经历，希望对大家有帮助。整个面试过程分为三轮：首先是HR初筛，主要了解基本情况和期望薪资；然后是技术面试，考察专业技能和项目经验；最后是总监面试，更多关注个人发展规划和团队协作能力。面试过程中要保持自信，诚实回答问题，同时展现自己的学习能力和适应能力。',
      
      '实习期间最大的收获是学会了如何在真实的工作环境中应用所学知识。理论和实践确实有很大差距，但正是这种差距让我快速成长。导师很耐心，同事们也很友善，整个团队氛围很好。通过参与实际项目，我不仅提升了专业技能，更重要的是培养了职场素养和团队协作能力。',
      
      '职业规划是一个动态的过程，需要根据市场变化和个人成长不断调整。最重要的是要了解自己的兴趣和优势，然后结合行业趋势来制定发展策略。我建议大家要保持学习的心态，不断提升自己的核心竞争力，同时要有明确的短期和长期目标。',
      
      '刚入职场时确实有很多不适应的地方，从学校的自由环境到公司的规范制度，需要一个适应过程。最重要的是要保持学习的心态，多观察多请教。职场和学校最大的区别是责任感和团队协作，要学会从个人学习转向团队目标。',
      
      '技能提升是一个持续的过程，需要制定明确的学习计划和目标。我通过在线课程、实践项目和同行交流不断提升自己的专业能力。在快速变化的行业中，持续学习是保持竞争力的关键，不仅要跟上技术趋势，还要注重基础知识的巩固。',
      
      '大学四年是人生中最美好的时光之一，不仅学到了专业知识，更重要的是培养了独立思考和解决问题的能力。参加社团活动让我结识了很多朋友，这些经历对我的个人成长和职业发展都产生了重要影响。大学不仅是知识的殿堂，更是人生的重要阶段。',
      
      '求职过程虽然充满挑战，但每一次面试都是宝贵的学习机会。从投简历到拿到offer，整个过程让我更加了解自己，也更加明确了职业方向。重要的是要保持积极的心态，不断总结和改进，相信努力总会有回报。',
      
      '创业的路虽然艰难，但充满了无限可能。从最初的想法到产品落地，每一步都需要深思熟虑。团队合作、资金筹措、市场推广，每个环节都是挑战。但正是这些挑战让我快速成长，学会了如何在不确定性中寻找机会。',
      
      '选择继续深造是为了在专业领域有更深入的研究。研究生阶段的学习更加注重独立思考和创新能力的培养。虽然学习压力很大，但能够在自己感兴趣的领域深入探索，这种满足感是无法替代的。',
      
      '回到家乡工作是一个深思熟虑的决定。虽然一线城市机会更多，但家乡的发展潜力也很大，而且能够陪伴家人，生活成本相对较低。重要的是要结合个人情况和职业规划，选择最适合自己的发展道路。'
    ];
    
    this.users = [];
    this.stories = [];
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
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
   * 生成用户数据（适配远程数据库结构）
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
    
    // 分类标签
    const categories = [
      'employment-feedback', 'campus-life', 'career-planning', 
      'internship-experience', 'interview-experience', 'workplace-adaptation'
    ];
    
    const tags = [
      '已就业', '求职中', '继续深造', '创业中', '待定中',
      '计算机类', '经济管理', '工程技术', '文科类', '理科类', '医学类', '教育类', '艺术类',
      '一线城市', '二线城市', '三四线城市', '回乡就业', '海外发展',
      '面试经历', '实习体验', '职业规划', '职场适应', '技能提升', '校园生活',
      '经验分享', '求职心得', '职场感悟', '学习成长', '人生感悟'
    ];
    
    for (let i = 0; i < count; i++) {
      // 随机选择用户
      const user = this.users[Math.floor(Math.random() * this.users.length)];
      
      // 随机选择内容
      const content = this.storyContents[Math.floor(Math.random() * this.storyContents.length)];
      
      // 生成标签（3-5个随机标签）
      const storyTags = [];
      const tagCount = Math.floor(Math.random() * 3) + 3; // 3-5个标签
      for (let j = 0; j < tagCount; j++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        if (!storyTags.includes(tag)) {
          storyTags.push(tag);
        }
      }
      
      const story = {
        questionnaire_response_id: null,
        questionnaire_id: `questionnaire_${Math.floor(Math.random() * 10) + 1}`,
        user_id: user.id,
        content: content,
        word_count: content.length,
        category: categories[Math.floor(Math.random() * categories.length)],
        tags: JSON.stringify(storyTags),
        emotion_score: Math.random() * 2 - 1, // -1 到 1
        emotion_category: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
        is_public: Math.random() < 0.85,
        is_approved: Math.random() < 0.9,
        status: this.weightedRandom({ 'active': 0.85, 'pending': 0.1, 'archived': 0.05 }),
        submission_type: this.weightedRandom({ 'anonymous': 0.7, 'semi-anonymous': 0.25, 'public': 0.05 }),
        anonymous_nickname: Math.random() < 0.7 ? this.anonymousNicknames[Math.floor(Math.random() * this.anonymousNicknames.length)] : null,
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
   * 生成SQL插入语句（适配远程数据库）
   */
  generateSQL() {
    const sqlFile = path.join(this.outputDir, 'remote_story_wall_data.sql');
    let sql = '-- 远程数据库故事墙测试数据\n-- 生成时间: ' + new Date().toISOString() + '\n\n';
    
    // 用户数据SQL（适配远程数据库结构）
    sql += '-- 插入用户数据\n';
    this.users.forEach(user => {
      sql += `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ('${user.id}', '${user.username}', '${user.email}', '${user.password_hash}', '${user.role}', '${user.created_at}', '${user.updated_at}');\n`;
    });
    
    sql += '\n-- 插入故事数据\n';
    this.stories.forEach(story => {
      const tags = story.tags.replace(/'/g, "''"); // 转义单引号
      const content = story.content.replace(/'/g, "''");
      const anonymousNickname = story.anonymous_nickname ? `'${story.anonymous_nickname.replace(/'/g, "''")}'` : 'NULL';
      
      sql += `INSERT INTO questionnaire_heart_voices (questionnaire_response_id, questionnaire_id, user_id, content, word_count, category, tags, emotion_score, emotion_category, is_public, is_approved, status, submission_type, anonymous_nickname, ip_address, user_agent, created_at, updated_at) VALUES (${story.questionnaire_response_id || 'NULL'}, '${story.questionnaire_id}', '${story.user_id}', '${content}', ${story.word_count}, '${story.category}', '${tags}', ${story.emotion_score}, '${story.emotion_category}', ${story.is_public}, ${story.is_approved}, '${story.status}', '${story.submission_type}', ${anonymousNickname}, '${story.ip_address}', '${story.user_agent}', '${story.created_at}', '${story.updated_at}');\n`;
    });
    
    fs.writeFileSync(sqlFile, sql);
    console.log(`✅ SQL文件已生成: ${sqlFile}`);
    return sqlFile;
  }

  /**
   * 主执行函数
   */
  async run() {
    console.log('🚀 开始生成远程数据库适配的故事墙测试数据...\n');
    
    try {
      // 生成用户
      this.generateUsers(50);
      
      // 生成故事
      this.generateStories(200);
      
      // 生成SQL
      const sqlFile = this.generateSQL();
      
      console.log('\n🎉 远程数据库故事墙测试数据生成完成！');
      console.log('\n📁 生成的文件:');
      console.log(`   - ${sqlFile}`);
      console.log('\n📊 统计信息:');
      console.log(`   - 用户数: ${this.users.length}`);
      console.log(`   - 故事数: ${this.stories.length}`);
      
      return sqlFile;
      
    } catch (error) {
      console.error('❌ 生成数据时出错:', error);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new RemoteDBDataGenerator();
  generator.run();
}

module.exports = RemoteDBDataGenerator;
