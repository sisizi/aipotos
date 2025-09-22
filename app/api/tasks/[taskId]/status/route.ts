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

        // 计算基础时间参数
        const createdTime = new Date(dbTask.created_at).getTime();
        const now = Date.now();
        const elapsed = (now - createdTime) / 1000; // 秒
        const estimatedTotal = 90; // 预估总时间90秒

        // 根据AI任务状态更新本地任务状态
        if (aiTaskStatus.state === 'success') {
          // AI task completed but local status not updated yet
          taskProgress.message = 'Task completed, saving results...';
          taskProgress.progress = 90;
          taskProgress.estimatedTimeLeft = Math.max(0, Math.round(10 - (elapsed - 80))); // last 10 seconds
        } else if (aiTaskStatus.state === 'fail') {
          // AI task failed but local status not updated
          taskProgress.status = 'failed';
          taskProgress.message = aiTaskStatus.failMsg || 'Task processing failed';

          // 更新数据库状态
          await dbService.updateTask(taskId, {
            status: 'failed',
            error_message: aiTaskStatus.failMsg || 'AI task failed',
          });
        } else if (aiTaskStatus.state === 'waiting') {
          taskProgress.progress = 25;
          taskProgress.message = 'Task queued, please wait...';
          const remaining = Math.max(0, estimatedTotal - elapsed);
          taskProgress.estimatedTimeLeft = Math.round(remaining);
        } else if (aiTaskStatus.state === 'running') {
          // Task is running
          const progressRatio = Math.min(elapsed / estimatedTotal, 0.85); // max 85%
          taskProgress.progress = Math.round(25 + progressRatio * 60); // 25%-85%
          taskProgress.message = 'Generating image, please wait...';
          const remaining = Math.max(0, estimatedTotal - elapsed);
          taskProgress.estimatedTimeLeft = Math.round(remaining);
        } else {
          // Other states also show countdown
          taskProgress.progress = 30;
          taskProgress.message = 'Processing...';
          const remaining = Math.max(0, estimatedTotal - elapsed);
          taskProgress.estimatedTimeLeft = Math.round(remaining);
        }

      } catch (aiError) {
        console.warn(`Failed to query AI task status for ${dbTask.nano_banana_task_id}:`, aiError);
        // 继续使用数据库状态，不因AI查询失败而中断
        // 即使AI查询失败，也提供倒计时
        const createdTime = new Date(dbTask.created_at).getTime();
        const now = Date.now();
        const elapsed = (now - createdTime) / 1000;
        const estimatedTotal = 90;
        const remaining = Math.max(0, estimatedTotal - elapsed);
        taskProgress.estimatedTimeLeft = Math.round(remaining);
        taskProgress.progress = 40;
        taskProgress.message = 'Processing...';
      }
    }

    // 如果任务已完成，添加结果信息
    if (dbTask.status === 'completed') {
      taskProgress.progress = 100;
      taskProgress.message = 'Task completed';
    } else if (dbTask.status === 'failed') {
      taskProgress.message = dbTask.error_message || 'Task failed';
    } else if (dbTask.status === 'processing' && !dbTask.nano_banana_task_id) {
      // Processing status without AI task ID, also provide countdown
      const createdTime = new Date(dbTask.created_at).getTime();
      const now = Date.now();
      const elapsed = (now - createdTime) / 1000;
      const estimatedTotal = 90; // estimated total time 90 seconds
      const remaining = Math.max(0, estimatedTotal - elapsed);
      taskProgress.estimatedTimeLeft = Math.round(remaining);
      taskProgress.progress = Math.min(50, Math.round((elapsed / estimatedTotal) * 80));
      taskProgress.message = 'Processing...';
    } else if (dbTask.status === 'pending') {
      // Pending status also provides countdown
      const createdTime = new Date(dbTask.created_at).getTime();
      const now = Date.now();
      const elapsed = (now - createdTime) / 1000;
      const estimatedTotal = 90; // estimated total time 90 seconds
      const remaining = Math.max(0, estimatedTotal - elapsed);
      taskProgress.estimatedTimeLeft = Math.round(remaining);
      taskProgress.progress = 10;
      taskProgress.message = 'Task created, waiting for processing...';
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