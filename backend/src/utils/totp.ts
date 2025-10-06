/**
 * TOTP (Time-based One-Time Password) 实现
 * 基于 RFC 6238 标准
 * 适用于 Cloudflare Workers 环境
 */

/**
 * Base32 解码
 */
function base32Decode(base32: string): Uint8Array {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedBase32 = base32.toUpperCase().replace(/=+$/, '');
  
  let bits = '';
  for (const char of cleanedBase32) {
    const val = base32Chars.indexOf(char);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  
  return bytes;
}

/**
 * 将数字转换为8字节数组（大端序）
 */
function numberToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return bytes;
}

/**
 * HMAC-SHA1 实现
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * 生成 TOTP 代码
 * @param secret Base32 编码的密钥
 * @param timeStep 时间步长（秒），默认30秒
 * @param digits 代码位数，默认6位
 * @param time 当前时间戳（毫秒），默认为当前时间
 */
export async function generateTOTP(
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
  time: number = Date.now()
): Promise<string> {
  // 1. 解码 Base32 密钥
  const key = base32Decode(secret);
  
  // 2. 计算时间计数器
  const counter = Math.floor(time / 1000 / timeStep);
  const counterBytes = numberToBytes(counter);
  
  // 3. 计算 HMAC-SHA1
  const hmac = await hmacSha1(key, counterBytes);
  
  // 4. 动态截断
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  );
  
  // 5. 生成指定位数的代码
  const otp = (code % Math.pow(10, digits)).toString().padStart(digits, '0');
  
  return otp;
}

/**
 * 验证 TOTP 代码
 * @param code 用户输入的代码
 * @param secret Base32 编码的密钥
 * @param window 时间窗口（允许前后多少个时间步长），默认1（允许前后30秒）
 * @param timeStep 时间步长（秒），默认30秒
 */
export async function verifyTOTP(
  code: string,
  secret: string,
  window: number = 1,
  timeStep: number = 30
): Promise<boolean> {
  const currentTime = Date.now();
  
  // 检查当前时间窗口及前后窗口
  for (let i = -window; i <= window; i++) {
    const time = currentTime + (i * timeStep * 1000);
    const expectedCode = await generateTOTP(secret, timeStep, 6, time);
    
    if (code === expectedCode) {
      return true;
    }
  }
  
  return false;
}

/**
 * 生成 Base32 密钥
 * @param length 密钥长度（字符数），默认32
 */
export function generateBase32Secret(length: number = 32): string {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * base32Chars.length);
    secret += base32Chars[randomIndex];
  }
  
  return secret;
}

/**
 * 生成 QR 码 URL（用于 Google Authenticator 等应用）
 * @param secret Base32 密钥
 * @param accountName 账户名称（通常是邮箱）
 * @param issuer 发行者名称（应用名称）
 */
export function generateQRCodeURL(
  secret: string,
  accountName: string,
  issuer: string = '就业调查系统'
): string {
  const label = `${issuer}:${accountName}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

/**
 * 生成备用代码
 * @param count 生成数量，默认10个
 * @param length 每个代码的长度，默认8位
 */
export function generateBackupCodes(count: number = 10, length: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < length; j++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    codes.push(code);
  }
  
  return codes;
}

/**
 * 哈希备用代码（用于存储）
 */
export async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 验证备用代码
 */
export async function verifyBackupCode(code: string, hash: string): Promise<boolean> {
  const computedHash = await hashBackupCode(code);
  return computedHash === hash;
}

