/**
 * Google OAuth安全提示组件
 * 在用户进行Google登录前显示隐私安全提示
 */

import React, { useState } from 'react';
import { Modal, Button, Space, Typography, Alert, Checkbox, Divider } from 'antd';
import {
  GoogleOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
  SecurityScanOutlined,
  MailOutlined
} from '@ant-design/icons';
import './GoogleOAuthSecurityPrompt.css';

const { Title, Text, Paragraph } = Typography;

interface GoogleOAuthSecurityPromptProps {
  /** 是否显示提示弹窗 */
  visible: boolean;
  /** 同意并继续回调 */
  onAgree: () => void;
  /** 取消回调 */
  onCancel: () => void;
}

const GoogleOAuthSecurityPrompt: React.FC<GoogleOAuthSecurityPromptProps> = ({
  visible,
  onAgree,
  onCancel
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);

  // 处理同意条款
  const handleAgreeChange = (e: any) => {
    setHasAgreed(e.target.checked);
  };

  // 处理确认继续
  const handleConfirm = () => {
    if (!hasAgreed) {
      return;
    }
    onAgree();
  };

  // 重置状态
  const handleCancel = () => {
    setHasAgreed(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <GoogleOutlined style={{ color: '#4285f4' }} />
          Google一键登录
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="agree"
          type="primary"
          onClick={handleConfirm}
          disabled={!hasAgreed}
          icon={<SecurityScanOutlined />}
        >
          同意并继续
        </Button>
      ]}
      width={500}
      centered
      maskClosable={false}
      className="google-oauth-security-modal"
    >
      <div className="security-prompt-content">
        <Alert
          message="隐私安全提示"
          description="Google一键登录会获得您的邮箱地址，请确保不会透露您的个人信息关联"
          type="warning"
          icon={<SafetyOutlined />}
          showIcon
          className="security-alert"
        />

        <Divider />

        <div className="permission-details">
          <Title level={4}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            我们将获取的信息
          </Title>
          
          <div className="permission-list">
            <div className="permission-item">
              <MailOutlined style={{ color: '#52c41a' }} />
              <div className="permission-text">
                <Text strong>邮箱地址</Text>
                <br />
                <Text type="secondary">用于创建您的匿名账户标识</Text>
              </div>
            </div>
          </div>
        </div>

        <div className="privacy-assurance">
          <Title level={4}>
            <SecurityScanOutlined style={{ color: '#52c41a' }} />
            隐私保护承诺
          </Title>
          
          <ul className="assurance-list">
            <li>
              <Text>您的邮箱地址仅用于生成唯一的匿名标识</Text>
            </li>
            <li>
              <Text>我们不会存储您的真实邮箱地址</Text>
            </li>
            <li>
              <Text>不会向第三方分享您的任何个人信息</Text>
            </li>
            <li>
              <Text>您可以随时删除账户和相关数据</Text>
            </li>
          </ul>
        </div>

        <div className="data-usage">
          <Alert
            message="数据使用说明"
            description="您的问卷数据将完全匿名化处理，仅用于就业趋势分析和统计研究，不会与您的个人身份产生关联。"
            type="info"
            showIcon
          />
        </div>

        <div className="agreement-section">
          <Checkbox
            checked={hasAgreed}
            onChange={handleAgreeChange}
            className="agreement-checkbox"
          >
            <Text>
              我已阅读并理解上述隐私说明，同意使用Google账号登录并创建匿名身份
            </Text>
          </Checkbox>
        </div>
      </div>
    </Modal>
  );
};

export default GoogleOAuthSecurityPrompt;
