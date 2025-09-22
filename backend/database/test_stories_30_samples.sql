-- 30条故事墙测试数据
-- 创建时间: 2025-09-21
-- 目的: 为故事墙Tab功能提供测试数据，覆盖所有分类

-- =====================================================
-- 1. 清理现有测试数据（可选）
-- =====================================================
-- DELETE FROM valid_stories WHERE user_id LIKE 'test-user-%';
-- DELETE FROM raw_story_submissions WHERE user_id LIKE 'test-user-%';

-- =====================================================
-- 2. 插入原始故事提交数据
-- =====================================================
INSERT OR REPLACE INTO raw_story_submissions (
    id, data_uuid, user_id, title, content, category, tags, submitted_at, raw_status
) VALUES
-- 最新故事 (5条)
(101, 'story-uuid-101', 'test-user-101', '2024年秋招求职记录', '今年的秋招真的很激烈，投了200多份简历，收到了15个面试邀请。经历了技术面、HR面、终面等各种环节，最终拿到了3个offer。整个过程让我学会了如何更好地准备面试，也明白了选择比努力更重要。', 'job-hunting', '["求职经历", "秋招", "面试技巧"]', datetime('now', '-2 days'), 'completed'),
(102, 'story-uuid-102', 'test-user-102', '从实习生到正式员工的转变', '在这家公司实习了6个月，从一开始的什么都不懂，到现在能够独立完成项目。期间经历了很多挫折，但导师和同事们都很耐心地帮助我。最终成功转正，薪资也比预期高了不少。', 'workplace', '["实习经历", "职场成长", "转正"]', datetime('now', '-1 days'), 'completed'),
(103, 'story-uuid-103', 'test-user-103', '跨专业求职的心路历程', '本科学的是机械工程，但对互联网行业很感兴趣。通过自学编程、参加训练营，最终成功转行到产品经理岗位。虽然起步比科班出身的同学晚，但我相信努力能够弥补差距。', 'career-change', '["跨专业", "转行", "产品经理"]', datetime('now', '-6 hours'), 'completed'),
(104, 'story-uuid-104', 'test-user-104', '第一次创业的经验分享', '大学期间和室友一起做了一个校园外卖平台，虽然最后没有成功，但学到了很多东西。从产品设计到市场推广，从团队管理到资金筹措，每一个环节都是宝贵的经验。', 'entrepreneurship', '["创业经历", "校园创业", "团队合作"]', datetime('now', '-3 hours'), 'completed'),
(105, 'story-uuid-105', 'test-user-105', '工作三年后的职业反思', '工作三年了，从最初的兴奋到现在的迷茫，我开始思考自己真正想要什么。是继续在大厂打工，还是出来创业？是追求高薪，还是寻找工作的意义？这些问题一直困扰着我。', 'growth', '["职业规划", "工作反思", "人生选择"]', datetime('now', '-1 hour'), 'completed'),

-- 热门故事 (5条) - 高点赞数
(106, 'story-uuid-106', 'test-user-106', '从月薪3K到年薪50W的逆袭之路', '毕业时只能找到月薪3000的工作，但我没有放弃。通过不断学习新技术、跳槽、积累经验，5年时间实现了年薪50万的目标。关键是要有明确的规划和持续的行动力。', 'growth', '["职业发展", "薪资增长", "技能提升"]', datetime('now', '-15 days'), 'completed'),
(107, 'story-uuid-107', 'test-user-107', '裸辞后的100天求职经历', '因为和老板理念不合，我选择了裸辞。接下来的100天里，我重新审视了自己的职业方向，学习了新技能，最终找到了更适合的工作。虽然过程很焦虑，但结果是好的。', 'job-hunting', '["裸辞", "求职", "职业转换"]', datetime('now', '-20 days'), 'completed'),
(108, 'story-uuid-108', 'test-user-108', '在小公司的成长经历', '很多人都想去大厂，但我在小公司也收获了很多。这里没有复杂的流程，可以接触到业务的各个环节，成长速度很快。虽然薪资不如大厂，但学到的东西更全面。', 'workplace', '["小公司", "职业成长", "工作体验"]', datetime('now', '-18 days'), 'completed'),
(109, 'story-uuid-109', 'test-user-109', '从技术转管理的心得体会', '做了5年技术后，我选择转向管理岗位。从关注代码质量到关注团队效率，从解决技术问题到解决人的问题，这个转变比我想象的更困难，但也更有意义。', 'career-change', '["技术转管理", "职业转型", "团队管理"]', datetime('now', '-12 days'), 'completed'),
(110, 'story-uuid-110', 'test-user-110', '副业变主业的创业故事', '最初只是想通过副业增加收入，没想到越做越大，最终决定全职创业。从兼职到全职，从员工到老板，这个转变让我重新认识了自己的能力和潜力。', 'entrepreneurship', '["副业创业", "全职创业", "职业转换"]', datetime('now', '-10 days'), 'completed'),

