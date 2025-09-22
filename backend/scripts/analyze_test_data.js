// 分析测试数据的分布情况
// 验证Tab分类功能的数据覆盖

const API_BASE = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// Tab配置（与前端保持一致）
const storyTabs = [
  {
    key: 'latest',
    label: '最新故事',
    icon: '🕒',
    description: '最新发布的故事',
    sortBy: 'published_at',
    category: '',
    color: '#1890ff'
  },
  {
    key: 'hot',
    label: '热门故事',
    icon: '🔥',
    description: '最受欢迎的故事',
    sortBy: 'like_count',
    category: '',
    color: '#ff4d4f'
  },
  {
    key: 'job-hunting',
    label: '求职经历',
    icon: '🔍',
    description: '求职过程中的经历和感悟',
    sortBy: 'published_at',
    category: 'job-hunting',
    color: '#52c41a'
  },
  {
    key: 'career-change',
    label: '转行故事',
    icon: '🔄',
    description: '职业转换和行业跳转的经历',
    sortBy: 'published_at',
    category: 'career-change',
    color: '#fa8c16'
  },
  {
    key: 'entrepreneurship',
    label: '创业故事',
    icon: '🚀',
    description: '创业过程中的故事和经验',
    sortBy: 'published_at',
    category: 'entrepreneurship',
    color: '#722ed1'
  },
  {
    key: 'workplace',
    label: '职场生活',
    icon: '🏢',
    description: '日常工作和职场生活的分享',
    sortBy: 'published_at',
    category: 'workplace',
    color: '#13c2c2'
  },
  {
    key: 'growth',
    label: '成长感悟',
    icon: '🌱',
    description: '个人成长和职业发展的感悟',
    sortBy: 'published_at',
    category: 'growth',
    color: '#eb2f96'
  },
  {
    key: 'featured',
    label: '精选故事',
    icon: '⭐',
    description: '编辑精选的优质故事',
    sortBy: 'published_at',
    category: '',
    featured: true,
    color: '#faad14'
  }
];

// 获取故事数据
async function fetchStories(params = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: 1,
      pageSize: 100,
      published: true,
      ...params
    });

    const response = await fetch(`${API_BASE}/stories?${queryParams}`);
    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      console.error('获取故事失败:', result.message);
      return { stories: [], total: 0 };
    }
  } catch (error) {
    console.error('网络错误:', error.message);
    return { stories: [], total: 0 };
  }
}

// 获取精选故事
async function fetchFeaturedStories() {
  try {
    const response = await fetch(`${API_BASE}/stories/featured`);
    const result = await response.json();

    if (result.success) {
      return result.data || [];
    } else {
      console.error('获取精选故事失败:', result.message);
      return [];
    }
  } catch (error) {
    console.error('网络错误:', error.message);
    return [];
  }
}

// 分析Tab数据分布
async function analyzeTabDistribution() {
  console.log('📊 开始分析故事Tab数据分布...\n');

  const results = {};

  // 分析每个Tab的数据
  for (const tab of storyTabs) {
    console.log(`🔍 分析 ${tab.icon} ${tab.label}...`);

    let data;
    if (tab.featured) {
      // 精选故事
      data = { stories: await fetchFeaturedStories(), total: 0 };
      data.total = data.stories.length;
    } else if (tab.category) {
      // 特定分类
      data = await fetchStories({
        category: tab.category,
        sortBy: tab.sortBy,
        sortOrder: 'desc'
      });
    } else {
      // 全部故事（最新或热门）
      data = await fetchStories({
        sortBy: tab.sortBy,
        sortOrder: 'desc'
      });
    }

    results[tab.key] = {
      ...tab,
      count: data.total,
      stories: data.stories.slice(0, 5), // 只保留前5个用于展示
      avgLikes: data.stories.length > 0 ? 
        Math.round(data.stories.reduce((sum, s) => sum + (s.likeCount || 0), 0) / data.stories.length) : 0,
      avgViews: data.stories.length > 0 ? 
        Math.round(data.stories.reduce((sum, s) => sum + (s.viewCount || 0), 0) / data.stories.length) : 0
    };

    console.log(`   📈 数量: ${data.total} 个故事`);
    console.log(`   👍 平均点赞: ${results[tab.key].avgLikes}`);
    console.log(`   👀 平均浏览: ${results[tab.key].avgViews}`);
    console.log('');
  }

  return results;
}

