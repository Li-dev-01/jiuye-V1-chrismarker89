import React, { useState } from 'react';
import { Layout, Menu, Typography, Card } from 'antd';
import { 
  FileImageOutlined, 
  SettingOutlined,
  DashboardOutlined 
} from '@ant-design/icons';
import PngCacheManager from '../components/admin/PngCacheManager';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

type MenuKey = 'dashboard' | 'png-cache' | 'settings';

const Admin: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<MenuKey>('png-cache');

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: 'png-cache',
      icon: <FileImageOutlined />,
      label: 'PNG缓存管理',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'png-cache':
        return <PngCacheManager />;
      case 'dashboard':
        return (
          <Card>
            <Title level={3}>系统仪表板</Title>
            <p>这里可以显示系统统计信息...</p>
          </Card>
        );
      case 'settings':
        return (
          <Card>
            <Title level={3}>系统设置</Title>
            <p>这里可以配置系统参数...</p>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Title level={3} style={{ margin: '16px 0', color: '#1890ff' }}>
          就业调研系统 - 管理后台
        </Title>
      </Header>
      
      <Layout>
        <Sider 
          width={200} 
          style={{ background: '#fff' }}
          breakpoint="lg"
          collapsedWidth="0"
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key as MenuKey)}
          />
        </Sider>
        
        <Layout style={{ padding: '0' }}>
          <Content style={{ 
            background: '#f0f2f5',
            minHeight: 280,
            overflow: 'auto'
          }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Admin;
