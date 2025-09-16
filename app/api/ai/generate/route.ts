/**
 * AI图像生成API路由 - 异步任务处理版本
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { DatabaseService } from '@/services/database';
import { R2StorageService } from '@/services/r2Storage';
import { APIResponse, TaskCreationResponse } from '@/types';

/**
 * 后台处理任务完成的异步函数
 */
async function processTaskInBackground(
  dbTaskId: string,
  nanoBananaTaskId: string,
  userId: string,
  dbService: DatabaseService,
  nanoBananaService: NanoBananaAPIService,
  r2Service: R2StorageService
) {
  try {
    console.log(`Background processing started for task ${dbTaskId} (Nano Banana: ${nanoBananaTaskId})`);

    // 等待Nano Banana任务完成
    const taskResult = await nanoBananaService.waitForTaskCompletion(nanoBananaTaskId, {
      maxAttempts: 120,    // 最多轮询2分钟
      intervalMs: 2000,    // 每2秒轮询一次
      timeoutMs: 300000    // 最多5分钟超时
    });

    if (taskResult.success && taskResult.imageUrls.length > 0) {
      console.log(`Task ${nanoBananaTaskId} completed, storing images...`);

      // 存储生成的图片到R2（支持多张图片）
      const storedUrls: string[] = [];

      for (let i = 0; i < taskResult.imageUrls.length; i++) {
        const imageUrl = taskResult.imageUrls[i];
        try {
          const storedUrl = await r2Service.storeAIGeneratedImage(
            imageUrl,
            `${dbTaskId}_${i}`,  // 为多张图片添加索引
            userId
          );
          storedUrls.push(storedUrl);
          console.log(`Image ${i + 1} stored to R2: ${storedUrl}`);
        } catch (storageError) {
          console.error(`Failed to store image ${i + 1}:`, storageError);
          // 继续处理其他图片，不让单张图片失败影响整个任务
        }
      }

      if (storedUrls.length > 0) {
        // 更新数据库任务为完成状态
        await dbService.updateTask(dbTaskId, {
          status: 'completed',
          output_image_url: storedUrls[0], // 第一张图片作为主要输出
          output_image_urls: storedUrls,   // 所有图片URL
          processing_time: taskResult.processingTime,
          completed_at: taskResult.completedAt,
        });

        console.log(`Task ${dbTaskId} completed successfully with ${storedUrls.length} images`);
      } else {
        throw new Error('Failed to store any generated images');
      }

    } else {
      throw new Error('Task completed but no images were generated');
    }

  } catch (error) {
    console.error(`Background task processing failed for ${dbTaskId}:`, error);

    // 更新数据库任务为失败状态
    await dbService.updateTask(dbTaskId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Background processing failed',
    });
  }
}

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

    try {
      // 1. 创建数据库任务记录
      const dbTaskId = await dbService.createTask({
        user_id: userId,
        task_type: 'generate',
        status: 'pending',
        input_prompt: prompt,
        input_params: otherParams,
      });

      console.log(`Created database task ${dbTaskId}`);

      // 2. 创建Nano Banana任务
      const nanoBananaTaskId = await nanoBananaService.createGenerateTask({
        prompt,
        width: otherParams.width,
        height: otherParams.height,
        steps: otherParams.steps,
        guidance_scale: otherParams.guidance_scale,
        seed: otherParams.seed,
        style: otherParams.style,
      });

      console.log(`Created Nano Banana task: ${nanoBananaTaskId}`);

      // 3. 更新数据库记录，保存AI任务ID
      await dbService.updateTask(dbTaskId, {
        status: 'processing',
        nano_banana_task_id: nanoBananaTaskId,
      });

      // 4. 立即返回任务ID，不等待完成
      const response: TaskCreationResponse = {
        success: true,
        taskId: dbTaskId,
        message: '任务已创建，正在处理中...',
        estimatedTime: 60, // 预估60秒
      };

      // 5. 异步处理任务完成（不阻塞响应）
      processTaskInBackground(dbTaskId, nanoBananaTaskId, userId, dbService, nanoBananaService, r2Service)
        .catch(error => {
          console.error(`Background task processing failed for task ${dbTaskId}:`, error);
        });

      return NextResponse.json({
        success: true,
        data: response,
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
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}