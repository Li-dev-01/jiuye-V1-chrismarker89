/**
 * 状态切换组件
 * 提供4种用户状态的快速切换入口
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Modal, Form, Input, message, Typography, Divider } from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  CrownOutlined,
  SettingOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { globalStateManager, GlobalUserState } from '../../services/globalStateManager';
import { SemiAnonymousLogin } from './SemiAnonymousLogin';
import { validateAValue, validateBValue } from '../../utils/crypto';
import styles from './StateSwitcher.module.css';

const { Title, Text } = Typography;

// 状态选项配置
const STATE_OPTIONS = [
  {
    key: GlobalUserState.ANONYMOUS,
    title: '全匿名参与',
    description: '无需注册，立即开始问卷调查',
    icon: <UserOutlined />,
    color: '#52c41a',
    buttonText: '立即开始',
    features: ['参与问卷调查', '浏览公开内容', '无需注册']
  },
  {
    key: GlobalUserState.SEMI_ANONYMOUS,
    title: '半匿名登录',
    description: '使用A+B组合登录，获得更多权限',
    icon: <SafetyOutlined />,
    color: '#1890ff',
    buttonText: '半匿名登录',
    features: ['管理自己的内容', '下载资源', '数据持久化']
  },
  {
    key: GlobalUserState.REVIEWER,
    title: '审核员登录',
    description: '内容审核和管理权限',
    icon: <CrownOutlined />,
    color: '#722ed1',
    buttonText: '审核员登录',
    features: ['审核内容', '管理审核队列', '查看统计']
  },
  {
    key: GlobalUserState.ADMIN,
    title: '管理员登录',
    description: '项目管理和系统设置权限',
    icon: <SettingOutlined />,
    color: '#fa541c',
    buttonText: '管理员登录',
    features: ['用户管理', '系统设置', '数据分析']
  }
];

interface StateSwitcherProps {
  onStateChange?: (state: GlobalUserState) => void;
  currentState?: GlobalUserState;
}

export const StateSwitcher: React.FC<StateSwitcherProps> = ({
  onStateChange,
  currentState = GlobalUserState.ANONYMOUS
}) => {
  const [loading, setLoading] = useState(false);
  const [semiAnonymousVisible, setSemiAnonymousVisible] = useState(false);
  const [adminLoginVisible, setAdminLoginVisible] = useState(false);
  const [adminForm] = Form.useForm();

  // 清理form实例
  useEffect(() => {
    return () => {
      adminForm.resetFields();
    };
  }, [adminForm]);

  const handleStateSwitch = async (targetState: GlobalUserState) => {
    if (targetState === currentState) {
      message.info('当前已是该状态');
      return;
    }

    setLoading(true);
    try {
      switch (targetState) {
        case GlobalUserState.ANONYMOUS:
          await globalStateManager.switchState({
            targetState,
            forceSwitch: true
          });
          message.success('已切换到全匿名状态');
          onStateChange?.(targetState);
          break;

        case GlobalUserState.SEMI_ANONYMOUS:
          setSemiAnonymousVisible(true);
          break;

        case GlobalUserState.REVIEWER:
        case GlobalUserState.ADMIN:
        case GlobalUserState.SUPER_ADMIN:
          setAdminLoginVisible(true);
          adminForm.setFieldsValue({ userType: targetState });
          break;

        default:
          message.error('不支持的状态切换');
      }
    } catch (error) {
      console.error('状态切换失败:', error);
      message.error('状态切换失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSemiAnonymousSuccess = () => {
    setSemiAnonymousVisible(false);
    message.success('半匿名登录成功');
    onStateChange?.(GlobalUserState.SEMI_ANONYMOUS);
  };

  const handleAdminLogin = async (values: any) => {
    setLoading(true);
    try {
      await globalStateManager.switchState({
        targetState: values.userType,
        credentials: {
          username: values.username,
          password: values.password
        }
      });
      
      setAdminLoginVisible(false);
      adminForm.resetFields();
      message.success('管理员登录成功');
      onStateChange?.(values.userType);
    } catch (error) {
      console.error('管理员登录失败:', error);
      message.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stateSwitcher}>
      <div className={styles.header}>
        <Title level={3}>选择参与方式</Title>
        <Text type="secondary">
          根据您的需求选择合适的参与方式，不同方式拥有不同的权限和功能
        </Text>
      </div>

      <div className={styles.optionsGrid}>
        {STATE_OPTIONS.map((option) => (
          <Card
            key={option.key}
            className={`${styles.optionCard} ${
              currentState === option.key ? styles.currentState : ''
            }`}
            hoverable
            actions={[
              <Button
                key="action"
                type={currentState === option.key ? 'default' : 'primary'}
                icon={currentState === option.key ? undefined : <LoginOutlined />}
                loading={loading}
                onClick={() => handleStateSwitch(option.key)}
                disabled={currentState === option.key}
                style={{ borderColor: option.color, color: option.color }}
              >
                {currentState === option.key ? '当前状态' : option.buttonText}
              </Button>
            ]}
          >
            <Card.Meta
              avatar={
                <div 
                  className={styles.optionIcon}
                  style={{ backgroundColor: option.color }}
                >
                  {option.icon}
                </div>
              }
              title={
                <div className={styles.optionTitle}>
                  {option.title}
                  {currentState === option.key && (
                    <span className={styles.currentBadge}>当前</span>
                  )}
                </div>
              }
              description={
                <div className={styles.optionContent}>
                  <Text type="secondary">{option.description}</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <div className={styles.features}>
                    {option.features.map((feature, index) => (
                      <div key={index} className={styles.feature}>
                        <span className={styles.featureDot}>•</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </Card>
        ))}
      </div>

      {/* 半匿名登录模态框 */}
      <SemiAnonymousLogin
        visible={semiAnonymousVisible}
        onClose={() => setSemiAnonymousVisible(false)}
        onSuccess={handleSemiAnonymousSuccess}
      />

      {/* 管理员登录模态框 */}
      <Modal
        title="管理员登录"
        open={adminLoginVisible}
        onCancel={() => {
          setAdminLoginVisible(false);
          adminForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={adminForm}
          layout="vertical"
          onFinish={handleAdminLogin}
          initialValues={{ userType: GlobalUserState.ADMIN }}
        >
          <Form.Item
            name="userType"
            label="用户类型"
            rules={[{ required: true, message: '请选择用户类型' }]}
          >
            <select className={styles.userTypeSelect}>
              <option value={GlobalUserState.REVIEWER}>审核员</option>
              <option value={GlobalUserState.ADMIN}>管理员</option>
              <option value={GlobalUserState.SUPER_ADMIN}>超级管理员</option>
            </select>
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAdminLoginVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                登录
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
