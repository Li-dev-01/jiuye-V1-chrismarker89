/**
 * StudentParentDashboard - 学生家长仪表板
 * 面向学生和家长，提供专业选择指导和就业前景分析
 */

import React, { useState } from 'react';
import { 
  Typography, Card, Row, Col, Progress, Alert, Statistic,
  Space, Button, Select, Tag, Divider, Input, Tooltip
} from 'antd';
import {
  BookOutlined, DollarOutlined, TrophyOutlined, StarOutlined,
  SearchOutlined, HeartOutlined, SafetyOutlined, RocketOutlined,
  BulbOutlined, TeamOutlined, EnvironmentOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import styles from './StudentParentDashboard.module.css';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export const StudentParentDashboard: React.FC = () => {
  const [selectedMajor, setSelectedMajor] = useState('计算机科学与技术');
  const [viewMode, setViewMode] = useState('student'); // student | parent

  // 专业详细分析数据
  const majorAnalysis = {
    '计算机科学与技术': {
      employmentRate: 78.9,
      avgSalary: 12500,
      satisfaction: 82.3,
      stability: 85.6,
      growth: 15.2,
      difficulty: 'high',
      investment: 'high',
      roi: 'excellent',
      hotSkills: ['Python', 'Java', 'React', '数据结构', '算法'],
      careerPaths: ['软件工程师', '算法工程师', '产品经理', '技术总监'],
      topCompanies: ['腾讯', '阿里巴巴', '字节跳动', '华为', '百度'],
      regions: [
        { city: '深圳', jobs: 1234, avgSalary: 15000 },
        { city: '北京', jobs: 1156, avgSalary: 14500 },
        { city: '上海', jobs: 1089, avgSalary: 14000 },
        { city: '杭州', jobs: 876, avgSalary: 13000 }
      ]
    },
    '金融学': {
      employmentRate: 67.8,
      avgSalary: 10200,
      satisfaction: 75.6,
      stability: 72.4,
      growth: 3.8,
      difficulty: 'medium',
      investment: 'medium',
      roi: 'good',
      hotSkills: ['财务分析', 'Excel', '风险管理', '投资分析', 'CFA'],
      careerPaths: ['投资顾问', '风险分析师', '银行客户经理', '保险精算师'],
      topCompanies: ['中国银行', '招商银行', '平安保险', '中信证券', '华泰证券'],
      regions: [
        { city: '上海', jobs: 987, avgSalary: 12000 },
        { city: '北京', jobs: 876, avgSalary: 11500 },
        { city: '深圳', jobs: 654, avgSalary: 11000 },
        { city: '广州', jobs: 543, avgSalary: 9500 }
      ]
    }
  };

  // 专业推荐数据
  const majorRecommendations = [
    { 
      major: '计算机科学与技术', 
      score: 95, 
      reason: '就业率高，薪资优厚，发展前景好',
      tags: ['高薪', '热门', '发展快']
    },
    { 
      major: '临床医学', 
      score: 92, 
      reason: '社会需求大，职业稳定，社会地位高',
      tags: ['稳定', '社会地位', '需求大']
    },
    { 
      major: '软件工程', 
      score: 90, 
      reason: '技术导向，创新性强，薪资水平高',
      tags: ['技术', '创新', '高薪']
    },
    { 
      major: '金融学', 
      score: 85, 
      reason: '传统优势专业，就业面广',
      tags: ['传统', '就业面广', '稳定']
    },
    { 
      major: '电子信息工程', 
      score: 82, 
      reason: '技术性强，适应性好',
      tags: ['技术', '适应性', '发展']
    }
  ];

  // 投资回报分析
  const investmentAnalysis = {
    educationCost: {
      undergraduate: 80000, // 4年本科
      graduate: 60000, // 2年硕士
      doctoral: 90000 // 3年博士
    },
    careerEarnings: {
      '计算机科学与技术': {
        year1: 150000,
        year5: 300000,
        year10: 500000,
        lifetime: 8000000
      },
      '金融学': {
        year1: 120000,
        year5: 200000,
        year10: 350000,
        lifetime: 6000000
      }
    }
  };

  const currentMajor = majorAnalysis[selectedMajor] || majorAnalysis['计算机科学与技术'];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#8c8c8c';
    }
  };

  const renderMajorOverview = () => (
    <Card title={`${selectedMajor} - 专业全景分析`} className={styles.overviewCard}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.metricItem}>
            <Statistic
              title="就业率"
              value={currentMajor.employmentRate}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
              prefix={<TrophyOutlined />}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.metricItem}>
            <Statistic
              title="平均起薪"
              value={currentMajor.avgSalary}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.metricItem}>
            <Statistic
              title="工作满意度"
              value={currentMajor.satisfaction}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
              prefix={<HeartOutlined />}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.metricItem}>
            <Statistic
              title="职业稳定性"
              value={currentMajor.stability}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
              prefix={<SafetyOutlined />}
            />
          </div>
        </Col>
      </Row>
      
      <Divider />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div className={styles.analysisSection}>
            <Title level={4}>
              <BulbOutlined /> 核心技能要求
            </Title>
            <div className={styles.skillTags}>
              {currentMajor.hotSkills.map((skill, index) => (
                <Tag key={index} color="blue" className={styles.skillTag}>
                  {skill}
                </Tag>
              ))}
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className={styles.analysisSection}>
            <Title level={4}>
              <RocketOutlined /> 主要职业方向
            </Title>
            <div className={styles.careerList}>
              {currentMajor.careerPaths.map((career, index) => (
                <div key={index} className={styles.careerItem}>
                  <Text>{career}</Text>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderJobMarket = () => (
    <Card title="就业市场分析" className={styles.marketCard}>
      <Title level={4}>
        <EnvironmentOutlined /> 热门就业城市
      </Title>
      <div className={styles.cityList}>
        {currentMajor.regions.map((region, index) => (
          <div key={index} className={styles.cityItem}>
            <div className={styles.cityHeader}>
              <Text strong>{region.city}</Text>
              <Space>
                <Text type="secondary">{region.jobs}个职位</Text>
                <Text strong style={{ color: '#52c41a' }}>¥{region.avgSalary}</Text>
              </Space>
            </div>
            <Progress 
              percent={(region.jobs / 1234) * 100} 
              strokeColor="#1890ff"
              size="small"
              showInfo={false}
            />
          </div>
        ))}
      </div>
      
      <Divider />
      
      <Title level={4}>
        <TeamOutlined /> 热门雇主
      </Title>
      <div className={styles.companyTags}>
        {currentMajor.topCompanies.map((company, index) => (
          <Tag key={index} color="green" className={styles.companyTag}>
            {company}
          </Tag>
        ))}
      </div>
    </Card>
  );

  const renderRecommendations = () => (
    <Card title="专业推荐排行" className={styles.recommendCard}>
      <div className={styles.recommendList}>
        {majorRecommendations.map((rec, index) => (
          <div 
            key={index} 
            className={`${styles.recommendItem} ${rec.major === selectedMajor ? styles.selected : ''}`}
            onClick={() => setSelectedMajor(rec.major)}
          >
            <div className={styles.recommendHeader}>
              <div className={styles.recommendInfo}>
                <Text strong className={styles.recommendRank}>#{index + 1}</Text>
                <Text strong className={styles.recommendMajor}>{rec.major}</Text>
              </div>
              <div className={styles.recommendScore}>
                <Text strong style={{ color: getScoreColor(rec.score) }}>
                  {rec.score}分
                </Text>
              </div>
            </div>
            <Text type="secondary" className={styles.recommendReason}>
              {rec.reason}
            </Text>
            <div className={styles.recommendTags}>
              {rec.tags.map((tag, tagIndex) => (
                <Tag key={tagIndex} size="small" color={getScoreColor(rec.score)}>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderInvestmentROI = () => {
    const majorEarnings = investmentAnalysis.careerEarnings[selectedMajor];
    const educationCost = investmentAnalysis.educationCost.undergraduate;
    const roi = ((majorEarnings?.year5 || 0) - educationCost) / educationCost * 100;

    return (
      <Card title="教育投资回报分析" className={styles.roiCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className={styles.costAnalysis}>
              <Title level={4}>教育成本</Title>
              <Statistic
                title="本科4年总费用"
                value={educationCost}
                prefix="¥"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className={styles.earningsAnalysis}>
              <Title level={4}>预期收益</Title>
              <Statistic
                title="5年累计收入"
                value={majorEarnings?.year5 || 0}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </div>
          </Col>
        </Row>
        
        <Divider />
        
        <div className={styles.roiSummary}>
          <Title level={4}>投资回报率</Title>
          <div className={styles.roiValue}>
            <Text className={styles.roiNumber}>{roi.toFixed(1)}%</Text>
            <Text type="secondary">（5年期）</Text>
          </div>
          <Progress 
            percent={Math.min(roi, 100)} 
            strokeColor={roi > 200 ? '#52c41a' : roi > 100 ? '#1890ff' : '#faad14'}
            format={(percent) => `${roi.toFixed(1)}%`}
          />
        </div>
      </Card>
    );
  };

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Title level={1} className={styles.title}>
              学生家长指导中心
            </Title>
            <Paragraph className={styles.subtitle}>
              专业选择指导 · 就业前景分析 · 职业规划建议
            </Paragraph>
          </div>
          
          <div className={styles.controls}>
            <Space size="middle">
              <Select value={viewMode} onChange={setViewMode} style={{ width: 120 }}>
                <Option value="student">学生视角</Option>
                <Option value="parent">家长视角</Option>
              </Select>
              <Search
                placeholder="搜索专业"
                style={{ width: 200 }}
                onSearch={(value) => {
                  if (majorAnalysis[value]) {
                    setSelectedMajor(value);
                  }
                }}
              />
            </Space>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className={styles.contentSection}>
        <Alert
          message={viewMode === 'student' ? "学生专属建议" : "家长关注重点"}
          description={
            viewMode === 'student' 
              ? "基于就业数据为你推荐最适合的专业方向，帮助你做出明智的选择。"
              : "从投资回报和职业稳定性角度，为您分析不同专业的价值和前景。"
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {renderMajorOverview()}
          </Col>
          <Col xs={24} lg={8}>
            {renderRecommendations()}
          </Col>
          <Col xs={24} lg={12}>
            {renderJobMarket()}
          </Col>
          <Col xs={24} lg={12}>
            {viewMode === 'parent' ? renderInvestmentROI() : renderJobMarket()}
          </Col>
        </Row>
      </div>
    </div>
  );
};
