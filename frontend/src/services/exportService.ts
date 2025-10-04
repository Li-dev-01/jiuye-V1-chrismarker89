/**
 * 数据导出服务
 * 支持PDF、Excel、图片等格式的导出功能
 */

import type { HybridVisualizationData, UniversalDimensionData } from '../types/hybridVisualization';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'png' | 'json';
  includeCharts: boolean;
  includeInsights: boolean;
  selectedDimensions?: string[];
  customTitle?: string;
}

export interface ShareOptions {
  platform: 'email' | 'wechat' | 'link' | 'qr';
  message?: string;
  recipients?: string[];
}

export class ExportService {
  /**
   * 导出混合可视化数据
   */
  async exportData(data: HybridVisualizationData, options: ExportOptions): Promise<Blob | string> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'excel':
        return this.exportToExcel(data, options);
      case 'png':
        return this.exportToPNG(data, options);
      case 'json':
        return this.exportToJSON(data, options);
      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  }

  /**
   * 导出为PDF
   */
  private async exportToPDF(data: HybridVisualizationData, options: ExportOptions): Promise<Blob> {
    // 模拟PDF生成
    const reportContent = this.generateReportContent(data, options);
    
    // 这里应该使用真实的PDF生成库，如jsPDF
    const pdfContent = `
      问卷2数据可视化报告
      ==================
      
      生成时间: ${new Date().toLocaleString()}
      数据源: ${data.metadata.dataSource}
      总响应数: ${data.totalResponses}
      完成率: ${data.completionRate}%
      
      ${reportContent}
    `;
    
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  /**
   * 导出为Excel
   */
  private async exportToExcel(data: HybridVisualizationData, options: ExportOptions): Promise<Blob> {
    // 准备Excel数据
    const excelData = this.prepareExcelData(data, options);
    
    // 模拟Excel生成
    const csvContent = this.convertToCSV(excelData);
    
    return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  }

  /**
   * 导出为PNG图片
   */
  private async exportToPNG(data: HybridVisualizationData, options: ExportOptions): Promise<Blob> {
    // 这里应该使用html2canvas等库来截图
    // 模拟图片生成
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#000000';
      ctx.font = '24px Arial';
      ctx.fillText('问卷2数据可视化报告', 50, 50);
      
      ctx.font = '16px Arial';
      ctx.fillText(`总响应数: ${data.totalResponses}`, 50, 100);
      ctx.fillText(`完成率: ${data.completionRate}%`, 50, 130);
    }
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
  }

  /**
   * 导出为JSON
   */
  private async exportToJSON(data: HybridVisualizationData, options: ExportOptions): Promise<string> {
    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        format: 'json',
        options,
        source: data.metadata
      },
      summary: {
        questionnaireId: data.questionnaireId,
        title: data.title,
        totalResponses: data.totalResponses,
        completionRate: data.completionRate,
        lastUpdated: data.lastUpdated
      },
      tabs: data.tabs.map(tab => ({
        key: tab.key,
        label: tab.label,
        description: tab.description,
        dimensions: tab.dimensions.filter(dim => 
          !options.selectedDimensions || 
          options.selectedDimensions.includes(dim.dimensionId)
        ).map(dim => ({
          dimensionId: dim.dimensionId,
          dimensionTitle: dim.dimensionTitle,
          description: dim.description,
          totalResponses: dim.totalResponses,
          completionRate: dim.completionRate,
          insights: options.includeInsights ? dim.insights : undefined,
          charts: options.includeCharts ? dim.charts : undefined
        }))
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 分享数据
   */
  async shareData(data: HybridVisualizationData, options: ShareOptions): Promise<boolean> {
    switch (options.platform) {
      case 'email':
        return this.shareViaEmail(data, options);
      case 'wechat':
        return this.shareViaWeChat(data, options);
      case 'link':
        return this.shareViaLink(data, options);
      case 'qr':
        return this.shareViaQR(data, options);
      default:
        throw new Error(`不支持的分享平台: ${options.platform}`);
    }
  }

  /**
   * 邮件分享
   */
  private async shareViaEmail(data: HybridVisualizationData, options: ShareOptions): Promise<boolean> {
    const subject = `问卷2数据可视化报告 - ${data.title}`;
    const body = `
      您好，
      
      这是问卷2的数据可视化分析报告：
      
      • 总响应数: ${data.totalResponses}
      • 完成率: ${data.completionRate}%
      • 生成时间: ${new Date().toLocaleString()}
      
      ${options.message || ''}
      
      详细报告请查看附件。
    `;

    const mailtoLink = `mailto:${options.recipients?.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    return true;
  }

  /**
   * 微信分享
   */
  private async shareViaWeChat(data: HybridVisualizationData, options: ShareOptions): Promise<boolean> {
    // 模拟微信分享
    const shareText = `问卷2数据分析报告：总响应${data.totalResponses}人，完成率${data.completionRate}%`;
    
    // 这里应该调用微信SDK
    console.log('微信分享:', shareText);
    
    return true;
  }

  /**
   * 链接分享
   */
  private async shareViaLink(data: HybridVisualizationData, options: ShareOptions): Promise<boolean> {
    const shareUrl = `${window.location.origin}/shared-report/${data.questionnaireId}`;
    
    if (navigator.share) {
      await navigator.share({
        title: data.title,
        text: options.message || '问卷2数据可视化报告',
        url: shareUrl
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      // 显示复制成功提示
    }
    
    return true;
  }

  /**
   * 二维码分享
   */
  private async shareViaQR(data: HybridVisualizationData, options: ShareOptions): Promise<boolean> {
    const shareUrl = `${window.location.origin}/shared-report/${data.questionnaireId}`;
    
    // 这里应该生成二维码
    console.log('生成二维码:', shareUrl);
    
    return true;
  }

  /**
   * 生成报告内容
   */
  private generateReportContent(data: HybridVisualizationData, options: ExportOptions): string {
    let content = '';
    
    data.tabs.forEach(tab => {
      content += `\n${tab.label}\n${'='.repeat(tab.label.length)}\n`;
      content += `${tab.description}\n\n`;
      
      tab.dimensions.forEach(dimension => {
        if (options.selectedDimensions && !options.selectedDimensions.includes(dimension.dimensionId)) {
          return;
        }
        
        content += `${dimension.dimensionTitle}\n`;
        content += `${'-'.repeat(dimension.dimensionTitle.length)}\n`;
        content += `${dimension.description}\n`;
        content += `响应数: ${dimension.totalResponses}, 完成率: ${dimension.completionRate}%\n\n`;
        
        if (options.includeInsights && dimension.insights) {
          content += '关键洞察:\n';
          dimension.insights.forEach(insight => {
            content += `• ${insight}\n`;
          });
          content += '\n';
        }
        
        if (options.includeCharts && dimension.charts) {
          content += '图表数据:\n';
          dimension.charts.forEach(chart => {
            content += `${chart.questionTitle} (${chart.chartType})\n`;
            chart.data.forEach(item => {
              content += `  ${item.label || item.name}: ${item.value} (${item.percentage?.toFixed(1)}%)\n`;
            });
            content += '\n';
          });
        }
      });
    });
    
    return content;
  }

  /**
   * 准备Excel数据
   */
  private prepareExcelData(data: HybridVisualizationData, options: ExportOptions): any[] {
    const excelData: any[] = [];
    
    // 添加汇总信息
    excelData.push(['问卷2数据可视化报告']);
    excelData.push(['生成时间', new Date().toLocaleString()]);
    excelData.push(['总响应数', data.totalResponses]);
    excelData.push(['完成率', `${data.completionRate}%`]);
    excelData.push([]);
    
    // 添加各维度数据
    data.tabs.forEach(tab => {
      excelData.push([tab.label]);
      excelData.push(['维度', '描述', '响应数', '完成率', '图表数']);
      
      tab.dimensions.forEach(dimension => {
        if (options.selectedDimensions && !options.selectedDimensions.includes(dimension.dimensionId)) {
          return;
        }
        
        excelData.push([
          dimension.dimensionTitle,
          dimension.description,
          dimension.totalResponses,
          `${dimension.completionRate}%`,
          dimension.charts.length
        ]);
      });
      
      excelData.push([]);
    });
    
    return excelData;
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(data: any[]): string {
    return data.map(row => 
      Array.isArray(row) 
        ? row.map(cell => `"${cell}"`).join(',')
        : `"${row}"`
    ).join('\n');
  }
}

// 导出单例
export const exportService = new ExportService();
