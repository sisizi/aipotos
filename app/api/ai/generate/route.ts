/**
 * AI图像生成API路由 - 异步任务处理版本
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { DatabaseService } from '@/services/database';
import { R2StorageService } from '@/services/r2Storage';
import { setTaskTimeout } from '@/lib/task-timeout';
import { APIResponse, TaskCreationResponse } from '@/types';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, userId, ...otherParams } = body;

    // 验证必需参数
    if (!prompt || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: prompt and userId',
      } as APIResponse, { status: 400 });
    }

    // 验证提示词（更新为5000字符限制）
    if (prompt.length > 5000) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is too long (max 5000 characters)',
      } as APIResponse, { status: 400 });
    }

    // 初始化服务
    const dbService = new DatabaseService();
    const nanoBananaService = new NanoBananaAPIService();
    const r2Service = new R2StorageService();

    console.log(`Starting async image generation for user ${userId}`);
    console.log(`Prompt: "${prompt.substring(0, 100)}..."`);

    const taskStartTime = Date.now();

    try {
      // 1. 快速创建数据库任务记录（只包含基本信息）
      const dbStartTime = Date.now();
      const dbTaskId = await dbService.createTask({
        user_id: userId,
        task_type: 'generate',
        status: 'pending',
        input_prompt: prompt,
        input_params: otherParams,
      });

      const dbEndTime = Date.now();
      console.log(`Created database task ${dbTaskId} in ${dbEndTime - dbStartTime}ms`);

      // 2. 创建 Nano Banana 任务
      const apiStartTime = Date.now();
      const nanoBananaTaskId = await nanoBananaService.createGenerateTask({
        prompt,
        width: otherParams.width,
        height: otherParams.height,
        steps: otherParams.steps,
        guidance_scale: otherParams.guidance_scale,
        seed: otherParams.seed,
        style: otherParams.style,
      });

      const apiEndTime = Date.now();
      console.log(`Created Nano Banana task: ${nanoBananaTaskId} in ${apiEndTime - apiStartTime}ms`);

      // 3. 更新数据库记录
      const updateStartTime = Date.now();
      console.log(`Updating task ${dbTaskId} with nano_banana_task_id: ${nanoBananaTaskId}`);
      await dbService.updateTask(dbTaskId, {
        status: 'processing',
        nano_banana_task_id: nanoBananaTaskId,
      });
      console.log(`Task ${dbTaskId} updated successfully with nano_banana_task_id`);

      const updateEndTime = Date.now();
      const totalTime = updateEndTime - taskStartTime;
      console.log(`Updated database in ${updateEndTime - updateStartTime}ms`);
      console.log(`🎯 Total task creation time: ${totalTime}ms`);

      // 任务已创建，等待 webhook 通知结果
      console.log(`Task ${dbTaskId} created successfully:`, {
        localTaskId: dbTaskId,
        nanoBananaTaskId: nanoBananaTaskId,
        status: 'processing',
        message: 'Waiting for webhook notification'
      });

      // 设置10分钟超时
      setTaskTimeout(dbTaskId);

      // 返回任务创建成功响应
      const quickResponse: TaskCreationResponse = {
        success: true,
        taskId: dbTaskId,
        message: '任务已创建，正在处理中，请稍候...',
        estimatedTime: 60,
      };

      return NextResponse.json({
        success: true,
        data: quickResponse,
        message: 'Image generation task created successfully',
      } as APIResponse, { status: 200 });

    } catch (error) {
      console.error('Task creation error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Generate image error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}

// 添加OPTIONS方法支持CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}