import React from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Avatar, 
  Dropdown, 
  Space,
  Tag,
  Statistic
} from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  ProjectOutlined,
  TeamOutlined,
  BarChartOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import './ProjectsPage.css';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

export const ProjectsPage: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const handleProjectAccess = (projectUrl: string) => {
    window.open(projectUrl, '_blank');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const projects = [
    {
      id: 'employment-survey',
      name: '大学生就业问卷调查平台',
      description: '收集和分析大学生就业情况的综合平台',
      url: 'https://52a6d1fb.college-employment-survey-frontend.pages.dev',
      adminUrl: 'https://52a6d1fb.college-employment-survey-frontend.pages.dev/admin',
      status: 'active',
      stats: {
        users: 1234,
        responses: 856,
        reviews: 234
      }
    },
    // 未来可以添加更多项目
  ];

  const getRoleTag = (role: string) => {
    const roleConfig = {
      super_admin: { color: 'red', text: '超级管理员' },
      admin: { color: 'blue', text: '管理员' },
      reviewer: { color: 'green', text: '审核员' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || { color: 'default', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <Layout className="projects-layout">
      <Header className="projects-header">
        <div className="header-content">
          <div className="header-left">
            <ProjectOutlined className="header-icon" />
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              项目管理中心
            </Title>
          </div>
          
          <div className="header-right">
            <Space>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                欢迎，{user?.name}
              </span>
              {getRoleTag(user?.role || '')}
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />} 
                  style={{ cursor: 'pointer' }}
                />
              </Dropdown>
            </Space>
          </div>
        </div>
      </Header>

      <Content className="projects-content">
        <div className="content-container">
          <div className="page-header">
            <Title level={2}>我的项目</Title>
            <Paragraph type="secondary">
              管理您有权限访问的所有项目
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {projects.map((project) => (
              <Col xs={24} lg={12} xl={8} key={project.id}>
                <Card 
                  className="project-card"
                  hoverable
                  actions={[
                    <Button 
                      type="primary" 
                      icon={<RightOutlined />}
                      onClick={() => handleProjectAccess(project.adminUrl)}
                    >
                      进入管理
                    </Button>,
                    <Button 
                      type="default"
                      onClick={() => handleProjectAccess(project.url)}
                    >
                      查看前端
                    </Button>
                  ]}
                >
                  <div className="project-header">
                    <ProjectOutlined className="project-icon" />
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {project.name}
                      </Title>
                      <Tag color={project.status === 'active' ? 'green' : 'orange'}>
                        {project.status === 'active' ? '运行中' : '维护中'}
                      </Tag>
                    </div>
                  </div>
                  
                  <Paragraph type="secondary" style={{ margin: '16px 0' }}>
                    {project.description}
                  </Paragraph>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="用户数"
                        value={project.stats.users}
                        prefix={<TeamOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="问卷数"
                        value={project.stats.responses}
                        prefix={<BarChartOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="审核数"
                        value={project.stats.reviews}
                        prefix={<UserOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 添加新项目的占位卡片 */}
          <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
            <Col xs={24} lg={12} xl={8}>
              <Card 
                className="add-project-card"
                style={{ 
                  border: '2px dashed #d9d9d9',
                  textAlign: 'center',
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div>
                  <ProjectOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <Title level={4} type="secondary">
                    添加新项目
                  </Title>
                  <Paragraph type="secondary">
                    未来可以在这里添加更多项目
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};
