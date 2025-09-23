/**
 * 调试配置信息端点
 */

import { NextResponse } from 'next/server';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';

export async function GET() {
  try {
    // 收集配置信息（隐藏敏感信息）
    const config = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      nanoBanana: {
        baseURL: process.env.NANO_BANANA_BASE_URL,
        hasApiKey: !!process.env.NANO_BANANA_API_KEY,
        apiKeyLength: process.env.NANO_BANANA_API_KEY?.length || 0,
      },
      r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        hasAccessKey: !!process.env.CLOUDFLARE_ACCESS_KEY_ID || !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.CLOUDFLARE_SECRET_ACCESS_KEY || !!process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME,
        publicUrl: process.env.R2_PUBLIC_URL,
      }
    };

    // 尝试获取webhook URL
    let webhookUrl = 'Unable to determine';
    try {
      const service = new NanoBananaAPIService();
      // 使用反射来访问私有方法
      webhookUrl = (service as any).getWebhookUrl();
    } catch (error) {
      webhookUrl = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        webhookUrl,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug config error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}