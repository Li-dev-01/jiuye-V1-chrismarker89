/**
 * 管理员数据状态管理
 * 使用Zustand管理管理员相关的数据状态
 */

import { create } from 'zustand';
import { ManagementAdminService } from '../services/ManagementAdminService';
import type { DashboardStats, AdminQuestionnaire, PaginatedResponse } from '../services/ManagementAdminService';

// 管理员状态接口
interface AdminState {
  // 仪表板数据
  dashboardStats: DashboardStats | null;
  dashboardLoading: boolean;
  dashboardError: string | null;

  // 问卷数据
  questionnaires: AdminQuestionnaire[];
  questionnairesPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  questionnairesLoading: boolean;
  questionnairesError: string | null;
  questionnairesFilters: {
    status?: string;
  };

  // 用户数据
  users: any[];
  usersPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  usersLoading: boolean;
  usersError: string | null;

  // 审核记录数据
  auditRecords: any[];
  auditRecordsPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  auditRecordsLoading: boolean;
  auditRecordsError: string | null;
}

// 管理员操作接口
interface AdminActions {
  // 仪表板操作
  fetchDashboardStats: () => Promise<void>;
  clearDashboardError: () => void;

  // 问卷操作
  fetchQuestionnaires: (params?: { page?: number; pageSize?: number; status?: string }) => Promise<void>;
  updateQuestionnaireStatus: (id: number, status: 'approved' | 'rejected', comment?: string) => Promise<void>;
  batchUpdateQuestionnaireStatus: (ids: number[], status: 'approved' | 'rejected', comment?: string) => Promise<void>;
  deleteQuestionnaire: (id: number) => Promise<void>;
  setQuestionnairesFilters: (filters: Partial<AdminState['questionnairesFilters']>) => void;
  clearQuestionnairesError: () => void;

  // 用户操作
  fetchUsers: (params?: { page?: number; pageSize?: number; userType?: string; status?: string }) => Promise<void>;
  clearUsersError: () => void;

  // 审核记录操作
  fetchAuditRecords: (params?: { page?: number; pageSize?: number; contentType?: string; auditResult?: string }) => Promise<void>;
  clearAuditRecordsError: () => void;

  // 通用操作
  clearAllErrors: () => void;
}

type AdminStore = AdminState & AdminActions;

