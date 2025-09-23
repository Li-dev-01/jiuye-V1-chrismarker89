import React, { useState, useEffect } from 'react';
import { Alert, Spin } from 'antd';

interface SafeChartProps {
  data: any[];
  title: string;
  chartType: 'bar' | 'pie' | 'line';
  height?: number;
  fallbackContent?: React.ReactNode;
}

export const SafeChart: React.FC<SafeChartProps> = ({
  data,
  title,
  chartType,
  height = 300,
  fallbackContent
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ChartComponent, setChartComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const loadChart = async () => {
      try {
        setLoading(true);
        setError(null);

        // 动态导入图表组件
        const chartModule = await import('../../components/charts');
        
        let Component;
        switch (chartType) {
          case 'bar':
            Component = chartModule.BarChart;
            break;
          case 'pie':
            Component = chartModule.PieChart;
            break;
          case 'line':
            Component = chartModule.LineChart;
            break;
          default:
            throw new Error(`Unsupported chart type: ${chartType}`);
        }

        setChartComponent(() => Component);
      } catch (err) {
        console.error(`Failed to load ${chartType} chart:`, err);
        setError(`图表加载失败: ${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    loadChart();
  }, [chartType]);

  if (loading) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin size="large" tip="加载图表中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height, padding: '20px' }}>
        <Alert
          message="图表渲染错误"
          description={error}
          type="warning"
          showIcon
          action={
            fallbackContent || (
              <div style={{ marginTop: '16px' }}>
                <h4>数据预览：</h4>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )
          }
        />
      </div>
    );
  }

  if (!ChartComponent) {
    return (
      <div style={{ height, padding: '20px' }}>
        <Alert
          message="图表组件未加载"
          description="图表组件加载失败，请刷新页面重试"
          type="error"
          showIcon
        />
      </div>
    );
  }

  try {
    return (
      <ChartComponent
        data={data}
        height={height}
        title={title}
      />
    );
  } catch (renderError) {
    console.error(`Chart render error for ${title}:`, renderError);
    return (
      <div style={{ height, padding: '20px' }}>
        <Alert
          message="图表渲染失败"
          description={`${title}图表渲染时出现错误`}
          type="error"
          showIcon
          action={
            fallbackContent || (
              <div style={{ marginTop: '16px' }}>
                <h4>原始数据：</h4>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )
          }
        />
      </div>
    );
  }
};
