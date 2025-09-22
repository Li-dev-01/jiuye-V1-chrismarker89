// 故事API调试脚本
// 在浏览器控制台中运行此脚本来检查API响应

const API_BASE = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

async function debugStoriesAPI() {
  console.log('🔍 开始调试故事API...');
  
  const tests = [
    {
      name: '普通故事列表',
      url: `${API_BASE}/stories?page=1&pageSize=12&sortBy=published_at&sortOrder=desc&published=true`,
      expected: '应该返回故事列表数据'
    },
    {
      name: '精选故事',
      url: `${API_BASE}/stories/featured?pageSize=6`,
      expected: '应该返回精选故事数据'
    },
    {
      name: '内容标签',
      url: `${API_BASE}/admin/content/tags`,
      expected: '应该返回标签列表'
    },
    {
      name: '调试状态',
      url: `${API_BASE}/stories/debug/status`,
      expected: '应该返回数据库状态信息'
    }
  ];

  for (const test of tests) {
    console.log(`\n📡 测试: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    console.log(`📝 预期: ${test.expected}`);
    
    try {
      const response = await fetch(test.url);
      console.log(`📊 状态码: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 响应成功:', data);
        
        // 特殊处理故事数据
        if (test.name.includes('故事') && data.data) {
          console.log(`📈 故事数量: ${data.data.stories?.length || 0}`);
          console.log(`📊 总数: ${data.data.total || 0}`);
          if (data.data.stories?.length > 0) {
            console.log('📋 第一个故事:', data.data.stories[0]);
          }
        }
        
        // 特殊处理标签数据
        if (test.name.includes('标签') && Array.isArray(data)) {
          console.log(`🏷️ 标签数量: ${data.length}`);
          console.log('🏷️ 标签列表:', data.map(tag => tag.tag_name));
        }
      } else {
        console.error('❌ 响应失败:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ 错误内容:', errorText);
      }
    } catch (error) {
      console.error('❌ 请求异常:', error);
    }
    
    console.log('─'.repeat(50));
  }
  
  console.log('\n🎯 调试完成！');
  console.log('💡 如果看到500错误，说明后端API有问题');
  console.log('💡 如果看到CORS错误，说明跨域配置有问题');
  console.log('💡 如果数据为空，说明数据库没有数据');
}

// 运行调试
debugStoriesAPI();

// 也可以单独测试某个API
window.testStoriesAPI = debugStoriesAPI;
window.testSingleAPI = async (url) => {
  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

console.log('🚀 故事API调试脚本已加载');
console.log('💻 使用方法:');
console.log('   - 运行 testStoriesAPI() 进行完整测试');
console.log('   - 运行 testSingleAPI("URL") 测试单个API');
