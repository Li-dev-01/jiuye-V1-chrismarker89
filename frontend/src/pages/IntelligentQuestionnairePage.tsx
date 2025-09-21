import React from 'react';
import { Card, Typography, Space, Alert, Tag } from 'antd';
import { BranchesOutlined, UserOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { UniversalQuestionnaireEngine } from '../components/questionnaire/UniversalQuestionnaireEngine';
import { intelligentQuestionnaire } from '../data/intelligentQuestionnaire';

const { Title, Paragraph, Text } = Typography;

const IntelligentQuestionnairePage: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题和说明 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <BranchesOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              多维度条件判断智能问卷
            </Title>
            <Paragraph>
              这是一个基于多维度条件判断的智能问卷系统，能够根据用户的不同身份、状态和基础信息，
              智能匹配相应的问题，实现个性化的问卷体验。
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
        </Space>
      </Card>
      
      {/* 智能问卷组件 */}
      <Card>
        <UniversalQuestionnaireEngine questionnaire={intelligentQuestionnaire} />
      </Card>
    </div>
  );
};

export default IntelligentQuestionnairePage;
