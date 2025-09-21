/**
 * 快速审核主面板组件
 * 专门为问卷心声和故事墙审核设计
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Progress,
  Typography,
  Tag,
  Modal,
  Radio,
  Input,
  Statistic,
  Row,
  Col,
  Tooltip,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  UndoOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  BookOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

import { useQuickReview } from '../../hooks/useQuickReview';
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS, formatShortcutHelp, getKeyDisplayName } from '../../hooks/useKeyboardShortcuts';
import type { QuickReviewContentType, QuickReviewAction } from '../../types/quickReview.types';
import styles from './QuickReviewPanel.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface QuickReviewPanelProps {
  contentType: QuickReviewContentType;
  onExit?: () => void;
}

// 拒绝原因预设
const REJECT_REASONS = {
  voice: [
    '内容不当或违规',
    '涉及敏感信息',
    '质量不符合要求',
    '重复或无意义内容',
    '其他原因'
  ],
  story: [
    '内容不真实',
    '涉及敏感信息',
    '质量不符合要求',
    '与主题不符',
    '其他原因'
  ]
};

export const QuickReviewPanel: React.FC<QuickReviewPanelProps> = ({
  contentType,
  onExit
}) => {
  // 状态管理
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [rejectNotes, setRejectNotes] = useState<string>('');
  const [autoAdvance, setAutoAdvance] = useState(true);

  // 快速审核Hook
  const {
    items,
    currentItem,
    currentIndex,
    reviewHistory,
    canUndo,
    isSubmitting,
    isLoading,
    error,
    statistics,
    submitReview,
    undoLastReview,
    nextItem,
    previousItem,
    requestNewBatch,
    resetStatistics
  } = useQuickReview({
    contentType,
    batchSize: 50,
    autoSave: true,
    enableUndo: true
  });

  // 处理审核操作
  const handleApprove = useCallback(async () => {
    if (!currentItem || isSubmitting) return;

    try {
      await submitReview('approve');
      if (autoAdvance) {
        setTimeout(() => nextItem(), 500);
      }
    } catch (error) {
      console.error('批准失败:', error);
    }
  }, [currentItem, isSubmitting, submitReview, autoAdvance, nextItem]);

  const handleReject = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setShowRejectModal(true);
    setSelectedReason('');
    setRejectNotes('');
  }, [currentItem, isSubmitting]);

  const handleSkip = useCallback(async () => {
    if (!currentItem || isSubmitting) return;

    try {
      await submitReview('skip');
      if (autoAdvance) {
        setTimeout(() => nextItem(), 500);
      }
    } catch (error) {
      console.error('跳过失败:', error);
    }
  }, [currentItem, isSubmitting, submitReview, autoAdvance, nextItem]);

  const handleRejectConfirm = useCallback(async () => {
    if (!selectedReason) {
      message.warning('请选择拒绝原因');
      return;
    }

    try {
      await submitReview('reject', selectedReason, rejectNotes);
      setShowRejectModal(false);
      if (autoAdvance) {
        setTimeout(() => nextItem(), 500);
      }
    } catch (error) {
      console.error('拒绝失败:', error);
    }
  }, [selectedReason, rejectNotes, submitReview, autoAdvance, nextItem]);

  const handleUndo = useCallback(async () => {
    try {
      await undoLastReview();
    } catch (error) {
      console.error('撤销失败:', error);
    }
  }, [undoLastReview]);

  const handleRequestNewBatch = useCallback(async () => {
    try {
      await requestNewBatch();
    } catch (error) {
      console.error('申请新批次失败:', error);
    }
  }, [requestNewBatch]);

  // 键盘快捷键
  useKeyboardShortcuts({
    onApprove: handleApprove,
    onReject: handleReject,
    onSkip: handleSkip,
    onNext: nextItem,
    onPrevious: previousItem,
    onUndo: handleUndo,
    onHelp: () => setShowHelpModal(true),
    onExit: onExit,
    onRequestBatch: handleRequestNewBatch
  });

  // 初始化时申请第一个批次
  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      requestNewBatch();
    }
  }, [items.length, isLoading, requestNewBatch]);

  // 如果没有内容，显示加载状态
  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <Card className={styles.loadingCard}>
          <div className={styles.loadingContent}>
            <FileTextOutlined spin style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={3}>正在加载审核内容...</Title>
            <Text type="secondary">
              {isLoading ? '正在申请新的审核批次' : '准备审核环境'}
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / items.length) * 100;
  const contentTypeLabel = contentType === 'voice' ? '问卷心声' : '故事墙';

  return (
    <div className={styles.container}>
      {/* 头部工具栏 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title level={2} className={styles.title}>
            <ThunderboltOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            快速审核 - {contentTypeLabel}
          </Title>
          <Tag color="blue" className={styles.progressTag}>
            {currentIndex + 1} / {items.length}
          </Tag>
        </div>

        <div className={styles.headerRight}>
          <Space>
            <Tooltip title="键盘快捷键帮助">
              <Button
                icon={<ExclamationCircleOutlined />}
                onClick={() => setShowHelpModal(true)}
              >
                快捷键
              </Button>
            </Tooltip>
            
            <Tooltip title="申请新批次">
              <Button
                icon={<FileTextOutlined spin={isLoading} />}
                onClick={handleRequestNewBatch}
                disabled={isLoading}
              >
                新批次
              </Button>
            </Tooltip>

            {onExit && (
              <Button onClick={onExit}>
                退出
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* 进度条 */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <Text strong>批次进度</Text>
          <Text type="secondary">{Math.round(progress)}%</Text>
        </div>
        <Progress percent={progress} strokeColor="#1890ff" />
      </div>

      <Row gutter={24}>
        {/* 主内容区域 */}
        <Col span={16}>
          {/* 内容卡片 */}
          <Card className={styles.contentCard}>
            <div className={styles.contentHeader}>
              <div className={styles.contentMeta}>
                <Tag color={currentItem?.riskLevel === 'high' ? 'red' : currentItem?.riskLevel === 'medium' ? 'orange' : 'green'}>
                  风险: {currentItem?.riskLevel}
                </Tag>
                {currentItem?.aiScore && (
                  <Tag color="blue">AI评分: {currentItem.aiScore}</Tag>
                )}
                <Text type="secondary">
                  作者: {currentItem?.metadata.authorName} | 
                  创建时间: {new Date(currentItem?.metadata.createdAt || 0).toLocaleString()}
                </Text>
              </div>
            </div>

            {/* 内容展示 */}
            <div className={styles.contentBody}>
              {currentItem?.title && (
                <Title level={4} className={styles.contentTitle}>
                  {currentItem.title}
                </Title>
              )}
              
              <div className={styles.contentText}>
                {currentItem?.content}
              </div>

              {/* 元数据信息 */}
              <div className={styles.metadata}>
                {contentType === 'story' && currentItem?.metadata.storyCategory && (
                  <Tag>{currentItem.metadata.storyCategory}</Tag>
                )}
                {contentType === 'voice' && currentItem?.metadata.questionTitle && (
                  <Text type="secondary">问题: {currentItem.metadata.questionTitle}</Text>
                )}
                <Text type="secondary">字数: {currentItem?.metadata.wordCount}</Text>
              </div>
            </div>
          </Card>

          {/* 操作按钮 */}
          <div className={styles.actionButtons}>
            <Space size="large">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={previousItem}
                disabled={currentIndex === 0}
              >
                上一个 (P)
              </Button>

              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleReject}
                disabled={isSubmitting}
                size="large"
              >
                拒绝 (R)
              </Button>

              <Button
                icon={<BookOutlined />}
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                跳过 (S)
              </Button>

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                disabled={isSubmitting}
                size="large"
              >
                批准 (A)
              </Button>

              <Button
                icon={<ArrowRightOutlined />}
                onClick={nextItem}
                disabled={currentIndex >= items.length - 1}
              >
                下一个 (N)
              </Button>
            </Space>
          </div>

          {/* 撤销按钮 */}
          {canUndo && (
            <div className={styles.undoSection}>
              <Button
                type="link"
                icon={<UndoOutlined />}
                onClick={handleUndo}
                disabled={isSubmitting}
              >
                撤销上一个操作 (Z)
              </Button>
            </div>
          )}
        </Col>

        {/* 侧边栏统计 */}
        <Col span={8}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 实时统计 */}
            <Card title="审核统计" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="已审核"
                    value={statistics.totalReviewed}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="平均用时"
                    value={Math.round(statistics.averageTimePerItem / 1000)}
                    suffix="秒"
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
              </Row>
              
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Statistic
                    title="批准"
                    value={statistics.approved}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="拒绝"
                    value={statistics.rejected}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="跳过"
                    value={statistics.skipped}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* 设置 */}
            <Card title="设置" size="small">
              <div className={styles.settingItem}>
                <Text>自动前进</Text>
                <Button
                  type={autoAdvance ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setAutoAdvance(!autoAdvance)}
                >
                  {autoAdvance ? '开启' : '关闭'}
                </Button>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* 拒绝原因对话框 */}
      <Modal
        title="选择拒绝原因"
        open={showRejectModal}
        onOk={handleRejectConfirm}
        onCancel={() => setShowRejectModal(false)}
        confirmLoading={isSubmitting}
        okText="确认拒绝"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>拒绝原因:</Text>
            <Radio.Group
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{ marginTop: 8 }}
            >
              <Space direction="vertical">
                {REJECT_REASONS[contentType].map(reason => (
                  <Radio key={reason} value={reason}>
                    {reason}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <div>
            <Text strong>备注 (可选):</Text>
            <TextArea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="请填写详细的拒绝理由..."
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* 快捷键帮助对话框 */}
      <Modal
        title="键盘快捷键"
        open={showHelpModal}
        onCancel={() => setShowHelpModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowHelpModal(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div className={styles.shortcutHelp}>
          {Object.entries(formatShortcutHelp(DEFAULT_SHORTCUTS)).map(([category, shortcuts]) => (
            <div key={category} className={styles.shortcutCategory}>
              <Title level={5}>
                {category === 'review' ? '审核操作' : 
                 category === 'navigation' ? '导航操作' : '系统操作'}
              </Title>
              <div className={styles.shortcutList}>
                {shortcuts.map(shortcut => (
                  <div key={shortcut.key} className={styles.shortcutItem}>
                    <Tag className={styles.shortcutKey}>
                      {getKeyDisplayName(shortcut.key)}
                    </Tag>
                    <Text>{shortcut.description}</Text>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
