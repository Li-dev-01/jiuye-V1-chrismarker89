// 注意：Env接口已移动到 types/api.ts 中，避免重复定义

// 用户角色类型
export type UserRole = 'user' | 'reviewer' | 'admin' | 'super_admin';

// 用户类型
export interface User {
  id: string | number;
  username: string;
  email: string;
  role: UserRole;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

// 认证上下文
export interface AuthContext {
  user?: User;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

// 创建问卷请求
export interface CreateQuestionnaireRequest {
  title: string;
  description: string;
  questions: Omit<Question, 'id' | 'questionnaire_id'>[];
}

// 问卷类型
export interface Questionnaire {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  status: QuestionnaireStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// 问卷状态
export enum QuestionnaireStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed'
}

// 问题类型
export interface Question {
  id: number;
  questionnaire_id: number;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  required: boolean;
  order: number;
}

// 问题类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  RATING = 'rating'
}

// 问题选项
export interface QuestionOption {
  id: number;
  question_id: number;
  text: string;
  value: string;
  order: number;
}

// 问卷回答
export interface QuestionnaireResponse {
  id: number;
  questionnaire_id: number;
  user_id?: number;
  session_id?: string;
  answers: Answer[];
  submitted_at: string;
  ip_address?: string;
}

// 答案
export interface Answer {
  id: number;
  response_id: number;
  question_id: number;
  answer_text?: string;
  answer_number?: number;
  answer_date?: string;
  selected_options?: number[];
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// JWT载荷
export interface JWTPayload {
  userId: string | number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// 数据库服务接口
export interface DatabaseService {
  // 用户相关
  createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  
  // 问卷相关
  createQuestionnaire(questionnaire: Omit<Questionnaire, 'id' | 'created_at' | 'updated_at'>): Promise<Questionnaire>;
  getQuestionnaireById(id: number): Promise<Questionnaire | null>;
  getQuestionnaires(params: PaginationParams): Promise<PaginatedResponse<Questionnaire>>;
  updateQuestionnaire(id: number, updates: Partial<Questionnaire>): Promise<Questionnaire>;
  deleteQuestionnaire(id: number): Promise<boolean>;
  
  // 问题相关
  createQuestion(question: Omit<Question, 'id'>): Promise<Question>;
  getQuestionsByQuestionnaireId(questionnaireId: number): Promise<Question[]>;
  updateQuestion(id: number, updates: Partial<Question>): Promise<Question>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // 回答相关
  createResponse(response: Omit<QuestionnaireResponse, 'id' | 'submitted_at'>): Promise<QuestionnaireResponse>;
  getResponseById(id: number): Promise<QuestionnaireResponse | null>;
  getResponsesByQuestionnaireId(questionnaireId: number, params: PaginationParams): Promise<PaginatedResponse<QuestionnaireResponse>>;
  deleteResponse(id: number): Promise<boolean>;
}
