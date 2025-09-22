// 简单的数据检查脚本
// 检查当前故事数据的分布情况

const API_BASE = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 获取所有故事
async function fetchAllStories() {
  try {
    const response = await fetch(`${API_BASE}/stories?page=1&pageSize=100&published=true`);
    const result = await response.json();

    if (result.success) {
      return result.data.stories || [];
    } else {
      console.error('获取故事失败:', result.message);
      return [];
    }
  } catch (error) {
    console.error('网络错误:', error.message);
    return [];
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

// 分析数据分布
async function analyzeData() {
  console.log('📊 开始检查故事数据...\n');

  // 获取所有故事
  const allStories = await fetchAllStories();
  console.log(`📚 总故事数: ${allStories.length}`);

  if (allStories.length === 0) {
    console.log('❌ 没有找到任何故事数据');
    return;
  }

  // 分析分类分布
  const categoryStats = {};
  allStories.forEach(story => {
    const category = story.category || 'unknown';
    if (!categoryStats[category]) {
      categoryStats[category] = {
        count: 0,
        titles: [],
        totalLikes: 0,
        totalViews: 0
      };
    }
    categoryStats[category].count++;
    categoryStats[category].titles.push(story.title);
    categoryStats[category].totalLikes += story.likeCount || 0;
    categoryStats[category].totalViews += story.viewCount || 0;
  });

  console.log('\n📋 分类分布统计:');
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const avgLikes = stats.count > 0 ? Math.round(stats.totalLikes / stats.count) : 0;
    const avgViews = stats.count > 0 ? Math.round(stats.totalViews / stats.count) : 0;
    
    console.log(`\n🏷️  ${category}:`);
    console.log(`   📊 数量: ${stats.count}`);
    console.log(`   👍 平均点赞: ${avgLikes}`);
    console.log(`   👀 平均浏览: ${avgViews}`);
    console.log(`   📝 故事标题:`);
    stats.titles.slice(0, 3).forEach((title, index) => {
      console.log(`      ${index + 1}. ${title}`);
    });
    if (stats.titles.length > 3) {
      console.log(`      ... 还有 ${stats.titles.length - 3} 个`);
    }
  });

  // 获取精选故事
  const featuredStories = await fetchFeaturedStories();
  console.log(`\n⭐ 精选故事数: ${featuredStories.length}`);
  
  if (featuredStories.length > 0) {
    console.log('   📝 精选故事标题:');
    featuredStories.slice(0, 3).forEach((story, index) => {
      console.log(`      ${index + 1}. ${story.title}`);
    });
  }

  // Tab分类映射检查
  console.log('\n🎯 Tab分类映射检查:');
  const tabMapping = {
    'job-hunting': '求职经历',
    'career-change': '转行故事', 
    'entrepreneurship': '创业故事',
    'workplace': '职场生活',
    'growth': '成长感悟'
  };

  Object.entries(tabMapping).forEach(([key, label]) => {
    const count = categoryStats[key]?.count || 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`   ${status} ${label} (${key}): ${count} 个故事`);
  });

  // 热门故事排序
  console.log('\n🔥 热门故事 (按点赞排序):');
  const sortedByLikes = [...allStories]
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 5);
  
  sortedByLikes.forEach((story, index) => {
    console.log(`   ${index + 1}. ${story.title} (${story.likeCount || 0} 👍)`);
  });

  // 最新故事排序
  console.log('\n🕒 最新故事 (按发布时间排序):');
  const sortedByTime = [...allStories]
    .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
    .slice(0, 5);
  
  sortedByTime.forEach((story, index) => {
    const publishTime = new Date(story.publishedAt || story.createdAt).toLocaleDateString();
    console.log(`   ${index + 1}. ${story.title} (${publishTime})`);
  });

  // 数据质量评估
  console.log('\n📈 数据质量评估:');
  const expectedCategories = ['job-hunting', 'career-change', 'entrepreneurship', 'workplace', 'growth'];
  const coverageScore = expectedCategories.reduce((score, category) => {
    const count = categoryStats[category]?.count || 0;
    return score + (count >= 3 ? 20 : count * 6.67);
  }, 0);

  console.log(`   🎯 分类覆盖度: ${coverageScore.toFixed(1)}/100`);
  console.log(`   📊 总数据量: ${allStories.length} 个故事`);
  console.log(`   ⭐ 精选故事: ${featuredStories.length} 个`);

  if (coverageScore >= 80) {
    console.log('   🎉 数据质量优秀！');
  } else if (coverageScore >= 60) {
    console.log('   👍 数据质量良好');
  } else {
    console.log('   ⚠️  数据质量需要改进');
  }

  // 建议
  console.log('\n💡 建议:');
  if (allStories.length < 20) {
    console.log('   📝 建议增加更多故事数据 (当前' + allStories.length + '个，建议至少20个)');
  }
  
  expectedCategories.forEach(category => {
    const count = categoryStats[category]?.count || 0;
    if (count < 3) {
      console.log(`   📝 ${tabMapping[category]} 分类需要更多内容 (当前${count}个，建议至少3个)`);
    }
  });

  if (featuredStories.length < 3) {
    console.log(`   ⭐ 建议增加精选故事 (当前${featuredStories.length}个，建议至少3个)`);
  }

  console.log('\n🔗 测试地址: https://college-employment-survey-frontend-l84.pages.dev/stories');
}

// 执行分析
analyzeData().catch(console.error);