-- 求职经历 (5条)
(111, 'story-uuid-111', 'test-user-111', '海投简历的那些日子', '为了找到心仪的工作，我每天都在各大招聘网站投简历。从最初的海投到后来的精准投递，从石沉大海到面试邀请不断，这个过程让我明白了求职也是一门学问。', 'job-hunting', '["简历投递", "求职技巧", "面试准备"]', datetime('now', '-8 days'), 'completed'),
(112, 'story-uuid-112', 'test-user-112', '校招面试的酸甜苦辣', '参加了十几家公司的校招，有被秒拒的尴尬，也有收到心仪offer的喜悦。每一次面试都是一次学习的机会，让我更加了解自己的优势和不足。', 'job-hunting', '["校园招聘", "面试经历", "求职心得"]', datetime('now', '-25 days'), 'completed'),
(113, 'story-uuid-113', 'test-user-113', '网申被拒后的反思', '连续收到了好几个网申被拒的邮件，一度让我怀疑自己的能力。后来我重新审视了简历，优化了自我介绍，终于开始收到面试邀请。有时候方法比努力更重要。', 'job-hunting', '["网申技巧", "简历优化", "求职挫折"]', datetime('now', '-22 days'), 'completed'),
(114, 'story-uuid-114', 'test-user-114', '从群面到终面的全过程', '这次面试经历了群面、技术面、HR面、终面四个环节，每个环节都有不同的挑战。群面考验团队协作，技术面考验专业能力，HR面考验综合素质，终面考验文化匹配。', 'job-hunting', '["面试流程", "群面技巧", "综合面试"]', datetime('now', '-16 days'), 'completed'),
(115, 'story-uuid-115', 'test-user-115', '异地求职的挑战与机遇', '为了寻找更好的发展机会，我选择了异地求职。虽然面临着住宿、交通等问题，但也让我接触到了更广阔的职业机会。最终成功在目标城市找到了满意的工作。', 'job-hunting', '["异地求职", "城市选择", "职业机会"]', datetime('now', '-14 days'), 'completed'),

