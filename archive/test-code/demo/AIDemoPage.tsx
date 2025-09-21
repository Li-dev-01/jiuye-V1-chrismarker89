/**
 * AI功能演示页面
 * 
 * 展示AI水源管理和AI审核助手的功能
 */

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  Tag,
  message
} from 'antd';
import {
  ThunderboltOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
// import { AIReviewAssistant } from '../../components/ai/AIReviewAssistant';
// import type { ReviewContent } from '../../services/aiReviewService';

const { Title, Text, Paragraph } = Typography;

// 简化的演示内容类型
interface DemoContent {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export const AIDemoPage: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('questionnaire');

  // 演示数据
  const demoContents: Record<string, DemoContent> = {
    questionnaire: {
      id: 'demo-questionnaire-1',
      type: 'questionnaire',
      title: '计算机专业毕业生就业调查',
      content: JSON.stringify({
        age: 23,
        gender: '男',
        education: '本科',
        major: '计算机科学与技术',
        graduationYear: 2024,
        employmentStatus: '已就业',
        jobTitle: '前端开发工程师',
        company: '某互联网公司',
        salary: 12000,
        location: '北京'
      }, null, 2),
      metadata: {
        submittedAt: new Date().toISOString(),
        username: '张同学'
      }
    },
    story: {
      id: 'demo-story-1',
      type: 'story',
      title: '从实习生到正式员工的心路历程',
      content: `刚开始实习的时候，我对一切都充满了好奇和紧张。第一天走进公司，看到那些忙碌的同事们，我既兴奋又忐忑。

导师给我安排了一些简单的任务，虽然看起来不难，但对于初入职场的我来说，每一个细节都需要仔细琢磨。我记得第一次写代码review的时候，手都在发抖，生怕出错。

随着时间的推移，我逐渐适应了工作节奏，也开始承担更重要的任务。同事们都很友善，愿意分享经验和知识。我学会了如何与团队协作，如何处理工作中的挑战。

三个月的实习期很快就过去了，当HR通知我可以转正的时候，我激动得差点跳起来。这段经历让我成长了很多，也让我更加确定了自己的职业方向。

现在回想起来，那段实习的日子虽然忙碌，但却是我人生中最宝贵的经历之一。它不仅让我获得了专业技能，更重要的是让我学会了如何在职场中立足。`,
      metadata: {
        submittedAt: new Date().toISOString(),
        username: '李同学',
        tags: ['实习经历', '职场成长', '技术发展']
      }
    },
    voice: {
      id: 'demo-voice-1',
      type: 'voice',
      title: '对未来工作的期待',
      content: `希望能找到一份真正适合自己的工作，不仅仅是为了薪水，更希望能在工作中实现自我价值。

我期待的工作环境是开放包容的，同事之间能够互相学习、共同成长。我希望能够参与有意义的项目，用自己的技能为社会创造价值。

虽然现在就业形势比较严峻，但我相信只要努力提升自己，总会找到合适的机会。我会继续学习新技术，提高自己的专业能力，同时也要培养良好的沟通协作能力。

未来的路可能会有挑战，但我已经准备好了。我相信每一次努力都不会白费，每一次挫折都是成长的机会。`,
      metadata: {
        submittedAt: new Date().toISOString(),
        username: '王同学',
        category: '职业规划',
        mood: 'hopeful',
        rating: 4
      }
    }
  };

  const handleRecommendationAccept = (recommendation: string) => {
    message.success(`已采纳AI建议: ${recommendation === 'approve' ? '通过' : recommendation === 'reject' ? '拒绝' : '需要审核'}`);
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, padding: 24, background: 'white', borderRadius: 8 }}>
        <Title level={2}>
          <ExperimentOutlined /> AI功能演示
        </Title>
        <Paragraph>
          展示AI水源管理系统和AI审核助手的核心功能。这些功能已经集成到管理员和审核员的工作流程中。
        </Paragraph>
        
        <Alert
          message="演示说明"
          description="以下演示展示了AI如何辅助内容审核工作。在实际使用中，AI会分析内容质量、情感倾向、有害内容等多个维度，为审核员提供智能建议。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </div>

      <Row gutter={24}>
        {/* 功能概览 */}
        <Col span={8}>
          <Card title="AI水源管理" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <ThunderboltOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <Text strong>多AI提供商支持</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  支持OpenAI、Grok、Gemini、Claude等多个AI服务
                </Text>
              </div>
              
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong>智能负载均衡</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  根据成本、质量、响应时间自动选择最佳AI服务
                </Text>
              </div>
              
              <div>
                <RobotOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                <Text strong>成本控制</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  实时监控AI使用成本，支持预算控制和成本优化
                </Text>
              </div>
            </Space>
          </Card>

          <Card title="AI审核助手">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>内容质量分析</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  评估内容的完整性、逻辑性、表达清晰度
                </Text>
              </div>
              
              <div>
                <Text strong>情感分析</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  识别内容的情感倾向，检测积极或消极情绪
                </Text>
              </div>
              
              <div>
                <Text strong>有害内容检测</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  检测仇恨言论、暴力内容、歧视性语言等
                </Text>
              </div>
              
              <div>
                <Text strong>智能建议</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  基于分析结果提供通过、拒绝或需要审核的建议
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 演示选择 */}
        <Col span={16}>
          <Card title="AI审核助手演示" style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 16 }}>
              <Text strong>选择演示内容：</Text>
              <Button
                type={selectedDemo === 'questionnaire' ? 'primary' : 'default'}
                onClick={() => setSelectedDemo('questionnaire')}
              >
                问卷调查
              </Button>
              <Button
                type={selectedDemo === 'story' ? 'primary' : 'default'}
                onClick={() => setSelectedDemo('story')}
              >
                故事分享
              </Button>
              <Button
                type={selectedDemo === 'voice' ? 'primary' : 'default'}
                onClick={() => setSelectedDemo('voice')}
              >
                心声留言
              </Button>
            </Space>

            <Divider />

            {/* 内容预览 */}
            <Card size="small" title="内容预览" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>标题：</Text>
                  <Text>{demoContents[selectedDemo].title}</Text>
                </div>
                <div>
                  <Text strong>类型：</Text>
                  <Tag color="blue">
                    {selectedDemo === 'questionnaire' ? '问卷调查' : 
                     selectedDemo === 'story' ? '故事分享' : '心声留言'}
                  </Tag>
                </div>
                <div>
                  <Text strong>内容：</Text>
                  <div style={{ 
                    marginTop: 8, 
                    padding: 12, 
                    background: '#fafafa', 
                    borderRadius: 4,
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    <Text style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                      {selectedDemo === 'questionnaire' 
                        ? JSON.stringify(JSON.parse(demoContents[selectedDemo].content), null, 2)
                        : demoContents[selectedDemo].content
                      }
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>

            {/* AI分析结果演示 */}
            <Card title={
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <Text strong>AI审核助手分析结果</Text>
                <Tag color="blue" size="small">DEMO</Tag>
              </Space>
            }>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* AI建议 */}
                <div style={{
                  padding: 12,
                  background: 'rgba(24, 144, 255, 0.03)',
                  border: '1px solid #e6f7ff',
                  borderRadius: 6
                }}>
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: '14px', padding: '4px 8px' }}>
                        建议通过
                      </Tag>
                      <Text type="secondary">置信度: 92%</Text>
                    </Space>
                    <Button type="primary" size="small" onClick={handleRecommendationAccept}>
                      采纳建议
                    </Button>
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                    AI认为此内容质量良好，建议直接通过
                  </Text>
                </div>

                {/* 分析指标 */}
                <Row gutter={16}>
                  <Col span={6}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>内容质量</Text>
                      <div style={{ marginTop: 8 }}>
                        <Progress
                          type="circle"
                          percent={88}
                          size={60}
                          strokeColor="#52c41a"
                          format={() => '88'}
                        />
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>情感分析</Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag color="green" style={{ marginTop: 16 }}>积极</Tag>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>有害内容</Text>
                      <div style={{ marginTop: 8 }}>
                        <Progress
                          type="circle"
                          percent={5}
                          size={60}
                          strokeColor="#52c41a"
                          format={() => '5%'}
                        />
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>相关性</Text>
                      <div style={{ marginTop: 8 }}>
                        <Progress
                          type="circle"
                          percent={95}
                          size={60}
                          strokeColor="#52c41a"
                          format={() => '95%'}
                        />
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* 分析详情 */}
                <Card size="small" title="分析详情">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ fontSize: '12px' }}>分析原因：</Text>
                      <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                        <li style={{ fontSize: '12px', color: '#666' }}>内容结构完整，信息详实</li>
                        <li style={{ fontSize: '12px', color: '#666' }}>表达清晰，逻辑性强</li>
                        <li style={{ fontSize: '12px', color: '#666' }}>情感积极正面</li>
                        <li style={{ fontSize: '12px', color: '#666' }}>与主题高度相关</li>
                      </ul>
                    </div>

                    <div style={{ fontSize: '11px', color: '#999', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                      <Space split={<span>|</span>}>
                        <span>模型: GPT-4</span>
                        <span>耗时: 1.2s</span>
                        <span>成本: $0.0024</span>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Space>
            </Card>
          </Card>

          {/* 使用说明 */}
          <Card title="使用说明">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="管理员功能"
                description="管理员可以在 '管理员 > AI管理' 菜单中配置AI水源、监控系统状态、控制成本预算。"
                type="info"
                showIcon
              />
              
              <Alert
                message="审核员功能"
                description="审核员在审核内容时，AI助手会自动分析内容并提供建议。可以点击'采纳建议'快速完成审核。"
                type="success"
                showIcon
              />
              
              <Alert
                message="智能优化"
                description="系统会根据使用情况自动优化AI服务选择，在保证质量的前提下控制成本。"
                type="warning"
                showIcon
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
