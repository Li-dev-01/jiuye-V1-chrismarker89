/**
 * 全局状态指示器组件
 * 显示当前用户状态、冲突警告和快速操作
 */

import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Dropdown, 
  Button, 
  Space, 
  Alert, 
  Modal, 
  Typography, 
  List,
  Divider,
  Tag
} from 'antd';
import {
  UserOutlined,
  WarningOutlined,
  ReloadOutlined,
  LogoutOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { 
  globalStateManager, 
  GlobalUserState, 
  type StateDetectionResult,
  type StateConflict 
} from '../../services/globalStateManager';
import styles from './GlobalStateIndicator.module.css';

const { Text, Title } = Typography;

// 状态配置
const STATE_CONFIG = {
  [GlobalUserState.ANONYMOUS]: {
    label: '全匿名用户',
    color: '#52c41a',
    icon: '🔓',
    description: '可以参与问卷调查'
  },
  [GlobalUserState.SEMI_ANONYMOUS]: {
    label: '半匿名用户',
    color: '#1890ff',
    icon: '🔐',
    description: '可以管理内容和下载资源'
  },
  [GlobalUserState.REVIEWER]: {
    label: '审核员',
    color: '#722ed1',
    icon: '👨‍💼',
    description: '可以审核内容'
  },
  [GlobalUserState.ADMIN]: {
    label: '管理员',
    color: '#fa541c',
    icon: '👨‍💻',
    description: '拥有项目管理权限'
  },
  [GlobalUserState.SUPER_ADMIN]: {
    label: '超级管理员',
    color: '#eb2f96',
    icon: '👑',
    description: '拥有所有权限'
  }
};

// 冲突严重程度配置
const CONFLICT_SEVERITY_CONFIG = {
  low: { color: '#faad14', label: '轻微' },
  medium: { color: '#fa541c', label: '中等' },
  high: { color: '#f5222d', label: '严重' }
};

export const GlobalStateIndicator: React.FC = () => {
  const [stateResult, setStateResult] = useState<StateDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);

  useEffect(() => {
    // 初始化状态检测
    initializeState();

    // 添加状态监听器
    const handleStateChange = (result: StateDetectionResult) => {
      setStateResult(result);
    };

    globalStateManager.addStateListener(handleStateChange);

    return () => {
      globalStateManager.removeStateListener(handleStateChange);
    };
  }, []);

  const initializeState = async () => {
    setLoading(true);
    try {
      const result = await globalStateManager.detectCurrentState();
      setStateResult(result);
    } catch (error) {
      console.error('初始化状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshState = async () => {
    setLoading(true);
    try {
      const result = await globalStateManager.forceRefresh();
      setStateResult(result);
    } catch (error) {
      console.error('刷新状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await globalStateManager.switchState({
        targetState: GlobalUserState.ANONYMOUS,
        forceSwitch: true
      });
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflicts = async () => {
    if (!stateResult?.conflicts) return;

    setLoading(true);
    try {
      await globalStateManager.resolveConflicts(stateResult.conflicts);
      await globalStateManager.detectCurrentState();
      setConflictModalVisible(false);
    } catch (error) {
      console.error('解决冲突失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!stateResult) {
    return (
      <Badge status="processing" text="检测状态中..." />
    );
  }

  const currentConfig = STATE_CONFIG[stateResult.currentState];
  const hasConflicts = stateResult.conflicts.length > 0;
  const hasHighSeverityConflicts = stateResult.conflicts.some(c => c.severity === 'high');

  // 下拉菜单项
  const menuItems = [
    {
      key: 'details',
      label: (
        <Space>
          <InfoCircleOutlined />
          查看详情
        </Space>
      ),
      onClick: () => setDetailsVisible(true)
    },
    {
      key: 'refresh',
      label: (
        <Space>
          <ReloadOutlined />
          刷新状态
        </Space>
      ),
      onClick: handleRefreshState
    }
  ];

  if (hasConflicts) {
    menuItems.unshift({
      key: 'conflicts',
      label: (
        <Space>
          <WarningOutlined style={{ color: '#f5222d' }} />
          查看冲突 ({stateResult.conflicts.length})
        </Space>
      ),
      onClick: () => setConflictModalVisible(true)
    });
  }

  if (stateResult.currentState !== GlobalUserState.ANONYMOUS) {
    menuItems.push({
      key: 'divider',
      type: 'divider'
    } as any);
    menuItems.push({
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          退出登录
        </Space>
      ),
      onClick: handleLogout
    });
  }

  // 如果是匿名用户，只显示状态指示器
  if (stateResult.currentState === GlobalUserState.ANONYMOUS) {
    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button
          type="text"
          loading={loading}
          className={styles.stateButton}
          size="small"
        >
          <Space>
            <Badge
              status={stateResult.isValid ? 'success' : 'error'}
              dot={!hasConflicts}
              count={hasConflicts ? stateResult.conflicts.length : 0}
              size="small"
            >
              <span className={styles.stateIcon}>{currentConfig.icon}</span>
            </Badge>
          </Space>
        </Button>
      </Dropdown>
    );
  }

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button
          type="text"
          loading={loading}
          className={styles.stateButton}
        >
          <Space>
            <Badge
              status={stateResult.isValid ? 'success' : 'error'}
              dot={!hasConflicts}
              count={hasConflicts ? stateResult.conflicts.length : 0}
              size="small"
            >
              <span className={styles.stateIcon}>{currentConfig.icon}</span>
            </Badge>
            <span className={styles.stateLabel}>{currentConfig.label}</span>
            {hasHighSeverityConflicts && (
              <WarningOutlined style={{ color: '#f5222d' }} />
            )}
          </Space>
        </Button>
      </Dropdown>

      {/* 状态详情模态框 */}
      <Modal
        title="用户状态详情"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Title level={5}>当前状态</Title>
            <Tag color={currentConfig.color} icon={<span>{currentConfig.icon}</span>}>
              {currentConfig.label}
            </Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              {currentConfig.description}
            </Text>
          </div>

          {stateResult.user && (
            <div>
              <Title level={5}>用户信息</Title>
              <List size="small">
                <List.Item>
                  <Text strong>UUID:</Text> {stateResult.user.uuid}
                </List.Item>
                <List.Item>
                  <Text strong>显示名称:</Text> {stateResult.user.displayName}
                </List.Item>
                <List.Item>
                  <Text strong>状态:</Text> 
                  <Tag color={stateResult.user.status === 'active' ? 'green' : 'red'}>
                    {stateResult.user.status}
                  </Tag>
                </List.Item>
                <List.Item>
                  <Text strong>最后活跃:</Text> {new Date(stateResult.user.lastActiveAt).toLocaleString()}
                </List.Item>
              </List>
            </div>
          )}

          {stateResult.session && (
            <div>
              <Title level={5}>会话信息</Title>
              <List size="small">
                <List.Item>
                  <Text strong>会话ID:</Text> {stateResult.session.sessionId}
                </List.Item>
                <List.Item>
                  <Text strong>过期时间:</Text> {new Date(stateResult.session.expiresAt).toLocaleString()}
                </List.Item>
                <List.Item>
                  <Text strong>是否活跃:</Text> 
                  <Tag color={stateResult.session.isActive ? 'green' : 'red'}>
                    {stateResult.session.isActive ? '是' : '否'}
                  </Tag>
                </List.Item>
              </List>
            </div>
          )}

          {stateResult.recommendations.length > 0 && (
            <div>
              <Title level={5}>建议</Title>
              <List
                size="small"
                dataSource={stateResult.recommendations}
                renderItem={(item) => (
                  <List.Item>
                    <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                    {item}
                  </List.Item>
                )}
              />
            </div>
          )}
        </Space>
      </Modal>

      {/* 冲突处理模态框 */}
      <Modal
        title="状态冲突"
        open={conflictModalVisible}
        onCancel={() => setConflictModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setConflictModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="resolve" 
            type="primary" 
            onClick={handleResolveConflicts}
            loading={loading}
          >
            自动解决
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="检测到状态冲突"
            description="以下冲突可能影响系统正常使用，建议及时处理"
            type="warning"
            showIcon
          />

          <List
            dataSource={stateResult.conflicts}
            renderItem={(conflict: StateConflict) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Tag color={CONFLICT_SEVERITY_CONFIG[conflict.severity].color}>
                      {CONFLICT_SEVERITY_CONFIG[conflict.severity].label}
                    </Tag>
                  }
                  title={conflict.message}
                  description={
                    <Space>
                      <Text type="secondary">类型: {conflict.type}</Text>
                      {conflict.autoResolvable && (
                        <Tag color="green" size="small">可自动解决</Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </>
  );
};
