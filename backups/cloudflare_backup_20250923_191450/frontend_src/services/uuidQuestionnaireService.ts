/**
 * UUID系统的问卷服务适配器
 * 将问卷提交与UUID用户系统集成
 */

import type { QuestionnaireFormData } from '../types/questionnaire';
import type { ContentType, ContentStatus } from '../types/uuid-system';
import { uuidUserService } from './uuidUserService';
import { uuidApiService } from './uuidApi';
import { apiClient } from './api';

// 问卷响应类型
interface QuestionnaireResponse {
  id: string;
  userUuid?: string;
  personalInfo: any;
  educationInfo: any;
  employmentInfo: any;
  jobSearchInfo: any;
  employmentStatus: any;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

// API响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

class UUIDQuestionnaireService {
  /**
   * 提交问卷（支持UUID用户系统）
   */
  async submitQuestionnaire(data: QuestionnaireFormData): Promise<QuestionnaireResponse> {
    try {
      const currentUser = uuidUserService.getCurrentUser();
      const currentSession = uuidUserService.getCurrentSession();

      // 准备提交数据
      const submissionData = {
        personalInfo: data.personalInfo,
        educationInfo: data.educationInfo,
        employmentInfo: data.employmentInfo,
        jobSearchInfo: data.jobSearchInfo,
        employmentStatus: data.employmentStatus,
        sessionToken: currentSession?.sessionToken || null,
        deviceInfo: this.getDeviceInfo()
      };

      // 调用UUID系统的问卷提交API
      const response = await apiClient.post<ApiResponse<QuestionnaireResponse>>(
        '/uuid/questionnaire',
        submissionData
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '问卷提交失败');
      }

      const questionnaire = response.data.data;

      return questionnaire;

    } catch (error) {
      console.error('问卷提交失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的问卷列表
   */
  async getUserQuestionnaires(
    userUuid?: string,
    filters?: {
      status?: ContentStatus;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<QuestionnaireResponse[]> {
    try {
      const currentUser = uuidUserService.getCurrentUser();
      const targetUuid = userUuid || currentUser?.uuid;

      if (!targetUuid) {
        throw new Error('用户未登录');
      }

      // 检查权限（简化版本）
      if (userUuid && userUuid !== currentUser?.uuid && !uuidUserService.hasPermission('view_all_content' as any)) {
        throw new Error('无权访问该用户的问卷');
      }

      // 调用UUID系统的问卷列表API
      const response = await apiClient.get<ApiResponse<QuestionnaireResponse[]>>(
        `/uuid/questionnaire/user/${targetUuid}`,
        {
          params: filters
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '获取问卷列表失败');
      }

      return response.data.data;

    } catch (error) {
      console.error('获取用户问卷失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个问卷详情
   */
  async getQuestionnaire(questionnaireId: string): Promise<QuestionnaireResponse> {
    try {
      const response = await apiClient.get<ApiResponse<QuestionnaireResponse>>(
        `/uuid/questionnaire/${questionnaireId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '获取问卷详情失败');
      }

      return response.data.data;

    } catch (error) {
      console.error('获取问卷详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新问卷状态（审核员功能）
   */
  async updateQuestionnaireStatus(
    questionnaireId: string,
    status: 'approved' | 'rejected',
    comment?: string
  ): Promise<void> {
    try {
      const currentUser = uuidUserService.getCurrentUser();

      if (!currentUser) {
        throw new Error('用户未登录');
      }

      // 检查审核权限
      if (!uuidUserService.hasPermission('review_content' as any)) {
        throw new Error('无审核权限');
      }

      const response = await apiClient.put<ApiResponse<void>>(
        `/uuid/questionnaire/${questionnaireId}/status`,
        {
          status,
          comment,
          reviewerUuid: currentUser.uuid
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '更新问卷状态失败');
      }

      // 更新本地内容映射状态
      try {
        const userContent = await uuidUserService.getUserContent();
        const mapping = userContent.find(
          m => m.contentType === 'questionnaire' && m.contentId === questionnaireId
        );

        if (mapping) {
          await uuidApiService.updateContentStatus(
            mapping.id,
            status === 'approved' ? 'approved' : 'rejected'
          );
        }
      } catch (error) {
        console.warn('更新内容映射状态失败:', error);
      }

    } catch (error) {
      console.error('更新问卷状态失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户的问卷
   */
  async deleteQuestionnaire(questionnaireId: string): Promise<void> {
    try {
      const currentUser = uuidUserService.getCurrentUser();

      if (!currentUser) {
        throw new Error('用户未登录');
      }

      // 检查权限
      if (currentUser.userType === 'semi_anonymous') {
        // 半匿名用户可以删除自己的内容
        const userContent = await uuidUserService.getUserContent();
        const hasAccess = userContent.some(
          mapping => mapping.contentType === 'questionnaire' && mapping.contentId === questionnaireId
        );

        if (!hasAccess) {
          throw new Error('无权删除该问卷');
        }
      } else if (!uuidUserService.hasPermission('manage_users' as any)) {
        throw new Error('无权删除问卷');
      }

      const response = await apiClient.delete<ApiResponse<void>>(
        `/uuid/questionnaire/${questionnaireId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '删除问卷失败');
      }

      // 删除内容映射
      try {
        const userContent = await uuidUserService.getUserContent();
        const mapping = userContent.find(
          m => m.contentType === 'questionnaire' && m.contentId === questionnaireId
        );

        if (mapping) {
          await uuidApiService.unlinkUserContent(mapping.id);
        }
      } catch (error) {
        console.warn('删除内容映射失败:', error);
      }

    } catch (error) {
      console.error('删除问卷失败:', error);
      throw error;
    }
  }

  /**
   * 获取问卷统计信息
   */
  async getQuestionnaireStatistics(
    dateRange?: { start: string; end: string }
  ): Promise<{
    total: number;
    byStatus: Record<ContentStatus, number>;
    byUserType: Record<string, number>;
    dailySubmissions: Array<{ date: string; count: number }>;
  }> {
    try {
      const currentUser = uuidUserService.getCurrentUser();

      if (!currentUser || !uuidUserService.hasPermission('view_all_stats' as any)) {
        throw new Error('无权查看统计信息');
      }

      const response = await apiClient.get<ApiResponse<any>>(
        '/uuid/questionnaire/statistics',
        {
          params: dateRange
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '获取统计信息失败');
      }

      return response.data.data;

    } catch (error) {
      console.error('获取问卷统计失败:', error);
      throw error;
    }
  }

  /**
   * 批量审核问卷
   */
  async batchReviewQuestionnaires(
    operations: Array<{
      questionnaireId: string;
      status: 'approved' | 'rejected';
      comment?: string;
    }>
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    try {
      const currentUser = uuidUserService.getCurrentUser();

      if (!currentUser || !uuidUserService.hasPermission('review_content' as any)) {
        throw new Error('无审核权限');
      }

      const response = await apiClient.post<ApiResponse<any>>(
        '/uuid/questionnaire/batch-review',
        {
          operations,
          reviewerUuid: currentUser.uuid
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '批量审核失败');
      }

      return response.data.data;

    } catch (error) {
      console.error('批量审核问卷失败:', error);
      throw error;
    }
  }

  /**
   * 导出问卷数据
   */
  async exportQuestionnaires(
    filters?: {
      status?: ContentStatus;
      userType?: string;
      dateRange?: { start: string; end: string };
    },
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const currentUser = uuidUserService.getCurrentUser();

      if (!currentUser || !uuidUserService.hasPermission('view_all_content' as any)) {
        throw new Error('无权导出数据');
      }

      const response = await apiClient.post<ApiResponse<any>>(
        '/uuid/questionnaire/export',
        {
          filters,
          format
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || '导出数据失败');
      }

      return response.data.data;

    } catch (error) {
      console.error('导出问卷数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取设备信息
   */
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timestamp: new Date().toISOString()
    };
  }
}

// 导出单例实例
export const uuidQuestionnaireService = new UUIDQuestionnaireService();
export default uuidQuestionnaireService;
