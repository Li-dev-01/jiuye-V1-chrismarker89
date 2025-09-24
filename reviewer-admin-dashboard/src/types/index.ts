export interface User {
  id: string;
  username: string;
  role: 'reviewer' | 'admin' | 'super_admin';
  userType?: 'reviewer' | 'admin' | 'super_admin';
  permissions: string[];
  email?: string;
  name?: string;
  display_name?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface DashboardStats {
  pendingCount: number;
  completedToday: number;
  totalCompleted: number;
  averageTime: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  action: string;
  time: string;
  type: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
}

export interface ReviewItem {
  id: string;
  title: string;
  type: string;
  author: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  content: string;
  authorId?: string;
  category?: string;
}

export interface ReviewAction {
  action: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}

export interface PendingReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewHistoryItem {
  id: string;
  title: string;
  action: 'approve' | 'reject';
  reason: string;
  reviewedAt: string;
  author: string;
}

// 管理员相关类型
export interface AdminDashboardStats {
  totalUsers: number;
  totalQuestionnaires: number;
  totalStories: number;
  totalReviews: number;
  pendingReviews: number;
  todaySubmissions: number;
  activeUsers: number;
  systemHealth: 'good' | 'warning' | 'error';
}

export interface AdminUser {
  id: string;
  username: string;
  nickname?: string;
  email: string;
  role: 'user' | 'reviewer' | 'admin' | 'super_admin';
  status?: 'active' | 'inactive' | 'banned';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
  questionnairesCount?: number;
  storiesCount?: number;
}

export interface QuestionnaireStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  todayCount: number;
}

export interface StoryStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  todayCount: number;
}
