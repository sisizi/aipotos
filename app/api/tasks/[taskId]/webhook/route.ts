/**
 * 任务状态Webhook API路由 - 使用Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { TaskProgress } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID is required',
      }, { status: 400 });
    }

    // 设置SSE响应头
    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    };

    // 创建可读流
    const stream = new ReadableStream({
      start(controller) {
        const dbService = new DatabaseService();
        const nanoBananaService = new NanoBananaAPIService();

        let intervalId: NodeJS.Timeout;
        let isCompleted = false;

        const sendEvent = (data: any) => {
          const eventData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(eventData));
        };

        const checkTaskStatus = async () => {
          try {
            // 从数据库获取任务信息
            const dbTask = await dbService.getTask(taskId, userId || undefined);

            if (!dbTask) {
              sendEvent({
                error: 'Task not found',
                type: 'error'
              });
              cleanup();
              return;
            }

            // 构建任务进度响应
            const taskProgress: TaskProgress = {
              taskId: dbTask.id,
              status: dbTask.status as 'pending' | 'processing' | 'completed' | 'failed',
              message: getStatusMessage(dbTask.status),
              processingTime: dbTask.processing_time,
            };

            // 如果任务正在处理且有AI任务ID，查询AI服务状态
            if (dbTask.status === 'processing' && dbTask.nano_banana_task_id) {
              try {
                const aiTaskStatus = await nanoBananaService.getTaskStatus(dbTask.nano_banana_task_id);

                // 计算基础时间参数
                const createdTime = new Date(dbTask.created_at).getTime();
                const now = Date.now();
                const elapsed = (now - createdTime) / 1000; // 秒
                const estimatedTotal = 90; // 预估总时间90秒

                // 根据AI任务状态更新本地任务状态
                if (aiTaskStatus.state === 'success') {
                  taskProgress.message = '任务已完成，正在保存结果...';
                  taskProgress.progress = 90;
                  taskProgress.estimatedTimeLeft = Math.max(0, Math.round(10 - (elapsed - 80)));
                } else if (aiTaskStatus.state === 'fail') {
                  taskProgress.status = 'failed';
                  taskProgress.message = aiTaskStatus.failMsg || '任务处理失败';

                  // 更新数据库状态
                  await dbService.updateTask(taskId, {
                    status: 'failed',
                    error_message: aiTaskStatus.failMsg || 'AI task failed',
                  });
                } else if (aiTaskStatus.state === 'waiting') {
                  taskProgress.progress = 25;
                  taskProgress.message = '任务排队中，请稍候...';
                  const remaining = Math.max(0, estimatedTotal - elapsed);
                  taskProgress.estimatedTimeLeft = Math.round(remaining);
                } else if (aiTaskStatus.state === 'running') {
                  const progressRatio = Math.min(elapsed / estimatedTotal, 0.85);
                  taskProgress.progress = Math.round(25 + progressRatio * 60);
                  taskProgress.message = '正在生成图像，请稍候...';
                  const remaining = Math.max(0, estimatedTotal - elapsed);
                  taskProgress.estimatedTimeLeft = Math.round(remaining);
                } else {
                  taskProgress.progress = 30;
                  taskProgress.message = '正在处理中...';
                  const remaining = Math.max(0, estimatedTotal - elapsed);
                  taskProgress.estimatedTimeLeft = Math.round(remaining);
                }

              } catch (aiError) {
                console.warn(`Failed to query AI task status for ${dbTask.nano_banana_task_id}:`, aiError);
                const createdTime = new Date(dbTask.created_at).getTime();
                const now = Date.now();
                const elapsed = (now - createdTime) / 1000;
                const estimatedTotal = 90;
                const remaining = Math.max(0, estimatedTotal - elapsed);
                taskProgress.estimatedTimeLeft = Math.round(remaining);
                taskProgress.progress = 40;
                taskProgress.message = '正在处理中...';
              }
            }

            // 处理其他状态
            if (dbTask.status === 'completed') {
              taskProgress.progress = 100;
              taskProgress.message = '任务完成';
              isCompleted = true;
            } else if (dbTask.status === 'failed') {
              taskProgress.message = dbTask.error_message || '任务失败';
              isCompleted = true;
            } else if (dbTask.status === 'processing' && !dbTask.nano_banana_task_id) {
              const createdTime = new Date(dbTask.created_at).getTime();
              const now = Date.now();
              const elapsed = (now - createdTime) / 1000;
              const estimatedTotal = 90;
              const remaining = Math.max(0, estimatedTotal - elapsed);
              taskProgress.estimatedTimeLeft = Math.round(remaining);
              taskProgress.progress = Math.min(50, Math.round((elapsed / estimatedTotal) * 80));
              taskProgress.message = '正在处理中...';
            } else if (dbTask.status === 'pending') {
              const createdTime = new Date(dbTask.created_at).getTime();
              const now = Date.now();
              const elapsed = (now - createdTime) / 1000;
              const estimatedTotal = 90;
              const remaining = Math.max(0, estimatedTotal - elapsed);
              taskProgress.estimatedTimeLeft = Math.round(remaining);
              taskProgress.progress = 10;
              taskProgress.message = '任务已创建，等待处理...';
            }

            // 发送状态更新
            sendEvent({
              taskProgress,
              task: dbTask,
              type: 'status'
            });

            // 如果任务完成或失败，停止轮询
            if (isCompleted) {
              cleanup();
            }

          } catch (error) {
            console.error('检查任务状态失败:', error);
            sendEvent({
              error: error instanceof Error ? error.message : 'Internal server error',
              type: 'error'
            });
          }
        };

        const cleanup = () => {
          if (intervalId) {
            clearInterval(intervalId);
          }
          controller.close();
        };

        // 立即检查一次状态
        checkTaskStatus();

        // 每2秒检查一次状态
        intervalId = setInterval(checkTaskStatus, 2000);

        // 15秒后自动关闭连接
        setTimeout(() => {
          sendEvent({
            message: 'Webhook超时，请切换到轮询模式',
            type: 'timeout'
          });
          cleanup();
        }, 15000);

        // 处理客户端断开连接
        request.signal.addEventListener('abort', cleanup);
      },
    });

    return new NextResponse(stream, {
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Webhook error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * 根据任务状态获取用户友好的消息
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return '任务已创建，等待处理...';
    case 'processing':
      return '正在生成图像，请稍候...';
    case 'completed':
      return '任务完成';
    case 'failed':
      return '任务失败';
    default:
      return '未知状态';
  }
}

// 支持OPTIONS请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}