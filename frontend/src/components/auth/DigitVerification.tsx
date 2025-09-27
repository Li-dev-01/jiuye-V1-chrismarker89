/**
 * 数字验证组件
 * 用于防止脚本刷问卷，显示1-9中的随机数字供用户选择
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, message } from 'antd';
import { SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import './DigitVerification.css';

const { Title, Text } = Typography;

interface DigitVerificationProps {
  /** 是否显示验证弹窗 */
  visible: boolean;
  /** 验证成功回调 */
  onSuccess: (selectedDigit: number) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 自定义标题 */
  title?: string;
  /** 自定义描述 */
  description?: string;
}

const DigitVerification: React.FC<DigitVerificationProps> = ({
  visible,
  onSuccess,
  onCancel,
  title = '安全验证',
  description = '为了防止恶意提交，请选择正确的数字'
}) => {
  const [targetDigit, setTargetDigit] = useState<number>(1);
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 生成1-9的随机数字
  const generateRandomDigit = () => {
    const digit = Math.floor(Math.random() * 9) + 1;
    setTargetDigit(digit);
    setSelectedDigit(null);
  };

  // 初始化时生成随机数字
  useEffect(() => {
    if (visible) {
      generateRandomDigit();
    }
  }, [visible]);

  // 处理数字选择
  const handleDigitSelect = (digit: number) => {
    setSelectedDigit(digit);
  };

  // 处理验证提交
  const handleVerify = async () => {
    if (selectedDigit === null) {
      message.warning('请选择一个数字');
      return;
    }

    if (selectedDigit !== targetDigit) {
      message.error('选择错误，请重试');
      generateRandomDigit(); // 重新生成数字
      return;
    }

    setIsVerifying(true);
    
    try {
      // 模拟验证延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('验证成功！');
      onSuccess(selectedDigit);
    } catch (error) {
      message.error('验证失败，请重试');
    } finally {
      setIsVerifying(false);
    }
  };

  // 重新生成数字
  const handleRefresh = () => {
    generateRandomDigit();
    message.info('已重新生成验证数字');
  };

  // 生成数字选择按钮
  const renderDigitButtons = () => {
    const digits = Array.from({ length: 9 }, (_, i) => i + 1);
    
    return (
      <div className="digit-buttons-grid">
        {digits.map(digit => (
          <Button
            key={digit}
            type={selectedDigit === digit ? 'primary' : 'default'}
            size="large"
            className="digit-button"
            onClick={() => handleDigitSelect(digit)}
          >
            {digit}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyOutlined style={{ color: '#1890ff' }} />
          {title}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
          重新生成
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="verify"
          type="primary"
          loading={isVerifying}
          onClick={handleVerify}
          disabled={selectedDigit === null}
        >
          确认验证
        </Button>
      ]}
      width={400}
      centered
      maskClosable={false}
      className="digit-verification-modal"
    >
      <div className="verification-content">
        <div className="verification-description">
          <Text type="secondary">{description}</Text>
        </div>

        <div className="target-digit-display">
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            请选择数字：{targetDigit}
          </Title>
        </div>

        <div className="digit-selection">
          <Text strong>点击选择对应的数字：</Text>
          {renderDigitButtons()}
        </div>

        {selectedDigit !== null && (
          <div className="selected-feedback">
            <Text type={selectedDigit === targetDigit ? 'success' : 'danger'}>
              您选择了：{selectedDigit}
              {selectedDigit === targetDigit ? ' ✓' : ' ✗'}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DigitVerification;