-- 转行故事 (5条)
(116, 'story-uuid-116', 'test-user-116', '从传统制造业到互联网', '在制造业工作了3年后，我决定转行到互联网行业。重新学习编程语言，了解互联网思维，适应快节奏的工作环境。虽然起薪降低了，但我相信这是正确的选择。', 'career-change', '["行业转换", "制造业", "互联网"]', datetime('now', '-30 days'), 'completed'),
(117, 'story-uuid-117', 'test-user-117', '文科生转行做数据分析', '作为一个文科生，我从来没想过自己会和数据打交道。但通过系统学习统计学、Python、SQL等技能，我成功转行成为了数据分析师。兴趣和努力可以弥补专业背景的不足。', 'career-change', '["文科转理科", "数据分析", "技能学习"]', datetime('now', '-28 days'), 'completed'),
(118, 'story-uuid-118', 'test-user-118', '从销售转向产品经理', '做了两年销售后，我发现自己更喜欢产品设计和用户体验。通过学习产品知识、参与产品项目，我成功转行成为产品经理。销售经验让我更懂用户需求。', 'career-change', '["销售转产品", "产品经理", "用户需求"]', datetime('now', '-26 days'), 'completed'),
(119, 'story-uuid-119', 'test-user-119', '30岁转行学编程', '30岁的时候，我做出了一个大胆的决定——转行学编程。虽然年龄不占优势，但丰富的工作经验让我在理解业务需求方面有独特优势。现在我是一名全栈工程师。', 'career-change', '["30岁转行", "编程学习", "年龄挑战"]', datetime('now', '-24 days'), 'completed'),
(120, 'story-uuid-120', 'test-user-120', '从国企到民企的转变', '在国企工作了5年，虽然稳定但缺乏挑战。我选择跳槽到民企，虽然压力更大，但成长速度也更快。不同的企业文化带来了不同的工作体验和职业发展机会。', 'career-change', '["国企转民企", "企业文化", "职业发展"]', datetime('now', '-21 days'), 'completed'),

-- 创业故事 (5条)
(121, 'story-uuid-121', 'test-user-121', '大学生创业的第一桶金', '大学期间和同学一起做微信小程序开发，从最初的兼职项目到后来的正式公司，我们赚到了人生的第一桶金。虽然最后选择了就业，但这段经历让我受益匪浅。', 'entrepreneurship', '["大学生创业", "小程序开发", "第一桶金"]', datetime('now', '-35 days'), 'completed'),
(122, 'story-uuid-122', 'test-user-122', '从0到1的产品创业经历', '看到市场上的一个痛点，我决定自己开发产品来解决。从需求调研到产品设计，从技术开发到市场推广，虽然最终没有成功，但整个过程让我学到了很多。', 'entrepreneurship', '["产品创业", "市场调研", "创业失败"]', datetime('now', '-33 days'), 'completed'),
(123, 'story-uuid-123', 'test-user-123', '合伙创业的经验教训', '和朋友一起创业，最初大家都很有激情，但随着业务的发展，分歧越来越大。最终我们选择了和平分手。这次经历让我明白了合伙创业的复杂性和重要性。', 'entrepreneurship', '["合伙创业", "团队分歧", "创业教训"]', datetime('now', '-31 days'), 'completed'),
(124, 'story-uuid-124', 'test-user-124', '副业做到月入过万', '利用业余时间做自媒体，从最初的几十个粉丝到现在的十万粉丝，月收入也从几百块增长到过万。虽然还没有全职创业，但这给了我很大的信心。', 'entrepreneurship', '["副业创业", "自媒体", "收入增长"]', datetime('now', '-29 days'), 'completed'),
(125, 'story-uuid-125', 'test-user-125', '技术创业的融资之路', '作为技术出身的创业者，我在融资方面遇到了很多挑战。从BP制作到路演演讲，从投资人沟通到条款谈判，每一步都是学习的过程。最终成功获得了天使轮融资。', 'entrepreneurship', '["技术创业", "融资经历", "投资人"]', datetime('now', '-27 days'), 'completed'),

