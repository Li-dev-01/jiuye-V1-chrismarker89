# 数据库Schema报告

**数据库**: college-employment-survey
**环境**: production
**提取时间**: 2025-09-21T10:49:12.318Z
**表数量**: 35
**总记录数**: NaN

## 表结构详情

### admin_responses

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | - | 是 |
| user_id | TEXT | 是 | - | 否 |
| original_response_id | TEXT | 是 | - | 否 |
| submission_ip | TEXT | 否 | - | 否 |
| user_agent | TEXT | 否 | - | 否 |
| submission_duration | INTEGER | 否 | - | 否 |
| completion_rate | REAL | 否 | 1.0 | 否 |
| data_consistency_score | REAL | 否 | 1.0 | 否 |
| logical_consistency_score | REAL | 否 | 1.0 | 否 |
| completeness_score | REAL | 否 | 1.0 | 否 |
| review_status | TEXT | 否 | 'pending' | 否 |
| reviewer_id | TEXT | 否 | - | 否 |
| review_notes | TEXT | 否 | - | 否 |
| reviewed_at | TEXT | 否 | - | 否 |
| is_suspicious | INTEGER | 否 | 0 | 否 |
| quality_flags | TEXT | 否 | - | 否 |
| risk_score | INTEGER | 否 | 0 | 否 |
| fraud_indicators | TEXT | 否 | - | 否 |
| page_view_count | INTEGER | 否 | 0 | 否 |
| time_on_page | INTEGER | 否 | 0 | 否 |
| interaction_count | INTEGER | 否 | 0 | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |
| undefined | undefined | undefined | undefined | undefined |
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### aggregated_stats

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| dimension | TEXT | 是 | - | 否 |
| dimension_value | TEXT | 是 | - | 否 |
| count | INTEGER | 否 | 0 | 否 |
| percentage | REAL | 否 | 0.0 | 否 |
| rank_position | INTEGER | 否 | 0 | 否 |
| percentile | REAL | 否 | 0.0 | 否 |
| cross_dimension | TEXT | 否 | - | 否 |
| cross_dimension_value | TEXT | 否 | - | 否 |
| cross_count | INTEGER | 否 | 0 | 否 |
| cross_percentage | REAL | 否 | 0.0 | 否 |
| trend_direction | TEXT | 否 | - | 否 |
| trend_percentage | REAL | 否 | 0.0 | 否 |
| trend_significance | REAL | 否 | 0.0 | 否 |
| period_type | TEXT | 是 | - | 否 |
| period_date | TEXT | 是 | - | 否 |
| period_start | TEXT | 是 | - | 否 |
| period_end | TEXT | 是 | - | 否 |
| sample_size | INTEGER | 否 | 0 | 否 |
| confidence_interval | REAL | 否 | 0.0 | 否 |
| statistical_significance | REAL | 否 | 0.0 | 否 |
| calculation_method | TEXT | 否 | 'standard' | 否 |
| last_calculated | TEXT | 是 | datetime('now') | 否 |
| is_active | INTEGER | 否 | 1 | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### analytics_cache

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | lower(hex(randomblob(16))) | 是 |
| cache_key | TEXT | 是 | - | 否 |
| cache_data | TEXT | 是 | - | 否 |
| expires_at | TEXT | 是 | - | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### analytics_responses

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | - | 是 |
| user_id | TEXT | 是 | - | 否 |
| submitted_at | TEXT | 是 | - | 否 |
| age_range | TEXT | 否 | - | 否 |
| education_level | TEXT | 否 | - | 否 |
| employment_status | TEXT | 否 | - | 否 |
| salary_range | TEXT | 否 | - | 否 |
| work_location | TEXT | 否 | - | 否 |
| industry | TEXT | 否 | - | 否 |
| gender | TEXT | 否 | - | 否 |
| job_search_channels | TEXT | 否 | - | 否 |
| difficulties | TEXT | 否 | - | 否 |
| skills | TEXT | 否 | - | 否 |
| policy_suggestions | TEXT | 否 | - | 否 |
| salary_expectation | INTEGER | 否 | - | 否 |
| work_experience_months | INTEGER | 否 | - | 否 |
| job_search_duration_months | INTEGER | 否 | - | 否 |
| data_quality_score | REAL | 否 | 1.0 | 否 |
| is_complete | INTEGER | 否 | 1 | 否 |
| processing_version | TEXT | 否 | 'v1.0' | 否 |
| is_test_data | INTEGER | 否 | 0 | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### auth_logs

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| user_uuid | TEXT | 否 | - | 否 |
| user_type | TEXT | 否 | - | 否 |
| action | TEXT | 是 | - | 否 |
| ip_address | TEXT | 否 | - | 否 |
| user_agent | TEXT | 否 | - | 否 |
| device_fingerprint | TEXT | 否 | - | 否 |
| success | INTEGER | 是 | - | 否 |
| error_message | TEXT | 否 | - | 否 |
| metadata | TEXT | 否 | - | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### d1_migrations

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| name | TEXT | 否 | - | 否 |
| applied_at | TIMESTAMP | 是 | CURRENT_TIMESTAMP | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |

