/**
 * 任务状态查询API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { APIResponse, TaskProgress } from '@/types';

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
      } as APIResponse, { status: 400 });
    }

    // 初始化服务
    const dbService = new DatabaseService();
    const nanoBananaService = new NanoBananaAPIService();

    // 从数据库获取任务信息
    const dbTask = await dbService.getTask(taskId, userId || undefined);

    if (!dbTask) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      } as APIResponse, { status: 404 });
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

        // 根据AI任务状态更新本地任务状态
        if (aiTaskStatus.state === 'success') {
          // AI任务已完成但本地状态未更新，可能是后台处理还未完成
          taskProgress.message = '任务已完成，正在保存结果...';
          taskProgress.progress = 90;
        } else if (aiTaskStatus.state === 'fail') {
          // AI任务失败但本地状态未更新
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

          // 估算剩余时间（基于创建时间）
          const createdTime = new Date(dbTask.created_at).getTime();
          const now = Date.now();
          const elapsed = (now - createdTime) / 1000; // 秒

          const estimatedTotal = 60; // 预估总时间60秒
          const remaining = Math.max(0, estimatedTotal - elapsed);
          taskProgress.estimatedTimeLeft = Math.round(remaining);
        }

      } catch (aiError) {
        console.warn(`Failed to query AI task status for ${dbTask.nano_banana_task_id}:`, aiError);
        // 继续使用数据库状态，不因AI查询失败而中断
      }
    }

    // 如果任务已完成，添加结果信息
    if (dbTask.status === 'completed') {
      taskProgress.progress = 100;
      taskProgress.message = '任务完成';
    } else if (dbTask.status === 'failed') {
      taskProgress.message = dbTask.error_message || '任务失败';
    }

    return NextResponse.json({
      success: true,
      data: {
        taskProgress,
        task: dbTask, // 包含完整的任务信息
      },
      message: 'Task status retrieved successfully',
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Get task status error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
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