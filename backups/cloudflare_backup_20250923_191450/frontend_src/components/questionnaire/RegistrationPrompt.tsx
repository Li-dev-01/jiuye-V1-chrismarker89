/**
 * 注册提示组件
 * 在用户尝试填写心声时提示注册
 */

import React from 'react';
import { Modal, Button, Space, Typography, List, Card } from 'antd';
import { UserAddOutlined, HeartOutlined, FileImageOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface RegistrationPromptProps {
  visible: boolean;
  onClose: () => void;
  onQuickRegister: () => void;
  onSkip: () => void;
  questionTitle?: string;
}

export const RegistrationPrompt: React.FC<RegistrationPromptProps> = ({
  visible,
  onClose,
  onQuickRegister,
  onSkip,
  questionTitle = '就业与反馈'
}) => {
  const benefits = [
    {
      icon: <HeartOutlined style={{ color: '#ff4d4f' }} />,
      title: '分享您的心声',
      description: '表达真实的就业感受和建议，帮助其他人了解就业环境'
    },
    {
      icon: <BarChartOutlined style={{ color: '#1890ff' }} />,
      title: '查看数据统计',
      description: '了解您的观点在整体数据中的位置，获得更多洞察'
    },
    {
      icon: <FileImageOutlined style={{ color: '#52c41a' }} />,
      title: '生成专属卡片',
      description: '将您的心声制作成精美的PNG卡片，可下载分享'
    }
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <UserAddOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
          <span>心声功能需要注册</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div style={{ padding: '20px 0' }}>
        <Card 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            marginBottom: '24px'
          }}
        >
          <div style={{ color: 'white', textAlign: 'center' }}>
            <Title level={4} style={{ color: 'white', margin: '0 0 8px 0' }}>
              💡 即将进入"{questionTitle}"部分
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              为了关联您的心声数据并提供个性化服务，此功能需要快捷注册
            </Paragraph>
          </div>
        </Card>

        <Title level={5} style={{ marginBottom: '16px' }}>
          注册后您可以享受：
        </Title>

        <List
          dataSource={benefits}
          renderItem={(item) => (
            <List.Item style={{ border: 'none', padding: '12px 0' }}>
              <List.Item.Meta
                avatar={item.icon}
                title={<Text strong>{item.title}</Text>}
                description={item.description}
              />
            </List.Item>
          )}
        />

        <Card 
          size="small" 
          style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            marginTop: '16px'
          }}
        >
          <Paragraph style={{ margin: 0, fontSize: '14px' }}>
            <Text type="secondary">
              🔒 <strong>隐私保护：</strong>快捷注册只需要一个昵称，完全匿名，不收集任何个人敏感信息
            </Text>
          </Paragraph>
        </Card>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Space size="large" direction="vertical">
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<UserAddOutlined />}
                onClick={onQuickRegister}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                快捷注册（推荐）
              </Button>
              <Button
                size="large"
                onClick={onSkip}
                style={{ borderRadius: '6px' }}
              >
                跳过心声部分
              </Button>
            </Space>
            <Button
              type="text"
              onClick={onClose}
              style={{ color: '#999' }}
            >
              关闭
            </Button>
          </Space>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            注册过程不到30秒，让您的声音被更多人听到
          </Text>
        </div>
      </div>
    </Modal>
  );
};
