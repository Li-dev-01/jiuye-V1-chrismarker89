/**
 * 简化的防爬虫机制
 * 重点区分真实用户和机器爬虫，配合Cloudflare使用
 */

interface UserBehavior {
  mouseMovements: number;
  scrollEvents: number;
  keyboardEvents: number;
  focusEvents: number;
  resizeEvents: number;
  lastInteractionTime: number;
  sessionStartTime: number;
  pageVisitDuration: number;
}

interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-1，越高越可能是机器人
  reasons: string[];
  humanScore: number; // 人类行为得分
}

class SimpleAntiBotDetector {
  private static instance: SimpleAntiBotDetector;
  private behavior: UserBehavior;
  private eventListeners: (() => void)[] = [];
  
  // 检测阈值配置
  private readonly THRESHOLDS = {
    MIN_MOUSE_MOVEMENTS: 5,      // 最少鼠标移动次数
    MIN_SCROLL_EVENTS: 2,        // 最少滚动事件
    MIN_SESSION_TIME: 3000,      // 最少会话时间（3秒）
    MAX_REQUEST_FREQUENCY: 2000, // 最大请求频率（2秒一次）
    MIN_PAGE_VISIT_TIME: 1000,   // 最少页面停留时间（1秒）
  };

  private constructor() {
    this.behavior = {
      mouseMovements: 0,
      scrollEvents: 0,
      keyboardEvents: 0,
      focusEvents: 0,
      resizeEvents: 0,
      lastInteractionTime: Date.now(),
      sessionStartTime: Date.now(),
      pageVisitDuration: 0
    };
    
    this.initEventListeners();
  }

  public static getInstance(): SimpleAntiBotDetector {
    if (!SimpleAntiBotDetector.instance) {
      SimpleAntiBotDetector.instance = new SimpleAntiBotDetector();
    }
    return SimpleAntiBotDetector.instance;
  }

