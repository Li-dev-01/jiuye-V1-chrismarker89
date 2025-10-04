/**
 * 半匿名登录组件
 * 支持A+B组合登录
 */

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Alert, Checkbox, Divider, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, SafetyOutlined, UserAddOutlined } from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { validateAValue, validateBValue, validateABCombination } from '../../utils/crypto';
import { GoogleLoginButton } from './GoogleLoginButton';
import DigitVerification from './DigitVerification';
import ABCredentialsDisplay from './ABCredentialsDisplay';
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
  const [activeTab, setActiveTab] = useState('manual');

  // 自动注册相关状态
  const [showDigitVerification, setShowDigitVerification] = useState(false);
  const [showABCredentials, setShowABCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    identityA: string;
    identityB: string;
  } | null>(null);
  const [isAutoRegistering, setIsAutoRegistering] = useState(false);

  // 实时验证A值
  const handleAValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (form) {
      form.setFieldValue('identityA', value);
    }

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
    if (form) {
      form.setFieldValue('identityB', value);
    }

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
        
        if (form) {
          form.resetFields();
        }
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
    if (form) {
      form.resetFields();
    }
    setValidationErrors([]);
    clearError();
  };

  // 关闭模态框
  const handleClose = () => {
    if (form) {
      form.resetFields();
    }
    setValidationErrors([]);
    clearError();
    onClose();
  };

  // 检查表单是否可提交
  const isFormValid = () => {
    if (!form) return false;
    const values = form.getFieldsValue();
    return validateAValue(values.identityA || '') &&
           validateBValue(values.identityB || '') &&
           validationErrors.length === 0;
  };

  // 自动注册相关函数
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
  const handleDigitVerificationSuccess = async (selectedDigit: number) => {
    setShowDigitVerification(false);
    setIsAutoRegistering(true);

    try {
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
      setIsAutoRegistering(false);
    }
  };

  // AB凭证确认，完成注册
  const handleABCredentialsConfirm = () => {
    setShowABCredentials(false);
    setIsAutoRegistering(false);
    setGeneratedCredentials(null);

    // 成功回调
    onSuccess?.();
    onClose();
  };

  // 取消数字验证
  const handleDigitVerificationCancel = () => {
    setShowDigitVerification(false);
    setIsAutoRegistering(false);
  };

  // 取消AB凭证展示
  const handleABCredentialsCancel = () => {
    setShowABCredentials(false);
    setIsAutoRegistering(false);
    setGeneratedCredentials(null);
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>注册/登录</span>
          </Space>
        }
        open={visible && !showDigitVerification && !showABCredentials}
        onCancel={handleClose}
        footer={null}
        width={600}
        centered
        destroyOnHidden
        className={styles.modal}
      >
        <div className={styles.container}>
          {/* 选项卡 */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              {
                key: 'manual',
                label: (
                  <Space>
                    <UserOutlined />
                    手动登录
                  </Space>
                ),
                children: (
                  <div>
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
                      key="manual-login-form"
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
                              ({form?.getFieldValue('identityA')?.length || 0}/11)
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
                              ({form?.getFieldValue('identityB')?.length || 0}/6)
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
                  </div>
                )
              },
              {
                key: 'auto',
                label: (
                  <Space>
                    <SafetyOutlined />
                    自动注册
                  </Space>
                ),
                children: (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div>
                        <SafetyOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                        <Typography.Title level={4}>自动注册</Typography.Title>
                        <Typography.Paragraph type="secondary">
                          系统自动创建匿名账户，通过简单验证后即可登录。
                        </Typography.Paragraph>
                      </div>

                      <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
                        <li>✓ 自动创建账户</li>
                        <li>✓ 完全匿名</li>
                        <li>✓ 防脚本验证</li>
                        <li>✓ 凭证下载</li>
                      </ul>

                      <Button
                        type="primary"
                        size="large"
                        icon={<UserAddOutlined />}
                        onClick={handleStartAutoRegister}
                        loading={isAutoRegistering}
                        block
                        style={{
                          background: '#52c41a',
                          borderColor: '#52c41a',
                          height: '48px',
                          fontSize: '16px'
                        }}
                      >
                        开始自动注册
                      </Button>
                    </Space>
                  </div>
                )
              },
              {
                key: 'google',
                label: (
                  <Space>
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE3LjY0IDkuMjA0NTVDMTcuNjQgOC41NjY4MiAxNy41ODI3IDcuOTUyMjcgMTcuNDc2NCA3LjM2MzY0SDE5VjEwLjg0MDlIMTUuNjkwOUMxNS4zMDQ1IDEyLjI5NTUgMTQuNDIyNyAxMy41MjI3IDEzLjE1OTEgMTQuMzI5NUwxNS43MTU5IDE2LjMzODZDMTYuOTM2NCAxNS4yNTQ1IDE3LjY0IDEyLjk0NTUgMTcuNjQgOS4yMDQ1NVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTkgMThDMTEuNDMgMTggMTMuNDY3MyAxNy4xOTQxIDE1LjcxNTkgMTUuMzM4NkwxMy4xNTkxIDEzLjMyOTVDMTIuNDQzMiAxMy44MTk1IDExLjQ5MDkgMTQuMTM2NCAxMCAxNC4xMzY0QzcuNjU5MDkgMTQuMTM2NCA1LjY3MjczIDEyLjk5NTUgNC45NjM2NCAxMS4yOTU1TDIuMjY4MTggMTMuMzY4MkM0LjUwNDU1IDE3LjgwNDUgNi42MjI3MyAxOCA5IDE4WiIgZmlsbD0iIzM0QTg1MyIvPgo8cGF0aCBkPSJNNC45NjM2NCAxMS4yOTU1QzQuNjgxODIgMTAuODA0NSA0LjUyMjczIDEwLjI1IDQuNTIyNzMgOS42ODE4MkM0LjUyMjczIDkuMTEzNjQgNC42ODE4MiA4LjU1OTA5IDQuOTYzNjQgOC4wNjgxOEw0Ljk2MzY0IDUuOTMxODJMMi4yNjgxOCAzLjg1OTA5QzEuNjQwOTEgNS4xMTM2NCAxLjI3MjczIDYuNTQ1NDUgMS4yNzI3MyA4LjA2ODE4QzEuMjcyNzMgOS41OTA5MSAxLjY0MDkxIDExLjAyMjcgMi4yNjgxOCAxMi4yNzI3TDQuOTYzNjQgMTEuMjk1NVoiIGZpbGw9IiNGQkJDMDQiLz4KPHBhdGggZD0iTTkgMy44NjM2NEMxMC42NTQ1IDMuODYzNjQgMTIuMDg2NCA0LjQ1NDU1IDEzLjE4MTggNS40OTU0NUwxNS40MDkxIDMuMjY4MThDMTMuNDY3MyAxLjQ5MDkxIDExLjQzIDAgOSAwQzYuNjIyNzMgMCA0LjUwNDU1IDIuMTk1NDUgMi4yNjgxOCA2LjYzMTgyTDQuOTYzNjQgOC42NTkwOUM1LjY3MjczIDYuOTU5MDkgNy42NTkwOSAzLjg2MzY0IDkgMy44NjM2NFoiIGZpbGw9IiNFQTQzMzUiLz4KPC9zdmc+"
                      alt="Google"
                      style={{ width: 16, height: 16 }}
                    />
                    Google登录
                  </Space>
                ),
                children: (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div>
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE3LjY0IDkuMjA0NTVDMTcuNjQgOC41NjY4MiAxNy41ODI3IDcuOTUyMjcgMTcuNDc2NCA3LjM2MzY0SDE5VjEwLjg0MDlIMTUuNjkwOUMxNS4zMDQ1IDEyLjI5NTUgMTQuNDIyNyAxMy41MjI3IDEzLjE1OTEgMTQuMzI5NUwxNS43MTU5IDE2LjMzODZDMTYuOTM2NCAxNS4yNTQ1IDE3LjY0IDEyLjk0NTUgMTcuNjQgOS4yMDQ1NVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTkgMThDMTEuNDMgMTggMTMuNDY3MyAxNy4xOTQxIDE1LjcxNTkgMTUuMzM4NkwxMy4xNTkxIDEzLjMyOTVDMTIuNDQzMiAxMy44MTk1IDExLjQ5MDkgMTQuMTM2NCAxMCAxNC4xMzY0QzcuNjU5MDkgMTQuMTM2NCA1LjY3MjczIDEyLjk5NTUgNC45NjM2NCAxMS4yOTU1TDIuMjY4MTggMTMuMzY4MkM0LjUwNDU1IDE3LjgwNDUgNi42MjI3MyAxOCA5IDE4WiIgZmlsbD0iIzM0QTg1MyIvPgo8cGF0aCBkPSJNNC45NjM2NCAxMS4yOTU1QzQuNjgxODIgMTAuODA0NSA0LjUyMjczIDEwLjI1IDQuNTIyNzMgOS42ODE4MkM0LjUyMjczIDkuMTEzNjQgNC42ODE4MiA4LjU1OTA5IDQuOTYzNjQgOC4wNjgxOEw0Ljk2MzY0IDUuOTMxODJMMi4yNjgxOCAzLjg1OTA5QzEuNjQwOTEgNS4xMTM2NCAxLjI3MjczIDYuNTQ1NDUgMS4yNzI3MyA4LjA2ODE4QzEuMjcyNzMgOS41OTA5MSAxLjY0MDkxIDExLjAyMjcgMi4yNjgxOCAxMi4yNzI3TDQuOTYzNjQgMTEuMjk1NVoiIGZpbGw9IiNGQkJDMDQiLz4KPHBhdGggZD0iTTkgMy44NjM2NEMxMC42NTQ1IDMuODYzNjQgMTIuMDg2NCA0LjQ1NDU1IDEzLjE4MTggNS40OTU0NUwxNS40MDkxIDMuMjY4MThDMTMuNDY3MyAxLjQ5MDkxIDExLjQzIDAgOSAwQzYuNjIyNzMgMCA0LjUwNDU1IDIuMTk1NDUgMi4yNjgxOCA2LjYzMTgyTDQuOTYzNjQgOC42NTkwOUM1LjY3MjczIDYuOTU5MDkgNy42NTkwOSAzLjg2MzY0IDkgMy44NjM2NFoiIGZpbGw9IiNFQTQzMzUiLz4KPC9zdmc+"
                          alt="Google"
                          style={{ width: 48, height: 48, marginBottom: 16 }}
                        />
                        <Typography.Title level={4}>Google 一键登录</Typography.Title>
                        <Typography.Paragraph type="secondary">
                          使用Google账号快速登录，自动创建匿名身份。
                        </Typography.Paragraph>
                      </div>

                      <GoogleLoginButton
                        userType="questionnaire"
                        type="primary"
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
                          height: '48px',
                          fontSize: '16px'
                        }}
                      />

                      <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
                        使用Google账号自动创建匿名身份
                      </Typography.Paragraph>
                    </Space>
                  </div>
                )
              }
            ]}
          />
        </div>
      </Modal>

      {/* 数字验证弹窗 */}
      <DigitVerification
        visible={showDigitVerification}
        onSuccess={handleDigitVerificationSuccess}
        onCancel={handleDigitVerificationCancel}
        title="防脚本验证"
        description="为了防止恶意注册，请选择正确的数字"
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

export default SemiAnonymousLogin;
