// 生成密码哈希的脚本
// 在Node.js环境中运行: node generate-password-hash.js

import crypto from 'crypto';

class PasswordService {
  // 生成随机盐
  static generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // SHA-256哈希
  static async sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // 哈希密码
  static async hashPassword(password) {
    const salt = this.generateSalt();
    const hash = await this.sha256(password + salt);
    return `${salt}:${hash}`;
  }

  // 验证密码
  static async verifyPassword(password, hashedPassword) {
    try {
      const [salt, hash] = hashedPassword.split(':');
      if (!salt || !hash) {
        return false;
      }
      
      const computedHash = await this.sha256(password + salt);
      return computedHash === hash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
}

async function generateHashes() {
  console.log('生成密码哈希...\n');
  
  const passwords = [
    { username: 'admin1', password: 'admin123' },
    { username: 'reviewerA', password: 'admin123' },
    { username: 'reviewerB', password: 'admin123' }
  ];
  
  for (const { username, password } of passwords) {
    const hash = await PasswordService.hashPassword(password);
    console.log(`${username}: ${hash}`);
    
    // 验证哈希是否正确
    const isValid = await PasswordService.verifyPassword(password, hash);
    console.log(`验证 ${username}: ${isValid ? '✅' : '❌'}\n`);
  }
}

generateHashes().catch(console.error);
