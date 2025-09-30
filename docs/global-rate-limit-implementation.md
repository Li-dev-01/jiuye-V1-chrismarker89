# 全局频率限制实施方案

## 🎯 **实施概述**

基于前端代码分析，当前项目存在以下用户提交请求类型，需要实施全局频率限制策略：

### **用户提交请求统计**
1. **问卷提交**: 3个接口，日均预估500-1000次
2. **用户注册**: 5个接口，日均预估100-200次  
3. **故事发布**: 1个接口，日均预估50-100次
4. **管理登录**: 2个接口，日均预估20-50次

## 🔧 **核心实施代码**

### **1. 全局限流管理器**

```typescript
// frontend/src/utils/globalRateLimitManager.ts
export class GlobalRateLimitManager {
  private static instance: GlobalRateLimitManager;
  private limiters = new Map<string, any>();
  
  // 全局限制配置
  private readonly GLOBAL_LIMITS = {
    // 每IP每小时总请求限制
    perIPHourly: {
      questionnaire: 5,    // 问卷提交
      registration: 10,    // 用户注册
      story: 15,          // 故事发布
      login: 20           // 登录尝试
    },
    
    // 每IP每天总请求限制
    perIPDaily: {
      questionnaire: 10,
      registration: 20,
      story: 30,
      login: 50
    },
    
    // 可疑行为阈值
    suspiciousThresholds: {
      rapidSubmissions: 5,    // 5分钟内连续提交
      duplicateContent: 3,    // 重复内容次数
      multipleAccounts: 5     // 同IP多账号注册
    }
  };

  public static getInstance(): GlobalRateLimitManager {
    if (!GlobalRateLimitManager.instance) {
      GlobalRateLimitManager.instance = new GlobalRateLimitManager();
    }
    return GlobalRateLimitManager.instance;
  }

  // 检查是否允许请求
  public async checkRequest(
    requestType: 'questionnaire' | 'registration' | 'story' | 'login',
    identifier: string,
    metadata?: any
  ): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
    
    // 1. 检查全局IP限制
    const ipCheck = await this.checkIPLimits(requestType, identifier);
    if (!ipCheck.allowed) {
      return ipCheck;
    }
    
    // 2. 检查可疑行为
    const behaviorCheck = await this.checkSuspiciousBehavior(requestType, identifier, metadata);
    if (!behaviorCheck.allowed) {
      return behaviorCheck;
    }
    
    // 3. 检查内容质量（针对问卷和故事）
    if (requestType === 'questionnaire' || requestType === 'story') {
      const qualityCheck = await this.checkContentQuality(requestType, metadata);
      if (!qualityCheck.allowed) {
        return qualityCheck;
      }
    }
    
    return { allowed: true };
  }

  // 记录请求
  public async recordRequest(
    requestType: string,
    identifier: string,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    const key = `${requestType}:${identifier}`;
    const now = Date.now();
    
    // 记录到本地存储（实际应该存储到后端）
    const record = {
      timestamp: now,
      type: requestType,
      identifier,
      success,
      metadata
    };
    
    // 存储逻辑...
  }

  private async checkIPLimits(
    requestType: string,
    ip: string
  ): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
    // IP限制检查逻辑
    return { allowed: true };
  }

  private async checkSuspiciousBehavior(
    requestType: string,
    identifier: string,
    metadata?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 可疑行为检查逻辑
    return { allowed: true };
  }

  private async checkContentQuality(
    requestType: string,
    metadata?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 内容质量检查逻辑
    return { allowed: true };
  }
}
```

### **2. API拦截器增强**

```typescript
// frontend/src/services/api.ts (增强版)
import { GlobalRateLimitManager } from '../utils/globalRateLimitManager';

// 请求拦截器增强
apiClient.interceptors.request.use(
  async (config) => {
    // 现有逻辑...
    
    // 添加全局频率限制检查
    const rateLimitManager = GlobalRateLimitManager.getInstance();
    const requestType = getRequestType(config.url);
    const identifier = getClientIdentifier();
    
    if (requestType) {
      const checkResult = await rateLimitManager.checkRequest(
        requestType,
        identifier,
        config.data
      );
      
      if (!checkResult.allowed) {
        // 显示友好的错误提示
        showRateLimitError(checkResult.reason, checkResult.retryAfter);
        
        // 拒绝请求
        return Promise.reject(new Error(`Rate limit exceeded: ${checkResult.reason}`));
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器增强
apiClient.interceptors.response.use(
  async (response) => {
    // 记录成功请求
    const requestType = getRequestType(response.config.url);
    if (requestType) {
      const rateLimitManager = GlobalRateLimitManager.getInstance();
      await rateLimitManager.recordRequest(
        requestType,
        getClientIdentifier(),
        true,
        response.data
      );
    }
    
    return response;
  },
  async (error) => {
    // 记录失败请求
    const requestType = getRequestType(error.config?.url);
    if (requestType) {
      const rateLimitManager = GlobalRateLimitManager.getInstance();
      await rateLimitManager.recordRequest(
        requestType,
        getClientIdentifier(),
        false,
        error.response?.data
      );
    }
    
    return Promise.reject(error);
  }
);

// 辅助函数
function getRequestType(url?: string): string | null {
  if (!url) return null;
  
  if (url.includes('questionnaire')) return 'questionnaire';
  if (url.includes('register') || url.includes('auth')) return 'registration';
  if (url.includes('stories')) return 'story';
  if (url.includes('login')) return 'login';
  
  return null;
}

function getClientIdentifier(): string {
  // 获取客户端标识符（IP、设备指纹等）
  return 'client-identifier';
}

function showRateLimitError(reason?: string, retryAfter?: number): void {
  // 显示用户友好的错误提示
  console.warn('Rate limit exceeded:', reason);
}
```

