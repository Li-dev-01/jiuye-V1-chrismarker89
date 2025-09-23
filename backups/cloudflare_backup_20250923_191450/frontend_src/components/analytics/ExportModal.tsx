import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Checkbox,
  Button,
  Space,
  Typography,
  Divider,
  message,
  List,
  Card
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  PictureOutlined,
  FileOutlined
} from '@ant-design/icons';
import {
  exportToCSV,
  exportToJSON,
  convertChartDataToExport,
  convertTrendDataToExport,
  convertHeatmapDataToExport,
  generateStatisticsReport,
  exportChartAsImage
} from '../../utils/exportUtils';

const { Option } = Select;
const { Text } = Typography;

interface ExportModalProps {
  visible: boolean;
  onCancel: () => void;
  data: any;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onCancel,
  data
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'data' | 'chart' | 'report'>('data');

  const dataExportOptions = [
    { label: '学历分布', value: 'education', data: data?.educationDistribution },
    { label: '薪资期望', value: 'salary', data: data?.salaryExpectation },
    { label: '就业状态', value: 'employment', data: data?.employmentStatus },
    { label: '地区分布', value: 'region', data: data?.regionDistribution },
    { label: '年龄分布', value: 'age', data: data?.ageDistribution },
    { label: '月度趋势', value: 'trend', data: data?.monthlyTrend },
    { label: '技能热力图', value: 'skills', data: data?.skillsHeatmap }
  ];

  const formatOptions = [
    { label: 'CSV 格式', value: 'csv', icon: <FileExcelOutlined /> },
    { label: 'JSON 格式', value: 'json', icon: <FileTextOutlined /> }
  ];

  const chartExportOptions = [
    { label: '学历分布图', value: 'education-chart' },
    { label: '薪资期望图', value: 'salary-chart' },
    { label: '就业状态图', value: 'employment-chart' },
    { label: '地区分布图', value: 'region-chart' },
    { label: '月度趋势图', value: 'trend-chart' },
    { label: '技能热力图', value: 'skills-chart' }
  ];

  const handleExport = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (exportType === 'data') {
        await handleDataExport(values);
      } else if (exportType === 'chart') {
        await handleChartExport(values);
      } else if (exportType === 'report') {
        await handleReportExport(values);
      }
      
      message.success('导出成功！');
      onCancel();
    } catch (error) {
      message.error('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async (values: any) => {
    const { selectedData, format } = values;
    
    for (const dataKey of selectedData) {
      const option = dataExportOptions.find(opt => opt.value === dataKey);
      if (!option || !option.data) continue;
      
      let exportData;
      
      switch (dataKey) {
        case 'trend':
          exportData = convertTrendDataToExport(option.data, option.label);
          break;
        case 'skills':
          exportData = convertHeatmapDataToExport(option.data, option.label);
          break;
        default:
          exportData = convertChartDataToExport(option.data, option.label);
          break;
      }
      
      if (format === 'csv') {
        exportToCSV(exportData);
      } else if (format === 'json') {
        exportToJSON(option.data, `${option.label}.json`);
      }
    }
  };

  const handleChartExport = async (values: any) => {
    const { selectedCharts } = values;
    
    for (const chartKey of selectedCharts) {
      // 查找对应的图表元素
      const chartElement = document.querySelector(`[data-chart="${chartKey}"]`) as HTMLElement;
      if (chartElement) {
        const chartName = chartExportOptions.find(opt => opt.value === chartKey)?.label || 'chart';
        await exportChartAsImage(chartElement, `${chartName}.png`);
      }
    }
  };

  const handleReportExport = async (values: any) => {
    const { reportFormat } = values;
    
    if (reportFormat === 'csv') {
      const reportData = generateStatisticsReport(data);
      exportToCSV(reportData);
    } else if (reportFormat === 'json') {
      exportToJSON(data, '完整统计报告.json');
    }
  };

  return (
    <Modal
      title="数据导出"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
        >
          导出
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="导出类型">
          <Select value={exportType} onChange={setExportType}>
            <Option value="data">
              <Space>
                <FileExcelOutlined />
                数据导出
              </Space>
            </Option>
            <Option value="chart">
              <Space>
                <PictureOutlined />
                图表导出
              </Space>
            </Option>
            <Option value="report">
              <Space>
                <FileOutlined />
                完整报告
              </Space>
            </Option>
          </Select>
        </Form.Item>

        {exportType === 'data' && (
          <>
            <Form.Item
              name="selectedData"
              label="选择数据"
              rules={[{ required: true, message: '请选择要导出的数据' }]}
            >
              <Checkbox.Group>
                <List
                  size="small"
                  dataSource={dataExportOptions}
                  renderItem={option => (
                    <List.Item>
                      <Checkbox value={option.value}>
                        {option.label} ({option.data?.length || 0} 项)
                      </Checkbox>
                    </List.Item>
                  )}
                />
              </Checkbox.Group>
            </Form.Item>

            <Form.Item
              name="format"
              label="导出格式"
              initialValue="csv"
              rules={[{ required: true, message: '请选择导出格式' }]}
            >
              <Select>
                {formatOptions.map(format => (
                  <Option key={format.value} value={format.value}>
                    <Space>
                      {format.icon}
                      {format.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        {exportType === 'chart' && (
          <Form.Item
            name="selectedCharts"
            label="选择图表"
            rules={[{ required: true, message: '请选择要导出的图表' }]}
          >
            <Checkbox.Group>
              <List
                size="small"
                dataSource={chartExportOptions}
                renderItem={option => (
                  <List.Item>
                    <Checkbox value={option.value}>
                      {option.label}
                    </Checkbox>
                  </List.Item>
                )}
              />
            </Checkbox.Group>
          </Form.Item>
        )}

        {exportType === 'report' && (
          <>
            <Card size="small">
              <Text type="secondary">
                完整报告将包含所有统计数据，包括总体概况、各维度分布、趋势分析等。
              </Text>
            </Card>
            <Divider />
            <Form.Item
              name="reportFormat"
              label="报告格式"
              initialValue="csv"
              rules={[{ required: true, message: '请选择报告格式' }]}
            >
              <Select>
                {formatOptions.map(format => (
                  <Option key={format.value} value={format.value}>
                    <Space>
                      {format.icon}
                      {format.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};
