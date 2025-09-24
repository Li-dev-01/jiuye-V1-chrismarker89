import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Input,
  Select,
  Tabs,
  Badge,
  Tooltip,
  Progress,
  message,
  Modal,
  Drawer
} from 'antd';
import {
  ApiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  BugOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface APIEndpoint {
  id: string;
  method: string;
  path: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'testing' | 'deprecated';
  responseTime?: number;
  lastChecked?: string;
  errorRate?: number;
  usageCount?: number;
  authentication: boolean;
  database?: string[];
  dependencies?: string[];
  // 新增字段用于API分类
  userType?: 'questionnaire_user' | 'admin_manager' | 'reviewer' | 'all';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  safeToModify?: boolean;
  impactScope?: string[];
}

interface APIStats {
  totalEndpoints: number;
  activeEndpoints: number;
  errorEndpoints: number;
  avgResponseTime: number;
  totalRequests: number;
  errorRate: number;
}

const AdminAPIManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [stats, setStats] = useState<APIStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchAPIData();
  }, []);

  const fetchAPIData = async () => {
    setLoading(true);
    try {
      console.log('[API_MANAGEMENT] Fetching API data...');
      
      // 尝试从后端获取API端点列表
      const response = await apiClient.get('/api/simple-admin/api/endpoints');
      
      if (response.data.success) {
        setEndpoints(response.data.data.endpoints || []);
        setStats(response.data.data.stats || null);
      } else {
        throw new Error('API响应失败');
      }
    } catch (error) {
      console.error('获取API数据失败:', error);
      
      // 使用扩展的模拟数据 - 按用户类型重新分类
      const mockEndpoints: APIEndpoint[] = [
        // 🟢 用户端API (问卷用户使用) - 核心功能，不可轻易修改
        {
          id: 'user-questionnaire-submit',
          method: 'POST',
          path: '/api/questionnaire/submit',
          description: '📝 问卷提交 (用户端)',
          category: 'User Frontend',
          status: 'active',
          responseTime: 180,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 8567,
          authentication: false,
          database: ['questionnaire_submissions_temp'],
          dependencies: ['universal-questionnaire'],
          userType: 'questionnaire_user',
          priority: 'critical',
          safeToModify: false,
          impactScope: ['问卷用户', '数据收集', '核心业务']
        },
        {
          id: 'user-story-submit',
          method: 'POST',
          path: '/api/heart-voices/submit',
          description: '💭 心声提交 (用户端)',
          category: 'User Frontend',
          status: 'active',
          responseTime: 150,
          lastChecked: new Date().toISOString(),
          errorRate: 0.04,
          usageCount: 2341,
          authentication: false,
          database: ['stories'],
          dependencies: ['content-management'],
          userType: 'questionnaire_user',
          priority: 'critical',
          safeToModify: false,
          impactScope: ['问卷用户', '内容提交', '用户体验']
        },
        {
          id: 'user-analytics-view',
          method: 'GET',
          path: '/api/universal-questionnaire/statistics/employment-survey-2024',
          description: '📊 统计数据查看 (用户端)',
          category: 'User Frontend',
          status: 'active',
          responseTime: 200,
          lastChecked: new Date().toISOString(),
          errorRate: 0.01,
          usageCount: 15678,
          authentication: false,
          database: ['aggregated_stats', 'dashboard_cache'],
          dependencies: ['analytics'],
          userType: 'questionnaire_user',
          priority: 'critical',
          safeToModify: false,
          impactScope: ['问卷用户', '数据展示', '用户体验']
        },
        {
          id: 'user-heart-voices-list',
          method: 'GET',
          path: '/api/heart-voices',
          description: '💬 心声列表 (用户端)',
          category: 'User Frontend',
          status: 'active',
          responseTime: 200,
          lastChecked: new Date().toISOString(),
          errorRate: 0.06,
          usageCount: 4567,
          authentication: false,
          database: ['stories'],
          dependencies: ['content-management'],
          userType: 'questionnaire_user',
          priority: 'critical',
          safeToModify: false,
          impactScope: ['问卷用户', '内容浏览', '用户体验']
        },

        // 🔑 认证API (通用)
        {
          id: 'simple-auth-login',
          method: 'POST',
          path: '/api/simple-auth/login',
          description: '🔑 简化登录认证 (通用)',
          category: 'Authentication',
          status: 'active',
          responseTime: 120,
          lastChecked: new Date().toISOString(),
          errorRate: 0.1,
          usageCount: 1250,
          authentication: false,
          database: ['universal_users'],
          dependencies: ['simple-auth'],
          userType: 'all',
          priority: 'high',
          safeToModify: true,
          impactScope: ['所有用户', '认证系统']
        },
        {
          id: 'simple-auth-verify',
          method: 'POST',
          path: '/api/simple-auth/verify',
          description: '🔍 Token验证 (通用)',
          category: 'Authentication',
          status: 'active',
          responseTime: 85,
          lastChecked: new Date().toISOString(),
          errorRate: 0.05,
          usageCount: 3420,
          authentication: true,
          database: ['universal_users', 'user_sessions'],
          dependencies: ['simple-auth'],
          userType: 'all',
          priority: 'high',
          safeToModify: true,
          impactScope: ['所有用户', '认证验证']
        },
        {
          id: 'simple-auth-me',
          method: 'GET',
          path: '/api/simple-auth/me',
          description: '👤 获取当前用户信息 (通用)',
          category: 'Authentication',
          status: 'active',
          responseTime: 95,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 2890,
          authentication: true,
          database: ['universal_users'],
          dependencies: ['simple-auth'],
          userType: 'all',
          priority: 'high',
          safeToModify: true,
          impactScope: ['所有用户', '用户信息']
        },
        // 🔵 管理端API (后台运营使用) - 可以安全修改
        {
          id: 'simple-admin-dashboard',
          method: 'GET',
          path: '/api/simple-admin/dashboard',
          description: '📊 管理员仪表板数据 (管理端)',
          category: 'Admin Backend',
          status: 'active',
          responseTime: 200,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 890,
          authentication: true,
          database: ['dashboard_cache', 'aggregated_stats', 'realtime_stats'],
          dependencies: ['simple-auth'],
          userType: 'admin_manager',
          priority: 'high',
          safeToModify: true,
          impactScope: ['管理员', '后台运营', '数据展示']
        },
        {
          id: 'simple-admin-users',
          method: 'GET',
          path: '/api/simple-admin/users',
          description: '用户管理列表',
          category: 'Admin',
          status: 'active',
          responseTime: 180,
          lastChecked: new Date().toISOString(),
          errorRate: 0.08,
          usageCount: 156,
          authentication: true,
          database: ['users'],
          dependencies: ['simple-auth']
        },
        {
          id: 'simple-admin-analytics',
          method: 'GET',
          path: '/api/simple-admin/analytics',
          description: '系统分析数据',
          category: 'Admin',
          status: 'active',
          responseTime: 320,
          lastChecked: new Date().toISOString(),
          errorRate: 0.12,
          usageCount: 234,
          authentication: true,
          database: ['analytics'],
          dependencies: ['simple-auth']
        },
        {
          id: 'simple-admin-api-endpoints',
          method: 'GET',
          path: '/api/simple-admin/api/endpoints',
          description: 'API端点列表',
          category: 'Admin',
          status: 'active',
          responseTime: 150,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 45,
          authentication: true,
          database: [],
          dependencies: ['simple-auth']
        },
        // 简化审核员API
        {
          id: 'simple-reviewer-dashboard',
          method: 'GET',
          path: '/api/simple-reviewer/dashboard',
          description: '审核员仪表板',
          category: 'Reviewer',
          status: 'active',
          responseTime: 150,
          lastChecked: new Date().toISOString(),
          errorRate: 0.03,
          usageCount: 567,
          authentication: true,
          database: ['audit_records'],
          dependencies: ['simple-auth']
        },
        {
          id: 'simple-reviewer-pending',
          method: 'GET',
          path: '/api/simple-reviewer/pending-reviews',
          description: '待审核列表',
          category: 'Reviewer',
          status: 'active',
          responseTime: 180,
          lastChecked: new Date().toISOString(),
          errorRate: 0.08,
          usageCount: 234,
          authentication: true,
          database: ['audit_records', 'questionnaires', 'stories'],
          dependencies: ['simple-auth']
        },
        {
          id: 'simple-reviewer-submit',
          method: 'POST',
          path: '/api/simple-reviewer/submit-review',
          description: '提交审核结果',
          category: 'Reviewer',
          status: 'active',
          responseTime: 200,
          lastChecked: new Date().toISOString(),
          errorRate: 0.05,
          usageCount: 189,
          authentication: true,
          database: ['audit_records'],
          dependencies: ['simple-auth']
        },
        {
          id: 'simple-reviewer-stats',
          method: 'GET',
          path: '/api/simple-reviewer/stats',
          description: '审核统计',
          category: 'Reviewer',
          status: 'active',
          responseTime: 120,
          lastChecked: new Date().toISOString(),
          errorRate: 0.04,
          usageCount: 345,
          authentication: true,
          database: ['audit_records'],
          dependencies: ['simple-auth']
        },
        // 传统管理员API (已弃用，推荐使用simple-admin)
        {
          id: 'admin-dashboard-stats',
          method: 'GET',
          path: '/api/simple-admin/dashboard',
          description: '管理员仪表板统计 (已迁移)',
          category: 'Admin',
          status: 'active',
          responseTime: 200,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 45,
          authentication: true,
          database: ['users', 'questionnaires'],
          dependencies: ['simple-auth']
        },
        {
          id: 'admin-questionnaires',
          method: 'GET',
          path: '/api/simple-admin/questionnaires',
          description: '问卷管理 (已迁移)',
          category: 'Admin',
          status: 'deprecated',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errorRate: 1.0,
          usageCount: 23,
          authentication: true,
          database: ['questionnaires'],
          dependencies: ['simple-auth']
        },
        {
          id: 'admin-users-export',
          method: 'GET',
          path: '/api/simple-admin/users/export',
          description: '用户数据导出 (已迁移)',
          category: 'Admin',
          status: 'deprecated',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errorRate: 1.0,
          usageCount: 12,
          authentication: true,
          database: ['users'],
          dependencies: ['simple-auth']
        },
        // 审核员API (已弃用，推荐使用simple-reviewer)
        {
          id: 'reviewer-content-list',
          method: 'GET',
          path: '/api/simple-reviewer/pending-reviews',
          description: '审核内容列表 (已迁移)',
          category: 'Reviewer',
          status: 'active',
          responseTime: 180,
          lastChecked: new Date().toISOString(),
          errorRate: 0.08,
          usageCount: 67,
          authentication: true,
          database: ['audit_records'],
          dependencies: ['simple-auth']
        },
        {
          id: 'reviewer-submit-audit',
          method: 'POST',
          path: '/api/simple-reviewer/submit-review',
          description: '提交审核结果 (已迁移)',
          category: 'Reviewer',
          status: 'deprecated',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errorRate: 1.0,
          usageCount: 34,
          authentication: true,
          database: ['audit_records'],
          dependencies: ['simple-auth']
        },
        // 问卷相关API
        {
          id: 'questionnaire-list',
          method: 'GET',
          path: '/api/questionnaire',
          description: '问卷列表',
          category: 'Questionnaire',
          status: 'active',
          responseTime: 180,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 3456,
          authentication: false,
          database: ['questionnaires'],
          dependencies: []
        },
        {
          id: 'questionnaire-submit',
          method: 'POST',
          path: '/api/questionnaire/submit',
          description: '问卷提交',
          category: 'Questionnaire',
          status: 'active',
          responseTime: 300,
          lastChecked: new Date().toISOString(),
          errorRate: 0.15,
          usageCount: 2340,
          authentication: false,
          database: ['questionnaire_submissions'],
          dependencies: []
        },
        {
          id: 'questionnaire-by-id',
          method: 'GET',
          path: '/api/questionnaire/:id',
          description: '获取特定问卷',
          category: 'Questionnaire',
          status: 'active',
          responseTime: 150,
          lastChecked: new Date().toISOString(),
          errorRate: 0.03,
          usageCount: 2890,
          authentication: false,
          database: ['questionnaires'],
          dependencies: []
        },
        // 通用问卷API
        {
          id: 'universal-questionnaire-submit',
          method: 'POST',
          path: '/api/universal-questionnaire/submit',
          description: '通用问卷提交',
          category: 'Questionnaire',
          status: 'active',
          responseTime: 250,
          lastChecked: new Date().toISOString(),
          errorRate: 0.08,
          usageCount: 5670,
          authentication: false,
          database: ['questionnaire_submissions'],
          dependencies: []
        },
        {
          id: 'universal-questionnaire-count',
          method: 'GET',
          path: '/api/universal-questionnaire/count',
          description: '问卷统计计数',
          category: 'Analytics',
          status: 'active',
          responseTime: 90,
          lastChecked: new Date().toISOString(),
          errorRate: 0.01,
          usageCount: 890,
          authentication: false,
          database: ['questionnaire_submissions'],
          dependencies: []
        },
        // 分析API
        {
          id: 'analytics-basic-stats',
          method: 'GET',
          path: '/api/analytics/basic-stats',
          description: '基础统计分析',
          category: 'Analytics',
          status: 'active',
          responseTime: 320,
          lastChecked: new Date().toISOString(),
          errorRate: 0.12,
          usageCount: 456,
          authentication: false,
          database: ['questionnaire_submissions', 'users'],
          dependencies: []
        },
        {
          id: 'analytics-distribution',
          method: 'GET',
          path: '/api/analytics/distribution',
          description: '数据分布分析',
          category: 'Analytics',
          status: 'active',
          responseTime: 280,
          lastChecked: new Date().toISOString(),
          errorRate: 0.09,
          usageCount: 234,
          authentication: false,
          database: ['questionnaire_submissions'],
          dependencies: []
        },
        // 心声API
        {
          id: 'heart-voices-list',
          method: 'GET',
          path: '/api/heart-voices',
          description: '心声列表',
          category: 'Stories',
          status: 'active',
          responseTime: 200,
          lastChecked: new Date().toISOString(),
          errorRate: 0.06,
          usageCount: 1234,
          authentication: false,
          database: ['heart_voices'],
          dependencies: []
        },
        {
          id: 'heart-voices-submit',
          method: 'POST',
          path: '/api/heart-voices/submit',
          description: '提交心声',
          category: 'Stories',
          status: 'active',
          responseTime: 180,
          lastChecked: new Date().toISOString(),
          errorRate: 0.04,
          usageCount: 567,
          authentication: false,
          database: ['heart_voices'],
          dependencies: []
        },
        // 故事API
        {
          id: 'stories-list',
          method: 'GET',
          path: '/api/stories',
          description: '故事列表',
          category: 'Stories',
          status: 'active',
          responseTime: 220,
          lastChecked: new Date().toISOString(),
          errorRate: 0.05,
          usageCount: 1890,
          authentication: false,
          database: ['stories'],
          dependencies: []
        },
        // 系统API
        {
          id: 'health-check',
          method: 'GET',
          path: '/api/health',
          description: '健康检查',
          category: 'System',
          status: 'active',
          responseTime: 50,
          lastChecked: new Date().toISOString(),
          errorRate: 0.01,
          usageCount: 5670,
          authentication: false,
          database: [],
          dependencies: []
        },
        {
          id: 'system-status',
          method: 'GET',
          path: '/api/system/status',
          description: '系统状态检查',
          category: 'System',
          status: 'active',
          responseTime: 75,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 1234,
          authentication: false,
          database: [],
          dependencies: []
        },
        {
          id: 'system-metrics',
          method: 'GET',
          path: '/api/system/metrics',
          description: '系统性能指标',
          category: 'System',
          status: 'active',
          responseTime: 120,
          lastChecked: new Date().toISOString(),
          errorRate: 0.03,
          usageCount: 567,
          authentication: true,
          database: [],
          dependencies: ['simple-auth']
        },
        // 错误监控API
        {
          id: 'errors-report',
          method: 'POST',
          path: '/api/errors/report',
          description: '错误报告',
          category: 'System',
          status: 'inactive',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errorRate: 1.0,
          usageCount: 0,
          authentication: false,
          database: ['error_logs'],
          dependencies: []
        },
        {
          id: 'performance-metrics',
          method: 'POST',
          path: '/api/performance-metrics',
          description: '性能指标上报',
          category: 'System',
          status: 'inactive',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errorRate: 1.0,
          usageCount: 0,
          authentication: false,
          database: ['performance_logs'],
          dependencies: []
        },
        // 文件管理API
        {
          id: 'file-upload',
          method: 'POST',
          path: '/api/files/upload',
          description: '文件上传',
          category: 'Files',
          status: 'active',
          responseTime: 800,
          lastChecked: new Date().toISOString(),
          errorRate: 0.05,
          usageCount: 234,
          authentication: true,
          database: ['files'],
          dependencies: ['simple-auth']
        },
        {
          id: 'file-download',
          method: 'GET',
          path: '/api/files/:id/download',
          description: '文件下载',
          category: 'Files',
          status: 'active',
          responseTime: 200,
          lastChecked: new Date().toISOString(),
          errorRate: 0.02,
          usageCount: 567,
          authentication: true,
          database: ['files'],
          dependencies: ['simple-auth']
        },
        // 通知API
        {
          id: 'notifications-list',
          method: 'GET',
          path: '/api/notifications',
          description: '通知列表',
          category: 'Notifications',
          status: 'active',
          responseTime: 150,
          lastChecked: new Date().toISOString(),
          errorRate: 0.03,
          usageCount: 890,
          authentication: true,
          database: ['notifications'],
          dependencies: ['simple-auth']
        },
        {
          id: 'notifications-mark-read',
          method: 'PUT',
          path: '/api/notifications/:id/read',
          description: '标记通知已读',
          category: 'Notifications',
          status: 'active',
          responseTime: 100,
          lastChecked: new Date().toISOString(),
          errorRate: 0.01,
          usageCount: 456,
          authentication: true,
          database: ['notifications'],
          dependencies: ['simple-auth']
        }
      ];

      const mockStats: APIStats = {
        totalEndpoints: mockEndpoints.length,
        activeEndpoints: mockEndpoints.filter(e => e.status === 'active').length,
        errorEndpoints: mockEndpoints.filter(e => e.status === 'error').length,
        avgResponseTime: 165,
        totalRequests: 16462,
        errorRate: 0.08
      };

      setEndpoints(mockEndpoints);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (endpoint: APIEndpoint) => {
    setTestingEndpoint(endpoint.id);
    try {
      console.log(`[API_MANAGEMENT] Testing endpoint: ${endpoint.path}`);
      
      const startTime = Date.now();
      let response;
      
      if (endpoint.method === 'GET') {
        response = await fetch(`${API_CONFIG.BASE_URL}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('reviewer_token')}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // 对于POST等方法，使用测试数据
        response = await fetch(`${API_CONFIG.BASE_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('reviewer_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        });
      }
      
      const responseTime = Date.now() - startTime;
      const isSuccess = response.ok;
      
      // 更新端点状态
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpoint.id 
          ? { 
              ...ep, 
              status: isSuccess ? 'active' : 'error',
              responseTime: responseTime,
              lastChecked: new Date().toISOString(),
              errorRate: isSuccess ? Math.max(0, (ep.errorRate || 0) - 0.01) : Math.min(1, (ep.errorRate || 0) + 0.1)
            }
          : ep
      ));
      
      message.success(`端点测试${isSuccess ? '成功' : '失败'}: ${responseTime}ms`);
      
    } catch (error) {
      console.error('端点测试失败:', error);
      
      // 更新为错误状态
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpoint.id 
          ? { 
              ...ep, 
              status: 'error',
              lastChecked: new Date().toISOString(),
              errorRate: Math.min(1, (ep.errorRate || 0) + 0.1)
            }
          : ep
      ));
      
      message.error('端点测试失败');
    } finally {
      setTestingEndpoint(null);
    }
  };

  // 复制端点信息
  const copyEndpointInfo = (endpoint: APIEndpoint) => {
    const info = `
API端点详细信息
================
方法: ${endpoint.method}
路径: ${endpoint.path}
描述: ${endpoint.description}
分类: ${endpoint.category}
状态: ${endpoint.status.toUpperCase()}
响应时间: ${endpoint.responseTime || 0}ms
错误率: ${((endpoint.errorRate || 0) * 100).toFixed(1)}%
使用次数: ${endpoint.usageCount || 0}
认证要求: ${endpoint.authentication ? '需要' : '公开'}
数据库依赖: ${endpoint.database?.join(', ') || '无'}
服务依赖: ${endpoint.dependencies?.join(', ') || '无'}
最后检查: ${endpoint.lastChecked ? new Date(endpoint.lastChecked).toLocaleString() : '未知'}

测试命令:
curl -X ${endpoint.method} "${API_CONFIG.BASE_URL}${endpoint.path}" \\
  -H "Content-Type: application/json" \\
  ${endpoint.authentication ? '-H "Authorization: Bearer YOUR_TOKEN" \\' : ''}
  ${endpoint.method !== 'GET' ? '-d "{}"' : ''}

问题反馈模板:
- 端点: ${endpoint.path}
- 问题类型: [请选择: 响应超时/返回错误/数据异常/其他]
- 错误信息: [请填写具体错误信息]
- 重现步骤: [请描述如何重现问题]
- 期望结果: [请描述期望的正确结果]
`;

    navigator.clipboard.writeText(info.trim()).then(() => {
      message.success('端点信息已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  // 复制所有端点信息
  const copyAllEndpointsInfo = () => {
    const totalEndpoints = endpoints.length;
    const activeEndpoints = endpoints.filter(e => e.status === 'active').length;
    const errorEndpoints = endpoints.filter(e => e.status === 'error').length;
    const deprecatedEndpoints = endpoints.filter(e => e.status === 'deprecated').length;
    const inactiveEndpoints = endpoints.filter(e => e.status === 'inactive').length;

    // 按分类统计
    const categoryStats = endpoints.reduce((acc, endpoint) => {
      if (!acc[endpoint.category]) {
        acc[endpoint.category] = { total: 0, active: 0, error: 0 };
      }
      acc[endpoint.category].total++;
      if (endpoint.status === 'active') acc[endpoint.category].active++;
      if (endpoint.status === 'error') acc[endpoint.category].error++;
      return acc;
    }, {} as Record<string, { total: number; active: number; error: number }>);

    const allInfo = `API端点完整清单
================
生成时间: ${new Date().toLocaleString()}
总端点数: ${totalEndpoints}
正常端点: ${activeEndpoints}
异常端点: ${errorEndpoints}
已弃用端点: ${deprecatedEndpoints}
停用端点: ${inactiveEndpoints}

分类统计:
${Object.entries(categoryStats).map(([category, stats]) =>
  `- ${category}: ${stats.total}个 (正常:${stats.active}, 异常:${stats.error})`
).join('\n')}

详细端点列表:
${endpoints.map(endpoint => `
${endpoint.method} ${endpoint.path}
  描述: ${endpoint.description}
  分类: ${endpoint.category}
  状态: ${endpoint.status.toUpperCase()}
  响应时间: ${endpoint.responseTime || 0}ms
  错误率: ${((endpoint.errorRate || 0) * 100).toFixed(1)}%
  使用次数: ${endpoint.usageCount || 0}
  认证要求: ${endpoint.authentication ? '需要' : '无需'}
  数据库依赖: ${(endpoint.database && endpoint.database.length > 0) ? endpoint.database.join(', ') : '无'}
  服务依赖: ${(endpoint.dependencies && endpoint.dependencies.length > 0) ? endpoint.dependencies.join(', ') : '无'}`).join('\n')}

系统统计:
- 平均响应时间: ${stats?.avgResponseTime || 0}ms
- 总请求数: ${(stats?.totalRequests || 0).toLocaleString()}
- 整体错误率: ${((stats?.errorRate || 0) * 100).toFixed(1)}%
- 系统健康度: ${activeEndpoints / totalEndpoints > 0.8 ? '良好' : activeEndpoints / totalEndpoints > 0.6 ? '一般' : '需要关注'}

技术架构信息:
- 部署环境: Cloudflare Pages + Workers
- 认证系统: JWT Token (simple-auth)
- 数据库: Cloudflare D1
- 存储: Cloudflare R2
- CDN: Cloudflare全球网络

问题反馈联系方式:
- 请将此信息连同具体问题描述发送给技术团队
- 包含错误截图和重现步骤将有助于快速解决问题
- 建议同时提供浏览器控制台日志和网络请求详情
- 紧急问题请标注"[紧急]"并说明业务影响范围`;

    navigator.clipboard.writeText(allInfo.trim()).then(() => {
      message.success('完整API信息已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  // 显示端点详情
  const showEndpointDetails = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setDrawerVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'error': return 'red';
      case 'inactive': return 'orange';
      case 'deprecated': return 'volcano';
      case 'testing': return 'blue';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleOutlined />;
      case 'error': return <CloseCircleOutlined />;
      case 'inactive': return <ExclamationCircleOutlined />;
      case 'deprecated': return <ExclamationCircleOutlined />;
      case 'testing': return <ReloadOutlined spin />;
      default: return null;
    }
  };

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || endpoint.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || endpoint.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(endpoints.map(e => e.category)));

  const columns = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag color={method === 'GET' ? 'blue' : method === 'POST' ? 'green' : 'orange'}>
          {method}
        </Tag>
      )
    },
    {
      title: '端点路径',
      dataIndex: 'path',
      key: 'path',
      render: (path: string, record: APIEndpoint) => (
        <div>
          <Text code>{path}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => <Tag>{category}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 100,
      render: (time: number) => time ? `${time}ms` : '-'
    },
    {
      title: '错误率',
      dataIndex: 'errorRate',
      key: 'errorRate',
      width: 100,
      render: (rate: number) => (
        <div>
          <Progress 
            percent={Math.round((rate || 0) * 100)} 
            size="small" 
            status={rate > 0.1 ? 'exception' : 'success'}
            showInfo={false}
          />
          <Text style={{ fontSize: '12px' }}>{((rate || 0) * 100).toFixed(1)}%</Text>
        </div>
      )
    },
    {
      title: '认证',
      dataIndex: 'authentication',
      key: 'authentication',
      width: 80,
      render: (auth: boolean) => auth ? <Tag color="red">需要</Tag> : <Tag color="green">公开</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: APIEndpoint) => (
        <Space>
          <Tooltip title="测试端点">
            <Button
              size="small"
              icon={<MonitorOutlined />}
              loading={testingEndpoint === record.id}
              onClick={() => testEndpoint(record)}
            />
          </Tooltip>
          <Tooltip title="复制信息">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyEndpointInfo(record)}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => showEndpointDetails(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Card loading={true}>
          <div style={{ height: '400px' }} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ApiOutlined /> API管理与监控
        </Title>
        <Text type="secondary">
          系统API端点状态监控与管理 • 实时监控 {endpoints.length} 个端点
        </Text>
      </div>

      {/* API统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总端点数"
              value={stats?.totalEndpoints || 0}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="正常运行"
              value={stats?.activeEndpoints || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="异常端点"
              value={stats?.errorEndpoints || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={stats?.avgResponseTime || 0}
              suffix="ms"
              prefix={<MonitorOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统健康状态警告 */}
      {stats && stats.errorEndpoints > 0 && (
        <Alert
          message="API健康状态警告"
          description={`检测到 ${stats.errorEndpoints} 个端点异常，请及时检查和修复`}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Search
              placeholder="搜索端点路径或描述"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">正常</Option>
              <Option value="error">异常</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="分类筛选"
              value={categoryFilter}
              onChange={setCategoryFilter}
            >
              <Option value="all">全部分类</Option>
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={3}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchAPIData}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
          <Col xs={24} sm={3}>
            <Button
              icon={<CopyOutlined />}
              onClick={copyAllEndpointsInfo}
              title="复制完整API信息用于问题反馈"
            >
              复制全部
            </Button>
          </Col>
        </Row>
      </Card>

      {/* API端点列表 */}
      <Card title={`API端点列表 (${filteredEndpoints.length}/${endpoints.length})`}>
        <Table
          columns={columns}
          dataSource={filteredEndpoints}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          size="small"
        />
      </Card>

      {/* 端点详情抽屉 */}
      <Drawer
        title={
          <Space>
            <ApiOutlined />
            API端点详情
            {selectedEndpoint && (
              <Tag color={getStatusColor(selectedEndpoint.status)}>
                {selectedEndpoint.status.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          selectedEndpoint && (
            <Space>
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyEndpointInfo(selectedEndpoint)}
              >
                复制信息
              </Button>
              <Button
                type="primary"
                icon={<BugOutlined />}
                onClick={() => testEndpoint(selectedEndpoint)}
                loading={testingEndpoint === selectedEndpoint.id}
              >
                测试端点
              </Button>
            </Space>
          )
        }
      >
        {selectedEndpoint && (
          <div>
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={8}><Text strong>方法:</Text></Col>
                <Col span={16}>
                  <Tag color={selectedEndpoint.method === 'GET' ? 'blue' : selectedEndpoint.method === 'POST' ? 'green' : 'orange'}>
                    {selectedEndpoint.method}
                  </Tag>
                </Col>

                <Col span={8}><Text strong>路径:</Text></Col>
                <Col span={16}><Text code>{selectedEndpoint.path}</Text></Col>

                <Col span={8}><Text strong>描述:</Text></Col>
                <Col span={16}>{selectedEndpoint.description}</Col>

                <Col span={8}><Text strong>分类:</Text></Col>
                <Col span={16}><Tag>{selectedEndpoint.category}</Tag></Col>

                <Col span={8}><Text strong>认证:</Text></Col>
                <Col span={16}>
                  <Tag color={selectedEndpoint.authentication ? 'red' : 'green'}>
                    {selectedEndpoint.authentication ? '需要认证' : '公开访问'}
                  </Tag>
                </Col>
              </Row>
            </Card>

            <Card title="性能指标" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={8}><Text strong>响应时间:</Text></Col>
                <Col span={16}>{selectedEndpoint.responseTime || 0}ms</Col>

                <Col span={8}><Text strong>错误率:</Text></Col>
                <Col span={16}>
                  <Progress
                    percent={Math.round((selectedEndpoint.errorRate || 0) * 100)}
                    size="small"
                    status={selectedEndpoint.errorRate && selectedEndpoint.errorRate > 0.1 ? 'exception' : 'success'}
                  />
                </Col>

                <Col span={8}><Text strong>使用次数:</Text></Col>
                <Col span={16}>{selectedEndpoint.usageCount || 0}</Col>

                <Col span={8}><Text strong>最后检查:</Text></Col>
                <Col span={16}>
                  {selectedEndpoint.lastChecked
                    ? new Date(selectedEndpoint.lastChecked).toLocaleString()
                    : '未知'
                  }
                </Col>
              </Row>
            </Card>

            <Card title="依赖关系" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={8}><Text strong>数据库:</Text></Col>
                <Col span={16}>
                  {selectedEndpoint.database && selectedEndpoint.database.length > 0
                    ? selectedEndpoint.database.map(db => <Tag key={db}>{db}</Tag>)
                    : <Text type="secondary">无</Text>
                  }
                </Col>

                <Col span={8}><Text strong>服务依赖:</Text></Col>
                <Col span={16}>
                  {selectedEndpoint.dependencies && selectedEndpoint.dependencies.length > 0
                    ? selectedEndpoint.dependencies.map(dep => <Tag key={dep}>{dep}</Tag>)
                    : <Text type="secondary">无</Text>
                  }
                </Col>
              </Row>
            </Card>

            <Card title="测试命令" size="small">
              <Text code style={{
                display: 'block',
                whiteSpace: 'pre-wrap',
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
{`curl -X ${selectedEndpoint.method} "${API_CONFIG.BASE_URL}${selectedEndpoint.path}" \\
  -H "Content-Type: application/json"${selectedEndpoint.authentication ? ' \\\n  -H "Authorization: Bearer YOUR_TOKEN"' : ''}${selectedEndpoint.method !== 'GET' ? ' \\\n  -d "{}"' : ''}`}
              </Text>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminAPIManagement;
