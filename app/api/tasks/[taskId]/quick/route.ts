/**
 * 快速获取任务结果API - 用于获取缓存中的临时结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskResult } from '@/lib/task-cache';
import { APIResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID is required',
      } as APIResponse, { status: 400 });
    }

    // 从缓存获取任务结果
    const cachedResult = getTaskResult(taskId);

    if (!cachedResult) {
      return NextResponse.json({
        success: false,
        error: 'Task result not found in cache',
      } as APIResponse, { status: 200 }); // 改为200避免控制台错误
    }

    return NextResponse.json({
      success: true,
      data: {
        id: cachedResult.taskId,
        status: cachedResult.status,
        output_image_url: cachedResult.output_image_url,
        error_message: cachedResult.error_message,
        cached_at: new Date(cachedResult.timestamp).toISOString(),
        is_temporary: true, // 标识这是临时结果
      },
      message: 'Task result retrieved from cache',
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Quick task result error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}