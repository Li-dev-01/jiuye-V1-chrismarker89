import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'chart' | 'form' | 'list';
  rows?: number;
  loading?: boolean;
  children?: React.ReactNode;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  rows = 3,
  loading = true,
  children
}) => {
  if (!loading && children) {
    return <>{children}</>;
  }

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Row gutter={[16, 16]}>
            {Array.from({ length: rows }, (_, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        );

      case 'table':
        return (
          <Card>
            <Skeleton.Input style={{ width: 200, marginBottom: 16 }} active />
            <Skeleton active paragraph={{ rows: rows }} />
          </Card>
        );

      case 'chart':
        return (
          <Card>
            <Skeleton.Input style={{ width: 150, marginBottom: 16 }} active />
            <div style={{ 
              height: 300, 
              background: '#f5f5f5', 
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Skeleton.Avatar size={64} active />
            </div>
          </Card>
        );

      case 'form':
        return (
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Skeleton.Input style={{ width: 100, marginBottom: 8 }} active />
              <Skeleton.Input style={{ width: '100%' }} active />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Skeleton.Input style={{ width: 100, marginBottom: 8 }} active />
              <Skeleton.Input style={{ width: '100%' }} active />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Skeleton.Input style={{ width: 100, marginBottom: 8 }} active />
              <Skeleton.Input style={{ width: '100%', height: 80 }} active />
            </div>
            <Skeleton.Button style={{ width: 100 }} active />
          </Card>
        );

      case 'list':
        return (
          <Card>
            {Array.from({ length: rows }, (_, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: index < rows - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <Skeleton.Avatar size={40} style={{ marginRight: 16 }} active />
                <div style={{ flex: 1 }}>
                  <Skeleton.Input style={{ width: '60%', marginBottom: 8 }} active />
                  <Skeleton.Input style={{ width: '40%' }} active />
                </div>
              </div>
            ))}
          </Card>
        );

      default:
        return <Skeleton active paragraph={{ rows }} />;
    }
  };

  return <div className="fade-in">{renderSkeleton()}</div>;
};

// 特定页面的骨架屏组件
export const DashboardSkeleton: React.FC = () => (
  <div>
    {/* 统计卡片骨架 */}
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {Array.from({ length: 4 }, (_, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
    
    {/* 图表骨架 */}
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <SkeletonLoader type="chart" />
      </Col>
      <Col xs={24} lg={12}>
        <SkeletonLoader type="chart" />
      </Col>
    </Row>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Card>
    <div style={{ marginBottom: 16 }}>
      <Skeleton.Button style={{ width: 100, marginRight: 8 }} active />
      <Skeleton.Button style={{ width: 80, marginRight: 8 }} active />
      <Skeleton.Button style={{ width: 120 }} active />
    </div>
    <Skeleton active paragraph={{ rows }} />
  </Card>
);

export const FormSkeleton: React.FC = () => (
  <Card>
    <Row gutter={16}>
      <Col span={12}>
        <div style={{ marginBottom: 24 }}>
          <Skeleton.Input style={{ width: 80, marginBottom: 8 }} active />
          <Skeleton.Input style={{ width: '100%' }} active />
        </div>
      </Col>
      <Col span={12}>
        <div style={{ marginBottom: 24 }}>
          <Skeleton.Input style={{ width: 80, marginBottom: 8 }} active />
          <Skeleton.Input style={{ width: '100%' }} active />
        </div>
      </Col>
    </Row>
    <Row gutter={16}>
      <Col span={24}>
        <div style={{ marginBottom: 24 }}>
          <Skeleton.Input style={{ width: 80, marginBottom: 8 }} active />
          <Skeleton.Input style={{ width: '100%', height: 100 }} active />
        </div>
      </Col>
    </Row>
    <div style={{ textAlign: 'right' }}>
      <Skeleton.Button style={{ width: 80, marginRight: 8 }} active />
      <Skeleton.Button style={{ width: 80 }} active />
    </div>
  </Card>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card>
    <Skeleton.Input style={{ width: 150, marginBottom: 16 }} active />
    <div style={{ 
      height, 
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'loading 1.5s infinite',
      borderRadius: 8
    }} />
    <style>
      {`
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}
    </style>
  </Card>
);

export default SkeletonLoader;
