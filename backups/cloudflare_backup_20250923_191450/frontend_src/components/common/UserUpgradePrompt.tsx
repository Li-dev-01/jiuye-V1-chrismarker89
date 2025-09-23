/**
 * 用户升级提示组件
 * 用于引导匿名用户注册半匿名账户
 */

import React, { useState } from 'react';
import { Modal, Button, Card, List, Progress, Typography, Space, Alert, Form, Input } from 'antd';
import { 
  UserOutlined, 
  EyeOutlined, 
  HeartOutlined, 
  HistoryOutlined,
  GiftOutlined,
  SafetyOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { UserType } from '../../utils/userAccessControl';

const { Title, Text, Paragraph } = Typography;

interface UserUpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (userData: { nickname: string; email?: string }) => Promise<boolean>;
  currentQuota: number;
  maxQuota: number;
  userType: UserType;
  benefits?: string[];
}

export const UserUpgradePrompt: React.FC<UserUpgradePromptProps> = ({
  visible,
  onClose,
  onUpgrade,
  currentQuota,
  maxQuota,
  userType,
  benefits = []
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 计算使用进度
  const usagePercent = maxQuota > 0 ? (currentQuota / maxQuota) * 100 : 0;
  const isNearLimit = usagePercent >= 80;

  // 默认权益
  const defaultBenefits = [
    '浏览更多内容（1000条 vs 50条）',
    '个性化内容推荐',
    '浏览历史记录',
    '更高的请求频率限制',
    '用户偏好设置',
    '优先体验新功能'
  ];

  const allBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  // 处理升级
  const handleUpgrade = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const success = await onUpgrade(values);
      if (success) {
        onClose();
        form.resetFields();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 权益图标映射
  const getBenefitIcon = (index: number) => {
    const icons = [
      <EyeOutlined />,
      <HeartOutlined />,
      <HistoryOutlined />,
      <ThunderboltOutlined />,
      <UserOutlined />,
      <GiftOutlined />
    ];
    return icons[index % icons.length];
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      destroyOnHidden
    >
      <div style={{ padding: '20px 0' }}>
        {/* 标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2} style={{ margin: 0 }}>
            {isNearLimit ? '浏览限制即将达到' : '升级您的账户'}
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '16px', marginTop: '8px' }}>
            注册半匿名账户，解锁更多精彩内容
          </Paragraph>
        </div>

        {/* 当前使用情况 */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>当前浏览进度</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <Progress
                percent={usagePercent}
                status={isNearLimit ? 'exception' : 'active'}
                strokeColor={isNearLimit ? '#ff4d4f' : '#1890ff'}
                style={{ flex: 1, marginRight: '12px' }}
              />
              <Text type={isNearLimit ? 'danger' : 'secondary'}>
                {currentQuota} / {maxQuota}
              </Text>
            </div>
          </div>
          
          {isNearLimit && (
            <Alert
              message="即将达到浏览限制"
              description="您已浏览了大部分免费内容，注册后可继续浏览更多精彩内容"
              type="warning"
              showIcon
              style={{ marginTop: '12px' }}
            />
          )}
        </Card>

        {/* 升级权益 */}
        <Card title="升级后您将获得" style={{ marginBottom: '24px' }}>
          <List
            dataSource={allBenefits}
            renderItem={(benefit, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getBenefitIcon(index)}
                  title={benefit}
                />
              </List.Item>
            )}
          />
        </Card>

        {/* 注册表单 */}
        <Card title="快速注册" style={{ marginBottom: '24px' }}>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[
                { required: true, message: '请输入昵称' },
                { min: 2, max: 20, message: '昵称长度为2-20个字符' }
              ]}
            >
              <Input 
                placeholder="请输入您的昵称"
                prefix={<UserOutlined />}
              />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="邮箱（可选）"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                placeholder="用于接收重要通知（可选）"
                type="email"
              />
            </Form.Item>
          </Form>
          
          <Alert
            message="隐私保护"
            description="我们承诺保护您的隐私，仅使用必要信息提供个性化服务，不会泄露给第三方。"
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        </Card>

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button size="large" onClick={onClose}>
              稍后再说
            </Button>
            <Button 
              type="primary" 
              size="large"
              loading={loading}
              onClick={handleUpgrade}
              style={{ minWidth: '120px' }}
            >
              立即注册
            </Button>
          </Space>
        </div>

        {/* 底部说明 */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            注册即表示您同意我们的服务条款和隐私政策
          </Text>
        </div>
      </div>
    </Modal>
  );
};

// 使用示例组件
export const UserUpgradeExample: React.FC = () => {
  const [visible, setVisible] = useState(false);

  const handleUpgrade = async (userData: { nickname: string; email?: string }) => {
    console.log('Upgrading user:', userData);
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  };

  return (
    <div>
      <Button onClick={() => setVisible(true)}>
        显示升级提示
      </Button>
      
      <UserUpgradePrompt
        visible={visible}
        onClose={() => setVisible(false)}
        onUpgrade={handleUpgrade}
        currentQuota={45}
        maxQuota={50}
        userType={UserType.ANONYMOUS}
        benefits={[
          '浏览更多内容（1000条）',
          '个性化内容推荐',
          '浏览历史记录',
          '更高的请求频率限制'
        ]}
      />
    </div>
  );
};
