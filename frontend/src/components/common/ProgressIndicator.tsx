import React, { useState, useEffect } from 'react';
import { Progress, Card, Typography, Space } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Step {
  title: string;
  description?: string;
  status: 'waiting' | 'process' | 'finish' | 'error';
}

interface ProgressIndicatorProps {
  steps: Step[];
  current?: number;
  showProgress?: boolean;
  showSteps?: boolean;
  type?: 'line' | 'circle' | 'dashboard';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  current = 0,
  showProgress = true,
  showSteps = true,
  type = 'line'
}) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const targetPercent = Math.round((current / (steps.length - 1)) * 100);
    const timer = setInterval(() => {
      setAnimatedPercent(prev => {
        if (prev >= targetPercent) {
          clearInterval(timer);
          return targetPercent;
        }
        return prev + 2;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [current, steps.length]);

  const getStepIcon = (step: Step, index: number) => {
    if (index < current) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else if (index === current) {
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    }
    return null;
  };

  const getStepColor = (step: Step, index: number) => {
    if (index < current) return '#52c41a';
    if (index === current) return '#1890ff';
    return '#d9d9d9';
  };

  return (
    <Card>
      {showProgress && (
        <div style={{ marginBottom: showSteps ? 24 : 0 }}>
          <Progress
            type={type}
            percent={animatedPercent}
            status={current === steps.length - 1 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#667eea',
              '100%': '#764ba2',
            }}
            trailColor="#f0f0f0"
            strokeWidth={type === 'line' ? 8 : undefined}
            width={type === 'circle' || type === 'dashboard' ? 120 : undefined}
          />
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary">
              {current + 1} / {steps.length} 步骤完成
            </Text>
          </div>
        </div>
      )}

      {showSteps && (
        <div>
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: index < steps.length - 1 ? 16 : 0,
                opacity: index <= current ? 1 : 0.5,
                transition: 'opacity 0.3s ease'
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: getStepColor(step, index),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  flexShrink: 0,
                  transition: 'background 0.3s ease'
                }}
              >
                {getStepIcon(step, index) || (
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {index + 1}
                  </Text>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: index <= current ? 600 : 400,
                    color: index <= current ? '#262626' : '#8c8c8c',
                    marginBottom: 4,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {step.title}
                </div>
                {step.description && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      opacity: index <= current ? 1 : 0.6
                    }}
                  >
                    {step.description}
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// 简化的进度条组件
export const SimpleProgress: React.FC<{
  percent: number;
  status?: 'normal' | 'active' | 'success' | 'exception';
  showInfo?: boolean;
  size?: 'default' | 'small';
}> = ({ percent, status = 'active', showInfo = true, size = 'default' }) => (
  <Progress
    percent={percent}
    status={status}
    showInfo={showInfo}
    size={size}
    strokeColor={{
      '0%': '#667eea',
      '100%': '#764ba2',
    }}
    trailColor="#f0f0f0"
  />
);

// 圆形进度条组件
export const CircularProgress: React.FC<{
  percent: number;
  title?: string;
  subtitle?: string;
  size?: number;
}> = ({ percent, title, subtitle, size = 120 }) => (
  <div style={{ textAlign: 'center' }}>
    <Progress
      type="circle"
      percent={percent}
      width={size}
      strokeColor={{
        '0%': '#667eea',
        '100%': '#764ba2',
      }}
      trailColor="#f0f0f0"
    />
    {title && (
      <div style={{ marginTop: 8 }}>
        <Text strong>{title}</Text>
      </div>
    )}
    {subtitle && (
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {subtitle}
        </Text>
      </div>
    )}
  </div>
);

// 步骤进度组件
export const StepProgress: React.FC<{
  steps: string[];
  current: number;
  direction?: 'horizontal' | 'vertical';
}> = ({ steps, current, direction = 'horizontal' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: direction === 'horizontal' ? 'row' : 'column',
      alignItems: direction === 'horizontal' ? 'center' : 'flex-start'
    }}
  >
    {steps.map((step, index) => (
      <React.Fragment key={index}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: direction === 'horizontal' ? 'column' : 'row'
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: index <= current ? '#667eea' : '#d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: direction === 'horizontal' ? 8 : 0,
              marginRight: direction === 'vertical' ? 12 : 0,
              transition: 'background 0.3s ease'
            }}
          >
            {index < current ? (
              <CheckCircleOutlined style={{ color: 'white' }} />
            ) : (
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                {index + 1}
              </Text>
            )}
          </div>
          <Text
            style={{
              fontSize: 12,
              color: index <= current ? '#262626' : '#8c8c8c',
              textAlign: direction === 'horizontal' ? 'center' : 'left',
              maxWidth: direction === 'horizontal' ? 80 : 'none'
            }}
          >
            {step}
          </Text>
        </div>
        {index < steps.length - 1 && (
          <div
            style={{
              width: direction === 'horizontal' ? 40 : 2,
              height: direction === 'horizontal' ? 2 : 40,
              background: index < current ? '#667eea' : '#d9d9d9',
              margin: direction === 'horizontal' ? '0 8px' : '8px 0 8px 15px',
              transition: 'background 0.3s ease'
            }}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default ProgressIndicator;
