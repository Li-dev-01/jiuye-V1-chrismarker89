/**
 * 首页主要内容区域
 * 复现原项目的布局风格和视觉设计
 */

import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import { Link } from 'react-router-dom';
import {
  FileTextOutlined,
  BarChartOutlined,
  BookOutlined,
  RightOutlined
} from '@ant-design/icons';
import styles from './HeroSection.module.css';

const { Title, Paragraph } = Typography;

export const HeroSection: React.FC = () => {

  return (
    <div className={styles.heroSection}>



      {/* 功能模块卡片区域 */}
      <div className={styles.featuresSection}>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={24} md={8}>
            <Card
              className={styles.featureCard}
              hoverable
              variant="borderless"
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <FileTextOutlined />
                </div>
                <Title level={4} className={styles.cardTitle}>
                  结构化问卷
                </Title>
                <Paragraph className={styles.cardDescription}>
                  六大分类页面，涵盖个人基本信息、就业情况、工作经历、失业状况、转行反思、建议反馈等方面。
                </Paragraph>
                <Link to="/questionnaire" className={styles.cardLink}>
                  开始填写 <RightOutlined />
                </Link>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <Card
              className={styles.featureCard}
              hoverable
              variant="borderless"
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <BarChartOutlined />
                </div>
                <Title level={4} className={styles.cardTitle}>
                  数据可视化
                </Title>
                <Paragraph className={styles.cardDescription}>
                  展示信息统计、功能、地域、问卷整体学生人群画像，支持筛选整理，关键更新。
                </Paragraph>
                <Link to="/analytics" className={styles.cardLink}>
                  查看数据 <RightOutlined />
                </Link>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <Card
              className={styles.featureCard}
              hoverable
              variant="borderless"
            >
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <BookOutlined />
                </div>
                <Title level={4} className={styles.cardTitle}>
                  故事墙
                </Title>
                <Paragraph className={styles.cardDescription}>
                  匿名分享就业经历，支持点赞/点踩，提供情感共鸣，不开放评论，仅供自动。
                </Paragraph>
                <Link to="/stories" className={styles.cardLink}>
                  浏览故事 <RightOutlined />
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>


    </div>
  );
};