-- 职场生活 (5条)
(126, 'story-uuid-126', 'test-user-126', '新人入职的适应期', '刚入职时什么都不懂，连打印机都不会用。通过观察学习、主动请教，我逐渐适应了职场生活。现在回想起来，那段时间虽然紧张但很充实。', 'workplace', '["新人入职", "职场适应", "学习成长"]', datetime('now', '-40 days'), 'completed'),
(127, 'story-uuid-127', 'test-user-127', '加班文化的思考', '公司的加班文化很严重，经常要工作到深夜。虽然薪资不错，但我开始思考工作与生活的平衡。最终我选择了跳槽到一家更注重员工福利的公司。', 'workplace', '["加班文化", "工作平衡", "公司选择"]', datetime('now', '-38 days'), 'completed'),
(128, 'story-uuid-128', 'test-user-128', '职场人际关系的处理', '在职场中遇到了一些人际关系的问题，有同事的竞争，也有上司的压力。通过学习沟通技巧、调整心态，我逐渐学会了如何在复杂的职场环境中生存和发展。', 'workplace', '["人际关系", "职场沟通", "心态调整"]', datetime('now', '-36 days'), 'completed'),
(129, 'story-uuid-129', 'test-user-129', '远程办公的体验', '疫情期间公司实行了远程办公，这给我带来了全新的工作体验。虽然节省了通勤时间，但也面临着沟通效率、自我管理等挑战。现在我更喜欢混合办公的模式。', 'workplace', '["远程办公", "工作模式", "效率管理"]', datetime('now', '-34 days'), 'completed'),
(130, 'story-uuid-130', 'test-user-130', '项目管理的实战经验', '第一次担任项目经理，负责一个跨部门的大项目。从需求梳理到资源协调，从进度控制到风险管理，每一个环节都充满挑战。最终项目成功上线，我也收获了宝贵的管理经验。', 'workplace', '["项目管理", "跨部门协作", "管理经验"]', datetime('now', '-32 days'), 'completed');

-- =====================================================
-- 3. 插入有效故事数据
-- =====================================================
INSERT OR REPLACE INTO valid_stories (
    id, raw_id, data_uuid, user_id, title, content, category, tags, author_name,
    audit_status, approved_at, like_count, dislike_count, view_count, is_featured, published_at,
    created_at, updated_at
) VALUES
-- 最新故事 (5条)
(101, 101, 'story-uuid-101', 'test-user-101', '2024年秋招求职记录', '今年的秋招真的很激烈，投了200多份简历，收到了15个面试邀请。经历了技术面、HR面、终面等各种环节，最终拿到了3个offer。整个过程让我学会了如何更好地准备面试，也明白了选择比努力更重要。', 'job-hunting', '["求职经历", "秋招", "面试技巧"]', '求职小张', 'approved', datetime('now', '-2 days'), 45, 2, 234, 0, datetime('now', '-2 days'), datetime('now', '-2 days'), datetime('now', '-2 days')),
(102, 102, 'story-uuid-102', 'test-user-102', '从实习生到正式员工的转变', '在这家公司实习了6个月，从一开始的什么都不懂，到现在能够独立完成项目。期间经历了很多挫折，但导师和同事们都很耐心地帮助我。最终成功转正，薪资也比预期高了不少。', 'workplace', '["实习经历", "职场成长", "转正"]', '实习小王', 'approved', datetime('now', '-1 days'), 67, 1, 345, 0, datetime('now', '-1 days'), datetime('now', '-1 days'), datetime('now', '-1 days')),
(103, 103, 'story-uuid-103', 'test-user-103', '跨专业求职的心路历程', '本科学的是机械工程，但对互联网行业很感兴趣。通过自学编程、参加训练营，最终成功转行到产品经理岗位。虽然起步比科班出身的同学晚，但我相信努力能够弥补差距。', 'career-change', '["跨专业", "转行", "产品经理"]', '转行小李', 'approved', datetime('now', '-6 hours'), 89, 3, 456, 0, datetime('now', '-6 hours'), datetime('now', '-6 hours'), datetime('now', '-6 hours')),
(104, 104, 'story-uuid-104', 'test-user-104', '第一次创业的经验分享', '大学期间和室友一起做了一个校园外卖平台，虽然最后没有成功，但学到了很多东西。从产品设计到市场推广，从团队管理到资金筹措，每一个环节都是宝贵的经验。', 'entrepreneurship', '["创业经历", "校园创业", "团队合作"]', '创业小陈', 'approved', datetime('now', '-3 hours'), 123, 5, 567, 0, datetime('now', '-3 hours'), datetime('now', '-3 hours'), datetime('now', '-3 hours')),
(105, 105, 'story-uuid-105', 'test-user-105', '工作三年后的职业反思', '工作三年了，从最初的兴奋到现在的迷茫，我开始思考自己真正想要什么。是继续在大厂打工，还是出来创业？是追求高薪，还是寻找工作的意义？这些问题一直困扰着我。', 'growth', '["职业规划", "工作反思", "人生选择"]', '思考者小刘', 'approved', datetime('now', '-1 hour'), 156, 4, 678, 0, datetime('now', '-1 hour'), datetime('now', '-1 hour'), datetime('now', '-1 hour')),

