/**
 * 调试任务查询端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

    const dbService = new DatabaseService();

    // 获取最近的任务
    const { data: tasks, error } = await (dbService as any).supabaseAdmin
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // 过滤用户任务（如果提供了userId）
    const filteredTasks = userId ? tasks?.filter((task: any) => task.user_id === userId) : tasks;

    return NextResponse.json({
      success: true,
      data: {
        tasks: filteredTasks || [],
        count: filteredTasks?.length || 0,
        totalCount: tasks?.length || 0
      }
    });

  } catch (error) {
    console.error('Debug tasks query error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nanoBananaTaskId } = await request.json();

    if (!nanoBananaTaskId) {
      return NextResponse.json({
        success: false,
        error: 'nanoBananaTaskId is required'
      }, { status: 400 });
    }

    const dbService = new DatabaseService();
    const task = await dbService.getTaskByNanoBananaId(nanoBananaTaskId);

    return NextResponse.json({
      success: true,
      data: {
        found: !!task,
        task: task || null,
        nanoBananaTaskId
      }
    });

  } catch (error) {
    console.error('Debug task lookup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}