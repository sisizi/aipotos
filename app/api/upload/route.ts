/**
 * 文件上传API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/services/r2Storage';
import { uploadToR2 } from '@/lib/r2-simple'
import { APIResponse, FileUploadResponse } from '@/types';

/**
 * 处理文件上传的POST请求
 * @param {NextRequest} request - Next.js的请求对象，包含表单数据和文件信息
 * @returns {NextResponse} - 返回处理结果的响应对象
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求中获取表单数据
    const formData = await request.formData();
    // 获取上传的文件
    const file = formData.get('file') as File;
    // 获取用户ID
    const userId = formData.get('userId') as string;
    // 获取文件类型，默认为'general'
    const fileType = formData.get('type') as string || 'general'; // 'image', 'mask', 'general'

    // 验证必需参数
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      } as APIResponse, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
      } as APIResponse, { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Only image files are allowed',
      } as APIResponse, { status: 400 });
    }

    // 验证文件大小（10MB限制）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
      } as APIResponse, { status: 400 });
    }

    // 验证图片格式
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/gif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file format. Please upload JPEG, PNG, WebP, or GIF images.',
      } as APIResponse, { status: 400 });
    }

    // 记录上传文件的信息
    console.log(`Uploading file: ${file.name} (${file.size} bytes) for user ${userId}`);

    // 使用简化的R2上传方法进行测试
    const fileUrl = await uploadToR2(file);

    // 记录上传成功的信息
    console.log(`File uploaded successfully: ${fileUrl}`);

    // 构建响应数据
    const uploadResponse: FileUploadResponse = {
      url: fileUrl,
      key: fileUrl.split('/').pop() || file.name, // 从URL中提取文件名作为key
      size: file.size,
      contentType: file.type,
    };

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: uploadResponse,
      message: 'File uploaded successfully',
    } as APIResponse<FileUploadResponse>, { status: 200 });

  } catch (error) {
    // 记录错误信息
    console.error('Upload error:', error);
    
    // 返回错误响应
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    } as APIResponse, { status: 500 });
  }
}

// 获取上传限制信息
/**
 * 处理获取上传限制的GET请求
 * @param request - Next.js的NextRequest对象，包含请求相关信息
 * @returns 返回一个NextResponse对象，包含上传限制的JSON响应
 */
export async function GET(request: NextRequest) {
  try {
    // 定义上传限制的配置对象
    const limits = {
      maxFileSize: 10 * 1024 * 1024, // 10MB，最大文件大小限制
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'], // 允许的文件类型
      maxWidth: 4096, // 图片最大宽度限制
      maxHeight: 4096, // 图片最大高度限制
      supportedFormats: ['JPEG', 'PNG', 'WebP', 'GIF'], // 支持的图片格式
    };

    // 返回成功响应，包含上传限制信息
    return NextResponse.json({
      success: true,
      data: limits,
      message: 'Upload limits retrieved successfully',
    } as APIResponse, { status: 200 }); // 状态码200表示请求成功

  } catch (error) {
    // 捕获并记录错误
    console.error('Get upload limits error:', error);
    
    // 返回错误响应，包含错误信息
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get upload limits',
    } as APIResponse, { status: 500 }); // 状态码500表示服务器内部错误
  }
}

// 添加OPTIONS方法支持CORS（如果需要）
/**
 * 处理OPTIONS请求的函数，用于处理CORS（跨域资源共享）的预检请求
 * @param request - Next.js的NextRequest对象，表示传入的请求
 * @returns 返回一个NextResponse对象，包含CORS相关的响应头
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {  // 创建一个空的响应体
    status: 200,  // 设置响应状态码为200，表示成功
    headers: {  // 设置响应头，包含CORS相关的配置
      'Access-Control-Allow-Origin': '*',  // 允许任何来源的跨域请求
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',  // 允许的HTTP方法
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',  // 允许的请求头
    },
  });
}
