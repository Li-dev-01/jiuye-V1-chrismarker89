import React from 'react';
import { BaseChart } from './BaseChart';
import type { EChartsOption } from 'echarts';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  height?: string | number;
  color?: string[];
  loading?: boolean;
  showLegend?: boolean;
  radius?: string | [string, string];
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 400,
  color = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2'],
  loading = false,
  showLegend = true,
  radius = '50%'
}) => {
  const option: EChartsOption = {
    backgroundColor: '#ffffff',
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#333333'
      },
      formatter: (params: any) => {
        return `${params.name}: ${params.value} (${params.percent}%)`;
      }
    },
    legend: showLegend ? {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name),
      textStyle: {
        color: '#333333'
      }
    } : undefined,
    color: color,
    series: [
      {
        type: 'pie',
        radius: radius,
        center: ['50%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)'
        }
      }
    ]
  };

  return <BaseChart option={option} height={height} loading={loading} />;
};
