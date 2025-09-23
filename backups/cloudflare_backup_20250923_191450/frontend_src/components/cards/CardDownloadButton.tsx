/**
 * 卡片下载按钮组件
 * 用于问卷心声和故事的PNG卡片下载
 */

import React, { useState } from 'react';
import { Button, Dropdown, Menu, message, Modal, Spin, Tooltip } from 'antd';
import { DownloadOutlined, PictureOutlined, ShareAltOutlined, LoadingOutlined } from '@ant-design/icons';
import { useSafeAuth } from '../../hooks/useSafeAuth';
import { UserRole } from '../../types/auth';
import { cardDownloadService } from '../../services/cardDownloadService';
import './CardDownloadButton.css';

interface CardDownloadButtonProps {
  contentType: 'heart_voice' | 'story';
  contentId: number;
  buttonText?: string;
  buttonType?: 'primary' | 'default' | 'link' | 'text' | 'ghost' | 'dashed';
  buttonSize?: 'large' | 'middle' | 'small';
  showIcon?: boolean;
  showTooltip?: boolean;
  tooltipText?: string;
  className?: string;
  onSuccess?: (downloadUrl: string) => void;
  onError?: (error: string) => void;
}

const CardDownloadButton: React.FC<CardDownloadButtonProps> = ({
  contentType,
  contentId,
  buttonText = '下载卡片',
  buttonType = 'default',
  buttonSize = 'middle',
  showIcon = true,
  showTooltip = true,
  tooltipText = '下载为PNG图片',
  className = '',
  onSuccess,
  onError
}) => {
  const { currentUser, isAuthenticated } = useSafeAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('style_1');
  const [availableStyles, setAvailableStyles] = useState<any[]>([]);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  
  // 检查用户是否有下载权限
  const hasDownloadPermission = isAuthenticated && currentUser?.userType === 'semi_anonymous';
  
  // 加载卡片风格
  React.useEffect(() => {
    const loadStyles = async () => {
      try {
        const styles = await cardDownloadService.getCardStyles();
        setAvailableStyles(styles);
      } catch (error) {
        console.error('Failed to load card styles:', error);
      }
    };
    
    loadStyles();
  }, []);
  
  // 处理下载点击
  const handleDownloadClick = async () => {
    if (!hasDownloadPermission) {
      // 显示登录提示
      Modal.info({
        title: '需要登录',
        content: '请使用A+B方式登录后下载卡片',
        okText: '我知道了'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // 检查是否已经生成过卡片
      const existingCards = await cardDownloadService.getUserCards(user!.id);
      const cardForContent = existingCards.find(
        card => card.contentType === contentType && card.contentId === contentId
      );
      
      if (cardForContent) {
        // 已有卡片，直接显示选择菜单
        setGeneratedCards(existingCards.filter(
          card => card.contentType === contentType && card.contentId === contentId
        ));
        showStyleSelectionMenu();
      } else {
        // 需要生成卡片
        const result = await cardDownloadService.generateCards(
          contentType, 
          contentId, 
          user!.id,
          ['style_1', 'style_2', 'minimal'] // 默认生成三种风格
        );
        
        if (result.success) {
          setGeneratedCards(Object.values(result.generatedCards).map(card => ({
            cardId: card.card_id,
            style: card.style,
            fileUrl: card.file_url,
            fileName: card.filename
          })));
          showStyleSelectionMenu();
        } else {
          message.error('生成卡片失败: ' + result.error);
          onError?.(result.error);
        }
      }
    } catch (error) {
      message.error('操作失败: ' + (error instanceof Error ? error.message : String(error)));
      onError?.(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };
  
  // 显示风格选择菜单
  const showStyleSelectionMenu = () => {
    if (generatedCards.length === 1) {
      // 只有一种风格，直接下载
      downloadCard(generatedCards[0].cardId);
    } else if (generatedCards.length > 1) {
      // 多种风格，显示下拉菜单
      const menuItems = generatedCards.map(card => ({
        key: card.style,
        label: getStyleName(card.style),
        onClick: () => downloadCard(card.cardId)
      }));

      Modal.info({
        title: '选择卡片风格',
        content: (
          <div>
            <p>请选择您喜欢的卡片风格:</p>
            <Dropdown menu={{ items: menuItems }} placement="bottomCenter">
              <Button type="primary" icon={<PictureOutlined />}>
                选择风格
              </Button>
            </Dropdown>
          </div>
        ),
        okText: '取消'
      });
    } else {
      message.error('没有可用的卡片');
    }
  };
  
  // 获取风格名称
  const getStyleName = (styleId: string): string => {
    const style = availableStyles.find(s => s.styleId === styleId);
    return style ? style.styleName : styleId;
  };
  
  // 下载卡片
  const downloadCard = async (cardId: number) => {
    setLoading(true);
    
    try {
      const result = await cardDownloadService.downloadCard(cardId, user!.id);
      
      if (result.success) {
        // 使用下载链接
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('卡片下载成功');
        onSuccess?.(result.downloadUrl);
      } else {
        message.error('下载失败: ' + result.error);
        onError?.(result.error);
      }
    } catch (error) {
      message.error('下载失败: ' + (error instanceof Error ? error.message : String(error)));
      onError?.(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };
  
  // 预览卡片
  const previewCard = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };
  
  // 渲染按钮
  const renderButton = () => {
    const button = (
      <Button
        type={buttonType}
        size={buttonSize}
        icon={showIcon ? <DownloadOutlined /> : undefined}
        loading={loading}
        onClick={handleDownloadClick}
        className={`card-download-button ${className}`}
        disabled={loading}
      >
        {buttonText}
      </Button>
    );
    
    if (showTooltip) {
      return (
        <Tooltip title={hasDownloadPermission ? tooltipText : '登录后可下载卡片'}>
          {button}
        </Tooltip>
      );
    }
    
    return button;
  };
  
  return (
    <>
      {renderButton()}
      
      <Modal
        visible={previewVisible}
        title="卡片预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="卡片预览" 
            style={{ width: '100%', height: 'auto' }} 
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <p>加载预览...</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CardDownloadButton;
