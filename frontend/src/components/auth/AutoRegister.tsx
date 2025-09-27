/**
 * 自动注册组件
 * 通过数字验证自动生成A+B凭证并注册用户
 */

import React, { useState } from 'react';
import { Modal, Button, Typography, Space, message } from 'antd';
import { SafetyOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import UniversalAntiSpamVerification from '../common/UniversalAntiSpamVerification';
import ABCredentialsDisplay from './ABCredentialsDisplay';

const { Title, Text, Paragraph } = Typography;

interface AutoRegisterProps {
  /** 是否显示自动注册弹窗 */
  visible: boolean;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 注册成功后跳转的页面 */
  redirectTo?: string;
}

export const AutoRegister: React.FC<AutoRegisterProps> = ({
  visible,
  onCancel,
  onSuccess,
  redirectTo = '/'
}) => {
  const [showDigitVerification, setShowDigitVerification] = useState(false);
  const [showABCredentials, setShowABCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    identityA: string;
    identityB: string;
  } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const { loginSemiAnonymous } = useUniversalAuthStore();
  const navigate = useNavigate();

  // 生成A值（11位数字，以选择的数字开头）
  const generateIdentityA = (firstDigit: number): string => {
    const timestamp = Date.now().toString().slice(-6); // 取时间戳后6位
    const random = Math.random().toString().slice(2, 6); // 4位随机数
    return `${firstDigit}${timestamp}${random}`;
  };

  // 生成B值（选择的数字重复6次）
  const generateIdentityB = (digit: number): string => {
    return digit.toString().repeat(6);
  };

  // 开始自动注册流程
  const handleStartAutoRegister = () => {
    setShowDigitVerification(true);
  };

  // 数字验证成功，生成凭证并注册
  const handleDigitVerificationSuccess = async () => {
    setShowDigitVerification(false);
    setIsRegistering(true);

    try {
      // 生成随机数字作为基础
      const selectedDigit = Math.floor(Math.random() * 10);

      // 生成A值和B值
      const identityA = generateIdentityA(selectedDigit);
      const identityB = generateIdentityB(selectedDigit);

      setGeneratedCredentials({ identityA, identityB });

      // 使用生成的凭证进行注册/登录
      const success = await loginSemiAnonymous(identityA, identityB);

      if (success) {
        // 显示AB凭证供用户保存
        setShowABCredentials(true);
        message.success('自动注册成功！请保存您的登录凭证。');
      } else {
        throw new Error('自动注册失败');
      }
    } catch (error) {
      console.error('自动注册失败:', error);
      message.error('自动注册失败，请重试');
      setIsRegistering(false);
    }
  };

  // AB凭证确认，完成注册
  const handleABCredentialsConfirm = () => {
    setShowABCredentials(false);
    setIsRegistering(false);

    // 成功回调
    if (onSuccess) {
      onSuccess();
    }

    // 关闭主弹窗
    onCancel();

    // 跳转到指定页面
    navigate(redirectTo);
  };

  // 取消数字验证
  const handleDigitVerificationCancel = () => {
    setShowDigitVerification(false);
    setIsRegistering(false);
  };

  // 取消AB凭证展示
  const handleABCredentialsCancel = () => {
    setShowABCredentials(false);
    setIsRegistering(false);
  };

  return (
    <>
      {/* 自动注册说明弹窗 */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: '#52c41a' }} />
            自动注册
          </Space>
        }
        open={visible && !showDigitVerification && !showABCredentials}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            取消
          </Button>,
          <Button
            key="start"
            type="primary"
            icon={<SafetyOutlined />}
            onClick={handleStartAutoRegister}
            loading={isRegistering}
            style={{
              background: '#52c41a',
              borderColor: '#52c41a'
            }}
          >
            开始自动注册
          </Button>
        ]}
        width={480}
        centered
        maskClosable={false}
      >
        <div style={{ padding: '16px 0' }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            什么是自动注册？
          </Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph>
              自动注册是一种快速、安全的账户创建方式：
            </Paragraph>

            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>✓ <strong>完全匿名</strong>：不需要提供任何个人信息</li>
              <li>✓ <strong>防脚本验证</strong>：通过数字验证防止恶意注册</li>
              <li>✓ <strong>自动生成凭证</strong>：系统自动创建A+B登录凭证</li>
              <li>✓ <strong>即时可用</strong>：注册完成后立即可以使用</li>
            </ul>

            <Paragraph type="secondary" style={{ fontSize: 14, marginTop: 16 }}>
              <strong>注册流程：</strong>
              <br />
              1. 通过数字验证确认您是真实用户
              <br />
              2. 系统自动生成唯一的A+B登录凭证
              <br />
              3. 保存凭证以便下次登录使用
            </Paragraph>

            <Paragraph type="warning" style={{ fontSize: 12, marginTop: 16 }}>
              ⚠️ 请务必保存生成的A+B凭证，这是您唯一的登录方式！
            </Paragraph>
          </Space>
        </div>
      </Modal>

      {/* 数字验证弹窗 */}
      <UniversalAntiSpamVerification
        visible={showDigitVerification}
        onClose={handleDigitVerificationCancel}
        onSuccess={handleDigitVerificationSuccess}
        onCancel={handleDigitVerificationCancel}
        title="防脚本验证"
        description="为了防止恶意注册，请选择正确的数字"
        autoSubmit={false}
      />

      {/* AB凭证展示弹窗 */}
      {generatedCredentials && (
        <ABCredentialsDisplay
          visible={showABCredentials}
          identityA={generatedCredentials.identityA}
          identityB={generatedCredentials.identityB}
          onConfirm={handleABCredentialsConfirm}
          onCancel={handleABCredentialsCancel}
        />
      )}
    </>
  );
};

export default AutoRegister;
