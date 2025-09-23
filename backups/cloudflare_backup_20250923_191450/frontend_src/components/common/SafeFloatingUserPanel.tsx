/**
 * 安全悬浮用户面板组件
 * 使用安全架构重新实现的悬浮用户面板
 */

import React, { useState, useCallback } from 'react';
import { Card, Avatar, Typography, Space, Button, Statistic, Row, Col } from 'antd';
import {
  UserOutlined,
  CloseOutlined,
  MinusOutlined,
  ExpandOutlined,
  CompressOutlined,
  DragOutlined
} from '@ant-design/icons';
import { useSafeAuth } from '../../hooks/useSafeAuth';
import { SafeFloatingWrapper } from './SafeFloatingWrapper';
import styles from './FloatingUserPanel.module.css';

const { Text } = Typography;

interface SafeFloatingUserPanelProps {
  initialPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  draggable?: boolean;
  showMinimize?: boolean;
  showClose?: boolean;
  onClose?: () => void;
}

/**
 * 内部悬浮用户面板组件
 */
const InternalFloatingUserPanel: React.FC<SafeFloatingUserPanelProps> = ({
  initialPosition = 'bottom-right',
  draggable = true,
  showMinimize = true,
  showClose = true,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState(initialPosition);

  // 使用安全认证钩子
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    isStoreAvailable,
    logout
  } = useSafeAuth();

  /**
   * 处理登出
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error in user panel:', error);
    }
  }, [logout]);

  /**
   * 获取位置样式
   */
  const getPositionStyle = useCallback(() => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
      transition: 'all 0.3s ease'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyle, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...baseStyle, bottom: '20px', right: '20px' };
    }
  }, [position]);

  // 如果未认证或认证store不可用，不显示面板
  if (!isAuthenticated || !currentUser || !isStoreAvailable) {
    return null;
  }

  // 如果有错误，显示简化版本
  if (error) {
    return (
      <div style={getPositionStyle()}>
        <Card
          size="small"
          style={{ width: '200px', opacity: 0.8 }}
          title={
            <Space>
              <UserOutlined />
              <Text>用户面板</Text>
            </Space>
          }
          extra={
            showClose && (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClose}
              />
            )
          }
        >
          <Text type="secondary" style={{ fontSize: '12px' }}>
            用户信息暂时不可用
          </Text>
        </Card>
      </div>
    );
  }

  // 最小化状态
  if (isMinimized) {
    return (
      <div style={getPositionStyle()}>
        <Button
          type="primary"
          shape="circle"
          icon={<UserOutlined />}
          onClick={() => setIsMinimized(false)}
          title={`${currentUser.displayName || '用户'} - 点击展开`}
          loading={isLoading}
        />
      </div>
    );
  }

  // 用户统计信息（模拟数据）
  const userStats = {
    loginCount: currentUser.metadata?.loginCount || 0,
    contentCount: 0, // 可以从API获取
    lastLoginTime: currentUser.metadata?.lastLoginTime || new Date().toISOString()
  };

  return (
    <div style={getPositionStyle()}>
      <Card
        size="small"
        style={{ 
          width: isExpanded ? '320px' : '250px',
          maxHeight: isExpanded ? '400px' : '200px',
          overflow: 'hidden'
        }}
        title={
          <Space>
            {draggable && <DragOutlined className={styles.dragHandle} />}
            <Avatar 
              size="small" 
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <Text strong className={styles.userName}>
              {currentUser.displayName || '匿名用户'}
            </Text>
          </Space>
        }
        extra={
          <Space size="small">
            {showMinimize && (
              <Button
                type="text"
                size="small"
                icon={<MinusOutlined />}
                onClick={() => setIsMinimized(true)}
                title="最小化"
              />
            )}
            <Button
              type="text"
              size="small"
              icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "收起" : "展开"}
            />
            {showClose && (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClose}
                title="关闭"
              />
            )}
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* 用户基本信息 */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              用户类型: {currentUser.userType}
            </Text>
          </div>
          
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              用户ID: {currentUser.userUuid?.substring(0, 8)}...
            </Text>
          </div>

          {/* 展开内容 */}
          {isExpanded && (
            <div className={styles.expandedContent}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="登录次数"
                    value={userStats.loginCount}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="发布内容"
                    value={userStats.contentCount}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              </Row>

              <div style={{ marginTop: '12px' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  最后登录: {new Date(userStats.lastLoginTime).toLocaleString()}
                </Text>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ marginTop: '8px' }}>
            <Space size="small">
              <Button
                size="small"
                type="primary"
                onClick={() => window.location.href = '/my-content'}
              >
                我的内容
              </Button>
              <Button
                size="small"
                onClick={handleLogout}
                loading={isLoading}
              >
                退出登录
              </Button>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
};

/**
 * 安全悬浮用户面板组件
 * 使用SafeFloatingWrapper包装以提供错误隔离
 */
export const SafeFloatingUserPanel: React.FC<SafeFloatingUserPanelProps> = (props) => {
  return (
    <SafeFloatingWrapper
      componentName="悬浮用户面板"
      showErrorDetails={false}
      retryable={true}
      fallbackComponent={null} // 失败时不显示任何内容
    >
      <InternalFloatingUserPanel {...props} />
    </SafeFloatingWrapper>
  );
};

export default SafeFloatingUserPanel;