-- 热门故事 (5条) - 高点赞数
(106, 106, 'story-uuid-106', 'test-user-106', '从月薪3K到年薪50W的逆袭之路', '毕业时只能找到月薪3000的工作，但我没有放弃。通过不断学习新技术、跳槽、积累经验，5年时间实现了年薪50万的目标。关键是要有明确的规划和持续的行动力。', 'growth', '["职业发展", "薪资增长", "技能提升"]', '逆袭达人', 'approved', datetime('now', '-15 days'), 892, 12, 3456, 1, datetime('now', '-15 days'), datetime('now', '-15 days'), datetime('now', '-15 days')),
(107, 107, 'story-uuid-107', 'test-user-107', '裸辞后的100天求职经历', '因为和老板理念不合，我选择了裸辞。接下来的100天里，我重新审视了自己的职业方向，学习了新技能，最终找到了更适合的工作。虽然过程很焦虑，但结果是好的。', 'job-hunting', '["裸辞", "求职", "职业转换"]', '勇敢的小赵', 'approved', datetime('now', '-20 days'), 756, 8, 2789, 1, datetime('now', '-20 days'), datetime('now', '-20 days'), datetime('now', '-20 days')),
(108, 108, 'story-uuid-108', 'test-user-108', '在小公司的成长经历', '很多人都想去大厂，但我在小公司也收获了很多。这里没有复杂的流程，可以接触到业务的各个环节，成长速度很快。虽然薪资不如大厂，但学到的东西更全面。', 'workplace', '["小公司", "职业成长", "工作体验"]', '小公司老兵', 'approved', datetime('now', '-18 days'), 634, 6, 2134, 0, datetime('now', '-18 days'), datetime('now', '-18 days'), datetime('now', '-18 days')),
(109, 109, 'story-uuid-109', 'test-user-109', '从技术转管理的心得体会', '做了5年技术后，我选择转向管理岗位。从关注代码质量到关注团队效率，从解决技术问题到解决人的问题，这个转变比我想象的更困难，但也更有意义。', 'career-change', '["技术转管理", "职业转型", "团队管理"]', '管理新手', 'approved', datetime('now', '-12 days'), 567, 4, 1876, 1, datetime('now', '-12 days'), datetime('now', '-12 days'), datetime('now', '-12 days')),
(110, 110, 'story-uuid-110', 'test-user-110', '副业变主业的创业故事', '最初只是想通过副业增加收入，没想到越做越大，最终决定全职创业。从兼职到全职，从员工到老板，这个转变让我重新认识了自己的能力和潜力。', 'entrepreneurship', '["副业创业", "全职创业", "职业转换"]', '副业达人', 'approved', datetime('now', '-10 days'), 445, 3, 1567, 0, datetime('now', '-10 days'), datetime('now', '-10 days'), datetime('now', '-10 days')),

