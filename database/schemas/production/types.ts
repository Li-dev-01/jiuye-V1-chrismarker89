// 自动生成的数据库类型定义
// 生成时间: 2025-09-21T10:44:15.828Z

export interface AdminResponses {
  id: string;
  user_id: string;
  original_response_id: string;
  submission_ip?: string;
  user_agent?: string;
  submission_duration?: number;
  completion_rate?: number;
  data_consistency_score?: number;
  logical_consistency_score?: number;
  completeness_score?: number;
  review_status?: string;
  reviewer_id?: string;
  review_notes?: string;
  reviewed_at?: string;
  is_suspicious?: number;
  quality_flags?: string;
  risk_score?: number;
  fraud_indicators?: string;
  page_view_count?: number;
  time_on_page?: number;
  interaction_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AggregatedStats {
  id: number;
  dimension: string;
  dimension_value: string;
  count?: number;
  percentage?: number;
  rank_position?: number;
  percentile?: number;
  cross_dimension?: string;
  cross_dimension_value?: string;
  cross_count?: number;
  cross_percentage?: number;
  trend_direction?: string;
  trend_percentage?: number;
  trend_significance?: number;
  period_type: string;
  period_date: string;
  period_start: string;
  period_end: string;
  sample_size?: number;
  confidence_interval?: number;
  statistical_significance?: number;
  calculation_method?: string;
  last_calculated: string;
  is_active?: number;
}

export interface AnalyticsCache {
  id: string;
  cache_key: string;
  cache_data: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsResponses {
  id: string;
  user_id: string;
  submitted_at: string;
  age_range?: string;
  education_level?: string;
  employment_status?: string;
  salary_range?: string;
  work_location?: string;
  industry?: string;
  gender?: string;
  job_search_channels?: string;
  difficulties?: string;
  skills?: string;
  policy_suggestions?: string;
  salary_expectation?: number;
  work_experience_months?: number;
  job_search_duration_months?: number;
  data_quality_score?: number;
  is_complete?: number;
  processing_version?: string;
  is_test_data?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthLogs {
  id: number;
  user_uuid?: string;
  user_type?: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  success: number;
  error_message?: string;
  metadata?: string;
  created_at: string;
}

export interface D1Migrations {
  id: number;
  name?: string;
  applied_at: any;
}

export interface DashboardCache {
  id: number;
  cache_key: string;
  dashboard_type: string;
  widget_data: string;
  summary_stats?: string;
  chart_configs?: string;
  cache_size?: number;
  compression_ratio?: number;
  generation_time_ms?: number;
  expires_at: string;
  refresh_interval?: number;
  last_accessed?: string;
  access_count?: number;
  source_tables?: string;
  source_version?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedVisualizationCache {
  id: number;
  cache_key: string;
  visualization_type: string;
  page_context: string;
  chart_data: string;
  chart_config?: string;
  metadata?: string;
  data_points?: number;
  render_complexity?: string;
  estimated_render_time?: number;
  cache_strategy?: string;
  invalidation_triggers?: string;
  expires_at: string;
  auto_refresh?: number;
  refresh_priority?: number;
  hit_count?: number;
  miss_count?: number;
  last_hit?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportResponses {
  id: string;
  response_id: string;
  csv_data?: string;
  json_data?: string;
  excel_data?: string;
  export_version?: string;
  field_mapping?: string;
  anonymization_level?: string;
  is_processed?: number;
  processing_errors?: string;
  last_exported_at?: string;
  export_count?: number;
  created_at: string;
  updated_at: string;
}



export interface PerformanceAlertHistory {
  id: number;
  alert_id: number;
  triggered_at: string;
  metric_value: number;
  threshold_value: number;
  message?: string;
  resolved_at?: string;
}

export interface PerformanceAlerts {
  id: number;
  alert_name: string;
  metric_type: string;
  threshold_value: number;
  comparison_operator: string;
  time_window_minutes: number;
  is_enabled: number;
  notification_channels?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PerformanceBaselines {
  id: number;
  endpoint: string;
  baseline_response_time: number;
  baseline_cache_hit_rate: number;
  baseline_error_rate: number;
  measurement_period: string;
  created_at?: string;
  is_active: number;
}

export interface PerformanceMetrics {
  id: number;
  timestamp: string;
  endpoint: string;
  response_time: number;
  cache_hit: number;
  data_source: string;
  query_count: number;
  error_count: number;
  user_agent?: string;
  client_ip?: string;
  created_at?: string;
}



export interface QuestionnaireResponses {
  id: string;
  user_id?: string;
  personal_info: string;
  education_info: string;
  employment_info: string;
  job_search_info: string;
  employment_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RealtimeStats {
  id: number;
  stat_key: string;
  stat_category: string;
  count_value?: number;
  percentage_value?: number;
  average_value?: number;
  median_value?: number;
  total_sample_size?: number;
  time_window: string;
  window_start: string;
  window_end: string;
  data_source: string;
  confidence_level?: number;
  margin_of_error?: number;
  last_updated: string;
  update_frequency?: number;
  is_active?: number;
}

export interface Reviews {
  id: string;
  questionnaire_id: string;
  reviewer_id: string;
  status: string;
  comment?: string;
  created_at: string;
}

export interface SocialInsightsData {
  id: string;
  response_id: string;
  user_id: string;
  employment_trend_score?: number;
  salary_satisfaction_score?: number;
  career_stability_score?: number;
  market_competitiveness_score?: number;
  skill_match_score?: number;
  sentiment_score?: number;
  key_concerns?: string;
  career_goals?: string;
  skill_gaps?: string;
  user_persona?: string;
  career_stage?: string;
  risk_category?: string;
  market_segment?: string;
  employment_probability?: number;
  salary_prediction_range?: string;
  career_success_indicators?: string;
  social_mobility_index?: number;
  economic_pressure_score?: number;
  policy_impact_score?: number;
  analysis_date: string;
  trend_period?: string;
  cohort_identifier?: string;
  confidence_level?: number;
  analysis_version?: string;
  is_test_data?: number;
  created_at: string;
  updated_at: string;
}

export interface SystemLogs {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UniversalQuestionnaireConfigs {
  id: number;
  questionnaire_id: string;
  title: string;
  description?: string;
  config_data: string;
  status?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UniversalQuestionnaireResponses {
  id: number;
  questionnaire_id: string;
  user_id?: number;
  response_data: string;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UniversalQuestionnaireStatistics {
  id: number;
  questionnaire_id: string;
  question_id: string;
  statistics_data: string;
  last_updated: string;
  created_at?: string;
}

export interface UniversalUsers {
  uuid: string;
  user_type: string;
  identity_hash?: string;
  username?: string;
  password_hash?: string;
  display_name?: string;
  role?: string;
  permissions?: string;
  profile?: string;
  metadata?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface UserContentMappings {
  id: number;
  user_uuid: string;
  content_type: string;
  content_id: string;
  status?: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
}



export interface UserSessions {
  session_id: string;
  user_uuid: string;
  session_token: string;
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: string;
  expires_at: string;
  is_active?: number;
  created_at: string;
  updated_at: string;
}

export interface UserStatisticsCache {
  id: number;
  stat_date: any;
  user_type: string;
  metric_name: string;
  metric_value: number;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

export interface Users {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

