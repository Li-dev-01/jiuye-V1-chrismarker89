/**
 * 简化的PNG卡片下载按钮组件
 * 专门用于新的Cloudflare Workers API
 */

import React, { useState } from 'react';
import { Button, message, Modal, Tooltip } from 'antd';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../../stores/universalAuthStore';

interface SimpleCardDownloadButtonProps {
  contentType: 'heart_voice' | 'story';
  contentId: number;
  buttonText?: string;
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  showIcon?: boolean;
  showTooltip?: boolean;
  disabled?: boolean;
}

const SimpleCardDownloadButton: React.FC<SimpleCardDownloadButtonProps> = ({
  contentType,
  contentId,
  buttonText = '下载',
  buttonType = 'text',
  showIcon = true,
  showTooltip = true,
  disabled = false
}) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!isAuthenticated) {
      Modal.info({
        title: '需要登录',
        content: '请登录后再下载卡片',
      });
      return;
    }

    setLoading(true);
    try {
      // 首先生成卡片
      const generateResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cards/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          user_id: 1, // 暂时使用固定用户ID
          styles: ['style_1'] // 使用默认样式
        })
      });

      if (!generateResponse.ok) {
        throw new Error('生成卡片失败');
      }

      const generateResult = await generateResponse.json();
      
      if (!generateResult.success) {
        throw new Error(generateResult.error || '生成卡片失败');
      }

      // 获取第一个生成的卡片
      const firstCard = generateResult.data.generated_cards[0];
      if (!firstCard) {
        throw new Error('没有生成卡片');
      }

      // 获取下载链接
      const downloadResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/cards/download/${firstCard.id}?user_id=1`
      );

      if (!downloadResponse.ok) {
        throw new Error('获取下载链接失败');
      }

      const downloadResult = await downloadResponse.json();
      
      if (!downloadResult.success) {
        throw new Error(downloadResult.error || '获取下载链接失败');
      }

      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = downloadResult.data.download_url;
      link.download = downloadResult.data.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('卡片下载成功！');
    } catch (error) {
      console.error('Download error:', error);
      message.error(error instanceof Error ? error.message : '下载失败');
    } finally {
      setLoading(false);
    }
  };

  const button = (
    <Button
      type={buttonType}
      icon={showIcon ? (loading ? <LoadingOutlined /> : <DownloadOutlined />) : undefined}
      loading={loading}
      disabled={disabled}
      onClick={handleDownload}
      size="small"
    >
      {buttonText}
    </Button>
  );

  if (showTooltip) {
    return (
      <Tooltip title="下载PNG卡片">
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default SimpleCardDownloadButton;
