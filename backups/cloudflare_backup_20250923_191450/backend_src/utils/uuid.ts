/**
 * UUID生成和管理工具
 */

// 用户类型枚举
export type UserType = 'anonymous' | 'semi_anonymous' | 'reviewer' | 'admin' | 'super_admin';

// UUID前缀配置
const UUID_PREFIXES = {
  anonymous: (date: Date) => `anon-${formatDate(date)}-`,
  semi_anonymous: (date: Date) => `semi-${formatDate(date)}-`,
  reviewer: 'rev-',
  admin: 'admin-',
  super_admin: 'super-',
  session: 'sess-',
  token: 'tok-'
};

/**
 * 格式化日期为YYYYMMDD
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * 生成UUID v4
 */
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成带前缀的UUID
 */
export function generateUUID(userType: UserType | 'session' | 'token', date?: Date): string {
  const currentDate = date || new Date();
  const prefix = UUID_PREFIXES[userType];
  const prefixStr = typeof prefix === 'function' ? prefix(currentDate) : prefix;
  
  const randomPart = generateUUIDv4();
  return `${prefixStr}${randomPart}`;
}

/**
 * 解析UUID信息
 */
export function parseUUIDInfo(uuid: string): { userType: UserType; date?: string } {
  if (uuid.startsWith('anon-')) {
    const datePart = uuid.slice(5, 13);
    return { userType: 'anonymous', date: datePart };
  }
  
  if (uuid.startsWith('semi-')) {
    const datePart = uuid.slice(5, 13);
    return { userType: 'semi_anonymous', date: datePart };
  }
  
  if (uuid.startsWith('rev-')) {
    return { userType: 'reviewer' };
  }
  
  if (uuid.startsWith('admin-')) {
    return { userType: 'admin' };
  }
  
  if (uuid.startsWith('super-')) {
    return { userType: 'super_admin' };
  }
  
  throw new Error(`Unknown UUID format: ${uuid}`);
}

/**
 * 生成SHA-256哈希 (使用Web Crypto API)
 */
export async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成A+B组合的身份哈希
 */
export async function generateABIdentityHash(aValue: string, bValue: string): Promise<string> {
  // 验证A+B格式
  if (!/^\d{11}$/.test(aValue)) {
    throw new Error('A值必须是11位数字');
  }
  
  if (!/^(\d{4}|\d{6})$/.test(bValue)) {
    throw new Error('B值必须是4位或6位数字');
  }
  
  const salt = 'college_employment_survey_2024';
  const combinedKey = `${aValue}:${bValue}:${salt}`;

  return await generateHash(combinedKey);
}

/**
 * 生成设备指纹
 */
export async function generateDeviceFingerprint(deviceInfo: any): Promise<string> {
  if (!deviceInfo) {
    const fallback = await generateHash(`fallback-${Date.now()}-${Math.random()}`);
    return fallback;
  }

  const components = [
    deviceInfo.userAgent || '',
    deviceInfo.platform || '',
    deviceInfo.language || '',
    deviceInfo.timezone || '',
    deviceInfo.screen?.width || '',
    deviceInfo.screen?.height || '',
    deviceInfo.screen?.colorDepth || ''
  ];

  const fingerprint = components.join('|');
  const hash = await generateHash(fingerprint);
  return hash.slice(0, 32);
}

/**
 * 验证UUID格式
 */
export function validateUUID(uuid: string): boolean {
  // 检查基本格式
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  // 检查是否有有效的前缀
  const validPrefixes = ['anon-', 'semi-', 'rev-', 'admin-', 'super-'];
  const hasValidPrefix = validPrefixes.some(prefix => uuid.startsWith(prefix));
  
  if (!hasValidPrefix) {
    return false;
  }
  
  // 检查UUID部分的格式
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (uuid.startsWith('anon-') || uuid.startsWith('semi-')) {
    // 带日期的UUID格式：prefix-YYYYMMDD-uuid
    const parts = uuid.split('-');
    if (parts.length < 3) return false;
    
    const datePart = parts[1];
    if (!/^\d{8}$/.test(datePart)) return false;
    
    const uuidPart = parts.slice(2).join('-');
    return uuidPattern.test(uuidPart);
  } else {
    // 普通UUID格式：prefix-uuid
    const uuidPart = uuid.slice(uuid.indexOf('-') + 1);
    return uuidPattern.test(uuidPart);
  }
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return result;
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
 * 获取UUID统计信息
 */
export function getUUIDStats(uuids: string[]): {
  total: number;
  byType: Record<UserType, number>;
  byDate: Record<string, number>;
} {
  const stats = {
    total: uuids.length,
    byType: {
      anonymous: 0,
      semi_anonymous: 0,
      reviewer: 0,
      admin: 0,
      super_admin: 0
    } as Record<UserType, number>,
    byDate: {} as Record<string, number>
  };

  uuids.forEach(uuid => {
    try {
      const info = parseUUIDInfo(uuid);
      stats.byType[info.userType]++;
      
      if (info.date) {
        stats.byDate[info.date] = (stats.byDate[info.date] || 0) + 1;
      }
    } catch (error) {
      // 忽略无效的UUID
    }
  });

  return stats;
}

/**
 * 批量生成UUID
 */
export function generateBatchUUIDs(
  userType: UserType,
  count: number,
  date?: Date
): string[] {
  const uuids: string[] = [];
  
  for (let i = 0; i < count; i++) {
    uuids.push(generateUUID(userType, date));
  }
  
  return uuids;
}

/**
 * UUID排序函数
 */
export function sortUUIDs(uuids: string[], order: 'asc' | 'desc' = 'asc'): string[] {
  return uuids.sort((a, b) => {
    try {
      const aInfo = parseUUIDInfo(a);
      const bInfo = parseUUIDInfo(b);
      
      // 先按用户类型排序
      if (aInfo.userType !== bInfo.userType) {
        const typeOrder = ['anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin'];
        const aIndex = typeOrder.indexOf(aInfo.userType);
        const bIndex = typeOrder.indexOf(bInfo.userType);
        return order === 'asc' ? aIndex - bIndex : bIndex - aIndex;
      }
      
      // 再按日期排序（如果有）
      if (aInfo.date && bInfo.date) {
        return order === 'asc' ? 
          aInfo.date.localeCompare(bInfo.date) : 
          bInfo.date.localeCompare(aInfo.date);
      }
      
      // 最后按UUID字符串排序
      return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    } catch (error) {
      return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
  });
}
