import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 验证必需的环境变量
if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET_USER_UPLOADS) {
  throw new Error('Missing required R2 environment variables');
}

// 最简单的R2配置，避免SSL问题
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.R2_BUCKET_USER_UPLOADS;

/**
 * 将文件上传到R2云存储服务并返回可访问的预签名URL
 * @param file - 要上传的文件对象
 * @returns 返回一个Promise，解析为预签名URL字符串
 */
export async function uploadToR2(file: File): Promise<string> {
  try {
    // 将文件转换为ArrayBuffer格式
    const fileBuffer = await file.arrayBuffer();
    // 生成唯一文件名，包含时间戳、随机字符串和原始文件名
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
    
    // 创建R2上传命令
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,  // 存储桶名称
      Key: fileName,        // 文件在R2中的唯一标识
      Body: Buffer.from(fileBuffer),  // 文件内容
      ContentType: file.type,  // 文件MIME类型
      // 移除ACL设置，因为R2可能不支持
    });

    // 发送上传命令到R2
    await r2Client.send(command);
    
    // 生成预签名URL用于公开访问
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    // 创建7天有效期的预签名URL
    const signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 * 24 * 7 }); // 7天有效期
    return signedUrl;
  } catch (error) {
    // 捕获并处理上传过程中的错误
    console.error('R2上传错误:', error);
    throw new Error(`文件上传失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export { r2Client, BUCKET_NAME };
