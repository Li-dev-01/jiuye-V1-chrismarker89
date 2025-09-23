/**
 * 故事分类配置 - 与问卷调查结果联动
 * 基于就业状态、专业领域、地域的分类系统
 */

// 就业状态分类（与问卷调查保持一致）
export const employmentStatusCategories = [
  {
    value: 'employed',
    label: '已就业',
    icon: '💼',
    description: '已经找到工作的同学分享就业经历',
    color: '#52c41a',
    keywords: ['入职', '工作', '就业', '上班', '职场']
  },
  {
    value: 'job-seeking',
    label: '求职中',
    icon: '🔍',
    description: '正在求职过程中的经历和感悟',
    color: '#1890ff',
    keywords: ['求职', '面试', '投简历', '找工作', '应聘']
  },
  {
    value: 'further-study',
    label: '继续深造',
    icon: '📚',
    description: '选择考研、出国等继续学习的故事',
    color: '#722ed1',
    keywords: ['考研', '读研', '出国', '深造', '学习']
  },
  {
    value: 'entrepreneurship',
    label: '创业中',
    icon: '🚀',
    description: '自主创业的经历和心得',
    color: '#fa8c16',
    keywords: ['创业', '自主创业', '开公司', '创新']
  },
  {
    value: 'undecided',
    label: '待定中',
    icon: '🤔',
    description: '还在思考和规划未来方向的同学',
    color: '#8c8c8c',
    keywords: ['迷茫', '思考', '规划', '选择']
  }
];

// 专业领域分类（基于问卷数据）
export const majorFieldCategories = [
  {
    value: 'computer-science',
    label: '计算机类',
    icon: '💻',
    description: '计算机科学、软件工程等相关专业',
    color: '#1890ff',
    keywords: ['编程', '开发', '软件', '算法', 'IT']
  },
  {
    value: 'business-management',
    label: '经济管理',
    icon: '📊',
    description: '经济学、管理学、金融等专业',
    color: '#52c41a',
    keywords: ['管理', '经济', '金融', '商业', '市场']
  },
  {
    value: 'engineering',
    label: '工程技术',
    icon: '⚙️',
    description: '机械、电子、土木等工程类专业',
    color: '#fa8c16',
    keywords: ['工程', '技术', '机械', '电子', '建筑']
  },
  {
    value: 'liberal-arts',
    label: '文科类',
    icon: '📝',
    description: '文学、历史、哲学、新闻等专业',
    color: '#722ed1',
    keywords: ['文学', '历史', '新闻', '传媒', '语言']
  },
  {
    value: 'science',
    label: '理科类',
    icon: '🔬',
    description: '数学、物理、化学、生物等专业',
    color: '#13c2c2',
    keywords: ['数学', '物理', '化学', '生物', '科研']
  },
  {
    value: 'medical',
    label: '医学类',
    icon: '🏥',
    description: '临床医学、护理、药学等专业',
    color: '#f5222d',
    keywords: ['医学', '护理', '药学', '医院', '健康']
  },
  {
    value: 'education',
    label: '教育类',
    icon: '👨‍🏫',
    description: '师范、教育学等专业',
    color: '#faad14',
    keywords: ['教育', '师范', '教学', '老师', '培训']
  },
  {
    value: 'arts',
    label: '艺术类',
    icon: '🎨',
    description: '美术、音乐、设计等艺术专业',
    color: '#eb2f96',
    keywords: ['艺术', '设计', '美术', '音乐', '创意']
  }
];

// 地域分类
export const regionCategories = [
  {
    value: 'tier1-cities',
    label: '一线城市',
    icon: '🏙️',
    description: '北京、上海、广州、深圳的就业故事',
    color: '#f5222d',
    keywords: ['北京', '上海', '广州', '深圳', '一线']
  },
  {
    value: 'tier2-cities',
    label: '二线城市',
    icon: '🌆',
    description: '杭州、南京、成都等二线城市',
    color: '#fa8c16',
    keywords: ['杭州', '南京', '成都', '武汉', '西安', '二线']
  },
  {
    value: 'tier3-cities',
    label: '三四线城市',
    icon: '🏘️',
    description: '三四线城市的就业机会和生活',
    color: '#52c41a',
    keywords: ['三线', '四线', '小城市', '地级市']
  },
  {
    value: 'hometown',
    label: '回乡就业',
    icon: '🏡',
    description: '回到家乡发展的故事',
    color: '#722ed1',
    keywords: ['家乡', '回乡', '老家', '县城', '农村']
  },
  {
    value: 'overseas',
    label: '海外发展',
    icon: '🌍',
    description: '出国工作或发展的经历',
    color: '#13c2c2',
    keywords: ['出国', '海外', '国外', '留学', '移民']
  }
];

