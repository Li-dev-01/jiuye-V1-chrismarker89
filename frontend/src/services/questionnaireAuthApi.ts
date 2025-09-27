/**
 * 问卷认证API封装
 * 符合项目命名规范：在API封装层进行字段格式转换
 */

import { transformQuestionnaireAuthResponse, transformApiRequest } from '../utils/caseConverter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

export interface QuestionnaireAuthRequest {
  identityA?: string;  // A值：11位数字
  identityB?: string;  // B值：4位或6位数字
  displayName?: string;
  deviceInfo?: any;
}

export interface QuestionnaireUser {
  uuid: string;
  displayName: string;
  userType: 'anonymous' | 'semi_anonymous';
  permissions: string[];
  profile: any;
  status: string;
  createdAt: number;
  lastActiveAt: number;
}

export interface QuestionnaireSession {
  sessionId: string;
  sessionToken: string;
  userId: string;
  expiresAt: number;
  deviceFingerprint: string;
  isActive: boolean;
  createdAt: number;
}

export interface QuestionnaireAuthResponse {
  success: boolean;
  data: {
    user: QuestionnaireUser;
    session: QuestionnaireSession;
  };
  message: string;
}

/**
 * 问卷认证API服务
 */
export class QuestionnaireAuthApi {
  
  /**
   * 半匿名用户认证
   */
  static async authenticateSemiAnonymous(data: QuestionnaireAuthRequest): Promise<QuestionnaireAuthResponse> {
    console.log('🔐 发起半匿名认证请求:', data);

    // 问卷认证API期望camelCase格式，不需要转换
    // 直接发送原始数据
    const requestData = data;
    console.log('📤 发送的请求数据:', requestData);

    const response = await fetch(`${API_BASE_URL}/api/questionnaire-auth/semi-anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`认证失败: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    console.log('📥 API原始响应:', rawData);
    
    // 转换响应数据为camelCase（符合前端规范）
    const transformedData = transformQuestionnaireAuthResponse(rawData);
    console.log('✅ 转换后的响应:', transformedData);
    
    return transformedData;
  }

  /**
   * 匿名用户认证
   */
  static async authenticateAnonymous(data: QuestionnaireAuthRequest): Promise<QuestionnaireAuthResponse> {
    console.log('🔐 发起匿名认证请求:', data);

    // 问卷认证API期望camelCase格式，不需要转换
    const requestData = data;
    console.log('📤 发送的请求数据:', requestData);

    const response = await fetch(`${API_BASE_URL}/api/questionnaire-auth/anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`认证失败: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    console.log('📥 API原始响应:', rawData);
    
    // 转换响应数据为camelCase（符合前端规范）
    const transformedData = transformQuestionnaireAuthResponse(rawData);
    console.log('✅ 转换后的响应:', transformedData);
    
    return transformedData;
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<{ success: boolean; message: string }> {
    console.log('🚪 发起登出请求');
    
    const response = await fetch(`${API_BASE_URL}/api/questionnaire-auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`登出失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 登出响应:', data);
    
    return data;
  }

  /**
   * 验证会话
   */
  static async validateSession(sessionToken: string): Promise<{ valid: boolean; user?: QuestionnaireUser }> {
    console.log('🔍 验证会话:', sessionToken.substring(0, 20) + '...');
    
    const response = await fetch(`${API_BASE_URL}/api/questionnaire-auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const rawData = await response.json();
    console.log('📥 会话验证原始响应:', rawData);
    
    if (rawData.success && rawData.data?.user) {
      // 转换用户数据为camelCase
      const transformedData = transformQuestionnaireAuthResponse(rawData);
      return { 
        valid: true, 
        user: transformedData.data.user 
      };
    }
    
    return { valid: false };
  }
}

export default QuestionnaireAuthApi;
