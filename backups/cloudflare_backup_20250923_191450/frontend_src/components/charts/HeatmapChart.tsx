import React from 'react';
import { BaseChart } from './BaseChart';
import type { EChartsOption } from 'echarts';

interface HeatmapData {
  x: number;
  y: number;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  xAxisData: string[];
  yAxisData: string[];
  title?: string;
  height?: string | number;
  loading?: boolean;
  colorRange?: [string, string];
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  xAxisData,
  yAxisData,
  title,
  height = 400,
  loading = false,
  colorRange = ['#313695', '#d73027']
}) => {
  const formattedData = data.map(item => [item.x, item.y, item.value]);
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));

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
      position: 'top',
      backgroundColor: '#ffffff',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#333333'
      },
      formatter: (params: any) => {
        const xLabel = xAxisData[params.data[0]];
        const yLabel = yAxisData[params.data[1]];
        return `${xLabel} - ${yLabel}: ${params.data[2]}`;
      }
    },
    grid: {
      height: '50%',
      top: '10%',
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
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#fafafa', '#ffffff']
        }
      }
    },
    yAxis: {
      type: 'category',
      data: yAxisData,
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
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#fafafa', '#ffffff']
        }
      }
    },
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      textStyle: {
        color: '#333333'
      },
      inRange: {
        color: colorRange
      }
    },
    series: [
      {
        type: 'heatmap',
        data: formattedData,
        label: {
          show: true
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  return <BaseChart option={option} height={height} loading={loading} />;
};
