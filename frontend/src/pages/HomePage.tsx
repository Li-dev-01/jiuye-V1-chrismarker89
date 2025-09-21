/**
 * 首页组件 - 简化版
 * 包含：项目介绍、统计数据、核心功能入口、行动号召
 */

import React, { useCallback } from 'react';
import { Card, Typography, Button, Row, Col } from 'antd';
import {
  FileTextOutlined,
  BookOutlined,
  BarChartOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { HomeStatsSection } from '../components/home/HomeStatsSection';
import styles from './HomePage.module.css';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // 核心功能入口（精简到3个主要功能）
  const coreFeatures = [
    {
      icon: <FileTextOutlined />,
    title: '结构化问卷',
    description: '六大分类页面，涵盖个人基本信息、就业情况、工作经历等方面',
    path: '/questionnaire',
    buttonText: '开始填写'
    },
    {
      icon: <BarChartOutlined />,
    title: '数据可视化',
    description: '展示信息统计、功能、地域、问卷整体学生人群画像',
    path: '/analytics',
    buttonText: '查看数据'
    },
    {
      icon: <BookOutlined />,
    title: '故事墙',
    description: '匿名分享就业经历，支持点赞互动，提供情感共鸣',
    path: '/stories',
    buttonText: '浏览故事'
    }
  ];

  // 使用 useCallback 优化性能
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className={styles.homePage}>
      {/* 项目介绍区域 */}
      <div className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <Title level={1} className={styles.heroTitle}>
              大学生就业问卷调查
            </Title>
            <Paragraph className={styles.heroDescription}>
              全方位的就业调研和分享平台，助力大学生职业发展。
              通过结构化问卷收集就业数据，分享真实故事，提供数据洞察。
            </Paragraph>
          </div>
        </div>
      </div>

      {/* 统计数据展示 */}
      <div className={styles.statsSection}>
        <div className={styles.container}>
          <HomeStatsSection showRefreshButton={false} autoRefresh={true} />
        </div>
      </div>

      {/* 核心功能入口 */}
      <div className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <Title level={2} className={styles.sectionTitle}>
              主要功能
            </Title>
            <Paragraph className={styles.sectionDescription}>
              选择您感兴趣的功能，开始您的就业调研之旅
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} justify="center">
            {coreFeatures.map((feature, index) => (
              <Col xs={24} sm={24} md={8} key={index}>
                <Card
                  hoverable
                  className={styles.featureCard}
                  onClick={() => handleNavigate(feature.path)}
                >
                  <div className={styles.featureCardContent}>
                    <div className={styles.featureIcon}>
                      {feature.icon}
                    </div>
                    <Title level={4} className={styles.featureTitle}>
                      {feature.title}
                    </Title>
                    <Paragraph className={styles.featureDescription}>
                      {feature.description}
                    </Paragraph>
                    <div className={styles.featureAction}>
                      <span className={styles.actionText}>
                        {feature.buttonText}
                      </span>
                      <RightOutlined className={styles.actionIcon} />
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* 精简行动号召 */}
      <div className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <Title level={3} className={styles.ctaTitle}>
              开始您的就业调研之旅
            </Title>
            <Paragraph className={styles.ctaDescription}>
              加入我们，分享您的就业经历，获得有价值的职业洞察
            </Paragraph>
            <div className={styles.ctaButtons}>
              <Button
                type="primary"
                size="large"
                onClick={() => handleNavigate('/questionnaire')}
                className={styles.primaryButton}
              >
                开始问卷调查
              </Button>
              <Button
                size="large"
                onClick={() => handleNavigate('/analytics')}
                className={styles.secondaryButton}
              >
                查看数据分析
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
