/**
 * 内联快捷注册组件
 * 在心声问题下方直接提供A+B账号注册/登录入口
 */

import React, { useState } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Space,
  Typography,
  Alert,
  Divider,
  message
} from 'antd';
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  HeartOutlined
} from '@ant-design/icons';
import { useQuestionnaireAuthStore } from '../../stores/questionnaireAuthStore';
import styles from './InlineQuickRegistration.module.css';

const { Text, Paragraph } = Typography;

interface InlineQuickRegistrationProps {
  onAuthSuccess: (authType: 'quick-register' | 'semi-anonymous-login') => void;
  onSkip: () => void;
}

export const InlineQuickRegistration: React.FC<InlineQuickRegistrationProps> = ({
  onAuthSuccess,
  onSkip
}) => {
  const [form] = Form.useForm();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    loginWithAB,
    isLoading,
    error,
    clearError
  } = useQuestionnaireAuthStore();

  // 实时验证A值
  const handleAValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    form.setFieldValue('identityA', value);
  };

  // 实时验证B值
  const handleBValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    // 如果输入4位数字，自动补充为6位（前面补0）
    if (value.length === 4) {
      value = '00' + value;
    }

    value = value.slice(0, 6);
    form.setFieldValue('identityB', value);
  };

  // 统一的A+B注册/登录处理
  const handleABSubmit = async (values: { identityA: string; identityB: string }) => {
    clearError();
    setValidationErrors([]);

    // 验证A值
    if (!values.identityA || values.identityA.length !== 11) {
      setValidationErrors(['A值必须是11位数字']);
      return;
    }

    // 验证B值
    if (!values.identityB || (values.identityB.length !== 4 && values.identityB.length !== 6)) {
      setValidationErrors(['B值必须是4位或6位数字']);
      return;
    }

    try {
      // 使用统一的loginWithAB方法，后端会自动处理注册或登录
      const success = await loginWithAB({
        identityA: values.identityA,
        identityB: values.identityB,
        remember: false
      });

      if (success) {
        message.success('身份验证成功！现在可以分享您的心声了');
        onAuthSuccess('semi-anonymous-login');
      }
    } catch (error) {
      console.error('A+B操作失败:', error);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.authCard}>
        <div className={styles.promptHeader}>
          <HeartOutlined className={styles.promptIcon} />
          <Text strong>分享您的心声</Text>
        </div>
        <Paragraph className={styles.promptText}>
          请设置您的A+B身份标识即可分享心声。如果是新用户，系统会自动为您注册；如果是老用户，将直接登录。
        </Paragraph>

        {/* 错误提示 */}
        {(error || validationErrors.length > 0) && (
          <Alert
            message="验证失败"
            description={error || validationErrors.join('，')}
            type="error"
            showIcon
            closable
            onClose={() => {
              clearError();
              setValidationErrors([]);
            }}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          onFinish={handleABSubmit}
          layout="vertical"
          className={styles.authForm}
        >
          <Form.Item
            name="identityA"
            label={
              <Space>
                <span>身份标识A</span>
                <Text type="danger">*</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({form.getFieldValue('identityA')?.length || 0}/11)
                </Text>
              </Space>
            }
            rules={[
              { required: true, message: '请输入身份标识A' },
              { len: 11, message: 'A值必须是11位数字' }
            ]}
          >
            <Input
              placeholder="请输入11位任意数字（如手机号等）"
              maxLength={11}
              onChange={handleAValueChange}
            />
          </Form.Item>

          <div style={{ marginBottom: 16, fontSize: '12px', color: '#666' }}>
            A值为11位任意数字，建议使用手机号码等便于记忆的数字
          </div>

          <Form.Item
            name="identityB"
            label={
              <Space>
                <span>身份标识B</span>
                <Text type="danger">*</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({form.getFieldValue('identityB')?.length || 0}/6)
                </Text>
              </Space>
            }
            rules={[
              { required: true, message: '请输入身份标识B' },
              {
                validator: (_, value) => {
                  if (!value || value.length === 4 || value.length === 6) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('B值必须是4位或6位数字'));
                }
              }
            ]}
          >
            <Input.Password
              placeholder="请输入4位或6位数字（不足6位自动补0）"
              maxLength={6}
              onChange={handleBValueChange}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <div style={{ marginBottom: 16, fontSize: '12px', color: '#666' }}>
            B值为4位或6位数字，不足6位的会自动用0填充（如1234→001234）
          </div>

          <Divider />

          <Space className={styles.actionButtons} size="large">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              icon={<HeartOutlined />}
              size="large"
            >
              提交并分享心声
            </Button>

            <Button onClick={onSkip} size="large">
              跳过心声部分
            </Button>
          </Space>
        </Form>

        {error && (
          <Alert
            message="操作失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );

};
