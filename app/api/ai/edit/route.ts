/**
 * AI图像编辑API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { DatabaseService } from '@/services/database';
import { R2StorageService } from '@/services/r2Storage';
import { setTaskTimeout } from '@/lib/task-timeout';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  let taskId: string | undefined;
  const dbService = new DatabaseService();

  try {
    const body = await request.json();
    const { prompt, userId, inputImage, inputImages, strength = 0.8, ...otherParams } = body;

    // 验证必需参数
    if (!prompt || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: prompt and userId',
      } as APIResponse, { status: 400 });
    }

    // 支持单图和多图输入
    const imagesToProcess = inputImages || (inputImage ? [inputImage] : []);

    if (imagesToProcess.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one input image is required for editing',
      } as APIResponse, { status: 400 });
    }

    // 验证提示词
    if (prompt.length > 2000) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is too long (max 2000 characters)',
      } as APIResponse, { status: 400 });
    }

    // 初始化服务
    const nanoBananaService = new NanoBananaAPIService();
    const r2Service = new R2StorageService();

    console.log(`Starting image editing for user ${userId}`);
    console.log(`Prompt: "${prompt.substring(0, 100)}..."`);
    console.log(`Input images count: ${imagesToProcess.length}`);
    console.log(`First image: ${imagesToProcess[0].substring(0, 50)}...`);

    // 1. 创建任务记录
    taskId = await dbService.createTask({
      user_id: userId,
      task_type: 'edit',
      status: 'pending',
      input_image_url: imagesToProcess[0], // 主图片
      input_prompt: prompt,
      input_params: {
        strength,
        inputImages: imagesToProcess, // 保存所有输入图片
        imageCount: imagesToProcess.length,
        ...otherParams,
      },
    });

    console.log(`Created task ${taskId}, calling AI API...`);

    // 2. 创建 Nano Banana 编辑任务
    const startTime = Date.now();
    const nanoBananaTaskId = await nanoBananaService.createEditTask({
      image_urls: imagesToProcess,
      prompt,
      strength,
    });

    console.log(`Created Nano Banana edit task: ${nanoBananaTaskId}`);

    // 3. 更新数据库记录
    console.log(`Updating task ${taskId} with nano_banana_task_id: ${nanoBananaTaskId}`);
    await dbService.updateTask(taskId, {
      status: 'processing',
      nano_banana_task_id: nanoBananaTaskId,
    });
    console.log(`Task ${taskId} updated successfully with nano_banana_task_id`);

    // 设置10分钟超时
    setTaskTimeout(taskId);

    const processingTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`Task ${taskId} created in ${processingTime}s, waiting for webhook notification...`);

    // 4. 返回任务创建成功响应
    return NextResponse.json({
      success: true,
      data: {
        taskId,
        message: '任务已创建，正在处理中，请稍候...',
        processingTime,
      },
      message: 'Image editing task created successfully',
    } as APIResponse, { status: 200 });

  } catch (error) {
    console.error('Edit image error:', error);

    // 提取错误信息
    let errorMessage = 'Task creation failed';
    if (error instanceof Error) {
      errorMessage = error.message;

      // 如果是网络或API相关错误，提供更友好的错误信息
      if (error.message.includes('API service returned HTML')) {
        errorMessage = 'AI service is currently down for maintenance. Please try again in a few minutes.';
      } else if (error.message.includes('API service returned empty response')) {
        errorMessage = 'AI service connection timeout. Please try again.';
      } else if (error.message.includes('Invalid JSON response')) {
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('HTTP_')) {
        errorMessage = 'AI service is experiencing issues. Please try again later.';
      } else if (error.message.includes('MISSING_API_KEY')) {
        errorMessage = 'Service configuration error. Please contact support.';
      } else if (error.message.includes('Request timeout') || error.message.includes('timeout')) {
        errorMessage = 'AI service request timed out. Please try again.';
      }
    }

    // 如果任务已创建，更新任务状态为失败
    try {
      if (taskId) {
        await dbService.updateTask(taskId, {
          status: 'failed',
          error_message: errorMessage,
        });
      }
    } catch (updateError) {
      console.error('Failed to update task status:', updateError);
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
    } as APIResponse, { status: 500 });
  }
}





// 添加OPTIONS方法支持CORS（如果需要）
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