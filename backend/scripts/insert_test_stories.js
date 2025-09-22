// 通过API插入30条测试故事数据
// 使用方法: node insert_test_stories.js

const API_BASE = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 30条测试故事数据
const testStories = [
  // 最新故事 (5条)
  {
    title: '2024年秋招求职记录',
    content: '今年的秋招真的很激烈，投了200多份简历，收到了15个面试邀请。经历了技术面、HR面、终面等各种环节，最终拿到了3个offer。整个过程让我学会了如何更好地准备面试，也明白了选择比努力更重要。',
    category: 'job-hunting',
    tags: ['求职经历', '秋招', '面试技巧'],
    user_id: 'test-user-101'
  },
  {
    title: '从实习生到正式员工的转变',
    content: '在这家公司实习了6个月，从一开始的什么都不懂，到现在能够独立完成项目。期间经历了很多挫折，但导师和同事们都很耐心地帮助我。最终成功转正，薪资也比预期高了不少。',
    category: 'workplace',
    tags: ['实习经历', '职场成长', '转正'],
    user_id: 'test-user-102'
  },
  {
    title: '跨专业求职的心路历程',
    content: '本科学的是机械工程，但对互联网行业很感兴趣。通过自学编程、参加训练营，最终成功转行到产品经理岗位。虽然起步比科班出身的同学晚，但我相信努力能够弥补差距。',
    category: 'career-change',
    tags: ['跨专业', '转行', '产品经理'],
    user_id: 'test-user-103'
  },
  {
    title: '第一次创业的经验分享',
    content: '大学期间和室友一起做了一个校园外卖平台，虽然最后没有成功，但学到了很多东西。从产品设计到市场推广，从团队管理到资金筹措，每一个环节都是宝贵的经验。',
    category: 'entrepreneurship',
    tags: ['创业经历', '校园创业', '团队合作'],
    user_id: 'test-user-104'
  },
  {
    title: '工作三年后的职业反思',
    content: '工作三年了，从最初的兴奋到现在的迷茫，我开始思考自己真正想要什么。是继续在大厂打工，还是出来创业？是追求高薪，还是寻找工作的意义？这些问题一直困扰着我。',
    category: 'growth',
    tags: ['职业规划', '工作反思', '人生选择'],
    user_id: 'test-user-105'
  },

  // 热门故事 (5条)
  {
    title: '从月薪3K到年薪50W的逆袭之路',
    content: '毕业时只能找到月薪3000的工作，但我没有放弃。通过不断学习新技术、跳槽、积累经验，5年时间实现了年薪50万的目标。关键是要有明确的规划和持续的行动力。',
    category: 'growth',
    tags: ['职业发展', '薪资增长', '技能提升'],
    user_id: 'test-user-106'
  },
  {
    title: '裸辞后的100天求职经历',
    content: '因为和老板理念不合，我选择了裸辞。接下来的100天里，我重新审视了自己的职业方向，学习了新技能，最终找到了更适合的工作。虽然过程很焦虑，但结果是好的。',
    category: 'job-hunting',
    tags: ['裸辞', '求职', '职业转换'],
    user_id: 'test-user-107'
  },
  {
    title: '在小公司的成长经历',
    content: '很多人都想去大厂，但我在小公司也收获了很多。这里没有复杂的流程，可以接触到业务的各个环节，成长速度很快。虽然薪资不如大厂，但学到的东西更全面。',
    category: 'workplace',
    tags: ['小公司', '职业成长', '工作体验'],
    user_id: 'test-user-108'
  },
  {
    title: '从技术转管理的心得体会',
    content: '做了5年技术后，我选择转向管理岗位。从关注代码质量到关注团队效率，从解决技术问题到解决人的问题，这个转变比我想象的更困难，但也更有意义。',
    category: 'career-change',
    tags: ['技术转管理', '职业转型', '团队管理'],
    user_id: 'test-user-109'
  },
  {
    title: '副业变主业的创业故事',
    content: '最初只是想通过副业增加收入，没想到越做越大，最终决定全职创业。从兼职到全职，从员工到老板，这个转变让我重新认识了自己的能力和潜力。',
    category: 'entrepreneurship',
    tags: ['副业创业', '全职创业', '职业转换'],
    user_id: 'test-user-110'
  },

  // 求职经历 (5条)
  {
    title: '海投简历的那些日子',
    content: '为了找到心仪的工作，我每天都在各大招聘网站投简历。从最初的海投到后来的精准投递，从石沉大海到面试邀请不断，这个过程让我明白了求职也是一门学问。',
    category: 'job-hunting',
    tags: ['简历投递', '求职技巧', '面试准备'],
    user_id: 'test-user-111'
  },
  {
    title: '校招面试的酸甜苦辣',
    content: '参加了十几家公司的校招，有被秒拒的尴尬，也有收到心仪offer的喜悦。每一次面试都是一次学习的机会，让我更加了解自己的优势和不足。',
    category: 'job-hunting',
    tags: ['校园招聘', '面试经历', '求职心得'],
    user_id: 'test-user-112'
  },
  {
    title: '网申被拒后的反思',
    content: '连续收到了好几个网申被拒的邮件，一度让我怀疑自己的能力。后来我重新审视了简历，优化了自我介绍，终于开始收到面试邀请。有时候方法比努力更重要。',
    category: 'job-hunting',
    tags: ['网申技巧', '简历优化', '求职挫折'],
    user_id: 'test-user-113'
  },
  {
    title: '从群面到终面的全过程',
    content: '这次面试经历了群面、技术面、HR面、终面四个环节，每个环节都有不同的挑战。群面考验团队协作，技术面考验专业能力，HR面考验综合素质，终面考验文化匹配。',
    category: 'job-hunting',
    tags: ['面试流程', '群面技巧', '综合面试'],
    user_id: 'test-user-114'
  },
  {
    title: '异地求职的挑战与机遇',
    content: '为了寻找更好的发展机会，我选择了异地求职。虽然面临着住宿、交通等问题，但也让我接触到了更广阔的职业机会。最终成功在目标城市找到了满意的工作。',
    category: 'job-hunting',
    tags: ['异地求职', '城市选择', '职业机会'],
    user_id: 'test-user-115'
  },

  // 转行故事 (5条)
  {
    title: '从传统制造业到互联网',
    content: '在制造业工作了3年后，我决定转行到互联网行业。重新学习编程语言，了解互联网思维，适应快节奏的工作环境。虽然起薪降低了，但我相信这是正确的选择。',
    category: 'career-change',
    tags: ['行业转换', '制造业', '互联网'],
    user_id: 'test-user-116'
  },
  {
    title: '文科生转行做数据分析',
    content: '作为一个文科生，我从来没想过自己会和数据打交道。但通过系统学习统计学、Python、SQL等技能，我成功转行成为了数据分析师。兴趣和努力可以弥补专业背景的不足。',
    category: 'career-change',
    tags: ['文科转理科', '数据分析', '技能学习'],
    user_id: 'test-user-117'
  },
  {
    title: '从销售转向产品经理',
    content: '做了两年销售后，我发现自己更喜欢产品设计和用户体验。通过学习产品知识、参与产品项目，我成功转行成为产品经理。销售经验让我更懂用户需求。',
    category: 'career-change',
    tags: ['销售转产品', '产品经理', '用户需求'],
    user_id: 'test-user-118'
  },
  {
    title: '30岁转行学编程',
    content: '30岁的时候，我做出了一个大胆的决定——转行学编程。虽然年龄不占优势，但丰富的工作经验让我在理解业务需求方面有独特优势。现在我是一名全栈工程师。',
    category: 'career-change',
    tags: ['30岁转行', '编程学习', '年龄挑战'],
    user_id: 'test-user-119'
  },
  {
    title: '从国企到民企的转变',
    content: '在国企工作了5年，虽然稳定但缺乏挑战。我选择跳槽到民企，虽然压力更大，但成长速度也更快。不同的企业文化带来了不同的工作体验和职业发展机会。',
    category: 'career-change',
    tags: ['国企转民企', '企业文化', '职业发展'],
    user_id: 'test-user-120'
  },

  // 创业故事 (5条)
  {
    title: '大学生创业的第一桶金',
    content: '大学期间和同学一起做微信小程序开发，从最初的兼职项目到后来的正式公司，我们赚到了人生的第一桶金。虽然最后选择了就业，但这段经历让我受益匪浅。',
    category: 'entrepreneurship',
    tags: ['大学生创业', '小程序开发', '第一桶金'],
    user_id: 'test-user-121'
  },
  {
    title: '从0到1的产品创业经历',
    content: '看到市场上的一个痛点，我决定自己开发产品来解决。从需求调研到产品设计，从技术开发到市场推广，虽然最终没有成功，但整个过程让我学到了很多。',
    category: 'entrepreneurship',
    tags: ['产品创业', '市场调研', '创业失败'],
    user_id: 'test-user-122'
  },
  {
    title: '合伙创业的经验教训',
    content: '和朋友一起创业，最初大家都很有激情，但随着业务的发展，分歧越来越大。最终我们选择了和平分手。这次经历让我明白了合伙创业的复杂性和重要性。',
    category: 'entrepreneurship',
    tags: ['合伙创业', '团队分歧', '创业教训'],
    user_id: 'test-user-123'
  },
  {
    title: '副业做到月入过万',
    content: '利用业余时间做自媒体，从最初的几十个粉丝到现在的十万粉丝，月收入也从几百块增长到过万。虽然还没有全职创业，但这给了我很大的信心。',
    category: 'entrepreneurship',
    tags: ['副业创业', '自媒体', '收入增长'],
    user_id: 'test-user-124'
  },
  {
    title: '技术创业的融资之路',
    content: '作为技术出身的创业者，我在融资方面遇到了很多挑战。从BP制作到路演演讲，从投资人沟通到条款谈判，每一步都是学习的过程。最终成功获得了天使轮融资。',
    category: 'entrepreneurship',
    tags: ['技术创业', '融资经历', '投资人'],
    user_id: 'test-user-125'
  },

  // 职场生活 (5条)
  {
    title: '新人入职的适应期',
    content: '刚入职时什么都不懂，连打印机都不会用。通过观察学习、主动请教，我逐渐适应了职场生活。现在回想起来，那段时间虽然紧张但很充实。',
    category: 'workplace',
    tags: ['新人入职', '职场适应', '学习成长'],
    user_id: 'test-user-126'
  },
  {
    title: '加班文化的思考',
    content: '公司的加班文化很严重，经常要工作到深夜。虽然薪资不错，但我开始思考工作与生活的平衡。最终我选择了跳槽到一家更注重员工福利的公司。',
    category: 'workplace',
    tags: ['加班文化', '工作平衡', '公司选择'],
    user_id: 'test-user-127'
  },
  {
    title: '职场人际关系的处理',
    content: '在职场中遇到了一些人际关系的问题，有同事的竞争，也有上司的压力。通过学习沟通技巧、调整心态，我逐渐学会了如何在复杂的职场环境中生存和发展。',
    category: 'workplace',
    tags: ['人际关系', '职场沟通', '心态调整'],
    user_id: 'test-user-128'
  },
  {
    title: '远程办公的体验',
    content: '疫情期间公司实行了远程办公，这给我带来了全新的工作体验。虽然节省了通勤时间，但也面临着沟通效率、自我管理等挑战。现在我更喜欢混合办公的模式。',
    category: 'workplace',
    tags: ['远程办公', '工作模式', '效率管理'],
    user_id: 'test-user-129'
  },
  {
    title: '项目管理的实战经验',
    content: '第一次担任项目经理，负责一个跨部门的大项目。从需求梳理到资源协调，从进度控制到风险管理，每一个环节都充满挑战。最终项目成功上线，我也收获了宝贵的管理经验。',
    category: 'workplace',
    tags: ['项目管理', '跨部门协作', '管理经验'],
    user_id: 'test-user-130'
  }
];

// 插入故事的函数
async function insertStory(story) {
  try {
    const response = await fetch(`${API_BASE}/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(story)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ 成功插入故事: ${story.title}`);
      return { success: true, data: result.data };
    } else {
      console.log(`❌ 插入失败: ${story.title} - ${result.message}`);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.log(`❌ 网络错误: ${story.title} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 批量插入所有故事
async function insertAllStories() {
  console.log('🚀 开始插入30条测试故事数据...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < testStories.length; i++) {
    const story = testStories[i];
    console.log(`📝 [${i + 1}/30] 正在插入: ${story.title}`);
    
    const result = await insertStory(story);
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 插入完成统计:');
  console.log(`✅ 成功: ${successCount} 条`);
  console.log(`❌ 失败: ${failCount} 条`);
  console.log(`📈 成功率: ${((successCount / testStories.length) * 100).toFixed(1)}%`);
  
  if (successCount > 0) {
    console.log('\n🎉 测试数据插入完成！');
    console.log('📱 现在可以访问故事页面查看效果：');
    console.log('🔗 https://college-employment-survey-frontend-l84.pages.dev/stories');
  }
}

// 执行插入
insertAllStories().catch(console.error);