-- 求职经历 (5条)
(111, 111, 'story-uuid-111', 'test-user-111', '海投简历的那些日子', '为了找到心仪的工作，我每天都在各大招聘网站投简历。从最初的海投到后来的精准投递，从石沉大海到面试邀请不断，这个过程让我明白了求职也是一门学问。', 'job-hunting', '["简历投递", "求职技巧", "面试准备"]', '求职专家', 'approved', datetime('now', '-8 days'), 234, 2, 987, 0, datetime('now', '-8 days'), datetime('now', '-8 days'), datetime('now', '-8 days')),
(112, 112, 'story-uuid-112', 'test-user-112', '校招面试的酸甜苦辣', '参加了十几家公司的校招，有被秒拒的尴尬，也有收到心仪offer的喜悦。每一次面试都是一次学习的机会，让我更加了解自己的优势和不足。', 'job-hunting', '["校园招聘", "面试经历", "求职心得"]', '校招过来人', 'approved', datetime('now', '-25 days'), 345, 1, 1234, 0, datetime('now', '-25 days'), datetime('now', '-25 days'), datetime('now', '-25 days')),
(113, 113, 'story-uuid-113', 'test-user-113', '网申被拒后的反思', '连续收到了好几个网申被拒的邮件，一度让我怀疑自己的能力。后来我重新审视了简历，优化了自我介绍，终于开始收到面试邀请。有时候方法比努力更重要。', 'job-hunting', '["网申技巧", "简历优化", "求职挫折"]', '反思小能手', 'approved', datetime('now', '-22 days'), 178, 0, 765, 0, datetime('now', '-22 days'), datetime('now', '-22 days'), datetime('now', '-22 days')),
(114, 114, 'story-uuid-114', 'test-user-114', '从群面到终面的全过程', '这次面试经历了群面、技术面、HR面、终面四个环节，每个环节都有不同的挑战。群面考验团队协作，技术面考验专业能力，HR面考验综合素质，终面考验文化匹配。', 'job-hunting', '["面试流程", "群面技巧", "综合面试"]', '面试达人', 'approved', datetime('now', '-16 days'), 289, 1, 1098, 0, datetime('now', '-16 days'), datetime('now', '-16 days'), datetime('now', '-16 days')),
(115, 115, 'story-uuid-115', 'test-user-115', '异地求职的挑战与机遇', '为了寻找更好的发展机会，我选择了异地求职。虽然面临着住宿、交通等问题，但也让我接触到了更广阔的职业机会。最终成功在目标城市找到了满意的工作。', 'job-hunting', '["异地求职", "城市选择", "职业机会"]', '异地奋斗者', 'approved', datetime('now', '-14 days'), 156, 2, 654, 0, datetime('now', '-14 days'), datetime('now', '-14 days'), datetime('now', '-14 days')),

-- 转行故事 (5条)
(116, 116, 'story-uuid-116', 'test-user-116', '从传统制造业到互联网', '在制造业工作了3年后，我决定转行到互联网行业。重新学习编程语言，了解互联网思维，适应快节奏的工作环境。虽然起薪降低了，但我相信这是正确的选择。', 'career-change', '["行业转换", "制造业", "互联网"]', '转行勇士', 'approved', datetime('now', '-30 days'), 267, 3, 1123, 0, datetime('now', '-30 days'), datetime('now', '-30 days'), datetime('now', '-30 days')),
(117, 117, 'story-uuid-117', 'test-user-117', '文科生转行做数据分析', '作为一个文科生，我从来没想过自己会和数据打交道。但通过系统学习统计学、Python、SQL等技能，我成功转行成为了数据分析师。兴趣和努力可以弥补专业背景的不足。', 'career-change', '["文科转理科", "数据分析", "技能学习"]', '数据新人', 'approved', datetime('now', '-28 days'), 198, 1, 876, 0, datetime('now', '-28 days'), datetime('now', '-28 days'), datetime('now', '-28 days')),
(118, 118, 'story-uuid-118', 'test-user-118', '从销售转向产品经理', '做了两年销售后，我发现自己更喜欢产品设计和用户体验。通过学习产品知识、参与产品项目，我成功转行成为产品经理。销售经验让我更懂用户需求。', 'career-change', '["销售转产品", "产品经理", "用户需求"]', '产品新手', 'approved', datetime('now', '-26 days'), 312, 2, 1345, 0, datetime('now', '-26 days'), datetime('now', '-26 days'), datetime('now', '-26 days')),
(119, 119, 'story-uuid-119', 'test-user-119', '30岁转行学编程', '30岁的时候，我做出了一个大胆的决定——转行学编程。虽然年龄不占优势，但丰富的工作经验让我在理解业务需求方面有独特优势。现在我是一名全栈工程师。', 'career-change', '["30岁转行", "编程学习", "年龄挑战"]', '30岁程序员', 'approved', datetime('now', '-24 days'), 423, 5, 1789, 0, datetime('now', '-24 days'), datetime('now', '-24 days'), datetime('now', '-24 days')),
(120, 120, 'story-uuid-120', 'test-user-120', '从国企到民企的转变', '在国企工作了5年，虽然稳定但缺乏挑战。我选择跳槽到民企，虽然压力更大，但成长速度也更快。不同的企业文化带来了不同的工作体验和职业发展机会。', 'career-change', '["国企转民企", "企业文化", "职业发展"]', '跳槽专家', 'approved', datetime('now', '-21 days'), 189, 1, 934, 0, datetime('now', '-21 days'), datetime('now', '-21 days'), datetime('now', '-21 days')),

