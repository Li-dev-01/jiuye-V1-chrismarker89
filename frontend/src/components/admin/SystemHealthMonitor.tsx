/**
 * 系统健康监控组件
 * 显示系统各组件的健康状态
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spin, Alert, Descriptions, Progress, Timeline } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  ApiOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { apiClient } from '../../services/api';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: any;
  timestamp: string;
  responseTime?: number;
}

interface SystemHealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
}

const SystemHealthMonitor: React.FC = () => {
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // 获取健康检查报告
  const fetchHealthReport = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/system-health/health/detailed');
      if (response.data.success) {
        setHealthReport(response.data.data);
      }
    } catch (error) {
      console.error('获取健康报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchHealthReport();
  }, []);

  // 自动刷新控制
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealthReport, 30000); // 30秒刷新一次
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'critical':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return <SettingOutlined />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取组件图标
  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'database':
      case 'data_consistency':
        return <DatabaseOutlined />;
      case 'api_endpoints':
        return <ApiOutlined />;
      case 'questionnaire_system':
        return <FileTextOutlined />;
      case 'naming_conventions':
        return <SettingOutlined />;
      default:
        return <SettingOutlined />;
    }
  };

  // 获取组件中文名称
  const getComponentName = (component: string) => {
    const names: Record<string, string> = {
      database: '数据库连接',
      data_consistency: '数据一致性',
      api_endpoints: 'API端点',
      questionnaire_system: '问卷系统',
      naming_conventions: '命名规范'
    };
    return names[component] || component;
  };

  if (!healthReport) {
    return (
      <Card title="系统健康监控" loading={loading}>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>正在加载健康检查报告...</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 总体状态卡片 */}
      <Card 
        title="系统总体状态" 
        extra={
          <div>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={fetchHealthReport}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type={autoRefresh ? 'primary' : 'default'}
              size="small"
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ marginLeft: 8 }}
            >
              {autoRefresh ? '停止自动刷新' : '开启自动刷新'}
            </Button>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          {getStatusIcon(healthReport.overall)}
          <span style={{ marginLeft: 8, fontSize: 18, fontWeight: 'bold' }}>
            {healthReport.overall === 'healthy' ? '系统运行正常' : 
             healthReport.overall === 'warning' ? '系统存在警告' : '系统存在严重问题'}
          </span>
          <Badge 
            color={getStatusColor(healthReport.overall)} 
            text={healthReport.overall.toUpperCase()}
            style={{ marginLeft: 16 }}
          />
        </div>

        <Descriptions column={4} size="small">
          <Descriptions.Item label="检查时间">
            {new Date(healthReport.timestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="总检查项">
            {healthReport.summary.total}
          </Descriptions.Item>
          <Descriptions.Item label="正常">
            <span style={{ color: '#52c41a' }}>{healthReport.summary.healthy}</span>
          </Descriptions.Item>
          <Descriptions.Item label="警告">
            <span style={{ color: '#faad14' }}>{healthReport.summary.warning}</span>
          </Descriptions.Item>
          <Descriptions.Item label="严重">
            <span style={{ color: '#f5222d' }}>{healthReport.summary.critical}</span>
          </Descriptions.Item>
        </Descriptions>

        {/* 健康度进度条 */}
        <div style={{ marginTop: 16 }}>
          <Progress
            percent={Math.round((healthReport.summary.healthy / healthReport.summary.total) * 100)}
            status={healthReport.overall === 'healthy' ? 'success' : 
                   healthReport.overall === 'warning' ? 'active' : 'exception'}
            strokeColor={
              healthReport.overall === 'healthy' ? '#52c41a' :
              healthReport.overall === 'warning' ? '#faad14' : '#f5222d'
            }
          />
        </div>
      </Card>

      {/* 详细检查结果 */}
      <Card title="详细检查结果">
        <Timeline>
          {healthReport.checks.map((check, index) => (
            <Timeline.Item
              key={index}
              dot={getStatusIcon(check.status)}
              color={getStatusColor(check.status)}
            >
              <Card 
                size="small" 
                style={{ marginBottom: 8 }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {getComponentIcon(check.component)}
                    <span style={{ marginLeft: 8 }}>{getComponentName(check.component)}</span>
                    <Badge 
                      color={getStatusColor(check.status)} 
                      text={check.status.toUpperCase()}
                      style={{ marginLeft: 16 }}
                    />
                  </div>
                }
              >
                <p>{check.message}</p>
                
                {check.responseTime && (
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    响应时间: {check.responseTime}ms
                  </p>
                )}

                {check.details && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                      查看详细信息
                    </summary>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginTop: '8px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </details>
                )}
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      {/* 警告和建议 */}
      {healthReport.overall !== 'healthy' && (
        <Card title="建议和操作" style={{ marginTop: 24 }}>
          {healthReport.checks
            .filter(check => check.status !== 'healthy')
            .map((check, index) => (
              <Alert
                key={index}
                type={check.status === 'warning' ? 'warning' : 'error'}
                message={`${getComponentName(check.component)}: ${check.message}`}
                style={{ marginBottom: 8 }}
                showIcon
                action={
                  <Button size="small" type="link">
                    查看解决方案
                  </Button>
                }
              />
            ))}
        </Card>
      )}
    </div>
  );
};

export default SystemHealthMonitor;
