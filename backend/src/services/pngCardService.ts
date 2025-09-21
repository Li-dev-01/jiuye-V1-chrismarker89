/**
 * PNG卡片生成服务
 * 将心声内容生成为精美的PNG卡片
 */

import { R2StorageService } from './r2StorageService';
import { SvgToPngService } from './svgToPngService';
import type { Env } from '../types/api';
import type { HeartVoiceData } from './heartVoiceService';

export interface PNGCardOptions {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark' | 'gradient' | 'minimal';
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  includeQR?: boolean;
  watermark?: string;
}

export interface PNGCardResult {
  success: boolean;
  cardId?: string;
  downloadUrl?: string;
  r2Key?: string;
  error?: string | undefined;
}

export class PNGCardService {
  private r2Service: R2StorageService;
  private svgToPngService: SvgToPngService;

  constructor(env: Env) {
    this.r2Service = new R2StorageService(env);
    this.svgToPngService = new SvgToPngService();
  }

  /**
   * 为心声生成PNG卡片
   */
  async generateHeartVoiceCard(
    heartVoice: HeartVoiceData,
    options: PNGCardOptions = {}
  ): Promise<PNGCardResult> {
    try {
      const cardId = `heart-voice-${heartVoice.id}-${Date.now()}`;
      
      // 设置默认选项
      const cardOptions: Required<PNGCardOptions> = {
        width: options.width || 800,
        height: options.height || 600,
        theme: options.theme || 'gradient',
        backgroundColor: options.backgroundColor || '#ffffff',
        textColor: options.textColor || '#333333',
        fontSize: options.fontSize || 18,
        fontFamily: options.fontFamily || 'Arial, sans-serif',
        includeQR: options.includeQR !== false,
        watermark: options.watermark || '就业问卷调查'
      };

      // 生成SVG内容
      const svgContent = this.generateSVGCard(heartVoice, cardOptions);

      // 验证SVG内容
      const validation = this.svgToPngService.validateSvgContent(svgContent);
      if (!validation.isValid) {
        console.warn('SVG验证失败:', validation.errors);
      }

      // 优化SVG内容
      const optimizedSvg = this.svgToPngService.optimizeSvgContent(svgContent);

      // 将SVG转换为PNG
      const pngBuffer = await this.svgToPngService.convertSvgToPng(optimizedSvg, {
        width: cardOptions.width,
        height: cardOptions.height,
        quality: 0.9,
        backgroundColor: cardOptions.backgroundColor
      });
      
      // 上传到R2
      const r2Key = `png-cards/${cardId}.png`;
      const uploadResult = await this.r2Service.uploadFile(r2Key, pngBuffer, {
        filename: `heart-voice-card-${heartVoice.id}.png`,
        contentType: 'image/png',
        category: 'png-card',
        relatedId: heartVoice.id?.toString() || undefined,
        userId: heartVoice.userId || undefined
      });

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      return {
        success: true,
        cardId,
        downloadUrl: uploadResult.url,
        r2Key
      };
    } catch (error) {
      console.error('PNG卡片生成失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败'
      };
    }
  }

