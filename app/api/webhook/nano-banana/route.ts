/**
 * Nano Banana AI Webhook接收端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { R2StorageService } from '@/services/r2Storage';
import { TaskRecord } from '@/types';

interface NanoBananaWebhookPayload {
  taskId: string;
  state: 'success' | 'fail' | 'waiting';
  resultJson?: string;
  failMsg?: string;
  failCode?: string;
  costTime?: number;
  completeTime?: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload: NanoBananaWebhookPayload = await request.json();
    console.log('Received Nano Banana webhook:', payload);

    if (!payload.taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    const dbService = new DatabaseService();

    // 根据nano_banana_task_id查找本地任务
    const localTask = await dbService.getTaskByNanoBananaId(payload.taskId);

    if (!localTask) {
      console.warn(`No local task found for Nano Banana task ID: ${payload.taskId}`);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 根据webhook状态更新本地任务
    if (payload.state === 'success') {
      await handleSuccessfulTask(localTask, payload);
    } else if (payload.state === 'fail') {
      await handleFailedTask(localTask, payload);
    }
    // 对于 'waiting' 状态，暂时不做处理，继续等待

    // 通知前端状态更新（通过SSE）
    await notifyTaskUpdate(localTask.id, payload.state);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * 处理成功完成的任务
 */
async function handleSuccessfulTask(localTask: TaskRecord, payload: NanoBananaWebhookPayload) {
  try {
    if (!payload.resultJson) {
      throw new Error('Missing result data');
    }

    const resultData = JSON.parse(payload.resultJson);
    const imageUrls = resultData.resultUrls || [];

    if (imageUrls.length === 0) {
      throw new Error('No image URLs in result');
    }

    // 取第一张图片作为结果
    const primaryImageUrl = imageUrls[0];

    // 下载并存储图片到R2
    const r2Service = new R2StorageService();
    const storedImageUrl = await r2Service.storeAIGeneratedImage(
      primaryImageUrl,
      localTask.id,
      localTask.user_id
    );

    // 更新数据库
    const dbService = new DatabaseService();
    await dbService.updateTask(localTask.id, {
      status: 'completed',
      output_image_url: storedImageUrl,
      processing_time: payload.costTime,
      completed_at: new Date().toISOString(),
    });

    console.log(`Task ${localTask.id} completed via webhook, image stored: ${storedImageUrl}`);

  } catch (error) {
    console.error(`Error handling successful task ${localTask.id}:`, error);

    // 如果处理失败，标记任务为失败状态
    const dbService = new DatabaseService();
    await dbService.updateTask(localTask.id, {
      status: 'failed',
      error_message: `Post-processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * 处理失败的任务
 */
async function handleFailedTask(localTask: TaskRecord, payload: NanoBananaWebhookPayload) {
  const dbService = new DatabaseService();
  await dbService.updateTask(localTask.id, {
    status: 'failed',
    error_message: payload.failMsg || 'Task failed',
    processing_time: payload.costTime,
  });

  console.log(`Task ${localTask.id} failed via webhook: ${payload.failMsg}`);
}

/**
 * 通知前端任务状态更新
 */
async function notifyTaskUpdate(taskId: string, state: string) {
  // 使用SSE工具函数推送更新
  try {
    const { pushTaskUpdate } = await import('@/lib/sse-utils');

    const updateType = state === 'success' ? 'completed' : state === 'fail' ? 'failed' : 'status';

    const success = pushTaskUpdate(taskId, {
      type: updateType as 'status' | 'progress' | 'completed' | 'failed',
      data: { state, timestamp: Date.now() }
    });

    if (success) {
      console.log(`SSE notification sent for task ${taskId}: ${state}`);
    } else {
      console.log(`No active SSE connection for task ${taskId}`);
    }
  } catch (error) {
    console.error('Error sending SSE notification:', error);
  }
}

// 支持OPTIONS请求（CORS）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}