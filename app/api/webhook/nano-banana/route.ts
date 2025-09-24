/**
 * Nano Banana AI Webhook接收端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { R2StorageService } from '@/services/r2Storage';
import { TaskRecord } from '@/types';
import { addWebhookLog } from '@/lib/webhook-logger';
import { clearTaskTimeout } from '@/lib/task-timeout';
import { cacheTaskResult } from '@/lib/task-cache';

interface NanoBananaWebhookPayload {
  code: number;
  data: {
    taskId: string;
    state: 'success' | 'fail' | 'waiting';
    resultJson?: string;
    failMsg?: string;
    failCode?: string;
    costTime?: number;
    completeTime?: number;
    createTime?: number;
    updateTime?: number;
    model?: string;
    param?: string;
  };
  msg: string;
}

export async function POST(request: NextRequest) {
  let payload: NanoBananaWebhookPayload | null = null;

  try {
    // 1. 添加更详细的日志
    console.log('📥 Raw request info:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    // 2. 记录原始请求体
    const rawBody = await request.text();
    console.log('📋 Raw webhook body:', rawBody);
    console.log('📋 Raw webhook body length:', rawBody.length);

    // 3. 安全地解析JSON
    try {
      payload = JSON.parse(rawBody);
      console.log('📦 Parsed payload:', payload);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      addWebhookLog('json-parse-error', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawBody: rawBody.substring(0, 500)
      });
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 4. 验证必要字段
    if (!payload || !payload.data || !payload.data.taskId) {
      console.error('❌ Missing taskId in payload:', payload);
      addWebhookLog('missing-taskid-error', { payload });
      return NextResponse.json({ error: 'Missing taskId in data' }, { status: 400 });
    }

    // 5. 检查响应码
    if (payload.code !== 200) {
      console.error('❌ API response error:', payload);
      addWebhookLog('api-response-error', { payload });
      return NextResponse.json({ error: 'API response error' }, { status: 400 });
    }

    // 记录webhook接收日志
    const logData = {
      taskId: payload.data.taskId,
      state: payload.data.state,
      hasResultJson: !!payload.data.resultJson,
      failMsg: payload.data.failMsg,
      costTime: payload.data.costTime,
      timestamp: new Date().toISOString()
    };

    addWebhookLog('nano-banana-webhook-received', logData);
    console.log('✅ Received Nano Banana webhook:', logData);

    // 5. 包装数据库操作
    let dbService: DatabaseService;
    try {
      console.log('🔗 Initializing database service...');
      dbService = new DatabaseService();
      console.log('✅ Database service initialized successfully');
    } catch (dbError) {
      console.error('❌ Database service initialization failed:', dbError);
      addWebhookLog('database-init-error', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        taskId: payload.data.taskId
      });
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 6. 查找本地任务
    console.log(`🔍 Looking up local task with Nano Banana ID: ${payload.data.taskId}`);
    let localTask;
    try {
      localTask = await dbService.getTaskByNanoBananaId(payload.data.taskId);
      console.log('✅ Task lookup completed:', localTask ? 'found' : 'not found');
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      addWebhookLog('database-query-error', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        taskId: payload.data.taskId
      });
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!localTask) {
      const errorData = {
        webhookTaskId: payload.data.taskId,
        error: 'No local task found',
        possibleCauses: [
          'nano_banana_task_id was not properly saved when task was created',
          'Task ID from webhook does not match what was sent to Nano Banana',
          'Database connection issue'
        ]
      };

      addWebhookLog('task-lookup-failed', errorData);
      console.warn(`❌ No local task found for Nano Banana task ID: ${payload.data.taskId}`);
      console.error('💥 Task lookup failed:', errorData);

      // 尝试获取任务信息以帮助调试
      try {
        // 记录调试信息
        console.log('🔍 Debug info for webhook task lookup:', {
          receivedTaskId: payload.data.taskId,
          taskIdType: typeof payload.data.taskId,
          taskIdLength: payload.data.taskId?.length || 0
        });
      } catch (debugError) {
        console.error('Failed to log debug info:', debugError);
      }

      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = {
      id: localTask.id,
      status: localTask.status,
      user_id: localTask.user_id,
      nano_banana_task_id: localTask.nano_banana_task_id
    };

    addWebhookLog('task-found', taskData);
    console.log(`✅ Found local task:`, taskData);

    // 清除任务超时定时器（因为收到了webhook）
    clearTaskTimeout(localTask.id);
    console.log(`⏰ Cleared timeout for task: ${localTask.id}`);

    // 7. 根据webhook状态更新本地任务
    addWebhookLog('processing-webhook-state', { taskId: localTask.id, state: payload.data.state });

    try {
      if (payload.data.state === 'success') {
        console.log(`🎉 Processing successful task: ${localTask.id}`);
        await handleSuccessfulTask(localTask, payload.data);
      } else if (payload.data.state === 'fail') {
        console.log(`💥 Processing failed task: ${localTask.id}`);
        await handleFailedTask(localTask, payload.data);
      } else if (payload.data.state === 'waiting') {
        console.log(`⏳ Task ${localTask.id} is still waiting, no action needed`);
        addWebhookLog('task-waiting', { taskId: localTask.id });
      } else {
        console.warn(`❓ Unknown webhook state: ${payload.data.state}`);
        addWebhookLog('unknown-state', { taskId: localTask.id, state: payload.data.state });
      }
    } catch (taskProcessingError) {
      console.error('❌ Task processing error:', taskProcessingError);
      addWebhookLog('task-processing-error', {
        taskId: localTask.id,
        error: taskProcessingError instanceof Error ? taskProcessingError.message : String(taskProcessingError)
      });
      return NextResponse.json({ error: 'Task processing failed' }, { status: 500 });
    }

    // 客户端将通过定时检查获取任务状态，不需要实时通知

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('💥 Webhook processing error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      payload: payload || 'not parsed',
      timestamp: new Date().toISOString()
    });

    addWebhookLog('webhook-error', {
      error: error instanceof Error ? error.message : String(error),
      hasPayload: !!payload,
      taskId: payload?.data?.taskId || 'unknown'
    });

    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 处理成功完成的任务
 */
