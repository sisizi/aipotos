/**
 * 任务状态Webhook API路由 - 使用Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { registerSSEConnection, removeSSEConnection } from '@/lib/sse-utils';
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
        let controllerClosed = false;

        const sendEvent = (data: any) => {
          try {
            if (!controllerClosed) {
              const eventData = `data: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(new TextEncoder().encode(eventData));
            }
          } catch (error) {
            console.warn('Failed to send SSE event, controller may be closed:', error);
            controllerClosed = true;
          }
        };

        const cleanup = () => {
          controllerClosed = true;
          removeSSEConnection(taskId);
          try {
            controller.close();
          } catch (error) {
            console.warn('Controller already closed:', error);
          }
        };

        // 初始化检查任务状态
        const initializeTaskStatus = async () => {
          try {
            const dbTask = await dbService.getTask(taskId, userId || undefined);

            if (!dbTask) {
              sendEvent({
                error: 'Task not found',
                type: 'error'
              });
              cleanup();
              return;
            }

            // 构建初始任务进度响应
            const taskProgress: TaskProgress = {
              taskId: dbTask.id,
              status: dbTask.status as 'pending' | 'processing' | 'completed' | 'failed',
              message: getStatusMessage(dbTask.status),
              processingTime: dbTask.processing_time,
            };

            // 如果任务已经完成，直接返回结果
            if (dbTask.status === 'completed') {
              taskProgress.progress = 100;
              taskProgress.message = 'Task completed';
              sendEvent({
                taskProgress,
                task: dbTask,
                type: 'status'
              });
              setTimeout(cleanup, 1000);
              return;
            } else if (dbTask.status === 'failed') {
              taskProgress.message = dbTask.error_message || 'Task failed';
              sendEvent({
                taskProgress,
                task: dbTask,
                type: 'status'
              });
              setTimeout(cleanup, 1000);
              return;
            }

            // 对于进行中的任务，提供初始状态
            if (dbTask.status === 'pending' || dbTask.status === 'processing') {
              const createdTime = new Date(dbTask.created_at).getTime();
              const now = Date.now();
              const elapsed = (now - createdTime) / 1000;
              const estimatedTotal = 90;

              if (dbTask.status === 'processing') {
                const progress = Math.min(85, Math.round((elapsed / estimatedTotal) * 85));
                taskProgress.progress = progress;
                taskProgress.processingTime = Math.round(elapsed);
                taskProgress.estimatedTimeLeft = Math.max(0, Math.round(estimatedTotal - elapsed));
                taskProgress.message = 'Processing, please wait...';
              } else {
                taskProgress.progress = 10;
                taskProgress.estimatedTimeLeft = Math.round(estimatedTotal);
                taskProgress.message = 'Task created, waiting for processing...';
              }

              sendEvent({
                taskProgress,
                task: dbTask,
                type: 'status'
              });
            }

            // 注册SSE连接，等待webhook推送更新
            const encoder = new TextEncoder();
            const writer = {
              write: (message: string) => {
                if (!controllerClosed) {
                  controller.enqueue(encoder.encode(message));
                }
              },
              close: cleanup
            };
            registerSSEConnection(taskId, writer as any);

          } catch (error) {
            console.error('初始化任务状态失败:', error);
            sendEvent({
              error: error instanceof Error ? error.message : 'Internal server error',
              type: 'error'
            });
            cleanup();
          }
        };

        // 初始化任务状态
        initializeTaskStatus();

        // 12分钟后自动关闭连接（略长于任务超时，防止连接泄漏）
        setTimeout(() => {
          sendEvent({
            message: 'SSE连接超时，任务可能已超时或完成，请刷新页面查看结果',
            type: 'timeout'
          });
          cleanup();
        }, 12 * 60 * 1000); // 12分钟

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
 * Get user-friendly status message
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Task created, waiting for processing...';
    case 'processing':
      return 'Generating image, please wait...';
    case 'completed':
      return 'Task completed';
    case 'failed':
      return 'Task failed';
    default:
      return 'Unknown status';
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