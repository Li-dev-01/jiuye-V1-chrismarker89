/**
 * 第二问卷完成页面 - 独立的完成页面
 * 显示完成状态、统计信息和后续操作
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, Result, Statistic, Row, Col, Tag, Alert, Layout } from 'antd';
import { motion } from 'framer-motion';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BarChartOutlined,
  ShareAltOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { SecondQuestionnaireHeader } from '../components/layout/SecondQuestionnaireHeader';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

interface CompletionState {
  responseId: string;
  participantGroup: string;
  completionTime: number;
  interactionCount: number;
}

export const SecondQuestionnaireCompletePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [completionData, setCompletionData] = useState<CompletionState | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  useEffect(() => {
    // 从路由状态获取完成数据
    if (location.state) {
      setCompletionData(location.state as CompletionState);
    } else {
      // 如果没有状态数据，重定向到问卷页面
      navigate('/questionnaire-v2');
    }
  }, [location.state, navigate]);
  
  // 获取参与者群体显示名称
  const getGroupDisplayName = (group: string): string => {
    const names: Record<string, string> = {
      'fresh_graduate': '应届毕业生',
      'junior_professional': '职场新人期',
      'senior_professional': '职业发展期'
    };
    
    return names[group] || '未分类';
  };
  
  // 获取群体颜色
  const getGroupColor = (group: string): string => {
    const colors: Record<string, string> = {
      'fresh_graduate': 'blue',
      'junior_professional': 'green',
      'senior_professional': 'purple'
    };
    
    return colors[group] || 'default';
  };
  
  // 格式化完成时间
  const formatCompletionTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  };
  
  // 获取完成评价
  const getCompletionRating = (time: number, interactions: number): {
    rating: string;
    color: string;
    description: string;
  } => {
    const avgTimePerQuestion = time / interactions;
    
    if (avgTimePerQuestion < 30) {
      return {
        rating: '高效完成',
        color: 'success',
        description: '您的回答速度很快，体现了明确的想法'
      };
    } else if (avgTimePerQuestion < 60) {
      return {
        rating: '认真完成',
        color: 'processing',
        description: '您认真思考了每个问题，回答质量很高'
      };
    } else {
      return {
        rating: '深度思考',
        color: 'warning',
        description: '您对每个问题都进行了深入思考'
      };
    }
  };
  
  if (!completionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96 text-center shadow-lg">
          <Result
            status="warning"
            title="页面访问异常"
            subTitle="请从问卷页面正常完成后访问此页面"
            extra={
              <Button type="primary" onClick={() => navigate('/questionnaire-v2')}>
                返回问卷
              </Button>
            }
          />
        </Card>
      </div>
    );
  }
  
  const completionRating = getCompletionRating(completionData.completionTime, completionData.interactionCount);
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SecondQuestionnaireHeader />
      <Content>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 成功标题 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />}
            title={
              <Title level={2} className="text-gray-800 mb-2">
                问卷提交成功！
              </Title>
            }
            subTitle={
              <Text className="text-gray-600 text-lg">
                感谢您参与第二版智能就业调查，您的回答对我们非常宝贵
              </Text>
            }
          />
        </motion.div>
        
        {/* 完成统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="mb-6 shadow-lg border-0">
            <Title level={4} className="text-center mb-6 text-gray-800">
              您的完成情况
            </Title>
            
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={6}>
                <div className="text-center">
                  <Statistic
                    title="完成时间"
                    value={formatCompletionTime(completionData.completionTime)}
                    prefix={<ClockCircleOutlined className="text-blue-500" />}
                    valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                  />
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div className="text-center">
                  <Statistic
                    title="回答问题数"
                    value={completionData.interactionCount}
                    suffix="题"
                    prefix={<BarChartOutlined className="text-green-500" />}
                    valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                  />
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div className="text-center">
                  <div className="mb-2">
                    <Text className="text-gray-500 text-sm">参与者类型</Text>
                  </div>
                  <Tag 
                    color={getGroupColor(completionData.participantGroup)} 
                    className="text-lg px-4 py-2"
                    icon={<UserOutlined />}
                  >
                    {getGroupDisplayName(completionData.participantGroup)}
                  </Tag>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div className="text-center">
                  <div className="mb-2">
                    <Text className="text-gray-500 text-sm">完成评价</Text>
                  </div>
                  <Tag 
                    color={completionRating.color} 
                    className="text-lg px-4 py-2"
                  >
                    {completionRating.rating}
                  </Tag>
                </div>
              </Col>
            </Row>
            
            <div className="mt-6 text-center">
              <Alert
                message={completionRating.description}
                type="success"
                showIcon
                className="inline-block"
              />
            </div>
          </Card>
        </motion.div>
        
        {/* 后续操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card className="mb-6 shadow-lg border-0">
            <Title level={4} className="text-center mb-6 text-gray-800">
              接下来您可以
            </Title>
            
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm={12} md={8}>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  icon={<BarChartOutlined />}
                  onClick={() => navigate('/questionnaire-v2/analytics')}
                  className="h-16 text-lg"
                >
                  查看数据分析
                  <br />
                  <Text className="text-blue-100 text-sm">
                    了解整体调研结果
                  </Text>
                </Button>
              </Col>
              
              <Col xs={24} sm={12} md={8}>
                <Button 
                  size="large" 
                  block
                  icon={<ShareAltOutlined />}
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="h-16 text-lg"
                >
                  分享问卷
                  <br />
                  <Text className="text-gray-500 text-sm">
                    邀请朋友参与
                  </Text>
                </Button>
              </Col>
              
              <Col xs={24} sm={12} md={8}>
                <Button 
                  size="large" 
                  block
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    // 下载个人报告功能
                    console.log('下载个人报告');
                  }}
                  className="h-16 text-lg"
                >
                  下载报告
                  <br />
                  <Text className="text-gray-500 text-sm">
                    获取个人分析报告
                  </Text>
                </Button>
              </Col>
            </Row>
            
            {/* 分享选项 */}
            {showShareOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <Text className="text-blue-700 font-medium mb-3 block">
                  分享第二版问卷链接：
                </Text>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={`${window.location.origin}/questionnaire-v2`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-blue-300 rounded bg-white text-sm"
                  />
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/questionnaire-v2`);
                    }}
                  >
                    复制链接
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
        
        {/* 感谢信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="text-center">
              <Title level={3} className="text-white mb-4">
                再次感谢您的参与！
              </Title>
              <Paragraph className="text-blue-100 text-lg leading-relaxed">
                您的回答将帮助我们更好地了解不同群体的就业状况，
                为制定更有针对性的就业政策和服务提供重要依据。
                我们会持续改进问卷体验，期待您的宝贵建议。
              </Paragraph>
              
              <div className="mt-6">
                <Space size="large">
                  <Button 
                    type="default" 
                    size="large"
                    onClick={() => navigate('/')}
                    className="px-8"
                  >
                    返回首页
                  </Button>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => navigate('/questionnaire-v2/analytics')}
                    className="px-8 bg-white text-blue-600 border-white hover:bg-blue-50"
                  >
                    查看分析结果
                  </Button>
                </Space>
              </div>
            </div>
          </Card>
        </motion.div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default SecondQuestionnaireCompletePage;
