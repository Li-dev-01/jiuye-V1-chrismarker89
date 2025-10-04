import React from 'react';
import { Layout, Typography, Card, Row, Col, Button, Space, Statistic, Progress, Tag } from 'antd';
import {
  ExperimentOutlined,
  RocketOutlined,
  BarChartOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/SecondQuestionnaire.css';

const { Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export const SecondQuestionnaireHomePage: React.FC = () => {
  // 模拟统计数据
  const stats = {
    totalResponses: 1247,
    completionRate: 89.3,
    averageTime: 12.5,
    userSatisfaction: 9.2
  };

  const features = [
    {
      icon: <ExperimentOutlined style={{ fontSize: '32px', color: '#667eea' }} />,
      title: 'H5对话式体验',
      description: '全新的对话式交互设计，让问卷填写更像聊天一样自然流畅'
    },
    {
      icon: <UserOutlined style={{ fontSize: '32px', color: '#764ba2' }} />,
      title: '差异化群体分析',
      description: '基于应届毕业生、职场新人、资深职场人三大群体的精准分析'
    },
    {
      icon: <BarChartOutlined style={{ fontSize: '32px', color: '#f093fb' }} />,
      title: '智能数据洞察',
      description: 'AI驱动的深度数据分析，提供个性化的就业指导建议'
    }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      
      <Content style={{ padding: '0' }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '80px 24px',
            textAlign: 'center',
            color: '#fff'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <ExperimentOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
            </motion.div>
            
            <Title level={1} style={{ color: '#fff', margin: 0, fontSize: '48px' }}>
              2025智能就业调查
            </Title>
            
            <Title level={2} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'normal', margin: 0 }}>
              第二版 - 基于差异化群体的深度分析
            </Title>
            
            <Paragraph style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '0 auto' }}>
              采用全新H5对话式交互体验，针对不同职业发展阶段提供个性化问题，
              通过AI智能分析为您提供精准的就业指导建议
            </Paragraph>
            
            <Space size="large" style={{ marginTop: '32px' }}>
              <Link to="/questionnaire-v2/survey">
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<RocketOutlined />}
                  style={{ 
                    height: '48px', 
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    borderColor: '#fff',
                    color: '#667eea'
                  }}
                >
                  开始第二问卷
                </Button>
              </Link>
              
              <Link to="/questionnaire-v2/analytics">
                <Button 
                  type="default" 
                  size="large" 
                  icon={<BarChartOutlined />}
                  style={{ 
                    height: '48px', 
                    fontSize: '16px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderColor: '#fff',
                    color: '#fff'
                  }}
                >
                  查看数据分析
                </Button>
              </Link>
            </Space>
          </Space>
        </motion.div>

        {/* Stats Section */}
        <div style={{ padding: '60px 24px', backgroundColor: '#f8f9fa' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Row gutter={[32, 32]}>
              <Col xs={24} sm={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Statistic
                      title="总参与人数"
                      value={stats.totalResponses}
                      prefix={<UserOutlined />}
                      valueStyle={{ color: '#667eea' }}
                    />
                  </Card>
                </motion.div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Statistic
                      title="完成率"
                      value={stats.completionRate}
                      suffix="%"
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </motion.div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Statistic
                      title="平均用时"
                      value={stats.averageTime}
                      suffix="分钟"
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </motion.div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Statistic
                      title="用户满意度"
                      value={stats.userSatisfaction}
                      suffix="/10"
                      prefix={<TrophyOutlined />}
                      valueStyle={{ color: '#eb2f96' }}
                    />
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ textAlign: 'center', marginBottom: '60px' }}
            >
              <Title level={2}>第二问卷的创新特色</Title>
              <Paragraph style={{ fontSize: '16px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
                基于第一问卷的经验积累，我们推出了全新的第二版问卷系统，
                在技术架构、用户体验和数据分析方面都有重大突破
              </Paragraph>
            </motion.div>
            
            <Row gutter={[32, 32]}>
              {features.map((feature, index) => (
                <Col xs={24} md={8} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 * index, duration: 0.6 }}
                  >
                    <Card 
                      style={{ 
                        height: '100%', 
                        textAlign: 'center',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s ease'
                      }}
                      hoverable
                    >
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {feature.icon}
                        <Title level={4}>{feature.title}</Title>
                        <Paragraph style={{ color: '#666' }}>
                          {feature.description}
                        </Paragraph>
                      </Space>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '60px 24px',
            textAlign: 'center',
            color: '#fff'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              准备好体验全新的问卷调查了吗？
            </Title>
            
            <Paragraph style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
              只需10-15分钟，获得专属的就业指导建议
            </Paragraph>
            
            <Link to="/questionnaire-v2/survey">
              <Button 
                type="primary" 
                size="large" 
                icon={<RocketOutlined />}
                style={{ 
                  height: '48px', 
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  borderColor: '#fff',
                  color: '#f5576c'
                }}
              >
                立即开始第二问卷
              </Button>
            </Link>
          </Space>
        </motion.div>
      </Content>
      
    </div>
  );
};

export default SecondQuestionnaireHomePage;
