#!/usr/bin/env node

/**
 * 测试数据分析工具
 * 分析生成的故事墙测试数据的分布情况
 */

const fs = require('fs');
const path = require('path');

class TestDataAnalyzer {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'test-data', 'generated');
    this.usersFile = path.join(this.dataDir, 'story_wall_users.json');
    this.storiesFile = path.join(this.dataDir, 'story_wall_stories.json');
  }

  /**
   * 加载数据
   */
  loadData() {
    if (!fs.existsSync(this.usersFile) || !fs.existsSync(this.storiesFile)) {
      throw new Error('测试数据文件不存在，请先运行 story-wall-data-generator.cjs');
    }

    this.users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    this.stories = JSON.parse(fs.readFileSync(this.storiesFile, 'utf8'));
  }

  /**
   * 分析数据分布
   */
  analyzeDistribution(data, field) {
    const distribution = {};
    data.forEach(item => {
      const value = item[field];
      distribution[value] = (distribution[value] || 0) + 1;
    });
    
    // 计算百分比
    const total = data.length;
    const result = {};
    Object.entries(distribution).forEach(([key, count]) => {
      result[key] = {
        count,
        percentage: ((count / total) * 100).toFixed(1) + '%'
      };
    });
    
    return result;
  }

  /**
   * 生成分析报告
   */
  generateReport() {
    console.log('📊 故事墙测试数据分析报告');
    console.log('=' .repeat(50));
    console.log(`生成时间: ${new Date().toLocaleString()}`);
    console.log(`数据文件: ${this.dataDir}`);
    console.log('');

    // 用户数据分析
    console.log('👥 用户数据分析');
    console.log('-'.repeat(30));
    console.log(`总用户数: ${this.users.length}`);
    
    const roleDistribution = this.analyzeDistribution(this.users, 'role');
    console.log('角色分布:');
    Object.entries(roleDistribution).forEach(([role, data]) => {
      console.log(`  ${role}: ${data.count} (${data.percentage})`);
    });
    console.log('');

    // 故事数据分析
    console.log('📖 故事数据分析');
    console.log('-'.repeat(30));
    console.log(`总故事数: ${this.stories.length}`);
    console.log('');

    // 就业状态分布
    const employmentDistribution = this.analyzeDistribution(this.stories, 'employment_status');
    console.log('就业状态分布:');
    Object.entries(employmentDistribution).forEach(([status, data]) => {
      const label = this.getStatusLabel(status);
      console.log(`  ${label} (${status}): ${data.count} (${data.percentage})`);
    });
    console.log('');

    // 专业领域分布
    const majorDistribution = this.analyzeDistribution(this.stories, 'major_field');
    console.log('专业领域分布:');
    Object.entries(majorDistribution).forEach(([major, data]) => {
      const label = this.getMajorLabel(major);
      console.log(`  ${label} (${major}): ${data.count} (${data.percentage})`);
    });
    console.log('');

    // 地域分布
    const regionDistribution = this.analyzeDistribution(this.stories, 'region');
    console.log('地域分布:');
    Object.entries(regionDistribution).forEach(([region, data]) => {
      const label = this.getRegionLabel(region);
      console.log(`  ${label} (${region}): ${data.count} (${data.percentage})`);
    });
    console.log('');

    // 故事类型分布
    const storyTypeDistribution = this.analyzeDistribution(this.stories, 'story_type');
    console.log('故事类型分布:');
    Object.entries(storyTypeDistribution).forEach(([type, data]) => {
      const label = this.getStoryTypeLabel(type);
      console.log(`  ${label} (${type}): ${data.count} (${data.percentage})`);
    });
    console.log('');

    // 提交类型分布
    const submissionDistribution = this.analyzeDistribution(this.stories, 'submission_type');
    console.log('提交类型分布:');
    Object.entries(submissionDistribution).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} (${data.percentage})`);
    });
    console.log('');

    // 状态分布
    const statusDistribution = this.analyzeDistribution(this.stories, 'status');
    console.log('故事状态分布:');
    Object.entries(statusDistribution).forEach(([status, data]) => {
      console.log(`  ${status}: ${data.count} (${data.percentage})`);
    });
    console.log('');

    // 数据质量分析
    console.log('📈 数据质量分析');
    console.log('-'.repeat(30));
    
    const publicStories = this.stories.filter(s => s.is_public).length;
    const approvedStories = this.stories.filter(s => s.is_approved).length;
    const anonymousStories = this.stories.filter(s => s.anonymous_nickname).length;
    
    console.log(`公开故事: ${publicStories} (${((publicStories/this.stories.length)*100).toFixed(1)}%)`);
    console.log(`已审核故事: ${approvedStories} (${((approvedStories/this.stories.length)*100).toFixed(1)}%)`);
    console.log(`匿名故事: ${anonymousStories} (${((anonymousStories/this.stories.length)*100).toFixed(1)}%)`);
    
    // 点赞和浏览数据
    const totalLikes = this.stories.reduce((sum, s) => sum + s.likes_count, 0);
    const totalViews = this.stories.reduce((sum, s) => sum + s.views_count, 0);
    const avgLikes = (totalLikes / this.stories.length).toFixed(1);
    const avgViews = (totalViews / this.stories.length).toFixed(1);
    
    console.log(`总点赞数: ${totalLikes} (平均: ${avgLikes})`);
    console.log(`总浏览数: ${totalViews} (平均: ${avgViews})`);
    console.log('');

    // 时间分布分析
    console.log('📅 时间分布分析');
    console.log('-'.repeat(30));
    
    const monthDistribution = {};
    this.stories.forEach(story => {
      const month = story.created_at.substring(0, 7); // YYYY-MM
      monthDistribution[month] = (monthDistribution[month] || 0) + 1;
    });
    
    console.log('按月份分布:');
    Object.entries(monthDistribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        console.log(`  ${month}: ${count} 个故事`);
      });
    console.log('');

    // 功能验证建议
    console.log('✅ 功能验证建议');
    console.log('-'.repeat(30));
    console.log('1. 搜索功能验证:');
    console.log('   - 搜索关键词: "面试", "实习", "职场", "技能"');
    console.log('   - 测试标签搜索: "已就业", "计算机类", "一线城市"');
    console.log('   - 测试快速筛选: "最新发布", "点赞数量"');
    console.log('');
    
    console.log('2. 分类筛选验证:');
    console.log('   - 就业状态筛选: 测试所有5个状态');
    console.log('   - 专业领域筛选: 重点测试计算机类、经济管理');
    console.log('   - 地域筛选: 测试一线城市、二线城市');
    console.log('');
    
    console.log('3. 收藏功能验证:');
    console.log('   - 收藏不同类型的故事');
    console.log('   - 测试收藏列表的搜索和筛选');
    console.log('   - 验证收藏状态的持久化');
    console.log('');
    
    console.log('4. 举报功能验证:');
    console.log('   - 测试不同举报类型');
    console.log('   - 验证举报数据的记录');
    console.log('   - 测试匿名举报功能');
    console.log('');

    console.log('🎯 数据导入建议');
    console.log('-'.repeat(30));
    console.log('1. 使用生成的SQL文件导入数据:');
    console.log(`   ${path.join(this.dataDir, 'story_wall_test_data.sql')}`);
    console.log('');
    console.log('2. 验证数据完整性:');
    console.log('   - 检查外键约束');
    console.log('   - 验证JSON格式的tags字段');
    console.log('   - 确认时间戳格式');
    console.log('');
    console.log('3. 性能测试:');
    console.log('   - 测试大量数据的搜索性能');
    console.log('   - 验证分页功能');
    console.log('   - 检查索引效果');
  }

  // 辅助方法：获取标签
  getStatusLabel(status) {
    const labels = {
      'employed': '已就业',
      'job-seeking': '求职中',
      'further-study': '继续深造',
      'entrepreneurship': '创业中',
      'undecided': '待定中'
    };
    return labels[status] || status;
  }

  getMajorLabel(major) {
    const labels = {
      'computer-science': '计算机类',
      'business-management': '经济管理',
      'engineering': '工程技术',
      'liberal-arts': '文科类',
      'science': '理科类',
      'medical': '医学类',
      'education': '教育类',
      'arts': '艺术类'
    };
    return labels[major] || major;
  }

  getRegionLabel(region) {
    const labels = {
      'tier1-cities': '一线城市',
      'tier2-cities': '二线城市',
      'tier3-cities': '三四线城市',
      'hometown': '回乡就业',
      'overseas': '海外发展'
    };
    return labels[region] || region;
  }

  getStoryTypeLabel(type) {
    const labels = {
      'interview-experience': '面试经历',
      'internship-experience': '实习体验',
      'career-planning': '职业规划',
      'workplace-adaptation': '职场适应',
      'skill-development': '技能提升',
      'campus-life': '校园生活'
    };
    return labels[type] || type;
  }

  /**
   * 主执行函数
   */
  run() {
    try {
      this.loadData();
      this.generateReport();
    } catch (error) {
      console.error('❌ 分析数据时出错:', error.message);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const analyzer = new TestDataAnalyzer();
  analyzer.run();
}

module.exports = TestDataAnalyzer;