export const useAdminStore = create<AdminStore>((set, get) => ({
  // 初始状态
  dashboardStats: null,
  dashboardLoading: false,
  dashboardError: null,

  questionnaires: [],
  questionnairesPagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  questionnairesLoading: false,
  questionnairesError: null,
  questionnairesFilters: {},

  users: [],
  usersPagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  usersLoading: false,
  usersError: null,

  auditRecords: [],
  auditRecordsPagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  auditRecordsLoading: false,
  auditRecordsError: null,

  // 仪表板操作
  fetchDashboardStats: async () => {
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const stats = await ManagementAdminService.getDashboardStats();
      set({ dashboardStats: stats, dashboardLoading: false });
    } catch (error) {
      set({ 
        dashboardError: error instanceof Error ? error.message : '获取仪表板数据失败',
        dashboardLoading: false 
      });
    }
  },

  clearDashboardError: () => set({ dashboardError: null }),

  // 问卷操作
  fetchQuestionnaires: async (params = {}) => {
    set({ questionnairesLoading: true, questionnairesError: null });
    try {
      const { questionnairesFilters, questionnairesPagination } = get();
      const requestParams = {
        page: questionnairesPagination.page,
        pageSize: questionnairesPagination.pageSize,
        ...questionnairesFilters,
        ...params
      };

      const response = await ManagementAdminService.getQuestionnaires(requestParams);
      set({ 
        questionnaires: response.items,
        questionnairesPagination: response.pagination,
        questionnairesLoading: false 
      });
    } catch (error) {
      set({ 
        questionnairesError: error instanceof Error ? error.message : '获取问卷列表失败',
        questionnairesLoading: false 
      });
    }
  },

  updateQuestionnaireStatus: async (id: number, status: 'approved' | 'rejected', comment?: string) => {
    try {
      await ManagementAdminService.updateQuestionnaireStatus(id, status, comment);
      // 更新本地状态
      const { questionnaires } = get();
      const updatedQuestionnaires = questionnaires.map(q => 
        q.id === id ? { ...q, status } : q
      );
      set({ questionnaires: updatedQuestionnaires });
      
      // 重新获取仪表板统计
      get().fetchDashboardStats();
    } catch (error) {
      set({ 
        questionnairesError: error instanceof Error ? error.message : '更新问卷状态失败'
      });
      throw error;
    }
  },

  batchUpdateQuestionnaireStatus: async (ids: number[], status: 'approved' | 'rejected', comment?: string) => {
    try {
      await ManagementAdminService.batchUpdateQuestionnaireStatus(ids, status, comment);
      // 重新获取数据
      await get().fetchQuestionnaires();
      await get().fetchDashboardStats();
    } catch (error) {
      set({ 
        questionnairesError: error instanceof Error ? error.message : '批量更新问卷状态失败'
      });
      throw error;
    }
  },

  deleteQuestionnaire: async (id: number) => {
    try {
      await ManagementAdminService.deleteQuestionnaire(id);
      // 更新本地状态
      const { questionnaires } = get();
      const updatedQuestionnaires = questionnaires.filter(q => q.id !== id);
      set({ questionnaires: updatedQuestionnaires });
      
      // 重新获取仪表板统计
      get().fetchDashboardStats();
    } catch (error) {
      set({ 
        questionnairesError: error instanceof Error ? error.message : '删除问卷失败'
      });
      throw error;
    }
  },

  setQuestionnairesFilters: (filters) => {
    set({ 
      questionnairesFilters: { ...get().questionnairesFilters, ...filters },
      questionnairesPagination: { ...get().questionnairesPagination, page: 1 }
    });
  },

  clearQuestionnairesError: () => set({ questionnairesError: null }),

  // 用户操作
  fetchUsers: async (params = {}) => {
    set({ usersLoading: true, usersError: null });
    try {
      const { usersPagination } = get();

      // 正确地传递参数给 ManagementAdminService.getUsers
      const page = params.page || usersPagination.page;
      const pageSize = params.pageSize || usersPagination.pageSize;
      const filters = {
        userType: params.userType,
        status: params.status,
        search: params.search
      };

      const response = await ManagementAdminService.getUsers(page, pageSize, filters);

      // 安全地处理响应数据
      if (response && typeof response === 'object') {
        const items = response.items || [];
        const pagination = response.pagination || {
          page: page,
          pageSize: pageSize,
          total: 0
        };

        set({
          users: items,
          usersPagination: pagination,
          usersLoading: false
        });
      } else {
        set({
          users: [],
          usersPagination: { page: 1, pageSize: 10, total: 0 },
          usersLoading: false
        });
      }
    } catch (error) {
      console.error('fetchUsers error:', error);
      set({
        users: [],
        usersError: error instanceof Error ? error.message : '获取用户列表失败',
        usersLoading: false
      });
    }
  },

  clearUsersError: () => set({ usersError: null }),

  // 审核记录操作
  fetchAuditRecords: async (params = {}) => {
    set({ auditRecordsLoading: true, auditRecordsError: null });
    try {
      const { auditRecordsPagination } = get();
      const requestParams = {
        page: auditRecordsPagination.page,
        pageSize: auditRecordsPagination.pageSize,
        ...params
      };

      const response = await ManagementAdminService.getAuditRecords(requestParams);
      set({ 
        auditRecords: response.items,
        auditRecordsPagination: response.pagination,
        auditRecordsLoading: false 
      });
    } catch (error) {
      set({ 
        auditRecordsError: error instanceof Error ? error.message : '获取审核记录失败',
        auditRecordsLoading: false 
      });
    }
  },

  clearAuditRecordsError: () => set({ auditRecordsError: null }),

  // 通用操作
  clearAllErrors: () => set({ 
    dashboardError: null,
    questionnairesError: null,
    usersError: null,
    auditRecordsError: null
  }),
}));

export default useAdminStore;
