import React from 'react';
import { Card, Typography, Space, Alert, Tag, Button, Divider, message } from 'antd';
import { BranchesOutlined, UserOutlined, SettingOutlined, CheckCircleOutlined, BugOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { UniversalQuestionnaireEngine } from '../components/questionnaire/UniversalQuestionnaireEngine';
import { enhancedIntelligentQuestionnaire } from '../data/enhancedIntelligentQuestionnaire';
import { questionnaireTestUtils } from '../utils/testQuestionnaireSubmission';
import type { UniversalQuestionnaireResponse } from '../types/universal-questionnaire';
import styles from './IntelligentQuestionnairePage.module.css';

const { Title, Paragraph, Text } = Typography;

const IntelligentQuestionnairePage: React.FC = () => {
  // 检查是否为开发环境
  const isDevelopment = import.meta.env.DEV;
  const navigate = useNavigate();

  // API测试函数
  const handleApiTest = async () => {
    message.loading('正在测试API...', 0);
    try {
      const success = await questionnaireTestUtils.testDirectSubmission();
      message.destroy();
      if (success) {
        message.success('API测试成功！问卷提交正常工作');
      } else {
        message.error('API测试失败，请查看控制台详情');
      }
    } catch (error) {
      message.destroy();
      message.error('API测试异常，请查看控制台详情');
      console.error('API测试异常:', error);
    }
  };

  // 批量测试函数
  const handleBatchTest = async () => {
    message.loading('正在进行批量测试...', 0);
    try {
      await questionnaireTestUtils.testMultipleIdentities();
      message.destroy();
      message.success('批量测试完成，请查看控制台详情');
    } catch (error) {
      message.destroy();
      message.error('批量测试异常，请查看控制台详情');
      console.error('批量测试异常:', error);
    }
  };

  // 处理问卷提交成功后的跳转
  const handleQuestionnaireSubmit = (submissionData: UniversalQuestionnaireResponse) => {
    console.log('📊 问卷提交成功，准备跳转到故事页面');
    console.log('📊 提交数据:', submissionData);

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      navigate('/stories');
    }, 2000);
  };

  return (
    <div className={styles.container}>
      {/* 开发环境下显示详细说明 */}
      {isDevelopment && (
        <Card className={styles.introCard}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2}>
                <BranchesOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                2025大学生就业问卷调查
              </Title>
              <Paragraph>
                基于心理学和数据科学的智能问卷设计，提供个性化的问卷体验。
              </Paragraph>
            </div>

            <Alert
              message="智能问卷特性"
              description="问卷会根据您的回答动态调整后续问题，不同身份和状态的用户将看到不同的问题内容。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            {/* 问卷结构说明 */}
            <div>
              <Title level={4}>问卷结构说明</Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Tag icon={<CheckCircleOutlined />} color="blue">固定类问题</Tag>
                  <Text>所有用户必答的基础信息：年龄、性别、地区</Text>
                </div>
                <div>
                  <Tag icon={<UserOutlined />} color="green">角色类问题</Tag>
                  <Text>基于身份的专属问题：大学生、失业人员、在职人员等</Text>
                </div>
                <div>
                  <Tag icon={<SettingOutlined />} color="orange">状态类问题</Tag>
                  <Text>基于当前状态的条件问题：求职状态、地区特殊问题等</Text>
                </div>
                <div>
                  <Tag icon={<BranchesOutlined />} color="purple">常规问题</Tag>
                  <Text>通用的结尾问题和综合评价</Text>
                </div>
              </Space>
            </div>

            {/* 条件判断示例 */}
            <div>
              <Title level={4}>条件判断示例</Title>
              <Space direction="vertical" size="small">
                <Text code>身份 = 大学生 → 显示学校、专业、年级相关问题</Text>
                <Text code>身份 = 失业人员 → 显示失业时长、原因相关问题</Text>
                <Text code>身份 = 失业人员 + 状态 = 求职中 → 显示求职详情问题</Text>
                <Text code>地区 = 一线城市 → 显示生活成本相关问题</Text>
                <Text code>所有人 → 显示通用的就业难度评价问题</Text>
              </Space>
            </div>

            <Divider />

            {/* API测试工具 */}
            <div>
              <Title level={4}>
                <BugOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
                API测试工具
              </Title>
              <Alert
                message="开发环境专用"
                description="这些工具可以绕过防刷验证，直接测试问卷API的提交功能"
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <Space size="middle">
                <Button
                  type="primary"
                  icon={<BugOutlined />}
                  onClick={handleApiTest}
                >
                  单次API测试
                </Button>
                <Button
                  type="default"
                  icon={<BranchesOutlined />}
                  onClick={handleBatchTest}
                >
                  批量身份测试
                </Button>
                <Button
                  type="link"
                  onClick={() => {
                    console.log('🧪 测试数据示例:', questionnaireTestUtils.generateCompleteTestData());
                    message.info('测试数据已输出到控制台');
                  }}
                >
                  查看测试数据
                </Button>
              </Space>
              <div className={styles.testHint}>
                <Text type="secondary" className={styles.testHintText}>
                  💡 提示：测试结果会在浏览器控制台显示详细信息
                </Text>
              </div>
            </div>
          </Space>
        </Card>
      )}
      
      {/* 智能问卷组件 */}
      <Card className={styles.questionnaireCard}>
        <UniversalQuestionnaireEngine
          questionnaire={enhancedIntelligentQuestionnaire}
          onSubmit={handleQuestionnaireSubmit}
        />
      </Card>
    </div>
  );
};

export default IntelligentQuestionnairePage;
