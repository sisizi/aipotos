/**
 * 测试R2存储功能端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/services/r2Storage';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, taskId, userId } = await request.json();

    if (!imageUrl || !taskId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: imageUrl, taskId, userId'
      }, { status: 400 });
    }

    console.log('Testing R2 storage with:', { imageUrl, taskId, userId });

    // 测试R2存储功能
    const r2Service = new R2StorageService();
    const storedUrl = await r2Service.storeAIGeneratedImage(imageUrl, taskId, userId);

    return NextResponse.json({
      success: true,
      data: {
        originalUrl: imageUrl,
        storedUrl,
        taskId,
        userId
      },
      message: 'R2 storage test successful'
    });

  } catch (error) {
    console.error('R2 storage test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 测试R2连接
    const r2Service = new R2StorageService();
    const isHealthy = await r2Service.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        r2Healthy: isHealthy,
        timestamp: new Date().toISOString()
      },
      message: 'R2 health check completed'
    });

  } catch (error) {
    console.error('R2 health check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}