/**
 * 通用防刷验证组件
 * 可用于问卷提交、用户注册、敏感操作等场景
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Row, Col, message } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface UniversalAntiSpamVerificationProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  width?: number;
  autoSubmit?: boolean; // 是否验证成功后自动执行回调
}

const UniversalAntiSpamVerification: React.FC<UniversalAntiSpamVerificationProps> = ({
  visible,
  onClose,
  onSuccess,
  onCancel,
  title = "防刷本验证",
  description = "为了防止恶意操作，请选择正确的数字",
  width = 480,
  autoSubmit = true
}) => {
  const [systemDigit, setSystemDigit] = useState<number>(0);

  // 生成随机数字
  const generateRandomDigit = (): number => {
    return Math.floor(Math.random() * 10);
  };

  // 初始化时生成随机数字
  useEffect(() => {
    if (visible) {
      setSystemDigit(generateRandomDigit());
    }
  }, [visible]);

  // 处理数字选择
  const handleDigitSelect = (selectedDigit: number) => {
    console.log('🔢 用户选择数字:', selectedDigit, '系统数字:', systemDigit);

    if (selectedDigit === systemDigit) {
      console.log('✅ 数字验证成功！autoSubmit:', autoSubmit);
      message.success('验证成功！');

      if (autoSubmit) {
        console.log('🚀 自动模式：500ms后执行回调');
        // 自动执行成功回调
        setTimeout(() => {
          console.log('⏰ 延迟时间到，执行 onSuccess 回调');
          onSuccess();
        }, 500);
      } else {
        console.log('👆 手动模式：立即执行回调');
        // 手动模式，只关闭弹窗
        onSuccess();
      }
    } else {
      console.log('❌ 数字验证失败');
      message.error('验证失败，请重新选择');
      // 重新生成数字
      setSystemDigit(generateRandomDigit());
    }
  };

  // 重新生成数字
  const handleRegenerate = () => {
    setSystemDigit(generateRandomDigit());
    message.info('已重新生成验证数字');
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={width}
      destroyOnClose
      centered
      styles={{
        body: { padding: '40px 32px' }
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* 头部图标和标题 */}
        <div style={{ marginBottom: '32px' }}>
          <SafetyOutlined style={{ 
            fontSize: '48px', 
            color: '#1890ff', 
            marginBottom: '16px',
            display: 'block'
          }} />
          <Title level={3} style={{ marginBottom: '8px', color: '#262626' }}>
            {title}
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
            {description}
          </Text>
        </div>

        {/* 系统生成的数字显示区域 */}
        <div style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
        }}>
          <Text style={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '14px',
            display: 'block',
            marginBottom: '8px'
          }}>
            请选择数字：
          </Text>
          <div style={{
            fontSize: '48px',
            fontWeight: '900',
            color: '#ffffff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            fontFamily: 'Arial Black, sans-serif',
            letterSpacing: '3px',
            userSelect: 'none'
          }}>
            {systemDigit}
          </div>
        </div>

        {/* 数字选择区域 */}
        <div>
          <Text style={{ 
            color: '#595959', 
            fontSize: '14px',
            display: 'block',
            marginBottom: '16px'
          }}>
            点击选择对应数字：
          </Text>
          <Row gutter={[8, 8]} justify="center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
              <Col key={digit} span={4}>
                <Button
                  size="large"
                  style={{
                    width: '100%',
                    height: '48px',
                    fontSize: '18px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#40a9ff';
                    e.currentTarget.style.color = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.color = 'rgba(0, 0, 0, 0.88)';
                  }}
                  onClick={() => handleDigitSelect(digit)}
                >
                  {digit}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* 底部操作区域 */}
        <div style={{ 
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <Button 
            type="link" 
            onClick={handleRegenerate}
            style={{ 
              color: '#8c8c8c',
              fontSize: '14px'
            }}
          >
            重新生成
          </Button>
          <Button 
            type="link" 
            onClick={onCancel}
            style={{ 
              color: '#8c8c8c',
              fontSize: '14px',
              marginLeft: '16px'
            }}
          >
            取消
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UniversalAntiSpamVerification;
