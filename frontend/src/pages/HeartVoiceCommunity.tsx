/**
 * 心声社区页面
 * 展示所有公开的心声内容，支持PNG卡片生成和下载
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Avatar, 
  Pagination,
  Modal,
  message,
  Spin,
  Empty,
  Tooltip
} from 'antd';
import {
  HeartOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  FileImageOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { LikeDislikeDownload } from '../components/common/LikeDislikeDownload';

const { Title, Paragraph, Text } = Typography;

interface HeartVoice {
  id: number;
  content: string;
  anonymousNickname?: string;
  createdAt: string;
  category: string;
  wordCount: number;
  emotionCategory?: string;
}

interface PNGCardOptions {
  theme: 'light' | 'dark' | 'gradient' | 'minimal';
  width: number;
  height: number;
}

export const HeartVoiceCommunity: React.FC = () => {
  const [heartVoices, setHeartVoices] = useState<HeartVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [pngModalVisible, setPngModalVisible] = useState(false);
  const [selectedHeartVoice, setSelectedHeartVoice] = useState<HeartVoice | null>(null);
  const [pngGenerating, setPngGenerating] = useState(false);
  const [pngOptions, setPngOptions] = useState<PNGCardOptions>({
    theme: 'gradient',
    width: 800,
    height: 600
  });

  useEffect(() => {
    loadHeartVoices();
  }, [currentPage]);

  const loadHeartVoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/heart-voice/list?page=${currentPage}&limit=${pageSize}&isPublic=true`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHeartVoices(result.data.data);
          setTotal(result.data.total);
        }
      }
    } catch (error) {
      console.error('加载心声列表失败:', error);
      message.error('加载心声列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePNG = (heartVoice: HeartVoice) => {
    setSelectedHeartVoice(heartVoice);
    setPngModalVisible(true);
  };

  const generatePNGCard = async () => {
    if (!selectedHeartVoice) return;

    try {
      setPngGenerating(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/files/png-card/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            heartVoiceId: selectedHeartVoice.id,
            options: pngOptions
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 直接下载PNG卡片
          const downloadLink = document.createElement('a');
          downloadLink.href = result.data.downloadUrl;
          downloadLink.download = `heart-voice-card-${selectedHeartVoice.id}.png`;
          downloadLink.click();
          
          message.success('PNG卡片生成成功！');
          setPngModalVisible(false);
        } else {
          message.error(result.message || 'PNG卡片生成失败');
        }
      } else {
        message.error('PNG卡片生成失败');
      }
    } catch (error) {
      console.error('PNG卡片生成失败:', error);
      message.error('PNG卡片生成失败');
    } finally {
      setPngGenerating(false);
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'positive': return 'green';
      case 'negative': return 'red';
      case 'neutral': return 'blue';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const themeOptions = [
    { value: 'gradient', label: '渐变主题', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { value: 'light', label: '明亮主题', preview: '#ffffff' },
    { value: 'dark', label: '深色主题', preview: '#1a1a1a' },
    { value: 'minimal', label: '简约主题', preview: '#f8f9fa' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2}>
          <HeartOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
          就业心声社区
        </Title>
        <Paragraph type="secondary">
          分享真实的就业感受，传递温暖的职场心声
        </Paragraph>
      </div>

      <Spin spinning={loading}>
        {heartVoices.length === 0 && !loading ? (
          <Empty 
            description="暂无心声内容"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={heartVoices}
            renderItem={(heartVoice) => (
              <List.Item key={heartVoice.id}>
                <Card
                  style={{ width: '100%', marginBottom: '16px' }}
                  bodyStyle={{ padding: '24px' }}
                  hoverable
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Space>
                      <Avatar 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: '#1890ff' }}
                      />
                      <div>
                        <Text strong>{heartVoice.anonymousNickname || '匿名用户'}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <CalendarOutlined style={{ marginRight: '4px' }} />
                          {formatDate(heartVoice.createdAt)}
                        </Text>
                      </div>
                    </Space>
                    <div style={{ float: 'right' }}>
                      <Space>
                        {heartVoice.emotionCategory && (
                          <Tag color={getEmotionColor(heartVoice.emotionCategory)}>
                            {heartVoice.emotionCategory === 'positive' ? '积极' :
                             heartVoice.emotionCategory === 'negative' ? '消极' : '中性'}
                          </Tag>
                        )}
                        <Tag>{heartVoice.wordCount} 字</Tag>
                      </Space>
                    </div>
                  </div>

                  <Paragraph style={{ 
                    fontSize: '16px', 
                    lineHeight: '1.8',
                    margin: '16px 0',
                    padding: '16px',
                    backgroundColor: '#fafafa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #1890ff'
                  }}>
                    {heartVoice.content}
                  </Paragraph>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    {/* 使用新的赞/踩/下载组件 */}
                    <LikeDislikeDownload
                      contentType="heart_voice"
                      contentId={heartVoice.id}
                      initialLikeCount={0} // 这里应该从API获取真实数据
                      initialDislikeCount={0}
                      theme="gradient"
                      showCounts={true}
                    />

                    <Space>
                      <Tooltip title="分享心声">
                        <Button
                          icon={<ShareAltOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(heartVoice.content);
                            message.success('心声内容已复制到剪贴板');
                          }}
                        >
                          分享
                        </Button>
                      </Tooltip>
                    </Space>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Spin>

      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={setCurrentPage}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条心声`
            }
          />
        </div>
      )}

      {/* PNG生成模态框 */}
      <Modal
        title="生成PNG卡片"
        open={pngModalVisible}
        onCancel={() => setPngModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPngModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="generate" 
            type="primary" 
            loading={pngGenerating}
            onClick={generatePNGCard}
            icon={<DownloadOutlined />}
          >
            生成并下载
          </Button>
        ]}
        width={600}
      >
        {selectedHeartVoice && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>预览内容</Title>
              <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                <Paragraph ellipsis={{ rows: 3 }}>
                  {selectedHeartVoice.content}
                </Paragraph>
                <Text type="secondary">
                  —— {selectedHeartVoice.anonymousNickname || '匿名用户'}
                </Text>
              </Card>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>选择主题</Title>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {themeOptions.map(theme => (
                  <Card
                    key={theme.value}
                    size="small"
                    style={{ 
                      cursor: 'pointer',
                      border: pngOptions.theme === theme.value ? '2px solid #1890ff' : '1px solid #d9d9d9'
                    }}
                    onClick={() => setPngOptions(prev => ({ ...prev, theme: theme.value as any }))}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div 
                        style={{ 
                          width: '100%', 
                          height: '40px', 
                          background: theme.preview,
                          borderRadius: '4px',
                          marginBottom: '8px'
                        }}
                      />
                      <Text>{theme.label}</Text>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
