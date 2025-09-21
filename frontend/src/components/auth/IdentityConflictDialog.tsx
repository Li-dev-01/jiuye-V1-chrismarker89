/**
 * 身份冲突确认对话框
 * 当用户尝试切换身份时显示确认对话框
 */

import React from 'react';
import { Modal, Button, Typography, Space, Alert } from 'antd';
import { ExclamationCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import type { UserType } from '../../types/uuid-system';

const { Title, Text, Paragraph } = Typography;

interface IdentityConflictDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const getUserTypeDisplayName = (userType: UserType): string => {
  const names = {
    anonymous: '全匿名用户',
    semi_anonymous: '半匿名用户',
    reviewer: '审核员',
    admin: '管理员',
    super_admin: '超级管理员'
  };
  return names[userType] || '未知用户';
};

const getUserTypeColor = (userType: UserType): string => {
  const colors = {
    anonymous: '#52c41a',
    semi_anonymous: '#1890ff',
    reviewer: '#fa8c16',
    admin: '#722ed1',
    super_admin: '#f5222d'
  };
  return colors[userType] || '#666';
};

export const IdentityConflictDialog: React.FC<IdentityConflictDialogProps> = ({
  visible,
  onConfirm,
  onCancel
}) => {
  const { identityConflict, isLoading } = useUniversalAuthStore();

  if (!identityConflict) {
    return null;
  }

  const currentUserType = identityConflict.currentUserType;
  const newUserType = identityConflict.message?.includes('半匿名') ? 'semi_anonymous' :
                     identityConflict.message?.includes('管理员') ? 'admin' :
                     identityConflict.message?.includes('审核员') ? 'reviewer' : 'anonymous';

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>身份切换确认</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={480}
      centered
      maskClosable={false}
      destroyOnHidden
    >
      <div style={{ padding: '16px 0' }}>
        {/* 警告提示 */}
        <Alert
          message="检测到身份冲突"
          description="您当前已登录，切换身份将清除当前登录状态"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 身份对比 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            <UserSwitchOutlined /> 身份切换详情
          </Title>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px',
            background: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e8e8e8'
          }}>
            {/* 当前身份 */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ 
                color: currentUserType ? getUserTypeColor(currentUserType) : '#666',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {currentUserType ? getUserTypeDisplayName(currentUserType) : '未知身份'}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                当前身份
              </Text>
            </div>

            {/* 箭头 */}
            <div style={{ 
              margin: '0 16px',
              color: '#1890ff',
              fontSize: '20px'
            }}>
              →
            </div>

            {/* 目标身份 */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ 
                color: getUserTypeColor(newUserType as UserType),
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {getUserTypeDisplayName(newUserType as UserType)}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                目标身份
              </Text>
            </div>
          </div>
        </div>

        {/* 详细说明 */}
        <div style={{ marginBottom: 24 }}>
          <Paragraph style={{ margin: 0, lineHeight: 1.6 }}>
            {identityConflict.message}
          </Paragraph>
        </div>

        {/* 影响说明 */}
        <Alert
          message="切换身份的影响"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>当前登录状态将被清除</li>
              <li>需要重新进行身份验证</li>
              <li>当前页面可能会刷新或跳转</li>
              <li>未保存的数据可能会丢失</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px' 
        }}>
          <Button 
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            danger
            onClick={onConfirm}
            loading={isLoading}
            icon={<UserSwitchOutlined />}
          >
            确认切换
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 便捷的Hook，用于处理身份冲突
export const useIdentityConflict = () => {
  const {
    identityConflict,
    confirmIdentitySwitch,
    cancelIdentitySwitch,
    isLoading
  } = useUniversalAuthStore();

  const [dialogVisible, setDialogVisible] = React.useState(false);

  // 监听身份冲突状态
  React.useEffect(() => {
    setDialogVisible(!!identityConflict);
  }, [identityConflict]);

  const handleConfirm = async () => {
    try {
      const success = await confirmIdentitySwitch();
      if (success) {
        setDialogVisible(false);
      }
    } catch (error) {
      console.error('身份切换失败:', error);
    }
  };

  const handleCancel = () => {
    cancelIdentitySwitch();
    setDialogVisible(false);
  };

  return {
    dialogVisible,
    identityConflict,
    isLoading,
    handleConfirm,
    handleCancel,
    IdentityConflictDialog: () => (
      <IdentityConflictDialog
        visible={dialogVisible}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )
  };
};

export default IdentityConflictDialog;
