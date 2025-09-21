import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Space, Tag, message, Spin, Empty, Modal, Input } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  EyeOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './QuickReviewComponent.module.css';

const { TextArea } = Input;

interface ReviewItem {
  id: string;
  auditId: number;
  type: 'voice' | 'story';
  userId: number;
  username: string;
  content: string;
  title?: string;
  category?: string;
  mood?: string;
  rating?: number;
  submittedAt: string;
  status: string;
  auditDetails?: any;
  confidenceScore?: number;
}

interface QuickReviewComponentProps {
  contentType: 'voice' | 'story';
  title: string;
  description: string;
}

export const QuickReviewComponent: React.FC<QuickReviewComponentProps> = ({
  contentType,
  title,
  description
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 加载待审核数据
  const loadReviewItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 映射前端类型到后端类型
      const apiContentType = contentType === 'voice' ? 'heart_voice' : contentType;
      console.log(`正在加载 ${contentType} 类型的待审核内容... (API类型: ${apiContentType})`);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';
      const response = await fetch(`${apiBaseUrl}/api/reviewer/pending-reviews?content_type=${apiContentType}`);
      const result = await response.json();

      console.log('API响应:', result);

      if (result.success) {
        // API返回的数据在 reviews 字段中，不是 items
        const items = result.data.reviews || result.data.items || [];
        console.log(`加载到 ${items.length} 条待审核内容`);
        setItems(items);
        setCurrentIndex(0);
      } else {
        setError(`加载失败: ${result.error}`);
      }
    } catch (err) {
      console.error('API调用错误:', err);
      setError(`网络错误: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, [contentType]);

  useEffect(() => {
    loadReviewItems();
  }, [loadReviewItems]);

  // 提交审核结果
  const submitReview = async (action: 'approve' | 'reject', reason?: string) => {
    if (!currentItem) return;
    
    setProcessing(true);
    
    try {
      const response = await fetch('http://localhost:8006/api/reviewer/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditId: currentItem.auditId,
          action,
          reason: reason || '',
          reviewerId: 'reviewerA' // 从认证状态获取
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success(`${action === 'approve' ? '通过' : '拒绝'}审核成功`);
        
        // 移除当前项目，移动到下一个
        const newItems = items.filter((_, index) => index !== currentIndex);
        setItems(newItems);
        
        // 调整当前索引
        if (newItems.length === 0) {
          // 没有更多项目了
          message.info('所有内容已审核完成！');
          navigate('/reviewer/dashboard');
        } else if (currentIndex >= newItems.length) {
          setCurrentIndex(newItems.length - 1);
        }
        
        setRejectModalVisible(false);
        setRejectReason('');
      } else {
        message.error(`审核失败: ${result.error}`);
      }
    } catch (err) {
      message.error(`提交失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setProcessing(false);
    }
  };

  // 处理通过
  const handleApprove = () => {
    submitReview('approve');
  };

  // 处理拒绝
  const handleReject = () => {
    setRejectModalVisible(true);
  };

  // 确认拒绝
  const confirmReject = () => {
    if (!rejectReason.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    submitReview('reject', rejectReason);
  };

  // 导航控制
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (processing || rejectModalVisible) return;

      // 阻止默认行为，避免页面滚动
      const preventDefaultKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (preventDefaultKeys.includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleApprove();
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleReject();
          break;
        case 'a':
        case 'A':
          event.preventDefault();
          handleApprove();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          handleReject();
          break;
        case 'Escape':
          event.preventDefault();
          navigate('/reviewer/dashboard');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, items.length, processing, rejectModalVisible]);

  const currentItem = items[currentIndex];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>正在加载待审核内容...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Card>
          <div style={{ textAlign: 'center', color: '#ff4d4f' }}>
            <h3>加载失败</h3>
            <p>{error}</p>
            <Space>
              <Button type="primary" onClick={loadReviewItems}>重新加载</Button>
              <Button onClick={() => navigate('/reviewer/dashboard')}>返回仪表板</Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <Card>
          <Empty
            description={`暂无待审核的${contentType === 'voice' ? '心声' : '故事'}内容`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/reviewer/dashboard')}>
              返回仪表板
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 头部信息 */}
      <Card className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className={styles.progress}>
            <Tag color="blue">
              {currentIndex + 1} / {items.length}
            </Tag>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/reviewer/dashboard')}
            >
              返回仪表板
            </Button>
          </div>
        </div>
      </Card>

      {/* 内容审核区域 */}
      {currentItem && (
        <Card className={styles.reviewCard}>
          <div className={styles.contentHeader}>
            <div className={styles.userInfo}>
              <Tag color="geekblue">用户: {currentItem.username}</Tag>
              <Tag color="orange">提交时间: {currentItem.submittedAt}</Tag>
              {currentItem.category && (
                <Tag color="green">分类: {currentItem.category}</Tag>
              )}
            </div>
          </div>

          <div className={styles.contentBody}>
            {currentItem.title && (
              <h3 className={styles.contentTitle}>{currentItem.title}</h3>
            )}
            <div className={styles.contentText}>
              {currentItem.content}
            </div>
          </div>

          {/* 审核操作区域 */}
          <div className={styles.actionArea}>
            <div className={styles.navigation}>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                上一个 (←)
              </Button>
              <Button 
                icon={<ArrowRightOutlined />}
                onClick={goToNext}
                disabled={currentIndex === items.length - 1}
              >
                下一个 (→)
              </Button>
            </div>

            <div className={styles.reviewActions}>
              <Button
                type="primary"
                danger
                icon={<CloseOutlined />}
                onClick={handleReject}
                loading={processing}
                size="large"
              >
                拒绝 (R)
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApprove}
                loading={processing}
                size="large"
              >
                通过 (A)
              </Button>
            </div>
          </div>

          {/* 快捷键提示 */}
          <div className={styles.shortcuts}>
            <InfoCircleOutlined />
            快捷键: A/↑-通过 | R/↓-拒绝 | ←→-导航 | ESC-退出
          </div>
        </Card>
      )}

      {/* 拒绝原因模态框 */}
      <Modal
        title="拒绝审核"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={processing}
      >
        <p>请输入拒绝原因：</p>
        <TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请详细说明拒绝的原因..."
          rows={4}
          maxLength={500}
        />
      </Modal>
    </div>
  );
};
