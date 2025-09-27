/**
 * 认证功能测试页面
 * 用于测试Google一键登录和自动登录功能
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, message, Modal, Input } from 'antd';
import { GoogleOutlined, UserAddOutlined, LoginOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { googleOAuthService } from '../../services/googleOAuthService';
import { questionnaireAuthService } from '../../services/questionnaireAuthService';
import { useAuth } from '../../stores/universalAuthStore';
import CredentialsPngGenerator from '../../components/auth/CredentialsPngGenerator';

const { Title, Paragraph, Text } = Typography;

export const AuthTestPage: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDigitVerification, setShowDigitVerification] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    identityA: string;
    identityB: string;
  } | null>(null);
  const [userInfo, setUserInfo] = useState<{
    uuid: string;
    display_name: string;
    created_at: string;
  } | null>(null);
  const [systemDigit, setSystemDigit] = useState<number>(0);
  const [userSelectedDigit, setUserSelectedDigit] = useState<number | null>(null);

  // Google一键登录测试
  const testGoogleLogin = async () => {
    setLoading(true);
    try {
      message.info('正在跳转到Google登录...');
      await googleOAuthService.signIn('questionnaire');
    } catch (error) {
      console.error('Google登录失败:', error);
      message.error('Google登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 自动登录测试 - 生成随机数字验证
  const testAutoLogin = () => {
    // 系统随机生成0-9的数字
    const randomDigit = Math.floor(Math.random() * 10);
    setSystemDigit(randomDigit);
    setUserSelectedDigit(null);
    setShowDigitVerification(true);
  };

  // 处理用户数字选择验证
  const handleDigitVerification = async (selectedDigit: number) => {
    setUserSelectedDigit(selectedDigit);

    // 验证用户选择是否正确
    if (selectedDigit !== systemDigit) {
      message.error('验证失败，请选择正确的数字');
      return;
    }

    setShowDigitVerification(false);
    setLoading(true);

    try {
      // 使用系统生成的数字生成A值和B值
      const identityA = generateIdentityA(systemDigit);
      const identityB = generateIdentityB(systemDigit);

      setGeneratedCredentials({ identityA, identityB });

      // 使用生成的凭证进行认证
      const authResult = await questionnaireAuthService.authenticateWithAPI(identityA, identityB, true);

      if (authResult.success) {
        // 设置用户信息
        if (authResult.data?.user) {
          setUserInfo({
            uuid: authResult.data.user.uuid,
            display_name: authResult.data.user.display_name,
            created_at: authResult.data.user.created_at
          });
        }
        setShowCredentials(true);
        message.success('验证成功！自动登录完成，请保存您的登录凭证。');
      } else {
        throw new Error(authResult.error || '自动登录失败');
      }
    } catch (error) {
      console.error('自动登录失败:', error);
      message.error('自动登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

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

  // 手动AB登录测试
  const testManualABLogin = () => {
    Modal.confirm({
      title: '手动AB登录测试',
      content: (
        <div>
          <Paragraph>请输入测试凭证：</Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="A值 (11位数字)" id="test-identity-a" />
            <Input placeholder="B值 (4位或6位数字)" id="test-identity-b" />
          </Space>
        </div>
      ),
      onOk: async () => {
        const identityA = (document.getElementById('test-identity-a') as HTMLInputElement)?.value;
        const identityB = (document.getElementById('test-identity-b') as HTMLInputElement)?.value;

        if (!identityA || !identityB) {
          message.error('请输入完整的AB凭证');
          return;
        }

        try {
          const authResult = await questionnaireAuthService.authenticateWithAPI(identityA, identityB, true);
          if (authResult.success) {
            message.success('手动AB登录成功！');
          } else {
            message.error(authResult.error || '登录失败');
          }
        } catch (error) {
          console.error('手动AB登录失败:', error);
          message.error('登录失败，请重试');
        }
      }
    });
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await logout();
      message.success('已退出登录');
    } catch (error) {
      console.error('退出登录失败:', error);
      message.error('退出登录失败');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Title level={2}>认证功能测试页面</Title>
          <Paragraph>
            这个页面用于测试Google一键登录和自动登录功能，确保在集成到问卷流程之前功能正常工作。
          </Paragraph>
        </Card>

        {/* 当前登录状态 */}
        <Card title="当前登录状态">
          {isAuthenticated ? (
            <Space direction="vertical">
              <Alert
                message="已登录"
                description={`用户: ${currentUser?.displayName || '未知用户'}`}
                type="success"
                showIcon
              />
              <Button onClick={handleLogout} type="default">
                退出登录
              </Button>
            </Space>
          ) : (
            <Alert
              message="未登录"
              description="请选择下方的登录方式进行测试"
              type="info"
              showIcon
            />
          )}
        </Card>

        {/* 登录测试选项 */}
        <Card title="登录方式测试">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<GoogleOutlined />}
              size="large"
              loading={loading}
              onClick={testGoogleLogin}
              style={{ width: '100%' }}
            >
              测试 Google 一键登录
            </Button>

            <Button
              type="primary"
              icon={<UserAddOutlined />}
              size="large"
              loading={loading}
              onClick={testAutoLogin}
              style={{ width: '100%' }}
            >
              测试自动登录（创建匿名账户）
            </Button>

            <Button
              type="default"
              icon={<LoginOutlined />}
              size="large"
              onClick={testManualABLogin}
              style={{ width: '100%' }}
            >
              测试手动AB登录
            </Button>
          </Space>
        </Card>

        {/* 功能说明 */}
        <Card title="功能说明">
          <Space direction="vertical">
            <div>
              <Text strong>Google一键登录：</Text>
              <Paragraph>
                使用Google账号快速登录，会跳转到Google OAuth页面进行授权。
              </Paragraph>
            </div>
            <div>
              <Text strong>自动登录：</Text>
              <Paragraph>
                系统自动创建匿名账户，用户选择一个数字，系统生成AB凭证。
              </Paragraph>
            </div>
            <div>
              <Text strong>手动AB登录：</Text>
              <Paragraph>
                使用已有的AB凭证进行登录，适用于已经注册过的用户。
              </Paragraph>
            </div>
          </Space>
        </Card>
      </Space>

      {/* 数字验证弹窗 - 防刷验证 */}
      <Modal
        title="防刷验证"
        open={showDigitVerification}
        footer={null}
        onCancel={() => setShowDigitVerification(false)}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
          <Paragraph>
            为了防止恶意刷取，请点击下方与系统显示数字相同的按钮：
          </Paragraph>

          {/* 系统生成的数字 - 使用大字体防AI识别 */}
          <div style={{
            fontSize: '120px',
            fontWeight: '900',
            color: '#1890ff',
            textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
            fontFamily: 'Arial Black, sans-serif',
            letterSpacing: '10px',
            margin: '20px 0',
            userSelect: 'none'
          }}>
            {systemDigit}
          </div>

          <Paragraph type="secondary">
            请在下方按钮中选择与上方显示相同的数字
          </Paragraph>

          <Space wrap style={{ justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
              <Button
                key={digit}
                type={userSelectedDigit === digit ? "primary" : "default"}
                size="large"
                onClick={() => handleDigitVerification(digit)}
                style={{
                  width: 60,
                  height: 60,
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                {digit}
              </Button>
            ))}
          </Space>

          {userSelectedDigit !== null && userSelectedDigit !== systemDigit && (
            <Alert
              message="验证失败"
              description="请选择与系统显示相同的数字"
              type="error"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </Space>
      </Modal>

      {/* 凭证显示弹窗 */}
      <Modal
        title="登录凭证"
        open={showCredentials}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowCredentials(false)}>
            关闭
          </Button>
        ]}
        onCancel={() => setShowCredentials(false)}
        width={800}
      >
        {generatedCredentials && (
          <CredentialsPngGenerator
            identityA={generatedCredentials.identityA}
            identityB={generatedCredentials.identityB}
            userInfo={userInfo}
            onDownloadComplete={() => {
              message.success('凭证已下载，请妥善保存！');
            }}
          />
        )}
      </Modal>
    </div>
  );
};
