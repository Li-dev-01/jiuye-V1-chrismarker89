/**
 * 通用图表组件
 * 支持多种图表类型的统一渲染
 * 包含移动端响应式优化
 */

import React from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Treemap
} from 'recharts';
import { Empty, Spin } from 'antd';
import { getSmartBilingualDataLabel, formatSmartBilingualDataLabel } from '../../config/bilingualTitleMapping';
import { useMobileDetection } from '../../hooks/useMobileDetection';

// 自定义X轴标签组件，支持换行显示
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;

  // 安全检查
  if (!payload || !payload.value) {
    return null;
  }

  const lines = String(payload.value).split('\n');

  return (
    <g transform={`translate(${x},${y})`}>
      <g transform="rotate(-45)">
        {lines.map((line: string, index: number) => (
          <text
            key={index}
            x={0}
            y={index * 10}
            dy={0}
            textAnchor="end"
            fill="#666"
            fontSize="9"
            fontFamily="sans-serif"
          >
            {line}
          </text>
        ))}
      </g>
    </g>
  );
};

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
  icon?: string;
}

export interface UniversalChartProps {
  type: 'pie' | 'bar' | 'donut' | 'line' | 'treemap' | 'heatmap';
  data: ChartDataPoint[];
  title?: string;
  loading?: boolean;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
}

const DEFAULT_COLORS = [
  '#1890FF', '#52C41A', '#FA8C16', '#722ED1', '#13C2C2', 
  '#FADB14', '#F759AB', '#FF4D4F', '#9B59B6', '#6BCF7F'
];

export const UniversalChart: React.FC<UniversalChartProps> = ({
  type,
  data,
  title,
  loading = false,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showTooltip = true
}) => {
  // 移动端检测
  const { isMobile, isTablet } = useMobileDetection();

  // 根据设备类型调整图表配置
  const responsiveHeight = isMobile ? Math.min(height, 280) : (isTablet ? Math.min(height, 350) : height);
  const responsiveLegend = isMobile ? false : showLegend; // 移动端默认隐藏图例以节省空间
  const fontSize = isMobile ? 11 : 12;
  const pieOuterRadius = isMobile ? 60 : 80;

  if (loading) {
    return (
      <div style={{
        height: responsiveHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height: responsiveHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="暂无数据" />
      </div>
    );
  }

  // 为数据添加颜色和智能双语标签
  const dataWithColors = data.map((item, index) => {
    try {
      const originalLabel = item.name || item.label || '';
      const smartBilingualLabel = formatSmartBilingualDataLabel(originalLabel);

      return {
        ...item,
        name: originalLabel,
        color: item.color || colors[index % colors.length],
        bilingualName: smartBilingualLabel,
        // 为饼图保留原始名称，为条形图使用智能双语名称
        displayName: type === 'pie' ? originalLabel : smartBilingualLabel
      };
    } catch (error) {
      console.warn('Error processing chart data item:', item, error);
      const fallbackLabel = item.name || item.label || `Item ${index}`;
      return {
        ...item,
        name: fallbackLabel,
        color: item.color || colors[index % colors.length],
        bilingualName: fallbackLabel,
        displayName: fallbackLabel
      };
    }
  });

  const renderTooltip = (props: any) => {
    if (!showTooltip || !props.active || !props.payload) return null;
    
    const data = props.payload[0]?.payload;
    if (!data) return null;

    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {data.name}
        </div>
        <div style={{ color: '#666' }}>
          数量: {data.value}
        </div>
        {data.percentage && (
          <div style={{ color: '#666' }}>
            占比: {data.percentage.toFixed(1)}%
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              outerRadius={pieOuterRadius}
              dataKey="value"
              label={isMobile ? false : ({ name, payload }) => `${name}: ${payload?.percentage?.toFixed(1)}%`}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={renderTooltip} />}
            {responsiveLegend && <Legend wrapperStyle={{ fontSize }} />}
          </PieChart>
        );

      case 'donut':
        return (
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 30 : 40}
              outerRadius={pieOuterRadius}
              dataKey="value"
              label={isMobile ? false : ({ name, payload }) => `${name}: ${payload?.percentage?.toFixed(1)}%`}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={renderTooltip} />}
            {responsiveLegend && <Legend wrapperStyle={{ fontSize }} />}
          </PieChart>
        );

      case 'bar':
        return (
          <BarChart
            data={dataWithColors}
            margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="bilingualName"
              height={isMobile ? 60 : 80}
              interval={0}
              tick={<CustomXAxisTick />}
              style={{ fontSize }}
            />
            <YAxis style={{ fontSize }} />
            {showTooltip && <Tooltip content={renderTooltip} />}
            {responsiveLegend && <Legend wrapperStyle={{ fontSize }} />}
            <Bar dataKey="value" fill="#1890FF">
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'line':
        return (
          <LineChart
            data={dataWithColors}
            margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" style={{ fontSize }} />
            <YAxis style={{ fontSize }} />
            {showTooltip && <Tooltip content={renderTooltip} />}
            {responsiveLegend && <Legend wrapperStyle={{ fontSize }} />}
            <Line type="monotone" dataKey="value" stroke="#1890FF" strokeWidth={isMobile ? 1.5 : 2} />
          </LineChart>
        );

      case 'treemap':
        return (
          <Treemap
            data={dataWithColors}
            dataKey="value"
            ratio={4/3}
            stroke="#fff"
            fill="#1890FF"
            content={(props) => {
              const { depth, x, y, width, height, index, payload, name } = props;
              if (depth === 1) {
                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      style={{
                        fill: payload?.color || colors[index % colors.length],
                        stroke: '#fff',
                        strokeWidth: 2,
                        strokeOpacity: 1,
                      }}
                    />
                    {width > 40 && height > 20 && (
                      <>
                        <text
                          x={x + width / 2}
                          y={y + height / 2 - 5}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize={Math.min(12, width / 8)}
                          fontWeight="bold"
                        >
                          {name || payload?.name}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y + height / 2 + 10}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize={Math.min(10, width / 10)}
                        >
                          {payload?.value}
                        </text>
                      </>
                    )}
                  </g>
                );
              }
              return null;
            }}
          />
        );

      default:
        return <Empty description={`暂不支持 ${type} 图表类型`} />;
    }
  };

  return (
    <div style={{ width: '100%', height: responsiveHeight }}>
      {title && (
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '8px' : '16px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 'bold'
        }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
