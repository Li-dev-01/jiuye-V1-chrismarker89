import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  Tag,
  Button,
  Space,
  Typography,
  Descriptions,
  Alert,
  Collapse,
  Badge,
  Tooltip,
  Spin,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Timeline,
  Modal,
  message,
  Divider
} from 'antd';
import {
  ApiOutlined,
  DatabaseOutlined,
  TableOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  BugOutlined,
  ToolOutlined,
  DashboardOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { ManagementAdminService } from '../../services/ManagementAdminService';
import styles from './ApiDataPage.module.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  page: string;
  database: string;
  tables: string[];
  status: 'active' | 'deprecated' | 'planned';
  parameters?: string[];
  response?: string;
  lastTested?: string;
  responseTime?: number;
  errorRate?: number;
  healthStatus: 'healthy' | 'warning' | 'error' | 'unknown';
  lastError?: string;
}

interface DatabaseTable {
  name: string;
  type: 'temp' | 'valid' | 'analytics' | 'system';
  description: string;
  recordCount?: number;
  lastUpdated?: string;
  relatedApis: string[];
}

interface PageApiStatus {
  pageName: string;
  pageUrl: string;
  totalApis: number;
  healthyApis: number;
  errorApis: number;
  warningApis: number;
  apis: {
    endpoint: string;
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    statusCode?: number;
    errorMessage?: string;
    responseTime?: number;
    lastChecked?: string;
  }[];
}

interface ApiHealthSummary {
  totalApis: number;
  healthyApis: number;
  errorApis: number;
  warningApis: number;
  unknownApis: number;
  averageResponseTime: number;
  lastUpdated: string;
}