-- 创业故事 (5条)
(121, 121, 'story-uuid-121', 'test-user-121', '大学生创业的第一桶金', '大学期间和同学一起做微信小程序开发，从最初的兼职项目到后来的正式公司，我们赚到了人生的第一桶金。虽然最后选择了就业，但这段经历让我受益匪浅。', 'entrepreneurship', '["大学生创业", "小程序开发", "第一桶金"]', '大学创业者', 'approved', datetime('now', '-35 days'), 345, 2, 1456, 0, datetime('now', '-35 days'), datetime('now', '-35 days'), datetime('now', '-35 days')),
(122, 122, 'story-uuid-122', 'test-user-122', '从0到1的产品创业经历', '看到市场上的一个痛点，我决定自己开发产品来解决。从需求调研到产品设计，从技术开发到市场推广，虽然最终没有成功，但整个过程让我学到了很多。', 'entrepreneurship', '["产品创业", "市场调研", "创业失败"]', '产品创业者', 'approved', datetime('now', '-33 days'), 234, 3, 1098, 0, datetime('now', '-33 days'), datetime('now', '-33 days'), datetime('now', '-33 days')),
(123, 123, 'story-uuid-123', 'test-user-123', '合伙创业的经验教训', '和朋友一起创业，最初大家都很有激情，但随着业务的发展，分歧越来越大。最终我们选择了和平分手。这次经历让我明白了合伙创业的复杂性和重要性。', 'entrepreneurship', '["合伙创业", "团队分歧", "创业教训"]', '合伙人', 'approved', datetime('now', '-31 days'), 178, 4, 823, 0, datetime('now', '-31 days'), datetime('now', '-31 days'), datetime('now', '-31 days')),
(124, 124, 'story-uuid-124', 'test-user-124', '副业做到月入过万', '利用业余时间做自媒体，从最初的几十个粉丝到现在的十万粉丝，月收入也从几百块增长到过万。虽然还没有全职创业，但这给了我很大的信心。', 'entrepreneurship', '["副业创业", "自媒体", "收入增长"]', '自媒体达人', 'approved', datetime('now', '-29 days'), 567, 1, 2134, 0, datetime('now', '-29 days'), datetime('now', '-29 days'), datetime('now', '-29 days')),
(125, 125, 'story-uuid-125', 'test-user-125', '技术创业的融资之路', '作为技术出身的创业者，我在融资方面遇到了很多挑战。从BP制作到路演演讲，从投资人沟通到条款谈判，每一步都是学习的过程。最终成功获得了天使轮融资。', 'entrepreneurship', '["技术创业", "融资经历", "投资人"]', '技术创业者', 'approved', datetime('now', '-27 days'), 389, 2, 1567, 0, datetime('now', '-27 days'), datetime('now', '-27 days'), datetime('now', '-27 days')),

