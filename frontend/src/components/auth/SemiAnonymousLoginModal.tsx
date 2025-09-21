/**
 * 半匿名用户A+B登录模态框
 * 专门用于问卷系统的身份验证
 */

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Checkbox, Alert, Space, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useQuestionnaireAuthStore } from '../../stores/questionnaireAuthStore';
import { TEST_AB_COMBINATIONS } from '../../types/questionnaire-auth';

const { Text, Link } = Typography;

interface SemiAnonymousLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  identityA: string;
  identityB: string;
  remember: boolean;
}

export const SemiAnonymousLoginModal: React.FC<SemiAnonymousLoginModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  
  const { loginWithAB, isLoading, error, clearError } = useQuestionnaireAuthStore();

  // 表单提交
  const handleSubmit = async (values: FormValues) => {
    clearError();
    setValidationErrors([]);
    
    try {
      const success = await loginWithAB({
        identityA: values.identityA,
        identityB: values.identityB,
        remember: values.remember
      });
      
      if (success) {
        form.resetFields();
        setValidationErrors([]);
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('半匿名登录失败:', error);
    }
  };

  // 快速填入测试组合
  const handleQuickFill = (combination: typeof TEST_AB_COMBINATIONS[0]) => {
    form.setFieldsValue({
      identityA: combination.a,
      identityB: combination.b
    });
  };

  // 清除表单
  const handleClear = () => {
    form.resetFields();
    setValidationErrors([]);
    clearError();
  };

  // 关闭模态框
  const handleClose = () => {
    form.resetFields();
    setValidationErrors([]);
    clearError();
    onClose();
  };

  return (
    <Modal
      title="身份验证"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={480}
      destroyOnHidden
    >
      <div style={{ padding: '16px 0' }}>
        <Alert
          message="请输入您的A+B组合进行身份验证"
          description="A值通常是您的手机号，B值是对应的验证码"
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        {/* 错误信息 */}
        {error && (
          <Alert
            message="验证失败"
            description={error}
            type="error"
            closable
            onClose={clearError}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 验证错误 */}
        {validationErrors.length > 0 && (
          <Alert
            message="输入格式错误"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="warning"
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="identityA"
            label="A值（11位数字）"
            rules={[
              { required: true, message: '请输入A值' },
              { pattern: /^\d{11}$/, message: 'A值必须是11位数字' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入11位数字"
              maxLength={11}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="identityB"
            label="B值（4位或6位数字）"
            rules={[
              { required: true, message: '请输入B值' },
              { pattern: /^\d{4}$|^\d{6}$/, message: 'B值必须是4位或6位数字' }
            ]}
          >
            <Input
              prefix={<LockOutlined />}
              placeholder="请输入4位或6位数字"
              maxLength={6}
              size="large"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我的身份（下次自动填入A值）</Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={handleClear}>
                清除
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                size="large"
              >
                验证身份
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />

        {/* 测试账号 */}
        <div style={{ textAlign: 'center' }}>
          <Link onClick={() => setShowTestAccounts(!showTestAccounts)}>
            {showTestAccounts ? '隐藏' : '显示'}测试组合
          </Link>
        </div>

        {showTestAccounts && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
              点击下方组合快速填入：
            </Text>
            <Space wrap size="small">
              {TEST_AB_COMBINATIONS.map((combination, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => handleQuickFill(combination)}
                  style={{ fontSize: '11px' }}
                >
                  {combination.name}
                </Button>
              ))}
            </Space>
          </div>
        )}
      </div>
    </Modal>
  );
};
