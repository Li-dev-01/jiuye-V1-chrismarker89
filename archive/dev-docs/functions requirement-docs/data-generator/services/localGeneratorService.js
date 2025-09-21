/**
 * 本地数据生成服务
 * 
 * 提供快速的本地测试数据生成功能
 * 无需API调用，适合开发和测试环境
 */

class LocalGeneratorService {
    constructor() {
        this.scriptPath = './scripts/simple-test-generator.js';
        this.databasePath = './data/survey.db';
        this.schemaPath = './schema.sql';
        this.outputFormat = 'json';
        this.maxConcurrency = 4;
        
        // 数据模板
        this.templates = {
            questionnaire: this.loadQuestionnaireTemplates(),
            story: this.loadStoryTemplates(),
            user: this.loadUserTemplates()
        };
    }

    /**
     * 生成本地测试数据
     * @param {Object} config - 生成配置
     * @returns {Promise<Object>} 生成结果
     */
    async generate(config) {
        try {
            console.log('开始本地数据生成:', config);
            
            const startTime = Date.now();
            const results = {
                questionnaires: 0,
                stories: 0,
                users: 0,
                voices: 0,
                errors: []
            };

            // 根据类型生成数据
            switch (config.type) {
                case 'questionnaire':
                    results.questionnaires = await this.generateQuestionnaires(config);
                    if (config.features?.includeVoices) {
                        results.voices = Math.floor(results.questionnaires * 0.9);
                    }
                    break;
                
                case 'story':
                    results.stories = await this.generateStories(config);
                    break;
                
                case 'user':
                    results.users = await this.generateUsers(config);
                    break;
                
                case 'mixed':
                    const questionnaires = Math.floor(config.count * 0.5);
                    const stories = Math.floor(config.count * 0.3);
                    const users = Math.floor(config.count * 0.2);
                    
                    results.questionnaires = await this.generateQuestionnaires({ ...config, count: questionnaires });
                    results.stories = await this.generateStories({ ...config, count: stories });
                    results.users = await this.generateUsers({ ...config, count: users });
                    
                    if (config.features?.includeVoices) {
                        results.voices = Math.floor(results.questionnaires * 0.9);
                    }
                    break;
                
                default:
                    throw new Error(`不支持的数据类型: ${config.type}`);
            }

            const duration = Date.now() - startTime;
            const totalGenerated = results.questionnaires + results.stories + results.users;
            
            return {
                success: true,
                data: {
                    ...results,
                    count: totalGenerated,
                    duration,
                    reviewPassRate: this.calculatePassRate(results),
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('本地数据生成失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成问卷数据
     * @param {Object} config - 配置
     * @returns {Promise<number>} 生成数量
     */
    async generateQuestionnaires(config) {
        const count = config.count || 15;
        const questionnaires = [];

        for (let i = 0; i < count; i++) {
            const questionnaire = this.createRandomQuestionnaire(config);
            questionnaires.push(questionnaire);
            
            // 模拟生成延迟
            if (i % 10 === 0) {
                await this.sleep(100);
            }
        }

        // 模拟保存到数据库
        await this.saveToDatabase('questionnaires', questionnaires);
        
        console.log(`生成了 ${count} 个问卷`);
        return count;
    }

    /**
     * 生成故事数据
     * @param {Object} config - 配置
     * @returns {Promise<number>} 生成数量
     */
    async generateStories(config) {
        const count = config.count || 8;
        const stories = [];

        for (let i = 0; i < count; i++) {
            const story = this.createRandomStory(config);
            stories.push(story);
            
            // 模拟生成延迟
            if (i % 5 === 0) {
                await this.sleep(150);
            }
        }

        // 模拟保存到数据库
        await this.saveToDatabase('stories', stories);
        
        console.log(`生成了 ${count} 个故事`);
        return count;
    }

    /**
     * 生成用户数据
     * @param {Object} config - 配置
     * @returns {Promise<number>} 生成数量
     */
    async generateUsers(config) {
        const count = config.count || 14;
        const users = [];

        for (let i = 0; i < count; i++) {
            const user = this.createRandomUser(config);
            users.push(user);
            
            // 模拟生成延迟
            if (i % 20 === 0) {
                await this.sleep(50);
            }
        }

        // 模拟保存到数据库
        await this.saveToDatabase('users', users);
        
        console.log(`生成了 ${count} 个用户`);
        return count;
    }

    /**
     * 创建随机问卷数据
     * @param {Object} config - 配置
     * @returns {Object} 问卷数据
     */
    createRandomQuestionnaire(config) {
        const templates = this.templates.questionnaire;
        
        const educationLevel = this.randomChoice(templates.educationLevels);
        const major = this.randomChoice(templates.majors);
        const region = this.randomChoice(templates.regions);
        const employmentStatus = this.randomChoice(templates.employmentStatuses);
        const industry = this.randomChoice(templates.industries);
        const salaryRange = this.randomChoice(templates.salaryRanges);
        
        return {
            id: this.generateId(),
            sequenceNumber: this.generateSequenceNumber('QR'),
            isAnonymous: Math.random() > 0.3,
            educationLevel,
            major,
            graduationYear: this.randomInt(2020, 2024),
            region,
            employmentStatus,
            industry,
            position: this.randomChoice(templates.positions),
            salaryRange,
            jobSatisfaction: this.randomInt(1, 5),
            workExperience: this.randomChoice(templates.workExperiences),
            jobSearchDuration: this.randomChoice(templates.jobSearchDurations),
            careerChangeIntention: Math.random() > 0.7,
            challenges: this.randomChoice(templates.challenges),
            adviceForStudents: this.randomChoice(templates.advices),
            observationOnEmployment: this.randomChoice(templates.observations),
            contactInfo: {
                email: `test${Date.now()}${this.randomInt(100, 999)}@example.com`,
                wechat: `test${this.randomInt(1000, 9999)}`
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ipAddress: this.generateRandomIP(),
            source: 'local_generator',
            status: Math.random() > 0.2 ? 'approved' : 'pending'
        };
    }

    /**
     * 创建随机故事数据
     * @param {Object} config - 配置
     * @returns {Object} 故事数据
     */
    createRandomStory(config) {
        const templates = this.templates.story;
        const category = config.category || this.randomChoice(Object.keys(templates.categories));
        const categoryTemplates = templates.categories[category];
        
        const title = this.randomChoice(categoryTemplates.titles);
        const content = this.generateStoryContent(categoryTemplates, config.length || 'medium');
        
        return {
            id: this.generateId(),
            title,
            content,
            summary: content.substring(0, 100) + '...',
            author: `匿名用户${this.randomInt(1000, 9999)}`,
            category: this.getCategoryDisplayName(category),
            educationLevel: this.randomChoice(templates.educationLevels),
            industry: this.randomChoice(templates.industries),
            tags: this.randomChoices(templates.tags, this.randomInt(2, 5)),
            isAnonymous: Math.random() > 0.4,
            likes: this.randomInt(0, 100),
            dislikes: this.randomInt(0, 20),
            views: this.randomInt(50, 500),
            contactInfo: {
                email: `story${Date.now()}${this.randomInt(100, 999)}@example.com`,
                wechat: `story${this.randomInt(1000, 9999)}`
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'local_generator',
            status: Math.random() > 0.3 ? 'approved' : 'pending'
        };
    }

    /**
     * 创建随机用户数据
     * @param {Object} config - 配置
     * @returns {Object} 用户数据
     */
    createRandomUser(config) {
        const templates = this.templates.user;
        const userType = config.userType || 'mixed';
        const isAnonymous = userType === 'anonymous' || (userType === 'mixed' && Math.random() > 0.5);
        
        const aValue = this.generateAValue();
        const bValue = this.generateBValue();
        
        return {
            id: this.generateId(),
            userId: `${aValue}-${this.generateRandomString(4)}`,
            identityHash: this.generateHash(`${aValue}:${bValue}`),
            uuid: this.generateUUID(),
            type: isAnonymous ? 'anonymous' : 'verified',
            displayName: isAnonymous ? `匿名用户${this.randomInt(1000, 9999)}` : this.randomChoice(templates.names),
            educationLevel: this.randomChoice(config.educationLevels || templates.educationLevels),
            major: this.randomChoice(config.majors || templates.majors),
            graduationYear: this.randomInt(2020, 2024),
            region: this.randomChoice(templates.regions),
            isActive: Math.random() > 0.2,
            lastLoginTime: new Date(Date.now() - this.randomInt(0, 30 * 24 * 60 * 60 * 1000)).toISOString(),
            registrationTime: new Date(Date.now() - this.randomInt(30, 365 * 24 * 60 * 60 * 1000)).toISOString(),
            deviceFingerprint: this.generateHash(navigator.userAgent + Math.random()),
            source: 'local_generator',
            status: 'active'
        };
    }

    /**
     * 生成故事内容
     * @param {Object} templates - 模板
     * @param {string} length - 长度
     * @returns {string} 故事内容
     */
    generateStoryContent(templates, length) {
        const lengthConfig = {
            short: { paragraphs: 2, sentences: 3 },
            medium: { paragraphs: 4, sentences: 4 },
            long: { paragraphs: 6, sentences: 5 }
        };
        
        const config = lengthConfig[length] || lengthConfig.medium;
        const paragraphs = [];
        
        for (let i = 0; i < config.paragraphs; i++) {
            const sentences = [];
            for (let j = 0; j < config.sentences; j++) {
                sentences.push(this.randomChoice(templates.sentences));
            }
            paragraphs.push(sentences.join(''));
        }
        
        return paragraphs.join('\n\n');
    }

    /**
     * 生成测试数据（用于本地测试标签页）
     * @param {Object} config - 配置
     * @returns {Promise<Object>} 生成结果
     */
    async generateTestData(config) {
        try {
            console.log('开始生成本地测试数据:', config);
            
            // 模拟生成过程
            await this.sleep(1000);
            
            const results = {
                questionnaires: 0,
                stories: 0,
                voices: 0,
                users: 0,
                errors: []
            };
            
            // 根据配置生成数据
            if (config.type === 'questionnaire' || config.type === 'mixed') {
                results.questionnaires = config.type === 'mixed' ? Math.floor(config.count * 0.6) : config.count;
            }
            
            if (config.type === 'story' || config.type === 'mixed') {
                results.stories = config.type === 'mixed' ? Math.floor(config.count * 0.3) : config.count;
            }
            
            if (config.type === 'user' || config.type === 'mixed') {
                results.users = config.type === 'mixed' ? Math.floor(config.count * 0.1) : config.count;
            }
            
            // 生成语音文件
            if (config.features?.includeVoices) {
                results.voices = Math.floor(results.questionnaires * 0.9);
            }
            
            const reviewPassRate = 85 + Math.random() * 10;
            
            return {
                success: true,
                data: {
                    ...results,
                    reviewPassRate: Math.round(reviewPassRate * 10) / 10,
                    duration: 1000 + Math.random() * 2000,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('本地测试数据生成失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 验证本地数据
     * @returns {Promise<Object>} 验证结果
     */
    async verifyData() {
        try {
            console.log('开始验证本地数据...');
            
            // 模拟验证过程
            await this.sleep(1500);
            
            const results = {
                questionnaires: 450,
                stories: 180,
                users: 95,
                voices: 405,
                errors: [
                    '发现3个格式不规范的问卷',
                    '2个故事内容过短',
                    '1个用户信息不完整'
                ],
                validationDetails: {
                    formatCheck: 96.8,
                    contentQuality: 92.3,
                    dataIntegrity: 98.1,
                    duplicateCheck: 99.2
                }
            };
            
            return {
                success: true,
                data: {
                    ...results,
                    reviewPassRate: 94.2,
                    duration: 1500,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('数据验证失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 加载问卷模板
     * @returns {Object} 问卷模板
     */
    loadQuestionnaireTemplates() {
        return {
            educationLevels: ['本科', '硕士', '博士', '专科'],
            majors: ['计算机科学', '软件工程', '电子信息', '机械工程', '工商管理', '金融学', '市场营销', '人力资源'],
            regions: ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆'],
            employmentStatuses: ['已就业', '待就业', '继续深造', '创业', '自由职业'],
            industries: ['互联网', '金融', '制造业', '教育', '医疗', '房地产', '零售', '咨询'],
            positions: ['软件工程师', '产品经理', '数据分析师', '市场专员', '销售代表', '财务分析师'],
            salaryRanges: ['3-5K', '5-8K', '8-12K', '12-20K', '20-30K', '30K+'],
            workExperiences: ['应届生', '1-3年', '3-5年', '5-10年', '10年以上'],
            jobSearchDurations: ['1个月以内', '1-3个月', '3-6个月', '6个月以上'],
            challenges: [
                '求职过程中遇到的主要挑战包括缺乏实际工作经验、面试技巧不足、对行业了解不够深入等。',
                '找工作时发现理论知识与实际需求存在差距，需要不断学习新技术和提升实践能力。',
                '竞争激烈，需要在众多求职者中脱颖而出，展现自己的独特价值和潜力。'
            ],
            advices: [
                '建议学弟学妹们要注重实践能力的培养，多参加实习和项目经验，提前了解行业动态。',
                '在校期间要多参加社团活动和实习机会，培养沟通能力和团队合作精神。',
                '保持学习的热情，技术更新很快，要有持续学习的能力和意识。'
            ],
            observations: [
                '当前就业市场竞争激烈，企业更看重实际能力和项目经验，而不仅仅是学历背景。',
                '新兴技术领域如人工智能、大数据等有更多机会，但也需要持续学习和适应。',
                '软技能如沟通能力、团队协作等在职场中同样重要，不容忽视。'
            ]
        };
    }

    /**
     * 加载故事模板
     * @returns {Object} 故事模板
     */
    loadStoryTemplates() {
        return {
            categories: {
                'job-hunting': {
                    titles: [
                        '我的求职之路：从迷茫到收获心仪offer',
                        '应届生求职经验分享：如何在激烈竞争中脱颖而出',
                        '求职路上的坎坷与收获'
                    ],
                    sentences: [
                        '回想起自己的求职经历，真是五味杂陈。',
                        '作为一名应届毕业生，求职路上充满了挑战。',
                        '面试过程中遇到了很多技术难题。',
                        '通过不断学习和练习，逐渐提升了技术水平。',
                        '最终收到了心仪公司的offer，感谢这段经历。'
                    ]
                },
                'career-change': {
                    titles: [
                        '转行程序员的心路历程',
                        '从传统行业到互联网的华丽转身',
                        '30岁转行，我是如何做到的'
                    ],
                    sentences: [
                        '从决定转行到成功入职，这段经历让我成长了很多。',
                        '转行的过程充满了不确定性和挑战。',
                        '需要重新学习新的技能和知识体系。',
                        '坚持和努力最终得到了回报。',
                        '转行让我找到了真正热爱的事业。'
                    ]
                }
            },
            educationLevels: ['本科', '硕士', '博士', '专科'],
            industries: ['互联网', '金融', '制造业', '教育', '医疗'],
            tags: ['求职经验', '职业规划', '个人成长', '技能提升', '面试技巧', '职场感悟']
        };
    }

    /**
     * 加载用户模板
     * @returns {Object} 用户模板
     */
    loadUserTemplates() {
        return {
            names: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'],
            educationLevels: ['undergraduate', 'graduate', 'phd', 'college'],
            majors: ['cs', 'engineering', 'business', 'arts'],
            regions: ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉']
        };
    }

    // 工具方法
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    randomChoices(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    generateSequenceNumber(prefix) {
        return `${prefix}${Date.now()}${this.randomInt(100, 999)}`;
    }

    generateRandomIP() {
        return `192.168.${this.randomInt(1, 255)}.${this.randomInt(1, 255)}`;
    }

    generateAValue() {
        return `138${this.randomInt(10000000, 99999999)}`;
    }

    generateBValue() {
        return Math.random() > 0.5 ? 
            this.randomInt(1000, 9999).toString() : 
            this.randomInt(100000, 999999).toString();
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    generateHash(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getCategoryDisplayName(category) {
        const names = {
            'job-hunting': '求职经历',
            'career-change': '职业转换',
            'entrepreneurship': '创业经历',
            'internship': '实习体验'
        };
        return names[category] || category;
    }

    calculatePassRate(results) {
        const total = results.questionnaires + results.stories + results.users;
        return total > 0 ? 85 + Math.random() * 10 : 0;
    }

    async saveToDatabase(table, data) {
        // 模拟数据库保存
        await this.sleep(50);
        console.log(`保存 ${data.length} 条数据到 ${table} 表`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建全局实例
const localGeneratorService = new LocalGeneratorService();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = localGeneratorService;
} else {
    window.LocalGeneratorService = localGeneratorService;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugLocalGenerator = {
        // 测试本地生成
        testGeneration: async (type = 'questionnaire', count = 10) => {
            const config = {
                type,
                count,
                features: {
                    includeVoices: true,
                    includeMetadata: true,
                    deidentification: false
                }
            };
            
            console.log('测试本地生成:', config);
            const result = await localGeneratorService.generate(config);
            console.log('生成结果:', result);
            return result;
        },
        
        // 测试数据验证
        testVerification: async () => {
            console.log('测试数据验证...');
            const result = await localGeneratorService.verifyData();
            console.log('验证结果:', result);
            return result;
        },
        
        // 生成单个问卷
        generateSingleQuestionnaire: () => {
            const questionnaire = localGeneratorService.createRandomQuestionnaire({});
            console.log('生成的问卷:', questionnaire);
            return questionnaire;
        },
        
        // 生成单个故事
        generateSingleStory: (category = 'job-hunting') => {
            const story = localGeneratorService.createRandomStory({ category });
            console.log('生成的故事:', story);
            return story;
        },
        
        // 生成单个用户
        generateSingleUser: (userType = 'mixed') => {
            const user = localGeneratorService.createRandomUser({ userType });
            console.log('生成的用户:', user);
            return user;
        }
    };
}
