/**
 * Cloudflare R2存储服务
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageError } from '@/types';

export class R2StorageService {
  private client: S3Client;
  
  constructor() {
    // 验证必需的环境变量
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new StorageError(
        'R2 configuration is missing. Please check your environment variables.',
        'MISSING_CONFIG',
        { accountId: !!accountId, accessKeyId: !!accessKeyId, secretAccessKey: !!secretAccessKey }
      );
    }
    
    // 构建R2端点URL
    const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });
  }

  /**
   * 上传用户图片到R2
   * @param fileBuffer 文件缓冲区
   * @param fileName 文件名
   * @param contentType 文件类型
   * @param userId 用户ID
   * @returns 图片URL
   */
  async uploadUserImage(
    fileBuffer: Buffer, 
    fileName: string, 
    contentType: string, 
    userId: string
  ): Promise<string> {
    try {
      // 生成唯一文件名，避免冲突
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '').substring(0, 50); // 清理并限制文件名长度
      const key = `users/${userId}/${timestamp}-${safeFileName}`;
      
      const bucketName = process.env.R2_BUCKET_USER_UPLOADS || process.env.R2_BUCKET_NAME;
      if (!bucketName) {
        throw new StorageError('Bucket name not configured', 'MISSING_BUCKET');
      }
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          userId: String(userId),
          uploadTime: String(timestamp),
          originalName: String(fileName),
        },
      });
      
      await this.client.send(command);
      
      // 构建公开访问URL
      const publicUrl = process.env.R2_PUBLIC_URL;
      if (publicUrl) {
        return `${publicUrl}/${key}`;
      }
      
      // 如果没有配置公开URL，使用R2端点
      const accountId = process.env.R2_ACCOUNT_ID;
      return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;
      
    } catch (error) {
      console.error('Error uploading user image to R2:', error);
      throw new StorageError(
        `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPLOAD_FAILED',
        { fileName, userId, contentType }
      );
    }
  }

  /**
   * 从URL下载并存储AI生成的图片
   * @param imageUrl AI返回的图片URL
   * @param taskId 任务ID
   * @param userId 用户ID
   * @returns 存储后的图片URL
   */
  async storeAIGeneratedImage(imageUrl: string, taskId: string, userId: string): Promise<string> {
    try {
      // 验证参数
      if (!imageUrl) {
        throw new Error('imageUrl is required');
      }
      if (!taskId) {
        throw new Error('taskId is required');
      }
      if (!userId) {
        throw new Error('userId is required');
      }
      // 下载图片
      console.log(`Downloading AI generated image from: ${imageUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'PhotoGen-AI/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`Download response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';
      console.log(`Downloaded image size: ${imageBuffer.length} bytes, content-type: ${contentType}`);

      // 生成存储路径
      const timestamp = Date.now();
      const key = `ai-generated/${userId}/${taskId}-${timestamp}.png`;
      console.log(`Generated storage key: ${key}`);
      
      const bucketName = process.env.R2_BUCKET_AI_GENERATED || process.env.R2_BUCKET_NAME;
      if (!bucketName) {
        throw new StorageError('AI generated bucket name not configured', 'MISSING_BUCKET');
      }
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        Metadata: {
          taskId: String(taskId),
          userId: String(userId),
          originalUrl: String(imageUrl),
          generatedAt: String(timestamp),
        },
      });
      
      const result = await this.client.send(command);
      console.log(`AI generated image stored to R2: ${key}`, {
        etag: result.ETag,
        key,
        bucket: bucketName
      });

      // 构建公开访问URL - AI生成图片使用专门的URL
      const publicUrl = process.env.R2_PUBLIC_URL_PROCESSED || process.env.R2_PUBLIC_URL;
      if (publicUrl) {
        return `${publicUrl}/${key}`;
      }
      
      // 如果没有配置公开URL，使用R2端点
      const accountId = process.env.R2_ACCOUNT_ID;
      return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;
      
    } catch (error) {
      console.error('Error storing AI generated image:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        imageUrl,
        taskId,
        userId
      });
      throw new StorageError(
        `Failed to store AI generated image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORE_AI_IMAGE_FAILED',
        { imageUrl, taskId, userId }
      );
    }
  }

  /**
   * 生成预签名URL，用于临时访问私有文件
   * @param key 文件键
   * @param bucket 存储桶名称
   * @param expiresIn 过期时间（秒）
   * @returns 预签名URL
   */
  async generatePresignedUrl(key: string, bucket: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new StorageError(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PRESIGNED_URL_FAILED',
        { key, bucket, expiresIn }
      );
    }
  }

  /**
   * 删除文件
   * @param key 文件键
   * @param bucket 存储桶名称
   */
  async deleteFile(key: string, bucket: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.client.send(command);
      console.log(`File deleted from R2: ${key}`);
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      throw new StorageError(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_FAILED',
        { key, bucket }
      );
    }
  }

  /**
   * 检查存储服务健康状态
   * @returns 是否可用
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
      const bucketName = process.env.R2_BUCKET_NAME;
      
      if (!bucketName) {
        return false;
      }
      
      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('R2 health check failed:', error);
      return false;
    }
  }
}