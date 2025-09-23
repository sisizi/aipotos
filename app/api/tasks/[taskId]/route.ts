/**
 * 获取任务状态API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { APIResponse } from '@/types';

interface RouteParams {
  params: Promise<{
    taskId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // 初始化数据库服务
    const dbService = new DatabaseService();

    // 获取任务信息
    const task = await dbService.getTask(taskId, userId || undefined);

    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      } as APIResponse, { status: 404 });
    }

    // 任务状态现在通过webhook更新，不需要轮询检查

    // 返回任务详情
    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        user_id: task.user_id,
        task_type: task.task_type,
        status: task.status,
        input_image_url: task.input_image_url,
        input_prompt: task.input_prompt,
        input_params: task.input_params,
        output_image_url: task.output_image_url,
        processing_time: task.processing_time,
        error_message: task.error_message,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
      },
      message: 'Task retrieved successfully',
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Get task error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}

// 更新任务状态（可选）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { userId, status, error_message } = body;

    if (!taskId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID and User ID are required',
      } as APIResponse, { status: 400 });
    }

    // 验证用户权限
    const dbService = new DatabaseService();
    const existingTask = await dbService.getTask(taskId, userId);

    if (!existingTask) {
      return NextResponse.json({
        success: false,
        error: 'Task not found or access denied',
      } as APIResponse, { status: 404 });
    }

    // 准备更新数据
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (error_message) updates.error_message = error_message;

    // 如果状态变为完成或失败，设置完成时间
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    // 更新任务
    await dbService.updateTask(taskId, updates);

    // 获取更新后的任务
    const updatedTask = await dbService.getTask(taskId, userId);

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Update task error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}

// 删除任务
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!taskId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID and User ID are required',
      } as APIResponse, { status: 400 });
    }

    // 验证任务存在且用户有权限
    const dbService = new DatabaseService();
    const existingTask = await dbService.getTask(taskId, userId);

    if (!existingTask) {
      return NextResponse.json({
        success: false,
        error: 'Task not found or access denied',
      } as APIResponse, { status: 404 });
    }

    // 删除任务
    await dbService.deleteTask(taskId, userId);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Delete task error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}