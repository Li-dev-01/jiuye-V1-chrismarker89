import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Input, message } from 'antd';
import { PageLayout } from '../components/layout/PageLayout';
import ApiService from '../services/api';
import styles from './TestPage.module.css';

const { Title, Text } = Typography;

export const TestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [username, setUsername] = useState('test');
  const [password, setPassword] = useState('test');
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // 检查API状态
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const response = await fetch('http://localhost:8788/api/health');
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8788/api/health');
      const data = await response.json();
      setApiResponse(data);
      setApiStatus('online');
      message.success('健康检查成功');
    } catch (error) {
      console.error('健康检查失败:', error);
      setApiStatus('offline');
      message.error('健康检查失败');
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await ApiService.post('/auth/login', {
        username,
        password
      });
      setApiResponse(response);
      message.success('登录测试成功');
    } catch (error) {
      console.error('登录测试失败:', error);
      message.error('登录测试失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试错误边界
  const testErrorBoundary = () => {
    // 故意抛出一个错误来测试错误边界
    throw new Error('这是一个测试错误，用于验证错误边界功能');
  };

  return (
    <PageLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2} className={styles.title}>API 连接测试页面</Title>
          <div className={`${styles.status} ${apiStatus === 'online' ? styles.statusOnline : styles.statusOffline}`}>
            <span className={`${styles.statusDot} ${apiStatus === 'online' ? styles.statusDotOnline : styles.statusDotOffline}`}></span>
            {apiStatus === 'checking' ? '检测中...' : apiStatus === 'online' ? '服务正常' : '服务离线'}
          </div>
        </div>

        <div className={styles.testSection}>
          <Card className={styles.testCard}>
            <div className={styles.testCardHeader}>
              <h3 className={styles.testCardTitle}>健康检查测试</h3>
            </div>
            <div className={styles.testCardBody}>
              <div className={styles.buttonGroup}>
                <Button
                  className={styles.testButton}
                  onClick={testHealthCheck}
                  loading={loading}
                >
                  测试健康检查
                </Button>
                <Text className={styles.description}>测试后端 API 是否正常运行</Text>
              </div>
            </div>
          </Card>

          <Card className={styles.testCard}>
            <div className={styles.testCardHeader}>
              <h3 className={styles.testCardTitle}>登录</h3>
            </div>
            <div className={styles.testCardBody}>
              <div className={styles.inputRow}>
                <Input
                  className={`${styles.testInput} ${styles.inputField}`}
                  placeholder="用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input.Password
                  className={`${styles.testInput} ${styles.inputField}`}
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  className={styles.testButton}
                  onClick={testLogin}
                  loading={loading}
                >
                  测试登录
                </Button>
              </div>
              <Text className={styles.description}>测试登录 API 功能</Text>
            </div>
          </Card>

          <Card className={styles.testCard}>
            <div className={styles.testCardHeader}>
              <h3 className={styles.testCardTitle}>错误边界测试</h3>
            </div>
            <div className={styles.testCardBody}>
              <div className={styles.inputRow}>
                <Button
                  className={styles.testButton}
                  onClick={testErrorBoundary}
                  danger
                >
                  触发错误边界
                </Button>
              </div>
              <Text className={styles.description}>测试前端错误边界功能</Text>
            </div>
          </Card>

          {apiResponse && (
            <Card className={styles.testCard}>
              <div className={styles.testCardHeader}>
                <h3 className={styles.testCardTitle}>API 响应</h3>
              </div>
              <div className={styles.testCardBody}>
                <pre className={styles.responseBox}>
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
