/**
 * 用户登录历史页面
 * 显示用户的登录记录，帮助识别异常登录
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Alert,
  Button,
  Modal,
  Descriptions,
  Timeline,
  Statistic,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  HistoryOutlined,
  EnvironmentOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  WarningOutlined,
  SafetyOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface LoginRecord {
  id: string;
  loginTime: string;
  ipAddress: string;
  ipCity?: string;
  ipRegion?: string;
  ipCountry?: string;
  deviceType: string;
  browserName: string;
  osName: string;
  loginMethod: string;
  loginStatus: string;
  isSuspicious: boolean;
  riskScore: number;
}

interface LastLoginInfo {
  lastLoginTime: string;
  lastLoginIp: string;
  lastLoginLocation: string;
  lastLoginDevice: string;
  lastLoginMethod: string;
  loginCount: number;
  suspiciousLoginCount: number;
}

export const LoginHistoryPage: React.FC = () => {
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [lastLoginInfo, setLastLoginInfo] = useState<LastLoginInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LoginRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 加载登录历史
  const loadLoginHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/login-history');
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.data.history || []);
        setLastLoginInfo(data.data.lastLogin);
      }
    } catch (error) {
      console.error('Load login history error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoginHistory();
  }, []);

  // 获取设备图标
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <MobileOutlined style={{ color: '#52c41a' }} />;
      case 'tablet':
        return <TabletOutlined style={{ color: '#1890ff' }} />;
      default:
        return <DesktopOutlined style={{ color: '#722ed1' }} />;
    }
  };

  // 获取风险等级颜色
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return 'red';
    if (riskScore >= 40) return 'orange';
    if (riskScore >= 20) return 'yellow';
    return 'green';
  };

  // 获取风险等级文本
  const getRiskText = (riskScore: number) => {
    if (riskScore >= 70) return '高风险';
    if (riskScore >= 40) return '中风险';
    if (riskScore >= 20) return '低风险';
    return '安全';
  };

  // 表格列定义
  const columns: ColumnsType<LoginRecord> = [
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (time: string) => (
        <Space direction="vertical" size="small">
          <Text>{new Date(time).toLocaleDateString()}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(time).toLocaleTimeString()}
          </Text>
        </Space>
      ),
      sorter: (a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: '登录位置',
      key: 'location',
      render: (_, record) => {
        const location = [record.ipCity, record.ipRegion, record.ipCountry]
          .filter(Boolean).join(', ') || '未知位置';
        return (
          <Space>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            <div>
              <div>{location}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.ipAddress}
              </Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: '设备信息',
      key: 'device',
      render: (_, record) => (
        <Space>
          {getDeviceIcon(record.deviceType)}
          <div>
            <div>{record.osName} {record.browserName}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.deviceType}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '登录方式',
      dataIndex: 'loginMethod',
      key: 'loginMethod',
      render: (method: string) => {
        const methodMap: Record<string, { text: string; color: string }> = {
          'ab_combination': { text: 'A+B登录', color: 'blue' },
          'google_oauth': { text: 'Google登录', color: 'green' },
          'google_oauth_admin': { text: 'Google管理员', color: 'purple' },
          'password': { text: '密码登录', color: 'orange' }
        };
        const config = methodMap[method] || { text: method, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '安全状态',
      key: 'security',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag 
            color={record.loginStatus === 'success' ? 'green' : 'red'}
            icon={record.loginStatus === 'success' ? <SafetyOutlined /> : <WarningOutlined />}
          >
            {record.loginStatus === 'success' ? '成功' : '失败'}
          </Tag>
          {record.isSuspicious && (
            <Tag color="red" icon={<WarningOutlined />}>
              可疑
            </Tag>
          )}
          <Tag color={getRiskColor(record.riskScore)}>
            {getRiskText(record.riskScore)}
          </Tag>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRecord(record);
            setDetailModalVisible(true);
          }}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <HistoryOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              登录历史记录
            </Title>
            <Text type="secondary">查看您的账号登录记录，及时发现异常登录</Text>
          </div>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={loadLoginHistory}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* 最后登录信息 */}
      {lastLoginInfo && (
        <Card title="最后登录信息" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="登录时间"
                value={new Date(lastLoginInfo.lastLoginTime).toLocaleString()}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="登录位置"
                value={lastLoginInfo.lastLoginLocation}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="登录设备"
                value={lastLoginInfo.lastLoginDevice}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="总登录次数"
                value={lastLoginInfo.loginCount}
                suffix="次"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
          
          {lastLoginInfo.suspiciousLoginCount > 0 && (
            <Alert
              message="安全提醒"
              description={`检测到 ${lastLoginInfo.suspiciousLoginCount} 次可疑登录，请检查登录记录`}
              type="warning"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </Card>
      )}

      {/* 登录记录表格 */}
      <Card title="详细登录记录">
        <Table
          columns={columns}
          dataSource={loginHistory}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          rowClassName={(record) => record.isSuspicious ? 'suspicious-row' : ''}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="登录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="登录时间">
              {new Date(selectedRecord.loginTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              {selectedRecord.ipAddress}
            </Descriptions.Item>
            <Descriptions.Item label="登录位置">
              {[selectedRecord.ipCity, selectedRecord.ipRegion, selectedRecord.ipCountry]
                .filter(Boolean).join(', ') || '未知位置'}
            </Descriptions.Item>
            <Descriptions.Item label="设备类型">
              <Space>
                {getDeviceIcon(selectedRecord.deviceType)}
                {selectedRecord.deviceType}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="操作系统">
              {selectedRecord.osName}
            </Descriptions.Item>
            <Descriptions.Item label="浏览器">
              {selectedRecord.browserName}
            </Descriptions.Item>
            <Descriptions.Item label="登录方式">
              <Tag color="blue">{selectedRecord.loginMethod}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="登录状态">
              <Tag color={selectedRecord.loginStatus === 'success' ? 'green' : 'red'}>
                {selectedRecord.loginStatus === 'success' ? '成功' : '失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="风险评分">
              <Space>
                <Tag color={getRiskColor(selectedRecord.riskScore)}>
                  {selectedRecord.riskScore}/100
                </Tag>
                <Text type="secondary">({getRiskText(selectedRecord.riskScore)})</Text>
              </Space>
            </Descriptions.Item>
            {selectedRecord.isSuspicious && (
              <Descriptions.Item label="安全警告">
                <Alert
                  message="此次登录被标记为可疑"
                  description="如果这不是您本人的操作，请立即修改密码并联系管理员"
                  type="warning"
                  showIcon
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <style jsx>{`
        .suspicious-row {
          background-color: #fff2f0 !important;
        }
      `}</style>
    </div>
  );
};

export default LoginHistoryPage;
