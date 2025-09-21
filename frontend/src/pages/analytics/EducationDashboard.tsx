/**
 * EducationDashboard - 教育管理者仪表板
 * 面向教育管理者，提供专业就业数据和教育质量评估
 */

import React, { useState } from 'react';
import { 
  Typography, Card, Row, Col, Progress, Alert,
  Space, Button, Select, Table, Tag
} from 'antd';
import {
  BookOutlined, TrophyOutlined, StarOutlined,
  WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  DownloadOutlined, ReloadOutlined
} from '@ant-design/icons';
import styles from './EducationDashboard.module.css';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

export const EducationDashboard: React.FC = () => {
  const [academicYear, setAcademicYear] = useState('2024');
  const [universityType, setUniversityType] = useState('all');

  // 专业就业率排行数据
  const majorRankings = [
    { 
      major: '计算机科学与技术', 
      employmentRate: 78.9, 
      avgSalary: 12500, 
      satisfaction: 82.3,
      trend: 'up',
      recommendation: 'expand'
    },
    { 
      major: '软件工程', 
      employmentRate: 76.8, 
      avgSalary: 11800, 
      satisfaction: 80.1,
      trend: 'up',
      recommendation: 'expand'
    },
    { 
      major: '金融学', 
      employmentRate: 67.8, 
      avgSalary: 10200, 
      satisfaction: 75.6,
      trend: 'stable',
      recommendation: 'maintain'
    },
    { 
      major: '临床医学', 
      employmentRate: 89.2, 
      avgSalary: 9800, 
      satisfaction: 88.9,
      trend: 'up',
      recommendation: 'expand'
    },
    { 
      major: '电子信息工程', 
      employmentRate: 72.4, 
      avgSalary: 9500, 
      satisfaction: 77.8,
      trend: 'up',
      recommendation: 'maintain'
    },
    { 
      major: '机械工程', 
      employmentRate: 65.3, 
      avgSalary: 8200, 
      satisfaction: 71.2,
      trend: 'down',
      recommendation: 'reform'
    },
    { 
      major: '英语', 
      employmentRate: 52.1, 
      avgSalary: 6800, 
      satisfaction: 64.5,
      trend: 'down',
      recommendation: 'reform'
    },
    { 
      major: '市场营销', 
      employmentRate: 48.7, 
      avgSalary: 6200, 
      satisfaction: 59.8,
      trend: 'down',
      recommendation: 'reduce'
    },
    { 
      major: '行政管理', 
      employmentRate: 43.2, 
      avgSalary: 5800, 
      satisfaction: 55.4,
      trend: 'down',
      recommendation: 'reduce'
    },
    { 
      major: '艺术设计', 
      employmentRate: 41.8, 
      avgSalary: 5500, 
      satisfaction: 62.1,
      trend: 'stable',
      recommendation: 'reform'
    }
  ];

  // 院校类型对比数据
  const universityComparison = [
    {
      type: '985高校',
      employmentRate: 78.2,
      avgSalary: 13500,
      satisfaction: 81.4,
      skillMatch: 85.6,
      recommendation: '维持优势，加强产学研结合'
    },
    {
      type: '211高校',
      employmentRate: 67.8,
      avgSalary: 10200,
      satisfaction: 75.9,
      skillMatch: 78.3,
      recommendation: '提升实践教学，加强校企合作'
    },
    {
      type: '双一流高校',
      employmentRate: 72.5,
      avgSalary: 11800,
      satisfaction: 78.7,
      skillMatch: 82.1,
      recommendation: '发挥学科优势，深化教学改革'
    },
    {
      type: '普通公办本科',
      employmentRate: 48.8,
      avgSalary: 7800,
      satisfaction: 65.7,
      skillMatch: 62.4,
      recommendation: '重点改革，提升教学质量'
    },
    {
      type: '民办本科',
      employmentRate: 45.2,
      avgSalary: 6900,
      satisfaction: 61.3,
      skillMatch: 58.7,
      recommendation: '加强师资建设，改善教学条件'
    },
    {
      type: '专科院校',
      employmentRate: 42.3,
      avgSalary: 5600,
      satisfaction: 58.9,
      skillMatch: 71.2,
      recommendation: '强化技能培训，对接市场需求'
    }
  ];

  // 技能需求分析（高频技能）
  const skillDemands = [
    { skill: 'Python编程', demand: 89, growth: 15.2, difficulty: 'medium' },
    { skill: '数据分析', demand: 85, growth: 12.8, difficulty: 'medium' },
    { skill: '英语沟通', demand: 78, growth: 3.2, difficulty: 'low' },
    { skill: 'Java开发', demand: 76, growth: 8.9, difficulty: 'high' },
    { skill: '项目管理', demand: 72, growth: 6.7, difficulty: 'medium' },
    { skill: '人工智能', demand: 68, growth: 25.4, difficulty: 'high' },
    { skill: '财务分析', demand: 65, growth: 4.1, difficulty: 'medium' },
    { skill: '市场营销', demand: 62, growth: -2.3, difficulty: 'low' },
    { skill: '设计软件', demand: 58, growth: 1.8, difficulty: 'medium' },
    { skill: '法律知识', demand: 45, growth: -1.2, difficulty: 'high' }
  ];

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'expand': return '#52c41a';
      case 'maintain': return '#1890ff';
      case 'reform': return '#faad14';
      case 'reduce': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'expand': return '扩大招生';
      case 'maintain': return '维持现状';
      case 'reform': return '教学改革';
      case 'reduce': return '减少招生';
      default: return '待评估';
    }
  };

  const renderMajorRankings = () => (
    <Card title="专业就业率排行 - 招生计划调整参考" className={styles.analysisCard}>
      <div className={styles.majorsList}>
        {majorRankings.map((major, index) => (
          <div key={index} className={styles.majorItem}>
            <div className={styles.majorHeader}>
              <div className={styles.majorInfo}>
                <Text strong className={styles.majorRank}>#{index + 1}</Text>
                <Text strong className={styles.majorName}>{major.major}</Text>
                <Tag color={getRecommendationColor(major.recommendation)}>
                  {getRecommendationText(major.recommendation)}
                </Tag>
              </div>
              <div className={styles.majorMetrics}>
                <Text type="secondary">就业率: </Text>
                <Text strong style={{ color: '#1890ff' }}>{major.employmentRate}%</Text>
              </div>
            </div>
            <div className={styles.majorDetails}>
              <div className={styles.metricItem}>
                <Text type="secondary">平均薪资: ¥{major.avgSalary}</Text>
              </div>
              <div className={styles.metricItem}>
                <Text type="secondary">满意度: {major.satisfaction}%</Text>
              </div>
            </div>
            <Progress 
              percent={major.employmentRate} 
              strokeColor={getRecommendationColor(major.recommendation)}
              size="small"
            />
          </div>
        ))}
      </div>
    </Card>
  );

  const renderUniversityComparison = () => (
    <Card title="院校类型对比 - 教育质量评估" className={styles.analysisCard}>
      <div className={styles.universityGrid}>
        {universityComparison.map((uni, index) => (
          <div key={index} className={styles.universityItem}>
            <div className={styles.universityHeader}>
              <Text strong className={styles.universityType}>{uni.type}</Text>
            </div>
            <div className={styles.universityMetrics}>
              <div className={styles.metricRow}>
                <Text type="secondary">就业率</Text>
                <Progress 
                  percent={uni.employmentRate} 
                  size="small" 
                  strokeColor="#1890ff"
                  format={(percent) => `${percent}%`}
                />
              </div>
              <div className={styles.metricRow}>
                <Text type="secondary">平均薪资</Text>
                <Text strong>¥{uni.avgSalary}</Text>
              </div>
              <div className={styles.metricRow}>
                <Text type="secondary">满意度</Text>
                <Text strong>{uni.satisfaction}%</Text>
              </div>
              <div className={styles.metricRow}>
                <Text type="secondary">技能匹配</Text>
                <Text strong>{uni.skillMatch}%</Text>
              </div>
            </div>
            <div className={styles.universityRecommendation}>
              <Text type="secondary" className={styles.recommendationLabel}>改进建议:</Text>
              <Text className={styles.recommendationText}>{uni.recommendation}</Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderSkillDemands = () => (
    <Card title="技能需求分析 - 课程设置指导" className={styles.analysisCard}>
      <div className={styles.skillsList}>
        {skillDemands.map((skill, index) => (
          <div key={index} className={styles.skillItem}>
            <div className={styles.skillHeader}>
              <Text strong>{skill.skill}</Text>
              <Space>
                <Text type="secondary">需求度: {skill.demand}%</Text>
                <Text 
                  style={{ 
                    color: skill.growth > 0 ? '#52c41a' : '#ff4d4f' 
                  }}
                >
                  {skill.growth > 0 ? '+' : ''}{skill.growth}%
                </Text>
                <Tag color={
                  skill.difficulty === 'high' ? 'red' :
                  skill.difficulty === 'medium' ? 'orange' : 'green'
                }>
                  {skill.difficulty === 'high' ? '高难度' :
                   skill.difficulty === 'medium' ? '中难度' : '低难度'}
                </Tag>
              </Space>
            </div>
            <Progress 
              percent={skill.demand} 
              strokeColor={skill.growth > 0 ? '#52c41a' : '#ff4d4f'}
              size="small"
            />
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Title level={1} className={styles.title}>
              教育管理者仪表板
            </Title>
            <Paragraph className={styles.subtitle}>
              专业就业数据分析，为教育改革和专业设置提供决策支撑
            </Paragraph>
          </div>
          
          <div className={styles.controls}>
            <Space size="middle">
              <Select value={academicYear} onChange={setAcademicYear} style={{ width: 120 }}>
                <Option value="2024">2024届</Option>
                <Option value="2023">2023届</Option>
                <Option value="2022">2022届</Option>
              </Select>
              <Select value={universityType} onChange={setUniversityType} style={{ width: 120 }}>
                <Option value="all">全部院校</Option>
                <Option value="985">985高校</Option>
                <Option value="211">211高校</Option>
                <Option value="regular">普通本科</Option>
              </Select>
              <Button icon={<ReloadOutlined />}>刷新</Button>
              <Button icon={<DownloadOutlined />} type="primary">教育报告</Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 教育改革建议 */}
      <div className={styles.analysisSection}>
        <Alert
          message="教育改革建议"
          description="基于就业数据分析：1) 计算机、医学等专业可适度扩招；2) 传统文科专业需要教学改革，增强实践性；3) 加强Python、数据分析等热门技能的课程设置；4) 普通本科院校需重点提升教学质量。"
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            {renderMajorRankings()}
          </Col>
          <Col xs={24} lg={10}>
            {renderSkillDemands()}
          </Col>
          <Col xs={24}>
            {renderUniversityComparison()}
          </Col>
        </Row>
      </div>
    </div>
  );
};
