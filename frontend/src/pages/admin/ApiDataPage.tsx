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
  Spin
} from 'antd';
import { 
  ApiOutlined, 
  DatabaseOutlined, 
  TableOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
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
}

interface DatabaseTable {
  name: string;
  type: 'temp' | 'valid' | 'analytics' | 'system';
  description: string;
  recordCount?: number;
  lastUpdated?: string;
  relatedApis: string[];
}

export const ApiDataPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
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
            <ApiOutlined /> API与数据库对应关系
          </Title>
          <Paragraph>
            本页面展示了系统中所有API接口与数据库表的对应关系，方便开发调试和问题排查。
          </Paragraph>
        </div>

        <Alert
          message="数据流向说明"
          description="用户提交数据 → 临时表A → 审核 → 有效数据表B → 定时同步 → 可视化副表"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Tabs defaultActiveKey="api-overview">
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