// 就业去向分类
export const employmentDestinationCategories = [
  {
    value: 'state-owned',
    label: '国企央企',
    icon: '🏛️',
    description: '国有企业、央企的工作经历',
    color: '#f5222d',
    keywords: ['国企', '央企', '国有', '事业单位']
  },
  {
    value: 'private-enterprise',
    label: '民营企业',
    icon: '🏢',
    description: '私企、民营企业的工作体验',
    color: '#1890ff',
    keywords: ['私企', '民营', '民企', '私人企业']
  },
  {
    value: 'foreign-enterprise',
    label: '外资企业',
    icon: '🌐',
    description: '外企、合资企业的工作感受',
    color: '#52c41a',
    keywords: ['外企', '外资', '合资', '跨国公司']
  },
  {
    value: 'government',
    label: '政府机关',
    icon: '🏛️',
    description: '公务员、政府部门工作经历',
    color: '#722ed1',
    keywords: ['公务员', '政府', '机关', '公职']
  },
  {
    value: 'startup',
    label: '创业公司',
    icon: '🚀',
    description: '初创公司、创业团队的经历',
    color: '#fa8c16',
    keywords: ['创业公司', '初创', 'startup', '小公司']
  },
  {
    value: 'freelance',
    label: '自由职业',
    icon: '💼',
    description: '自由职业、远程工作的体验',
    color: '#13c2c2',
    keywords: ['自由职业', '远程', '兼职', '自由工作']
  }
];

// 故事类型分类（内容维度）
export const storyTypeCategories = [
  {
    value: 'interview-experience',
    label: '面试经历',
    icon: '🎯',
    description: '面试过程、技巧和心得',
    color: '#1890ff',
    keywords: ['面试', '笔试', '群面', '技术面', 'HR面']
  },
  {
    value: 'internship-experience',
    label: '实习体验',
    icon: '📋',
    description: '实习期间的工作和学习经历',
    color: '#52c41a',
    keywords: ['实习', '实习生', '暑期实习', '校招实习']
  },
  {
    value: 'career-planning',
    label: '职业规划',
    icon: '🗺️',
    description: '职业发展规划和思考',
    color: '#722ed1',
    keywords: ['职业规划', '发展', '规划', '目标', '方向']
  },
  {
    value: 'workplace-adaptation',
    label: '职场适应',
    icon: '🤝',
    description: '初入职场的适应过程',
    color: '#fa8c16',
    keywords: ['职场', '适应', '新人', '工作环境', '同事']
  },
  {
    value: 'skill-development',
    label: '技能提升',
    icon: '📈',
    description: '专业技能学习和提升经历',
    color: '#13c2c2',
    keywords: ['技能', '学习', '提升', '培训', '证书']
  },
  {
    value: 'campus-life',
    label: '校园生活',
    icon: '🎓',
    description: '大学期间的学习和生活经历',
    color: '#eb2f96',
    keywords: ['校园', '大学', '学习', '社团', '课程']
  }
];

// 获取所有分类
export const getAllCategories = () => {
  return {
    employmentStatus: employmentStatusCategories,
    majorField: majorFieldCategories,
    region: regionCategories,
    employmentDestination: employmentDestinationCategories,
    storyType: storyTypeCategories
  };
};

// 根据关键词自动推荐分类
export const suggestCategories = (content: string) => {
  const suggestions: Array<{category: string, confidence: number, type: string}> = [];
  const allCategories = getAllCategories();
  
  Object.entries(allCategories).forEach(([type, categories]) => {
    categories.forEach(category => {
      let confidence = 0;
      category.keywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword)) {
          confidence += 1;
        }
      });
      
      if (confidence > 0) {
        suggestions.push({
          category: category.value,
          confidence: confidence / category.keywords.length,
          type
        });
      }
    });
  });
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

// 获取分类信息
export const getCategoryInfo = (categoryValue: string, type?: string) => {
  const allCategories = getAllCategories();
  
  if (type) {
    return allCategories[type as keyof typeof allCategories]?.find(cat => cat.value === categoryValue);
  }
  
  // 如果没有指定类型，搜索所有分类
  for (const categories of Object.values(allCategories)) {
    const found = categories.find(cat => cat.value === categoryValue);
    if (found) return found;
  }
  
  return null;
};