async function handleSuccessfulTask(localTask: TaskRecord, payload: NanoBananaWebhookPayload['data']) {
  addWebhookLog('handle-success-start', { taskId: localTask.id });

  try {
    if (!payload.resultJson) {
      throw new Error('Missing result data');
    }

    const resultData = JSON.parse(payload.resultJson);
    console.log('📊 Parsed result data:', {
      resultUrls: resultData.resultUrls,
      resultUrlsLength: resultData.resultUrls?.length,
      fullData: resultData
    });

    const imageUrls = resultData.resultUrls || [];

    if (imageUrls.length === 0) {
      console.error('❌ No image URLs in result:', resultData);
      throw new Error('No image URLs in result');
    }

    // 取第一张图片作为结果
    const primaryImageUrl = imageUrls[0];
    console.log('🖼️ Primary image URL:', primaryImageUrl);

    // 验证图片URL格式
    if (!primaryImageUrl || !primaryImageUrl.startsWith('http')) {
      console.error('❌ Invalid image URL format:', primaryImageUrl);
      throw new Error(`Invalid image URL format: ${primaryImageUrl}`);
    }

    // 直接同步处理R2存储和数据库更新
    console.log('📥 Downloading image from kie.ai and uploading to R2...');
    const r2Service = new R2StorageService();
    const finalImageUrl = await r2Service.storeAIGeneratedImage(primaryImageUrl, localTask.id, localTask.user_id);
    console.log('✅ Final image URL (R2):', finalImageUrl);

    // 更新数据库为R2 URL
    console.log('📝 Updating database with R2 URL...');
    const dbService = new DatabaseService();
    await dbService.updateTask(localTask.id, {
      status: 'completed',
      output_image_url: finalImageUrl,
      processing_time: payload.costTime,
      completed_at: new Date().toISOString(),
    });
    console.log('✅ Database updated with R2 URL for task:', localTask.id);

    // 缓存任务结果用于快速获取
    cacheTaskResult({
      taskId: localTask.id,
      status: 'completed',
      output_image_url: finalImageUrl,
      timestamp: Date.now()
    });
    console.log('📦 Task result cached for quick access:', localTask.id);

    addWebhookLog('task-completed-success', {
      taskId: localTask.id,
      r2Url: finalImageUrl,
      processingTime: payload.costTime
    });
    console.log(`Task ${localTask.id} completed via webhook, R2 URL saved to database: ${finalImageUrl}`);

  } catch (error) {
    addWebhookLog('handle-success-error', {
      taskId: localTask.id,
      error: error instanceof Error ? error.message : String(error)
    });
    console.error(`💥 Error handling successful task ${localTask.id}:`, {
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

    // 缓存失败结果
    cacheTaskResult({
      taskId: localTask.id,
      status: 'failed',
      error_message: `Post-processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: Date.now()
    });
    console.log('📦 Post-processing failure cached for quick access:', localTask.id);
  }
}

/**
 * 处理失败的任务
 */
async function handleFailedTask(localTask: TaskRecord, payload: NanoBananaWebhookPayload['data']) {
  addWebhookLog('handle-failure-start', {
    taskId: localTask.id,
    failMsg: payload.failMsg
  });

  const dbService = new DatabaseService();
  await dbService.updateTask(localTask.id, {
    status: 'failed',
    error_message: payload.failMsg || 'Task failed',
    processing_time: payload.costTime,
    completed_at: new Date().toISOString(),
  });

  // 缓存失败的任务结果
  cacheTaskResult({
    taskId: localTask.id,
    status: 'failed',
    error_message: payload.failMsg || 'Task failed',
    timestamp: Date.now()
  });
  console.log('📦 Failed task result cached for quick access:', localTask.id);

  // 立即推送失败消息给客户端
  try {
    const { pushTaskUpdate } = await import('@/lib/sse-utils');
    pushTaskUpdate(localTask.id, {
      type: 'failed',
      data: {
        id: localTask.id,
        status: 'failed',
        error_message: payload.failMsg || 'Task failed'
      } as unknown as Record<string, unknown>
    });
    console.log('⚡ 推送任务失败消息给客户端:', payload.failMsg);
  } catch (sseError) {
    console.error('❌ SSE推送失败消息失败:', sseError);
  }

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