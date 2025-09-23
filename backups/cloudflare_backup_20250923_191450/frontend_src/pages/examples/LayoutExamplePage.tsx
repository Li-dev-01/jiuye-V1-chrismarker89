/**
 * 布局系统示例页面
 * 展示问卷布局和浮窗组件的使用
 */

import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider, Switch, Select, Alert } from 'antd';
import { QuestionnaireLayout } from '../../components/layout/QuestionnaireLayout';
import { FloatingUserPanel } from '../../components/common/FloatingUserPanel';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import styles from './LayoutExamplePage.module.css';

const { Title, Paragraph, Text } = Typography;

export const LayoutExamplePage: React.FC = () => {
  const [showFloatingPanel, setShowFloatingPanel] = useState(true);
  const [floatingPosition, setFloatingPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [isDraggable, setIsDraggable] = useState(true);
  const { currentUser, login } = useUniversalAuthStore();

  const handleTestLogin = () => {
    login({
      id: 'test-user',
      displayName: '测试用户',
      userType: 'semi_anonymous',
      permissions: ['read'],
      sessionId: 'test-session'
    });
  };

  return (
    <QuestionnaireLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>布局系统示例</Title>
          <Paragraph>
            这个页面展示了新的问卷布局系统和半匿名用户浮窗组件的功能。
          </Paragraph>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 布局特性介绍 */}
          <Card title="🎯 布局特性" className={styles.featureCard}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className={styles.feature}>
                <Text strong>1. 统一顶部导航栏</Text>
                <Paragraph type="secondary">
                  问卷项目使用统一的顶部导航栏，方便在不同栏目间快速切换，提供一致的用户体验。
                </Paragraph>
              </div>
              
              <div className={styles.feature}>
                <Text strong>2. 响应式设计</Text>
                <Paragraph type="secondary">
                  自适应桌面端、平板端和移动端，移动端使用底部导航栏替代顶部菜单。
                </Paragraph>
              </div>
              
              <div className={styles.feature}>
                <Text strong>3. 半匿名用户浮窗</Text>
                <Paragraph type="secondary">
                  为A+B类用户提供可拖拽的浮窗面板，支持四个角移动，可最小化和展开。
                </Paragraph>
              </div>
            </Space>
          </Card>

          {/* 浮窗控制面板 */}
          <Card title="🎮 浮窗控制面板" className={styles.controlCard}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {!currentUser && (
                <Alert
                  message="需要登录才能看到浮窗组件"
                  description="点击下方按钮模拟登录，体验浮窗功能"
                  type="info"
                  action={
                    <Button size="small" type="primary" onClick={handleTestLogin}>
                      模拟登录
                    </Button>
                  }
                />
              )}
              
              <div className={styles.controlGroup}>
                <Text strong>显示浮窗：</Text>
                <Switch 
                  checked={showFloatingPanel} 
                  onChange={setShowFloatingPanel}
                  disabled={!currentUser}
                />
              </div>
              
              <div className={styles.controlGroup}>
                <Text strong>初始位置：</Text>
                <Select
                  value={floatingPosition}
                  onChange={setFloatingPosition}
                  disabled={!currentUser}
                  style={{ width: 120 }}
                  options={[
                    { label: '左上角', value: 'top-left' },
                    { label: '右上角', value: 'top-right' },
                    { label: '左下角', value: 'bottom-left' },
                    { label: '右下角', value: 'bottom-right' }
                  ]}
                />
              </div>
              
              <div className={styles.controlGroup}>
                <Text strong>可拖拽：</Text>
                <Switch 
                  checked={isDraggable} 
                  onChange={setIsDraggable}
                  disabled={!currentUser}
                />
              </div>
            </Space>
          </Card>

          {/* 使用说明 */}
          <Card title="📖 使用说明" className={styles.guideCard}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className={styles.step}>
                <Text strong>步骤 1：导入布局组件</Text>
                <div className={styles.codeBlock}>
                  <Text code>
                    {`import { QuestionnaireLayout } from './components/layout/QuestionnaireLayout';`}
                  </Text>
                </div>
              </div>
              
              <div className={styles.step}>
                <Text strong>步骤 2：包装页面内容</Text>
                <div className={styles.codeBlock}>
                  <Text code>
                    {`<QuestionnaireLayout>
  <YourPageContent />
  <FloatingUserPanel />
</QuestionnaireLayout>`}
                  </Text>
                </div>
              </div>
              
              <div className={styles.step}>
                <Text strong>步骤 3：配置浮窗属性</Text>
                <div className={styles.codeBlock}>
                  <Text code>
                    {`<FloatingUserPanel
  initialPosition="bottom-right"
  draggable={true}
  showMinimize={true}
  showClose={true}
/>`}
                  </Text>
                </div>
              </div>
            </Space>
          </Card>

          {/* 技术特性 */}
          <Card title="⚡ 技术特性" className={styles.techCard}>
            <div className={styles.techGrid}>
              <div className={styles.techItem}>
                <Text strong>🎨 CSS Modules</Text>
                <Paragraph type="secondary">
                  使用CSS Modules避免样式冲突，支持主题定制
                </Paragraph>
              </div>
              
              <div className={styles.techItem}>
                <Text strong>📱 响应式设计</Text>
                <Paragraph type="secondary">
                  基于媒体查询的响应式布局，适配各种设备
                </Paragraph>
              </div>
              
              <div className={styles.techItem}>
                <Text strong>♿ 无障碍支持</Text>
                <Paragraph type="secondary">
                  支持键盘导航、屏幕阅读器和高对比度模式
                </Paragraph>
              </div>
              
              <div className={styles.techItem}>
                <Text strong>🌙 深色模式</Text>
                <Paragraph type="secondary">
                  自动检测系统主题偏好，支持深色模式
                </Paragraph>
              </div>
            </div>
          </Card>
        </Space>

        {/* 浮窗组件 */}
        {showFloatingPanel && currentUser && (
          <FloatingUserPanel
            initialPosition={floatingPosition}
            draggable={isDraggable}
            showMinimize={true}
            showClose={true}
            onClose={() => setShowFloatingPanel(false)}
          />
        )}
      </div>
    </QuestionnaireLayout>
  );
};
