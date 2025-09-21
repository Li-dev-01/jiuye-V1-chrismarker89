// IP信誉检查服务
export interface IPReputationResult {
  safe: boolean;
  reason?: string;
  score: number;
  details: {
    isVPN?: boolean;
    isProxy?: boolean;
    isTor?: boolean;
    isDataCenter?: boolean;
    isMalicious?: boolean;
    country?: string;
    asn?: string;
    isp?: string;
  };
}

// 免费IP信誉API集成
export class IPReputationService {
  private static readonly CACHE_TTL = 3600000; // 1小时缓存
  private static cache = new Map<string, { result: IPReputationResult; timestamp: number }>();

  // 检查IP信誉（集成多个免费服务）
  static async checkIPReputation(ip: string): Promise<IPReputationResult> {
    // 检查缓存
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    try {
      // 并行调用多个IP检查服务
      const results = await Promise.allSettled([
        this.checkWithIPAPI(ip),
        this.checkWithIPInfo(ip),
        this.checkWithCloudflare(ip)
      ]);

      // 合并结果
      const result = this.mergeResults(ip, results);
      
      // 缓存结果
      this.cache.set(ip, { result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('IP reputation check failed:', error);
      return this.getDefaultResult(ip);
    }
  }

  // 使用ip-api.com（免费，每分钟1000次请求）
  private static async checkWithIPAPI(ip: string): Promise<Partial<IPReputationResult>> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query`);
      const data = await response.json();

      if ((data as any).status === 'success') {
        return {
          safe: !(data as any).proxy && !(data as any).hosting,
          details: {
            isProxy: (data as any).proxy,
            isDataCenter: (data as any).hosting,
            country: (data as any).country,
            asn: (data as any).as,
            isp: (data as any).isp
          },
          score: (data as any).proxy ? 80 : ((data as any).hosting ? 60 : 10)
        };
      }
    } catch (error) {
      console.warn('IP-API check failed:', error);
    }
    return {};
  }

  // 使用ipinfo.io（免费，每月50000次请求）
  private static async checkWithIPInfo(ip: string): Promise<Partial<IPReputationResult>> {
    try {
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      const data = await response.json();

      const isDataCenter = (data as any).org && (
        (data as any).org.toLowerCase().includes('hosting') ||
        (data as any).org.toLowerCase().includes('cloud') ||
        (data as any).org.toLowerCase().includes('server') ||
        (data as any).org.toLowerCase().includes('datacenter')
      );

      return {
        safe: !isDataCenter,
        details: {
          isDataCenter,
          country: (data as any).country,
          isp: (data as any).org
        },
        score: isDataCenter ? 50 : 5
      };
    } catch (error) {
      console.warn('IPInfo check failed:', error);
    }
    return {};
  }

  // 使用Cloudflare的IP信息（如果可用）
  private static async checkWithCloudflare(ip: string): Promise<Partial<IPReputationResult>> {
    try {
      // 这里可以集成Cloudflare的威胁情报API
      // 目前返回基础检查
      const isPrivateIP = this.isPrivateIP(ip);
      
      return {
        safe: !isPrivateIP,
        details: {},
        score: isPrivateIP ? 90 : 0
      };
    } catch (error) {
      console.warn('Cloudflare check failed:', error);
    }
    return {};
  }

  // 合并多个检查结果
  private static mergeResults(ip: string, results: PromiseSettledResult<Partial<IPReputationResult>>[]): IPReputationResult {
    let totalScore = 0;
    let maxScore = 0;
    const details: IPReputationResult['details'] = {};
    const reasons: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.score !== undefined) {
        totalScore += result.value.score;
        maxScore = Math.max(maxScore, result.value.score);
        
        // 合并详细信息
        if (result.value.details) {
          Object.assign(details, result.value.details);
        }

        // 收集原因
        if (!result.value.safe && result.value.reason) {
          reasons.push(result.value.reason);
        }
      }
    }

    // 额外检查
    if (this.isPrivateIP(ip)) {
      totalScore += 90;
      reasons.push('private_ip');
    }

    if (this.isKnownMaliciousIP(ip)) {
      totalScore += 100;
      reasons.push('known_malicious');
    }

    const finalScore = Math.min(100, Math.max(maxScore, totalScore / results.length));
    const safe = finalScore < 50;

    return {
      safe,
      score: finalScore,
      reason: reasons.length > 0 ? reasons.join(',') : undefined,
      details
    };
  }

  // 检查是否为私有IP
  private static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  // 检查已知恶意IP（可以从外部数据源更新）
  private static isKnownMaliciousIP(ip: string): boolean {
    // 这里可以集成更多的威胁情报源
    const knownMalicious = [
      '1.2.3.4',
      '5.6.7.8',
      // 实际使用时应该从威胁情报数据库获取
    ];

    return knownMalicious.includes(ip);
  }

  // 默认结果（当所有检查都失败时）
  private static getDefaultResult(ip: string): IPReputationResult {
    return {
      safe: !this.isPrivateIP(ip) && !this.isKnownMaliciousIP(ip),
      score: this.isPrivateIP(ip) ? 90 : 0,
      reason: this.isPrivateIP(ip) ? 'private_ip' : undefined,
      details: {}
    };
  }

  // 清理过期缓存
  static cleanupCache(): void {
    const now = Date.now();
    for (const [ip, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(ip);
      }
    }
  }

  // 获取缓存统计
  static getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // 可以实现命中率统计
    };
  }
}

// 定期清理缓存
setInterval(() => {
  IPReputationService.cleanupCache();
}, 3600000); // 每小时清理一次
