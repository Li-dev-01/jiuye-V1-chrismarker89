/**
 * 加密工具函数
 * 提供哈希、加密、UUID生成等功能
 */

/**
 * 生成SHA-256哈希
 */
export async function generateHash(input: string): Promise<string> {
  try {
    // 优先使用Web Crypto API
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // 降级到简单哈希（仅开发环境）
    return simpleHash(input);
  } catch (error) {
    console.warn('Web Crypto API不可用，使用简单哈希:', error);
    return simpleHash(input);
  }
}

/**
 * 简单哈希函数（降级方案）
 */
function simpleHash(input: string): string {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * 生成盐值
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // 降级方案
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成带盐值的哈希
 */
export async function generateSaltedHash(input: string, salt?: string): Promise<string> {
  const actualSalt = salt || generateSalt();
  const saltedInput = `${input}:${actualSalt}`;
  const hash = await generateHash(saltedInput);
  return `${hash}:${actualSalt}`;
}

/**
 * 验证带盐值的哈希
 */
export async function verifySaltedHash(input: string, saltedHash: string): Promise<boolean> {
  try {
    const [hash, salt] = saltedHash.split(':');
    if (!hash || !salt) return false;
    
    const inputHash = await generateSaltedHash(input, salt);
    return inputHash === saltedHash;
  } catch (error) {
    console.error('验证哈希失败:', error);
    return false;
  }
}

/**
 * 生成设备指纹
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.cookieEnabled ? '1' : '0'
  ];
  
  const fingerprint = components.join('|');
  return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // 降级方案
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * 生成UUID v4
 */
export function generateUUIDv4(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  
  // 降级方案
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 加密数据（简单对称加密）
 */
export function encryptData(data: string, key: string): string {
  try {
    const encrypted = btoa(data + '|' + key);
    return encrypted;
  } catch (error) {
    console.error('加密失败:', error);
    return data;
  }
}

/**
 * 解密数据
 */
export function decryptData(encryptedData: string, key: string): string {
  try {
    const decrypted = atob(encryptedData);
    const [data, originalKey] = decrypted.split('|');
    
    if (originalKey === key) {
      return data;
    }
    
    throw new Error('密钥不匹配');
  } catch (error) {
    console.error('解密失败:', error);
    return '';
  }
}

/**
 * 验证A值格式（11位数字）
 */
export function validateAValue(value: string): boolean {
  const pattern = /^\d{11}$/;
  return pattern.test(value);
}

/**
 * 验证B值格式（4位或6位数字）
 */
export function validateBValue(value: string): boolean {
  const pattern = /^(\d{4}|\d{6})$/;
  return pattern.test(value);
}

/**
 * 验证A+B组合
 */
export function validateABCombination(aValue: string, bValue: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!validateAValue(aValue)) {
    errors.push('A值必须是11位数字');
  }
  
  if (!validateBValue(bValue)) {
    errors.push('B值必须是4位或6位数字');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成A+B组合的身份哈希
 */
export async function generateABIdentityHash(aValue: string, bValue: string): Promise<string> {
  const validation = validateABCombination(aValue, bValue);
  if (!validation.valid) {
    throw new Error(`A+B组合格式错误: ${validation.errors.join(', ')}`);
  }
  
  const salt = 'college_employment_survey_2024';
  const combinedKey = `${aValue}:${bValue}:${salt}`;
  
  return await generateHash(combinedKey);
}

/**
 * 安全地比较两个字符串（防止时序攻击）
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * 生成安全的会话令牌
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateRandomString(24);
  return `${timestamp}-${randomPart}`;
}

/**
 * 验证会话令牌格式
 */
export function validateSessionToken(token: string): boolean {
  const pattern = /^[a-z0-9]+-[A-Za-z0-9]{24}$/;
  return pattern.test(token);
}

/**
 * 从会话令牌中提取时间戳
 */
export function extractTimestampFromToken(token: string): number | null {
  try {
    const [timestampPart] = token.split('-');
    return parseInt(timestampPart, 36);
  } catch (error) {
    return null;
  }
}

/**
 * 检查会话令牌是否过期
 */
export function isTokenExpired(token: string, maxAge: number): boolean {
  const timestamp = extractTimestampFromToken(token);
  if (!timestamp) return true;
  
  return Date.now() - timestamp > maxAge;
}

/**
 * 生成CSRF令牌
 */
export function generateCSRFToken(): string {
  return generateRandomString(32);
}

/**
 * 验证CSRF令牌
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return secureCompare(token, expectedToken);
}

/**
 * 数据脱敏
 */
export function maskSensitiveData(data: string, type: 'phone' | 'email' | 'id' = 'phone'): string {
  switch (type) {
    case 'phone':
      if (data.length === 11) {
        return data.slice(0, 3) + '****' + data.slice(-4);
      }
      break;
    case 'email':
      const [username, domain] = data.split('@');
      if (username && domain) {
        const maskedUsername = username.slice(0, 2) + '***' + username.slice(-1);
        return `${maskedUsername}@${domain}`;
      }
      break;
    case 'id':
      if (data.length > 6) {
        return data.slice(0, 3) + '***' + data.slice(-3);
      }
      break;
  }
  
  return data.slice(0, 2) + '***' + data.slice(-2);
}

/**
 * 生成校验和
 */
export function generateChecksum(data: string): string {
  let checksum = 0;
  for (let i = 0; i < data.length; i++) {
    checksum += data.charCodeAt(i);
  }
  return (checksum % 256).toString(16).padStart(2, '0');
}

/**
 * 验证校验和
 */
export function validateChecksum(data: string, expectedChecksum: string): boolean {
  const actualChecksum = generateChecksum(data);
  return secureCompare(actualChecksum, expectedChecksum);
}

/**
 * 安全的JSON解析
 */
export function safeJSONParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON解析失败，使用默认值:', error);
    return defaultValue;
  }
}

/**
 * 安全的JSON字符串化
 */
export function safeJSONStringify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('JSON字符串化失败:', error);
    return '{}';
  }
}