### dashboard_cache

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| cache_key | TEXT | 是 | - | 否 |
| dashboard_type | TEXT | 是 | - | 否 |
| widget_data | TEXT | 是 | - | 否 |
| summary_stats | TEXT | 否 | - | 否 |
| chart_configs | TEXT | 否 | - | 否 |
| cache_size | INTEGER | 否 | 0 | 否 |
| compression_ratio | REAL | 否 | 1.0 | 否 |
| generation_time_ms | INTEGER | 否 | 0 | 否 |
| expires_at | TEXT | 是 | - | 否 |
| refresh_interval | INTEGER | 否 | 600 | 否 |
| last_accessed | TEXT | 否 | - | 否 |
| access_count | INTEGER | 否 | 0 | 否 |
| source_tables | TEXT | 否 | - | 否 |
| source_version | TEXT | 否 | 'v1.0' | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### enhanced_visualization_cache

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| cache_key | TEXT | 是 | - | 否 |
| visualization_type | TEXT | 是 | - | 否 |
| page_context | TEXT | 是 | - | 否 |
| chart_data | TEXT | 是 | - | 否 |
| chart_config | TEXT | 否 | - | 否 |
| metadata | TEXT | 否 | - | 否 |
| data_points | INTEGER | 否 | 0 | 否 |
| render_complexity | TEXT | 否 | 'low' | 否 |
| estimated_render_time | INTEGER | 否 | 0 | 否 |
| cache_strategy | TEXT | 否 | 'time_based' | 否 |
| invalidation_triggers | TEXT | 否 | - | 否 |
| expires_at | TEXT | 是 | - | 否 |
| auto_refresh | INTEGER | 否 | 1 | 否 |
| refresh_priority | INTEGER | 否 | 5 | 否 |
| hit_count | INTEGER | 否 | 0 | 否 |
| miss_count | INTEGER | 否 | 0 | 否 |
| last_hit | TEXT | 否 | - | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### export_responses

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | - | 是 |
| response_id | TEXT | 是 | - | 否 |
| csv_data | TEXT | 否 | - | 否 |
| json_data | TEXT | 否 | - | 否 |
| excel_data | TEXT | 否 | - | 否 |
| export_version | TEXT | 否 | 'v1.0' | 否 |
| field_mapping | TEXT | 否 | - | 否 |
| anonymization_level | TEXT | 否 | 'partial' | 否 |
| is_processed | INTEGER | 否 | 0 | 否 |
| processing_errors | TEXT | 否 | - | 否 |
| last_exported_at | TEXT | 否 | - | 否 |
| export_count | INTEGER | 否 | 0 | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |

