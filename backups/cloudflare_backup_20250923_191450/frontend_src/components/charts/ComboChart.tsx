import React from 'react';
import { BaseChart } from './BaseChart';
import type { EChartsOption } from 'echarts';

interface ComboChartData {
  name: string;
  type: 'bar' | 'line';
  data: number[];
  yAxisIndex?: number;
  color?: string;
}

interface ComboChartProps {
  data: ComboChartData[];
  xAxisData: string[];
  title?: string;
  height?: string | number;
  loading?: boolean;
  yAxisConfig?: {
    left?: { name: string; unit?: string };
    right?: { name: string; unit?: string };
  };
}

export const ComboChart: React.FC<ComboChartProps> = ({
  data,
  xAxisData,
  title,
  height = 400,
  loading = false,
  yAxisConfig
}) => {
  const defaultColors = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2'];

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
        type: 'cross'
      }
    },
    legend: {
      data: data.map(item => item.name),
      bottom: 0,
      textStyle: {
        color: '#333333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
      backgroundColor: '#ffffff'
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
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
      }
    },
    yAxis: [
      {
        type: 'value',
        name: yAxisConfig?.left?.name,
        axisLabel: {
          formatter: yAxisConfig?.left?.unit ? `{value} ${yAxisConfig.left.unit}` : '{value}',
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
      {
        type: 'value',
        name: yAxisConfig?.right?.name,
        axisLabel: {
          formatter: yAxisConfig?.right?.unit ? `{value} ${yAxisConfig.right.unit}` : '{value}',
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
      }
    ],
    series: data.map((item, index) => ({
      name: item.name,
      type: item.type,
      yAxisIndex: item.yAxisIndex || 0,
      data: item.data,
      itemStyle: {
        color: item.color || defaultColors[index % defaultColors.length]
      },
      lineStyle: item.type === 'line' ? {
        color: item.color || defaultColors[index % defaultColors.length]
      } : undefined,
      smooth: item.type === 'line'
    }))
  };

  return <BaseChart option={option} height={height} loading={loading} />;
};
