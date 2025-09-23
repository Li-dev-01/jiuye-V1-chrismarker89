import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Modal,
  message,
  Progress,
  Badge
} from 'antd';
import {
  DatabaseOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import styles from './DatabaseMonitorPage.module.css';

const { Title, Text } = Typography;

// 数据类型定义
interface DataFlowStatus {
  stage: string;
  tableName: string;
  recordCount: number;
  lastUpdate: string;
  status: 'healthy' | 'warning' | 'error';
  processingTime: number;
  errorMessage?: string;
}

interface TableHealthData {
  tableName: string;
  recordCount: number;
  qualityScore: number;
  lastUpdate: string;
  growthRate: number;
  issues: string[];
  status: 'healthy' | 'warning' | 'error';
}

interface DatabaseTable {
  name: string;
  type: string;
  description: string;
  fields: string[];
  primaryKey: string;
  foreignKeys: Array<{ field: string; references: string }>;
  indexes: string[];
  recordCount: number;
  status: string;
  relatedApis: string[];
  dataFlow: {
    inputs: string[];
    outputs: string[];
  };
}

interface DataFlowRelation {
  from: string;
  to: string;
  type: string;
  description: string;
  frequency: string;
  status: string;
}

interface SyncTask {
  taskId: string;
  taskName: string;
  sourceTable: string;
  targetTable: string;
  lastRun: string;
  nextRun: string;
  status: string;
  duration: number;
  recordsProcessed: number;
  errorMessage?: string;
}

interface Alert {
  id: number;
  level: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const DatabaseMonitorPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [dataFlowStatus, setDataFlowStatus] = useState<DataFlowStatus[]>([]);
  const [tableHealthData, setTableHealthData] = useState<TableHealthData[]>([]);
  const [syncTasks, setSyncTasks] = useState<SyncTask[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [dataFlowRelations, setDataFlowRelations] = useState<DataFlowRelation[]>([]);

  // 加载监控数据
  useEffect(() => {
    loadMonitoringData();
    // 设置定时刷新
    const interval = setInterval(loadMonitoringData, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // 调用真实API获取数据库监控数据
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/database/monitor`);
      
      if (response.ok) {
        const data = await response.json();
        setDataFlowStatus(data.dataFlowStatus || []);
        setTableHealthData(data.tableHealthData || []);
        setSyncTasks(data.syncTasks || []);
        setAlerts(data.alerts || []);
        setDatabaseTables(data.databaseTables || []);
        setDataFlowRelations(data.dataFlowRelations || []);
      } else {
        // API未配置时显示空数据
        setDataFlowStatus([]);
        setTableHealthData([]);
        setSyncTasks([]);
        setAlerts([]);
        setDatabaseTables([]);
        setDataFlowRelations([]);
      }
    } catch (error) {
      console.error('加载数据库监控数据失败:', error);
      setDataFlowStatus([]);
      setTableHealthData([]);
      setSyncTasks([]);
      setAlerts([]);
      setDatabaseTables([]);
      setDataFlowRelations([]);
    } finally {
      setLoading(false);
    }
  };

  // 手动触发同步
  const handleManualSync = async (taskId: string) => {
    Modal.confirm({
      title: '确认手动同步',
      content: '确定要手动触发此同步任务吗？',
      onOk: async () => {
        try {
          // 调用API触发同步
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/database/sync/${taskId}`, {
            method: 'POST'
          });
          
          if (response.ok) {
            message.success('同步任务已触发');
            // 刷新数据
            await loadMonitoringData();
          } else {
            message.error('触发同步失败');
          }
        } catch (error) {
          console.error('触发同步失败:', error);
          message.error('触发同步失败');
        }
      }
    });
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      healthy: { color: 'green', icon: <CheckCircleOutlined /> },
      warning: { color: 'orange', icon: <ExclamationCircleOutlined /> },
      error: { color: 'red', icon: <CloseCircleOutlined /> },
      active: { color: 'blue', icon: <CheckCircleOutlined /> },
      running: { color: 'processing', icon: <SyncOutlined spin /> },
      success: { color: 'green', icon: <CheckCircleOutlined /> },
      failed: { color: 'red', icon: <CloseCircleOutlined /> }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', icon: null };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  // 数据流状态表格列
  const dataFlowColumns = [
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '处理时间(ms)',
      dataIndex: 'processingTime',
      key: 'processingTime',
    }
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>
            <DatabaseOutlined /> 数据库监控
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadMonitoringData}>
              刷新
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setConfigModalVisible(true)}>
              配置
            </Button>
          </Space>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
            <Text>加载监控数据中...</Text>
          </div>
        ) : (
          <>
            {/* 告警信息 */}
            {alerts.length > 0 && (
              <Alert
                message="系统告警"
                description={`当前有 ${alerts.filter(a => !a.resolved).length} 个未解决的告警`}
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {/* 数据流状态 */}
            <Card title="数据流转状态" style={{ marginBottom: 24 }}>
              <Table
                dataSource={dataFlowStatus}
                columns={dataFlowColumns}
                rowKey="tableName"
                pagination={false}
                size="small"
              />
            </Card>

            {/* 空状态提示 */}
            {dataFlowStatus.length === 0 && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <DatabaseOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <Title level={4} type="secondary">数据库监控API未配置</Title>
                  <Text type="secondary">请联系管理员配置数据库监控API</Text>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};
