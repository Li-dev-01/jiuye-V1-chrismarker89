import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Table, Tag, Typography, Space, Collapse, Alert, Button, message, Statistic } from 'antd';
import type { TabsProps } from 'antd';
import {
  DatabaseOutlined,
  ApiOutlined,
  AppstoreOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// 数据表定义
const databaseTables = [
  {
    name: 'users',
    type: 'core',
    description: '基础用户表',
    fields: ['id', 'username', 'email', 'password_hash', 'role', 'created_at', 'updated_at'],
    status: 'active',
    issues: ['角色系统与universal_users重复']
  },
  {
    name: 'universal_users',
    type: 'core',
    description: '统一用户系统表',
    fields: ['uuid', 'user_type', 'identity_hash', 'display_name', 'role', 'permissions', 'profile', 'metadata', 'status'],
    status: 'active',
    issues: ['与users表功能重叠']
  },
  {
    name: 'questionnaire_responses',
    type: 'content',
    description: '问卷回答表',
    fields: ['id', 'user_id', 'personal_info', 'education_info', 'employment_info', 'job_search_info', 'employment_status', 'status'],
    status: 'active',
    issues: []
  },
  {
    name: 'questionnaire_submissions',
    type: 'content',
    description: '问卷提交表',
    fields: ['id', 'session_id', 'is_completed', 'completion_percentage', 'device_type', 'browser_type'],
    status: 'active',
    issues: ['与questionnaire_responses功能重叠']
  },
  {
    name: 'universal_questionnaire_responses',
    type: 'content',
    description: '通用问卷回答表',
    fields: ['id', 'questionnaire_id', 'user_id', 'response_data', 'submitted_at', 'ip_address', 'user_agent'],
    status: 'active',
    issues: ['与其他问卷表功能重叠']
  },
  {
    name: 'raw_heart_voices',
    type: 'content',
    description: '原始心声数据表',
    fields: ['id', 'data_uuid', 'user_id', 'content', 'category', 'emotion_score', 'tags', 'submitted_at'],
    status: 'active',
    issues: []
  },
  {
    name: 'valid_heart_voices',
    type: 'content',
    description: '有效心声数据表',
    fields: ['id', 'raw_id', 'data_uuid', 'user_id', 'content', 'category', 'emotion_score', 'tags', 'approved_at', 'audit_status', 'like_count', 'dislike_count', 'view_count'],
    status: 'active',
    issues: []
  },
  {
    name: 'raw_stories',
    type: 'content',
    description: '原始故事数据表',
    fields: ['id', 'data_uuid', 'user_id', 'title', 'content', 'category', 'tags', 'submitted_at'],
    status: 'active',
    issues: []
  },
  {
    name: 'valid_stories',
    type: 'content',
    description: '有效故事数据表',
    fields: ['id', 'raw_id', 'data_uuid', 'user_id', 'title', 'content', 'category', 'tags', 'approved_at', 'audit_status', 'like_count', 'dislike_count', 'view_count'],
    status: 'active',
    issues: []
  },
  {
    name: 'reviews',
    type: 'system',
    description: '审核记录表',
    fields: ['id', 'questionnaire_id', 'reviewer_id', 'status', 'comment', 'created_at'],
    status: 'active',
    issues: []
  },
  {
    name: 'user_sessions',
    type: 'system',
    description: '用户会话表',
    fields: ['session_id', 'user_uuid', 'session_token', 'device_fingerprint', 'ip_address', 'user_agent', 'device_info', 'expires_at', 'is_active'],
    status: 'active',
    issues: []
  },
  {
    name: 'auth_logs',
    type: 'system',
    description: '认证日志表',
    fields: ['id', 'user_uuid', 'user_type', 'action', 'ip_address', 'user_agent', 'device_fingerprint', 'success', 'error_message', 'metadata'],
    status: 'active',
    issues: []
  },
  {
    name: 'system_logs',
    type: 'system',
    description: '系统日志表',
    fields: ['id', 'user_id', 'action', 'resource_type', 'resource_id', 'details', 'ip_address', 'user_agent'],
    status: 'active',
    issues: []
  },
  {
    name: 'png_cards',
    type: 'feature',
    description: 'PNG卡片表',
    fields: ['card_id', 'content_type', 'content_id', 'user_id', 'card_data', 'download_count', 'created_at'],
    status: 'active',
    issues: []
  },
  {
    name: 'png_queue',
    type: 'feature',
    description: 'PNG生成队列表',
    fields: ['id', 'content_type', 'content_id', 'user_id', 'status', 'priority', 'created_at', 'processed_at'],
    status: 'active',
    issues: []
  },
  {
    name: 'analytics_cache',
    type: 'system',
    description: '分析数据缓存表',
    fields: ['id', 'cache_key', 'cache_data', 'expires_at', 'created_at', 'updated_at'],
    status: 'active',
    issues: []
  },
  {
    name: 'system_config',
    type: 'system',
    description: '系统配置表',
    fields: ['config_key', 'config_value', 'updated_at', 'updated_by'],
    status: 'active',
    issues: []
  },
  {
    name: 'admin_operation_logs',
    type: 'system',
    description: '管理员操作日志表',
    fields: ['id', 'operator', 'operation', 'target', 'details', 'ip_address', 'created_at', 'user_agent'],
    status: 'active',
    issues: []
  },
  {
    name: 'security_events',
    type: 'system',
    description: '安全事件表',
    fields: ['id', 'event_type', 'severity', 'source_ip', 'details', 'created_at', 'status'],
    status: 'active',
    issues: []
  }
];

// API端点定义
const apiEndpoints = [
  {
    path: '/api/auth/login',
    method: 'POST',
    description: '用户登录',
    tables: ['universal_users', 'user_sessions', 'auth_logs'],
    pages: ['UserLoginPage', 'AdminLoginPage'],
    status: 'active',
    issues: []
  },
  {
    path: '/api/auth/logout',
    method: 'POST',
    description: '用户登出',
    tables: ['user_sessions', 'auth_logs'],
    pages: ['所有需要登出的页面'],
    status: 'active',
    issues: []
  },
  {
    path: '/api/questionnaire/submit',
    method: 'POST',
    description: '提交问卷',
    tables: ['questionnaire_submissions', 'questionnaire_responses', 'universal_questionnaire_responses'],
    pages: ['QuestionnairePage', 'Questionnaire2Page', 'IntelligentQuestionnairePage'],
    status: 'active',
    issues: ['多个表存储同类数据，逻辑混乱']
  },
  {
    path: '/api/admin/dashboard/stats',
    method: 'GET',
    description: '管理员仪表板统计',
    tables: ['questionnaire_submissions', 'valid_heart_voices', 'valid_stories', 'users'],
    pages: ['DashboardPage'],
    status: 'active',
    issues: ['刚修复了心声和故事统计为0的问题']
  },
  {
    path: '/api/admin/questionnaires',
    method: 'GET',
    description: '获取问卷列表',
    tables: ['questionnaire_submissions'],
    pages: ['DashboardPage', 'ContentManagementPage'],
    status: 'active',
    issues: []
  },
  {
    path: '/api/heart-voices',
    method: 'GET',
    description: '获取心声列表',
    tables: ['valid_heart_voices'],
    pages: ['VoicesPage', 'HeartVoiceCommunity'],
    status: 'active',
    issues: []
  },
  {
    path: '/api/heart-voices/submit',
    method: 'POST',
    description: '提交心声',
    tables: ['raw_heart_voices', 'valid_heart_voices'],
    pages: ['HeartVoiceSubmitPage', 'HeartVoiceGeneration'],
    status: 'active',
    issues: []
  },
  {
    path: '/api/stories',
    method: 'GET',
    description: '获取故事列表',
    tables: ['valid_stories'],
    pages: ['StoriesPage'],
    status: 'active',
    issues: []
  },
  {
    path: '/api/stories/submit',
    method: 'POST',
    description: '提交故事',
    tables: ['raw_stories', 'valid_stories'],
    pages: ['StorySubmitPage'],
    status: 'active',
    issues: []
  },
  {
    path: '/api/analytics/*',
    method: 'GET',
    description: '分析数据接口',
    tables: ['questionnaire_responses', 'valid_heart_voices', 'valid_stories', 'analytics_cache'],
    pages: ['NewQuestionnaireVisualizationPage', 'QuestionnaireAnalyticsPage'],
    status: 'active',
    issues: []
  }
];

// 页面功能定义
const pageFeatures = [
  {
    name: 'QuestionnairePage',
    type: 'public',
    description: '主要问卷页面',
    tables: ['questionnaire_responses', 'questionnaire_submissions'],
    apis: ['/api/questionnaire/submit', '/api/questionnaire/get'],
    status: 'active',
    issues: ['与Questionnaire2Page功能重叠']
  },
  {
    name: 'Questionnaire2Page',
    type: 'public',
    description: '第二版问卷页面',
    tables: ['questionnaire_responses', 'universal_questionnaire_responses'],
    apis: ['/api/questionnaire/submit', '/api/universal/questionnaire/submit'],
    status: 'active',
    issues: ['与QuestionnairePage功能重叠']
  },
  {
    name: 'IntelligentQuestionnairePage',
    type: 'public',
    description: '智能问卷页面',
    tables: ['universal_questionnaire_responses', 'ai_analysis'],
    apis: ['/api/universal/questionnaire/submit', '/api/ai/analyze'],
    status: 'active',
    issues: []
  },
  {
    name: 'NewQuestionnaireVisualizationPage',
    type: 'public',
    description: '新版6维度可视化分析页面',
    tables: ['questionnaire_responses', 'valid_heart_voices', 'valid_stories'],
    apis: ['/api/analytics/visualization', '/api/analytics/summary'],
    status: 'active',
    issues: []
  },
  {
    name: 'UserManagementPage',
    type: 'admin',
    description: '用户管理页面',
    tables: ['users', 'universal_users'],
    apis: ['/api/admin/users', '/api/admin/users/manage'],
    status: 'active',
    issues: ['管理两套用户系统']
  },
  {
    name: 'VoicesPage',
    type: 'public',
    description: '心声展示页面',
    tables: ['valid_heart_voices', 'heart_voice_likes'],
    apis: ['/api/voices/list', '/api/voices/like'],
    status: 'active',
    issues: []
  },
  {
    name: 'StoriesPage',
    type: 'public',
    description: '故事展示页面',
    tables: ['valid_stories', 'story_likes'],
    apis: ['/api/stories/list', '/api/stories/like'],
    status: 'active',
    issues: []
  }
];

export const ProjectArchitecturePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // 添加错误处理，防止API调用失败影响页面显示
  useEffect(() => {
    // 捕获可能的全局错误
    const handleError = (event: ErrorEvent) => {
      console.warn('页面加载时发生错误，但不影响架构页面显示:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('Promise rejection detected, but architecture page continues to work:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 状态颜色函数
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'deprecated': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  // 表格列定义
  const tableColumns = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          <Text strong>{name}</Text>
          {record.issues.length > 0 && <WarningOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '字段数',
      dataIndex: 'fields',
      key: 'fields',
      render: (fields: string[]) => <Tag color="cyan">{fields.length}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '问题',
      dataIndex: 'issues',
      key: 'issues',
      render: (issues: string[]) => (
        <Space direction="vertical" size="small">
          {issues.map((issue, index) => (
            <Tag key={index} color="red" icon={<ExclamationCircleOutlined />}>
              {issue}
            </Tag>
          ))}
        </Space>
      )
    }
  ];

  // 复制功能函数
  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success(`${type}内容已复制到剪贴板`);
    } catch (err) {
      console.error('复制失败:', err);
      message.error('复制失败，请手动选择文本复制');
    }
  };

  // 生成数据表结构的文本内容
  const generateTablesContent = () => {
    let content = "# 数据表结构分析\n\n";

    databaseTables.forEach(table => {
      content += `## ${table.name}\n`;
      content += `- **类型**: ${table.type}\n`;
      content += `- **描述**: ${table.description}\n`;
      content += `- **状态**: ${table.status}\n`;
      content += `- **字段**: ${table.fields.join(', ')}\n`;
      if (table.issues.length > 0) {
        content += `- **问题**: ${table.issues.join('; ')}\n`;
      }
      content += "\n";
    });

    return content;
  };

  // 生成API端点的文本内容
  const generateApisContent = () => {
    let content = "# API端点映射\n\n";

    apiEndpoints.forEach(api => {
      content += `## ${api.method} ${api.path}\n`;
      content += `- **描述**: ${api.description}\n`;
      content += `- **数据表**: ${api.tables.join(', ')}\n`;
      content += `- **相关页面**: ${api.pages.join(', ')}\n`;
      content += `- **状态**: ${api.status}\n`;
      if (api.issues.length > 0) {
        content += `- **问题**: ${api.issues.join('; ')}\n`;
      }
      content += "\n";
    });

    return content;
  };

  // 生成页面功能的文本内容
  const generatePagesContent = () => {
    let content = "# 页面功能分析\n\n";

    pageFeatures.forEach(page => {
      content += `## ${page.name}\n`;
      content += `- **类型**: ${page.type}\n`;
      content += `- **描述**: ${page.description}\n`;
      content += `- **数据表**: ${page.tables.join(', ')}\n`;
      content += `- **API**: ${page.apis.join(', ')}\n`;
      content += `- **状态**: ${page.status}\n`;
      if (page.issues.length > 0) {
        content += `- **问题**: ${page.issues.join('; ')}\n`;
      }
      content += "\n";
    });

    return content;
  };

  // 生成架构问题总结的文本内容
  const generateIssuesContent = () => {
    let content = "# 架构问题总结\n\n";

    content += "## 数据层问题（高优先级）\n";
    content += "- 用户表重复：users 和 universal_users 功能重叠\n";
    content += "- 问卷表混乱：三个问卷相关表存储同类数据\n";
    content += "  - questionnaire_responses\n";
    content += "  - questionnaire_submissions\n";
    content += "  - universal_questionnaire_responses\n";
    content += "- 数据一致性：不同表之间缺乏明确的同步机制\n\n";

    content += "## API层问题（中优先级）\n";
    content += "- 端点重复：多个API端点处理相似功能\n";
    content += "- 数据源混乱：同一功能使用不同的数据表\n";
    content += "- 缺少统一规范：API响应格式不统一\n\n";

    content += "## 页面层问题（低优先级）\n";
    content += "- 功能重叠：多个问卷页面、分析页面功能相似\n";
    content += "- 用户体验：页面跳转逻辑复杂\n";
    content += "- 代码重复：相似组件未充分复用\n\n";

    content += "## 优化建议\n";
    content += "### 立即行动项\n";
    content += "- 统一用户系统：合并用户表，使用统一的用户管理\n";
    content += "- 重构问卷系统：统一问卷数据存储和处理逻辑\n";
    content += "- API标准化：制定统一的API设计规范\n\n";

    content += "### 中期优化\n";
    content += "- 页面功能整合：合并相似页面，提升用户体验\n";
    content += "- 数据流优化：建立清晰的数据流向和处理逻辑\n";
    content += "- 组件复用：提取公共组件，减少代码重复\n";

    return content;
  };

  // 生成总览的文本内容
  const generateOverviewContent = () => {
    let content = "# 项目架构地图总览\n\n";

    content += "## 项目概况\n";
    content += `- **数据表总数**: ${databaseTables.length}个\n`;
    content += `- **API端点总数**: ${apiEndpoints.length}个\n`;
    content += `- **页面功能总数**: ${pageFeatures.length}个\n\n`;

    content += "## 主要发现\n";
    content += "### 🔴 高优先级问题\n";
    content += "- 用户表重复：users 和 universal_users 功能重叠\n";
    content += "- 问卷表混乱：三个问卷相关表存储同类数据\n";
    content += "- 数据一致性：不同表之间缺乏明确的同步机制\n\n";

    content += "### 🟡 中优先级问题\n";
    content += "- API端点重复：多个API处理相似功能\n";
    content += "- 数据源混乱：同一功能使用不同数据表\n";
    content += "- 缺少统一规范：API响应格式不统一\n\n";

    content += "### 🟢 低优先级问题\n";
    content += "- 页面功能重叠：多个问卷页面、分析页面功能相似\n";
    content += "- 用户体验：页面跳转逻辑复杂\n";
    content += "- 代码重复：相似组件未充分复用\n\n";

    content += "## 建议行动计划\n";
    content += "1. **立即行动**：统一用户系统，重构问卷系统\n";
    content += "2. **中期优化**：API标准化，页面功能整合\n";
    content += "3. **长期维护**：建立架构治理机制，定期审查\n";

    return content;
  };

  // 定义Tabs的items
  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: <span><CheckCircleOutlined />总览</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <Alert
              message="项目架构总览"
              description="全面展示项目架构现状和主要问题，提供优化建议"
              type="info"
              showIcon
              style={{ flex: 1 }}
            />
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(generateOverviewContent(), '架构总览')}
              type="primary"
              size="small"
            >
              复制内容
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="数据表总数"
                  value={databaseTables.length}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="API端点总数"
                  value={apiEndpoints.length}
                  prefix={<ApiOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="页面功能总数"
                  value={pageFeatures.length}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="发现问题总数"
                  value={databaseTables.filter(t => t.issues.length > 0).length + apiEndpoints.filter(a => a.issues.length > 0).length + pageFeatures.filter(p => p.issues.length > 0).length}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col span={8}>
              <Card title="🔴 高优先级问题" size="small">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>用户表重复</li>
                  <li>问卷表混乱</li>
                  <li>数据一致性问题</li>
                </ul>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="🟡 中优先级问题" size="small">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>API端点重复</li>
                  <li>数据源混乱</li>
                  <li>缺少统一规范</li>
                </ul>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="🟢 低优先级问题" size="small">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>页面功能重叠</li>
                  <li>用户体验问题</li>
                  <li>代码重复</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'tables',
      label: <span><DatabaseOutlined />数据表结构</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <Alert
              message="数据表分析"
              description="发现多个表存在功能重叠问题，建议进行数据架构优化"
              type="warning"
              showIcon
              style={{ flex: 1 }}
            />
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(generateTablesContent(), '数据表结构')}
              type="primary"
              size="small"
            >
              复制内容
            </Button>
          </div>
          <Table
            columns={tableColumns}
            dataSource={databaseTables}
            rowKey="name"
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                  <Title level={5}>字段列表</Title>
                  <Space wrap>
                    {record.fields.map((field: string) => (
                      <Tag key={field}>{field}</Tag>
                    ))}
                  </Space>
                  {record.issues.length > 0 && (
                    <>
                      <Title level={5} style={{ marginTop: 16, color: '#ff4d4f' }}>
                        <WarningOutlined /> 发现的问题
                      </Title>
                      <ul>
                        {record.issues.map((issue: string, index: number) => (
                          <li key={index} style={{ color: '#ff4d4f' }}>{issue}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )
            }}
          />
        </div>
      )
    },
    {
      key: 'apis',
      label: <span><ApiOutlined />API端点</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <Alert
              message="API端点分析"
              description="部分API端点存在数据源混乱问题，需要统一数据流"
              type="info"
              showIcon
              style={{ flex: 1 }}
            />
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(generateApisContent(), 'API端点')}
              type="primary"
              size="small"
            >
              复制内容
            </Button>
          </div>
          <Table
            columns={[
              {
                title: 'API路径',
                dataIndex: 'path',
                key: 'path',
                render: (path: string, record: any) => (
                  <Space>
                    <Tag color="blue">{record.method}</Tag>
                    <Text code>{path}</Text>
                    {record.issues.length > 0 && <WarningOutlined style={{ color: '#ff4d4f' }} />}
                  </Space>
                )
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description'
              },
              {
                title: '关联表',
                dataIndex: 'tables',
                key: 'tables',
                render: (tables: string[]) => (
                  <Space wrap>
                    {tables.map(table => (
                      <Tag key={table} color="green">{table}</Tag>
                    ))}
                  </Space>
                )
              },
              {
                title: '使用页面',
                dataIndex: 'pages',
                key: 'pages',
                render: (pages: string[]) => (
                  <Space wrap>
                    {pages.map(page => (
                      <Tag key={page} color="purple">{page}</Tag>
                    ))}
                  </Space>
                )
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>
              }
            ]}
            dataSource={apiEndpoints}
            rowKey="path"
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Title level={5}>数据流向</Title>
                      <Space direction="vertical">
                        {record.tables.map((table: string) => (
                          <Tag key={table} color="green">
                            <DatabaseOutlined /> {table}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Title level={5}>前端页面</Title>
                      <Space direction="vertical">
                        {record.pages.map((page: string) => (
                          <Tag key={page} color="purple">
                            <AppstoreOutlined /> {page}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                  </Row>
                  {record.issues.length > 0 && (
                    <>
                      <Title level={5} style={{ marginTop: 16, color: '#ff4d4f' }}>
                        <WarningOutlined /> 发现的问题
                      </Title>
                      <ul>
                        {record.issues.map((issue: string, index: number) => (
                          <li key={index} style={{ color: '#ff4d4f' }}>{issue}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )
            }}
          />
        </div>
      )
    },
    {
      key: 'pages',
      label: <span><AppstoreOutlined />页面功能</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <Alert
              message="页面功能分析"
              description="发现多个页面存在功能重叠，建议合并或重构"
              type="warning"
              showIcon
              style={{ flex: 1 }}
            />
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(generatePagesContent(), '页面功能')}
              type="primary"
              size="small"
            >
              复制内容
            </Button>
          </div>
          <Collapse>
            <Panel header="公共页面 (Public Pages)" key="public">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size="small" title="问卷页面">
                    <Tag color="blue">QuestionnairePage</Tag>
                    <Tag color="blue">Questionnaire2Page</Tag>
                    <Tag color="blue">IntelligentQuestionnairePage</Tag>
                    <Tag color="red">功能重叠</Tag>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="内容展示">
                    <Tag color="green">VoicesPage</Tag>
                    <Tag color="green">StoriesPage</Tag>
                    <Tag color="green">HomePage</Tag>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="内容提交">
                    <Tag color="purple">HeartVoiceSubmitPage</Tag>
                    <Tag color="purple">StorySubmitPage</Tag>
                    <Tag color="purple">HeartVoiceGeneration</Tag>
                  </Card>
                </Col>
              </Row>
            </Panel>
            <Panel header="管理员页面 (Admin Pages)" key="admin">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size="small" title="核心管理">
                    <Tag color="orange">DashboardPage</Tag>
                    <Tag color="orange">UserManagementPage</Tag>
                    <Tag color="orange">ContentManagementPage</Tag>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="系统管理">
                    <Tag color="red">SuperAdminPage</Tag>
                    <Tag color="red">SystemManagementPage</Tag>
                    <Tag color="red">SecurityManagementPage</Tag>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="数据分析">
                    <Tag color="cyan">AnalyticsPage</Tag>
                    <Tag color="cyan">UnifiedAnalyticsPage</Tag>
                    <Tag color="red">功能重叠</Tag>
                  </Card>
                </Col>
              </Row>
            </Panel>
            <Panel header="审核员页面 (Reviewer Pages)" key="reviewer">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title="审核功能">
                    <Tag color="gold">ReviewerDashboard</Tag>
                    <Tag color="gold">VoiceReviewPage</Tag>
                    <Tag color="gold">StoryReviewPage</Tag>
                    <Tag color="gold">QuestionnaireReviewPage</Tag>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="快速审核">
                    <Tag color="lime">QuickReviewVoicePage</Tag>
                    <Tag color="lime">QuickReviewStoryPage</Tag>
                    <Tag color="lime">ReviewerQuickReviewPage</Tag>
                  </Card>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </div>
      )
    },
    {
      key: 'issues',
      label: <span><WarningOutlined />架构问题</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <Alert
              message="关键架构问题总结"
              description="以下是发现的主要架构问题，需要优先解决"
              type="error"
              showIcon
              style={{ flex: 1 }}
            />
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(generateIssuesContent(), '架构问题总结')}
              type="primary"
              size="small"
            >
              复制内容
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="数据层问题" extra={<Tag color="red">高优先级</Tag>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert type="error" message="用户表重复" description="users 和 universal_users 功能重叠" />
                  <Alert type="error" message="问卷表混乱" description="questionnaire_responses, questionnaire_submissions, universal_questionnaire_responses 三个表存储同类数据" />
                  <Alert type="warning" message="数据一致性" description="不同表之间的数据同步机制不明确" />
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="API层问题" extra={<Tag color="orange">中优先级</Tag>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert type="warning" message="端点重复" description="多个API端点处理相似功能" />
                  <Alert type="warning" message="数据源混乱" description="同一功能使用不同的数据表" />
                  <Alert type="info" message="缺少统一规范" description="API响应格式不统一" />
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="页面层问题" extra={<Tag color="yellow">低优先级</Tag>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert type="warning" message="功能重叠" description="多个问卷页面、多个分析页面功能相似" />
                  <Alert type="info" message="用户体验" description="页面跳转逻辑复杂" />
                  <Alert type="info" message="代码重复" description="相似组件未充分复用" />
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="优化建议" extra={<Tag color="green">解决方案</Tag>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert type="success" message="统一用户系统" description="合并用户表，使用统一的用户管理" />
                  <Alert type="success" message="重构问卷系统" description="统一问卷数据存储和处理逻辑" />
                  <Alert type="success" message="页面功能整合" description="合并相似页面，提升用户体验" />
                  <Alert type="success" message="API标准化" description="制定统一的API设计规范" />
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <Title level={2}>
          <AppstoreOutlined /> 项目架构地图
        </Title>
        <Paragraph>
          全面展示项目的数据表、API接口端点和页面功能之间的对应关系，帮助审视架构合理性和发现优化空间。
        </Paragraph>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      </div>
    </AdminLayout>
  );
};

export default ProjectArchitecturePage;