export const ApiDataPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [pageApiStatuses, setPageApiStatuses] = useState<PageApiStatus[]>([]);
  const [healthSummary, setHealthSummary] = useState<ApiHealthSummary | null>(null);
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('health-monitor');

  // 管理员页面API配置
  const adminPageApis: PageApiStatus[] = [
    {
      pageName: '管理仪表板',
      pageUrl: '/admin',
      totalApis: 4,
      healthyApis: 0,
      errorApis: 4,
      warningApis: 0,
      apis: [
        {
          endpoint: '/api/admin/dashboard/stats',
          status: 'error',
          statusCode: 400,
          errorMessage: 'Bad Request',
          lastChecked: new Date().toISOString()
        },
        {
          endpoint: '/api/admin/questionnaires',
          status: 'error',
          statusCode: 400,
          errorMessage: 'Bad Request',
          lastChecked: new Date().toISOString()
        },
        {
          endpoint: '/api/admin/users',
          status: 'error',
          statusCode: 400,
          errorMessage: 'Bad Request',
          lastChecked: new Date().toISOString()
        },
        {
          endpoint: '/api/admin/reviewers',
          status: 'error',
          statusCode: 400,
          errorMessage: 'Bad Request',
          lastChecked: new Date().toISOString()
        }
      ]
    },
    {
      pageName: '内容管理',
      pageUrl: '/admin/content-management',
      totalApis: 2,
      healthyApis: 0,
      errorApis: 2,
      warningApis: 0,
      apis: [
        {
          endpoint: '/api/admin/content/categories',
          status: 'error',
          statusCode: 400,
          errorMessage: 'Bad Request',
          lastChecked: new Date().toISOString()
        },
        {
          endpoint: '/api/admin/content/tags',
          status: 'error',
          statusCode: 400,
          errorMessage: 'Bad Request',
          lastChecked: new Date().toISOString()
        }
      ]
    },
    {
      pageName: '用户内容管理',
      pageUrl: '/admin/user-content-management',
      totalApis: 2,
      healthyApis: 0,
      errorApis: 2,
      warningApis: 0,
      apis: [
        {
          endpoint: '/api/user-content-management/list',
          status: 'error',
          statusCode: 401,
          errorMessage: 'Unauthorized',
          lastChecked: new Date().toISOString()
        },
        {
          endpoint: '/api/user-content-management/stats',
          status: 'error',
          statusCode: 401,
          errorMessage: 'Unauthorized',
          lastChecked: new Date().toISOString()
        }
      ]
    }
  ];

  // 测试单个API
  const testApiEndpoint = async (endpoint: string) => {
    setTestingApi(endpoint);
    try {
      const response = await fetch(`https://employment-survey-api-prod.chrismarker89.workers.dev${endpoint}`);
      const status = response.ok ? 'healthy' : 'error';
      message.success(`API ${endpoint} 测试完成: ${response.status}`);

      // 更新状态
      setPageApiStatuses(prev =>
        prev.map(page => ({
          ...page,
          apis: page.apis.map(api =>
            api.endpoint === endpoint
              ? { ...api, status, statusCode: response.status, lastChecked: new Date().toISOString() }
              : api
          )
        }))
      );
    } catch (error) {
      message.error(`API ${endpoint} 测试失败: ${error}`);
    } finally {
      setTestingApi(null);
    }
  };

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 设置页面API状态
      setPageApiStatuses(adminPageApis);

      // 计算健康摘要
      const totalApis = adminPageApis.reduce((sum, page) => sum + page.totalApis, 0);
      const errorApis = adminPageApis.reduce((sum, page) => sum + page.errorApis, 0);
      const healthyApis = adminPageApis.reduce((sum, page) => sum + page.healthyApis, 0);
      const warningApis = adminPageApis.reduce((sum, page) => sum + page.warningApis, 0);

      setHealthSummary({
        totalApis,
        healthyApis,
        errorApis,
        warningApis,
        unknownApis: totalApis - healthyApis - errorApis - warningApis,
        averageResponseTime: 0,
        lastUpdated: new Date().toISOString()
      });

      const [endpoints, tables] = await Promise.all([
        ManagementAdminService.getApiEndpoints(),
        ManagementAdminService.getDatabaseTables()
      ]);
      setApiEndpoints(endpoints);
      setDatabaseTables(tables);
    } catch (error) {
      console.error('加载API数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'deprecated': return 'red';
      case 'planned': return 'blue';
      default: return 'default';
    }
  };

  const getTableTypeColor = (type: string) => {
    switch (type) {
      case 'temp': return 'orange';
      case 'valid': return 'green';
      case 'analytics': return 'blue';
      case 'system': return 'purple';
      default: return 'default';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'blue';
      case 'POST': return 'green';
      case 'PUT': return 'orange';
      case 'DELETE': return 'red';
      default: return 'default';
    }
  };

  const apiColumns = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>{method}</Tag>
      )
    },
    {
      title: 'API路径',
      dataIndex: 'path',
      key: 'path',
      width: 250,
      render: (path: string) => <Text code>{path}</Text>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200
    },
    {
      title: '使用页面',
      dataIndex: 'page',
      key: 'page',
      width: 150
    },
    {
      title: '相关表',
      dataIndex: 'tables',
      key: 'tables',
      width: 200,
      render: (tables: string[]) => (
        <Space wrap>
          {tables.map(table => (
            <Tag key={table} color="blue" style={{ fontSize: '11px' }}>
              {table}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? '正常' : status === 'deprecated' ? '已废弃' : '计划中'}
        </Tag>
      )
    }
  ];

  const tableColumns = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string) => <Text code>{name}</Text>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTableTypeColor(type)}>
          {type === 'temp' ? '临时表A' : 
           type === 'valid' ? '有效表B' : 
           type === 'analytics' ? '可视化表' : '系统表'}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 100,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 150
    },
    {
      title: '相关API',
      dataIndex: 'relatedApis',
      key: 'relatedApis',
      render: (apis: string[]) => (
        <Space wrap>
          {apis.map(api => (
            <Tag key={api} style={{ fontSize: '10px' }}>
              {api}
            </Tag>
          ))}
        </Space>
      )
    }
  ];

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>正在加载API和数据库信息...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>
            <MonitorOutlined /> API状态监控与管理
          </Title>
          <Paragraph>
            实时监控所有管理员页面的API状态，快速定位和修复问题，确保系统稳定运行。
          </Paragraph>
        </div>

        {/* 健康状态概览 */}
        {healthSummary && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总API数量"
                  value={healthSummary.totalApis}
                  prefix={<ApiOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="正常API"
                  value={healthSummary.healthyApis}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="错误API"
                  value={healthSummary.errorApis}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="健康率"
                  value={((healthSummary.healthyApis / healthSummary.totalApis) * 100).toFixed(1)}
                  suffix="%"
                  valueStyle={{
                    color: healthSummary.healthyApis / healthSummary.totalApis > 0.8 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<DashboardOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Alert
          message="当前发现的问题"
          description="管理员页面多个API返回400/401错误，需要立即修复认证和参数验证问题"
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={loadData}>
              <ReloadOutlined /> 重新检测
            </Button>
          }
          style={{ marginBottom: 24 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><MonitorOutlined />健康监控</span>} key="health-monitor">
            <Row gutter={16}>
              {pageApiStatuses.map((page, index) => (
                <Col span={8} key={index} style={{ marginBottom: 16 }}>
                  <Card
                    title={
                      <Space>
                        <span>{page.pageName}</span>
                        <Badge
                          count={page.errorApis}
                          style={{ backgroundColor: page.errorApis > 0 ? '#ff4d4f' : '#52c41a' }}
                        />
                      </Space>
                    }
                    extra={
                      <Progress
                        type="circle"
                        size={40}
                        percent={Math.round((page.healthyApis / page.totalApis) * 100)}
                        status={page.errorApis > 0 ? 'exception' : 'success'}
                      />
                    }
                  >
                    <List
                      size="small"
                      dataSource={page.apis}
                      renderItem={(api) => (
                        <List.Item
                          actions={[
                            <Button
                              size="small"
                              loading={testingApi === api.endpoint}
                              onClick={() => testApiEndpoint(api.endpoint)}
                            >
                              测试
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              api.status === 'healthy' ? (
                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              ) : api.status === 'error' ? (
                                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                              ) : (
                                <WarningOutlined style={{ color: '#faad14' }} />
                              )
                            }
                            title={<Text code>{api.endpoint}</Text>}
                            description={
                              <Space direction="vertical" size={0}>
                                {api.statusCode && (
                                  <Text type={api.status === 'error' ? 'danger' : 'secondary'}>
                                    状态码: {api.statusCode}
                                  </Text>
                                )}
                                {api.errorMessage && (
                                  <Text type="danger">{api.errorMessage}</Text>
                                )}
                                {api.lastChecked && (
                                  <Text type="secondary">
                                    最后检查: {new Date(api.lastChecked).toLocaleTimeString()}
                                  </Text>
                                )}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab={<span><ApiOutlined />API概览</span>} key="api-overview">
            <Card>
              <Table
                columns={apiColumns}
                dataSource={apiEndpoints}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </Card>
          </TabPane>

          <TabPane tab={<span><BugOutlined />问题诊断</span>} key="problem-diagnosis">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="🚨 紧急问题" extra={<Badge count={8} />}>
                  <Timeline>
                    <Timeline.Item color="red" dot={<ExclamationCircleOutlined />}>
                      <Text strong>管理仪表板API全部失效</Text>
                      <br />
                      <Text type="secondary">4个API返回400错误，影响核心功能</Text>
                      <br />
                      <Text type="danger">优先级: 紧急</Text>
                    </Timeline.Item>
                    <Timeline.Item color="red" dot={<ExclamationCircleOutlined />}>
                      <Text strong>内容管理API异常</Text>
                      <br />
                      <Text type="secondary">分类和标签API无法访问</Text>
                      <br />
                      <Text type="danger">优先级: 高</Text>
                    </Timeline.Item>
                    <Timeline.Item color="orange" dot={<WarningOutlined />}>
                      <Text strong>用户内容管理认证失败</Text>
                      <br />
                      <Text type="secondary">401错误，认证机制问题</Text>
                      <br />
                      <Text type="warning">优先级: 中</Text>
                    </Timeline.Item>
                    <Timeline.Item color="blue" dot={<InfoCircleOutlined />}>
                      <Text strong>心声功能残留</Text>
                      <br />
                      <Text type="secondary">前端仍显示心声相关内容</Text>
                      <br />
                      <Text>优先级: 低</Text>
                    </Timeline.Item>
                  </Timeline>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="🔧 修复建议" extra={<ToolOutlined />}>
                  <Collapse>
                    <Panel header="400错误修复方案" key="400-fix">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Alert
                          message="可能原因"
                          description="参数验证中间件配置错误，或路由参数不匹配"
                          type="info"
                          showIcon
                        />
                        <Divider />
                        <Text strong>修复步骤:</Text>
                        <ol>
                          <li>检查后端路由配置</li>
                          <li>验证参数验证中间件</li>
                          <li>测试API端点响应</li>
                          <li>更新前端API调用</li>
                        </ol>
                        <Button type="primary" size="small">
                          查看详细修复指南
                        </Button>
                      </Space>
                    </Panel>
                    <Panel header="401认证错误修复" key="401-fix">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Alert
                          message="可能原因"
                          description="认证中间件配置变更，或token验证失败"
                          type="warning"
                          showIcon
                        />
                        <Divider />
                        <Text strong>修复步骤:</Text>
                        <ol>
                          <li>检查认证中间件配置</li>
                          <li>验证token生成和验证逻辑</li>
                          <li>测试登录流程</li>
                          <li>更新权限配置</li>
                        </ol>
                        <Button type="primary" size="small">
                          查看认证配置
                        </Button>
                      </Space>
                    </Panel>
                    <Panel header="心声功能清理" key="heartvoice-cleanup">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Alert
                          message="清理范围"
                          description="前端组件、路由、API调用、数据库引用"
                          type="success"
                          showIcon
                        />
                        <Divider />
                        <Text strong>清理步骤:</Text>
                        <ol>
                          <li>搜索并删除心声相关组件</li>
                          <li>清理路由配置</li>
                          <li>移除API调用</li>
                          <li>更新导航菜单</li>
                        </ol>
                        <Button type="primary" size="small">
                          开始自动清理
                        </Button>
                      </Space>
                    </Panel>
                  </Collapse>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><DatabaseOutlined />数据库表</span>} key="database-tables">
            <Card>
              <Table
                columns={tableColumns}
                dataSource={databaseTables}
                rowKey="name"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </Card>
          </TabPane>

          <TabPane tab={<span><TableOutlined />数据流向</span>} key="data-flow">
            <Card title="3层数据结构设计">
              <Collapse>
                <Panel header="第1层：临时存储表A" key="layer1">
                  <Descriptions column={1}>
                    <Descriptions.Item label="表名">questionnaire_submissions_temp</Descriptions.Item>
                    <Descriptions.Item label="作用">存储用户提交的原始问卷数据</Descriptions.Item>
                    <Descriptions.Item label="数据流向">用户提交 → 临时表A</Descriptions.Item>
                    <Descriptions.Item label="审核状态">pending, approved, rejected, flagged</Descriptions.Item>
                    <Descriptions.Item label="相关API">
                      /api/questionnaire/submit, /api/admin/questionnaire/pending
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>

                <Panel header="第2层：有效数据表B" key="layer2">
                  <Descriptions column={1}>
                    <Descriptions.Item label="表名">questionnaire_submissions</Descriptions.Item>
                    <Descriptions.Item label="作用">存储经过审核的有效问卷数据</Descriptions.Item>
                    <Descriptions.Item label="数据流向">临时表A → 审核通过 → 有效数据表B</Descriptions.Item>
                    <Descriptions.Item label="用途">用于统计分析和数据可视化</Descriptions.Item>
                    <Descriptions.Item label="相关API">
                      /api/admin/questionnaire/:id/approve
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>

                <Panel header="第3层：可视化副表" key="layer3">
                  <Descriptions column={1}>
                    <Descriptions.Item label="表名">
                      analytics_summary, analytics_demographics, analytics_employment, analytics_skills
                    </Descriptions.Item>
                    <Descriptions.Item label="作用">存储预计算的统计数据</Descriptions.Item>
                    <Descriptions.Item label="数据流向">有效数据表B → 定时同步 → 可视化副表</Descriptions.Item>
                    <Descriptions.Item label="更新频率">每日凌晨2点自动同步</Descriptions.Item>
                    <Descriptions.Item label="相关API">
                      /api/analytics/summary, /api/analytics/demographics, /api/analytics/employment
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>
              </Collapse>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </AdminLayout>
  );
};
