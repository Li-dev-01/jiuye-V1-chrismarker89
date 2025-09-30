/**
 * AI审核助手组件
 * 
 * 在审核页面中显示AI分析结果和建议
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Space,
  Tag,
  Progress,
  Button,
  Tooltip,
  Alert,
  Collapse,
  Typography,
  Row,
  Col,
  Spin,
  Empty
} from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { aiReviewService, type ReviewContent } from '../../services/aiReviewService';
import type { AIReviewAnalysis } from '../../types/ai-water-management';
import styles from './AIReviewAssistant.module.css';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface AIReviewAssistantProps {
  content: ReviewContent;
  onRecommendationAccept?: (recommendation: string) => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const AIReviewAssistant: React.FC<AIReviewAssistantProps> = ({
  content,
  onRecommendationAccept,
  showDetails = true,
  compact = false
}) => {
  const [analysis, setAnalysis] = useState<AIReviewAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载AI分析结果
  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 先尝试获取已有的分析结果
      let result = await aiReviewService.getAnalysisResult(content.id);
      
      // 如果没有分析结果，则进行新的分析
      if (!result) {
        result = await aiReviewService.analyzeContent(content);
      }
      
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
      console.error('AI分析失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载分析
  useEffect(() => {
    loadAnalysis();
  }, [content.id]);

  // 获取推荐标签配置
  const getRecommendationConfig = (recommendation: string) => {
    const configs = {
      approve: {
        color: 'green',
        icon: <CheckCircleOutlined />,
        text: '建议通过',
        description: 'AI认为此内容质量良好，建议直接通过'
      },
      reject: {
        color: 'red',
        icon: <CloseCircleOutlined />,
        text: '建议拒绝',
        description: 'AI检测到内容存在问题，建议拒绝'
      },
      review_required: {
        color: 'orange',
        icon: <ExclamationCircleOutlined />,
        text: '需要审核',
        description: 'AI无法确定，需要人工仔细审核'
      }
    };
    
    return configs[recommendation as keyof typeof configs] || configs.review_required;
  };

  // 获取分数颜色
  const getScoreColor = (score: number, isReverse = false) => {
    if (isReverse) {
      if (score <= 0.3) return '#52c41a';
      if (score <= 0.6) return '#faad14';
      return '#ff4d4f';
    } else {
      if (score >= 80) return '#52c41a';
      if (score >= 60) return '#faad14';
      return '#ff4d4f';
    }
  };

  // 获取情感标签
  const getSentimentTag = (score: number) => {
    if (score > 0.3) return { color: 'green', text: '积极' };
    if (score < -0.3) return { color: 'red', text: '消极' };
    return { color: 'blue', text: '中性' };
  };

  // 处理接受建议
  const handleAcceptRecommendation = () => {
    if (analysis && onRecommendationAccept) {
      onRecommendationAccept(analysis.suggestions.recommendation);
    }
  };

  if (loading) {
    return (
      <Card className={styles.container} size={compact ? 'small' : 'default'}>
        <div className={styles.loading}>
          <Spin />
          <Text type="secondary" style={{ marginLeft: 8 }}>
            AI正在分析内容...
          </Text>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.container} size={compact ? 'small' : 'default'}>
        <Alert
          message="AI分析失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadAnalysis}>
              重试
            </Button>
          }
        />
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={styles.container} size={compact ? 'small' : 'default'}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无AI分析结果"
          style={{ margin: '16px 0' }}
        >
          <Button type="primary" onClick={loadAnalysis}>
            开始分析
          </Button>
        </Empty>
      </Card>
    );
  }

  const recommendationConfig = getRecommendationConfig(analysis.suggestions.recommendation);
  const sentimentTag = getSentimentTag(analysis.analysis.sentimentScore);

  return (
    <Card
      className={styles.container}
      size={compact ? 'small' : 'default'}
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <Text strong>AI审核助手</Text>
          <Tag color="blue" size="small">
            {analysis.metadata.aiSource.toUpperCase()}
          </Tag>
        </Space>
      }
      extra={
        <Tooltip title="重新分析">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={loadAnalysis}
          />
        </Tooltip>
      }
    >
      {/* AI建议 */}
      <div className={styles.recommendation}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Tag
              color={recommendationConfig.color}
              icon={recommendationConfig.icon}
              style={{ fontSize: '14px', padding: '4px 8px' }}
            >
              {recommendationConfig.text}
            </Tag>
            <Text type="secondary">
              置信度: {(analysis.suggestions.confidence * 100).toFixed(0)}%
            </Text>
          </Space>
          
          {onRecommendationAccept && analysis.suggestions.confidence >= 0.8 && (
            <Button
              type="primary"
              size="small"
              onClick={handleAcceptRecommendation}
            >
              采纳建议
            </Button>
          )}
        </Space>
        
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
          {recommendationConfig.description}
        </Text>
      </div>

      {/* 快速指标 */}
      {!compact && (
        <Row gutter={8} style={{ margin: '16px 0' }}>
          <Col span={6}>
            <div className={styles.quickMetric}>
              <Text type="secondary" style={{ fontSize: '12px' }}>质量</Text>
              <Progress
                percent={analysis.analysis.qualityScore}
                size="small"
                strokeColor={getScoreColor(analysis.analysis.qualityScore)}
                format={() => analysis.analysis.qualityScore}
              />
            </div>
          </Col>
          <Col span={6}>
            <div className={styles.quickMetric}>
              <Text type="secondary" style={{ fontSize: '12px' }}>情感</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={sentimentTag.color} size="small">
                  {sentimentTag.text}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className={styles.quickMetric}>
              <Text type="secondary" style={{ fontSize: '12px' }}>有害内容</Text>
              <Progress
                percent={analysis.analysis.toxicityScore * 100}
                size="small"
                strokeColor={getScoreColor(analysis.analysis.toxicityScore, true)}
                format={() => `${(analysis.analysis.toxicityScore * 100).toFixed(0)}%`}
              />
            </div>
          </Col>
          <Col span={6}>
            <div className={styles.quickMetric}>
              <Text type="secondary" style={{ fontSize: '12px' }}>相关性</Text>
              <Progress
                percent={analysis.analysis.relevanceScore * 100}
                size="small"
                strokeColor={getScoreColor(analysis.analysis.relevanceScore * 100)}
                format={() => `${(analysis.analysis.relevanceScore * 100).toFixed(0)}%`}
              />
            </div>
          </Col>
        </Row>
      )}

      {/* 问题标记 */}
      {Object.values(analysis.flags).some(flag => flag) && (
        <Alert
          message="检测到潜在问题"
          type="warning"
          showIcon
          style={{ margin: '12px 0' }}
          description={
            <Space wrap>
              {analysis.flags.hasSensitiveContent && <Tag color="red">敏感内容</Tag>}
              {analysis.flags.hasPersonalInfo && <Tag color="orange">个人信息</Tag>}
              {analysis.flags.hasInappropriateLanguage && <Tag color="red">不当语言</Tag>}
              {analysis.flags.hasSpam && <Tag color="red">垃圾内容</Tag>}
              {analysis.flags.hasOffTopic && <Tag color="orange">偏离主题</Tag>}
            </Space>
          }
        />
      )}

      {/* 详细分析 */}
      {showDetails && !compact && (
        <Collapse size="small" ghost>
          <Panel
            header={
              <Space>
                <InfoCircleOutlined />
                <Text>详细分析</Text>
              </Space>
            }
            key="details"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 分析原因 */}
              {analysis.suggestions.reasons.length > 0 && (
                <div>
                  <Text strong style={{ fontSize: '12px' }}>分析原因：</Text>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    {analysis.suggestions.reasons.map((reason, index) => (
                      <li key={index} style={{ fontSize: '12px', color: '#666' }}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 改进建议 */}
              {analysis.suggestions.improvements && analysis.suggestions.improvements.length > 0 && (
                <div>
                  <Text strong style={{ fontSize: '12px' }}>改进建议：</Text>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    {analysis.suggestions.improvements.map((improvement, index) => (
                      <li key={index} style={{ fontSize: '12px', color: '#666' }}>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 技术信息 */}
              <div style={{ fontSize: '11px', color: '#999', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                <Space split={<span>|</span>}>
                  <span>模型: {analysis.metadata.model}</span>
                  <span>耗时: {analysis.metadata.analysisTime}ms</span>
                  <span>成本: ${analysis.metadata.cost.toFixed(4)}</span>
                </Space>
              </div>
            </Space>
          </Panel>
        </Collapse>
      )}
    </Card>
  );
};
