/**
 * AnalyticsNavigationPage - 可视化页面导航
 * 提供所有社会角色视角页面的快速导航
 */

import React from 'react';
import { Card, Row, Col, Button, Typography, Space, Divider } from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  BankOutlined,
  ExperimentOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './AnalyticsNavigationPage.module.css';

const { Title, Paragraph } = Typography;

interface RoleCard {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const roleCards: RoleCard[] = [

  {
    key: 'unified',
    title: '统一可视化中心',
    description: '包含所有角色视角的综合页面，使用Tab切换不同视角',
    icon: <BarChartOutlined />,
    path: '/analytics',
    color: '#1890ff'
  },
  {
    key: 'public',
    title: '公众视角',
    description: '面向媒体记者和公众的社会关注数据，展示就业热点问题',
    icon: <TeamOutlined />,
    path: '/analytics?tab=public',
    color: '#f5222d'
  },
  {
    key: 'education',
    title: '教育部门',
    description: '面向教育管理者的专业就业数据，支持教育决策制定',
    icon: <BookOutlined />,
    path: '/analytics?tab=education',
    color: '#52c41a'
  },
  {
    key: 'student',
    title: '学生家长',
    description: '面向学生和家长的专业选择指导，提供就业前景分析',
    icon: <UserOutlined />,
    path: '/analytics?tab=student',
    color: '#faad14'
  },
  {
    key: 'policy',
    title: '政策制定',
    description: '面向政策制定者的决策支持数据，助力就业政策优化',
    icon: <BankOutlined />,
    path: '/analytics?tab=policy',
    color: '#722ed1'
  },
  {
    key: 'realistic',
    title: '现实分析',
    description: '基于真实数据的深度分析，揭示就业市场真实状况',
    icon: <ExperimentOutlined />,
    path: '/analytics?tab=realistic',
    color: '#13c2c2'
  }
];

export const AnalyticsNavigationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const renderRoleCard = (role: RoleCard) => (
    <Col xs={24} sm={12} lg={8} key={role.key}>
      <Card
        className={styles.roleCard}
        hoverable
        onClick={() => handleNavigate(role.path)}
        style={{ borderColor: role.color }}
      >
        <div className={styles.cardContent}>
          <div className={styles.iconSection} style={{ color: role.color }}>
            {role.icon}
          </div>
          <div className={styles.textSection}>
            <Title level={4} style={{ color: role.color, marginBottom: 8 }}>
              {role.title}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {role.description}
            </Paragraph>
            <Button 
              type="primary" 
              icon={<RightOutlined />}
              style={{ backgroundColor: role.color, borderColor: role.color }}
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate(role.path);
              }}
            >
              进入页面
            </Button>
          </div>
        </div>
      </Card>
    </Col>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={1}>
          <BarChartOutlined /> 数据可视化导航中心
        </Title>
        <Paragraph>
          选择不同的社会角色视角，查看针对性的就业数据分析。每个视角都为特定用户群体提供定制化的数据展示和洞察。
        </Paragraph>
      </div>

      <Divider />

      <div className={styles.cardsSection}>
        <Row gutter={[24, 24]}>
          {roleCards.map(renderRoleCard)}
        </Row>
      </div>

      <Divider />

      <div className={styles.footer}>
        <Space direction="vertical" align="center">
          <Paragraph type="secondary">
            💡 提示：每个角色视角都基于相同的数据源，但展示方式和重点分析维度不同
          </Paragraph>
          <Paragraph type="secondary">
            🔄 您可以随时在不同视角之间切换，探索多维度的数据洞察
          </Paragraph>
        </Space>
      </div>
    </div>
  );
};

export default AnalyticsNavigationPage;
