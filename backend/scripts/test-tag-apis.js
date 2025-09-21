/**
 * 标签API测试脚本
 * 用于验证标签管理API的功能
 */

const API_BASE = 'https://your-domain.pages.dev/api/admin';

// 测试获取标签列表
async function testGetTags() {
  console.log('🧪 测试获取标签列表...');
  try {
    const response = await fetch(`${API_BASE}/content/tags`);
    const data = await response.json();
    console.log('✅ 获取标签成功:', data.data?.length || 0, '个标签');
    return data.data;
  } catch (error) {
    console.error('❌ 获取标签失败:', error);
  }
}

// 测试创建标签
async function testCreateTag() {
  console.log('🧪 测试创建标签...');
  const testTag = {
    tag_key: 'test-tag-' + Date.now(),
    tag_name: '测试标签',
    tag_name_en: 'Test Tag',
    description: '这是一个测试标签',
    tag_type: 'user',
    color: '#ff6b6b',
    content_type: 'all'
  };

  try {
    const response = await fetch(`${API_BASE}/content/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTag)
    });
    const data = await response.json();
    console.log('✅ 创建标签成功:', data.data?.tag_name);
    return data.data;
  } catch (error) {
    console.error('❌ 创建标签失败:', error);
  }
}

// 测试更新标签
async function testUpdateTag(tagId) {
  console.log('🧪 测试更新标签...');
  const updateData = {
    tag_name: '更新后的测试标签',
    description: '这是更新后的描述',
    color: '#52c41a'
  };

  try {
    const response = await fetch(`${API_BASE}/content/tags/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log('✅ 更新标签成功:', data.data?.tag_name);
    return data.data;
  } catch (error) {
    console.error('❌ 更新标签失败:', error);
  }
}

// 测试标签统计
async function testTagStats() {
  console.log('🧪 测试标签统计...');
  try {
    const response = await fetch(`${API_BASE}/content/tags/stats`);
    const data = await response.json();
    console.log('✅ 获取统计成功:', {
      标签总数: data.data?.tagStats?.length || 0,
      内容类型: data.data?.contentTypeStats?.length || 0,
      最近使用: data.data?.recentTags?.length || 0
    });
    return data.data;
  } catch (error) {
    console.error('❌ 获取统计失败:', error);
  }
}

// 测试清理未使用标签
async function testCleanupTags() {
  console.log('🧪 测试清理未使用标签...');
  try {
    const response = await fetch(`${API_BASE}/content/tags/cleanup`, {
      method: 'DELETE'
    });
    const data = await response.json();
    console.log('✅ 清理完成:', `删除了 ${data.data?.deleted_count || 0} 个标签`);
    return data.data;
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始标签API测试...\n');
  
  // 1. 获取现有标签
  const tags = await testGetTags();
  console.log('');
  
  // 2. 创建测试标签
  const newTag = await testCreateTag();
  console.log('');
  
  // 3. 更新标签（如果创建成功）
  if (newTag?.id) {
    await testUpdateTag(newTag.id);
    console.log('');
  }
  
  // 4. 获取统计信息
  await testTagStats();
  console.log('');
  
  // 5. 清理测试（可选）
  // await testCleanupTags();
  
  console.log('🎉 测试完成！');
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

// 导出测试函数供其他地方使用
if (typeof module !== 'undefined') {
  module.exports = {
    testGetTags,
    testCreateTag,
    testUpdateTag,
    testTagStats,
    testCleanupTags,
    runAllTests
  };
}
