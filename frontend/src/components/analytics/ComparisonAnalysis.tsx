import React, { useState } from 'react';
import {
  Card,
  Select,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Typography
} from 'antd';
import { SwapOutlined, BarChartOutlined } from '@ant-design/icons';
import { BarChart, LineChart } from '../charts';

const { Option } = Select;
const { Title, Text } = Typography;

interface ComparisonData {
  category: string;
  group1: {
    name: string;
    value: number;
    percentage: number;
  };
  group2: {
    name: string;
    value: number;
    percentage: number;
  };
  difference: number;
  trend: 'up' | 'down' | 'stable';
}

interface ComparisonAnalysisProps {
  loading?: boolean;
}

export const ComparisonAnalysis: React.FC<ComparisonAnalysisProps> = ({
  loading = false
}) => {
  const [dimension1, setDimension1] = useState('education');
  const [dimension2, setDimension2] = useState('region');
  const [metric, setMetric] = useState('employment_rate');

  const dimensionOptions = [
    { label: '学历', value: 'education' },
    { label: '地区', value: 'region' },
    { label: '年龄', value: 'age' },
    { label: '性别', value: 'gender' }
  ];

  const metricOptions = [
    { label: '就业率', value: 'employment_rate' },
    { label: '平均薪资', value: 'average_salary' },
    { label: '求职时长', value: 'job_search_duration' },
    { label: '满意度', value: 'satisfaction' }
  ];

  // 模拟对比数据
  const comparisonData: ComparisonData[] = [
    {
      category: '本科 vs 硕士',
      group1: { name: '本科', value: 78.5, percentage: 78.5 },
      group2: { name: '硕士', value: 89.2, percentage: 89.2 },
      difference: 10.7,
      trend: 'up'
    },
    {
      category: '北京 vs 上海',
      group1: { name: '北京', value: 85.3, percentage: 85.3 },
      group2: { name: '上海', value: 82.1, percentage: 82.1 },
      difference: -3.2,
      trend: 'down'
    },
    {
      category: '22-25岁 vs 26-30岁',
      group1: { name: '22-25岁', value: 76.8, percentage: 76.8 },
      group2: { name: '26-30岁', value: 88.9, percentage: 88.9 },
      difference: 12.1,
      trend: 'up'
    }
  ];

  const chartData1 = [
    { name: '本科', value: 78.5 },
    { name: '硕士', value: 89.2 },
    { name: '博士', value: 92.1 }
  ];

  const chartData2 = [
    { name: '北京', value: 85.3 },
    { name: '上海', value: 82.1 },
    { name: '广州', value: 79.8 },
    { name: '深圳', value: 81.5 }
  ];

  const trendData = {
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    data: [
      { name: '本科就业率', data: [75, 76, 77, 78, 78, 79] },
      { name: '硕士就业率', data: [85, 86, 87, 88, 89, 89] }
    ]
  };

  const columns = [
    {
      title: '对比维度',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '组别1',
      key: 'group1',
      render: (record: ComparisonData) => (
        <Space direction="vertical" size="small">
          <Text>{record.group1.name}</Text>
          <Statistic 
            value={record.group1.value} 
            precision={1} 
            suffix="%" 
            valueStyle={{ fontSize: '14px' }}
          />
        </Space>
      )
    },
    {
      title: '组别2',
      key: 'group2',
      render: (record: ComparisonData) => (
        <Space direction="vertical" size="small">
          <Text>{record.group2.name}</Text>
          <Statistic 
            value={record.group2.value} 
            precision={1} 
            suffix="%" 
            valueStyle={{ fontSize: '14px' }}
          />
        </Space>
      )
    },
    {
      title: '差异',
      key: 'difference',
      render: (record: ComparisonData) => (
        <Space>
          <Statistic 
            value={Math.abs(record.difference)} 
            precision={1} 
            suffix="%" 
            valueStyle={{ 
              fontSize: '14px',
              color: record.difference > 0 ? '#52c41a' : '#f5222d'
            }}
            prefix={record.difference > 0 ? '+' : '-'}
          />
          <Tag color={record.trend === 'up' ? 'green' : record.trend === 'down' ? 'red' : 'blue'}>
            {record.trend === 'up' ? '↑' : record.trend === 'down' ? '↓' : '→'}
          </Tag>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            对比分析
          </Space>
        }
        extra={
          <Space>
            <Select
              value={dimension1}
              onChange={setDimension1}
              style={{ width: 100 }}
              size="small"
            >
              {dimensionOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <SwapOutlined />
            <Select
              value={dimension2}
              onChange={setDimension2}
              style={{ width: 100 }}
              size="small"
            >
              {dimensionOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              value={metric}
              onChange={setMetric}
              style={{ width: 120 }}
              size="small"
            >
              {metricOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Space>
        }
      >
        <Table
          dataSource={comparisonData}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="category"
        />
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title={`${dimensionOptions.find(d => d.value === dimension1)?.label}分布`}>
            <BarChart 
              data={chartData1}
              height={250}
              color={['#1890ff', '#52c41a', '#fa8c16']}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={`${dimensionOptions.find(d => d.value === dimension2)?.label}分布`}>
            <BarChart 
              data={chartData2}
              height={250}
              color={['#722ed1', '#13c2c2', '#fa541c', '#eb2f96']}
            />
          </Card>
        </Col>
      </Row>

      <Card title="趋势对比">
        <LineChart
          data={trendData.data}
          xAxisData={trendData.months}
          height={300}
          smooth={true}
        />
      </Card>
    </Space>
  );
};