-- 职场生活 (5条)
(126, 126, 'story-uuid-126', 'test-user-126', '新人入职的适应期', '刚入职时什么都不懂，连打印机都不会用。通过观察学习、主动请教，我逐渐适应了职场生活。现在回想起来，那段时间虽然紧张但很充实。', 'workplace', '["新人入职", "职场适应", "学习成长"]', '职场新人', 'approved', datetime('now', '-40 days'), 123, 0, 567, 0, datetime('now', '-40 days'), datetime('now', '-40 days'), datetime('now', '-40 days')),
(127, 127, 'story-uuid-127', 'test-user-127', '加班文化的思考', '公司的加班文化很严重，经常要工作到深夜。虽然薪资不错，但我开始思考工作与生活的平衡。最终我选择了跳槽到一家更注重员工福利的公司。', 'workplace', '["加班文化", "工作平衡", "公司选择"]', '平衡达人', 'approved', datetime('now', '-38 days'), 456, 3, 1234, 0, datetime('now', '-38 days'), datetime('now', '-38 days'), datetime('now', '-38 days')),
(128, 128, 'story-uuid-128', 'test-user-128', '职场人际关系的处理', '在职场中遇到了一些人际关系的问题，有同事的竞争，也有上司的压力。通过学习沟通技巧、调整心态，我逐渐学会了如何在复杂的职场环境中生存和发展。', 'workplace', '["人际关系", "职场沟通", "心态调整"]', '沟通高手', 'approved', datetime('now', '-36 days'), 234, 1, 876, 0, datetime('now', '-36 days'), datetime('now', '-36 days'), datetime('now', '-36 days')),
(129, 129, 'story-uuid-129', 'test-user-129', '远程办公的体验', '疫情期间公司实行了远程办公，这给我带来了全新的工作体验。虽然节省了通勤时间，但也面临着沟通效率、自我管理等挑战。现在我更喜欢混合办公的模式。', 'workplace', '["远程办公", "工作模式", "效率管理"]', '远程工作者', 'approved', datetime('now', '-34 days'), 345, 2, 1098, 0, datetime('now', '-34 days'), datetime('now', '-34 days'), datetime('now', '-34 days')),
(130, 130, 'story-uuid-130', 'test-user-130', '项目管理的实战经验', '第一次担任项目经理，负责一个跨部门的大项目。从需求梳理到资源协调，从进度控制到风险管理，每一个环节都充满挑战。最终项目成功上线，我也收获了宝贵的管理经验。', 'workplace', '["项目管理", "跨部门协作", "管理经验"]', '项目经理', 'approved', datetime('now', '-32 days'), 278, 1, 945, 0, datetime('now', '-32 days'), datetime('now', '-32 days'), datetime('now', '-32 days'));

-- =====================================================
-- 4. 数据统计验证
-- =====================================================
-- 验证插入的数据
SELECT
    category,
    COUNT(*) as count,
    AVG(like_count) as avg_likes,
    AVG(view_count) as avg_views
FROM valid_stories
WHERE user_id LIKE 'test-user-%'
GROUP BY category
ORDER BY count DESC;

-- 验证Tab分类数据分布
SELECT
    CASE
        WHEN category = 'job-hunting' THEN '求职经历'
        WHEN category = 'career-change' THEN '转行故事'
        WHEN category = 'entrepreneurship' THEN '创业故事'
        WHEN category = 'workplace' THEN '职场生活'
        WHEN category = 'growth' THEN '成长感悟'
        ELSE '其他'
    END as tab_category,
    COUNT(*) as story_count,
    SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_count
FROM valid_stories
WHERE user_id LIKE 'test-user-%'
GROUP BY category
ORDER BY story_count DESC;

-- 验证热门故事（按点赞数排序）
SELECT title, like_count, view_count, category
FROM valid_stories
WHERE user_id LIKE 'test-user-%'
ORDER BY like_count DESC
LIMIT 10;

-- 验证最新故事（按发布时间排序）
SELECT title, published_at, category
FROM valid_stories
WHERE user_id LIKE 'test-user-%'
ORDER BY published_at DESC
LIMIT 10;