// 生成分析报告
function generateReport(results) {
  console.log('📋 ===== 故事墙Tab数据分析报告 =====\n');

  // 总体统计
  const totalStories = Object.values(results).reduce((sum, tab) => {
    return tab.featured ? sum : sum + tab.count;
  }, 0);

  console.log('📊 总体统计:');
  console.log(`   📚 总故事数: ${totalStories}`);
  console.log(`   ⭐ 精选故事: ${results.featured?.count || 0}`);
  console.log('');

  // Tab分布
  console.log('🎯 Tab分布统计:');
  storyTabs.forEach(tab => {
    const result = results[tab.key];
    const percentage = totalStories > 0 ? ((result.count / totalStories) * 100).toFixed(1) : '0.0';
    console.log(`   ${tab.icon} ${tab.label}: ${result.count} 个 (${percentage}%)`);
  });
  console.log('');

  // 热门内容
  console.log('🔥 热门内容 (按点赞排序):');
  const allStories = [];
  Object.values(results).forEach(tab => {
    if (!tab.featured) {
      allStories.push(...tab.stories.map(s => ({ ...s, tabLabel: tab.label })));
    }
  });
  
  allStories
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 5)
    .forEach((story, index) => {
      console.log(`   ${index + 1}. ${story.title} (${story.likeCount || 0} 👍, ${story.tabLabel})`);
    });
  console.log('');

  // 分类覆盖情况
  console.log('✅ 分类覆盖检查:');
  const expectedCategories = ['job-hunting', 'career-change', 'entrepreneurship', 'workplace', 'growth'];
  expectedCategories.forEach(category => {
    const tabKey = storyTabs.find(t => t.category === category)?.key;
    const count = results[tabKey]?.count || 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`   ${status} ${category}: ${count} 个故事`);
  });
  console.log('');

  // 数据质量评估
  console.log('📈 数据质量评估:');
  const qualityScore = expectedCategories.reduce((score, category) => {
    const tabKey = storyTabs.find(t => t.category === category)?.key;
    const count = results[tabKey]?.count || 0;
    return score + (count >= 3 ? 20 : count * 6.67); // 每个分类至少3个故事得满分
  }, 0);
  
  console.log(`   🎯 覆盖度评分: ${qualityScore.toFixed(1)}/100`);
  
  if (qualityScore >= 80) {
    console.log('   🎉 数据质量优秀！所有Tab都有充足的内容');
  } else if (qualityScore >= 60) {
    console.log('   👍 数据质量良好，大部分Tab有足够内容');
  } else {
    console.log('   ⚠️  数据质量需要改进，部分Tab内容不足');
  }
  console.log('');

  // 建议
  console.log('💡 优化建议:');
  expectedCategories.forEach(category => {
    const tabKey = storyTabs.find(t => t.category === category)?.key;
    const count = results[tabKey]?.count || 0;
    if (count < 3) {
      const tabLabel = storyTabs.find(t => t.category === category)?.label;
      console.log(`   📝 ${tabLabel} 分类需要增加更多内容 (当前${count}个，建议至少3个)`);
    }
  });

  if (results.featured?.count < 3) {
    console.log(`   ⭐ 精选故事需要增加更多内容 (当前${results.featured?.count || 0}个，建议至少3个)`);
  }

  console.log('\n🔗 测试地址: https://college-employment-survey-frontend-l84.pages.dev/stories');
}

// 主函数
async function main() {
  try {
    const results = await analyzeTabDistribution();
    generateReport(results);
  } catch (error) {
    console.error('分析过程中出现错误:', error);
  }
}

// 执行分析
main();
