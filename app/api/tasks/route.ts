/**
 * 任务列表API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { APIResponse, TaskRecord } from '@/types';

// 获取用户任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
      } as APIResponse, { status: 400 });
    }

    // 验证分页参数
    if (limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Limit must be between 1 and 100',
      } as APIResponse, { status: 400 });
    }

    if (offset < 0) {
      return NextResponse.json({
        success: false,
        error: 'Offset must be non-negative',
      } as APIResponse, { status: 400 });
    }

    console.log(`Getting tasks for user ${userId}, limit: ${limit}, offset: ${offset}, status: ${status || 'all'}`);

    // 初始化数据库服务
    const dbService = new DatabaseService();

    // 获取任务列表
    let tasks: TaskRecord[];
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      // 如果指定了状态，先获取所有任务再过滤（这里可以优化数据库查询）
      const allTasks = await dbService.getUserTasks(userId, 100, 0);
      tasks = allTasks.filter(task => task.status === status).slice(offset, offset + limit);
    } else {
      // 获取所有状态的任务
      tasks = await dbService.getUserTasks(userId, limit, offset);
    }

    // 获取统计信息
    const stats = await dbService.getTaskStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        stats,
        pagination: {
          limit,
          offset,
          total: stats.total,
          hasMore: offset + limit < stats.total,
        },
      },
      message: 'Tasks retrieved successfully',
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Get tasks error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}

// 批量操作任务（可选）
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taskIds, action } = body;

    if (!userId || !taskIds || !Array.isArray(taskIds) || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: userId, taskIds (array), action',
      } as APIResponse, { status: 400 });
    }

    if (taskIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one task ID is required',
      } as APIResponse, { status: 400 });
    }

    if (taskIds.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Cannot process more than 50 tasks at once',
      } as APIResponse, { status: 400 });
    }

    const dbService = new DatabaseService();
    let processedCount = 0;
    const errors: string[] = [];

    for (const taskId of taskIds) {
      try {
        // 验证任务存在且用户有权限
        const existingTask = await dbService.getTask(taskId, userId);
        if (!existingTask) {
          errors.push(`Task ${taskId} not found or access denied`);
          continue;
        }

        // 执行操作
        switch (action) {
          case 'delete':
            await dbService.deleteTask(taskId, userId);
            processedCount++;
            break;
          case 'cancel':
            if (existingTask.status === 'pending' || existingTask.status === 'processing') {
              await dbService.updateTask(taskId, { 
                status: 'failed',
                error_message: 'Cancelled by user',
                completed_at: new Date().toISOString(),
              });
              processedCount++;
            } else {
              errors.push(`Task ${taskId} cannot be cancelled (status: ${existingTask.status})`);
            }
            break;
          default:
            errors.push(`Unknown action: ${action}`);
        }
      } catch (error) {
        errors.push(`Failed to process task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        processedCount,
        totalCount: taskIds.length,
        errors,
      },
      message: `Processed ${processedCount} of ${taskIds.length} tasks${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    } as APIResponse, { status: errors.length === 0 ? 200 : 207 }); // 207 = Multi-Status

  } catch (error) {
    console.error('Batch operation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}