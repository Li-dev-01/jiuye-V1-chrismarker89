import React from 'react';
import { BaseChart } from './BaseChart';
import type { EChartsOption } from 'echarts';

interface LineChartData {
  name: string;
  data: number[];
  color?: string;
}

interface LineChartProps {
  data: LineChartData[];
  xAxisData: string[];
  title?: string;
  height?: string | number;
  loading?: boolean;
  smooth?: boolean;
  area?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisData,
  title,
  height = 400,
  loading = false,
  smooth = true,
  area = false
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
      boundaryGap: false,
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
    yAxis: {
      type: 'value',
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
    series: data.map((item, index) => ({
      name: item.name,
      type: 'line',
      smooth: smooth,
      data: item.data,
      lineStyle: {
        color: item.color || defaultColors[index % defaultColors.length]
      },
      itemStyle: {
        color: item.color || defaultColors[index % defaultColors.length]
      },
      areaStyle: area ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: item.color || defaultColors[index % defaultColors.length]
          }, {
            offset: 1,
            color: 'rgba(255, 255, 255, 0.1)'
          }]
        }
      } : undefined
    }))
  };

  return <BaseChart option={option} height={height} loading={loading} />;
};
