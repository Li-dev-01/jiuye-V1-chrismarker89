/**
 * 登录方式引导组件
 * 根据环境和用户需求推荐合适的登录方式
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, Tag } from 'antd';
import { 
  LoginOutlined,
  LinkOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ENV_CONFIG, getRecommendedLoginMethod } from '../../config/environment';
import styles from './LoginMethodGuide.module.css';

const { Title, Text, Paragraph } = Typography;

interface LoginMethodGuideProps {
  onMethodSelect?: (method: string) => void;
  showAsModal?: boolean;
}

export const LoginMethodGuide: React.FC<LoginMethodGuideProps> = ({
  onMethodSelect,
  showAsModal = false
}) => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  const recommendation = getRecommendedLoginMethod();

  const loginMethods = [
    {
      key: 'multiProject',
      title: '多项目管理中心',
      description: '统一的项目管理入口，支持多项目切换',
      icon: <LinkOutlined />,
      color: '#1890ff',
      recommended: recommendation.primary === 'autoLogin',
      action: () => {
        window.open(ENV_CONFIG.multiProjectCenter.url, '_blank');
      },
      tags: ['推荐', '生产环境']
    },
    {
      key: 'direct',
      title: '直接登录',
      description: '直接访问本项目的管理登录页面',
      icon: <LoginOutlined />,
      color: '#52c41a',
      recommended: recommendation.primary === 'direct',
      action: () => {
        navigate('/admin/login');
      },
      tags: ['快速', '开发友好']
    },
    {
      key: 'management',
      title: '管理门户',
      description: '独立的管理系统登录入口',
      icon: <ExclamationCircleOutlined />,
      color: '#faad14',
      recommended: false,
      action: () => {
        navigate('/management-portal');
      },
      tags: ['安全', '独立']
    }
  ];

  // 如果是开发环境，添加开发者选项
  if (ENV_CONFIG.isDevelopment) {
    loginMethods.push({
      key: 'dev',
      title: '开发者快捷登录',
      description: '开发环境专用，快速切换角色',
      icon: <CodeOutlined />,
      color: '#722ed1',
      recommended: false,
      action: () => {
        // 开发面板会自动显示，这里不需要特殊处理
      },
      tags: ['开发专用', 'DEV']
    });
  }

  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method.key);
    onMethodSelect?.(method.key);
    method.action();
  };

  return (
    <div className={styles.container}>
      <Card className={styles.guideCard}>
        <div className={styles.header}>
          <InfoCircleOutlined className={styles.headerIcon} />
          <Title level={4} style={{ margin: 0 }}>
            选择登录方式
          </Title>
        </div>

        <Alert
          message={recommendation.message}
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <div className={styles.methods}>
          {loginMethods.map(method => (
            <Card
              key={method.key}
              className={`${styles.methodCard} ${method.recommended ? styles.recommended : ''}`}
              hoverable
              onClick={() => handleMethodSelect(method)}
            >
              <div className={styles.methodContent}>
                <div className={styles.methodHeader}>
                  <div className={styles.methodIcon} style={{ color: method.color }}>
                    {method.icon}
                  </div>
                  <div className={styles.methodInfo}>
                    <Title level={5} style={{ margin: 0, color: method.color }}>
                      {method.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {method.description}
                    </Text>
                  </div>
                  {method.recommended && (
                    <Tag color="gold" style={{ marginLeft: 'auto' }}>
                      推荐
                    </Tag>
                  )}
                </div>
                
                <div className={styles.methodTags}>
                  {method.tags.map(tag => (
                    <Tag 
                      key={tag} 
                      size="small"
                      color={tag === 'DEV' ? 'red' : 'default'}
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Divider />

        <div className={styles.footer}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 提示：开发时推荐使用直接登录，生产环境推荐使用多项目管理中心
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginMethodGuide;
