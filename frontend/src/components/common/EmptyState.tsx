/**
 * 空状态组件
 * 用于显示没有数据时的友好提示
 */

import React from 'react';
import { Empty, Button, Typography, Space } from 'antd';
import { 
  FileTextOutlined, 
  HeartOutlined, 
  BookOutlined, 
  BarChartOutlined,
  ReloadOutlined,
  PlusOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import styles from './EmptyState.module.css';

const { Title, Paragraph } = Typography;

export interface EmptyStateProps {
  type: 'questionnaires' | 'heartVoices' | 'stories' | 'analytics' | 'serviceUnavailable' | 'custom';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  showAction?: boolean;
  icon?: React.ReactNode;
  size?: 'small' | 'default' | 'large';
}

const DEFAULT_CONFIGS = {
  questionnaires: {
    icon: <FileTextOutlined style={{ fontSize: 64, color: '#1890ff' }} />,
    title: '暂无问卷数据',
    description: '还没有用户提交问卷。您可以：\n• 等待用户自然参与\n• 使用测试数据生成工具\n• 分享问卷链接给更多用户',
    actionText: '生成测试数据'
  },
  heartVoices: {
    icon: <HeartOutlined style={{ fontSize: 64, color: '#f5222d' }} />,
    title: '暂无心声数据',
    description: '还没有用户发布心声。鼓励用户：\n• 分享就业感受和心路历程\n• 表达对未来的期望\n• 记录求职过程中的感悟',
    actionText: '查看发布指南'
  },
  stories: {
    icon: <BookOutlined style={{ fontSize: 64, color: '#52c41a' }} />,
    title: '暂无故事数据',
    description: '还没有用户分享就业故事。邀请用户：\n• 分享成功求职经历\n• 记录职场成长故事\n• 提供求职经验和建议',
    actionText: '查看故事模板'
  },
  analytics: {
    icon: <BarChartOutlined style={{ fontSize: 64, color: '#722ed1' }} />,
    title: '暂无分析数据',
    description: '需要有足够的问卷数据才能生成分析报告。当前状态：\n• 问卷数据不足\n• 建议至少收集10份有效问卷\n• 数据越多，分析越准确',
    actionText: '查看数据收集进度'
  },
  serviceUnavailable: {
    icon: <ExclamationCircleOutlined style={{ fontSize: 64, color: '#fa8c16' }} />,
    title: '服务暂时不可用',
    description: '数据服务连接失败，可能的原因：\n• 后端服务未启动\n• 网络连接问题\n• 服务器维护中',
    actionText: '重试连接'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  showAction = true,
  icon,
  size = 'default'
}) => {
  const config = type === 'custom' ? {} : DEFAULT_CONFIGS[type];
  
  const finalIcon = icon || config.icon;
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionText = actionText || config.actionText;

  const sizeStyles = {
    small: { padding: '24px 16px' },
    default: { padding: '48px 24px' },
    large: { padding: '64px 32px' }
  };

  return (
    <div className={styles.emptyState} style={sizeStyles[size]}>
      <Empty
        image={finalIcon}
        imageStyle={{ height: size === 'small' ? 48 : size === 'large' ? 80 : 64 }}
        description={
          <Space direction="vertical" size="middle" style={{ textAlign: 'center' }}>
            <Title level={size === 'small' ? 5 : 4} style={{ margin: 0, color: '#595959' }}>
              {finalTitle}
            </Title>
            <Paragraph 
              style={{ 
                margin: 0, 
                color: '#8c8c8c',
                fontSize: size === 'small' ? 12 : 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                maxWidth: 400
              }}
            >
              {finalDescription}
            </Paragraph>
          </Space>
        }
      />
      
      {showAction && onAction && finalActionText && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button 
            type="primary" 
            icon={type === 'serviceUnavailable' ? <ReloadOutlined /> : <PlusOutlined />}
            onClick={onAction}
            size={size === 'small' ? 'small' : 'middle'}
          >
            {finalActionText}
          </Button>
        </div>
      )}
    </div>
  );
};

// 预设的空状态组件
export const QuestionnaireEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState type="questionnaires" {...props} />
);

export const HeartVoiceEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState type="heartVoices" {...props} />
);

export const StoryEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState type="stories" {...props} />
);

export const AnalyticsEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState type="analytics" {...props} />
);

export const ServiceUnavailableState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState type="serviceUnavailable" {...props} />
);

// 数据加载状态组件
export interface DataLoadingStateProps {
  loading: boolean;
  error: boolean;
  hasData: boolean;
  dataType: 'questionnaires' | 'heartVoices' | 'stories' | 'analytics';
  onRetry?: () => void;
  children: React.ReactNode;
}

export const DataLoadingState: React.FC<DataLoadingStateProps> = ({
  loading,
  error,
  hasData,
  dataType,
  onRetry,
  children
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="正在加载数据..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <ServiceUnavailableState 
        onAction={onRetry}
        showAction={!!onRetry}
      />
    );
  }

  if (!hasData) {
    const EmptyComponent = {
      questionnaires: QuestionnaireEmptyState,
      heartVoices: HeartVoiceEmptyState,
      stories: StoryEmptyState,
      analytics: AnalyticsEmptyState
    }[dataType];

    return <EmptyComponent onAction={onRetry} showAction={!!onRetry} />;
  }

  return <>{children}</>;
};
