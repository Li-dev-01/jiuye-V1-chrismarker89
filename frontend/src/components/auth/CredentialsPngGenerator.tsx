/**
 * 认证凭证PNG生成器组件
 * 用于生成和下载A+B认证凭证的PNG图片
 */

import React, { useRef, useCallback } from 'react';
import { Button, Card, Typography, Space, message } from 'antd';
import { DownloadOutlined, PictureOutlined } from '@ant-design/icons';
// import html2canvas from 'html2canvas'; // 暂时注释，等依赖安装成功后启用
import styles from './CredentialsPngGenerator.module.css';

const { Title, Text } = Typography;

interface CredentialsPngGeneratorProps {
  identityA: string;
  identityB: string;
  userInfo?: {
    uuid: string;
    display_name: string;
    created_at: string;
  };
  onDownloadComplete?: () => void;
}

export const CredentialsPngGenerator: React.FC<CredentialsPngGeneratorProps> = ({
  identityA,
  identityB,
  userInfo,
  onDownloadComplete
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateAndDownloadPNG = useCallback(async () => {
    // 暂时提供一个简化的下载功能，等html2canvas依赖安装成功后启用完整功能
    try {
      message.loading({ content: '正在生成文本文件...', key: 'generating' });

      // 创建文本内容
      const textContent = `
大学生就业问卷调查 - 认证凭证
=====================================

生成时间: ${userInfo?.created_at ? formatDate(userInfo.created_at) : new Date().toLocaleString('zh-CN')}

认证信息:
---------
A值 (身份标识): ${identityA}
B值 (验证码): ${identityB}

${userInfo ? `
用户信息:
---------
用户ID: ${userInfo.uuid}
显示名称: ${userInfo.display_name}
` : ''}

重要提醒:
---------
请妥善保存此认证凭证，用于后续登录和数据管理
此凭证由系统自动生成，请勿泄露给他人

=====================================
`;

      // 创建Blob并下载
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.download = `问卷认证凭证_${identityA.slice(-4)}_${new Date().toISOString().slice(0, 10)}.txt`;
      link.href = URL.createObjectURL(blob);

      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      message.success({ content: '凭证文件下载成功！', key: 'generating' });
      onDownloadComplete?.();

    } catch (error) {
      console.error('生成文件失败:', error);
      message.error({ content: '生成文件失败，请重试', key: 'generating' });
    }
  }, [identityA, identityB, userInfo, onDownloadComplete]);

  return (
    <div className={styles.container}>
      {/* 预览卡片 */}
      <div ref={cardRef} className={styles.credentialsCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <PictureOutlined className={styles.logoIcon} />
            <span className={styles.logoText}>大学生就业问卷调查</span>
          </div>
          <div className={styles.timestamp}>
            {userInfo?.created_at ? formatDate(userInfo.created_at) : new Date().toLocaleString('zh-CN')}
          </div>
        </div>

        <div className={styles.content}>
          <Title level={3} className={styles.title}>
            认证凭证
          </Title>
          
          <div className={styles.credentialsInfo}>
            <div className={styles.credentialItem}>
              <Text className={styles.label}>A值 (身份标识):</Text>
              <Text className={styles.value} copyable>{identityA}</Text>
            </div>
            
            <div className={styles.credentialItem}>
              <Text className={styles.label}>B值 (验证码):</Text>
              <Text className={styles.value} copyable>{identityB}</Text>
            </div>

            {userInfo && (
              <>
                <div className={styles.credentialItem}>
                  <Text className={styles.label}>用户ID:</Text>
                  <Text className={styles.value}>{userInfo.uuid}</Text>
                </div>
                
                <div className={styles.credentialItem}>
                  <Text className={styles.label}>显示名称:</Text>
                  <Text className={styles.value}>{userInfo.display_name}</Text>
                </div>
              </>
            )}
          </div>

          <div className={styles.notice}>
            <Text type="secondary" className={styles.noticeText}>
              请妥善保存此认证凭证，用于后续登录和数据管理
            </Text>
          </div>
        </div>

        <div className={styles.footer}>
          <Text type="secondary" className={styles.footerText}>
            此凭证由系统自动生成，请勿泄露给他人
          </Text>
        </div>
      </div>

      {/* 下载按钮 */}
      <div className={styles.actions}>
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={generateAndDownloadPNG}
            size="large"
          >
            下载凭证文件
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(`A值: ${identityA}\nB值: ${identityB}`);
              message.success('凭证已复制到剪贴板');
            }}
          >
            复制凭证
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default CredentialsPngGenerator;