  /**
   * 初始化事件监听器
   */
  private initEventListeners(): void {
    // 鼠标移动
    const handleMouseMove = () => {
      this.behavior.mouseMovements++;
      this.updateLastInteraction();
    };

    // 滚动事件
    const handleScroll = () => {
      this.behavior.scrollEvents++;
      this.updateLastInteraction();
    };

    // 键盘事件
    const handleKeyboard = () => {
      this.behavior.keyboardEvents++;
      this.updateLastInteraction();
    };

    // 焦点事件
    const handleFocus = () => {
      this.behavior.focusEvents++;
      this.updateLastInteraction();
    };

    // 窗口大小变化
    const handleResize = () => {
      this.behavior.resizeEvents++;
      this.updateLastInteraction();
    };

    // 页面可见性变化
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.behavior.pageVisitDuration += Date.now() - this.behavior.lastInteractionTime;
      } else {
        this.updateLastInteraction();
      }
    };

    // 添加事件监听器
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('keydown', handleKeyboard, { passive: true });
    document.addEventListener('keyup', handleKeyboard, { passive: true });
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleFocus);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 保存清理函数
    this.eventListeners = [
      () => document.removeEventListener('mousemove', handleMouseMove),
      () => document.removeEventListener('scroll', handleScroll),
      () => document.removeEventListener('keydown', handleKeyboard),
      () => document.removeEventListener('keyup', handleKeyboard),
      () => window.removeEventListener('focus', handleFocus),
      () => window.removeEventListener('blur', handleFocus),
      () => window.removeEventListener('resize', handleResize),
      () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    ];
  }

  /**
   * 更新最后交互时间
   */
  private updateLastInteraction(): void {
    this.behavior.lastInteractionTime = Date.now();
  }

  /**
   * 检测是否为机器人
   */
  public detectBot(): BotDetectionResult {
    const now = Date.now();
    const sessionDuration = now - this.behavior.sessionStartTime;
    const timeSinceLastInteraction = now - this.behavior.lastInteractionTime;
    
    const reasons: string[] = [];
    let botScore = 0;
    let humanScore = 0;

    // 1. 检查鼠标移动
    if (this.behavior.mouseMovements < this.THRESHOLDS.MIN_MOUSE_MOVEMENTS) {
      reasons.push('鼠标移动次数过少');
      botScore += 0.3;
    } else {
      humanScore += 0.2;
    }

    // 2. 检查滚动行为
    if (this.behavior.scrollEvents < this.THRESHOLDS.MIN_SCROLL_EVENTS) {
      reasons.push('滚动事件过少');
      botScore += 0.2;
    } else {
      humanScore += 0.15;
    }

    // 3. 检查会话时间
    if (sessionDuration < this.THRESHOLDS.MIN_SESSION_TIME) {
      reasons.push('会话时间过短');
      botScore += 0.25;
    } else {
      humanScore += 0.1;
    }

    // 4. 检查交互频率
    if (timeSinceLastInteraction > 30000) { // 30秒无交互
      reasons.push('长时间无交互');
      botScore += 0.15;
    } else {
      humanScore += 0.1;
    }

    // 5. 检查键盘事件
    if (this.behavior.keyboardEvents > 0) {
      humanScore += 0.2;
    }

    // 6. 检查窗口焦点事件
    if (this.behavior.focusEvents > 0) {
      humanScore += 0.1;
    }

    // 7. 检查用户代理和环境
    const envScore = this.checkEnvironment();
    botScore += envScore.botScore;
    humanScore += envScore.humanScore;
    reasons.push(...envScore.reasons);

    // 8. 检查请求模式
    const requestScore = this.checkRequestPattern();
    botScore += requestScore.botScore;
    humanScore += requestScore.humanScore;
    reasons.push(...requestScore.reasons);

    // 计算最终得分
    const confidence = Math.min(1, botScore);
    const finalHumanScore = Math.min(1, humanScore);
    const isBot = confidence > 0.6 || finalHumanScore < 0.3;

    return {
      isBot,
      confidence,
      reasons: reasons.filter(Boolean),
      humanScore: finalHumanScore
    };
  }

  /**
   * 检查浏览器环境
   */
  private checkEnvironment(): { botScore: number; humanScore: number; reasons: string[] } {
    const reasons: string[] = [];
    let botScore = 0;
    let humanScore = 0;

    // 检查用户代理
    const userAgent = navigator.userAgent.toLowerCase();
    const botKeywords = ['bot', 'crawler', 'spider', 'scraper', 'headless'];
    
    if (botKeywords.some(keyword => userAgent.includes(keyword))) {
      reasons.push('用户代理包含爬虫关键词');
      botScore += 0.4;
    }

    // 检查是否为无头浏览器
    if (navigator.webdriver) {
      reasons.push('检测到WebDriver');
      botScore += 0.3;
    }

    // 检查屏幕尺寸
    if (screen.width === 0 || screen.height === 0) {
      reasons.push('异常的屏幕尺寸');
      botScore += 0.2;
    }

    // 检查语言设置
    if (navigator.languages && navigator.languages.length > 0) {
      humanScore += 0.1;
    }

    // 检查插件数量
    if (navigator.plugins && navigator.plugins.length > 0) {
      humanScore += 0.1;
    } else {
      reasons.push('无浏览器插件');
      botScore += 0.1;
    }

    // 检查触摸支持
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      humanScore += 0.05;
    }

    return { botScore, humanScore, reasons };
  }

  /**
   * 检查请求模式
   */
  private checkRequestPattern(): { botScore: number; humanScore: number; reasons: string[] } {
    const reasons: string[] = [];
    let botScore = 0;
    let humanScore = 0;

    // 检查页面加载时间
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      if (loadTime < 500) { // 加载时间过短可能是预渲染
        reasons.push('页面加载时间异常');
        botScore += 0.1;
      }
    }

    // 检查引用页面
    if (document.referrer === '') {
      reasons.push('无引用页面');
      botScore += 0.05;
    } else {
      humanScore += 0.05;
    }

    return { botScore, humanScore, reasons };
  }

  /**
   * 获取人类验证令牌
   */
  public getHumanVerificationToken(): string {
    const detection = this.detectBot();
    const timestamp = Date.now();
    
    // 生成基于行为的令牌
    const tokenData = {
      timestamp,
      humanScore: detection.humanScore,
      mouseMovements: this.behavior.mouseMovements,
      scrollEvents: this.behavior.scrollEvents,
      sessionDuration: timestamp - this.behavior.sessionStartTime,
      // 简单的校验和
      checksum: this.generateChecksum(detection.humanScore, timestamp)
    };

    return btoa(JSON.stringify(tokenData));
  }

  /**
   * 生成校验和
   */
  private generateChecksum(humanScore: number, timestamp: number): string {
    const data = `${humanScore}-${timestamp}-${this.behavior.mouseMovements}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 验证令牌
   */
  public static verifyToken(token: string): boolean {
    try {
      const tokenData = JSON.parse(atob(token));
      const now = Date.now();
      
      // 检查时间戳（令牌有效期5分钟）
      if (now - tokenData.timestamp > 5 * 60 * 1000) {
        return false;
      }

      // 检查人类得分
      if (tokenData.humanScore < 0.3) {
        return false;
      }

      // 验证校验和
      const expectedChecksum = SimpleAntiBotDetector.prototype.generateChecksum.call(
        { behavior: { mouseMovements: tokenData.mouseMovements } },
        tokenData.humanScore,
        tokenData.timestamp
      );
      
      return tokenData.checksum === expectedChecksum;
    } catch {
      return false;
    }
  }

  /**
   * 重置行为数据
   */
  public reset(): void {
    this.behavior = {
      mouseMovements: 0,
      scrollEvents: 0,
      keyboardEvents: 0,
      focusEvents: 0,
      resizeEvents: 0,
      lastInteractionTime: Date.now(),
      sessionStartTime: Date.now(),
      pageVisitDuration: 0
    };
  }

  /**
   * 获取当前行为统计
   */
  public getBehaviorStats(): UserBehavior & { sessionDuration: number } {
    return {
      ...this.behavior,
      sessionDuration: Date.now() - this.behavior.sessionStartTime
    };
  }

  /**
   * 清理事件监听器
   */
  public cleanup(): void {
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners = [];
  }
}

// 导出单例实例
export const antiBotDetector = SimpleAntiBotDetector.getInstance();

// 简化的使用接口
export const checkIfHuman = (): BotDetectionResult => {
  return antiBotDetector.detectBot();
};

export const getHumanToken = (): string => {
  return antiBotDetector.getHumanVerificationToken();
};

export const isValidHumanToken = (token: string): boolean => {
  return SimpleAntiBotDetector.verifyToken(token);
};
