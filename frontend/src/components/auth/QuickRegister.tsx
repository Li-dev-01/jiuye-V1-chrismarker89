import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Alert, Checkbox } from 'antd';
import { UserOutlined, ThunderboltOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { useNavigate } from 'react-router-dom';
import styles from './QuickRegister.module.css';

const { Title, Paragraph, Text } = Typography;

interface QuickRegisterProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

export const QuickRegister: React.FC<QuickRegisterProps> = ({
  visible,
  onCancel,
  onSuccess,
  redirectTo = '/questionnaire'
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { quickRegister } = useUniversalAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (values: { nickname?: string }) => {
    if (!agreed) {
      return;
    }

    setLoading(true);
    try {
      await quickRegister({
        nickname: values.nickname,
        isAnonymous: true
      });

      // 成功回调
      if (onSuccess) {
        onSuccess();
      }

      // 关闭弹窗
      onCancel();

      // 重定向到指定页面
      navigate(redirectTo);
    } catch (error) {
      console.error('快捷注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setAgreed(false);
    onCancel();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={480}
      className={styles.modal}
      destroyOnHidden
    >
      <div className={styles.content}>
        {/* 头部 */}
        <div className={styles.header}>
          <ThunderboltOutlined className={styles.icon} />
          <Title level={3} className={styles.title}>
            快速参与
          </Title>
          <Paragraph className={styles.subtitle}>
            无需复杂注册，30秒开始您的问卷之旅
          </Paragraph>
        </div>

        {/* 特性说明 */}
        <div className={styles.features}>
          <Alert
            message="匿名用户特权"
            description={
              <ul className={styles.featureList}>
                <li>✅ 完全匿名，保护隐私</li>
                <li>✅ 填写问卷，分享故事</li>
                <li>✅ 下载数据报告</li>
                <li>✅ 30天数据保留</li>
              </ul>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </div>

        {/* 注册表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className={styles.form}
        >
          <Form.Item
            name="nickname"
            label="昵称 (可选)"
            extra="不填写将自动生成匿名昵称"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入您的昵称"
              maxLength={20}
              showCount
            />
          </Form.Item>

          {/* 协议同意 */}
          <Form.Item className={styles.agreement}>
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            >
              我已阅读并同意
              <Button type="link" size="small" className={styles.link}>
                《用户协议》
              </Button>
              和
              <Button type="link" size="small" className={styles.link}>
                《隐私政策》
              </Button>
            </Checkbox>
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item className={styles.actions}>
            <Space size="middle" className={styles.buttonGroup}>
              <Button onClick={handleCancel} className={styles.cancelButton}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={!agreed}
                className={styles.submitButton}
                icon={<ThunderboltOutlined />}
              >
                立即开始
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 底部说明 */}
        <div className={styles.footer}>
          <Text type="secondary" className={styles.footerText}>
            已有账号？
            <Button type="link" size="small" onClick={handleCancel}>
              立即登录
            </Button>
          </Text>
        </div>
      </div>
    </Modal>
  );
};

// 快捷注册按钮组件
interface QuickRegisterButtonProps {
  children?: React.ReactNode;
  redirectTo?: string;
  className?: string;
  [key: string]: any;
}

export const QuickRegisterButton: React.FC<QuickRegisterButtonProps> = ({
  children = '快速参与',
  redirectTo,
  className = '',
  ...buttonProps
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={() => setModalVisible(true)}
        className={className}
        {...buttonProps}
      >
        {children}
      </Button>
      
      <QuickRegister
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        redirectTo={redirectTo}
      />
    </>
  );
};