### **3. 问卷提交增强**

```typescript
// frontend/src/services/universalQuestionnaireService.ts (增强版)
import { GlobalRateLimitManager } from '../utils/globalRateLimitManager';

export class UniversalQuestionnaireService {
  private rateLimitManager = GlobalRateLimitManager.getInstance();

  async submitQuestionnaire(data: any): Promise<any> {
    // 预检查频率限制
    const preCheck = await this.rateLimitManager.checkRequest(
      'questionnaire',
      this.getClientIP(),
      {
        contentLength: JSON.stringify(data).length,
        submissionTime: Date.now(),
        userAgent: navigator.userAgent
      }
    );

    if (!preCheck.allowed) {
      throw new Error(`提交频率过高: ${preCheck.reason}`);
    }

    // 内容质量检查
    const qualityCheck = this.checkQuestionnaireQuality(data);
    if (!qualityCheck.passed) {
      throw new Error(`问卷质量不符合要求: ${qualityCheck.reason}`);
    }

    // 执行提交
    try {
      const response = await apiClient.post('/api/universal-questionnaire/submit', data);
      
      // 记录成功提交
      await this.rateLimitManager.recordRequest(
        'questionnaire',
        this.getClientIP(),
        true,
        { responseId: response.data.id }
      );
      
      return response.data;
    } catch (error) {
      // 记录失败提交
      await this.rateLimitManager.recordRequest(
        'questionnaire',
        this.getClientIP(),
        false,
        { error: error.message }
      );
      
      throw error;
    }
  }

  private checkQuestionnaireQuality(data: any): { passed: boolean; reason?: string } {
    // 检查回答完整性
    const requiredFields = ['personalInfo', 'educationInfo', 'employmentInfo'];
    for (const field of requiredFields) {
      if (!data[field] || Object.keys(data[field]).length === 0) {
        return { passed: false, reason: `缺少必填信息: ${field}` };
      }
    }

    // 检查回答合理性
    if (this.hasUnreasonableAnswers(data)) {
      return { passed: false, reason: '回答内容不合理' };
    }

    // 检查是否为重复提交
    if (this.isDuplicateSubmission(data)) {
      return { passed: false, reason: '检测到重复提交' };
    }

    return { passed: true };
  }

  private hasUnreasonableAnswers(data: any): boolean {
    // 实施合理性检查逻辑
    return false;
  }

  private isDuplicateSubmission(data: any): boolean {
    // 实施重复检查逻辑
    return false;
  }

  private getClientIP(): string {
    // 获取客户端IP
    return 'client-ip';
  }
}
```

## 📊 **监控仪表板**

### **实时监控指标**

```typescript
// frontend/src/components/admin/RateLimitDashboard.tsx
export const RateLimitDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    requestsByType: {},
    topIPs: [],
    suspiciousActivities: []
  });

  return (
    <div className="rate-limit-dashboard">
      <Card title="请求频率监控">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总请求数" value={metrics.totalRequests} />
          </Col>
          <Col span={6}>
            <Statistic title="被阻止请求" value={metrics.blockedRequests} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="阻止率" 
              value={(metrics.blockedRequests / metrics.totalRequests * 100).toFixed(2)} 
              suffix="%" 
            />
          </Col>
          <Col span={6}>
            <Statistic title="可疑活动" value={metrics.suspiciousActivities.length} />
          </Col>
        </Row>
      </Card>

      <Card title="请求类型分布">
        {/* 图表组件 */}
      </Card>

      <Card title="高频IP监控">
        {/* IP列表组件 */}
      </Card>
    </div>
  );
};
```

## 🚀 **部署计划**

### **第一阶段: 基础限流 (1周)**
1. 实施GlobalRateLimitManager
2. 为问卷提交添加基础限流
3. 添加监控日志

### **第二阶段: 全面覆盖 (1周)**
1. 覆盖所有提交接口
2. 实施内容质量检查
3. 建立监控仪表板

### **第三阶段: 智能优化 (2周)**
1. 添加机器学习检测
2. 实施动态限制调整
3. 完善用户体验

**通过这套实施方案，我们可以有效控制各类提交请求的频率，防止恶意滥用，同时保障正常用户的使用体验。**
