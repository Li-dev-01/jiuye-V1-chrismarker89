/**
 * Cloudflare R2存储服务
 * 处理文件上传、下载、删除等操作
 */

import type { Env } from '../types/api';

export interface R2FileMetadata {
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  category: 'backup' | 'png-card' | 'export' | 'temp';
  relatedId?: string | undefined; // 关联的问卷ID或心声ID
  userId?: string | undefined;
}

export interface R2UploadResult {
  success: boolean;
  key: string;
  url: string;
  metadata: R2FileMetadata;
  error?: string;
}

export class R2StorageService {
  private bucket: R2Bucket;
  private bucketName: string;

  constructor(env: Env) {
    this.bucket = env.R2_BUCKET! as any; // R2存储桶绑定，使用类型断言解决版本兼容性问题
    this.bucketName = env.R2_BUCKET_NAME || 'employment-survey-storage';
  }

  /**
   * 上传文件到R2
   */
  async uploadFile(
    key: string,
    content: ArrayBuffer | Uint8Array | string,
    metadata: Partial<R2FileMetadata>
  ): Promise<R2UploadResult> {
    try {
      const fullMetadata: R2FileMetadata = {
        filename: metadata.filename || key,
        contentType: metadata.contentType || 'application/octet-stream',
        size: content instanceof ArrayBuffer ? content.byteLength : 
              content instanceof Uint8Array ? content.length : 
              new TextEncoder().encode(content).length,
        uploadedAt: new Date().toISOString(),
        category: metadata.category || 'temp',
        relatedId: metadata.relatedId,
        userId: metadata.userId
      };

      await this.bucket.put(key, content, {
        httpMetadata: {
          contentType: fullMetadata.contentType,
          cacheControl: 'public, max-age=31536000', // 1年缓存
        },
        customMetadata: {
          filename: fullMetadata.filename,
          category: fullMetadata.category,
          uploadedAt: fullMetadata.uploadedAt,
          relatedId: fullMetadata.relatedId || '',
          userId: fullMetadata.userId || ''
        }
      });

      const url = `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;

      console.log(`✅ R2文件上传成功: ${key}, 大小: ${fullMetadata.size} bytes`);

      return {
        success: true,
        key,
        url,
        metadata: fullMetadata
      };
    } catch (error) {
      console.error('R2文件上传失败:', error);
      return {
        success: false,
        key,
        url: '',
        metadata: {} as R2FileMetadata,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 上传PNG文件到R2（专用方法）
   */
  async uploadPngFile(
    pngBuffer: Uint8Array,
    contentType: 'heart_voice' | 'story',
    contentId: number,
    theme: string,
    metadata?: {
      generationTime?: number;
      quality?: number;
      userId?: string;
    }
  ): Promise<R2UploadResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `png-cards/${contentType}/${contentId}/${theme}-${timestamp}.png`;

    const filename = `${contentType}-${contentId}-${theme}.png`;

    return this.uploadFile(key, pngBuffer, {
      filename,
      contentType: 'image/png',
      category: 'png-card',
      relatedId: contentId.toString(),
      userId: metadata?.userId
    });
  }

  /**
   * 批量上传PNG文件
   */
  async batchUploadPngFiles(
    uploads: Array<{
      pngBuffer: Uint8Array;
      contentType: 'heart_voice' | 'story';
      contentId: number;
      theme: string;
      metadata?: any;
    }>
  ): Promise<{
    successful: R2UploadResult[];
    failed: Array<{ upload: any; error: string }>;
    totalUploaded: number;
    totalFailed: number;
  }> {
    const successful: R2UploadResult[] = [];
    const failed: Array<{ upload: any; error: string }> = [];

    console.log(`🔄 开始批量上传 ${uploads.length} 个PNG文件到R2...`);

    for (const upload of uploads) {
      try {
        const result = await this.uploadPngFile(
          upload.pngBuffer,
          upload.contentType,
          upload.contentId,
          upload.theme,
          upload.metadata
        );

        if (result.success) {
          successful.push(result);
        } else {
          failed.push({ upload, error: result.error || '上传失败' });
        }
      } catch (error) {
        failed.push({
          upload,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    console.log(`✅ 批量上传完成: 成功${successful.length}, 失败${failed.length}`);

    return {
      successful,
      failed,
      totalUploaded: successful.length,
      totalFailed: failed.length
    };
  }

  /**
   * 从R2下载文件
   */
  async downloadFile(key: string): Promise<{
    success: boolean;
    content?: ArrayBuffer;
    metadata?: R2FileMetadata;
    error?: string;
  }> {
    try {
      const object = await this.bucket.get(key);
      
      if (!object) {
        return {
          success: false,
          error: '文件不存在'
        };
      }

      const content = await object.arrayBuffer();
      const metadata: R2FileMetadata = {
        filename: object.customMetadata?.filename || key,
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
        size: object.size,
        uploadedAt: object.customMetadata?.uploadedAt || '',
        category: (object.customMetadata?.category as any) || 'temp',
        relatedId: object.customMetadata?.relatedId,
        userId: object.customMetadata?.userId
      };

      return {
        success: true,
        content,
        metadata
      };
    } catch (error) {
      console.error('R2文件下载失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '下载失败'
      };
    }
  }

  /**
   * 删除R2文件
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.bucket.delete(key);
      return { success: true };
    } catch (error) {
      console.error('R2文件删除失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      };
    }
  }

  /**
   * 列出文件
   */
  async listFiles(prefix?: string, limit: number = 100): Promise<{
    success: boolean;
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      metadata?: R2FileMetadata;
    }>;
    error?: string;
  }> {
    try {
      const options: R2ListOptions = {
        limit
      };

      if (prefix) {
        options.prefix = prefix;
      }

      const result = await this.bucket.list(options);
      
      const files = result.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        lastModified: obj.uploaded,
        metadata: {
          filename: obj.customMetadata?.filename || obj.key,
          contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
          size: obj.size,
          uploadedAt: obj.customMetadata?.uploadedAt || obj.uploaded.toISOString(),
          category: (obj.customMetadata?.category as any) || 'temp',
          relatedId: obj.customMetadata?.relatedId,
          userId: obj.customMetadata?.userId
        }
      }));

      return {
        success: true,
        files
      };
    } catch (error) {
      console.error('R2文件列表获取失败:', error);
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : '获取列表失败'
      };
    }
  }

  /**
   * 生成预签名URL（用于直接下载）
   */
  generateDownloadUrl(key: string, expiresIn: number = 3600): string {
    // R2的预签名URL生成（简化版本）
    // 在实际环境中，这里应该使用R2的预签名URL API
    return `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  /**
   * 备份数据到R2
   */
  async backupData(
    data: any,
    backupType: 'questionnaire' | 'heart-voice' | 'full',
    timestamp?: string
  ): Promise<R2UploadResult> {
    const backupTimestamp = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/${backupType}/${backupTimestamp}.json`;
    
    const backupContent = JSON.stringify({
      type: backupType,
      timestamp: backupTimestamp,
      data,
      version: '1.0'
    }, null, 2);

    return this.uploadFile(key, backupContent, {
      filename: `${backupType}-backup-${backupTimestamp}.json`,
      contentType: 'application/json',
      category: 'backup'
    });
  }

  /**
   * 从R2恢复数据
   */
  async restoreData(backupKey: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const result = await this.downloadFile(backupKey);
      
      if (!result.success || !result.content) {
        return {
          success: false,
          error: result.error || '备份文件不存在'
        };
      }

      const backupContent = new TextDecoder().decode(result.content);
      const backupData = JSON.parse(backupContent);

      return {
        success: true,
        data: backupData
      };
    } catch (error) {
      console.error('数据恢复失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '恢复失败'
      };
    }
  }
}
