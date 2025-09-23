import React from 'react';
import { BaseChart } from './BaseChart';
import type { EChartsOption } from 'echarts';

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  height?: string | number;
  color?: string[];
  horizontal?: boolean;
  loading?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 400,
  color = ['#1890ff'],
  horizontal = false,
  loading = false
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
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#333333'
      },
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const param = Array.isArray(params) ? params[0] : params;
        return `${param.name}: ${param.value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      backgroundColor: '#ffffff'
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : data.map(item => item.name),
      axisLabel: {
        interval: 0,
        rotate: horizontal ? 0 : 45,
        color: '#333333'
      },
      axisLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#e8e8e8'
        }
      }
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? data.map(item => item.name) : undefined,
      axisLabel: {
        color: '#333333'
      },
      axisLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: horizontal ? data.map(item => item.value) : data.map(item => item.value),
        itemStyle: {
          color: (params: any) => {
            return color[params.dataIndex % color.length];
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  return <BaseChart option={option} height={height} loading={loading} />;
};
