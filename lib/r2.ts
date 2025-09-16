import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import https from 'https';

// 验证必需的环境变量
if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET_NAME) {
  throw new Error('Missing required R2 environment variables');
}

// 设置环境变量以解决SSL问题
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 创建兼容的HTTPS代理，解决SSL握手问题
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  // 使用更兼容的TLS设置
  secureProtocol: 'TLSv1_2_method',
});

// Cloudflare R2 配置 - 使用兼容的SSL配置
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
  requestHandler: new NodeHttpHandler({
    httpsAgent,
    connectionTimeout: 30000,
    socketTimeout: 30000,
  }),
});

const BUCKET_NAME = process.env.R2_BUCKET_USER_UPLOADS;

export async function uploadToR2(file: File): Promise<string> {
  try {
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
      ACL: 'public-read', // 如果需要公开访问
    });

    await r2Client.send(command);
    
    // 生成预签名URL用于公开访问
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    const signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 * 24 * 7 }); // 7天有效期
    return signedUrl;
  } catch (error) {
    console.error('R2上传错误:', error);
    throw new Error('文件上传失败');
  }
}

export { r2Client, BUCKET_NAME };
