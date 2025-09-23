/**
 * 超级管理员设置页面
 * 集成防爬虫、内容缓存、系统监控等高级功能
 */

import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Card,
  Typography,
  Space,
  Button,
  Alert,
  Statistic,
  Row,
  Col,
  Badge,
  Divider
} from 'antd';
import {
  SettingOutlined,
  ShieldCheckOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  BellOutlined,
  UserOutlined,
  GlobalOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { AntiCrawlerSettings } from '../../components/admin/AntiCrawlerSettings';
import { ContentCacheSettings } from '../../components/admin/ContentCacheSettings';

const { Title, Paragraph } = Typography;
const { Sider, Content } = Layout;

type SettingSection = 'overview' | 'anti-crawler' | 'content-cache' | 'system-monitor' | 'user-management' | 'cloudflare';

export const SuperAdminSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingSection>('overview');

  // 系统状态数据
  const systemStatus = {
    totalUsers: 15420,
    activeUsers: 1250,
    totalRequests: 45680,
    blockedRequests: 234,
    cacheHitRate: 78.5,
    averageResponseTime: 245,
    systemHealth: 95.2,
    securityLevel: 'high'
  };

  // 菜单项配置
  const menuItems = [
    {
      key: 'overview',
      icon: <LineChartOutlined />,
      label: '系统概览',
      badge: null
    },
    {
      key: 'anti-crawler',
      icon: <ShieldCheckOutlined />,
      label: '防爬虫设置',
      badge: systemStatus.blockedRequests > 100 ? 'warning' : null
    },
    {
      key: 'content-cache',
      icon: <DatabaseOutlined />,
      label: '内容缓存',
      badge: systemStatus.cacheHitRate < 70 ? 'error' : null
    },
    {
      key: 'system-monitor',
      icon: <LineChartOutlined />,
      label: '系统监控',
      badge: systemStatus.systemHealth < 90 ? 'warning' : null
    },
    {
      key: 'user-management',
      icon: <UserOutlined />,
      label: '用户管理',
      badge: null
    },
    {
      key: 'cloudflare',
      icon: <GlobalOutlined />,
      label: 'Cloudflare集成',
      badge: null
    }
  ];

  // 渲染菜单项
  const renderMenuItem = (item: typeof menuItems[0]) => {
    const menuItem = (
      <span>
        {item.icon}
        <span>{item.label}</span>
      </span>
    );

    if (item.badge) {
      return (
        <Badge status={item.badge as any} offset={[10, 0]}>
          {menuItem}
        </Badge>
      );
    }

    return menuItem;
  };

  // 渲染系统概览
  const renderOverview = () => (
    <div>
      <Title level={3}>
        <LineChartOutlined /> 系统概览
      </Title>
      <Paragraph type="secondary">
        实时监控系统运行状态，掌握平台整体健康度
      </Paragraph>

      {/* 系统健康状态 */}
      <Card title="系统健康状态" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="系统健康度"
                value={systemStatus.systemHealth}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: systemStatus.systemHealth > 95 ? '#3f8600' : 
                         systemStatus.systemHealth > 85 ? '#faad14' : '#cf1322' 
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="安全等级"
                value={systemStatus.securityLevel}
                formatter={(value) => (
                  <span style={{ color: value === 'high' ? '#3f8600' : '#cf1322' }}>
                    {value === 'high' ? '高' : value === 'medium' ? '中' : '低'}
                  </span>
                )}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="平均响应时间"
                value={systemStatus.averageResponseTime}
                suffix="ms"
                valueStyle={{ 
                  color: systemStatus.averageResponseTime < 300 ? '#3f8600' : '#cf1322' 
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="缓存命中率"
                value={systemStatus.cacheHitRate}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: systemStatus.cacheHitRate > 80 ? '#3f8600' : '#cf1322' 
                }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 用户统计 */}
      <Card title="用户统计" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="总用户数"
              value={systemStatus.totalUsers}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="活跃用户"
              value={systemStatus.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 安全统计 */}
      <Card title="安全统计" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="总请求数"
              value={systemStatus.totalRequests}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="已阻止请求"
              value={systemStatus.blockedRequests}
              prefix={<ShieldCheckOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 系统警告 */}
      <Card title="系统警告">
        <Space direction="vertical" style={{ width: '100%' }}>
          {systemStatus.blockedRequests > 100 && (
            <Alert
              message="检测到大量可疑请求"
              description={`已阻止 ${systemStatus.blockedRequests} 个可疑请求，建议检查防爬虫设置`}
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => setActiveSection('anti-crawler')}>
                  查看设置
                </Button>
              }
            />
          )}
          
          {systemStatus.cacheHitRate < 70 && (
            <Alert
              message="缓存命中率偏低"
              description={`当前缓存命中率为 ${systemStatus.cacheHitRate}%，建议优化缓存策略`}
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => setActiveSection('content-cache')}>
                  优化缓存
                </Button>
              }
            />
          )}
          
          {systemStatus.averageResponseTime > 500 && (
            <Alert
              message="响应时间较长"
              description={`平均响应时间为 ${systemStatus.averageResponseTime}ms，建议检查系统性能`}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={() => setActiveSection('system-monitor')}>
                  查看监控
                </Button>
              }
            />
          )}
          
          {systemStatus.systemHealth > 95 && systemStatus.securityLevel === 'high' && (
            <Alert
              message="系统运行良好"
              description="所有指标正常，系统运行稳定"
              type="success"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );

  // 渲染系统监控
  const renderSystemMonitor = () => (
    <div>
      <Title level={3}>
        <LineChartOutlined /> 系统监控
      </Title>
      <Paragraph type="secondary">
        实时监控系统性能指标和资源使用情况
      </Paragraph>
      
      <Alert
        message="功能开发中"
        description="系统监控功能正在开发中，将包括CPU使用率、内存使用、网络流量等实时监控"
        type="info"
        showIcon
      />
    </div>
  );

  // 渲染用户管理
  const renderUserManagement = () => (
    <div>
      <Title level={3}>
        <UserOutlined /> 用户管理
      </Title>
      <Paragraph type="secondary">
        管理用户账户、权限和访问控制
      </Paragraph>
      
      <Alert
        message="功能开发中"
        description="用户管理功能正在开发中，将包括用户列表、权限管理、访问日志等"
        type="info"
        showIcon
      />
    </div>
  );

  // 渲染Cloudflare集成
  const renderCloudflareIntegration = () => (
    <div>
      <Title level={3}>
        <GlobalOutlined /> Cloudflare集成
      </Title>
      <Paragraph type="secondary">
        配置Cloudflare服务集成，包括CDN、安全防护等
      </Paragraph>
      
      <Alert
        message="功能开发中"
        description="Cloudflare集成功能正在开发中，将包括Bot Management、Analytics、Cache等配置"
        type="info"
        showIcon
      />
    </div>
  );

  // 渲染内容区域
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'anti-crawler':
        return <AntiCrawlerSettings />;
      case 'content-cache':
        return <ContentCacheSettings />;
      case 'system-monitor':
        return renderSystemMonitor();
      case 'user-management':
        return renderUserManagement();
      case 'cloudflare':
        return renderCloudflareIntegration();
      default:
        return renderOverview();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Sider width={250} theme="light" style={{ background: '#fff' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0 }}>
            <SettingOutlined /> 超级管理员
          </Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[activeSection]}
          style={{ borderRight: 0, height: 'calc(100vh - 80px)' }}
          onClick={({ key }) => setActiveSection(key as SettingSection)}
        >
          {menuItems.map(item => (
            <Menu.Item key={item.key}>
              {renderMenuItem(item)}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      
      <Layout style={{ background: '#f0f2f5' }}>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};
