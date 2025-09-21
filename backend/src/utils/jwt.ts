import type { JWTPayload, UserRole } from '../types';

// 简单的Base64编码/解码
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str += '='.repeat((4 - str.length % 4) % 4);
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

// HMAC-SHA256签名
async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBuffer = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  const signatureArray = new Uint8Array(signature);
  const signatureString = String.fromCharCode(...signatureArray);
  
  return base64UrlEncode(signatureString);
}

export class JWTService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // 生成JWT token
  async generateToken(payload: {
    userId: string | number;
    username: string;
    role: UserRole;
  }): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + (24 * 60 * 60) // 24小时过期
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
    
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await hmacSha256(this.secret, data);
    
    return `${data}.${signature}`;
  }

  // 验证JWT token
  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [encodedHeader, encodedPayload, signature] = parts;
      const data = `${encodedHeader}.${encodedPayload}`;
      
      // 验证签名
      const expectedSignature = await hmacSha256(this.secret, data);
      if (signature !== expectedSignature) {
        return null;
      }

      // 解析payload
      const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
      
      // 检查过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }

  // 从Authorization header中提取token
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

// 创建JWT服务实例
export function createJWTService(secret: string): JWTService {
  return new JWTService(secret);
}
