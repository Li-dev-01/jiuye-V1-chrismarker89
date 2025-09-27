#!/usr/bin/env node

/**
 * 生成有效的管理员token用于测试API
 */

const JWT_SECRET = 'simple_auth_secret_key_2024';

// 创建简化token的函数（与后端保持一致）
function createSimpleToken(payload) {
  const tokenData = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24小时过期（毫秒）
  };

  // 简单的base64编码 + 签名
  const dataStr = JSON.stringify(tokenData);
  const encodedData = Buffer.from(dataStr).toString('base64url');
  const signature = Buffer.from(`${encodedData}.${JWT_SECRET}`).toString('base64url');

  return `${encodedData}.${signature}`;
}

// 生成管理员token
function generateAdminToken() {
  const adminPayload = {
    userId: 'admin_001',
    username: 'admin1',
    role: 'admin',
    name: '管理员',
    permissions: ['review_content', 'view_dashboard', 'manage_users', 'view_analytics']
  };

  return createSimpleToken(adminPayload);
}

// 生成超级管理员token
function generateSuperAdminToken() {
  const superAdminPayload = {
    userId: 'super_admin_001',
    username: 'superadmin',
    role: 'super_admin',
    name: '超级管理员',
    permissions: ['review_content', 'view_dashboard', 'manage_users', 'view_analytics', 'system_admin']
  };

  return createSimpleToken(superAdminPayload);
}

console.log('🔑 生成管理员认证Token\n');

const adminToken = generateAdminToken();
const superAdminToken = generateSuperAdminToken();

console.log('📋 管理员Token:');
console.log(adminToken);
console.log('\n📋 超级管理员Token:');
console.log(superAdminToken);

console.log('\n🧪 使用方法:');
console.log('在API请求的Header中添加:');
console.log('Authorization: Bearer ' + adminToken);

module.exports = {
  adminToken,
  superAdminToken,
  generateAdminToken,
  generateSuperAdminToken
};
