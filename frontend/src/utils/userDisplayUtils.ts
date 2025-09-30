/**
 * 用户显示相关工具函数
 * 用于统一处理用户标识符的显示格式
 */

export interface UserInfo {
  id?: string | number;
  uuid?: string;
  displayName?: string;
  username?: string;
  userType?: string;
  nickname?: string;
}

/**
 * 从用户信息中提取8位标识符
 * @param user 用户信息对象
 * @returns 8位用户标识符
 */
export function extractUserIdentifier(user: UserInfo | null | undefined): string {
  if (!user) {
    return '00000000';
  }

  // 1. 优先从displayName中提取（如果是"半匿名用户_xxxxxxxx"格式）
  if (user.displayName) {
    const match = user.displayName.match(/半匿名用户_([a-f0-9]{8})/i);
    if (match) {
      return match[1];
    }
    
    // 如果displayName本身就是8位标识符
    if (/^[a-f0-9]{8}$/i.test(user.displayName)) {
      return user.displayName.toLowerCase();
    }
  }

  // 2. 从UUID中提取最后8位
  if (user.uuid) {
    // 移除所有非字母数字字符，取最后8位
    const cleanUuid = user.uuid.replace(/[^a-f0-9]/gi, '');
    if (cleanUuid.length >= 8) {
      return cleanUuid.slice(-8).toLowerCase();
    }
  }

  // 3. 从ID中提取（如果是字符串格式）
  if (user.id && typeof user.id === 'string') {
    // 移除所有非字母数字字符，取最后8位
    const cleanId = user.id.replace(/[^a-f0-9]/gi, '');
    if (cleanId.length >= 8) {
      return cleanId.slice(-8).toLowerCase();
    }
  }

  // 4. 从数字ID生成8位十六进制
  if (user.id && typeof user.id === 'number') {
    return user.id.toString(16).padStart(8, '0').slice(-8);
  }

  // 5. 从username中提取
  if (user.username) {
    const match = user.username.match(/([a-f0-9]{8})/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  // 6. 生成默认标识符（基于用户类型）
  const fallback = generateFallbackIdentifier(user);
  return fallback;
}

/**
 * 生成备用标识符
 * @param user 用户信息
 * @returns 8位备用标识符
 */
function generateFallbackIdentifier(user: UserInfo): string {
  const userType = user.userType || 'unknown';
  const timestamp = Date.now().toString(16).slice(-6);
  
  // 根据用户类型生成前缀
  const prefixMap: Record<string, string> = {
    'semi_anonymous': 'sa',
    'semi-anonymous': 'sa',
    'admin': 'ad',
    'reviewer': 'rv',
    'anonymous': 'an',
    'registered': 'rg'
  };
  
  const prefix = prefixMap[userType] || 'un';
  return `${prefix}${timestamp}`;
}

/**
 * 获取用户显示名称（8位标识符）
 * @param user 用户信息对象
 * @returns 用户显示名称
 */
export function getUserDisplayName(user: UserInfo | null | undefined): string {
  return extractUserIdentifier(user);
}

/**
 * 检查是否为匿名用户
 * @param user 用户信息对象
 * @returns 是否为匿名用户
 */
export function isAnonymousUser(user: UserInfo | null | undefined): boolean {
  if (!user) return true;
  
  return user.userType === 'anonymous' || 
         user.userType === 'semi_anonymous' || 
         user.userType === 'semi-anonymous' ||
         !user.userType;
}

/**
 * 格式化用户显示信息
 * @param user 用户信息对象
 * @returns 格式化的显示信息
 */
export function formatUserDisplay(user: UserInfo | null | undefined): {
  identifier: string;
  isAnonymous: boolean;
  userType: string;
} {
  const identifier = extractUserIdentifier(user);
  const anonymous = isAnonymousUser(user);
  const userType = user?.userType || 'unknown';
  
  return {
    identifier,
    isAnonymous: anonymous,
    userType
  };
}
