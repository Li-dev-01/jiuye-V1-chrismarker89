import ApiService from './api';
import type { QuestionnaireResponse, PaginatedResponse, PaginationParams } from '../types';
import type { QuestionnaireFormData } from '../types/questionnaire';

export class QuestionnaireService {
  // 提交问卷
  static async submitQuestionnaire(data: QuestionnaireFormData): Promise<any> {
    // 转换数据格式以匹配后端验证要求
    const transformedData = {
      personalInfo: {
        name: data.personalInfo?.name || '',
        gender: data.personalInfo?.gender || '',
        age: data.personalInfo?.age || 0,
        phone: data.personalInfo?.phone || '',
        email: data.personalInfo?.email || ''
      },
      educationInfo: {
        university: data.educationInfo?.university || data.educationInfo?.school || '未填写',
        major: data.educationInfo?.major || '',
        degree: data.educationInfo?.degree || '',
        graduationYear: data.educationInfo?.graduationYear || ''
      },
      employmentInfo: {
        preferredIndustry: data.employmentInfo?.preferredIndustry || ['其他'],
        preferredPosition: data.employmentInfo?.preferredPosition || '未填写',
        expectedSalary: data.employmentInfo?.expectedSalary || '面议',
        preferredLocation: data.employmentInfo?.preferredLocation || ['其他'],
        workExperience: data.employmentInfo?.workExperience || '无经验'
      },
      jobSearchInfo: {
        searchChannels: data.jobSearchInfo?.searchChannels || ['其他'],
        interviewCount: data.jobSearchInfo?.interviewCount || 0,
        offerCount: data.jobSearchInfo?.offerCount || 0,
        searchDuration: data.jobSearchInfo?.searchDuration || 0
      },
      employmentStatus: {
        currentStatus: data.employmentStatus?.currentStatus || 'unemployed',
        currentCompany: data.employmentStatus?.currentCompany || '',
        currentPosition: data.employmentStatus?.currentPosition || ''
      }
    };

    return ApiService.post<any>('/questionnaire', transformedData);
  }

  // 获取问卷列表
  static async getQuestionnaires(params: PaginationParams & {
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<QuestionnaireResponse>> {
    return ApiService.get<PaginatedResponse<QuestionnaireResponse>>('/questionnaire', { params });
  }

  // 获取单个问卷
  static async getQuestionnaire(id: string): Promise<QuestionnaireResponse> {
    return ApiService.get<QuestionnaireResponse>(`/questionnaire/${id}`);
  }

  // 更新问卷状态
  static async updateQuestionnaireStatus(id: string, status: 'approved' | 'rejected', comment?: string): Promise<QuestionnaireResponse> {
    return ApiService.put<QuestionnaireResponse>(`/questionnaire/${id}`, { status, comment });
  }

  // 删除问卷
  static async deleteQuestionnaire(id: string): Promise<void> {
    return ApiService.delete<void>(`/questionnaire/${id}`);
  }

  // 批量操作
  static async batchUpdateStatus(ids: string[], status: 'approved' | 'rejected', comment?: string): Promise<void> {
    return ApiService.post<void>('/questionnaire/batch-update', { ids, status, comment });
  }

  // 导出数据
  static async exportData(params: {
    format: 'csv' | 'excel';
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await ApiService.get<Blob>('/questionnaire/export', { 
      params,
      responseType: 'blob'
    });
    return response;
  }
}
