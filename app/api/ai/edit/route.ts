/**
 * AI图像编辑API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaAPIService } from '@/services/nanoBananaAPI';
import { DatabaseService } from '@/services/database';
import { R2StorageService } from '@/services/r2Storage';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, userId, inputImage, strength = 0.8, ...otherParams } = body;
    
    // 验证必需参数
    if (!prompt || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: prompt and userId',
      } as APIResponse, { status: 400 });
    }
    
    if (!inputImage) {
      return NextResponse.json({
        success: false,
        error: 'Input image is required for editing',
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
    const dbService = new DatabaseService();
    const nanoBananaService = new NanoBananaAPIService();
    const r2Service = new R2StorageService();

    console.log(`Starting image editing for user ${userId}`);
    console.log(`Prompt: "${prompt.substring(0, 100)}..."`);
    console.log(`Input image: ${inputImage.substring(0, 50)}...`);

    // 1. 创建任务记录
    const taskId = await dbService.createTask({
      user_id: userId,
      task_type: 'edit',
      status: 'pending',
      input_image_url: inputImage,
      input_prompt: prompt,
      input_params: {
        strength,
        ...otherParams,
      },
    });

    console.log(`Created task ${taskId}, calling AI API...`);

    // 2. 更新任务状态为处理中
    await dbService.updateTask(taskId, { status: 'processing' });
    
    const startTime = Date.now();

    try {
      // 3. 调用AI API进行图像编辑
      const aiResponse = await nanoBananaService.editImage({
        image_url: inputImage,
        prompt,
        strength,
      });

      console.log(`AI API responded successfully`);
      console.log(`AI task ID: ${aiResponse.taskId}`);

      // 4. 验证并存储编辑后的图片到R2
      if (!aiResponse.success || !aiResponse.imageUrls || aiResponse.imageUrls.length === 0) {
        throw new Error('AI编辑失败：没有生成图片');
      }

      const outputImageUrl = await r2Service.storeAIGeneratedImage(
        aiResponse.imageUrls[0], // 取第一张图片
        taskId,
        userId
      );

      console.log(`Edited image stored to R2: ${outputImageUrl}`);

      // 5. 计算处理时间并更新任务记录
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      await dbService.updateTask(taskId, {
        status: 'completed',
        output_image_url: outputImageUrl,
        nano_banana_task_id: aiResponse.taskId,
        processing_time: processingTime,
        completed_at: new Date().toISOString(),
      });

      console.log(`Task ${taskId} completed in ${processingTime}s`);

      // 6. 返回成功响应
      return NextResponse.json({
        success: true,
        data: {
          taskId,
          imageUrl: outputImageUrl,
          originalImageUrl: inputImage,
          processingTime,
        },
        message: 'Image edited successfully',
      } as APIResponse, { status: 200 });

    } catch (aiError) {
      console.error('AI API or storage error:', aiError);
      
      // 更新任务状态为失败
      await dbService.updateTask(taskId, {
        status: 'failed',
        error_message: aiError instanceof Error ? aiError.message : 'Unknown AI API error',
      });

      throw aiError;
    }

  } catch (error) {
    console.error('Edit image error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as APIResponse, { status: 500 });
  }
}





// 添加OPTIONS方法支持CORS（如果需要）
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