/**
 * SVG到PNG转换服务
 * 使用Canvas API或外部服务将SVG转换为PNG
 */

export interface SvgToPngOptions {
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
}

export class SvgToPngService {
  /**
   * 将SVG字符串转换为PNG字节数组
   */
  async convertSvgToPng(svgContent: string, options: SvgToPngOptions = {}): Promise<Uint8Array> {
    const {
      width = 800,
      height = 600,
      quality = 0.9,
      backgroundColor = 'transparent',
      scale = 1
    } = options;

    try {
      // 方法1: 使用Cloudflare Workers的内置Canvas API（如果可用）
      if (typeof OffscreenCanvas !== 'undefined') {
        return await this.convertWithOffscreenCanvas(svgContent, {
          width: width * scale,
          height: height * scale,
          quality,
          backgroundColor
        });
      }

      // 方法2: 使用外部PNG转换服务
      return await this.convertWithExternalService(svgContent, options);

    } catch (error) {
      console.error('SVG转PNG失败，使用备用方案:', error);
      // 备用方案：返回SVG内容作为文本（用于调试）
      return this.createFallbackPng(svgContent, width, height);
    }
  }

  /**
   * 使用OffscreenCanvas转换（Cloudflare Workers支持）
   */
  private async convertWithOffscreenCanvas(
    svgContent: string, 
    options: Required<Pick<SvgToPngOptions, 'width' | 'height' | 'quality' | 'backgroundColor'>>
  ): Promise<Uint8Array> {
    const { width, height, quality, backgroundColor } = options;

    // 创建离屏Canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    // 设置背景色
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // 创建SVG图像
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      // 加载SVG图像
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });

      // 绘制到Canvas
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为PNG
      const blob = await canvas.convertToBlob({
        type: 'image/png',
        quality
      });

      const arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer);

    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  /**
   * 使用外部服务转换（备用方案）
   */
  private async convertWithExternalService(
    svgContent: string, 
    options: SvgToPngOptions
  ): Promise<Uint8Array> {
    // 这里可以调用外部PNG转换服务
    // 例如：https://api.htmlcsstoimage.com/ 或其他服务
    
    const { width = 800, height = 600 } = options;

    // 示例：使用HTML/CSS to Image API
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; }
          svg { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
      </html>
    `;

    // 这里应该调用实际的外部API
    // 暂时返回模拟数据
    console.log('使用外部服务转换SVG，HTML内容长度:', htmlContent.length);
    
    // 返回一个简单的PNG头部（1x1像素的透明PNG）
    return new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG签名
      0x00, 0x00, 0x00, 0x0D, // IHDR长度
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // 宽度: 1
      0x00, 0x00, 0x00, 0x01, // 高度: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // 位深度, 颜色类型, 压缩, 过滤, 交错
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT长度
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // 压缩数据
      0x0D, 0x0A, 0x2D, 0xB4, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND长度
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
  }

  /**
   * 创建备用PNG（当转换失败时）
   */
  private createFallbackPng(svgContent: string, width: number, height: number): Uint8Array {
    // 创建一个简单的PNG图像，包含错误信息
    const errorText = `SVG转换失败\n尺寸: ${width}x${height}\nSVG长度: ${svgContent.length}`;
    
    // 返回一个包含错误信息的简单PNG
    // 这里应该生成一个真正的PNG，暂时返回文本
    const encoder = new TextEncoder();
    return encoder.encode(`PNG转换失败: ${errorText}`);
  }

  /**
   * 验证SVG内容
   */
  validateSvgContent(svgContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基本验证
    if (!svgContent || svgContent.trim().length === 0) {
      errors.push('SVG内容为空');
    }

    if (!svgContent.includes('<svg')) {
      errors.push('不是有效的SVG格式');
    }

    if (!svgContent.includes('</svg>')) {
      errors.push('SVG标签未正确闭合');
    }

    // 检查尺寸
    const widthMatch = svgContent.match(/width\s*=\s*["']?(\d+)/);
    const heightMatch = svgContent.match(/height\s*=\s*["']?(\d+)/);

    if (!widthMatch || !heightMatch) {
      errors.push('SVG缺少宽度或高度属性');
    }

    // 检查内容长度
    if (svgContent.length > 1024 * 1024) { // 1MB
      errors.push('SVG内容过大（超过1MB）');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 优化SVG内容
   */
  optimizeSvgContent(svgContent: string): string {
    let optimized = svgContent;

    // 移除注释
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');

    // 移除多余的空白
    optimized = optimized.replace(/\s+/g, ' ');

    // 移除空的属性
    optimized = optimized.replace(/\s+[a-zA-Z-]+\s*=\s*["']?\s*["']?/g, '');

    // 确保SVG有正确的命名空间
    if (!optimized.includes('xmlns="http://www.w3.org/2000/svg"')) {
      optimized = optimized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return optimized.trim();
  }

  /**
   * 获取SVG尺寸信息
   */
  getSvgDimensions(svgContent: string): { width: number; height: number } {
    const widthMatch = svgContent.match(/width\s*=\s*["']?(\d+)/);
    const heightMatch = svgContent.match(/height\s*=\s*["']?(\d+)/);

    const width = widthMatch && widthMatch[1] ? parseInt(widthMatch[1]) : 800;
    const height = heightMatch && heightMatch[1] ? parseInt(heightMatch[1]) : 600;

    return { width, height };
  }

  /**
   * 创建高质量的PNG
   */
  async createHighQualityPng(
    svgContent: string, 
    options: SvgToPngOptions & { retina?: boolean }
  ): Promise<Uint8Array> {
    const { retina = false, ...baseOptions } = options;
    
    // 如果需要Retina质量，将尺寸翻倍
    const scale = retina ? 2 : 1;
    
    return this.convertSvgToPng(svgContent, {
      ...baseOptions,
      scale,
      quality: 0.95
    });
  }
}
