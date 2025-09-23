/**
 * 全局半匿名登录管理器
 * 在应用级别提供半匿名登录功能
 */

import React, { useState, useEffect } from 'react';
import { SemiAnonymousLogin } from './SemiAnonymousLogin';
import { useIdentityConflict } from './IdentityConflictDialog';

export const GlobalSemiAnonymousLogin: React.FC = () => {
  const { IdentityConflictDialog } = useIdentityConflict();
  const [semiAnonymousModalVisible, setSemiAnonymousModalVisible] = useState(false);

  // 监听全局事件来打开半匿名登录
  useEffect(() => {
    const handleOpenSemiAnonymousLogin = () => {
      setSemiAnonymousModalVisible(true);
    };

    window.addEventListener('openSemiAnonymousLogin', handleOpenSemiAnonymousLogin);

    return () => {
      window.removeEventListener('openSemiAnonymousLogin', handleOpenSemiAnonymousLogin);
    };
  }, []);

  return (
    <>
      {/* 半匿名登录模态框 */}
      <SemiAnonymousLogin
        visible={semiAnonymousModalVisible}
        onClose={() => setSemiAnonymousModalVisible(false)}
        onSuccess={() => {
          // 登录成功后刷新页面或跳转
          window.location.reload();
        }}
      />

      {/* 身份冲突确认对话框 */}
      <IdentityConflictDialog />
    </>
  );
};
