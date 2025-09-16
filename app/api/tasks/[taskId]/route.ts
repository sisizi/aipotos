/**
 * 获取任务状态API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { APIResponse } from '@/types';

interface RouteParams {
  params: {
    taskId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = params;
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

    // 如果任务正在处理中，可以检查AI API的状态
    if (task.status === 'processing' && task.nano_banana_task_id) {
      try {
        const nanoBananaService = new NanoBananaAPIService();
        const aiStatus = await nanoBananaService.getTaskStatus(task.nano_banana_task_id);
        
        // 根据AI API的状态更新本地任务状态（如果需要）
        if (aiStatus.status === 'completed' && task.status !== 'completed') {
          // 这里可以添加逻辑来处理AI API已完成但本地任务未完成的情况
          console.log(`AI task ${task.nano_banana_task_id} is completed, but local task is still processing`);
        }
      } catch (aiError) {
        console.warn('Failed to check AI task status:', aiError);
        // 不抛出错误，继续返回本地任务状态
      }
    }

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
    const { taskId } = params;
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
    const updates: any = {};
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
    const { taskId } = params;
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