### heart_voices_fts

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| content |  | 否 | - | 否 |
| category |  | 否 | - | 否 |
| tags |  | 否 | - | 否 |
| content_id |  | 否 | - | 否 |

### heart_voices_fts_config

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| k |  | 是 | - | 是 |
| v |  | 否 | - | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |

### heart_voices_fts_content

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| c0 |  | 否 | - | 否 |
| c1 |  | 否 | - | 否 |
| c2 |  | 否 | - | 否 |
| c3 |  | 否 | - | 否 |

### heart_voices_fts_data

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| block | BLOB | 否 | - | 否 |

### heart_voices_fts_docsize

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| sz | BLOB | 否 | - | 否 |

### heart_voices_fts_idx

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| segid |  | 是 | - | 是 |
| term |  | 是 | - | 否 |
| pgno |  | 否 | - | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |

### performance_alert_history

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| alert_id | INTEGER | 是 | - | 否 |
| triggered_at | TEXT | 是 | - | 否 |
| metric_value | REAL | 是 | - | 否 |
| threshold_value | REAL | 是 | - | 否 |
| message | TEXT | 否 | - | 否 |
| resolved_at | TEXT | 否 | - | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### performance_alerts

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| alert_name | TEXT | 是 | - | 否 |
| metric_type | TEXT | 是 | - | 否 |
| threshold_value | REAL | 是 | - | 否 |
| comparison_operator | TEXT | 是 | - | 否 |
| time_window_minutes | INTEGER | 是 | 5 | 否 |
| is_enabled | INTEGER | 是 | 1 | 否 |
| notification_channels | TEXT | 否 | - | 否 |
| created_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |
| updated_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |

### performance_baselines

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| endpoint | TEXT | 是 | - | 否 |
| baseline_response_time | REAL | 是 | - | 否 |
| baseline_cache_hit_rate | REAL | 是 | - | 否 |
| baseline_error_rate | REAL | 是 | - | 否 |
| measurement_period | TEXT | 是 | - | 否 |
| created_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |
| is_active | INTEGER | 是 | 1 | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### performance_metrics

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| timestamp | TEXT | 是 | - | 否 |
| endpoint | TEXT | 是 | - | 否 |
| response_time | REAL | 是 | - | 否 |
| cache_hit | INTEGER | 是 | 0 | 否 |
| data_source | TEXT | 是 | - | 否 |
| query_count | INTEGER | 是 | 0 | 否 |
| error_count | INTEGER | 是 | 0 | 否 |
| user_agent | TEXT | 否 | - | 否 |
| client_ip | TEXT | 否 | - | 否 |
| created_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### questionnaire_heart_voices

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| questionnaire_response_id | INTEGER | 否 | - | 否 |
| questionnaire_id | TEXT | 是 | - | 否 |
| user_id | TEXT | 是 | - | 否 |
| content | TEXT | 是 | - | 否 |
| word_count | INTEGER | 否 | 0 | 否 |
| category | TEXT | 否 | 'employment-feedback' | 否 |
| tags | TEXT | 否 | - | 否 |
| emotion_score | REAL | 否 | - | 否 |
| emotion_category | TEXT | 否 | - | 否 |
| is_public | BOOLEAN | 否 | true | 否 |
| is_approved | BOOLEAN | 否 | true | 否 |
| status | TEXT | 否 | 'active' | 否 |
| submission_type | TEXT | 否 | 'anonymous' | 否 |
| anonymous_nickname | TEXT | 否 | - | 否 |
| ip_address | TEXT | 否 | - | 否 |
| user_agent | TEXT | 否 | - | 否 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 否 |
| updated_at | DATETIME | 否 | CURRENT_TIMESTAMP | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### questionnaire_responses

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | lower(hex(randomblob(16))) | 是 |
| user_id | TEXT | 否 | - | 否 |
| personal_info | TEXT | 是 | - | 否 |
| education_info | TEXT | 是 | - | 否 |
| employment_info | TEXT | 是 | - | 否 |
| job_search_info | TEXT | 是 | - | 否 |
| employment_status | TEXT | 是 | - | 否 |
| status | TEXT | 是 | 'pending' | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### realtime_stats

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| stat_key | TEXT | 是 | - | 否 |
| stat_category | TEXT | 是 | - | 否 |
| count_value | INTEGER | 否 | 0 | 否 |
| percentage_value | REAL | 否 | 0.0 | 否 |
| average_value | REAL | 否 | 0.0 | 否 |
| median_value | REAL | 否 | 0.0 | 否 |
| total_sample_size | INTEGER | 否 | 0 | 否 |
| time_window | TEXT | 是 | - | 否 |
| window_start | TEXT | 是 | - | 否 |
| window_end | TEXT | 是 | - | 否 |
| data_source | TEXT | 是 | - | 否 |
| confidence_level | REAL | 否 | 1.0 | 否 |
| margin_of_error | REAL | 否 | 0.0 | 否 |
| last_updated | TEXT | 是 | datetime('now') | 否 |
| update_frequency | INTEGER | 否 | 300 | 否 |
| is_active | INTEGER | 否 | 1 | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### reviews

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | lower(hex(randomblob(16))) | 是 |
| questionnaire_id | TEXT | 是 | - | 否 |
| reviewer_id | TEXT | 是 | - | 否 |
| status | TEXT | 是 | - | 否 |
| comment | TEXT | 否 | - | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### social_insights_data

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | - | 是 |
| response_id | TEXT | 是 | - | 否 |
| user_id | TEXT | 是 | - | 否 |
| employment_trend_score | REAL | 否 | 0.0 | 否 |
| salary_satisfaction_score | REAL | 否 | 0.0 | 否 |
| career_stability_score | REAL | 否 | 0.0 | 否 |
| market_competitiveness_score | REAL | 否 | 0.0 | 否 |
| skill_match_score | REAL | 否 | 0.0 | 否 |
| sentiment_score | REAL | 否 | 0.0 | 否 |
| key_concerns | TEXT | 否 | - | 否 |
| career_goals | TEXT | 否 | - | 否 |
| skill_gaps | TEXT | 否 | - | 否 |
| user_persona | TEXT | 否 | - | 否 |
| career_stage | TEXT | 否 | - | 否 |
| risk_category | TEXT | 否 | - | 否 |
| market_segment | TEXT | 否 | - | 否 |
| employment_probability | REAL | 否 | 0.0 | 否 |
| salary_prediction_range | TEXT | 否 | - | 否 |
| career_success_indicators | TEXT | 否 | - | 否 |
| social_mobility_index | REAL | 否 | 0.0 | 否 |
| economic_pressure_score | REAL | 否 | 0.0 | 否 |
| policy_impact_score | REAL | 否 | 0.0 | 否 |
| analysis_date | TEXT | 是 | - | 否 |
| trend_period | TEXT | 否 | 'current' | 否 |
| cohort_identifier | TEXT | 否 | - | 否 |
| confidence_level | REAL | 否 | 0.0 | 否 |
| analysis_version | TEXT | 否 | 'v1.0' | 否 |
| is_test_data | INTEGER | 否 | 0 | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### system_logs

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | lower(hex(randomblob(16))) | 是 |
| user_id | TEXT | 否 | - | 否 |
| action | TEXT | 是 | - | 否 |
| resource_type | TEXT | 否 | - | 否 |
| resource_id | TEXT | 否 | - | 否 |
| details | TEXT | 否 | - | 否 |
| ip_address | TEXT | 否 | - | 否 |
| user_agent | TEXT | 否 | - | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### universal_questionnaire_configs

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| questionnaire_id | TEXT | 是 | - | 否 |
| title | TEXT | 是 | - | 否 |
| description | TEXT | 否 | - | 否 |
| config_data | TEXT | 是 | - | 否 |
| status | TEXT | 否 | 'draft' | 否 |
| created_by | INTEGER | 否 | - | 否 |
| created_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |
| updated_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### universal_questionnaire_responses

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| questionnaire_id | TEXT | 是 | - | 否 |
| user_id | INTEGER | 否 | - | 否 |
| response_data | TEXT | 是 | - | 否 |
| submitted_at | TEXT | 是 | - | 否 |
| ip_address | TEXT | 否 | - | 否 |
| user_agent | TEXT | 否 | - | 否 |
| created_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |
| updated_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### universal_questionnaire_statistics

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| questionnaire_id | TEXT | 是 | - | 否 |
| question_id | TEXT | 是 | - | 否 |
| statistics_data | TEXT | 是 | - | 否 |
| last_updated | TEXT | 是 | - | 否 |
| created_at | TEXT | 否 | CURRENT_TIMESTAMP | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### universal_users

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| uuid | TEXT | 否 | - | 是 |
| user_type | TEXT | 是 | - | 否 |
| identity_hash | TEXT | 否 | - | 否 |
| username | TEXT | 否 | - | 否 |
| password_hash | TEXT | 否 | - | 否 |
| display_name | TEXT | 否 | - | 否 |
| role | TEXT | 否 | - | 否 |
| permissions | TEXT | 否 | - | 否 |
| profile | TEXT | 否 | - | 否 |
| metadata | TEXT | 否 | - | 否 |
| status | TEXT | 否 | 'active' | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |
| last_active_at | TEXT | 是 | datetime('now') | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### user_content_mappings

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| user_uuid | TEXT | 是 | - | 否 |
| content_type | TEXT | 是 | - | 否 |
| content_id | TEXT | 是 | - | 否 |
| status | TEXT | 否 | 'pending' | 否 |
| metadata | TEXT | 否 | - | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### user_questionnaire_heart_voice_mapping

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| user_id | TEXT | 是 | - | 否 |
| questionnaire_response_id | INTEGER | 是 | - | 否 |
| heart_voice_id | INTEGER | 是 | - | 否 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### user_sessions

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| session_id | TEXT | 否 | - | 是 |
| user_uuid | TEXT | 是 | - | 否 |
| session_token | TEXT | 是 | - | 否 |
| device_fingerprint | TEXT | 否 | - | 否 |
| ip_address | TEXT | 否 | - | 否 |
| user_agent | TEXT | 否 | - | 否 |
| device_info | TEXT | 否 | - | 否 |
| expires_at | TEXT | 是 | - | 否 |
| is_active | INTEGER | 否 | 1 | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**外键关系**:
| 本表字段 | 引用表 | 引用字段 | 删除规则 | 更新规则 |
|----------|--------|----------|----------|----------|
| undefined | undefined | undefined | undefined | undefined |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### user_statistics_cache

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | INTEGER | 否 | - | 是 |
| stat_date | DATE | 是 | - | 否 |
| user_type | TEXT | 是 | - | 否 |
| metric_name | TEXT | 是 | - | 否 |
| metric_value | INTEGER | 是 | 0 | 否 |
| metadata | TEXT | 否 | - | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

### users

**记录数**: NaN

**字段信息**:
| 字段名 | 类型 | 非空 | 默认值 | 主键 |
|--------|------|------|--------|------|
| id | TEXT | 否 | lower(hex(randomblob(16))) | 是 |
| username | TEXT | 是 | - | 否 |
| email | TEXT | 是 | - | 否 |
| password_hash | TEXT | 是 | - | 否 |
| role | TEXT | 是 | 'user' | 否 |
| created_at | TEXT | 是 | datetime('now') | 否 |
| updated_at | TEXT | 是 | datetime('now') | 否 |

**索引信息**:
| 索引名 | 唯一 | 来源 |
|--------|------|------|
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |
| undefined | 否 | undefined |

