import React from 'react';
import { Card, Button, Typography, Space, Tag, Avatar } from 'antd';
import { 
  UserOutlined, 
  CrownOutlined, 
  SafetyCertificateOutlined,
  RightOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import './ProjectSelection.css';

const { Title, Text } = Typography;

interface ProjectSelectionProps {
  userEmail: string;
  userRole: string;
  onRoleSelect: (role: string) => void;
}

const ProjectSelection: React.FC<ProjectSelectionProps> = ({ 
  userEmail, 
  userRole, 
  onRoleSelect 
}) => {
  const projects = [
    {
      id: 'college-employment-survey',
      name: '大学生就业调研项目',
      description: '2025年大学生就业状况调研与数据分析平台',
      url: 'college-employment-survey-frontend.pages.dev',
      status: 'active',
      participants: 1250,
      lastUpdate: '2025-08-13'
    }
  ];

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          icon: <CrownOutlined />,
          color: '#ff4d4f',
          label: '超级管理员',
          description: '拥有所有权限，可管理系统设置'
        };
      case 'admin':
        return {
          icon: <SafetyCertificateOutlined />,
          color: '#1890ff',
          label: '管理员',
          description: '项目管理、用户管理、数据分析'
        };
      case 'reviewer':
        return {
          icon: <UserOutlined />,
          color: '#52c41a',
          label: '审核员',
          description: '内容审核、数据验证'
        };
      default:
        return {
          icon: <UserOutlined />,
          color: '#666',
          label: '用户',
          description: '基础权限'
        };
    }
  };

  const availableRoles = ['reviewer', 'admin', 'super_admin'].filter(role => {
    // 根据用户的最高权限决定可选角色
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin') return role !== 'super_admin';
    if (userRole === 'reviewer') return role === 'reviewer';
    return false;
  });

  const handleRoleSelect = (selectedRole: string) => {
    const project = projects[0];
    const targetUrl = `https://${project.url}/auth/auto-login?role=${selectedRole}&email=${encodeURIComponent(userEmail)}`;
    
    // 调用回调函数
    onRoleSelect(selectedRole);
    
    // 跳转到目标项目
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="project-selection-container">
      <div className="user-info">
        <Avatar size={48} icon={<UserOutlined />} />
        <div className="user-details">
          <Title level={4}>{userEmail}</Title>
          <Tag color={getRoleConfig(userRole).color}>
            {getRoleConfig(userRole).icon}
            <span style={{ marginLeft: 4 }}>{getRoleConfig(userRole).label}</span>
          </Tag>
        </div>
      </div>

      <div className="projects-section">
        <Title level={3}>
          <ProjectOutlined style={{ marginRight: 8 }} />
          选择项目和角色
        </Title>
        
        {projects.map(project => (
          <Card 
            key={project.id}
            className="project-card"
            title={
              <div className="project-header">
                <div>
                  <Title level={4} style={{ margin: 0 }}>{project.name}</Title>
                  <Text type="secondary">{project.description}</Text>
                </div>
                <Tag color="green">运行中</Tag>
              </div>
            }
          >
            <div className="project-info">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div className="project-stats">
                  <Text>
                    <strong>访问地址：</strong> 
                    <Text code>{project.url}</Text>
                  </Text>
                  <Text>
                    <strong>参与人数：</strong> {project.participants.toLocaleString()}
                  </Text>
                  <Text>
                    <strong>最后更新：</strong> {project.lastUpdate}
                  </Text>
                </div>

                <div className="role-selection">
                  <Title level={5}>选择登录角色：</Title>
                  <Space wrap>
                    {availableRoles.map(role => {
                      const config = getRoleConfig(role);
                      return (
                        <Button
                          key={role}
                          type="primary"
                          size="large"
                          icon={config.icon}
                          onClick={() => handleRoleSelect(role)}
                          className="role-button"
                          style={{ 
                            backgroundColor: config.color,
                            borderColor: config.color 
                          }}
                        >
                          <div className="role-content">
                            <div className="role-label">{config.label}</div>
                            <div className="role-description">{config.description}</div>
                          </div>
                          <RightOutlined />
                        </Button>
                      );
                    })}
                  </Space>
                </div>
              </Space>
            </div>
          </Card>
        ))}
      </div>

      <div className="footer-info">
        <Text type="secondary">
          点击角色按钮将自动登录到对应项目的管理界面
        </Text>
      </div>
    </div>
  );
};

export default ProjectSelection;