  /**
   * 生成SVG卡片内容
   */
  private generateSVGCard(heartVoice: HeartVoiceData, options: Required<PNGCardOptions>): string {
    const { width, height, theme, backgroundColor, textColor, fontSize, fontFamily, watermark } = options;
    
    // 处理文本内容，确保适合卡片显示
    const content = this.formatTextForCard(heartVoice.content, width - 100);
    const nickname = heartVoice.anonymousNickname || '匿名用户';
    const date = new Date(heartVoice.createdAt || Date.now()).toLocaleDateString('zh-CN');
    
    // 根据主题选择样式
    const themeStyles = this.getThemeStyles(theme);
    
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${themeStyles.gradients}
          <style>
            .card-bg { fill: ${themeStyles.background}; }
            .main-text { 
              font-family: ${fontFamily}; 
              font-size: ${fontSize}px; 
              fill: ${themeStyles.textColor}; 
              line-height: 1.6;
            }
            .meta-text { 
              font-family: ${fontFamily}; 
              font-size: ${fontSize * 0.8}px; 
              fill: ${themeStyles.metaColor}; 
            }
            .watermark { 
              font-family: ${fontFamily}; 
              font-size: ${fontSize * 0.7}px; 
              fill: ${themeStyles.watermarkColor}; 
              opacity: 0.6;
            }
            .quote-mark {
              font-family: serif;
              font-size: ${fontSize * 2}px;
              fill: ${themeStyles.accentColor};
              opacity: 0.3;
            }
          </style>
        </defs>
        
        <!-- 背景 -->
        <rect width="100%" height="100%" class="card-bg" rx="20"/>
        
        <!-- 装饰性引号 -->
        <text x="50" y="80" class="quote-mark">"</text>
        
        <!-- 主要内容 -->
        <foreignObject x="50" y="100" width="${width - 100}" height="${height - 200}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            font-family: ${fontFamily};
            font-size: ${fontSize}px;
            color: ${themeStyles.textColor};
            line-height: 1.6;
            padding: 20px;
            word-wrap: break-word;
          ">
            ${content}
          </div>
        </foreignObject>
        
        <!-- 底部信息 -->
        <text x="50" y="${height - 80}" class="meta-text">—— ${nickname}</text>
        <text x="50" y="${height - 50}" class="meta-text">${date}</text>
        
        <!-- 水印 -->
        <text x="${width - 150}" y="${height - 30}" class="watermark">${watermark}</text>
        
        <!-- 装饰元素 -->
        ${themeStyles.decorations}
      </svg>
    `;

    return svgContent;
  }

  /**
   * 获取主题样式
   */
  private getThemeStyles(theme: string) {
    const themes = {
      light: {
        background: '#ffffff',
        textColor: '#333333',
        metaColor: '#666666',
        watermarkColor: '#999999',
        accentColor: '#1890ff',
        gradients: '',
        decorations: ''
      },
      dark: {
        background: '#1a1a1a',
        textColor: '#ffffff',
        metaColor: '#cccccc',
        watermarkColor: '#666666',
        accentColor: '#40a9ff',
        gradients: '',
        decorations: ''
      },
      gradient: {
        background: 'url(#grad1)',
        textColor: '#ffffff',
        metaColor: '#f0f0f0',
        watermarkColor: '#e0e0e0',
        accentColor: '#ffd700',
        gradients: `
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        `,
        decorations: `
          <circle cx="700" cy="100" r="50" fill="rgba(255,255,255,0.1)"/>
          <circle cx="100" cy="500" r="30" fill="rgba(255,255,255,0.1)"/>
        `
      },
      minimal: {
        background: '#f8f9fa',
        textColor: '#2c3e50',
        metaColor: '#7f8c8d',
        watermarkColor: '#bdc3c7',
        accentColor: '#e74c3c',
        gradients: '',
        decorations: `
          <line x1="50" y1="90" x2="750" y2="90" stroke="#e74c3c" stroke-width="3"/>
        `
      }
    };

    return themes[theme as keyof typeof themes] || themes.gradient;
  }

  /**
   * 格式化文本以适合卡片显示
   */
  private formatTextForCard(text: string, maxWidth: number): string {
    // 简单的文本处理，实际可能需要更复杂的换行逻辑
    const maxCharsPerLine = Math.floor(maxWidth / 16); // 估算每行字符数
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      if (currentLine.length >= maxCharsPerLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine += char;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // 限制最大行数
    const maxLines = 8;
    if (lines.length > maxLines) {
      lines.splice(maxLines - 1);
      lines[maxLines - 1] += '...';
    }

    return lines.join('<br/>');
  }

  /**
   * 生成高质量PNG卡片
   */
  async generateHighQualityCard(
    heartVoice: HeartVoiceData,
    options: PNGCardOptions & { retina?: boolean } = {}
  ): Promise<PNGCardResult> {
    try {
      const cardId = `heart-voice-hq-${heartVoice.id}-${Date.now()}`;

      // 设置高质量选项
      const cardOptions: Required<PNGCardOptions> = {
        width: options.width || 1200, // 更高分辨率
        height: options.height || 900,
        theme: options.theme || 'gradient',
        backgroundColor: options.backgroundColor || '#ffffff',
        textColor: options.textColor || '#333333',
        fontSize: options.fontSize || 24, // 更大字体
        fontFamily: options.fontFamily || 'Arial, sans-serif',
        includeQR: options.includeQR !== false,
        watermark: options.watermark || '就业问卷调查'
      };

      // 生成SVG内容
      const svgContent = this.generateSVGCard(heartVoice, cardOptions);

      // 生成高质量PNG
      const pngBuffer = await this.svgToPngService.createHighQualityPng(svgContent, {
        width: cardOptions.width,
        height: cardOptions.height,
        quality: 0.95,
        retina: options.retina || false
      });

      // 上传到R2
      const r2Key = `png-cards/hq/${cardId}.png`;
      const uploadResult = await this.r2Service.uploadFile(r2Key, pngBuffer, {
        filename: `heart-voice-hq-card-${heartVoice.id}.png`,
        contentType: 'image/png',
        category: 'png-card',
        relatedId: heartVoice.id?.toString() || undefined,
        userId: heartVoice.userId || undefined
      });

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      return {
        success: true,
        cardId,
        downloadUrl: uploadResult.url,
        r2Key
      };
    } catch (error) {
      console.error('高质量PNG卡片生成失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败'
      };
    }
  }

  /**
   * 获取卡片下载链接
   */
  async getCardDownloadUrl(cardId: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      const r2Key = `png-cards/${cardId}.png`;
      const url = this.r2Service.generateDownloadUrl(r2Key);
      
      return {
        success: true,
        url
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取下载链接失败'
      };
    }
  }

  /**
   * 删除PNG卡片
   */
  async deleteCard(cardId: string): Promise<{ success: boolean; error?: string }> {
    const r2Key = `png-cards/${cardId}.png`;
    return this.r2Service.deleteFile(r2Key);
  }
}
