#!/usr/bin/env node

/**
 * 前端权限检查逻辑测试脚本
 * 模拟MyContent组件的权限检查
 */

// 模拟后端返回的用户数据
const backendUserData = {
  "uuid": "semi-20250923-d165e207-1408-474b-a078-8484e83ed80b",
  "user_type": "semi_anonymous",  // 注意：后端使用下划线
  "identity_hash": "f5be28bf6e7fad8f2767ef7a6c9eca0195bcf56fbcc5d084a54446c939de6df6",
  "username": null,
  "password_hash": null,
  "display_name": "半匿名用户_e83ed80b",
  "role": "semi_anonymous",
  "permissions": [
    "browse_content",
    "submit_questionnaire", 
    "manage_own_content",
    "download_content",
    "delete_own_content"
  ],
  "status": "active"
};

// 模拟前端UserType枚举
const UserType = {
  ANONYMOUS: 'anonymous',
  SEMI_ANONYMOUS: 'semi_anonymous',
  REVIEWER: 'reviewer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

console.log('🔍 前端权限检查逻辑测试');
console.log('=' .repeat(50));

// 模拟前端数据转换过程
function simulateFrontendDataTransformation(backendData) {
  // 前端可能会进行数据转换
  return {
    uuid: backendData.uuid,
    userType: backendData.user_type,  // 直接使用后端的user_type
    displayName: backendData.display_name,
    role: backendData.role,
    permissions: backendData.permissions,
    status: backendData.status,
    profile: {
      displayName: backendData.display_name
    }
  };
}

const currentUser = simulateFrontendDataTransformation(backendUserData);
const isAuthenticated = true;

console.log('📊 用户数据分析:');
console.log('  - isAuthenticated:', isAuthenticated);
console.log('  - currentUser存在:', !!currentUser);
console.log('  - currentUser.uuid:', currentUser.uuid);
console.log('  - currentUser.userType:', currentUser.userType);
console.log('  - currentUser.displayName:', currentUser.displayName);

console.log('\n🔍 权限检查条件分析:');

// 模拟MyContent组件的权限检查逻辑
const hasContentAccess = isAuthenticated && currentUser && currentUser.uuid && (
  // 半匿名用户 - 支持多种格式
  currentUser.userType === UserType.SEMI_ANONYMOUS ||
  currentUser.userType === 'semi_anonymous' ||
  currentUser.userType === 'semi-anonymous' ||
  currentUser.userType === 'SEMI_ANONYMOUS' ||
  // 管理员用户
  currentUser.userType === UserType.ADMIN ||
  currentUser.userType === 'admin' ||
  currentUser.userType === 'ADMIN' ||
  currentUser.userType === UserType.SUPER_ADMIN ||
  currentUser.userType === 'super_admin' ||
  currentUser.userType === 'SUPER_ADMIN' ||
  // 审核员用户
  currentUser.userType === UserType.REVIEWER ||
  currentUser.userType === 'reviewer' ||
  currentUser.userType === 'REVIEWER' ||
  // 匿名用户
  currentUser.userType === UserType.ANONYMOUS ||
  currentUser.userType === 'anonymous' ||
  currentUser.userType === 'ANONYMOUS' ||
  // 通用用户类型
  currentUser.userType === 'user' ||
  currentUser.userType === 'USER' ||
  // 有用户名或邮箱
  currentUser.username ||
  currentUser.email
);

console.log('基础条件检查:');
console.log('  - isAuthenticated:', isAuthenticated);
console.log('  - currentUser存在:', !!currentUser);
console.log('  - currentUser.uuid存在:', !!currentUser.uuid);

console.log('\n用户类型匹配检查:');
console.log('  - UserType.SEMI_ANONYMOUS:', UserType.SEMI_ANONYMOUS);
console.log('  - currentUser.userType:', currentUser.userType);
console.log('  - 匹配 UserType.SEMI_ANONYMOUS:', currentUser.userType === UserType.SEMI_ANONYMOUS);
console.log('  - 匹配 "semi_anonymous":', currentUser.userType === 'semi_anonymous');
console.log('  - 匹配 "semi-anonymous":', currentUser.userType === 'semi-anonymous');
console.log('  - 匹配 "SEMI_ANONYMOUS":', currentUser.userType === 'SEMI_ANONYMOUS');

console.log('\n其他条件检查:');
console.log('  - 匹配管理员类型:', 
  currentUser.userType === UserType.ADMIN ||
  currentUser.userType === 'admin' ||
  currentUser.userType === 'ADMIN'
);
console.log('  - 匹配审核员类型:', 
  currentUser.userType === UserType.REVIEWER ||
  currentUser.userType === 'reviewer' ||
  currentUser.userType === 'REVIEWER'
);
console.log('  - 匹配匿名类型:', 
  currentUser.userType === UserType.ANONYMOUS ||
  currentUser.userType === 'anonymous' ||
  currentUser.userType === 'ANONYMOUS'
);
console.log('  - 匹配通用用户:', 
  currentUser.userType === 'user' ||
  currentUser.userType === 'USER'
);
console.log('  - 有用户名:', !!currentUser.username);
console.log('  - 有邮箱:', !!currentUser.email);

console.log('\n🎯 最终权限检查结果:');
console.log('  - hasContentAccess:', hasContentAccess);

if (hasContentAccess) {
  console.log('✅ 权限检查通过，用户应该能访问"我的内容"页面');
} else {
  console.log('❌ 权限检查失败，用户会看到"需要登录访问"');
}

console.log('\n🔍 问题诊断:');
if (!hasContentAccess) {
  console.log('❌ 权限检查失败的可能原因:');
  
  if (!isAuthenticated) {
    console.log('  - 用户未认证');
  }
  
  if (!currentUser) {
    console.log('  - currentUser为空');
  }
  
  if (!currentUser.uuid) {
    console.log('  - currentUser.uuid为空');
  }
  
  if (currentUser.userType !== UserType.SEMI_ANONYMOUS && 
      currentUser.userType !== 'semi_anonymous' &&
      currentUser.userType !== 'semi-anonymous' &&
      currentUser.userType !== 'SEMI_ANONYMOUS') {
    console.log('  - 用户类型不匹配半匿名用户的任何格式');
    console.log('    实际类型:', currentUser.userType);
    console.log('    期望类型:', [UserType.SEMI_ANONYMOUS, 'semi_anonymous', 'semi-anonymous', 'SEMI_ANONYMOUS']);
  }
  
  console.log('\n💡 建议修复方案:');
  console.log('  1. 检查前端数据转换逻辑');
  console.log('  2. 确保后端返回的userType格式正确');
  console.log('  3. 简化权限检查逻辑');
  console.log('  4. 添加更多调试日志');
} else {
  console.log('✅ 权限检查逻辑正常，问题可能在其他地方');
}

console.log('\n📋 测试完成！');
