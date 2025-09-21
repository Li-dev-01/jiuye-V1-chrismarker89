import { create } from 'zustand';
import type { QuestionnaireResponse, PaginatedResponse } from '../types';
import { QuestionnaireService } from '../services/questionnaire';

interface QuestionnaireState {
  questionnaires: QuestionnaireResponse[];
  currentQuestionnaire: QuestionnaireResponse | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
  isLoading: boolean;
  error: string | null;
}

interface QuestionnaireActions {
  fetchQuestionnaires: () => Promise<void>;
  fetchQuestionnaire: (id: string) => Promise<void>;
  submitQuestionnaire: (data: any) => Promise<void>;
  updateQuestionnaireStatus: (id: string, status: 'approved' | 'rejected', comment?: string) => Promise<void>;
  setFilters: (filters: Partial<QuestionnaireState['filters']>) => void;
  setPagination: (page: number, pageSize?: number) => void;
  clearError: () => void;
  clearCurrentQuestionnaire: () => void;
}

type QuestionnaireStore = QuestionnaireState & QuestionnaireActions;

export const useQuestionnaireStore = create<QuestionnaireStore>((set, get) => ({
  // 初始状态
  questionnaires: [],
  currentQuestionnaire: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  isLoading: false,
  error: null,

  // 获取问卷列表
  fetchQuestionnaires: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { pagination, filters } = get();
      const response = await QuestionnaireService.getQuestionnaires({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      });
      
      set({
        questionnaires: response.items,
        pagination: {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: response.totalPages,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || '获取问卷列表失败',
      });
    }
  },

  // 获取单个问卷
  fetchQuestionnaire: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const questionnaire = await QuestionnaireService.getQuestionnaire(id);
      set({
        currentQuestionnaire: questionnaire,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || '获取问卷详情失败',
      });
    }
  },

  // 提交问卷
  submitQuestionnaire: async (data: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const questionnaire = await QuestionnaireService.submitQuestionnaire(data);
      set({
        currentQuestionnaire: questionnaire,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || '提交问卷失败',
      });
      throw error;
    }
  },

  // 更新问卷状态
  updateQuestionnaireStatus: async (id: string, status: 'approved' | 'rejected', comment?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedQuestionnaire = await QuestionnaireService.updateQuestionnaireStatus(id, status, comment);
      
      // 更新列表中的问卷
      const { questionnaires } = get();
      const updatedQuestionnaires = questionnaires.map(q => 
        q.id === id ? updatedQuestionnaire : q
      );
      
      set({
        questionnaires: updatedQuestionnaires,
        currentQuestionnaire: updatedQuestionnaire,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || '更新问卷状态失败',
      });
      throw error;
    }
  },

  // 设置过滤条件
  setFilters: (filters: Partial<QuestionnaireState['filters']>) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // 重置到第一页
    }));
  },

  // 设置分页
  setPagination: (page: number, pageSize?: number) => {
    set(state => ({
      pagination: {
        ...state.pagination,
        page,
        ...(pageSize && { pageSize }),
      },
    }));
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },

  // 清除当前问卷
  clearCurrentQuestionnaire: () => {
    set({ currentQuestionnaire: null });
  },
}));
