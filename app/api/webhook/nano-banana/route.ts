/**
 * Nano Banana AI Webhook接收端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { R2StorageService } from '@/services/r2Storage';
import { TaskRecord } from '@/types';
import { addWebhookLog } from '@/lib/webhook-logger';
import { clearTaskTimeout } from '@/lib/task-timeout';

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

    // 记录webhook接收日志
    const logData = {
      taskId: payload.taskId,
      state: payload.state,
      hasResultJson: !!payload.resultJson,
      failMsg: payload.failMsg,
      costTime: payload.costTime,
      timestamp: new Date().toISOString()
    };

    addWebhookLog('nano-banana-webhook-received', logData);
    console.log('Received Nano Banana webhook:', logData);

    if (!payload.taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    const dbService = new DatabaseService();

    // 根据nano_banana_task_id查找本地任务
    console.log(`Looking up local task with Nano Banana ID: ${payload.taskId}`);
    const localTask = await dbService.getTaskByNanoBananaId(payload.taskId);

    if (!localTask) {
      const errorData = {
        webhookTaskId: payload.taskId,
        error: 'No local task found',
        possibleCauses: [
          'nano_banana_task_id was not properly saved when task was created',
          'Task ID from webhook does not match what was sent to Nano Banana',
          'Database connection issue'
        ]
      };

      addWebhookLog('task-lookup-failed', errorData);
      console.warn(`No local task found for Nano Banana task ID: ${payload.taskId}`);
      console.error('Task lookup failed:', errorData);

      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = {
      id: localTask.id,
      status: localTask.status,
      user_id: localTask.user_id,
      nano_banana_task_id: localTask.nano_banana_task_id
    };

    addWebhookLog('task-found', taskData);
    console.log(`Found local task:`, taskData);

    // 清除任务超时定时器（因为收到了webhook）
    clearTaskTimeout(localTask.id);

    // 根据webhook状态更新本地任务
    addWebhookLog('processing-webhook-state', { taskId: localTask.id, state: payload.state });

    if (payload.state === 'success') {
      console.log(`Processing successful task: ${localTask.id}`);
      await handleSuccessfulTask(localTask, payload);
    } else if (payload.state === 'fail') {
      console.log(`Processing failed task: ${localTask.id}`);
      await handleFailedTask(localTask, payload);
    } else if (payload.state === 'waiting') {
      console.log(`Task ${localTask.id} is still waiting, no action needed`);
      addWebhookLog('task-waiting', { taskId: localTask.id });
    } else {
      console.warn(`Unknown webhook state: ${payload.state}`);
      addWebhookLog('unknown-state', { taskId: localTask.id, state: payload.state });
    }

    // 通知前端状态更新（通过SSE）
    await notifyTaskUpdate(localTask.id, payload.state, localTask);

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
  addWebhookLog('handle-success-start', { taskId: localTask.id });

  try {
    if (!payload.resultJson) {
      throw new Error('Missing result data');
    }

    const resultData = JSON.parse(payload.resultJson);
    console.log('Parsed result data:', {
      resultUrls: resultData.resultUrls,
      resultUrlsLength: resultData.resultUrls?.length
    });

    const imageUrls = resultData.resultUrls || [];

    if (imageUrls.length === 0) {
      throw new Error('No image URLs in result');
    }

    // 取第一张图片作为结果
    const primaryImageUrl = imageUrls[0];
    console.log('Primary image URL:', primaryImageUrl);

    // 下载并存储图片到R2
    console.log('Starting R2 storage for task:', localTask.id);
    const r2Service = new R2StorageService();
    const storedImageUrl = await r2Service.storeAIGeneratedImage(
      primaryImageUrl,
      localTask.id,
      localTask.user_id
    );
    console.log('R2 storage completed, stored URL:', storedImageUrl);

    // 更新数据库
    console.log('Updating database for task:', localTask.id);
    const dbService = new DatabaseService();
    await dbService.updateTask(localTask.id, {
      status: 'completed',
      output_image_url: storedImageUrl,
      processing_time: payload.costTime,
      completed_at: new Date().toISOString(),
    });
    console.log('Database update completed for task:', localTask.id);

    addWebhookLog('task-completed-success', {
      taskId: localTask.id,
      storedImageUrl,
      processingTime: payload.costTime
    });
    console.log(`Task ${localTask.id} completed via webhook, image stored: ${storedImageUrl}`);

  } catch (error) {
    addWebhookLog('handle-success-error', {
      taskId: localTask.id,
      error: error instanceof Error ? error.message : String(error)
    });
    console.error(`Error handling successful task ${localTask.id}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      taskId: localTask.id,
      userId: localTask.user_id
    });

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
  addWebhookLog('handle-failure-start', {
    taskId: localTask.id,
    failMsg: payload.failMsg
  });

  const dbService = new DatabaseService();
  await dbService.updateTask(localTask.id, {
    status: 'failed',
    error_message: payload.failMsg || 'Task failed',
    processing_time: payload.costTime,
  });

  addWebhookLog('task-completed-failed', {
    taskId: localTask.id,
    failMsg: payload.failMsg
  });
  console.log(`Task ${localTask.id} failed via webhook: ${payload.failMsg}`);
}

/**
 * 通知前端任务状态更新
 */
async function notifyTaskUpdate(taskId: string, state: string, taskData: TaskRecord) {
  // 使用SSE工具函数推送更新
  try {
    const { pushTaskUpdate } = await import('@/lib/sse-utils');

    const updateType = state === 'success' ? 'completed' : state === 'fail' ? 'failed' : 'status';

    // 获取更新后的任务数据
    const dbService = new DatabaseService();
    const updatedTask = await dbService.getTask(taskId);

    const success = pushTaskUpdate(taskId, {
      type: updateType as 'status' | 'progress' | 'completed' | 'failed',
      data: (updatedTask || taskData) as unknown as Record<string, unknown>
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