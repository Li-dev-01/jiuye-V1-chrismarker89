import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface BaseChartProps {
  option: EChartsOption;
  height?: string | number;
  width?: string | number;
  loading?: boolean;
  className?: string;
  onChartReady?: (chart: any) => void;
  onEvents?: Record<string, (params: any) => void>;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  option,
  height = 400,
  width = '100%',
  loading = false,
  className,
  onChartReady,
  onEvents
}) => {
  return (
    <ReactECharts
      option={option}
      style={{ height, width }}
      className={className}
      showLoading={loading}
      onChartReady={onChartReady}
      onEvents={onEvents}
      opts={{ renderer: 'canvas' }}
    />
  );
};
