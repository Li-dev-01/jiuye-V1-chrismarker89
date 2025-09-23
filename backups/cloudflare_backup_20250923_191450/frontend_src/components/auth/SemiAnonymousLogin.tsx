/**
 * 半匿名登录组件
 * 支持A+B组合登录
 */

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Alert, Checkbox, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { validateAValue, validateBValue, validateABCombination } from '../../utils/crypto';
import { GoogleLoginButton } from './GoogleLoginButton';
import styles from './SemiAnonymousLogin.module.css';

const { Title, Text, Paragraph } = Typography;

interface SemiAnonymousLoginProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  identityA: string;
  identityB: string;
  remember: boolean;
}

export const SemiAnonymousLogin: React.FC<SemiAnonymousLoginProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm<FormValues>();
  const { loginSemiAnonymous, isLoading, error, clearError } = useUniversalAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 实时验证A值
  const handleAValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    form.setFieldValue('identityA', value);

    if (value && !validateAValue(value)) {
      setValidationErrors(prev =>
        prev.includes('A值格式错误') ? prev : [...prev, 'A值格式错误']
      );
    } else {
      setValidationErrors(prev => prev.filter(err => err !== 'A值格式错误'));
    }
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

    if (value && !validateBValue(value)) {
      setValidationErrors(prev =>
        prev.includes('B值格式错误') ? prev : [...prev, 'B值格式错误']
      );
    } else {
      setValidationErrors(prev => prev.filter(err => err !== 'B值格式错误'));
    }
  };

  // 表单提交
  const handleSubmit = async (values: FormValues) => {
    clearError();
    
    // 验证A+B组合
    const validation = validateABCombination(values.identityA, values.identityB);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      const success = await loginSemiAnonymous(values.identityA, values.identityB);
      
      if (success) {
        // 记住身份（如果用户选择）
        if (values.remember) {
          localStorage.setItem('remember_semi_anonymous', 'true');
        }
        
        form.resetFields();
        setValidationErrors([]);
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('半匿名登录失败:', error);
    }
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

  // 检查表单是否可提交
  const isFormValid = () => {
    const values = form.getFieldsValue();
    return validateAValue(values.identityA || '') && 
           validateBValue(values.identityB || '') &&
           validationErrors.length === 0;
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>半匿名身份验证</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={500}
      centered
      destroyOnHidden
      className={styles.modal}
    >
      <div className={styles.container}>
        {/* 描述信息 */}
        <div className={styles.description}>
          <Paragraph>
            请输入您的A+B组合以验证身份。如果您之前在问卷或故事墙中使用过A+B身份标识，请输入相同的组合。
          </Paragraph>
        </div>

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

        {/* 登录表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          className={styles.form}
        >
          {/* A值输入 */}
          <Form.Item
            label={
              <Space>
                <span>身份标识A</span>
                <Text type="danger">*</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({form.getFieldValue('identityA')?.length || 0}/11)
                </Text>
              </Space>
            }
            name="identityA"
            rules={[
              { required: true, message: '请输入身份标识A' },
              {
                validator: (_, value) => {
                  if (!value || validateAValue(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('A值必须是11位任意数字'));
                }
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入11位任意数字（如手机号等）"
              maxLength={11}
              onChange={handleAValueChange}
              className={styles.input}
            />
          </Form.Item>

          <div className={styles.inputHelp}>
            <Text type="secondary">A值为11位任意数字，建议使用手机号码等便于记忆的数字</Text>
          </div>

          {/* B值输入 */}
          <Form.Item
            label={
              <Space>
                <span>身份标识B</span>
                <Text type="danger">*</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({form.getFieldValue('identityB')?.length || 0}/6)
                </Text>
              </Space>
            }
            name="identityB"
            rules={[
              { required: true, message: '请输入身份标识B' },
              {
                validator: (_, value) => {
                  if (!value || validateBValue(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('B值必须是4位或6位数字'));
                }
              }
            ]}
          >
            <Input
              prefix={<LockOutlined />}
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入4位或6位数字（不足6位自动补0）"
              maxLength={6}
              onChange={handleBValueChange}
              suffix={
                <Button
                  type="text"
                  size="small"
                  icon={showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowPassword(!showPassword)}
                />
              }
              className={styles.input}
            />
          </Form.Item>

          <div className={styles.inputHelp}>
            <Text type="secondary">B值为4位或6位数字，不足6位的会自动用0填充（如1234→001234）</Text>
          </div>

          {/* 记住选项 */}
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>
              记住此身份（仅在本设备）
            </Checkbox>
          </Form.Item>

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <Button onClick={handleClear}>
              清除
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              disabled={!isFormValid()}
            >
              确认登录
            </Button>
          </div>
        </Form>

        {/* Google 一键登录分隔线 */}
        <Divider style={{ margin: '24px 0' }}>
          <span style={{ color: '#999', fontSize: '14px' }}>或</span>
        </Divider>

        {/* Google 一键登录 */}
        <div className={styles.googleLogin}>
          <GoogleLoginButton
            userType="questionnaire"
            type="default"
            size="large"
            block
            onSuccess={(userData) => {
              message.success('Google登录成功！');
              onSuccess?.();
              onClose();
            }}
            onError={(error) => {
              message.error(`Google登录失败: ${error}`);
            }}
            style={{
              borderColor: '#4285f4',
              color: '#4285f4',
              height: '48px',
              fontSize: '16px'
            }}
          />
          <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: '#666'
          }}>
            使用Google账号自动创建匿名身份
          </div>
        </div>

        {/* 帮助信息 */}
        <div className={styles.helpSection}>
          <details className={styles.helpDetails}>
            <summary>什么是A+B组合？</summary>
            <div className={styles.helpContent}>
              <div className={styles.helpItem}>
                <Title level={5}>A值（身份标识）</Title>
                <ul>
                  <li>11位数字，通常使用手机号码</li>
                  <li>作为您的主要身份标识</li>
                  <li>示例：13812345678</li>
                </ul>
              </div>
              
              <div className={styles.helpItem}>
                <Title level={5}>B值（身份密码）</Title>
                <ul>
                  <li>4位或6位数字</li>
                  <li>作为您的身份验证密码</li>
                  <li>示例：1234 或 123456</li>
                </ul>
              </div>
              
              <div className={styles.helpItem}>
                <Title level={5}>安全说明</Title>
                <ul>
                  <li>系统只存储加密后的身份标识</li>
                  <li>原始A+B值不会被保存</li>
                  <li>每次登录都需要输入完整的A+B组合</li>
                </ul>
              </div>
            </div>
          </details>
        </div>

        {/* 提示信息 */}
        <div className={styles.infoSection}>
          <Alert
            message="提示"
            description="如果您之前在问卷或故事墙中使用过A+B身份标识，请输入相同的组合。系统不会存储您的原始A+B值，只会生成加密的身份标识。"
            type="info"
            showIcon
          />
        </div>
      </div>
    </Modal>
  );
};

export default SemiAnonymousLogin;
