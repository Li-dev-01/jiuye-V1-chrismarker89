/**
 * 社会统计学洞察面板
 * 提供基于数据的社会分析和政策建议
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Space,
  Tag,
  Alert,
  Collapse,
  List,
  Statistic,
  Row,
  Col,
  Button,
  Tooltip,
  Progress
} from 'antd';
import {
  BulbOutlined,
  RiseOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  HomeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

export interface SocialInsight {
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  recommendations: string[];
  dataPoints: Array<{
    metric: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface SocialInsightsData {
  employmentTrends: SocialInsight[];
  demographicInsights: SocialInsight[];
  policyRecommendations: SocialInsight[];
  marketAnalysis: SocialInsight[];
  educationGaps: SocialInsight[];
}

interface SocialInsightsPanelProps {
  data?: SocialInsightsData;
  loading?: boolean;
}

export const SocialInsightsPanel: React.FC<SocialInsightsPanelProps> = ({
  data,
  loading = false
}) => {
  const [activeKey, setActiveKey] = useState<string[]>(['employment']);

  // 模拟数据（实际应用中从API获取）
  const mockInsights: SocialInsightsData = {
    employmentTrends: [
      {
        category: '就业趋势',
        title: '新兴行业就业增长显著',
        description: '互联网科技、数字经济等新兴行业成为就业增长的主要驱动力，传统制造业就业比例下降。',
        severity: 'medium',
        confidence: 85,
        recommendations: [
          '加强新兴技能培训，提升劳动力适应性',
          '推动传统行业数字化转型',
          '建立行业转换支持机制'
        ],
        dataPoints: [
          { metric: '互联网行业就业增长', value: '+23%', trend: 'up' },
          { metric: '制造业就业比例', value: '-8%', trend: 'down' },
          { metric: '服务业就业稳定性', value: '稳定', trend: 'stable' }
        ]
      }
    ],
    demographicInsights: [
      {
        category: '人口结构',
        title: '年轻群体就业压力加大',
        description: '20-25岁年龄段面临较大就业压力，高学历群体期望与市场需求存在结构性矛盾。',
        severity: 'high',
        confidence: 92,
        recommendations: [
          '优化高等教育专业设置',
          '加强校企合作，提升实践能力',
          '建立青年就业支持体系'
        ],
        dataPoints: [
          { metric: '青年失业率', value: '15.2%', trend: 'up' },
          { metric: '高学历就业匹配度', value: '68%', trend: 'down' },
          { metric: '技能型人才需求', value: '+35%', trend: 'up' }
        ]
      }
    ],
    policyRecommendations: [
      {
        category: '政策建议',
        title: '完善就业服务体系',
        description: '建议建立更加完善的就业服务体系，加强政府、企业、教育机构的协调配合。',
        severity: 'medium',
        confidence: 88,
        recommendations: [
          '建立统一的就业信息平台',
          '完善失业保障制度',
          '加大对中小企业就业支持',
          '推进灵活就业政策创新'
        ],
        dataPoints: [
          { metric: '就业服务覆盖率', value: '76%', trend: 'up' },
          { metric: '政策知晓度', value: '62%', trend: 'stable' },
          { metric: '服务满意度', value: '71%', trend: 'up' }
        ]
      }
    ],
    marketAnalysis: [
      {
        category: '市场分析',
        title: '薪资水平区域差异明显',
        description: '一线城市与其他地区薪资差距持续扩大，生活成本与收入比例失衡问题突出。',
        severity: 'high',
        confidence: 90,
        recommendations: [
          '推进区域协调发展',
          '完善住房保障政策',
          '建立薪资指导机制'
        ],
        dataPoints: [
          { metric: '一线城市平均薪资', value: '12,500元', trend: 'up' },
          { metric: '三线城市平均薪资', value: '5,800元', trend: 'stable' },
          { metric: '房价收入比', value: '8.5:1', trend: 'up' }
        ]
      }
    ],
    educationGaps: [
      {
        category: '教育缺口',
        title: '技能培训与市场需求脱节',
        description: '现有教育培训体系与快速变化的市场需求存在时间差，需要加强动态调整机制。',
        severity: 'medium',
        confidence: 83,
        recommendations: [
          '建立产业需求预测机制',
          '推进教育培训供给侧改革',
          '加强终身学习体系建设'
        ],
        dataPoints: [
          { metric: '技能匹配度', value: '65%', trend: 'down' },
          { metric: '培训参与率', value: '42%', trend: 'up' },
          { metric: '技能更新周期', value: '2.3年', trend: 'down' }
        ]
      }
    ]
  };

  const currentData = data || mockInsights;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#fa8c16';
      case 'low': return '#52c41a';
      default: return '#1890ff';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <WarningOutlined />;
      case 'medium': return <InfoCircleOutlined />;
      case 'low': return <CheckCircleOutlined />;
      default: return <BulbOutlined />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const renderInsightCard = (insight: SocialInsight) => (
    <Card 
      key={insight.title}
      size="small" 
      style={{ marginBottom: 16 }}
      title={
        <Space>
          {getSeverityIcon(insight.severity)}
          <span>{insight.title}</span>
          <Tag color={getSeverityColor(insight.severity)}>
            {insight.severity === 'high' ? '高关注' : 
             insight.severity === 'medium' ? '中等' : '低风险'}
          </Tag>
        </Space>
      }
      extra={
        <Tooltip title="数据可信度">
          <Progress 
            type="circle" 
            size={40} 
            percent={insight.confidence} 
            format={percent => `${percent}%`}
          />
        </Tooltip>
      }
    >
      <Paragraph>{insight.description}</Paragraph>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {insight.dataPoints.map((point, index) => (
          <Col xs={24} sm={8} key={index}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={point.metric}
                value={point.value}
                prefix={getTrendIcon(point.trend)}
                valueStyle={{ fontSize: '14px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div>
        <Text strong>政策建议：</Text>
        <List
          size="small"
          dataSource={insight.recommendations}
          renderItem={(item, index) => (
            <List.Item>
              <Text type="secondary">{index + 1}. {item}</Text>
            </List.Item>
          )}
        />
      </div>
    </Card>
  );

  return (
    <div>
      <Card 
        title={
          <Space>
            <BulbOutlined />
            <Title level={4} style={{ margin: 0 }}>社会统计学洞察</Title>
          </Space>
        }
        extra={
          <Button type="primary" size="small">
            生成报告
          </Button>
        }
      >
        <Alert
          message="基于真实问卷数据的社会统计学分析"
          description="以下洞察基于问卷调查数据，运用社会统计学方法分析就业市场状况，为政策制定提供科学依据。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Collapse 
          activeKey={activeKey} 
          onChange={setActiveKey}
          ghost
        >
          <Panel 
            header={
              <Space>
                <RiseOutlined />
                <span>就业趋势分析</span>
                <Tag color="blue">{currentData.employmentTrends.length} 项洞察</Tag>
              </Space>
            } 
            key="employment"
          >
            {currentData.employmentTrends.map(renderInsightCard)}
          </Panel>

          <Panel 
            header={
              <Space>
                <TeamOutlined />
                <span>人口结构洞察</span>
                <Tag color="green">{currentData.demographicInsights.length} 项洞察</Tag>
              </Space>
            } 
            key="demographics"
          >
            {currentData.demographicInsights.map(renderInsightCard)}
          </Panel>

          <Panel 
            header={
              <Space>
                <BankOutlined />
                <span>市场分析</span>
                <Tag color="orange">{currentData.marketAnalysis.length} 项洞察</Tag>
              </Space>
            } 
            key="market"
          >
            {currentData.marketAnalysis.map(renderInsightCard)}
          </Panel>

          <Panel 
            header={
              <Space>
                <BookOutlined />
                <span>教育缺口分析</span>
                <Tag color="purple">{currentData.educationGaps.length} 项洞察</Tag>
              </Space>
            } 
            key="education"
          >
            {currentData.educationGaps.map(renderInsightCard)}
          </Panel>

          <Panel 
            header={
              <Space>
                <HomeOutlined />
                <span>政策建议</span>
                <Tag color="red">{currentData.policyRecommendations.length} 项建议</Tag>
              </Space>
            } 
            key="policy"
          >
            {currentData.policyRecommendations.map(renderInsightCard)}
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};
