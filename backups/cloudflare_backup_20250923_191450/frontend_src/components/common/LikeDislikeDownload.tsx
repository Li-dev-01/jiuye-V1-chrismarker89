/**
 * 赞/踩/下载三合一组件
 * 支持故事的完整交互功能
 */

import React, { useState } from 'react';
import { Button, Space, message, Tooltip } from 'antd';
import { 
  LikeOutlined, 
  DislikeOutlined, 
  DownloadOutlined,
  LikeFilled,
  DislikeFilled,
  LoadingOutlined
} from '@ant-design/icons';

interface LikeDislikeDownloadProps {
  contentType: 'story';
  contentId: number;
  initialLikeCount?: number;
  initialDislikeCount?: number;
  initialUserLiked?: boolean;
  initialUserDisliked?: boolean;
  theme?: 'gradient' | 'light' | 'dark' | 'minimal';
  size?: 'small' | 'middle' | 'large';
  showCounts?: boolean;
}

export const LikeDislikeDownload: React.FC<LikeDislikeDownloadProps> = ({
  contentType,
  contentId,
  initialLikeCount = 0,
  initialDislikeCount = 0,
  initialUserLiked = false,
  initialUserDisliked = false,
  theme = 'gradient',
  size = 'middle',
  showCounts = true
}) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [userLiked, setUserLiked] = useState(initialUserLiked);
  const [userDisliked, setUserDisliked] = useState(initialUserDisliked);
  const [likeLoading, setLikeLoading] = useState(false);
  const [dislikeLoading, setDislikeLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // 点赞功能
  const handleLike = async () => {
    if (likeLoading || userLiked) return;

    setLikeLoading(true);
    try {
      const apiEndpoint = `/api/stories/${contentId}/like`;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${apiEndpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': getUserId()
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLikeCount(prev => prev + 1);
          setUserLiked(true);
          
          // 如果之前踩过，取消踩
          if (userDisliked) {
            setDislikeCount(prev => Math.max(0, prev - 1));
            setUserDisliked(false);
          }
          
          message.success('点赞成功！');
        } else {
          message.error(result.message || '点赞失败');
        }
      } else {
        message.error('点赞失败');
      }
    } catch (error) {
      console.error('点赞失败:', error);
      message.error('点赞失败');
    } finally {
      setLikeLoading(false);
    }
  };

  // 踩功能
  const handleDislike = async () => {
    if (dislikeLoading || userDisliked) return;

    setDislikeLoading(true);
    try {
      const apiEndpoint = `/api/stories/${contentId}/dislike`;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${apiEndpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': getUserId()
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDislikeCount(prev => prev + 1);
          setUserDisliked(true);
          
          // 如果之前点赞过，取消点赞
          if (userLiked) {
            setLikeCount(prev => Math.max(0, prev - 1));
            setUserLiked(false);
          }
          
          message.success('已记录您的反馈');
        } else {
          message.error(result.message || '操作失败');
        }
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('踩操作失败:', error);
      message.error('操作失败');
    } finally {
      setDislikeLoading(false);
    }
  };

  // 下载PNG功能
  const handleDownload = async () => {
    if (downloadLoading) return;

    setDownloadLoading(true);
    try {
      const apiEndpoint = `/api/stories/${contentId}/png/${theme}`;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${apiEndpoint}`,
        {
          headers: {
            'X-User-ID': getUserId()
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 直接下载
          const link = document.createElement('a');
          link.href = result.data.downloadUrl;
          link.download = `${contentType}-card-${contentId}-${theme}.png`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          message.success('PNG卡片下载成功！');
        } else {
          message.error(result.message || '下载失败');
        }
      } else if (response.status === 404) {
        // PNG不存在，尝试生成
        await generateAndDownload();
      } else {
        message.error('下载失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败');
    } finally {
      setDownloadLoading(false);
    }
  };

  // 生成并下载PNG
  const generateAndDownload = async () => {
    try {
      message.info('正在生成PNG卡片，请稍候...');
      
      const generateResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auto-png/trigger/story/${contentId}`,
        { method: 'POST' }
      );

      if (generateResponse.ok) {
        const generateResult = await generateResponse.json();
        if (generateResult.success) {
          // 等待一秒后重试下载
          setTimeout(() => {
            handleDownload();
          }, 1000);
        } else {
          message.error('生成PNG失败: ' + generateResult.message);
        }
      } else {
        message.error('生成PNG失败');
      }
    } catch (error) {
      message.error('生成PNG失败');
    }
  };

  // 获取用户ID（可以从上下文或localStorage获取）
  const getUserId = () => {
    return localStorage.getItem('userId') || 'anonymous';
  };

  // 格式化数字显示
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      padding: '4px 0'
    }}>
      {/* 踩按钮 - 左侧 */}
      <Tooltip title={userDisliked ? '已踩' : '踩'}>
        <Button
          type="text"
          size={size}
          icon={dislikeLoading ? <LoadingOutlined /> : (userDisliked ? <DislikeFilled /> : <DislikeOutlined />)}
          onClick={handleDislike}
          disabled={dislikeLoading || userDisliked}
          style={{
            color: userDisliked ? '#ff4d4f' : '#8c8c8c',
            border: 'none',
            padding: '4px 8px',
            height: 'auto',
            fontSize: '12px'
          }}
        >
          {showCounts && formatCount(dislikeCount)}
        </Button>
      </Tooltip>

      {/* 下载按钮 - 中间 */}
      <Tooltip title="下载">
        <Button
          type="text"
          size={size}
          icon={downloadLoading ? <LoadingOutlined /> : <DownloadOutlined />}
          onClick={handleDownload}
          disabled={downloadLoading}
          style={{
            color: '#52c41a',
            border: 'none',
            padding: '4px 8px',
            height: 'auto',
            fontSize: '12px'
          }}
        >
          下载
        </Button>
      </Tooltip>

      {/* 点赞按钮 - 右侧 */}
      <Tooltip title={userLiked ? '已点赞' : '点赞'}>
        <Button
          type="text"
          size={size}
          icon={likeLoading ? <LoadingOutlined /> : (userLiked ? <LikeFilled /> : <LikeOutlined />)}
          onClick={handleLike}
          disabled={likeLoading || userLiked}
          style={{
            color: userLiked ? '#1890ff' : '#8c8c8c',
            border: 'none',
            padding: '4px 8px',
            height: 'auto',
            fontSize: '12px'
          }}
        >
          {showCounts && formatCount(likeCount)}
        </Button>
      </Tooltip>
    </div>
  );
};
