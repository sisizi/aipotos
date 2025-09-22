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

      // 2. 立即返回任务ID，让用户看到进度
      const quickResponse: TaskCreationResponse = {
        success: true,
        taskId: dbTaskId,
        message: '任务已创建，正在初始化...',
        estimatedTime: 60,
      };

      // 3. 异步创建Nano Banana任务（不阻塞响应）
      const asyncTaskCreation = async () => {
        try {
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

          // 4. 更新数据库记录
          const updateStartTime = Date.now();
          await dbService.updateTask(dbTaskId, {
            status: 'processing',
            nano_banana_task_id: nanoBananaTaskId,
          });

          const updateEndTime = Date.now();
          const totalTime = updateEndTime - taskStartTime;
          console.log(`Updated database in ${updateEndTime - updateStartTime}ms`);
          console.log(`🎯 Total task creation time: ${totalTime}ms`);

          // 5. 启动后台处理
          processTaskInBackground(dbTaskId, nanoBananaTaskId, userId, dbService, nanoBananaService, r2Service)
            .catch(error => {
              console.error(`Background task processing failed for task ${dbTaskId}:`, error);
            });

        } catch (error) {
          console.error('Async task creation failed:', error);

          // 提取错误信息
          let errorMessage = 'Task initialization failed';
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
            } else if (error.message.includes('E6716') || error.message.includes('unexpected error handling prediction')) {
              errorMessage = 'AI generation failed. This AI service primarily works with image editing. Please try uploading an image to edit instead.';
            }
          }

          // 更新任务状态为失败
          await dbService.updateTask(dbTaskId, {
            status: 'failed',
            error_message: errorMessage,
          });
        }
      };

      // 不等待异步创建完成就返回响应
      asyncTaskCreation();

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