/**
 * PNG卡片下载按钮组件
 * 支持单个卡片下载和批量生成下载
 */

import React, { useState, useEffect } from 'react';
import {
  Button, Dropdown, Modal, Progress, message, Space, 
  Typography, Card, Row, Col, Tag, Tooltip
} from 'antd';
import {
  DownloadOutlined, PictureOutlined, LoadingOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../stores/universalAuthStore';
import { pngCardService, CardStyle, PNGCard } from '../../services/pngCardService';
import './CardDownloadButton.css';

const { Text, Title } = Typography;

interface CardDownloadButtonProps {
  contentType: 'heart_voice' | 'story';
  contentId: number;
  contentData: {
    title?: string;
    content: string;
    author_name?: string;
    created_at: string;
    tags?: string[];
    emotion_score?: number;
  };
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  showText?: boolean;
}

const CardDownloadButton: React.FC<CardDownloadButtonProps> = ({
  contentType,
  contentId,
  contentData,
  disabled = false,
  size = 'middle',
  type = 'primary',
  showText = true
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [canDownload, setCanDownload] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [cardStyles, setCardStyles] = useState<CardStyle[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generatedCards, setGeneratedCards] = useState<PNGCard[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    checkPermissions();
    loadCardStyles();
  }, [user]);

  // 检查下载权限
  const checkPermissions = async () => {
    if (!user?.id) return;
    
    try {
      const result = await pngCardService.checkDownloadPermission(user.id);
      if (result.success) {
        setCanDownload(result.canDownload || false);
      }
    } catch (error) {
      console.error('Check permissions error:', error);
    }
  };

  // 加载卡片风格
  const loadCardStyles = async () => {
    try {
      const result = await pngCardService.getCardStyles();
      if (result.success && result.data) {
        setCardStyles(result.data);
        // 默认选择前3种风格
        setSelectedStyles(result.data.slice(0, 3).map(style => style.id));
      }
    } catch (error) {
      console.error('Load card styles error:', error);
    }
  };

  // 快速下载（使用默认风格）
  const handleQuickDownload = async () => {
    if (!user?.id || !canDownload) {
      message.warning('您没有下载权限，请先完成身份验证');
      return;
    }

    setLoading(true);
    try {
      // 生成默认风格的卡片
      const generateResult = await pngCardService.generateCards({
        content_type: contentType,
        content_id: contentId,
        user_id: user.id,
        styles: ['style_1'] // 使用经典风格
      });

      if (generateResult.success && generateResult.data?.generated_cards.length > 0) {
        const card = generateResult.data.generated_cards[0];
        
        // 下载卡片
        const downloadResult = await pngCardService.downloadCard(card.id, user.id);
        if (downloadResult.success && downloadResult.data) {
          pngCardService.triggerDownload(downloadResult.data, downloadResult.fileName || 'card.png');
          message.success('下载成功！');
        } else {
          message.error('下载失败：' + downloadResult.error);
        }
      } else {
        message.error('生成卡片失败：' + generateResult.error);
      }
    } catch (error) {
      message.error('下载失败');
      console.error('Quick download error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开自定义下载模态框
  const handleCustomDownload = () => {
    if (!user?.id || !canDownload) {
      message.warning('您没有下载权限，请先完成身份验证');
      return;
    }
    setModalVisible(true);
  };

  // 生成自定义卡片
  const handleGenerateCards = async () => {
    if (!user?.id || selectedStyles.length === 0) {
      message.warning('请至少选择一种卡片风格');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      const result = await pngCardService.generateCards({
        content_type: contentType,
        content_id: contentId,
        user_id: user.id,
        styles: selectedStyles
      });

      if (result.success && result.data) {
        setGeneratedCards(result.data.generated_cards);
        setGenerationProgress(100);
        message.success(`成功生成 ${result.data.generated_cards.length} 张卡片！`);
      } else {
        message.error('生成失败：' + result.error);
      }
    } catch (error) {
      message.error('生成失败');
      console.error('Generate cards error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载单张卡片
  const handleDownloadSingleCard = async (card: PNGCard) => {
    if (!user?.id) return;

    try {
      const result = await pngCardService.downloadCard(card.id, user.id);
      if (result.success && result.data) {
        pngCardService.triggerDownload(result.data, result.fileName || 'card.png');
        message.success('下载成功！');
      } else {
        message.error('下载失败：' + result.error);
      }
    } catch (error) {
      message.error('下载失败');
      console.error('Download single card error:', error);
    }
  };

  // 批量下载所有生成的卡片
  const handleBatchDownload = async () => {
    if (!user?.id || generatedCards.length === 0) return;

    try {
      for (const card of generatedCards) {
        await handleDownloadSingleCard(card);
        // 添加延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      message.success(`批量下载完成！共 ${generatedCards.length} 张卡片`);
    } catch (error) {
      message.error('批量下载失败');
      console.error('Batch download error:', error);
    }
  };

  // 下拉菜单项
  const menuItems = [
    {
      key: 'quick',
      label: (
        <Space>
          <DownloadOutlined />
          快速下载 (经典风格)
        </Space>
      ),
      onClick: handleQuickDownload
    },
    {
      key: 'custom',
      label: (
        <Space>
          <PictureOutlined />
          自定义风格下载
        </Space>
      ),
      onClick: handleCustomDownload
    }
  ];

  if (!canDownload) {
    return (
      <Tooltip title="完成身份验证后可下载PNG卡片">
        <Button 
          disabled 
          size={size}
          icon={<DownloadOutlined />}
        >
          {showText && '下载卡片'}
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      <Dropdown 
        menu={{ items: menuItems }}
        placement="bottomLeft"
        disabled={disabled}
      >
        <Button 
          type={type}
          size={size}
          loading={loading}
          icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
        >
          {showText && (loading ? '生成中...' : '下载卡片')}
        </Button>
      </Dropdown>

      {/* 自定义下载模态框 */}
      <Modal
        title="自定义PNG卡片下载"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="generate" 
            type="primary" 
            loading={isGenerating}
            onClick={handleGenerateCards}
            disabled={selectedStyles.length === 0}
          >
            生成卡片 ({selectedStyles.length} 种风格)
          </Button>,
          generatedCards.length > 0 && (
            <Button 
              key="batch-download" 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleBatchDownload}
            >
              批量下载全部
            </Button>
          )
        ]}
      >
        <div className="card-download-modal">
          {/* 内容预览 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>内容预览</Title>
            <Text strong>{contentData.title || '问卷心声'}</Text>
            <br />
            <Text type="secondary">
              {contentData.content.length > 100 
                ? contentData.content.substring(0, 100) + '...'
                : contentData.content
              }
            </Text>
            <br />
            <Space style={{ marginTop: 8 }}>
              <Text type="secondary">作者: {contentData.author_name || '匿名'}</Text>
              <Text type="secondary">时间: {new Date(contentData.created_at).toLocaleDateString()}</Text>
            </Space>
          </Card>

          {/* 风格选择 */}
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>选择卡片风格</Title>
            <Row gutter={[16, 16]}>
              {cardStyles.map(style => (
                <Col span={8} key={style.id}>
                  <Card
                    size="small"
                    hoverable
                    className={selectedStyles.includes(style.id) ? 'style-card-selected' : 'style-card'}
                    onClick={() => {
                      if (selectedStyles.includes(style.id)) {
                        setSelectedStyles(selectedStyles.filter(s => s !== style.id));
                      } else {
                        setSelectedStyles([...selectedStyles, style.id]);
                      }
                    }}
                  >
                    <div 
                      className="style-preview"
                      style={{ 
                        backgroundColor: style.backgroundColor,
                        color: style.textColor,
                        border: `2px solid ${style.accentColor}`
                      }}
                    >
                      <Text strong style={{ color: style.textColor }}>{style.name}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {style.description}
                    </Text>
                    {selectedStyles.includes(style.id) && (
                      <CheckCircleOutlined 
                        style={{ 
                          position: 'absolute', 
                          top: 8, 
                          right: 8, 
                          color: '#52c41a' 
                        }} 
                      />
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* 生成进度 */}
          {isGenerating && (
            <div style={{ marginBottom: 16 }}>
              <Text>正在生成卡片...</Text>
              <Progress percent={generationProgress} status="active" />
            </div>
          )}

          {/* 生成结果 */}
          {generatedCards.length > 0 && (
            <div>
              <Title level={5}>生成的卡片 ({generatedCards.length})</Title>
              <Row gutter={[16, 16]}>
                {generatedCards.map(card => (
                  <Col span={8} key={card.id}>
                    <Card
                      size="small"
                      hoverable
                      actions={[
                        <Button 
                          type="link" 
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadSingleCard(card)}
                        >
                          下载
                        </Button>
                      ]}
                    >
                      <div className="generated-card-preview">
                        <Tag color="blue">{card.cardStyle}</Tag>
                        <br />
                        <Text type="secondary">
                          {card.imageWidth} × {card.imageHeight}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {(card.fileSize / 1024).toFixed(1)} KB
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CardDownloadButton;
