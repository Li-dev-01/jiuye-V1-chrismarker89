/**
 * 励志名言弹窗组件
 * 在问卷提交后，如果检测到负面情绪，显示励志名言鼓励用户
 */

import React from 'react';
import { Modal, Button, Typography, Space, Tag } from 'antd';
import { HeartOutlined, SmileOutlined } from '@ant-design/icons';
import './MotivationalQuoteModal.css';

const { Title, Paragraph, Text } = Typography;

export interface MotivationalQuoteData {
  text: string;
  author?: string;
  category: string;
}

export interface UserProfileData {
  tags?: Array<{
    key: string;
    name: string;
    category: string;
  }>;
  emotion?: {
    type: 'positive' | 'neutral' | 'negative';
    confidence: number;
    needsEncouragement: boolean;
    reasons?: string[];
  };
  motivationalQuote?: MotivationalQuoteData | null;
}

// 导出类型
export type { UserProfileData };

interface MotivationalQuoteModalProps {
  visible: boolean;
  userProfile: UserProfileData | null;
  onClose: () => void;
}

/**
 * 励志名言弹窗组件
 */
const MotivationalQuoteModal: React.FC<MotivationalQuoteModalProps> = ({
  visible,
  userProfile,
  onClose
}) => {
  // 如果没有用户画像数据或不需要鼓励，不显示
  if (!userProfile?.emotion?.needsEncouragement || !userProfile?.motivationalQuote) {
    return null;
  }

  const { motivationalQuote, tags, emotion } = userProfile;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" size="large" onClick={onClose}>
          我知道了
        </Button>
      ]}
      width={600}
      centered
      className="motivational-quote-modal"
      closeIcon={null}
    >
      <div className="motivational-quote-content">
        {/* 顶部图标 */}
        <div className="quote-icon">
          <HeartOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
        </div>

        {/* 标题 */}
        <Title level={3} style={{ textAlign: 'center', marginTop: 16 }}>
          给你一句鼓励 💪
        </Title>

        {/* 励志名言 */}
        <div className="quote-box">
          <Paragraph className="quote-text">
            "{motivationalQuote.text}"
          </Paragraph>
          {motivationalQuote.author && (
            <Text className="quote-author">
              —— {motivationalQuote.author}
            </Text>
          )}
        </div>

        {/* 分类标签 */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Tag color="blue">{motivationalQuote.category}</Tag>
        </div>

        {/* 用户标签（可选） */}
        {tags && tags.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <SmileOutlined /> 我们为你生成了以下标签：
            </Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                {tags.slice(0, 5).map((tag) => (
                  <Tag key={tag.key} color="geekblue">
                    {tag.name}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            每一次努力都不会白费，继续加油！🌟
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default MotivationalQuoteModal;

