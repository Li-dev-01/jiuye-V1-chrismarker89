/**
 * 分级审核服务
 * 与线上Cloudflare Worker分级审核API交互
 */

import { API_CONFIG, API_ENDPOINTS, handleApiError, retryApiCall, logApiCall } from '../config/apiConfig';

// 分级审核相关类型定义
export interface AuditLevel {
  current_level: 'level1' | 'level2' | 'level3';
  config: {
    config_name: string;
    description: string;
    rule_strictness: number;
    ai_threshold: number;
    manual_review_ratio: number;
    enabled_categories: string[];
  };
  auto_switch: boolean;
}

export interface AuditViolation {
  rule_id: string;
  category: string;
  matched_text: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface AuditResult {
  passed: boolean;
  action: 'approve' | 'reject' | 'ai_review' | 'manual_review';
  requires_manual: boolean;
  confidence: number;
  reason: string;
  risk_score: number;
  violations: AuditViolation[];
  audit_level: string;
}

export interface AuditStats {
  current_level: string;
  current_hour_stats: {
    total_submissions: number;
    violation_count: number;
    violation_rate: number;
    spam_count: number;
    manual_review_count: number;
    unique_ips: number;
  };
  level_configs: Record<string, any>;
}

export interface AuditHistory {
  from_level: string;
  to_level: string;
  trigger_reason: string;
  switched_by: 'auto' | 'manual';
  admin_id: string;
  switched_at: string;
}

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class TieredAuditService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * 发送API请求的通用方法
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      const response = await retryApiCall(async () => {
        const res = await fetch(url, defaultOptions);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        return res.json();
      });

      logApiCall(endpoint, options.body, response);
      
      if (!response.success) {
        throw new Error(response.message || 'API请求失败');
      }

      return response.data;
    } catch (error) {
      logApiCall(endpoint, options.body, null, error);
      throw handleApiError(error);
    }
  }

  /**
   * 获取当前审核级别
   */
  async getCurrentLevel(): Promise<AuditLevel> {
    return this.makeRequest<AuditLevel>(API_ENDPOINTS.AUDIT_LEVEL, {
      method: 'GET',
    });
  }

  /**
   * 切换审核级别
   */
  async switchLevel(level: 'level1' | 'level2' | 'level3', adminId?: string): Promise<{
    old_level: string;
    new_level: string;
    config: any;
  }> {
    return this.makeRequest(API_ENDPOINTS.AUDIT_LEVEL, {
      method: 'POST',
      body: JSON.stringify({
        level,
        admin_id: adminId || 'admin',
      }),
    });
  }

  /**
   * 测试内容审核
   */
  async testContent(content: string, contentType: 'story' | 'heart_voice' = 'story'): Promise<AuditResult> {
    return this.makeRequest<AuditResult>(API_ENDPOINTS.AUDIT_TEST, {
      method: 'POST',
      body: JSON.stringify({
        content,
        content_type: contentType,
      }),
    });
  }

  /**
   * 获取审核统计信息
   */
  async getStats(): Promise<AuditStats> {
    return this.makeRequest<AuditStats>(API_ENDPOINTS.AUDIT_STATS, {
      method: 'GET',
    });
  }

  /**
   * 获取审核级别切换历史
   */
  async getHistory(): Promise<AuditHistory[]> {
    try {
      return await this.makeRequest<AuditHistory[]>(API_ENDPOINTS.AUDIT_HISTORY, {
        method: 'GET',
      });
    } catch (error) {
      // 如果历史接口不可用，返回空数组
      console.warn('审核历史接口不可用:', error);
      return [];
    }
  }

  /**
   * 批量测试内容
   */
  async batchTestContent(contents: Array<{ content: string; contentType?: 'story' | 'heart_voice' }>): Promise<AuditResult[]> {
    const results: AuditResult[] = [];
    
    for (const item of contents) {
      try {
        const result = await this.testContent(item.content, item.contentType);
        results.push(result);
      } catch (error) {
        console.error('批量测试失败:', error);
        // 添加失败的结果
        results.push({
          passed: false,
          action: 'reject',
          requires_manual: true,
          confidence: 0,
          reason: 'test_failed',
          risk_score: 1.0,
          violations: [],
          audit_level: 'unknown'
        });
      }
    }
    
    return results;
  }

  /**
   * 检查服务可用性
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.getCurrentLevel();
      return true;
    } catch (error) {
      console.error('分级审核服务不可用:', error);
      return false;
    }
  }

  /**
   * 获取级别配置信息
   */
  getLevelInfo(level: 'level1' | 'level2' | 'level3') {
    const levelConfig = {
      level1: {
        name: '一级 (宽松)',
        color: '#52c41a',
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        description: '正常运营期，注重用户体验',
        icon: '🟢'
      },
      level2: {
        name: '二级 (标准)',
        color: '#faad14',
        bgColor: '#fffbe6',
        borderColor: '#ffe58f',
        description: '内容质量下降，平衡审核',
        icon: '🟡'
      },
      level3: {
        name: '三级 (严格)',
        color: '#ff4d4f',
        bgColor: '#fff2f0',
        borderColor: '#ffadd2',
        description: '恶意攻击期，严格把控',
        icon: '🔴'
      }
    };

    return levelConfig[level];
  }

  /**
   * 格式化违规信息
   */
  formatViolations(violations: AuditViolation[]): string {
    if (!violations.length) return '无违规';
    
    const categoryMap: Record<string, string> = {
      POL: '政治敏感',
      POR: '色情内容',
      VIO: '暴力内容',
      ADV: '广告推广',
      PRI: '隐私信息',
      DIS: '辱骂内容',
      OTH: '其他违规'
    };

    return violations
      .map(v => `${categoryMap[v.category] || v.category}: ${v.matched_text}`)
      .join(', ');
  }

  /**
   * 获取风险等级描述
   */
  getRiskLevelDescription(riskScore: number): { level: string; color: string; description: string } {
    if (riskScore >= 0.8) {
      return {
        level: '高风险',
        color: '#ff4d4f',
        description: '内容存在严重违规，建议拒绝'
      };
    } else if (riskScore >= 0.5) {
      return {
        level: '中风险',
        color: '#faad14',
        description: '内容可能存在问题，建议人工审核'
      };
    } else if (riskScore >= 0.2) {
      return {
        level: '低风险',
        color: '#1890ff',
        description: '内容基本安全，可以通过'
      };
    } else {
      return {
        level: '安全',
        color: '#52c41a',
        description: '内容完全安全'
      };
    }
  }

  /**
   * 获取动作描述
   */
  getActionDescription(action: string): { text: string; color: string } {
    const actionMap: Record<string, { text: string; color: string }> = {
      approve: { text: '自动通过', color: '#52c41a' },
      reject: { text: '自动拒绝', color: '#ff4d4f' },
      ai_review: { text: 'AI审核', color: '#1890ff' },
      manual_review: { text: '人工审核', color: '#faad14' }
    };

    return actionMap[action] || { text: action, color: '#666' };
  }
}

// 创建服务实例
export const tieredAuditService = new TieredAuditService();

// 导出服务类
export default TieredAuditService;
