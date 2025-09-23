/**
 * 任务状态查询API路由 - 基于webhook更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
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

    // 为处理中的任务计算进度（基于时间估算）
    if (dbTask.status === 'processing') {
      const createdTime = new Date(dbTask.created_at).getTime();
      const elapsed = (Date.now() - createdTime) / 1000; // 秒
      const estimatedTotal = 90; // 预估总时间90秒

      // 基于时间的进度估算
      const progress = Math.min(85, Math.round((elapsed / estimatedTotal) * 85)); // 最多85%，等待webhook完成
      taskProgress.progress = progress;
      taskProgress.processingTime = Math.round(elapsed);
      taskProgress.estimatedTimeLeft = Math.max(0, Math.round(estimatedTotal - elapsed));
    }

    // 如果任务已完成，添加结果信息
    if (dbTask.status === 'completed') {
      taskProgress.progress = 100;
      taskProgress.message = 'Task completed';
    } else if (dbTask.status === 'failed') {
      taskProgress.message = dbTask.error_message || 'Task failed';
    }

    return NextResponse.json({
      success: true,
      data: taskProgress,
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Task status query error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Task is queued and waiting to start';
    case 'processing':
      return 'Task is being processed, please wait...';
    case 'completed':
      return 'Task completed successfully';
    case 'failed':
      return 'Task failed to complete';
    default:
      return 'Unknown status';
  }
}

// 添加OPTIONS方法支持CORS（如果需要）
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