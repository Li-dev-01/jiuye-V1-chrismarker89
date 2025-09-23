// 数据导出工具函数

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
}

/**
 * 导出数据为 CSV 格式
 */
export const exportToCSV = (data: ExportData) => {
  const { headers, rows, filename = 'data.csv' } = data;
  
  // 创建 CSV 内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // 创建 Blob 对象
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 导出数据为 JSON 格式
 */
export const exportToJSON = (data: any, filename: string = 'data.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 将图表数据转换为导出格式
 */
export const convertChartDataToExport = (
  chartData: Array<{ name: string; value: number }>,
  title: string
): ExportData => {
  return {
    headers: ['项目', '数值'],
    rows: chartData.map(item => [item.name, item.value]),
    filename: `${title}.csv`
  };
};

/**
 * 将趋势数据转换为导出格式
 */
export const convertTrendDataToExport = (
  trendData: {
    months: string[];
    responses: number[];
    completions: number[];
  },
  title: string
): ExportData => {
  return {
    headers: ['月份', '问卷回答数', '完成数'],
    rows: trendData.months.map((month, index) => [
      month,
      trendData.responses[index] || 0,
      trendData.completions[index] || 0
    ]),
    filename: `${title}.csv`
  };
};

/**
 * 将热力图数据转换为导出格式
 */
export const convertHeatmapDataToExport = (
  heatmapData: {
    skills: string[];
    levels: string[];
    data: Array<{ x: number; y: number; value: number }>;
  },
  title: string
): ExportData => {
  const headers = ['技能', '水平', '数值'];
  const rows = heatmapData.data.map(item => [
    heatmapData.skills[item.x],
    heatmapData.levels[item.y],
    item.value
  ]);
  
  return {
    headers,
    rows,
    filename: `${title}.csv`
  };
};

/**
 * 导出图表为图片（使用 Canvas API）
 */
export const exportChartAsImage = async (chartElement: HTMLElement, filename: string = 'chart.png') => {
  try {
    // 查找图表中的 canvas 元素
    const canvas = chartElement.querySelector('canvas');
    if (!canvas) {
      throw new Error('未找到图表 canvas 元素');
    }
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('导出图表失败:', error);
    throw error;
  }
};

/**
 * 生成统计报告数据
 */
export const generateStatisticsReport = (data: any): ExportData => {
  const reportData = [
    ['统计项目', '数值', '单位'],
    ['总回答数', data.totalResponses, '份'],
    ['完成率', data.completionRate, '%'],
    ['平均用时', data.averageTime, '分钟'],
    ['', '', ''],
    ['学历分布', '', ''],
    ...data.educationDistribution.map((item: any) => [item.name, item.value, '人']),
    ['', '', ''],
    ['薪资期望分布', '', ''],
    ...data.salaryExpectation.map((item: any) => [item.name, item.value, '人']),
    ['', '', ''],
    ['就业状态分布', '', ''],
    ...data.employmentStatus.map((item: any) => [item.name, item.value, '人']),
    ['', '', ''],
    ['地区分布', '', ''],
    ...data.regionDistribution.map((item: any) => [item.name, item.value, '人'])
  ];
  
  return {
    headers: ['统计项目', '数值', '单位'],
    rows: reportData.slice(1),
    filename: '统计报告.csv'
  };
};
